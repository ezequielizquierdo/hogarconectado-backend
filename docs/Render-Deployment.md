# Render Deployment Guide

## 🚀 Pasos para deployar en Render

### 1. Crear cuenta en Render
- Ve a [render.com](https://render.com)
- Regístrate con GitHub

### 2. Crear nuevo Web Service
1. Haz clic en "New +"
2. Selecciona "Web Service" 
3. Conecta tu repositorio GitHub: `hogarconectado-backend`

### 3. Configuración del servicio
```
Name: hogarconectado-backend
Environment: Node
Region: Oregon (US West) o el más cercano
Branch: main
Build Command: npm install
Start Command: npm start
```

### 4. Variables de entorno
En la sección "Environment", agrega:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/hogarconectado
GANANCIA_DEFAULT=0.30
FACTOR_3_CUOTAS=1.1298
FACTOR_6_CUOTAS=1.2138
JWT_SECRET=tu_jwt_secret_super_seguro_12345
```

### 5. Plan
- Free Tier: Suficiente para empezar
- Se "duerme" después de 15 minutos sin uso
- 750 horas gratis por mes

### 6. Deploy
- Haz clic en "Create Web Service"
- Render automáticamente:
  - Clona el repo
  - Ejecuta `npm install`
  - Ejecuta `npm start`
  - Asigna una URL

### 7. URL final
Tu API estará en: `https://hogarconectado-backend.onrender.com`

### 8. Probar endpoints
```bash
curl https://hogarconectado-backend.onrender.com/api/productos
curl https://hogarconectado-backend.onrender.com/api/categorias
```

## ✅ Ventajas de Render
- Setup súper simple
- SSL automático
- Deploys automáticos desde GitHub
- Logs claros y útiles
- Soporte excelente para Node.js
- Sin problemas con npm/package-lock.json
