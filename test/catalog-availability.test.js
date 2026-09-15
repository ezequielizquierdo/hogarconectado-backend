const test = require('node:test');
const assert = require('node:assert/strict');
const { CATALOG_AVAILABILITY_STATES, canTransitionCatalogAvailability } = require('../utils/catalogAvailability');

test('define los estados operativos del pedido por catálogo', () => {
  assert.deepEqual(CATALOG_AVAILABILITY_STATES, ['pendiente', 'disponible', 'no-disponible', 'encargado', 'recibido']);
});

test('permite avanzar y corregir disponibilidad sin saltos inseguros', () => {
  assert.equal(canTransitionCatalogAvailability('pendiente', 'disponible'), true);
  assert.equal(canTransitionCatalogAvailability('disponible', 'encargado'), true);
  assert.equal(canTransitionCatalogAvailability('encargado', 'recibido'), true);
  assert.equal(canTransitionCatalogAvailability('pendiente', 'recibido'), false);
  assert.equal(canTransitionCatalogAvailability('no-disponible', 'encargado'), false);
});
