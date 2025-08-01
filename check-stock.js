const { MongoClient } = require('mongodb');

async function checkStock() {
  try {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('hogarconectado');
    const collection = db.collection('productos');
    
    // Ver la estructura de algunos productos
    console.log('\n📋 Estructura de productos:');
    const productos = await collection.find({}).limit(3).toArray();
    
    productos.forEach((p, i) => {
      console.log(`\n${i+1}. ${p.marca} - ${p.modelo}`);
      console.log(`   activo: ${p.activo}`);
      console.log(`   stock: ${JSON.stringify(p.stock)}`);
      console.log(`   categoria: ${p.categoria}`);
    });
    
    // Contar productos con diferentes filtros
    const total = await collection.countDocuments({});
    const activos = await collection.countDocuments({ activo: true });
    const conStockDisponible = await collection.countDocuments({ 
      activo: true, 
      'stock.disponible': true 
    });
    const conStockCualquiera = await collection.countDocuments({ 
      activo: true, 
      stock: { $exists: true }
    });
    
    console.log(`\n📊 ESTADÍSTICAS:`);
    console.log(`   Total productos: ${total}`);
    console.log(`   Productos activos: ${activos}`);
    console.log(`   Con stock.disponible=true: ${conStockDisponible}`);
    console.log(`   Con campo stock: ${conStockCualquiera}`);
    
    await client.close();
    console.log('\n👋 Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkStock();
