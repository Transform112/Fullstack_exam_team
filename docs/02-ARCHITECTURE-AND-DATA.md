# 02 - ARCHITECTURE, DATA MODEL AND API CONTRACT

Project: Wishly
Prerequisite: read file 01 and complete its SECTION 13 setup checks. Do not require OV-03 or any unbuilt product acceptance checkpoint before starting the foundation steps here.

This file defines HOW the system is structured: stack, folders, environment, core library code, database models, validation, every API endpoint, security, seed data, and the foundation build sequence. It contains no UI design (that is file 04) and no feature phase plan (that is file 03).

All rules from file 01 SECTION 0 apply here. Additional rules for this file:

1. Code blocks marked REFERENCE are implementation starting points, not proof of correctness. Apply the surrounding contracts and test security and concurrency behaviour before marking a checkpoint. Fix defects rather than preserving faulty sample behaviour.
2. Every endpoint has an id (EP-01, EP-02, ...). File 03 refers to endpoints by these ids.
3. Do not add fields, endpoints, collections, or libraries that are not listed here, except those listed as bonus.
4. In current Next.js versions, route params, cookies() and headers() are asynchronous. Always write `await params` and `await cookies()`.

---

## SECTION 1. STACK AND INSTALL COMMANDS

Runtime: Node.js 20.6 or newer (required for the --env-file flag used by the seed script).

Use a currently supported Node.js LTS accepted by the chosen Next.js release and Vercel (Node.js 24 LTS at this review). Pin it in .nvmrc and package.json engines. Record exact Next.js, React, Tailwind and Node versions in SPEC.md and commit package-lock.json; do not mix Next.js 14-era commands with an unrecorded latest scaffold.

Scaffold command (run in the repository root, where docs/ already exists):

    npx create-next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm

This repository is not empty. Scaffold into wishly-tmp from the outset using the same flags with wishly-tmp instead of `.`. Review and transfer generated files, including dotfiles, individually. Preserve docs/, workflow.md, README.md, .git/, and all existing changes; merge .gitignore rather than overwriting it. Remove only the temporary scaffold after verifying the transfer. Resolve scaffold prompts to App Router, TypeScript strict mode, no src directory and npm.

Runtime dependencies (run as one command):

    npm i mongoose zod@3 bcryptjs jsonwebtoken nanoid slugify qrcode cloudinary sanitize-html leo-profanity pino framer-motion lenis canvas-confetti react-hook-form @hookform/resolvers react-dropzone browser-image-compression @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities qrcode.react sonner lucide-react date-fns recharts

Dev dependencies:

    npm i -D @types/jsonwebtoken @types/qrcode @types/canvas-confetti @types/sanitize-html tsx prettier eslint-config-prettier vitest @playwright/test

UI kit: run `npx shadcn@latest init` accepting defaults, then add components when a later step needs them with `npx shadcn@latest add <name>`.

Plain-text sanitisation uses sanitize-html, not a regular-expression HTML parser. This replaces the root blueprint's isomorphic-dompurify choice without a jsdom dependency. React still escapes text on render. Add a small documented Hinglish profanity list to leo-profanity and test it.

package.json scripts must be exactly:

    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "format": "prettier --write .",
    "seed": "tsx --env-file=.env scripts/seed.ts"

Verification commands are `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:e2e`. Browser tests use an isolated test database, never production.

### Reconciliation with root workflow.md

- Use MONGO_URI throughout, matching the PDF; it replaces the blueprint name MONGODB_URI, not an additional variable.
- Keep separate JWT_SECRET, UNLOCK_JWT_SECRET and IP_HASH_SECRET as in the blueprint.
- Fixed-window rate limits match the blueprint table; the draft plan's larger limits are removed.
- Unlock tokens include the page revision. MongoDB transactions and unique indexes protect view counts; TTL cleanup is not an exact timer.
- Version 1 uses private, no-store for public page payloads, HTML and OG responses. This defers public CDN caching until invalidation on password, scheduling, unpublish and disable changes is tested. Never cache privileged responses publicly.
- Gemini via GEMINI_API_KEY is the optional AI provider, matching the free-tier blueprint. Verify current model availability and quota when implementing the bonus.
- allowDownload is optional under the PDF; omit it in version 1 and state that limitation. Locks gate app responses, not previously disclosed Cloudinary URLs. Strong media privacy requires a separate authenticated-delivery design.
- Thin route handlers call services for page mutations, public access, analytics and media. pino request IDs and automated tests are foundation work, not future scope.

---

## SECTION 2. FOLDER STRUCTURE (CREATE EXACTLY THIS)

    (repository root)
    docs/                              requirement pdf and the 5 md files
    SPEC.md                            copy of data models and endpoint list (SECTION 14 step AR-12)
    PROMPTS.md
    README.md
    .env.example
    .env                               local only, git-ignored
    next.config.ts
    app/
      layout.tsx                       root layout, fonts, Toaster
      globals.css
      not-found.tsx                    app-level 404
      (marketing)/page.tsx             landing at /
      (marketing)/templates/page.tsx   template gallery at /templates
      (auth)/login/page.tsx
      (auth)/signup/page.tsx
      (app)/layout.tsx                 SERVER layout: requires a logged-in user, else redirect to /login
      (app)/dashboard/page.tsx
      (app)/create/page.tsx            wizard (new or resume with ?id=)
      (app)/create/[id]/review/page.tsx
      (app)/pages/[id]/edit/page.tsx
      (app)/pages/[id]/insights/page.tsx
      admin/layout.tsx                 SERVER layout: requires role ADMIN, else redirect to /dashboard
      admin/page.tsx
      w/[slug]/page.tsx                public wish page (server fetch, client animations)
      w/[slug]/not-found.tsx           designed 404 with "Create your own surprise"
      api/og/[slug]/route.tsx          dynamic OG image
      api/v1/                          all route handlers (SECTION 9 lists every file)
    components/
      wizard/                          StepOccasion, StepRecipient, StepWords, StepMedia, StepStyle, StepReview, Wizard
      preview/PhoneFrame.tsx
      wish/                            client components used only by the wish page (lock screen, intro, finale)
      app/                             app-side components (navbar, page cards, share kit)
      ui/                              shadcn components
    templates/
      neon-night/                      index.tsx, theme.ts
      pastel-dream/
      royal-gold/
      registry.ts                      templateId -> dynamic import of the template component
    sections/                          shared animated sections: Hero, Message, Timeline, Gallery, Video, WishesWall, Finale
    locales/                           en.json, hinglish.json, hi.json
    lib/
      db.ts
      errors.ts
      api.ts
      auth.ts
      rate-limit.ts
      sanitize.ts
      validators.ts
      slug.ts
      cloudinary.ts
      cloudinary-url.ts
      visitor.ts
      occasion.ts
      page-helpers.ts                  effectiveStatus, access check, serializers, thumbnail
      logger.ts                       pino, redaction, request IDs
      i18n.ts                          (file 04)
    models/
      User.ts
      Page.ts
      Template.ts
      Wish.ts
      PageView.ts
      PageVisitor.ts
      DailyStat.ts
      RateLimit.ts
    services/                         pages, media, public access, analytics
    tests/                            Vitest logic and integration tests, Playwright e2e
    scripts/
      seed.ts
    public/
      music/                           royalty-free tracks, each 2 MB or smaller (file 04)

Route group folders in parentheses do not appear in URLs.

Route protection is done in the server layouts (app)/layout.tsx and admin/layout.tsx by calling getCurrentUser() from lib/auth.ts. There is NO middleware file. Every API route handler also checks authorisation itself.

---

## SECTION 3. ENVIRONMENT VARIABLES

.env.example must contain these entries, each with a one-line comment. Generate independent secrets locally with a cryptographically secure generator; never send them through an AI prompt. OpenSSL is optional, not a Windows prerequisite.

    # Public base URL of the app, no trailing slash. Used for share links, OG tags, CORS.
    NEXT_PUBLIC_APP_URL=http://localhost:3000
    # MongoDB Atlas connection string including database name, for example .../wishly
    MONGO_URI=
    # Long random secret used only to sign auth tokens.
    JWT_SECRET=
    # Independent random secret for password-page unlock tokens.
    UNLOCK_JWT_SECRET=
    # Independent random secret used to hash client IP addresses.
    IP_HASH_SECRET=
    # Cloudinary cloud name from the Cloudinary dashboard.
    CLOUDINARY_CLOUD_NAME=
    # Cloudinary API key.
    CLOUDINARY_API_KEY=
    # Cloudinary API secret. Server only. Never expose to the browser.
    CLOUDINARY_API_SECRET=
    # Bonus: Vercel API token for programmatic deploy.
    VERCEL_TOKEN=
    # Bonus alternative: Netlify API token.
    NETLIFY_AUTH_TOKEN=
    # Bonus: key for AI message suggestions.
    GEMINI_API_KEY=

