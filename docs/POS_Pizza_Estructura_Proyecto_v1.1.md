# POS PIZZA - Estructura Completa del Proyecto
## Monorepo Turborepo | Next.js 14+ | NestJS | Drizzle ORM | PostgreSQL (Supabase)
### Versión 1.1 - Marzo 2026 | Alineado con Arquitectura Técnica v1.3 + Modelado BD v1.0

---

```
pos-pizza/
│
├── apps/
│   ├── web/                                    # ═══ NEXT.JS 14+ (FRONTEND) ═══
│   │   ├── src/
│   │   │   ├── app/                            # App Router (rutas y layouts)
│   │   │   │   │
│   │   │   │   ├── (auth)/                     # ── Grupo: Autenticación ──
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── page.tsx            # Pantalla login (email + password)
│   │   │   │   │   └── layout.tsx              # Layout centrado, sin sidebar, público
│   │   │   │   │
│   │   │   │   ├── (pos)/                      # ── Grupo: POS Cajero ──
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   └── page.tsx            # Vista principal: mapa mesas + pedidos activos
│   │   │   │   │   ├── new-order/
│   │   │   │   │   │   └── page.tsx            # Toma de pedido: categorías → productos → carrito
│   │   │   │   │   ├── checkout/
│   │   │   │   │   │   └── page.tsx            # Cobro: método pago, monto, vuelto, confirmar
│   │   │   │   │   ├── cash-register/
│   │   │   │   │   │   ├── open/
│   │   │   │   │   │   │   └── page.tsx        # Apertura de caja (monto inicial)
│   │   │   │   │   │   └── close/
│   │   │   │   │   │       └── page.tsx        # Cierre de caja (monto real, resumen)
│   │   │   │   │   └── layout.tsx              # Layout POS: sidebar mínimo, optimizado touch
│   │   │   │   │
│   │   │   │   ├── (kitchen)/                  # ── Grupo: Pantalla Cocina (KDS) ──
│   │   │   │   │   ├── page.tsx                # Kitchen Display: tarjetas pedidos tiempo real
│   │   │   │   │   └── layout.tsx              # Layout fullscreen, fondo oscuro, sin sidebar
│   │   │   │   │
│   │   │   │   ├── (admin)/                    # ── Grupo: Panel Administración ──
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   └── page.tsx            # Dashboard: métricas, alertas, ventas hoy
│   │   │   │   │   ├── menu/
│   │   │   │   │   │   ├── categories/
│   │   │   │   │   │   │   └── page.tsx        # CRUD categorías (nombre, icono, orden)
│   │   │   │   │   │   ├── products/
│   │   │   │   │   │   │   ├── page.tsx        # Lista productos (tabla filtros/paginación)
│   │   │   │   │   │   │   ├── new/
│   │   │   │   │   │   │   │   └── page.tsx    # Crear producto (variantes, modifiers, receta, prep time)
│   │   │   │   │   │   │   └── [id]/
│   │   │   │   │   │   │       └── page.tsx    # Editar producto existente
│   │   │   │   │   │   ├── modifiers/
│   │   │   │   │   │   │   └── page.tsx        # Gestión grupos modificadores + modificadores
│   │   │   │   │   │   └── promotions/
│   │   │   │   │   │       └── page.tsx        # CRUD combos/promociones (items, precio, vigencia)
│   │   │   │   │   ├── tables/
│   │   │   │   │   │   └── page.tsx            # Gestión mesas (número, capacidad, zona, estado)
│   │   │   │   │   ├── inventory/
│   │   │   │   │   │   ├── page.tsx            # Lista insumos + indicador stock bajo
│   │   │   │   │   │   ├── movements/
│   │   │   │   │   │   │   └── page.tsx        # Historial movimientos (entradas, salidas, ajustes)
│   │   │   │   │   │   └── restock/
│   │   │   │   │   │       └── page.tsx        # Registrar entrada (compra/reposición)
│   │   │   │   │   ├── users/
│   │   │   │   │   │   └── page.tsx            # CRUD usuarios + roles (ADMIN/CAJERO/COCINA)
│   │   │   │   │   ├── reports/
│   │   │   │   │   │   ├── sales/
│   │   │   │   │   │   │   └── page.tsx        # Reporte ventas (diario, rango, por categoría, por tipo)
│   │   │   │   │   │   ├── cash-register/
│   │   │   │   │   │   │   └── page.tsx        # Reportes cierre de caja (por sesión)
│   │   │   │   │   │   ├── inventory/
│   │   │   │   │   │   │   └── page.tsx        # Reporte inventario bajo stock
│   │   │   │   │   │   └── cancellations/
│   │   │   │   │   │       └── page.tsx        # Reporte pedidos cancelados (motivo, usuario)
│   │   │   │   │   ├── printers/
│   │   │   │   │   │   └── page.tsx            # Config impresoras (caja + cocina)
│   │   │   │   │   ├── settings/
│   │   │   │   │   │   └── page.tsx            # Config negocio (nombre, RUC, impuesto, tracking)
│   │   │   │   │   ├── audit/
│   │   │   │   │   │   └── page.tsx            # Log auditoría (solo lectura, filtros)
│   │   │   │   │   └── layout.tsx              # Layout admin: sidebar completo + NotificationBell
│   │   │   │   │
│   │   │   │   ├── (tracking)/                 # ── Grupo: Order Tracking (PÚBLICO) ──
│   │   │   │   │   ├── page.tsx                # Pantalla para ingresar código manualmente
│   │   │   │   │   ├── [code]/
│   │   │   │   │   │   └── page.tsx            # Tracking por código (destino del QR)
│   │   │   │   │   └── layout.tsx              # Layout público temático pizzería, sin auth
│   │   │   │   │
│   │   │   │   ├── layout.tsx                  # Root layout (providers, fonts, metadata)
│   │   │   │   ├── page.tsx                    # Redirect: si auth → POS, si no → login
│   │   │   │   └── not-found.tsx               # Página 404
│   │   │   │
│   │   │   ├── components/                     # Componentes React reutilizables
│   │   │   │   ├── ui/                         # shadcn/ui (instalados bajo demanda)
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── select.tsx
│   │   │   │   │   ├── table.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── badge.tsx
│   │   │   │   │   ├── toast.tsx
│   │   │   │   │   ├── tabs.tsx
│   │   │   │   │   ├── sheet.tsx
│   │   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   │   ├── popover.tsx
│   │   │   │   │   ├── separator.tsx
│   │   │   │   │   ├── skeleton.tsx
│   │   │   │   │   └── scroll-area.tsx
│   │   │   │   │
│   │   │   │   ├── pos/                        # Componentes POS Cajero
│   │   │   │   │   ├── CategoryGrid.tsx        # Grid categorías (iconos grandes, táctil)
│   │   │   │   │   ├── ProductGrid.tsx         # Grid productos por categoría (imagen, nombre, precio)
│   │   │   │   │   ├── CartSidebar.tsx         # Carrito lateral: items, cantidades, subtotales, total
│   │   │   │   │   ├── VariantSelector.tsx     # Selector tamaño pizza (botones grandes)
│   │   │   │   │   ├── ModifierSelector.tsx    # Selector toppings/extras (checkboxes con precio)
│   │   │   │   │   ├── PromoSelector.tsx       # Selector combos/promociones vigentes
│   │   │   │   │   ├── PaymentDialog.tsx       # Diálogo cobro: método pago, monto, vuelto
│   │   │   │   │   ├── TableMap.tsx            # Mapa visual mesas (estado por color)
│   │   │   │   │   └── OrderTypeSelector.tsx   # Selector: SALÓN o PARA LLEVAR
│   │   │   │   │
│   │   │   │   ├── kitchen/                    # Componentes Pantalla Cocina
│   │   │   │   │   ├── OrderCard.tsx           # Tarjeta pedido: ticket#, tipo, items, modificadores
│   │   │   │   │   ├── StatusButton.tsx        # Botón transición estado (1 botón secuencial)
│   │   │   │   │   ├── TimeIndicator.tsx       # Indicador tiempo (verde/amarillo/rojo)
│   │   │   │   │   └── OrderTypeTag.tsx        # Tag: SALÓN (azul) / PARA LLEVAR (naranja)
│   │   │   │   │
│   │   │   │   ├── tracking/                   # Componentes Order Tracking Cliente
│   │   │   │   │   ├── ProgressBar.tsx         # Barra progreso 4 estados con iconos temáticos
│   │   │   │   │   ├── StatusIcon.tsx          # Ícono animado por estado (masa, horno, check)
│   │   │   │   │   ├── TimerDisplay.tsx        # "Tu pedido estará listo en aprox. X minutos"
│   │   │   │   │   ├── StatusMessage.tsx       # Mensaje temático ("Estamos preparando tu pizza...")
│   │   │   │   │   └── CelebrationAnimation.tsx # Animación confetti cuando pedido está LISTO
│   │   │   │   │
│   │   │   │   ├── admin/                      # Componentes Panel Admin
│   │   │   │   │   ├── DataTable.tsx           # Tabla genérica: filtros, búsqueda, paginación
│   │   │   │   │   ├── StatsCard.tsx           # Card métrica/KPI (icono, valor, tendencia)
│   │   │   │   │   ├── SalesChart.tsx          # Gráfico ventas Recharts (línea, barra)
│   │   │   │   │   └── AlertBadge.tsx          # Badge alerta (stock bajo, cancelaciones)
│   │   │   │   │
│   │   │   │   └── common/                     # Componentes Compartidos
│   │   │   │       ├── Navbar.tsx              # Barra superior (logo, título, usuario)
│   │   │   │       ├── Sidebar.tsx             # Menú lateral con links por módulo
│   │   │   │       ├── LoadingSpinner.tsx      # Spinner carga
│   │   │   │       ├── NotificationBell.tsx    # Campanita con badge no leídas (WebSocket)
│   │   │   │       ├── ProtectedRoute.tsx      # HOC: verifica auth + rol antes de renderizar
│   │   │   │       ├── EmptyState.tsx          # Estado vacío con ilustración y acción
│   │   │   │       └── ConfirmDialog.tsx       # Diálogo confirmación reutilizable
│   │   │   │
│   │   │   ├── hooks/                          # Custom Hooks (7)
│   │   │   │   ├── useAuth.ts                  # Estado auth + login() + logout() + getUser()
│   │   │   │   ├── useCart.ts                  # Carrito POS: addItem, removeItem, updateQty, clear, totals
│   │   │   │   ├── useRealtimeOrders.ts        # Suscripción Supabase Realtime: pedidos nuevos + estados
│   │   │   │   ├── useRealtimeTracking.ts      # Suscripción tracking: estado pedido específico (público)
│   │   │   │   ├── useNotifications.ts         # Suscripción notificaciones via WebSocket (campanita)
│   │   │   │   ├── usePrinter.ts               # Impresión: connect, printTicket, printComanda (WebUSB)
│   │   │   │   └── useApi.ts                   # Wrapper fetch: JWT auto-refresh, error handling, tipado
│   │   │   │
│   │   │   ├── lib/                            # Utilidades y Clientes
│   │   │   │   ├── api-client.ts               # Cliente HTTP tipado para NestJS (baseURL, headers JWT)
│   │   │   │   ├── supabase-client.ts          # Supabase client (SOLO Realtime, NO queries directas)
│   │   │   │   ├── qr-generator.ts             # Generar QR code como data URL para impresión
│   │   │   │   ├── utils.ts                    # Helpers generales frontend
│   │   │   │   └── printer/                    # Módulo de impresión ESC/POS
│   │   │   │       ├── escpos-builder.ts       # Constructor comandos ESC/POS (texto, negrita, QR, corte)
│   │   │   │       ├── ticket-template.ts      # Template ticket venta: header, items, total, QR tracking
│   │   │   │       ├── comanda-template.ts     # Template comanda cocina: ticket#, tipo, items, mods
│   │   │   │       └── webusb-adapter.ts       # Adaptador WebUSB: connect(), print(data), disconnect()
│   │   │   │
│   │   │   ├── stores/                         # Zustand State Management (4)
│   │   │   │   ├── auth-store.ts               # user, token, isAuthenticated, login(), logout()
│   │   │   │   ├── cart-store.ts               # items[], addItem(), removeItem(), clear(), totals
│   │   │   │   ├── cash-register-store.ts      # currentRegister, isOpen, openingAmount
│   │   │   │   └── notification-store.ts       # notifications[], unreadCount, markRead()
│   │   │   │
│   │   │   └── styles/
│   │   │       ├── globals.css                 # @tailwind base/components/utilities + custom CSS vars
│   │   │       └── tracking-theme.css          # Animaciones CSS: fuego horno, manos amasando, confetti
│   │   │
│   │   ├── public/                             # Assets estáticos
│   │   │   ├── icons/                          # Íconos estados tracking (SVG animados)
│   │   │   │   ├── order-received.svg
│   │   │   │   ├── preparing-dough.svg
│   │   │   │   ├── in-oven.svg
│   │   │   │   └── order-ready.svg
│   │   │   ├── logo.svg                        # Logo POS Pizza
│   │   │   └── favicon.ico
│   │   │
│   │   ├── next.config.js                      # Config Next.js (output, images, rewrites)
│   │   ├── tailwind.config.ts                  # Tailwind: colores custom, fonts, extend theme
│   │   ├── postcss.config.js                   # PostCSS para Tailwind
│   │   ├── tsconfig.json                       # TypeScript config (paths: @pos-pizza/shared)
│   │   ├── .env.local                          # Variables entorno frontend (NO commitear)
│   │   └── package.json                        # Dependencias frontend
│   │
│   │
│   └── api/                                    # ═══ NESTJS (BACKEND) - 13 MÓDULOS ═══
│       ├── src/
│       │   ├── modules/                        # ── Módulos de Negocio ──
│       │   │   │
│       │   │   ├── auth/                       # AuthModule (JWT, Passport, Sessions)
│       │   │   │   ├── auth.module.ts
│       │   │   │   ├── auth.controller.ts      # POST /login, /refresh, /logout, GET /me
│       │   │   │   ├── auth.service.ts         # Login, JWT generation, refresh, revoke
│       │   │   │   ├── strategies/
│       │   │   │   │   ├── jwt.strategy.ts     # Passport JWT strategy (validates token)
│       │   │   │   │   └── local.strategy.ts   # Passport Local (email + password validation)
│       │   │   │   └── dto/
│       │   │   │       ├── login.dto.ts
│       │   │   │       └── token-response.dto.ts
│       │   │   │
│       │   │   ├── users/                      # UsersModule
│       │   │   │   ├── users.module.ts
│       │   │   │   ├── users.controller.ts     # GET /, /:id, POST /, PATCH /:id, /toggle, /password
│       │   │   │   ├── users.service.ts
│       │   │   │   ├── users.repository.ts     # Drizzle queries → users table
│       │   │   │   └── dto/
│       │   │   │       ├── create-user.dto.ts
│       │   │   │       └── update-user.dto.ts
│       │   │   │
│       │   │   ├── products/                   # ProductsModule (Categorías + Productos + Variantes + Modifiers)
│       │   │   │   ├── products.module.ts
│       │   │   │   ├── products.controller.ts  # CRUD productos + variantes + toggle + ingredients + prep-times
│       │   │   │   ├── categories.controller.ts # CRUD categorías + toggle + reorder
│       │   │   │   ├── modifiers.controller.ts # CRUD modifier_groups + modifiers + vincular a productos
│       │   │   │   ├── products.service.ts
│       │   │   │   ├── categories.service.ts
│       │   │   │   ├── modifiers.service.ts
│       │   │   │   ├── ingredients.service.ts  # Lógica recetas (product_ingredients)
│       │   │   │   ├── prep-time.service.ts    # Lógica tiempos estimados (product_prep_times)
│       │   │   │   ├── products.repository.ts  # Drizzle → products, product_variants
│       │   │   │   ├── categories.repository.ts # Drizzle → categories
│       │   │   │   ├── modifiers.repository.ts # Drizzle → modifier_groups, modifiers, product_modifiers
│       │   │   │   ├── ingredients.repository.ts # Drizzle → product_ingredients
│       │   │   │   ├── prep-time.repository.ts # Drizzle → product_prep_times
│       │   │   │   └── dto/
│       │   │   │       ├── create-product.dto.ts
│       │   │   │       ├── update-product.dto.ts
│       │   │   │       ├── create-category.dto.ts
│       │   │   │       ├── create-modifier-group.dto.ts
│       │   │   │       ├── create-modifier.dto.ts
│       │   │   │       ├── create-variant.dto.ts
│       │   │   │       ├── create-ingredient.dto.ts
│       │   │   │       └── create-prep-time.dto.ts
│       │   │   │
│       │   │   ├── promotions/                 # PromotionsModule
│       │   │   │   ├── promotions.module.ts
│       │   │   │   ├── promotions.controller.ts # CRUD promotions + nested promotion_items
│       │   │   │   ├── promotions.service.ts
│       │   │   │   ├── promotions.repository.ts # Drizzle → promotions, promotion_items
│       │   │   │   └── dto/
│       │   │   │       ├── create-promotion.dto.ts
│       │   │   │       └── create-promotion-item.dto.ts
│       │   │   │
│       │   │   ├── tables/                     # TablesModule
│       │   │   │   ├── tables.module.ts
│       │   │   │   ├── tables.controller.ts    # CRUD + status change + toggle
│       │   │   │   ├── tables.service.ts
│       │   │   │   ├── tables.repository.ts    # Drizzle → tables
│       │   │   │   └── dto/
│       │   │   │       ├── create-table.dto.ts
│       │   │   │       └── update-table-status.dto.ts
│       │   │   │
│       │   │   ├── orders/                     # OrdersModule (CORE TRANSACCIONAL)
│       │   │   │   ├── orders.module.ts
│       │   │   │   ├── orders.controller.ts    # POST crear, GET listar/detalle/activos, PATCH status/deliver/cancel
│       │   │   │   ├── orders.service.ts       # Lógica core: crear pedido → pago → tracking → inventario
│       │   │   │   ├── order-status.service.ts # Lógica transición estados + validación flujo
│       │   │   │   ├── orders.repository.ts    # Drizzle → orders
│       │   │   │   ├── order-items.repository.ts # Drizzle → order_items, order_item_modifiers
│       │   │   │   ├── order-status.repository.ts # Drizzle → order_status_history
│       │   │   │   ├── order-promotions.repository.ts # Drizzle → order_promotions
│       │   │   │   └── dto/
│       │   │   │       ├── create-order.dto.ts
│       │   │   │       ├── create-order-item.dto.ts
│       │   │   │       ├── update-order-status.dto.ts
│       │   │   │       ├── cancel-order.dto.ts
│       │   │   │       └── order-response.dto.ts
│       │   │   │
│       │   │   ├── payments/                   # PaymentsModule (Strategy Pattern)
│       │   │   │   ├── payments.module.ts
│       │   │   │   ├── payments.controller.ts  # GET listar/detalle/por-orden, POST refund
│       │   │   │   ├── payments.service.ts     # Procesar pago, calcular vuelto, refund
│       │   │   │   ├── payments.repository.ts  # Drizzle → payment_transactions
│       │   │   │   ├── strategies/
│       │   │   │   │   ├── payment-strategy.interface.ts  # Interface común IPaymentStrategy
│       │   │   │   │   ├── cash-payment.strategy.ts       # Efectivo: validar monto, calcular vuelto
│       │   │   │   │   └── digital-payment.strategy.ts    # Yape/Plin: confirmar recepción
│       │   │   │   └── dto/
│       │   │   │       ├── process-payment.dto.ts
│       │   │   │       └── refund-payment.dto.ts
│       │   │   │
│       │   │   ├── cash-register/              # CashRegisterModule
│       │   │   │   ├── cash-register.module.ts
│       │   │   │   ├── cash-register.controller.ts # POST open/close, GET current/summary/history
│       │   │   │   ├── cash-register.service.ts    # Apertura/cierre + cálculos resumen
│       │   │   │   ├── cash-register.repository.ts # Drizzle → cash_registers
│       │   │   │   ├── ticket-sequence.service.ts  # Generación correlativo atómico (UPDATE RETURNING)
│       │   │   │   ├── ticket-sequence.repository.ts # Drizzle → ticket_sequences
│       │   │   │   └── dto/
│       │   │   │       ├── open-cash-register.dto.ts
│       │   │   │       └── close-cash-register.dto.ts
│       │   │   │
│       │   │   ├── tracking/                   # TrackingModule
│       │   │   │   ├── tracking.module.ts
│       │   │   │   ├── tracking.controller.ts  # GET /tracking/:code (PÚBLICO, sin auth)
│       │   │   │   ├── tracking.service.ts     # Generar código, QR, estimar tiempo, expirar
│       │   │   │   ├── tracking.repository.ts  # Drizzle → order_tracking
│       │   │   │   └── dto/
│       │   │   │       └── tracking-response.dto.ts
│       │   │   │
│       │   │   ├── inventory/                  # InventoryModule
│       │   │   │   ├── inventory.module.ts
│       │   │   │   ├── inventory.controller.ts # CRUD insumos + restock + adjust + low-stock + movements
│       │   │   │   ├── inventory.service.ts    # Descuento automático por venta, alertas, ajustes
│       │   │   │   ├── inventory.repository.ts # Drizzle → inventory_items
│       │   │   │   ├── ingredients.service.ts  # Lógica recetas para descuento (product_ingredients)
│       │   │   │   ├── ingredients.repository.ts # Drizzle → product_ingredients
│       │   │   │   ├── movements.repository.ts # Drizzle → inventory_movements
│       │   │   │   └── dto/
│       │   │   │       ├── create-inventory-item.dto.ts
│       │   │   │       ├── restock.dto.ts
│       │   │   │       └── adjust-stock.dto.ts
│       │   │   │
│       │   │   ├── reports/                    # ReportsModule
│       │   │   │   ├── reports.module.ts
│       │   │   │   ├── reports.controller.ts   # GET sales/today, sales, by-category, by-type,
│       │   │   │   │                           #     by-payment-method, top-products, cash-register,
│       │   │   │   │                           #     inventory/low-stock, cancellations, prep-times,
│       │   │   │   │                           #     daily-summary (11 endpoints)
│       │   │   │   ├── sales-report.service.ts     # Ventas por día/periodo/categoría/tipo/método pago
│       │   │   │   ├── cash-report.service.ts      # Reportes cierre de caja
│       │   │   │   ├── inventory-report.service.ts # Stock bajo, movimientos
│       │   │   │   ├── daily-summary.service.ts    # Cálculo y persistencia daily_summaries
│       │   │   │   ├── daily-summary.repository.ts # Drizzle → daily_summaries
│       │   │   │   └── dto/
│       │   │   │       └── report-query.dto.ts     # Filtros: from, to, limit, category_id, etc.
│       │   │   │
│       │   │   ├── notifications/              # NotificationsModule (REST + WebSocket)
│       │   │   │   ├── notifications.module.ts
│       │   │   │   ├── notifications.controller.ts # GET listar + unread-count, PATCH read + read-all
│       │   │   │   ├── notifications.service.ts    # Crear, enviar, broadcast por rol
│       │   │   │   ├── notifications.repository.ts # Drizzle → notifications
│       │   │   │   ├── notifications.gateway.ts    # WebSocket Gateway: push events a frontend
│       │   │   │   └── dto/
│       │   │   │       └── notification-response.dto.ts
│       │   │   │
│       │   │   └── printer/                    # PrinterModule
│       │   │       ├── printer.module.ts
│       │   │       ├── printer.controller.ts   # CRUD config impresoras + set default
│       │   │       ├── printer.service.ts      # Gestión configuraciones
│       │   │       ├── printer.repository.ts   # Drizzle → printer_configs
│       │   │       └── dto/
│       │   │           └── create-printer.dto.ts
│       │   │
│       │   ├── common/                         # ── Componentes Transversales Globales ──
│       │   │   ├── guards/
│       │   │   │   ├── jwt-auth.guard.ts       # Verifica JWT válido en Authorization header
│       │   │   │   └── roles.guard.ts          # Verifica rol del usuario tiene permiso
│       │   │   ├── decorators/
│       │   │   │   ├── roles.decorator.ts      # @Roles('ADMIN', 'CAJERO') - roles permitidos
│       │   │   │   ├── current-user.decorator.ts # @CurrentUser() - inyecta user del JWT
│       │   │   │   └── public.decorator.ts     # @Public() - marca endpoint sin auth
│       │   │   ├── interceptors/
│       │   │   │   ├── audit.interceptor.ts    # Registra en audit_logs cada acción automáticamente
│       │   │   │   ├── transform.interceptor.ts # Response wrapper: { success, data, message, timestamp }
│       │   │   │   └── timeout.interceptor.ts  # Timeout 30s para requests largos
│       │   │   ├── pipes/
│       │   │   │   └── validation.pipe.ts      # Validación automática DTOs (class-validator)
│       │   │   ├── filters/
│       │   │   │   └── http-exception.filter.ts # Manejo global errores: { success: false, error, statusCode }
│       │   │   └── middleware/
│       │   │       └── logger.middleware.ts     # Log requests: método, ruta, status, duración (ms)
│       │   │
│       │   ├── database/                       # ── Drizzle ORM: Config + Schema + Migrations ──
│       │   │   ├── drizzle.config.ts           # Conexión Supabase, output directory
│       │   │   ├── drizzle.module.ts           # NestJS Module: provee Drizzle como injectable
│       │   │   ├── schema/                     # 12 archivos de schema (29 tablas en 8 dominios)
│       │   │   │   ├── index.ts                # Re-exporta todos los schemas
│       │   │   │   ├── auth.schema.ts          # users, sessions (2 tablas)
│       │   │   │   ├── catalog.schema.ts       # categories, products, product_variants,
│       │   │   │   │                           # modifier_groups, modifiers, product_modifiers (6 tablas)
│       │   │   │   ├── promotions.schema.ts    # promotions, promotion_items (2 tablas)
│       │   │   │   ├── salon.schema.ts         # tables (1 tabla)
│       │   │   │   ├── orders.schema.ts        # orders, order_items, order_item_modifiers,
│       │   │   │   │                           # order_status_history, order_promotions (5 tablas)
│       │   │   │   ├── payments.schema.ts      # payment_transactions, cash_registers,
│       │   │   │   │                           # ticket_sequences (3 tablas)
│       │   │   │   ├── tracking.schema.ts      # order_tracking (1 tabla)
│       │   │   │   ├── inventory.schema.ts     # inventory_items, product_ingredients,
│       │   │   │   │                           # inventory_movements (3 tablas)
│       │   │   │   ├── config.schema.ts        # business_config, product_prep_times,
│       │   │   │   │                           # printer_configs (3 tablas)
│       │   │   │   ├── reports.schema.ts       # daily_summaries (1 tabla)
│       │   │   │   ├── notifications.schema.ts # notifications (1 tabla)
│       │   │   │   └── audit.schema.ts         # audit_logs (1 tabla)
│       │   │   ├── migrations/                 # Auto-generadas por drizzle-kit generate
│       │   │   │   ├── 0000_initial.sql        # Migración inicial (29 tablas)
│       │   │   │   └── meta/                   # Metadata de migraciones
│       │   │   └── seed/                       # Datos iniciales para desarrollo
│       │   │       ├── seed.ts                 # Script principal: ejecuta todos los seeds en orden
│       │   │       ├── users.seed.ts           # Admin + Cajero + Cocina de prueba
│       │   │       ├── menu.seed.ts            # Categorías + Productos pizzería piloto
│       │   │       ├── tables.seed.ts          # Mesas del salón
│       │   │       └── config.seed.ts          # business_config inicial (nombre, RUC, impuesto)
│       │   │
│       │   ├── config/                         # ── Configuración de Entorno ──
│       │   │   ├── app.config.ts               # PORT, CORS_ORIGINS, API_PREFIX
│       │   │   ├── database.config.ts          # DATABASE_URL (Supabase connection string)
│       │   │   ├── jwt.config.ts               # JWT_SECRET, JWT_EXPIRATION, JWT_REFRESH_EXPIRATION
│       │   │   └── supabase.config.ts          # SUPABASE_URL, SUPABASE_ANON_KEY (para Realtime)
│       │   │
│       │   ├── app.module.ts                   # Root module: importa los 13 módulos + config global
│       │   └── main.ts                         # Entry: NestFactory.create(), CORS, ValidationPipe, Swagger
│       │
│       ├── test/                               # Tests
│       │   ├── unit/                           # Tests unitarios por módulo
│       │   │   ├── orders.service.spec.ts
│       │   │   ├── payments.service.spec.ts
│       │   │   ├── inventory.service.spec.ts
│       │   │   └── ...
│       │   └── e2e/                            # Tests end-to-end
│       │       ├── auth.e2e-spec.ts
│       │       ├── orders.e2e-spec.ts
│       │       └── ...
│       │
│       ├── nest-cli.json                       # NestJS CLI config
│       ├── tsconfig.json                       # TypeScript (paths: @pos-pizza/shared)
│       ├── tsconfig.build.json                 # TypeScript build config
│       ├── .env                                # Variables entorno backend (NO commitear)
│       └── package.json                        # Dependencias backend
│
│
├── packages/
│   ├── shared/                                 # ═══ @pos-pizza/shared ═══
│   │   ├── src/
│   │   │   ├── types/                          # Interfaces TypeScript (11 archivos)
│   │   │   │   ├── user.types.ts               # IUser, IUserResponse, ILoginResponse
│   │   │   │   ├── product.types.ts            # IProduct, ICategory, IVariant, IModifier, IModifierGroup
│   │   │   │   ├── order.types.ts              # IOrder, IOrderItem, IOrderItemModifier, IOrderStatus
│   │   │   │   ├── payment.types.ts            # IPaymentTransaction, IPaymentResponse
│   │   │   │   ├── inventory.types.ts          # IInventoryItem, IIngredient, IMovement
│   │   │   │   ├── tracking.types.ts           # IOrderTracking, ITrackingResponse, IStatusHistory
│   │   │   │   ├── promotion.types.ts          # IPromotion, IPromotionItem
│   │   │   │   ├── cash-register.types.ts      # ICashRegister, ICashRegisterSummary
│   │   │   │   ├── notification.types.ts       # INotification
│   │   │   │   ├── report.types.ts             # IDailySummary, ISalesReport, ITopProduct
│   │   │   │   ├── config.types.ts             # IBusinessConfig, IPrinterConfig, IPrepTime
│   │   │   │   └── index.ts                    # Re-exporta todo
│   │   │   │
│   │   │   ├── dtos/                           # DTOs compartidos (validación back, tipado front)
│   │   │   │   ├── create-order.dto.ts
│   │   │   │   ├── create-product.dto.ts
│   │   │   │   ├── create-category.dto.ts
│   │   │   │   ├── create-modifier-group.dto.ts
│   │   │   │   ├── create-promotion.dto.ts
│   │   │   │   ├── process-payment.dto.ts
│   │   │   │   ├── update-order-status.dto.ts
│   │   │   │   ├── open-cash-register.dto.ts
│   │   │   │   ├── close-cash-register.dto.ts
│   │   │   │   ├── restock.dto.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── enums/                          # Enums compartidos (7 archivos)
│   │   │   │   ├── order-status.enum.ts        # RECEIVED, PREPARING, IN_OVEN, READY, DELIVERED, CANCELLED
│   │   │   │   ├── order-type.enum.ts          # SALON, PARA_LLEVAR
│   │   │   │   ├── payment-method.enum.ts      # CASH, YAPE_PLIN
│   │   │   │   ├── user-role.enum.ts           # ADMIN, CAJERO, COCINA
│   │   │   │   ├── table-status.enum.ts        # AVAILABLE, OCCUPIED, RESERVED
│   │   │   │   ├── movement-type.enum.ts       # IN, OUT, ADJUSTMENT, RETURN
│   │   │   │   ├── notification-type.enum.ts   # ORDER_READY, LOW_STOCK, CASH_CLOSED, SYSTEM_ALERT
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── constants/                      # Constantes de negocio (4 archivos)
│   │   │   │   ├── order-status-flow.ts        # Mapa transiciones: RECEIVED→PREPARING→IN_OVEN→READY
│   │   │   │   ├── tax-config.ts               # DEFAULT_TAX_RATE=10.50, TAX_STANDARD=18.00
│   │   │   │   ├── ticket-format.ts            # TICKET_PREFIX='YYYYMMDD', SEPARATOR='-'
│   │   │   │   └── tracking-messages.ts        # Mensajes temáticos por estado para tracking cliente
│   │   │   │
│   │   │   ├── validators/                     # Validadores Perú-específicos (3 archivos)
│   │   │   │   ├── ruc.validator.ts            # Validar RUC peruano (11 dígitos, checksum)
│   │   │   │   ├── phone.validator.ts          # Validar teléfono peruano (+51 9xx xxx xxx)
│   │   │   │   └── price.validator.ts          # Validar precio: > 0, max 2 decimales
│   │   │   │
│   │   │   ├── utils/                          # Utilidades compartidas (5 archivos)
│   │   │   │   ├── format-currency.ts          # formatCurrency(100) → 'S/. 100.00'
│   │   │   │   ├── format-date.ts              # formatDate(date) → '09/03/2026' (Perú)
│   │   │   │   ├── format-ticket.ts            # formatTicket(date, num) → '20260309-001'
│   │   │   │   ├── calculate-tax.ts            # calculateTax(subtotal, rate) → { tax, total }
│   │   │   │   └── generate-tracking-code.ts   # generateCode(6) → 'A7K3X2' (sin ambiguos: 0/O, 1/I/L)
│   │   │   │
│   │   │   └── index.ts                        # Re-exporta todo el package
│   │   │
│   │   ├── tsconfig.json
│   │   └── package.json                        # name: "@pos-pizza/shared"
│   │
│   └── ui/                                     # ═══ @pos-pizza/ui (futuro design system) ═══
│       ├── src/
│       │   └── index.ts                        # Vacío por ahora, se usa con múltiples frontends
│       ├── tsconfig.json
│       └── package.json                        # name: "@pos-pizza/ui"
│
│
├── docker/                                     # ═══ DOCKER (Desarrollo Local) ═══
│   ├── docker-compose.yml                      # PostgreSQL 15 + pgAdmin 4
│   └── Dockerfile.api                          # Build multi-stage NestJS (producción)
│
├── docs/                                       # ═══ DOCUMENTACIÓN ═══
│   ├── analisis-negocio-v1.2.md
│   ├── arquitectura-tecnica-v1.3.md
│   ├── modelado-bd-v1.0.md
│   └── api-reference.md                        # Referencia rápida endpoints (generada de Swagger)
│
│
├── turbo.json                                  # ═══ TURBOREPO CONFIG ═══
├── package.json                                # Root: workspaces ["apps/*", "packages/*"]
├── pnpm-workspace.yaml                         # pnpm workspace config
├── .env.example                                # Template variables de entorno
├── .gitignore                                  # node_modules, .next, dist, .env, etc.
├── .eslintrc.js                                # ESLint config compartida
├── .prettierrc                                 # Prettier config
├── .nvmrc                                      # Node.js version (20 LTS)
└── README.md                                   # Documentación principal del repositorio
```

---

## Estadísticas del Proyecto

| Métrica | Valor |
|---|---|
| Aplicaciones (apps/) | 2 (web + api) |
| Packages compartidos | 2 (shared + ui) |
| Módulos NestJS backend | 13 |
| Grupos de rutas Next.js | 5 (auth, pos, kitchen, admin, tracking) |
| Páginas/Rutas frontend | ~25 |
| Componentes React | ~30 (ui:15 + pos:9 + kitchen:4 + tracking:5 + admin:4 + common:7) |
| Custom Hooks | 7 |
| Zustand Stores | 4 |
| Archivos schema Drizzle | 12 (29 tablas en 8 dominios) |
| Seed scripts | 5 (principal + 4 por dominio) |
| Endpoints API REST | ~85 en 19 grupos |
| Tablas PostgreSQL | 29 |
| Types compartidos | 11 |
| DTOs compartidos | ~10 |
| Enums compartidos | 7 |
| Validators compartidos | 3 |
| Utils compartidos | 5 |
| Total archivos estimados | ~200+ |

---

*POS Pizza - Estructura del Proyecto v1.1 - Marzo 2026*
*Alineado con: Análisis de Negocio v1.2 | Arquitectura Técnica v1.3 | Modelado BD v1.0*
