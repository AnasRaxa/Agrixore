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

**Data:** no `MONGODB_URI` means in-memory data. In development that is made-up **sample** data (every row has `sample: true`). In production it is empty and a database is required. Real prices need a verified source (PRODUCT.md F-MD-05).
**MongoDB:** `MongoMandiRepo` mirrors the in-memory repo but has not been run against a real database yet. Try it with `MONGODB_URI=... pnpm seed:sample` (refuses to run in production).
