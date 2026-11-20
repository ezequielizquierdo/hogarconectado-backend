const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildGeniusCreateDocument,
  buildGeniusUpdateSet,
  buildNewArrivalMarker,
  buildMissingProductUpdate,
  buildGeniusSyncPlan,
  canonicalCategory,
  normalizeGeniusRow,
  normalizeStock,
  parsePrice
} = require('../utils/geniusCatalogSync');

test('normaliza precio, modelo numérico, categoría y stock Genius', () => {
  const result = normalizeGeniusRow({
    PRODUCTO: 'Bicibleta',
    MARCA: ' Marca ',
    MODELO: 12345,
    PRECIO: 100000,
    STOCK: -2,
    'FECHA PRECIO': new Date('2026-10-15T03:00:00.000Z')
  }, 8);

  assert.equal(result.valid, true);
  assert.equal(result.categoria, 'Bicicletas');
  assert.equal(result.modelo, '12345');
  assert.equal(result.precioGenius, 100000);
  assert.equal(result.precioBase, 100000);
  assert.equal(result.moneda, 'ARS');
  assert.equal(result.porcentajeGanancia, 10);
  assert.equal(result.propietario, 'Genius');
  assert.deepEqual(result.stock, { cantidad: 0, disponible: false });
  assert.equal(result.sincronizacionGenius.stockInformado, -2);
});

test('usa el precio Genius como precio base sin recargo adicional', () => {
  const plan = buildGeniusSyncPlan([
    { PRODUCTO: 'Heladera', MARCA: 'Marca', MODELO: 'BASE', PRECIO: 123456, STOCK: 1 }
  ]);

  assert.equal(plan.creates[0].precioGenius, 123456);
  assert.equal(plan.creates[0].precioBase, 123456);
  assert.equal(plan.rules.baseSurchargePercentage, 0);
});

test('conserva precios USD y convierte stock positivo a disponibilidad', () => {
  assert.deepEqual(parsePrice('845usd'), { amount: 845, currency: 'USD' });
  assert.deepEqual(normalizeStock(3.8), { cantidad: 3, disponible: true, informado: 3.8 });
});

test('excluye de la sincronización los productos cuyo precio no está en ARS', () => {
  const plan = buildGeniusSyncPlan([
    { PRODUCTO: 'Notebook', MARCA: 'Dell', MODELO: 'USD1', PRECIO: '845 USD', STOCK: 1 },
    { PRODUCTO: 'Notebook', MARCA: 'Dell', MODELO: 'ARS1', PRECIO: 845000, STOCK: 1 }
  ]);

  assert.equal(plan.summary.validRows, 1);
  assert.equal(plan.summary.excludedByCurrency, 1);
  assert.equal(plan.summary.creates, 1);
  assert.equal(plan.excludedRows[0].modelo, 'USD1');
  assert.deepEqual(plan.excludedRows[0].exclusionReasons, ['Moneda no admitida: USD']);
});

test('usa categorías existentes del criterio de Hogar Conectado', () => {
  assert.equal(canonicalCategory('Televisor'), 'Smart TV');
  assert.equal(canonicalCategory('Parlante'), 'Audio');
  assert.equal(canonicalCategory('Bateria de Cocina'), 'Baterías de cocina');
  assert.equal(canonicalCategory('Producto Especial'), 'Producto Especial');
});

