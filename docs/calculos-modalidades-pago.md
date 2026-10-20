# Cálculos vigentes por modalidad de pago

Este documento describe los cálculos que actualmente realiza el backend de Hogar Conectado. Su objetivo es facilitar el análisis comercial; no modifica ninguna fórmula.

La fuente de verdad técnica es [`utils/pricing.js`](../utils/pricing.js). Las cotizaciones guardan una copia de los precios utilizados al crearse, por lo que un cambio posterior en las fórmulas o en el producto no debe alterar una cotización histórica.

> **Política comercial desde el 16 de octubre de 2026:** los cálculos de Facturado, 3 cuotas y 6 cuotas que siguen documentados abajo se conservan como referencia técnica e histórica, pero ya no se presentan como valores confirmados. Las nuevas solicitudes con esas modalidades muestran **“Valor a confirmar”** y no pueden aceptarse ni cerrarse como venta hasta contar con una cotización actualizada. El valor contado continúa calculándose y mostrándose normalmente.

## 1. Variables utilizadas

| Símbolo | Dato | Valor vigente o procedencia |
| --- | --- | --- |
| `B` | Precio base del producto | Se carga en cada producto. Es un dato interno. |
| `G` | Porcentaje de ganancia comercial | Porcentaje propio del producto; si no existe, se usa `GANANCIA_DEFAULT`. El respaldo del código es **30%**. |
| `F` | Factor de facturación | **1,05** fijo en el código. |
| `F3` | Factor para 3 cuotas | `FACTOR_3_CUOTAS`; respaldo del código: **1,1298**. |
| `F6` | Factor para 6 cuotas | `FACTOR_6_CUOTAS`; respaldo del código: **1,2138**. |
| `D` | Descuento del producto | Porcentaje entre 0% y 90%. Si no existe, es 0%. |
| `FD` | Factor de descuento | `1 - D / 100`. |

> Importante: el porcentaje de ganancia se transforma a decimal. Por ejemplo, 10% se utiliza como `0,10`.

## 2. Resumen de fórmulas de venta

| Modalidad | Precio total al cliente | Importe de cada cuota |
| --- | --- | --- |
| Contado | `B × (1 + G) × FD` | No corresponde |
| Facturado en 1 cuota | `B × F × (1 + G) × FD` | Un único pago igual al total |
| 3 cuotas | `B × (1 + G) × F3 × FD` | `Total / 3` |
| 6 cuotas | `B × (1 + G) × F6 × FD` | `Total / 6` |

El total de una cotización es la suma de:

```text
precio unitario de la modalidad × cantidad
```

para todos los productos incluidos.

## 3. Contado

### Precio sin descuento

```text
Contado sin descuento = B × (1 + G)
```

### Precio final

```text
Contado final = Contado sin descuento × FD
```

### Costo usado para la liquidación

```text
Costo a rendir del producto = B
```

### Margen comercial antes de repartir

```text
Margen = máximo entre 0 y (Contado final - B)
```

## 4. Facturado en 1 cuota

Primero se incrementa el precio base un 5% y luego se aplica la ganancia comercial.

### Costo facturado

```text
Costo facturado = B × 1,05
```

### Precio sin descuento

```text
Facturado sin descuento = Costo facturado × (1 + G)
```

Equivale a:

```text
Facturado sin descuento = B × 1,05 × (1 + G)
```

### Precio final

```text
Facturado final = Facturado sin descuento × FD
```

### Margen comercial antes de repartir

```text
Margen = máximo entre 0 y (Facturado final - Costo facturado)
```

## 5. Tres cuotas

### Costo financiado usado para la liquidación

```text
Costo 3 cuotas = B × F3
```

### Precio total sin descuento

```text
Total 3 cuotas sin descuento = B × (1 + G) × F3
```

### Precio total final

```text
Total 3 cuotas = Total sin descuento × FD
```

### Valor de cada cuota

```text
Cada cuota = Total 3 cuotas / 3
```

### Margen comercial antes de repartir

```text
Margen = máximo entre 0 y (Total 3 cuotas - Costo 3 cuotas)
```

## 6. Seis cuotas

### Costo financiado usado para la liquidación

```text
Costo 6 cuotas = B × F6
```

### Precio total sin descuento

