# Wishly - Custom Occasion Page Generator

Turn a few photos and a few words into a cinematic, animated surprise website with its own
link. Built for the W3Grads Full Stack Vibe Coding Examination, Problem Statement 02.

One Next.js application serves both the UI and the API, so **the frontend URL and the backend
URL are the same origin** (the API lives under `/api/v1`).

|                 |                                                                                                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend URL    | `http://localhost:3000` locally (replace with the deployed URL after deployment)                                                                                                   |
| Backend URL     | same origin, API base path `/api/v1` (for example `http://localhost:3000/api/v1`), health at `/api/v1/health`                                                                      |
| Demo video      | _to be recorded - 3 to 5 minutes with a mobile segment (docs/05 SECTION 4)_                                                                                                        |
| Sample pages    | `/w/riya-birthday-7f3a` (Birthday, Hinglish, Neon Night), `/w/kavya-anniversary-2k4m` (Anniversary, English, Royal Gold), `/w/meera-birthday-9p1x` (Birthday, Hindi, Pastel Dream) |
| Locked fixtures | `/w/dev-farewell-3c8z` (scheduled countdown), `/w/sana-friendship-5h2q` (password `friends123`)                                                                                    |

## Team and ownership

Fill this table in before submission (docs/05 SECTION 4.4).

| Member | Roll number | GitHub    | Owned module                                                                |
| ------ | ----------- | --------- | --------------------------------------------------------------------------- |
| _name_ | _roll_      | _@handle_ | Motion and UI: templates, wish-page sections, performance                   |
| _name_ | _roll_      | _@handle_ | Frontend: landing, auth, wizard, dashboard, insights, admin UI              |
| _name_ | _roll_      | _@handle_ | Backend: models, auth, pages API, public API, wishes, views, admin API      |
| _name_ | _roll_      | _@handle_ | Media and DevOps: Cloudinary, compression, OG, QR and share kit, deployment |

## Tech stack (pinned)

Next.js 15 (App Router) + React 19 + TypeScript strict, Tailwind CSS 3.4, shadcn-style
components on Radix primitives, Framer Motion, Lenis, canvas-confetti, react-hook-form + zod,
Mongoose 8 on MongoDB, Cloudinary (signed direct uploads), bcrypt + JWT in an httpOnly cookie,
MongoDB-backed fixed-window rate limiting, pino logging, recharts, Vitest and Playwright.
Node.js 24 LTS (`.nvmrc`, `engines >= 20.6`). See `SPEC.md` for the exact versions.

## Features (verified by code review, typecheck, lint, build and unit tests)

- **Auth and roles** - signup, login, logout, `/auth/me`, bcrypt hashes, JWT in the httpOnly
  cookie `wishly_token`, server-side role checks for every admin route, seeded admin and creator.
- **Six-step wizard** - Occasion, Recipient, Words and Language, Media, Style, Review, with a
  progress bar, per-step zod validation, autosave, resume from `?id=`, keyboard support and a
  live phone-frame preview that renders the real template.
- **Media pipeline** - drag and drop, client validation (jpg/png/webp/heic/heif up to 8 MB,
  mp4 up to 50 MB and 60 s), browser compression, signed direct uploads to Cloudinary with
  XMLHttpRequest progress, dnd-kit reorder, captions, delete, and server-side verification of
  every asset before it is attached.
- **Generation and sharing** - permanent slug `slugify(name-occasion)-nanoid(4)`, scheduled vs
  published status computed from `revealAt`, QR PNG data URL, copy link, WhatsApp share,
  Instagram share, dynamic OG image.
- **Three distinct templates** - Neon Night (dark, starfield parallax, masonry gallery, glitch
  intro), Pastel Dream (light, balloons, polaroid gallery, word-fade message), Royal Gold
  (serif, gold shimmer, envelope intro, 3D carousel gallery). Same data, different layout,
  fonts, palette and motion.