Only variables starting with NEXT_PUBLIC_ may be read in browser code. Everything else is server only.

---

## SECTION 4. ARCHITECTURE OVERVIEW

Components and their connections:

1. Browser (creator or viewer) talks to the Next.js app on Vercel.
2. Next.js app contains: pages and server components (UI), Route Handlers under app/api/v1 (JSON API), and the OG image route app/api/og/[slug].
3. Route Handlers talk to MongoDB Atlas through Mongoose (lib/db.ts).
4. The browser uploads photos and videos DIRECTLY to Cloudinary using parameters signed by POST /api/v1/uploads/sign. File bytes never pass through the Next.js server.
5. After each upload the browser calls POST /api/v1/media. The server verifies the uploaded asset with the Cloudinary Admin API (size, format, dimensions, duration) and only then saves it to the page.
6. The public page /w/[slug] is a server component that loads data through the same logic as EP-18 (access rules applied), then hands the data to client components that render a template chosen from templates/registry.ts.
7. Authentication is a JWT in the httpOnly cookie wishly_token.

Data flow for publishing: wizard PATCH calls save steps into a DRAFT page; POST publish validates, creates the slug, sets status, returns slug, url, qrCode; the page is immediately live at /w/[slug].

---

## SECTION 5. CORE LIBRARY CODE (REFERENCE)

Create these files exactly. Each is small so a team member can explain it in the viva.

### lib/db.ts

    import mongoose from "mongoose";

    type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
    const g = globalThis as unknown as { _mongoose?: Cache };
    const cache: Cache = g._mongoose ?? (g._mongoose = { conn: null, promise: null });

    // Opens one shared MongoDB connection and reuses it across requests.
    export async function connectDB() {
      const uri = process.env.MONGO_URI;
      if (!uri) throw new Error("MONGO_URI is not set");
      if (cache.conn) return cache.conn;
      if (!cache.promise) cache.promise = mongoose.connect(uri, { bufferCommands: false });
      try {
        cache.conn = await cache.promise;
        return cache.conn;
      } catch (err) {
        cache.promise = null;
        throw err;
      }
    }

### lib/errors.ts

    export class AppError extends Error {
      status: number;
      code: string;
      details?: unknown[];
      constructor(status: number, code: string, message: string, details?: unknown[]) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
      }
    }

    export const Errors = {
      validation: (message: string, details?: unknown[]) => new AppError(400, "VALIDATION_ERROR", message, details),
      unauthenticated: () => new AppError(401, "UNAUTHENTICATED", "Please log in to continue."),
      forbidden: (message = "You do not have permission to do this.") => new AppError(403, "FORBIDDEN", message),
      notFound: (message = "Not found.") => new AppError(404, "NOT_FOUND", message),
      conflict: (code: string, message: string) => new AppError(409, code, message),
      rateLimited: () => new AppError(429, "RATE_LIMITED", "Too many requests. Please try again later."),
    };

### lib/api.ts

    import { NextRequest, NextResponse } from "next/server";
    import { ZodError, ZodTypeAny, z } from "zod";
    import { AppError, Errors } from "./errors";

    export function ok<T>(data: T, message?: string, status = 200) {
      return NextResponse.json({ success: true, data, ...(message ? { message } : {}) }, { status });
    }
    export const created = <T>(data: T, message?: string) => ok(data, message, 201);

    export function fail(status: number, code: string, message: string, details?: unknown[]) {
      return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
    }

    // Converts any thrown error into the standard JSON error shape. Never leaks stack traces.
    export function errorResponse(err: unknown) {
      if (err instanceof ZodError) {
        const details = err.issues.map((i) => ({ path: i.path.join("."), issue: i.message }));
        return fail(400, "VALIDATION_ERROR", err.issues[0]?.message ?? "Invalid input", details);
      }
      if (err instanceof AppError) return fail(err.status, err.code, err.message, err.details);
      const e = err as { code?: number; name?: string };
      if (e?.code === 11000) return fail(409, "CONFLICT", "That value already exists.");
      if (e?.name === "JsonWebTokenError" || e?.name === "TokenExpiredError") return fail(401, "UNAUTHENTICATED", "Please log in to continue.");
      console.error(err);
      return fail(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
    }

    // Wraps every route handler: awaits params and routes all errors through errorResponse.
    export function route<P = Record<string, string>>(
      handler: (req: NextRequest, ctx: { params: P }) => Promise<Response>
    ) {
      return async (req: NextRequest, ctx: { params: Promise<P> }) => {
        try {
          const params = ctx?.params ? await ctx.params : ({} as P);
          return await handler(req, { params });
        } catch (err) {
          return errorResponse(err);
        }
      };
    }

    // Reads JSON from the request and validates it with a zod schema.
    export async function parseBody<S extends ZodTypeAny>(req: NextRequest, schema: S): Promise<z.infer<S>> {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        throw Errors.validation("Request body must be valid JSON.");
      }
      return schema.parse(body);
    }

    // Standard list query: page, limit, sort, search.
    export function parseListQuery(req: NextRequest, allowedSort: string[], defaultSort = "-createdAt") {
      const sp = req.nextUrl.searchParams;
      const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20", 10) || 20));
      let sort = sp.get("sort") ?? defaultSort;
      if (!allowedSort.includes(sort.replace(/^-/, ""))) sort = defaultSort;
      const search = (sp.get("search") ?? "").trim().slice(0, 60);
      return { page, limit, skip: (page - 1) * limit, sort, search };
    }

    export function paginated<T>(items: T[], total: number, page: number, limit: number) {
      return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
    }

    export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

### lib/sanitize.ts

    import sanitizeHtml from "sanitize-html";

    export function cleanText(input: string): string {
      return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
        .replace(/[ \t]+/g, " ").trim();
    }

### lib/auth.ts

    import jwt from "jsonwebtoken";
    import bcrypt from "bcryptjs";
    import { cookies } from "next/headers";
    import { NextResponse } from "next/server";
    import { connectDB } from "./db";
    import { Errors } from "./errors";
    import { User } from "@/models/User";

    export const AUTH_COOKIE = "wishly_token";
    const secret = () => {
      const s = process.env.JWT_SECRET;
      if (!s) throw new Error("JWT_SECRET is not set");
      return s;
    };

    export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
    export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

    export function signAuthToken(userId: string, role: string) {
      return jwt.sign({ sub: userId, role }, secret(), { algorithm: "HS256", expiresIn: "7d" });
    }

    export function setAuthCookie(res: NextResponse, token: string) {
      res.cookies.set(AUTH_COOKIE, token, {
        httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
        path: "/", maxAge: 60 * 60 * 24 * 7,
      });
    }
    export function clearAuthCookie(res: NextResponse) {
      res.cookies.set(AUTH_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
    }

    // Returns the logged-in user (fresh from the database) or null.
    export async function getCurrentUser() {
      const token = (await cookies()).get(AUTH_COOKIE)?.value;
      if (!token) return null;
      let payload: { sub: string };
      try {
        payload = jwt.verify(token, secret(), { algorithms: ["HS256"] }) as { sub: string };
      } catch (err) {
        if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError || err instanceof jwt.NotBeforeError) return null;
        throw err;
      }
      if (!payload.sub || !/^[a-fA-F0-9]{24}$/.test(payload.sub)) return null;
      await connectDB();
      const user = await User.findById(payload.sub).lean();
      if (!user || !user.isActive) return null;
      return user;
    }
    export async function requireUser() {
      const user = await getCurrentUser();
      if (!user) throw Errors.unauthenticated();
      return user;
    }
    export async function requireAdmin() {
      const user = await requireUser();
      if (user.role !== "ADMIN") throw Errors.forbidden();
      return user;
    }

    // View token used for password-protected pages. Stored in cookie wishly_view_<pageId>.
    export function signViewToken(pageId: string, rev: number) {
      const unlockSecret = process.env.UNLOCK_JWT_SECRET;
      if (!unlockSecret) throw new Error("UNLOCK_JWT_SECRET is not set");
      return jwt.sign({ pid: pageId, rev, purpose: "view" }, unlockSecret, { algorithm: "HS256", expiresIn: "2h" });
    }
    export function verifyViewToken(token: string | undefined, pageId: string, rev: number) {
      if (!token) return false;
      try {
        const unlockSecret = process.env.UNLOCK_JWT_SECRET;
        if (!unlockSecret) return false;
        const p = jwt.verify(token, unlockSecret, { algorithms: ["HS256"] }) as { pid?: string; rev?: number; purpose?: string };
        return p.purpose === "view" && p.pid === pageId && p.rev === rev;
      } catch {
        return false;
      }
    }

