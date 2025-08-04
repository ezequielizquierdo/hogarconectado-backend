const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

async function revisarProductosPendientes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('=== REVISIÓN MANUAL DE PRODUCTOS PENDIENTES ===\n');
    
    // Obtener categorías problemáticas
    const categoriaHogar = await Categoria.findOne({ nombre: 'Hogar' });
    const categoriaElectroCocina = await Categoria.findOne({ nombre: 'Electrodomésticos de cocina' });
    
    let totalReasignados = 0;
    
    // 1. REVISAR PRODUCTOS DE ELECTRODOMÉSTICOS DE COCINA
    if (categoriaElectroCocina) {
      console.log('🔍 Revisando Electrodomésticos de Cocina restantes...');
      const productos = await Producto.find({ categoria: categoriaElectroCocina._id });
      
      for (const producto of productos) {
        console.log(`\n📋 Analizando: ${producto.marca} ${producto.modelo}`);
        console.log(`    Descripción: ${producto.descripcion}`);
        console.log(`    Tags: ${producto.tags}`);
        
        const textoCompleto = `${producto.marca} ${producto.modelo} ${producto.descripcion} ${producto.tags}`.toLowerCase();
        let nuevaCategoria = null;
        
        if (textoCompleto.includes('pcr9a5b90') || textoCompleto.includes('anafe')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Anafes y Cocinas' });
          console.log(`    ✅ Reasignado a: Anafes y Cocinas`);
        } else if (textoCompleto.includes('horno') || textoCompleto.includes('nv7b')) {
          nuevaCategoria = await Categoria.findOne({ nombre: 'Hornos Eléctricos' });
          console.log(`    ✅ Reasignado a: Hornos Eléctricos`);
        }
        
        if (nuevaCategoria) {
          await Producto.findByIdAndUpdate(producto._id, { categoria: nuevaCategoria._id });
          totalReasignados++;
        }
      }
    }
    
    // 2. REVISAR PRODUCTOS DE HOGAR
    if (categoriaHogar) {
      console.log('\n🔍 Revisando productos de Hogar restantes...');
      const productos = await Producto.find({ categoria: categoriaHogar._id });
      
      const reasignacionesEspecificas = {
        // Cuidado personal
        'BELLISSIMA GH18': 'Cuidado Personal',
        'BELLISSIMA P3 3400': 'Cuidado Personal',
        
        // Gaming (crear nueva categoría o mover a otra existente)
        'SONY PLAYSTATION 5': 'Gaming', // Necesitaremos crear esta
        'TARGA WARRIOR PRO FM': 'Gaming',
        
        // Electrodomésticos de cocina específicos
        'DAEWOO DCF-650': 'Freidoras',
        'TELEFUNKEN EASYFRYER-6900': 'Freidoras', 
        'TELEFUNKEN AEROFRYER': 'Freidoras',
        'TST AVVOLTO': 'Tostadoras',
        'TST FORNELLO': 'Hornos Eléctricos',
        'BBQ GRILL': 'Parrillas Eléctricas',
        'MIDEA TO-M332SAR1': 'Hornos Eléctricos',
        'MORELLI DORATO': 'Hornos Eléctricos',
        'PHILIPS HR1832/00': 'Licuadoras y Batidoras',
        'ULTRACOMB LC-2500G': 'Licuadoras y Batidoras',
        'MIDEA TB-M115XAR1': 'Tostadoras',
        'CUISINART CPB800': 'Licuadoras y Batidoras',
        'ARIETE VINTAGE': 'Tostadoras',
        'BRAUN MQ7045': 'Licuadoras y Batidoras',
        'OSTER CKSTSM400': 'Licuadoras y Batidoras',
        'ARIETE GRATI 440': 'Procesadoras de Alimentos',
        
        // Aspiradoras y limpieza
        'SIRENA CA 3000': 'Aspiradoras',
        'SIRENA TB2400': 'Aspiradoras',
        'ULTRACOMB UC-55CN': 'Aspiradoras',
        
        // Lavado
        'SAMSUNG BESPOKE LA 8690': 'Lavarropas',
        'CANDY CF6C4F1PW': 'Lavarropas'
      };
      
      // Crear categoría Gaming si no existe
      let categoriaGaming = await Categoria.findOne({ nombre: 'Gaming' });
      if (!categoriaGaming) {
        categoriaGaming = new Categoria({
          nombre: 'Gaming',
          descripcion: 'Consolas de videojuegos y accesorios gaming'
        });
        await categoriaGaming.save();
        console.log('✅ Creada nueva categoría: Gaming');
      }
      
      for (const producto of productos) {
        const nombreProducto = `${producto.marca} ${producto.modelo}`;
        console.log(`\n📋 Analizando: ${nombreProducto}`);
        console.log(`    Descripción: ${producto.descripcion}`);
        console.log(`    Tags: ${producto.tags}`);
        
        const categoriaDestino = reasignacionesEspecificas[nombreProducto];
        
        if (categoriaDestino) {
          const nuevaCategoria = await Categoria.findOne({ nombre: categoriaDestino });
          if (nuevaCategoria) {
            await Producto.findByIdAndUpdate(producto._id, { categoria: nuevaCategoria._id });
            console.log(`    ✅ Reasignado a: ${categoriaDestino}`);
            totalReasignados++;
          } else {
            console.log(`    ❌ No se encontró la categoría: ${categoriaDestino}`);
          }
        } else {
          console.log(`    ⚠️  Producto no clasificado: ${nombreProducto}`);
        }
      }
    }
    
    console.log('\n=== RESUMEN FINAL ===');
    console.log(`📊 Productos reasignados en esta revisión: ${totalReasignados}`);
    
    // Estado final de categorías originales
    console.log('\n📋 Estado final de categorías originales:');
    const categoriasOriginales = [categoriaHogar, categoriaElectroCocina];
    
    for (const cat of categoriasOriginales) {
      if (cat) {
        const count = await Producto.countDocuments({ categoria: cat._id });
        console.log(`   ${cat.nombre}: ${count} productos restantes`);
      }
    }
    
    // Mostrar distribución de las nuevas categorías
    console.log('\n📊 Distribución en categorías específicas:');
    const nuevasCategorias = await Categoria.find({
      nombre: {
        $in: [
          'Heladeras No Frost', 'Heladeras con Freezer', 'Heladeras Compactas', 
          'Heladeras Doble Puerta', 'Heladeras Side by Side',
          'Parlantes Bluetooth', 'Barras de Sonido', 'Equipos de Música', 'Auriculares',
          'Hornos Eléctricos', 'Anafes y Cocinas', 'Freidoras', 'Licuadoras y Batidoras',
          'Tostadoras', 'Procesadoras de Alimentos', 'Parrillas Eléctricas', 'Sandwicheras',
          'Gaming'
        ]
      }
    });
    
    for (const categoria of nuevasCategorias) {
      const count = await Producto.countDocuments({ categoria: categoria._id });
      if (count > 0) {
        console.log(`   ${categoria.nombre}: ${count} productos`);
      }
    }
    
    console.log('\n✅ Revisión manual completada!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

revisarProductosPendientes();
