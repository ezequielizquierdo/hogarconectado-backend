const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

async function reasignarProductos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('=== REASIGNANDO PRODUCTOS A CATEGORÍAS ESPECÍFICAS ===\n');
    
    // Obtener IDs de categorías originales
    const categoriaHeladeras = await Categoria.findOne({ nombre: 'Heladeras' });
    const categoriaHogar = await Categoria.findOne({ nombre: 'Hogar' });
    const categoriaAudio = await Categoria.findOne({ nombre: 'Equipos de audio' });
    const categoriaElectroCocina = await Categoria.findOne({ nombre: 'Electrodomésticos de cocina' });
    
    let totalReasignados = 0;
    
    // 1. REASIGNAR HELADERAS
    if (categoriaHeladeras) {
      console.log('🔸 Reasignando Heladeras...');
      const productos = await Producto.find({ categoria: categoriaHeladeras._id });
      
      for (const producto of productos) {
        const texto = `${producto.marca} ${producto.modelo} ${producto.descripcion || ''}`.toLowerCase();
        let nuevaCategoria = null;
        
        if (texto.includes('frío seco') || texto.includes('no frost')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Heladeras No Frost' });
        } else if (texto.includes('side by side') || texto.includes('americanas')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Heladeras Side by Side' });
        } else if (texto.includes('freezer')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Heladeras con Freezer' });
        } else if (texto.includes('una puerta') || texto.includes('compacta')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Heladeras Compactas' });
        } else if (texto.includes('dos puertas') || texto.includes('doble puerta')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Heladeras Doble Puerta' });
        } else {
          // Por defecto, las heladeras van a "Heladeras Doble Puerta" si no coinciden con otros criterios
          nuevaCategoria = await Categoria.findOne({ nombre: 'Heladeras Doble Puerta' });
        }
        
        if (nuevaCategoria) {
          await Producto.findByIdAndUpdate(producto._id, { categoria: nuevaCategoria._id });
          console.log(`   • ${producto.marca} ${producto.modelo} → ${nuevaCategoria.nombre}`);
          totalReasignados++;
        }
      }
    }
    
    // 2. REASIGNAR EQUIPOS DE AUDIO
    if (categoriaAudio) {
      console.log('\n🔸 Reasignando Equipos de Audio...');
      const productos = await Producto.find({ categoria: categoriaAudio._id });
      
      for (const producto of productos) {
        const texto = `${producto.marca} ${producto.modelo} ${producto.descripcion || ''}`.toLowerCase();
        let nuevaCategoria = null;
        
        if (texto.includes('bluetooth') || texto.includes('portátil') || texto.includes('charge')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Parlantes Bluetooth' });
        } else if (texto.includes('barra') || texto.includes('soundbar')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Barras de Sonido' });
        } else if (texto.includes('auricular') || texto.includes('headphone')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Auriculares' });
        } else {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Equipos de Música' });
        }
        
        if (nuevaCategoria) {
          await Producto.findByIdAndUpdate(producto._id, { categoria: nuevaCategoria._id });
          console.log(`   • ${producto.marca} ${producto.modelo} → ${nuevaCategoria.nombre}`);
          totalReasignados++;
        }
      }
    }
    
    // 3. REASIGNAR ELECTRODOMÉSTICOS DE COCINA
    if (categoriaElectroCocina) {
      console.log('\n🔸 Reasignando Electrodomésticos de Cocina...');
      const productos = await Producto.find({ categoria: categoriaElectroCocina._id });
      
      for (const producto of productos) {
        const texto = `${producto.marca} ${producto.modelo} ${producto.descripcion || ''}`.toLowerCase();
        let nuevaCategoria = null;
        
        if (texto.includes('horno') && !texto.includes('microondas')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Hornos Eléctricos' });
        } else if (texto.includes('anafe') || (texto.includes('cocina') && !texto.includes('electrodomésticos'))) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Anafes y Cocinas' });
        } else if (texto.includes('freidora')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Freidoras' });
        } else if (texto.includes('licuadora') || texto.includes('batidora') || texto.includes('mixer')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Licuadoras y Batidoras' });
        } else if (texto.includes('tostadora') || texto.includes('tostador')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Tostadoras' });
        } else if (texto.includes('procesadora') || texto.includes('picadora')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Procesadoras de Alimentos' });
        } else if (texto.includes('parrilla') || texto.includes('grill') || texto.includes('plancha')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Parrillas Eléctricas' });
        } else if (texto.includes('sandwichera') || texto.includes('sandwich')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Sandwicheras' });
        } else {
          // Mantener en la categoría original si no coincide
          console.log(`   ⚠️  ${producto.marca} ${producto.modelo} - Sin categoría específica identificada`);
        }
        
        if (nuevaCategoria) {
          await Producto.findByIdAndUpdate(producto._id, { categoria: nuevaCategoria._id });
          console.log(`   • ${producto.marca} ${producto.modelo} → ${nuevaCategoria.nombre}`);
          totalReasignados++;
        }
      }
    }
    
    // 4. REASIGNAR PRODUCTOS DE HOGAR (análisis más detallado)
    if (categoriaHogar) {
      console.log('\n🔸 Reasignando productos de Hogar...');
      const productos = await Producto.find({ categoria: categoriaHogar._id });
      
      for (const producto of productos) {
        const texto = `${producto.marca} ${producto.modelo} ${producto.descripcion || ''}`.toLowerCase();
        let nuevaCategoria = null;
        
        if (texto.includes('ventilador')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Ventiladores' });
        } else if (texto.includes('plancha')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Planchas' });
        } else if (texto.includes('purificador') || texto.includes('humidificador')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Purificadores de Aire' });
        } else if (texto.includes('calefactor') || texto.includes('estufa')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Calefacción Portátil' });
        } else if (texto.includes('robot') || texto.includes('aspirador automático')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Limpieza Automatizada' });
        } else if (texto.includes('balanza') || texto.includes('peso')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Balanzas' });
        } else if (texto.includes('belleza') || texto.includes('hair') || texto.includes('cabello')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Cuidado Personal' });
        } else {
          // Productos que no encajan en las subcategorías específicas
          console.log(`   ⚠️  ${producto.marca} ${producto.modelo} - Requiere revisión manual`);
        }
        
        if (nuevaCategoria) {
          await Producto.findByIdAndUpdate(producto._id, { categoria: nuevaCategoria._id });
          console.log(`   • ${producto.marca} ${producto.modelo} → ${nuevaCategoria.nombre}`);
          totalReasignados++;
        }
      }
    }
    
    console.log('\n=== RESUMEN DE REASIGNACIÓN ===');
    console.log(`📊 Total de productos reasignados: ${totalReasignados}`);
    
    // Verificar estado actual
    console.log('\n📋 Estado actual de categorías principales:');
    const categoriasOriginales = [categoriaHeladeras, categoriaHogar, categoriaAudio, categoriaElectroCocina];
    
    for (const cat of categoriasOriginales) {
      if (cat) {
        const count = await Producto.countDocuments({ categoria: cat._id });
        console.log(`   ${cat.nombre}: ${count} productos restantes`);
      }
    }
    
    console.log('\n✅ Reasignación completada!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

reasignarProductos();
