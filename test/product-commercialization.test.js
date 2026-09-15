const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Producto = require('../models/Producto');

function buildProduct(overrides = {}) {
  return new Producto({
    categoria: new mongoose.Types.ObjectId(),
    marca: 'Marca',
    modelo: 'Modelo',
    precioBase: 100000,
    ...overrides
  });
}

test('los productos existentes conservan stock propio como tipo predeterminado', () => {
  const product = buildProduct();
  assert.equal(product.tipoComercializacion, 'stock-propio');
  assert.equal(product.validateSync(), undefined);
});

test('una venta por catálogo requiere identificar el catálogo', () => {
  const product = buildProduct({ tipoComercializacion: 'venta-catalogo' });
  const error = product.validateSync();
  assert.match(error.errors['catalogo.nombre'].message, /requerido/i);
});

test('una venta por catálogo conserva campaña vigencia y plazo de entrega', () => {
  const vigenciaHasta = new Date('2026-09-30T23:59:59.000Z');
  const product = buildProduct({
    tipoComercializacion: 'venta-catalogo',
    catalogo: {
      nombre: 'Essen',
      campania: 'C9',
      vigenciaHasta,
      plazoEntrega: '7 a 15 días'
    }
  });

  assert.equal(product.validateSync(), undefined);
  assert.equal(product.catalogo.nombre, 'Essen');
  assert.equal(product.catalogo.campania, 'C9');
  assert.deepEqual(product.catalogo.vigenciaHasta, vigenciaHasta);
  assert.equal(product.catalogo.plazoEntrega, '7 a 15 días');
});
