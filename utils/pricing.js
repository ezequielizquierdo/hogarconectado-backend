const DEFAULT_PRICING = Object.freeze({
  ganancia: 0.30,
  factorFactura: 1.05,
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
    factorFactura: DEFAULT_PRICING.factorFactura,
    factor3Cuotas: parseNonNegativeNumber(env.FACTOR_3_CUOTAS, DEFAULT_PRICING.factor3Cuotas),
    factor6Cuotas: parseNonNegativeNumber(env.FACTOR_6_CUOTAS, DEFAULT_PRICING.factor6Cuotas)
  };
}

function getProductPricingConfig(porcentajeGanancia, env = process.env) {
  const config = getPricingConfig(env);
  if (
    porcentajeGanancia === undefined ||
    porcentajeGanancia === null ||
    porcentajeGanancia === ''
  ) {
    return config;
  }

  const porcentaje = Number(porcentajeGanancia);
  if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) {
    return config;
  }

  return {
    ...config,
    ganancia: porcentaje / 100
  };
}

function calculatePrices(precioBase, config = DEFAULT_PRICING) {
  const base = Number(precioBase);
  if (!Number.isFinite(base) || base < 0) {
    throw new TypeError('El precio base debe ser un número no negativo');
  }

  const contado = base * (1 + config.ganancia);
  const descuentoPorcentaje = Math.min(90, parseNonNegativeNumber(config.descuentoPorcentaje, 0));
  const factorDescuento = 1 - descuentoPorcentaje / 100;
  const factorFactura = parseNonNegativeNumber(
    config.factorFactura,
    DEFAULT_PRICING.factorFactura
  );
  const costoFacturado = base * factorFactura;
  const costo3 = base * config.factor3Cuotas;
  const costo6 = base * config.factor6Cuotas;
  const total3SinDescuento = contado * config.factor3Cuotas;
  const total6SinDescuento = contado * config.factor6Cuotas;
  const facturaSinDescuento = costoFacturado * (1 + config.ganancia);

  return {
    contado: contado * factorDescuento,
    contadoSinDescuento: contado,
    descuentoPorcentaje,
    factura: {
      costoBase: costoFacturado,
      unPago: facturaSinDescuento * factorDescuento,
      sinDescuento: facturaSinDescuento
    },
    tresCuotas: {
      costoBase: costo3,
      total: total3SinDescuento * factorDescuento,
      cuota: total3SinDescuento * factorDescuento / 3,
      sinDescuento: total3SinDescuento
    },
    seisCuotas: {
      costoBase: costo6,
      total: total6SinDescuento * factorDescuento,
      cuota: total6SinDescuento * factorDescuento / 6,
      sinDescuento: total6SinDescuento
    }
  };
}

function calculateDetailedPrices(precioBase, config = DEFAULT_PRICING) {
  const prices = calculatePrices(precioBase, config);
  const base = Number(precioBase);

  return {
    precioBase: base,
    porcentaje: config.ganancia * 100,
    ganancia: base * config.ganancia,
    efectivo: prices.contado,
    factura: prices.factura,
    tresCuotas: prices.tresCuotas,
    seisCuotas: prices.seisCuotas
  };
}

module.exports = {
  DEFAULT_PRICING,
  calculateDetailedPrices,
  calculatePrices,
  getPricingConfig,
  getProductPricingConfig,
  parseNonNegativeNumber
};
