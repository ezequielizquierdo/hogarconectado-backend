const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { EJSON } = require('bson');

const rootDirectory = path.join(__dirname, '..');
const argumentsList = process.argv.slice(2);
const argumentsSet = new Set(argumentsList);
const argumentValue = name => argumentsList.find(argument => argument.startsWith(`${name}=`))?.slice(name.length + 1);
const requestedManifest = argumentValue('--manifest');
const dataDirectory = path.join(rootDirectory, 'data');
const manifestPath = requestedManifest
  ? path.resolve(rootDirectory, requestedManifest)
  : path.join(dataDirectory, 'damaged-products-retirement-2026-11-20.json');
if (!manifestPath.startsWith(`${dataDirectory}${path.sep}`) || path.extname(manifestPath) !== '.json') {
  throw new Error('El manifiesto debe ser un archivo JSON dentro de data/');
}
const requestedEnvFile = process.env.ENV_FILE;
const defaultEnvFile = fs.existsSync(path.join(rootDirectory, '.env.atlas')) ? '.env.atlas' : '.env';
dotenv.config({ path: path.resolve(rootDirectory, requestedEnvFile || defaultEnvFile) });

const Producto = require('../models/Producto');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const planName = `retirar-productos-danados-${manifest.name}`;
const productsToRemove = manifest.excludedDamagedProducts;
const execute = argumentsSet.has('--execute');
const confirmedDatabase = argumentValue('--confirm-db');
const confirmedPlan = argumentValue('--confirm-plan');
const confirmedStateHash = argumentValue('--confirm-state-sha256');
const selectedFields = '_id marca modelo descripcion activo stock imagenes imagenPublicIds sincronizacionGenius updatedAt';

