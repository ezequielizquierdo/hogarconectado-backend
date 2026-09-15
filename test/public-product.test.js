const test = require('node:test');
const assert = require('node:assert/strict');
const { serializeAuthenticatedProduct, serializePublicProduct, serializeSellerProduct } = require('../utils/publicProduct');

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

test('serializeSellerProduct permite cotizar sin exponer costos ni porcentaje', () => {
  const result = serializeSellerProduct({
    toObject: () => ({
      _id: 'producto-1', marca: 'Marca', modelo: 'Modelo', precioBase: 371000,
      porcentajeGanancia: 15, imagenPublicIds: ['interno'], precioConGanancia: 430000
    }),
    calcularCuotas: () => ({
      contado: 430000,
      factura: { costoBase: 389550, unPago: 451500 },
      tresCuotas: { costoBase: 419155, total: 485814, cuota: 161938 },
      seisCuotas: { costoBase: 450920, total: 521934, cuota: 86989 }
    })
  });

  assert.equal(result.precios.contado, 430000);
  assert.equal(result.precios.factura.unPago, 451500);
  assert.equal('costoBase' in result.precios.factura, false);
  assert.equal('precioBase' in result, false);
  assert.equal('porcentajeGanancia' in result, false);
  assert.equal('imagenPublicIds' in result, false);
});

test('serializePublicProduct identifica una venta por catálogo sin exponer datos internos', () => {
  const result = serializePublicProduct({
    _id: 'producto-catalogo',
    marca: 'Essen',
    modelo: 'Cacerola 24 cm',
    precioConGanancia: 200000,
    tipoComercializacion: 'venta-catalogo',
    catalogo: {
      nombre: 'Essen',
      campania: 'C9',
      vigenciaHasta: new Date('2026-09-30T23:59:59.000Z'),
      plazoEntrega: '7 a 15 días',
      responsable: 'dato-interno'
    },
    precioBase: 150000
  });

  assert.equal(result.tipoComercializacion, 'venta-catalogo');
  assert.equal(result.disponiblePorPedido, true);
  assert.deepEqual(Object.keys(result.catalogo).sort(), ['campania', 'nombre', 'plazoEntrega', 'vigenciaHasta']);
  assert.equal('precioBase' in result, false);
  assert.equal('responsable' in result.catalogo, false);
});

test('serializePublicProduct mantiene compatibilidad con productos existentes', () => {
  const result = serializePublicProduct({ _id: 'producto-actual', marca: 'Marca', modelo: 'Modelo' });
  assert.equal(result.tipoComercializacion, 'stock-propio');
  assert.equal(result.disponiblePorPedido, false);
  assert.equal(result.catalogo, undefined);
});
