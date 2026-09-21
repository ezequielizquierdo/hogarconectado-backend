# Piloto operativo de vendedores y productos de terceros

Plan de prueba controlada para validar atribución, cobro, entrega y liquidación antes de invitar a una red amplia. Complementa `operacion-comercial-cobro-entrega-y-atribucion.md`. No autoriza transacciones ni cambia por sí solo las reglas vigentes del backend.

## Decisión para arrancar

El piloto debe comenzar con pocos productos de stock propio de Hogar Conectado y un grupo pequeño de vendedores. En ese caso, Hogar Conectado puede ser el vendedor comercial, cobrar, facturar y organizar la entrega según su situación fiscal. La atribución de la consulta y la comisión del promotor se verifican en cada operación.

Los productos de terceros pueden publicarse para **consultas asistidas** solamente después de identificar por escrito quién vende, cobra, factura, entrega y responde reclamos. No habilitar compra inmediata para ellos hasta que el sistema conserve esas reglas por producto y por pedido. Para catálogo con disponibilidad incierta, confirmar primero stock, precio y plazo de entrega.

**Regla acordada para el piloto de productos propios:** las nuevas cotizaciones atribuidas a un vendedor usan `vendedor-60-margen`: 60% del margen comercial para él y 40% para Hogar Conectado. El margen es precio de venta menos costo de los productos según la modalidad; el envío se cobra aparte y no genera comisión. El dinero a rendir incluye la porción de Hogar Conectado, el costo de los productos y el envío cobrado. Las cotizaciones históricas con `vendedor-50-margen` mantienen 50/50. **No confundir este 60/40 con la propuesta multiparte 60/30/10** para productos de terceros, que aún requiere diseño y acuerdo específico.

Ejemplo sin envío: si el costo acordado es $371.000 y se vende a $430.000, el margen es $59.000. Al vendedor le corresponden $35.400; a Hogar Conectado, $23.600. El vendedor rinde $394.600 si recibió íntegro el pago del comprador. El cálculo en pantalla no acredita por sí mismo cobro, entrega ni transferencia de la comisión.

## Alcance sugerido

| Elemento | Piloto inicial |
| --- | --- |
| Vendedores | 2 a 3 usuarios activos, capacitados y con identidad validada |
| Productos | 5 a 10 productos de stock propio con precio, imágenes y disponibilidad revisados |
| Producto de tercero | 1 caso supervisado, inicialmente solo con consulta y cierre asistido |
| Producto de catálogo | 1 caso con confirmación manual de disponibilidad antes del pago |
| Canales | Enlace del vendedor, catálogo directo y consulta de varios productos |
| Pagos | Al responsable comercial informado al comprador; sin caja común informal |
| Duración | Cuatro semanas o hasta completar un volumen suficiente de casos revisables |

No cargar datos reales, cambiar roles ni publicar productos adicionales por este documento. El administrador debe seleccionar expresamente a los participantes y aprobar sus condiciones.

## Situación actual del backend

| Capacidad | Estado observado | Límite para el piloto |
| --- | --- | --- |
| Código público de vendedor | Existe `GET /api/vendedores/:codigo` y se admite `codigoVendedor` al crear una consulta | La atribución firme se registra en la consulta, no necesariamente en cotización y pedido posteriores |
| Consulta multproducto | Existe con snapshots e idempotencia | No hay atribución por cada línea de producto |
| Bandeja del vendedor | El filtro incluye consultas propias y generales sin asignar | Hace falta distinguir mejor oportunidad atribuida, atención asignada y conflicto |
| Aviso push de nueva consulta | Se envía a administrador y vendedor de origen | Ambos reciben texto genérico; no hay aviso específico al admin con nombre del vendedor ni registro persistente de notificación |
| Cotización | Guarda creador, modalidad y snapshot de precios | No guarda vendedor de origen independiente ni incorporador, cobrador o emisor de factura por línea |
| Pedido | Aceptar una cotización crea reserva idempotente por 24 horas para stock propio | El pedido no guarda responsable de cobro, entrega, factura ni liquidación multiparte |
| Pago | El comprador puede informar pago y el admin confirmarlo | No hay integración de pasarela ni conciliación automática; el aviso del comprador no es acreditación |
| Entrega | La cotización tiene `entregaAcordada` y `estadoEntrega` | No hay flujo completo de evidencias ni responsable explícito por producto |
| Reparto | La cotización calcula resumen al confirmar | Las nuevas cotizaciones atribuidas usan 60/40 del margen; las históricas 50/50 no cambian. El 60/30/10 para terceros sigue pendiente |

La revisión cubrió `models/Producto.js`, `models/Consulta.js`, `models/Cotizacion.js`, `models/Pedido.js`, `routes/consultas.js`, `routes/vendedores.js`, `services/pushNotifications.js`, `services/orderReservations.js` y `utils/sellerAccess.js` al 21 de septiembre de 2026. Debe verificarse de nuevo antes de implementar porque el repositorio contiene cambios de código en curso.

## Cómo operar los primeros casos sin fingir automatización

### Caso A: stock propio, comprador llega por un vendedor

