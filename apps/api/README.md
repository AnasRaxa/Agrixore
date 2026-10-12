# apps/api

Node.js + Express 5 + TypeScript modular monolith (see `ARCHITECTURE.md` section 8).

```bash
cp .env.example .env     # optional; defaults work for local development
pnpm dev                 # http://localhost:4000  (in-memory sample data, no database needed)
pnpm test && pnpm build && pnpm start
```

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/health`, `/health/ready` | Liveness and readiness |
| `GET /api/v1/mandi/commodities`, `/markets` | Reference data |
| `GET /api/v1/mandi/prices`, `/prices/latest` | Prices (paginated list; newest per market) |
| `/api/v1/admin/*` | Admin sign-in and manual price entry (on only when `JWT_SECRET` is set). See [`docs/ADMIN_AND_API.md`](../../docs/ADMIN_AND_API.md) |

**Data:** no `MONGODB_URI` means in-memory data. In development that is made-up **sample** data (every row has `sample: true`). In production it is empty and a database is required. Real prices need a verified source (PRODUCT.md F-MD-05).
**Admin:** `pnpm --filter @agrixore/api admin:create` creates an admin account (needs `MONGODB_URI`). For a quick local try without a database, set `JWT_SECRET` and `ADMIN_DEV_EMAIL` / `ADMIN_DEV_PASSWORD` in `.env`.
**MongoDB:** `MongoMandiRepo` mirrors the in-memory repo. Its manual-price (admin) methods are tested against a MongoDB-compatible database (`TEST_MONGODB_URI`); the `latestPrices` aggregation (`$group` + `$first`) has not been run on a real MongoDB yet, so check `/prices/latest` on first deployment. Try it with `MONGODB_URI=... pnpm seed:sample` (refuses to run in production).
