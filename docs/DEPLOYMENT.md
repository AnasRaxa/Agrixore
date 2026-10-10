# Deploying the web app (Vercel + GitHub Actions)

`apps/web` is deployed to Vercel by `.github/workflows/deploy-web.yml`.

| Event | Result |
|---|---|
| Pull request touching frontend files | Preview deployment, URL posted as a PR comment |
| Push / merge to `main` touching frontend files | Production deployment |

Frontend files = `apps/web`, `packages/shared`, `content`, lockfile/workspace config, `vercel.json`. API-only or ML-only changes do not trigger a deploy.
Every run first executes lint, typecheck, tests and `content:validate`. If they fail, nothing is deployed.

## One-time setup

1. **Create the Vercel project** (Vercel dashboard > Add New > Project > import `AnasRaxa/Agrixore`).
   - Framework Preset: **Other**
   - Root Directory: leave **empty** (repo root). The build needs `content/` and `packages/shared/`, which sit outside `apps/web`.
   - Build settings are read from `vercel.json`; no need to fill them in.
2. **Turn off Vercel's own Git deploys** so a push does not deploy twice: Project > Settings > Git > *Ignored Build Step* > `exit 0` (or disconnect the Git repository). GitHub Actions is the only deployer.
3. **Get the IDs.** Locally run `npx vercel link` in the repo root, then read `.vercel/project.json` (`orgId`, `projectId`). Do not commit `.vercel/`.
4. **Create a token:** Vercel > Account Settings > Tokens.
5. **Add three GitHub secrets** (repo > Settings > Secrets and variables > Actions):
   `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
6. Optional env vars (e.g. `VITE_API_BASE_URL`): add in Vercel > Project > Settings > Environment Variables. The workflow pulls them at build time. Only `VITE_*` values reach the browser.

## Notes

- `vercel.json` rewrites every route to `/index.html` (React Router `BrowserRouter`), keeps `sw.js` and `index.html` uncached so updates reach users, and caches hashed `/assets/*` as immutable.
- The PWA uses `registerType: 'prompt'`, so returning users see the update prompt after a new deploy.
- Recommended: protect `main` and require the `CI` and `Deploy web (Vercel) / check` checks before merging.