```text
Total 6 cuotas sin descuento = B × (1 + G) × F6
```

### Precio total final

```text
Total 6 cuotas = Total sin descuento × FD
```

### Valor de cada cuota

```text
Cada cuota = Total 6 cuotas / 6
```

### Margen comercial antes de repartir

```text
Margen = máximo entre 0 y (Total 6 cuotas - Costo 6 cuotas)
```

## 7. Ejemplo completo vigente

Ejemplo utilizado por las pruebas automáticas:

- Precio base: **$705.000**
- Ganancia: **10%**
- Descuento: **0%**
- Factor facturado: **1,05**
- Factor 3 cuotas: **1,1298**
- Factor 6 cuotas: **1,2138**

| Modalidad | Costo usado para liquidar | Total al cliente | Cuota | Margen comercial |
| --- | ---: | ---: | ---: | ---: |
| Contado | $705.000,00 | $775.500,00 | — | $70.500,00 |
| Facturado | $740.250,00 | $814.275,00 | $814.275,00 | $74.025,00 |
| 3 cuotas | $796.509,00 | $876.159,90 | $292.053,30 | $79.650,90 |
| 6 cuotas | $855.729,00 | $941.301,90 | $156.883,65 | $85.572,90 |

Si esta operación corresponde a un vendedor con reparto 60/40 y no tiene envío:

| Modalidad | Ganancia vendedor (60%) | Hogar Conectado (40%) | Dinero a rendir |
| --- | ---: | ---: | ---: |
| Contado | $42.300,00 | $28.200,00 | $733.200,00 |
| Facturado | $44.415,00 | $29.610,00 | $769.860,00 |
| 3 cuotas | $47.790,54 | $31.860,36 | $828.369,36 |
| 6 cuotas | $51.343,74 | $34.229,16 | $889.958,16 |

### Discurso para explicar este ejemplo

> Partimos de un producto cuyo precio base es de $705.000. Sobre ese valor aplicamos un 10% de ganancia comercial. Si el cliente paga al contado, el precio final es de $775.500 y se genera un margen de $70.500.
>
> Si necesita factura, al precio base se le agrega primero el 5% correspondiente al costo de facturación. Sobre ese nuevo costo se aplica la misma ganancia del 10%. Por eso el precio facturado en un pago es de $814.275. No estamos cobrando dos ganancias: una parte cubre el costo adicional de facturar y la otra es el margen comercial.
>
> Si el cliente elige 3 cuotas, el total es de $876.159,90, dividido en tres pagos de $292.053,30. En 6 cuotas, el total es de $941.301,90, dividido en seis pagos de $156.883,65. El total aumenta porque cada plan incorpora su costo financiero; la cuota de 6 pagos es menor, pero el costo total de financiar durante más tiempo es mayor.
>
> Cuando la venta la concreta un vendedor, no dividimos todo el dinero cobrado. Primero se separa el costo del producto y únicamente se reparte el margen comercial: 60% para el vendedor y 40% para Hogar Conectado. Por ejemplo, en la venta al contado el margen es de $70.500; el vendedor gana $42.300 y Hogar Conectado recibe $28.200. El vendedor debe rendir $733.200, que incluye el costo del producto y la participación de la plataforma.
>
> El envío se calcula aparte. Se suma al total que abona el comprador, pero no genera comisión: debe rendirse completo para cubrir la entrega. El contado puede informarse inmediatamente. Para Facturado, 3 cuotas o 6 cuotas, estos números funcionan como referencia interna: primero se consulta el costo vigente y recién entonces se le comunica al cliente el total y, cuando corresponda, el valor de cada cuota. Después de esa validación, el vendedor sabe exactamente cuánto gana y cuánto debe rendir.

#### Versión breve

> Este producto tiene un precio base de $705.000 y una ganancia comercial del 10%. Al contado queda en $775.500. También puede solicitarse facturado, en 3 cuotas o en 6 cuotas, pero esos valores se confirman al momento de cotizar porque sus costos pueden cambiar. Si la venta la realiza un vendedor, primero se resguarda el costo del producto y el margen restante se distribuye 60% para el vendedor y 40% para Hogar Conectado. El envío siempre se cobra y se rinde aparte.

