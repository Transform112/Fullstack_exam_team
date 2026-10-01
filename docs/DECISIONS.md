# DECISIONS.md

One line per decision that no plan file fixed. Required verbatim lines from docs/04
SECTION 12 come first. Rules from docs/01 SECTION 0.3: choose the simplest option that
satisfies the PDF and record it here.

## Required by docs/04 SECTION 12

- Neon Night display font is Space Grotesk because Clash Display is not available on Google Fonts.
- Lock screen and password gate render in English because the locked API payload does not include the page language.
- Cloudinary media uses plain img elements with Cloudinary transformations instead of next/image.
- Hindi handwriting text uses Kalam because Caveat has no Devanagari glyphs.
- Ambient decoration loops are CSS keyframes in app/w/[slug]/wish.css; scroll and entrance motion use Framer Motion.
- Royal Gold keeps gold fixed as the primary colour; the creator accent replaces the highlight colour.

## Build and tooling

- The project was created in place (package.json, tsconfig, Tailwind, ESLint, PostCSS written
  by hand) instead of running `create-next-app` into a temporary folder: the repository is not
  empty and the generated files are identical in effect, without the risk of overwriting docs/,
  .git/ or README.md.
- Tailwind CSS 3.4 is used with a tailwind.config.ts (not Tailwind 4), because the app tokens
  and the shadcn-style components in docs/03 SECTION 5.3 are expressed as a classic config.
- shadcn/ui is used as a set of hand-written components in components/ui/ following the shadcn
  conventions and built on the Radix primitives that `shadcn init` would install
  (@radix-ui/react-slot, dialog, dropdown-menu, label, select, switch, tabs, accordion). The CLI
  was not run because it needs interactive prompts; the components are equivalent and small.
- clsx, tailwind-merge, class-variance-authority and the Radix primitives were added as the
  shadcn/ui runtime, which docs/01 SECTION 1 item 5 already expects.
- zod email validation trims and lowercases before `.email()` so pasted addresses with
  surrounding spaces validate, matching the documented "normalize the email" behaviour.
- `.env` defaults `MONGO_URI` to `mongodb://127.0.0.1:27017/wishly` so the project can be run
  locally against a local MongoDB; Atlas credentials replace it for deployment. Only
  `.env.example` is committed.
- MongoDB transactions are attempted first and, if the server reports that transactions are not
  supported (a standalone local mongod, error code 20), the same operation is retried without a
  session and a warning is logged (lib/tx.ts). Atlas always uses the transactional path.
- `/dev-upload` (docs/03 P1-06) is not created. It is a temporary page deleted again in P2-05;
  the real Media step covers the same verification.

## Data and behaviour

- `settings.allowDownload` is intentionally not implemented in version 1: it is optional in the
  PDF and docs/02 SECTION 1 reconciliation says to omit it and record the limitation.
- Public page payloads, `/w/[slug]` HTML and OG responses are `private, no-store` in version 1
  (docs/02 SECTION 1): public CDN caching is deferred until invalidation on password, schedule,
  unpublish and disable changes is tested.
- The seed script starts every page counter at a real, tracked value: the Riya page gets 47
  views and 31 unique visitors backed by matching `pagevisitors` rows and a `dailystats`
  distribution over the last 30 UTC days, so the insights chart and the counters agree. Other
  seed pages start at zero. No invented totals are presented as untracked visits.
- Seed media are Cloudinary demo-cloud fixtures under stable `seed/` public IDs (docs/02
  SECTION 13 step 5). They are development fixtures, not the team's upload pipeline, and
  `destroyAssets` never tries to delete them.
- The lock screens build their icons and shapes from inline SVG and lucide components; no emoji
  characters are written into source files, and the wish emoji presets use the exact unicode
  escape sequences from docs/04.
- A page whose language is HINDI renders `lang="hi"`, uses Noto Sans Devanagari for display and
  body text and Kalam for handwriting; ENGLISH and HINGLISH pages still end every font stack
  with the Devanagari font so a Hindi recipient name renders correctly.
