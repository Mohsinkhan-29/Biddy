# Biddy Backend (Node + Express + TypeScript)

Holds the Gemini API key server-side so it never ships inside the extension bundle. Also owns user accounts, auth, and history/usage persistence via Prisma + Neon Postgres.

## Setup

```bash
cp .env.example .env
# then edit .env:
#  - GEMINI_API_KEY
#  - DATABASE_URL              (Neon connection string)
#  - JWT_SECRET / JWT_REFRESH_SECRET   (generate with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
#  - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET  (Google Cloud Console → OAuth client, "Chrome App" type,
#     application ID = your unpacked extension's ID from chrome://extensions)
#  - ALLOWED_ORIGINS should include chrome-extension://<your-extension-id>

npm install
npx prisma migrate dev --name init   # creates tables in Neon
npm run dev
```

Health check: `GET http://localhost:4000/health`

## Auth flow

The extension gets a Google OAuth **access token** via `chrome.identity.getAuthToken()` and sends it to `/api/auth/google`. The backend verifies it against Google's `tokeninfo` (audience check) and `userinfo` endpoints, upserts a `User` row, and returns our own short-lived access JWT (15m) + long-lived refresh token (30d, stored hashed-by-uniqueness in `RefreshToken` and rotated on every use).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/google` | — | `{ accessToken }` (Google) → `{ accessToken, refreshToken, user }` (ours) |
| POST | `/api/auth/refresh` | — | `{ refreshToken }` → new token pair (old refresh token is revoked) |
| POST | `/api/auth/logout` | — | `{ refreshToken }` → revokes it |
| POST | `/api/analyze` | JWT | Scraped job in → `AiMetrics` JSON out (24h in-memory cache per jobId); saves an `Analysis` row + increments usage on a real generation |
| POST | `/api/proposal` | JWT | Job description + persona + profile in → drafted proposal out; saves a `Proposal` row + increments usage |
| GET | `/api/user/me` | JWT | Current user profile |
| GET | `/api/user/history` | JWT | Last 50 proposals + analyses |
| GET | `/api/user/usage` | JWT | Current calendar-month usage counters |

Everything under `/api` except `/api/auth/*` requires `Authorization: Bearer <access token>` and is rate-limited (`RATE_LIMIT_MAX` per `RATE_LIMIT_WINDOW_MS`). A `401` means the access token is missing/expired — the extension's API client refreshes automatically and retries once.

## Structure

- `src/auth/` — Google token verification, JWT issuing/verification, login/refresh/logout service + routes
- `src/middleware/auth.middleware.ts` — `requireAuth`, verifies the JWT and attaches `req.user`
- `src/users/`, `src/proposal/`, `src/analysis/`, `src/usage/` — one module per resource (service/controller/routes)
- `src/prisma/prisma.ts` — Prisma client singleton; `prisma/schema.prisma` — `User`, `Proposal`, `Analysis`, `Usage`, `RefreshToken`
- `src/services/gemini.service.ts` — the **only** file that touches the Gemini SDK (unchanged)
- `src/prompts/` — prompt templates (unchanged)
- `src/services/cache.service.ts` — in-memory 24h analysis cache; swap for Redis if you deploy more than one instance

## Future-ready, not yet implemented

`User.plan` and the `Usage` table exist so plan limits, Stripe subscriptions, and a usage dashboard are additive later — no schema changes needed, just new routes/middleware reading what's already tracked.

## Scaling notes

- Swap `cache.service.ts`'s internals for Redis once you run more than one instance.
- `RefreshToken` rows are deleted on logout/rotation; consider a cron to sweep expired-but-unused rows.
