const express = require('express');
const rateLimit = require('express-rate-limit');
const Categoria = require('../models/Categoria');
const { requireRoles } = require('../middleware/auth');
const { analyzeProductImage } = require('../services/productImageAnalysis');

const router = express.Router();
const analysisLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

router.post('/analyze', requireRoles('editor', 'admin'), analysisLimiter, async (req, res) => {
  try {
    const categories = await Categoria.find({ activa: true }).select('nombre').sort({ nombre: 1 }).lean();
    const draft = await analyzeProductImage({
      imageData: req.body?.imageData,
      categoryNames: categories.map(category => category.nombre)
    });
    res.json({ success: true, data: draft });
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