### lib/rate-limit.ts

    import { createHash } from "crypto";
    import { NextRequest } from "next/server";
    import { connectDB } from "./db";
    import { Errors } from "./errors";
    import { RateLimit } from "@/models/RateLimit";

    export async function rateLimit(opts: { key: string; limit: number; windowSec: number; failOpen?: boolean }) {
      const windowMs = opts.windowSec * 1000;
      const bucket = Math.floor(Date.now() / windowMs);
      const retryAfter = Math.max(1, Math.ceil(((bucket + 1) * windowMs - Date.now()) / 1000));
      try {
        await connectDB();
        const key = `${opts.key}:${bucket}`;
        let doc;
        try {
          doc = await RateLimit.findOneAndUpdate(
            { key },
            { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 1) * windowMs + 60_000) } },
            { upsert: true, new: true }
          );
        } catch (err) {
          if ((err as { code?: number }).code !== 11000) throw err;
          doc = await RateLimit.findOneAndUpdate({ key }, { $inc: { count: 1 } }, { new: true });
        }
        if (!doc) throw new Error("Rate limit counter missing");
        return { allowed: doc.count <= opts.limit, remaining: Math.max(0, opts.limit - doc.count), retryAfter };
      } catch {
        return { allowed: opts.failOpen === true, remaining: 0, retryAfter };
      }
    }

    export function getClientIp(req: NextRequest) {
      return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    }
    export function hashIp(ip: string) {
      const ipSecret = process.env.IP_HASH_SECRET;
      if (!ipSecret) throw new Error("IP_HASH_SECRET is not set");
      return createHash("sha256").update(ip + ipSecret).digest("hex");
    }

Every caller checks allowed and returns 429 through the central error handler when false. Include Retry-After on 429 and X-RateLimit-Remaining on limited responses, including validation failures. Never recursively retry a duplicate-key race. Trust forwarded IP headers only when supplied by the deployment proxy; document the Vercel header used and test spoofed headers. Use hashIp in stored limiter keys; never log raw IPs.

The route wrapper also verifies Origin for every POST/PATCH/DELETE against NEXT_PUBLIC_APP_URL before invoking its handler (reject missing, null or foreign origins with 403 INVALID_ORIGIN). Same-origin browser fetches supply it; curl/test clients must set it. CORS alone is not CSRF protection. Attach a generated request ID in X-Request-Id and error bodies; use pino with cookies, passwords, tokens, connection strings and secrets redacted. Validate JWT algorithms explicitly; database outages must propagate as service errors rather than being disguised as logged-out users.

### lib/visitor.ts

    import { NextRequest, NextResponse } from "next/server";
    import { nanoid } from "nanoid";

    export const VISITOR_COOKIE = "wishly_vid";
    // Returns the visitor id from the cookie, or a new id plus a flag to set the cookie.
    export function getVisitorId(req: NextRequest) {
      const existing = req.cookies.get(VISITOR_COOKIE)?.value;
      if (existing) return { id: existing, isNew: false };
      return { id: nanoid(16), isNew: true };
    }
    export function setVisitorCookie(res: NextResponse, id: string) {
      res.cookies.set(VISITOR_COOKIE, id, {
        httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
        path: "/", maxAge: 60 * 60 * 24 * 365,
      });
    }

### lib/slug.ts

    import slugify from "slugify";
    import { customAlphabet } from "nanoid";

    const suffix = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 4);
    // Example: riya-birthday-7f3a. Falls back to "wish" when the name has no latin letters.
    export function buildSlug(name: string, occasion: string) {
      const base = slugify(`${name} ${occasion}`, { lower: true, strict: true }) || "wish";
      return `${base}-${suffix()}`;
    }

### lib/cloudinary.ts

    import { v2 as cloudinary } from "cloudinary";

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    export { cloudinary };

### lib/cloudinary-url.ts

    // Inserts a Cloudinary transformation into a delivery URL.
    // Example: cld(url, "w_1200,f_auto,q_auto"). Non-Cloudinary URLs are returned unchanged.
    export function cld(url: string, transform = "f_auto,q_auto"): string {
      return url.includes("/upload/") ? url.replace("/upload/", `/upload/${transform}/`) : url;
    }

### lib/occasion.ts

    // Default decorations per occasion (used when theme.decorations is empty at publish time).
    export const DEFAULT_DECORATIONS: Record<string, string[]> = {
      BIRTHDAY: ["balloons", "confetti", "cake"],
      ANNIVERSARY: ["hearts", "petals"],
      WEDDING: ["petals", "hearts", "sparkles"],
      FAREWELL: ["stars", "sparkles"],
      CONGRATS: ["confetti", "stars"],
      FRIENDSHIP: ["balloons", "stars", "hearts"],
      CUSTOM: ["sparkles"],
    };

CHECKPOINT AR-A: SECTION 5 files understood. They are created in step AR-06 to AR-09 of SECTION 14.
- [x] Done
- VERIFY: none needed now.

---

## SECTION 6. DATABASE MODELS (MONGOOSE)

All models use `mongoose.models.X || mongoose.model("X", schema)` so hot reload does not redefine them. All schemas use { timestamps: true } unless stated.

### models/User.ts
Fields:
- name: String, required, max 60
- email: String, required, unique, lowercase, trim
- passwordHash: String, required
- role: String enum USER | ADMIN, default USER
- avatar: String, default ""
- isActive: Boolean, default true

### models/Template.ts
Fields:
- id: String, required, unique (the slug such as neon-night)
- name: String, required
- description: String
- previewImage: String, default ""
- supportedOccasions: [String]
- defaultPalette: { accent: String, colors: [String] }
- fonts: [String]
- isActive: Boolean, default true

### models/Page.ts
Fields:
- ownerId: ObjectId ref User, required, index
- slug: String. Unique index with partialFilterExpression { slug: { $type: "string" } } so many drafts without a slug are allowed. The field must be absent (not null) until publish.
- status: String enum DRAFT | SCHEDULED | PUBLISHED | UNPUBLISHED | DISABLED, default DRAFT, index
- rev: Number, integer, default 0. Increment for every content or lifecycle mutation, not analytics counters.
- disabledFromStatus: original lifecycle status saved by admin disable; removed when restored.
- draftStep: Number, default 1 (last wizard step reached, 1 to 6)
- occasion: String enum BIRTHDAY | ANNIVERSARY | WEDDING | FAREWELL | CONGRATS | FRIENDSHIP | CUSTOM
- customOccasionLabel: String, max 40
- occasionDate: Date
- revealAt: Date (null or absent means open immediately)
- recipient: { name: String max 40, nickname: String max 40, relation: String max 40, age: Number }
- from: String, max 60, default ""
- language: String enum HINGLISH | ENGLISH | HINDI, default ENGLISH
- messages: [String] (1 to 5 items, each max 600)
- memories: [ { id: String, title: String max 60, date: String (YYYY-MM-DD), description: String max 300, mediaId: String } ] with _id disabled, max 8
- media: [ { id: String, type: String enum image | video, url: String, publicId: String, w: Number, h: Number, duration: Number, caption: String max 120, order: Number } ] with _id disabled
- theme: { templateId: String, accent: String default "#FF4FA3", font: String enum default | handwriting default "default", music: String default "none", decorations: [String] }
- settings: { passwordHash: String, wishesWall: Boolean default true, showViews: Boolean default false }
- ogImageUrl: String
- thumbnailUrl: String
- stats: { views: Number default 0, uniqueViews: Number default 0, wishes: Number default 0 }
- deploy: { provider: String, deploymentId: String, url: String, state: String, lastDeployedAt: Date } (bonus, leave unused until file 05 bonus section)

Indexes: ownerId; slug (partial unique); status; { ownerId: 1, createdAt: -1 }.

