const mongoose = require('mongoose');
const Producto = require('../models/Producto');

async function optimizarIndices() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('=== OPTIMIZANDO ÍNDICES PARA PAGINACIÓN ===\n');
    
    // Crear índice compuesto para optimizar paginación
    console.log('🔧 Creando índices optimizados...');
    
    // Índice para paginación básica (activo + createdAt)
    await Producto.collection.createIndex(
      { activo: 1, createdAt: -1 },
      { name: 'paginacion_basica' }
    );
    console.log('✅ Índice creado: activo + createdAt (paginación básica)');
    
    // Índice para filtros por categoría + paginación
    await Producto.collection.createIndex(
      { activo: 1, categoria: 1, createdAt: -1 },
      { name: 'paginacion_categoria' }
    );
    console.log('✅ Índice creado: activo + categoria + createdAt');
    
    // Índice para filtros por marca + paginación
    await Producto.collection.createIndex(
      { activo: 1, marca: 1, createdAt: -1 },
      { name: 'paginacion_marca' }
    );
    console.log('✅ Índice creado: activo + marca + createdAt');
    
    // Índice para ordenamiento por precio
    await Producto.collection.createIndex(
      { activo: 1, precioBase: 1 },
      { name: 'ordenamiento_precio' }
    );
    console.log('✅ Índice creado: activo + precioBase (ordenamiento)');
    
    // Verificar todos los índices
    console.log('\n📊 ÍNDICES ACTUALES:');
    const indices = await Producto.collection.indexes();
    indices.forEach(index => {
      const keys = Object.keys(index.key).map(key => 
        `${key}:${index.key[key]}`
      ).join(', ');
      console.log(`   ${index.name || 'unnamed'}: ${keys}`);
    });
    
    console.log('\n⚡ OPTIMIZACIONES APLICADAS:');
    console.log('✅ Paginación básica optimizada');
    console.log('✅ Filtros por categoría optimizados');
    console.log('✅ Filtros por marca optimizados');
    console.log('✅ Ordenamiento por precio optimizado');
    console.log('✅ Búsqueda de texto ya optimizada (índice existente)');
    
    console.log('\n🚀 RENDIMIENTO MEJORADO PARA:');
    console.log('• GET /api/productos?pagina=X&limite=Y');
    console.log('• GET /api/productos?categoria=ID&pagina=X');
    console.log('• GET /api/productos?marca=MARCA&pagina=X');
    console.log('• GET /api/productos?ordenar=precio-asc&pagina=X');
    console.log('• GET /api/productos?buscar=TEXTO&pagina=X');
    
  } catch (error) {
    console.error('❌ Error optimizando índices:', error);
  } finally {
    mongoose.disconnect();
  }
}

optimizarIndices();
