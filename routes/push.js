const express = require('express');
const { body, validationResult } = require('express-validator');
const PushSubscription = require('../models/PushSubscription');
const { authenticate, requireRoles } = require('../middleware/auth');
const { configureWebPush, sendTestNotification } = require('../services/pushNotifications');

const router = express.Router();
const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
router.use(authenticate, requireRoles('admin'));

router.get('/public-key', (_req, res) => {
  let config;
  try {
    config = configureWebPush();
  } catch {
    return res.status(503).json({ success: false, message: 'La configuración de notificaciones no es válida' });
  }
  if (!config) {
    return res.status(503).json({ success: false, message: 'Las notificaciones todavía no están configuradas' });
  }
  return res.json({ success: true, data: { publicKey: config.publicKey } });
});

router.post('/test', asyncHandler(async (req, res) => {
  const result = await sendTestNotification(req.user._id);
  if (result.skipped) {
    return res.status(503).json({ success: false, message: 'Las notificaciones todavía no están configuradas' });
  }
  if (result.sent === 0) {
    return res.status(422).json({
      success: false,
      message: result.expired > 0
        ? 'La suscripción de este dispositivo había vencido. Volvé a activar los avisos.'
        : result.failed > 0
          ? 'El proveedor Push rechazó el envío.'
          : 'No encontramos una suscripción para este dispositivo.',
      data: result
    });
  }
  return res.json({ success: true, data: result, message: 'Notificación de prueba enviada' });
}));

router.post('/subscriptions', [
  body('endpoint').isURL({ protocols: ['https'], require_protocol: true }).isLength({ max: 2048 }),
  body('keys.p256dh').isString().isLength({ min: 20, max: 512 }),
  body('keys.auth').isString().isLength({ min: 8, max: 256 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Suscripción Push inválida' });
  }

  const subscription = await PushSubscription.findOneAndUpdate(
    { endpoint: req.body.endpoint },
    {
      usuario: req.user._id,
      endpoint: req.body.endpoint,
      keys: req.body.keys,
      userAgent: (req.get('user-agent') || '').slice(0, 500)
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.status(201).json({ success: true, data: { id: subscription._id } });
}));

router.delete('/subscriptions', [
  body('endpoint').isURL({ protocols: ['https'], require_protocol: true }).isLength({ max: 2048 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Suscripción Push inválida' });
  }

  await PushSubscription.deleteOne({ usuario: req.user._id, endpoint: req.body.endpoint });
  return res.json({ success: true });
}));

module.exports = router;
