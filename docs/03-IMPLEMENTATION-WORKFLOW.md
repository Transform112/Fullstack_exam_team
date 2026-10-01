# 03 - IMPLEMENTATION WORKFLOW

Project: Wishly
Prerequisite: read file 01, complete its SECTION 13 setup checks, and finish file 02 foundation checkpoints AR-A, AR-B, AR-01 to AR-14. Product acceptance checkpoints such as OV-03 are completed after implementation, not before Phase 1.

This file is the build order. It lists every step from the first feature to the final polish. Each step names its owner role, the files to create, what to build, a prompt to log, how to verify, and the commit message. Visual and animation details are NOT repeated here; where a step needs them it points to a named recipe in file 04.

All rules from file 01 SECTION 0 and file 02 header apply. Additional rules for this file:

1. Execute steps strictly in the order written. Do not start a step before the previous step's checkpoint is marked [x].
2. Each step ends with: verify, log the prompt, mark only the verified checkpoints, then have the step owner commit code and checkpoint evidence together. Commit labels below are guidance for the human team; an agent must not commit or create branches unless explicitly authorized.
3. Server components and server layouts call lib functions directly (getCurrentUser, getOwnedPage, serializeOwnerPage, loadPublicPage). They never fetch their own API over HTTP.
4. Client components call the API only through lib/client-api.ts (SECTION 5).
5. Never change an endpoint contract from file 02. If a contract must change, change file 02 and SPEC.md first, then the code.
6. If the same VERIFY fails after 3 fix attempts, stop. Write the exact error and what was tried in docs/DECISIONS.md under the heading BLOCKERS and report to the human. Do not fake a pass, do not stub the feature, do not skip ahead.
7. When a step finishes a requirement from file 01 SECTION 6 (for example AUTH-1), open docs/01-PROJECT-OVERVIEW.md and mark that requirement checkpoint [x] only after its own VERIFY there passes.

CHECKPOINT WF-00: Prerequisites confirmed.
- [ ] Done
- VERIFY: `curl -i https://<production-url>/api/v1/health` returns 200 and `npm run build` passes locally.

---

## SECTION 1. TEAM ROLES AND OWNERSHIP

Four roles. Each step has an Owner tag. If the team has fewer than four members, one member covers several tags, but every member must still own and commit at least one step.

- M = Motion and UI lead: template system, all wish-page sections and animations, performance.
- F = Frontend #2: landing page, auth UI, wizard, dashboard, insights, admin UI.
- B = Backend lead: models, auth, pages API, public API, wishes, views, admin API.
- D = Media and DevOps: Cloudinary uploads, compression, OG images, QR and share kit, deployment.

Rule: the step owner makes the commits for that step from their own GitHub account. Run `git shortlog -sn` at the end of each phase; every member must appear.

---

## SECTION 2. GIT WORKFLOW

1. Default branch: main. Never commit directly to main after Phase 0.
2. One branch per phase:
   - Phase 1: feature/foundation
   - Phase 2: feature/wizard
   - Phase 3: feature/templates
   - Phase 4: feature/share-polish
   - Phase 5: feature/ship
   - Bonus: feature/bonus
3. Within a phase, owners may use sub-branches named feature/<phase>-<short-name> and merge them into the phase branch.
4. Commit after every completed step. Message format: type(scope): description. Types: feat, fix, chore, docs, refactor, style, test. Example: feat(wizard): add recipient step.
5. At the end of each phase, after its acceptance checkpoint is marked, open a pull request from the phase branch into main, merge it, and pull main before starting the next phase. Vercel redeploys main automatically.
6. Never commit .env, node_modules, .next, or any secret.

---

## SECTION 3. PROMPT LOGGING AND AI SESSION HEADER

PROMPTS.md rule: after each step, append the prompt that was used for that step in this format:

    ## <step id> - <short title>
    Prompt: <the prompt text actually used>
    Result: <one line on what it produced>

Each step below contains a Prompt line. Use it as the starting prompt, and log the final version if it was adjusted. File 05 requires 10 to 20 entries in the final PROMPTS.md; at submission time, keep the most important ones in order.

AI SESSION HEADER: start every AI coding session with this text.

    Project Wishly: Next.js App Router with TypeScript, Mongoose, Tailwind, shadcn/ui, Framer Motion.
    Read docs/01-PROJECT-OVERVIEW.md, docs/02-ARCHITECTURE-AND-DATA.md and SPEC.md first.
    Follow the locked decisions and endpoint contracts exactly. Do not add libraries or endpoints that are not listed.
    Animate only transform and opacity. Respect prefers-reduced-motion. Keep code simple and commented so a student can explain it.
    Work on one step only: <step id>.

---

## SECTION 4. PHASE MAP

- Phase 1 Foundation (about 15 percent): auth, pages API, upload pipeline, publish, empty /w/[slug] rendering data. Steps P1-01 to P1-08. Branch feature/foundation.
- Phase 2 Wizard (about 20 percent): all 6 steps save to the database, autosave, live preview. Steps P2-01 to P2-09. Branch feature/wizard.
- Phase 3 Templates (about 35 percent): 3 animated templates with all P0 and P1 sections, mobile-perfect. Steps P3-01 to P3-18. Branch feature/templates.
- Phase 4 Share and polish (about 15 percent): dashboard, share kit, OG, countdown, password, wishes wall, insights, admin, landing. Steps P4-01 to P4-14. Branch feature/share-polish.
- Phase 5 Ship (about 10 percent): performance, code quality, handoff to file 05. Steps P5-01 to P5-03. Branch feature/ship.
- Bonus (only after file 05 is fully done): PAGE-6, LANG-2, DEPLOY-1. Steps BN-01 to BN-03. Branch feature/bonus.

If time runs short, NEVER cut a P0 item. Cut in this order: bonus items; fine performance tuning beyond a Lighthouse score of 80; admin tables beyond the disable-page action; the insights chart (keep the three numbers); server autosave (keep localStorage autosave). Record every cut in README under Known Limitations.

---

## SECTION 5. SHARED CONVENTIONS (APPLY IN EVERY PHASE)

### 5.1 lib/client-api.ts (REFERENCE, create in step P1-02)

    export class ApiError extends Error {
      status: number;
      code: string;
      details?: { path: string; issue: string }[];
      constructor(status: number, code: string, message: string, details?: { path: string; issue: string }[]) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
      }
    }

    // Calls /api/v1<path>, returns data, throws ApiError on failure.
    export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
      const hasBody = init?.body !== undefined;
      const res = await fetch(`/api/v1${path}`, {
        method: init?.method ?? "GET",
        headers: hasBody ? { "Content-Type": "application/json" } : undefined,
        body: hasBody ? JSON.stringify(init!.body) : undefined,
        credentials: "same-origin",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new ApiError(res.status, json?.error?.code ?? "UNKNOWN", json?.error?.message ?? "Something went wrong", json?.error?.details);
      }
      return json.data as T;
    }

### 5.2 UI states (mandatory on every data-driven screen)

- Loading: shadcn Skeleton or a spinner.
- Empty: components/app/EmptyState.tsx with a message and a call-to-action button.
- Error: components/app/ErrorState.tsx with the message and a Retry button.
- Success: sonner toast. The Toaster is mounted once in app/layout.tsx.
- Errors from the API are shown as toast.error(err.message). Field errors from details are shown inline under the field.

### 5.3 App design tokens (app side only; generated pages use their own tokens from file 04)

Add to globals.css as CSS variables and map them in the Tailwind theme:

- primary: #7C3AED (Electric Violet) for buttons, links, progress
- accent: #EC4899 (Hot Pink) for highlights
- sunshine: #FBBF24 for badges
- ink: #0F0A1E for dark sections and text
- canvas: #FAF7FF for the app background
- success: #10B981 for published and saved

App fonts: Poppins for headings and Inter for body text, loaded with next/font/google in app/layout.tsx. Border radius 12px for cards and 9999px for chips and buttons.

### 5.4 Status chip colours (dashboard and admin)

Draft: gray. Scheduled: amber. Live: success green. Unpublished: slate. Disabled: red.

### 5.5 Responsiveness rule

Every screen must work at 360px width with no horizontal scroll. Check each step at 360px and 1280px before marking it.

### 5.6 Verification environment and mutation rules

On Windows PowerShell use curl.exe, not the curl alias. Every POST/PATCH/DELETE example below also needs `-H "Origin: http://localhost:3000"` (use the actual app origin if the port changes); JSON can be passed via a temporary fixture file with `--data-binary @fixture.json` to avoid shell quoting differences. Cookie jars stay git-ignored and must be removed after testing. Use isolated test users/database for limiter and destructive checks.

Every PATCH sends the last server-returned rev. Draft creation, successful PATCH, upload registration/deletion and publish return the current revision; update wizard state before the next write. Route all wizard writes through one serialized queue so Next, autosave, reorder and captions cannot race. On 409 STALE_REVISION preserve local edits, stop automatic writes and offer reload/compare, not blind retry. Drain pending saves before Review or Generate. Auth, unlock and other mutations obey the Origin guard too.

Add the Vitest cases from file 05 as the corresponding backend steps are implemented; do not defer all tests until shipping. Use Playwright for the wizard/publish/viewer flow once the UI exists. The final file 05 gates re-run these tests, they do not assume earlier manual checks prove concurrency safety.

---

## PHASE 1. FOUNDATION

Branch: feature/foundation. Goal: a user can register, log in, create a draft, upload media, publish, and open /w/[slug] showing the page data.

### STEP P1-01 [Owner B] Auth API

