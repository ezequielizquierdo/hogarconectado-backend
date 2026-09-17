const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Producto = require('../models/Producto');
const ProductoPrecioHistorial = require('../models/ProductoPrecioHistorial');
const { getPricingConfig } = require('../utils/pricing');
const Categoria = require('../models/Categoria');
const { authenticate, optionalAuthenticate, requireRoles } = require('../middleware/auth');
const { deleteAssets } = require('../services/imageStorage');
const { serializeAuthenticatedProduct, serializePublicProduct, serializeSellerProduct } = require('../utils/publicProduct');
const { buildProductSearchFilter } = require('../utils/productSearch');

// GET /api/productos - Obtener todos los productos con filtros y paginación
router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const {
      categoria,
      marca,
      tipoComercializacion,
      disponible = 'true',
      limite = 20, // Límite más conservador para mejor rendimiento
      pagina = 1,
      buscar,
      ordenar = 'recientes' // nuevo parámetro de ordenamiento
    } = req.query;

    // Validar parámetros de paginación
    const limiteParsed = Math.max(1, Math.min(parseInt(limite) || 20, 100)); // Max 100 por página
    const paginaParsed = Math.max(1, parseInt(pagina) || 1);

    // Construir filtros
    const filtros = { activo: true };
    
    if (categoria) filtros.categoria = categoria;
    if (marca) filtros.marca = new RegExp(marca, 'i');
    if (tipoComercializacion === 'stock-propio') {
      filtros.$or = [
        { tipoComercializacion: 'stock-propio' },
        { tipoComercializacion: { $exists: false } }
      ];
    } else if (tipoComercializacion) {
      filtros.tipoComercializacion = tipoComercializacion;
    }
    
    // Temporalmente removido el filtro de stock para debugging
    // if (disponible === 'true') {
    //   filtros.$or = [
    //     { 'stock.disponible': true },
    //     { 'stock.disponible': { $exists: false } } // Para productos sin stock definido
    //   ];
    // }

    // Configurar paginación
    const skip = (paginaParsed - 1) * limiteParsed;

    // Configurar ordenamiento
    let sortOptions = { createdAt: -1 }; // Por defecto: más recientes
    switch (ordenar) {
      case 'alfabetico':
        sortOptions = { marca: 1, modelo: 1 };
        break;
      case 'precio-asc':
        sortOptions = { precioBase: 1 };
        break;
      case 'precio-desc':
        sortOptions = { precioBase: -1 };
        break;
      case 'categoria':
        sortOptions = { 'categoria.nombre': 1, marca: 1 };
        break;
      case 'recientes':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    const searchFilter = buscar ? buildProductSearchFilter(buscar) : null;
    const filtrosFinales = searchFilter ? { ...filtros, ...searchFilter } : filtros;

    let query = Producto.find(filtrosFinales)
      .populate('categoria', 'nombre icono')
      .sort(sortOptions)
      .skip(skip)
      .limit(limiteParsed);

    // La lista y el total son independientes. Resolverlos en paralelo reduce el
    // tiempo del primer catálogo, especialmente cuando Render acaba de iniciar.
    const [productos, total] = await Promise.all([
      query,
      Producto.countDocuments(filtrosFinales)
    ]);
    
    const totalPaginas = Math.ceil(total / limiteParsed);
    const tienePaginaAnterior = paginaParsed > 1;
    const tienePaginaSiguiente = paginaParsed < totalPaginas;

    res.json({
      success: true,
      data: req.user && ['admin', 'editor'].includes(req.user.rol)
        ? productos.map(serializeAuthenticatedProduct)
        : req.user?.rol === 'vendedor'
          ? productos.map(serializeSellerProduct)
          : productos.map(serializePublicProduct),
      pagination: {
        pagina: paginaParsed,
        limite: limiteParsed,
        total,
        totalPaginas,
        tienePaginaAnterior,
        tienePaginaSiguiente,
        paginaAnterior: tienePaginaAnterior ? paginaParsed - 1 : null,
        paginaSiguiente: tienePaginaSiguiente ? paginaParsed + 1 : null,
        desde: skip + 1,
        hasta: Math.min(skip + limiteParsed, total)
      },
      filtros: {
        categoria,
        marca,
        tipoComercializacion,
        disponible,
        buscar,
        ordenar
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    });
  }
});

