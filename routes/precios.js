const express = require('express');
const { body, validationResult } = require('express-validator');
const { calculateDetailedPrices, getPricingConfig } = require('../utils/pricing');

const router = express.Router();

const priceCalculationValidators = [
  body('precioBase')
    .isFloat({ min: 0 })
    .withMessage('El precio base debe ser un número no negativo'),
  body('porcentaje')
    .isFloat({ min: 0, max: 100 })
    .withMessage('El porcentaje debe estar entre 0 y 100')
];

function calculatePriceHandler(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }

  const config = {
    ...getPricingConfig(process.env),
    ganancia: Number(req.body.porcentaje) / 100
  };

  return res.json({
    success: true,
    data: calculateDetailedPrices(req.body.precioBase, config)
  });
}

router.post('/calcular', priceCalculationValidators, calculatePriceHandler);

module.exports = router;
module.exports.calculatePriceHandler = calculatePriceHandler;
module.exports.priceCalculationValidators = priceCalculationValidators;
