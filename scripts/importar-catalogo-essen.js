const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const rootDirectory = path.join(__dirname, '..');
const catalogDirectory = path.join(rootDirectory, 'data', 'essen-catalogo-c9-2026');
const manifestPath = path.join(catalogDirectory, 'manifest.json');
const requestedEnvFile = process.env.ENV_FILE;
const defaultEnvFile = fs.existsSync(path.join(rootDirectory, '.env.atlas')) ? '.env.atlas' : '.env';
const envFile = path.resolve(rootDirectory, requestedEnvFile || defaultEnvFile);

dotenv.config({ path: envFile });

const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const { uploadBuffer, deleteAsset, isConfigured: cloudinaryConfigured } = require('../services/imageStorage');

const argumentsSet = new Set(process.argv.slice(2));
const execute = argumentsSet.has('--execute');
const confirmedDatabaseArgument = process.argv.find(argument => argument.startsWith('--confirm-db='));
const confirmedDatabase = confirmedDatabaseArgument?.slice('--confirm-db='.length);

const readManifest = () => JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const validateManifest = manifest => {
  const products = manifest.productos || [];
  const errors = [];

  if (!products.length || products.length !== manifest.cantidad) {
    errors.push('La cantidad declarada no coincide con los productos del manifiesto');
  }

  products.forEach((product, index) => {
    const prefix = `Producto ${index + 1}`;
    if (product.marca !== 'Essen') errors.push(`${prefix}: marca inválida`);
    if (!product.modelo?.trim()) errors.push(`${prefix}: falta el modelo`);
    if (!product.codigo?.trim()) errors.push(`${prefix}: falta el código`);
    if (!product.categoria?.startsWith('Essen · ')) errors.push(`${prefix}: categoría inválida`);
    if (!Number.isFinite(product.precioBase) || product.precioBase <= 0) errors.push(`${prefix}: precio inválido`);
    if (product.porcentajeGanancia !== 0) errors.push(`${prefix}: la ganancia debe ser 0%`);
    if (!product.imagenLocal || !fs.existsSync(path.join(catalogDirectory, product.imagenLocal))) {
      errors.push(`${prefix}: imagen local ausente`);
    }
  });

  return errors;
};

