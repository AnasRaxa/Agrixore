# @agrixore/admin

Admin dashboard (React + Vite). Operators sign in and set mandi prices by hand. In production the API serves the built app at `/admin/`. See [`docs/ADMIN_AND_API.md`](../../docs/ADMIN_AND_API.md).

```bash
pnpm dev:admin                             # http://localhost:5174/admin/ (needs the API running on :3000)
pnpm --filter @agrixore/admin build
```
