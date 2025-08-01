const mongoose = require('mongoose');
const Categoria = require('./models/Categoria');
const Producto = require('./models/Producto');

async function arreglarCategorias() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('✅ Conectado a MongoDB');
    
    // Crear categorías básicas
    const categorias = [
      { nombre: 'Refrigeración', descripcion: 'Heladeras y freezers', icono: '❄️' },
      { nombre: 'Lavado', descripcion: 'Lavarropas y secarropas', icono: '👕' },
      { nombre: 'Cocina', descripcion: 'Cocinas y hornos', icono: '🍳' },
      { nombre: 'Climatización', descripcion: 'Aires acondicionados', icono: '🌡️' },
      { nombre: 'Pequeños Electrodomésticos', descripcion: 'Microondas, tostadoras, etc.', icono: '⚡' }
    ];
    
    console.log('🏷️ Creando categorías...');
    for (const cat of categorias) {
      const existe = await Categoria.findOne({ nombre: cat.nombre });
      if (!existe) {
        await Categoria.create(cat);
        console.log(`   ✅ ${cat.nombre}`);
      } else {
        console.log(`   ⏭️ ${cat.nombre} ya existe`);
      }
    }
    
    // Obtener la primera categoría para asignar a productos sin categoría
    const primeraCategoria = await Categoria.findOne();
    console.log(`🔗 Categoría por defecto: ${primeraCategoria.nombre} (${primeraCategoria._id})`);
    
    // Actualizar productos sin categoría válida
    const resultado = await Producto.updateMany(
      { 
        $or: [
          { categoria: { $exists: false } },
          { categoria: null }
        ]
      },
      { 
        $set: { categoria: primeraCategoria._id }
      }
    );
    
    console.log(`✅ Productos actualizados con categoría: ${resultado.modifiedCount}`);
    
    // Verificar
    const productosActivos = await Producto.countDocuments({ activo: true });
    console.log(`📦 Total productos activos: ${productosActivos}`);
    
    await mongoose.disconnect();
    console.log('👋 Reparación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

arreglarCategorias();
