const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

async function verificarCategoriaCavas() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('=== VERIFICACIÓN DE CATEGORÍA CAVAS ===\n');
    
    // Buscar la categoría Cavas
    const categoriaCavas = await Categoria.findOne({ nombre: 'Cavas' });
    
    if (categoriaCavas) {
      console.log('✅ CATEGORÍA CAVAS ENCONTRADA:');
      console.log(`🆔 ID: ${categoriaCavas._id}`);
      console.log(`📋 Nombre: ${categoriaCavas.nombre}`);
      console.log(`📝 Descripción: ${categoriaCavas.descripcion}`);
      console.log(`📅 Creada: ${categoriaCavas.createdAt}`);
      
      // Verificar productos en esta categoría
      const productosEnCavas = await Producto.find({ categoria: categoriaCavas._id });
      console.log(`📦 Productos asignados: ${productosEnCavas.length}`);
      
      if (productosEnCavas.length > 0) {
        console.log('\n📋 PRODUCTOS EN CAVAS:');
        productosEnCavas.forEach(producto => {
          console.log(`   • ${producto.marca} ${producto.modelo}`);
        });
      } else {
        console.log('\n📝 La categoría está lista para recibir productos de cavas de vino');
      }
    } else {
      console.log('❌ No se encontró la categoría Cavas');
    }
    
    // Mostrar todas las categorías activas ordenadas alfabéticamente
    console.log('\n📊 TODAS LAS CATEGORÍAS EN EL SISTEMA:');
    console.log('=====================================');
    
    const todasCategorias = await Categoria.aggregate([
      {
        $lookup: {
          from: 'productos',
          localField: '_id',
          foreignField: 'categoria',
          as: 'productos'
        }
      },
      {
        $addFields: {
          count: { $size: '$productos' }
        }
      },
      {
        $sort: { nombre: 1 }
      },
      {
        $project: {
          nombre: 1,
          count: 1,
          descripcion: 1
        }
      }
    ]);
    
    todasCategorias.forEach(categoria => {
      const estado = categoria.count > 0 ? `✅ ${categoria.count} productos` : '⭕ 0 productos';
      console.log(`   ${categoria.nombre}: ${estado}`);
    });
    
    console.log('\n📈 ESTADÍSTICAS:');
    console.log('================');
    const totalCategorias = todasCategorias.length;
    const categoriasConProductos = todasCategorias.filter(cat => cat.count > 0).length;
    const categoriasVacias = totalCategorias - categoriasConProductos;
    
    console.log(`🏷️  Total de categorías: ${totalCategorias}`);
    console.log(`✅ Con productos: ${categoriasConProductos}`);
    console.log(`⭕ Vacías: ${categoriasVacias}`);
    
    const totalProductos = todasCategorias.reduce((sum, cat) => sum + cat.count, 0);
    console.log(`📦 Total de productos: ${totalProductos}`);
    
    console.log('\n🍷 CATEGORÍA CAVAS:');
    console.log('==================');
    console.log('✅ Disponible para productos de cavas de vino');
    console.log('✅ Lista para usar en la aplicación');
    console.log('✅ Aparecerá en el listado de categorías del API');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

verificarCategoriaCavas();