- **Generated page sections** - lock screen with a flip countdown, password gate, intro with a
  "Tap to begin" audio gate, three-layer parallax hero with mouse and gyro tilt, typewriter or
  word-fade message, memory timeline, gallery with lightbox, lazy video with unmute, wishes
  wall, interactive finale with confetti, music toggle, scroll progress and footer.
- **Languages** - English, Hinglish and Hindi with grapheme-safe text handling so Devanagari
  names and messages render correctly.
- **Access control** - scheduled and password-protected pages never return content before the
  server check passes; disabled, unpublished and unknown slugs show designed screens.
- **Dashboard, insights and admin** - page cards with status chips and every action,
  views and unique visitors over 30 days, wish moderation, admin disable/enable, user
  activation and template toggles.
- **Security and quality** - zod on every request body, sanitize-html on every user string,
  same-origin guard on mutations, security headers with an enforced CSP, MongoDB-backed rate
  limits per bucket, hashed IPs, `private, no-store` on public payloads, request IDs and
  redacted pino logs.

## Architecture

```
route handler -> route() wrapper (request id, Origin guard) -> auth/role guard
              -> rate limiter -> zod validation -> service -> mongoose model
```

- UI and API in one Next.js app; Route Handlers under `app/api/v1/`.
- Business logic in `services/` (pages, media, public access, wishes, analytics); route
  handlers stay thin.
- `lib/` holds the shared core: db, errors, api envelope, auth, rate limit, sanitize,
  validators, cloudinary, page helpers, public page loader, i18n, theme tokens and hooks.
- `templates/` (one per style) and `sections/` (shared animated sections) render the same
  public payload; only the chosen template chunk is downloaded via `next/dynamic`.
- `models/` holds the eight Mongoose models with their indexes.
- Route protection is done in the server layouts `app/(app)/layout.tsx` and
  `app/admin/layout.tsx`; there is no middleware file, and every API route checks
  authorisation itself.

Three non-obvious decisions worth explaining in the viva:

1. **MongoDB fixed-window limiter** (`lib/rate-limit.ts`) - one atomic upsert per check keyed
   by `bucket:hashedId:windowIndex`, with a TTL index for cleanup, a single retry on a
   concurrent duplicate-key race, and per-bucket fail-open/fail-closed policies.
2. **Server-side lock with a computed status** (`lib/page-helpers.ts`) - there is no cron job;
   `effectiveStatus` compares `revealAt` to now on every read, and `checkPageAccess` decides in
   a fixed order what a requester may see.
3. **TTL-index view dedupe** (`services/public-access.ts`, `models/PageView.ts`) - a 30 minute
   lease per visitor and page makes a duplicate-key error mean "already counted", while
   `lastCountedAt` (not TTL deletion) decides eligibility; lifetime uniques live in
   `pagevisitors`.

## Reproducible setup

Requirements: Node.js 20.6 or newer (24 LTS recommended), npm, a MongoDB database (local or
Atlas), and a Cloudinary account for uploads.

```powershell
# 1. Install exactly the locked dependency tree
npm ci

# 2. Create your local environment file (PowerShell)
Copy-Item .env.example .env
# then fill in MONGO_URI, CLOUDINARY_* and keep the generated secrets private

# 3. Seed the demo data (safe to run more than once)
npm run seed

# 4. Run the app
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run test` (Vitest), `npm run test:e2e`
(Playwright, needs `npx playwright install` and a database), `npm run typecheck`,
`npm run lint`, `npm run format`.

One-command end-to-end check once the database is reachable (walks auth, drafts, media,
publish, the public page, view dedupe, wishes, the password gate, the scheduled lock and the
admin actions, then cleans up after itself):

```powershell
npm start                                                        # terminal 1
npx tsx --env-file=.env scripts/verify-api.ts                     # terminal 2
```

Environment variables (`.env.example` lists them all with comments):

