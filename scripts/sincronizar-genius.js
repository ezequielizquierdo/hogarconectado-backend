const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const XLSX = require('xlsx');
const { EJSON } = require('bson');

const rootDirectory = path.join(__dirname, '..');
const requestedEnvFile = process.env.ENV_FILE;
const defaultEnvFile = fs.existsSync(path.join(rootDirectory, '.env.atlas')) ? '.env.atlas' : '.env';
dotenv.config({ path: path.resolve(rootDirectory, requestedEnvFile || defaultEnvFile) });

const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const {
  buildGeniusCreateDocument,
  buildGeniusSyncPlan,
  buildGeniusUpdateSet,
  buildMissingProductUpdate,
  normalizeText
} = require('../utils/geniusCatalogSync');

const argumentsList = process.argv.slice(2);
const argumentsSet = new Set(argumentsList);
const argumentValue = name => argumentsList.find(argument => argument.startsWith(`${name}=`))?.slice(name.length + 1);
const execute = argumentsSet.has('--execute');
const excelPath = argumentValue('--file');
const confirmedDatabase = argumentValue('--confirm-db');
const confirmedHash = argumentValue('--confirm-sha256');
const confirmedPlan = argumentValue('--confirm-plan');

function requireArguments() {
  if (!execute) throw new Error('La sincronización real exige --execute');
  if (!excelPath) throw new Error('Falta --file=/ruta/planilla.xlsx');
  if (!confirmedDatabase) throw new Error('Falta --confirm-db=<nombre exacto>');
  if (!confirmedHash) throw new Error('Falta --confirm-sha256=<huella exacta>');
  if (!confirmedPlan) throw new Error('Falta --confirm-plan=<conteos exactos>');
  if (!process.env.MONGODB_URI) throw new Error('Falta MONGODB_URI');
  if (!fs.existsSync(path.resolve(excelPath))) throw new Error('No se encontró la planilla indicada');
}

function sourceHash() {
  return crypto.createHash('sha256').update(fs.readFileSync(path.resolve(excelPath))).digest('hex');
}

function loadRows() {
  const workbook = XLSX.readFile(path.resolve(excelPath), { cellDates: true });
  const sheetName = workbook.SheetNames.find(name => name.trim().toLocaleUpperCase('es') === 'NEW QUEBRA');
  if (!sheetName) throw new Error('La planilla no contiene la pestaña NEW QUEBRA');
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null, raw: true });
}

function planConfirmation(summary) {
  return [
    summary.creates,
    summary.updates,
    summary.conflicts,
    summary.excludedByCondition + summary.excludedByCurrency,
    summary.invalidRows,
    summary.categoriesToCreate,
    summary.missingFromSpreadsheet
  ].join(':');
}

function validateConfirmation(plan, hash) {
  if (hash !== confirmedHash) throw new Error('La huella SHA-256 no coincide con la planilla autorizada');
  const actualPlan = planConfirmation(plan.summary);
  if (actualPlan !== confirmedPlan) {
    throw new Error(`El plan cambió. Se esperaba ${confirmedPlan} y se obtuvo ${actualPlan}`);
  }
}

async function readCurrentState(session) {
  const productQuery = Producto.find({})
    .select('_id categoria marca modelo precioBase precioGenius moneda propietario porcentajeGanancia descuento stock imagenes imagenPublicIds tipoComercializacion catalogo especificaciones activo tags sincronizacionGenius createdAt updatedAt')
    .populate('categoria', 'nombre')
    .lean();
  const categoryQuery = Categoria.find({}).select('_id nombre descripcion activa icono createdAt updatedAt').lean();
  if (session) {
    productQuery.session(session);
    categoryQuery.session(session);
  }
  return Promise.all([productQuery, categoryQuery]);
}

async function readBackupState() {
  return Promise.all([
    Producto.collection.find({}).toArray(),
    Categoria.collection.find({}).toArray()
  ]);
}

async function writeBackup(databaseName, products, categories, hash, plan) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDirectory = path.join(rootDirectory, 'backups', 'genius');
  const backupPath = path.join(backupDirectory, `${databaseName}-${timestamp}.json`);
  const contents = {
    databaseName,
    createdAt: new Date(),
    sourceFile: path.basename(excelPath),
    sourceSha256: hash,
    confirmedPlan: planConfirmation(plan.summary),
    collections: { productos: products, categorias: categories }
  };
  fs.mkdirSync(backupDirectory, { recursive: true });
  fs.writeFileSync(backupPath, EJSON.stringify(contents, { relaxed: false, indent: 2 }));
  if (fs.statSync(backupPath).size === 0) throw new Error('El respaldo quedó vacío');
  return backupPath;
}

function categoryMap(categories) {
  return new Map(categories.map(category => [normalizeText(category.nombre), category]));
}

async function ensureCategories(plan, categories, session) {
  const map = categoryMap(categories);
  let created = 0;
  for (const name of plan.categoriesToCreate) {
    const [category] = await Categoria.create([{
      nombre: name,
      descripcion: `Productos ${name} provistos por Genius`,
      icono: 'inventory-2',
      activa: true
    }], { session });
    map.set(normalizeText(name), category);
    created += 1;
  }
  return { map, created };
}

