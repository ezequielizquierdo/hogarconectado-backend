const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const Usuario = require('../models/Usuario');

function getPushConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) return null;
  return { publicKey, privateKey, subject };
}

function configureWebPush() {
  const config = getPushConfig();
  if (!config) return null;
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return config;
}

async function sendToSubscriptions(subscriptions, payload) {
  const result = { sent: 0, expired: 0, failed: 0, providerStatusCodes: [] };

  await Promise.all(subscriptions.map(async subscription => {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: subscription.keys
      }, JSON.stringify(payload));
      subscription.ultimoEnvio = new Date();
      await subscription.save();
      result.sent += 1;
    } catch (error) {
      const statusCode = Number(error?.statusCode) || 0;
      if (statusCode && !result.providerStatusCodes.includes(statusCode)) {
        result.providerStatusCodes.push(statusCode);
      }
      if ([404, 410].includes(statusCode)) {
        await PushSubscription.deleteOne({ _id: subscription._id });
        result.expired += 1;
      } else {
        result.failed += 1;
      }
    }
  }));

  return result;
}

async function notifyAdminsNewInquiry(consulta) {
  if (!configureWebPush()) return { sent: 0, skipped: true };

  const admins = await Usuario.find({ rol: 'admin', estado: 'activo' }).select('_id').lean();
  if (!admins.length) return { sent: 0 };

  const subscriptions = await PushSubscription.find({ usuario: { $in: admins.map(admin => admin._id) } });
  const payload = {
    title: 'Tenés una consulta por responder',
    body: `${consulta.productoSnapshot.marca} ${consulta.productoSnapshot.modelo} · ${consulta.contacto.nombre}`,
    tag: `consulta-${consulta._id}`,
    url: '/consultas',
    data: { consultaId: consulta._id.toString() }
  };

  return sendToSubscriptions(subscriptions, payload);
}

async function sendTestNotification(usuarioId) {
  if (!configureWebPush()) return { sent: 0, skipped: true, expired: 0, failed: 0, providerStatusCodes: [] };
  const subscriptions = await PushSubscription.find({ usuario: usuarioId });
  return sendToSubscriptions(subscriptions, {
    title: 'Avisos funcionando',
    body: 'Hogar Conectado puede avisarte cuando llegue una nueva consulta.',
    tag: `prueba-${Date.now()}`,
    url: '/consultas'
  });
}

module.exports = { configureWebPush, getPushConfig, notifyAdminsNewInquiry, sendTestNotification };