Files: app/api/v1/auth/register/route.ts, login/route.ts, logout/route.ts, me/route.ts.
Build: implement EP-02, EP-03, EP-04, EP-05 exactly as in file 02 SECTION 9, including rate limits and cookie handling.
Prompt: "Implement EP-02 to EP-05 from docs/02 SECTION 9 using the helpers in lib/. Register hashes with bcrypt, login returns the same error for unknown email and wrong password, cookie wishly_token is httpOnly."
Verify (run in order):
1. `curl -i -c jar.txt -H "Content-Type: application/json" -d '{"name":"Test User","email":"t1@example.com","password":"Test1234"}' http://localhost:3000/api/v1/auth/register` returns 201 and a Set-Cookie header with wishly_token.
2. Repeating the same command returns 409 EMAIL_TAKEN.
3. `curl -b jar.txt http://localhost:3000/api/v1/auth/me` returns the user without any passwordHash.
4. In an isolated limiter bucket, wrong passwords return 401 INVALID_CREDENTIALS; the sixth login attempt for the same IP and email within 15 minutes returns 429 with Retry-After.
5. In MongoDB Atlas the stored password starts with $2 (bcrypt).
Commit: feat(auth): add register login logout me endpoints.
- [ ] Done (CHECKPOINT P1-01)

### STEP P1-02 [Owner F] Client helper, app shell and auth UI

Files: lib/client-api.ts, components/app/AppNav.tsx, components/app/EmptyState.tsx, components/app/ErrorState.tsx, app/layout.tsx, app/globals.css, app/(auth)/login/page.tsx, app/(auth)/signup/page.tsx, app/(app)/layout.tsx, app/(app)/dashboard/page.tsx (placeholder), app/admin/layout.tsx, app/admin/page.tsx (placeholder).
Build:
1. Create lib/client-api.ts from SECTION 5.1. Apply the design tokens and fonts from SECTION 5.3. Mount the sonner Toaster in app/layout.tsx.
2. Login and signup pages: clean centered cards, react-hook-form with zodResolver using loginSchema and registerSchema from lib/validators.ts, inline field errors, submit button with loading state, toast on API errors. On success call router.push("/dashboard") then router.refresh(). A logged-in visitor opening /login or /signup is redirected to /dashboard (check with getCurrentUser in a server wrapper).
3. app/(app)/layout.tsx is a SERVER layout: call getCurrentUser(); if null redirect("/login"); otherwise render AppNav (logo "Wishly", links Dashboard and Templates, an Admin link only for role ADMIN, user name, Logout button that calls EP-04 then router.push("/login")) and the children.
4. app/admin/layout.tsx is a SERVER layout: no user redirects to /login; a user whose role is not ADMIN redirects to /dashboard.
5. Dashboard and admin pages are placeholders showing a heading and a "Create a surprise" button linking to /create (dashboard only).
Prompt: "Build the login and signup pages and the protected (app) and admin server layouts from docs/03 step P1-02. Use react-hook-form with zod, inline errors, loading state and sonner toasts. Use the app design tokens in docs/03 SECTION 5.3."
Verify:
1. Opening /dashboard while logged out redirects to /login.
2. Signing up with a weak password shows an inline error; signing up correctly lands on /dashboard with the user name in the navbar.
3. Logout returns to /login and /dashboard is protected again.
4. Logging in as creator@demo.com / Creator@123 and opening /admin redirects to /dashboard; logging in as admin@demo.com / Admin@123 can open /admin.
5. Both pages have no horizontal scroll at 360px.
Mark AUTH-1 and AUTH-2 in file 01 after this passes.
Commit: feat(auth-ui): add login signup and protected layouts.
- [ ] Done (CHECKPOINT P1-02)

### STEP P1-03 [Owner B] Templates API

Files: app/api/v1/templates/route.ts.
Build: implement EP-06.
Prompt: "Implement EP-06 from docs/02 returning active templates."
Verify: `curl http://localhost:3000/api/v1/templates` returns the 3 seeded templates with ids neon-night, pastel-dream, royal-gold.
Commit: feat(templates): add templates list endpoint.
- [ ] Done (CHECKPOINT P1-03)

### STEP P1-04 [Owner B] Pages API: create, read, update

Files: app/api/v1/pages/route.ts (POST), app/api/v1/pages/[id]/route.ts (GET, PATCH).
Build: implement EP-07, EP-09, EP-10 exactly as in file 02. Implement serializeOwnerPage and getOwnedPage in lib/page-helpers.ts first if not already complete.
Prompt: "Implement EP-07, EP-09 and EP-10 from docs/02 SECTION 9. PATCH requires rev, ignores unknown keys, cannot add media, hashes settings.password and returns 409 STALE_REVISION for a stale atomic update."
Verify (using the cookie jar from P1-01):
1. `curl -b jar.txt -H "Content-Type: application/json" -d '{}' http://localhost:3000/api/v1/pages` returns 201 with an id and status DRAFT.
2. PATCH that id with {"occasion":"BIRTHDAY","recipient":{"name":"Riya"},"messages":["Hello <b>Riya</b>"]} returns 200 and the message is stored as "Hello Riya" (tags removed).
3. PATCH with {"status":"PUBLISHED","slug":"hack"} returns 200 but status stays DRAFT and slug stays absent.
4. PATCH with {"settings":{"password":"abcd"}} returns settings.hasPassword true and the response contains no passwordHash.
5. A second user (register another account) calling GET on the first user's page id gets 403.
6. A malformed id like "abc" returns 404.
7. Two PATCH requests with the same rev result in one success and one 409; stale data is never written. Each PATCH example above includes the latest returned rev.
Commit: feat(pages): add create read update endpoints.
- [ ] Done (CHECKPOINT P1-04)

### STEP P1-05 [Owner B] Public page loader and public page endpoint

Files: lib/public-page.ts, app/api/v1/public/pages/[slug]/route.ts.
Build:
1. Create lib/public-page.ts exporting loadPublicPage(slug, user, readCookie) where readCookie(name) returns a cookie value or undefined. It finds the page by slug, runs checkPageAccess with the token from cookie wishly_view_<pageId>, and returns { result, page, payload }. payload is the exact open payload from EP-18 (use serializePublicPage), or the locked payload shapes.
2. Implement EP-18 using loadPublicPage and map results to status codes exactly as listed in EP-18.
Prompt: "Create lib/public-page.ts and EP-18 from docs/02. The locked responses must contain only the fields listed. Scheduled and password content must never be returned before the check passes."
Verify (seed data must exist):
1. `curl http://localhost:3000/api/v1/public/pages/riya-birthday-7f3a` returns locked false with messages, media, memories, theme.
2. `curl .../public/pages/dev-farewell-3c8z` returns ONLY locked true, reason SCHEDULED, recipientFirstName, revealAt. Confirm no messages or media keys exist in the response.
3. `curl .../public/pages/sana-friendship-5h2q` returns ONLY locked true, reason PASSWORD, recipientFirstName.
4. `curl .../public/pages/does-not-exist` returns 404 PAGE_NOT_FOUND.
5. No response contains passwordHash, ownerId or email.
Commit: feat(public): add public page loader and endpoint.
- [ ] Done (CHECKPOINT P1-05)

### STEP P1-06 [Owner D] Upload pipeline

Files: app/api/v1/uploads/sign/route.ts, app/api/v1/media/route.ts, app/api/v1/pages/[id]/media/[mediaId]/route.ts, app/(app)/dev-upload/page.tsx (temporary).
Build:
1. Implement EP-11, EP-12, EP-13 exactly as in file 02, and the media pipeline of file 02 SECTION 10.
2. Create the temporary client page /dev-upload: a text input for pageId, a file input (image or mp4), and an upload button that runs steps 4 to 6 of the media pipeline with XMLHttpRequest and shows a progress percentage and the returned media item. This page is deleted in step P2-05.
Prompt: "Implement signed direct Cloudinary uploads: EP-11 signs, the browser uploads straight to Cloudinary, EP-12 verifies the asset with cloudinary.api.resource and enforces size, format, duration and count limits. Add a temporary /dev-upload page to test it."
Verify:
1. Uploading a normal jpg to a draft page succeeds; GET EP-09 shows the media item with a Cloudinary URL and thumbnailUrl set.
2. Uploading a file larger than 8 MB as an image returns 400 and the asset no longer exists in Cloudinary.
3. Uploading a 16th image returns 400. Uploading a third video returns 400.
4. Calling EP-12 with a publicId that does not start with wishly/<your user id>/ returns 403.
5. EP-13 removes an unshared item and its asset; duplicated/shared media remains available. Responses carry the new rev.
6. The CLOUDINARY_API_SECRET value does not appear in any response or in browser network traffic.
Mark MEDIA-1 server part done; the file 01 MEDIA-1 checkpoint is marked in step P2-05 after the full UI exists.
Commit: feat(media): add signed upload pipeline.
- [ ] Done (CHECKPOINT P1-06)

### STEP P1-07 [Owner B] Publish endpoint

Files: app/api/v1/pages/[id]/publish/route.ts.
Build: implement EP-14 exactly as in file 02 (validation, template check, decorations, slug generation with retry, status, qrCode, response).
Prompt: "Implement EP-14 from docs/02. Validate with publishSchema, generate the slug with buildSlug and retry on duplicate key, set SCHEDULED when revealAt is in the future, return slug, url, status, revealAt, qrCode, ogImage."
Verify:
1. Publishing a draft with no image returns 400 with message "Add at least 1 photo".
2. After adding an image (via /dev-upload) and filling occasion, recipient name, a message and theme.templateId through PATCH, publish returns 200 with a slug like riya-birthday-ab12, a url, and a qrCode starting with data:image/png.
3. Sequential and concurrent publishes of the same page return the same persisted slug; an atomic lifecycle check cannot overwrite a concurrent admin disable.
4. Two different drafts for "Riya" and BIRTHDAY get different slugs.
5. With revealAt set to tomorrow, status in the response is SCHEDULED; with revealAt null it is PUBLISHED.
Mark GEN-1 server part done; file 01 GEN-1 is marked in step P4-03.
Commit: feat(publish): add publish endpoint with slug generation.
- [ ] Done (CHECKPOINT P1-07)

