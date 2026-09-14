const test = require('node:test');
const assert = require('node:assert/strict');
const { buildProductSearchFilter, tokenizeProductSearch } = require('../utils/productSearch');

test('divide una búsqueda en términos para exigir todas las coincidencias', () => {
  assert.deepEqual(tokenizeProductSearch('  SARTÉN   24CM ROSA  '), ['SARTÉN', '24CM', 'ROSA']);

  const filter = buildProductSearchFilter('SARTÉN 24CM ROSA');
  assert.equal(filter.$and.length, 3);
  assert.equal(filter.$and.every(term => term.$or.length === 4), true);
});

test('escapa caracteres especiales y limita búsquedas excesivas', () => {
  const filter = buildProductSearchFilter('Midea (inverter)');
  assert.equal(filter.$and[1].$or[0].marca.test('(inverter)'), true);
  assert.equal(tokenizeProductSearch('a b c d e f g h i j').length, 8);
});

test('ignora búsquedas vacías', () => {
  assert.equal(buildProductSearchFilter('   '), null);
});
