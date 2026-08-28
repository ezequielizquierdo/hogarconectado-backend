const test = require('node:test');
const assert = require('node:assert/strict');
const { serializePublicProduct } = require('../utils/publicProduct');

test('serializePublicProduct expone solo datos aptos para el catálogo público', () => {
  const result = serializePublicProduct({
    _id: 'producto-1',
    categoria: { _id: 'categoria-1', nombre: 'Heladeras' },
    marca: 'Electrolux',
    modelo: 'IM7S523L',
    descripcion: 'No frost inverter',
    imagenes: ['https://example.com/producto.jpg'],
    stock: { cantidad: 1, disponible: true },
    precioConGanancia: 1917500,
    precioBase: 1475000,
    porcentajeGanancia: 30,
    imagenPublicIds: ['secreto-interno'],
    tags: ['interno']
  });

  assert.equal(result.precioConGanancia, 1917500);
  assert.equal(result.marca, 'Electrolux');
  assert.equal('precioBase' in result, false);
  assert.equal('porcentajeGanancia' in result, false);
  assert.equal('imagenPublicIds' in result, false);
  assert.equal('tags' in result, false);
});
