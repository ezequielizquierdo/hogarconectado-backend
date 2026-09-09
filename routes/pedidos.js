const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Pedido = require('../models/Pedido');
const { requireRoles } = require('../middleware/auth');
const { cancelReservation, confirmOrderPayment } = require('../services/orderReservations');

const router = express.Router();

router.get('/', requireRoles('admin', 'vendedor'), async (req, res) => {
  try {
    const filter = req.user.rol === 'vendedor' ? { vendedor: req.user._id } : {};
    const data = await Pedido.find(filter).populate('vendedor', 'nombre email').sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'No pudimos cargar los pedidos' });
  }
});

router.patch('/:id/estado', requireRoles('admin'), [
  param('id').isMongoId(),
  body('estado').isIn(['pago-confirmado', 'cancelado'])
], async (req, res) => {
  try {
    if (!validationResult(req).isEmpty()) return res.status(400).json({ success: false, message: 'Estado inválido' });
    let order = await Pedido.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    if (!['reserva-pendiente', 'pago-informado'].includes(order.estado)) return res.status(409).json({ success: false, message: 'El pedido ya fue procesado' });
    if (req.body.estado === 'cancelado') {
      order = await cancelReservation(order._id);
    } else order = await confirmOrderPayment(order._id, req.user._id);
    return res.json({ success: true, data: order, message: 'Pedido actualizado' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : 'No pudimos actualizar el pedido' });
  }
});

module.exports = router;
