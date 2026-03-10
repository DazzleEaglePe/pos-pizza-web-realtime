**ARQUITECTURA TECNICA Y DISENO**

──────────────────────────────────────────────────

**POS PIZZA**

Sistema de Punto de Venta Especializado para Pizzerias

Fase 2: Arquitectura Tecnica, Patrones de Diseno y Modelado de BD

  ------------------------ ----------------------------------------------------
  **Proyecto**             POS Pizza - Sistema de Punto de Venta

  **Documento**            Arquitectura Tecnica - Fase 2 de 2

  **Prerequisito**         **Documento de Analisis de Negocio v1.2 (Fase 1)**

  **Autor**                Bruno Alvarez

  **Rol**                  Full Stack Developer / Lider de Proyecto

  **Version**              1.3

  **Fecha**                Marzo 2026

  **Estado**               En Revision

  **Clasificacion**        Documento Interno - Confidencial
  ------------------------ ----------------------------------------------------

**TABLA DE CONTENIDOS**

# 1. DECISIONES TECNICAS

Las siguientes decisiones fueron evaluadas y aprobadas durante la fase de analisis previo al desarrollo. Cada decision incluye su justificacion tecnica y las alternativas descartadas.

## 1.1 Stack Tecnologico

  --------------------- ------------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------
  **CAPA**              **TECNOLOGIA**                        **JUSTIFICACION**

  **Frontend**          Next.js 14+ (App Router)              React ecosystem, SSR/SSG, optimizacion automatica, rutas basadas en archivos, gran comunidad

  **UI**                Tailwind CSS + shadcn/ui              Desarrollo rapido, componentes accesibles y profesionales, customizable, tree-shaking nativo

  **Backend**           NestJS (TypeScript)                   Estructura modular (Modules, Controllers, Services), DI nativa, Guards para roles, WebSocket Gateway integrado, inspirado en Angular/Spring Boot

  **ORM**               Drizzle ORM                           Type-safe, SQL-first (queries eficientes), sin runtime engine (mejor en serverless), ideal para multi-tenant futuro

  **Base de Datos**     PostgreSQL (Supabase)                 Relacional robusto, RLS nativo, JSON support, extensiones (pg_cron, pg_net), hosting gestionado con free tier generoso

  **Tiempo Real**       Supabase Realtime                     WebSocket gestionado, suscripciones a cambios en DB, ideal para pantalla cocina y order tracking

  **Autenticacion**     JWT (NestJS Passport)                 Stateless, escalable, compatible con multi-tenant, roles embebidos en token

  **Validacion**        class-validator + class-transformer   DTOs tipados con decoradores, validacion automatica via NestJS Pipes

  **Monorepo**          Turborepo                             Build caching, scripts paralelos, packages compartidos (tipos/DTOs), un solo repositorio

  **Deploy Frontend**   Vercel                                Zero config para Next.js, CDN global, SSL automatico, preview deployments

  **Deploy Backend**    Railway o Render                      Deploy simple para NestJS, auto-scaling, free tier para MVP, PostgreSQL compatible

  **Deploy DB**         Supabase Cloud                        PostgreSQL gestionado, 500MB free tier, dashboard visual, backups automaticos

  **Impresion**         WebUSB + ESC/POS                      Impresion directa desde navegador a impresora termica USB, sin drivers adicionales

  **QR Generation**     qrcode (npm)                          Generacion de QR para tickets de tracking, ligero, sin dependencias externas
  --------------------- ------------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------

## 1.2 Decisiones de Arquitectura

  ----------------------------- ------------------------------------------------- -------------------------------------------------------------------------------------------------
  **DECISION**                  **OPCION ELEGIDA**                                **ALTERNATIVA DESCARTADA**

  **Arquitectura general**      Frontend + Backend separados (Next.js + NestJS)   *Monolito Next.js (Server Actions + API Routes). Descartado: dificil separar para multi-tenant*

  **Lenguaje backend**          TypeScript (NestJS)                               *Java (Spring Boot). Descartado: tipos no compartidos con frontend, mas boilerplate para MVP*

  **ORM**                       Drizzle (SQL-first, sin runtime engine)           *Prisma (runtime engine, overhead en serverless). Supabase client (sin type-safety)*

  **Estructura de repo**        Monorepo (Turborepo)                              *Repos separados. Descartado: overhead de publicar paquetes compartidos para un solo dev*

  **Autenticacion**             JWT con Passport (NestJS)                         *Supabase Auth. Descartado: mas control con JWT propio, compatible con backend separado*

  **Comunicacion front-back**   REST API + Supabase Realtime                      *GraphQL. Descartado: complejidad innecesaria para el MVP, REST es suficiente*

  **Estado frontend**           Zustand (ligero) o React Query                    *Redux. Descartado: excesivo para esta aplicacion, Zustand es mas simple*
  ----------------------------- ------------------------------------------------- -------------------------------------------------------------------------------------------------

# 2. PATRONES DE ARQUITECTURA Y DISENO

## 2.1 Arquitectura de Alto Nivel

El sistema sigue una arquitectura de dos capas separadas (frontend + backend) comunicandose via REST API, con un canal de tiempo real complementario via Supabase Realtime.

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **DIAGRAMA DE ARQUITECTURA**                                                                                                                                                          |
|                                                                                                                                                                                       |
| CLIENTES (Navegador) \--\> \[Next.js - Vercel\] \--\> REST API \--\> \[NestJS - Railway\] \--\> \[PostgreSQL - Supabase\] \<\-- Supabase Realtime \--\> \[Next.js - Cocina/Tracking\] |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

### Flujo de Comunicacion

-   **POS (Cajero):** Next.js hace llamadas REST al backend NestJS para crear pedidos, cobrar, gestionar productos

-   **Cocina (Kitchen Display):** Next.js se suscribe a Supabase Realtime para recibir pedidos nuevos y cambios de estado en tiempo real

-   **Order Tracking (Cliente):** Pagina publica Next.js se suscribe a Supabase Realtime para el estado de un pedido especifico

-   **Admin:** Next.js hace llamadas REST al backend NestJS para CRUD de productos, usuarios, inventario, reportes

-   **Backend (NestJS):** Recibe requests REST, ejecuta logica de negocio, persiste en PostgreSQL via Drizzle, y al mutar estados de pedidos, los cambios se propagan automaticamente via Supabase Realtime