| Variable                                             | Purpose                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| `NEXT_PUBLIC_APP_URL`                                | Public base URL, no trailing slash (share links, OG, CORS, Origin guard) |
| `ALLOWED_ORIGINS`                                    | Extra origins allowed to call mutating endpoints, comma separated        |
| `MONGO_URI`                                          | MongoDB connection string **including the database name**                |
| `JWT_SECRET` / `JWT_EXPIRES_IN`                      | Auth token secret and lifetime (default `7d`)                            |
| `UNLOCK_JWT_SECRET` / `IP_HASH_SECRET`               | Independent secrets for view tokens and IP hashing                       |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Cloudinary (the secret is server-only)                                   |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`           | Optional extra operator admin created by the seed                        |
| `GEMINI_API_KEY`                                     | Optional bonus AI suggestions (not implemented yet)                      |

Notes:

- `MONGO_URI` may point at a local `mongodb://127.0.0.1:27017/wishly` or an Atlas cluster. The
  URI must include the database name, for example `.../wishly?retryWrites=true&w=majority`.
  Atlas also needs the connecting IP in Network Access (a firewall that blocks outbound
  TCP 27017 will fail even when the IP is allow-listed) and 0.0.0.0/0 for Vercel serverless.
- Uploads need `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`.
  Without them the wizard's media step cannot attach photos, so publish will fail validation.
- Music files must be added by hand: see `public/music/CREDITS.txt` (docs/04 SECTION 11).

## Test credentials

| Role           | Email                       | Password                                             |
| -------------- | --------------------------- | ---------------------------------------------------- |
| Admin          | `admin@demo.com`            | `Admin@123`                                          |
| Creator        | `creator@demo.com`          | `Creator@123`                                        |
| Operator admin | value of `SEED_ADMIN_EMAIL` | `SEED_ADMIN_PASSWORD` (optional, additional account) |

Seeded page password: `sana-friendship-5h2q` uses `friends123`.

## API

Base path `/api/v1`. Success `{ success: true, data, message? }`; error
`{ success: false, error: { code, message, details? } }`. List endpoints accept `page`,
`limit` (max 50), `sort`, `search` and return `{ items, page, limit, total, totalPages }`.

| ID    | Method and path                    | Access         | Rate limit                  |
| ----- | ---------------------------------- | -------------- | --------------------------- |
| EP-01 | GET `/health`                      | Public         | -                           |
| EP-02 | POST `/auth/register`              | Public         | 5/hour/IP                   |
| EP-03 | POST `/auth/login`                 | Public         | 5/15min/IP+email            |
| EP-04 | POST `/auth/logout`                | Public         | -                           |
| EP-05 | GET `/auth/me`                     | Auth           | -                           |
| EP-06 | GET `/templates`                   | Public         | 120/min/IP                  |
| EP-07 | POST `/pages`                      | Auth           | -                           |
| EP-08 | GET `/pages/mine`                  | Auth           | -                           |
| EP-09 | GET `/pages/:id`                   | Owner          | -                           |
| EP-10 | PATCH `/pages/:id`                 | Owner          | -                           |
| EP-11 | POST `/uploads/sign`               | Auth           | 30/hour/user                |
| EP-12 | POST `/media`                      | Auth           | -                           |
| EP-13 | DELETE `/pages/:id/media/:mediaId` | Owner          | -                           |
| EP-14 | POST `/pages/:id/publish`          | Owner          | 10/hour/user                |
| EP-15 | POST `/pages/:id/unpublish`        | Owner          | -                           |
| EP-16 | POST `/pages/:id/duplicate`        | Owner          | -                           |
| EP-17 | DELETE `/pages/:id`                | Owner or Admin | -                           |
| EP-18 | GET `/public/pages/:slug`          | Public         | 120/min/IP                  |
| EP-19 | POST `/public/pages/:slug/unlock`  | Public         | 5/10min/IP+slug             |
| EP-20 | POST `/public/pages/:slug/view`    | Public         | 60/min/IP                   |
| EP-21 | GET `/public/pages/:slug/wishes`   | Public         | 120/min/IP                  |
| EP-22 | POST `/public/pages/:slug/wishes`  | Public         | 3/hour/visitor + 20/hour/IP |
| EP-23 | GET `/pages/:id/wishes`            | Owner or Admin | -                           |
| EP-24 | DELETE `/pages/:id/wishes/:wishId` | Owner or Admin | -                           |
| EP-25 | GET `/pages/:id/insights`          | Owner or Admin | -                           |
| EP-26 | GET `/admin/stats`                 | Admin          | -                           |
| EP-27 | GET `/admin/pages`                 | Admin          | -                           |
| EP-28 | PATCH `/admin/pages/:id`           | Admin          | -                           |
| EP-29 | GET `/admin/users`                 | Admin          | -                           |
| EP-30 | PATCH `/admin/users/:id`           | Admin          | -                           |
| EP-31 | GET `/admin/wishes`                | Admin          | -                           |
| EP-32 | PATCH `/admin/wishes/:id`          | Admin          | -                           |
| EP-33 | PATCH `/admin/templates/:id`       | Admin          | -                           |
| EP-34 | GET `/api/og/:slug`                | Public         | -                           |

