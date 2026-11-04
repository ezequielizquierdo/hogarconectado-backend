const assert = require('node:assert/strict');
const test = require('node:test');

const {
  inspectUrl,
  isPrivateHost,
  mapWithConcurrency
} = require('../scripts/auditar-imagenes-productos');

test('detecta hosts privados que no sirven como imágenes públicas', () => {
  assert.equal(isPrivateHost('localhost'), true);
  assert.equal(isPrivateHost('127.0.0.1'), true);
  assert.equal(isPrivateHost('10.0.0.8'), true);
  assert.equal(isPrivateHost('172.16.0.2'), true);
  assert.equal(isPrivateHost('172.31.255.2'), true);
  assert.equal(isPrivateHost('192.168.1.13'), true);
  assert.equal(isPrivateHost('res.cloudinary.com'), false);
});

test('clasifica URLs inválidas y privadas sin hacer solicitudes de red', async () => {
  assert.deepEqual(await inspectUrl('no-es-una-url', 100), { status: 'invalid-url' });
  assert.deepEqual(await inspectUrl('file:///tmp/producto.png', 100), { status: 'invalid-url' });
  assert.deepEqual(await inspectUrl('http://192.168.1.13:3000/producto.jpg', 100), { status: 'private-host' });
});

test('mapWithConcurrency conserva el orden de los resultados', async () => {
  const result = await mapWithConcurrency([3, 1, 2], 2, async value => {
    await new Promise(resolve => setTimeout(resolve, value));
    return value * 2;
  });

  assert.deepEqual(result, [6, 2, 4]);
});
