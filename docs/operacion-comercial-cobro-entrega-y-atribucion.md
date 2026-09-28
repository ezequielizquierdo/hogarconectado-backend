# Operación comercial de Hogar Conectado

Documento de trabajo para definir cómo se atribuyen consultas y ventas, quién cobra, quién entrega y cuándo se liquidan las participaciones. Complementa la guía comercial. Las reglas propuestas requieren aceptación de las partes y revisión contable y legal antes de habilitar cobros a escala.

> **Estado de implementación:** este documento describe el modelo operativo objetivo para productos propios y de terceros. Hoy, las nuevas ventas atribuidas del piloto de productos propios liquidan 60% del margen al vendedor y 40% a Hogar Conectado. El reparto multiparte 60/30/10, los responsables por producto y los pagos integrados siguen siendo propuestas pendientes. La referencia vigente para operar el piloto es [`piloto-operativo-vendedores.md`](./piloto-operativo-vendedores.md).

## Decisión recomendada para el piloto

Hogar Conectado debe funcionar inicialmente como vidriera, canal de atribución y coordinador de operaciones. **Cada producto tendrá un vendedor jurídico o comercial identificado antes de publicarse.** Ese responsable cobra al comprador, emite el comprobante que corresponda a la venta y responde por la entrega, directamente o mediante un tercero designado. El administrador supervisa la evidencia y registra la liquidación de las comisiones. La plataforma no debería cobrar el precio total en una cuenta personal de Mercado Pago para luego distribuirlo manualmente.

Esta separación permite responder al comprador antes de pagar: «Te cobra y factura X; entrega Y; Hogar Conectado registra y supervisa la operación». Si no podemos completar esa frase para un producto, ese producto puede admitir consultas, pero no compra inmediata.

