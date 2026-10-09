# Agrixore

Offline-first PWA for farmers in Pakistan: on-device crop disease detection (corn, wheat, cotton), weather with irrigation advice, and mandi prices, in Urdu (RTL) and English.

**Read first:** [`PRODUCT.md`](PRODUCT.md) (what), [`ARCHITECTURE.md`](ARCHITECTURE.md) (how), [`CLAUDE.md`](CLAUDE.md) (rules for AI tools).

## Status

| Area | State |
|---|---|
| `apps/web` | Phase 1 frontend built. Disease detection runs in **demo mode** until a trained model is added (see `apps/web/public/models/README.md`) |
| `apps/api` | Not built yet (placeholder) |
| `ml/` | Placeholder; dataset audit and training not started |
| `content/` | Starter **draft** disease entries (not expert-reviewed) |

## Run the frontend

```bash
corepack enable        # or: npm i -g pnpm
pnpm install
pnpm dev               # http://localhost:5173
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Repository layout

```
apps/web        Farmer PWA (Vite + React + TypeScript + Tailwind)
apps/api        Node.js API (Phase 1 backend, not built yet)
apps/admin      Admin dashboard (Phase 3)
packages/shared Types, constants and pure logic shared by web and api
content/        Knowledge base (JSON, English + Urdu) and crop calendars
ml/             Training, evaluation and export (Python)
docs/           ADRs, test checklists
```