## 8. Reparto del margen de una venta

La comisión no se calcula sobre todo el precio cobrado. Se calcula sobre el margen que queda después de restar el costo correspondiente a la modalidad.

```text
Margen comercial = máximo entre 0 y (Total de productos - Costo de productos)
```

### Regla actual para vendedores: 60/40

```text
Ganancia del vendedor = Margen comercial × 60%
Participación de Hogar Conectado = Margen comercial × 40%
```

Las cotizaciones históricas que fueron creadas con la regla 50/50 conservan ese reparto.

### Operación interna

El tipo técnico `operacion-interna` asigna actualmente el 100% del margen al campo `gananciaVendedor` y 0% a `participacionHogarConectado`. Aunque así funciona hoy, el nombre del campo puede resultar confuso para una operación administrada directamente por Hogar Conectado.

### Ejemplo 60/40 con precio base de $371.000

Si el precio de venta contado es $430.000:

```text
Margen comercial = $430.000 - $371.000 = $59.000
Ganancia del vendedor = $59.000 × 60% = $35.400
Participación de Hogar Conectado = $59.000 × 40% = $23.600
Dinero a rendir = $430.000 - $35.400 = $394.600
```

## 9. Envío y dinero a rendir

El envío se agrega al total de la operación, pero no genera comisión ni se reparte como margen.

```text
Total vendido = Total de productos + Costo de envío
Dinero a rendir = Total vendido - Ganancia del vendedor
```

Por lo tanto, el dinero a rendir contiene:

- el costo de los productos;
- la participación de Hogar Conectado;
- el costo completo del envío, cuando corresponde.

## 10. Cómo se aplica un descuento

El descuento reduce el precio que paga el cliente en todas las modalidades, pero no reduce el costo utilizado para liquidar la operación.

Ejemplo con precio base de $100.000, ganancia de 20% y descuento de 10%:

```text
Contado sin descuento = $100.000 × 1,20 = $120.000
Contado final = $120.000 × 0,90 = $108.000
```

Esta diferencia es importante: un descuento alto puede consumir parte o todo el margen. Si el precio de venta queda por debajo del costo de liquidación, el sistema fija el margen en cero y no genera comisión negativa.

## 11. Redondeo actual

El backend conserva los resultados numéricos con decimales y no aplica un redondeo comercial general antes de guardar los cálculos. Por eso pueden aparecer importes como `$876.159,90` o cuotas como `$156.883,65`.

Antes de cambiar las fórmulas conviene definir una política única, por ejemplo:

- conservar centavos;
- redondear al peso más cercano;
- redondear siempre hacia arriba;
- redondear a múltiplos comerciales, por ejemplo de $100 o $500.

La suma de las cuotas debe continuar coincidiendo con el total informado.

## 12. Aspectos que conviene analizar

1. **Ganancia predeterminada:** el respaldo del código es 30%, aunque comercialmente se ha usado 10% en distintos ejemplos. Producción puede tener otro valor en `GANANCIA_DEFAULT` y cada producto puede sobrescribirlo.
2. **Facturación:** el 5% está fijo en el código. Conviene validar si representa correctamente el costo real de facturar y cobrar.
3. **Factores de cuotas:** 1,1298 y 1,2138 pueden configurarse. Conviene revisarlos cuando cambien los costos financieros.
4. **Descuentos:** hoy reducen el margen de vendedor y plataforma porque el costo a rendir permanece igual.
5. **Redondeo:** no existe todavía una política comercial explícita y uniforme.
6. **Operación interna:** conviene revisar el nombre y la interpretación de `gananciaVendedor` cuando no participa un vendedor externo.
7. **Congelamiento histórico:** toda modificación futura debe aplicarse solo a nuevas cotizaciones; las ya creadas conservan su snapshot y regla de liquidación.

## 13. Referencias técnicas

- Fórmulas y valores de respaldo: [`utils/pricing.js`](../utils/pricing.js)
- Selección de precios, totales y liquidación: [`models/Cotizacion.js`](../models/Cotizacion.js)
- Pruebas de las fórmulas: [`test/pricing.test.js`](../test/pricing.test.js)
- Pruebas de cotizaciones y comisiones: [`test/cotizacion.test.js`](../test/cotizacion.test.js)
