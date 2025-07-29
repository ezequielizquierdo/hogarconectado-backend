const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

// GET /api/productos - Obtener todos los productos con filtros
router.get('/', async (req, res) => {
  try {
    const {
      categoria,
      marca,
      disponible = 'true',
      limite = 50,
      pagina = 1,
      buscar
    } = req.query;

    // Construir filtros
    const filtros = { activo: true };
    
    if (categoria) filtros.categoria = categoria;
    if (marca) filtros.marca = new RegExp(marca, 'i');
    if (disponible === 'true') filtros['stock.disponible'] = true;

    // Configurar paginación
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    let query = Producto.find(filtros)
      .populate('categoria', 'nombre icono')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limite));

    // Búsqueda por texto si se proporciona
    if (buscar) {
      query = Producto.find({
        ...filtros,
        $text: { $search: buscar }
      }, { score: { $meta: 'textScore' } })
        .populate('categoria', 'nombre icono')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(parseInt(limite));
    }

    const productos = await query;
    const total = await Producto.countDocuments(filtros);

    res.json({
      success: true,
      data: productos,
      pagination: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total,
        paginas: Math.ceil(total / parseInt(limite))
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

// GET /api/productos/:id - Obtener un producto por ID
router.get('/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate('categoria', 'nombre descripcion icono');
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Agregar precios calculados
    const precios = producto.calcularCuotas();

    res.json({
      success: true,
      data: {
        ...producto.toObject(),
        precios
      }
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
router.post('/', [
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
    .withMessage('El precio base debe ser un número positivo')
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

    const { categoria, marca, modelo, precioBase, descripcion, especificaciones, tags } = req.body;

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
      descripcion,
      especificaciones,
      tags: tags || []
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
router.put('/:id', [
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
    .withMessage('El precio base debe ser un número positivo')
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

    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('categoria', 'nombre icono');

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

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
router.delete('/:id', async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

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
router.get('/:id/cotizar', async (req, res) => {
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
          ganancia: process.env.GANANCIA_DEFAULT || 0.30,
          factor3Cuotas: process.env.FACTOR_3_CUOTAS || 1.1298,
          factor6Cuotas: process.env.FACTOR_6_CUOTAS || 1.2138
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
