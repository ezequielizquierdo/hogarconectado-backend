# 🚀 Guía de Deployment en Railway

## Paso 1: Preparar el repositorio

```bash
# Asegurar que todos los cambios estén guardados
git add .
git commit -m "🚀 Configurar backend para Railway deployment"
git push origin main
```

## Paso 2: Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Haz clic en **"Login with GitHub"**
3. Autoriza Railway a acceder a tus repositorios

## Paso 3: Deploy del Backend

1. En Railway, haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Busca y selecciona `hogarconectado-backend`
4. Railway automáticamente detectará que es Node.js y comenzará el deploy

## Paso 4: Configurar Base de Datos MongoDB

### Opción A: MongoDB en Railway (Recomendado)
1. En tu proyecto de Railway, haz clic en **"+ New Service"**
2. Selecciona **"Database"** → **"MongoDB"**
3. Railway creará una instancia de MongoDB
4. Copia la cadena de conexión de la pestaña "Connect"

### Opción B: MongoDB Atlas (Gratis hasta 512MB)
1. Ve a [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Crea cuenta gratuita
3. Crea un cluster gratuito
4. Configura usuario y contraseña
5. Permite conexiones desde cualquier IP (0.0.0.0/0)
6. Copia la cadena de conexión

## Paso 5: Configurar Variables de Entorno

En el dashboard de Railway, ve a tu servicio backend → **"Variables"** y agrega:

```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/hogarconectado
GANANCIA_DEFAULT=0.30
FACTOR_3_CUOTAS=1.1298
FACTOR_6_CUOTAS=1.2138
JWT_SECRET=un_jwt_secret_muy_seguro_para_produccion_123456789
```

## Paso 6: Configurar Dominio

1. En Railway, ve a tu servicio → **"Settings"** → **"Domains"**
2. Haz clic en **"Generate Domain"**
3. Obtendrás una URL como: `https://hogarconectado-backend-production.railway.app`

## Paso 7: Poblar la Base de Datos

Una vez deployado, puedes poblar la base de datos:

```bash
# Usando Railway CLI (opcional)
railway login
railway link [tu-proyecto-id]
railway run npm run seed
```

O ejecutar el seed desde tu computadora apuntando a la base de datos de producción.

## Paso 8: Probar la API

```bash
# Probar endpoint de productos
curl https://tu-app.railway.app/api/productos

# Probar endpoint de categorías  
curl https://tu-app.railway.app/api/categorias

# Probar con paginación
curl https://tu-app.railway.app/api/productos?pagina=1&limite=10
```

## ✅ Checklist de Deployment

- [ ] Código pusheado a GitHub
- [ ] Proyecto creado en Railway
- [ ] Base de datos MongoDB configurada
- [ ] Variables de entorno configuradas
- [ ] Dominio generado
- [ ] API funcionando (status 200)
- [ ] Base de datos poblada con productos
- [ ] CORS configurado para apps móviles

## 🔧 Solución de Problemas

### Error de conexión a MongoDB
- Verificar que la cadena MONGODB_URI esté correcta
- Asegurar que el usuario de MongoDB tenga permisos
- Verificar que la IP esté whitelistada (0.0.0.0/0 para permitir todas)

### Error 503 Service Unavailable
- Verificar que NODE_ENV=production
- Revisar logs en Railway dashboard
- Asegurar que PORT=3000 esté configurado

### CORS errors desde app móvil
- Verificar que CORS permita `null` origin (apps móviles)
- Comprobar que los headers están permitidos

## 📱 URL para tu App Móvil

Una vez deployado, tu app móvil usará:
```
https://tu-app.railway.app/api/
```

En lugar de:
```
http://192.168.1.13:3000/api/
```

## 🎉 ¡Listo!

Tu backend estará disponible 24/7 en Railway y tu app móvil podrá consumirlo desde cualquier lugar.
