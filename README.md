# 🏠 Hogar Conectado - Backend API

API REST para la aplicación móvil Hogar Conectado, construida con Node.js, Express y MongoDB.

## 🚀 Características

- ✅ API RESTful completa
- ✅ Validación de datos con express-validator
- ✅ Base de datos MongoDB con Mongoose
- ✅ Seguridad con helmet, CORS y rate limiting
- ✅ Cálculo automático de precios y cotizaciones
- ✅ Generación de mensajes de WhatsApp
- ✅ Búsqueda y filtrado avanzado
- ✅ Paginación en todas las consultas

## 📋 Requisitos

- Node.js 18+
- MongoDB 5.0+
- npm o yarn

## ⚡ Instalación Rápida

```bash
# Clonar el repositorio
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Inicializar base de datos con datos de prueba
npm run seed

# Iniciar servidor de desarrollo
npm run dev
```

## 🛠 Scripts Disponibles

```bash
# Producción y desarrollo
npm start                # Iniciar servidor de producción
npm run dev             # Iniciar servidor de desarrollo con nodemon

# Gestión de datos
npm run seed            # Poblar base de datos con datos iniciales
npm run import-excel    # Importar productos desde Excel
npm run analyze-excel   # Analizar estructura del archivo Excel

# Utilidades
npm run verify-db       # Verificar estado de la base de datos
npm run manage-categories # Gestionar categorías

# Testing
npm test               # Ejecutar tests (próximamente)
```

## 📁 Estructura del Proyecto

```
hogarconectado-backend/
├── 📁 models/          # Modelos de Mongoose
│   ├── Categoria.js
│   ├── Producto.js
│   └── Cotizacion.js
├── 📁 routes/          # Rutas de la API
│   ├── categorias.js
│   ├── productos.js
│   ├── cotizaciones.js
│   └── upload.js
├── 📁 scripts/        # Scripts de utilidad y mantenimiento
│   ├── gestionar-categorias.js
│   ├── verificar-bd.js
│   └── README.md
├── 📁 data/           # Datos y scripts de importación
│   ├── stock.xlsx
│   ├── importar-excel.js
│   └── README.md
├── 📁 docs/           # Documentación
│   ├── FRONTEND-INTEGRATION.md
│   ├── GUIA-IMAGENES-CORS.md
│   └── CATEGORIA-LAVAVAJILLAS.md
├── 📁 uploads/        # Archivos subidos
│   └── images/
├── server.js          # Servidor principal
├── seed.js           # Datos iniciales
└── package.json      # Configuración del proyecto
```

## 🌐 Endpoints de la API

### 📂 Categorías (`/api/categorias`)

| Método   | Endpoint              | Descripción                      |
| -------- | --------------------- | -------------------------------- |
| `GET`    | `/api/categorias`     | Listar todas las categorías      |
| `GET`    | `/api/categorias/:id` | Obtener categoría por ID         |
| `POST`   | `/api/categorias`     | Crear nueva categoría            |
| `PUT`    | `/api/categorias/:id` | Actualizar categoría             |
| `DELETE` | `/api/categorias/:id` | Eliminar categoría (soft delete) |

### 📦 Productos (`/api/productos`)

| Método   | Endpoint                     | Descripción                    |
| -------- | ---------------------------- | ------------------------------ |
| `GET`    | `/api/productos`             | Listar productos con filtros   |
| `GET`    | `/api/productos/:id`         | Obtener producto por ID        |
| `POST`   | `/api/productos`             | Crear nuevo producto           |
| `PUT`    | `/api/productos/:id`         | Actualizar producto            |
| `DELETE` | `/api/productos/:id`         | Eliminar producto              |
| `GET`    | `/api/productos/:id/cotizar` | Obtener cotización de producto |

### 💰 Cotizaciones (`/api/cotizaciones`)

| Método   | Endpoint                                 | Descripción               |
| -------- | ---------------------------------------- | ------------------------- |
| `GET`    | `/api/cotizaciones`                      | Listar cotizaciones       |
| `GET`    | `/api/cotizaciones/:id`                  | Obtener cotización por ID |
| `POST`   | `/api/cotizaciones`                      | Crear nueva cotización    |
| `PUT`    | `/api/cotizaciones/:id/estado`           | Actualizar estado         |
| `GET`    | `/api/cotizaciones/:id/mensaje`          | Generar mensaje WhatsApp  |
| `DELETE` | `/api/cotizaciones/:id`                  | Eliminar cotización       |
| `GET`    | `/api/cotizaciones/estadisticas/resumen` | Estadísticas básicas      |

### 📸 Upload de Imágenes

