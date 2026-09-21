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

function buildInquiryNotificationPayload(consulta, { recipient = 'seller', sellerName } = {}) {
  const first = consulta.productos?.[0]?.productoSnapshot || consulta.productoSnapshot;
  const extraCount = Math.max(0, (consulta.productos?.length || 1) - 1);
  const productSummary = `${first.marca} ${first.modelo}${extraCount ? ` y ${extraCount} más` : ''}`;
  const isAdminForSeller = recipient === 'admin' && Boolean(sellerName);
  return {
    title: isAdminForSeller ? `Consulta para ${sellerName}` : 'Tenés una consulta por responder',
    body: `${productSummary} · ${isAdminForSeller ? 'Vendedor avisado' : 'Nueva consulta'}`,
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

  const recipients = await Usuario.find({
    estado: 'activo',
    $or: [{ rol: 'admin' }, ...(consulta.vendedorOrigen ? [{ _id: consulta.vendedorOrigen }] : [])]
  }).select('_id nombre rol').lean();
  if (!recipients.length) return { sent: 0 };

  const subscriptions = await PushSubscription.find({ usuario: { $in: recipients.map(user => user._id) } });
  const seller = recipients.find(user => user.rol === 'vendedor' && user._id.toString() === consulta.vendedorOrigen?.toString());
  const sellerSubscriptions = seller
    ? subscriptions.filter(subscription => subscription.usuario.toString() === seller._id.toString())
    : [];
  const adminIds = new Set(recipients.filter(user => user.rol === 'admin').map(user => user._id.toString()));
  const adminSubscriptions = subscriptions.filter(subscription => adminIds.has(subscription.usuario.toString()));
  const [sellerResult, adminResult] = await Promise.all([
    sendToSubscriptions(sellerSubscriptions, buildInquiryNotificationPayload(consulta)),
    sendToSubscriptions(adminSubscriptions, buildInquiryNotificationPayload(consulta, {
      recipient: 'admin', sellerName: seller?.nombre
    }))
  ]);
  return {
    sent: sellerResult.sent + adminResult.sent,
    expired: sellerResult.expired + adminResult.expired,
    failed: sellerResult.failed + adminResult.failed,
    providerStatusCodes: [...new Set([...sellerResult.providerStatusCodes, ...adminResult.providerStatusCodes])]
  };
}

async function notifyPaymentReported(order) {
  if (!configureWebPush()) return { sent: 0, skipped: true };

  const recipients = await Usuario.find({
    estado: 'activo',
    $or: [
      { rol: 'admin' },
      ...(order.vendedor ? [{ _id: order.vendedor }] : []),
      ...(order.vendedorOrigen ? [{ _id: order.vendedorOrigen }] : [])
    ]
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
