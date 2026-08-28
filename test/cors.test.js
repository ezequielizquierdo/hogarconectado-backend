const test = require('node:test');
const assert = require('node:assert/strict');
const { createCorsOptions, parseFrontendOrigins } = require('../utils/corsConfig');

function validateOrigin(options, origin) {
  return new Promise((resolve) => {
    options.origin(origin, (error, allowed) => resolve({ error, allowed }));
  });
}

test('normaliza uno o varios orígenes configurados', () => {
  assert.deepEqual(
    parseFrontendOrigins(' https://app.example.com/,https://admin.example.com/ruta '),
    ['https://app.example.com', 'https://admin.example.com']
  );
});

test('descarta valores inválidos o protocolos no web', () => {
  assert.deepEqual(parseFrontendOrigins('no-es-url,ftp://example.com'), []);
});

test('permite FRONTEND_URL en producción y rechaza otros orígenes', async () => {
  const options = createCorsOptions({
    nodeEnv: 'production',
    frontendUrl: 'https://hogarconectado.onrender.com'
  });

  assert.deepEqual(
    await validateOrigin(options, 'https://hogarconectado.onrender.com'),
    { error: null, allowed: true }
  );

  const rejected = await validateOrigin(options, 'https://otro.example.com');
  assert.equal(rejected.allowed, undefined);
  assert.match(rejected.error.message, /CORS/);
});

test('permite el frontend oficial de producción sin depender de FRONTEND_URL', async () => {
  const options = createCorsOptions({
    nodeEnv: 'production',
    frontendUrl: ''
  });

  assert.deepEqual(
    await validateOrigin(options, 'https://hogarconectado.onrender.com'),
    { error: null, allowed: true }
  );
});

test('permite solicitudes sin Origin para clientes móviles', async () => {
  const options = createCorsOptions({ nodeEnv: 'production' });
  assert.deepEqual(await validateOrigin(options, undefined), { error: null, allowed: true });
});

test('autoriza el encabezado de idempotencia usado por las consultas públicas', () => {
  const options = createCorsOptions({ nodeEnv: 'production' });

  assert.ok(options.allowedHeaders.includes('X-Idempotency-Key'));
});
