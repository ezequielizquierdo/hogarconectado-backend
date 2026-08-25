const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado');
  }
  return process.env.JWT_SECRET;
}

function signSession(usuario) {
  return jwt.sign(
    { sub: usuario._id.toString() },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

async function authenticate(req, res, next) {
  try {
    const authorization = req.get('authorization') || '';
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const payload = jwt.verify(token, getJwtSecret());
    const usuario = await Usuario.findById(payload.sub);
    if (!usuario) {
      return res.status(403).json({ success: false, message: 'La cuenta asociada a esta sesión ya no está disponible' });
    }
    if (usuario.estado === 'pendiente') {
      return res.status(403).json({ success: false, code: 'ACCESS_PENDING', message: 'Tu acceso todavía está pendiente de aprobación' });
    }
    if (usuario.estado === 'bloqueado') {
      return res.status(403).json({ success: false, code: 'ACCESS_BLOCKED', message: 'Tu acceso fue bloqueado. Contactá a un administrador para solicitar la reactivación' });
    }

    req.user = usuario;
    next();
  } catch (error) {
    const status = error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError' ? 401 : 500;
    res.status(status).json({
      success: false,
      message: status === 401 ? 'Sesión inválida o vencida' : 'Error de autenticación'
    });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ success: false, message: 'No tenés permisos para esta acción' });
    }
    next();
  };
}

function canAccessOwnedResource(ownerId, usuario) {
  return usuario.rol === 'admin' || usuario.rol === 'editor' || ownerId?.toString() === usuario._id.toString();
}

module.exports = { authenticate, canAccessOwnedResource, requireRoles, signSession };
