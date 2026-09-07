const test = require('node:test');
const assert = require('node:assert/strict');
const { buildQuoteOwnershipFilter, buildSellerInquiryFilter } = require('../utils/sellerAccess');

test('el vendedor solo obtiene estadísticas de sus cotizaciones', () => {
  const id = 'seller-id';
  assert.deepEqual(buildQuoteOwnershipFilter({ _id: id, rol: 'vendedor' }), { creadaPor: id });
  assert.deepEqual(buildQuoteOwnershipFilter({ _id: 'admin-id', rol: 'admin' }), {});
});

test('el vendedor ve consultas propias, atribuidas y la cola sin dueño', () => {
  const id = 'seller-id';
  assert.deepEqual(buildSellerInquiryFilter(id), {
    $or: [
      { asignadaA: id },
      { vendedorOrigen: id },
      { asignadaA: null, vendedorOrigen: null }
    ]
  });
});
