Planning rate limits, OG images, seeding, and deployment setup.
# Full Build Blueprint: Occasion Page Generator
I've removed Redis (it goes under Future Scope) and organized this by system component instead of phases. Rate limiting runs on MongoDB, which you already have, so you add no new infrastructure.

## 1. Final stack
| Layer | Choice |
| --- | --- |
| App | Next.js 14+ App Router, single app (UI and API as Route Handlers under /api/v1) |
| Language | TypeScript, strict mode |
| Styling / UI | Tailwind, shadcn/ui for the app side only |
| Animation | Framer Motion, Lenis, canvas-confetti, tsParticles (GSAP only if needed) |
| Forms | react-hook-form + Zod (the same schemas are reused on the server) |
| Upload | react-dropzone, browser-image-compression, dnd-kit |
| DB | MongoDB Atlas + Mongoose |
| Media | Cloudinary, with signed direct browser uploads |
| Auth | bcrypt, JWT in an httpOnly cookie |
| Security | Security headers and CSP in next.config, isomorphic-dompurify, nanoid, slugify |
| Share | qrcode (server-side PNG data URL), @vercel/og / ImageResponse |
| Charts | recharts (insights) |
| Logging | pino |
| Tests | Vitest (rate limiter, slug, validation, lock logic) |
| Hosting | Vercel + Atlas + Cloudinary, all free tier |
Since there is no separate server, your README's "Frontend URL / Backend URL" is the same URL. Say so in the README and adapt the setup steps (npm i && cp .env.example .env && npm run seed && npm run dev).

## 2. Architecture and system design principles
Layering. Every request flows through the same layers:

route handler → withApi() wrapper → auth/role guard → rate limiter → Zod validation → service → model

Route handlers stay thin. Business logic lives in services/.
withApi() is your central error middleware. It catches every error, maps it to {success:false, error:{code,message,details}}, never leaks stack traces, and attaches a request ID.
Stateless: JWT cookie, no server sessions, no in-memory state. This is what lets it scale on serverless.
One renderer, many templates: the DB stores data only. /w/[slug] and the wizard's live preview render the same React component.
Compute, don't schedule: a SCHEDULED page needs no cron job. The server compares revealAt to now on every read, so unlock is exact and cannot drift.
Never trust the client: the countdown is displayed on the client but enforced on the server. Locked content is never in the response.
Cache by sensitivity: unlocked public pages get Cache-Control: public, s-maxage=60, stale-while-revalidate=300. Locked or password pages get private, no-store. View counting is a separate POST, so caching never breaks analytics.
Idempotency: publishing twice returns the same slug. The slug is permanent after first publish.
Optimistic concurrency: pages carry a rev integer, and PATCH sends it. A stale autosave gets 409 instead of silently overwriting (this matters with two tabs open).
Atomic writes: counters use $inc, and dedupe uses unique indexes. Nothing is read-modify-write.
Fail policy: auth and unlock limiters fail closed (if the limiter errors, reject). Public read limiters fail open (don't take the site down for a limiter bug).
## 3. Rate limiting (MongoDB-backed, no Redis)
A fixed-window counter stored in a ratelimits collection with a TTL index, using one atomic upsert per check:

ts
// lib/rateLimit.ts
export async function rateLimit(o: {
  bucket: string; id: string; limit: number; windowSec: number; failOpen?: boolean;
}) {
  const w = o.windowSec * 1000;
  const windowStart = Math.floor(Date.now() / w) * w;
  const key = `${o.bucket}:${o.id}:${windowStart}`;
  try {
    const doc = await RateLimit.findOneAndUpdate(
      { key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + w + 60_000) } },
      { upsert: true, new: true }
    );
    const allowed = doc.count <= o.limit;
    return { allowed, remaining: Math.max(0, o.limit - doc.count),
             retryAfter: Math.ceil((windowStart + w - Date.now()) / 1000) };
  } catch (e) {
    if (e.code === 11000) return rateLimit(o);       // concurrent-upsert race: retry once
    return { allowed: o.failOpen ?? true, remaining: 0, retryAfter: o.windowSec };
  }
}
// schema: key (unique index), count, expiresAt (TTL index, expireAfterSeconds: 0)
When blocked, return 429 with the standard error shape plus Retry-After, and set X-RateLimit-Remaining on all limited routes.

Limits table:

| Bucket | Key | Limit | Policy |
| --- | --- | --- | --- |
| auth:login | IP + email | 5 / 15 min | fail closed |
| auth:register | IP | 5 / hour | fail closed |
| unlock | IP + slug | 5 / 10 min | fail closed |
| wish:page | visitorId + slug | 3 / hour (spec) | fail closed |
| wish:ip | IP | 20 / hour | fail closed |
| view | IP | 60 / min | fail open |
| public:read | IP | 120 / min | fail open |
| upload:sign | userId | 30 / hour | fail closed |
| publish | userId | 10 / hour | fail closed |
| ai | userId | 10 / hour (bonus) | fail closed |
Notes:

