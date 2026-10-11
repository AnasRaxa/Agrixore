# Agrixore

Offline-first PWA for farmers in Pakistan: on-device crop disease detection (corn, wheat, cotton), weather with irrigation advice, and mandi prices, in Urdu (RTL) and English.

**Read first:** [`PRODUCT.md`](PRODUCT.md) (what), [`ARCHITECTURE.md`](ARCHITECTURE.md) (how), [`CLAUDE.md`](CLAUDE.md) (rules for AI tools).

## Status

| Area | State |
|---|---|
| `apps/web` | Phase 1 frontend built. Disease detection uses the **experimental** v4 model (public-dataset accuracy only; see `ml/reports/model-v4/README.md`) |
| `apps/api` | Not built yet (placeholder) |
| `ml/` | v4 notebook, reports and manifest tooling. v5 (not_a_leaf class, calibration, field test set) not started |
| `content/` | Draft entries for all 13 model classes (English + Urdu), **not expert-reviewed** |

## Run the frontend

```bash
corepack enable        # or: npm i -g pnpm
pnpm install
pnpm dev               # http://localhost:5173
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Deployment

The frontend deploys to Vercel from GitHub Actions: PRs get a preview URL, merges to `main` go to production. Setup: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

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
