# 📱 Guía de Integración Frontend-Backend
## Hogar Conectado - App Móvil ↔ API Backend

Esta guía explica todas las funcionalidades que puedes implementar en tu frontend (React Native/Expo) y cómo se comunican con el backend.

---

## 🌐 **Configuración Inicial**

### **URLs Base:**
```javascript
// Desarrollo
const API_BASE_URL = 'http://192.168.1.13:3000';

// Producción (cuando subas a la nube)
const API_BASE_URL = 'https://tu-backend-production.com';
```

### **Headers comunes:**
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
```

---

## 📦 **1. GESTIÓN DE PRODUCTOS**

### **🔍 Listar Productos**
```javascript
// Obtener todos los productos
const obtenerProductos = async (filtros = {}) => {
  const queryParams = new URLSearchParams({
    limite: filtros.limite || 50,
    pagina: filtros.pagina || 1,
    disponible: filtros.disponible || 'true',
    ...filtros
  });
  
  const response = await fetch(`${API_BASE_URL}/api/productos?${queryParams}`);
  const data = await response.json();
  
  return data; // { success: true, data: productos[], pagination: {...} }
};

// Buscar productos
const buscarProductos = async (texto) => {
  const response = await fetch(
    `${API_BASE_URL}/api/productos?buscar=${encodeURIComponent(texto)}`
  );
  return await response.json();
};

// Filtrar por categoría
const productosPorCategoria = async (categoriaId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/productos?categoria=${categoriaId}`
  );
  return await response.json();
};
```

### **👁️ Ver Producto Individual**
```javascript
const obtenerProducto = async (productoId) => {
  const response = await fetch(`${API_BASE_URL}/api/productos/${productoId}`);
  const data = await response.json();
  
  // Incluye precios calculados automáticamente
  return data; // { success: true, data: { ...producto, precios: {...} } }
};
```

### **➕ Crear Producto**
```javascript
const crearProducto = async (datosProducto) => {
  // 1. Primero subir imágenes (si las hay)
  const imagenesSubidas = [];
  for (const imagen of datosProducto.imagenes) {
    const imagenUrl = await subirImagen(imagen);
    imagenesSubidas.push(imagenUrl);
  }
  
  // 2. Crear producto con URLs de imágenes
  const producto = {
    categoria: datosProducto.categoriaId,
    marca: datosProducto.marca,
    modelo: datosProducto.modelo,
    descripcion: datosProducto.descripcion,
    precioBase: parseFloat(datosProducto.precio),
    imagenes: imagenesSubidas,
    stock: {
      cantidad: parseInt(datosProducto.stock) || 0,
      disponible: true
    },
    especificaciones: datosProducto.especificaciones || {},
    tags: datosProducto.tags || []
  };
  
  const response = await fetch(`${API_BASE_URL}/api/productos`, {
    method: 'POST',
    headers,
    body: JSON.stringify(producto)
  });
  
  return await response.json();
};
```

### **✏️ Actualizar Producto**
```javascript
const actualizarProducto = async (productoId, cambios) => {
  const response = await fetch(`${API_BASE_URL}/api/productos/${productoId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(cambios)
  });
  
  return await response.json();
};
```

### **🗑️ Eliminar Producto**
```javascript
const eliminarProducto = async (productoId) => {
  const response = await fetch(`${API_BASE_URL}/api/productos/${productoId}`, {
    method: 'DELETE'
  });
  
  return await response.json();
};
```

---

## 📂 **2. GESTIÓN DE CATEGORÍAS**

### **📋 Listar Categorías**
```javascript
const obtenerCategorias = async () => {
  const response = await fetch(`${API_BASE_URL}/api/categorias`);
  const data = await response.json();
  
  return data.data; // Array de categorías para dropdowns/pickers
};
```

### **➕ Crear Categoría**
```javascript
const crearCategoria = async (categoria) => {
  const response = await fetch(`${API_BASE_URL}/api/categorias`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
      icono: categoria.icono || '📦'
    })
  });
  
  return await response.json();
};
```

---

## 📸 **3. GESTIÓN DE IMÁGENES**

### **📤 Subir Imagen (Base64)**
```javascript
import * as FileSystem from 'expo-file-system';

