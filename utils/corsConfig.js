const DEFAULT_ALLOWED_ORIGINS = [
  'https://hogarconectado-backend.onrender.com',
  'https://hogarconectado.onrender.com',
  'https://hogarconectado-frontend.vercel.app',
  'https://hogarconectado.netlify.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8081',
  'http://10.0.2.2:3000',
  'http://127.0.0.1:3000'
];

function parseFrontendOrigins(frontendUrl = '') {
  return frontendUrl
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        const url = new URL(origin);
        return ['http:', 'https:'].includes(url.protocol) ? url.origin : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function createCorsOptions({
  nodeEnv = process.env.NODE_ENV,
  frontendUrl = process.env.FRONTEND_URL
} = {}) {
  const allowedOrigins = new Set([
    ...DEFAULT_ALLOWED_ORIGINS,
    ...parseFrontendOrigins(frontendUrl)
  ]);

  return {
    origin(origin, callback) {
      if (nodeEnv !== 'production' || !origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error('No permitido por CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Idempotency-Key',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    optionsSuccessStatus: 200
  };
}

module.exports = { createCorsOptions, parseFrontendOrigins };