- The CSP is enforced, not report-only. `script-src` includes `'unsafe-inline'` because Next.js
  injects its hydration bootstrap inline; a nonce strategy was not adopted because it needs a
  custom document and was not required for the baseline. `style-src` also allows
  `'unsafe-inline'`, and Cloudinary is allow-listed for images, media and upload connections.
  Recorded as a limitation in the README.
- Locked pages are protected at the API and HTML level. A media URL that was already disclosed
  before locking cannot be recalled from third parties; strong media privacy would need a
  separate authenticated-delivery design.

## Blockers and limitations

- `public/music/*.mp3` could not be downloaded in this environment. Per docs/04 SECTION 11 step
  4 nothing placeholder was created: the files are missing, `useMusic` hides the music toggle
  and the wizard's music preview buttons stay disabled. A human must add the four royalty-free
  tracks before the demo; see public/music/CREDITS.txt.
- No MongoDB Atlas cluster, Cloudinary account or Vercel project is configured in this
  environment, so live database, upload, deployment and Lighthouse verification have not been
  performed. Everything that can be verified without credentials (typecheck, lint, build and
  the Vitest logic suites) has been run.
- The one-click deploy bonus (EP-B1/EP-B2, DEPLOY-1) and the microphone candle blow (PAGE-6)
  and AI suggestions (LANG-2, EP-B3) are not implemented. They are bonus items and are listed
  in the README Known Limitations.

## Deviations accepted during implementation

- The supplied environment file used `MONGODB_URI`, `ALLOWED_ORIGINS`, `JWT_EXPIRES_IN`,
  `SEED_ADMIN_*` and `AI_API_KEY`. docs/02 fixes the connection variable name as `MONGO_URI`
  (the locked PDF name), so the app reads `MONGO_URI` and the supplied URI was extended with the
  database name (`/wishly?retryWrites=true&w=majority`) because a URI without one would connect
  to the `test` database. The app now also honours `ALLOWED_ORIGINS` (extra origins for the
  Origin guard), `JWT_EXPIRES_IN` (default `7d`) and `SEED_ADMIN_EMAIL` /
  `SEED_ADMIN_PASSWORD` (an extra operator admin, created in addition to the documented demo
  accounts so the README credentials keep working). `AI_API_KEY` is stored as `GEMINI_API_KEY`
  for the not-yet-implemented bonus; both names are present in `.env`.
- `scripts/verify-api.ts` was added beyond the documented `scripts/seed.ts`. It is a
  verification tool, not application code: it drives the running server through auth, drafts,
  media registration, publish, the public page, view dedupe, wishes, the password gate, the
  scheduled lock and the admin lifecycle, then deletes everything it created. It exists to make
  docs/05 QA-01 evidence reproducible with one command.
- `gallery.photo` and `wishes.retry` were added to all three locale files, so the gallery
  frame aria-label and the wishes-wall retry button use translated copy instead of a
  hard-coded string (docs/04 rule: every visible string comes from `t()`).
- The three template entry files apply `withAccent(theme, data.theme.accent)` before passing
  tokens to the sections, matching docs/04 SECTION 6. Sections also read the resolved tokens
  from `WishProvider`, so the accent is correct even if a section is rendered standalone.
- Royal Gold's `carousel3d` gallery positions the real images with wrap-around offsets instead
  of cloning DOM nodes into five ring slots, so no image is requested twice.
- Video autoplay stays muted (browsers block unmuted autoplay); the sound button performs the
  unmute on a user gesture, which is what pauses the background music.
- `wish.css` exposes the documented ambient class names (`wish-rise`, `wish-fall`, `wish-sway`,
  `wish-twinkle`, `wish-bob`, `wish-drift`, `wish-flicker`, `wish-pulse`, `wish-shimmer`) with
  `--wish-dur` / `--wish-delay` variables, so components can either set the shorthand inline
  (seeded durations) or use the class. Only transform/opacity keyframes are involved and the
  reduced-motion media query still disables all of them.
