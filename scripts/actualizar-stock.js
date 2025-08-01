const mongoose = require('mongoose');
const Producto = require('./models/Producto');

async function actualizarStock() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('✅ Conectado a MongoDB');
    
    // Actualizar todos los productos que no tienen el campo stock
    const resultado = await Producto.updateMany(
      { 
        $or: [
          { stock: { $exists: false } },
          { 'stock.disponible': { $exists: false } }
        ]
      },
      { 
        $set: { 
          'stock.cantidad': 0,
          'stock.disponible': true 
        }
      }
    );
    
    console.log(`✅ Productos actualizados: ${resultado.modifiedCount}`);
    
    // Verificar
    const conStock = await Producto.countDocuments({ 
      activo: true, 
      'stock.disponible': true 
    });
    console.log(`📦 Productos activos con stock disponible: ${conStock}`);
    
    await mongoose.disconnect();
    console.log('👋 Actualización completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

actualizarStock();
