const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const XLSX = require('xlsx');

const rootDirectory = path.join(__dirname, '..');
const requestedEnvFile = process.env.ENV_FILE;
const defaultEnvFile = fs.existsSync(path.join(rootDirectory, '.env.atlas')) ? '.env.atlas' : '.env';
dotenv.config({ path: path.resolve(rootDirectory, requestedEnvFile || defaultEnvFile) });

const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const { buildGeniusSyncPlan } = require('../utils/geniusCatalogSync');

const argumentsList = process.argv.slice(2);
const argumentValue = name => argumentsList.find(argument => argument.startsWith(`${name}=`))?.slice(name.length + 1);
const excelPath = argumentValue('--file');
const confirmedDatabase = argumentValue('--confirm-db');
const requestedOutput = argumentValue('--output');

function requireArguments() {
  if (!excelPath) throw new Error('Falta --file=/ruta/planilla.xlsx');
  if (!confirmedDatabase) throw new Error('Falta --confirm-db=<nombre exacto>');
  if (!process.env.MONGODB_URI) throw new Error('Falta MONGODB_URI');
  if (!fs.existsSync(path.resolve(excelPath))) throw new Error('No se encontró la planilla indicada');
}

function loadRows() {
  const workbook = XLSX.readFile(path.resolve(excelPath), { cellDates: true });
  const sheetName = workbook.SheetNames.find(name => name.trim().toLocaleUpperCase('es') === 'NEW QUEBRA');
  if (!sheetName) throw new Error('La planilla no contiene la pestaña NEW QUEBRA');
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null, raw: true });
}

function productSummary(product) {
  return {
    _id: product._id?.toString?.() || product._id,
    categoria: typeof product.categoria === 'string' ? product.categoria : product.categoria?.nombre,
    marca: product.marca,
    modelo: product.modelo,
    precioBase: product.precioBase,
    precioGenius: product.precioGenius,
    moneda: product.moneda,
    propietario: product.propietario,
    stock: product.stock,
    imagenes: Array.isArray(product.imagenes) ? product.imagenes.length : 0,
    presenteEnUltimaPlanilla: product.sincronizacionGenius?.presenteEnUltimaPlanilla
  };
}

function reportShape(plan, databaseName, categories) {
  return {
    generatedAt: plan.generatedAt,
    databaseName,
    mode: 'dry-run-read-only',
    rules: plan.rules,
    summary: plan.summary,
    existingCategories: categories.map(category => category.nombre).sort((left, right) => left.localeCompare(right, 'es')),
    categoriesToCreate: plan.categoriesToCreate,
    creates: plan.creates,
    updates: plan.updates.map(item => ({
      source: item.source,
      current: productSummary(item.current)
    })),
    conflicts: plan.conflicts.map(item => ({
      key: item.key,
      reason: item.reason,
      source: item.source,
      current: item.current.map(productSummary)
    })),
    excludedRows: plan.excludedRows,
    invalidRows: plan.invalidRows,
    missingFromSpreadsheet: plan.missingFromSpreadsheet.map(productSummary)
  };
}

async function run() {
  requireArguments();
  const rows = loadRows();

  await mongoose.connect(process.env.MONGODB_URI, {
    autoCreate: false,
    autoIndex: false
  });
  const databaseName = mongoose.connection.name;
  if (databaseName !== confirmedDatabase) {
    throw new Error(`Base rechazada: se esperaba confirmación explícita para "${databaseName}"`);
  }

  const [products, categories] = await Promise.all([
    Producto.find({})
      .select('_id categoria marca modelo precioBase precioGenius moneda propietario stock imagenes tipoComercializacion catalogo sincronizacionGenius')
      .populate('categoria', 'nombre')
      .lean(),
    Categoria.find({}).select('_id nombre activa').lean()
  ]);
  const plan = buildGeniusSyncPlan(rows, products, categories);
  const report = reportShape(plan, databaseName, categories);
  const defaultOutput = path.join('/tmp', `simulacion-genius-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  const outputPath = path.resolve(requestedOutput || defaultOutput);
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log('Simulación Genius completada en modo de solo lectura.');
  console.log(`Base verificada: ${databaseName}`);
  console.log(`Filas válidas: ${report.summary.validRows}`);
  console.log(`Productos nuevos: ${report.summary.creates}`);
  console.log(`Productos a actualizar: ${report.summary.updates}`);
  console.log(`Conflictos para revisión: ${report.summary.conflicts}`);
  console.log(`Excluidos por condición especial: ${report.summary.excludedByCondition}`);
  console.log(`Excluidos por moneda no admitida: ${report.summary.excludedByCurrency}`);
  console.log(`Categorías a crear: ${report.summary.categoriesToCreate}`);
  console.log(`No encontrados en la planilla: ${report.summary.missingFromSpreadsheet}`);
  console.log(`Productos Essen excluidos: ${report.summary.essenExcluded}`);
  console.log(`Reporte: ${outputPath}`);
  console.log('No se modificaron productos, categorías ni índices de MongoDB.');
}

run()
  .catch(error => {
    console.error(`No se pudo completar la simulación: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
