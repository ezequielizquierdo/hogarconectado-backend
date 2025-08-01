const mongoose = require('mongoose');
const Categoria = require('./models/Categoria');

async function agregarLavavajillas() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('✅ Conectado a MongoDB');
    
    // Verificar si ya existe la categoría Lavavajillas
    const existeLavavajillas = await Categoria.findOne({ 
      nombre: { $regex: /lavavajillas/i } 
    });
    
    if (existeLavavajillas) {
      console.log('⏭️ La categoría Lavavajillas ya existe:', existeLavavajillas.nombre);
      return;
    }
    
    // Crear la nueva categoría
    const nuevaCategoria = await Categoria.create({
      nombre: 'Lavavajillas',
      descripcion: 'Lavavajillas automáticos para cocina',
      icono: '🍽️'
    });
    
    console.log('✅ Categoría Lavavajillas creada exitosamente:');
    console.log(`   ID: ${nuevaCategoria._id}`);
    console.log(`   Nombre: ${nuevaCategoria.nombre}`);
    console.log(`   Descripción: ${nuevaCategoria.descripcion}`);
    console.log(`   Icono: ${nuevaCategoria.icono}`);
    
    // Mostrar todas las categorías actuales
    console.log('\n📋 TODAS LAS CATEGORÍAS:');
    const todasCategorias = await Categoria.find({}).sort({ nombre: 1 });
    todasCategorias.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.nombre} ${cat.icono} - ${cat.descripcion}`);
    });
    
    console.log(`\n📊 Total de categorías: ${todasCategorias.length}`);
    
    await mongoose.disconnect();
    console.log('\n👋 Operación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

agregarLavavajillas();
