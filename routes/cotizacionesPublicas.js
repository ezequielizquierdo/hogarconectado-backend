const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, header, param, validationResult } = require('express-validator');
const Cotizacion = require('../models/Cotizacion');
const Pedido = require('../models/Pedido');
const { acceptQuote, selectedUnitPrice } = require('../services/orderReservations');
const { hashPublicQuoteToken, isValidPublicQuoteToken } = require('../utils/publicQuoteToken');

const router = express.Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

async function findQuote(token) {
  if (!isValidPublicQuoteToken(token)) return null;
  return Cotizacion.findOne({
    'accesoPublico.tokenHash': hashPublicQuoteToken(token),
    'accesoPublico.venceAt': { $gt: new Date() }
  }).select('+accesoPublico.tokenHash')
    .populate('creadaPor', 'nombre')
    .populate('productos.producto', 'imagenes');
}

function serializePublicQuote(quote, order) {
  return {
    id: quote._id,
    cliente: quote.datosContacto.nombre,
    vendedor: quote.creadaPor?.nombre || 'Hogar Conectado',
    productos: quote.productos.map(item => ({
      marca: item.detalles.marca,
      modelo: item.detalles.modelo,
      cantidad: item.cantidad,
      imagen: item.producto?.imagenes?.[0],
      precioUnitario: selectedUnitPrice(item, quote.modalidadPago),
      subtotal: selectedUnitPrice(item, quote.modalidadPago) * item.cantidad
    })),
    modalidadPago: quote.modalidadPago,
    total: quote.totales.total,
    cuotas: quote.modalidadPago === '3-cuotas'
      ? { cantidad: 3, monto: quote.totales.total / 3 }
      : quote.modalidadPago === '6-cuotas'
        ? { cantidad: 6, monto: quote.totales.total / 6 }
        : null,
    observaciones: quote.observaciones,
    aceptada: Boolean(order),
    pedido: order ? { estado: order.estado, reservaVenceAt: order.reservaVenceAt } : null,
    enlaceVenceAt: quote.accesoPublico.venceAt
  };
}

router.get('/:token', limiter, [param('token').custom(isValidPublicQuoteToken)], async (req, res) => {
  try {
    if (!validationResult(req).isEmpty()) return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
    const quote = await findQuote(req.params.token);
    if (!quote) return res.status(404).json({ success: false, message: 'La cotización no existe o el enlace venció' });
    const order = quote.aceptacionCliente?.pedido
      ? await Pedido.findById(quote.aceptacionCliente.pedido).select('estado reservaVenceAt').lean()
      : null;
    return res.json({ success: true, data: serializePublicQuote(quote, order) });
  } catch {
    return res.status(500).json({ success: false, message: 'No pudimos cargar la cotización' });
  }
});

router.post('/:token/aceptar', limiter, [
  param('token').custom(isValidPublicQuoteToken),
  header('x-idempotency-key').trim().isLength({ min: 12, max: 100 }),
  body('aceptaReserva24h').custom(value => value === true)
], async (req, res) => {
  try {
    if (!validationResult(req).isEmpty()) return res.status(400).json({ success: false, message: 'No pudimos validar la aceptación' });
    const quote = await findQuote(req.params.token);
    if (!quote) return res.status(404).json({ success: false, message: 'La cotización no existe o el enlace venció' });
    const existing = await Pedido.findOne({ cotizacion: quote._id });
    const order = existing || await acceptQuote({ quote, idempotencyKey: req.get('x-idempotency-key') });
    return res.status(existing ? 200 : 201).json({
      success: true,
      data: { id: order._id, estado: order.estado, reservaVenceAt: order.reservaVenceAt },
      message: 'Reservamos los productos durante 24 horas. El pago todavía está pendiente.'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'No pudimos aceptar la cotización'
    });
  }
});

module.exports = router;
