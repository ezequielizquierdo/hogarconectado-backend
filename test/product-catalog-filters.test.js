const test = require('node:test');
const assert = require('node:assert/strict');
const { updatedSince, isPriceOrder, sortBySalePrice } = require('../utils/productCatalogFilters');

test('filtra productos creados o modificados durante los últimos 1, 7 o 30 días', () => {
  const now = new Date('2026-09-22T12:00:00.000Z');
  assert.equal(updatedSince('dia', now).toISOString(), '2026-09-21T12:00:00.000Z');
  assert.equal(updatedSince('semana', now).toISOString(), '2026-09-15T12:00:00.000Z');
  assert.equal(updatedSince('mes', now).toISOString(), '2026-08-23T12:00:00.000Z');
  assert.equal(updatedSince('todos', now), null);
  assert.equal(updatedSince('invalido', now), null);
});

test('ordena por precio de venta y no por precio base, antes de paginar', () => {
  const products = [
    { _id: 'a', precioBase: 100, precioConGanancia: 180, createdAt: '2026-09-20' },
    { _id: 'b', precioBase: 120, precioConGanancia: 150, createdAt: '2026-09-19' },
    { _id: 'c', precioBase: 90, precioConGanancia: 160, createdAt: '2026-09-18' }
  ];
  assert.equal(isPriceOrder('precio-asc'), true);
  assert.equal(isPriceOrder('recientes'), false);
  assert.deepEqual(sortBySalePrice(products, 'precio-asc').map(item => item._id), ['b', 'c', 'a']);
  assert.deepEqual(sortBySalePrice(products, 'precio-desc').map(item => item._id), ['a', 'c', 'b']);
  assert.deepEqual(products.map(item => item._id), ['a', 'b', 'c']);
});
