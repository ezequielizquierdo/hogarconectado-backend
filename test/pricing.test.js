const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateDetailedPrices,
  calculatePrices,
  getPricingConfig,
  getProductPricingConfig
} = require('../utils/pricing');

function assertClose(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} no coincide con ${expected}`);
}

test('interpreta GANANCIA_DEFAULT como número y no como texto concatenado', () => {
  const config = getPricingConfig({
    GANANCIA_DEFAULT: '0.30',
    FACTOR_3_CUOTAS: '1.1298',
    FACTOR_6_CUOTAS: '1.2138'
  });

  assert.deepEqual(config, {
    ganancia: 0.30,
    factorFactura: 1.05,
    factor3Cuotas: 1.1298,
    factor6Cuotas: 1.2138
  });
  assert.equal(calculatePrices(223000, config).contado, 289900);
});

test('calcula contado, totales y valores por cuota', () => {
  const prices = calculatePrices(705000, {
    ganancia: 0.10,
    factor3Cuotas: 1.1298,
    factor6Cuotas: 1.2138
  });

  assertClose(prices.contado, 775500);
  assertClose(prices.factura.costoBase, 740250);
  assertClose(prices.factura.unPago, 814275);
  assertClose(prices.tresCuotas.total, 876159.9);
  assertClose(prices.tresCuotas.costoBase, 796509);
  assertClose(prices.tresCuotas.cuota, 292053.3);
  assertClose(prices.seisCuotas.total, 941301.9);
  assertClose(prices.seisCuotas.costoBase, 855729);
  assertClose(prices.seisCuotas.cuota, 156883.65);
});

test('reproduce el desglose de la fila de referencia del Excel', () => {
  const prices = calculateDetailedPrices(705000, {
    ganancia: 0.10,
    factorFactura: 1.05,
    factor3Cuotas: 1.1298,
    factor6Cuotas: 1.2138
  });

  assertClose(prices.ganancia, 70500);
  assertClose(prices.efectivo, 775500);
  assertClose(prices.factura.costoBase, 740250);
  assertClose(prices.factura.unPago, 814275);
  assertClose(prices.tresCuotas.total, 876159.9);
  assertClose(prices.tresCuotas.cuota, 292053.3);
  assertClose(prices.seisCuotas.total, 941301.9);
  assertClose(prices.seisCuotas.cuota, 156883.65);
});

test('usa valores seguros cuando las variables son inválidas', () => {
  assert.deepEqual(getPricingConfig({
    GANANCIA_DEFAULT: 'no-es-numero',
    FACTOR_3_CUOTAS: '-1',
    FACTOR_6_CUOTAS: ''
  }), {
    ganancia: 0.30,
    factorFactura: 1.05,
    factor3Cuotas: 1.1298,
    factor6Cuotas: 1.2138
  });
});

test('rechaza precios base inválidos', () => {
  assert.throws(() => calculatePrices(-1), /precio base/i);
  assert.throws(() => calculatePrices('abc'), /precio base/i);
});

test('permite sobrescribir la ganancia para un producto', () => {
  const config = getProductPricingConfig(15, {
    GANANCIA_DEFAULT: '0.30',
    FACTOR_3_CUOTAS: '1.1298',
    FACTOR_6_CUOTAS: '1.2138'
  });

  assert.equal(config.ganancia, 0.15);
  assertClose(calculatePrices(100000, config).contado, 115000);
});

test('conserva la ganancia global cuando el producto no tiene porcentaje propio', () => {
  const config = getProductPricingConfig(undefined, {
    GANANCIA_DEFAULT: '0.30'
  });

  assert.equal(config.ganancia, 0.30);
});