Client IP comes from the first x-forwarded-for entry. Store only sha256(ip + SECRET) (this is the ipHash field).
A fixed window allows a small burst at the window boundary. That's acceptable at your scale, and you can mention it in the viva as a known tradeoff.
Put the limiter behind a small RateLimiter interface. Swapping to Upstash Redis later is then a one-file change.
## 4. Data model (MongoDB)
users: name, email (unique), passwordHash, role (USER|ADMIN), avatar, isActive

templates: id (slug), name, description, previewImage, supportedOccasions[], defaultPalette, fonts, isActive

pages (as the spec, plus a few additions):

ownerId (index), slug (unique, sparse, since drafts have none), status (DRAFT|SCHEDULED|PUBLISHED|UNPUBLISHED|DISABLED)
occasion, customOccasionLabel, occasionDate, revealAt
recipient {name, nickname, relation, age?}, from, language, messages[] (1–5, ≤600), memories[] (≤8)
media[] {id, type, url, publicId, w, h, duration, caption, order}
theme {templateId, accent, font, music, decorations[]}
settings {passwordHash?, wishesWall, showViews, allowDownload}
ogImageUrl, thumbnailUrl, stats {views, uniqueViews, wishes}, deploy (bonus)
rev, createdAt, updatedAt
wishes: pageId (index), name, message (≤280), emoji, ipHash, isHidden, createdAt

View tracking (three small collections):

pageViews: {pageId, visitorId, createdAt}, unique index on (pageId, visitorId) with a TTL of 30 min. A duplicate-key error means "already counted in this window", so skip the $inc. This implements the 30-minute rule with no extra logic.
pageVisitors: unique (pageId, visitorId). A successful insert means a new unique, so $inc uniqueViews.
dailyStats: {pageId, date, views}, upserted with $inc, which feeds the views-over-time chart.
ratelimits: as above.

Indexes: pages(ownerId, createdAt), pages(slug), wishes(pageId, createdAt), dailyStats(pageId, date), and the TTL indexes above.

## 5. API (/api/v1)
Conventions: success is {success:true, data}, errors are {success:false, error:{code,message,details?}}, and lists accept ?page&limit&sort&search (limit capped at 50) and return {items,page,limit,total,totalPages}.

| Endpoint | Access | Notes |
| --- | --- | --- |
| POST /auth/register, /login, /logout; GET /auth/me | Public / Auth | Sets or clears the httpOnly cookie, rate limited |
| GET /templates | Public |  |
| POST /pages | Creator | Partial draft allowed |
| PATCH /pages/:id | Owner | Autosave, checks rev, returns 409 if stale |
| POST /pages/:id/publish | Owner | Full validation, slug, OG, QR |
| POST /pages/:id/unpublish, /duplicate | Owner | Duplicate gets a new draft with no slug |
| DELETE /pages/:id | Owner, Admin | Also deletes Cloudinary assets and wishes |
| GET /pages/mine | Creator |  |
| GET /public/pages/:slug | Public | Locked response, password gating, 404, disabled |
| POST /public/pages/:slug/unlock | Public | Password, returns a short-lived JWT in a cookie |
| POST /public/pages/:slug/view | Public | Deduped as above, owner excluded |
| GET/POST /public/pages/:slug/wishes | Public | Rate limited, profanity filter |
| DELETE /pages/:id/wishes/:wishId | Owner, Admin |  |
| POST /uploads/sign | Creator | Signed params |
| POST /media | Creator | Registers and verifies the asset |
| GET /pages/:id/insights | Owner |  |
| GET/PATCH /admin/pages, /admin/users, /admin/wishes, /admin/stats | Admin | Role check on the server |
| POST/GET /pages/:id/deploy, POST /ai/message | Owner (bonus) |  |
| GET /health | Public | For uptime checks |
Add an /api/og/[slug] route handler (outside /v1, as the spec shows).

## 6. Critical server-side rules
Publish:

Validate the full payload with Zod: occasion, recipient name (≤40), ≥1 message (≤600 each), ≥1 image, valid template, media counts and MIME types.
Generate the slug as slugify(name-occasion)-nanoid(4). On a duplicate-key error, regenerate the suffix (the unique index is the real guard, not a pre-check).
Set status to SCHEDULED if revealAt > now, else PUBLISHED. Generate the QR, thumbnail and OG URL, and return {slug,url,status,revealAt,qrCode,ogImage}.
Public page:

