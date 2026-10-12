# Admin dashboard and API

The API (`apps/api`) serves mandi prices. The admin dashboard (`apps/admin`) is where an operator types those prices in by hand. The farmer app shows them on the Mandi screen through the existing `GET /api/v1/mandi/prices/latest`.

```
Admin dashboard --(sign in, set prices)--> API (+ MongoDB) <--(read prices)-- Farmer app (PWA)
   /admin/                                  /api/v1                            Mandi screen
```

The API also serves the built dashboard at `/admin/`, so there is **one deployment** and the sign-in cookie never leaves your own site.

Manual prices are stored like any other price (`source: "manual"`, `sample: false`), for one district-wide market per district (market id `<district>-manual`). The made-up development rows keep `sample: true` and are never mixed up with them.

## Run it on your computer (no database needed)

```bash
pnpm install
cp apps/api/.env.example apps/api/.env      # then set JWT_SECRET and the ADMIN_DEV_* lines (see the file)
pnpm --filter @agrixore/admin build         # builds the dashboard so the API can serve it
pnpm dev:api                                # API on http://localhost:4000, dashboard at http://localhost:4000/admin/
```

With no `MONGODB_URI` the API keeps everything in memory (it forgets prices when it restarts), and `ADMIN_DEV_EMAIL` / `ADMIN_DEV_PASSWORD` create the sign-in for you. Use this to try the dashboard.
For live reloading while editing the dashboard, also run `pnpm dev:admin` and open http://localhost:5174/admin/.

To see the prices in the farmer app: `echo "VITE_API_BASE_URL=http://localhost:4000" > apps/web/.env.local`, then `pnpm dev:web`.

### With a real database

Put a MongoDB connection string in `MONGODB_URI` (a free Atlas cluster, or `docker run -p 27017:27017 mongo:8`). Now prices persist, and admin accounts are real:

```bash
pnpm --filter @agrixore/api admin:create    # asks for an email and a password (12+ characters)
pnpm --filter @agrixore/api admin:create -- --reset-password
```

There is no public sign-up, and `ADMIN_DEV_*` is refused when a database or production mode is used.

## Using the dashboard

- **Dashboard:** prices saved, what was entered today, and which commodities have a manual price from the last 7 days.
- **Mandi prices > Set prices:** choose a district and a market date, type the lowest, typical and highest price (PKR per 40 kg) for each commodity, then Save. Leave a row empty to skip it. Saving again for the same commodity, district and date replaces the earlier entry. "Fill empty rows with the last saved prices" copies your own earlier values as a starting point; check them before saving.
- **Price history:** every saved price. Edit loads it into the form; Delete removes it, and farmers stop seeing it.
- Rules (enforced by the dashboard and the API): whole rupees, lowest <= typical <= highest, no future dates.
- Farmers see a change the next time their app refreshes. The API lets browsers reuse a price response for 5 minutes and the app refreshes at most every 30 minutes while open.
- The farmer app shows the newest price per commodity and district, with its market date. Delete a price you no longer want shown.

## Deploy

1. **Database:** create a free MongoDB Atlas cluster and a database user, allow network access from your API host, and copy the connection string.
2. **API (and dashboard) on a Node host** such as Render or Railway:
   - Build command: `pnpm install --frozen-lockfile && pnpm --filter @agrixore/admin build && pnpm --filter @agrixore/api build`
   - Start command: `pnpm --filter @agrixore/api start`
   - Health check path: `/api/v1/health/ready`
   - Environment variables:

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` (makes the sign-in cookie `Secure`) |
   | `MONGODB_URI` | your Atlas connection string |
   | `JWT_SECRET` | 32+ random characters: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Without it the dashboard stays off |
   | `CORS_ORIGINS` | the farmer app's address, e.g. `https://agrixore.vercel.app` (comma-separated for several, no trailing slash) |

   Free tiers often put an idle service to sleep, so the first request can be slow. Check your host's terms. The farmer app keeps working from its cache meanwhile.
3. **First admin:** on your computer, put the Atlas string in `apps/api/.env` and run `pnpm --filter @agrixore/api admin:create`. Then sign in at `https://<your-api-host>/admin/`.
4. **First check on the real database:** run `curl https://<your-api-host>/api/v1/mandi/prices/latest` after saving one price. It must return that price. (This query uses MongoDB's `$group` with `$first`. The stand-in database used for development here does not implement `$first`, so this one query has not been run on a real MongoDB yet. If it errors, tell the developer.)
5. **Farmer app on Vercel:** add `VITE_API_BASE_URL` = `https://<your-api-host>` (Production and Preview) and redeploy. Preview deployments get their own web addresses; add the ones you test to `CORS_ORIGINS`.

## Security design

- Passwords are hashed with scrypt (built into Node, no native add-on) with a random salt per account.
- The session is a signed token in an **HttpOnly, SameSite=Strict, path-limited** cookie that page scripts cannot read. It expires after `ADMIN_SESSION_HOURS` (default 12). Each request also checks that the account still exists, so removing an admin ends their session.
- Wrong email and wrong password give the same answer and take the same time. Failed sign-ins are rate limited (10 per 15 minutes per address).
- A request that changes data must come from this same site. Another website, even the farmer app, is refused (403).
- Every input is validated with zod; errors never include internals; request size is limited; helmet sets security headers.
- Prices are public by design. Everything under `/api/v1/admin` needs a session and sends `Cache-Control: no-store`.

## API reference

Success: `{ "data": ..., "meta": ... }`. Error: `{ "error": { "code", "message", "details?" } }`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/mandi/prices/latest`, `/prices`, `/commodities`, `/markets` | none | Existing public endpoints (see `apps/api/README.md`) |
| POST | `/api/v1/admin/auth/login`, `/logout` | none | Sign in (sets the cookie) / out |
| GET | `/api/v1/admin/auth/me` | admin | Who is signed in |
| GET | `/api/v1/admin/summary` | admin | Dashboard overview |
| GET | `/api/v1/admin/prices?commodity=&district=&from=&to=&page=&limit=` | admin | Manual prices, newest first |
| PUT | `/api/v1/admin/prices` | admin | Create or update up to 200 prices: `{ "prices": [{ commodityId, districtId, marketDate, min, modal, max }] }` |
| DELETE | `/api/v1/admin/prices/:id` | admin | Delete one manual price |

## Tests

```bash
pnpm --filter @agrixore/api test            # no database needed
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/agrixore_test pnpm --filter @agrixore/api test   # also runs the real-database tests
```

The second form **empties the price collection** of that database, so use a throwaway one. The in-memory and MongoDB repositories run the same behaviour tests, so they cannot drift apart.

## Troubleshooting

- *`/admin/` shows 404:* the dashboard is off (no `JWT_SECRET`) or has not been built (`pnpm --filter @agrixore/admin build`).
- *The API will not start:* it validates its settings on startup and prints which one is wrong.
- *Farmer app shows no prices:* nothing is published yet, `VITE_API_BASE_URL` is not set, or the farmer app's address is missing from `CORS_ORIGINS`.
- *Cannot sign in after many wrong passwords:* wait 15 minutes.