// GET /api/productos/marcas - Opciones livianas para los filtros del catálogo
router.get('/marcas', optionalAuthenticate, async (req, res) => {
  try {
    const marcas = await Producto.distinct('marca', { activo: true });
    res.json({
      success: true,
      data: marcas.filter(Boolean).sort((a, b) => a.localeCompare(b, 'es'))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener marcas'
    });
  }
});

// GET /api/productos/:id - Obtener un producto por ID
router.get('/:id', optionalAuthenticate, async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate('categoria', 'nombre descripcion icono');
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    if (!req.user) {
      return res.json({ success: true, data: serializePublicProduct(producto) });
    }
    return res.json({
      success: true,
      data: ['admin', 'editor'].includes(req.user.rol)
        ? serializeAuthenticatedProduct(producto)
        : req.user.rol === 'vendedor'
          ? serializeSellerProduct(producto)
          : serializePublicProduct(producto)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error.message
    });
  }
});

// POST /api/productos - Crear nuevo producto
router.post('/', authenticate, requireRoles('editor', 'admin'), [
  body('categoria')
    .isMongoId()
    .withMessage('ID de categoría inválido'),
  body('marca')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('La marca debe tener entre 1 y 100 caracteres'),
  body('modelo')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('El modelo debe tener entre 1 y 200 caracteres'),
  body('precioBase')
    .isFloat({ min: 0 })
    .withMessage('El precio base debe ser un número positivo'),
  body('porcentajeGanancia')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('El porcentaje de ganancia debe estar entre 0 y 100'),
  body('descuento.activo').optional().isBoolean(),
  body('descuento.porcentaje').optional().isFloat({ min: 0, max: 90 }),
  body('descuento.desde').optional({ nullable: true }).isISO8601().toDate(),
  body('descuento.hasta').optional({ nullable: true }).isISO8601().toDate(),
  body('tipoComercializacion')
    .optional()
    .isIn(['stock-propio', 'producto-tercero', 'venta-catalogo'])
    .withMessage('Tipo de comercialización inválido'),
  body('catalogo.nombre').optional().trim().isLength({ min: 1, max: 100 }),
  body('catalogo.campania').optional().trim().isLength({ min: 1, max: 100 }),
  body('catalogo.vigenciaHasta').optional({ nullable: true }).isISO8601().toDate(),
  body('catalogo.plazoEntrega').optional().trim().isLength({ min: 1, max: 120 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const { categoria, marca, modelo, precioBase, porcentajeGanancia, descuento, tipoComercializacion, catalogo, descripcion, especificaciones, tags, imagenes, imagenPublicIds, stock, activo } = req.body;

    if (descuento?.desde && descuento?.hasta && descuento.desde > descuento.hasta) {
      return res.status(400).json({ success: false, message: 'La fecha final del descuento debe ser posterior a la inicial' });
    }

    if (tipoComercializacion === 'venta-catalogo' && !catalogo?.nombre?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del catálogo es requerido para una venta por catálogo'
      });
    }

    // Verificar que la categoría existe
    const categoriaExiste = await Categoria.findById(categoria);
    if (!categoriaExiste) {
      return res.status(400).json({
        success: false,
        message: 'La categoría especificada no existe'
      });
    }

    const nuevoProducto = new Producto({
      categoria,
      marca,
      modelo,
      precioBase,
      porcentajeGanancia,
      descuento,
      tipoComercializacion,
      catalogo: tipoComercializacion === 'venta-catalogo' ? catalogo : undefined,
      descripcion,
      especificaciones,
      tags: tags || [],
      imagenes: imagenes || [],
      imagenPublicIds: imagenPublicIds || [],
      stock,
      activo
    });

    await nuevoProducto.save();

    // Poblar la categoría en la respuesta
    await nuevoProducto.populate('categoria', 'nombre icono');

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: nuevoProducto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message
    });
  }
});

