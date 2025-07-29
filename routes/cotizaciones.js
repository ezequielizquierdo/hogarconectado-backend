const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Cotizacion = require('../models/Cotizacion');
const Producto = require('../models/Producto');

// POST /api/cotizaciones - Crear nueva cotización
router.post('/', [
  body('datosContacto.nombre')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('datosContacto.telefono')
    .trim()
    .isLength({ min: 8, max: 20 })
    .withMessage('El teléfono debe tener entre 8 y 20 caracteres'),
  body('productos')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un producto'),
  body('productos.*.producto')
    .isMongoId()
    .withMessage('ID de producto inválido'),
  body('productos.*.cantidad')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser un número entero positivo')
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

    const { datosContacto, productos, modalidadPago, observaciones } = req.body;

    // Verificar que todos los productos existen
    const productosIds = productos.map(p => p.producto);
    const productosEncontrados = await Producto.find({ 
      _id: { $in: productosIds },
      activo: true 
    }).populate('categoria', 'nombre');

    if (productosEncontrados.length !== productosIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Uno o más productos no existen o no están disponibles'
      });
    }

    // Crear cotización
    const nuevaCotizacion = new Cotizacion({
      datosContacto,
      productos: productos.map(item => {
        const producto = productosEncontrados.find(p => p._id.toString() === item.producto);
        const precios = producto.calcularCuotas();
        
        return {
          producto: item.producto,
          cantidad: item.cantidad,
          detalles: {
            categoria: producto.categoria.nombre,
            marca: producto.marca,
            modelo: producto.modelo,
            precioBase: producto.precioBase,
            precios: precios
          }
        };
      }),
      modalidadPago: modalidadPago || 'contado',
      observaciones
    });

    // Calcular totales
    nuevaCotizacion.calcularTotales();

    await nuevaCotizacion.save();

    res.status(201).json({
      success: true,
      message: 'Cotización creada exitosamente',
      data: nuevaCotizacion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear cotización',
      error: error.message
    });
  }
});

// GET /api/cotizaciones - Obtener todas las cotizaciones
router.get('/', async (req, res) => {
  try {
    const {
      estado = 'todas',
      fechaDesde,
      fechaHasta,
      limite = 20,
      pagina = 1,
      buscar
    } = req.query;

    // Construir filtros
    const filtros = {};
    
    if (estado !== 'todas') {
      filtros.estado = estado;
    }

    if (fechaDesde || fechaHasta) {
      filtros.createdAt = {};
      if (fechaDesde) filtros.createdAt.$gte = new Date(fechaDesde);
      if (fechaHasta) filtros.createdAt.$lte = new Date(fechaHasta);
    }

    // Búsqueda por nombre o teléfono
    if (buscar) {
      filtros.$or = [
        { 'datosContacto.nombre': new RegExp(buscar, 'i') },
        { 'datosContacto.telefono': new RegExp(buscar, 'i') }
      ];
    }

    // Configurar paginación
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    const cotizaciones = await Cotizacion.find(filtros)
      .populate('productos.producto', 'marca modelo categoria')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limite));

    const total = await Cotizacion.countDocuments(filtros);

    res.json({
      success: true,
      data: cotizaciones,
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
      message: 'Error al obtener cotizaciones',
      error: error.message
    });
  }
});

// GET /api/cotizaciones/:id - Obtener una cotización por ID
router.get('/:id', async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id)
      .populate('productos.producto', 'marca modelo categoria descripcion');
    
    if (!cotizacion) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    res.json({
      success: true,
      data: cotizacion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener cotización',
      error: error.message
    });
  }
});

// PUT /api/cotizaciones/:id/estado - Actualizar estado de cotización
router.put('/:id/estado', [
  body('estado')
    .isIn(['pendiente', 'enviada', 'confirmada', 'cancelada'])
    .withMessage('Estado inválido')
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

    const { estado } = req.body;

    const cotizacion = await Cotizacion.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    );

    if (!cotizacion) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: cotizacion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado',
      error: error.message
    });
  }
});

// GET /api/cotizaciones/:id/mensaje - Generar mensaje de WhatsApp
router.get('/:id/mensaje', async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id)
      .populate('productos.producto', 'marca modelo categoria');
    
    if (!cotizacion) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    const mensaje = cotizacion.generarMensajeWhatsApp();

    res.json({
      success: true,
      data: {
        mensaje,
        telefono: cotizacion.datosContacto.telefono,
        urlWhatsApp: `https://wa.me/${cotizacion.datosContacto.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar mensaje',
      error: error.message
    });
  }
});

// DELETE /api/cotizaciones/:id - Eliminar cotización
router.delete('/:id', async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findByIdAndDelete(req.params.id);

    if (!cotizacion) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Cotización eliminada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cotización',
      error: error.message
    });
  }
});

// GET /api/cotizaciones/estadisticas/resumen - Obtener estadísticas básicas
router.get('/estadisticas/resumen', async (req, res) => {
  try {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));

    const [totalCotizaciones, cotizacionesHoy, cotizacionesSemana, cotizacionesMes] = await Promise.all([
      Cotizacion.countDocuments(),
      Cotizacion.countDocuments({ 
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Cotizacion.countDocuments({ 
        createdAt: { $gte: inicioSemana }
      }),
      Cotizacion.countDocuments({ 
        createdAt: { $gte: inicioMes }
      })
    ]);

    // Estadísticas por estado
    const porEstado = await Cotizacion.aggregate([
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total: totalCotizaciones,
        hoy: cotizacionesHoy,
        semana: cotizacionesSemana,
        mes: cotizacionesMes,
        porEstado: porEstado.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

module.exports = router;
