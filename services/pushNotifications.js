const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const Usuario = require('../models/Usuario');

function getPushConfig() {
  const publicKey = (process.env.VAPID_PUBLIC_KEY || '').trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
  const subject = (process.env.VAPID_SUBJECT || '').trim();

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

function buildInquiryNotificationPayload(consulta) {
  const first = consulta.productos?.[0]?.productoSnapshot || consulta.productoSnapshot;
  const extraCount = Math.max(0, (consulta.productos?.length || 1) - 1);
  return {
    title: 'Tenés una consulta por responder',
    body: `${first.marca} ${first.modelo}${extraCount ? ` y ${extraCount} más` : ''} · Nueva consulta`,
    tag: `consulta-${consulta._id}`,
    url: '/consultas',
    data: { consultaId: consulta._id.toString() }
  };
}

function buildPaymentReportedPayload(order) {
  return {
    title: 'Hay un pago para verificar',
    body: 'Un comprador informó el pago de una cotización.',
    tag: `pago-informado-${order._id}`,
    url: '/cotizaciones',
    data: { pedidoId: order._id.toString(), cotizacionId: order.cotizacion.toString() }
  };
}

async function notifyAdminsNewInquiry(consulta) {
  if (!configureWebPush()) return { sent: 0, skipped: true };

  const recipientFilter = consulta.vendedorOrigen
    ? { $or: [{ rol: 'admin' }, { _id: consulta.vendedorOrigen }] }
    : { rol: 'admin' };
  const admins = await Usuario.find({ ...recipientFilter, estado: 'activo' }).select('_id').lean();
  if (!admins.length) return { sent: 0 };

  const subscriptions = await PushSubscription.find({ usuario: { $in: admins.map(admin => admin._id) } });
  const payload = buildInquiryNotificationPayload(consulta);

  return sendToSubscriptions(subscriptions, payload);
}

async function notifyPaymentReported(order) {
  if (!configureWebPush()) return { sent: 0, skipped: true };

  const recipients = await Usuario.find({
    estado: 'activo',
    $or: [{ rol: 'admin' }, { _id: order.vendedor }]
  }).select('_id').lean();
  if (!recipients.length) return { sent: 0 };

  const subscriptions = await PushSubscription.find({ usuario: { $in: recipients.map(user => user._id) } });
  return sendToSubscriptions(subscriptions, buildPaymentReportedPayload(order));
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

module.exports = {
  buildInquiryNotificationPayload,
  buildPaymentReportedPayload,
  configureWebPush,
  getPushConfig,
  notifyAdminsNewInquiry,
  notifyPaymentReported,
  sendTestNotification
};
