const test = require('node:test');
const assert = require('node:assert/strict');
const { buildOnboardingRequest } = require('../utils/onboarding');

test('normaliza una solicitud para aportar productos', () => {
  const result = buildOnboardingRequest({
    tipo: 'productos', nombre: '  Ana   Pérez ', telefono: '+54 9 11 1234 5678', email: 'ANA@MAIL.COM ',
    productosDescripcion: '  Cosmética   natural ', cantidadAproximada: '12', canales: ['instagram', 'invalido'],
  });
  assert.equal(result.tipo, 'productos');
  assert.equal(result.contacto.nombre, 'Ana Pérez');
  assert.equal(result.contacto.email, 'ana@mail.com');
  assert.equal(result.productos.cantidadAproximada, 12);
  assert.deepEqual(result.vendedor.canales, ['instagram']);
});

test('rechaza el tipo desconocido y elimina canales repetidos', () => {
  const result = buildOnboardingRequest({ tipo: 'otro', canales: ['whatsapp', 'whatsapp', 'presencial'] });
  assert.equal(result.tipo, null);
  assert.deepEqual(result.vendedor.canales, ['whatsapp', 'presencial']);
});
