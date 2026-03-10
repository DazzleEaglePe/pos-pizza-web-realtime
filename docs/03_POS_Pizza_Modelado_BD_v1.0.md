**MODELADO DE BASE DE DATOS**

──────────────────────────────────────────────────

**POS PIZZA**

PostgreSQL + Drizzle ORM \| 29 Tablas \| Preparado para Multi-Tenant

Documento Complementario a la Arquitectura Tecnica v1.0

  ------------------------ ------------------------------------------------------
  **Proyecto**             POS Pizza

  **Documento**            Modelado de Base de Datos (Documento Complementario)

  **Relacionado con**      Analisis de Negocio v1.2 + Arquitectura Tecnica v1.0

  **Autor**                Bruno Alvarez

  **Base de Datos**        PostgreSQL 15+ (Supabase)

  **ORM**                  Drizzle ORM (SQL-first, TypeScript)

  **Total de Tablas**      29

  **Version**              1.0

  **Fecha**                Marzo 2026

  **Clasificacion**        Documento Interno - Confidencial
  ------------------------ ------------------------------------------------------

**TABLA DE CONTENIDOS**

# 1. RESUMEN DEL MODELO DE DATOS

El modelo de datos de POS Pizza consta de 29 tablas organizadas en 8 dominios funcionales. Cada tabla esta disenada para soportar los 65 requerimientos funcionales y 12 reglas de negocio documentados en el Analisis de Negocio v1.2.

  ---------------------------------- --------------------------------------------------------------------------------------- -------------------------------
  **DOMINIO (# TABLAS)**             **TABLAS**                                                                              **PROPOSITO**

  **AUTENTICACION Y USUARIOS (3)**   users, sessions, audit_logs                                                             Auth, seguridad, trazabilidad

  **CATALOGO / MENU (6)**            categories, products, product_variants, modifier_groups, modifiers, product_modifiers   Carta, variantes, toppings

  **PROMOCIONES (2)**                promotions, promotion_items                                                             Combos, descuentos, vigencia

  **SALON (1)**                      tables                                                                                  Mesas del local

  **PEDIDOS (5)**                    orders, order_items, order_item_modifiers, order_status_history, order_promotions       Core transaccional

  **PAGOS Y CAJA (3)**               payment_transactions, cash_registers, ticket_sequences                                  Cobros, cierres, correlativos

  **TRACKING (1)**                   order_tracking                                                                          Seguimiento QR cliente

  **INVENTARIO (3)**                 inventory_items, product_ingredients, inventory_movements                               Insumos, recetas, stock

  **CONFIGURACION (3)**              business_config, product_prep_times, printer_configs                                    Parametros del negocio

  **REPORTES (1)**                   daily_summaries                                                                         Resumenes pre-calculados

  **NOTIFICACIONES (1)**             notifications                                                                           Alertas internas del sistema
  ---------------------------------- --------------------------------------------------------------------------------------- -------------------------------

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **ANALISIS DE GAPS REALIZADO**                                                                                                                                                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                                                                                                                                                     |
| Las 29 tablas fueron identificadas cruzando los 65 requerimientos funcionales (RF-01 a RF-65), las 12 reglas de negocio (RN-01 a RN-12), los 10 requerimientos no funcionales (RNF-01 a RNF-10), los flujos operativos (AS-IS y TO-BE), y los modulos del sistema (POS, Cocina, Tracking, Inventario, Reportes, Admin). Se identificaron 11 tablas adicionales a las 18 originales. |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# 2. DIAGRAMA ENTIDAD-RELACION

El siguiente diagrama muestra las relaciones entre las 29 tablas organizadas por dominio. Las lineas indican foreign keys y cardinalidad.

## 2.1 Relaciones Principales

=== AUTENTICACION ===

users \-\-\--1:N\-\-\--\> sessions

users \-\-\--1:N\-\-\--\> audit_logs

=== CATALOGO ===

categories \-\-\--1:N\-\-\--\> products

products \-\-\-\-\--1:N\-\-\--\> product_variants

products \-\-\-\-\--N:M\-\-\--\> modifiers (via product_modifiers)

modifier_groups \--1:N-\> modifiers

=== PROMOCIONES ===

promotions \-\-\--1:N\-\-\--\> promotion_items

promotion_items \-\-\-\-\-\--\> products (FK)

promotion_items \-\-\-\-\-\--\> product_variants (FK nullable)

=== PEDIDOS (CORE) ===

orders \-\-\-\-\-\-\--1:N\-\-\--\> order_items

orders \-\-\-\-\-\-\--1:N\-\-\--\> order_status_history

orders \-\-\-\-\-\-\--1:1\-\-\--\> order_tracking

orders \-\-\-\-\-\-\--1:1\-\-\--\> payment_transactions

orders \-\-\-\-\-\-\--0:1\-\-\--\> order_promotions

order_items \-\--1:N\-\-\--\> order_item_modifiers

=== RELACIONES CON PEDIDOS ===

users \-\-\-\-\-\-\-\--1:N\-\-\--\> orders (cajero)

tables \-\-\-\-\-\-\--1:N\-\-\--\> orders (mesa, nullable)

cash_registers 1:N\-\-\--\> orders (sesion de caja)

products \-\-\-\-\--1:N\-\-\--\> order_items (producto vendido)

product_variants 1:N\--\> order_items (variante, nullable)

modifiers \-\-\-\--1:N\-\-\--\> order_item_modifiers

=== CAJA ===

users \-\-\-\-\-\-\-\--1:N\-\-\--\> cash_registers (cajero)

ticket_sequences \-\-\-\-\--\> (tabla autonoma, control correlativos)

=== INVENTARIO ===

products \-\-\-\-\--N:M\-\-\--\> inventory_items (via product_ingredients)

product_variants 1:N\--\> product_ingredients (receta por variante)

inventory_items 1:N\-\--\> inventory_movements

=== CONFIGURACION ===

products \-\-\-\-\--1:N\-\-\--\> product_prep_times (tiempo estimado)

printer_configs \-\-\-\-\-\--\> (tabla autonoma, config impresoras)

business_config \-\-\-\-\-\--\> (tabla autonoma, 1 registro por negocio)

daily_summaries \-\-\-\-\-\--\> (tabla autonoma, resumenes diarios)

notifications \-\-\-\-\-\-\-\--\> users (destinatario, nullable)

## 2.2 Diagrama Mermaid ER (para herramientas de visualizacion)

El siguiente codigo Mermaid puede ser pegado en mermaid.live, dbdiagram.io o cualquier herramienta compatible para generar el diagrama visual:

erDiagram

users \|\|\--o{ sessions : has

users \|\|\--o{ audit_logs : generates

users \|\|\--o{ orders : creates

users \|\|\--o{ cash_registers : opens

categories \|\|\--o{ products : contains

products \|\|\--o{ product_variants : has_sizes

products \|\|\--o{ product_modifiers : allows

modifier_groups \|\|\--o{ modifiers : groups

modifiers \|\|\--o{ product_modifiers : available_for

promotions \|\|\--o{ promotion_items : includes

products \|\|\--o{ promotion_items : part_of

tables \|\|\--o{ orders : assigned_to

cash_registers \|\|\--o{ orders : registered_in

orders \|\|\--o{ order_items : contains

orders \|\|\--\|\| order_tracking : tracked_by

orders \|\|\--\|\| payment_transactions : paid_with

orders \|\|\--o{ order_status_history : status_changes

orders \|\|\--o\| order_promotions : applied_promo

order_items \|\|\--o{ order_item_modifiers : has

products \|\|\--o{ order_items : sold_as

product_variants \|\|\--o{ order_items : variant_sold

products }o\--o{ inventory_items : uses_ingredients

inventory_items \|\|\--o{ inventory_movements : tracks

products \|\|\--o{ product_prep_times : has_prep_time

# 3. DOMINIO: AUTENTICACION Y USUARIOS

## 3.1 users

*Usuarios del sistema con autenticacion y roles. Base para toda la seguridad y trazabilidad.*

  ------------------- ------------------------------------------------------------------------ -------------------------------
  **Campo**           **Tipo / Restriccion**                                                   **Descripcion**

  **id**              UUID PRIMARY KEY DEFAULT gen_random_uuid()                               Identificador unico

  **email**           VARCHAR(255) UNIQUE NOT NULL                                             Email para login

  **password_hash**   VARCHAR(255) NOT NULL                                                    Hash bcrypt (rounds=12)

  **name**            VARCHAR(100) NOT NULL                                                    Nombre completo

  **role**            VARCHAR(20) NOT NULL CHECK (role IN (\'ADMIN\',\'CAJERO\',\'COCINA\'))   Rol del usuario

  **is_active**       BOOLEAN NOT NULL DEFAULT true                                            Soft delete

  **last_login_at**   TIMESTAMP WITH TIME ZONE                                                 Ultimo inicio de sesion

  **created_at**      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()                          

  **updated_at**      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()                          

  **INDEX**           idx_users_email ON (email)                                               Busqueda rapida por email

  **INDEX**           idx_users_role ON (role)                                                 Filtrar por rol
  ------------------- ------------------------------------------------------------------------ -------------------------------

## 3.2 sessions

*Sesiones activas de usuario. Permite invalidar sesiones, manejar refresh tokens y tracking de dispositivos.*

  ------------------- ------------------------------------------------- --------------------------------
  **Campo**           **Tipo / Restriccion**                            **Descripcion**

  **id**              UUID PRIMARY KEY DEFAULT gen_random_uuid()        

  **user_id**         UUID NOT NULL REFERENCES users(id)                

  **refresh_token**   VARCHAR(500) NOT NULL                             Token de refresco hasheado

  **device_info**     VARCHAR(255)                                      Info del navegador/dispositivo

  **ip_address**      VARCHAR(45)                                       IP de la sesion

  **expires_at**      TIMESTAMP WITH TIME ZONE NOT NULL                 Expiracion del refresh token

  **is_revoked**      BOOLEAN NOT NULL DEFAULT false                    Sesion revocada manualmente

  **created_at**      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()   

  **INDEX**           idx_sessions_user ON (user_id)                    

  **INDEX**           idx_sessions_token ON (refresh_token)             Busqueda al refrescar
  ------------------- ------------------------------------------------- --------------------------------

## 3.3 audit_logs

*Registro inmutable de todas las acciones del sistema. Cumple RNF-10 (auditabilidad) y soporta deteccion de irregularidades.*

  ----------------- ------------------------------------------------- -----------------------------------------------------------------------------
  **Campo**         **Tipo / Restriccion**                            **Descripcion**

  **id**            UUID PRIMARY KEY DEFAULT gen_random_uuid()        

  **user_id**       UUID REFERENCES users(id)                         Usuario que ejecuto la accion (null=sistema)

  **action**        VARCHAR(50) NOT NULL                              Accion: CREATE_ORDER, CANCEL_ORDER, CLOSE_CASH, UPDATE_PRODUCT, LOGIN, etc.

  **entity_type**   VARCHAR(50) NOT NULL                              Entidad afectada: order, product, inventory, user, cash_register

  **entity_id**     UUID                                              ID del registro afectado

  **details**       JSONB                                             Datos adicionales: valores anteriores, nuevos, motivo

  **ip_address**    VARCHAR(45)                                       IP desde donde se ejecuto

  **created_at**    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()   Inmutable: no tiene updated_at

  **INDEX**         idx_audit_user ON (user_id)                       Filtrar por usuario

  **INDEX**         idx_audit_action ON (action)                      Filtrar por tipo de accion

  **INDEX**         idx_audit_entity ON (entity_type, entity_id)      Historial de una entidad

  **INDEX**         idx_audit_created ON (created_at)                 Filtrar por fecha
  ----------------- ------------------------------------------------- -----------------------------------------------------------------------------

# 4. DOMINIO: CATALOGO / MENU

## 4.1 categories

*Categorias del menu (Pizzas, Bebidas, Complementos, Combos).*

  ------------------- ------------------------------------------------- ---------------------------------------------------
  **Campo**           **Tipo / Restriccion**                            **Descripcion**

  **id**              UUID PRIMARY KEY DEFAULT gen_random_uuid()        

  **name**            VARCHAR(100) NOT NULL                             Nombre visible en POS

  **slug**            VARCHAR(100) UNIQUE NOT NULL                      URL-friendly, generado del nombre

  **icon**            VARCHAR(50)                                       Nombre icono Lucide (ej: pizza, coffee, utensils)

  **description**     TEXT                                              Descripcion opcional

  **display_order**   INTEGER NOT NULL DEFAULT 0                        Orden en pantalla POS

  **is_active**       BOOLEAN NOT NULL DEFAULT true                     Visible en POS

  **created_at**      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()   

  **updated_at**      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()   
  ------------------- ------------------------------------------------- ---------------------------------------------------

## 4.2 products

*Productos del menu. Soporta productos simples (bebida) y productos con variantes (pizza con tamanos).*

  ------------------- ------------------------------------------------- ---------------------------------------------------------
  **Campo**           **Tipo / Restriccion**                            **Descripcion**

  **id**              UUID PRIMARY KEY DEFAULT gen_random_uuid()        

  **category_id**     UUID NOT NULL REFERENCES categories(id)           Categoria padre

  **name**            VARCHAR(150) NOT NULL                             Nombre del producto

  **slug**            VARCHAR(150) UNIQUE NOT NULL                      URL-friendly

  **description**     TEXT                                              Descripcion corta

  **base_price**      DECIMAL(10,2) NOT NULL                            Precio base (si no tiene variantes, es el precio final)

  **image_url**       VARCHAR(500)                                      URL imagen del producto

  **has_variants**    BOOLEAN NOT NULL DEFAULT false                    Si true, el precio real viene de product_variants

  **is_active**       BOOLEAN NOT NULL DEFAULT true                     Disponible para venta

  **display_order**   INTEGER NOT NULL DEFAULT 0                        Orden dentro de la categoria

  **created_at**      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()   

  **updated_at**      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()   

  **INDEX**           idx_products_category ON (category_id)            

  **INDEX**           idx_products_active ON (is_active)                
  ------------------- ------------------------------------------------- ---------------------------------------------------------

## 4.3 product_variants

*Variantes de producto: tamanos de pizza (Personal, Mediana, Familiar, XL).*

  ------------------- --------------------------------------------------------- -------------------------------
  **Campo**           **Tipo / Restriccion**                                    **Descripcion**

  **id**              UUID PRIMARY KEY DEFAULT gen_random_uuid()                

  **product_id**      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE   

  **name**            VARCHAR(100) NOT NULL                                     Nombre (ej: Familiar)

  **price**           DECIMAL(10,2) NOT NULL                                    Precio de esta variante

  **display_order**   INTEGER NOT NULL DEFAULT 0                                

  **is_active**       BOOLEAN NOT NULL DEFAULT true                             

  **INDEX**           idx_variants_product ON (product_id)                      
  ------------------- --------------------------------------------------------- -------------------------------

## 4.4 modifier_groups

*Grupos de modificadores con reglas de seleccion (ej: Toppings Extra - max 5, Restricciones - sin limite).*

  -------------------- -------------------------------------------- -----------------------------------------------
  **Campo**            **Tipo / Restriccion**                       **Descripcion**

  **id**               UUID PRIMARY KEY DEFAULT gen_random_uuid()   

  **name**             VARCHAR(100) NOT NULL                        Nombre del grupo (ej: Toppings Extra)

  **description**      TEXT                                         

  **min_selections**   INTEGER NOT NULL DEFAULT 0                   Minimo de selecciones requeridas (0=opcional)

  **max_selections**   INTEGER NOT NULL DEFAULT 99                  Maximo de selecciones permitidas

  **display_order**    INTEGER NOT NULL DEFAULT 0                   

  **is_active**        BOOLEAN NOT NULL DEFAULT true                
  -------------------- -------------------------------------------- -----------------------------------------------

## 4.5 modifiers

*Modificadores individuales con precio adicional, agrupados en modifier_groups.*

  ------------------- ---------------------------------------------- ---------------------------------------
  **Campo**           **Tipo / Restriccion**                         **Descripcion**

  **id**              UUID PRIMARY KEY DEFAULT gen_random_uuid()     

  **group_id**        UUID NOT NULL REFERENCES modifier_groups(id)   Grupo al que pertenece

  **name**            VARCHAR(100) NOT NULL                          Nombre (ej: Extra Queso, Sin Cebolla)

  **price**           DECIMAL(10,2) NOT NULL DEFAULT 0.00            Precio adicional (0 si sin costo)

  **is_active**       BOOLEAN NOT NULL DEFAULT true                  

  **display_order**   INTEGER NOT NULL DEFAULT 0                     

  **INDEX**           idx_modifiers_group ON (group_id)              
  ------------------- ---------------------------------------------- ---------------------------------------

## 4.6 product_modifiers

*Relacion N:M: que modificadores estan disponibles para cada producto.*

  ----------------------- --------------------------------------------------------- -----------------------------------
  **Campo**               **Tipo / Restriccion**                                    **Descripcion**

  **id**                  UUID PRIMARY KEY DEFAULT gen_random_uuid()                

  **product_id**          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE   

  **modifier_group_id**   UUID NOT NULL REFERENCES modifier_groups(id)              Grupo de modificadores habilitado

  **UNIQUE**              (product_id, modifier_group_id)                           Evita duplicados
  ----------------------- --------------------------------------------------------- -----------------------------------

# 5. DOMINIO: PROMOCIONES

## 5.1 promotions

*Combos y promociones con precio fijo y vigencia temporal.*

  -------------------- ------------------------------------------------- --------------------------------------------
  **Campo**            **Tipo / Restriccion**                            **Descripcion**

  **id**               UUID PRIMARY KEY DEFAULT gen_random_uuid()        

  **name**             VARCHAR(150) NOT NULL                             Nombre visible (ej: Combo Familiar)

  **description**      TEXT                                              Descripcion para el POS

  **promo_price**      DECIMAL(10,2) NOT NULL                            Precio fijo del combo (RN-11)

  **original_price**   DECIMAL(10,2)                                     Precio sin descuento (para mostrar ahorro)

  **image_url**        VARCHAR(500)                                      Imagen de la promocion

  **is_active**        BOOLEAN NOT NULL DEFAULT true                     

  **start_date**       DATE                                              Inicio vigencia (null=sin limite inicio)

  **end_date**         DATE                                              Fin vigencia (null=sin limite fin)

  **display_order**    INTEGER NOT NULL DEFAULT 0                        

  **created_at**       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()   

  **updated_at**       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()   
  -------------------- ------------------------------------------------- --------------------------------------------

## 5.2 promotion_items

*Productos que componen cada combo/promocion.*

  ------------------ ----------------------------------------------------------- ---------------------------------------
  **Campo**          **Tipo / Restriccion**                                      **Descripcion**

  **id**             UUID PRIMARY KEY DEFAULT gen_random_uuid()                  

  **promotion_id**   UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE   

  **product_id**     UUID NOT NULL REFERENCES products(id)                       Producto incluido

  **variant_id**     UUID REFERENCES product_variants(id)                        Variante especifica (null=a eleccion)

  **quantity**       INTEGER NOT NULL DEFAULT 1                                  Cantidad en el combo

  **is_required**    BOOLEAN NOT NULL DEFAULT true                               Si es obligatorio o intercambiable
  ------------------ ----------------------------------------------------------- ---------------------------------------

# 6. DOMINIO: SALON

## 6.1 tables

*Mesas del salon con estado y capacidad.*

  ---------------- -------------------------------------------------------------------------------------------------------- ----------------------------------------
  **Campo**        **Tipo / Restriccion**                                                                                   **Descripcion**

  **id**           UUID PRIMARY KEY DEFAULT gen_random_uuid()                                                               

  **number**       INTEGER NOT NULL UNIQUE                                                                                  Numero fisico de la mesa

  **capacity**     INTEGER NOT NULL DEFAULT 4                                                                               Capacidad de personas

  **zone**         VARCHAR(50)                                                                                              Zona del salon (ej: Interior, Terraza)

  **status**       VARCHAR(20) NOT NULL DEFAULT \'AVAILABLE\' CHECK (status IN (\'AVAILABLE\',\'OCCUPIED\',\'RESERVED\'))   

  **is_active**    BOOLEAN NOT NULL DEFAULT true                                                                            

  **created_at**   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()                                                          
  ---------------- -------------------------------------------------------------------------------------------------------- ----------------------------------------

# 7. DOMINIO: PEDIDOS (CORE TRANSACCIONAL)

Este es el dominio central del sistema. La tabla orders y sus relaciones manejan todo el flujo transaccional.

## 7.1 orders

*Entidad central. Cada registro es un pedido/ticket. Inmutable post-pago (RN-09).*

  ------------------------- ------------------------------------------------------------------------ -----------------------------------------------------------
  **Campo**                 **Tipo / Restriccion**                                                   **Descripcion**

  **id**                    UUID PRIMARY KEY DEFAULT gen_random_uuid()                               

  **ticket_number**         VARCHAR(15) NOT NULL                                                     Correlativo diario: YYYYMMDD-NNN

  **order_type**            VARCHAR(15) NOT NULL CHECK (order_type IN (\'SALON\',\'PARA_LLEVAR\'))   Tipo de pedido (RN-10)

  **table_id**              UUID REFERENCES tables(id)                                               Mesa (null si para llevar)

  **customer_name**         VARCHAR(100)                                                             Nombre cliente (para llevar)

  **user_id**               UUID NOT NULL REFERENCES users(id)                                       Cajero que registro

  **cash_register_id**      UUID NOT NULL REFERENCES cash_registers(id)                              Sesion de caja (RN-05)

  **status**                VARCHAR(20) NOT NULL DEFAULT \'RECEIVED\'                                RECEIVED, PREPARING, IN_OVEN, READY, DELIVERED, CANCELLED

  **subtotal**              DECIMAL(10,2) NOT NULL                                                   Suma items antes de impuesto

  **tax_rate**              DECIMAL(5,2) NOT NULL                                                    Tasa aplicada (ej: 10.50)

  **tax_amount**            DECIMAL(10,2) NOT NULL                                                   Impuesto calculado

  **total**                 DECIMAL(10,2) NOT NULL                                                   Total final

  **notes**                 TEXT                                                                     Observaciones generales

  **cancellation_reason**   TEXT                                                                     Motivo (RN-07, obligatorio si cancelled)

  **cancelled_by**          UUID REFERENCES users(id)                                                Quien cancelo

  **created_at**            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()                          = hora de pago (prepago)

  **delivered_at**          TIMESTAMP WITH TIME ZONE                                                 Hora de entrega

  **updated_at**            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()                          

  **INDEX**                 idx_orders_date ON (created_at)                                          Consultas por fecha

  **INDEX**                 idx_orders_status ON (status)                                            Pedidos activos

  **INDEX**                 idx_orders_ticket ON (ticket_number)                                     Busqueda por ticket

  **INDEX**                 idx_orders_cash_reg ON (cash_register_id)                                Pedidos por sesion de caja
  ------------------------- ------------------------------------------------------------------------ -----------------------------------------------------------

## 7.2 order_items

*Items individuales de un pedido. Precio congelado al momento de la venta (RN-04).*

  --------------------- ------------------------------------------------------- --------------------------------------------
  **Campo**             **Tipo / Restriccion**                                  **Descripcion**

  **id**                UUID PRIMARY KEY DEFAULT gen_random_uuid()              

  **order_id**          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE   

  **product_id**        UUID NOT NULL REFERENCES products(id)                   

  **variant_id**        UUID REFERENCES product_variants(id)                    Variante (null si no tiene)

  **product_name**      VARCHAR(150) NOT NULL                                   Nombre congelado al momento de la venta

  **variant_name**      VARCHAR(100)                                            Nombre variante congelado

  **quantity**          INTEGER NOT NULL DEFAULT 1 CHECK (quantity \> 0)        

  **unit_price**        DECIMAL(10,2) NOT NULL                                  Precio unitario congelado

  **modifiers_total**   DECIMAL(10,2) NOT NULL DEFAULT 0.00                     Suma de precios de modificadores

  **subtotal**          DECIMAL(10,2) NOT NULL                                  (unit_price + modifiers_total) \* quantity

  **notes**             TEXT                                                    Notas del item (ej: sin sal)

  **INDEX**             idx_order_items_order ON (order_id)                     
  --------------------- ------------------------------------------------------- --------------------------------------------

## 7.3 order_item_modifiers

*Modificadores aplicados a cada item. Precio congelado.*

  ------------------- ------------------------------------------------------------ -------------------------------
  **Campo**           **Tipo / Restriccion**                                       **Descripcion**

  **id**              UUID PRIMARY KEY DEFAULT gen_random_uuid()                   

  **order_item_id**   UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE   

  **modifier_id**     UUID NOT NULL REFERENCES modifiers(id)                       

  **modifier_name**   VARCHAR(100) NOT NULL                                        Nombre congelado

  **price**           DECIMAL(10,2) NOT NULL                                       Precio congelado al momento
  ------------------- ------------------------------------------------------------ -------------------------------

## 7.4 order_status_history

*Historial de cambios de estado de cada pedido. Permite auditar tiempos de preparacion y alimentar el tracking.*

  ----------------------------- ------------------------------------------------------- --------------------------------------------
  **Campo**                     **Tipo / Restriccion**                                  **Descripcion**

  **id**                        UUID PRIMARY KEY DEFAULT gen_random_uuid()              

  **order_id**                  UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE   

  **status**                    VARCHAR(20) NOT NULL                                    Estado al que cambio

  **changed_by**                UUID REFERENCES users(id)                               Usuario que cambio (null=sistema)

  **estimated_remaining_min**   INTEGER                                                 Minutos restantes estimados en ese momento

  **notes**                     TEXT                                                    Observacion opcional

  **created_at**                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()         Timestamp exacto del cambio

  **INDEX**                     idx_status_hist_order ON (order_id)                     

  **INDEX**                     idx_status_hist_status ON (status)                      Para reportes de tiempos
  ----------------------------- ------------------------------------------------------- --------------------------------------------

## 7.5 order_promotions

*Registra que promocion se aplico a un pedido y con que componentes.*

  -------------------- ------------------------------------------------------- -------------------------------
  **Campo**            **Tipo / Restriccion**                                  **Descripcion**

  **id**               UUID PRIMARY KEY DEFAULT gen_random_uuid()              

  **order_id**         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE   

  **promotion_id**     UUID NOT NULL REFERENCES promotions(id)                 Promocion aplicada

  **promo_name**       VARCHAR(150) NOT NULL                                   Nombre congelado

  **promo_price**      DECIMAL(10,2) NOT NULL                                  Precio congelado

  **original_price**   DECIMAL(10,2)                                           Precio original congelado
  -------------------- ------------------------------------------------------- -------------------------------

# 8. DOMINIO: PAGOS Y CAJA

## 8.1 payment_transactions

*Transacciones de pago separadas de orders. Permite auditar pagos y preparar para futuros metodos.*

  ---------------------- ------------------------------------------------------------------------------------------- --------------------------------------------------------
  **Campo**              **Tipo / Restriccion**                                                                      **Descripcion**

  **id**                 UUID PRIMARY KEY DEFAULT gen_random_uuid()                                                  

  **order_id**           UUID NOT NULL UNIQUE REFERENCES orders(id)                                                  Relacion 1:1 con order

  **payment_method**     VARCHAR(20) NOT NULL CHECK (payment_method IN (\'CASH\',\'YAPE_PLIN\'))                     RN-12: mutuamente excluyente

  **amount**             DECIMAL(10,2) NOT NULL                                                                      Monto total pagado

  **cash_received**      DECIMAL(10,2)                                                                               Monto recibido (solo efectivo)

  **change_amount**      DECIMAL(10,2)                                                                               Vuelto calculado (solo efectivo)

  **reference_number**   VARCHAR(100)                                                                                Numero de referencia (futuro: codigo transaccion Yape)

  **status**             VARCHAR(20) NOT NULL DEFAULT \'COMPLETED\' CHECK (status IN (\'COMPLETED\',\'REFUNDED\'))   

  **refund_reason**      TEXT                                                                                        Motivo de devolucion (si aplica)

  **refunded_at**        TIMESTAMP WITH TIME ZONE                                                                    Hora de devolucion

  **created_at**         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()                                             

  **INDEX**              idx_payment_order ON (order_id)                                                             

  **INDEX**              idx_payment_method ON (payment_method)                                                      Para reportes por metodo
  ---------------------- ------------------------------------------------------------------------------------------- --------------------------------------------------------

## 8.2 cash_registers

*Sesiones de caja. RN-05: obligatoria para vender. RN-06: una sesion abierta por usuario.*

  ------------------------- ------------------------------------------------------------------------------- -------------------------------------------------
  **Campo**                 **Tipo / Restriccion**                                                          **Descripcion**

  **id**                    UUID PRIMARY KEY DEFAULT gen_random_uuid()                                      

  **user_id**               UUID NOT NULL REFERENCES users(id)                                              Cajero

  **opened_at**             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()                                 

  **closed_at**             TIMESTAMP WITH TIME ZONE                                                        Null = abierta

  **opening_amount**        DECIMAL(10,2) NOT NULL                                                          Fondo de cambio inicial

  **expected_cash**         DECIMAL(10,2)                                                                   opening + ventas efectivo (calculado al cierre)

  **actual_cash**           DECIMAL(10,2)                                                                   Monto real contado

  **difference**            DECIMAL(10,2)                                                                   actual - expected

  **total_sales**           DECIMAL(10,2)                                                                   Total vendido en el turno

  **total_cash_sales**      DECIMAL(10,2)                                                                   Ventas en efectivo

  **total_digital_sales**   DECIMAL(10,2)                                                                   Ventas Yape/Plin

  **total_tickets**         INTEGER                                                                         Cantidad de tickets emitidos

  **total_cancelled**       INTEGER DEFAULT 0                                                               Pedidos cancelados

  **notes**                 TEXT                                                                            Observaciones del cajero al cierre

  **status**                VARCHAR(10) NOT NULL DEFAULT \'OPEN\' CHECK (status IN (\'OPEN\',\'CLOSED\'))   

  **INDEX**                 idx_cash_reg_user ON (user_id)                                                  

  **INDEX**                 idx_cash_reg_status ON (status)                                                 Buscar caja abierta
  ------------------------- ------------------------------------------------------------------------------- -------------------------------------------------

## 8.3 ticket_sequences

*Control robusto del correlativo diario de tickets. Soporta modo offline y reconexion sin colisiones.*

  ----------------- ------------------------------------------------- ----------------------------------------
  **Campo**         **Tipo / Restriccion**                            **Descripcion**

  **id**            UUID PRIMARY KEY DEFAULT gen_random_uuid()        

  **date**          DATE NOT NULL UNIQUE                              Fecha del dia (RN-02: reinicio diario)

  **last_number**   INTEGER NOT NULL DEFAULT 0                        Ultimo numero emitido ese dia

  **updated_at**    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()   
  ----------------- ------------------------------------------------- ----------------------------------------

**Nota tecnica:** *Esta tabla usa un UPDATE atomico con RETURNING para generar correlativos sin condiciones de carrera: UPDATE ticket_sequences SET last_number = last_number + 1 WHERE date = CURRENT_DATE RETURNING last_number. Si no existe el registro del dia, se crea con INSERT \... ON CONFLICT.*

# 9. DOMINIO: ORDER TRACKING

## 9.1 order_tracking

*Datos de seguimiento del pedido para el cliente. Codigo QR, URL, expiracion.*

  ----------------------- -------------------------------------------------------------- ---------------------------------------------------
  **Campo**               **Tipo / Restriccion**                                         **Descripcion**

  **id**                  UUID PRIMARY KEY DEFAULT gen_random_uuid()                     

  **order_id**            UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE   Relacion 1:1

  **tracking_code**       VARCHAR(10) NOT NULL UNIQUE                                    Codigo alfanumerico corto (ej: A7K3X2)

  **qr_data**             TEXT NOT NULL                                                  URL completa: https://dominio.com/tracking/A7K3X2

  **estimated_minutes**   INTEGER                                                        Tiempo estimado total al momento de crear

  **expires_at**          TIMESTAMP WITH TIME ZONE                                       Auto-expiracion post entrega

  **created_at**          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()                

  **INDEX**               idx_tracking_code ON (tracking_code)                           Busqueda rapida por codigo
  ----------------------- -------------------------------------------------------------- ---------------------------------------------------

# 10. DOMINIO: INVENTARIO

## 10.1 inventory_items

*Insumos del inventario con stock actual y minimo para alertas.*

  ------------------- ------------------------------------------------- -------------------------------------
  **Campo**           **Tipo / Restriccion**                            **Descripcion**

  **id**              UUID PRIMARY KEY DEFAULT gen_random_uuid()        

  **name**            VARCHAR(150) NOT NULL                             Nombre (ej: Queso Mozzarella)

  **sku**             VARCHAR(50) UNIQUE                                Codigo interno opcional

  **unit**            VARCHAR(20) NOT NULL                              Unidad: kg, g, litros, ml, unidades

  **current_stock**   DECIMAL(10,3) NOT NULL DEFAULT 0                  Stock actual

  **min_stock**       DECIMAL(10,3) NOT NULL DEFAULT 0                  Stock minimo para alerta

  **cost_per_unit**   DECIMAL(10,2) NOT NULL DEFAULT 0                  Costo unitario de compra

  **supplier**        VARCHAR(150)                                      Proveedor habitual

  **is_active**       BOOLEAN NOT NULL DEFAULT true                     

  **updated_at**      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()   

  **INDEX**           idx_inv_stock ON (current_stock, min_stock)       Para alertas de stock bajo
  ------------------- ------------------------------------------------- -------------------------------------

## 10.2 product_ingredients

*Recetas: vincula productos con insumos y cantidades. Soporta recetas por variante.*

  ----------------------- --------------------------------------------------------- -------------------------------------------
  **Campo**               **Tipo / Restriccion**                                    **Descripcion**

  **id**                  UUID PRIMARY KEY DEFAULT gen_random_uuid()                

  **product_id**          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE   

  **variant_id**          UUID REFERENCES product_variants(id) ON DELETE CASCADE    Variante especifica (null=aplica a todas)

  **inventory_item_id**   UUID NOT NULL REFERENCES inventory_items(id)              Insumo requerido

  **quantity_used**       DECIMAL(10,3) NOT NULL CHECK (quantity_used \> 0)         Cantidad por unidad vendida

  **UNIQUE**              (product_id, variant_id, inventory_item_id)               Evita recetas duplicadas
  ----------------------- --------------------------------------------------------- -------------------------------------------

## 10.3 inventory_movements

*Historial completo de entradas y salidas de inventario. Inmutable.*

  ----------------------- ------------------------------------------------------------------------------------------ -------------------------------------------------
  **Campo**               **Tipo / Restriccion**                                                                     **Descripcion**

  **id**                  UUID PRIMARY KEY DEFAULT gen_random_uuid()                                                 

  **inventory_item_id**   UUID NOT NULL REFERENCES inventory_items(id)                                               

  **movement_type**       VARCHAR(15) NOT NULL CHECK (movement_type IN (\'IN\',\'OUT\',\'ADJUSTMENT\',\'RETURN\'))   IN=compra, OUT=venta, RETURN=cancelacion

  **quantity**            DECIMAL(10,3) NOT NULL                                                                     Positivo siempre, el tipo indica direccion

  **stock_after**         DECIMAL(10,3) NOT NULL                                                                     Stock resultante despues del movimiento

  **reference_type**      VARCHAR(30)                                                                                Origen: order, manual, cancellation, adjustment

  **reference_id**        UUID                                                                                       ID de la orden o entidad origen

  **notes**               TEXT                                                                                       Observaciones (proveedor, motivo ajuste)

  **user_id**             UUID REFERENCES users(id)                                                                  Null si automatico (por venta)

  **created_at**          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()                                            

  **INDEX**               idx_inv_mov_item ON (inventory_item_id)                                                    

  **INDEX**               idx_inv_mov_date ON (created_at)                                                           

  **INDEX**               idx_inv_mov_ref ON (reference_type, reference_id)                                          Trazabilidad
  ----------------------- ------------------------------------------------------------------------------------------ -------------------------------------------------

# 11. DOMINIO: CONFIGURACION

## 11.1 business_config

*Configuracion general del negocio. 1 registro (futuro multi-tenant: 1 por tenant).*

  --------------------------- ------------------------------------------------- -------------------------------
  **Campo**                   **Tipo / Restriccion**                            **Descripcion**

  **id**                      UUID PRIMARY KEY DEFAULT gen_random_uuid()        

  **business_name**           VARCHAR(200) NOT NULL                             Nombre para el ticket

  **ruc**                     VARCHAR(11)                                       RUC (SUNAT)

  **address**                 TEXT                                              Direccion fisica

  **phone**                   VARCHAR(20)                                       Telefono

  **email**                   VARCHAR(255)                                      Email de contacto

  **tax_rate**                DECIMAL(5,2) NOT NULL DEFAULT 10.50               Tasa impuesto vigente (RN-03)

  **currency**                VARCHAR(3) NOT NULL DEFAULT \'PEN\'               Moneda

  **ticket_header**           TEXT                                              Texto cabecera ticket

  **ticket_footer**           TEXT                                              Texto pie ticket

  **tracking_base_url**       VARCHAR(200)                                      URL base QR tracking

  **tracking_expiry_hours**   INTEGER NOT NULL DEFAULT 2                        Horas para expirar tracking

  **logo_url**                VARCHAR(500)                                      Logo del negocio

  **updated_at**              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()   
  --------------------------- ------------------------------------------------- -------------------------------

## 11.2 product_prep_times

*Tiempos estimados de preparacion por producto/variante. Alimenta el timer del tracking.*

  ----------------------- --------------------------------------------------------- -------------------------------------------
  **Campo**               **Tipo / Restriccion**                                    **Descripcion**

  **id**                  UUID PRIMARY KEY DEFAULT gen_random_uuid()                

  **product_id**          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE   

  **variant_id**          UUID REFERENCES product_variants(id) ON DELETE CASCADE    Variante especifica (null=aplica a todas)

  **prep_time_minutes**   INTEGER NOT NULL                                          Tiempo estimado en minutos

  **UNIQUE**              (product_id, variant_id)                                  Un tiempo por producto/variante
  ----------------------- --------------------------------------------------------- -------------------------------------------

## 11.3 printer_configs

*Configuracion de impresoras termicas conectadas al sistema.*

  --------------------- ----------------------------------------------------------------------- -----------------------------------------------------------
  **Campo**             **Tipo / Restriccion**                                                  **Descripcion**

  **id**                UUID PRIMARY KEY DEFAULT gen_random_uuid()                              

  **name**              VARCHAR(100) NOT NULL                                                   Nombre descriptivo (ej: Impresora Caja, Impresora Cocina)

  **location**          VARCHAR(20) NOT NULL CHECK (location IN (\'CASHIER\',\'KITCHEN\'))      Ubicacion

  **connection_type**   VARCHAR(20) NOT NULL CHECK (connection_type IN (\'USB\',\'NETWORK\'))   Tipo de conexion

  **ip_address**        VARCHAR(45)                                                             IP si es por red

  **port**              INTEGER                                                                 Puerto si es por red

  **paper_width**       INTEGER NOT NULL DEFAULT 80                                             Ancho papel en mm (58 o 80)

  **is_active**         BOOLEAN NOT NULL DEFAULT true                                           

  **is_default**        BOOLEAN NOT NULL DEFAULT false                                          Impresora por defecto de su ubicacion

  **created_at**        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()                         
  --------------------- ----------------------------------------------------------------------- -----------------------------------------------------------

# 12. DOMINIO: REPORTES

## 12.1 daily_summaries

*Resumenes diarios pre-calculados. Evita queries pesadas sobre orders para reportes.*

  ----------------------- ------------------------------------------------- ---------------------------------------
  **Campo**               **Tipo / Restriccion**                            **Descripcion**

  **id**                  UUID PRIMARY KEY DEFAULT gen_random_uuid()        

  **date**                DATE NOT NULL UNIQUE                              Dia del resumen

  **total_orders**        INTEGER NOT NULL DEFAULT 0                        Total pedidos (no cancelados)

  **total_cancelled**     INTEGER NOT NULL DEFAULT 0                        Pedidos cancelados

  **total_sales**         DECIMAL(10,2) NOT NULL DEFAULT 0                  Venta total del dia

  **total_cash**          DECIMAL(10,2) NOT NULL DEFAULT 0                  Ventas en efectivo

  **total_digital**       DECIMAL(10,2) NOT NULL DEFAULT 0                  Ventas Yape/Plin

  **total_tax**           DECIMAL(10,2) NOT NULL DEFAULT 0                  Total impuesto recaudado

  **avg_ticket**          DECIMAL(10,2) NOT NULL DEFAULT 0                  Ticket promedio

  **top_product_id**      UUID REFERENCES products(id)                      Producto mas vendido del dia

  **total_salon**         INTEGER NOT NULL DEFAULT 0                        Pedidos salon

  **total_para_llevar**   INTEGER NOT NULL DEFAULT 0                        Pedidos para llevar

  **avg_prep_time_min**   DECIMAL(5,1)                                      Tiempo promedio preparacion (minutos)

  **created_at**          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()   

  **updated_at**          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()   
  ----------------------- ------------------------------------------------- ---------------------------------------

# 13. DOMINIO: NOTIFICACIONES

## 13.1 notifications

*Notificaciones internas del sistema (cocina a cajero, sistema a admin).*

  -------------------- ------------------------------------------------- ------------------------------------------------------------
  **Campo**            **Tipo / Restriccion**                            **Descripcion**

  **id**               UUID PRIMARY KEY DEFAULT gen_random_uuid()        

  **type**             VARCHAR(30) NOT NULL                              ORDER_READY, LOW_STOCK, CASH_REGISTER_CLOSED, SYSTEM_ALERT

  **title**            VARCHAR(200) NOT NULL                             Titulo corto

  **message**          TEXT                                              Mensaje detallado

  **target_role**      VARCHAR(20)                                       Rol destinatario (null=todos)

  **target_user_id**   UUID REFERENCES users(id)                         Usuario especifico (null=broadcast por rol)

  **reference_type**   VARCHAR(30)                                       Entidad relacionada: order, inventory_item

  **reference_id**     UUID                                              ID de la entidad

  **is_read**          BOOLEAN NOT NULL DEFAULT false                    Leida por el destinatario

  **read_at**          TIMESTAMP WITH TIME ZONE                          Hora de lectura

  **created_at**       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()   

  **INDEX**            idx_notif_target ON (target_role, is_read)        Notificaciones no leidas por rol

  **INDEX**            idx_notif_user ON (target_user_id, is_read)       Notificaciones no leidas por usuario
  -------------------- ------------------------------------------------- ------------------------------------------------------------

# 14. PREPARACION PARA MULTI-TENANT

El modelo actual soporta un solo negocio (single-tenant). Para escalar a multi-tenant se aplicara la siguiente estrategia:

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **ESTRATEGIA: SHARED SCHEMA + ROW-LEVEL ISOLATION**                                                                                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                                                                                                        |
| Todas las tablas compartiran el mismo schema de PostgreSQL. Se agregara un campo tenant_id (UUID FK) a cada tabla que contenga datos de negocio. Las politicas RLS de PostgreSQL filtraran automaticamente por tenant_id segun el JWT del usuario. Drizzle facilitara esto con un filtro global en el repository base. |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

-   **Tablas que NO necesitan tenant_id:** audit_logs (ya tiene user_id trazable), sessions (ya tiene user_id)

-   **Tablas que SI necesitan tenant_id:** Todas las demas (categories, products, orders, inventory, etc.)

-   **Tabla nueva para multi-tenant:** tenants: id, name, slug, plan, is_active, created_at. Cada negocio = 1 tenant.

-   **Migracion estimada:** Agregar columna tenant_id + FK + indice a cada tabla. Crear politicas RLS. Modificar el middleware NestJS para inyectar tenant_id. Estimado: 2-3 semanas de desarrollo.

*Documento preparado por Bruno Alvarez - Full Stack Developer*

*POS Pizza - Modelado de Base de Datos v1.0 - Marzo 2026*

*Documento Interno - Confidencial*
