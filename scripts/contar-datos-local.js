const mongoose = require('mongoose');
const Producto = require('./models/Producto');
const Categoria = require('./models/Categoria');

async function contarDatosLocal() {
  try {
    console.log('📊 CONTANDO DATOS EN LOCAL');
    console.log('==========================');
    
    // Conectar a local
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('✅ Conectado a MongoDB local');
    
    // Contar categorías
    const totalCategorias = await Categoria.countDocuments();
    console.log(`📂 Categorías en LOCAL: ${totalCategorias}`);
    
    // Contar productos
    const totalProductos = await Producto.countDocuments();
    console.log(`📦 Productos en LOCAL: ${totalProductos}`);
    
    // Mostrar algunas categorías
    if (totalCategorias > 0) {
      console.log('\n📋 Primeras 5 categorías:');
      const categorias = await Categoria.find().limit(5);
      categorias.forEach(cat => console.log(`  - ${cat.nombre}`));
    }
    
    // Mostrar algunos productos
    if (totalProductos > 0) {
      console.log('\n🏷️ Primeros 5 productos:');
      const productos = await Producto.find().limit(5);
      productos.forEach(prod => console.log(`  - ${prod.nombre} (${prod.marca})`));
    }
    
    console.log('\n💾 Datos listos para migrar!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

contarDatosLocal();
