# Catálogo Essen C9 - septiembre 2026

Actualización preparada desde el catálogo C9 de 12 cuotas. Contiene 88
productos vigentes, sus imágenes y un manifiesto validable antes de sincronizar.

## Criterio comercial

- `precioBase` usa el precio de lista publicado por Essen.
- `porcentajeGanancia` es `0`, para que el precio visible no vuelva a incrementarse.
- `precio12CuotasCatalogo` conserva la cuota de referencia publicada.
- Los combos y promociones generales de las páginas 4 a 7 y 25 no forman parte
  del catálogo permanente.
- El stock de productos existentes se conserva. Los productos nuevos comienzan
  sin stock disponible.

## Cambios respecto de C8

- Se actualizan precios y metadatos de los productos que continúan vigentes.
- Se incorpora `Essen · Rosa` con cinco productos.
- Black Edition conserva sus productos y corrige sus códigos propios.
- Se agregan dos complementos Rosa.
- Los artículos ausentes en C9 se desactivan, pero no se eliminan, para preservar
  cotizaciones e historial.

## Validación y sincronización

La validación local no se conecta a MongoDB:

```bash
npm run validate-essen-catalog
npm run import-essen-catalog
```

La ejecución real requiere revisar primero el plan, confirmar la base objetivo y
contar con autorización explícita:

```bash
npm run import-essen-catalog -- --execute --confirm-db=NOMBRE_EXACTO
```

Antes de modificar categorías o productos, el script comprueba el nombre exacto
de la base y crea un respaldo JSON de todos los productos Essen existentes.
