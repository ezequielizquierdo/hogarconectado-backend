const fs = require('fs');
const path = require('path');

const catalogDirectory = path.join(__dirname, '..', 'data', 'essen-catalogo-c8-2026');
const manifestPath = path.join(catalogDirectory, 'manifest.json');

const formatCurrency = value => `$ ${Number(value).toLocaleString('es-AR')}`;

const validateProduct = (product, index) => {
  const errors = [];
  const label = `Producto ${index + 1}`;

  if (product.marca !== 'Essen') errors.push(`${label}: la marca debe ser Essen`);
  if (!product.modelo?.trim()) errors.push(`${label}: falta el modelo`);
  if (!product.codigo?.trim()) errors.push(`${label}: falta el código Essen`);
  if (!product.categoria?.startsWith('Essen · ')) errors.push(`${label}: categoría inválida`);
  if (!Number.isFinite(product.precioBase) || product.precioBase <= 0) errors.push(`${label}: precio base inválido`);
  if (product.porcentajeGanancia !== 0) errors.push(`${label}: la ganancia debe ser 0%`);

  const imagePath = path.join(catalogDirectory, product.imagenLocal || '');
  if (!product.imagenLocal || !fs.existsSync(imagePath)) errors.push(`${label}: imagen ausente`);

  return errors;
};

const run = () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const products = manifest.productos || [];
  const errors = products.flatMap(validateProduct);
  const categories = products.reduce((result, product) => {
    result[product.categoria] = (result[product.categoria] || 0) + 1;
    return result;
  }, {});
  const duplicateCodes = [...new Set(products.map(product => product.codigo).filter((code, index, codes) => codes.indexOf(code) !== index))];
  const reviewImages = products.filter(product => product.especificaciones?.otros?.requiereRevisionImagen);

  console.log(`Catálogo: ${manifest.catalogo}`);
  console.log(`Productos: ${products.length}`);
  console.log(`Rango de precios: ${formatCurrency(Math.min(...products.map(product => product.precioBase)))} a ${formatCurrency(Math.max(...products.map(product => product.precioBase)))}`);
  Object.entries(categories).forEach(([category, count]) => console.log(`- ${category}: ${count}`));

  if (duplicateCodes.length) {
    console.log(`Códigos repetidos en la fuente: ${duplicateCodes.join(', ')}`);
  }
  if (reviewImages.length) {
    console.log(`Imágenes pendientes de revisión: ${reviewImages.map(product => `${product.codigo} ${product.modelo}`).join(', ')}`);
  }

  if (products.length !== manifest.cantidad) errors.push('La cantidad declarada no coincide con el manifiesto');
  if (errors.length) {
    errors.forEach(error => console.error(`ERROR: ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log('Validación estructural completada. No se modificaron datos.');
};

run();

