const express = require('express');
const { param, validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');

const router = express.Router();
const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function serializePublicSeller(vendedor) {
  return {
    nombre: vendedor.nombre,
    codigo: vendedor.codigoVendedor,
    slug: vendedor.slugVendedor || null
  };
}

router.get('/', asyncHandler(async (_req, res) => {
  const vendedores = await Usuario.find({
    rol: 'vendedor',
    estado: 'activo',
    codigoVendedor: { $exists: true, $ne: '' }
  })
    .select('nombre codigoVendedor slugVendedor')
    .sort({ nombre: 1 })
    .limit(100)
    .lean();

  return res.json({ success: true, data: vendedores.map(serializePublicSeller) });
}));

router.get('/:codigo', [
  param('codigo').trim().matches(/^[a-z0-9-]{3,32}$/)
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(404).json({ success: false, message: 'Vendedor no encontrado' });
  }

  const vendedor = await Usuario.findOne({
    $or: [{ codigoVendedor: req.params.codigo }, { slugVendedor: req.params.codigo }],
    rol: 'vendedor',
    estado: 'activo'
  }).select('_id nombre codigoVendedor slugVendedor');

  if (!vendedor) {
    return res.status(404).json({ success: false, message: 'Vendedor no encontrado' });
  }

  return res.json({
    success: true,
    data: serializePublicSeller(vendedor)
  });
}));

module.exports = router;
module.exports.serializePublicSeller = serializePublicSeller;
