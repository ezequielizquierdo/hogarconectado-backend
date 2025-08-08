// 🚀 FIX INMEDIATO PARA TU FRONTEND
// Copia este código en tu archivo de configuración de API

// 1. CONFIGURAR TIMEOUT MÁS LARGO
const API_CONFIG = {
  baseURL: 'https://hogarconectado-backend.onrender.com/api',
  timeout: 30000, // 30 segundos en lugar de 10
  headers: {
    'Content-Type': 'application/json',
  },
  // Agregar retry automático
  retry: 3,
  retryDelay: 2000
};

// 2. FUNCIÓN DE RETRY AUTOMÁTICO
const apiWithRetry = async (apiCall, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      console.log(`Intento ${i + 1} fallido:`, error.message);
      
      if (i === retries - 1) {
        throw error; // Último intento, lanzar error
      }
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
};

// 3. USO EN TUS LLAMADAS A LA API
const getCategorias = async () => {
  return apiWithRetry(async () => {
    const response = await axios.get('/categorias', API_CONFIG);
    return response.data;
  });
};

const getProductos = async (page = 1, limit = 20) => {
  return apiWithRetry(async () => {
    const response = await axios.get(`/productos?page=${page}&limit=${limit}`, API_CONFIG);
    return response.data;
  });
};

// 4. WARM-UP AL INICIAR LA APP
const warmUpServer = async () => {
  try {
    console.log('🔥 Calentando servidor...');
    await axios.get('/categorias', { ...API_CONFIG, timeout: 35000 });
    console.log('✅ Servidor listo');
  } catch (error) {
    console.log('⚠️ Warm-up falló, pero continuando...');
  }
};

// 5. LLAMAR WARM-UP AL INICIAR TU APP
export { getCategorias, getProductos, warmUpServer, API_CONFIG };