### models/Wish.ts
Fields: pageId (ObjectId, required, index), name (String max 40), message (String max 280), emoji (String max 8, default ""), visitorId (String), ipHash (String), isHidden (Boolean default false). Timestamps: createdAt only (set timestamps: { createdAt: true, updatedAt: false }).

### models/PageView.ts
Fields: pageId (ObjectId, required), visitorId (String, required), lastCountedAt (Date, required), expiresAt (Date, required). One dedupe lease per visitor and page.
Indexes: unique { pageId: 1, visitorId: 1 }; TTL { expiresAt: 1 } with expireAfterSeconds: 0. TTL deletion is asynchronous: eligibility is checked with lastCountedAt, not by waiting for document deletion.

### models/PageVisitor.ts
Fields: pageId (ObjectId, required), visitorId (String, required), createdAt. Unique index { pageId: 1, visitorId: 1 }, no TTL; preserves lifetime unique counts independently of the 30-minute lease.

### models/DailyStat.ts
Fields: pageId (ObjectId, required), date (UTC YYYY-MM-DD, required), views (Number, default 0). Unique index { pageId: 1, date: 1 }; increment with $inc.

### models/RateLimit.ts
Fields: key (String, required, unique), count (Number, default 0), expiresAt (Date). Index: { expiresAt: 1 } with expireAfterSeconds: 0 (TTL). No timestamps.

---

## SECTION 7. VALIDATION SCHEMAS (lib/validators.ts, REFERENCE)

All user text passes through cleanText via a transform. Unknown keys are stripped by zod default, which also blocks mass assignment (ownerId, status, slug, stats cannot be set by the client).

    import { z } from "zod";
    import { cleanText } from "./sanitize";

    export const OCCASIONS = ["BIRTHDAY","ANNIVERSARY","WEDDING","FAREWELL","CONGRATS","FRIENDSHIP","CUSTOM"] as const;
    export const LANGUAGES = ["HINGLISH","ENGLISH","HINDI"] as const;
    export const MUSIC = ["none","soft-piano","happy-pop","party-beat","romantic-strings"] as const;
    export const DECORATIONS = ["balloons","confetti","cake","hearts","petals","sparkles","stars"] as const;
    export const FONTS = ["default","handwriting"] as const;

    const text = (max: number) => z.string().max(max).transform(cleanText);
    const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid colour");

    export const registerSchema = z.object({
      name: text(60).refine((v) => v.length >= 2, "Name is too short"),
      email: z.string().email("Invalid email").max(120).transform((v) => v.toLowerCase().trim()),
      password: z.string().min(8, "Password must be at least 8 characters").max(72)
        .regex(/[A-Za-z]/, "Password needs a letter").regex(/[0-9]/, "Password needs a number"),
    });
    export const loginSchema = z.object({
      email: z.string().email("Invalid email").transform((v) => v.toLowerCase().trim()),
      password: z.string().min(1, "Password is required").max(72),
    });

    const memoryInput = z.object({
      id: z.string().max(20).optional(),
      title: text(60).refine((v) => v.length > 0, "Memory title is required"),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
      description: text(300).optional(),
      mediaId: z.string().max(20).optional(),
    });

    export const draftSchema = z.object({
      occasion: z.enum(OCCASIONS).optional(),
      customOccasionLabel: text(40).optional(),
      occasionDate: z.coerce.date().nullable().optional(),
      revealAt: z.coerce.date().nullable().optional(),
      recipient: z.object({
        name: text(40).optional(), nickname: text(40).optional(),
        relation: text(40).optional(), age: z.number().int().min(1).max(120).optional(),
      }).optional(),
      from: text(60).optional(),
      language: z.enum(LANGUAGES).optional(),
      messages: z.array(text(600)).max(5).transform((a) => a.filter((m) => m.length > 0)).optional(),
      memories: z.array(memoryInput).max(8).optional(),
      media: z.array(z.object({
        id: z.string().max(20), caption: text(120).optional(), order: z.number().int().min(0).max(100).optional(),
      })).max(17).optional(),
      theme: z.object({
        templateId: z.string().max(40).optional(), accent: hex.optional(), font: z.enum(FONTS).optional(),
        music: z.enum(MUSIC).optional(), decorations: z.array(z.enum(DECORATIONS)).max(7).optional(),
      }).optional(),
      settings: z.object({
        password: z.string().min(4).max(50).nullable().optional(),
        wishesWall: z.boolean().optional(), showViews: z.boolean().optional(),
      }).optional(),
      draftStep: z.number().int().min(1).max(6).optional(),
    });

    export const patchSchema = draftSchema.extend({ rev: z.number().int().min(0) });

    // Checked against the STORED page document at publish time.
    export const publishSchema = z.object({
      occasion: z.enum(OCCASIONS, { required_error: "Choose an occasion" }),
      customOccasionLabel: z.string().optional(),
      recipient: z.object({ name: z.string().trim().min(1, "Add the recipient name").max(40) }, { required_error: "Add the recipient name" }),
      messages: z.array(z.string().trim().min(1).max(600)).min(1, "Add at least 1 message").max(5),
      memories: z.array(memoryInput).max(8),
      media: z.array(z.object({ type: z.enum(["image", "video"]) })).max(17)
        .refine((m) => m.some((item) => item.type === "image"), "Add at least 1 photo")
        .refine((m) => m.filter((item) => item.type === "image").length <= 15, "Use at most 15 photos")
        .refine((m) => m.filter((item) => item.type === "video").length <= 2, "Use at most 2 videos"),
      theme: z.object({ templateId: z.string().min(1, "Pick a template") }, { required_error: "Pick a template" }),
    }).refine((p) => p.occasion !== "CUSTOM" || !!p.customOccasionLabel?.trim(), {
      message: "Add a name for your custom occasion", path: ["customOccasionLabel"],
    });

    export const mediaRegisterSchema = z.object({
      pageId: z.string().length(24),
      publicId: z.string().min(1).max(200),
      resourceType: z.enum(["image", "video"]),
      caption: text(120).optional(),
    });
    export const uploadSignSchema = z.object({ resourceType: z.enum(["image", "video"]) });
    export const unlockSchema = z.object({ password: z.string().min(1).max(50) });
    export const wishSchema = z.object({
      name: text(40).refine((v) => v.length > 0, "Name is required"),
      message: text(280).refine((v) => v.length > 0, "Message is required"),
      emoji: z.string().max(8).optional(),
    });

---

## SECTION 8. SHARED BUSINESS LOGIC (lib/page-helpers.ts)

Implement these functions exactly as described.

1. effectiveStatus(page): returns one of DRAFT, SCHEDULED, PUBLISHED, UNPUBLISHED, DISABLED.
   - If stored status is DRAFT, UNPUBLISHED, or DISABLED, return it unchanged.
   - Otherwise (stored PUBLISHED or SCHEDULED): if revealAt exists and revealAt is later than now, return SCHEDULED; else return PUBLISHED.
   - There is no cron job. Scheduled pages unlock simply because time passes.
   - Dashboard labels: DRAFT = Draft, SCHEDULED = Scheduled, PUBLISHED = Live, UNPUBLISHED = Unpublished, DISABLED = Disabled.

2. firstName(name): first whitespace-separated word of recipient.name.

3. checkPageAccess(page, user, cookieToken): returns an object describing what a requester may see. Steps in this exact order:
   a. If status is DISABLED: return { result: "UNAVAILABLE" } (admins and owner are not exempt for the public route, they use the dashboard).
   b. If status is DRAFT: return { result: "NOT_FOUND" } (drafts have no slug, so this is a safety check).
   c. If status is UNPUBLISHED and the requester is not the owner and not an admin: return { result: "UNAVAILABLE" }.
   d. Determine isPrivileged = requester is the owner or an ADMIN.
   e. If effectiveStatus is SCHEDULED and not isPrivileged: return { result: "LOCKED_SCHEDULED" }.
  f. If settings.passwordHash exists and not isPrivileged and verifyViewToken(cookieToken, pageId, page.rev) is false: return { result: "LOCKED_PASSWORD" }.
   g. Otherwise return { result: "OK", isOwner }.

4. serializeOwnerPage(page): returns the page for its owner. Convert _id to id, remove ownerId and passwordHash, set settings.hasPassword = true or false, include effectiveStatus as `statusLabelKey` equal to effectiveStatus(page), keep everything else.

5. serializeCard(page): for dashboard and admin lists. Returns { id, slug, status: effectiveStatus(page), recipientName, occasion, thumbnailUrl, stats, revealAt, createdAt, updatedAt }.

