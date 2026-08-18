const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();

// Render termina TLS en su proxy y envía la IP original en X-Forwarded-For.
// Confiar en un único proxy permite que express-rate-limit identifique al cliente.
if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
  app.set('trust proxy', 1);
}

// Configuración CORS más permisiva para desarrollo y apps móviles
const corsOptions = {
  origin: function (origin, callback) {
    // En desarrollo, permitir todos los orígenes
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // En producción, permitir apps móviles y dominios específicos
    const allowedOrigins = [
      'https://hogarconectado-backend.onrender.com',
      'https://hogarconectado-frontend.vercel.app',
      'https://hogarconectado.netlify.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8081', // React Native Metro
      'http://10.0.2.2:3000',  // Android Emulator
      'http://127.0.0.1:3000',
      // Apps móviles no tienen origin, permitirlas
      null,
      undefined
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  optionsSuccessStatus: 200 // Para soportar navegadores legacy
};

// Middlewares de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Permitir recursos cross-origin
  crossOriginEmbedderPolicy: false // Desactivar para imágenes
}));

app.use(cors(corsOptions));

// Compression middleware para reducir el tamaño de las respuestas
app.use(compression({
  level: 6, // Nivel de compresión (1-9, 6 es buen balance)
  threshold: 1024, // Solo comprimir archivos > 1KB
  filter: (req, res) => {
    // Comprimir todo excepto imágenes ya comprimidas
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Middleware para manejar preflight requests
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por IP cada 15 minutos
});
app.use(limiter);

// Middlewares para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes) OPTIMIZADO
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  // Configuración optimizada para imágenes
  maxAge: '1y', // Cache por 1 año
  etag: true,   // ETag para validación de cache
  lastModified: true,
  setHeaders: (res, path, stat) => {
    // Headers CORS específicos para imágenes
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Configurar Content-Type apropiado basado en extensión
    const ext = require('path').extname(path).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg', 
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    
    if (contentTypes[ext]) {
      res.type(contentTypes[ext]);
    }
    
    // Permitir compresión para imágenes que lo soporten
    if (['.svg'].includes(ext)) {
      res.header('Content-Encoding', 'gzip');
    }
  }
}));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hogarconectado')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Rutas principales
app.get('/', (req, res) => {
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  res.json({ 
    message: '🏠 Hogar Conectado API', 
    version: '1.0.0',
    status: 'running',
    baseUrl: baseUrl,
    endpoints: {
      productos: `${baseUrl}/api/productos`,
      categorias: `${baseUrl}/api/categorias`, 
      cotizaciones: `${baseUrl}/api/cotizaciones`,
      upload: `${baseUrl}/api/upload`
    }
  });
});

// Health check súper rápido (sin consulta a DB)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    uptime: process.uptime() 
  });
});

// Wake up endpoint para mantener el servidor activo
app.get('/wake-up', (req, res) => {
  res.json({ 
    message: 'Server is awake!', 
    timestamp: new Date().toISOString() 
  });
});

// Importar rutas
const categoriasRoutes = require('./routes/categorias');
const productosRoutes = require('./routes/productos');
const cotizacionesRoutes = require('./routes/cotizaciones');
const uploadRoutes = require('./routes/upload');

// Usar rutas
app.use('/api/categorias', categoriasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/upload', uploadRoutes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
});