// PUT /api/productos/:id - Actualizar producto
router.put('/:id', authenticate, requireRoles('editor', 'admin'), [
  body('categoria')
    .optional()
    .isMongoId()
    .withMessage('ID de categoría inválido'),
  body('marca')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('La marca debe tener entre 1 y 100 caracteres'),
  body('modelo')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('El modelo debe tener entre 1 y 200 caracteres'),
  body('precioBase')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio base debe ser un número positivo'),
  body('porcentajeGanancia')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('El porcentaje de ganancia debe estar entre 0 y 100'),
  body('descuento.activo').optional().isBoolean(),
  body('descuento.porcentaje').optional().isFloat({ min: 0, max: 90 }),
  body('descuento.desde').optional({ nullable: true }).isISO8601().toDate(),
  body('descuento.hasta').optional({ nullable: true }).isISO8601().toDate(),
  body('tipoComercializacion')
    .optional()
    .isIn(['stock-propio', 'producto-tercero', 'venta-catalogo'])
    .withMessage('Tipo de comercialización inválido'),
  body('catalogo.nombre').optional().trim().isLength({ min: 1, max: 100 }),
  body('catalogo.campania').optional().trim().isLength({ min: 1, max: 100 }),
  body('catalogo.vigenciaHasta').optional({ nullable: true }).isISO8601().toDate(),
  body('catalogo.plazoEntrega').optional().trim().isLength({ min: 1, max: 120 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const productoAnterior = await Producto.findById(req.params.id);
    if (!productoAnterior) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    const descuentoResultante = { ...(productoAnterior.descuento?.toObject?.() || {}), ...(req.body.descuento || {}) };
    if (descuentoResultante.desde && descuentoResultante.hasta && descuentoResultante.desde > descuentoResultante.hasta) {
      return res.status(400).json({ success: false, message: 'La fecha final del descuento debe ser posterior a la inicial' });
    }

    const tipoResultante = req.body.tipoComercializacion || productoAnterior.tipoComercializacion || 'stock-propio';
    const catalogoAnterior = productoAnterior.catalogo?.toObject?.() || productoAnterior.catalogo || {};
    const catalogoResultante = { ...catalogoAnterior, ...(req.body.catalogo || {}) };
    if (tipoResultante === 'venta-catalogo' && !catalogoResultante?.nombre?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del catálogo es requerido para una venta por catálogo'
      });
    }

    const cambios = { ...req.body };
    const actualizacion = tipoResultante === 'venta-catalogo'
      ? { $set: { ...cambios, catalogo: catalogoResultante } }
      : { $set: cambios, $unset: { catalogo: 1 } };

    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      actualizacion,
      { new: true, runValidators: true }
    ).populate('categoria', 'nombre icono');

    if (req.body.precioBase !== undefined && Number(req.body.precioBase) !== Number(productoAnterior.precioBase)) {
      await ProductoPrecioHistorial.create({
        producto: producto._id,
        precioAnterior: productoAnterior.precioBase,
        precioNuevo: producto.precioBase,
        cambiadoPor: req.user._id,
        origen: 'edicion-manual'
      });
    }

    const idsActuales = new Set(req.body.imagenPublicIds || productoAnterior.imagenPublicIds || []);
    const idsRemovidos = (productoAnterior.imagenPublicIds || []).filter(id => !idsActuales.has(id));
    await deleteAssets(idsRemovidos);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: producto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
});

// DELETE /api/productos/:id - Eliminar producto (soft delete)
router.delete('/:id', authenticate, requireRoles('admin'), async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    await deleteAssets(producto.imagenPublicIds);
    producto.activo = false;
    producto.imagenes = [];
    producto.imagenPublicIds = [];
    await producto.save();

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
});

// GET /api/productos/:id/cotizar - Obtener cotización de un producto
router.get('/:id/cotizar', authenticate, requireRoles('editor', 'admin'), async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate('categoria', 'nombre');
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const precios = producto.calcularCuotas();

    res.json({
      success: true,
      data: {
        producto: {
          id: producto._id,
          categoria: producto.categoria.nombre,
          marca: producto.marca,
          modelo: producto.modelo,
          descripcion: producto.descripcion,
          precioBase: producto.precioBase
        },
        precios,
        factores: {
          ...getPricingConfig(process.env)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar cotización',
      error: error.message
    });
  }
});

module.exports = router;