6. serializePublicPage(page, includeViews): returns exactly the open payload defined in EP-18. Never include passwordHash, ownerId, owner email, deploy, or stats other than views when settings.showViews is true.

7. refreshThumbnail(page): sets page.thumbnailUrl to cld(firstImage.url, "w_400,h_500,c_fill,g_auto,f_auto,q_auto") where firstImage is the media item with type image and the lowest order. Call it whenever media changes (EP-10, EP-12, EP-13, EP-14).

8. destroyAssets(mediaItems, excludePageId): for each media item, skip it if publicId starts with "seed/", or if another page (id not equal to excludePageId) still references the same publicId; otherwise call cloudinary.uploader.destroy(publicId, { resource_type: type }). Errors are logged and ignored.

9. getOwnedPage(id, user, allowAdmin = false): if id is not a valid 24-character ObjectId, throw 404; load the page; if missing throw 404; if page.ownerId is not user.id and not (allowAdmin and user.role is ADMIN) throw 403 FORBIDDEN; return the document (not lean).

---

## SECTION 9. API CONTRACT

Base path: /api/v1. All handlers are wrapped with route(...) from lib/api.ts. All bodies are JSON except where stated. Success: { success: true, data, message? }. Error: { success: false, error: { code, message, details? } }.

Notation: "Auth" means requireUser(); "Admin" means requireAdmin(); "Owner" means getOwnedPage(id, user). Create the route file at the path shown.

### Rate limit table (apply exactly)

- Register: 5 per hour per IP; fail closed.
- Login: 5 per 15 minutes per IP plus normalized email; fail closed.
- Unlock: 5 per 10 minutes per IP plus slug; fail closed.
- Public reads, including wishes GET, OG and server-rendered /w/[slug]: 120 per minute per IP; fail open. Apply once at each network entry, not again inside a shared loader.
- View record: 60 per minute per IP; fail open.
- Wish POST: 3 per hour per visitor per page AND 20 per hour per IP; fail closed.
- Upload sign: 30 per hour per user; fail closed.
- Publish: 10 per hour per user; fail closed.
- AI bonus: 10 per hour per user; fail closed.

All public page payloads, /w/[slug] HTML, metadata and OG responses use private, no-store in version 1. Opt these routes out of static rendering and persistent Next.js data caches; server components query the shared service directly. Metadata/OG never use owner or admin lock bypass. Previously shared previews or public media URLs cannot be recalled from third parties; document this limitation.

### EP-01 GET /health
File: app/api/v1/health/route.ts. Public. Connects to the database. Returns 200 { status: "ok", db: "connected" }. Used to verify deployment.

### EP-02 POST /auth/register
File: app/api/v1/auth/register/route.ts. Public. Rate limited.
Body: registerSchema. Steps: check email not used (409 EMAIL_TAKEN); hash password; create user with role USER; sign token; set cookie.
201: data { user: { id, name, email, role } }.

### EP-03 POST /auth/login
File: app/api/v1/auth/login/route.ts. Public. Rate limited.
Body: loginSchema. Steps: find user by email; if none or password mismatch return 401 INVALID_CREDENTIALS with the same message for both ("Email or password is incorrect"); if isActive is false return 403 ACCOUNT_DISABLED; set cookie.
200: data { user }.

### EP-04 POST /auth/logout
File: app/api/v1/auth/logout/route.ts. Public. Clears the cookie. 200.

### EP-05 GET /auth/me
File: app/api/v1/auth/me/route.ts. Auth. 200: data { user: { id, name, email, role } }. 401 if not logged in.

### EP-06 GET /templates
File: app/api/v1/templates/route.ts. Public. Returns active templates: data { items: [ { id, name, description, previewImage, supportedOccasions, defaultPalette, fonts } ] }.

### EP-07 POST /pages
File: app/api/v1/pages/route.ts. Auth.
Body: draftSchema (all fields optional, empty object allowed). Steps: if the user already owns 50 pages return 409 PAGE_LIMIT; create page with ownerId, status DRAFT, and the provided fields (password handling as in EP-10).
201: data serializeOwnerPage.

### EP-08 GET /pages/mine
File: app/api/v1/pages/mine/route.ts. Auth. Query: parseListQuery(allowedSort ["createdAt","updatedAt"]); optional status filter. Returns paginated serializeCard items for the user's pages, newest first.

### EP-09 GET /pages/:id
File: app/api/v1/pages/[id]/route.ts (GET). Owner. 200: data serializeOwnerPage. Used by the wizard to load and resume a draft.

### EP-10 PATCH /pages/:id
File: same route.ts (PATCH). Owner only (admin not allowed).
Body: patchSchema (draftSchema plus required non-negative integer rev; EP-07 uses draftSchema). Rules:
1. Scalars (occasion, customOccasionLabel, occasionDate, revealAt, from, language, draftStep) are set when present.
2. recipient and theme are merged field by field.
3. messages and memories replace the stored arrays. Each memory without an id gets nanoid(8). A memory mediaId must match an existing media id, otherwise 400.
4. media: accepts only { id, caption, order } for ids that already exist on the page. It can never add or remove media and can never change url or publicId. Unknown ids are 400.
5. settings.password: a string sets passwordHash = bcrypt hash; null removes passwordHash; absent leaves it. The plain password is never stored.
6. If the page has a slug and status is PUBLISHED or SCHEDULED and revealAt changed, recompute stored status: SCHEDULED if revealAt is in the future, else PUBLISHED.
7. Call refreshThumbnail when media changed.
8. Apply changes with an atomic filter { _id, ownerId, rev: submittedRev } and $inc { rev: 1 }. No match on an existing owned page returns 409 STALE_REVISION. Return the new rev in serializeOwnerPage. Media registration/deletion, publish, unpublish and admin lifecycle changes also atomically increment rev. Never silently retry stale client edits.
200: data serializeOwnerPage.

### EP-11 POST /uploads/sign
File: app/api/v1/uploads/sign/route.ts. Auth. Rate limited.
Body: uploadSignSchema. Steps: folder = `wishly/${user.id}`; timestamp = current unix seconds; allowed_formats is jpg,jpeg,png,webp,heic,heif for image or mp4 for video. Sign { folder, timestamp, allowed_formats } with cloudinary.utils.api_sign_request and CLOUDINARY_API_SECRET.
200: data { cloudName, apiKey, timestamp, folder, allowedFormats, signature, uploadUrl } where uploadUrl is `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`. Browser sends allowed_formats with the exact signed value. The API secret is never returned.

### EP-12 POST /media
File: app/api/v1/media/route.ts. Auth.
Body: mediaRegisterSchema. Steps in order:
1. Load the page with getOwnedPage(pageId, user).
2. publicId must start with `wishly/${user.id}/`, else 403.
3. Call cloudinary.api.resource(publicId, { resource_type: resourceType }) to get format, bytes, width, height, duration, secure_url. If it fails, 400 ASSET_NOT_FOUND.
4. Image rules: format in jpg, jpeg, png, webp, heic, heif; bytes at most 8388608. Video rules: format mp4; bytes at most 52428800; duration at most 60.
5. Count rule: images on the page at most 15; videos at most 2.
6. If any rule fails: destroy only a verified owned asset not referenced by any page, then return 400 VALIDATION_ERROR. Never delete a registered or duplicated asset on a rejected registration.
7. Append the verified item with an atomic page revision/count check, preventing concurrent requests from exceeding 15 images or 2 videos. Retrying the same page/publicId/type is idempotent, not another upload. Call refreshThumbnail and increment rev. Use the same revision discipline for EP-13 removals.
201: data { media: the new item, rev }. An idempotent retry returns 200 with the existing item and current rev.

### EP-13 DELETE /pages/:id/media/:mediaId
File: app/api/v1/pages/[id]/media/[mediaId]/route.ts. Owner. Removes the item from page.media, clears any memory whose mediaId matches, renumbers order, calls refreshThumbnail, then destroyAssets([item], page.id). 200.

