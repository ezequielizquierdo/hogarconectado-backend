# 🖼️ Guía para Manejo de Imágenes sin Errores CORS

## ✅ Configuración CORS Implementada

El servidor ahora tiene una configuración CORS completa que soluciona los problemas de acceso a imágenes:

### 🔧 Configuraciones Aplicadas:

1. **CORS Global Permisivo en Desarrollo**
   - Permite todos los orígenes en modo desarrollo
   - Incluye headers específicos para imágenes
   - Maneja requests preflight (OPTIONS)

2. **Middleware Específico para Archivos Estáticos**
   - Headers CORS para el directorio `/uploads`
   - Configuración de cache apropiada
   - Content-Type automático por extensión

3. **Endpoints Alternativos**
   - `/uploads/images/` - Servicio estático directo
   - `/api/upload/image/` - Endpoint con headers personalizados

## 📋 URLs Disponibles para Imágenes

Después de subir una imagen, puedes accederla de dos formas:

### Opción 1: Servicio Estático (Recomendado)
```
http://localhost:3000/uploads/images/nombre-archivo.jpg
```

### Opción 2: Endpoint con Headers Personalizados
```
http://localhost:3000/api/upload/image/nombre-archivo.jpg
```

## 🚀 Cómo Subir Imágenes desde Frontend

### React Native / Expo

```javascript
// 1. Subir imagen con FormData
const uploadImage = async (imageUri) => {
  const formData = new FormData();
  formData.append('imagen', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'image.jpg',
  });

  try {
    const response = await fetch('http://localhost:3000/api/upload/single', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Imagen subida:', result.data.url);
      return result.data.url;
    }
  } catch (error) {
    console.error('Error subiendo imagen:', error);
  }
};

// 2. Mostrar imagen en componente
const ImageDisplay = ({ imageUrl }) => {
  return (
    <Image 
      source={{ uri: imageUrl }}
      style={{ width: 200, height: 200 }}
      onError={(error) => console.log('Error cargando imagen:', error)}
    />
  );
};
```

### React Web

```javascript
// Subir imagen desde input file
const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('imagen', file);

  try {
    const response = await fetch('http://localhost:3000/api/upload/single', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Imagen subida:', result.data.url);
      // Usar la URL directamente en <img>
      setImageUrl(result.data.url);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Mostrar imagen
<img 
  src={imageUrl} 
  alt="Imagen subida" 
  onError={(e) => console.log('Error cargando imagen')}
/>
```

### Subida con Base64

```javascript
const uploadBase64Image = async (base64String) => {
  try {
    const response = await fetch('http://localhost:3000/api/upload/base64', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64String,
        filename: 'image.jpg'
      }),
    });

    const result = await response.json();
    return result.data.url;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 🛠️ Endpoints Disponibles

### POST /api/upload/single
Sube una sola imagen usando FormData

### POST /api/upload/multiple  
Sube múltiples imágenes (máximo 10)

### POST /api/upload/base64
Sube imagen desde string Base64

### GET /api/upload/status
Verifica estado del servicio de upload

### GET /api/upload/image/:filename
Sirve imagen con headers CORS optimizados

## ⚡ Optimizaciones Incluidas

1. **Cache Automático**: Las imágenes se cachean por 1 año
2. **Compresión Cloudinary**: Si está configurado, optimiza automáticamente
3. **Validación de Tipos**: Solo permite JPEG, PNG, WebP, GIF
4. **Límite de Tamaño**: 5MB máximo por archivo
5. **Nombres Únicos**: UUID + timestamp para evitar conflictos

## 🔍 Debugging CORS

Si tienes problemas con CORS, verifica:

1. **Headers en la Response**:
   ```bash
   curl -I "http://localhost:3000/uploads/images/tu-imagen.jpg"
   ```

2. **Estado del Servicio**:
   ```bash
   curl "http://localhost:3000/api/upload/status"
   ```

3. **Logs del Servidor**:
   ```bash
   tail -f server.log
   ```

## 🌐 URLs en Producción

Para producción, actualiza las URLs:
- Reemplaza `http://localhost:3000` por tu dominio
- Configura `BASE_URL` en variables de entorno
- Añade tu dominio a la lista de orígenes permitidos en CORS

## ✅ Solución Implementada

✅ CORS configurado correctamente  
✅ Headers optimizados para imágenes  
✅ Cache automático habilitado  
✅ Endpoints alternativos disponibles  
✅ Validación de tipos de archivo  
✅ Manejo de errores mejorado  

**¡Las imágenes ahora se pueden acceder sin errores CORS desde cualquier frontend!** 🎉
