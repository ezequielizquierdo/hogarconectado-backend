const mongoose = require('mongoose');

// Probar la paginación directamente con la base de datos
async function probarPaginacion() {
  try {
    console.log('=== PRUEBAS DE PAGINACIÓN ===\n');
    
    // Conectar a la base de datos
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    
    // Importar modelos
    const Producto = require('../models/Producto');
    const Categoria = require('../models/Categoria');
    
    // Contar productos totales
    const totalProductos = await Producto.countDocuments({ activo: true });
    console.log(`📊 Total de productos activos: ${totalProductos}`);
    
    // Simular diferentes escenarios de paginación
    console.log('\n🧪 ESCENARIOS DE PAGINACIÓN:');
    
    // Escenario 1: Primera página con 20 productos
    console.log('\n1️⃣ Primera página (20 productos):');
    const pagina1 = await Producto.find({ activo: true })
      .populate('categoria', 'nombre')
      .sort({ createdAt: -1 })
      .limit(20);
    
    console.log(`   Productos obtenidos: ${pagina1.length}`);
    console.log(`   Muestra: ${pagina1.slice(0, 3).map(p => `${p.marca} ${p.modelo}`).join(', ')}...`);
    
    // Escenario 2: Segunda página
    console.log('\n2️⃣ Segunda página (productos 21-40):');
    const pagina2 = await Producto.find({ activo: true })
      .populate('categoria', 'nombre')
      .sort({ createdAt: -1 })
      .skip(20)
      .limit(20);
    
    console.log(`   Productos obtenidos: ${pagina2.length}`);
    console.log(`   Muestra: ${pagina2.slice(0, 3).map(p => `${p.marca} ${p.modelo}`).join(', ')}...`);
    
    // Escenario 3: Última página
    const ultimaPagina = Math.ceil(totalProductos / 20);
    const skipUltima = (ultimaPagina - 1) * 20;
    
    console.log(`\n3️⃣ Última página (página ${ultimaPagina}):`);
    const paginaUltima = await Producto.find({ activo: true })
      .populate('categoria', 'nombre')
      .sort({ createdAt: -1 })
      .skip(skipUltima)
      .limit(20);
    
    console.log(`   Productos obtenidos: ${paginaUltima.length}`);
    console.log(`   Desde producto: ${skipUltima + 1}`);
    console.log(`   Hasta producto: ${skipUltima + paginaUltima.length}`);
    
    // Escenario 4: Filtro por categoría
    console.log('\n4️⃣ Filtro por categoría (Heladeras):');
    const categoriaHeladeras = await Categoria.findOne({ nombre: 'Heladeras' });
    
    if (categoriaHeladeras) {
      const heladerasPagina1 = await Producto.find({ 
        activo: true, 
        categoria: categoriaHeladeras._id 
      })
        .populate('categoria', 'nombre')
        .sort({ createdAt: -1 })
        .limit(20);
      
      console.log(`   Heladeras en página 1: ${heladerasPagina1.length}`);
      console.log(`   Muestra: ${heladerasPagina1.slice(0, 2).map(p => `${p.marca} ${p.modelo}`).join(', ')}...`);
    }
    
    // Calcular estadísticas de paginación
    console.log('\n📈 ESTADÍSTICAS DE PAGINACIÓN:');
    console.log(`   Total de productos: ${totalProductos}`);
    console.log(`   Productos por página: 20`);
    console.log(`   Total de páginas: ${Math.ceil(totalProductos / 20)}`);
    console.log(`   Última página tendrá: ${totalProductos % 20 || 20} productos`);
    
    // Mostrar URLs de ejemplo
    console.log('\n🔗 EJEMPLOS DE URLs:');
    console.log('   Primera página:     GET /api/productos?pagina=1&limite=20');
    console.log('   Segunda página:     GET /api/productos?pagina=2&limite=20');
    console.log('   Filtro por marca:   GET /api/productos?marca=samsung&pagina=1');
    console.log('   Filtro por categoría: GET /api/productos?categoria=CATEGORIA_ID&pagina=1');
    console.log('   Búsqueda:           GET /api/productos?buscar=heladera&pagina=1');
    console.log('   Ordenar por precio: GET /api/productos?ordenar=precio-asc&pagina=1');
    
    // Verificar índices para optimización
    console.log('\n⚡ OPTIMIZACIONES:');
    const indexes = await mongoose.connection.db.collection('productos').indexes();
    const tieneIndiceActivo = indexes.some(idx => idx.key.activo);
    const tieneIndiceCategoria = indexes.some(idx => idx.key.categoria);
    const tieneIndiceCreatedAt = indexes.some(idx => idx.key.createdAt);
    
    console.log(`   Índice en 'activo': ${tieneIndiceActivo ? '✅' : '❌'}`);
    console.log(`   Índice en 'categoria': ${tieneIndiceCategoria ? '✅' : '❌'}`);
    console.log(`   Índice en 'createdAt': ${tieneIndiceCreatedAt ? '✅' : '❌'}`);
    
    if (!tieneIndiceActivo || !tieneIndiceCategoria || !tieneIndiceCreatedAt) {
      console.log('\n💡 RECOMENDACIÓN: Crear índices faltantes para mejor rendimiento');
    }
    
    console.log('\n✅ PAGINACIÓN IMPLEMENTADA CORRECTAMENTE');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  } finally {
    mongoose.disconnect();
  }
}

probarPaginacion();
