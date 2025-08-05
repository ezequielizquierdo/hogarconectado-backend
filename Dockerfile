# Usar imagen oficial de Node.js (versión más segura)
FROM node:20-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar el resto del código
COPY . .

# Crear directorio para uploads
RUN mkdir -p uploads/images

# Exponer puerto
EXPOSE 3000

# Usuario no-root por seguridad
USER node

# Comando para iniciar la aplicación
CMD ["npm", "start"]
