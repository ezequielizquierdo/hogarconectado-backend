const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, header, param, validationResult } = require('express-validator');
const Consulta = require('../models/Consulta');
const Producto = require('../models/Producto');
const { authenticate, requireRoles } = require('../middleware/auth');
const { isValidPhone, normalizeContactName, normalizePhone } = require('../utils/contact');
const { CONSULTA_ESTADOS, buildConsultaStateUpdate } = require('../utils/consultaState');
const { notifyAdminsNewInquiry } = require('../services/pushNotifications');

const router = express.Router();
const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const publicInquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Alcanzaste el límite temporal de consultas. Intentá nuevamente más tarde.' }
});

const createValidators = [
  header('x-idempotency-key').trim().isLength({ min: 12, max: 100 }),
  body('productoId').isMongoId(),
  body('nombre').customSanitizer(normalizeContactName).isLength({ min: 2, max: 100 }),
  body('telefono').customSanitizer(normalizePhone).custom(isValidPhone),
  body('website').optional({ values: 'falsy' }).isEmpty()
];

router.post('/', publicInquiryLimiter, createValidators, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Revisá el nombre y el teléfono ingresados'
      });
    }

    const idempotencyKey = req.get('x-idempotency-key');
    const existing = await Consulta.findOne({ idempotencyKey }).select('_id');
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Recibimos tu consulta. Te contactaremos a la brevedad.',
        data: { id: existing._id, duplicate: true }
      });
    }

    const producto = await Producto.findOne({ _id: req.body.productoId, activo: true })
      .populate('categoria', 'nombre');
    if (!producto) {
      return res.status(404).json({ success: false, message: 'El producto ya no está disponible' });
    }

    const consulta = await Consulta.create({
      producto: producto._id,
      productoSnapshot: {
        categoria: producto.categoria?.nombre,
        marca: producto.marca,
        modelo: producto.modelo,
        descripcion: producto.descripcion,
        imagen: producto.imagenes?.[0],
        precioContado: producto.precioConGanancia
      },
      contacto: {
        nombre: req.body.nombre,
        telefono: req.body.telefono
      },
      historialEstados: [{ estado: 'nueva' }],
      idempotencyKey
    });

    void notifyAdminsNewInquiry(consulta).then(result => {
      if (result.failed > 0) console.warn(`Web Push: ${result.failed} envío(s) rechazado(s) por el proveedor`);
    }).catch(() => undefined);

    return res.status(201).json({
      success: true,
      message: 'Recibimos tu consulta. Te contactaremos a la brevedad.',
      data: { id: consulta._id }
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(200).json({
        success: true,
        message: 'Recibimos tu consulta. Te contactaremos a la brevedad.'
      });
    }
    return res.status(500).json({ success: false, message: 'No pudimos registrar la consulta' });
  }
});

router.use(authenticate, requireRoles('admin'));

router.get('/resumen', asyncHandler(async (_req, res) => {
  const [nuevas, totalAbiertas] = await Promise.all([
    Consulta.countDocuments({ estado: 'nueva' }),
    Consulta.countDocuments({ estado: { $in: ['nueva', 'en-gestion'] } })
  ]);

  res.json({ success: true, data: { nuevas, totalAbiertas } });
}));

router.get('/', asyncHandler(async (req, res) => {
  const pagina = Math.max(1, Number.parseInt(req.query.pagina, 10) || 1);
  const limite = Math.min(100, Math.max(1, Number.parseInt(req.query.limite, 10) || 30));
  const filtros = {};

  if (req.query.estado) {
    if (!CONSULTA_ESTADOS.includes(req.query.estado)) {
      return res.status(400).json({ success: false, message: 'Estado de consulta inválido' });
    }
    filtros.estado = req.query.estado;
  }

  const [data, total] = await Promise.all([
    Consulta.find(filtros)
      .populate('asignadaA', 'nombre email')
      .sort({ createdAt: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite)
      .lean(),
    Consulta.countDocuments(filtros)
  ]);

  res.json({
    success: true,
    data,
    pagination: { pagina, limite, total, paginas: Math.ceil(total / limite) }
  });
}));

router.patch('/:id/estado', [
  param('id').isMongoId(),
  body('estado').isIn(CONSULTA_ESTADOS)
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Consulta o estado inválido' });
  }

  const consulta = await Consulta.findById(req.params.id);
  if (!consulta) {
    return res.status(404).json({ success: false, message: 'Consulta no encontrada' });
  }

  if (consulta.asignadaA && consulta.asignadaA.toString() !== req.user._id.toString()) {
    return res.status(409).json({
      success: false,
      message: 'Otro administrador ya está gestionando esta consulta'
    });
  }

  const estado = req.body.estado;
  Object.assign(consulta, buildConsultaStateUpdate({
    estado,
    consulta,
    usuarioId: req.user._id
  }));
  consulta.historialEstados.push({ estado, cambiadoPor: req.user._id });
  await consulta.save();
  await consulta.populate('asignadaA', 'nombre email');

  res.json({ success: true, data: consulta, message: 'Estado actualizado' });
}));

module.exports = router;
