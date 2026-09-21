const test = require('node:test');
const assert = require('node:assert/strict');
const { canLinkInquiry, quoteMatchesInquiry, resolveSellerOrigin } = require('../utils/quoteAttribution');

const inquiry = {
  contacto: { telefono: '+54 9 11 1234 5678' },
  productos: [{ producto: 'producto-1' }, { producto: 'producto-2' }],
  vendedorOrigen: 'seller-1',
  asignadaA: 'seller-2'
};

test('la cotización solo se vincula a la consulta del mismo teléfono y con producto relacionado', () => {
  assert.equal(quoteMatchesInquiry(inquiry, { telefono: '+5491112345678' }, ['producto-2', 'producto-3']), true);
  assert.equal(quoteMatchesInquiry(inquiry, { telefono: '1144444444' }, ['producto-2']), false);
  assert.equal(quoteMatchesInquiry(inquiry, { telefono: '+5491112345678' }, ['producto-3']), false);
});

test('la consulta conserva al vendedor de origen aunque otro vendedor atienda la cotización', () => {
  assert.equal(canLinkInquiry({ rol: 'vendedor', _id: 'seller-2' }, inquiry), true);
  assert.equal(canLinkInquiry({ rol: 'vendedor', _id: 'seller-3' }, inquiry), false);
  assert.equal(resolveSellerOrigin({ rol: 'vendedor', _id: 'seller-2' }, inquiry), 'seller-1');
  assert.equal(resolveSellerOrigin({ rol: 'vendedor', _id: 'seller-2' }, null), 'seller-2');
  assert.equal(resolveSellerOrigin({ rol: 'admin', _id: 'admin-1' }, inquiry), 'seller-1');
});