La obligación y forma concreta de facturar dependen de quién vende jurídicamente, de su condición tributaria y del contrato entre las partes. No se resuelven por quién publicó la foto o quién hizo el contacto. Un contador debe validar el esquema por tipo de producto, incluida la facturación de comisiones y los casos de intermediación o consignación. ARCA indica que los monotributistas deben emitir comprobantes electrónicos por operaciones con consumidores finales; esto no determina por sí solo quién es el emisor en una venta con varios participantes. [ARCA, facturación de monotributistas](https://arca.gob.ar/facturacion/monotributo/comprobantes.asp).

## Ficha operativa obligatoria por producto

Antes de habilitar ventas, el administrador registra y el responsable del producto confirma:

| Dato | Decisión que debe quedar escrita |
| --- | --- |
| Titular y responsable comercial | Quién aporta el producto y quién es el vendedor frente al comprador |
| Cobro | Nombre o razón social, medio de pago autorizado y titular de la cuenta |
| Facturación | Quién emite el comprobante de la venta y qué comprobantes respaldan las comisiones |
| Entrega | Quién prepara, despacha y responde por daños, demoras o falta de entrega |
| Stock | Quién lo actualiza y quién confirma o rechaza una reserva |
| Precio | Precio final, vigencia, descuentos permitidos y costos de pago |
| Envío | Quién lo paga, quién lo cobra y si se reintegra al responsable de entrega |
| Margen | Base de cálculo, porcentajes de cada participante y momento de liquidación |
| Posventa | Responsable de cambios, devoluciones y reclamos |

El comprador ve solamente los datos comerciales necesarios: precio final, disponibilidad, envío, identidad del vendedor/cobrador, entrega estimada y condiciones de devolución. El vendedor promotor ve su comisión estimada y las reglas que necesita para ofrecer el producto, pero no costos internos ajenos a su rol.

## Caso 1: un vendedor empieza a promocionar

1. El administrador habilita al vendedor y los productos que puede ofrecer.
2. El vendedor arma una selección en su vidriera personal. El catálogo y el stock siguen siendo comunes; la vidriera no duplica publicaciones.
3. La aplicación crea enlaces individuales y un enlace a la vidriera con un identificador de referencia firmado o asociado en el servidor. También puede ofrecer código QR, imágenes y textos para compartir.
4. Una visita guarda la referencia de manera provisional. La primera acción verificable del comprador sobre un producto, como enviar una consulta, pedir una cotización o iniciar una compra, crea la atribución firme.
5. La consulta o pedido guarda vendedor de origen, producto, fecha, canal, comprador y versión de la regla económica. El vendedor que complete la atención se guarda en otro campo.
6. Si otra persona ayuda, la comisión de origen se conserva. Las excepciones requieren motivo, permiso de administrador y registro de auditoría; nunca una edición silenciosa.

**Plazos propuestos para el piloto:** la visita aislada conserva la referencia siete días; una acción verificable conserva la atribución durante treinta días para ese comprador y esos productos. Estos plazos son una política comercial propuesta, no una capacidad actualmente garantizada por el software. Deben exponerse en los términos del programa de vendedores.

Si el comprador usa dos enlaces, una mera visita no desplaza una consulta ya atribuida. Si consulta productos distintos, cada línea de producto puede tener un vendedor de origen diferente. Si la consulta vence sin actividad y el comprador vuelve por otro vendedor, se abre una oportunidad nueva según la política publicada.

## Caso 2: llega una consulta dirigida

1. El comprador consulta desde la vidriera o el enlace de un vendedor.
2. El sistema crea una oportunidad idempotente, con los productos, el contacto y la atribución.
3. El vendedor recibe una notificación push y un aviso persistente en su bandeja: producto, hora, contacto permitido y acción para responder.
4. El administrador recibe un aviso informativo: «Entró una consulta para [vendedor] por [productos]». Puede observar estado y tiempo sin apropiarse de la oportunidad.
5. El vendedor marca «Vista» y comienza la atención. Si no responde dentro del plazo configurado, recibe un recordatorio y después el administrador puede tomar o reasignar la atención.
6. La reasignación cambia el responsable de atención, no la atribución comercial de origen. El comprador recibe una respuesta de una sola persona a la vez para evitar mensajes duplicados.

Los tiempos sugeridos de 15 minutos para recordar y 30 a 60 minutos para escalar son objetivos de servicio para probar, no promesas de disponibilidad permanente. Las notificaciones push pueden fallar; la bandeja y el registro de la consulta son la fuente de verdad.

## Recorrido común de una operación

| Etapa | Comprador | Vendedor promotor | Responsable de venta, cobro y entrega | Administrador |
| --- | --- | --- | --- | --- |
| Publicación | Ve información vigente | Elige qué ofrecer | Confirma precio, stock, cobro, factura y entrega | Valida reglas y permisos |
| Interés | Consulta o inicia compra | Recibe y atiende la oportunidad | Responde dudas específicas del producto | Supervisa tiempos y conflictos |
| Propuesta | Acepta precio y condiciones | Prepara cotización, si hace falta | Confirma disponibilidad y plazo | Interviene en excepciones |
| Reserva | Confirma datos mínimos | Sigue el caso | Reserva stock o confirma pedido al proveedor | Audita vencimientos |
| Pago | Paga al titular informado | No declara pago por una captura | Verifica acreditación real y emite comprobante | Contrasta estado y evidencia |
| Entrega | Recibe o reclama | Comunica el estado | Prepara, envía y acredita entrega | Sigue incidentes |
| Liquidación | Recibe comprobante de la operación | Ve comisión pendiente o pagada | Rinde lo acordado según el contrato | Valida conciliación y registra pagos |

**Estados distintos:** consulta, cotización, pedido, reserva, pago pendiente, pago acreditado, preparación, despacho, entrega, reclamo y liquidación. Una venta «confirmada» no debe significar a la vez que el dinero llegó, que se entregó y que las comisiones se pagaron.

## Escenarios que modifican el recorrido

### Producto propio del administrador

Hogar Conectado puede ser el vendedor y cobrador de la operación si esa es su organización comercial y fiscal. El administrador o su equipo entrega o contrata el envío y emite la factura de venta. Si un revendedor originó al comprador, su comisión se calcula con la regla congelada para ese producto y se liquida tras acreditar pago y entrega.

### Producto de un tercero con stock confirmado

Durante el piloto, recomendamos que el titular comercial o proveedor cobre y facture al comprador, y que también sea responsable de entregar. El administrador debe verificar que el comprador vea esa identidad antes de pagar. El proveedor paga las comisiones acordadas contra la liquidación y los comprobantes que correspondan. Si el proveedor no acepta esta responsabilidad o no puede documentarla, el producto permanece solo para consulta.

### Producto de catálogo o stock incierto

El comprador consulta o solicita cotización. El responsable confirma disponibilidad, precio vigente y entrega antes de enviar un enlace de pago. No se promete reserva automática ni despacho inmediato sin confirmación del proveedor.

### Un carrito con productos de varios responsables

El comprador puede armar una consulta única. Para cerrar una compra, la plataforma debe separar cada subpedido por cobrador, emisor de factura, disponibilidad y entrega. Un pago único y un comprobante único solo serían apropiados después de definir quién actúa como vendedor de toda la operación y cómo se documentan las transferencias internas. Hasta entonces, mostrar al comprador el desglose y los pagos correspondientes, o limitar el cierre a una cotización asistida.

### Vendedor de origen distinto del vendedor que atiende

El origen conserva su atribución; quien atiende queda registrado como operador. Una comisión adicional de asistencia solo existe si se definió antes. El administrador no cambia la regla por conveniencia después de cobrar.

### Entrega con envío

Antes del pago se identifica quién hace el envío, su precio y quién lo cobra. El envío se registra por separado del margen del producto. Si se cancela, se aplican las condiciones informadas al comprador y se registra qué costos ya se devengaron.

### Precio, stock o producto cambian

Una consulta puede actualizarse con una propuesta nueva. Una cotización aceptada o un pedido deben conservar la versión del precio y del reparto utilizados. Si el stock falla, se informa al comprador y se ofrece una alternativa; no se sustituye un producto ni se carga un monto nuevo sin consentimiento.

### Pago rechazado o no acreditado

El pedido sigue impago. Una captura de pantalla no acredita fondos. Al vencer la reserva, el stock vuelve a estar disponible exactamente una vez. No se liquida ninguna comisión.

### Cancelación, devolución o contracargo

El estado de liquidación queda suspendido. El responsable de venta y cobro gestiona la devolución al comprador. La plataforma registra el incidente y recalcula o revierte las participaciones conforme a la regla previamente pactada. Nadie cobra una comisión definitiva sobre una venta revertida.

## Quién recibe y reparte el dinero

En el piloto, la respuesta debería ser: **cobra el vendedor comercial definido para ese producto; la aplicación calcula los montos; el administrador concilia y registra la liquidación; quien cobró paga a los participantes según el contrato y la documentación fiscal.** No se debe presentar una cifra calculada en pantalla como si ya fuera dinero cobrado o pagado.

Ejemplo ilustrativo con base acordada de $175.000 y precio final de $192.500, sin envío ni cargos adicionales: margen de $17.500. Con una regla 60/30/10 del margen, corresponden $10.500 al vendedor promotor, $5.250 al incorporador y $1.750 a Hogar Conectado. El titular del producto recibe además los $175.000 de base. En una operación real, la regla debe establecer antes si comisiones de la pasarela, impuestos, descuentos y devoluciones reducen ese margen y quién los asume. Nunca se deduce automáticamente que «ganancia» equivale a saldo disponible para transferir.

## Mercado Pago: cuenta única o integración marketplace

**No recomendamos como modelo general que el administrador reciba en su cuenta personal de Mercado Pago el total de ventas de distintos propietarios para redistribuirlo manualmente.** Esa opción convierte al administrador en receptor de fondos de terceros, concentra contracargos y reclamos, complica la conciliación y puede cambiar el tratamiento fiscal y contractual de la operación. Tener una cuenta comercial de Mercado Pago es útil para ventas propias de Hogar Conectado, pero por sí sola no resuelve el reparto de ventas ajenas.

Mercado Pago ofrece en Argentina Split de Pagos 1:1 para que el cobro vaya a la cuenta del vendedor y se separe una comisión de marketplace. Requiere vinculación OAuth y condiciones de identificación del vendedor. **No equivale al reparto automático entre incorporador, vendedor promotor y plataforma**: Mercado Pago indica que el modelo 1:N está disponible solamente para vendedores de cartera asesorada. La factibilidad, los costos y la liberación de fondos deben confirmarse con Mercado Pago antes de elegir la arquitectura de cobros. [Resumen de Split 1:1](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/overview), [requisitos y límite 1:N](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/prerequisites), [integración y tratamiento de comisiones y reembolsos](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace).

La evolución prudente es: primero validar ventas y rendiciones documentadas con pocos participantes; luego comparar un checkout marketplace 1:1 con otras soluciones de pagos; finalmente automatizar pagos a múltiples beneficiarios solo si el proveedor y la estructura fiscal lo permiten. No diseñar el producto como si un split 1:N ya estuviera disponible.

## Cuándo se factura

La venta del producto y los servicios de intermediación o promoción son hechos económicos diferentes. **La persona o empresa que figure como vendedor de la mercadería debe definir con su contador la factura al comprador.** La plataforma y el promotor deben definir con el mismo criterio qué comprobantes emiten por sus propias comisiones o servicios y a quién. Los comprobantes deben corresponder al flujo real de dinero y a los contratos, no a una etiqueta de la interfaz. Según ARCA, los monotributistas deben emitir comprobantes electrónicos a consumidores finales, y las clases de comprobantes varían según la condición del emisor y receptor. [ARCA, monotributo](https://arca.gob.ar/facturacion/monotributo/comprobantes.asp), [ARCA, régimen general](https://arca.gob.ar/facturacion/regimen-general/comprobantes.asp).

**Decisión pendiente antes de habilitar cobro integrado o publicar productos de terceros para compra inmediata:** revisión por contador y asesor legal de contratos, titularidad de la venta, emisión de comprobantes, tratamiento de comisiones, impuestos, devoluciones y responsabilidad frente al consumidor. Este documento es una propuesta operativa, no asesoramiento fiscal o legal individual.

## Qué debe ver cada participante

- **Comprador:** quién vende/cobra y factura, quién entrega, precio final, envío, plazo, seguimiento y canal de reclamo.
- **Vendedor promotor:** enlace personal, consultas atribuidas, responsable de atención, comisión estimada, pago acreditado, entrega y liquidación.
- **Incorporador:** productos, precio y stock acordados, ventas originadas, monto base a recibir y participación que corresponda.
- **Administrador:** responsables y contratos por producto, atribución, estados, comprobantes, vencimientos, incidencias y conciliación por operación.

La notificación informa una acción. El registro persistente de la operación demuestra qué ocurrió. Ambos deben coexistir.
