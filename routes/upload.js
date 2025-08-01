const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Middleware CORS específico para uploads
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, multipart/form-data');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Verificar si hay configuración de Cloudinary
let cloudinary = null;
try {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }
} catch (error) {
  console.log('ℹ️ Cloudinary no configurado, usando almacenamiento local');
}

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, '../uploads');
const imagesDir = path.join(uploadsDir, 'images');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Configuración de Multer para almacenamiento local
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
  // Verificar tipo de archivo
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten: JPEG, PNG, WebP, GIF'), false);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 10 // Máximo 10 archivos por request
  },
  fileFilter: fileFilter
});

// POST /api/upload/single - Subir una sola imagen
router.post('/single', upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha enviado ningún archivo'
      });
    }

    let imageUrl;
    let publicId = null;

    // Si Cloudinary está configurado, subir allí
    if (cloudinary) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'hogar-conectado/productos',
          transformation: [
            { width: 800, height: 600, crop: 'limit', quality: 'auto' },
            { format: 'webp' }
          ]
        });
        
        imageUrl = result.secure_url;
        publicId = result.public_id;
        
        // Eliminar archivo local después de subir a Cloudinary
        fs.unlinkSync(req.file.path);
        
      } catch (cloudinaryError) {
        console.error('Error subiendo a Cloudinary:', cloudinaryError);
        // Si falla Cloudinary, usar almacenamiento local
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        imageUrl = `${baseUrl}/uploads/images/${req.file.filename}`;
      }
    } else {
      // Usar almacenamiento local
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      imageUrl = `${baseUrl}/uploads/images/${req.file.filename}`;
    }

    res.status(201).json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: {
        url: imageUrl,
        publicId: publicId,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    // Limpiar archivo si hay error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al subir imagen',
      error: error.message
    });
  }
});

// POST /api/upload/multiple - Subir múltiples imágenes
router.post('/multiple', upload.array('imagenes', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se han enviado archivos'
      });
    }

    const uploadResults = [];
    const errors = [];

    for (const file of req.files) {
      try {
        let imageUrl;
        let publicId = null;

        // Si Cloudinary está configurado, subir allí
        if (cloudinary) {
          try {
            const result = await cloudinary.uploader.upload(file.path, {
              folder: 'hogar-conectado/productos',
              transformation: [
                { width: 800, height: 600, crop: 'limit', quality: 'auto' },
                { format: 'webp' }
              ]
            });
            
            imageUrl = result.secure_url;
            publicId = result.public_id;
            
            // Eliminar archivo local después de subir a Cloudinary
            fs.unlinkSync(file.path);
            
          } catch (cloudinaryError) {
            console.error('Error subiendo a Cloudinary:', cloudinaryError);
            const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
            imageUrl = `${baseUrl}/uploads/images/${file.filename}`;
          }
        } else {
          const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
          imageUrl = `${baseUrl}/uploads/images/${file.filename}`;
        }

        uploadResults.push({
          url: imageUrl,
          publicId: publicId,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        });

      } catch (error) {
        errors.push({
          file: file.originalname,
          error: error.message
        });
        
        // Limpiar archivo si hay error
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `${uploadResults.length} imágenes subidas exitosamente`,
      data: uploadResults,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    // Limpiar archivos si hay error general
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al subir imágenes',
      error: error.message
    });
  }
});

// DELETE /api/upload/:filename - Eliminar imagen local
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(imagesDir, filename);

    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    // Eliminar archivo
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Imagen eliminada exitosamente'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar imagen',
      error: error.message
    });
  }
});

// DELETE /api/upload/cloudinary/:publicId - Eliminar imagen de Cloudinary
router.delete('/cloudinary/:publicId', async (req, res) => {
  try {
    if (!cloudinary) {
      return res.status(400).json({
        success: false,
        message: 'Cloudinary no está configurado'
      });
    }

    const { publicId } = req.params;
    
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'Imagen eliminada de Cloudinary exitosamente'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'No se pudo eliminar la imagen de Cloudinary',
        details: result
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar imagen de Cloudinary',
      error: error.message
    });
  }
});

// POST /api/upload/base64 - Subir imagen desde Base64
router.post('/base64', async (req, res) => {
  try {
    const { imageData, filename } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'No se ha enviado imageData'
      });
    }

    // Extraer información del Base64
    const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Formato de imagen Base64 inválido'
      });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    
    // Validar tipo de imagen
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de imagen no permitido'
      });
    }

    // Generar nombre de archivo
    const extension = mimeType.split('/')[1];
    const uniqueFilename = filename || `${uuidv4()}-${Date.now()}.${extension}`;
    
    let imageUrl;
    let publicId = null;

    // Si Cloudinary está configurado, subir allí
    if (cloudinary) {
      try {
        const result = await cloudinary.uploader.upload(`data:${mimeType};base64,${base64Data}`, {
          folder: 'hogar-conectado/productos',
          public_id: uniqueFilename.split('.')[0],
          transformation: [
            { width: 800, height: 600, crop: 'limit', quality: 'auto' },
            { format: 'webp' }
          ]
        });
        
        imageUrl = result.secure_url;
        publicId = result.public_id;
        
      } catch (cloudinaryError) {
        console.error('Error subiendo a Cloudinary:', cloudinaryError);
        // Si falla Cloudinary, usar almacenamiento local
        const localFilePath = path.join(imagesDir, uniqueFilename);
        fs.writeFileSync(localFilePath, base64Data, 'base64');
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        imageUrl = `${baseUrl}/uploads/images/${uniqueFilename}`;
      }
    } else {
      // Usar almacenamiento local
      const localFilePath = path.join(imagesDir, uniqueFilename);
      fs.writeFileSync(localFilePath, base64Data, 'base64');
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      imageUrl = `${baseUrl}/uploads/images/${uniqueFilename}`;
    }

    res.status(201).json({
      success: true,
      message: 'Imagen subida exitosamente desde Base64',
      data: {
        url: imageUrl,
        publicId: publicId,
        filename: uniqueFilename,
        mimetype: mimeType
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al subir imagen Base64',
      error: error.message
    });
  }
});

// GET /api/upload/image/:filename - Servir imagen con headers CORS correctos
router.get('/image/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const imagePath = path.join(imagesDir, filename);
    
    // Verificar si el archivo existe
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }
    
    // Configurar headers para imágenes
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    
    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 año
    
    // Enviar archivo
    res.sendFile(imagePath);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al servir imagen',
      error: error.message
    });
  }
});

// GET /api/upload/status - Verificar estado del servicio de upload
router.get('/status', (req, res) => {
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  
  res.json({
    success: true,
    message: 'Servicio de upload funcionando',
    config: {
      cloudinary: !!cloudinary,
      maxFileSize: '5MB',
      allowedTypes: ['JPEG', 'PNG', 'WebP', 'GIF'],
      maxFiles: 10,
      localStoragePath: '/uploads/images/',
      imageEndpoint: `${baseUrl}/api/upload/image/`,
      staticEndpoint: `${baseUrl}/uploads/images/`
    }
  });
});

module.exports = router;
