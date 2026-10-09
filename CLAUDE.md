# CLAUDE.md — Instructions for AI coding tools (Agrixore)

This file is read automatically by Claude Code and is also intended for other AI coding tools (Cursor, Copilot, etc.). Follow it strictly.

## 1. What this project is

**Agrixore** is an offline-first **PWA** for farmers in Pakistan. Main features: on-device crop disease detection (corn, wheat, cotton), weather with irrigation advice, mandi (market) prices, and Urdu (RTL) + English. It is a solo Final Year Project (FYP) built by **Anas** with AI assistance.

**Read these before any non-trivial work, and treat them as the source of truth:**
- `PRODUCT.md` — what to build, feature IDs, acceptance criteria, phases
- `ARCHITECTURE.md` — how it is built, structure, schemas, API, pitfalls

If something is unclear, missing, or contradicts these files: **stop and ask the owner. Do not guess.** If you change a decision, update the docs in the same pull request.

**Current phase: Phase 1 (Core).** Do not implement Phase 2+ features unless an issue explicitly asks for it.

## 2. Tech stack (do not deviate without asking)

- Monorepo with **pnpm workspaces**, TypeScript (**strict**) everywhere except `ml/`
- `apps/web`: **Vite + React + TypeScript**, Tailwind CSS, React Router, TanStack Query, Zustand, Dexie (IndexedDB), i18next, `vite-plugin-pwa` (injectManifest), `onnxruntime-web` in a Web Worker
- `apps/api`: **Node.js + Express + TypeScript**, zod, MongoDB (Mongoose), pino, helmet, express-rate-limit, node-cron, `web-push` (Phase 3)
- `packages/shared`: types, zod schemas, constants
- `ml/`: Python (training, evaluation, ONNX export) — never used in production
- Tests: Vitest, Testing Library, supertest, Playwright

**Do NOT introduce:** Next.js, microservices, Redux, a CSS-in-JS library, a second UI framework, a different database, farmer login/accounts (Phase 1–2), or any new major dependency without asking. Prefer the platform and existing dependencies over adding packages.

## 3. Repository layout (target)

```
apps/web  apps/api  apps/admin(P3)  packages/shared  content/  ml/  docs/  .github/
```
Full tree and module layout are in `ARCHITECTURE.md` section 4. If the repo is still empty or a folder/script is missing, **create it exactly as described there**.

## 4. Commands

These scripts must exist at the repo root (create them when scaffolding):

```bash
pnpm install            # install all workspaces
pnpm dev                # run web + api in dev mode
pnpm dev:web            # web only
pnpm dev:api            # api only
pnpm lint               # eslint
pnpm typecheck          # tsc --noEmit across workspaces
pnpm test               # unit + component + api tests
pnpm test:e2e           # playwright (includes offline tests)
pnpm build              # build all
pnpm content:validate   # validate content/ JSON vs schema and model manifest
```
Before declaring any task done, run `pnpm lint && pnpm typecheck && pnpm test` (and `pnpm build` when relevant). **Never claim something passes unless you actually ran it.** If you cannot run a command, say so.

## 5. Working method

1. **One issue at a time.** Stay within the scope of the current issue. No drive-by refactors or unrelated features.
2. **Plan first** for anything non-trivial: list files to touch, approach, risks, and assumptions. Wait for approval on big changes.
3. **Small steps.** Prefer many small, reviewable commits and PRs over one huge change.
4. **Ask when unsure.** Open decisions are listed in `PRODUCT.md` (section 12) and `ARCHITECTURE.md` (section 17). Never silently decide them.
5. **Report honestly:** what you changed, what you verified, what you could not verify, and what is left.
6. **Never invent** data: no made-up diseases, treatments, dosages, prices, dates, calendars, URLs, dataset names, or statistics. If real data is missing, use a clearly labeled placeholder (`TODO(owner): …`) and flag it.

## 6. Non-negotiable product rules