### EP-14 POST /pages/:id/publish
File: app/api/v1/pages/[id]/publish/route.ts. Owner. Rate limited.
Steps in order (this is the generation pipeline):
1. If stored status is DISABLED return 403 PAGE_DISABLED.
2. Validate the stored page with publishSchema. On failure return 400 VALIDATION_ERROR with message = first issue message and details [ { path, issue } ].
3. Confirm templateId exists in templates and isActive; else 400 "Pick a template".
4. If theme.decorations is empty set it from DEFAULT_DECORATIONS[occasion].
5. If the page has no slug: generate with buildSlug(recipient.name, occasion); on duplicate key error retry with a new suffix up to 5 times, then 500. If it already has a slug keep it (slug is permanent).
6. Set status: SCHEDULED if revealAt exists and is in the future, else PUBLISHED. Call refreshThumbnail. Set ogImageUrl = `${APP_URL}/api/og/${slug}`. Save.
7. url = `${APP_URL}/w/${slug}`. qrCode = await QRCode.toDataURL(url, { width: 512, margin: 1 }) from the qrcode package.
8. Use an atomic revision/lifecycle check so concurrent first publishes return the same persisted slug and cannot override a concurrent disable or unpublish. Repeated publish without edits is idempotent; reload after a competing winner. Validate all stored length and media limits, not just minimum required fields.
200: data { slug, url, status, revealAt, qrCode, ogImage, rev }.

### EP-15 POST /pages/:id/unpublish
File: app/api/v1/pages/[id]/unpublish/route.ts. Owner. If stored status is DRAFT return 400 NOT_PUBLISHED; if DISABLED return 403 PAGE_DISABLED. Sets status UNPUBLISHED. 200. Publishing again (EP-14) restores it with the same slug.

### EP-16 POST /pages/:id/duplicate
File: app/api/v1/pages/[id]/duplicate/route.ts. Owner. Enforces the 50-page limit. Creates a new page with the same content fields, media references (same url and publicId), memories, theme, language, messages; status DRAFT; no slug; stats all zero; passwordHash removed; draftStep 1; no deploy, no ogImageUrl. Wishes and views are not copied. 201: data serializeOwnerPage.

### EP-17 DELETE /pages/:id
File: app/api/v1/pages/[id]/route.ts (DELETE). Owner or Admin (getOwnedPage with allowAdmin true). Delete its wishes, pageViews, pageVisitors, dailyStats and page document transactionally; then destroyAssets(page.media, page.id). Log Cloudinary failures for manual retry; never report external cleanup succeeded if it failed. 200.

### EP-18 GET /public/pages/:slug
File: app/api/v1/public/pages/[slug]/route.ts. Public. Rate limited.
Steps: find page by slug (404 PAGE_NOT_FOUND if none). Get the optional current user (null if not logged in) and the view cookie wishly_view_<pageId>. Run checkPageAccess. Respond by result:
- NOT_FOUND: 404 PAGE_NOT_FOUND.
- UNAVAILABLE: 403 PAGE_UNAVAILABLE ("This page is unavailable").
- LOCKED_SCHEDULED: 200 data { locked: true, reason: "SCHEDULED", recipientFirstName, revealAt }. Nothing else.
- LOCKED_PASSWORD: 200 data { locked: true, reason: "PASSWORD", recipientFirstName }. Nothing else.
- OK: 200 data below.

Open payload (exact keys):

    {
      "locked": false,
      "slug": "riya-birthday-7f3a",
      "occasion": "BIRTHDAY",
      "customOccasionLabel": "",
      "occasionDate": "2026-10-14T00:00:00.000Z",
      "recipient": { "name": "Riya", "nickname": "Riyu", "relation": "Best friend" },
      "from": "Arjun & gang",
      "language": "HINGLISH",
      "messages": ["..."],
      "memories": [ { "id": "...", "title": "Goa trip", "date": "2025-12-20", "description": "", "mediaId": "..." } ],
      "media": [ { "id": "...", "type": "image", "url": "https://res.cloudinary.com/...", "w": 1080, "h": 1350, "duration": null, "caption": "Day one", "order": 0 } ],
      "theme": { "templateId": "neon-night", "accent": "#FF4FA3", "font": "default", "music": "soft-piano", "decorations": ["balloons","confetti","cake"] },
      "settings": { "wishesWall": true, "showViews": false },
      "views": 47
    }

The "views" key appears only when settings.showViews is true. The lock screen design must not depend on any page data other than recipientFirstName and revealAt.

### EP-19 POST /public/pages/:slug/unlock
File: app/api/v1/public/pages/[slug]/unlock/route.ts. Public. Rate limited.
Body: unlockSchema. Steps: find page (404); reject DRAFT as 404 and DISABLED/UNPUBLISHED as 403 PAGE_UNAVAILABLE before checking the schedule. If effectiveStatus is SCHEDULED return 403 PAGE_LOCKED. If no password return 400 NOT_PROTECTED. Compare with bcrypt; wrong gives 401 WRONG_PASSWORD. Correct: set cookie wishly_view_<pageId> = signViewToken(pageId, page.rev), httpOnly, sameSite lax, secure in production, path "/", maxAge 7200. A concurrent content/password change invalidates the token; every full-content request checks current rev. 200 data { unlocked: true }.

### EP-20 POST /public/pages/:slug/view
File: app/api/v1/public/pages/[slug]/view/route.ts. Public. Rate limited. No body.
Steps: find page; run checkPageAccess; non-OK or owner returns { counted: false }. Get visitor id and set a new visitor cookie on every resulting response. In a MongoDB transaction, atomically claim a PageView lease only if absent or lastCountedAt <= now minus 30 minutes; set lastCountedAt = now and expiresAt = now plus 30 minutes. A duplicate-key race or active lease means counted false. For a successful claim, upsert PageVisitor using the unique pageId/visitorId key; $inc stats.views and increment stats.uniqueViews only if that visitor row was inserted; $inc DailyStat.views for the UTC day. Commit lease and counters together so retries cannot partially count. Retry transient transaction conflicts within a bounded budget; re-evaluate the lease on retry. TTL cleanup alone never decides eligibility. 200 data { counted: true | false }. Cookie resets can produce new anonymous visitors; unique counts are browser-cookie based, not verified people.

### EP-21 GET /public/pages/:slug/wishes
File: app/api/v1/public/pages/[slug]/wishes/route.ts (GET). Public. Runs checkPageAccess; anything other than OK returns the same error as EP-18 would (locked pages return 403 PAGE_LOCKED). Returns the newest 50 wishes where isHidden is false: data { items: [ { id, name, message, emoji, createdAt } ] }. Never returns ipHash or visitorId.

### EP-22 POST /public/pages/:slug/wishes
File: same route.ts (POST). Public.
Body: wishSchema. Steps: find page; access must be OK; reject a signed-in ADMIN according to file 01 permissions; settings.wishesWall must be true else 403 WISHES_DISABLED. Get or set the visitor cookie before validation/limit errors so rejected attempts retain the same key; apply both SECTION 9 limits. Profanity check on name/message gives 400 PROFANITY. Create the wish and $inc stats.wishes transactionally. The IP limit still applies when cookies are reset.
201: data { wish: { id, name, message, emoji, createdAt } }.

### EP-23 GET /pages/:id/wishes
File: app/api/v1/pages/[id]/wishes/route.ts. Owner or Admin. Paginated list of ALL wishes for the page, newest first, including hidden ones, with an isHidden flag.

### EP-24 DELETE /pages/:id/wishes/:wishId
File: app/api/v1/pages/[id]/wishes/[wishId]/route.ts. Owner or Admin. Transactionally delete the wish scoped to this page and decrement stats.wishes only if a row was deleted; never below 0. Concurrent/repeated deletes must not decrement twice. 200, or 404 when already absent.

### EP-25 GET /pages/:id/insights
File: app/api/v1/pages/[id]/insights/route.ts. Owner or Admin.
200: data { totals: { views, uniqueViews, wishes }, viewsByDay: [ { date: "YYYY-MM-DD", views } ] } covering the last 30 UTC days from DailyStat, with missing days filled with 0. Never build lifetime uniques or charts from expiring PageView leases.

### EP-26 GET /admin/stats
File: app/api/v1/admin/stats/route.ts. Admin. 200: data { users, pages, livePages, disabledPages, wishes, totalViews } using countDocuments and one aggregation for views.

### EP-27 GET /admin/pages
File: app/api/v1/admin/pages/route.ts. Admin. Paginated serializeCard items plus ownerName and ownerEmail. Supports ?status= and ?search= (matches recipient name or slug, using escapeRegex).

### EP-28 PATCH /admin/pages/:id
File: app/api/v1/admin/pages/[id]/route.ts. Admin. Zod body { action: "disable" | "enable" }. disable atomically saves the prior status in disabledFromStatus, sets DISABLED and increments rev; repeated disable must not overwrite saved status. enable restores that status (recompute SCHEDULED/PUBLISHED by revealAt), removes disabledFromStatus and increments rev. Never turn a previously UNPUBLISHED page live merely by enabling it. 200.