Check in this order: unknown slug → 404, DISABLED/UNPUBLISHED → "unavailable" payload, then revealAt > now → return only {locked:true, firstName, revealAt}. Then password set and no valid unlock cookie → {locked:true, passwordRequired:true, firstName}. Otherwise return the full page.
Never return passwordHash, ownerId or owner email.
Unlock token: a JWT with {slug, rev}, 2-hour expiry, in an httpOnly cookie. The server verifies it on every full-content request. Rate limit attempts as in section 3.

Media (Cloudinary):

/uploads/sign signs {timestamp, folder: "wishly/{userId}", allowed_formats} and never exposes the API secret.
/media registers an asset only if its publicId starts with the user's folder, then calls cloudinary.api.resource to verify real size, type and duration (≤8MB images, ≤50MB / ≤60s video). Don't trust client-reported numbers.
Deliver with f_auto,q_auto,w_1200, and a blur placeholder (w_20,e_blur) for progressive loading.
Deleting a page calls cloudinary.uploader.destroy for every asset.
Sanitization:

Strip HTML from every user string on write (DOMPurify with no allowed tags), and let React's escaping handle render. Never use dangerouslySetInnerHTML.
Wishes also go through a profanity filter (a small word list, including Hinglish terms).
Security headers (in next.config): CSP (allow res.cloudinary.com for images and media), HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors none. CORS is same-origin by default, and you restrict any public routes explicitly.

Cookies: httpOnly, Secure, SameSite=Lax. For state-changing routes, verify the Origin header matches your app URL (basic CSRF protection).

OG for locked pages: the OG image and meta must show only a generic "Something special is coming for {firstName}" card. Otherwise the preview leaks the very content the lock hides.

## 7. Frontend structure
app/
  (marketing)/page.tsx            landing
  (auth)/login, signup
  dashboard/  create/  create/[id]/review
  pages/[id]/edit, pages/[id]/insights
  templates/   admin/
  w/[slug]/page.tsx               server fetch + generateMetadata
  api/v1/...   api/og/[slug]/route.tsx
components/ wizard/ preview/PhoneFrame.tsx ui/
templates/ neon-night/ pastel-dream/ royal-gold/ registry.ts
sections/  Lock Intro Hero Message Timeline Gallery Video WishesWall Finale Global
locales/   en.json hinglish.json hi.json
lib/       db.ts auth.ts rateLimit.ts response.ts withApi.ts cloudinary.ts slug.ts
models/ services/ schemas/ (Zod, shared) scripts/seed.ts
## 8. The wizard (/create, /pages/:id/edit)
Six steps: Occasion → Recipient → Words & Language → Media → Style → Review. Include a progress bar, back/next, per-step Zod validation, and full keyboard support.
Occasion: type, custom label, date, and a "reveal at midnight" toggle.
Recipient: name, nickname, relation, from.
Words: 1–5 messages with a character counter, up to 8 memories (title, date, photo picker), and the language picker.
Media: drag-and-drop, client compression, per-file progress, dnd-kit reorder, captions, and delete. Limits are enforced client-side and server-side.
Style: template cards with live thumbnails, accent colour picker, music (3–4 royalty-free tracks ≤2MB in /public/music), decorations, and settings (password, wishes wall, show views, allow download).
Autosave: debounced PATCH (~800ms) plus a localStorage mirror, with a "Saved ✓ / Saving…" indicator.
Live preview: a PhoneFrame renders the real template component with draft data (desktop on the right, "Preview" button on mobile).
Review: a summary and a Generate button, then a success modal with link, copy, downloadable QR PNG, WhatsApp and Instagram share, and confetti.
## 9. The generated page (25 marks)
Sections, in order:

Lock screen: flip-digit countdown (server-provided revealAt) or a password gate.
Intro: name letters animate in, then "Tap to begin", which starts music and the video sound (autoplay is blocked otherwise).
Hero: 3-layer parallax from one useScroll. Background is the starfield, petals or bokeh at ~0.2x, the mid layer is balloons or hearts at ~0.5x, and the giant name is at 1x. Add mouse tilt on desktop and gyro tilt on mobile.
Message: typewriter or word-by-word reveal, a handwriting font option, and a signature.
Timeline: cards slide in on scroll with photo and date.
Gallery: each template uses a different layout, with staggered reveal and a lightbox.
Video: autoplays muted when in view, tap to unmute, rounded glow frame.
Wishes wall: floating cards or sticky notes, and the add-wish form.
Finale: cake with tap-to-blow candles, a confetti cannon, fireworks, a closing line, and replay/share.
Global: music toggle, scroll progress bar, Lenis smooth scroll, and a "Made with ❤ on …" footer.
Three genuinely distinct templates (layout, not just colour):