- **Offline-first.** Phase 1 features must work with no network. Read from Dexie first, then refresh in the background. Never block the UI on the network. Always show "last updated" for cached data.
- **Honest AI.** Always show confidence. Use the result states in `PRODUCT.md` F-DD-05. Prefer "unsure / retake photo" over guessing. Reject non-leaf photos.
- **No model class hard-coding in the UI.** Class ids come from the model `manifest.json`. Display content comes from `content/` by matching `id`.
- **Treatment safety.**
  - Chemicals are **generic active ingredients, never brand names**.
  - Show **dosage only** when `reviewStatus === "reviewed"`. Draft content shows a visible "Draft: not yet reviewed" badge.
  - Every chemical option is displayed with the safety block.
  - Organic/cultural options come **before** chemical ones.
  - AI-written agronomy text is always saved as `draft`.
- **Privacy.** Photos never leave the device unless the user explicitly opts in. Strip EXIF/GPS from anything shared or uploaded. No PII on the server. Location is district-level unless GPS is granted.
- **Advisory only.** Keep the disclaimer in the About screen and on treatment reports.
- **No copying** from Fasal Mitra or any other app (code, text, branding, screenshots). Original work only; respect licenses and attribute third-party code.

## 7. Frontend rules (`apps/web`)

**TypeScript & React**
- `strict` mode on. **No `any`** (use `unknown` + narrowing). No non-null assertions without a comment.
- Function components + hooks only. Named exports (default exports only for lazy-loaded route components).
- Keep components small; split logic into hooks. Co-locate tests (`*.test.ts(x)`).
- Features live in `src/features/<name>/` and expose a light public `index.ts`. No deep imports across features. **Exception:** the router (`src/app/App.tsx`) lazy-loads route pages straight from their files so each screen becomes its own chunk; feature `index.ts` files must not re-export page components.
- Access IndexedDB only via repositories in `src/db/`. Never call Dexie directly from components.
- Handle loading, empty, error and offline states for every data view.