### EP-29 GET /admin/users
File: app/api/v1/admin/users/route.ts. Admin. Paginated users { id, name, email, role, isActive, createdAt, pagesCount }. pagesCount comes from one aggregation on pages for the returned user ids. Supports ?search=.

### EP-30 PATCH /admin/users/:id
File: app/api/v1/admin/users/[id]/route.ts. Admin. Body { isActive: boolean }. An admin cannot deactivate themselves (400). 200.

### EP-31 GET /admin/wishes
File: app/api/v1/admin/wishes/route.ts. Admin. Paginated wishes including pageId, recipient name of the page, isHidden. Supports ?search= on message.

### EP-32 PATCH /admin/wishes/:id
File: app/api/v1/admin/wishes/[id]/route.ts. Admin. Body { isHidden: boolean }. 200.

### EP-33 PATCH /admin/templates/:id
File: app/api/v1/admin/templates/[id]/route.ts. Admin. Body { isActive: boolean }. :id is the template slug. 200.

### EP-34 GET /api/og/[slug]
File: app/api/og/[slug]/route.tsx (NOT under v1). Export `runtime = "nodejs"`. Uses ImageResponse from "next/og", size 1200 by 630. Loads the page by slug.
- Always shows: recipient first name, a short line such as "A surprise is waiting for you", and the Wishly name.
- Shows the first photo ONLY when no password is set and effectiveStatus is PUBLISHED. Scheduled/password pages use a generic teaser and no media, even for owner/admin. Apply the same public-only rule to metadata.
- Unknown, DRAFT, UNPUBLISHED or DISABLED slug returns a generic Wishly image and generic metadata with no recipient details, status 200.
- app/w/[slug]/page.tsx exports generateMetadata that sets title "A surprise for <firstName>", description, and openGraph and twitter images to `${APP_URL}/api/og/${slug}`. It uses only the first name.

### Bonus endpoints (create only in the bonus phase of file 05)
- EP-B1 POST /pages/:id/deploy (Owner or Admin): start Vercel or Netlify deploy.
- EP-B2 GET /pages/:id/deploy (Owner or Admin): deploy status and URL.
- EP-B3 POST /ai/message (Auth, 10 per hour per user): returns 3 message suggestions via Gemini.

CHECKPOINT AR-B: Endpoint list reviewed.
- [x] Done
- VERIFY: EP-01 to EP-34 are each mapped to exactly one route file path above, and file 03 phases cover all of them.

---

## SECTION 10. MEDIA PIPELINE (EXACT SEQUENCE)

1. The wizard has already created the draft page (EP-07) before the Media step. Uploads need a pageId.
2. Client validates each file before upload: type in jpg, jpeg, png, webp, heic, heif for images or mp4 for video; image at most 8 MB; video at most 50 MB; counts at most 15 images and 2 videos. For video duration, load the file into a hidden video element and read duration; reject above 60 seconds.
3. Client compresses images with browser-image-compression (max width or height 2000, target about 1.5 MB, useWebWorker true). HEIC and HEIF files are NOT compressed in the browser; they are uploaded as they are.
4. Client calls EP-11 to get the signed parameters.
5. Client uploads straight to uploadUrl with multipart form fields: file, api_key, timestamp, folder, signature. Use XMLHttpRequest so upload progress events can drive a progress bar.
6. Cloudinary replies with public_id. Client calls EP-12 with { pageId, publicId, resourceType, caption }.
7. The server verifies the asset (EP-12) and returns the saved media item. Only then does the item appear in the media list.
8. Reorder and caption edits are saved with EP-10 (media array of id, caption, order). Delete uses EP-13.
9. Delivery: every image shown to a viewer uses cld(url, "w_<size>,f_auto,q_auto") with sizes 400 (thumbnail), 800 (gallery), 1200 (hero, lightbox). Video uses cld(url, "f_auto,q_auto") and is lazy-loaded.

---

## SECTION 11. SECURITY CHECKLIST (ALL MUST BE TRUE)

1. Passwords hashed with bcrypt (cost 10). Page passwords hashed the same way.
2. Auth cookie: httpOnly, sameSite lax, secure in production, 7 days.
3. Every protected handler calls requireUser() or requireAdmin() and then ownership checks through getOwnedPage. Hiding a button is never the only protection.
4. Public APIs never return passwordHash, ownerId, owner email, ipHash, or visitorId.
5. Scheduled and password-locked content is withheld by the server (EP-18, EP-21, EP-20, EP-34), never by the front end alone.
6. All user text is cleaned with cleanText on write. dangerouslySetInnerHTML is never used with user content anywhere.
7. Request bodies are validated with zod on every route. Unknown keys are stripped.
8. PATCH cannot add or remove media or change urls.
9. Upload signing uses the server-held API secret. Uploaded assets are verified server-side before use. publicId must belong to the user's own folder.
10. Rate limits from the table in SECTION 9 are applied.
11. Errors never include stack traces; unknown errors return 500 INTERNAL_ERROR with a generic message.
12. Security headers and CORS are set in next.config.ts (SECTION 14 step AR-10).
13. .env is git-ignored; .env.example has no real values.
14. Deploy CSP with frame-ancestors 'none', restrictive default/base/form/object sources, and explicit Cloudinary image/media/upload connections. Next.js inline scripts require a tested nonce or hash strategy. Begin with report-only during development, then enforce and test in production. Document necessary style-src relaxations; do not drop CSP entirely.
15. Same-origin mutation checks, independent secrets, explicit JWT algorithms, revision-aware unlock tokens, request IDs and redacted pino logs are required in SECTION 5. Mongoose/Cloudinary handlers use the Node.js runtime, not Edge.

---

## SECTION 12. WIZARD STEP TO API MAPPING

The wizard (file 03, phase 2) saves each step with these calls.

- Step 1 Occasion: occasion, customOccasionLabel, occasionDate, revealAt. First "Next" creates the draft with EP-07; later saves use EP-10. The reveal toggle sets revealAt to occasionDate at the chosen time (default 00:00) built from the browser local time as an ISO string.
- Step 2 Recipient: recipient { name, nickname, relation, age }, from.
- Step 3 Words and Language: language, messages (1 to 5), memories (up to 8).
- Step 4 Media: uploads through the media pipeline (SECTION 10); caption and order through EP-10; theme.music through EP-10.
- Step 5 Style: theme { templateId, accent, font, decorations }, settings { password, wishesWall, showViews }.
- Step 6 Review: no new fields. Shows a summary and calls EP-14.
- Every save also sends draftStep.
- Local autosave key: `wishly:draft:<pageId or "new">` in localStorage, written on every change, cleared after a successful publish.

---

## SECTION 13. SEED SCRIPT SPECIFICATION (scripts/seed.ts)

Run with `npm run seed`. It must be safe to run repeatedly (idempotent) and must print what it created.

1. Connect with connectDB().
2. Upsert users by email: admin@demo.com / Admin@123 (role ADMIN, name "Admin"); creator@demo.com / Creator@123 (role USER, name "Demo Creator"). Hash with hashPassword.
3. Upsert the 3 templates by id:
  - neon-night: name "Neon Night", defaultPalette { accent "#FF4FA3", colors ["#0B0420","#FF4FA3","#22D3EE","#A78BFA"] }, fonts ["Space Grotesk","Caveat"], description "Party and Gen-Z. Glowing neon text, starfield parallax, glitch reveal, confetti cannon."
   - pastel-dream: name "Pastel Dream", defaultPalette { accent "#F472B6", colors ["#FFF1F5","#FBCFE8","#C4B5FD","#FDE68A"] }, fonts ["Fredoka","Quicksand","Caveat"], description "Soft and cute. Floating balloons, polaroid gallery, hand-drawn doodles, petals."
   - royal-gold: name "Royal Gold", defaultPalette { accent "#D4AF37", colors ["#0E0E10","#D4AF37","#F5E6C8","#7F1D1D"] }, fonts ["Playfair Display","Cormorant"], description "Elegant. Gold foil shimmer, slow parallax, rose petals, letter-opening intro."
   - All three: supportedOccasions = all 7 occasions, isActive true.
