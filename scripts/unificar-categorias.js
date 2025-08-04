const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

async function unificarCategorias() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('=== UNIFICANDO CATEGORÍAS ===\n');
    
    // 1. UNIFICAR CATEGORÍAS DE AUDIO
    console.log('🔸 Unificando categorías de Audio...');
    
    // Buscar o crear categoría "Audio"
    let categoriaAudio = await Categoria.findOne({ nombre: 'Audio' });
    if (!categoriaAudio) {
      categoriaAudio = new Categoria({
        nombre: 'Audio',
        descripcion: 'Equipos de sonido, parlantes, barras de sonido y sistemas de audio'
      });
      await categoriaAudio.save();
      console.log('   ✅ Creada categoría: Audio');
    } else {
      console.log('   ⚠️  Categoría Audio ya existe');
    }
    
    // Categorías de audio a unificar
    const categoriasAudioUnificar = [
      'Barras de Sonido',
      'Equipos de Música', 
      'Equipos de audio',
      'Parlantes Bluetooth',
      'Auriculares'
    ];
    
    let productosAudioMovidos = 0;
    
    for (const nombreCat of categoriasAudioUnificar) {
      const categoria = await Categoria.findOne({ nombre: nombreCat });
      if (categoria) {
        const productos = await Producto.find({ categoria: categoria._id });
        console.log(`   📦 Moviendo ${productos.length} productos de "${nombreCat}" a "Audio"`);
        
        // Mover productos a la categoría Audio
        await Producto.updateMany(
          { categoria: categoria._id },
          { categoria: categoriaAudio._id }
        );
        
        productosAudioMovidos += productos.length;
        
        // Opcional: Eliminar la categoría vacía (comentar si no quieres eliminarlas)
        // await Categoria.findByIdAndDelete(categoria._id);
        // console.log(`   🗑️  Eliminada categoría vacía: ${nombreCat}`);
      }
    }
    
    console.log(`   ✅ Total productos de audio unificados: ${productosAudioMovidos}`);
    
    // 2. UNIFICAR CATEGORÍAS DE HELADERAS
    console.log('\n🔸 Unificando categorías de Heladeras...');
    
    // Buscar o crear categoría "Heladeras"
    let categoriaHeladeras = await Categoria.findOne({ nombre: 'Heladeras' });
    if (!categoriaHeladeras) {
      categoriaHeladeras = new Categoria({
        nombre: 'Heladeras',
        descripcion: 'Heladeras de todos los tipos: No Frost, convencionales, side by side, etc.'
      });
      await categoriaHeladeras.save();
      console.log('   ✅ Creada categoría: Heladeras');
    } else {
      console.log('   ⚠️  Categoría Heladeras ya existe, reutilizando');
    }
    
    // Categorías de heladeras a unificar
    const categoriasHeladerasUnificar = [
      'Heladeras No Frost',
      'Heladeras con Freezer',
      'Heladeras Compactas',
      'Heladeras Doble Puerta', 
      'Heladeras Side by Side'
    ];
    
    let productosHeladerasMovidos = 0;
    
    for (const nombreCat of categoriasHeladerasUnificar) {
      const categoria = await Categoria.findOne({ nombre: nombreCat });
      if (categoria) {
        const productos = await Producto.find({ categoria: categoria._id });
        console.log(`   📦 Moviendo ${productos.length} productos de "${nombreCat}" a "Heladeras"`);
        
        // Mover productos a la categoría Heladeras
        await Producto.updateMany(
          { categoria: categoria._id },
          { categoria: categoriaHeladeras._id }
        );
        
        productosHeladerasMovidos += productos.length;
        
        // Opcional: Eliminar la categoría vacía (comentar si no quieres eliminarlas)
        // await Categoria.findByIdAndDelete(categoria._id);
        // console.log(`   🗑️  Eliminada categoría vacía: ${nombreCat}`);
      }
    }
    
    console.log(`   ✅ Total productos de heladeras unificados: ${productosHeladerasMovidos}`);
    
    // 3. VERIFICACIÓN FINAL
    console.log('\n📊 VERIFICACIÓN FINAL:');
    console.log('======================');
    
    const conteoAudio = await Producto.countDocuments({ categoria: categoriaAudio._id });
    const conteoHeladeras = await Producto.countDocuments({ categoria: categoriaHeladeras._id });
    
    console.log(`🎵 Audio: ${conteoAudio} productos`);
    console.log(`❄️  Heladeras: ${conteoHeladeras} productos`);
    
    // Mostrar algunas muestras de productos
    console.log('\n🎵 PRODUCTOS EN AUDIO (muestra):');
    const productosAudio = await Producto.find({ categoria: categoriaAudio._id }).limit(5);
    productosAudio.forEach(p => {
      console.log(`   • ${p.marca} ${p.modelo}`);
    });
    if (conteoAudio > 5) {
      console.log(`   ... y ${conteoAudio - 5} más`);
    }
    
    console.log('\n❄️  PRODUCTOS EN HELADERAS (muestra):');
    const productosHeladeras = await Producto.find({ categoria: categoriaHeladeras._id }).limit(5);
    productosHeladeras.forEach(p => {
      console.log(`   • ${p.marca} ${p.modelo}`);
    });
    if (conteoHeladeras > 5) {
      console.log(`   ... y ${conteoHeladeras - 5} más`);
    }
    
    console.log('\n✅ UNIFICACIÓN COMPLETADA!');
    console.log('💡 Las categorías específicas siguen existiendo pero están vacías');
    console.log('💡 Puedes eliminarlas manualmente si lo deseas');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

unificarCategorias();
