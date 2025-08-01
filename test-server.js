const express = require('express');
const mongoose = require('mongoose');
const Producto = require('./models/Producto');

const app = express();

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/hogarconectado')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error MongoDB:', err));

// Ruta de prueba
app.get('/test', async (req, res) => {
  try {
    const filtros = { activo: true };
    const productos = await Producto.find(filtros).limit(3);
    
    res.json({
      success: true,
      message: `Encontrados ${productos.length} productos`,
      data: productos.map(p => ({
        marca: p.marca,
        modelo: p.modelo,
        activo: p.activo,
        categoria: p.categoria
      }))
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de prueba en puerto ${PORT}`);
});
