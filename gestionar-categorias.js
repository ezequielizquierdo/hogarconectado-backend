const mongoose = require('mongoose');
const Categoria = require('./models/Categoria');

// Función para agregar una nueva categoría
async function agregarCategoria(nombre, descripcion, icono) {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('✅ Conectado a MongoDB');
    
    // Verificar si ya existe
    const existe = await Categoria.findOne({ 
      nombre: { $regex: new RegExp(`^${nombre}$`, 'i') } 
    });
    
    if (existe) {
      console.log(`⏭️ La categoría "${nombre}" ya existe`);
      return existe;
    }
    
    // Crear nueva categoría
    const nuevaCategoria = await Categoria.create({
      nombre,
      descripcion,
      icono
    });
    
    console.log(`✅ Categoría "${nombre}" creada exitosamente`);
    console.log(`   ID: ${nuevaCategoria._id}`);
    
    return nuevaCategoria;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Función para listar todas las categorías
async function listarCategorias() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    
    const categorias = await Categoria.find({}).sort({ nombre: 1 });
    
    console.log('\n📋 TODAS LAS CATEGORÍAS:');
    categorias.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.nombre} ${cat.icono}`);
      console.log(`      ${cat.descripcion}`);
      console.log(`      ID: ${cat._id}\n`);
    });
    
    console.log(`📊 Total: ${categorias.length} categorías`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === 'listar') {
    await listarCategorias();
    return;
  }
  
  if (args[0] === 'agregar' && args.length >= 4) {
    const [, nombre, descripcion, icono] = args;
    await agregarCategoria(nombre, descripcion, icono);
    return;
  }
  
  // Por defecto, asegurar que Lavavajillas exista
  await agregarCategoria(
    'Lavavajillas',
    'Lavavajillas automáticos para cocina',
    '🍽️'
  );
  
  console.log('\n💡 EJEMPLOS DE USO:');
  console.log('   node gestionar-categorias.js listar');
  console.log('   node gestionar-categorias.js agregar "Cocinas" "Cocinas y anafes" "🔥"');
}

main();
