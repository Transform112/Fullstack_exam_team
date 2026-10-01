# Wishly

Create personalized occasion pages with messages, photos, video and three animated templates. One Next.js app serves the website and API under `/api/v1`.

## Local Setup

Requirements: Node.js 24 LTS recommended, npm, MongoDB (Atlas recommended) and a Cloudinary account.

```powershell
git clone https://github.com/gopalagrawal-192/Fullstack_exam_team.git
Set-Location Fullstack_exam_team
# Use the branch containing this application until its pull request is merged.
git switch harshit
npm ci
Copy-Item .env.example .env
```

Fill the local `.env` before running the app:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | App origin, initially `http://localhost:3000`, without a trailing slash |
| `MONGO_URI` | MongoDB connection string including the database name |
| `JWT_SECRET` | Independent random secret for authentication tokens |
| `UNLOCK_JWT_SECRET` | Independent random secret for page-unlock tokens |
| `IP_HASH_SECRET` | Independent random secret for hashing client IPs |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary secret, server-only |

Optional variables are described in `.env.example`. Generate three separate cryptographically random secrets locally. Never paste credentials into prompts, source code, README, screenshots or commits. Only `NEXT_PUBLIC_` variables may be exposed to the browser.

```powershell
npm run seed
npm run dev
```

Open http://localhost:3000. If using another port, update `NEXT_PUBLIC_APP_URL` to match. Seed only the intended database; do not run destructive verification against production.

## Using The Website

1. Sign up at `/signup` or log in at `/login`.
2. Select **Create a surprise** and complete Occasion, Recipient, Words, Media, Style and Review.
3. Add a recipient name, at least one message, at least one image and a template. Choose English, Hinglish or Hindi. Images are limited to 15 files of 8 MB each; videos to 2 files of 50 MB and 60 seconds each.
4. Optionally set a future reveal time or a page password. Generate the page, then copy its link, download its QR PNG or share through WhatsApp.
5. Visitors open `/w/<slug>`. Scheduled/password-protected pages unlock through server checks. After opening, **Tap to begin** starts the experience and available background audio.
6. Use `/dashboard` to edit, duplicate, share, unpublish or delete pages. Insights shows views and wishes; page owners can moderate wishes.
7. Administrators use `/admin` to manage users, pages, wishes and templates.

Seeded sample links:

- `/w/riya-birthday-7f3a`: Birthday, Hinglish, Neon Night.
- `/w/kavya-anniversary-2k4m`: Anniversary, English, Royal Gold.
- `/w/meera-birthday-9p1x`: Birthday, Hindi, Pastel Dream.
- `/w/dev-farewell-3c8z`: scheduled example, relative to seed time.
- `/w/sana-friendship-5h2q`: password example, password `friends123`.

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@demo.com` | `Admin@123` |
| Creator | `creator@demo.com` | `Creator@123` |

These are intentionally public demo fixtures, not real cloud-service credentials. Restrict or replace demo accounts before hosting private data. Never reuse these passwords for real accounts, MongoDB, Cloudinary or hosting services. Optional `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` create an additional operator account; keep those values private.

## Checks And Production

```powershell
npm run test
npm run typecheck
npm run lint
npm run build
npm start
```

Browser tests use `npm run test:e2e` after `npx playwright install`, with an isolated database. To exercise the API against a configured test app, run `npx tsx --env-file=.env scripts/verify-api.ts`; it creates and cleans test data.

Deploy the single app to Vercel. Configure required credentials in the hosting environment, not the repository, and set `NEXT_PUBLIC_APP_URL` to its HTTPS origin. Use separate production/preview databases, a least-privilege database account and the Atlas network access required for the host. Verify `/api/v1/health`, login, real uploads, page generation and public sharing after deployment. Frontend and backend URLs share the same origin.

The API uses `{ success: true, data }` or `{ success: false, error }`. Mutating calls require an allowed `Origin`; Windows terminal examples use `curl.exe`, not the PowerShell alias. PATCH sends the latest page `rev`; a stale save returns 409 instead of overwriting another edit.

## Credential Safety

- Real `.env` files, private keys, cookie jars, build output and local editor state are ignored. The committed `.env.example` contains no real secrets.
- Cloudinary uploads are signed server-side; the API secret must never reach the browser. Passwords are bcrypt-hashed; authentication uses an httpOnly cookie and server-side ownership/role checks.
- Do not log passwords, cookies, JWTs, provider tokens or database connection strings. Public APIs must not disclose password hashes or owner email.
- If a real credential was ever committed, rotate it immediately. Removing a file from a later commit does not remove its value from Git history.

## Troubleshooting And Limitations

- **Seed/health fails:** check database name, Atlas Network Access, DNS and outbound TCP 27017. Do not print the connection string when asking for help. Prefer Atlas or a local replica set for transactional analytics.
- **Upload fails:** check all Cloudinary values and media limits. A page cannot publish without a registered image.
- **Mutation returns 403:** check the actual origin against `NEXT_PUBLIC_APP_URL` and any intentionally configured `ALLOWED_ORIGINS`.
- **Music is unavailable:** add licensed tracks under `public/music/` and record source/license information in `CREDITS.txt`; missing tracks disable music controls.
- Locked pages gate application responses, not previously shared public Cloudinary URLs. Unique analytics count browser cookies, not verified individuals.
- The optional photo-download toggle, standalone page deployment, microphone candle blowing and AI suggestions are not implemented. Public CDN caching is deferred. The current CSP permits inline scripts/styles; it is not a strict nonce-based policy.
- Database-backed end-to-end, browser visual and Lighthouse checks require a reachable test database and appropriate browser environment; unit tests alone do not certify them.

## Source Layout

`app/` contains routes and APIs; `components/`, `sections/`, `templates/` and `locales/` provide the UI; `lib/`, `models/` and `services/` provide shared server logic; `scripts/` contains seed/verification tools; `tests/` contains automated checks. Planning documents remain local and are not part of the published website source.