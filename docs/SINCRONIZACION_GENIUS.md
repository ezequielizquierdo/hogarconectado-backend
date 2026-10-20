# Sincronización de productos Genius

La planilla de Genius alimenta el catálogo de Hogar Conectado. MongoDB continúa siendo la fuente principal y la importación nunca reemplaza la colección completa.

## Reglas

- Se usa únicamente la pestaña `NEW QUEBRA`.
- La coincidencia automática exige una única combinación normalizada de marca y modelo en la planilla y en MongoDB.
- Las coincidencias ambiguas quedan para revisión manual y no se actualizan automáticamente.
- Los productos reparados, sin caja, con caja o embalaje abierto, u `open box` se excluyen y se informan por separado.
- Los productos Essen quedan fuera de la comparación.
- `precioGenius` conserva el precio informado y `precioBase` suma 2%, redondeado al peso más cercano.
- Los productos nuevos usan 10% de ganancia y propietario `Genius`.
- Solo se sincronizan precios en pesos argentinos (`ARS`). Toda fila con otra moneda queda excluida e informada para revisión.
- Un stock mayor que cero queda disponible. Cero, vacío o negativo queda sin stock. El valor original se conserva en los metadatos de sincronización.
- Las imágenes, descuentos, tipo de comercialización y porcentajes personalizados existentes no se reemplazan.
- Las categorías faltantes se proponen para creación con el criterio normalizado de Hogar Conectado.
- Un producto no encontrado queda marcado para revisión. No se elimina, desactiva ni oculta automáticamente.

## Simulación de solo lectura

La simulación exige identificar tanto el archivo como la base esperada:

```bash
ENV_FILE=.env.atlas npm run sync-genius:dry-run -- \
  --file="/ruta/Planilla Stock Genius NUEVO_Actual.xlsx" \
  --confirm-db="nombre-exacto-de-la-base"
```

El comando consulta productos y categorías y guarda un reporte JSON temporal. No contiene ninguna operación de escritura. La actualización real requerirá respaldo, revisión del reporte y una autorización independiente.

## Actualización controlada

La operación real requiere identificar el archivo, la base, la huella SHA-256 del archivo y los conteos exactos de la simulación autorizada. Antes de escribir crea un respaldo Extended JSON completo de `productos` y `categorias` en `backups/genius/`, preservando identificadores y fechas BSON. Luego ejecuta categorías, altas, actualizaciones y marcas de revisión dentro de una transacción.

```bash
ENV_FILE=.env.atlas npm run sync-genius -- \
  --file="/ruta/Planilla Stock Genius NUEVO_Actual.xlsx" \
  --execute \
  --confirm-db="nombre-exacto-de-la-base" \
  --confirm-sha256="huella-del-archivo" \
  --confirm-plan="altas:actualizaciones:conflictos:excluidos:invalidos:categorias:ausentes"
```

La actualización:

- conserva imágenes, descuentos, porcentaje de ganancia personalizado y tipo de comercialización de productos existentes;
- crea productos nuevos con 10% de ganancia, propietario `Genius` y tipo `stock-propio`;
- no modifica conflictos, filas inválidas ni productos excluidos;
- marca los ausentes para revisión sin ocultarlos, desactivarlos ni eliminarlos;
- se detiene sin escribir si cambia el archivo, la base o cualquiera de los conteos confirmados.
