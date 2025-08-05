#!/bin/bash

# Script para probar API en producción
echo "🧪 PROBANDO API EN RENDER"
echo "=========================="

# Reemplaza con tu URL real de Render
API_URL="https://hogarconectado-backend.onrender.com"

echo "🌐 Probando: $API_URL"
echo ""

# Test 1: Health check básico
echo "1️⃣ Test básico de conectividad:"
curl -s -o /dev/null -w "Status: %{http_code} | Tiempo: %{time_total}s\n" "$API_URL" || echo "❌ No responde"
echo ""

# Test 2: Endpoint de productos
echo "2️⃣ Probando /api/productos:"
curl -s "$API_URL/api/productos" | head -c 200
echo "..."
echo ""

# Test 3: Endpoint de categorías 
echo "3️⃣ Probando /api/categorias:"
curl -s "$API_URL/api/categorias" | head -c 200
echo "..."
echo ""

# Test 4: Paginación
echo "4️⃣ Probando paginación:"
curl -s "$API_URL/api/productos?pagina=1&limite=3" | jq '.pagination' 2>/dev/null || echo "Respuesta recibida (sin jq)"
echo ""

# Test 5: Conteo de datos
echo "5️⃣ Contando datos:"
PRODUCTOS=$(curl -s "$API_URL/api/productos" | jq '.data | length' 2>/dev/null || echo "N/A")
CATEGORIAS=$(curl -s "$API_URL/api/categorias" | jq '.data | length' 2>/dev/null || echo "N/A")
echo "📦 Productos: $PRODUCTOS"
echo "📂 Categorías: $CATEGORIAS"
echo ""

echo "✅ Tests completados!"
