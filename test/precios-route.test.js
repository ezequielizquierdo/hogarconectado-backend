const test = require('node:test');
const assert = require('node:assert/strict');
const preciosRoutes = require('../routes/precios');

function assertClose(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} no coincide con ${expected}`);
}

async function execute(body) {
  const req = { body };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };

  for (const validator of preciosRoutes.priceCalculationValidators) {
    await validator.run(req);
  }
  preciosRoutes.calculatePriceHandler(req, res);
  return res;
}

test('POST /api/precios/calcular devuelve el desglose oficial', async () => {
  const response = await execute({ precioBase: 705000, porcentaje: 10 });

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.success, true);
  assertClose(response.payload.data.efectivo, 775500);
  assertClose(response.payload.data.factura.unPago, 814275);
  assertClose(response.payload.data.tresCuotas.cuota, 292053.3);
  assertClose(response.payload.data.seisCuotas.cuota, 156883.65);
});

test('POST /api/precios/calcular rechaza porcentajes fuera de rango', async () => {
  const response = await execute({ precioBase: 705000, porcentaje: 101 });

  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.success, false);
  assert.match(response.payload.errors[0].msg, /porcentaje/i);
});
