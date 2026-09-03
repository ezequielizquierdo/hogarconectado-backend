const express = require('express');
const rateLimit = require('express-rate-limit');
const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');
const { requireRoles } = require('../middleware/auth');
const { analyzeProductImage } = require('../services/productImageAnalysis');

const router = express.Router();
const analysisLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function findPossibleDuplicates(draft) {
  if (!draft.marca || !draft.modelo) return [];
  return Producto.find({
    activo: true,
    marca: { $regex: `^${escapeRegex(draft.marca.trim())}$`, $options: 'i' },
    modelo: { $regex: `^${escapeRegex(draft.modelo.trim())}$`, $options: 'i' }
  })
    .select('marca modelo imagenes')
    .limit(5)
    .lean();
}

router.post('/duplicates', requireRoles('editor', 'admin'), async (req, res) => {
  const marca = typeof req.body?.marca === 'string' ? req.body.marca.trim() : '';
  const modelo = typeof req.body?.modelo === 'string' ? req.body.modelo.trim() : '';
  if (!marca || !modelo || marca.length > 100 || modelo.length > 200) {
    return res.status(400).json({ success: false, message: 'Ingresá una marca y un modelo válidos' });
  }
  const matches = await findPossibleDuplicates({ marca, modelo });
  return res.json({
    success: true,
    data: matches.map(product => ({
      _id: product._id,
      marca: product.marca,
      modelo: product.modelo,
      imagen: product.imagenes?.[0]
    }))
  });
});

router.post('/analyze', requireRoles('editor', 'admin'), analysisLimiter, async (req, res) => {
  try {
    const categories = await Categoria.find({ activa: true }).select('nombre').sort({ nombre: 1 }).lean();
    const draft = await analyzeProductImage({
      imageData: req.body?.imageData,
      categoryNames: categories.map(category => category.nombre)
    });
    const possibleDuplicates = await findPossibleDuplicates(draft);
    res.json({
      success: true,
      data: {
        ...draft,
        possibleDuplicates: possibleDuplicates.map(product => ({
          _id: product._id,
          marca: product.marca,
          modelo: product.modelo,
          imagen: product.imagenes?.[0]
        }))
      }
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      message: status >= 500 && process.env.NODE_ENV === 'production'
        ? 'No pudimos analizar la imagen en este momento'
        : error.message
    });
  }
});

module.exports = router;
module.exports.findPossibleDuplicates = findPossibleDuplicates;
