const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, header, param, validationResult } = require('express-validator');
const SolicitudIncorporacion = require('../models/SolicitudIncorporacion');
const { authenticate, requireRoles } = require('../middleware/auth');
const { isValidPhone, normalizePhone } = require('../utils/contact');
const { TIPOS_SOLICITUD, ESTADOS_SOLICITUD, buildOnboardingRequest } = require('../utils/onboarding');

const router = express.Router();
const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const publicLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Alcanzaste el límite temporal de solicitudes. Intentá nuevamente más tarde.' },
});

router.post('/', publicLimiter, [
  header('x-idempotency-key').trim().isLength({ min: 12, max: 100 }),
  body('tipo').isIn(TIPOS_SOLICITUD),
  body('nombre').trim().isLength({ min: 2, max: 100 }),
  body('telefono').customSanitizer(normalizePhone).custom(isValidPhone),
  body('email').optional({ values: 'falsy' }).isEmail().normalizeEmail(),
  body('localidad').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
  body('productosDescripcion').optional({ values: 'falsy' }).trim().isLength({ max: 1200 }),
  body('cantidadAproximada').optional({ values: 'falsy' }).isInt({ min: 1, max: 10000 }),
  body('experiencia').optional({ values: 'falsy' }).trim().isLength({ max: 800 }),
  body('mensaje').optional({ values: 'falsy' }).trim().isLength({ max: 1200 }),
  body('aceptaContacto').custom((value) => value === true),
  body('website').optional({ values: 'falsy' }).isEmpty(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Revisá los datos ingresados' });

  const idempotencyKey = req.get('x-idempotency-key');
  const existing = await SolicitudIncorporacion.findOne({ idempotencyKey }).select('_id');
  if (existing) return res.json({ success: true, data: { id: existing._id, duplicate: true }, message: 'Ya recibimos tu solicitud' });

  const payload = buildOnboardingRequest(req.body);
  const solicitud = await SolicitudIncorporacion.create({ ...payload, idempotencyKey });
  res.status(201).json({ success: true, data: { id: solicitud._id }, message: 'Recibimos tu solicitud. Nos comunicaremos para contarte los próximos pasos.' });
}));

router.use(authenticate, requireRoles('admin'));

router.get('/', asyncHandler(async (req, res) => {
  const filtro = req.query.estado && ESTADOS_SOLICITUD.includes(req.query.estado) ? { estado: req.query.estado } : {};
  const data = await SolicitudIncorporacion.find(filtro).populate('gestionadaPor', 'nombre email').sort({ createdAt: -1 }).limit(200).lean();
  res.json({ success: true, data });
}));

router.patch('/:id', [
  param('id').isMongoId(),
  body('estado').isIn(ESTADOS_SOLICITUD),
  body('notasAdmin').optional({ values: 'falsy' }).trim().isLength({ max: 1200 }),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Solicitud o estado inválido' });
  const solicitud = await SolicitudIncorporacion.findByIdAndUpdate(req.params.id, {
    estado: req.body.estado,
    notasAdmin: String(req.body.notasAdmin || '').trim(),
    gestionadaPor: req.user._id,
    gestionadaAt: new Date(),
  }, { new: true }).populate('gestionadaPor', 'nombre email');
  if (!solicitud) return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
  res.json({ success: true, data: solicitud, message: 'Solicitud actualizada' });
}));

module.exports = router;
