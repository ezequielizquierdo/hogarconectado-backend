# Usar imagen oficial de Node.js
FROM node:20-alpine

# Instalar dependencias del sistema si son necesarias
RUN apk add --no-cache python3 make g++

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de npm
COPY package*.json ./

# Limpiar cache de npm y instalar dependencias
RUN npm cache clean --force
RUN npm install --production --verbose

# Verificar que express esté instalado
RUN ls -la node_modules/ && ls -la node_modules/express/ || echo "Express not found"

# Copiar el resto del código
COPY . .

# Crear directorio para uploads
RUN mkdir -p uploads/images

# Exponer puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
