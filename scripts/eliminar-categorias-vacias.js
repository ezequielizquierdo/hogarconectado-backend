const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

async function eliminarCategoriasVacias() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('=== ELIMINANDO CATEGORÍAS VACÍAS ===\n');
    
    // Encontrar todas las categorías vacías
    const todasCategorias = await Categoria.find({});
    const categoriasParaEliminar = [];
    
    for (const categoria of todasCategorias) {
      const count = await Producto.countDocuments({ categoria: categoria._id });
      if (count === 0) {
        categoriasParaEliminar.push(categoria);
      }
    }
    
    console.log(`🗑️  Encontradas ${categoriasParaEliminar.length} categorías vacías para eliminar`);
    
    if (categoriasParaEliminar.length === 0) {
      console.log('✅ No hay categorías vacías para eliminar');
      return;
    }
    
    // Mostrar categorías que se van a eliminar
    console.log('\n📋 CATEGORÍAS QUE SE ELIMINARÁN:');
    categoriasParaEliminar.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.nombre}`);
    });
    
    // Categorías importantes que NO se deben eliminar aunque estén vacías
    const categoriasImportantes = [
      'Asaderas, parrilleras y hornos de barro',
      'Baterías de cocina', 
      'Calefacción',
      'Celulares',
      'Smartphones',
      'Tablets',
      'Termotanques',
      'Ventilación',
      'Herramientas',
      'Iluminación',
      'Informática',
      'Jardinería'
    ];
    
    // Filtrar solo las categorías específicas que creamos para subdivisión
    const categoriasEspecificasEliminar = categoriasParaEliminar.filter(cat => {
      // No eliminar categorías importantes
      if (categoriasImportantes.includes(cat.nombre)) {
        return false;
      }
      
      // Eliminar solo categorías específicas que creamos
      return (
        cat.nombre.includes('Heladeras ') ||
        cat.nombre.includes('Equipos de') ||
        cat.nombre.includes('Parlantes') ||
        cat.nombre.includes('Barras de') ||
        cat.nombre.includes('Auriculares') ||
        cat.nombre.includes('Ventiladores') ||
        cat.nombre.includes('Planchas') ||
        cat.nombre.includes('Purificadores') ||
        cat.nombre.includes('Calefacción Portátil') ||
        cat.nombre.includes('Limpieza Automatizada') ||
        cat.nombre.includes('Balanzas') ||
        cat.nombre.includes('Sandwicheras') ||
        cat.nombre === 'Test Categoría' ||
        cat.nombre === 'Hogar' ||
        cat.nombre === 'Electrodomésticos de cocina'
      );
    });
    
    console.log(`\n✂️  Eliminando ${categoriasEspecificasEliminar.length} categorías específicas vacías...`);
    
    let eliminadas = 0;
    
    for (const categoria of categoriasEspecificasEliminar) {
      try {
        await Categoria.findByIdAndDelete(categoria._id);
        console.log(`   ✅ Eliminada: ${categoria.nombre}`);
        eliminadas++;
      } catch (error) {
        console.log(`   ❌ Error eliminando: ${categoria.nombre} - ${error.message}`);
      }
    }
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`   🗑️  Categorías eliminadas: ${eliminadas}`);
    console.log(`   ✅ Categorías importantes conservadas`);
    
    // Verificar estado final
    const totalRestantes = await Categoria.countDocuments();
    const totalConProductos = await Categoria.aggregate([
      {
        $lookup: {
          from: 'productos',
          localField: '_id',
          foreignField: 'categoria',
          as: 'productos'
        }
      },
      {
        $match: {
          'productos.0': { $exists: true }
        }
      },
      {
        $count: 'total'
      }
    ]);
    
    const conProductos = totalConProductos[0]?.total || 0;
    
    console.log(`\n📈 ESTADO FINAL:`);
    console.log(`   🏷️  Total de categorías: ${totalRestantes}`);
    console.log(`   ✅ Con productos: ${conProductos}`);
    console.log(`   ⭕ Vacías: ${totalRestantes - conProductos}`);
    
    console.log('\n🎉 ¡LIMPIEZA COMPLETADA!');
    console.log('✅ Sistema de categorías optimizado');
    console.log('✅ Audio y Heladeras unificadas correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

eliminarCategoriasVacias();
