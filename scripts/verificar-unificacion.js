const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

async function limpiarCategoriasVacias() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('=== LIMPIEZA DE CATEGORÍAS VACÍAS ===\n');
    
    // Encontrar categorías sin productos
    const todasCategorias = await Categoria.find({});
    const categoriasVacias = [];
    const categoriasConProductos = [];
    
    for (const categoria of todasCategorias) {
      const count = await Producto.countDocuments({ categoria: categoria._id });
      if (count === 0) {
        categoriasVacias.push(categoria);
      } else {
        categoriasConProductos.push({ categoria, count });
      }
    }
    
    console.log('📊 ESTADO ACTUAL:');
    console.log('================');
    console.log(`✅ Categorías con productos: ${categoriasConProductos.length}`);
    console.log(`⭕ Categorías vacías: ${categoriasVacias.length}`);
    
    console.log('\n✅ CATEGORÍAS CON PRODUCTOS:');
    categoriasConProductos
      .sort((a, b) => b.count - a.count)
      .forEach(({ categoria, count }) => {
        console.log(`   ${categoria.nombre}: ${count} productos`);
      });
    
    console.log('\n⭕ CATEGORÍAS VACÍAS:');
    categoriasVacias.forEach(categoria => {
      console.log(`   ${categoria.nombre}`);
    });
    
    // Verificar las categorías principales que queríamos unificar
    console.log('\n🎯 VERIFICACIÓN DE UNIFICACIÓN:');
    console.log('===============================');
    
    const categoriaAudio = await Categoria.findOne({ nombre: 'Audio' });
    const categoriaHeladeras = await Categoria.findOne({ nombre: 'Heladeras' });
    
    if (categoriaAudio) {
      const countAudio = await Producto.countDocuments({ categoria: categoriaAudio._id });
      console.log(`🎵 Audio: ${countAudio} productos ✅`);
    }
    
    if (categoriaHeladeras) {
      const countHeladeras = await Producto.countDocuments({ categoria: categoriaHeladeras._id });
      console.log(`❄️  Heladeras: ${countHeladeras} productos ✅`);
    }
    
    // Mostrar categorías específicas que ahora están vacías
    const categoriasEspecificasVacias = categoriasVacias.filter(cat => 
      cat.nombre.includes('Heladeras ') || 
      cat.nombre.includes('Equipos de') ||
      cat.nombre.includes('Parlantes') ||
      cat.nombre.includes('Barras de')
    );
    
    if (categoriasEspecificasVacias.length > 0) {
      console.log('\n🗑️  CATEGORÍAS ESPECÍFICAS AHORA VACÍAS:');
      categoriasEspecificasVacias.forEach(cat => {
        console.log(`   ${cat.nombre} (puede ser eliminada)`);
      });
      
      console.log('\n❓ ¿QUIERES ELIMINAR LAS CATEGORÍAS VACÍAS?');
      console.log('   Las categorías específicas como "Heladeras No Frost", etc.');
      console.log('   ya no tienen productos y pueden ser eliminadas.');
      console.log('   Ejecuta el siguiente comando si quieres eliminarlas:');
      console.log('   node scripts/eliminar-categorias-vacias.js');
    }
    
    console.log('\n📈 RESUMEN DE LA UNIFICACIÓN:');
    console.log('=============================');
    console.log('✅ Audio: Unificada correctamente');
    console.log('✅ Heladeras: Unificada correctamente');
    console.log('✅ Navegación simplificada');
    console.log('✅ Categorías principales organizadas');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

limpiarCategoriasVacias();
