const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

async function diagnosticarProductos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('=== DIAGNÓSTICO DE PRODUCTOS ===\n');
    
    // 1. Contar total de productos
    const totalProductos = await Producto.countDocuments();
    const productosActivos = await Producto.countDocuments({ activo: true });
    const productosInactivos = await Producto.countDocuments({ activo: false });
    
    console.log('📊 TOTALES:');
    console.log(`   Total de productos: ${totalProductos}`);
    console.log(`   Productos activos: ${productosActivos}`);
    console.log(`   Productos inactivos: ${productosInactivos}`);
    
    // 2. Verificar productos por categoría
    console.log('\n📦 PRODUCTOS POR CATEGORÍA:');
    const productosPorCategoria = await Producto.aggregate([
      { $match: { activo: true } },
      {
        $lookup: {
          from: 'categorias',
          localField: 'categoria',
          foreignField: '_id',
          as: 'categoriaInfo'
        }
      },
      {
        $group: {
          _id: '$categoria',
          count: { $sum: 1 },
          categoria: { $first: '$categoriaInfo.nombre' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    productosPorCategoria.forEach(item => {
      const nombreCategoria = item.categoria[0] || 'Sin categoría';
      console.log(`   ${nombreCategoria}: ${item.count} productos`);
    });
    
    // 3. Simular query del endpoint con diferentes límites
    console.log('\n🔍 SIMULACIÓN DEL ENDPOINT:');
    
    // Sin límite
    const todosSinLimite = await Producto.find({ activo: true })
      .populate('categoria', 'nombre')
      .sort({ createdAt: -1 });
    console.log(`   Sin límite: ${todosSinLimite.length} productos`);
    
    // Con límite 50 (default)
    const conLimite50 = await Producto.find({ activo: true })
      .populate('categoria', 'nombre')
      .sort({ createdAt: -1 })
      .limit(50);
    console.log(`   Con límite 50: ${conLimite50.length} productos`);
    
    // Con límite 100
    const conLimite100 = await Producto.find({ activo: true })
      .populate('categoria', 'nombre')
      .sort({ createdAt: -1 })
      .limit(100);
    console.log(`   Con límite 100: ${conLimite100.length} productos`);
    
    // 4. Verificar productos sin categoría
    const productosSinCategoria = await Producto.find({ 
      activo: true,
      $or: [
        { categoria: null },
        { categoria: { $exists: false } }
      ]
    });
    
    if (productosSinCategoria.length > 0) {
      console.log(`\n⚠️  PRODUCTOS SIN CATEGORÍA: ${productosSinCategoria.length}`);
      productosSinCategoria.slice(0, 5).forEach(p => {
        console.log(`   • ${p.marca} ${p.modelo}`);
      });
    }
    
    // 5. Verificar productos con problemas en marca/modelo
    const productosConProblemas = await Producto.find({
      activo: true,
      $or: [
        { marca: { $in: [null, undefined, ''] } },
        { modelo: { $in: [null, undefined, ''] } }
      ]
    });
    
    if (productosConProblemas.length > 0) {
      console.log(`\n⚠️  PRODUCTOS CON DATOS FALTANTES: ${productosConProblemas.length}`);
      productosConProblemas.slice(0, 5).forEach(p => {
        console.log(`   • Marca: "${p.marca}", Modelo: "${p.modelo}"`);
      });
    }
    
    // 6. Mostrar primeros 10 productos como muestra
    console.log('\n📋 MUESTRA DE PRODUCTOS (primeros 10):');
    const muestra = await Producto.find({ activo: true })
      .populate('categoria', 'nombre')
      .sort({ createdAt: -1 })
      .limit(10);
    
    muestra.forEach((producto, index) => {
      const categoria = producto.categoria?.nombre || 'Sin categoría';
      console.log(`   ${index + 1}. ${producto.marca} ${producto.modelo} - ${categoria}`);
    });
    
    console.log('\n💡 RECOMENDACIONES:');
    if (totalProductos > 50) {
      console.log('   • El endpoint tiene un límite de 50 productos por defecto');
      console.log('   • Para ver todos los productos, usar: /api/productos?limite=200');
      console.log('   • O implementar paginación: /api/productos?pagina=2&limite=50');
    }
    
    if (productosSinCategoria.length > 0) {
      console.log('   • Hay productos sin categoría asignada que requieren atención');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

diagnosticarProductos();
