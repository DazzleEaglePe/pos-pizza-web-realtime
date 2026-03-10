**DOCUMENTO DE ANALISIS DE NEGOCIO**

──────────────────────────────────────────────────

**POS PIZZA**

Sistema de Punto de Venta Especializado para Pizzerias

Fase 1: Analisis de Negocio y Requerimientos

  ------------------------ ---------------------------------------------------------------
  **Proyecto**             POS Pizza - Sistema de Punto de Venta

  **Documento**            Analisis de Negocio - Fase 1 de 2

  **Autor**                Bruno Alvarez

  **Rol**                  Full Stack Developer / Lider de Proyecto

  **Version**              1.2

  **Fecha**                Marzo 2026

  **Estado**               En Revision

  **Siguiente Fase**       **Arquitectura Tecnica, Patrones de Diseno y Modelado de BD**

  **Clasificacion**        Documento Interno - Confidencial
  ------------------------ ---------------------------------------------------------------

**TABLA DE CONTENIDOS**

# 1. INTRODUCCION Y CONTEXTO

POS Pizza es un sistema de punto de venta especializado en el nicho de pizzerias, concebido para digitalizar y optimizar el flujo operativo completo de estos negocios: desde la toma de pedidos en mostrador hasta el cierre de caja, incluyendo control de inventario y generacion de reportes de negocio.

El proyecto se desarrolla bajo la metodologia de cliente piloto: una pizzeria real que actualmente opera con un sistema completamente manual (talonario de boletas con numeracion correlativa). Este enfoque permite validar cada funcionalidad en un entorno real antes de considerar la escalabilidad hacia otros negocios del rubro.

## 1.1 Vision del Producto

Construir el sistema POS de referencia para pizzerias en Peru, que sea tan rapido y simple como un talonario de papel pero con todo el poder de la digitalizacion: control automatico, visibilidad total del negocio y cero errores de calculo.

## 1.2 Alcance de este Documento

Este documento cubre exclusivamente el analisis de negocio: contexto del cliente, problemas identificados, flujos operativos, requerimientos funcionales y no funcionales, reglas de negocio, y definicion del alcance del MVP.

*La arquitectura tecnica, patrones de diseno, stack tecnologico, modelado de base de datos y plan de implementacion se documentaran en la **Fase 2: Arquitectura Tecnica y Diseno.***

## 1.3 Alcance del MVP

El MVP se enfoca en resolver los problemas criticos del cliente piloto con el minimo conjunto de funcionalidades que genere valor real:

  ------------------------------------------------------------------------------------- -------------------------------------------------------
  **INCLUIDO EN MVP (Fase 1)**                                                          **FUERA DEL MVP (Fases Posteriores)**

  Toma de pedidos en mostrador (salon + para llevar)                                    *Modulo de delivery (zonas, riders, tracking)*

  Pago adelantado obligatorio (efectivo + Yape/Plin)                                    *Integracion con apps de delivery (Rappi, PedidosYa)*

  Carta digital con categorias, variantes y modificadores                               *App movil para clientes / carta digital QR*

  Combos y promociones configurables                                                    *Integracion pasarela de pagos online*

  Ticket correlativo digital (reemplaza talonario)                                      *Facturacion electronica SUNAT automatizada*

  Pantalla de cocina en tiempo real                                                     *Programa de fidelizacion y puntos*

  Control de inventario basico con descuento automatico                                 *Inventario avanzado con alertas predictivas*

  Reportes de ventas y cierre de caja                                                   *Dashboard gerencial multi-sucursal*

  Gestion de usuarios y roles (admin, cajero, cocina)                                   *Multi-local (sucursales)*

  Seguimiento de pedido en tiempo real para el cliente (QR + URL + estados tematicos)   *Reservas online*

  Numeracion de mesas (propuesta de mejora)                                             *Pantalla TV de estado general en salon*

  Impuesto configurable (10.5% MYPE / 18% estandar)                                     *Integracion contable con CONCAR u otros ERPs*
  ------------------------------------------------------------------------------------- -------------------------------------------------------

# 2. ANALISIS DEL CLIENTE PILOTO

## 2.1 Perfil del Negocio

  -------------------------- -----------------------------------------------------------------------
  **CARACTERISTICA**         **DETALLE**

  **Tipo de negocio**        Pizzeria - Fast Casual

  **Canales de venta**       Salon (comer en local) + Para llevar

  **Modelo de pago**         Pago adelantado obligatorio antes de preparacion

  **Punto de venta**         Mostrador unico donde el cajero toma pedido y cobra

  **Personal operativo**     1 cajero en mostrador + equipo de cocina

  **Menu**                   Pizzas (multiples tamanos/toppings) + bebidas + complementos + combos

  **Metodos de pago**        Efectivo + Yape/Plin

  **Sistema actual**         Talonario manual con numeracion correlativa de tickets

  **Mesas**                  Salon sin numeracion actual (se propondra numerar)

  **Promociones**            Si maneja combos (ej: pizza + bebida a precio especial)

  **Regimen tributario**     Por confirmar (determina tasa de impuesto: 10.5% o 18%)
  -------------------------- -----------------------------------------------------------------------

## 2.2 Operacion Actual (AS-IS)

Actualmente la pizzeria opera de forma completamente manual. El siguiente flujo describe como funciona el negocio hoy, paso a paso:

**Paso 1:** El cliente ingresa al local y se acerca al mostrador.

**Paso 2:** Revisa la carta (fisica, en pizarra o menu impreso) y decide que pedir.

**Paso 3:** El cajero escribe el pedido a mano en el talonario de boletas: detalle de productos, cantidades y precio total calculado manualmente.

**Paso 4:** El cliente paga en ese momento (efectivo o Yape/Plin). El cajero calcula el vuelto mentalmente o con calculadora.

**Paso 5:** El cajero arranca la boleta del talonario y le entrega al cliente su comprobante con el numero de ticket correlativo.

**Paso 6:** El cajero comunica verbalmente el pedido a cocina (o pasa una copia de la boleta).

**Paso 7:** Cocina prepara el pedido. No hay visibilidad del estado para el cajero ni el cliente.

**Paso 8:** Cuando el pedido esta listo, alguien de cocina grita el numero de ticket o el nombre del cliente.

**Paso 9:** Si es salon: el cliente recoge su pedido o alguien lo lleva a su mesa (sin saber cual es porque no estan numeradas). Si es para llevar: el cliente recoge y se va.

**Paso 10:** Al final del dia, el cajero cuenta el efectivo en caja, suma las boletas manualmente y verifica si cuadra. Proceso lento y propenso a errores.

## 2.3 Problemas Identificados (Pain Points)

