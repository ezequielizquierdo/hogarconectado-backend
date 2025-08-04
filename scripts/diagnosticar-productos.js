const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

async function diagnosticarProductos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('=== DIAGNÓSTICO DE PRODUCTOS ===\n');
    
    // Obtener algunos productos para ver su estructura
    const productos = await Producto.find({}).limit(5);
    
    console.log('🔍 Estructura de productos en BD:');
    productos.forEach((producto, index) => {
      console.log(`\nProducto ${index + 1}:`);
      console.log(`   _id: ${producto._id}`);
      console.log(`   nombre: "${producto.nombre}"`);
      console.log(`   descripcion: "${producto.descripcion || 'N/A'}"`);
      console.log(`   precio: ${producto.precio}`);
      console.log(`   categoria: ${producto.categoria}`);
      console.log(`   Campos disponibles:`, Object.keys(producto.toObject()));
    });
    
    // Verificar si el problema es el campo nombre vs name
    const productosRaw = await mongoose.connection.db.collection('productos').find({}).limit(3).toArray();
    console.log('\n🔍 Datos RAW de MongoDB:');
    productosRaw.forEach((producto, index) => {
      console.log(`\nProducto RAW ${index + 1}:`);
      Object.keys(producto).forEach(key => {
        console.log(`   ${key}: "${producto[key]}"`);
      });
    });
    
    // Contar productos por categoría
    console.log('\n📊 Conteo de productos por categoría:');
    const pipeline = [
      {
        $group: {
          _id: '$categoria',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categorias',
          localField: '_id',
          foreignField: '_id',
          as: 'categoriaInfo'
        }
      },
      {
        $sort: { count: -1 }
      }
    ];
    
    const conteos = await Producto.aggregate(pipeline);
    conteos.forEach(item => {
      const nombreCategoria = item.categoriaInfo[0]?.nombre || 'Sin categoría';
      console.log(`   ${nombreCategoria}: ${item.count} productos`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

diagnosticarProductos();