4. Upsert only the listed seed slugs; never overwrite unrelated user data. All seed pages belong to creator@demo.com. Destructive reseeding requires an explicit operator opt-in, a non-production database and cleanup of wishes, leases, visitors and daily stats. Create indexes explicitly and await Model.init() before concurrency checks; verify production indexes rather than assuming first-use creation.
5. Default seed media is uploaded to the team's Cloudinary cloud under stable seed/ public IDs; read dimensions and duration from upload metadata. These demo-cloud URLs are fallback development fixtures only; document their use in README:
   - https://res.cloudinary.com/demo/image/upload/sample.jpg
   - https://res.cloudinary.com/demo/image/upload/cld-sample.jpg
   - https://res.cloudinary.com/demo/image/upload/cld-sample-2.jpg
   - https://res.cloudinary.com/demo/image/upload/cld-sample-3.jpg
   - https://res.cloudinary.com/demo/image/upload/cld-sample-4.jpg
   - https://res.cloudinary.com/demo/image/upload/cld-sample-5.jpg
   - Video: https://res.cloudinary.com/demo/video/upload/dog.mp4
  Each item gets id nanoid(8), verified w/h, caption and order. Fetch each fixture before use and note replacements in docs/DECISIONS.md. Do not imply the demo cloud is the team's upload pipeline.
6. Seed pages (5):
   a. slug riya-birthday-7f3a: BIRTHDAY, language HINGLISH, template neon-night, accent #FF4FA3, music soft-piano, recipient Riya (nickname Riyu, relation Best friend), from "Arjun & gang", message "Tu best hai yaar, har din tere bina boring hai", 3 memories (First day of college, Goa trip, Farewell) linked to media, 6 images and 1 video, status PUBLISHED, showViews true, wishesWall true, stats { views 47, uniqueViews 31, wishes 3 }, plus 3 wishes.
   b. slug kavya-anniversary-2k4m: ANNIVERSARY, ENGLISH, royal-gold, 5 images, status PUBLISHED, 2 memories.
   c. slug meera-birthday-9p1x: BIRTHDAY, HINDI, pastel-dream, recipient name in Devanagari "मीरा", message in Devanagari, 5 images, status PUBLISHED.
   d. slug dev-farewell-3c8z: FAREWELL, ENGLISH, royal-gold, revealAt = seed run time plus 3 days, status SCHEDULED, 4 images.
   e. slug sana-friendship-5h2q: FRIENDSHIP, HINGLISH, pastel-dream, password "friends123" (stored as bcrypt hash), status PUBLISHED, 4 images.
7. Each seed page sets thumbnailUrl via refreshThumbnail logic and ogImageUrl to `${NEXT_PUBLIC_APP_URL}/api/og/<slug>`, and theme.decorations from DEFAULT_DECORATIONS.
8. Print: users created, templates upserted, the 5 slugs with their URLs, and the password for page e.

Seed counts must agree with seeded wishes, lifetime visitors and daily statistics. Either seed matching analytics records for the example 47/31 totals or start counts at zero; never present invented totals as tracked visits. Re-running seed must not inflate counters or add duplicate wishes.

---

## SECTION 14. FOUNDATION BUILD SEQUENCE (DO IN THIS ORDER)

This sequence builds the empty but working base. Feature work starts in file 03. Commit after each checkpoint.

STEP AR-01. Scaffold the Next.js app using the command in SECTION 1.
- [x] Done
- VERIFY: `npm run dev` serves the default page at http://localhost:3000. Commit: chore(init): scaffold next app.

STEP AR-02. Install all dependencies from SECTION 1, run shadcn init, set package.json scripts exactly as listed, and add a .prettierrc with { "semi": true, "singleQuote": false, "printWidth": 100 }.
- [x] Done
- VERIFY: `npm run build` succeeds. Commit: chore(deps): install dependencies.

STEP AR-03. Create .env.example (SECTION 3), create .env with real values, and make sure .gitignore contains .env, .env.local, node_modules, .next.
- [x] Done
- VERIFY: `git status` does not list .env. Commit: chore(env): add env example.

STEP AR-04. Create the folder skeleton from SECTION 2. Do not create empty page.tsx, layout.tsx or route.ts files: Next.js discovers them and requires valid exports. Add valid minimal components/handlers only when needed; future module paths may remain directories until their feature step.
- [x] Done
- VERIFY: foundation directories exist and `npm run build` passes with every discovered route exporting valid code. Commit: chore(structure): create folder skeleton.

STEP AR-05. Create lib/db.ts and EP-01 (health route).
- [ ] Done
- VERIFY: `curl -i http://localhost:3000/api/v1/health` returns 200 with db connected. Commit: feat(db): add connection and health route.

STEP AR-06. Create lib/errors.ts, lib/api.ts, lib/logger.ts, lib/sanitize.ts, lib/validators.ts, lib/slug.ts, lib/occasion.ts and lib/cloudinary-url.ts from SECTION 5 and 7. Extend the wrapper for request IDs/redacted pino logging and Origin checks; the minimal reference wrapper alone is not complete.
- [x] Done
- VERIFY: `npm run build` succeeds; a request with invalid JSON to a test route returns the standard 400 error shape. Commit: feat(core): add api helpers and validators.

STEP AR-07. Create all eight models from SECTION 6 and ensure their indexes exist.
- [ ] Done
- VERIFY: a temporary script or the health route can create and delete one document in each collection without error; indexes appear in Atlas after first use. Commit: feat(models): add mongoose models.

STEP AR-08. Create lib/auth.ts, lib/rate-limit.ts, lib/visitor.ts as in SECTION 5.
- [x] Done
- VERIFY: build succeeds; rateLimit with limit 3 returns allowed false on the 4th call; test one duplicate-key retry and fail-open/fail-closed database errors with Vitest. Commit: feat(auth): add auth and rate limit helpers.

STEP AR-09. Create lib/cloudinary.ts and lib/page-helpers.ts implementing all 9 functions of SECTION 8.
- [x] Done
- VERIFY: `npm run build` succeeds; effectiveStatus returns SCHEDULED for a page with a future revealAt and PUBLISHED when the date has passed (check with a quick script). Commit: feat(core): add page helpers.

STEP AR-10. Configure next.config.ts with these baseline headers and the Cloudinary image host; also implement and test the CSP strategy and Origin guard from SECTION 11. CORS headers do not replace either control:

    import type { NextConfig } from "next";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    ];
    const nextConfig: NextConfig = {
      images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] },
      async headers() {
        return [
          { source: "/:path*", headers: securityHeaders },
          {
            source: "/api/v1/:path*",
            headers: [
              { key: "Access-Control-Allow-Origin", value: appUrl },
              { key: "Access-Control-Allow-Credentials", value: "true" },
              { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,DELETE,OPTIONS" },
              { key: "Access-Control-Allow-Headers", value: "Content-Type" },
              { key: "Vary", value: "Origin" },
            ],
          },
        ];
      },
    };
    export default nextConfig;

- [x] Done
- VERIFY: health shows baseline headers; foreign/missing Origin mutations return 403; same-origin mutations pass; enforced production CSP permits hydration, Cloudinary uploads/media and local fonts. Commit: feat(security): add headers cors and csrf guards.

STEP AR-11. Write scripts/seed.ts per SECTION 13 and run it twice.
- [ ] Done
- VERIFY: first and second runs both succeed with no duplicate errors; in Atlas, users has 2 documents, templates has 3, pages has the 5 seed slugs. Commit: feat(seed): add seed script.

STEP AR-12. Write SPEC.md at the repository root containing: the locked decisions (file 01 SECTION 1), the model definitions (SECTION 6), the endpoint list EP-01 to EP-34 with method, path, access, and one-line purpose (SECTION 9), and the public payload shape (EP-18).
- [x] Done
- VERIFY: SPEC.md exists and lists every endpoint id. Commit: docs(spec): add SPEC.md.

STEP AR-13. Deploy the scaffold. Push to GitHub, import into Vercel, configure required server variables and NEXT_PUBLIC_APP_URL for that deployment. Preview/test environments use an isolated database and their own matching app origin, never production credentials. Do not set optional bonus tokens until used. Run non-destructive seed against the intended database. Document any Atlas network wildcard needed for serverless; use a least-privilege database user and strong credentials.
- [ ] Done
- VERIFY: `curl -i https://<production-url>/api/v1/health` returns 200 with db connected. Record the production URL in README.md. Commit: docs(readme): record production url.

STEP AR-14. Final check of this file.
- [ ] Done
- VERIFY: AR-01 to AR-13 and AR-A and AR-B are all marked [x]. Then proceed to file 03-IMPLEMENTATION-WORKFLOW.md.

END OF FILE 02
