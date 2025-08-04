const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

async function analizarCategoriasDetallado() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('=== ANÁLISIS DETALLADO PARA SUBDIVISIÓN DE CATEGORÍAS ===\n');
    
    // Obtener todas las categorías con conteo de productos
    const categorias = await Categoria.find({});
    
    const categoriasGrandes = [];
    
    // Analizar cada categoría
    for (const categoria of categorias) {
      const productos = await Producto.find({ categoria: categoria._id });
      
      if (productos.length > 6) {  // Categorías con más de 6 productos
        categoriasGrandes.push({
          categoria: categoria.nombre,
          id: categoria._id,
          productos: productos,
          count: productos.length
        });
      }
    }
    
    if (categoriasGrandes.length === 0) {
      console.log('✅ No hay categorías que necesiten subdivisión.');
      return;
    }
    
    // Ordenar por cantidad de productos
    categoriasGrandes.sort((a, b) => b.count - a.count);
    
    console.log('🎯 CATEGORÍAS QUE NECESITAN SUBDIVISIÓN:\n');
    
    for (const { categoria, productos, count } of categoriasGrandes) {
      console.log(`📈 ${categoria} (${count} productos)`);
      console.log('=' + '='.repeat(categoria.length + count.toString().length + 13));
      
      // Analizar productos para sugerir subcategorías
      const subcategorias = new Map();
      
      productos.forEach(producto => {
        const nombreCompleto = `${producto.marca} ${producto.modelo}`.toLowerCase();
        const descripcion = (producto.descripcion || '').toLowerCase();
        const texto = `${nombreCompleto} ${descripcion}`;
        
        let subcategoria = 'Otros';
        
        // Lógica específica por categoría
        if (categoria === 'Heladeras') {
          if (texto.includes('frío seco') || texto.includes('no frost')) {
            subcategoria = 'Heladeras No Frost';
          } else if (texto.includes('freezer')) {
            subcategoria = 'Heladeras con Freezer';
          } else if (texto.includes('una puerta') || texto.includes('compacta')) {
            subcategoria = 'Heladeras Compactas';
          } else if (texto.includes('dos puertas') || texto.includes('doble puerta')) {
            subcategoria = 'Heladeras Doble Puerta';
          } else if (texto.includes('side by side') || texto.includes('americanas')) {
            subcategoria = 'Heladeras Americanas';
          } else {
            subcategoria = 'Heladeras Convencionales';
          }
        } else if (categoria === 'Hogar') {
          if (texto.includes('ventilador')) {
            subcategoria = 'Ventiladores';
          } else if (texto.includes('plancha')) {
            subcategoria = 'Planchas';
          } else if (texto.includes('purificador') || texto.includes('humidificador')) {
            subcategoria = 'Purificadores y Humidificadores';
          } else if (texto.includes('calefactor') || texto.includes('estufa')) {
            subcategoria = 'Calefacción';
          } else if (texto.includes('robot') || texto.includes('aspirador')) {
            subcategoria = 'Limpieza Automatizada';
          } else if (texto.includes('balanza') || texto.includes('peso')) {
            subcategoria = 'Balanzas';
          } else {
            subcategoria = 'Otros Hogar';
          }
        } else if (categoria === 'Electrodomésticos de cocina') {
          if (texto.includes('microondas')) {
            subcategoria = 'Microondas';
          } else if (texto.includes('horno') && !texto.includes('microondas')) {
            subcategoria = 'Hornos Eléctricos';
          } else if (texto.includes('anafe') || texto.includes('cocina')) {
            subcategoria = 'Anafes y Cocinas';
          } else if (texto.includes('freidora')) {
            subcategoria = 'Freidoras';
          } else if (texto.includes('cafetera') || texto.includes('café')) {
            subcategoria = 'Cafeteras';
          } else if (texto.includes('licuadora') || texto.includes('batidora')) {
            subcategoria = 'Licuadoras y Batidoras';
          } else if (texto.includes('tostadora')) {
            subcategoria = 'Tostadoras';
          } else if (texto.includes('procesadora') || texto.includes('picadora')) {
            subcategoria = 'Procesadoras';
          } else if (texto.includes('parrilla') || texto.includes('grill')) {
            subcategoria = 'Parrillas Eléctricas';
          } else {
            subcategoria = 'Otros Electrodomésticos';
          }
        } else if (categoria === 'Equipos de audio') {
          if (texto.includes('bluetooth') || texto.includes('portátil')) {
            subcategoria = 'Parlantes Bluetooth';
          } else if (texto.includes('barra') || texto.includes('soundbar')) {
            subcategoria = 'Barras de Sonido';
          } else if (texto.includes('equipo') || texto.includes('minicomponente')) {
            subcategoria = 'Equipos de Música';
          } else if (texto.includes('auricular') || texto.includes('headphone')) {
            subcategoria = 'Auriculares';
          } else {
            subcategoria = 'Otros Audio';
          }
        }
        
        if (!subcategorias.has(subcategoria)) {
          subcategorias.set(subcategoria, []);
        }
        subcategorias.get(subcategoria).push(`${producto.marca} ${producto.modelo}`);
      });
      
      // Mostrar subcategorías sugeridas
      console.log('📋 Subcategorías sugeridas:');
      [...subcategorias.entries()]
        .sort(([,a], [,b]) => b.length - a.length)
        .forEach(([subcategoria, productos]) => {
          console.log(`\n   🔸 ${subcategoria} (${productos.length} productos):`);
          productos.forEach(nombre => {
            console.log(`      • ${nombre}`);
          });
        });
      
      console.log('\n');
    }
    
    // Generar recomendaciones de acción
    console.log('💡 RECOMENDACIONES DE ACCIÓN:');
    console.log('============================\n');
    
    categoriasGrandes.forEach(({ categoria, count }) => {
      console.log(`🎯 ${categoria}:`);
      console.log(`   • Dividir en subcategorías más específicas`);
      console.log(`   • Esto mejorará la experiencia de navegación`);
      console.log(`   • Facilitará los filtros de búsqueda\n`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

analizarCategoriasDetallado();