test('excluye productos reparados o con embalaje abierto sin tratarlos como inválidos', () => {
  const rows = [
    { PRODUCTO: 'Heladera', MARCA: 'Marca', MODELO: 'OK', PRECIO: 100, STOCK: 1, DETALLE: 'No frost' },
    { PRODUCTO: 'Heladera', MARCA: 'Marca', MODELO: 'R1', PRECIO: 90, STOCK: 1, DETALLE: 'REPARADA' },
    { PRODUCTO: 'Heladera', MARCA: 'Marca', MODELO: 'R2', PRECIO: 80, STOCK: 1, DETALLE: 'EMBALAJE ABIERTO' },
    { PRODUCTO: 'Heladera', MARCA: 'Marca', MODELO: 'R3', PRECIO: 70, STOCK: 1, DETALLE: 'Full open box' },
    { PRODUCTO: 'Heladera', MARCA: 'Marca', MODELO: 'R4', PRECIO: null, STOCK: 1, DETALLE: 'CAJA ABIERTA' }
  ];
  const plan = buildGeniusSyncPlan(rows, [], [{ nombre: 'Heladeras' }]);

  assert.equal(plan.summary.validRows, 1);
  assert.equal(plan.summary.excludedByCondition, 4);
  assert.equal(plan.summary.excludedByCurrency, 0);
  assert.equal(plan.summary.invalidRows, 0);
  assert.equal(plan.creates[0].modelo, 'OK');
});

test('clasifica altas, actualizaciones, conflictos, categorías nuevas y ausentes', () => {
  const rows = [
    { PRODUCTO: 'Heladera', MARCA: 'Samsung', MODELO: 'RT1', PRECIO: 100, STOCK: 2 },
    { PRODUCTO: 'Producto Especial', MARCA: 'Nueva', MODELO: 'N1', PRECIO: 200, STOCK: 0 },
    { PRODUCTO: 'Audio', MARCA: 'Duplicada', MODELO: 'D1', PRECIO: 300, STOCK: 1 },
    { PRODUCTO: 'Audio', MARCA: 'Duplicada', MODELO: 'D1', PRECIO: 350, STOCK: 1 },
    { PRODUCTO: 'Heladera', MARCA: '', MODELO: 'INVALIDO', PRECIO: 100, STOCK: 1 }
  ];
  const products = [
    { _id: 'actual', marca: 'SAMSUNG', modelo: 'rt1', categoria: { nombre: 'Heladeras' } },
    { _id: 'ausente', marca: 'LG', modelo: 'OLD', categoria: { nombre: 'Heladeras' } },
    { _id: 'essen', marca: 'Essen', modelo: 'Cacerola', catalogo: { nombre: 'Essen' } }
  ];
  const categories = [{ nombre: 'Heladeras' }, { nombre: 'Audio' }];
  const plan = buildGeniusSyncPlan(rows, products, categories);

  assert.equal(plan.summary.validRows, 4);
  assert.equal(plan.summary.invalidRows, 1);
  assert.equal(plan.summary.creates, 1);
  assert.equal(plan.summary.updates, 1);
  assert.equal(plan.summary.conflicts, 1);
  assert.equal(plan.summary.categoriesToCreate, 1);
  assert.equal(plan.summary.missingFromSpreadsheet, 1);
  assert.equal(plan.summary.essenExcluded, 1);
  assert.deepEqual(plan.categoriesToCreate, ['Producto Especial']);
  assert.equal(plan.missingFromSpreadsheet[0]._id, 'ausente');
});

test('construye altas Genius con el precio, stock y margen acordados', () => {
  const synchronizedAt = new Date('2026-10-19T12:00:00.000Z');
  const source = normalizeGeniusRow({
    PRODUCTO: 'Heladera', MARCA: 'Marca', MODELO: 'NUEVO', PRECIO: 100000,
    STOCK: 2, DETALLE: 'No frost', COLOR: 'Blanco'
  }, 7);
  const document = buildGeniusCreateDocument(source, 'category-id', synchronizedAt);

  assert.equal(document.precioGenius, 100000);
  assert.equal(document.precioBase, 100000);
  assert.equal(document.porcentajeGanancia, 10);
  assert.equal(document.propietario, 'Genius');
  assert.deepEqual(document.stock, { cantidad: 2, disponible: true });
  assert.deepEqual(document.nuevoIngreso, {
    activo: true,
    tipo: 'alta',
    detectadoEn: synchronizedAt
  });
  assert.deepEqual(document.imagenes, []);
  assert.equal(document.sincronizacionGenius.ultimaSincronizacion, synchronizedAt);
});