## 2.2 Patrones de Diseno Aplicados

  ------------------------ -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **PATRON**               **APLICACION EN POS PIZZA**

  **Repository Pattern**   Capa de acceso a datos aislada del servicio. Cada entidad (orders, products, inventory) tiene su repositorio con Drizzle. Facilita cambiar de DB o agregar caching sin tocar la logica de negocio.

  **Service Layer**        Toda la logica de negocio vive en Services de NestJS (OrdersService, ProductsService, InventoryService). Los Controllers solo reciben requests y delegan al Service.

  **DTO Pattern**          Data Transfer Objects tipados para cada operacion (CreateOrderDto, UpdateProductDto). Validacion automatica con class-validator. Los DTOs se comparten entre front y back via el package shared del monorepo.

  **Guard Pattern**        NestJS Guards para autenticacion (JwtAuthGuard) y autorizacion por roles (RolesGuard). Se aplican con decoradores: \@UseGuards(JwtAuthGuard, RolesGuard) \@Roles(\'ADMIN\').

  **Observer Pattern**     Supabase Realtime implementa el patron Observer: la pantalla de cocina y el tracking del cliente se suscriben a cambios en la tabla orders. Cuando el backend muta un pedido, todos los suscriptores reciben la notificacion.

  **Module Pattern**       NestJS organiza el codigo en modulos autocontenidos: OrdersModule, ProductsModule, InventoryModule, AuthModule, ReportsModule. Cada modulo encapsula su controller, service, repository y DTOs.

  **Strategy Pattern**     Para metodos de pago: CashPaymentStrategy y YapePlinPaymentStrategy implementan la misma interfaz pero con logica diferente (calculo de vuelto vs. confirmacion directa). Extensible para futuros metodos.

  **Factory Pattern**      Para generacion de tickets: TicketFactory genera el formato del ticket (texto + QR + detalle) independientemente del medio de impresion (termica ESC/POS o navegador como fallback).

  **Middleware Pattern**   Para multi-tenant futuro: TenantMiddleware extraera el tenant_id del JWT o del subdomain y lo inyectara en el contexto de cada request. Se configura una vez, aplica globalmente.
  ------------------------ -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 2.3 Arquitectura por Capas (Backend NestJS)

El backend sigue una arquitectura de 4 capas con responsabilidades claras:

**Capa 1 - Controllers:** Reciben HTTP requests, validan DTOs, delegan al Service, retornan HTTP responses. No contienen logica de negocio.

**Capa 2 - Services:** Toda la logica de negocio. Orquestan operaciones entre multiples repositorios. Ejemplo: OrdersService al crear un pedido llama a InventoryService para descontar stock, a TicketService para generar el ticket, y a NotificationService para notificar a cocina.

**Capa 3 - Repositories:** Acceso a datos via Drizzle ORM. Queries SQL type-safe. Un repositorio por entidad principal. No contienen logica de negocio, solo operaciones CRUD y queries especificas.

**Capa 4 - Database:** PostgreSQL en Supabase. Schema definido con Drizzle migrations. RLS como capa extra de seguridad para multi-tenant futuro.

# 3. ESTRUCTURA DEL PROYECTO (MONOREPO)

El proyecto se organiza como un monorepo gestionado por Turborepo. La estructura ha sido disenada para alinear 1:1 con las 29 tablas del modelo de datos y los 13 modulos del backend NestJS.

## 3.1 Vista General

pos-pizza/

├── apps/

│ ├── web/ \# Next.js 14+ (Frontend)

│ └── api/ \# NestJS (Backend)

├── packages/

│ ├── shared/ \# \@pos-pizza/shared (tipos, DTOs, enums, utils)

│ └── ui/ \# \@pos-pizza/ui (futuro design system)

├── docker/ \# Docker (dev local: PostgreSQL + pgAdmin)

├── docs/ \# Documentacion del proyecto

├── turbo.json \# Pipelines Turborepo

├── package.json \# Root (workspaces)

└── .env.example

## 3.2 Frontend: apps/web/ (Next.js)

web/src/

├── app/ \# App Router

│ ├── (auth)/login/ \# Pantalla login

│ ├── (pos)/ \# POS Cajero

│ │ ├── dashboard/ \# Vista mesas + pedidos activos

│ │ ├── new-order/ \# Toma de pedido (categorias + carrito)

│ │ ├── checkout/ \# Cobro: pago, vuelto, confirmar

│ │ └── cash-register/(open\|close) \# Apertura/cierre caja

│ ├── (kitchen)/ \# Kitchen Display (fullscreen, touch)

│ ├── (admin)/ \# Panel Administracion

│ │ ├── dashboard/ \# Resumen, alertas, metricas

│ │ ├── menu/(categories\|products\|modifiers\|promotions)

│ │ ├── tables/ \# Gestion mesas

│ │ ├── inventory/(list\|movements\|restock)

│ │ ├── users/ \# CRUD usuarios + roles

│ │ ├── reports/(sales\|cash-register\|inventory\|cancellations)

│ │ ├── printers/ \# Config impresoras

│ │ ├── settings/ \# Config negocio (RUC, impuesto, tracking)

│ │ └── audit/ \# Log auditoria (solo lectura)

│ └── (tracking)/\[code\]/ \# Tracking publico (QR destination)

├── components/

│ ├── ui/ \# shadcn/ui (Button, Dialog, etc.)

│ ├── pos/ \# CategoryGrid, ProductGrid, CartSidebar, PaymentDialog, TableMap

│ ├── kitchen/ \# OrderCard, StatusButton, TimeIndicator

│ ├── tracking/ \# ProgressBar, StatusIcon (animados), TimerDisplay

│ ├── admin/ \# DataTable, StatsCard, SalesChart

│ └── common/ \# Navbar, Sidebar, NotificationBell, ProtectedRoute

├── hooks/ \# useAuth, useCart, useRealtimeOrders, useRealtimeTracking,

│ \# useNotifications, usePrinter, useApi

├── lib/

│ ├── api-client.ts \# Cliente HTTP tipado para NestJS

│ ├── supabase-client.ts \# Solo Realtime (no queries directas)

│ ├── printer/ \# escpos-builder, ticket-template, comanda-template, webusb-adapter

│ └── qr-generator.ts

├── stores/ \# Zustand: auth-store, cart-store, cash-register-store, notification-store

└── styles/ \# globals.css, tracking-theme.css (animaciones)

## 3.3 Backend: apps/api/ (NestJS) - 13 Modulos

api/src/

├── modules/ \# 13 modulos de negocio

│ ├── auth/ \# JWT login, refresh, Passport strategies

│ ├── users/ \# CRUD usuarios, roles

│ ├── products/ \# Categorias, productos, variantes, modifier_groups, modifiers

│ ├── promotions/ \# Combos, descuentos, vigencia

│ ├── tables/ \# Mesas del salon

│ ├── orders/ \# Core: pedidos, items, status history, order_promotions

│ ├── payments/ \# (NUEVO) payment_transactions, Strategy Pattern (cash/digital)

│ ├── cash-register/ \# Apertura/cierre caja, ticket_sequences (correlativo atomico)

│ ├── tracking/ \# Order tracking publico, QR, codigos

│ ├── inventory/ \# Insumos, recetas (product_ingredients), movimientos, alertas

│ ├── reports/ \# Ventas, cierre caja, ranking, daily_summaries

│ ├── notifications/ \# (NUEVO) CRUD + WebSocket Gateway push notifications

│ └── printer/ \# (NUEVO) Config impresoras (caja + cocina)

│

├── common/ \# Transversales globales

│ ├── guards/ \# jwt-auth.guard, roles.guard

│ ├── decorators/ \# \@Roles(), \@CurrentUser(), \@Public()

│ ├── interceptors/ \# audit.interceptor (NUEVO), transform.interceptor, timeout.interceptor

│ ├── pipes/ \# validation.pipe

│ ├── filters/ \# http-exception.filter

│ └── middleware/ \# logger.middleware

│

├── database/ \# Drizzle ORM

│ ├── drizzle.config.ts

│ ├── drizzle.module.ts \# NestJS DI module

│ ├── schema/ \# 12 archivos por dominio

│ │ ├── auth.schema.ts \# users, sessions

│ │ ├── catalog.schema.ts \# categories, products, variants, modifier_groups, modifiers

│ │ ├── promotions.schema.ts \# promotions, promotion_items

│ │ ├── salon.schema.ts \# tables

│ │ ├── orders.schema.ts \# orders, order_items, order_item_modifiers, order_status_history, order_promotions

│ │ ├── payments.schema.ts \# payment_transactions, cash_registers, ticket_sequences

│ │ ├── tracking.schema.ts \# order_tracking

│ │ ├── inventory.schema.ts \# inventory_items, product_ingredients, inventory_movements

│ │ ├── config.schema.ts \# business_config, product_prep_times, printer_configs

│ │ ├── reports.schema.ts \# daily_summaries

│ │ ├── notifications.schema.ts \# notifications

│ │ └── audit.schema.ts \# audit_logs

│ ├── migrations/ \# Auto-generadas por Drizzle

│ └── seed/ \# users.seed, menu.seed, tables.seed, config.seed

│

├── config/ \# app.config, database.config, jwt.config, supabase.config

├── app.module.ts \# Root module

└── main.ts \# Entry point

## 3.4 Package Compartido: packages/shared/

shared/src/

├── types/ \# IUser, IProduct, IOrder, IPayment, IInventory, ITracking, INotification, IConfig\...

├── dtos/ \# CreateOrderDto, ProcessPaymentDto, UpdateStatusDto\...

├── enums/ \# OrderStatus, OrderType, PaymentMethod, UserRole, TableStatus, MovementType, NotificationType

├── constants/ \# order-status-flow, tax-config, ticket-format, tracking-messages

├── validators/ \# ruc.validator (Peru), phone.validator, price.validator

└── utils/ \# format-currency, format-date, format-ticket, calculate-tax, generate-tracking-code

## 3.5 Mapeo Modulos NestJS \<-\> Tablas BD \<-\> Rutas Frontend

La siguiente tabla muestra la alineacion completa entre las 3 capas del sistema:

  ------------------- --------------------------------------------------------------------------------------- ------------------------------------------
  **MODULO NESTJS**   **TABLAS BD (29)**                                                                      **RUTAS NEXT.JS**

  **auth**            users, sessions                                                                         (auth)/login

  **users**           users                                                                                   (admin)/users

  **products**        categories, products, product_variants, modifier_groups, modifiers, product_modifiers   (admin)/menu/\*, (pos)/new-order

  **promotions**      promotions, promotion_items                                                             (admin)/menu/promotions, (pos)/new-order

  **tables**          tables                                                                                  (admin)/tables, (pos)/dashboard

  **orders**          orders, order_items, order_item_modifiers, order_status_history, order_promotions       (pos)/\*, (kitchen)/

  **payments**        payment_transactions                                                                    (pos)/checkout

  **cash-register**   cash_registers, ticket_sequences                                                        (pos)/cash-register/\*

  **tracking**        order_tracking                                                                          (tracking)/\[code\]

  **inventory**       inventory_items, product_ingredients, inventory_movements                               (admin)/inventory/\*

  **reports**         daily_summaries (+ queries a orders, payments)                                          (admin)/reports/\*

  **notifications**   notifications                                                                           Componente NotificationBell (global)

  **printer**         printer_configs                                                                         (admin)/printers

  **(interceptor)**   audit_logs                                                                              (admin)/audit
  ------------------- --------------------------------------------------------------------------------------- ------------------------------------------

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **ESTRUCTURA COMPLETA DISPONIBLE**                                                                                                                                                                                                  |
|                                                                                                                                                                                                                                     |
| La estructura detallada a nivel de archivos individuales (cada controller, service, repository, component, hook, etc.) esta disponible en el archivo POS_Pizza_Estructura_Proyecto.md entregado como complemento de este documento. |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# 4. MODELADO DE BASE DE DATOS

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **DOCUMENTO SEPARADO: MODELADO DE BD v1.0**                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                                             |
| El modelado completo de la base de datos se encuentra en el documento dedicado \'POS_Pizza_Modelado_BD_v1.0.docx\'. Este incluye las 29 tablas detalladas campo por campo, organizadas en 8 dominios, con diagrama ER completo (Mermaid), indices de rendimiento, y estrategia de migracion a multi-tenant. |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

## 4.1 Resumen: 29 Tablas en 8 Dominios

  ------------------------------ --------------------------------------------------------------------------------------- -------------------
  **DOMINIO**                    **TABLAS**                                                                              **\# TABLAS**

  **Autenticacion y Usuarios**   users, sessions, audit_logs                                                             **3**

  **Catalogo / Menu**            categories, products, product_variants, modifier_groups, modifiers, product_modifiers   **6**

  **Promociones**                promotions, promotion_items                                                             **2**

  **Salon**                      tables                                                                                  **1**

  **Pedidos (Core)**             orders, order_items, order_item_modifiers, order_status_history, order_promotions       **5**

  **Pagos y Caja**               payment_transactions, cash_registers, ticket_sequences                                  **3**

  **Order Tracking**             order_tracking                                                                          **1**

  **Inventario**                 inventory_items, product_ingredients, inventory_movements                               **3**

  **Configuracion**              business_config, product_prep_times, printer_configs                                    **3**

  **Reportes**                   daily_summaries                                                                         **1**

  **Notificaciones**             notifications                                                                           **1**

  **TOTAL**                                                                                                              **29**
  ------------------------------ --------------------------------------------------------------------------------------- -------------------

## 4.2 Relaciones Principales

users \-\-\--1:N\-\-\--\> orders, sessions, audit_logs, cash_registers

categories \--1:N-\> products \--1:N-\> product_variants

products \--N:M\-\--\> modifiers (via product_modifiers + modifier_groups)

orders \-\-\--1:N\-\-\--\> order_items \--1:N-\> order_item_modifiers

orders \-\-\--1:1\-\-\--\> order_tracking, payment_transactions

orders \-\-\--1:N\-\-\--\> order_status_history

products \--N:M\-\--\> inventory_items (via product_ingredients / recetas)

inventory_items \--\> inventory_movements (historial completo)

## 4.3 Preparacion Multi-Tenant

-   **Estrategia:** Shared schema + Row-Level Isolation (tenant_id por fila)

-   **Seguridad:** PostgreSQL RLS policies filtran por tenant_id del JWT

-   **Drizzle:** Filtro global .where(eq(table.tenantId, ctx.tenantId)) en repository base

-   **Migracion estimada:** 2-3 semanas para agregar tenant_id + RLS + middleware NestJS

# 5. DISENO DE API (REST)

API REST completa del backend NestJS. Todos los endpoints (excepto auth y tracking publico) requieren JWT valido. Alineados 1:1 con los 13 modulos, 29 tablas y 65 requerimientos funcionales.

## 5.1 Autenticacion y Sesiones

  ------------ ---------------------------- ------------- ------------------------------------------------------------
  **METODO**   **ENDPOINT**                 **ROL**       **DESCRIPCION**

  **POST**     /api/auth/login              Publico       Login con email + password, retorna access + refresh token

  **POST**     /api/auth/refresh            Auth          Renovar access token con refresh token

  **POST**     /api/auth/logout             Auth          Revocar sesion actual (invalida refresh token)

  **GET**      /api/auth/me                 Auth          Datos del usuario autenticado + rol
  ------------ ---------------------------- ------------- ------------------------------------------------------------

## 5.2 Usuarios

  ------------ ---------------------------- ------------- ----------------------------------------------
  **METODO**   **ENDPOINT**                 **ROL**       **DESCRIPCION**

  **GET**      /api/users                   ADMIN         Listar usuarios (filtros: rol, activo)

  **GET**      /api/users/:id               ADMIN         Detalle de un usuario

  **POST**     /api/users                   ADMIN         Crear usuario (email, nombre, rol, password)

  **PATCH**    /api/users/:id               ADMIN         Editar usuario (nombre, email, rol)

  **PATCH**    /api/users/:id/toggle        ADMIN         Activar/desactivar usuario (soft delete)

  **PATCH**    /api/users/:id/password      ADMIN         Cambiar contrasena de un usuario
  ------------ ---------------------------- ------------- ----------------------------------------------

## 5.3 Categorias

  ------------ ---------------------------- ------------- ---------------------------------------------------------
  **METODO**   **ENDPOINT**                 **ROL**       **DESCRIPCION**

  **GET**      /api/categories              Auth          Listar categorias activas (ordenadas por display_order)

  **GET**      /api/categories/:id          Auth          Detalle de categoria con sus productos

  **POST**     /api/categories              ADMIN         Crear categoria (nombre, icono, orden)

  **PATCH**    /api/categories/:id          ADMIN         Editar categoria

  **PATCH**    /api/categories/:id/toggle   ADMIN         Activar/desactivar categoria

  **PATCH**    /api/categories/reorder      ADMIN         Reordenar categorias (array de ids con nuevo orden)
  ------------ ---------------------------- ------------- ---------------------------------------------------------

## 5.4 Productos y Variantes

  ------------ --------------------------------------- ------------- ------------------------------------------------------------
  **METODO**   **ENDPOINT**                            **ROL**       **DESCRIPCION**

  **GET**      /api/products                           Auth          Listar productos (filtros: category_id, is_active, search)

  **GET**      /api/products/:id                       Auth          Detalle producto con variantes, modifier_groups y receta

  **POST**     /api/products                           ADMIN         Crear producto (nombre, precio, categoria, imagen)

  **PATCH**    /api/products/:id                       ADMIN         Editar producto

  **PATCH**    /api/products/:id/toggle                ADMIN         Activar/desactivar producto

  **POST**     /api/products/:id/variants              ADMIN         Agregar variante (nombre, precio)

  **PATCH**    /api/products/:id/variants/:variantId   ADMIN         Editar variante

  **DELETE**   /api/products/:id/variants/:variantId   ADMIN         Eliminar variante
  ------------ --------------------------------------- ------------- ------------------------------------------------------------

## 5.5 Grupos de Modificadores y Modificadores

  ------------ -------------------------------------------- ------------- --------------------------------------------
  **METODO**   **ENDPOINT**                                 **ROL**       **DESCRIPCION**

  **GET**      /api/modifier-groups                         Auth          Listar grupos con sus modificadores

  **POST**     /api/modifier-groups                         ADMIN         Crear grupo (nombre, min/max selecciones)

  **PATCH**    /api/modifier-groups/:id                     ADMIN         Editar grupo

  **DELETE**   /api/modifier-groups/:id                     ADMIN         Eliminar grupo (si no esta en uso)

  **POST**     /api/modifier-groups/:id/modifiers           ADMIN         Agregar modificador al grupo

  **PATCH**    /api/modifiers/:id                           ADMIN         Editar modificador

  **DELETE**   /api/modifiers/:id                           ADMIN         Eliminar modificador

  **POST**     /api/products/:id/modifier-groups            ADMIN         Vincular grupo de modificadores a producto

  **DELETE**   /api/products/:id/modifier-groups/:groupId   ADMIN         Desvincular grupo de producto
  ------------ -------------------------------------------- ------------- --------------------------------------------

## 5.6 Recetas (Product Ingredients)

  ------------ --------------------------------------------- ------------- ----------------------------------------------------
  **METODO**   **ENDPOINT**                                  **ROL**       **DESCRIPCION**

  **GET**      /api/products/:id/ingredients                 ADMIN         Listar receta (insumos + cantidades por variante)

  **POST**     /api/products/:id/ingredients                 ADMIN         Agregar insumo a receta (item_id, qty, variant_id)

  **PATCH**    /api/products/:id/ingredients/:ingredientId   ADMIN         Editar cantidad en receta

  **DELETE**   /api/products/:id/ingredients/:ingredientId   ADMIN         Quitar insumo de receta
  ------------ --------------------------------------------- ------------- ----------------------------------------------------

## 5.7 Tiempos de Preparacion

  ------------ ------------------------------ ------------- -----------------------------------------------
  **METODO**   **ENDPOINT**                   **ROL**       **DESCRIPCION**

  **GET**      /api/products/:id/prep-times   ADMIN         Listar tiempos estimados por variante

  **POST**     /api/products/:id/prep-times   ADMIN         Definir tiempo estimado (variant_id, minutos)

  **PATCH**    /api/prep-times/:id            ADMIN         Editar tiempo estimado

  **DELETE**   /api/prep-times/:id            ADMIN         Eliminar tiempo estimado
  ------------ ------------------------------ ------------- -----------------------------------------------

## 5.8 Promociones y Combos

  ------------ ----------------------------------- ------------- -------------------------------------------------------
  **METODO**   **ENDPOINT**                        **ROL**       **DESCRIPCION**

  **GET**      /api/promotions                     Auth          Listar promociones activas y vigentes (con items)

  **GET**      /api/promotions/:id                 Auth          Detalle con sus items

  **POST**     /api/promotions                     ADMIN         Crear promocion (nombre, precio, vigencia, items\[\])

  **PATCH**    /api/promotions/:id                 ADMIN         Editar promocion

  **DELETE**   /api/promotions/:id                 ADMIN         Desactivar promocion

  **POST**     /api/promotions/:id/items           ADMIN         Agregar producto al combo

  **DELETE**   /api/promotions/:id/items/:itemId   ADMIN         Quitar producto del combo
  ------------ ----------------------------------- ------------- -------------------------------------------------------

## 5.9 Mesas

  ------------ ---------------------------- ------------- ------------------------------------------------
  **METODO**   **ENDPOINT**                 **ROL**       **DESCRIPCION**

  **GET**      /api/tables                  Auth          Listar mesas con estado actual

  **GET**      /api/tables/:id              Auth          Detalle mesa (con pedido activo si tiene)

  **POST**     /api/tables                  ADMIN         Crear mesa (numero, capacidad, zona)

  **PATCH**    /api/tables/:id              ADMIN         Editar mesa

  **PATCH**    /api/tables/:id/status       CAJERO        Cambiar estado (AVAILABLE, OCCUPIED, RESERVED)

  **PATCH**    /api/tables/:id/toggle       ADMIN         Activar/desactivar mesa
  ------------ ---------------------------- ------------- ------------------------------------------------

## 5.10 Pedidos (Orders) - Core

  ------------ -------------------------------- ------------- --------------------------------------------------------------
  **METODO**   **ENDPOINT**                     **ROL**       **DESCRIPCION**

  **POST**     /api/orders                      CAJERO        Crear pedido completo (items + pago + tracking + inventario)

  **GET**      /api/orders                      CAJERO        Listar pedidos (filtros: fecha, estado, tipo, mesa, cajero)

  **GET**      /api/orders/:id                  CAJERO        Detalle con items, modificadores, pago, tracking

  **GET**      /api/orders/active               CAJERO        Pedidos activos (no entregados ni cancelados)

  **GET**      /api/orders/:id/status-history   Auth          Historial cambios de estado del pedido

  **PATCH**    /api/orders/:id/status           COCINA        Avanzar estado (PREPARING, IN_OVEN, READY)

  **PATCH**    /api/orders/:id/deliver          CAJERO        Marcar entregado (libera mesa si aplica)

  **PATCH**    /api/orders/:id/cancel           ADMIN         Cancelar (motivo obligatorio, refund, reponer inventario)
  ------------ -------------------------------- ------------- --------------------------------------------------------------

## 5.11 Pagos (Payment Transactions)

  ------------ ------------------------------ ------------- -------------------------------------------------------
  **METODO**   **ENDPOINT**                   **ROL**       **DESCRIPCION**

  **GET**      /api/payments                  ADMIN         Listar transacciones (filtros: metodo, fecha, estado)

  **GET**      /api/payments/:id              ADMIN         Detalle de transaccion

  **GET**      /api/payments/order/:orderId   CAJERO        Transaccion asociada a un pedido

  **POST**     /api/payments/:id/refund       ADMIN         Registrar devolucion (con motivo)
  ------------ ------------------------------ ------------- -------------------------------------------------------

## 5.12 Caja (Cash Register)

  ------------ -------------------------------- ------------- ----------------------------------------------
  **METODO**   **ENDPOINT**                     **ROL**       **DESCRIPCION**

  **POST**     /api/cash-register/open          CAJERO        Abrir sesion de caja (monto inicial)

  **GET**      /api/cash-register/current       CAJERO        Sesion activa del usuario actual

  **POST**     /api/cash-register/close         CAJERO        Cerrar caja (monto real contado)

  **GET**      /api/cash-register/:id/summary   ADMIN         Resumen detallado de una sesion

  **GET**      /api/cash-register/history       ADMIN         Historial sesiones (filtros: usuario, fecha)
  ------------ -------------------------------- ------------- ----------------------------------------------

## 5.13 Order Tracking (Publico)

  ------------ ---------------------------- ------------- -------------------------------------------------
  **METODO**   **ENDPOINT**                 **ROL**       **DESCRIPCION**

  **GET**      /api/tracking/:code          Publico       Estado actual del pedido por codigo de tracking
  ------------ ---------------------------- ------------- -------------------------------------------------

## 5.14 Inventario

  ------------ ---------------------------- ------------- ------------------------------------------------------
  **METODO**   **ENDPOINT**                 **ROL**       **DESCRIPCION**

  **GET**      /api/inventory               ADMIN         Listar insumos (filtros: activo, stock bajo, search)

  **GET**      /api/inventory/:id           ADMIN         Detalle con movimientos recientes

  **POST**     /api/inventory               ADMIN         Crear insumo (nombre, unidad, stock, min, costo)

  **PATCH**    /api/inventory/:id           ADMIN         Editar insumo

  **POST**     /api/inventory/:id/restock   ADMIN         Registrar entrada (cantidad, proveedor, costo)

  **POST**     /api/inventory/:id/adjust    ADMIN         Ajuste manual de stock (cantidad, motivo)

  **GET**      /api/inventory/low-stock     ADMIN         Insumos por debajo del stock minimo

  **GET**      /api/inventory/movements     ADMIN         Historial movimientos (filtros: insumo, tipo, fecha)
  ------------ ---------------------------- ------------- ------------------------------------------------------

## 5.15 Reportes

  ------------ -------------------------------------- ------------- -----------------------------------------------
  **METODO**   **ENDPOINT**                           **ROL**       **DESCRIPCION**

  **GET**      /api/reports/sales/today               CAJERO        Ventas del dia actual (resumen rapido)

  **GET**      /api/reports/sales                     ADMIN         Ventas por rango fechas (?from=&to=)

  **GET**      /api/reports/sales/by-category         ADMIN         Ventas agrupadas por categoria

  **GET**      /api/reports/sales/by-type             ADMIN         Ventas salon vs para llevar

  **GET**      /api/reports/sales/by-payment-method   ADMIN         Ventas por metodo de pago

  **GET**      /api/reports/top-products              ADMIN         Ranking productos mas vendidos (?limit=)

  **GET**      /api/reports/cash-register/:id         ADMIN         Reporte detallado cierre de caja

  **GET**      /api/reports/inventory/low-stock       ADMIN         Reporte insumos bajo stock

  **GET**      /api/reports/cancellations             ADMIN         Pedidos cancelados (?from=&to=)

  **GET**      /api/reports/prep-times                ADMIN         Tiempos promedio preparacion por producto

  **GET**      /api/reports/daily-summary             ADMIN         Resumenes diarios pre-calculados (?from=&to=)
  ------------ -------------------------------------- ------------- -----------------------------------------------

## 5.16 Configuracion del Negocio

  ------------ ---------------------------- ------------- --------------------------------------------------------
  **METODO**   **ENDPOINT**                 **ROL**       **DESCRIPCION**

  **GET**      /api/config                  ADMIN         Obtener configuracion completa

  **PATCH**    /api/config                  ADMIN         Actualizar (nombre, RUC, impuesto, tracking URL, etc.)
  ------------ ---------------------------- ------------- --------------------------------------------------------

## 5.17 Notificaciones

  ------------ --------------------------------- ------------- ---------------------------------------------
  **METODO**   **ENDPOINT**                      **ROL**       **DESCRIPCION**

  **GET**      /api/notifications                Auth          Listar notificaciones del usuario (por rol)

  **GET**      /api/notifications/unread-count   Auth          Cantidad no leidas (badge campanita)

  **PATCH**    /api/notifications/:id/read       Auth          Marcar como leida

  **PATCH**    /api/notifications/read-all       Auth          Marcar todas como leidas
  ------------ --------------------------------- ------------- ---------------------------------------------

**WebSocket:** NotificationsGateway emite eventos push via WebSocket para actualizar campanita en tiempo real sin polling.

## 5.18 Impresoras

  ------------ ---------------------------- ------------- -------------------------------------------------------
  **METODO**   **ENDPOINT**                 **ROL**       **DESCRIPCION**

  **GET**      /api/printers                ADMIN         Listar impresoras configuradas

  **POST**     /api/printers                ADMIN         Registrar impresora (nombre, ubicacion, conexion, IP)

  **PATCH**    /api/printers/:id            ADMIN         Editar configuracion

  **DELETE**   /api/printers/:id            ADMIN         Eliminar impresora

  **PATCH**    /api/printers/:id/default    ADMIN         Marcar como default de su ubicacion
  ------------ ---------------------------- ------------- -------------------------------------------------------

## 5.19 Auditoria

  ------------ --------------------------------------- ------------- ----------------------------------------------------------
  **METODO**   **ENDPOINT**                            **ROL**       **DESCRIPCION**

  **GET**      /api/audit-logs                         ADMIN         Log auditoria (filtros: usuario, accion, entidad, fecha)

  **GET**      /api/audit-logs/:entityType/:entityId   ADMIN         Historial cambios de una entidad
  ------------ --------------------------------------- ------------- ----------------------------------------------------------

**Nota:** audit_logs se generan via AuditInterceptor global. Son inmutables: no hay endpoints para crear/editar/eliminar.

+---------------------------------------------------------------------------------------------------------------------------------------------+
| **TOTAL: \~85 ENDPOINTS EN 19 GRUPOS**                                                                                                      |
|                                                                                                                                             |
| Cada endpoint mapeado a un RF, una tabla BD y un modulo NestJS. Documentacion interactiva via Swagger UI en /api/docs una vez implementado. |
+---------------------------------------------------------------------------------------------------------------------------------------------+

# 6. PLAN DE IMPLEMENTACION

El desarrollo del MVP se estructura en sprints de 1 semana, con un total estimado de 10-12 semanas. Cada sprint tiene entregables concretos y demostrables. Ajustado para incluir los 13 modulos del backend.

## 6.1 Cronograma por Sprints

  --------------- ------------ ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- ---------------
  **SPRINT**      **SEMANA**   **ENTREGABLES**                                                                                                                                                        **PRIORIDAD**

  **Sprint 0**    1            Setup monorepo Turborepo + Next.js + NestJS + \@pos-pizza/shared. Config Supabase + Drizzle (29 tablas). Auth basico (JWT + Passport + sessions). Layout base.         Critica

  **Sprint 1**    2            ProductsModule completo: CRUD categorias, productos, variantes, modifier_groups, modifiers. Seed data pizzeria piloto. Frontend admin menu.                            Critica

  **Sprint 2**    3            Pantalla POS: seleccion tipo pedido (salon/llevar), categorias, grid productos, variantes, modificadores, carrito lateral. TablesModule + mapa mesas.                  Critica

  **Sprint 3**    4            OrdersModule + PaymentsModule: crear pedido, payment_transactions (Strategy Pattern cash/digital), calculo totales/impuesto, ticket_sequences (correlativo atomico).   Critica

  **Sprint 4**    5            CashRegisterModule: apertura/cierre caja, resumen turno. PromotionsModule: CRUD combos, vigencia, aplicar en POS.                                                      Alta

  **Sprint 5**    6            Pantalla cocina (KDS): order_status_history, estados tematicos, boton transicion secuencial, Supabase Realtime, indicador tiempo.                                      Alta

  **Sprint 6**    7            TrackingModule: generacion codigo + QR, pagina publica responsive (animaciones tematicas), timer aproximado, product_prep_times.                                       Alta

  **Sprint 7**    8            InventoryModule: CRUD insumos, product_ingredients (recetas), descuento automatico por venta, inventory_movements, alertas stock bajo.                                 Alta

  **Sprint 8**    9            ReportsModule: ventas dia/periodo, ranking productos, cierre caja, daily_summaries. NotificationsModule: WebSocket Gateway, campanita. AuditInterceptor.               Media

  **Sprint 9**    10           PrinterModule: config impresoras. Integracion WebUSB + ESC/POS: ticket con QR + comanda cocina. Testing con impresora real.                                            Alta

  **Sprint 10**   11           QA completo: testing datos reales, ajustes UX, fix bugs, optimizacion rendimiento, modo offline basico (Service Worker + IndexedDB).                                   Critica

  **Deploy**      12           Deploy produccion: Vercel (web) + Railway (api) + Supabase (DB). Capacitacion presencial al personal. Acompanamiento en vivo 1 semana.                                 Critica
  --------------- ------------ ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- ---------------

# 7. SCRIPTS, COMANDOS Y PIPELINES

Referencia completa de todos los comandos necesarios para desarrollo, migraciones, despliegue y mantenimiento del proyecto. Usar pnpm como package manager (recomendado para monorepos).

## 7.1 Setup Inicial (Primera vez)

Comandos para clonar y configurar el proyecto desde cero:

\# 1. Clonar el repositorio

git clone https://github.com/brunoalvarez/pos-pizza.git

cd pos-pizza

\# 2. Instalar dependencias (todas las apps + packages)

pnpm install

\# 3. Copiar variables de entorno

cp .env.example .env

cp apps/web/.env.example apps/web/.env.local

cp apps/api/.env.example apps/api/.env

\# -\> Editar los archivos .env con las credenciales reales

\# 4. Levantar PostgreSQL local (si no usas Supabase directo)

docker compose -f docker/docker-compose.yml up -d

\# 5. Ejecutar migraciones (crear las 29 tablas)

pnpm \--filter api db:migrate

\# 6. Ejecutar seed data (datos iniciales pizzeria piloto)

pnpm \--filter api db:seed

\# 7. Levantar todo en modo desarrollo

pnpm dev

## 7.2 Scripts del Root (package.json raiz)

Comandos globales que ejecutan tareas en todas las apps via Turborepo:

  ------------------------ -------------------------------------------------------------------------
  **COMANDO**              **DESCRIPCION**

  **pnpm dev**             Levanta TODAS las apps en paralelo (web:3000 + api:3001) con hot reload

  **pnpm build**           Build de produccion de todas las apps (Next.js + NestJS)

  **pnpm lint**            Ejecuta ESLint en todas las apps y packages

  **pnpm format**          Ejecuta Prettier en todo el proyecto

  **pnpm type-check**      Verifica tipos TypeScript en todas las apps y packages

  **pnpm clean**           Elimina node_modules, .next, dist de todas las apps

  **pnpm test**            Ejecuta tests unitarios en todas las apps

  **pnpm test:e2e**        Ejecuta tests end-to-end
  ------------------------ -------------------------------------------------------------------------

## 7.3 Scripts del Frontend (apps/web/package.json)

  ------------------------------ ----------------------------------------------------------
  **COMANDO**                    **DESCRIPCION**

  **pnpm \--filter web dev**     Next.js dev server en http://localhost:3000 (hot reload)

  **pnpm \--filter web build**   Build de produccion Next.js (output: .next/)

  **pnpm \--filter web start**   Iniciar build de produccion localmente

  **pnpm \--filter web lint**    ESLint sobre el codigo frontend
  ------------------------------ ----------------------------------------------------------

## 7.4 Scripts del Backend (apps/api/package.json)

  ----------------------------------- ---------------------------------------------------------
  **COMANDO**                         **DESCRIPCION**

  **pnpm \--filter api dev**          NestJS dev server en http://localhost:3001 (watch mode)

  **pnpm \--filter api build**        Build de produccion NestJS (output: dist/)

  **pnpm \--filter api start:prod**   Iniciar build de produccion (node dist/main.js)

  **pnpm \--filter api lint**         ESLint sobre el codigo backend

  **pnpm \--filter api test**         Ejecutar tests unitarios (Jest)

  **pnpm \--filter api test:e2e**     Ejecutar tests end-to-end

  **pnpm \--filter api test:cov**     Tests con reporte de cobertura
  ----------------------------------- ---------------------------------------------------------

## 7.5 Scripts de Base de Datos (Drizzle ORM)

  ------------------------------------ -------------------------------------------------------------------------------
  **COMANDO**                          **DESCRIPCION**

  **pnpm \--filter api db:generate**   Genera migracion SQL a partir del schema Drizzle (drizzle-kit generate)

  **pnpm \--filter api db:migrate**    Ejecuta migraciones pendientes contra la BD (drizzle-kit migrate)

  **pnpm \--filter api db:push**       Push directo del schema a la BD sin generar migracion (dev rapido)

  **pnpm \--filter api db:studio**     Abre Drizzle Studio (GUI visual para explorar la BD en http://localhost:4983)

  **pnpm \--filter api db:seed**       Ejecuta script de seed (datos iniciales: usuarios, menu, mesas, config)

  **pnpm \--filter api db:reset**      Elimina todas las tablas + re-migra + re-seed (CUIDADO: borra todo)
  ------------------------------------ -------------------------------------------------------------------------------

## 7.6 Scripts de Docker (Desarrollo Local)

  --------------------------------------------------------- -----------------------------------------------------
  **COMANDO**                                               **DESCRIPCION**

  **docker compose -f docker/docker-compose.yml up -d**     Levantar PostgreSQL 15 + pgAdmin 4 en background

  **docker compose -f docker/docker-compose.yml down**      Detener y remover contenedores

  **docker compose -f docker/docker-compose.yml down -v**   Detener + eliminar volumenes (borra datos BD local)

  **docker compose -f docker/docker-compose.yml logs -f**   Ver logs en tiempo real
  --------------------------------------------------------- -----------------------------------------------------

## 7.7 Configuracion Turborepo (turbo.json)

Turborepo orquesta los scripts del monorepo con caching inteligente y ejecucion en paralelo:

{

\"\$schema\": \"https://turbo.build/schema.json\",

\"globalDependencies\": \[\".env\"\],

\"pipeline\": {

\"dev\": {

\"cache\": false,

\"persistent\": true

},

\"build\": {

\"dependsOn\": \[\"\^build\"\],

\"outputs\": \[\".next/\*\*\", \"dist/\*\*\"\]

},

\"lint\": {},

\"type-check\": {},

\"test\": {

\"dependsOn\": \[\"build\"\]

}

}

}

