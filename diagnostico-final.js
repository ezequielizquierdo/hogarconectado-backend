const mongoose = require('mongoose');
const Producto = require('./models/Producto');

async function diagnosticar() {
  try {
    console.log('🔍 DIAGNÓSTICO COMPLETO DEL API');
    console.log('=' .repeat(50));
    
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('✅ Conectado a MongoDB');
    
    // 1. Verificar productos en la base de datos
    const totalProductos = await Producto.countDocuments({});
    console.log(`\n📊 Total productos en BD: ${totalProductos}`);
    
    // 2. Verificar productos activos
    const productosActivos = await Producto.countDocuments({ activo: true });
    console.log(`✅ Productos activos: ${productosActivos}`);
    
    // 3. Simular la consulta exacta del endpoint
    console.log('\n🎯 SIMULANDO CONSULTA DEL ENDPOINT:');
    const filtros = { activo: true };
    console.log('Filtros aplicados:', JSON.stringify(filtros, null, 2));
    
    // Sin populate para ver si el problema está ahí
    const productos = await Producto.find(filtros).limit(5);
    console.log(`📦 Productos encontrados SIN populate: ${productos.length}`);
    
    if (productos.length > 0) {
      productos.forEach((p, i) => {
        console.log(`  ${i+1}. ${p.marca} ${p.modelo}`);
        console.log(`      Activo: ${p.activo}`);
        console.log(`      Categoría ID: ${p.categoria}`);
        console.log(`      Stock: ${JSON.stringify(p.stock)}`);
      });
    }
    
    // 4. Probar con populate (como en el endpoint)
    console.log('\n🔗 CON POPULATE:');
    try {
      const productosConPopulate = await Producto.find(filtros)
        .populate('categoria', 'nombre icono')
        .limit(5);
      console.log(`📦 Productos encontrados CON populate: ${productosConPopulate.length}`);
      
      if (productosConPopulate.length > 0) {
        productosConPopulate.forEach((p, i) => {
          console.log(`  ${i+1}. ${p.marca} ${p.modelo}`);
          console.log(`      Categoría: ${p.categoria?.nombre || 'NO ENCONTRADA'}`);
        });
      }
    } catch (populateError) {
      console.error('❌ Error en populate:', populateError.message);
    }
    
    // 5. Verificar categorías
    const Categoria = require('./models/Categoria');
    const totalCategorias = await Categoria.countDocuments({});
    console.log(`\n🏷️ Total categorías: ${totalCategorias}`);
    
    if (totalCategorias === 0) {
      console.log('⚠️ NO HAY CATEGORÍAS - Este podría ser el problema!');
    }
    
    // 6. Verificar referencias rotas
    const productosConCategoriaInvalida = await Producto.aggregate([
      {
        $lookup: {
          from: 'categorias',
          localField: 'categoria',
          foreignField: '_id',
          as: 'categoriaEncontrada'
        }
      },
      {
        $match: {
          activo: true,
          categoriaEncontrada: { $size: 0 }
        }
      },
      {
        $count: "total"
      }
    ]);
    
    const referencias_rotas = productosConCategoriaInvalida[0]?.total || 0;
    console.log(`🔗 Productos con referencias de categoría rotas: ${referencias_rotas}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
    console.error('Stack:', error.stack);
  }
}

diagnosticar();