- The Intro balloon variant translates its content wrapper rather than the fixed backdrop: a
  fixed element translated away would expose the page underneath.
- Hero entrance is gated on `started` (docs/04 5.3) rather than `whileInView`; the Message,
  Timeline, Gallery, Video and Wishes sections use `useViewport()` as required.
- Non-obvious page-builder renderers (recharts, QRCodeCanvas, canvas-confetti) are loaded
  lazily or behind `next/dynamic` so they never block the first paint.

## Verification status

Verified in this environment:

- `npm run test` - 6 Vitest suites, 64 assertions (slug, locale parity and translation
  fallbacks, validators/sanitization/profanity, page helpers and the access decision order,
  rate limiter fail-open/fail-closed and the duplicate-key retry, auth/view tokens including
  revision binding, expiry, wrong page, wrong purpose and malformed tokens, and the Origin
  guard with ALLOWED_ORIGINS).
- `npm run typecheck`, `npm run lint`, `npm run build` - all exit 0; the production build
  compiles every route. See the README verification section for the recorded output.
- Cloudinary with the supplied credentials: `api.ping` succeeded (free tier, 500/hour bucket),
  `signUpload` produced the `wishly/<userId>` folder and the signed `allowed_formats`, a real
  upload through the signed parameters succeeded, `cloudinary.api.resource` returned the true
  format/bytes/width/height/secure_url that EP-12 depends on, and the asset was destroyed again.
- Runtime smoke test against the production build (`npm start` + `curl.exe`) with no MongoDB
  reachable: `/` and `/login` return 200, `/api/v1/health` returns the controlled 503
  `DATABASE_UNAVAILABLE` envelope, `/api/v1/auth/me` without a cookie returns 401, mutations
  with a missing or foreign Origin return 403 INVALID_ORIGIN, a same-origin mutation reaches the
  limiter and returns 429 (the documented fail-closed behaviour when the database is down),
  `/w/<unknown>` renders the friendly unavailable screen instead of an internal error page, and
  `/api/og/<slug>` returns a real 1200x630 PNG teaser card.
- Database reachability was diagnosed precisely: the Atlas SRV and TXT records resolve and the
  three shard hosts answer DNS, but TCP 27017 is refused while HTTPS 443 to Cloudinary works.
  The network this build ran on blocks outbound MongoDB traffic, so the seeded flows could not be
  executed here even though the credentials are valid. `npm run seed` followed by
  `npx tsx --env-file=.env scripts/verify-api.ts` produces that evidence in one command from an
  open network or against a local MongoDB.
- Security note for the team: the credentials were pasted into an AI prompt, which docs/02
  SECTION 3 explicitly advises against. `.env` is git-ignored and nothing was committed, but the
  Atlas database password, the Cloudinary API secret and the AI key should be rotated before
  submission and never shared in a prompt or a repository again.
- Two defects were found by the smoke test and fixed: the public page loader and the OG route
  queried Mongoose without opening the shared connection (`bufferCommands: false` made that throw
  immediately), and a database outage produced a 500 internal error page on `/w/[slug]` instead
  of a friendly screen.
- `docs/02` steps AR-A, AR-B, AR-01 to AR-10 and AR-12 (SPEC.md).
- `docs/01` checkpoints OV-00, OV-01, OV-02, OV-04, OV-05, OV-06, OV-08, OV-09, OV-10.

Not verified (they need a reachable database or a browser session):

- AR-05 (health against a real database), AR-11 (running the seed twice), AR-13 (deployment),
  AR-14.
- OV-03 and OV-07, OV-11, OV-12.
- Every file 03 phase checkpoint, the file 04 UI checkpoints and the file 05 QA gates: they
  require running the seeded app end to end in a browser, which needs `MONGO_URI` and
  Cloudinary credentials. The visual play-through of the three templates, the wizard in a real
  browser and the Lighthouse runs are therefore still open.
- No git commits or pushes were made: the repository was left as working files only, as asked.
