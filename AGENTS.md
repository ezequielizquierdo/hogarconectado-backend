# Hogar Conectado — Backend

## Propósito

API REST de Hogar Conectado. Administra autenticación, usuarios y permisos, productos, categorías, stock, imágenes, cálculos de precios y cotizaciones.

## Arquitectura

- Node.js y Express con entrada en `server.js`.
- MongoDB mediante Mongoose.
- Modelos en `models/`.
- Rutas HTTP en `routes/`.
- Autenticación y autorización en `middleware/` y `services/googleAuth.js`.
- Integraciones externas en `services/`, incluido Cloudinary.
- Lógica compartida y pura en `utils/`.
- Pruebas con `node:test` en `test/`.
- Scripts de diagnóstico, migración y mantenimiento en `scripts/` y `data/`.

## Comandos habituales

```bash
npm install
npm run dev
npm test
npm start
```

Antes de entregar cambios de código, ejecutar `npm test`. No afirmar que una modificación está verificada si las pruebas relevantes no se ejecutaron correctamente.

GitHub Actions ejecuta instalación reproducible, comprobación de sintaxis y pruebas en pull requests y pushes a `main`. El workflow valida pero no despliega; Render conserva esa responsabilidad.

## Configuración

Variables principales, sin documentar aquí sus valores reales:

- `MONGODB_URI`
- `NODE_ENV`
- `PORT`
- `FRONTEND_URL`
- `GANANCIA_DEFAULT`
- `FACTOR_3_CUOTAS`
- `FACTOR_6_CUOTAS`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `GOOGLE_CLIENT_ID`
- `INITIAL_ADMIN_EMAIL`
- `CLOUDINARY_URL`, o las variables separadas de Cloudinary
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` para Web Push
- `GEMINI_API_KEY` y, opcionalmente, `GEMINI_MODEL` para el alta asistida desde imágenes

No versionar `.env`, credenciales, cadenas de conexión ni secretos.

## Reglas funcionales

- `utils/pricing.js` es la fuente única de verdad para fórmulas y factores de precios.
- No duplicar cálculos en rutas, modelos, scripts ni frontend.
- `/api/precios/calcular` expone cálculos con porcentajes dinámicos.
- Los precios de productos deben obtenerse mediante las funciones compartidas de `utils/pricing.js`.
- Las imágenes persistentes se gestionan a través de `services/imageStorage.js` y Cloudinary.
- El análisis de imágenes genera borradores revisables; nunca debe crear productos automáticamente.
- MongoDB almacena referencias y metadatos de imágenes, no archivos temporales del filesystem de Render.
- Mantener snapshots de cotizaciones coherentes con los datos y precios utilizados al crearlas.

## Autenticación y seguridad

- `/health`, la información raíz, el inicio de autenticación, la lectura sanitizada del catálogo y la creación de consultas comerciales son públicas según `server.js`; las operaciones internas requieren JWT.
- Las respuestas públicas de productos no deben exponer precio base, porcentaje de ganancia, identificadores de almacenamiento ni metadatos internos.
- Las consultas públicas deben validar y normalizar contacto, limitar frecuencia y conservar idempotencia para evitar doble envío.
- Validar tokens de Google con `GOOGLE_CLIENT_ID` y emitir JWT únicamente desde el backend.
- Aplicar autorización por rol en el backend, incluso si el frontend oculta controles.
- El alta de consultas comerciales es pública; su listado, resumen y cambio de estado son exclusivos del rol `admin`.
- Mantener validación de entrada, Helmet, CORS y rate limiting.
- No registrar tokens, secretos, contraseñas ni cadenas de conexión.
- Los mensajes de error de producción no deben exponer detalles internos.
- Las suscripciones Push pertenecen a administradores autenticados; una falla al notificar nunca debe impedir que una consulta quede registrada.

## Datos y operaciones riesgosas

- Tratar importaciones, limpieza, unificación de categorías, migraciones y modificaciones masivas como operaciones potencialmente destructivas.
- Antes de ejecutarlas, identificar base y colección objetivo, revisar el script, disponer de respaldo y obtener autorización explícita.
- No ejecutar scripts de `scripts/`, `data/` o `seed.js` contra producción por inferencia.
- No modificar ni eliminar backups existentes sin autorización.

## Git y despliegue

- Rama productiva: `main`.
- Render despliega automáticamente cada push a `main`.
- Para una emergencia usar `Deploy latest commit`; evitar `Deploy a specific commit`, porque puede desactivar el auto-deploy.
- Formato de commit: `HC-BACK-DDMMAA-descripcion breve`.
- No crear commits, hacer push ni desplegar sin autorización explícita del usuario.

## Forma de colaboración

- Se permiten inspecciones y diagnósticos de solo lectura.
- Consultar antes de modificar archivos.
- Solicitar autorización separada antes de commit, push, despliegue, migración, eliminación o cambios en datos.
- Preservar cambios existentes que no pertenezcan a la tarea.
- Nunca incluir valores reales de secretos en documentación, código, logs o respuestas.

## Mantenimiento de este documento

Revisar este archivo cuando cambien arquitectura, comandos, variables, reglas de precios, autenticación, almacenamiento, pruebas o despliegue. Hacer además una revisión breve cada 2–3 meses. Mantenerlo conciso y retirar instrucciones obsoletas.