function normalizeCondition(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function requireArguments() {
  if (!process.env.MONGODB_URI) throw new Error('Falta MONGODB_URI');
  if (!confirmedDatabase) throw new Error('Falta --confirm-db=<nombre exacto>');
  if (execute && confirmedPlan !== planName) {
    throw new Error(`La ejecución real exige --confirm-plan=${planName}`);
  }
  if (execute && !confirmedStateHash) {
    throw new Error('La ejecución real exige --confirm-state-sha256=<huella de la simulación>');
  }
}

function validateManifest() {
  if (!Array.isArray(productsToRemove) || productsToRemove.length === 0) {
    throw new Error('El manifiesto no contiene productos dañados para retirar');
  }
  const ids = new Set();
  for (const item of productsToRemove) {
    if (!mongoose.isValidObjectId(item.id)) throw new Error(`ID inválido en el manifiesto: ${item.id}`);
    if (ids.has(item.id)) throw new Error(`ID duplicado en el manifiesto: ${item.id}`);
    ids.add(item.id);
    if (!item.marca || !item.modelo || !item.reason) {
      throw new Error(`Producto dañado incompleto en el manifiesto: ${item.id}`);
    }
  }
}

async function readProducts(session) {
  const query = Producto.find({ _id: { $in: productsToRemove.map(item => item.id) } })
    .select(selectedFields)
    .lean();
  if (session) query.session(session);
  return query;
}

function stateForHash(products) {
  const byId = new Map(products.map(product => [product._id.toString(), product]));
  return productsToRemove.map(item => {
    const product = byId.get(item.id);
    return product ? {
      id: item.id,
      marca: product.marca,
      modelo: product.modelo,
      descripcion: product.descripcion,
      activo: product.activo,
      stock: product.stock,
      imagenes: product.imagenes || [],
      imagenPublicIds: product.imagenPublicIds || [],
      updatedAt: product.updatedAt
    } : { id: item.id, missing: true };
  });
}

function hashState(products) {
  return crypto.createHash('sha256').update(JSON.stringify(stateForHash(products))).digest('hex');
}

function buildPlan(products) {
  const byId = new Map(products.map(product => [product._id.toString(), product]));
  const errors = [];
  for (const item of productsToRemove) {
    const product = byId.get(item.id);
    if (!product) {
      errors.push(`${item.id}: producto inexistente`);
      continue;
    }
    if (product.marca !== item.marca || product.modelo !== item.modelo) {
      errors.push(`${item.id}: identidad distinta (${product.marca} ${product.modelo})`);
    }
    if (product.activo !== true) errors.push(`${item.marca} ${item.modelo}: ya no está activo`);
    if (!normalizeCondition(product.descripcion).includes(normalizeCondition(item.reason))) {
      errors.push(`${item.marca} ${item.modelo}: la descripción ya no contiene "${item.reason}"`);
    }
  }
  if (errors.length > 0) {
    throw new Error(`El estado actual no coincide con el plan:\n- ${errors.join('\n- ')}`);
  }
  return {
    name: planName,
    stateSha256: hashState(products),
    products,
    operations: productsToRemove.map(item => ({
      id: item.id,
      marca: item.marca,
      modelo: item.modelo,
      reason: item.reason,
      set: {
        activo: false,
        'stock.disponible': false,
        'stock.cantidad': 0
      }
    }))
  };
}

function validateConfirmedState(plan) {
  if (plan.name !== confirmedPlan) throw new Error('El nombre del plan no coincide');
  if (plan.stateSha256 !== confirmedStateHash) {
    throw new Error(
      'El estado de los productos cambió desde la simulación. '
      + `Se esperaba ${confirmedStateHash} y se obtuvo ${plan.stateSha256}`
    );
  }
}

function backupPath(databaseName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(rootDirectory, 'backups', 'genius', `productos-danados-${databaseName}-${timestamp}.json`);
}

function writeBackup(databaseName, plan) {
  const outputPath = backupPath(databaseName);
  const contents = {
    databaseName,
    collection: Producto.collection.name,
    createdAt: new Date(),
    plan: plan.name,
    stateSha256: plan.stateSha256,
    products: plan.products
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, EJSON.stringify(contents, { relaxed: false, indent: 2 }));
  if (fs.statSync(outputPath).size === 0) throw new Error('El respaldo quedó vacío');
  return outputPath;
}

async function applyOperations(plan, session) {
  const operations = plan.operations.map(operation => ({
    updateOne: {
      filter: { _id: operation.id, activo: true },
      update: { $set: operation.set }
    }
  }));
  const result = await Producto.bulkWrite(operations, { ordered: true, session });
  if (result.matchedCount !== operations.length || result.modifiedCount !== operations.length) {
    throw new Error(
      `La escritura no coincidió con el plan: ${result.matchedCount}/${operations.length} coincidencias y `
      + `${result.modifiedCount}/${operations.length} modificaciones`
    );
  }
}

async function verifyResult() {
  const products = await readProducts();
  for (const product of products) {
    if (product.activo !== false || product.stock?.disponible !== false || Number(product.stock?.cantidad) !== 0) {
      throw new Error(`No se verificó el retiro de ${product.marca} ${product.modelo}`);
    }
  }
  if (products.length !== productsToRemove.length) throw new Error('La verificación no encontró todos los productos');
}

function printPlan(plan, databaseName) {
  console.log('Retiro de productos dañados preparado en modo de solo lectura.');
  console.log(`Base verificada: ${databaseName}`);
  console.log(`Colección: ${Producto.collection.name}`);
  console.log(`Plan: ${plan.name}`);
  console.log(`Huella del estado: ${plan.stateSha256}`);
  console.log(`Productos a retirar de la vidriera: ${plan.operations.length}`);
  for (const operation of plan.operations) {
    console.log(`- ${operation.marca} ${operation.modelo}: ${operation.reason}`);
  }
  console.log('No se modificó MongoDB.');
}

async function run() {
  requireArguments();
  validateManifest();
  await mongoose.connect(process.env.MONGODB_URI, { autoCreate: false, autoIndex: false });
  const databaseName = mongoose.connection.name;
  if (databaseName !== confirmedDatabase || databaseName !== manifest.database) {
    throw new Error(`Base rechazada: se esperaba confirmación explícita para "${manifest.database}"`);
  }
  if (Producto.collection.name !== manifest.collection) {
    throw new Error(`Colección rechazada: se esperaba "${manifest.collection}"`);
  }

  const plan = buildPlan(await readProducts());
  if (!execute) {
    printPlan(plan, databaseName);
    return;
  }

  validateConfirmedState(plan);
  const backup = writeBackup(databaseName, plan);
  console.log(`Respaldo creado: ${backup}`);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const currentPlan = buildPlan(await readProducts(session));
      validateConfirmedState(currentPlan);
      await applyOperations(currentPlan, session);
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' }
    });
  } finally {
    await session.endSession();
  }

  await verifyResult();
  console.log('Productos dañados retirados y verificados.');
  console.log(`Base: ${databaseName}`);
  console.log(`Colección: ${Producto.collection.name}`);
  console.log(`Productos retirados: ${productsToRemove.length}`);
  console.log(`Respaldo: ${backup}`);
}

if (require.main === module) {
  run()
    .catch(error => {
      console.error(`No se pudo retirar los productos dañados: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    });
}

module.exports = { buildPlan, hashState, validateManifest };
