const mongoose = require('mongoose');
const Categoria = require('../models/Categoria');

async function agregarCategoriaCavas() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('=== AGREGANDO CATEGORÍA CAVAS ===\n');
    
    // Verificar si ya existe la categoría
    const categoriaExistente = await Categoria.findOne({ nombre: 'Cavas' });
    
    if (categoriaExistente) {
      console.log('⚠️  La categoría "Cavas" ya existe');
      console.log(`🆔 ID: ${categoriaExistente._id}`);
      console.log(`📋 Descripción: ${categoriaExistente.descripcion}`);
      return;
    }
    
    // Crear la nueva categoría
    const nuevaCategoria = new Categoria({
      nombre: 'Cavas',
      descripcion: 'Cavas de vino, conservadoras de vino y bodeguitas para almacenamiento de vinos'
    });
    
    await nuevaCategoria.save();
    
    console.log('✅ Categoría "Cavas" creada exitosamente!');
    console.log(`🆔 ID: ${nuevaCategoria._id}`);
    console.log(`📋 Descripción: ${nuevaCategoria.descripcion}`);
    console.log(`📅 Creada: ${nuevaCategoria.createdAt}`);
    
    // Mostrar el total de categorías ahora
    const totalCategorias = await Categoria.countDocuments();
    console.log(`\n📊 Total de categorías en el sistema: ${totalCategorias}`);
    
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('==================');
    console.log('• La categoría "Cavas" está lista para recibir productos');
    console.log('• Puedes asignar productos de cavas de vino a esta categoría');
    console.log('• La categoría aparecerá en el listado de categorías del API');
    
    console.log('\n🎉 ¡Categoría agregada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error al agregar la categoría:', error);
  } finally {
    mongoose.disconnect();
  }
}

agregarCategoriaCavas();
