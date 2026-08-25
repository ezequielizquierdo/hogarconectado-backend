const express = require('express');
const { body, validationResult } = require('express-validator');
const Cotizacion = require('../models/Cotizacion');
const Producto = require('../models/Producto');
const { canAccessOwnedResource, requireRoles } = require('../middleware/auth');
const { calculatePrices, getPricingConfig } = require('../utils/pricing');

const router = express.Router();

const validators = [
  body('datosContacto.nombre').trim().isLength({ min: 2, max: 100 }),
  body('datosContacto.telefono').trim().isLength({ min: 8, max: 20 }),
  body('productos').isArray({ min: 1 }),
  body('productos.*.producto').isMongoId(),
  body('productos.*.cantidad').isInt({ min: 1 }),
  body('productos.*.porcentajeAplicado').optional().isFloat({ min: 0, max: 100 }),
  body('modalidadPago').optional().isIn(['contado', '3-cuotas', '6-cuotas'])
];

async function findAuthorized(req, res) {
  const cotizacion = await Cotizacion.findById(req.params.id);
  if (!cotizacion) {
    res.status(404).json({ success: false, message: 'Cotización no encontrada' });
    return null;
  }
  if (!canAccessOwnedResource(cotizacion.creadaPor, req.user)) {
    res.status(403).json({ success: false, message: 'No tenés acceso a esta cotización' });
    return null;
  }
  return cotizacion;
}

router.post('/', validators, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
    }

    const { datosContacto, productos, modalidadPago, observaciones } = req.body;
    const productosIds = productos.map(item => item.producto);
    const encontrados = await Producto.find({ _id: { $in: productosIds }, activo: true })
      .populate('categoria', 'nombre');
    if (encontrados.length !== new Set(productosIds).size) {
      return res.status(400).json({ success: false, message: 'Uno o más productos no existen o no están disponibles' });
    }

    const cotizacion = new Cotizacion({
      datosContacto,
      modalidadPago: modalidadPago || 'contado',
      observaciones,
      creadaPor: req.user._id,
      productos: productos.map(item => {
        const producto = encontrados.find(found => found._id.toString() === item.producto);
        const config = getPricingConfig(process.env);
        const porcentajeAplicado = item.porcentajeAplicado ?? config.ganancia * 100;
        const precios = calculatePrices(producto.precioBase, {
          ...config,
          ganancia: porcentajeAplicado / 100
        });
        return {
          producto: producto._id,
          cantidad: item.cantidad,
          detalles: {
            categoria: producto.categoria.nombre,
            marca: producto.marca,
            modelo: producto.modelo,
            precioBase: producto.precioBase,
            porcentajeAplicado,
            precios
          }
        };
      })
    });
    cotizacion.calcularTotales();
    await cotizacion.save();
    res.status(201).json({ success: true, message: 'Cotización creada exitosamente', data: cotizacion });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear cotización' });
  }
});

router.get('/estadisticas/resumen', requireRoles('editor', 'admin'), async (req, res) => {
  try {
    const hoy = new Date();
    const inicioDia = new Date(hoy); inicioDia.setHours(0, 0, 0, 0);
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioSemana = new Date(inicioDia); inicioSemana.setDate(inicioDia.getDate() - inicioDia.getDay());
    const [total, dia, semana, mes, porEstado] = await Promise.all([
      Cotizacion.countDocuments(),
      Cotizacion.countDocuments({ createdAt: { $gte: inicioDia } }),
      Cotizacion.countDocuments({ createdAt: { $gte: inicioSemana } }),
      Cotizacion.countDocuments({ createdAt: { $gte: inicioMes } }),
      Cotizacion.aggregate([{ $group: { _id: '$estado', count: { $sum: 1 } } }])
    ]);
    res.json({ success: true, data: {
      total, hoy: dia, semana, mes,
      porEstado: Object.fromEntries(porEstado.map(item => [item._id, item.count]))
    } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
});

router.get('/', async (req, res) => {
  try {
    const limite = Math.max(1, Math.min(Number.parseInt(req.query.limite) || 20, 100));
    const pagina = Math.max(1, Number.parseInt(req.query.pagina) || 1);
    const filtros = req.user.rol === 'consulta' ? { creadaPor: req.user._id } : {};
    if (req.query.estado && req.query.estado !== 'todas') filtros.estado = req.query.estado;
    if (req.query.fechaDesde || req.query.fechaHasta) {
      filtros.createdAt = {};
      if (req.query.fechaDesde) filtros.createdAt.$gte = new Date(req.query.fechaDesde);
      if (req.query.fechaHasta) filtros.createdAt.$lte = new Date(req.query.fechaHasta);
    }
    if (req.query.buscar) {
      filtros.$or = [
        { 'datosContacto.nombre': new RegExp(req.query.buscar, 'i') },
        { 'datosContacto.telefono': new RegExp(req.query.buscar, 'i') }
      ];
    }

    const [data, total] = await Promise.all([
      Cotizacion.find(filtros)
        .populate('productos.producto', 'marca modelo categoria')
        .populate('creadaPor', 'nombre email')
        .sort({ createdAt: -1 }).skip((pagina - 1) * limite).limit(limite),
      Cotizacion.countDocuments(filtros)
    ]);
    res.json({ success: true, data, pagination: { pagina, limite, total, paginas: Math.ceil(total / limite) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener cotizaciones' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const cotizacion = await findAuthorized(req, res);
    if (!cotizacion) return;
    await cotizacion.populate('productos.producto', 'marca modelo categoria descripcion');
    res.json({ success: true, data: cotizacion });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener cotización' });
  }
});

router.put('/:id/estado', [body('estado').isIn(['pendiente', 'enviada', 'confirmada', 'cancelada'])], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const cotizacion = await findAuthorized(req, res);
    if (!cotizacion) return;
    cotizacion.estado = req.body.estado;
    await cotizacion.save();
    res.json({ success: true, data: cotizacion, message: 'Estado actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar estado' });
  }
});

router.get('/:id/mensaje', async (req, res) => {
  try {
    const cotizacion = await findAuthorized(req, res);
    if (!cotizacion) return;
    const mensaje = cotizacion.generarMensajeWhatsApp();
    res.json({ success: true, data: {
      mensaje,
      telefono: cotizacion.datosContacto.telefono,
      urlWhatsApp: `https://wa.me/${cotizacion.datosContacto.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
    } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al generar mensaje' });
  }
});

router.delete('/:id', requireRoles('admin'), async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findByIdAndDelete(req.params.id);
    if (!cotizacion) return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
    res.json({ success: true, message: 'Cotización eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar cotización' });
  }
});

module.exports = router;