Full field-level contract, models and the exact public payload: `SPEC.md`.

Example calls (Windows: use `curl.exe`; mutations need the Origin header):

```powershell
curl.exe -i http://localhost:3000/api/v1/health
curl.exe -i -c jar.txt -H "Content-Type: application/json" -H "Origin: http://localhost:3000" `
  -d '{\"name\":\"Test User\",\"email\":\"t1@example.com\",\"password\":\"Test1234\"}' `
  http://localhost:3000/api/v1/auth/register
curl.exe -b jar.txt http://localhost:3000/api/v1/auth/me
```

## Verification evidence

Recorded on this machine (Node 24.19, Next 15.5, production build served with `npm start`):

| Check            | Command                                         | Result                                                                                                                                                                                 |
| ---------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Logic tests      | `npm run test`                                  | 6 suites, 64 assertions passing (slug, locale parity/i18n, validators + sanitization + profanity, page helpers + access order, rate limiter policies, token revocation + Origin guard) |
| Types            | `npm run typecheck`                             | exits 0, no errors                                                                                                                                                                     |
| Lint             | `npm run lint`                                  | exits 0, no errors or warnings                                                                                                                                                         |
| Production build | `npm run build`                                 | succeeds; every route compiles, `/w/[slug]` first-load JS 168 kB                                                                                                                       |
| Cloudinary       | `cloudinary.api.ping` + a real signed upload    | ping ok (free tier), signature generated for `wishly/<userId>`, upload succeeded, `api.resource` returned the real format/bytes/dimensions, asset destroyed again                      |
| Runtime smoke    | `curl.exe` against `npm start`                  | see the table below                                                                                                                                                                    |
| API end-to-end   | `npx tsx --env-file=.env scripts/verify-api.ts` | ready to run; blocked in this environment because outbound TCP 27017 to Atlas is refused by the network (see below)                                                                    |

Runtime smoke results (no MongoDB reachable in this environment, which also exercises the
failure paths):

| Request                                                        | Result                                                                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `GET /`                                                        | 200, landing page renders                                                                                           |
| `GET /login`                                                   | 200                                                                                                                 |
| `GET /api/v1/health`                                           | 503 `{"success":false,"error":{"code":"DATABASE_UNAVAILABLE",...}}` - controlled, no stack trace, URI not disclosed |
| `GET /api/v1/auth/me` (no cookie)                              | 401 `UNAUTHENTICATED`                                                                                               |
| `POST /api/v1/auth/register` (no Origin)                       | 403 `INVALID_ORIGIN`                                                                                                |
| `POST /api/v1/auth/register` (`Origin: http://evil.example`)   | 403 `INVALID_ORIGIN`                                                                                                |
| `POST /api/v1/auth/register` (`Origin: http://localhost:3000`) | 429 `RATE_LIMITED` - correct fail-closed limiter behaviour when the database is down                                |
| `GET /api/v1/public/pages/riya-birthday-7f3a`                  | 503 standard error envelope                                                                                         |
| `GET /w/does-not-exist-0000`                                   | 200 with the friendly unavailable screen (no internal error page)                                                   |
| `GET /api/og/riya-birthday-7f3a`                               | 200 `image/png`, 1200x630 generic teaser card                                                                       |

