const test = require('node:test');
const assert = require('node:assert/strict');
const { sellerSlugCandidates, findAvailableSellerSlug } = require('../utils/sellerSlug');

test('crea el alias con inicial y apellido, sin acentos', () => {
  assert.equal(sellerSlugCandidates('Ezequiel Izquierdo')[0], 'eizquierdo');
  assert.equal(sellerSlugCandidates('Érica Núñez')[0], 'enunez');
});

test('usa dos iniciales y luego más caracteres si el alias ya existe', async () => {
  const taken = new Set(['eizquierdo', 'ezizquierdo']);
  assert.equal(await findAvailableSellerSlug('Ezequiel Izquierdo', candidate => taken.has(candidate)), 'ezeizquierdo');
});

test('mantiene el límite de 32 caracteres y resuelve homónimos', async () => {
  const name = 'Ezequiel Apellidoextraordinariamentelargo';
  const first = sellerSlugCandidates(name)[0];
  assert.ok(first.length <= 32);
  assert.ok((await findAvailableSellerSlug(name, candidate => candidate === first)).length <= 32);
});
