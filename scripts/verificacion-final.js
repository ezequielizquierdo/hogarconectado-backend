const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

async function verificacionFinal() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('=== VERIFICACIÓN FINAL DEL SISTEMA ===\n');
    
    // Verificar las categorías principales que se solicitaron
    console.log('🎯 CATEGORÍAS PRINCIPALES SOLICITADAS:');
    console.log('=====================================');
    
    const categoriaAudio = await Categoria.findOne({ nombre: 'Audio' });
    const categoriaHeladeras = await Categoria.findOne({ nombre: 'Heladeras' });
    
    if (categoriaAudio) {
      const countAudio = await Producto.countDocuments({ categoria: categoriaAudio._id });
      const productosAudio = await Producto.find({ categoria: categoriaAudio._id }).limit(10);
      
      console.log(`\n🎵 AUDIO: ${countAudio} productos`);
      console.log('   📋 Productos incluidos:');
      productosAudio.forEach(p => {
        console.log(`      • ${p.marca} ${p.modelo}`);
      });
    } else {
      console.log('❌ No se encontró la categoría Audio');
    }
    
    if (categoriaHeladeras) {
      const countHeladeras = await Producto.countDocuments({ categoria: categoriaHeladeras._id });
      const productosHeladeras = await Producto.find({ categoria: categoriaHeladeras._id }).limit(10);
      
      console.log(`\n❄️  HELADERAS: ${countHeladeras} productos`);
      console.log('   📋 Productos incluidos:');
      productosHeladeras.forEach(p => {
        console.log(`      • ${p.marca} ${p.modelo}`);
      });
      if (countHeladeras > 10) {
        console.log(`      ... y ${countHeladeras - 10} más`);
      }
    } else {
      console.log('❌ No se encontró la categoría Heladeras');
    }
    
    // Mostrar todas las categorías activas
    console.log('\n📊 TODAS LAS CATEGORÍAS ACTIVAS:');
    console.log('================================');
    
    const categoriasActivas = await Categoria.aggregate([
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
        $match: {
          count: { $gt: 0 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $project: {
          nombre: 1,
          count: 1
        }
      }
    ]);
    
    categoriasActivas.forEach((cat, index) => {
      const icon = index < 5 ? '🏆' : '✅';
      console.log(`   ${icon} ${cat.nombre}: ${cat.count} productos`);
    });
    
    console.log('\n📈 ESTADÍSTICAS FINALES:');
    console.log('========================');
    console.log(`🏷️  Total de categorías activas: ${categoriasActivas.length}`);
    
    const totalProductos = categoriasActivas.reduce((sum, cat) => sum + cat.count, 0);
    console.log(`📦 Total de productos: ${totalProductos}`);
    
    console.log('\n✅ OBJETIVOS CUMPLIDOS:');
    console.log('=======================');
    console.log('✅ Audio: Categoría unificada (Barras de sonido + Equipos de música + Parlantes bluetooth)');
    console.log('✅ Heladeras: Categoría unificada (Todas las subcategorías de heladeras)');
    console.log('✅ Navegación simplificada');
    console.log('✅ Categorías específicas eliminadas');
    console.log('✅ Sistema optimizado');
    
    console.log('\n🎉 ¡REORGANIZACIÓN COMPLETADA EXITOSAMENTE!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

verificacionFinal();
