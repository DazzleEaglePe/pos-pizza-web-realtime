# POS Pizza - Realtime

Monorepo para un POS de pizzeria con pantallas en tiempo real.

- `apps/web`: Next.js (POS, Kitchen/KDS, Tracking)
- `apps/api`: NestJS + Drizzle ORM (catalogo, pedidos, pagos, Socket.IO)
- `packages/*`: paquetes compartidos

## Requisitos

- Node.js >= 18
- Postgres (local o docker)

## Setup rapido (local)

1. Instalar dependencias

```bash
npm install
```

2. Variables de entorno

API:

```bash
cp apps/api/.env.example apps/api/.env
```

Web:

```bash
cp apps/web/.env.example apps/web/.env.local
```

3. Base de datos (Drizzle)

```bash
npm --workspace api run db:push
npm --workspace api run db:seed
```

4. Levantar todo

```bash
npm run dev
```

## URLs

- Web: http://localhost:3000
- API: http://localhost:3001
- Swagger: http://localhost:3001/api/docs

Pantallas:

- POS: http://localhost:3000/pos
- Kitchen/KDS: http://localhost:3000/kitchen
- Tracking: http://localhost:3000/tracking

## Credenciales demo (seed)

- Admin: `admin@pospizza.com` / `admin123`
- Caja: `caja@pospizza.com` / `admin123`

## Flujo end-to-end (demo)

1. `/pos`: crear pedido, cobrar y generar ticket + QR de tracking
2. `/kitchen`: ver pedido en realtime y mover estados (PREPARING/IN_OVEN/READY/DELIVERED)
3. `/tracking/<ticket>`: cliente ve el estado en vivo

## Realtime (Socket.IO)

Namespace: `/pos`

Eventos:

- `order:created`
- `order:statusUpdated`
- `order:cancelled`

Tracking se une a un room con: `order:join` -> `order:{orderId}`

## Docs

- `docs/01_POS_Pizza_Analisis_Negocio_v1.2.md`
- `docs/02_POS_Pizza_Arquitectura_Tecnica_v1.3.md`
- `docs/03_POS_Pizza_Modelado_BD_v1.0.md`
- `docs/POS_Pizza_Estructura_Proyecto_v1.1.md`
- `docs/POS_Pizza_ER_Diagram.mermaid`