test('una actualización Genius no reemplaza imágenes ni campos comerciales propios', () => {
  const synchronizedAt = new Date('2026-10-19T12:00:00.000Z');
  const source = normalizeGeniusRow({
    PRODUCTO: 'Heladera', MARCA: 'Marca', MODELO: 'ACTUAL', PRECIO: 200000,
    STOCK: 0, DETALLE: 'Descripción nueva', COLOR: 'Negro'
  }, 8);
  const update = buildGeniusUpdateSet(source, 'category-id', synchronizedAt, {
    stock: { cantidad: 4, disponible: true }
  });

  assert.equal(update.precioBase, 200000);
  assert.deepEqual(update.stock, { cantidad: 0, disponible: false });
  assert.equal(update['especificaciones.color'], 'Negro');
  assert.equal(Object.hasOwn(update, 'imagenes'), false);
  assert.equal(Object.hasOwn(update, 'descuento'), false);
  assert.equal(Object.hasOwn(update, 'porcentajeGanancia'), false);
  assert.equal(Object.hasOwn(update, 'tipoComercializacion'), false);
  assert.deepEqual(update.nuevoIngreso, { activo: false });
});

test('señala como nuevo ingreso una reposición y no un producto que ya estaba disponible', () => {
  const synchronizedAt = new Date('2026-11-20T12:00:00.000Z');
  const source = { stock: { cantidad: 3, disponible: true } };

  assert.deepEqual(
    buildNewArrivalMarker(source, { stock: { cantidad: 0, disponible: false } }, synchronizedAt),
    { activo: true, tipo: 'reposicion', detectadoEn: synchronizedAt }
  );
  assert.deepEqual(
    buildNewArrivalMarker(source, { stock: { cantidad: 1, disponible: true } }, synchronizedAt),
    { activo: false }
  );
  assert.deepEqual(
    buildNewArrivalMarker({ stock: { cantidad: 0, disponible: false } }, null, synchronizedAt),
    { activo: false }
  );
});

test('resume cuántas altas disponibles y reposiciones recibirán la referencia de nuevo ingreso', () => {
  const plan = buildGeniusSyncPlan([
    { PRODUCTO: 'Heladera', MARCA: 'Nueva', MODELO: 'ALTA', PRECIO: 100, STOCK: 2 },
    { PRODUCTO: 'Heladera', MARCA: 'Vieja', MODELO: 'REPONE', PRECIO: 100, STOCK: 1 },
    { PRODUCTO: 'Heladera', MARCA: 'Vieja', MODELO: 'CONTINUA', PRECIO: 100, STOCK: 3 }
  ], [
    { _id: 'repone', marca: 'Vieja', modelo: 'REPONE', stock: { cantidad: 0, disponible: false } },
    { _id: 'continua', marca: 'Vieja', modelo: 'CONTINUA', stock: { cantidad: 2, disponible: true } }
  ]);

  assert.equal(plan.summary.newAvailableProducts, 1);
  assert.equal(plan.summary.restockedProducts, 1);
  assert.equal(plan.summary.newArrivalMarkers, 2);
});

test('marca productos ausentes sin desactivarlos y conserva la primera fecha', () => {
  const synchronizedAt = new Date('2026-10-19T12:00:00.000Z');
  const previousDate = new Date('2026-09-01T12:00:00.000Z');
  const update = buildMissingProductUpdate({
    sincronizacionGenius: { noEncontradoDesde: previousDate }
  }, synchronizedAt);

  assert.equal(update['sincronizacionGenius.presenteEnUltimaPlanilla'], false);
  assert.equal(update['sincronizacionGenius.noEncontradoDesde'], previousDate);
  assert.equal(Object.hasOwn(update, 'activo'), false);
});