Del analisis de la operacion actual se identifican los siguientes problemas criticos que el sistema debe resolver:

  --------- ---------------------------------------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------- -----------------------------------------------------------------------------------------------------------------------
  **\#**    **PROBLEMA**                                                     **IMPACTO EN EL NEGOCIO**                                                                                                                                **SOLUCION PROPUESTA**

  **P1**    **Calculo manual de precios, subtotales, impuestos y vueltos**   Errores de cobro frecuentes; el negocio pierde dinero o cobra de mas generando desconfianza                                                              Calculo automatico de totales, subtotales, impuesto configurable y vuelto

  **P2**    **Cero control de inventario de insumos**                        No saben que tienen en stock; desabastecimiento sorpresivo; desperdicio de ingredientes; no pueden costear productos                                     Inventario vinculado a recetas con descuento automatico por venta y alertas de stock bajo

  **P3**    **Sin visibilidad de ventas ni metricas**                        No saben cuanto venden por dia/semana/mes, que producto es el mas rentable, ni cual deberian discontinuar                                                Reportes automaticos: ventas por periodo, ranking de productos, tendencias, cierre de caja

  **P4**    **Proceso lento de toma de pedido**                              Colas en hora punta; clientes se van; errores al escribir pedidos a mano (letra ilegible, items olvidados)                                               Interfaz tactil rapida con seleccion de items en 2-3 toques, categorias visuales y carrito digital

  **P5**    **Comunicacion verbal cajero-cocina**                            Pedidos se pierden, se confunden o se preparan incompletos; no hay registro de lo que se pidio vs. lo que se preparo                                     Pantalla de cocina en tiempo real con detalle exacto de cada pedido y sus modificadores

  **P6**    **Cierre de caja manual y tedioso**                              Descuadres frecuentes; toma 30-60 minutos contar y verificar; sin desglose por metodo de pago                                                            Cierre de caja digital: resumen automatico, desglose efectivo vs. Yape/Plin, diferencia calculada

  **P7**    **Mesas sin numerar en el salon**                                Confusion al entregar pedidos; se llevan al cliente equivocado; no saben que mesas estan ocupadas                                                        Propuesta de numerar mesas + mapa visual de mesas en el sistema con estado

  **P8**    **Combos/promociones dificiles de gestionar manualmente**        Errores en precios promocionales; cajero tiene que memorizar combos vigentes; no hay control de vigencia                                                 Motor de promociones configurable: combos, descuentos, vigencia por fecha

  **P9**    **Sin trazabilidad ni registro historico**                       No hay forma de auditar ventas pasadas; problemas con SUNAT; no pueden detectar robos o irregularidades                                                  Log completo de transacciones con timestamps, usuario que registro, y metodo de pago

  **P10**   **Ansiedad del cliente esperando su pedido**                     El cliente no sabe en que estado esta su pedido; se acerca al mostrador a preguntar repetidamente; interrumpe al cajero; genera friccion en hora punta   Seguimiento en tiempo real del pedido desde el celular del cliente via QR/URL con estados tematicos y tiempo estimado
  --------- ---------------------------------------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------- -----------------------------------------------------------------------------------------------------------------------

# 3. FLUJOS OPERATIVOS PROPUESTOS (TO-BE)

Los siguientes flujos describen como operara la pizzeria una vez implementado el sistema POS Pizza. El principio rector es: el sistema debe ser al menos tan rapido como el talonario de papel, pero con todas las ventajas de la digitalizacion.

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **REGLA FUNDAMENTAL DE NEGOCIO**                                                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                                                                  |
| El pago es SIEMPRE por adelantado. No existe el concepto de cuenta abierta. El cliente paga en el momento de hacer su pedido en mostrador, antes de que cocina inicie la preparacion. Aplica tanto para salon como para llevar. Esto es consistente con el modelo actual del negocio y responde a la realidad operativa en Peru. |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 3.1 Flujo Principal: Pedido en Mostrador

Este es el flujo que ocurre el 100% de las veces, sea salon o para llevar:

### Fase A: Toma de Pedido y Cobro (Cajero en Mostrador)

**Paso 1:** El cliente se acerca al mostrador. El cajero inicia un nuevo pedido en el sistema.

**Paso 2:** El cajero selecciona el tipo de pedido: SALON o PARA LLEVAR.

→ **Si es SALON:** opcionalmente se asigna un numero de mesa (propuesta de mejora: mesas numeradas).

→ **Si es PARA LLEVAR:** se registra nombre del cliente para llamarlo cuando este listo.

**Paso 3:** El cajero arma el pedido usando la interfaz del POS:

-   Selecciona categoria: Pizzas, Bebidas, Complementos, Combos

-   Elige el producto del catalogo visual (grid de productos con imagen y precio)

-   Si es pizza: selecciona tamano/variante (Personal, Mediana, Familiar, etc.)

-   Agrega modificadores si aplica (toppings extra, mitad y mitad, sin X ingrediente)

-   Si es combo: selecciona el combo y elige las opciones dentro de cada componente

-   Ajusta cantidad si pide mas de uno del mismo item

-   Repite para cada item del pedido

**Paso 4:** El sistema calcula automaticamente en tiempo real: subtotal de cada item, subtotal general, impuesto (configurable: 10.5% o 18% segun regimen), y total a pagar.

**Paso 5:** El cajero confirma el pedido con el cliente (resumen en pantalla) y procede al cobro.

**Paso 6:** El cajero selecciona metodo de pago:

-   **EFECTIVO:** Ingresa el monto recibido del cliente. El sistema calcula y muestra el vuelto a entregar.

-   **YAPE/PLIN:** El cajero confirma que recibio la transferencia. Se marca como pagado directamente.

**Paso 7:** El cajero confirma el pago. En ese momento ocurren simultaneamente:

-   Se genera el numero de ticket correlativo (autoincremental diario, reinicia cada dia)

-   Se genera un codigo unico de seguimiento y un QR asociado a la URL de tracking del pedido

-   Se imprime el ticket de venta para el cliente (con numero, detalle, total, impuesto, QR de seguimiento y URL corta)

-   Se envia automaticamente la comanda a la pantalla de cocina

-   Se descuenta el inventario de insumos segun las recetas de los productos vendidos

-   Se registra la venta en el sistema para reportes

**Paso 8:** El cliente recibe su ticket. En el ticket aparece un codigo QR y una URL corta (ej: pospizza.app/pedido/ABC123) con un mensaje tipo: \'Mira como va tu pedido en:\'. El cliente puede escanear el QR o ingresar la URL en su celular para ver el estado en tiempo real.

**Paso 9:** El cliente se sienta a esperar (salon) o espera en zona de entrega (para llevar), monitoreando el progreso desde su celular.

### Fase B: Preparacion y Entrega (Cocina)

**Paso 1:** La pantalla de cocina muestra el nuevo pedido con todos sus detalles: numero de ticket, tipo (salon/llevar), items con modificadores, y hora del pedido.

**Paso 2:** Cocina presiona \'Iniciar Preparacion\'. El estado cambia a \'Preparando tu Masa\'. El cliente ve el cambio en tiempo real en su celular.

