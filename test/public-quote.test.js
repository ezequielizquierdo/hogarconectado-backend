const test = require('node:test');
const assert = require('node:assert/strict');

const { selectedUnitPrice, RESERVATION_MS } = require('../services/orderReservations');
const { createPublicQuoteToken, hashPublicQuoteToken, isValidPublicQuoteToken } = require('../utils/publicQuoteToken');

test('genera tokens públicos no reversibles con formato seguro para URL', () => {
  const token = createPublicQuoteToken();
  assert.equal(isValidPublicQuoteToken(token), true);
  assert.equal(hashPublicQuoteToken(token).length, 64);
  assert.notEqual(hashPublicQuoteToken(token), token);
  assert.equal(isValidPublicQuoteToken('token-corto'), false);
});

test('la reserva pública dura exactamente 24 horas', () => {
  assert.equal(RESERVATION_MS, 24 * 60 * 60 * 1000);
});

test('el pedido congela el precio unitario de la modalidad cotizada', () => {
  const item = { detalles: { precios: {
    contado: 100,
    factura: { unPago: 120 },
    tresCuotas: { total: 135 },
    seisCuotas: { total: 150 }
  } } };
  assert.equal(selectedUnitPrice(item, 'contado'), 100);
  assert.equal(selectedUnitPrice(item, 'facturado'), 120);
  assert.equal(selectedUnitPrice(item, '3-cuotas'), 135);
  assert.equal(selectedUnitPrice(item, '6-cuotas'), 150);
});
