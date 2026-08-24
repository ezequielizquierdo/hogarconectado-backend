# Despliegue del backend

## Producción

- Plataforma: Render Web Service.
- Repositorio: `ezequielizquierdo/hogarconectado-backend`.
- Rama: `main`.
- Auto-Deploy: `On Commit`.
- Build Command actual: `npm cache clean --force && npm install --verbose`.
- Start Command: `npm start`.
- Health endpoint: `/health`.

## Variables

Configurar en Render sin registrar valores reales en Git:

- `MONGODB_URI`
- `NODE_ENV=production`
- `FRONTEND_URL`
- `GANANCIA_DEFAULT`
- `FACTOR_3_CUOTAS`
- `FACTOR_6_CUOTAS`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `GOOGLE_CLIENT_ID`
- `INITIAL_ADMIN_EMAIL`
- `CLOUDINARY_URL`

Render define `PORT`; el servidor debe utilizar ese valor. `FRONTEND_URL` debe coincidir exactamente con el origen productivo del frontend, sin rutas adicionales.

## Flujo normal

1. Ejecutar `npm test`.
2. Revisar que no se hayan incluido secretos ni scripts de datos involuntarios.
3. Crear un commit `HC-BACK-DDMMAA-descripcion breve` con autorización.
4. Subir a `main` con autorización.
5. Confirmar el deploy automático y la conexión a MongoDB.
6. Verificar `/health` y una ruta autenticada relevante.

## Cambios de configuración

Modificar variables en Render puede provocar un nuevo deploy. Rotaciones de MongoDB, JWT, Google o Cloudinary deben coordinarse para evitar interrupciones y nunca deben copiarse a documentación o commits.

## Diagnóstico

Si el deploy no comienza, revisar rama, Auto-Deploy, filtros, Git Credentials y acceso de la GitHub App. Si compila pero no queda operativo, revisar logs de arranque, variables requeridas, conexión a MongoDB y CORS.

Para una emergencia usar `Deploy latest commit`. Evitar `Deploy a specific commit`, porque puede desactivar el despliegue automático.

Los documentos históricos `docs/Render-Deployment.md` y `docs/Railway-Deployment.md` pueden contener procedimientos anteriores; este archivo representa el flujo productivo canónico actual.
