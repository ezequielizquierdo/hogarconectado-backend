const express = require('express');
const { body, validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const { authenticate, signSession } = require('../middleware/auth');
const { verifyGoogleCredential } = require('../services/googleAuth');

const router = express.Router();

router.post('/google', [
  body('credential').isString().notEmpty().withMessage('La credencial de Google es requerida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Credencial inválida', errors: errors.array() });
    }

    const identidad = await verifyGoogleCredential(req.body.credential);
    const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    let usuario = await Usuario.findOne({
      $or: [{ googleId: identidad.googleId }, { email: identidad.email }]
    });

    if (!usuario) {
      const esAdminInicial = Boolean(initialAdminEmail && identidad.email === initialAdminEmail);
      usuario = await Usuario.create({
        ...identidad,
        rol: esAdminInicial ? 'admin' : 'consulta',
        estado: esAdminInicial ? 'activo' : 'pendiente',
        aprobadoEn: esAdminInicial ? new Date() : undefined
      });
    } else {
      usuario.googleId = identidad.googleId;
      usuario.email = identidad.email;
      usuario.nombre = identidad.nombre;
      usuario.foto = identidad.foto;
      await usuario.save();
    }

    if (usuario.estado === 'pendiente') {
      return res.status(202).json({ success: true, data: { usuario }, message: 'Acceso pendiente de aprobación' });
    }
    if (usuario.estado === 'bloqueado') {
      return res.status(403).json({ success: false, data: { usuario }, message: 'El acceso está bloqueado' });
    }

    usuario.ultimoAcceso = new Date();
    await usuario.save();
    res.json({ success: true, data: { token: signSession(usuario), usuario } });
  } catch (error) {
    console.error('Error de autenticación:', error.message);
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
      return res.status(503).json({ success: false, message: 'La autenticación todavía no está configurada' });
    }
    res.status(401).json({ success: false, message: 'No se pudo validar la cuenta de Google' });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true, message: 'Sesión cerrada' });
});

module.exports = router;
