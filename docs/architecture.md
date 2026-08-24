# Arquitectura del backend

## Resumen

API REST en Node.js y Express con persistencia en MongoDB Atlas. Centraliza autenticación, autorización, catálogo, stock, imágenes, precios, usuarios y cotizaciones.

## Capas

```text
server.js       Servidor, middleware global y montaje de rutas
routes/         Endpoints y validación HTTP
models/         Esquemas y comportamiento de Mongoose
middleware/     Autenticación y controles transversales
services/       Integraciones con Google y Cloudinary
utils/          Lógica compartida y funciones puras
test/           Pruebas con node:test
scripts/        Diagnóstico y mantenimiento de datos
data/           Importación y análisis de planillas
```

## Solicitudes

1. Render termina TLS y reenvía la solicitud a Express.
2. Helmet, CORS, compresión, parsing y rate limiting se aplican globalmente.
3. Las rutas de negocio requieren el JWT mediante `middleware/auth.js`.
4. Cada ruta valida la entrada y delega en modelos, servicios o utilidades.
5. Mongoose persiste los datos en MongoDB Atlas.

`GET /health` no consulta la base y se utiliza para comprobar la disponibilidad del proceso.

## Autenticación y permisos

- Google verifica la identidad mediante `GOOGLE_CLIENT_ID`.
- El backend crea o recupera el usuario por email.
- `INITIAL_ADMIN_EMAIL` permite iniciar el primer administrador.
- El JWT firmado identifica solicitudes posteriores.
- Estado y rol determinan el acceso efectivo; el frontend no reemplaza estas comprobaciones.

## Precios

`utils/pricing.js` es la fuente única de verdad. Define valores por defecto, interpreta la configuración y expone cálculos generales y detallados. Modelos y rutas deben consumir estas funciones en vez de reproducir fórmulas.

`POST /api/precios/calcular` admite un porcentaje dinámico validado entre 0 y 100. Los factores de cuotas provienen de configuración centralizada.

## Imágenes

`services/imageStorage.js` configura Cloudinary mediante `CLOUDINARY_URL` o variables separadas. Los endpoints de upload validan y procesan archivos; MongoDB conserva URLs y referencias. El filesystem del servicio no se considera almacenamiento persistente.

## Datos

- MongoDB Atlas es la base productiva.
- Los scripts en `scripts/` y `data/` no forman parte del arranque normal.
- Importaciones, migraciones, limpiezas y actualizaciones masivas requieren revisión, respaldo y autorización.

## Dependencias externas

- Frontend de Render: cliente de la API.
- Google OAuth: identidad.
- MongoDB Atlas: persistencia.
- Cloudinary: imágenes.
- Render Web Service: ejecución del proceso Node.js.
