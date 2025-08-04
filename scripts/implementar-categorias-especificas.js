const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

async function crearCategoriasEspecificas() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('=== CREANDO CATEGORÍAS ESPECÍFICAS ===\n');
    
    // 1. SUBCATEGORÍAS PARA HELADERAS
    console.log('🔸 Creando subcategorías para Heladeras...');
    
    const categoriasHeladeras = [
      { nombre: 'Heladeras No Frost', descripcion: 'Heladeras con sistema de frío seco sin formación de hielo' },
      { nombre: 'Heladeras con Freezer', descripcion: 'Heladeras tradicionales con compartimento freezer' },
      { nombre: 'Heladeras Compactas', descripcion: 'Heladeras de una puerta y tamaño reducido' },
      { nombre: 'Heladeras Doble Puerta', descripcion: 'Heladeras convencionales de dos puertas' },
      { nombre: 'Heladeras Side by Side', descripcion: 'Heladeras americanas con puertas lado a lado' }
    ];
    
    const nuevasCategoriasHeladeras = [];
    for (const cat of categoriasHeladeras) {
      const existe = await Categoria.findOne({ nombre: cat.nombre });
      if (!existe) {
        const nueva = new Categoria(cat);
        await nueva.save();
        nuevasCategoriasHeladeras.push(nueva);
        console.log(`   ✅ Creada: ${cat.nombre}`);
      } else {
        console.log(`   ⚠️  Ya existe: ${cat.nombre}`);
        nuevasCategoriasHeladeras.push(existe);
      }
    }
    
    // 2. SUBCATEGORÍAS PARA EQUIPOS DE AUDIO
    console.log('\n🔸 Creando subcategorías para Audio...');
    
    const categoriasAudio = [
      { nombre: 'Parlantes Bluetooth', descripcion: 'Parlantes portátiles con conectividad Bluetooth' },
      { nombre: 'Barras de Sonido', descripcion: 'Sistemas de sonido tipo soundbar para TV' },
      { nombre: 'Equipos de Música', descripcion: 'Minicomponentes y equipos de música tradicionales' },
      { nombre: 'Auriculares', descripcion: 'Auriculares y headphones' }
    ];
    
    const nuevasCategoriasAudio = [];
    for (const cat of categoriasAudio) {
      const existe = await Categoria.findOne({ nombre: cat.nombre });
      if (!existe) {
        const nueva = new Categoria(cat);
        await nueva.save();
        nuevasCategoriasAudio.push(nueva);
        console.log(`   ✅ Creada: ${cat.nombre}`);
      } else {
        console.log(`   ⚠️  Ya existe: ${cat.nombre}`);
        nuevasCategoriasAudio.push(existe);
      }
    }
    
    // 3. SUBCATEGORÍAS ESPECÍFICAS PARA COCINA
    console.log('\n🔸 Creando categorías específicas de cocina...');
    
    const categoriasCocina = [
      { nombre: 'Hornos Eléctricos', descripcion: 'Hornos eléctricos para cocina' },
      { nombre: 'Anafes y Cocinas', descripcion: 'Anafes eléctricos, a gas y cocinas' },
      { nombre: 'Freidoras', descripcion: 'Freidoras eléctricas y de aire' },
      { nombre: 'Licuadoras y Batidoras', descripcion: 'Licuadoras, batidoras y mixers' },
      { nombre: 'Tostadoras', descripcion: 'Tostadoras y tostadores eléctricos' },
      { nombre: 'Procesadoras de Alimentos', descripcion: 'Procesadoras y picadoras de alimentos' },
      { nombre: 'Parrillas Eléctricas', descripcion: 'Parrillas y grills eléctricos' },
      { nombre: 'Sandwicheras', descripcion: 'Sandwicheras y máquinas para sándwiches' }
    ];
    
    const nuevasCategoriasCocina = [];
    for (const cat of categoriasCocina) {
      const existe = await Categoria.findOne({ nombre: cat.nombre });
      if (!existe) {
        const nueva = new Categoria(cat);
        await nueva.save();
        nuevasCategoriasCocina.push(nueva);
        console.log(`   ✅ Creada: ${cat.nombre}`);
      } else {
        console.log(`   ⚠️  Ya existe: ${cat.nombre}`);
        nuevasCategoriasCocina.push(existe);
      }
    }
    
    // 4. SUBCATEGORÍAS PARA HOGAR
    console.log('\n🔸 Creando categorías específicas para Hogar...');
    
    const categoriasHogar = [
      { nombre: 'Ventiladores', descripcion: 'Ventiladores de pie, techo y torre' },
      { nombre: 'Planchas', descripcion: 'Planchas a vapor y secas' },
      { nombre: 'Purificadores de Aire', descripcion: 'Purificadores y humidificadores de aire' },
      { nombre: 'Calefacción Portátil', descripcion: 'Calefactores y estufas eléctricas portátiles' },
      { nombre: 'Limpieza Automatizada', descripcion: 'Robots aspiradores y limpiadores automáticos' },
      { nombre: 'Balanzas', descripcion: 'Balanzas digitales y de cocina' },
      { nombre: 'Cuidado Personal', descripcion: 'Productos para el cuidado personal y belleza' }
    ];
    
    const nuevasCategoriasHogar = [];
    for (const cat of categoriasHogar) {
      const existe = await Categoria.findOne({ nombre: cat.nombre });
      if (!existe) {
        const nueva = new Categoria(cat);
        await nueva.save();
        nuevasCategoriasHogar.push(nueva);
        console.log(`   ✅ Creada: ${cat.nombre}`);
      } else {
        console.log(`   ⚠️  Ya existe: ${cat.nombre}`);
        nuevasCategoriasHogar.push(existe);
      }
    }
    
    console.log('\n=== RESUMEN ===');
    console.log(`🎯 Nuevas categorías de Heladeras: ${nuevasCategoriasHeladeras.length}`);
    console.log(`🎯 Nuevas categorías de Audio: ${nuevasCategoriasAudio.length}`);
    console.log(`🎯 Nuevas categorías de Cocina: ${nuevasCategoriasCocina.length}`);
    console.log(`🎯 Nuevas categorías de Hogar: ${nuevasCategoriasHogar.length}`);
    
    const totalCategorias = await Categoria.countDocuments();
    console.log(`\n📊 Total de categorías en sistema: ${totalCategorias}`);
    
    console.log('\n✅ Categorías creadas exitosamente!');
    console.log('💡 Próximo paso: Reasignar productos a las nuevas categorías específicas');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

crearCategoriasEspecificas();