**i18n & RTL**
- **No hard-coded user-visible strings.** Use i18next keys (`feature.screen.element`). Add keys to **both** `en.json` and `ur.json`.
- Use **Tailwind logical utilities** (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`). **Never** `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left/right` for layout.
- Mirror directional icons in RTL. Test every screen in Urdu (RTL) and English.
- Urdu text needs generous line height; use the `--font-urdu` CSS variable.

**Design**
- Minimal, basic, natural: calm greens, warm off-white, plenty of whitespace, no decorative clutter.
- Touch targets ≥ 48×48 px, body text ≥ 16 px, labeled icons, one main action per screen, respect `prefers-reduced-motion`.
- Use design tokens (CSS variables) for colors/spacing; support `data-theme="sunlight"` and text-size settings.

**PWA / ML**
- Service worker precaches static assets, fonts, ONNX runtime WASM, the model and bundled content. It does **not** cache API data (that goes in Dexie).
- Run inference **only in the Web Worker**, single-threaded WASM, self-hosted `.wasm` files with `env.wasm.wasmPaths` set. Never block the main thread.
- Decode images with EXIF orientation handling; downscale before processing and storing.
- Use shared constants for thresholds (`CONFIDENCE_THRESHOLDS`, `ALERT_THRESHOLDS`). No magic numbers in components.
- Lazy-load routes and the ML runtime. Respect the performance budget in `ARCHITECTURE.md` 5.8.

## 8. Backend rules (`apps/api`)

- Modular monolith: `routes → controller → service → repo`. Only repos touch the database.
- **Validate every input with zod** (shared schemas). Return the standard envelopes: `{ data, meta }` or `{ error: { code, message, details } }` with proper status codes.
- Config via validated env (`.env.example` committed, `.env` **never**). Fail fast on invalid config.
- Apply helmet, CORS allowlist, rate limiting, body size limits. Never leak stack traces or secrets.
- Farmer endpoints are anonymous (`deviceId`, untrusted). Admin endpoints require auth (Phase 3).
- Jobs must be **idempotent** (no duplicate notifications or duplicate price rows).
- Never fabricate or interpolate price data. Always store `source`, `marketDate`, `ingestedAt`.
- Log with pino; never log photos, personal data, or secrets.

## 9. ML rules (`ml/`)

- Document every dataset (source, license, counts) in `ml/DATASETS.md`. **Never commit datasets or large binaries.**
- Split data **before** augmentation and avoid leakage (group by source/image). Keep a separate **field-photo test set**.
- Include a `not_a_leaf` class. Calibrate confidence (temperature scaling) and store it in the manifest.
- Export to ONNX, quantize, and run a **parity test** (PyTorch ↔ ONNX ↔ browser).
- Report per-class precision/recall/F1, confusion matrix, calibration, size and latency. Do not claim accuracy numbers you did not measure.
- Fixed seeds, configs in YAML, reproducible scripts.

## 10. Content rules (`content/`)

- JSON files per `ARCHITECTURE.md` section 9, **both `en` and `ur`**, validated by `pnpm content:validate`.
- Urdu text: simple everyday words, short sentences. Mark machine-written Urdu for native-speaker review.
- `id` must match a class id in the model manifest (and vice versa).
- `reviewStatus` starts as `draft`. Only the owner or a named reviewer sets `reviewed`.

## 11. Testing and Definition of Done

A task is **done** only when all are true:
- [ ] Meets the acceptance criteria of the linked issue / feature ID in `PRODUCT.md`
- [ ] Types are strict, lint and typecheck pass, tests added/updated and **actually run**
- [ ] Works **offline** if it is a Phase 1 feature (tested with the browser/Playwright offline mode)
- [ ] Works in **Urdu RTL and English** with no untranslated or hard-coded strings
- [ ] Loading / empty / error states handled; accessible (labels, focus, contrast, touch size)
- [ ] No secrets, datasets, or large binaries committed; `.env.example` updated if config changed
- [ ] Docs updated if behavior, schema, API or decisions changed
- [ ] PR description lists what changed, how it was verified, and any open questions

Test the logic that matters most: confidence-to-state mapping, irrigation/alert rules, unit conversions, price-target matching, content validation, offline behavior.

## 12. Git and GitHub workflow

- `main` is protected. Work on branches: `feat/<issue>-short-name`, `fix/<issue>-…`, `chore/…`, `docs/…`.
- **Conventional Commits:** `feat(scan): add crop picker`, `fix(weather): handle empty forecast`, `docs: update architecture`.
- One PR per issue, small and focused, with the PR template filled in. No force-push to `main`. No unrelated changes.
- Never commit: `.env*`, API keys, datasets, model checkpoints, `node_modules`, build output.
- Large model files: Git LFS or release assets (ask the owner which).
- CI must be green before merge.

## 13. Known gotchas (details in `ARCHITECTURE.md` section 14)

- onnxruntime-web WASM paths and Web Worker setup (most common failure)
- Model precache and versioned paths in the service worker
- iOS: web push only for Home-Screen PWAs; storage may be evicted → request persistent storage
- EXIF orientation of camera photos; always keep the gallery option
- RTL bugs from physical CSS properties and unmirrored icons
- Dexie: bump the schema version and write a migration for every change
- Open-Meteo: set `timezone=Asia/Karachi`; verify parameter names in the current docs
- Raw softmax is overconfident; keep calibration
- `.safe-top` / `.safe-bottom` set padding in plain CSS, which beats Tailwind padding utilities. Use them only on a wrapper with no other padding classes

## 14. Local units cheat sheet (🟡 confirm with owner)

`1 maund = 40 kg` · `1 acre = 8 kanal = 43,560 sq ft` · `1 kanal = 20 marla = 5,445 sq ft` · `1 marla = 272.25 sq ft` · currency PKR. Prices are per 40 kg unless the commodity says otherwise; always display the unit. Keep conversions only in `packages/shared`.

## 15. Phase gating — what NOT to build yet

Do **not** build until the owner moves the project to that phase: fields, crop calendar, calculators, trend charts (P2); push, admin dashboard, outbreak map, feedback uploads, OTA updates, cloud second opinion (P3); chatbot, teleconsulting, extra languages (P4). It is fine to design **extension points** (e.g., clean module boundaries) for them, but do not implement them.

## 16. Open decisions (ask, don't decide)

Hosting providers; mandi price source; final disease class list; Urdu font and palette; district list; content reviewer; model file hosting. See `ARCHITECTURE.md` section 17.

## 17. When you finish a task

Summarize in this form:
1. **What changed** (files/modules)
2. **How it was verified** (commands actually run, manual checks)
3. **Assumptions and open questions**
4. **Suggested next step**