**Paso 3:** Cuando la pizza entra al horno, cocina presiona el siguiente estado: \'En el Horno\'. El cliente ve la actualizacion con una animacion tematica.

**Paso 4:** Cuando el pedido esta completo, cocina presiona \'Listo\'. El estado cambia a \'Listo para Recoger\' (para llevar) o \'Listo para Servir\' (salon). El cliente recibe una notificacion visual prominente.

**Paso 5:** Se llama al cliente por numero de ticket. Si es salon con mesa numerada, se puede llevar directamente a la mesa.

**Paso 6:** El pedido se marca como \'Entregado\'. Flujo completado.

### Fase C: Seguimiento del Pedido (Cliente - Order Tracking)

Este flujo ocurre en paralelo a la Fase B, desde la perspectiva del cliente en su celular:

**Paso 1:** El cliente escanea el QR de su ticket o ingresa la URL corta en el navegador de su celular. No requiere descargar ninguna app ni crear cuenta.

**Paso 2:** Se carga una pagina web responsive optimizada para movil con diseno tematico de pizzeria. La pagina muestra:

-   Numero de ticket y tipo de pedido (salon/llevar)

-   Barra de progreso visual con 4 estados representados por iconos tematicos

-   Estado actual resaltado con animacion sutil (ej: fuego parpadeando en \'En el Horno\')

-   Tiempo estimado aproximado: \'Tu pedido estara listo en aproximadamente X minutos\'

-   Detalle del pedido (items ordenados, sin precios por privacidad)

**Paso 3:** Cada vez que cocina cambia el estado del pedido, la pagina del cliente se actualiza automaticamente en tiempo real via WebSocket, sin necesidad de refrescar.

**Paso 4:** Los estados tematicos que ve el cliente son:

-   **Estado 1 - Pedido Recibido:** Icono de ticket/recibo. \'Recibimos tu pedido, en un momento comenzamos a prepararlo.\'

-   **Estado 2 - Preparando tu Masa:** Icono de manos amasando con animacion. \'Estamos preparando tu pizza con todo el amor.\'

-   **Estado 3 - En el Horno:** Icono de horno con fuego animado. \'Tu pizza esta en el horno, ya falta poco!\'

-   **Estado 4 - Listo!:** Icono de pizza completa con check y animacion de celebracion. \'Tu pedido esta listo! Acercate a recogerlo.\' (para llevar) o \'Tu pedido esta listo! Ya te lo llevamos a tu mesa.\' (salon)

**Paso 5:** El timer aproximado se calcula en base a tiempos promedio configurados por el administrador por tipo de producto. Se muestra como \'aproximadamente X minutos\' sin comprometerse a un tiempo exacto. Se actualiza conforme avanzan los estados.

**Paso 6:** La URL del pedido expira automaticamente despues de un tiempo configurable (ej: 2 horas post-entrega) por seguridad y limpieza.

## 3.2 Flujo Secundario: Apertura y Cierre de Caja

### Apertura de Caja (Inicio de Turno)

**Paso 1:** El cajero inicia sesion en el sistema con su usuario y contrasena.

**Paso 2:** El sistema solicita el monto inicial en caja (fondo de cambio en efectivo).

**Paso 3:** El cajero ingresa el monto y confirma. Se abre la sesion de caja con timestamp.

**Paso 4:** A partir de este momento, todas las ventas se asocian a esta sesion de caja.

### Cierre de Caja (Fin de Turno)

**Paso 1:** El cajero inicia el proceso de cierre desde el menu del sistema.

**Paso 2:** El sistema genera automaticamente el resumen del turno:

-   Total de ventas del turno

-   Cantidad de tickets emitidos

-   Desglose por metodo de pago: total en efectivo vs. total en Yape/Plin

-   Monto inicial en caja + ventas en efectivo = monto esperado en caja

-   Pedidos cancelados (si los hubo) con motivo

**Paso 3:** El cajero cuenta fisicamente el efectivo en caja e ingresa el monto real.

**Paso 4:** El sistema calcula la diferencia: sobrante (+) o faltante (-). Se registra.

**Paso 5:** Se genera el reporte de cierre de caja. Sesion cerrada.

## 3.3 Flujo Auxiliar: Gestion de Inventario

### Descuento Automatico (ocurre con cada venta)

Cada producto del menu tiene asociada una receta que indica que insumos usa y en que cantidad. Cuando se confirma un pedido y se paga, el sistema automaticamente descuenta del inventario los insumos correspondientes segun la receta de cada item vendido.

**Ejemplo:** Se vende 1 Pizza Familiar de Pepperoni. La receta indica: 400g de masa, 200g de queso mozzarella, 100g de pepperoni, 80ml de salsa de tomate. El sistema descuenta automaticamente esas cantidades del stock.

### Reposicion Manual (cuando llega mercaderia)

**Paso 1:** El administrador ingresa al modulo de inventario.

**Paso 2:** Selecciona el insumo a reponer y registra la cantidad ingresada, proveedor (opcional) y costo.

**Paso 3:** El sistema actualiza el stock actual sumando la cantidad ingresada.

**Paso 4:** Se genera un registro en el historial de movimientos.

### Alertas de Stock Bajo

Cada insumo tiene un stock minimo definido. Cuando el stock actual cae por debajo de ese minimo, el sistema muestra una alerta visual (icono/color) en el panel de administracion y opcionalmente en la pantalla del cajero. Esto permite actuar antes de quedarse sin insumos.

# 4. REQUERIMIENTOS FUNCIONALES

Los requerimientos se organizan por modulo del sistema. Cada uno tiene un identificador unico para trazabilidad.

## 4.1 Modulo POS (Punto de Venta)

Modulo principal del sistema. Interfaz optimizada para uso rapido en mostrador, con pantalla tactil o mouse.

  ----------- --------------------------------------------------------------------------------------------------- --------------- -----------------
  **ID**      **REQUERIMIENTO**                                                                                   **PRIORIDAD**   **RESUELVE**

  **RF-01**   El cajero debe poder iniciar un nuevo pedido seleccionando tipo: SALON o PARA LLEVAR                Critica         P4

  **RF-02**   Si es SALON, permitir asignar opcionalmente un numero de mesa                                       Alta            P7

  **RF-03**   Si es PARA LLEVAR, permitir registrar nombre del cliente                                            Alta            P7

  **RF-04**   Mostrar categorias del menu como botones/cards grandes para seleccion rapida                        Critica         P4

  **RF-05**   Mostrar productos por categoria con imagen, nombre y precio base                                    Critica         P4

  **RF-06**   Permitir seleccionar variante de producto (tamano de pizza) con precio diferenciado                 Critica         P4

  **RF-07**   Permitir agregar modificadores a un item (toppings extra, sin X ingrediente) con precio adicional   Critica         P4

  **RF-08**   Permitir seleccionar combos/promociones con sus componentes configurables                           Alta            P8

  **RF-09**   Mostrar carrito lateral con resumen del pedido: items, cantidades, precios unitarios y subtotales   Critica         P4, P1

  **RF-10**   Permitir editar cantidad o eliminar items del carrito antes de confirmar                            Critica         P4

  **RF-11**   Calcular automaticamente: subtotal, impuesto configurable y total en tiempo real                    Critica         P1

  **RF-12**   Permitir agregar notas/observaciones generales al pedido o por item                                 Media           P5

  **RF-13**   Seleccionar metodo de pago: EFECTIVO o YAPE/PLIN                                                    Critica         P1

  **RF-14**   Si pago en efectivo: ingresar monto recibido y calcular vuelto automaticamente                      Critica         P1

  **RF-15**   Generar numero de ticket correlativo automatico (reinicio diario)                                   Critica         P9

  **RF-16**   Al confirmar pago: enviar comanda a cocina, descontar inventario, registrar venta                   Critica         P1, P2, P5, P9

  **RF-17**   Imprimir ticket de venta para el cliente                                                            Alta            P4

  **RF-18**   Imprimir comanda para cocina (si se prefiere impresion fisica ademas de pantalla)                   Media           P5

  **RF-19**   Mostrar estado de pedidos activos en la pantalla del cajero                                         Alta            P5
  ----------- --------------------------------------------------------------------------------------------------- --------------- -----------------

## 4.2 Modulo Cocina (Kitchen Display System)

Pantalla dedicada para el area de cocina. Muestra pedidos pendientes en tiempo real sin necesidad de refrescar.

  ----------- ----------------------------------------------------------------------------------------------------------------------- --------------- -----------------
  **ID**      **REQUERIMIENTO**                                                                                                       **PRIORIDAD**   **RESUELVE**

  **RF-20**   Mostrar pedidos pendientes como tarjetas con: ticket #, tipo, items, modificadores, hora                                Critica         P5

  **RF-21**   Ordenar pedidos por antiguedad (el mas viejo primero, FIFO)                                                             Critica         P5

  **RF-22**   Mostrar indicador visual de tiempo transcurrido por pedido (verde/amarillo/rojo)                                        Alta            P5

  **RF-23**   Boton de transicion de estado secuencial: un solo boton que avanza al siguiente estado (Preparando \> Horno \> Listo)   Critica         P5, P10

  **RF-24**   Actualizar la pantalla en tiempo real sin recargar pagina (WebSocket)                                                   Critica         P5, P10

  **RF-25**   Mostrar solo informacion relevante para cocina (no montos ni metodo de pago)                                            Media           P5

  **RF-26**   Distinguir visualmente entre pedidos SALON y PARA LLEVAR                                                                Alta            P5
  ----------- ----------------------------------------------------------------------------------------------------------------------- --------------- -----------------

## 4.3 Modulo de Seguimiento de Pedido (Order Tracking - Cliente)

Pagina web publica accesible via QR o URL corta. Permite al cliente seguir el estado de su pedido en tiempo real desde su celular. No requiere login ni descarga de app.

  ----------- --------------------------------------------------------------------------------------------------------------------- --------------- -----------------
  **ID**      **REQUERIMIENTO**                                                                                                     **PRIORIDAD**   **RESUELVE**

  **RF-27**   Generar codigo unico de seguimiento por cada pedido confirmado (alfanumerico corto, ej: ABC123)                       Critica         P10

  **RF-28**   Generar codigo QR que apunte a la URL de tracking del pedido e incluirlo en el ticket impreso                         Critica         P10

  **RF-29**   Imprimir en el ticket un mensaje invitando al cliente a seguir su pedido: URL corta + QR                              Alta            P10

  **RF-30**   Pagina de tracking publica responsive (mobile-first) con diseno tematico de pizzeria                                  Critica         P10

  **RF-31**   Mostrar barra de progreso visual con 4 estados tematicos: Pedido Recibido, Preparando tu Masa, En el Horno, Listo     Critica         P10

  **RF-32**   Animaciones sutiles por estado: fuego parpadeando en Horno, manos amasando en Preparando, celebracion en Listo        Alta            P10

  **RF-33**   Mostrar tiempo estimado aproximado: \'Tu pedido estara listo en aproximadamente X minutos\' (sin compromiso exacto)   Alta            P10

  **RF-34**   Tiempo estimado configurable por el administrador (por tipo de producto o tiempo promedio general)                    Alta            P10

  **RF-35**   Actualizacion en tiempo real via WebSocket: cuando cocina cambia el estado, el cliente ve el cambio sin refrescar     Critica         P10

  **RF-36**   Mostrar detalle del pedido (items sin precios) y numero de ticket                                                     Media           P10

  **RF-37**   Distinguir mensaje final segun tipo: \'Acercate a recogerlo\' (llevar) vs \'Ya te lo llevamos a tu mesa\' (salon)     Alta            P10

  **RF-38**   Expirar automaticamente la URL de tracking despues de un tiempo configurable post-entrega (ej: 2 horas)               Media           P10

  **RF-39**   La pagina de tracking no requiere autenticacion ni descarga de app. Acceso directo desde navegador                    Critica         P10
  ----------- --------------------------------------------------------------------------------------------------------------------- --------------- -----------------

## 4.4 Modulo de Inventario

Control basico de insumos que se descuenta automaticamente con cada venta. Solo accesible para rol ADMIN.

  ----------- ----------------------------------------------------------------------------------------- --------------- -----------------
  **ID**      **REQUERIMIENTO**                                                                         **PRIORIDAD**   **RESUELVE**

  **RF-40**   CRUD de insumos: nombre, unidad de medida, stock actual, stock minimo, costo unitario     Critica         P2

  **RF-41**   Vincular insumos a productos mediante recetas (que insumos usa y en que cantidad)         Critica         P2

  **RF-42**   Soportar recetas por variante de producto (pizza familiar usa mas insumos que personal)   Alta            P2

  **RF-43**   Descontar automaticamente el stock de insumos al confirmar cada venta                     Critica         P2

  **RF-44**   Mostrar alerta visual cuando un insumo esta por debajo de su stock minimo                 Alta            P2

  **RF-45**   Registrar entradas de inventario (reposicion/compras) con cantidad, proveedor y costo     Alta            P2

  **RF-46**   Mantener historial de movimientos de inventario (entradas y salidas automaticas)          Media           P2, P9
  ----------- ----------------------------------------------------------------------------------------- --------------- -----------------

## 4.5 Modulo de Reportes

Generacion automatica de reportes de negocio. ADMIN ve todo; CAJERO ve solo reportes basicos de su turno.

  ----------- -------------------------------------------------------------------------------------------------------------- --------------- -----------------
  **ID**      **REQUERIMIENTO**                                                                                              **PRIORIDAD**   **RESUELVE**

  **RF-47**   Reporte de ventas del dia: total vendido, cantidad tickets, promedio por ticket, desglose por metodo de pago   Critica         P3

  **RF-48**   Reporte de ventas por rango de fechas configurable con grafico de tendencia                                    Alta            P3

  **RF-49**   Ranking de productos mas vendidos por cantidad y por monto, con filtro por periodo                             Alta            P3

  **RF-50**   Reporte de cierre de caja: resumen del turno, monto esperado vs. real, diferencia                              Critica         P6

  **RF-51**   Reporte de inventario bajo: insumos por debajo del stock minimo con nivel de urgencia                          Alta            P2

  **RF-52**   Reporte de cancelaciones: pedidos cancelados con motivo y usuario que cancelo                                  Media           P9

  **RF-53**   Reporte de ventas por categoria y por producto individual                                                      Media           P3

  **RF-54**   Reporte de tiempos promedio de preparacion por tipo de producto (alimenta la config del timer de tracking)     Media           P10
  ----------- -------------------------------------------------------------------------------------------------------------- --------------- -----------------

## 4.6 Modulo de Administracion

Configuracion general del sistema. Solo accesible para rol ADMIN.

  ----------- ----------------------------------------------------------------------------------------------------- --------------- -----------------
  **ID**      **REQUERIMIENTO**                                                                                     **PRIORIDAD**   **RESUELVE**

  **RF-55**   CRUD de categorias del menu con nombre, icono y orden de visualizacion                                Critica         \-

  **RF-56**   CRUD de productos con nombre, descripcion, precio base, imagen y categoria                            Critica         \-

  **RF-57**   CRUD de variantes por producto (tamanos de pizza con precio diferenciado)                             Critica         \-

  **RF-58**   CRUD de modificadores (toppings, extras) con nombre, precio y agrupacion                              Critica         \-

  **RF-59**   CRUD de combos/promociones: productos incluidos, precio del combo, vigencia                           Alta            P8

  **RF-60**   Gestion de mesas: numero, capacidad, estado, zona del salon                                           Alta            P7

  **RF-61**   Gestion de usuarios: crear, editar, desactivar. Asignar roles (ADMIN, CAJERO, COCINA)                 Critica         \-

  **RF-62**   Configuracion general: nombre del negocio, RUC, tasa de impuesto (configurable), datos del ticket     Critica         P1

  **RF-63**   Configuracion de tiempos estimados de preparacion por tipo de producto (para el timer del tracking)   Alta            P10

  **RF-64**   Configuracion de estados tematicos del tracking: textos, iconos y mensajes personalizables            Media           P10

  **RF-65**   Apertura y cierre de caja (sesiones) con monto inicial y monto real al cierre                         Critica         P6
  ----------- ----------------------------------------------------------------------------------------------------- --------------- -----------------

# 5. REQUERIMIENTOS NO FUNCIONALES

  ------------ -------------------------------------------------------------------------------------------------------------- --------------------------------------------------
  **ID**       **REQUERIMIENTO**                                                                                              **CRITERIO DE ACEPTACION**

  **RNF-01**   Rendimiento: la interfaz POS debe responder en menos de 500ms a cualquier interaccion                          *Medido con Lighthouse y testing en tablet real*

  **RNF-02**   Usabilidad: un cajero nuevo debe poder tomar un pedido completo en menos de 5 minutos de capacitacion          *Test con usuario real sin experiencia previa*

  **RNF-03**   Disponibilidad: el sistema debe estar disponible el 99.5% del tiempo durante horario de atencion               *Monitoreo de uptime con alertas*

  **RNF-04**   Resiliencia: el sistema debe poder operar con conectividad intermitente (modo offline basico)                  *Service Worker + cola de sincronizacion*

  **RNF-05**   Seguridad: autenticacion obligatoria para todos los usuarios; contrasenas hasheadas; sesiones con expiracion   *Pentest basico + revision de auth*

  **RNF-06**   Compatibilidad: funcionar en Chrome y Safari en tablets Android/iPad y PCs con Windows                         *Testing en dispositivos reales*

  **RNF-07**   Escalabilidad: la arquitectura debe soportar evolucion a multi-local sin reescribir el core                    *Revision de arquitectura*

  **RNF-08**   Impresion: soporte para impresoras termicas ESC/POS via USB o red local                                        *Testing con impresora fisica*

  **RNF-09**   Tiempo real: los cambios de estado de pedidos deben reflejarse en menos de 2 segundos entre pantallas          *Medido con WebSocket latency*

  **RNF-10**   Auditabilidad: todas las transacciones deben tener timestamp, usuario y ser inmutables                         *Revision de logs en DB*
  ------------ -------------------------------------------------------------------------------------------------------------- --------------------------------------------------

# 6. REGLAS DE NEGOCIO

Las siguientes reglas son restricciones del dominio que el sistema debe respetar en todo momento. No son configurables ni opcionales.

  ----------- ----------------------------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------
  **ID**      **REGLA**                                             **DETALLE**

  **RN-01**   **Pago siempre por adelantado**                       No se puede enviar un pedido a cocina sin que este pagado. No existen cuentas abiertas ni tabs.

  **RN-02**   **Ticket correlativo diario**                         El numero de ticket se reinicia cada dia a 001. Es autoincremental y no editable. Formato sugerido: YYYYMMDD-NNN.

  **RN-03**   **Impuesto configurable**                             La tasa de impuesto se configura en el sistema (10.5% para MYPE restaurantes 2026, o 18% estandar). Puede cambiar segun regulacion vigente.

  **RN-04**   **Precio al momento de la venta**                     El precio registrado en un pedido es el vigente al momento de la venta. Si despues cambia el precio del producto, las ventas anteriores no se afectan.

  **RN-05**   **Sesion de caja obligatoria**                        No se pueden registrar ventas sin una sesion de caja abierta. El cajero debe abrir caja antes de su primer pedido.

  **RN-06**   **Un cajero, una sesion de caja**                     Solo puede haber una sesion de caja abierta por usuario a la vez. Debe cerrarse antes de abrir otra.

  **RN-07**   **Cancelaciones requieren motivo**                    Un pedido pagado solo puede cancelarse registrando un motivo obligatorio. Genera devolucion y reposicion de inventario.

  **RN-08**   **Descuento de inventario irreversible automatico**   El inventario se descuenta al confirmar pago. Solo se repone si se cancela el pedido (devolucion automatica) o por entrada manual.

  **RN-09**   **Pedido inmutable post-pago**                        Una vez pagado, no se pueden agregar ni modificar items del pedido. Si el cliente quiere algo mas, es un pedido nuevo.

  **RN-10**   **Todo pedido tiene tipo**                            Cada pedido debe ser SALON o PARA_LLEVAR. No existe un pedido sin tipo.

  **RN-11**   **Combo = precio fijo**                               Un combo tiene un precio fijo predefinido, independiente de la suma de sus componentes individuales.

  **RN-12**   **Metodos de pago mutuamente excluyentes**            Cada pedido se paga con UN solo metodo: efectivo O Yape/Plin. No se admite pago mixto en el MVP.
  ----------- ----------------------------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------

# 7. ROLES Y PERMISOS

El sistema maneja tres roles con permisos diferenciados. Un usuario puede tener un solo rol.

## 7.1 Descripcion de Roles

  ------------- ------------------------------------------------------------------------------------------------ --------------------------------------------
  **ROL**       **DESCRIPCION**                                                                                  **QUIEN LO USA**

  **ADMIN**     Acceso total al sistema. Puede configurar menu, usuarios, inventario y ver todos los reportes.   *Dueno de la pizzeria o encargado general*

  **CAJERO**    Opera el POS: toma pedidos, cobra, abre/cierra caja. Ve reportes basicos de su turno.            *Personal de caja/mostrador*

  **COCINA**    Solo accede a la pantalla de cocina. Ve pedidos pendientes y marca como listos.                  *Personal de cocina/preparacion*
  ------------- ------------------------------------------------------------------------------------------------ --------------------------------------------

## 7.2 Matriz de Permisos

  ------------------------------------- --------------- --------------- ---------------
  **ACCION**                            **ADMIN**       **CAJERO**      **COCINA**

  **Tomar pedidos en POS**              Si              Si              No

  **Cobrar pedidos**                    Si              Si              No

  **Abrir/cerrar sesion de caja**       Si              Si              No

  **Ver pantalla de cocina**            Si              No              Si

  **Marcar pedido como listo**          Si              No              Si

  **Cancelar pedidos**                  Si              Con motivo      No

  **Ver reportes completos**            Si              No              No

  **Ver reporte de su turno**           Si              Si              No

  **Gestionar menu (CRUD productos)**   Si              No              No

  **Gestionar usuarios**                Si              No              No

  **Gestionar inventario**              Si              No              No

  **Configuracion general**             Si              No              No

  **Gestionar mesas**                   Si              No              No

  **Gestionar promociones/combos**      Si              No              No
  ------------------------------------- --------------- --------------- ---------------

# 8. PROPUESTAS DE MEJORA OPERATIVA

Ademas de digitalizar la operacion actual, el sistema propone las siguientes mejoras que agregan valor inmediato al negocio:

## 8.1 Numeracion de Mesas

**Situacion actual:** Las mesas del salon no estan numeradas. Cuando un pedido esta listo, no hay forma eficiente de saber donde esta sentado el cliente.

**Propuesta:** Numerar fisicamente las mesas del salon (con stickers, portanumeros o grabado) e integrar un mapa visual de mesas en el sistema POS. Al tomar un pedido de salon, el cajero selecciona la mesa. Esto permite saber que mesas estan ocupadas, llevar pedidos directamente a la mesa correcta, y tener metricas de rotacion.

**Costo de implementacion:** Minimo (portanumeros o stickers). Impacto alto en eficiencia operativa.

## 8.2 Motor de Promociones

**Situacion actual:** Los combos y promociones se manejan de memoria. El cajero tiene que recordar que combos estan vigentes y calcular manualmente.

**Propuesta:** Modulo de promociones configurable por el administrador, donde se pueden crear combos (pizza + bebida a precio fijo), descuentos por tiempo limitado, y promociones con fecha de inicio y fin. El sistema las muestra automaticamente en el POS solo cuando estan vigentes.

## 8.3 Seguimiento de Pedido para el Cliente (Order Tracking)

**Situacion actual:** El cliente no tiene visibilidad de su pedido despues de pagar. No sabe si ya lo estan preparando, si esta en el horno o si ya casi sale. Esto genera ansiedad, interrupciones al cajero y friccion especialmente en hora punta.

**Propuesta (incluida en MVP):** Sistema de seguimiento en tiempo real accesible desde el celular del cliente via QR impreso en el ticket. La experiencia se inspira en apps como Rappi o PedidosYa pero adaptada al contexto presencial de una pizzeria.

### Diseno UX/UI del Order Tracking

La pagina de seguimiento debe cumplir los siguientes principios de diseno:

-   **Mobile-first:** Disenada para verse perfecta en celulares. El 95% de los clientes accederan desde su smartphone.

-   **Zero friction:** Sin login, sin descarga, sin registro. Escanea y ve. Maximo 1 segundo de carga.

-   **Tematica de pizzeria:** Colores calidos, tipografia amigable, iconografia tematica (pizza, horno, masa). No debe parecer un dashboard corporativo.

-   **Animaciones con proposito:** Cada estado tiene una animacion sutil que transmite progreso: manos amasando, fuego del horno, confetti al estar listo. Las animaciones deben ser ligeras (CSS/SVG, no GIFs pesados).

-   **Feedback emocional:** Mensajes en tono amigable y cercano. No \'Estado: EN_PROCESO\' sino \'Estamos preparando tu pizza con todo el amor\'. El tono genera conexion emocional con la marca.

-   **Timer no comprometedor:** \'Aproximadamente X minutos\'. Nunca un countdown exacto que genere reclamos. El tiempo se basa en promedios configurados por el admin.

### Valor Agregado para el Negocio

-   Reduce interrupciones al cajero en un estimado de 60-80% (el cliente ya no pregunta \'?ya sale?\')

-   Mejora la percepcion de marca: la pizzeria se ve tecnologica, profesional y moderna

-   Genera datos utiles: tiempos reales de preparacion por producto para optimizar operaciones

-   Diferenciador competitivo: ninguna pizzeria local ofrece esto

-   Potencial futuro: la URL de tracking puede incluir branding, redes sociales, encuesta de satisfaccion post-entrega

### Pantalla TV en Salon (Futuro - Post MVP)

**Propuesta a futuro:** Complementar el tracking individual con una pantalla/TV en el salon que muestre un tablero general con todos los pedidos activos y sus estados (tipo tablero de aeropuerto). La arquitectura del MVP ya soporta esto nativamente.

# 9. CRITERIOS DE EXITO DEL MVP

El MVP se considerara exitoso si cumple los siguientes indicadores medibles tras 30 dias de uso continuo en la pizzeria piloto:

  ------------------------------------------- ------------------------------------ -----------------------------------------------------------------
  **KPI**                                     **META**                             **COMO SE MIDE**

  **Adopcion del sistema**                    **100% pedidos digitales**           Cero uso del talonario manual tras 2 semanas

  **Velocidad de pedido**                     **\< 45 segundos**                   Timestamp: creacion del pedido vs. confirmacion de pago

  **Precision en cobros**                     **0 errores de calculo**             Diferencia en cierre de caja (faltante/sobrante)

  **Tiempo de cierre de caja**                **\< 5 minutos**                     Desde inicio de cierre hasta reporte generado

  **Disponibilidad**                          **\> 99% uptime**                    Monitoreo de plataforma (Vercel + Supabase)

  **Satisfaccion del personal**               **NPS \> 7/10**                      Encuesta simple al equipo del local

  **Visibilidad de inventario**               **Stock actualizado diario**         Coincidencia entre stock digital y conteo fisico semanal

  **Pedidos perdidos/confundidos**            **Reduccion del 90%**                Registro de incidentes antes vs. despues del sistema

  **Uso del tracking por clientes**           **\> 40% de clientes escanean QR**   Contador de accesos unicos a URLs de tracking vs. total tickets

  **Reduccion de interrupciones al cajero**   **Reduccion del 60%**                Conteo de consultas \'?ya sale mi pedido?\' antes vs. despues
  ------------------------------------------- ------------------------------------ -----------------------------------------------------------------

# 10. ANALISIS DE INFRAESTRUCTURA FISICA

Ademas del software, el sistema requiere hardware minimo en el local. A continuacion se detallan los requerimientos, opciones y costos estimados.

## 10.1 Impresora Termica (Ticketera)

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **VEREDICTO: LA IMPRESORA TERMICA ES NECESARIA**                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                       |
| El ticket impreso cumple triple funcion en POS Pizza: (1) comprobante de pago legal para SUNAT, (2) vehiculo del QR de order tracking para el cliente, y (3) comanda de respaldo para cocina. Sin impresora, el flujo pierde su diferenciador principal y el cumplimiento tributario. |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

### Por que es necesaria

-   **Cumplimiento legal (SUNAT):** Todo negocio formal en Peru debe emitir comprobante de pago (boleta o factura). La impresora termica es el estandar de la industria para esto en el rubro de comida.

-   **QR del Order Tracking:** El ticket impreso es el vehiculo fisico para que el cliente acceda al seguimiento de su pedido. Sin ticket con QR, el tracking pierde su canal principal de activacion.

-   **Comanda para cocina (respaldo):** Aunque la pantalla digital de cocina es el canal principal, la comanda impresa actua como respaldo critico en caso de caida de internet o si cocina prefiere el papel colgado como referencia rapida.

-   **Velocidad operativa:** Las impresoras termicas imprimen un ticket completo en 2-3 segundos. No hay tinta, no hay atascos. Es la tecnologia mas confiable para alto volumen en punto de venta.

### Escenarios de Implementacion

Se plantean dos escenarios segun presupuesto del cliente:

  ---------------------------------- ------------------------------------------------------------------- -----------------------------------------------------------------
                                     **ESCENARIO BASICO (1 impresora)**                                  **ESCENARIO IDEAL (2 impresoras)**

  **Impresora en caja**              Si - ticket del cliente con QR + comanda cocina                     Si - solo ticket del cliente con QR

  **Impresora en cocina**            No - cocina usa solo pantalla digital                               Si - comanda impresa como respaldo

  **Como recibe cocina el pedido**   Pantalla digital unicamente (WebSocket)                             Pantalla digital + comanda impresa

  **Respaldo si cae internet**       Sin respaldo para cocina (debe verse el pedido antes de la caida)   Comanda impresa (la impresora es local, no depende de internet)

  **Inversion estimada**             S/. 210 - 260 (una sola vez)                                        S/. 420 - 520 (una sola vez)

  **Costo recurrente (papel)**       \~S/. 15 - 25/mes (rollos termicos 80mm)                            \~S/. 30 - 50/mes (rollos termicos 80mm)

  **Recomendacion**                  Funcional para arrancar el MVP                                      Ideal para operacion robusta y resiliente
  ---------------------------------- ------------------------------------------------------------------- -----------------------------------------------------------------

### Especificaciones Tecnicas de la Impresora

Para compatibilidad con el sistema POS Pizza, la impresora debe cumplir:

-   **Protocolo:** ESC/POS (estandar de la industria, compatible con la mayoria de marcas)

-   **Ancho de papel:** 80mm (permite imprimir QR legible y detalle completo del pedido)

-   **Conectividad:** USB (minimo) o USB + Ethernet (ideal para impresora de cocina en red local)

-   **Cortador automatico:** Recomendado para agilizar la operacion en hora punta

-   **Resolucion:** 203 DPI minimo (necesario para que el QR del tracking sea legible)

-   **Velocidad:** 200mm/s o superior

**Conexion con la web app:** Se usara la API WebUSB del navegador, que permite enviar comandos ESC/POS directamente desde la pagina web a la impresora USB sin instalar drivers ni software adicional. Esto es compatible con Chrome en Windows, Linux y Android. Detalle tecnico completo en el documento de Arquitectura.

## 10.2 Dispositivo del Cajero

El sistema POS Pizza corre en un navegador web, por lo que el dispositivo del cajero puede ser:

-   **Tablet Android (10 pulgadas o mas):** Opcion economica. Pantalla tactil nativa. Desde S/. 400-800.

-   **PC/Laptop con monitor:** Si el negocio ya tiene uno, costo cero. Se puede complementar con monitor tactil.

-   **Mini PC (tipo stick o NUC):** Compacto, bajo consumo. Desde S/. 300-500 + monitor.

**Requerimiento minimo:** Navegador Chrome actualizado + conexion a internet + puerto USB para impresora.

## 10.3 Dispositivo de Cocina

Para la pantalla de cocina (Kitchen Display):

-   **Tablet Android montada en pared:** Opcion mas practica. Pantalla tactil para marcar estados. Desde S/. 400.

-   **TV/Monitor con mini PC:** Pantalla mas grande, visible para todo el equipo. Sin touch (se opera con mouse o teclado).

**Recomendacion:** Tablet Android de 10 pulgadas montada en pared a la altura de los ojos. Es tactil (el cocinero toca \'Siguiente estado\' con un dedo), resistente y economica. Se puede proteger con funda contra salpicaduras.

## 10.4 Conectividad e Internet

El internet es critico para el funcionamiento completo del sistema (tiempo real, tracking, reportes en la nube). Sin embargo, la realidad en Peru es que la conectividad no es 100% confiable.

### Estrategia de Resiliencia: Modo Offline

El sistema implementara un modo offline que permite continuar operando las funciones criticas sin internet:

  ----------------------------------- ----------------------- -----------------------------------------------------------------------
  **FUNCION**                         **CON INTERNET**        **SIN INTERNET (OFFLINE)**

  **Tomar pedidos**                   Funciona normal         Funciona - menu cacheado localmente, calculos locales

  **Cobrar (efectivo)**               Funciona normal         Funciona - calculo de vuelto es local

  **Cobrar (Yape/Plin)**              Funciona normal         Funciona - cajero confirma manualmente que recibio pago

  **Generar ticket correlativo**      Funciona normal         Funciona - numero generado localmente, se sincroniza despues

  **Imprimir ticket en caja**         Funciona normal         Funciona - impresora es USB local, no depende de internet

  **Pantalla cocina (tiempo real)**   Funciona normal         NO funciona - cocina depende de comanda impresa o comunicacion verbal

  **Order tracking (cliente QR)**     Funciona normal         NO funciona - la pagina no carga sin conexion al servidor

  **Reportes y dashboard**            Funciona normal         NO funciona - se generan al reconectar

  **Descuento de inventario**         Funciona normal         Funciona parcial - se registra localmente y sincroniza

  **Cierre de caja**                  Funciona normal         Funciona parcial - datos locales, sincroniza al reconectar
  ----------------------------------- ----------------------- -----------------------------------------------------------------------

### Proceso de Reconexion

Cuando el internet vuelve, el sistema ejecuta automaticamente:

-   Sincroniza todos los pedidos almacenados localmente (IndexedDB) con la base de datos en la nube

-   Restaura la pantalla de cocina en tiempo real con los pedidos pendientes

-   Reactiva el order tracking para pedidos activos (los QR vuelven a funcionar)

-   Actualiza reportes y dashboard con los datos sincronizados

-   Muestra una notificacion al cajero confirmando que la sincronizacion fue exitosa

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **IMPORTANCIA DE LA IMPRESORA EN COCINA COMO RESPALDO**                                                                                                                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                                                                                                                |
| Aqui se evidencia el valor de tener una segunda impresora en cocina: si cae el internet, la pantalla digital de cocina pierde conexion. Pero la comanda impresa sigue funcionando porque la impresora esta conectada localmente al PC/tablet del cajero. La comanda impresa es el plan B que garantiza que cocina nunca se quede sin saber que preparar, incluso sin internet. |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

### Recomendaciones de Conectividad

-   **Internet principal:** Plan de fibra optica o cable de al menos 10 Mbps (suficiente para el sistema). Costo: S/. 60-100/mes.

-   **Respaldo:** Hotspot del celular del cajero o del dueno como plan B temporal. La mayoria de planes moviles en Peru incluyen datos suficientes.

-   **Red local:** Router WiFi para conectar tablet de cocina + cable Ethernet para PC de caja (mas estable).

## 10.5 Resumen de Inversion en Hardware

  -------------------------------------------- ---------------------------- ----------------------------
  **COMPONENTE**                               **ESCENARIO MINIMO**         **ESCENARIO IDEAL**

  **Impresora termica caja (obligatoria)**     S/. 210 - 260                S/. 210 - 260

  **Impresora termica cocina (recomendada)**   No incluida                  S/. 210 - 260

  **Dispositivo cajero (PC/tablet)**           Ya existente o S/. 400-800   Ya existente o S/. 400-800

  **Dispositivo cocina (tablet)**              Ya existente o S/. 400       S/. 400 - 600

  **Router WiFi**                              Ya existente                 Ya existente

  **Rollos termicos (mensual)**                \~S/. 15 - 25/mes            \~S/. 30 - 50/mes

  **Internet (mensual)**                       \~S/. 60 - 100/mes           \~S/. 60 - 100/mes

  **TOTAL INVERSION INICIAL (unica vez)**      **\~S/. 210 - 1,060**        **\~S/. 820 - 1,920**

  **TOTAL COSTO MENSUAL RECURRENTE**           **\~S/. 75 - 125/mes**       **\~S/. 90 - 150/mes**
  -------------------------------------------- ---------------------------- ----------------------------

***Nota:** Los rangos de inversion asumen que el negocio puede ya contar con algunos de estos equipos (PC, router, internet). En el escenario minimo, si el negocio ya tiene PC e internet, la unica inversion nueva es la impresora termica (\~S/. 210-260). Los costos de infraestructura de software (hosting) se detallan en el documento de Arquitectura Tecnica.*

# 11. RIESGOS DE NEGOCIO

Riesgos identificados desde la perspectiva del negocio. Los riesgos tecnicos detallados se abordaran en el documento de Arquitectura Tecnica:

  ---------------------------------------------------- ----------- ------------- ----------------------------------------------------------------------------------------------------------------------------------------------------
  **RIESGO**                                           **PROB.**   **IMPACTO**   **MITIGACION**

  **Resistencia al cambio del personal**               Alta        Alto          UX extremadamente simple (mas facil que el talonario). Capacitacion presencial. Periodo de transicion con sistema dual (1-2 semanas).

  **Caida de internet en horario punta**               Media       Critico       Modo offline con Service Worker + IndexedDB (ver seccion 10.4). Funciones criticas operan sin internet. Comanda impresa como respaldo para cocina.

  **Cajero no tecnologico**                            Alta        Alto          Interfaz con botones grandes, flujo lineal, minimas pantallas. Sin jerga tecnica. Colores e iconos como guia.

  **Cambio en regulacion tributaria (tasa IGV)**       Media       Medio         Tasa de impuesto configurable desde el panel de admin. Actualizable sin cambio de codigo.

  **Combinaciones de menu no contempladas**            Media       Bajo          Sistema de modificadores flexible. Feedback semanal del cajero para ajustes rapidos.

  **Impresora termica falla o no disponible**          Baja        Alto          Fallback: impresion desde navegador (Ctrl+P). Inversion en impresora de calidad con garantia. Stock de rollo de papel de respaldo.

  **Cliente piloto abandona el proyecto**              Baja        Alto          Documentar todo. El sistema es generico para cualquier pizzeria. Buscar segundo piloto rapido.

  **Presupuesto limitado del cliente para hardware**   Media       Medio         Escenario minimo viable con solo 1 impresora (\~S/. 210). Usar equipos existentes (PC, router). Escalar gradualmente.
  ---------------------------------------------------- ----------- ------------- ----------------------------------------------------------------------------------------------------------------------------------------------------

# 12. PROXIMOS PASOS

Con este analisis de negocio validado, los siguientes pasos son:

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **SIGUIENTE DOCUMENTO: FASE 2 - ARQUITECTURA TECNICA**                                                                                                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                                                                                                                         |
| El proximo documento cubrira: seleccion y justificacion del stack tecnologico, patrones de arquitectura de software, modelado de base de datos (entidades, relaciones, diagramas ER), diseno de API, estructura del proyecto, plan de implementacion por sprints, estimacion de costos de infraestructura, y configuracion de entornos. |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**1.** Revisar y validar este documento con la pizzeria piloto. Confirmar que los flujos, reglas de negocio y requerimientos reflejan la realidad.

**2.** Obtener informacion pendiente: cantidad de mesas, carta completa con precios, lista de combos actuales, regimen tributario (para definir tasa de impuesto).

**3.** Elaborar el documento de Arquitectura Tecnica (Fase 2): stack, patrones de diseno, modelado de BD, plan de implementacion.

**4.** Disenar wireframes/mockups de las pantallas principales (POS, Cocina, Admin) para validar la UX antes de codificar.

**5.** Iniciar desarrollo del MVP segun el cronograma que se definira en la Fase 2.

*Documento preparado por Bruno Alvarez - Full Stack Developer*

*POS Pizza - Analisis de Negocio v1.2 - Marzo 2026*

*Documento Interno - Confidencial*
