# Agrixore

Offline-first PWA for farmers in Pakistan: on-device crop disease detection (corn, wheat, cotton), weather with irrigation advice, and mandi prices, in Urdu (RTL) and English.

**Read first:** [`PRODUCT.md`](PRODUCT.md) (what), [`ARCHITECTURE.md`](ARCHITECTURE.md) (how), [`CLAUDE.md`](CLAUDE.md) (rules for AI tools).

## Status

| Area | State |
|---|---|
| `apps/web` | Phase 1 frontend built. Disease detection runs in **demo mode** until a trained model is added (see `apps/web/public/models/README.md`) |
| `apps/api` | Foundation built: config validation, health, mandi endpoints, tests. Runs with in-memory sample data; the MongoDB repo is written but not yet run against a real database |
| `ml/` | Placeholder; dataset audit and training not started |
| `content/` | Starter **draft** disease entries (not expert-reviewed) |

## Run the frontend

```bash
corepack enable        # or: npm i -g pnpm
pnpm install
pnpm dev               # web http://localhost:5173 and API http://localhost:4000
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

### Connect the web app to the API (optional)
```bash
cp apps/api/.env.example apps/api/.env          # then adjust if needed
echo "VITE_API_BASE_URL=http://localhost:4000" > apps/web/.env.local
pnpm dev
```
Without `VITE_API_BASE_URL` the mandi screen shows its own clearly labelled sample data.

## Deployment

The frontend deploys to Vercel from GitHub Actions: PRs get a preview URL, merges to `main` go to production. Setup: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Repository layout

```
apps/web        Farmer PWA (Vite + React + TypeScript + Tailwind)
apps/api        Node.js API (foundation built: health and mandi endpoints)
apps/admin      Admin dashboard (Phase 3)
packages/shared Types, constants and pure logic shared by web and api
content/        Knowledge base (JSON, English + Urdu) and crop calendars
ml/             Training, evaluation and export (Python)
docs/           ADRs, test checklists
```
