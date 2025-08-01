const mongoose = require('mongoose');
const Producto = require('./models/Producto');

async function debugProductos() {
  try {
    console.log('🐛 DEBUGGING PRODUCTOS...');
    
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('✅ Conectado a MongoDB');
    
    // 1. Verificar total de productos
    const totalProductos = await Producto.countDocuments({});
    console.log(`📊 Total productos en BD: ${totalProductos}`);
    
    // 2. Verificar productos activos
    const activosCount = await Producto.countDocuments({ activo: true });
    console.log(`✅ Productos activos: ${activosCount}`);
    
    // 3. Verificar con el filtro del endpoint (incluye stock.disponible)
    const filtrosEndpoint = { 
      activo: true, 
      'stock.disponible': true 
    };
    const conStock = await Producto.countDocuments(filtrosEndpoint);
    console.log(`📦 Productos activos con stock.disponible=true: ${conStock}`);
    
    // 4. Ver algunos productos sin filtros para ver la estructura
    console.log('\n📋 Muestra de productos:');
    const muestraProductos = await Producto.find({}).limit(3);
    muestraProductos.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.marca} - ${p.modelo}`);
      console.log(`      activo: ${p.activo}`);
      console.log(`      stock: ${JSON.stringify(p.stock)}`);
    });
    
    await mongoose.disconnect();
    console.log('\n👋 Debug completado');
    
  } catch (error) {
    console.error('❌ Error durante debug:', error.message);
  }
}

debugProductos();
