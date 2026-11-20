const test = require('node:test');
const assert = require('node:assert/strict');
const {
  updatedSince,
  isPriceOrder,
  imagePresenceFilter,
  newArrivalFilter,
  stockAvailabilityFilter,
  sortBySalePrice
} = require('../utils/productCatalogFilters');

test('filtra productos creados o modificados durante los últimos 1, 7 o 30 días', () => {
  const now = new Date('2026-09-22T12:00:00.000Z');
  assert.equal(updatedSince('dia', now).toISOString(), '2026-09-21T12:00:00.000Z');
  assert.equal(updatedSince('semana', now).toISOString(), '2026-09-15T12:00:00.000Z');
  assert.equal(updatedSince('mes', now).toISOString(), '2026-08-23T12:00:00.000Z');
  assert.equal(updatedSince('todos', now), null);
  assert.equal(updatedSince('invalido', now), null);
});

test('ordena objetos lean por precio de venta y no por precio base, antes de paginar', () => {
  const products = [
    { _id: 'a', precioBase: 100, porcentajeGanancia: 80, createdAt: '2026-09-20' },
    { _id: 'b', precioBase: 120, porcentajeGanancia: 25, createdAt: '2026-09-19' },
    { _id: 'c', precioBase: 100, porcentajeGanancia: 100, descuento: { activo: true, porcentaje: 20 }, createdAt: '2026-09-18' }
  ];
  assert.equal(isPriceOrder('precio-asc'), true);
  assert.equal(isPriceOrder('recientes'), false);
  assert.deepEqual(sortBySalePrice(products, 'precio-asc').map(item => item._id), ['b', 'c', 'a']);
  assert.deepEqual(sortBySalePrice(products, 'precio-desc').map(item => item._id), ['a', 'c', 'b']);
  assert.deepEqual(products.map(item => item._id), ['a', 'b', 'c']);
});

test('deja al final productos sin precio válido en ambos sentidos', () => {
  const products = [
    { _id: 'sin-precio', createdAt: '2026-09-21' },
    { _id: 'economico', precioBase: 100, porcentajeGanancia: 10, createdAt: '2026-09-19' },
    { _id: 'caro', precioBase: 200, porcentajeGanancia: 10, createdAt: '2026-09-18' }
  ];

  assert.deepEqual(
    sortBySalePrice(products, 'precio-asc').map(item => item._id),
    ['economico', 'caro', 'sin-precio']
  );
  assert.deepEqual(
    sortBySalePrice(products, 'precio-desc').map(item => item._id),
    ['caro', 'economico', 'sin-precio']
  );
});

test('construye el filtro de presencia de imágenes sin alterar la consulta por defecto', () => {
  assert.deepEqual(imagePresenceFilter('con-imagen'), { 'imagenes.0': { $exists: true } });
  assert.deepEqual(imagePresenceFilter('sin-imagen'), { 'imagenes.0': { $exists: false } });
  assert.deepEqual(imagePresenceFilter('todos'), {});
  assert.deepEqual(imagePresenceFilter('invalido'), {});
});

test('filtra disponibilidad usando el indicador y una cantidad positiva', () => {
  assert.deepEqual(stockAvailabilityFilter('true'), {
    'stock.disponible': true,
    'stock.cantidad': { $gt: 0 }
  });
  assert.deepEqual(stockAvailabilityFilter(false), {
    $or: [
      { 'stock.disponible': { $ne: true } },
      { 'stock.cantidad': { $lte: 0 } },
      { 'stock.cantidad': { $exists: false } }
    ]
  });
  assert.equal(stockAvailabilityFilter(undefined), null);
  assert.equal(stockAvailabilityFilter('todos'), null);
});

test('filtra únicamente los ingresos señalados por la última sincronización', () => {
  assert.deepEqual(newArrivalFilter(true), { 'nuevoIngreso.activo': true });
  assert.deepEqual(newArrivalFilter('true'), { 'nuevoIngreso.activo': true });
  assert.equal(newArrivalFilter(false), null);
  assert.equal(newArrivalFilter(undefined), null);
});