### STEP P1-08 [Owner M] Empty wish page route

Files: app/w/[slug]/page.tsx, app/w/[slug]/not-found.tsx.
Build:
1. app/w/[slug]/page.tsx is a SERVER component: await params, call getCurrentUser (may be null), call loadPublicPage with a readCookie built from (await cookies()). Handle results: NOT_FOUND calls notFound(); UNAVAILABLE renders a plain text "This page is unavailable"; LOCKED_* renders plain text showing the first name and the reveal date or "Password required"; OK renders a temporary view: a <pre> with the JSON payload.
2. not-found.tsx renders plain text "Page not found". Designed versions come in step P4-12.
Prompt: "Create the server component for /w/[slug] using loadPublicPage from lib/public-page.ts. Render raw JSON for the OK state for now."
Verify: opening /w/riya-birthday-7f3a shows JSON; /w/dev-farewell-3c8z shows the lock text; /w/nope shows not found; no console errors.
Commit: feat(wish-page): add public route rendering data.
- [ ] Done (CHECKPOINT P1-08)

### PHASE 1 ACCEPTANCE

CHECKPOINT PH1: Phase 1 complete.
- [ ] Done
- VERIFY:
  1. P1-01 to P1-08 are all [x].
  2. In the browser: sign up, create a draft through `curl` or the dev page, upload an image, publish through `curl`, open the returned /w/slug and see the JSON.
  3. `git shortlog -sn` shows every member.
  4. Open the pull request feature/foundation into main, merge, redeploy, and repeat the health check on production.
  5. Update PROMPTS.md and SPEC.md.

---

## PHASE 2. WIZARD

Branch: feature/wizard. Goal: the full 6-step wizard saves to the database, survives refresh, and shows a live preview.

### Wizard data model (use exactly)

Create lib/wizard.ts with this type and helpers.

    export type MediaItem = { id: string; type: "image" | "video"; url: string; publicId: string; w?: number; h?: number; duration?: number; caption?: string; order: number };
    export type WizardData = {
      occasion?: string; customOccasionLabel: string;
      occasionDate: string;          // yyyy-mm-dd, local date
      revealEnabled: boolean;        // client only
      revealTime: string;            // HH:mm, client only, default "00:00"
      recipient: { name: string; nickname: string; relation: string; age?: number };
      from: string;
      language: "HINGLISH" | "ENGLISH" | "HINDI";
      messages: string[];
      memories: { id?: string; title: string; date?: string; description?: string; mediaId?: string }[];
      media: MediaItem[];
      theme: { templateId: string; accent: string; font: "default" | "handwriting"; music: string; decorations: string[] };
      settings: { password?: string | null; hasPassword: boolean; wishesWall: boolean; showViews: boolean };
      rev: number;
      draftStep: number;
    };

Helpers to implement in lib/wizard.ts:
- emptyWizardData(): language ENGLISH, messages [""], theme { templateId "", accent "#FF4FA3", font "default", music "none", decorations [] }, settings { hasPassword false, wishesWall true, showViews false }, revealTime "00:00", rev 0, draftStep 1.
- fromServerPage(page): converts a serializeOwnerPage result into WizardData. occasionDate becomes the local yyyy-mm-dd; revealEnabled is true when revealAt exists; revealTime is the local HH:mm of revealAt (use date-fns format).
- toPatchBody(data, step): builds the EP-10 body for one step using the mapping in file 02 SECTION 12. revealAt is computed as new Date(`${occasionDate}T${revealTime}:00`).toISOString() when revealEnabled and occasionDate exist, otherwise null. occasionDate is sent as new Date(`${occasionDate}T00:00:00`).toISOString(). Empty strings for optional text fields are omitted.
- toPreviewData(data): converts WizardData into the public payload shape (EP-18 open payload) with sensible placeholders: empty recipient name becomes "Your friend", empty messages become one sample line, no media becomes an empty array.

Per-step client schemas go in lib/wizard-schemas.ts:
- Step 1: occasion required; occasionDate required; customOccasionLabel required (max 40) when occasion is CUSTOM; when revealEnabled the computed reveal time must be in the future ("Reveal time must be in the future").
- Step 2: recipient.name required, 1 to 40 characters; nickname, relation at most 40; age optional integer 1 to 120; from at most 60.
- Step 3: language required; at least 1 non-empty message, at most 5, each at most 600 characters; memories at most 8, each with a required title of at most 60 characters.
- Step 4: at least 1 uploaded image; music must be one of none, soft-piano, happy-pop, party-beat, romantic-strings.
- Step 5: templateId required; accent a valid hex colour; password empty or 4 to 50 characters.
- Step 6: no fields.

### STEP P2-01 [Owner F] Wizard shell

Files: lib/wizard.ts, lib/wizard-schemas.ts, components/wizard/Wizard.tsx, components/wizard/WizardProgress.tsx, app/(app)/create/page.tsx, app/(app)/pages/[id]/edit/page.tsx.
Build:
1. Wizard is a client component taking props { initialPage?: ServerPage, mode: "create" | "edit" }. It keeps WizardData in React state (a context so steps and preview can read it), the current step (1 to 6), pageId, and a saveState of idle, saving, saved or error.
2. Progress bar across the top showing 6 labelled steps (Occasion, Recipient, Words, Media, Style, Review) and the percent complete; the bar fill animates with a Framer Motion spring.
3. Next button: validate the current step with its schema (react-hook-form per step or a plain safeParse); on failure show inline errors and do not move. On success save then advance. Back button never validates and never loses data.
4. Saving rules: if there is no pageId, step 1 Next calls EP-07 with toPatchBody(data, 1), stores the id, then router.replace(`/create?id=${id}`). Otherwise Next calls EP-10 with toPatchBody(data, step) plus draftStep. "Save draft" saves the current step without validating the form but still shows server errors.
5. app/(app)/create/page.tsx is a SERVER page: reads searchParams.id; if present loads the page with getOwnedPage and fromServerPage and passes initialPage; otherwise renders an empty wizard. app/(app)/pages/[id]/edit/page.tsx always loads the page and renders the Wizard with mode "edit". The wizard starts at initialPage.draftStep in create mode and at step 1 in edit mode.
6. Layout: on desktop (1024px and wider) two columns, left the form and right the preview pane (placeholder for now). On mobile one column with a floating "Preview" button (wired in step P2-07).
7. Keyboard: Enter inside a step submits Next; every control is reachable by Tab; focus moves to the first field when the step changes.
8. Step 6 renders a placeholder until P2-08. Steps 1 to 5 render placeholders until their steps.
Prompt: "Build the Wizard shell in docs/03 step P2-01: step state, progress bar, per-step zod validation, save on Next with EP-07 then EP-10, resume from ?id=, edit mode. Use lib/wizard.ts and lib/wizard-schemas.ts as specified."
Verify:
1. /create shows step 1 of 6 and the progress bar.
2. Next with an empty required field shows inline errors and stays on the step.
3. After step 1 passes, the URL becomes /create?id=<id> and a DRAFT exists in the database.
4. Back and Next keep the data.
Commit: feat(wizard): add wizard shell and progress.
- [ ] Done (CHECKPOINT P2-01)

### STEP P2-02 [Owner F] Step 1 Occasion

Files: components/wizard/StepOccasion.tsx.
Build: a grid of 7 occasion cards (Birthday, Anniversary, Wedding, Farewell, Congratulations, Friendship Day, Custom) with an icon from lucide-react each; selecting one highlights it. Custom shows a text field "Name your occasion". A date input for occasionDate. A switch "Lock the page until the occasion" with a time input (default 00:00) shown when on, with helper text "Visitors see a countdown until this time".
Prompt: "Build StepOccasion per docs/03 step P2-02 with 7 occasion cards, a date input and a reveal toggle with time."
Verify: every validation rule of Step 1 triggers correctly; choosing Custom without a label blocks Next; a reveal time in the past blocks Next; after Next and a browser refresh on ?id= the same values are shown.
Commit: feat(wizard): add occasion step.
- [ ] Done (CHECKPOINT P2-02)

### STEP P2-03 [Owner F] Step 2 Recipient

Files: components/wizard/StepRecipient.tsx.
Build: fields recipient name (required), nickname, relation (a text input with suggestion chips: Best friend, Partner, Sibling, Parent, Colleague, Child), age (optional number), and "From" (sender display name). Show character counters for name (40) and from (60).
Prompt: "Build StepRecipient per docs/03 step P2-03."
Verify: name over 40 characters blocked; relation chips fill the field; values persist after refresh.
Commit: feat(wizard): add recipient step.
- [ ] Done (CHECKPOINT P2-03)

### STEP P2-04 [Owner F] Step 3 Words and Language

Files: components/wizard/StepWords.tsx.
Build:
1. Language selector with three large options: Hinglish, English, Hindi (shows a short sample of the hero line in each using the copy from file 04 i18n recipe, or plain static text until then).
2. Messages: a list of textareas, minimum 1 and maximum 5, add and remove buttons, a live counter out of 600 per message.
3. Memories: an optional list up to 8; each row has title (required), date (input type date, stored as yyyy-mm-dd), and description (at most 300). A note under the list: "You can link photos to memories in the Media step".
4. A disabled button labelled "Write it for me (coming soon)" is NOT shown. LANG-2 is a bonus (step BN-02) and is added later.
Prompt: "Build StepWords per docs/03 step P2-04: language selector, 1 to 5 messages with counters, up to 8 memories."
Verify: 6th message cannot be added; empty first message blocks Next; a memory without a title blocks Next; Hindi text in a message saves and reloads correctly.
Commit: feat(wizard): add words and language step.
- [ ] Done (CHECKPOINT P2-04)

