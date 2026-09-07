const express = require('express');
const { param, validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');

const router = express.Router();
const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.get('/:codigo', [
  param('codigo').trim().matches(/^[a-z0-9-]{6,32}$/)
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(404).json({ success: false, message: 'Vendedor no encontrado' });
  }

  const vendedor = await Usuario.findOne({
    codigoVendedor: req.params.codigo,
    rol: 'vendedor',
    estado: 'activo'
  }).select('_id nombre codigoVendedor');

  if (!vendedor) {
    return res.status(404).json({ success: false, message: 'Vendedor no encontrado' });
  }

  return res.json({
    success: true,
    data: {
      id: vendedor._id,
      nombre: vendedor.nombre,
      codigo: vendedor.codigoVendedor
    }
  });
}));

module.exports = router;