Cloudinary is fully verified (see the table above). The database still has to be reached once
from a network that allows outbound TCP 27017: on the machine used for this build all three
Atlas shard hosts resolved but refused the connection while HTTPS 443 worked, which is a network
restriction, not a credential problem. Run `npm run seed` and then
`npx tsx --env-file=.env scripts/verify-api.ts` from an open network (or a local MongoDB) and the
end-to-end evidence will be produced automatically.

Still to be verified by a human with a browser: the visual play-through of the three templates,
the wizard in a real browser, mobile 360px passes, and the Lighthouse mobile runs.

## Known limitations (honest list)

1. **Music files are missing.** `public/music/*.mp3` were not added (no download in the build
   environment). Music controls hide themselves and the wizard preview buttons stay disabled
   until a human adds the four royalty-free tracks.
2. **Database-backed verification is pending.** Typecheck, lint, build, the unit suites, the
   Cloudinary pipeline and the failure-path smoke tests were run; the seeded flows need one run
   from a network that can reach MongoDB (step above), and the visual/browser checks need a
   human (docs/05 QA-01 to QA-03).
3. **`settings.allowDownload` is not implemented** (optional in the PDF; docs/02 SECTION 1 asks
   for it to be omitted and recorded).
4. **No public CDN caching in version 1.** Public payloads, HTML and OG responses are
   `private, no-store`; public caching is deferred until invalidation on password, schedule,
   unpublish and disable changes is tested.
5. **Media privacy is lock-gated, not access-controlled media.** A Cloudinary URL that was
   already shared before a page was locked cannot be recalled; strong media privacy would need
   authenticated delivery.
6. **Analytics are cookie-based.** Unique visitors count browser cookies, not verified people;
   clearing cookies or using another browser counts as a new visitor.
7. **CSP uses `'unsafe-inline'` for scripts and styles** because Next.js injects inline
   hydration code; a nonce/hash strategy was not adopted for the baseline.
8. **Local MongoDB runs without transactions.** `lib/tx.ts` falls back to sequential writes when
   the server has no replica set (standalone local mongod); Atlas always uses transactions.
9. **Admin tables are functional, not exhaustive** - they cover disable/enable, user
   activation, wish hide/delete and template toggles.
10. **Bonus items not implemented:** one-click deploy (DEPLOY-1, EP-B1/EP-B2), microphone candle
    blow (PAGE-6) and AI message suggestions (LANG-2, EP-B3). They are deliberately left out
    rather than half-built.
11. **Fixed-window rate limiting allows a small burst at a window boundary.** Acceptable at this
    scale and a documented tradeoff; the limiter sits behind a small interface so swapping in
    Redis later is a one-file change.

## Repository layout

```
app/            routes: (marketing), (auth), (app), admin, w/[slug], api/v1, api/og
components/     ui/ (shadcn-style), wizard/, preview/, wish/, app/ (+admin/, landing/)
sections/       shared animated sections of the generated page
templates/      neon-night/, pastel-dream/, royal-gold/, registry.ts, themes.ts
locales/        en.json, hinglish.json, hi.json (identical key sets)
lib/            core helpers, validators, i18n, theme tokens, hooks
models/         the eight Mongoose models
services/       pages, media, public access, wishes, analytics
scripts/        seed.ts
tests/          Vitest suites and Playwright specs
docs/           the five plan files, the requirement PDF and DECISIONS.md
SPEC.md         data models, endpoint list and payload contract
PROMPTS.md      the prompts that drove the build
```

`docs/` is git-ignored in the original repository (`/docs/*` in `.gitignore`); keep it that way
or remove that line before submission if the plan files should be part of the repository.
