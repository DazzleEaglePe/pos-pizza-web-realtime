# DEV_SETUP

## Variables de entorno

API (`apps/api/.env`)

- `DATABASE_URL` (Postgres)
- `PORT` (default: 3001)
- `TRACKING_WEB_URL` (default: http://localhost:3000)

Web (`apps/web/.env.local`)

- `NEXT_PUBLIC_API_URL` (default: http://localhost:3001)
- `NEXT_PUBLIC_WS_URL` (default: http://localhost:3001)

## Comandos

Instalar deps:

```bash
npm install
```

DB:

```bash
npm --workspace api run db:push
npm --workspace api run db:seed
```

Dev (todo):

```bash
npm run dev
```

Dev (por separado):

```bash
npm --workspace api run start:dev
npm --workspace web run dev
```

## Smoke test manual

1. Login (caja) -> `/login`
2. POS -> `/pos` -> crea pedido -> confirma pago
3. Kitchen -> `/kitchen` -> cambia estados
4. Tracking -> `/tracking/<ticket>`
5. Print -> `/print/ticket/<ticket>` (se abre al cobrar)

## Troubleshooting

- `/orders/active` devuelve 401/403
  - Necesitas JWT (cookie `pos_access_token`) y rol (ADMIN/CAJERO/COCINA)

- Tracking del API en navegador (`http://localhost:3001/orders/track/<ticket>`)
  - Si el request acepta HTML, el API redirige a `TRACKING_WEB_URL`.

- WebSocket no conecta
  - Verifica `NEXT_PUBLIC_WS_URL`.
  - Revisa que el API este arriba (Swagger: `/api/docs`).
