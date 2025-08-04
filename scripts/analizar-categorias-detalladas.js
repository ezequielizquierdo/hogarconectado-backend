const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

async function analizarCategorias() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('=== ANÁLISIS PARA CATEGORÍAS DETALLADAS ===\n');
    
    // Buscar la categoría de electrodomésticos de cocina
    const categoriaElectro = await Categoria.findOne({ nombre: /electrodomésticos.*cocina/i });
    if (!categoriaElectro) {
      console.log('No se encontró la categoría de electrodomésticos de cocina');
      return;
    }
    
    console.log('📋 Categoría a desglosar:', categoriaElectro.nombre);
    console.log('🆔 ID:', categoriaElectro._id);
    
    // Obtener productos de esta categoría
    const productos = await Producto.find({ categoria: categoriaElectro._id }).populate('categoria');
    
    console.log('\n=== PRODUCTOS POR TIPO SUGERIDO ===');
    
    // Agrupar productos por palabras clave en nombre/descripción
    const grupos = {};
    
    productos.forEach(producto => {
      const texto = (producto.nombre + ' ' + (producto.descripcion || '')).toLowerCase();
      
      // Categorizar por tipo específico de electrodoméstico
      if (texto.includes('microondas')) {
        grupos['Microondas'] = grupos['Microondas'] || [];
        grupos['Microondas'].push(producto.nombre);
      } else if (texto.includes('horno') && !texto.includes('microondas')) {
        grupos['Hornos Eléctricos'] = grupos['Hornos Eléctricos'] || [];
        grupos['Hornos Eléctricos'].push(producto.nombre);
      } else if (texto.includes('anafe') || (texto.includes('cocina') && !texto.includes('electrodomésticos'))) {
        grupos['Anafes y Cocinas'] = grupos['Anafes y Cocinas'] || [];
        grupos['Anafes y Cocinas'].push(producto.nombre);
      } else if (texto.includes('freidora')) {
        grupos['Freidoras'] = grupos['Freidoras'] || [];
        grupos['Freidoras'].push(producto.nombre);
      } else if (texto.includes('cafetera') || texto.includes('café')) {
        grupos['Cafeteras'] = grupos['Cafeteras'] || [];
        grupos['Cafeteras'].push(producto.nombre);
      } else if (texto.includes('licuadora') || texto.includes('batidora') || texto.includes('mixer')) {
        grupos['Licuadoras y Batidoras'] = grupos['Licuadoras y Batidoras'] || [];
        grupos['Licuadoras y Batidoras'].push(producto.nombre);
      } else if (texto.includes('tostadora') || texto.includes('tostador')) {
        grupos['Tostadoras'] = grupos['Tostadoras'] || [];
        grupos['Tostadoras'].push(producto.nombre);
      } else if (texto.includes('procesadora') || texto.includes('picadora')) {
        grupos['Procesadoras de Alimentos'] = grupos['Procesadoras de Alimentos'] || [];
        grupos['Procesadoras de Alimentos'].push(producto.nombre);
      } else if (texto.includes('parrilla') || texto.includes('grill') || texto.includes('plancha')) {
        grupos['Parrillas y Planchas'] = grupos['Parrillas y Planchas'] || [];
        grupos['Parrillas y Planchas'].push(producto.nombre);
      } else if (texto.includes('exprimidor') || texto.includes('juguera')) {
        grupos['Exprimidores y Jugos'] = grupos['Exprimidores y Jugos'] || [];
        grupos['Exprimidores y Jugos'].push(producto.nombre);
      } else if (texto.includes('sandwichera') || texto.includes('sandwich')) {
        grupos['Sandwicheras'] = grupos['Sandwicheras'] || [];
        grupos['Sandwicheras'].push(producto.nombre);
      } else if (texto.includes('multiprocesadora') || texto.includes('multi')) {
        grupos['Multiprocesadoras'] = grupos['Multiprocesadoras'] || [];
        grupos['Multiprocesadoras'].push(producto.nombre);
      } else {
        grupos['Otros Electrodomésticos Cocina'] = grupos['Otros Electrodomésticos Cocina'] || [];
        grupos['Otros Electrodomésticos Cocina'].push(producto.nombre);
      }
    });
    
    // Mostrar resultados ordenados por cantidad de productos
    const gruposOrdenados = Object.entries(grupos)
      .sort(([,a], [,b]) => b.length - a.length);
    
    gruposOrdenados.forEach(([tipo, productos]) => {
      console.log(`\n🔸 ${tipo} (${productos.length} productos):`);
      productos.forEach(nombre => console.log(`   • ${nombre}`));
    });
    
    console.log('\n=== RESUMEN PARA NUEVAS CATEGORÍAS ===');
    console.log(`📊 Total de productos en "Electrodomésticos de cocina": ${productos.length}`);
    console.log(`🏷️  Categorías específicas sugeridas: ${Object.keys(grupos).length}`);
    
    console.log('\n=== CATEGORÍAS RECOMENDADAS PARA CREAR ===');
    gruposOrdenados.forEach(([tipo, productos]) => {
      if (productos.length > 0) {
        console.log(`✅ ${tipo} - ${productos.length} producto${productos.length > 1 ? 's' : ''}`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

analizarCategorias();