### STEP P2-05 [Owner D] Step 4 Media

Files: components/wizard/StepMedia.tsx, components/wizard/MediaUploader.tsx, components/wizard/MediaGrid.tsx, lib/upload.ts. Delete app/(app)/dev-upload/page.tsx.
Build:
1. lib/upload.ts: validateFile(file, existingMedia) applies file 02 SECTION 10 step 2; compressImage uses maxWidthOrHeight 2000 and maxSizeMB 1.5 (skip heic/heif); uploadToCloudinary(file, pageId, resourceType, onProgress) runs signing/direct upload/registration via EP-11 and EP-12, including signed allowed_formats. pageId is required to register the asset.
2. MediaUploader: react-dropzone area (drag and drop plus click) accepting images and mp4; each file shows a thumbnail, a progress bar and status; rejected files show a clear message such as "photo.png is larger than 8 MB". Counts shown as "6 of 15 photos, 1 of 2 videos".
3. MediaGrid: saved media as sortable dnd-kit tiles, caption input (max 120), confirmed delete (EP-13) and video badge. Reorder/captions save through the shared write queue with EP-10 { rev, media: [{ id, caption, order }] }, debounced by 800 ms. Upload/delete responses update rev before queued writes continue.
4. Music picker: 5 options (none, soft-piano, happy-pop, party-beat, romantic-strings) shown as selectable chips, each with a small play preview button for the files in public/music (files are added in file 04; until then the preview button is disabled when the file is missing). Saved in theme.music.
5. Memory linking: if the page has memories and images, show the section "Link photos to memories": one row per memory with a select listing the images by thumbnail or caption; saved into memories[].mediaId with EP-10.
6. Next requires at least 1 uploaded image.
Prompt: "Build the Media step per docs/03 step P2-05: dropzone, client validation, compression, progress bars via XMLHttpRequest, dnd-kit reorder, captions, delete, music picker, memory linking. Follow the media pipeline in docs/02 SECTION 10."
Verify:
1. Upload 9 photos and 1 video of 20 seconds; all appear in order with progress bars.
2. A 16th photo, a photo over 8 MB, a pdf, and a video over 60 seconds are each rejected with a clear message.
3. Reorder, captions and delete persist after refresh.
4. Network tab shows a photo of about 6 MB uploaded at a visibly smaller size.
5. Memory linking saves and survives refresh.
Mark MEDIA-1 and MEDIA-2 in file 01 after this passes.
Commit: feat(media-ui): add media step with upload and reorder.
- [ ] Done (CHECKPOINT P2-05)

### STEP P2-06 [Owner F] Step 5 Style