const subirImagen = async (imageUri) => {
  try {
    // Convertir a Base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Determinar tipo
    const extension = imageUri.split('.').pop().toLowerCase();
    const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
    
    // Subir al backend
    const response = await fetch(`${API_BASE_URL}/api/upload/base64`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        imageData: `data:${mimeType};base64,${base64}`,
        filename: `product_${Date.now()}.${extension}`
      })
    });
    
    const result = await response.json();
    if (result.success) {
      return result.data.url; // URL completa para usar en productos
    }
    throw new Error(result.message);
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    throw error;
  }
};
```

### **📤 Subir Múltiples Imágenes**
```javascript
const subirMultiplesImagenes = async (imageUris) => {
  const promesas = imageUris.map(uri => subirImagen(uri));
  return await Promise.all(promesas);
};
```

---

## 💰 **4. SISTEMA DE COTIZACIONES**

### **📋 Crear Cotización**
```javascript
const crearCotizacion = async (datosCliente, productosSeleccionados) => {
  const cotizacion = {
    datosContacto: {
      nombre: datosCliente.nombre,
      telefono: datosCliente.telefono,
      email: datosCliente.email || ''
    },
    productos: productosSeleccionados.map(item => ({
      producto: item.productoId,
      cantidad: item.cantidad
    })),
    modalidadPago: datosCliente.modalidadPago || 'contado', // 'contado', 'cuotas_3', 'cuotas_6'
    observaciones: datosCliente.observaciones || ''
  };
  
  const response = await fetch(`${API_BASE_URL}/api/cotizaciones`, {
    method: 'POST',
    headers,
    body: JSON.stringify(cotizacion)
  });
  
  return await response.json();
};
```

### **📊 Ver Cotizaciones**
```javascript
const obtenerCotizaciones = async (filtros = {}) => {
  const queryParams = new URLSearchParams(filtros);
  const response = await fetch(`${API_BASE_URL}/api/cotizaciones?${queryParams}`);
  return await response.json();
};
```

### **📱 Generar Mensaje WhatsApp**
```javascript
const generarMensajeWhatsApp = async (cotizacionId) => {
  const response = await fetch(`${API_BASE_URL}/api/cotizaciones/${cotizacionId}/mensaje`);
  const data = await response.json();
  
  if (data.success) {
    // Abrir WhatsApp con el mensaje
    const telefono = data.data.telefono.replace(/[^0-9]/g, '');
    const mensaje = encodeURIComponent(data.data.mensaje);
    const whatsappUrl = `whatsapp://send?phone=${telefono}&text=${mensaje}`;
    
    Linking.openURL(whatsappUrl);
  }
  
  return data;
};
```

### **💲 Obtener Precios de Producto**
```javascript
const obtenerPreciosCotizacion = async (productoId, cuotas = null) => {
  const url = cuotas 
    ? `${API_BASE_URL}/api/productos/${productoId}/cotizar?cuotas=${cuotas}`
    : `${API_BASE_URL}/api/productos/${productoId}/cotizar`;
    
  const response = await fetch(url);
  const data = await response.json();
  
  return data.data.precios; // { contado: 100000, cuotas3: 110000, cuotas6: 120000 }
};
```

---

## 🔍 **5. FUNCIONES DE BÚSQUEDA Y FILTROS**

### **🏷️ Búsqueda Avanzada**
```javascript
const busquedaAvanzada = async (criterios) => {
  const params = new URLSearchParams();
  
  if (criterios.texto) params.append('buscar', criterios.texto);
  if (criterios.categoria) params.append('categoria', criterios.categoria);
  if (criterios.marca) params.append('marca', criterios.marca);
  if (criterios.precioMin) params.append('precioMin', criterios.precioMin);
  if (criterios.precioMax) params.append('precioMax', criterios.precioMax);
  if (criterios.disponible !== undefined) params.append('disponible', criterios.disponible);
  
  const response = await fetch(`${API_BASE_URL}/api/productos?${params}`);
  return await response.json();
};
```

### **📊 Paginación**
```javascript
const cargarMasProductos = async (paginaActual) => {
  const response = await fetch(
    `${API_BASE_URL}/api/productos?pagina=${paginaActual + 1}&limite=20`
  );
  const data = await response.json();
  
  return {
    productos: data.data,
    hayMasPaginas: data.pagination.pagina < data.pagination.paginas
  };
};
```

---

## 📈 **6. ESTADÍSTICAS Y REPORTES**

### **📊 Estadísticas de Cotizaciones**
```javascript
const obtenerEstadisticas = async (fechaInicio, fechaFin) => {
  const params = new URLSearchParams({
    fechaDesde: fechaInicio,
    fechaHasta: fechaFin
  });
  
  const response = await fetch(
    `${API_BASE_URL}/api/cotizaciones/estadisticas/resumen?${params}`
  );
  return await response.json();
};
```

---

## 🛠️ **7. UTILIDADES Y HELPERS**

### **🔌 Verificar Conexión API**
```javascript
const verificarConexionAPI = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    const data = await response.json();
    return data.status === 'running';
  } catch (error) {
    return false;
  }
};
```

### **⚠️ Manejo de Errores**
```javascript
const manejarRespuestaAPI = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `Error ${response.status}`);
  }
  
  if (!data.success) {
    throw new Error(data.message || 'Error en la operación');
  }
  
  return data;
};
```

### **📱 Hook React Native de ejemplo**
```javascript
const useProductos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const cargarProductos = async (filtros = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await obtenerProductos(filtros);
      setProductos(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return { productos, loading, error, cargarProductos };
};
```

---

## 📋 **8. CHECKLIST DE INTEGRACIÓN**

### **✅ Funcionalidades Básicas:**
- [ ] Listar productos con paginación
- [ ] Buscar productos por texto
- [ ] Filtrar por categoría/marca
- [ ] Ver detalles de producto
- [ ] Crear nuevo producto
- [ ] Subir imágenes de productos
- [ ] Editar producto existente
- [ ] Eliminar producto

### **✅ Sistema de Cotizaciones:**
- [ ] Calcular precios (contado/cuotas)
- [ ] Crear cotización con datos del cliente
- [ ] Ver historial de cotizaciones
- [ ] Generar mensaje WhatsApp
- [ ] Actualizar estado de cotización

### **✅ Gestión de Categorías:**
- [ ] Listar categorías para dropdowns
- [ ] Crear nueva categoría
- [ ] Editar categoría existente

### **✅ Extras:**
- [ ] Estadísticas y reportes
- [ ] Backup y sincronización
- [ ] Modo offline (opcional)
- [ ] Notificaciones push (opcional)

---

## 🚀 **Próximos Pasos Recomendados:**

1. **Implementar autenticación** (JWT)
2. **Agregar push notifications**
3. **Sistema de roles** (admin/vendedor)
4. **Sincronización offline**
5. **Reportes avanzados**
6. **Integración con sistemas de pago**

---

## 🔗 **URLs Útiles:**

- **API Desarrollo:** http://192.168.1.13:3000
- **Documentación API:** http://192.168.1.13:3000/ (info general)
- **MongoDB Compass:** mongodb://localhost:27017/hogarconectado
- **Repositorio Backend:** https://github.com/ezequielizquierdo/hogarconectado-backend

---

## 📞 **Soporte:**

Si tienes dudas sobre alguna implementación, revisa:
1. Los logs del servidor backend
2. Los response de la API en Network tab
3. La base de datos en MongoDB Compass
4. Esta documentación

¡Tu app está completamente integrada con el backend! 🎉
