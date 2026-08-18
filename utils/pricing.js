const DEFAULT_PRICING = Object.freeze({
  ganancia: 0.30,
  factor3Cuotas: 1.1298,
  factor6Cuotas: 1.2138
});

function parseNonNegativeNumber(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function getPricingConfig(env = process.env) {
  return {
    ganancia: parseNonNegativeNumber(env.GANANCIA_DEFAULT, DEFAULT_PRICING.ganancia),
    factor3Cuotas: parseNonNegativeNumber(env.FACTOR_3_CUOTAS, DEFAULT_PRICING.factor3Cuotas),
    factor6Cuotas: parseNonNegativeNumber(env.FACTOR_6_CUOTAS, DEFAULT_PRICING.factor6Cuotas)
  };
}

function calculatePrices(precioBase, config = DEFAULT_PRICING) {
  const base = Number(precioBase);
  if (!Number.isFinite(base) || base < 0) {
    throw new TypeError('El precio base debe ser un número no negativo');
  }

  const contado = base * (1 + config.ganancia);
  const total3 = contado * config.factor3Cuotas;
  const total6 = contado * config.factor6Cuotas;

  return {
    contado,
    tresCuotas: {
      total: total3,
      cuota: total3 / 3
    },
    seisCuotas: {
      total: total6,
      cuota: total6 / 6
    }
  };
}

module.exports = {
  DEFAULT_PRICING,
  calculatePrices,
  getPricingConfig,
  parseNonNegativeNumber
};