async function applyPlan(plan, categories, synchronizedAt, session) {
  const ensuredCategories = await ensureCategories(plan, categories, session);
  const operations = [];

  for (const source of plan.creates) {
    const category = ensuredCategories.map.get(normalizeText(source.categoria));
    if (!category) throw new Error(`No se resolvió la categoría ${source.categoria}`);
    operations.push({ insertOne: { document: buildGeniusCreateDocument(source, category._id, synchronizedAt) } });
  }

  for (const item of plan.updates) {
    const category = ensuredCategories.map.get(normalizeText(item.source.categoria));
    if (!category) throw new Error(`No se resolvió la categoría ${item.source.categoria}`);
    operations.push({
      updateOne: {
        filter: { _id: item.current._id },
        update: { $set: buildGeniusUpdateSet(item.source, category._id, synchronizedAt) }
      }
    });
  }

  for (const product of plan.missingFromSpreadsheet) {
    operations.push({
      updateOne: {
        filter: { _id: product._id },
        update: { $set: buildMissingProductUpdate(product, synchronizedAt) }
      }
    });
  }

  const result = operations.length
    ? await Producto.bulkWrite(operations, { ordered: true, session })
    : null;
  const expectedMatches = plan.summary.updates + plan.summary.missingFromSpreadsheet;
  if (
    result
    && (result.insertedCount !== plan.summary.creates || result.matchedCount !== expectedMatches)
  ) {
    throw new Error(`La escritura no coincidió con el plan: altas ${result.insertedCount}/${plan.summary.creates}, coincidencias ${result.matchedCount}/${expectedMatches}`);
  }
  return { result, createdCategories: ensuredCategories.created };
}

async function verifyResult(plan, synchronizedAt, session) {
  const queries = [
    Producto.countDocuments({ 'sincronizacionGenius.ultimaSincronizacion': synchronizedAt, 'sincronizacionGenius.presenteEnUltimaPlanilla': true }),
    Producto.countDocuments({ 'sincronizacionGenius.ultimaSincronizacion': synchronizedAt, 'sincronizacionGenius.presenteEnUltimaPlanilla': false }),
    Producto.countDocuments({
      'sincronizacionGenius.ultimaSincronizacion': synchronizedAt,
      'sincronizacionGenius.presenteEnUltimaPlanilla': true,
      $expr: { $ne: ['$precioBase', '$precioGenius'] }
    })
  ];
  if (session) queries.forEach(query => query.session(session));
  const [synchronizedProducts, missingProducts, priceMismatches] = await Promise.all(queries);
  const expectedSynchronized = plan.summary.creates + plan.summary.updates;
  if (
    synchronizedProducts !== expectedSynchronized
    || missingProducts !== plan.summary.missingFromSpreadsheet
    || priceMismatches !== 0
  ) {
    throw new Error(`Verificación fallida: sincronizados ${synchronizedProducts}/${expectedSynchronized}, ausentes ${missingProducts}/${plan.summary.missingFromSpreadsheet}, precios inconsistentes ${priceMismatches}`);
  }
  return { synchronizedProducts, missingProducts, priceMismatches };
}

async function run() {
  requireArguments();
  const rows = loadRows();
  const hash = sourceHash();

  await mongoose.connect(process.env.MONGODB_URI, { autoCreate: false, autoIndex: false });
  const databaseName = mongoose.connection.name;
  if (databaseName !== confirmedDatabase) {
    throw new Error(`Base rechazada: se esperaba confirmación explícita para "${databaseName}"`);
  }

  const [initialProducts, initialCategories] = await readCurrentState();
  const initialPlan = buildGeniusSyncPlan(rows, initialProducts, initialCategories);
  validateConfirmation(initialPlan, hash);
  const [backupProducts, backupCategories] = await readBackupState();
  const backupPath = await writeBackup(databaseName, backupProducts, backupCategories, hash, initialPlan);
  console.log(`Respaldo creado: ${backupPath}`);

  const synchronizedAt = new Date();
  const session = await mongoose.startSession();
  let transactionResult;
  let transactionVerification;
  try {
    await session.withTransaction(async () => {
      const [products, categories] = await readCurrentState(session);
      const plan = buildGeniusSyncPlan(rows, products, categories);
      validateConfirmation(plan, hash);
      transactionResult = await applyPlan(plan, categories, synchronizedAt, session);
      transactionVerification = await verifyResult(plan, synchronizedAt, session);
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' }
    });
  } finally {
    await session.endSession();
  }

  const verification = await verifyResult(initialPlan, synchronizedAt);
  console.log('Sincronización Genius completada.');
  console.log(`Base: ${databaseName}`);
  console.log(`Categorías creadas: ${transactionResult.createdCategories}`);
  console.log(`Productos creados: ${initialPlan.summary.creates}`);
  console.log(`Productos actualizados: ${initialPlan.summary.updates}`);
  console.log(`Precios base verificados: ${transactionVerification.synchronizedProducts - transactionVerification.priceMismatches}`);
  console.log(`Productos marcados para revisión: ${verification.missingProducts}`);
  console.log(`Conflictos omitidos: ${initialPlan.summary.conflicts}`);
  console.log(`Filas excluidas: ${initialPlan.summary.excludedByCondition + initialPlan.summary.excludedByCurrency}`);
  console.log(`Filas inválidas: ${initialPlan.summary.invalidRows}`);
  console.log(`Respaldo: ${backupPath}`);
}

run()
  .catch(error => {
    console.error(`No se pudo completar la sincronización: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