Files: components/wizard/StepStyle.tsx.
Build:
1. Template picker: cards loaded from EP-06 (with skeleton while loading and error state with retry) showing name, description and the palette swatches. Selecting sets theme.templateId and the accent to the template defaultPalette.accent unless the user already picked a custom accent.
2. Accent colour: 8 preset swatches (#FF4FA3, #7C3AED, #22D3EE, #FBBF24, #10B981, #F97316, #EF4444, #D4AF37) plus a hex text input.
3. Font option: default or handwriting for the message section.
4. Decorations: toggle chips (balloons, confetti, cake, hearts, petals, sparkles, stars); initial selection is DEFAULT_DECORATIONS for the occasion when theme.decorations is empty.
5. Extras: switch "Password protect this page" with a password input (4 to 50 characters; when the page already has a password show "Password is set" with a Change and a Remove button; Remove sends settings.password null); switch "Let friends leave wishes" (wishesWall); switch "Show view count on the page" (showViews).
Prompt: "Build StepStyle per docs/03 step P2-06: template cards from EP-06, accent swatches, font option, decoration chips, password and toggles."
Verify: template, accent, decorations, toggles and password persist after refresh; the password is never shown again after saving; Remove password sets hasPassword false.
Commit: feat(wizard): add style step.
- [ ] Done (CHECKPOINT P2-06)

### STEP P2-07 [Owner F] Live preview

Files: components/preview/PhoneFrame.tsx, components/preview/PreviewStub.tsx, components/preview/PreviewDrawer.tsx.
Build:
1. PhoneFrame: a rounded phone outline with a 360 by 720 inner viewport, matching file 04 SECTION 7.2, scaled with CSS transform to fit the pane. It contains its children, notch and thin border, and re-renders instantly from WizardData (no network call).
2. PreviewStub: a simple stand-in that takes toPreviewData(data) and shows a gradient background from the accent colour, the occasion label, a big greeting with the nickname or name, the first photo (use cld(url, "w_600,f_auto,q_auto")), and the first message. It is replaced by the real template in step P3-16.
3. Desktop: PhoneFrame in the right column. Mobile: a floating Preview button opens PreviewDrawer, a full-screen sheet with the same PhoneFrame content and a close button.
4. Autosave (FORM-2): after an 800 ms debounce store a password-free draft snapshot plus user id, baseRev and localSavedAt in localStorage key `wishly:draft:<pageId or "new">`. Never persist settings.password, cookies or tokens. Clear password input after successful saving; require re-entry after offline refresh. Clear account-specific mirrors on logout and do not restore another user's data. While pageId exists, enqueue PATCH of draft-valid fields 800 ms after the last edit using current rev; incomplete drafts may save even when Next validation fails. Track dirty fields across steps, flush before navigation/review, and retry network failures on reconnect. Do not silently label failed saves as Saved: show Offline/Unsaved or Retry status. On 409 preserve edits and offer reload/compare. Restore snapshots only after user confirmation; use baseRev to identify server changes, not a cross-device timestamp comparison alone. Clear the mirror after publish succeeds and the queue is drained.
Prompt: "Build PhoneFrame, PreviewStub, PreviewDrawer and autosave per docs/03 step P2-07. Preview must update instantly from wizard state. Autosave to localStorage and to the server as specified."
Verify:
1. Typing the recipient name updates the preview immediately without any request.
2. Fill steps 1 and 2, refresh: all data remains.
3. Turn the network off, type, turn it on: Offline/Unsaved appears, then queued data saves after reconnect. A two-tab conflict shows a recoverable conflict without overwriting either draft. Inspect localStorage: no plaintext password or token.
4. On a 360px screen the Preview button opens the drawer.
Mark FORM-2 in file 01. FORM-3 is marked in step P3-16 after the real template preview works.
Commit: feat(wizard): add live preview and autosave.
- [ ] Done (CHECKPOINT P2-07)

### STEP P2-08 [Owner F] Step 6 Review and generate

Files: components/wizard/StepReview.tsx, app/(app)/create/[id]/review/page.tsx, components/app/PublishSuccessModal.tsx.
Build:
1. StepReview (inside the wizard at step 6) shows a read-only summary of all inputs, grouped by step with an Edit link per group that jumps to that step, plus the preview. Its main button is "Review and generate" and navigates to /create/[id]/review.
2. app/(app)/create/[id]/review/page.tsx is a SERVER page that loads the page with getOwnedPage and renders: the summary, the preview (PhoneFrame with PreviewStub for now), and a Generate button.
3. Generate calls EP-14. While running, show a loading state. On 400 show the message and details as a list with a link back to the relevant step (photo problems go to step 4, template problems to step 5, and so on). On success open PublishSuccessModal with the link and a Copy button, the text "Your surprise is ready", a canvas-confetti burst, and buttons "Open page" (new tab) and "Go to dashboard". Phase 4 step P4-03 upgrades the modal with the full share kit.
4. In edit mode for an already published page the button label is "Update page" and it calls EP-14 again (same slug returned).
Prompt: "Build the review step, the /create/[id]/review page and a basic success modal per docs/03 step P2-08. Generate calls EP-14, show validation problems with links to the right step."
Verify:
1. Generating a page with no image shows "Add at least 1 photo" with a link to the Media step.
2. A complete page generates, shows the modal with a working link, and /w/<slug> opens.
3. Editing the page through /pages/[id]/edit and clicking Update page keeps the same slug.
Mark FORM-1 in file 01 after this passes.
Commit: feat(wizard): add review and generate.
- [ ] Done (CHECKPOINT P2-08)

### STEP P2-09 [Owner F] Wizard micro-interactions

Files: changes in components/wizard/*.
Build exactly these, nothing more:
1. Step change: the outgoing step fades and slides 24px left, the incoming step slides in from the right (AnimatePresence, 0.3 s, cubic-bezier 0.22, 1, 0.36, 1). Reversed for Back.
2. Buttons: scale 0.97 on tap and a subtle lift on hover.
3. Occasion, template and chip selections animate a ring and a small check icon (spring).
4. Inline errors fade in and shake once (6px).
5. Progress bar fills with a spring and the current step number pulses once on change.
6. Media tiles animate in with a stagger of 0.06 s when added; deleting animates out.
7. All of this respects prefers-reduced-motion (use the useReducedMotion hook and replace movement with a plain fade).
Prompt: "Add the micro-interactions listed in docs/03 step P2-09 to the wizard using Framer Motion, transform and opacity only, with reduced motion fallback."
Verify: each of the 7 items is visible; with OS reduced motion enabled nothing slides or shakes.
Commit: style(wizard): add micro-interactions.
- [ ] Done (CHECKPOINT P2-09)

### PHASE 2 ACCEPTANCE

CHECKPOINT PH2: Phase 2 complete.
- [ ] Done
- VERIFY:
  1. P2-01 to P2-09 are all [x].
  2. Run the worked example steps 1 to 7 of file 01 SECTION 5 through the UI (9 photos, 1 video, Hinglish, Neon Night). The page generates and /w/<slug> shows the data.
  3. Refresh on every step; nothing is lost.
  4. Every screen works at 360px.
  5. `git shortlog -sn` shows every member. Merge feature/wizard into main; update PROMPTS.md and SPEC.md.

---

## PHASE 3. TEMPLATES

Branch: feature/templates. Goal: three genuinely different, fully animated templates that render the public payload. This phase is 35 percent of the time and is where the 25 visual marks are won. Every recipe named below ("Intro recipe", "Hero recipe", and so on) is defined in file 04. Read the whole of file 04 before starting P3-01.

Shared rule for every step in this phase: test with the seed pages (riya-birthday-7f3a, kavya-anniversary-2k4m, meera-birthday-9p1x) at 360px and 1280px, with no console errors, animating only transform and opacity.

Template component contract (use exactly):

    // data is the EP-18 open payload type
    type WishTemplateProps = { data: WishPageData; mode: "live" | "preview" };

mode "preview" is used by the wizard and the template gallery: it skips the intro and the tap gate, disables Lenis and music, and shows sample wishes. mode "live" is used by /w/[slug].

### STEP P3-01 [Owner M] Template system infrastructure

Files: lib/wish-types.ts, templates/registry.ts, components/wish/WishRenderer.tsx, components/wish/WishProvider.tsx, lib/i18n.ts, locales/en.json, locales/hinglish.json, locales/hi.json, components/wish/SmoothScroll.tsx, components/wish/useMusic.ts.
Build:
1. lib/wish-types.ts exports WishPageData (the EP-18 open payload) and WishTemplateProps.
2. templates/registry.ts exports an object mapping each template id to a dynamic import: "neon-night": () => import("./neon-night"), "pastel-dream": () => import("./pastel-dream"), "royal-gold": () => import("./royal-gold"). WishRenderer uses next/dynamic with the registry so only the chosen template is loaded. Unknown ids fall back to neon-night.
3. WishProvider is a client context exposing: data, mode, accent, t(key, vars), language, reducedMotion, and music controls (play, pause, muted, started).
4. lib/i18n.ts and the three locale files exactly as defined in the i18n recipe of file 04. t(key) returns the string for the page language and falls back to English when a key is missing.
5. Fonts: load Noto Sans Devanagari and every template font with next/font/google in the relevant files, exposing CSS variables. Hindi pages apply the Devanagari font to all text.
6. SmoothScroll mounts Lenis only in live mode and not when reduced motion is requested.
7. useMusic creates one audio element, starts only after the "Tap to begin" interaction, loops, and exposes mute and unmute.
Prompt: "Build the template system infrastructure per docs/03 step P3-01 and the i18n recipe in docs/04: registry with dynamic imports, WishProvider, t(), locales, Lenis, music hook."
Verify: a throwaway template that prints t("hero.birthday") renders in the three languages when data.language changes; Hindi shows Devanagari glyphs correctly; only one template chunk loads in the network tab.
Commit: feat(templates): add template system infrastructure.
- [ ] Done (CHECKPOINT P3-01)

### STEP P3-02 [Owner M] Wish page integration

Files: app/w/[slug]/page.tsx, components/wish/ViewTracker.tsx (later), lib/dev-overrides.ts.
Build:
1. Replace the JSON view from P1-08 with: OK renders WishRenderer in live mode; the locked and unavailable states stay plain until P4-05, P4-06, P4-12.
2. generateMetadata is added in step P4-04. Do not add it now.
3. Development helper (only when process.env.NODE_ENV is not production): query parameters ?template=<id> and ?lang=<HINGLISH|ENGLISH|HINDI> override data.theme.templateId and data.language so every template and language can be tested on one seed page. In production these parameters are ignored.
Prompt: "Integrate WishRenderer into app/w/[slug]/page.tsx with development-only template and language overrides, per docs/03 step P3-02."
Verify: /w/riya-birthday-7f3a?template=royal-gold&lang=HINDI works in development; in a production build the overrides are ignored.
Commit: feat(wish-page): render templates on public route.
- [ ] Done (CHECKPOINT P3-02)

### STEPS P3-03 TO P3-10 [Owner M] Shared animated sections

Build each section in sections/ as a client component that takes WishPageData plus a small theme-token object (colours, fonts, easing, variant name). Each section must support variants so each template can look different; the variants are defined in file 04 per section. Implement in this order, one commit each, verifying each in a temporary composition before moving on:

- P3-03 Intro and loader: file sections/Intro.tsx. Recipe: "Intro recipe" in file 04. Includes the "Tap to begin" button that starts the music hook.
- P3-04 Hero: sections/Hero.tsx. Recipe: "Hero recipe" (3 parallax layers with useScroll and useTransform, giant animated greeting, pointer tilt on desktop, gyro tilt on mobile).
- P3-05 Message: sections/Message.tsx. Recipe: "Message recipe" (typewriter or word-by-word fade, handwriting font option from data.theme.font, signature from data.from).
- P3-06 Memory timeline: sections/Timeline.tsx. Recipe: "Timeline recipe". Memories without a mediaId render without a photo. Hidden when there are no memories.
- P3-07 Gallery: sections/Gallery.tsx. Recipe: "Gallery recipe" with variants masonry, polaroid and carousel3d; staggered reveal, lightbox on tap, scroll-linked scale. Edge cases: 1 photo shows one hero-style image with no empty slots; mixed aspect ratios keep their ratio.
- P3-08 Video: sections/VideoSection.tsx. Recipe: "Video recipe" (autoplay muted when in view via IntersectionObserver, tap to unmute, rounded frame with glow, poster image, lazy loaded). Hidden when there is no video.
- P3-09 Finale: sections/Finale.tsx. Recipe: "Finale recipe" (cake with candles, tap to blow out, canvas-confetti cannon loaded with a dynamic import, closing line, replay and share buttons). Candle blowing by tap only here; microphone is the bonus step BN-01.
- P3-10 Global elements: components/wish/ScrollProgress.tsx, components/wish/MusicToggle.tsx, components/wish/WishFooter.tsx. Recipe: "Global elements recipe" (scroll progress bar, mute toggle, footer "Made with love on Wishly").

Prompt (use for each, replacing the name): "Build sections/<Name>.tsx per the <Name> recipe in docs/04. Variants must differ visually. Animate transform and opacity only. Provide a reduced motion fallback. Handle the edge cases listed for this section."
Verify for each step: the section appears in a temporary composition at 360px and 1280px with seed data; its edge cases from file 04 work; reduced motion shows fades only; no layout shift.
Commit per step: feat(sections): add <name> section.
- [ ] Done (CHECKPOINT P3-03 Intro)
- [ ] Done (CHECKPOINT P3-04 Hero)
- [ ] Done (CHECKPOINT P3-05 Message)
- [ ] Done (CHECKPOINT P3-06 Timeline)
- [ ] Done (CHECKPOINT P3-07 Gallery)
- [ ] Done (CHECKPOINT P3-08 Video)
- [ ] Done (CHECKPOINT P3-09 Finale)
- [ ] Done (CHECKPOINT P3-10 Global)

### STEP P3-11 [Owner M] Template: Neon Night

Files: templates/neon-night/index.tsx, templates/neon-night/theme.ts.
Build: compose the sections in the order Intro, Hero, Message, Timeline, Gallery, Video, WishesWall (placeholder until P4-08), Finale, with the Neon Night theme tokens and variants defined in file 04 (palette #0B0420, #FF4FA3, #22D3EE, #A78BFA; fonts Clash Display or Space Grotesk; starfield parallax, glowing neon text, glitch reveal, confetti cannon; gallery variant masonry).
Prompt: "Compose the Neon Night template per docs/04 template section: sections order, theme tokens, signature effects."
Verify: /w/riya-birthday-7f3a shows all sections in order with a visibly neon identity; the page feels cinematic within the first 3 seconds.
Commit: feat(templates): add neon night template.
- [ ] Done (CHECKPOINT P3-11)

### STEP P3-12 [Owner M] Template: Pastel Dream

Files: templates/pastel-dream/index.tsx, templates/pastel-dream/theme.ts.
Build: same composition with the Pastel Dream tokens and variants (palette #FFF1F5, #FBCFE8, #C4B5FD, #FDE68A; Fredoka or Quicksand with Caveat; floating balloons, polaroid gallery, hand-drawn doodles, petals).
Prompt: "Compose the Pastel Dream template per docs/04."
Verify: /w/meera-birthday-9p1x looks clearly different from Neon Night in layout, palette, fonts and animation, not just colour.
Commit: feat(templates): add pastel dream template.
- [ ] Done (CHECKPOINT P3-12)

### STEP P3-13 [Owner M] Template: Royal Gold

Files: templates/royal-gold/index.tsx, templates/royal-gold/theme.ts.
Build: same composition with the Royal Gold tokens and variants (palette #0E0E10, #D4AF37, #F5E6C8, #7F1D1D; Playfair Display with Cormorant; gold foil shimmer, slow parallax, rose petals, letter-opening intro).
Prompt: "Compose the Royal Gold template per docs/04."
Verify: /w/kavya-anniversary-2k4m is clearly distinct from the other two.
Commit: feat(templates): add royal gold template.
- [ ] Done (CHECKPOINT P3-13)

### STEP P3-14 [Owner M] Occasion-aware decorations

Files: components/wish/Decorations.tsx and changes in the three templates.
Build: render the floating decoration layer from data.theme.decorations using the "Decorations recipe" in file 04 (balloons, confetti, cake, hearts, petals, sparkles, stars), styled per template. Birthday defaults show balloons, confetti and cake; anniversary shows hearts and petals; custom shows sparkles.
Prompt: "Implement the decorations layer per docs/04 Decorations recipe and wire it into all three templates."
Verify: switching occasion on the same template through the wizard changes the decorations; a page with theme.decorations empty falls back to the occasion defaults.
Mark TPL-1 and TPL-2 in file 01 after this passes (with P3-11 to P3-13 done).
Commit: feat(templates): add occasion decorations.
- [ ] Done (CHECKPOINT P3-14)

### STEP P3-15 [Owner M] Language switching verification

Build: audit every visible string in the three templates and the sections. Any heading, button, caption, placeholder or aria label must come from t(key). Add the missing keys to all three locale files. Hindi text must use the Devanagari font; English-language pages with a Devanagari name must render the name correctly.
Prompt: "Audit all strings in the templates and sections and move them to the locale files per docs/04 i18n recipe."
Verify: with ?lang=ENGLISH, ?lang=HINGLISH and ?lang=HINDI on each template, no string stays in the wrong language; no missing glyph boxes; grep for hard-coded English strings in templates/ and sections/ returns none except brand names.
Mark LANG-1 in file 01 after this passes.
Commit: feat(i18n): complete translations.
- [ ] Done (CHECKPOINT P3-15)

### STEP P3-16 [Owner F with M] Real preview and template gallery

Files: components/preview/PreviewStub.tsx (replace with real renderer), app/(marketing)/templates/page.tsx, components/app/TemplatePreviewDialog.tsx.
Build:
1. Replace PreviewStub inside PhoneFrame with WishRenderer in mode "preview" using toPreviewData(data). The preview must show the actual selected template and update instantly.
2. /templates (public page) lists the three templates as cards with name, description, palette swatches and an animated mini preview; clicking opens a full-screen dialog rendering the template in preview mode with sample data (a built-in sample WishPageData with Riya, 6 images from the seed demo URLs, 3 memories). Dialog has a close button and a "Use this template" button that goes to /create.
Prompt: "Replace the preview stub with WishRenderer in preview mode and build the /templates gallery with full-screen previews per docs/03 step P3-16."
Verify: in the wizard changing the template or accent changes the preview instantly; /templates previews open full screen on mobile and desktop.
Mark FORM-3 in file 01 after this passes.
Commit: feat(preview): render real templates in preview and gallery.
- [ ] Done (CHECKPOINT P3-16)

### STEP P3-17 [Owner M] Mobile pass

Build: go through all three templates at 360px, 390px and 768px. Fix overflow, text sizes, tap targets (at least 44px), safe-area padding, the lightbox, and the finale layout. Confirm gyro tilt asks for permission only where required and degrades silently when denied.
Prompt: "Do a mobile pass on the three templates per docs/04 mobile rules."
Verify: no horizontal scroll at 360px on any template; all buttons at least 44px; the intro to finale flow completes with touch only.
Commit: fix(templates): mobile pass.
- [ ] Done (CHECKPOINT P3-17)

### STEP P3-18 [Owner M] Edge case pass

Build: verify and fix each of these with temporary test pages created through the wizard: only 1 photo (gallery shows a single hero-style photo); portrait and landscape mix; no video; no memories; the maximum 15 images plus 2 videos; a 600-character message; a 40-character name; a Hindi name with language English; slow 3G throttling (loader visible, progressive images, lazy video); autoplay audio blocked (music only after Tap to begin).
Prompt: "Test and fix the edge cases listed in docs/03 step P3-18 across the three templates."
Verify: each case listed behaves as specified with no empty grid slots, no overflow and no errors.
Commit: fix(templates): handle edge cases.
- [ ] Done (CHECKPOINT P3-18)

### PHASE 3 ACCEPTANCE

CHECKPOINT PH3: Phase 3 complete.
- [ ] Done
- VERIFY:
  1. P3-01 to P3-18 are all [x].
  2. File 01 checkpoints TPL-1, TPL-2, LANG-1, FORM-3, PAGE-1 and PAGE-2 are marked [x] after verifying their own VERIFY lines (PAGE-1 and PAGE-2 verify all three templates on mobile and desktop).
  3. Open each template on a real phone or device emulation and confirm the intro, hero, message, timeline, gallery, video and finale flow plays smoothly.
  4. Merge feature/templates into main; update PROMPTS.md and SPEC.md.

---

## PHASE 4. SHARE AND POLISH

Branch: feature/share-polish. Goal: everything around the page: dashboard, share kit, link previews, countdown, password, wishes, analytics, admin, landing.

### STEP P4-01 [Owner B] Dashboard API

Files: app/api/v1/pages/mine/route.ts, pages/[id]/unpublish/route.ts, pages/[id]/duplicate/route.ts, and the DELETE handler in pages/[id]/route.ts.
Build: implement EP-08, EP-15, EP-16, EP-17 exactly as in file 02, including destroyAssets and the 50-page limit.
Prompt: "Implement EP-08, EP-15, EP-16 and EP-17 from docs/02 SECTION 9."
Verify:
1. EP-08 returns paginated cards with effective status; a page with future revealAt shows SCHEDULED.
2. Unpublish then GET /public/pages/<slug> as a stranger returns 403 PAGE_UNAVAILABLE; publishing again restores the same slug.
3. Duplicate creates a draft with no slug and zero stats.
4. Deleting a page removes its wishes, views and Cloudinary assets, but does NOT delete assets still used by a duplicate.
5. Another user calling DELETE gets 403; an admin can delete.
Commit: feat(dashboard-api): add list unpublish duplicate delete.
- [ ] Done (CHECKPOINT P4-01)

### STEP P4-02 [Owner F] Dashboard UI

Files: app/(app)/dashboard/page.tsx, components/app/PageCard.tsx, components/app/ConfirmDialog.tsx.
Build: a grid of cards loaded with EP-08 (12 per page with previous and next buttons, skeleton while loading, EmptyState with the call to action "Create your first surprise" when there are none, ErrorState on failure). Each card shows thumbnail (or a gradient placeholder), recipient name, occasion chip, status chip (colours from SECTION 5.4), views, created date, and an actions menu: Open (new tab, only when it has a slug and is Live or Scheduled), Edit (/pages/[id]/edit), Duplicate (EP-16, then toast and go to its edit page), Share (opens the share dialog from P4-03), Insights (/pages/[id]/insights), Unpublish (EP-15) or Publish (when Unpublished, goes to /create/[id]/review), and Delete (ConfirmDialog then EP-17). A "Create a surprise" button is always visible. A Disabled page shows a note "Disabled by admin" and only allows Delete.
Prompt: "Build the dashboard per docs/03 step P4-02 with cards, status chips, actions, skeletons, empty and error states."
Verify: each action works and the list refreshes; empty account shows the empty state; 360px layout is one column with no overflow.
Mark DASH-1 in file 01 after this passes.
Commit: feat(dashboard): add dashboard UI.
- [ ] Done (CHECKPOINT P4-02)

### STEP P4-03 [Owner D] Share kit

Files: components/app/ShareKit.tsx, components/app/ShareDialog.tsx, update components/app/PublishSuccessModal.tsx.
Build: ShareKit takes { url, recipientName, qrCode? }. It shows:
1. The link in a read-only field with a Copy button (navigator.clipboard.writeText with a textarea fallback, then toast "Link copied").
2. A QR code drawn with QRCodeCanvas from qrcode.react at 256px, and a "Download QR" button that saves the canvas as a PNG named wishly-<slug>.png.
3. A WhatsApp button opening `https://wa.me/?text=` followed by encodeURIComponent(`A surprise for ${recipientName}: ${url}`) in a new tab.
4. An Instagram button: if navigator.share exists call it with the link; otherwise copy the link, show the toast "Link copied. Paste it in your Instagram story or message", and open https://www.instagram.com in a new tab.
PublishSuccessModal now renders ShareKit. ShareDialog renders ShareKit for the dashboard Share action using the page slug and url.
Prompt: "Build ShareKit per docs/03 step P4-03: copy link, QR with PNG download, WhatsApp, Instagram. Use it in the success modal and a share dialog."
Verify: scanning the QR with a phone opens the page; the downloaded PNG opens and scans; WhatsApp opens a prefilled message containing the link; copy shows a toast.
Mark GEN-1 and GEN-2 in file 01 after this passes.
Commit: feat(share): add share kit.
- [ ] Done (CHECKPOINT P4-03)

### STEP P4-04 [Owner D] OG image and metadata

Files: app/api/og/[slug]/route.tsx, generateMetadata in app/w/[slug]/page.tsx.
Build: implement EP-34 including no-leak rules: scheduled/password pages are teasers regardless of requester; unpublished, disabled, draft and unknown slugs get generic metadata/images without names or media. Add generateMetadata using the same public-only projection and private, no-store responses.
Prompt: "Build the dynamic OG image route and generateMetadata per EP-34 in docs/02. Never leak photos for scheduled or password pages."
Verify:
1. Opening /api/og/riya-birthday-7f3a shows an image containing "Riya" and the first photo.
2. /api/og/dev-farewell-3c8z and /api/og/sana-friendship-5h2q show only the name and a gradient background, no photo.
3. View source on /w/riya-birthday-7f3a shows og:title, og:description, og:image.
4. After deploying, paste the production link into WhatsApp (or an OG debugger). Test scheduled/password pages as both owner and stranger; unpublished/disabled pages disclose neither name nor photo. Check no-store headers and absence of content in HTML/RSC responses, not only JSON.
Mark GEN-3 in file 01 after this passes.
Commit: feat(og): add og image and metadata.
- [ ] Done (CHECKPOINT P4-04)

### STEP P4-05 [Owner M] Countdown lock screen

Files: components/wish/LockScreen.tsx, update app/w/[slug]/page.tsx.
Build: for result LOCKED_SCHEDULED render LockScreen with the "Lock screen recipe" in file 04: animated flip digits for days, hours, minutes and seconds, the teaser "Something special is coming for <firstName>..." using t(), and a neutral cinematic background that depends only on firstName and revealAt. When the countdown reaches zero, call router.refresh() and, if the server still returns locked (client clock ahead), retry every 5 seconds. The server remains the only source of truth.
Prompt: "Build the countdown LockScreen per docs/04 Lock screen recipe and wire it for LOCKED_SCHEDULED."
Verify:
1. /w/dev-farewell-3c8z shows a live countdown.
2. In DevTools the response for that page contains no messages or media.
3. Create a page with reveal time 2 minutes ahead; at zero it unlocks without a manual reload.
Mark PAGE-3 in file 01 after this passes.
Commit: feat(lock): add countdown lock screen.
- [ ] Done (CHECKPOINT P4-05)

### STEP P4-06 [Owner M with B] Password gate

Files: app/api/v1/public/pages/[slug]/unlock/route.ts, update components/wish/LockScreen.tsx.
Build: implement EP-19 exactly. For result LOCKED_PASSWORD, LockScreen shows an elegant password gate (input, "Unlock" button, error shake on wrong password, loading state, the 429 message "Too many attempts, try again later"). On success call router.refresh().
Prompt: "Implement EP-19 and the password gate UI per docs/02 and docs/04 Lock screen recipe."
Verify:
1. /w/sana-friendship-5h2q shows the gate and the response contains no content.
2. Password friends123 unlocks it; a wrong password shows an error; the sixth attempt within 10 minutes returns 429 in an isolated bucket.
3. Refresh keeps an unchanged page unlocked for 2 hours; another browser sees the gate. Changing the page password/content rev invalidates the old token immediately; expired or wrong-page tokens fail too.
Mark PAGE-4 in file 01 after this passes.
Commit: feat(password): add unlock endpoint and gate.
- [ ] Done (CHECKPOINT P4-06)

### STEP P4-07 [Owner B with M] View tracking

Files: app/api/v1/public/pages/[slug]/view/route.ts, components/wish/ViewTracker.tsx.
Build: implement EP-20 exactly. ViewTracker is a client component rendered once inside WishRenderer in live mode only; on mount it calls EP-20 once and ignores the result and any error.
Prompt: "Implement EP-20 and a ViewTracker component per docs/02 and docs/03 step P4-07."
Verify:
1. Open a seed page as a visitor twice within 30 minutes: views increases by 1 only; uniqueViews increases by 1 on the first visit only.
2. Open the page logged in as its owner: views does not change.
3. Opening a locked page does not change views.
4. Concurrent view requests with the same visitor cookie count once. At 30 minutes another view counts even if the TTL lease is not yet deleted; lifetime uniqueViews stays unchanged. DailyStat totals and page counters agree after transaction retries.
Commit: feat(analytics): add view tracking.
- [ ] Done (CHECKPOINT P4-07)

### STEP P4-08 [Owner B with M] Wishes wall

Files: app/api/v1/public/pages/[slug]/wishes/route.ts, sections/WishesWall.tsx.
Build:
1. Implement EP-21 and EP-22 exactly, including the profanity filter and both rate limits.
2. WishesWall section ("Wishes wall recipe" in file 04): floating cards or sticky notes per template variant, loaded from EP-21 on mount, plus a form (name, message with a 280 counter, emoji chosen from 8 presets) that posts to EP-22 with an optimistic insert. Error handling: 429 shows the toast "You have reached the wish limit. Try again later."; profanity shows "Please keep wishes kind". Hidden when settings.wishesWall is false. In preview mode show three sample wishes and disable the form.
3. Replace the WishesWall placeholder in all three templates.
Prompt: "Implement EP-21 and EP-22 and the WishesWall section per docs/02 and docs/04 Wishes wall recipe."
Verify:
1. Posting a wish adds it instantly and it persists after refresh.
2. The 4th wish from the same visitor on the same page within an hour returns 429.
3. A wish with a profane word is rejected; a wish with <script> tags is stored without tags and displays as plain text.
4. Turning off wishesWall removes the section.
Mark PAGE-5 in file 01 after P4-09 (owner delete) also passes.
Commit: feat(wishes): add wishes wall.
- [ ] Done (CHECKPOINT P4-08)

### STEP P4-09 [Owner B] Insights and wish moderation API

Files: app/api/v1/pages/[id]/insights/route.ts, pages/[id]/wishes/route.ts, pages/[id]/wishes/[wishId]/route.ts.
Build: implement EP-23, EP-24, EP-25 exactly as in file 02.
Prompt: "Implement EP-23, EP-24 and EP-25 from docs/02."
Verify: insights for riya-birthday-7f3a (owned by creator@demo.com) returns totals and 30 days of viewsByDay with zeros filled; a non-owner gets 403; the owner can delete a wish and the count drops by 1; an admin can delete any wish.
Commit: feat(insights): add insights and wish moderation endpoints.
- [ ] Done (CHECKPOINT P4-09)

### STEP P4-10 [Owner F] Insights page UI

Files: app/(app)/pages/[id]/insights/page.tsx, components/app/ViewsChart.tsx, components/app/WishList.tsx.
Build: a SERVER page that loads the page with getOwnedPage (owner or admin) and passes data to client components. It shows three stat cards (total views, unique visitors, wishes), a recharts line or area chart of views over the last 30 days (loaded from EP-25), the share kit for the page, and a wish list loaded from EP-23 with a delete button (ConfirmDialog, EP-24). Skeleton, empty ("No wishes yet") and error states are required.
Prompt: "Build the insights page per docs/03 step P4-10 with stat cards, a recharts views chart and a wish list with delete."
Verify: numbers match the database; deleting a wish removes it and decrements the wishes card; 360px layout works.
Mark DASH-2 and PAGE-5 in file 01 after this passes.
Commit: feat(insights-ui): add insights page.
- [ ] Done (CHECKPOINT P4-10)

### STEP P4-11 [Owner B] Admin API

Files: app/api/v1/admin/stats/route.ts, admin/pages/route.ts, admin/pages/[id]/route.ts, admin/users/route.ts, admin/users/[id]/route.ts, admin/wishes/route.ts, admin/wishes/[id]/route.ts, admin/templates/[id]/route.ts.
Build: implement EP-26 to EP-33 exactly as in file 02.
Prompt: "Implement EP-26 to EP-33 from docs/02 SECTION 9. Every handler must call requireAdmin first."
Verify:
1. Without a cookie every admin route returns 401; with creator@demo.com every admin route returns 403; with admin@demo.com they return 200.
2. Disabling a page makes /w/<slug> return 403 PAGE_UNAVAILABLE; enabling restores it.
3. Deactivating a user blocks that user's next request; an admin cannot deactivate themselves.
4. Hiding a wish removes it from EP-21.
Commit: feat(admin-api): add admin endpoints.
- [ ] Done (CHECKPOINT P4-11)

### STEP P4-12 [Owner F] Admin UI

Files: app/admin/page.tsx, components/app/admin/StatsCards.tsx, PagesTable.tsx, UsersTable.tsx, WishesTable.tsx, TemplatesPanel.tsx.
Build: a tabbed admin page (Stats, Pages, Users, Wishes, Templates). Stats shows six cards from EP-26. Pages and Users and Wishes tables are paginated with a search box (EP-27, EP-29, EP-31), with actions: disable or enable page (EP-28), activate or deactivate user (EP-30), hide or unhide wish (EP-32) and delete wish (EP-24 with the page id). Templates shows the 3 templates with an active switch (EP-33). Every action uses ConfirmDialog and a toast; every table has skeleton, empty and error states.
Prompt: "Build the admin UI per docs/03 step P4-12 with tabs, paginated tables, search and confirm dialogs."
Verify: all actions work against the admin API; a disabled page immediately shows the unavailable screen publicly; 360px tables scroll inside their container and the page does not scroll sideways.
Mark ADM-1 and AUTH-2 admin checks in file 01 after this passes.
Commit: feat(admin): add admin UI.
- [ ] Done (CHECKPOINT P4-12)

### STEP P4-13 [Owner F with M] Landing page

Files: app/(marketing)/page.tsx and components in components/app/landing/.
Build the landing page per the "Landing page recipe" in file 04: animated hero demonstrating a sample wish page, How it works in 3 steps, template showcase carousel with live mini previews (reuse the preview renderer in preview mode with sample data), links to the 3 seed sample pages, sample testimonials, FAQ (accordion), and a final call to action. Navbar with Login and "Create a surprise". Footer.
Prompt: "Build the landing page per docs/04 Landing page recipe using the app design tokens."
Verify: all sections render; carousel works with touch; links open samples; Lighthouse mobile performance is at least 80, matching UI-17; no horizontal scroll at 360px.
Commit: feat(landing): add landing page.
- [ ] Done (CHECKPOINT P4-13)

### STEP P4-14 [Owner F with M] Designed error states

Files: app/not-found.tsx, app/w/[slug]/not-found.tsx, components/wish/UnavailableScreen.tsx, app/error.tsx, app/global-error.tsx, loading.tsx files for dashboard, insights and admin.
Build: a beautiful 404 for unknown slugs with the call to action "Create your own surprise" linking to /signup; a friendly "This page is unavailable" screen for PAGE_UNAVAILABLE (wire it into app/w/[slug]/page.tsx); an error boundary with a Retry button; skeleton loading files.
Prompt: "Build the designed 404, unavailable screen, error boundary and loading skeletons per docs/03 step P4-14."
Verify: /w/unknown shows the designed 404; a disabled page shows the unavailable screen; throwing an error in a test component shows the error boundary, not a stack trace.
Commit: feat(ux): add designed error states.
- [ ] Done (CHECKPOINT P4-14)

### PHASE 4 ACCEPTANCE

CHECKPOINT PH4: Phase 4 complete.
- [ ] Done
- VERIFY:
  1. P4-01 to P4-14 are all [x].
  2. Run the full worked example of file 01 SECTION 5 steps 1 to 10 locally. Everything works except the bonus step 11.
  3. File 01 checkpoints for DASH-1, DASH-2, ADM-1, GEN-1, GEN-2, GEN-3, PAGE-3, PAGE-4, PAGE-5 are marked [x].
  4. Merge feature/share-polish into main; update PROMPTS.md and SPEC.md.

---

## PHASE 5. SHIP

Branch: feature/ship. Goal: performance, clean code, then hand off to file 05 for testing, deployment and submission.

### STEP P5-01 [Owner M] Performance pass

Build, in order:
1. Confirm only the chosen template chunk loads (dynamic imports) and that canvas-confetti and Lenis load only where needed.
2. Images: every image uses cld(url, "w_<size>,f_auto,q_auto") with sizes 400, 800 or 1200; set width and height attributes from w and h to prevent layout shift; the first hero image is eager, all gallery and timeline images use loading="lazy" and decoding="async".
3. Video: preload="none", poster built by replacing the extension with .jpg and adding so_0 (cld(url, "so_0,w_800,f_jpg,q_auto") then replace the file extension with .jpg), source loaded only when in view.
4. Audio: preload="none"; the file loads only after Tap to begin.
5. Animation: will-change: transform only on the three hero parallax layers, matching file 04; no width/height/top/left animation; reduce decorations below 768px (at most 8 floating items).
6. Fonts: next/font with display swap, only the weights used.
7. Reduced motion: confirm every template falls back to simple fades.
8. Run Lighthouse mobile against a production build on all three templates and a separate 9-image/1-video acceptance page. Record URL, date, device profile, score and report; the Riya seed has only 6 images, so it alone does not prove PERF-1.
Prompt: "Optimise the wish page performance per docs/03 step P5-01 until Lighthouse mobile performance is at least 80 on all three templates."
Verify: Lighthouse mobile Performance 80 or higher for riya-birthday-7f3a, kavya-anniversary-2k4m and meera-birthday-9p1x; with OS reduced motion on, animations are fades.
Mark PERF-1 in file 01 after this passes.
Commit: perf(wish-page): optimise images video and bundle.
- [ ] Done (CHECKPOINT P5-01)

### STEP P5-02 [Owner D] Code quality pass

Build:
1. Run `npm run test`, `npm run typecheck`, `npm run lint` and formatting checks, then build and browser tests. Review formatting changes and avoid unrelated churn. Fix failures in the touched feature, not by weakening checks.
2. Remove dead code, unused files, commented-out blocks and console.log calls (console.error in the error handler is allowed).
3. Make sure no hard-coded URLs exist; every URL comes from NEXT_PUBLIC_APP_URL or relative paths. Confirm .env.example lists every variable the code reads (search the code for process.env).
4. Confirm every API route uses route(...) and zod validation, and every protected route checks authorisation.
5. Make sure each file has a short header comment and each non-obvious function a one-line comment, so team members can explain them in the viva.
6. Create README from the PDF template adapted to one Next.js app: clone, `npm ci`, copy .env.example to .env (`Copy-Item .env.example .env` in PowerShell), fill values locally, seed, dev. Frontend and backend share the same origin; API base is /api/v1. Include Team, pinned stack, verified Features, Architecture, Test Credentials, EP-01 to EP-34 API table, and Known Limitations (no optional download toggle, cookie-based analytics, public media URL privacy, deferred CDN caching, and any cut P1/bonus). State actual CSP behaviour, not the superseded no-CSP plan. Live/sample/video links are filled in file 05.
Prompt: "Do a code quality pass per docs/03 step P5-02 and draft the README from the PDF template adapted to a single Next.js app."
Verify: lint passes with zero errors; `npm run build` passes; searching the repo for "password" or secrets in committed files finds no real secret; README setup steps work on a fresh clone (test by cloning into a new folder and following them).
Commit: chore(quality): lint format cleanup and readme.
- [ ] Done (CHECKPOINT P5-02)

### STEP P5-03 [Owner all] Handoff

Build: review file 01 SECTION 6. Every P0 and P1 requirement must be marked [x]; any P1 that is not done must be listed in README Known Limitations. Merge feature/ship into main, redeploy, update PROMPTS.md and SPEC.md.
Prompt: "Review requirement checkpoints in docs/01 SECTION 6 and list anything unfinished."
Verify: every P0 is [x]; the production deployment is healthy; `git shortlog -sn` shows every member.
Commit: docs: final handoff.
- [ ] Done (CHECKPOINT P5-03)

CHECKPOINT PH5: Phase 5 complete.
- [ ] Done
- VERIFY: P5-01 to P5-03 are all [x]. Proceed to file 05-TESTING-DEPLOYMENT-SUBMISSION.md and complete it fully BEFORE starting any bonus step.

---

## BONUS PHASE (ONLY AFTER FILE 05 IS COMPLETE)

Branch: feature/bonus. Order: BN-01, BN-02, BN-03. A half-working bonus scores less than none, so only mark a bonus when it fully works, and record unfinished bonuses in README Known Limitations.

### STEP BN-01 [Owner M] Microphone candle blowing (PAGE-6)

Files: sections/Finale.tsx and a helper hook components/wish/useBlowDetect.ts.
Build: add a button "Blow with your microphone" next to the existing tap interaction. On click request navigator.mediaDevices.getUserMedia({ audio: true }); on grant create an AudioContext and AnalyserNode and read time-domain samples every animation frame; compute the root mean square level; when the level stays above 0.25 for 300 milliseconds, extinguish the candles and trigger the confetti. Stop the microphone stream after the candles go out or when the section leaves the view. If permission is denied or unavailable, show the toast text from locales and keep the tap interaction working. Never request the microphone automatically.
Prompt: "Add microphone candle blowing to the Finale per docs/03 step BN-01 using getUserMedia and an AnalyserNode RMS threshold, with tap as the fallback."
Verify: blowing into the microphone puts the candles out and fires confetti; denying permission leaves tap working; the microphone indicator turns off afterwards.
Mark PAGE-6 in file 01.
Commit: feat(finale): add microphone candle blow.
- [ ] Done (CHECKPOINT BN-01)

### STEP BN-02 [Owner B with F] AI message suggestions (LANG-2, EP-B3)

Files: app/api/v1/ai/message/route.ts, lib/ai.ts, update components/wizard/StepWords.tsx.
Build:
1. EP-B3: Auth, fail-closed rate limit 10 per hour per user. Zod body: { occasion, relation?, recipientName, language, tone? (warm|funny|emotional) }. lib/ai.ts calls Gemini on the server with GEMINI_API_KEY and requests exactly 3 messages of at most 280 characters in the chosen language (Hinglish is Latin-script Hindi, Hindi is Devanagari). Use a model currently available on the free tier, verified against official provider docs; record model/quota in DECISIONS.md. Validate the returned JSON array with Zod, cleanText each result, set a timeout, and return 502 AI_UNAVAILABLE on provider failure. Never log the key or recipient prompts.
2. StepWords gets a "Write it for me" button that calls EP-B3 and shows 3 suggestion cards; clicking a card fills the next empty message field; loading and error states are required.
Prompt: "Implement EP-B3 and the Write it for me button per docs/03 step BN-02. Server-side key only, validated body, 3 suggestions in the chosen language."
Verify: suggestions arrive in all three languages; provider timeout/malformed output returns a controlled error; key never reaches the browser; the 11th request per hour returns 429.
Mark LANG-2 in file 01.
Commit: feat(ai): add message suggestions.
- [ ] Done (CHECKPOINT BN-02)

### STEP BN-03 [Owner D] One-click deploy (DEPLOY-1)

Follow the dedicated bonus deploy section in file 05. Mark DEPLOY-1 in file 01 only when a deployed URL is returned and opens.
- [ ] Done (CHECKPOINT BN-03)

---

## SECTION 6. CONTRACT WITH FILE 04 (FOR WHOEVER WRITES OR READS FILE 04)

File 04 must define, under these exact names, everything the steps above refer to: the i18n recipe (locale JSON structure, key list, fonts); the Lock screen recipe; the Intro recipe; the Hero recipe; the Message recipe; the Timeline recipe; the Gallery recipe (variants masonry, polaroid, carousel3d); the Video recipe; the Wishes wall recipe; the Finale recipe; the Global elements recipe; the Decorations recipe; the three template sections (Neon Night, Pastel Dream, Royal Gold) with section order, tokens and variants; the Landing page recipe; the mobile rules; and the music file list for public/music. If file 04 and this file disagree, this file decides step order and file 04 decides visual detail.

---

## SECTION 7. MASTER CHECKLIST

Project build is complete only when all lines are marked [x].

- [ ] WF-00 and PH1 (foundation)
- [ ] PH2 (wizard)
- [ ] PH3 (templates)
- [ ] PH4 (share and polish)
- [ ] PH5 (ship)
- [ ] Every P0 requirement in file 01 SECTION 6 marked [x]
- [ ] File 05 completed (testing, deployment, submission)
- [ ] Bonus steps either [x] or recorded in Known Limitations

END OF FILE 03
