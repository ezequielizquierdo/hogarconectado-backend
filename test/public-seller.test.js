const test = require('node:test');
const assert = require('node:assert/strict');

const { serializePublicSeller } = require('../routes/vendedores');

test('el vendedor público expone únicamente los datos necesarios para atribuir una consulta', () => {
  const result = serializePublicSeller({
    _id: 'interno',
    nombre: 'Ezequiel Izquierdo',
    email: 'privado@example.com',
    codigoVendedor: 'v-1234567890',
    slugVendedor: 'eizquierdo'
  });

  assert.deepEqual(result, {
    nombre: 'Ezequiel Izquierdo',
    codigo: 'v-1234567890',
    slug: 'eizquierdo'
  });
  assert.equal('email' in result, false);
  assert.equal('_id' in result, false);
});
