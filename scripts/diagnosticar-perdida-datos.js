const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

async function diagnosticarBaseDatos() {
  try {
    console.log('🔍 DIAGNÓSTICO DE BASE DE DATOS LOCAL');
    console.log('====================================');
    
    // Conectar a local
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('✅ Conectado a MongoDB local');
    
    // Contar productos
    const totalProductos = await Producto.countDocuments();
    console.log(`📦 Productos actuales en LOCAL: ${totalProductos}`);
    
    // Contar categorías
    const totalCategorias = await Categoria.countDocuments();
    console.log(`📂 Categorías actuales en LOCAL: ${totalCategorias}`);
    
    // Verificar si hay productos recientes
    console.log('\n⏰ Productos más recientes:');
    const productosRecientes = await Producto.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('nombre marca createdAt');
    
    productosRecientes.forEach((prod, index) => {
      const fecha = prod.createdAt ? prod.createdAt.toLocaleDateString() : 'Sin fecha';
      console.log(`  ${index + 1}. ${prod.nombre} (${prod.marca}) - ${fecha}`);
    });
    
    // Verificar si hay productos antiguos
    console.log('\n📊 Productos más antiguos:');
    const productosAntiguos = await Producto.find()
      .sort({ createdAt: 1 })
      .limit(5)
      .select('nombre marca createdAt');
    
    productosAntiguos.forEach((prod, index) => {
      const fecha = prod.createdAt ? prod.createdAt.toLocaleDateString() : 'Sin fecha';
      console.log(`  ${index + 1}. ${prod.nombre} (${prod.marca}) - ${fecha}`);
    });
    
    console.log('\n💾 ¿Qué pudo haber pasado?');
    if (totalProductos < 50) {
      console.log('❌ Posiblemente se perdieron datos durante la migración');
      console.log('🔄 Vamos a verificar si tenemos backups...');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

diagnosticarBaseDatos();
