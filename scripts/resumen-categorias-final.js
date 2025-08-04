const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

async function resumenFinalCategorias() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('=== RESUMEN FINAL - CATEGORÍAS DETALLADAS ===\n');
    
    // Obtener todas las categorías con productos
    const categorias = await Categoria.find({}).sort({ nombre: 1 });
    
    let totalProductos = 0;
    let categoriasConProductos = 0;
    let categoriasSinProductos = 0;
    
    console.log('📊 DISTRIBUCIÓN COMPLETA DE CATEGORÍAS:\n');
    
    for (const categoria of categorias) {
      const count = await Producto.countDocuments({ categoria: categoria._id });
      totalProductos += count;
      
      if (count > 0) {
        categoriasConProductos++;
        console.log(`✅ ${categoria.nombre}: ${count} productos`);
      } else {
        categoriasSinProductos++;
        console.log(`⭕ ${categoria.nombre}: 0 productos`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📈 ESTADÍSTICAS GENERALES:');
    console.log('='.repeat(50));
    console.log(`🏷️  Total de categorías: ${categorias.length}`);
    console.log(`✅ Categorías con productos: ${categoriasConProductos}`);
    console.log(`⭕ Categorías vacías: ${categoriasSinProductos}`);
    console.log(`📦 Total de productos: ${totalProductos}`);
    
    // Mostrar las categorías más populares
    console.log('\n🎯 TOP 10 CATEGORÍAS CON MÁS PRODUCTOS:');
    console.log('=====================================');
    
    const categoriasConConteo = [];
    for (const categoria of categorias) {
      const count = await Producto.countDocuments({ categoria: categoria._id });
      if (count > 0) {
        categoriasConConteo.push({ nombre: categoria.nombre, count });
      }
    }
    
    categoriasConConteo
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.nombre}: ${cat.count} productos`);
      });
    
    // Verificar que las categorías originales estén vacías
    console.log('\n🔍 VERIFICACIÓN DE CATEGORÍAS ORIGINALES:');
    console.log('========================================');
    
    const categoriasOriginales = ['Heladeras', 'Hogar', 'Equipos de audio', 'Electrodomésticos de cocina'];
    
    for (const nombreCat of categoriasOriginales) {
      const categoria = await Categoria.findOne({ nombre: nombreCat });
      if (categoria) {
        const count = await Producto.countDocuments({ categoria: categoria._id });
        if (count === 0) {
          console.log(`✅ ${nombreCat}: Completamente reorganizada (0 productos)`);
        } else {
          console.log(`⚠️  ${nombreCat}: Aún tiene ${count} productos`);
        }
      }
    }
    
    // Mostrar las nuevas categorías específicas
    console.log('\n🆕 NUEVAS CATEGORÍAS ESPECÍFICAS CREADAS:');
    console.log('=========================================');
    
    const categoriasEspecificas = [
      'Heladeras No Frost', 'Heladeras con Freezer', 'Heladeras Compactas', 
      'Heladeras Doble Puerta', 'Heladeras Side by Side',
      'Parlantes Bluetooth', 'Barras de Sonido', 'Equipos de Música', 'Auriculares',
      'Hornos Eléctricos', 'Anafes y Cocinas', 'Freidoras', 'Licuadoras y Batidoras',
      'Tostadoras', 'Procesadoras de Alimentos', 'Parrillas Eléctricas', 'Sandwicheras',
      'Ventiladores', 'Planchas', 'Purificadores de Aire', 'Calefacción Portátil',
      'Limpieza Automatizada', 'Balanzas', 'Cuidado Personal', 'Gaming'
    ];
    
    for (const nombreCat of categoriasEspecificas) {
      const categoria = await Categoria.findOne({ nombre: nombreCat });
      if (categoria) {
        const count = await Producto.countDocuments({ categoria: categoria._id });
        if (count > 0) {
          console.log(`✅ ${nombreCat}: ${count} productos`);
        } else {
          console.log(`⭕ ${nombreCat}: 0 productos (lista para usar)`);
        }
      }
    }
    
    console.log('\n💡 BENEFICIOS DE LA REORGANIZACIÓN:');
    console.log('==================================');
    console.log('✅ Navegación más intuitiva para los usuarios');
    console.log('✅ Filtros de búsqueda más específicos'); 
    console.log('✅ Mejor experiencia de compra');
    console.log('✅ Categorías preparadas para crecimiento futuro');
    console.log('✅ Organización profesional del catálogo');
    
    console.log('\n🎉 ¡REORGANIZACIÓN COMPLETADA EXITOSAMENTE!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

resumenFinalCategorias();