const writeBackup = async databaseName => {
  const existingProducts = await Producto.find({ marca: /^Essen$/i }).lean();
  const categoryNames = [...new Set(existingProducts.map(product => product.categoria?.toString()).filter(Boolean))];
  const categories = categoryNames.length
    ? await Categoria.find({ _id: { $in: categoryNames } }).lean()
    : [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDirectory = path.join(rootDirectory, 'backups', 'essen');
  const backupPath = path.join(backupDirectory, `${databaseName}-${timestamp}.json`);

  fs.mkdirSync(backupDirectory, { recursive: true });
  fs.writeFileSync(backupPath, JSON.stringify({ databaseName, createdAt: new Date(), categories, products: existingProducts }, null, 2));
  return backupPath;
};

const getOrCreateCategory = async name => {
  let category = await Categoria.findOne({ nombre: name });
  if (category) {
    if (!category.activa) {
      category.activa = true;
      await category.save();
    }
    return { category, created: false };
  }

  category = await Categoria.create({
    nombre: name,
    descripcion: `Productos ${name.replace('Essen · ', '')} de Essen`,
    icono: 'restaurant-menu',
    activa: true,
  });
  return { category, created: true };
};

const findExistingProduct = async (source, category) => {
  const sameCategory = await Producto.findOne({
    marca: 'Essen',
    categoria: category._id,
    $or: [
      { 'especificaciones.otros.codigoEssen': source.codigo },
      { modelo: source.modelo },
    ],
  });
  if (sameCategory) return sameCategory;

  const sameModel = await Producto.findOne({ marca: 'Essen', modelo: source.modelo });
  if (sameModel) return sameModel;

  const sameCode = await Producto.find({
    marca: 'Essen',
    'especificaciones.otros.codigoEssen': source.codigo,
  }).limit(2);
  return sameCode.length === 1 ? sameCode[0] : null;
};

const syncProduct = async (source, category) => {
  const existing = await findExistingProduct(source, category);
  if (existing) {
    existing.set({
      categoria: category._id,
      marca: source.marca,
      modelo: source.modelo,
      precioBase: source.precioBase,
      porcentajeGanancia: 0,
      descripcion: source.descripcion,
      especificaciones: source.especificaciones,
      activo: true,
      tags: source.tags,
    });
    const changed = existing.isModified();
    if (changed) await existing.save();
    return { status: changed ? 'updated' : 'unchanged', product: existing };
  }

  const imagePath = path.join(catalogDirectory, source.imagenLocal);
  const upload = await uploadBuffer(fs.readFileSync(imagePath));

  try {
    const product = await Producto.create({
      categoria: category._id,
      marca: source.marca,
      modelo: source.modelo,
      precioBase: source.precioBase,
      porcentajeGanancia: 0,
      descripcion: source.descripcion,
      imagenes: [upload.url],
      imagenPublicIds: [upload.publicId],
      especificaciones: source.especificaciones,
      stock: { cantidad: 0, disponible: false },
      activo: true,
      tags: source.tags,
    });
    return { status: 'created', product };
  } catch (error) {
    await deleteAsset(upload.publicId).catch(() => false);
    throw error;
  }
};

const run = async () => {
  const manifest = readManifest();
  const errors = validateManifest(manifest);
  if (errors.length) throw new Error(`El manifiesto no es válido:\n${errors.join('\n')}`);

  console.log(`Catálogo validado: ${manifest.productos.length} productos e imágenes.`);

  if (!execute) {
    console.log('Simulación completada. No se conectó a MongoDB ni se subieron imágenes.');
    console.log('La ejecución real exige --execute y --confirm-db=<nombre exacto>.');
    return;
  }

  if (!process.env.MONGODB_URI) throw new Error('Falta MONGODB_URI');
  if (!confirmedDatabase) throw new Error('Falta --confirm-db=<nombre exacto>');
  if (!cloudinaryConfigured) throw new Error('Cloudinary no está configurado');

  await mongoose.connect(process.env.MONGODB_URI);
  const databaseName = mongoose.connection.name;
  if (databaseName !== confirmedDatabase) {
    throw new Error(`Base rechazada: se esperaba confirmación explícita para "${databaseName}"`);
  }

  const backupPath = await writeBackup(databaseName);
  console.log(`Respaldo creado: ${backupPath}`);

  const categoryMap = new Map();
  let createdCategories = 0;
  for (const name of [...new Set(manifest.productos.map(product => product.categoria))]) {
    const result = await getOrCreateCategory(name);
    categoryMap.set(name, result.category);
    if (result.created) createdCategories += 1;
  }

  const totals = { created: 0, updated: 0, unchanged: 0 };
  const synchronizedIds = [];
  for (const [index, source] of manifest.productos.entries()) {
    const result = await syncProduct(source, categoryMap.get(source.categoria));
    totals[result.status] += 1;
    synchronizedIds.push(result.product._id);
    console.log(`[${index + 1}/${manifest.productos.length}] ${result.status}: ${source.codigo} ${source.modelo}`);
  }

  const retired = await Producto.updateMany({
    _id: { $nin: synchronizedIds },
    marca: /^Essen$/i,
    'especificaciones.otros.catalogo': /^C8\b/,
    activo: true,
  }, { $set: { activo: false } });

  console.log(`Actualización finalizada. Categorías creadas: ${createdCategories}. Productos creados: ${totals.created}. Actualizados: ${totals.updated}. Sin cambios: ${totals.unchanged}. Retirados del catálogo: ${retired.modifiedCount}.`);
};

run()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
