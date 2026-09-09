const mongoose = require('mongoose');
const Cotizacion = require('../models/Cotizacion');
const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');

const RESERVATION_MS = 24 * 60 * 60 * 1000;

function selectedUnitPrice(item, modalidad) {
  const precios = item.detalles.precios;
  if (modalidad === 'facturado') return precios.factura.unPago;
  if (modalidad === '3-cuotas') return precios.tresCuotas.total;
  if (modalidad === '6-cuotas') return precios.seisCuotas.total;
  return precios.contado;
}

async function acceptQuote({ quote, idempotencyKey }) {
  const session = await mongoose.startSession();
  let acceptedOrder;
  try {
    await session.withTransaction(async () => {
      const existing = await Pedido.findOne({ cotizacion: quote._id }).session(session);
      if (existing) {
        acceptedOrder = existing;
        return;
      }

      const freshQuote = await Cotizacion.findOne({
        _id: quote._id,
        'aceptacionCliente.pedido': { $exists: false },
        estado: { $in: ['pendiente', 'enviada'] }
      }).session(session);
      if (!freshQuote) throw Object.assign(new Error('La cotización ya fue procesada'), { statusCode: 409 });

      for (const item of freshQuote.productos) {
        const result = await Producto.updateOne({
          _id: item.producto,
          activo: true,
          'stock.cantidad': { $gte: item.cantidad }
        }, {
          $inc: { 'stock.cantidad': -item.cantidad }
        }, { session });
        if (result.modifiedCount !== 1) {
          throw Object.assign(new Error(`No hay stock suficiente de ${item.detalles.marca} ${item.detalles.modelo}`), { statusCode: 409 });
        }
      }

      const now = new Date();
      const [created] = await Pedido.create([{
        cotizacion: freshQuote._id,
        vendedor: freshQuote.creadaPor,
        comprador: freshQuote.datosContacto,
        productos: freshQuote.productos.map(item => ({
          producto: item.producto,
          cantidad: item.cantidad,
          marca: item.detalles.marca,
          modelo: item.detalles.modelo,
          precioUnitario: selectedUnitPrice(item, freshQuote.modalidadPago),
          subtotal: selectedUnitPrice(item, freshQuote.modalidadPago) * item.cantidad
        })),
        modalidadPago: freshQuote.modalidadPago,
        total: freshQuote.totales.total,
        reservadoAt: now,
        reservaVenceAt: new Date(now.getTime() + RESERVATION_MS),
        idempotencyKey
      }], { session });
      freshQuote.aceptacionCliente = { aceptadaAt: now, pedido: created._id };
      await freshQuote.save({ session });
      acceptedOrder = created;
    });
    return acceptedOrder;
  } finally {
    await session.endSession();
  }
}

async function releaseExpiredReservations() {
  const expired = await Pedido.find({ estado: 'reserva-pendiente', reservaVenceAt: { $lte: new Date() } })
    .select('_id productos')
    .limit(100)
    .lean();
  for (const candidate of expired) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const order = await Pedido.findOneAndUpdate(
          { _id: candidate._id, estado: 'reserva-pendiente', reservaVenceAt: { $lte: new Date() } },
          { $set: { estado: 'vencido' } },
          { new: true, session }
        );
        if (!order) return;
        for (const item of order.productos) {
          await Producto.updateOne(
            { _id: item.producto },
            { $inc: { 'stock.cantidad': item.cantidad } },
            { session }
          );
        }
      });
    } finally {
      await session.endSession();
    }
  }
  return expired.length;
}

async function cancelReservation(orderId) {
  const session = await mongoose.startSession();
  let cancelled;
  try {
    await session.withTransaction(async () => {
      const order = await Pedido.findOneAndUpdate(
        { _id: orderId, estado: { $in: ['reserva-pendiente', 'pago-informado'] } },
        { $set: { estado: 'cancelado' } },
        { new: true, session }
      );
      if (!order) throw Object.assign(new Error('El pedido ya fue procesado'), { statusCode: 409 });
      for (const item of order.productos) {
        await Producto.updateOne(
          { _id: item.producto },
          { $inc: { 'stock.cantidad': item.cantidad } },
          { session }
        );
      }
      cancelled = order;
    });
    return cancelled;
  } finally {
    await session.endSession();
  }
}

async function reportOrderPayment(orderId) {
  const order = await Pedido.findOneAndUpdate(
    { _id: orderId, estado: 'reserva-pendiente', reservaVenceAt: { $gt: new Date() } },
    { $set: { estado: 'pago-informado', pagoInformadoAt: new Date() } },
    { new: true }
  );
  if (order) return order;

  const existing = await Pedido.findById(orderId);
  if (existing?.estado === 'pago-informado' || existing?.estado === 'pago-confirmado') return existing;
  throw Object.assign(new Error('La reserva venció o ya no admite informar el pago'), { statusCode: 409 });
}

async function confirmOrderPayment(orderId, adminId) {
  const session = await mongoose.startSession();
  let confirmed;
  try {
    await session.withTransaction(async () => {
      const order = await Pedido.findOneAndUpdate(
        {
          _id: orderId,
          $or: [
            { estado: 'pago-informado' },
            { estado: 'reserva-pendiente', reservaVenceAt: { $gt: new Date() } }
          ]
        },
        { $set: { estado: 'pago-confirmado', pagoConfirmadoAt: new Date(), pagoConfirmadoPor: adminId } },
        { new: true, session }
      );
      if (!order) throw Object.assign(new Error('La reserva venció o ya fue procesada'), { statusCode: 409 });
      const quote = await Cotizacion.findById(order.cotizacion).session(session);
      if (!quote) throw new Error('La cotización asociada ya no existe');
      quote.estado = 'confirmada';
      quote.confirmadaPor = adminId;
      quote.confirmadaAt = new Date();
      quote.venta = {
        compradorNombre: order.comprador.nombre,
        entregaAcordada: quote.venta?.entregaAcordada || 'A coordinar',
        agregarEnvio: false,
        costoEnvio: 0,
        estadoPago: 'confirmado',
        estadoEntrega: 'pendiente'
      };
      quote.calcularResumenConfirmacion();
      await quote.save({ session });
      confirmed = order;
    });
    return confirmed;
  } finally {
    await session.endSession();
  }
}

module.exports = { RESERVATION_MS, acceptQuote, cancelReservation, confirmOrderPayment, releaseExpiredReservations, reportOrderPayment, selectedUnitPrice };
