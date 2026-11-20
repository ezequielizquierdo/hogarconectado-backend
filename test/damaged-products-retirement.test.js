const assert = require('node:assert/strict');
const test = require('node:test');

const manifest = require('../data/damaged-products-retirement-2026-11-20.json');
const {
  buildPlan,
  hashState
} = require('../scripts/retirar-productos-danados-genius');

function currentProducts() {
  return manifest.excludedDamagedProducts.map((item, index) => ({
    _id: item.id,
    marca: item.marca,
    modelo: item.modelo,
    descripcion: `Producto disponible (${item.reason.normalize('NFD').replace(/[\u0300-\u036f]/g, '')})`,
    activo: true,
    stock: { cantidad: index + 1, disponible: true },
    imagenes: [],
    imagenPublicIds: [],
    updatedAt: new Date(`2026-11-20T12:${String(index).padStart(2, '0')}:00.000Z`)
  }));
}

test('prepara el retiro reversible de los productos dañados', () => {
  const plan = buildPlan(currentProducts());

  assert.equal(plan.operations.length, manifest.excludedDamagedProducts.length);
  for (const operation of plan.operations) {
    assert.deepEqual(operation.set, {
      activo: false,
      'stock.disponible': false,
      'stock.cantidad': 0
    });
  }
});

test('rechaza el retiro si cambia la identidad o desaparece la condición informada', () => {
  const changedIdentity = currentProducts();
  changedIdentity[0].modelo = 'OTRO MODELO';
  assert.throws(() => buildPlan(changedIdentity), /identidad distinta/);

  const changedCondition = currentProducts();
  changedCondition[0].descripcion = 'Producto sin observaciones';
  assert.throws(() => buildPlan(changedCondition), /la descripción ya no contiene/);
});

test('la huella cambia si el estado del producto cambia', () => {
  const products = currentProducts();
  const originalHash = hashState(products);
  products[0].stock.cantidad = 99;

  assert.notEqual(hashState(products), originalHash);
});
