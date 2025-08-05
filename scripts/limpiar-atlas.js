const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

async function limpiarAtlas() {
  try {
    console.log('🧹 LIMPIANDO ATLAS PARA MIGRACIÓN COMPLETA');
    console.log('==========================================');
    
    // Conectar a Atlas
    const atlasUri = process.env.MONGODB_URI;
    if (!atlasUri) {
      throw new Error('MONGODB_URI no está configurado');
    }
    
    await mongoose.connect(atlasUri);
    console.log('✅ Conectado a Atlas');
    
    // Eliminar datos existentes
    const productosEliminados = await Producto.deleteMany({});
    console.log(`🗑️ Productos eliminados: ${productosEliminados.deletedCount}`);
    
    const categoriasEliminadas = await Categoria.deleteMany({});
    console.log(`🗑️ Categorías eliminadas: ${categoriasEliminadas.deletedCount}`);
    
    console.log('✅ Atlas limpio, listo para migración completa');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

limpiarAtlas();
