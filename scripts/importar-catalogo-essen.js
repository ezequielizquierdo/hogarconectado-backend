const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const rootDirectory = path.join(__dirname, '..');
const catalogDirectory = path.join(rootDirectory, 'data', 'essen-catalogo-c8-2026');
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

const importProduct = async (source, category) => {
  const existing = await Producto.findOne({
    marca: 'Essen',
    modelo: source.modelo,
    categoria: category._id,
  });
  if (existing) return { status: 'skipped', product: existing };

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

  console.log(`Catálogo validado: ${manifest.productos.length} productos y 84 imágenes.`);

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

  let createdProducts = 0;
  let skippedProducts = 0;
  for (const [index, source] of manifest.productos.entries()) {
    const result = await importProduct(source, categoryMap.get(source.categoria));
    if (result.status === 'created') createdProducts += 1;
    else skippedProducts += 1;
    console.log(`[${index + 1}/${manifest.productos.length}] ${result.status}: ${source.codigo} ${source.modelo}`);
  }

  console.log(`Importación finalizada. Categorías creadas: ${createdCategories}. Productos creados: ${createdProducts}. Omitidos: ${skippedProducts}.`);
};

run()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });

