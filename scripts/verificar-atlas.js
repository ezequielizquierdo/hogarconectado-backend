const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

async function verificarAtlas() {
  try {
    console.log('🔗 Conectando a MongoDB Atlas...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado exitosamente a Atlas');
    
    // Verificar categorías
    const totalCategorias = await Categoria.countDocuments();
    console.log(`📂 Categorías en Atlas: ${totalCategorias}`);
    
    // Verificar productos
    const totalProductos = await Producto.countDocuments();
    console.log(`📦 Productos en Atlas: ${totalProductos}`);
    
    if (totalCategorias > 0) {
      const primerCategoria = await Categoria.findOne();
      console.log(`📋 Primera categoría: ${primerCategoria.nombre}`);
    }
    
    if (totalProductos > 0) {
      const primerProducto = await Producto.findOne();
      console.log(`🏷️ Primer producto: ${primerProducto.nombre}`);
    }
    
    console.log('\n🎉 ¡Atlas está poblado y funcionando!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

verificarAtlas();
