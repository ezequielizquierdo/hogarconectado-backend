const mongoose = require('mongoose');

async function verificarBaseDatos() {
  try {
    console.log('🔍 VERIFICANDO BASE DE DATOS...');
    console.log('=' .repeat(50));
    
    // Conectar a MongoDB
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('✅ Conectado a MongoDB');
    
    // Verificar colecciones
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📂 Colecciones encontradas:', collections.map(c => c.name));
    
    // Verificar productos directamente
    const productosCollection = db.collection('productos');
    const totalProductos = await productosCollection.countDocuments();
    console.log(`📦 Total productos en colección: ${totalProductos}`);
    
    if (totalProductos > 0) {
      // Mostrar algunos productos
      const productos = await productosCollection.find({}).limit(5).toArray();
      console.log('\n🔍 PRODUCTOS ENCONTRADOS:');
      productos.forEach((p, i) => {
        console.log(`  ${i+1}. ${p.marca || 'Sin marca'} - ${p.modelo || 'Sin modelo'}`);
        console.log(`      Activo: ${p.activo}, Precio: $${p.precioBase || 0}`);
        console.log(`      ID: ${p._id}`);
      });
      
      // Verificar productos activos
      const productosActivos = await productosCollection.countDocuments({ activo: true });
      const productosInactivos = await productosCollection.countDocuments({ activo: false });
      console.log(`\n📊 ESTADÍSTICAS:`);
      console.log(`   • Productos activos: ${productosActivos}`);
      console.log(`   • Productos inactivos: ${productosInactivos}`);
    }
    
    // Verificar categorías
    const categoriasCollection = db.collection('categorias');
    const totalCategorias = await categoriasCollection.countDocuments();
    console.log(`\n📂 Total categorías: ${totalCategorias}`);
    
    if (totalCategorias > 0) {
      const categorias = await categoriasCollection.find({}).limit(5).toArray();
      console.log('\n🏷️  CATEGORÍAS ENCONTRADAS:');
      categorias.forEach((c, i) => {
        console.log(`  ${i+1}. ${c.nombre} (ID: ${c._id})`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n👋 Verificación completada');
    
  } catch (error) {
    console.error('❌ Error durante verificación:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar verificación
verificarBaseDatos();
