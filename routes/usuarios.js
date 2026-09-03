const express = require('express');
const { body, validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const { requireRoles } = require('../middleware/auth');

const router = express.Router();
router.use(requireRoles('admin'));
const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.get('/', asyncHandler(async (req, res) => {
  const filtro = req.query.estado ? { estado: req.query.estado } : {};
  const usuarios = await Usuario.find(filtro)
    .populate('aprobadoPor', 'nombre email')
    .sort({ estado: 1, createdAt: -1 });
  res.json({ success: true, data: usuarios });
}));

router.put('/:id/aprobar', [
  body('rol').isIn(['admin', 'editor', 'vendedor', 'consulta']).withMessage('Rol inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const usuario = await Usuario.findByIdAndUpdate(req.params.id, {
    rol: req.body.rol,
    estado: 'activo',
    aprobadoPor: req.user._id,
    aprobadoEn: new Date()
  }, { new: true, runValidators: true });
  if (!usuario) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  res.json({ success: true, data: usuario, message: 'Usuario aprobado' });
}));

router.put('/:id/rol', [
  body('rol').isIn(['admin', 'editor', 'vendedor', 'consulta']).withMessage('Rol inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  if (req.user._id.toString() === req.params.id && req.body.rol !== 'admin') {
    const otrosAdmins = await Usuario.countDocuments({ _id: { $ne: req.user._id }, rol: 'admin', estado: 'activo' });
    if (otrosAdmins === 0) return res.status(400).json({ success: false, message: 'No podés quitar el rol al último administrador' });
  }
  const usuario = await Usuario.findByIdAndUpdate(req.params.id, { rol: req.body.rol }, { new: true, runValidators: true });
  if (!usuario) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  res.json({ success: true, data: usuario });
}));

router.put('/:id/bloquear', asyncHandler(async (req, res) => {
  if (req.user._id.toString() === req.params.id) {
    return res.status(400).json({ success: false, message: 'No podés bloquear tu propio usuario' });
  }
  const usuario = await Usuario.findByIdAndUpdate(req.params.id, { estado: 'bloqueado' }, { new: true });
  if (!usuario) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  res.json({ success: true, data: usuario });
}));

router.put('/:id/reactivar', asyncHandler(async (req, res) => {
  const usuario = await Usuario.findByIdAndUpdate(req.params.id, { estado: 'activo' }, { new: true });
  if (!usuario) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  res.json({ success: true, data: usuario });
}));

module.exports = router;
