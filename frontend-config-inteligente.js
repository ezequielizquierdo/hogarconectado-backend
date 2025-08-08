// 🚀 CONFIGURACIÓN INTELIGENTE PARA TU FRONTEND
// Copia este código en tu archivo de configuración de API

import { Platform } from 'react-native';

// Detectar el entorno automáticamente
const getApiBaseUrl = () => {
  // Si estás en desarrollo local
  if (__DEV__) {
    // Para dispositivo físico usar IP local
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      return 'http://192.168.1.13:3000/api';
    }
    // Para web usar localhost
    return 'http://localhost:3000/api';
  }
  
  // En producción siempre usar Render
  return 'https://hogarconectado-backend.onrender.com/api';
};

// Configuración con retry automático y timeout largo
export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
};

// Función con retry automático
export const apiCall = async (requestFn, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 API Call - Intento ${attempt}/${maxRetries}`);
      const result = await requestFn();
      console.log(`✅ API Call exitosa en intento ${attempt}`);
      return result;
    } catch (error) {
      console.log(`❌ Intento ${attempt} falló:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`API falló después de ${maxRetries} intentos: ${error.message}`);
      }
      
      // Esperar progresivamente más tiempo
      const delay = 1000 * attempt;
      console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Funciones específicas para tu app
export const getCategorias = async () => {
  return apiCall(async () => {
    const response = await fetch(`${API_CONFIG.baseURL}/categorias`, {
      method: 'GET',
      headers: API_CONFIG.headers,
      signal: AbortSignal.timeout(API_CONFIG.timeout),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  });
};

export const getProductos = async (page = 1, limit = 20) => {
  return apiCall(async () => {
    const response = await fetch(`${API_CONFIG.baseURL}/productos?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: API_CONFIG.headers,
      signal: AbortSignal.timeout(API_CONFIG.timeout),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  });
};

export const getMarcas = async () => {
  return apiCall(async () => {
    const response = await fetch(`${API_CONFIG.baseURL}/productos/marcas`, {
      method: 'GET',
      headers: API_CONFIG.headers,
      signal: AbortSignal.timeout(API_CONFIG.timeout),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  });
};

// Debug: mostrar configuración actual
console.log('🔧 API Configuration:', {
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  platform: Platform.OS,
  isDev: __DEV__
});
