const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Categoria = require('../models/Categoria');
const { authenticate, requireRoles } = require('../middleware/auth');

// Cache simple en memoria para categorías
let categoriasCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// GET /api/categorias - Obtener todas las categorías (CON CACHE)
router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    
    // Verificar si tenemos cache válido
    if (categoriasCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        data: categoriasCache,
        count: categoriasCache.length,
        cached: true
      });
    }

    // Si no hay cache o está vencido, consultar DB
    const categorias = await Categoria.find({ activa: true })
      .sort({ nombre: 1 })
      .select('nombre descripcion icono')
      .lean(); // .lean() para mejor performance
    
    // Actualizar cache
    categoriasCache = categorias;
    cacheTimestamp = now;

    res.json({
      success: true,
      data: categorias,
      count: categorias.length,
      cached: false
    });
  } catch (error) {
    // Si hay error, intentar responder con cache aunque esté vencido
    if (categoriasCache) {
      return res.json({
        success: true,
        data: categoriasCache,
        count: categoriasCache.length,
        cached: true,
        warning: 'Datos desde cache por error en DB'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: error.message
    });
  }
});

// Función para limpiar cache
function clearCache() {
  categoriasCache = null;
  cacheTimestamp = 0;
}

// GET /api/categorias/:id - Obtener una categoría por ID
router.get('/:id', async (req, res) => {
  try {
    const categoria = await Categoria.findOne({ _id: req.params.id, activa: true })
      .select('nombre descripcion icono');
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      data: categoria
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría',
      error: error.message
    });
  }
});

// POST /api/categorias - Crear nueva categoría
router.post('/', authenticate, requireRoles('editor', 'admin'), [
  body('nombre')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('icono')
    .optional()
    .trim()
], async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const { nombre, descripcion, icono } = req.body;

    // Verificar si ya existe una categoría con ese nombre
    const categoriaExistente = await Categoria.findOne({ nombre });
    if (categoriaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    const nuevaCategoria = new Categoria({
      nombre,
      descripcion,
      icono: icono || '📦'
    });

    await nuevaCategoria.save();

    // Limpiar cache después de crear
    clearCache();

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: nuevaCategoria
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría',
      error: error.message
    });
  }
});

// PUT /api/categorias/:id - Actualizar categoría
router.put('/:id', authenticate, requireRoles('editor', 'admin'), [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const categoria = await Categoria.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Limpiar cache después de actualizar
    clearCache();

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: categoria
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría',
      error: error.message
    });
  }
});

// DELETE /api/categorias/:id - Eliminar categoría (soft delete)
router.delete('/:id', authenticate, requireRoles('admin'), async (req, res) => {
  try {
    const categoria = await Categoria.findByIdAndUpdate(
      req.params.id,
      { activa: false },
      { new: true }
    );

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Limpiar cache después de eliminar
    clearCache();

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría',
      error: error.message
    });
  }
});

module.exports = router;
