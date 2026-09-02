const test = require('node:test');
const assert = require('node:assert/strict');
const { serializeAuthenticatedProduct, serializePublicProduct } = require('../utils/publicProduct');

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
    precios: { contado: 1917500, tresCuotas: { total: 1 }, seisCuotas: { total: 1 } },
    precioBase: 1475000,
    porcentajeGanancia: 30,
    imagenPublicIds: ['secreto-interno'],
    tags: ['interno']
  });

  assert.equal(result.precioConGanancia, 1917500);
  assert.equal(result.marca, 'Electrolux');
  assert.equal('precioBase' in result, false);
  assert.equal('precios' in result, false);
  assert.equal('porcentajeGanancia' in result, false);
  assert.equal('imagenPublicIds' in result, false);
  assert.equal('tags' in result, false);
});

test('serializeAuthenticatedProduct agrega los precios completos calculados', () => {
  const prices = {
    contado: 130,
    tresCuotas: { total: 146.87, cuota: 48.9566666667 },
    seisCuotas: { total: 157.794, cuota: 26.299 }
  };
  const result = serializeAuthenticatedProduct({
    toObject: () => ({ _id: 'producto-1', marca: 'Marca', modelo: 'Modelo' }),
    calcularCuotas: () => prices
  });

  assert.deepEqual(result.precios, prices);
  assert.equal(result.marca, 'Marca');
});
