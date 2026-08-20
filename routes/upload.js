const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireRoles } = require('../middleware/auth');
const { isConfigured, uploadDataUri, uploadBuffer, deleteAsset } = require('../services/imageStorage');

const router = express.Router();
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, callback) => callback(null, allowedTypes.includes(file.mimetype))
});

const requireCloudinary = (_req, res, next) => {
  if (!isConfigured) return res.status(503).json({ success: false, message: 'El almacenamiento de imágenes no está configurado' });
  next();
};

router.post('/single', requireRoles('editor', 'admin'), requireCloudinary, upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No se envió una imagen válida' });
    const result = await uploadBuffer(req.file.buffer);
    res.status(201).json({ success: true, message: 'Imagen subida exitosamente', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al subir imagen', error: error.message });
  }
});

router.post('/multiple', requireRoles('editor', 'admin'), requireCloudinary, upload.array('imagenes', 5), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ success: false, message: 'No se enviaron imágenes válidas' });
    const results = await Promise.all(req.files.map(file => uploadBuffer(file.buffer)));
    res.status(201).json({ success: true, message: `${results.length} imágenes subidas exitosamente`, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al subir imágenes', error: error.message });
  }
});

router.post('/base64', requireRoles('editor', 'admin'), requireCloudinary, async (req, res) => {
  try {
    const { imageData, filename } = req.body;
    const match = typeof imageData === 'string' && imageData.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return res.status(400).json({ success: false, message: 'Formato de imagen Base64 inválido' });
    if (Buffer.byteLength(match[2], 'base64') > 8 * 1024 * 1024) return res.status(413).json({ success: false, message: 'La imagen supera el máximo de 8 MB' });
    const result = await uploadDataUri(imageData, filename);
    res.status(201).json({ success: true, message: 'Imagen subida exitosamente', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al subir imagen', error: error.message });
  }
});

router.delete('/cloudinary', requireRoles('editor', 'admin'), requireCloudinary, async (req, res) => {
  try {
    if (!req.body.publicId) return res.status(400).json({ success: false, message: 'publicId es requerido' });
    await deleteAsset(req.body.publicId);
    res.json({ success: true, message: 'Imagen eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar imagen', error: error.message });
  }
});

// Compatibilidad de lectura para imágenes locales históricas.
router.get('/image/:filename', (req, res) => {
  const imagePath = path.join(__dirname, '../uploads/images', path.basename(req.params.filename));
  if (!fs.existsSync(imagePath)) return res.status(404).json({ success: false, message: 'Imagen no encontrada' });
  res.sendFile(imagePath);
});

router.get('/status', requireRoles('admin'), (_req, res) => {
  res.json({ success: true, data: { provider: 'cloudinary', configured: isConfigured, maxFileSize: '8MB', maxFiles: 5, allowedTypes } });
});

module.exports = router;