| Método   | Endpoint                               | Descripción              |
|----------|----------------------------------------|--------------------------|
| `POST`   | `/api/upload/single`                   | Subir una imagen         |
| `POST`   | `/api/upload/multiple`                 | Subir múltiples imágenes |
| `POST`   | `/api/upload/base64`                   | Subir imagen desde Base64|
| `DELETE` | `/api/upload/:filename`                | Eliminar imagen local    |
| `DELETE` | `/api/upload/cloudinary/:publicId`     | Eliminar de Cloudinary   |

## 📝 Ejemplos de Uso

### Crear una cotización

```bash
curl -X POST http://localhost:3000/api/cotizaciones \\
  -H "Content-Type: application/json" \\
  -d '{
    "datosContacto": {
      "nombre": "Juan Pérez",
      "telefono": "+5491123456789",
      "email": "juan@email.com"
    },
    "productos": [
      {
        "producto": "PRODUCT_ID_HERE",
        "cantidad": 1
      }
    ],
    "modalidadPago": "contado",
    "observaciones": "Consulta urgente"
  }'
```

### Buscar productos

```bash
# Buscar por categoría
GET /api/productos?categoria=CATEGORIA_ID

# Buscar por texto
GET /api/productos?buscar=samsung

# Filtrar por marca y disponibilidad
GET /api/productos?marca=LG&disponible=true

# Paginación
GET /api/productos?pagina=2&limite=10
```

## 🗄 Modelos de Datos

### Categoría

```javascript
{
  nombre: String,        // Nombre único de la categoría
  descripcion: String,   // Descripción opcional
  icono: String,         // Nombre del ícono
  activo: Boolean        // Estado activo/inactivo
}
```

### Producto

```javascript
{
  categoria: ObjectId,     // Referencia a categoría
  marca: String,           // Marca del producto
  modelo: String,          // Modelo específico
  descripcion: String,     // Descripción detallada
  precioBase: Number,      // Precio base sin ganancia
  especificaciones: Object, // Características técnicas
  tags: [String],          // Etiquetas para búsqueda
  activo: Boolean          // Estado activo/inactivo
}
```

### Cotización

```javascript
{
  datosContacto: {
    nombre: String,
    telefono: String,
    email: String
  },
  productos: [{
    producto: ObjectId,
    cantidad: Number,
    detalles: Object      // Snapshot del producto
  }],
  modalidadPago: String,  // 'contado', '3-cuotas', '6-cuotas'
  totales: {
    subtotal: Number,
    total: Number
  },
  estado: String,         // 'pendiente', 'enviada', 'confirmada', 'cancelada'
  observaciones: String
}
```

## 🔧 Configuración

### Variables de Entorno

Copia `.env.example` a `.env` y configura:

```bash
# Base de datos
MONGODB_URI=mongodb://localhost:27017/hogarconectado

# Factores de cálculo
GANANCIA_DEFAULT=0.30      # 30% de ganancia
FACTOR_3_CUOTAS=1.1298     # Factor para 3 cuotas
FACTOR_6_CUOTAS=1.2138     # Factor para 6 cuotas

# Seguridad
JWT_SECRET=tu_secreto_jwt
RATE_LIMIT_MAX=100         # Requests por ventana
```

## 💡 Funcionalidades Especiales

### Cálculo Automático de Precios

El sistema calcula automáticamente:

- **Precio de venta**: `precioBase * (1 + ganancia)`
- **3 cuotas**: `precioVenta * factor3Cuotas / 3`
- **6 cuotas**: `precioVenta * factor6Cuotas / 6`

### Generación de Mensajes WhatsApp

Las cotizaciones generan automáticamente mensajes formatados para WhatsApp con:

- Saludo personalizado
- Detalle de productos
- Precios según modalidad de pago
- Información de contacto

### Búsqueda Inteligente

- Búsqueda por texto en nombre, marca y modelo
- Filtros por categoría, marca y disponibilidad
- Ordenamiento por relevancia o fecha
- Paginación automática

## 🚀 Próximas Características

- [ ] Autenticación JWT
- [ ] Subida de imágenes con Cloudinary
- [ ] Notificaciones por email
- [ ] Tests automatizados
- [ ] Documentación con Swagger
- [ ] Sistema de logs avanzado

## 🐛 Solución de Problemas

### MongoDB no conecta

```bash
# Verificar que MongoDB esté ejecutándose
brew services start mongodb-community

# O en Linux/Windows
sudo systemctl start mongod
```

### Puerto en uso

```bash
# Cambiar puerto en .env
PORT=3001
```

### Problemas de dependencias

```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📚 Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **express-validator** - Validación de datos
- **helmet** - Seguridad HTTP
- **cors** - Manejo de CORS
- **express-rate-limit** - Rate limiting
- **nodemon** - Desarrollo en vivo

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.
