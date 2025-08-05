# 📄 API de Paginación - Productos

## 🎯 **Endpoint Principal**
```
GET /api/productos
```

## 📋 **Parámetros de Consulta**

### **Paginación**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `pagina` | Number | 1 | Número de página (mínimo: 1) |
| `limite` | Number | 20 | Productos por página (máximo: 100) |

### **Filtros**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `categoria` | String | ID de la categoría |
| `marca` | String | Filtrar por marca (búsqueda parcial) |
| `disponible` | String | 'true' o 'false' |
| `buscar` | String | Búsqueda de texto completo |

### **Ordenamiento**
| Parámetro | Valores | Descripción |
|-----------|---------|-------------|
| `ordenar` | `recientes` | Por fecha de creación (default) |
| | `alfabetico` | Por marca y modelo A-Z |
| | `precio-asc` | Por precio ascendente |
| | `precio-desc` | Por precio descendente |
| | `categoria` | Por categoría y marca |

## 📤 **Respuesta**

### **Estructura de Respuesta**
```json
{
  "success": true,
  "data": [...], // Array de productos
  "pagination": {
    "pagina": 1,
    "limite": 20,
    "total": 130,
    "totalPaginas": 7,
    "tienePaginaAnterior": false,
    "tienePaginaSiguiente": true,
    "paginaAnterior": null,
    "paginaSiguiente": 2,
    "desde": 1,
    "hasta": 20
  },
  "filtros": {
    "categoria": null,
    "marca": null,
    "disponible": "true",
    "buscar": null,
    "ordenar": "recientes"
  }
}
```

### **Producto Individual**
```json
{
  "_id": "688a2e4875e20a3fd553ca59",
  "categoria": {
    "_id": "688a2e4875e20a3fd553ca3d",
    "nombre": "Heladeras",
    "icono": "❄️"
  },
  "marca": "SAMSUNG",
  "modelo": "RT38K5932SI",
  "nombre": "SAMSUNG RT38K5932SI", // Virtual combinado
  "precioBase": 850000,
  "descripcion": "380 LITROS NO FROST ACERO",
  "imagenes": ["url1.jpg", "url2.jpg"],
  "especificaciones": {...},
  "stock": {
    "cantidad": 5,
    "disponible": true
  },
  "activo": true,
  "tags": ["samsung", "heladera", "no-frost"],
  "createdAt": "2025-07-30T14:38:00.000Z",
  "updatedAt": "2025-07-30T14:38:00.000Z"
}
```

## 🔗 **Ejemplos de Uso**

### **Paginación Básica**
```bash
# Primera página (20 productos)
GET /api/productos?pagina=1&limite=20

# Segunda página
GET /api/productos?pagina=2&limite=20

# Página con 50 productos
GET /api/productos?pagina=1&limite=50
```

### **Filtros**
```bash
# Productos de una categoría específica
GET /api/productos?categoria=688a2e4875e20a3fd553ca3d&pagina=1

# Filtrar por marca
GET /api/productos?marca=samsung&pagina=1

# Búsqueda de texto
GET /api/productos?buscar=heladera%20no%20frost&pagina=1

# Múltiples filtros
GET /api/productos?categoria=ID&marca=samsung&pagina=1
```

### **Ordenamiento**
```bash
# Por precio (menor a mayor)
GET /api/productos?ordenar=precio-asc&pagina=1

# Por precio (mayor a menor)
GET /api/productos?ordenar=precio-desc&pagina=1

# Alfabético
GET /api/productos?ordenar=alfabetico&pagina=1

# Por categoría
GET /api/productos?ordenar=categoria&pagina=1
```

## ⚡ **Optimizaciones de Rendimiento**

### **Índices Creados**
- `activo + createdAt` - Paginación básica
- `activo + categoria + createdAt` - Filtros por categoría
- `activo + marca + createdAt` - Filtros por marca
- `activo + precioBase` - Ordenamiento por precio
- Índice de texto completo - Búsquedas

### **Límites de Rendimiento**
- **Máximo por página:** 100 productos
- **Default por página:** 20 productos
- **Total actual:** 130 productos activos
- **Páginas totales:** 7 páginas

## 🧭 **Navegación Frontend**

### **Información de Paginación**
```javascript
const pagination = response.pagination;

// Verificar si hay páginas anteriores/siguientes
if (pagination.tienePaginaAnterior) {
  // Mostrar botón "Anterior"
  const paginaAnterior = pagination.paginaAnterior;
}

if (pagination.tienePaginaSiguiente) {
  // Mostrar botón "Siguiente"  
  const paginaSiguiente = pagination.paginaSiguiente;
}

// Mostrar información de rango
console.log(`Mostrando ${pagination.desde} - ${pagination.hasta} de ${pagination.total} productos`);
```

### **URLs de Navegación**
```javascript
// Página anterior
const urlAnterior = `/api/productos?pagina=${pagination.paginaAnterior}&limite=${pagination.limite}`;

// Página siguiente
const urlSiguiente = `/api/productos?pagina=${pagination.paginaSiguiente}&limite=${pagination.limite}`;

// Última página
const urlUltima = `/api/productos?pagina=${pagination.totalPaginas}&limite=${pagination.limite}`;
```

## 📊 **Estado Actual**
- **Total de productos:** 130 activos
- **Categorías más grandes:** Anafes y Cocinas (32), Heladeras (29)
- **Rendimiento:** Optimizado con índices específicos
- **Límite recomendado:** 20-50 productos por página

## 🎯 **Casos de Uso Frontend**

1. **Listado principal:** `?pagina=1&limite=20`
2. **Búsqueda:** `?buscar=término&pagina=1`
3. **Categorías:** `?categoria=ID&pagina=1` 
4. **Productos por marca:** `?marca=samsung&pagina=1`
5. **Ordenar por precio:** `?ordenar=precio-asc&pagina=1`

## ✅ **Ventajas Implementadas**
- ⚡ **Rendimiento optimizado** con índices específicos
- 🔄 **Paginación robusta** con metadata completa
- 🔍 **Filtros combinables** (categoría + marca + búsqueda)
- 📱 **Frontend-friendly** con información de navegación
- 🛡️ **Validación de parámetros** (límites máximos)
- 📈 **Escalable** hasta miles de productos