1. El administrador confirma precio, stock, medio de cobro, emisor de factura, entrega y comisión vigente.
2. El vendedor comparte su enlace personal y el comprador crea la consulta con el código de ese vendedor.
3. El vendedor recibe el aviso, atiende y registra la oportunidad. El administrador ve la consulta y quién la originó.
4. El vendedor prepara una cotización desde su cuenta. Antes de enviarla, se comprueba manualmente que corresponde a la consulta atribuida, ya que hoy esa relación no se congela en la cotización.
5. El comprador acepta. El sistema reserva stock propio por 24 horas. El administrador controla disponibilidad y cobro.
6. Hogar Conectado, si es el vendedor comercial, cobra y factura conforme a su régimen. El administrador confirma el pago solo tras comprobar la acreditación.
7. Se acuerda y registra la entrega. La comisión queda pendiente hasta constatar pago y entrega; la transferencia real debe registrarse fuera del simple cálculo de pantalla.

### Caso B: producto de tercero

1. Antes de publicarlo, el titular firma o acepta por escrito precio a recibir, responsable de cobro, facturación, entrega, reclamos y reparto del margen.
2. El vendedor puede compartir la ficha y captar una consulta. No se ofrece pago inmediato si la operación todavía depende de confirmaciones externas.
3. El administrador coordina la propuesta con el titular y comunica al comprador quién le cobrará y entregará.
4. El titular verifica la acreditación, emite el comprobante y acredita la entrega. El administrador conserva evidencias y concilia las participaciones acordadas.
5. Este caso debe seguir siendo asistido hasta que el backend soporte una regla multiparte congelada por producto. No usar el cálculo 60/40 del piloto para simular 60/30/10.

### Caso C: catálogo con stock incierto

1. El vendedor obtiene la consulta.
2. El responsable del catálogo confirma disponibilidad, vigencia del precio y plazo.
3. Se envía una propuesta actualizada. El comprador acepta condiciones finales antes de recibir instrucciones de pago.
4. El pedido avanza con comprobante, entrega y liquidación documentados. Si el proveedor no confirma, se informa indisponibilidad y se ofrece otra opción sin cobrar.

### Caso D: dos productos de distintos responsables

El cliente puede preguntar por ambos en una sola consulta. La respuesta debe aclarar si habrá distintos cobros y entregas. No ofrecer un pago único hasta resolver quién actúa como vendedor de la operación completa y cómo se emitirán los comprobantes. Internamente, la atribución y el reparto deben pertenecer a cada producto, no solo al pedido global.

## Reglas de atención y notificación del piloto

- Una consulta atribuida notifica al vendedor de origen y al administrador.
- El texto para el vendedor indica que debe responder. El texto para el administrador indica qué vendedor recibió la consulta.
- El panel conserva el evento incluso si el push falla o el dispositivo no está disponible.
- Se mide tiempo hasta primera respuesta. Como objetivo de prueba, recordar a los 15 minutos y escalar a los 30 o 60 minutos dentro del horario comercial acordado.
- Reasignar la atención no borra el vendedor de origen. Si hay una excepción, el administrador registra motivo y fecha.
- Los datos personales del comprador se muestran solo a quienes necesitan atender o supervisar la operación.

Estos mensajes diferenciados, el recordatorio y la escalada automática son **trabajo pendiente**, no comportamiento actual confirmado.

## Primer incremento técnico recomendado

1. **Ficha de responsables por producto:** titular comercial, cobrador, emisor de factura, responsable de entrega, política de envío y reclamos. Validación para impedir compra inmediata si faltan datos.
2. **Atribución persistente:** guardar vendedor de origen en cotización y pedido, separadamente de `creadaPor` y del responsable de atención. Conservar versión de la regla económica por producto.
3. **Notificación diferenciada:** payload para vendedor y para administrador, registro interno, pruebas de destinatarios y protección de datos.
4. **Liquidación multiparte:** cálculo por línea con base, costos permitidos, margen, incorporador, promotor y plataforma. Mantener compatibilidad con cotizaciones 50/50 y 60/40 sin reinterpretarlas.
5. **Seguimiento de cumplimiento:** evidencias de acreditación, factura, despacho, recepción, reclamo y transferencias de comisiones. Estados separados e historial inmutable.
6. **Pagos integrados:** evaluar después del piloto. Mercado Pago Split 1:1 no reemplaza automáticamente el reparto entre tres beneficiarios.

Antes de programar el punto 4 se necesita aprobar la fórmula exacta, quién absorbe cargos de la pasarela y qué sucede cuando incorporador y vendedor son la misma persona. Antes del punto 6 se necesita validación contable, legal y comercial del proveedor de pagos.

## Medidas para decidir si ampliar

- Proporción de consultas atribuidas correctamente y disputas de origen.
- Tiempo mediano hasta primera respuesta y consultas sin atender.
- Conversión de consulta a cotización, de cotización a pedido y de pedido a pago acreditado.
- Pedidos entregados en el plazo comunicado y reclamos por entrega.
- Diferencia entre liquidación calculada y dinero efectivamente transferido.
- Casos que requieren intervención del administrador y tiempo dedicado a conciliarlos.

El piloto se considera listo para ampliarse cuando cada venta examinada puede responder, con evidencia: quién originó la oportunidad, quién cobró, quién facturó, quién entregó, qué importes correspondían a cada parte y cuáles se pagaron realmente. No hace falta prometer una tasa de conversión o un número de ventas antes de medirlos.

## Decisiones que debe confirmar el propietario

1. Qué entidad o persona será el vendedor comercial de los productos propios.
2. Qué vendedores y qué productos concretos participarán en el piloto.
3. Si el primer producto de tercero se publicará solo para consultas, como aquí se recomienda.
4. Qué contador y asesor legal validarán facturación, contratos y circuito de dinero.
5. Si la propuesta 60/30/10 se aprueba como objetivo para productos de terceros o requiere ajuste antes de desarrollarla.