**dependsOn: \[\'\^build\'\]:** Significa que antes de hacer build de una app, se hace build de sus dependencias (ej: \@pos-pizza/shared se buildea antes que web y api).

**cache: false en dev:** El modo desarrollo no se cachea (siempre levanta fresh). Los builds si se cachean para velocidad.

## 7.8 Scripts de Deploy

  --------------------------------- ----------------------------------------------------------------------------------------------------------------
  **PLATAFORMA / COMANDO**          **DESCRIPCION**

  **Vercel (Frontend)**             Auto-deploy desde GitHub. Push a main = deploy produccion. Push a branch = preview deploy.

  **vercel \--prod**                Deploy manual a produccion (si se necesita)

  **vercel**                        Deploy manual a preview

  **Railway (Backend)**             Auto-deploy desde GitHub. Configurar: root directory = apps/api, build = pnpm build, start = node dist/main.js

  **railway up**                    Deploy manual desde CLI

  **Supabase (BD)**                 Migraciones se ejecutan manualmente via CLI o en CI/CD

  **supabase db push**              Aplicar migraciones a Supabase remoto

  **supabase db reset \--linked**   Reset BD remota (SOLO desarrollo, NUNCA produccion)
  --------------------------------- ----------------------------------------------------------------------------------------------------------------

## 7.9 Flujo de Trabajo Diario del Desarrollador

Resumen del flujo tipico de desarrollo:

\# Inicio del dia

cd pos-pizza

git pull origin main \# Traer ultimos cambios

pnpm install \# Instalar deps si cambiaron

pnpm dev \# Levantar web + api en paralelo

\# Desarrollo: modificar schema de BD

\# 1. Editar archivo en apps/api/src/database/schema/

\# 2. Generar migracion:

pnpm \--filter api db:generate

\# 3. Aplicar migracion:

pnpm \--filter api db:migrate

\# 4. Verificar en Drizzle Studio:

pnpm \--filter api db:studio

\# Antes de commit

pnpm lint \# Verificar estilo

pnpm type-check \# Verificar tipos

pnpm test \# Correr tests

\# Commit y push

git add .

git commit -m \"feat(orders): implementar creacion de pedido con pago\"

git push origin feature/orders-module

# 8. COSTOS DE INFRAESTRUCTURA CLOUD

Costos mensuales estimados para mantener el MVP en produccion:

  -------------------------------------- ------------------------------------ -------------------------
  **SERVICIO**                           **PLAN**                             **COSTO MENSUAL**

  **Vercel (Frontend)**                  Hobby (Free) o Pro (\$20/mes)        \$0 - \$20 USD

  **Railway (Backend NestJS)**           Starter (\$5/mes) o Developer        \$5 - \$10 USD

  **Supabase (PostgreSQL + Realtime)**   Free Tier (500MB DB, 2GB transfer)   \$0 USD

  **Dominio .com**                       Registro anual \~\$12/ano            \~\$1 USD

  **TOTAL MVP (escenario minimo)**                                            **\$5 - \$6 USD/mes**

  **TOTAL MVP (escenario Pro)**                                               **\$31 - \$36 USD/mes**
  -------------------------------------- ------------------------------------ -------------------------

***Nota:** El costo de infraestructura cloud del MVP es de \~\$5-6 USD/mes en el escenario minimo (\~S/. 19-23). Los costos de hardware (impresora, tablet, internet) se detallan en el documento de Analisis de Negocio (Fase 1, seccion 10.5).*

# 9. ROADMAP POST-MVP

  ------------- -------------------------------------------------------------------------------------------------------- --------------
  **FASE**      **FEATURES**                                                                                             **TIMELINE**

  **Fase 2**    Multi-tenant: tenant_id en schema, RLS PostgreSQL, onboarding de nuevos negocios, dashboard por tenant   +6-8 sem

  **Fase 3**    Modulo delivery: zonas, riders, tracking en ruta, integracion Rappi/PedidosYa                            +4-6 sem

  **Fase 4**    Facturacion electronica SUNAT: boleta/factura digital, integracion con OSE                               +3-4 sem

  **Fase 5**    App movil cliente: carta digital QR, pedido anticipado, historial                                        +6-8 sem

  **Fase 6**    Fidelizacion: programa de puntos, cupones, descuentos por frecuencia                                     +3-4 sem

  **Fase 7**    Adaptacion multi-rubro: generalizacion del POS para pollerias, cafeterias, etc.                          +8-12 sem
  ------------- -------------------------------------------------------------------------------------------------------- --------------

# 10. PROXIMOS PASOS

Con ambos documentos (Analisis de Negocio + Arquitectura Tecnica) validados, los siguientes pasos concretos son:

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **LISTO PARA DESARROLLO**                                                                                                                                                                                                                      |
|                                                                                                                                                                                                                                                |
| Ambas fases de documentacion estan completas. El proyecto tiene analisis de negocio, requerimientos, flujos, arquitectura, stack, modelado de BD, API design y plan de sprints. El siguiente paso es iniciar el Sprint 0 (setup del proyecto). |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**1.** Validar este documento de arquitectura y confirmar el stack tecnologico.

**2.** Crear el repositorio monorepo en GitHub con la estructura definida en la seccion 3.

**3.** Configurar Supabase project, crear schema inicial con Drizzle migrations.

**4.** Configurar CI/CD: Vercel para frontend, Railway para backend.

**5.** Disenar wireframes/mockups de las pantallas principales para validar UX.

**6.** Iniciar Sprint 0: setup del monorepo, auth basico, layout base.

**7.** Obtener datos reales de la pizzeria piloto: carta completa, precios, combos, cantidad de mesas.

*Documento preparado por Bruno Alvarez - Full Stack Developer*

*POS Pizza - Arquitectura Tecnica v1.3 - Marzo 2026*

*Documento Interno - Confidencial*
