const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');

async function analizarTodasLasCategorias() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hogarconectado');
    console.log('=== ANÁLISIS COMPLETO DE CATEGORÍAS ===\n');
    
    // Obtener todas las categorías con conteo de productos
    const categorias = await Categoria.find({});
    
    console.log('📊 ANÁLISIS POR CATEGORÍA ACTUAL:');
    console.log('=====================================\n');
    
    for (const categoria of categorias) {
      const productos = await Producto.find({ categoria: categoria._id });
      console.log(`🏷️  ${categoria.nombre}`);
      console.log(`   📦 ${productos.length} productos`);
      
      if (productos.length > 10) {
        console.log('   ⚠️  CATEGORIA GRANDE - Candidata para subdividir');
        
        // Mostrar algunos ejemplos de productos
        console.log('   📋 Productos ejemplo:');
        productos.slice(0, 5).forEach(p => {
          console.log(`      • ${p.nombre || 'Sin nombre'}`);
        });
        if (productos.length > 5) {
          console.log(`      ... y ${productos.length - 5} más`);
        }
      } else if (productos.length > 0) {
        console.log('   📋 Productos:');
        productos.forEach(p => {
          console.log(`      • ${p.nombre || 'Sin nombre'}`);
        });
      }
      console.log('');
    }
    
    // Buscar productos sin categoría
    const productosSinCategoria = await Producto.find({ 
      $or: [
        { categoria: null }, 
        { categoria: { $exists: false } }
      ] 
    });
    
    if (productosSinCategoria.length > 0) {
      console.log('⚠️  PRODUCTOS SIN CATEGORÍA:');
      console.log('============================');
      productosSinCategoria.forEach(p => {
        console.log(`   • ${p.nombre || 'Sin nombre'} (ID: ${p._id})`);
      });
      console.log('');
    }
    
    // Análisis específico de categorías grandes
    console.log('🎯 CATEGORÍAS QUE NECESITAN SUBDIVISIÓN:');
    console.log('=========================================\n');
    
    const categoriasGrandes = [];
    for (const categoria of categorias) {
      const count = await Producto.countDocuments({ categoria: categoria._id });
      if (count > 8) {  // Umbral para considerar "grande"
        categoriasGrandes.push({ categoria, count });
      }
    }
    
    if (categoriasGrandes.length === 0) {
      console.log('✅ No hay categorías que necesiten subdivisión urgente.');
    } else {
      categoriasGrandes.sort((a, b) => b.count - a.count);
      categoriasGrandes.forEach(({ categoria, count }) => {
        console.log(`📈 ${categoria.nombre}: ${count} productos`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

analizarTodasLasCategorias();