| Template | Layout identity | Signature |
| --- | --- | --- |
| Neon Night | Dark, a masonry gallery, a glitch reveal | Glowing text, starfield, confetti cannon |
| Pastel Dream | Light, a polaroid-stack gallery | Floating balloons, doodles, Caveat handwriting |
| Royal Gold | Elegant serif, a slow 3D carousel gallery | Letter-opening intro, gold foil shimmer, rose petals |
Cross-cutting requirements:

Load only one template per page via next/dynamic on the registry.
Support three languages from locales/*.json, with a Devanagari font loaded for Hindi, and a locale key for every string.
Make decorations occasion-aware (birthday: cake, balloons and confetti; anniversary: hearts and petals; custom: neutral sparkles).
Design mobile-first at 360px.
Performance:
Animate only transform and opacity.
Use will-change: transform on parallax layers.
Lazy-load media.
Honour prefers-reduced-motion with simple fades.
Target Lighthouse mobile ≥ 80.
Edge cases:
One photo gives a hero-style single image.
Portrait and landscape mixes work.
Hindi names work under an English language.
Slow 3G shows progressive images.
A disabled page shows "This page is unavailable".
An unknown slug shows a beautiful 404 with "Create your own surprise".
Choreograph so there is one focal animation per screen. That's the "rhythm" the document warns about.

## 10. Creator and admin screens
Landing: an animated hero demo, a 3-step "How it works", a template carousel with live mini-previews, sample pages, testimonials, FAQ, and CTA.
Dashboard: cards with thumbnail, recipient, occasion chip, status chip (Draft/Scheduled/Live/Disabled), views, and actions (Open, Edit, Duplicate, Share, Delete with confirm). Include skeleton loading and an empty state with a CTA.
Insights: views over time (recharts from dailyStats), total and unique views, a wishes list with delete, and the bonus deploy status.
Template gallery at /templates with a full-screen preview using sample data.
Admin: stats cards, a pages table with Disable/Enable, a users table, and wishes moderation. Every API call re-checks the role on the server.
UI states everywhere: loading skeletons, empty, error and success toasts.
## 11. Seed, config, deployment
Seed script: an admin (admin@demo.com / Admin@123), a creator (creator@demo.com / Creator@123), all templates, and 3+ sample pages covering each template, Birthday + Anniversary, and English, Hinglish and Hindi. Upload sample images to Cloudinary from the script.
.env.example (comment every line): MONGODB_URI, JWT_SECRET, UNLOCK_JWT_SECRET, IP_HASH_SECRET, NEXT_PUBLIC_APP_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, and optionally GEMINI_API_KEY, VERCEL_TOKEN. No hard-coded URLs.
Mongoose on serverless: cache the connection on globalThis so each invocation doesn't open a new one. In Atlas, allow 0.0.0.0/0 for Vercel and use a strong DB password.
Observability: pino logs with a request ID in every log line and error response, plus /health.
Deploy: Vercel (set env vars in the dashboard), and test WhatsApp link previews with a real link.
Deliverables: README with the template, test credentials, API table, and honest Known Limitations. Also a PROMPTS.md (10–20 prompts), a 3–5 min demo video with a mobile segment, and 3+ live sample pages.
## 12. Bonus features (in order of value)
AI "Write it for me" using the Gemini free tier via /ai/message, rate limited per user, returning suggestions in the chosen language.
Mic candle blow with the Web Audio API, falling back to tap.
Option B deploy: the simplest version is a pre-deployed renderer app, since your /w/slug already works that way.
3D scene (React Three Fiber) or music sync.
## 13. Future scope (for your README)
Redis (Upstash) behind the existing RateLimiter interface, with sliding-window limits.
A CDN or edge cache layer for hot public pages.
A background job queue for deploys and Cloudinary orphan cleanup.
Google OAuth, refresh tokens, and email verification.
Per-page custom domains.
## 14. Rubric coverage check
| Rubric item | Where it's covered |
| --- | --- |
| Visual & motion (25) | Sections 9, 3 templates, one-focal-animation choreography |
| Templates & occasion (12) | Distinct layouts, decorations, i18n |
| Wizard UX (12) | Section 8 |
| Media pipeline (10) | Signed uploads, compression, progress, reorder, server verification |
| Generation & sharing (10) | Slug, QR, WhatsApp, OG, server-side countdown and password |
| Auth/dashboard/admin (10) | Sections 5, 10, server-side RBAC |
| Performance (8) | Dynamic imports, lazy media, reduced-motion, Lighthouse |
| Code quality (6) | Layering, Zod, sanitization, README, .env.example |
| Viva (7) | Every member owns one module and can explain its rate limiter, lock logic and schema |
For the viva, make sure everyone can explain the three non-obvious decisions: the Mongo-based fixed-window limiter, the server-side lock with computed status, and the TTL-index view dedupe.

If it would help, I can write the SPEC.md, the Mongoose models, or the starter prompts for each module next. I can also put this blueprint into a file.
