# Catálogo Essen C8 - agosto 2026

Preparación local del catálogo recibido en PDF. Contiene 84 productos, sus
imágenes y un manifiesto listo para validar antes de importar.

## Criterio comercial

- `precioBase` usa el precio de lista publicado por Essen.
- `porcentajeGanancia` es `0`, para que el precio visible no vuelva a incrementarse.
- Las promociones y combos temporales de las páginas 4 y 5 no están incluidos.
- El stock inicial queda en cero y no disponible hasta que se informe inventario real.

## Categorías

Las categorías usan el prefijo `Essen · `. El frontend reconoce ese prefijo y
las agrupa dentro de un apartado propio llamado **Essen** en el menú lateral.

## Validación

```bash
npm run validate-essen-catalog
```

La validación no se conecta a MongoDB ni sube imágenes.

## Importación

El comando sin argumentos solamente simula y valida:

```bash
npm run import-essen-catalog
```

La importación real es una operación separada y debe ejecutarse únicamente
después de revisar el manifiesto, confirmar la base objetivo y obtener
autorización explícita. Requiere indicar el nombre exacto de la base:

```bash
npm run import-essen-catalog -- --execute --confirm-db=NOMBRE_EXACTO
```

Antes de crear categorías, subir imágenes o insertar productos, el script
comprueba el nombre de la base y guarda un respaldo JSON de los productos Essen
existentes. Las ejecuciones repetidas omiten productos ya creados.
