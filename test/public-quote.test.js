const test = require('node:test');
const assert = require('node:assert/strict');

const { selectedUnitPrice, RESERVATION_MS } = require('../services/orderReservations');
const Pedido = require('../models/Pedido');
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

test('el pedido admite diferenciar pago informado de pago confirmado', () => {
  const base = {
    cotizacion: new (require('mongoose').Types.ObjectId)(),
    vendedor: new (require('mongoose').Types.ObjectId)(),
    comprador: { nombre: 'Cliente', telefono: '1123456789' },
    productos: [{
      producto: new (require('mongoose').Types.ObjectId)(), cantidad: 1,
      marca: 'Marca', modelo: 'Modelo', precioUnitario: 100, subtotal: 100
    }],
    modalidadPago: 'contado', total: 100,
    reservadoAt: new Date(), reservaVenceAt: new Date(Date.now() + RESERVATION_MS),
    idempotencyKey: 'clave-idempotente-123'
  };
  assert.equal(new Pedido({ ...base, estado: 'pago-informado' }).validateSync(), undefined);
  assert.equal(new Pedido({ ...base, estado: 'estado-invalido' }).validateSync()?.errors.estado.kind, 'enum');
});
