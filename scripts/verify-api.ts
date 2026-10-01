// End-to-end API verification against a RUNNING server (docs/05 T-01..T-20 evidence).
/* eslint-disable @typescript-eslint/no-explicit-any */
//
//   npm run dev            # or: npm run build && npm start
//   npm run seed           # once, to create the demo templates and pages
//   npx tsx --env-file=.env scripts/verify-api.ts
//
// It logs in with the seeded accounts, walks a full draft -> media -> publish -> public
// view -> wishes -> lock/password -> admin disable/enable cycle, checks the exact
// response shapes and the security rules, then deletes everything it created.
import mongoose from "mongoose";
import { cloudinary } from "../lib/cloudinary";
import { connectDB } from "../lib/db";
import { User } from "../models/User";

const BASE = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const ORIGIN = BASE;
const CREATOR = { email: "creator@demo.com", password: "Creator@123" };
const createdPageIds = new Set<string>();
const uploadedPublicIds = new Set<string>();
const temporaryEmails = new Set<string>();

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail === undefined ? "" : ` -> ${JSON.stringify(detail)}`}`);
  }
}

function section(title: string) {
  console.log(`\n== ${title}`);
}

// --- Minimal cookie-aware client -------------------------------------------------------
type Session = { name: string; cookies: Map<string, string> };
let cleanupCreator: Session | undefined;

function session(name: string): Session {
  return { name, cookies: new Map() };
}

function cookieHeader(s: Session) {
  return Array.from(s.cookies, ([k, v]) => `${k}=${v}`).join("; ");
}

async function call<T = any>(
  path: string,
  opts: { method?: string; body?: unknown; session?: Session; origin?: string | null } = {},
): Promise<{
  status: number;
  data: T;
  error?: { code: string; message: string; details?: unknown[] };
  raw: any;
}> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const origin = opts.origin === undefined ? ORIGIN : opts.origin;
  if (origin) headers["Origin"] = origin;
  if (opts.session && opts.session.cookies.size) headers["Cookie"] = cookieHeader(opts.session);

  const method = opts.method ?? "GET";
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    const error = err as Error & { cause?: { code?: string; message?: string } };
    throw new Error(
      `${method} ${path} transport failed${error.cause?.code ? ` (${error.cause.code})` : ""}: ${error.cause?.message ?? error.message}`,
      { cause: err },
    );
  }

  // Keep the session cookie jar in sync (auth token, visitor id, unlock token).
  const setCookies: string[] =
    (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  for (const raw of setCookies) {
    const [pair] = raw.split(";");
    const index = pair.indexOf("=");
    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (opts.session) {
      if (value === "") opts.session.cookies.delete(name);
      else opts.session.cookies.set(name, value);
    }
  }

  const json = await res.json().catch(() => null);
  return { status: res.status, data: json?.data as T, error: json?.error, raw: json };
}

const newVisitorSession = () => session(`visitor-${Math.random().toString(36).slice(2, 7)}`);

async function cleanup() {
  try {
    for (const id of createdPageIds) {
      try {
        const removed = await call(`/api/v1/pages/${id}`, {
          method: "DELETE",
          session: cleanupCreator,
        });
        if (removed.status !== 200 && removed.status !== 404) {
          console.error(`Cleanup could not delete test page ${id}: HTTP ${removed.status}`);
        }
      } catch (err) {
        console.error(`Cleanup could not delete test page ${id}: ${(err as Error).message}`);
      }
    }

    for (const publicId of uploadedPublicIds) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      } catch (err) {
        console.error(
          `Cleanup could not remove test upload ${publicId}: ${(err as Error).message}`,
        );
      }
    }

    if (temporaryEmails.size) {
      try {
        await connectDB();
        await User.deleteMany({ email: { $in: [...temporaryEmails] } });
      } catch (err) {
        console.error(`Cleanup could not remove temporary users: ${(err as Error).message}`);
      }
    }
  } finally {
    await mongoose.disconnect().catch((err) => {
      console.error(`Cleanup could not close the MongoDB connection: ${(err as Error).message}`);
    });
  }
}

// Uploads a demo image into the per-user Cloudinary folder. The Cloudinary typings want an
// ImageFormat[] but the signed request carries a comma separated string, which is what the
// browser sends too, so the options object is cast.
function uploadDemoImage(source: string, folder: string, allowedFormats: string) {
  const options = {
    folder,
    allowed_formats: allowedFormats,
    resource_type: "image",
  } as unknown as Parameters<typeof cloudinary.uploader.upload>[1];
  return cloudinary.uploader.upload(source, options);
}

async function main() {
  console.log(`Verifying ${BASE} (Origin ${ORIGIN})`);

  // --- EP-01 health --------------------------------------------------------------------
  section("EP-01 health");
  const health = await call<{ status: string; db: string }>("/api/v1/health");
  check(
    "health returns 200 with db connected",
    health.status === 200 && health.data?.db === "connected",
    health.raw,
  );

  // --- Origin guard (T-13) -------------------------------------------------------------
  section("Origin guard");
  const noOrigin = await call("/api/v1/auth/login", {
    method: "POST",
    body: CREATOR,
    origin: null,
  });
  check(
    "mutation without Origin is rejected",
    noOrigin.status === 403 && noOrigin.error?.code === "INVALID_ORIGIN",
    noOrigin.raw,
  );
  const foreign = await call("/api/v1/auth/login", {
    method: "POST",
    body: CREATOR,
    origin: "http://evil.example",
  });
  check(
    "mutation with a foreign Origin is rejected",
    foreign.status === 403 && foreign.error?.code === "INVALID_ORIGIN",
    foreign.raw,
  );

  // --- EP-02..EP-05 auth --------------------------------------------------------------
  section("EP-02..EP-05 auth");
  const creator = session("creator");
  cleanupCreator = creator;
  const login = await call("/api/v1/auth/login", {
    method: "POST",
    body: CREATOR,
    session: creator,
  });
  check(
    "creator login returns 200 and sets the auth cookie",
    login.status === 200 && creator.cookies.has("wishly_token"),
    login.raw,
  );
  const me = await call<{ user: { email: string; role: string } }>("/api/v1/auth/me", {
    session: creator,
  });
  check(
    "auth/me returns the creator",
    me.status === 200 && me.data?.user?.email === CREATOR.email,
    me.raw,
  );
  check("auth/me never returns a password hash", !JSON.stringify(me.raw).includes("passwordHash"));
  const wrong = await call("/api/v1/auth/login", {
    method: "POST",
    body: { email: CREATOR.email, password: "wrong-password" },
  });
  check(
    "wrong password returns 401 INVALID_CREDENTIALS",
    wrong.status === 401 && wrong.error?.code === "INVALID_CREDENTIALS",
    wrong.raw,
  );
  const unknown = await call("/api/v1/auth/login", {
    method: "POST",
    body: { email: "nobody@example.com", password: "whatever" },
  });
  check(
    "unknown email returns the same 401 message",
    unknown.status === 401 && unknown.error?.message === wrong.error?.message,
    unknown.raw,
  );
  check("no cookie means 401 on /auth/me", (await call("/api/v1/auth/me")).status === 401);

  // --- EP-06 templates -----------------------------------------------------------------
  section("EP-06 templates");
  const templates = await call<{ items: { id: string; defaultPalette: { accent: string } }[] }>(
    "/api/v1/templates",
  );
  check(
    "three seeded templates are listed",
    templates.status === 200 && templates.data.items.length === 3,
    templates.data?.items?.map((t) => t.id),
  );

  // --- EP-07/EP-09/EP-10 drafts --------------------------------------------------------
  section("EP-07/EP-09/EP-10 drafts + sanitization + optimistic concurrency");
  const created = await call<{ id: string; rev: number; status: string }>("/api/v1/pages", {
    method: "POST",
    body: { occasion: "BIRTHDAY", recipient: { name: "Verify Riya" } },
    session: creator,
  });
  const pageId = created.data?.id;
  if (pageId) createdPageIds.add(pageId);
  check(
    "draft created with status DRAFT",
    created.status === 201 && created.data.status === "DRAFT" && !!pageId,
    created.raw,
  );
  if (!pageId) throw new Error("cannot continue without a draft");

  const patched = await call<{
    rev: number;
    messages: string[];
    slug: string | null;
    status: string;
  }>(`/api/v1/pages/${pageId}`, {
    method: "PATCH",
    session: creator,
    body: {
      rev: created.data.rev,
      messages: ["Hello <b>Riya</b>", "Second <script>alert(1)</script>line"],
      from: "Verifier",
      language: "HINGLISH",
      theme: { templateId: "neon-night" },
      occasionDate: new Date().toISOString(),
      draftStep: 3,
      status: "PUBLISHED",
      slug: "hack",
      ownerId: "64b7f0c2f1a2b3c4d5e6f7a8",
    },
  });
  check(
    "HTML is stripped from messages",
    patched.data?.messages?.[0] === "Hello Riya",
    patched.data?.messages,
  );
  check(
    "script content is removed",
    !JSON.stringify(patched.data?.messages).includes("script"),
    patched.data?.messages,
  );
  check(
    "client cannot set status or slug",
    patched.data?.status === "DRAFT" && patched.data?.slug === null,
    patched.raw?.data,
  );
  check("rev increments on PATCH", patched.data?.rev === created.data.rev + 1, patched.data?.rev);

  const stale = await call(`/api/v1/pages/${pageId}`, {
    method: "PATCH",
    session: creator,
    body: { rev: created.data.rev, from: "Stale writer" },
  });
  check(
    "stale rev returns 409 STALE_REVISION",
    stale.status === 409 && stale.error?.code === "STALE_REVISION",
    stale.raw,
  );

  const otherCreator = session("other");
  const otherEmail = `verify-${Date.now()}@example.com`;
  await call("/api/v1/auth/register", {
    method: "POST",
    session: otherCreator,
    body: { name: "Other User", email: otherEmail, password: "Verify1234" },
  });
  temporaryEmails.add(otherEmail);
  const foreignRead = await call(`/api/v1/pages/${pageId}`, { session: otherCreator });
  check("another creator cannot read the page (403)", foreignRead.status === 403, foreignRead.raw);
  check(
    "a malformed id returns 404",
    (await call("/api/v1/pages/abc", { session: creator })).status === 404,
  );

  // --- EP-11/EP-12 media ---------------------------------------------------------------
  section("EP-11/EP-12 media verification");
  const sign = await call<{ uploadUrl: string; folder: string; allowedFormats: string }>(
    "/api/v1/uploads/sign",
    {
      method: "POST",
      session: creator,
      body: { resourceType: "image" },
    },
  );
  check(
    "sign returns a Cloudinary upload URL and folder",
    sign.status === 200 && !!sign.data?.uploadUrl,
    sign.raw,
  );
  check(
    "sign never returns the API secret",
    !JSON.stringify(sign.raw).includes(process.env.CLOUDINARY_API_SECRET ?? "@@none@@"),
  );

  const owner = (await call<{ user: { id: string } }>("/api/v1/auth/me", { session: creator })).data
    .user.id;
  const uploaded = await uploadDemoImage(
    "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    `wishly/${owner}`,
    sign.data.allowedFormats,
  );
  uploadedPublicIds.add(uploaded.public_id);
  const registered = await call<{ media: { id: string; w: number; h: number }; rev: number }>(
    "/api/v1/media",
    {
      method: "POST",
      session: creator,
      body: { pageId, publicId: uploaded.public_id, resourceType: "image" },
    },
  );
  check(
    "media registered with server-verified dimensions",
    registered.status === 201 && registered.data?.media?.w > 0 && registered.data?.media?.h > 0,
    registered.raw,
  );
  const repeat = await call("/api/v1/media", {
    method: "POST",
    session: creator,
    body: { pageId, publicId: uploaded.public_id, resourceType: "image" },
  });
  check("re-registering the same asset is idempotent (200)", repeat.status === 200, repeat.raw);
  const foreignFolder = await call("/api/v1/media", {
    method: "POST",
    session: creator,
    body: { pageId, publicId: "someone-else/photo.jpg", resourceType: "image" },
  });
  check("a foreign publicId is rejected", foreignFolder.status === 403, foreignFolder.raw);

  // --- EP-14 publish ------------------------------------------------------------------
  section("EP-14 publish pipeline");
  const noPhotoDraft = await call<{ id: string; rev: number }>("/api/v1/pages", {
    method: "POST",
    session: creator,
    body: { occasion: "BIRTHDAY", recipient: { name: "No Photo" }, messages: ["hi"] },
  });
  if (noPhotoDraft.data?.id) createdPageIds.add(noPhotoDraft.data.id);
  const noPhotoPublish = await call(`/api/v1/pages/${noPhotoDraft.data.id}/publish`, {
    method: "POST",
    session: creator,
  });
  check(
    "publishing without a photo returns 400 'Add at least 1 photo'",
    noPhotoPublish.status === 400 && noPhotoPublish.error?.message === "Add at least 1 photo",
    noPhotoPublish.raw,
  );

  const published = await call<{
    slug: string;
    url: string;
    status: string;
    qrCode: string;
    ogImage: string;
    rev: number;
  }>(`/api/v1/pages/${pageId}/publish`, { method: "POST", session: creator });
  check(
    "publish returns a slug and url",
    published.status === 200 && /^[a-z0-9-]+-[a-z0-9]{4}$/.test(published.data.slug),
    published.raw?.data,
  );
  check(
    "publish returns a PNG data URL QR code",
    String(published.data?.qrCode).startsWith("data:image/png"),
    published.data?.qrCode?.slice(0, 30),
  );
  check(
    "publish returns an OG image URL",
    String(published.data?.ogImage).includes("/api/og/"),
    published.data?.ogImage,
  );
  const republished = await call<{ slug: string }>(`/api/v1/pages/${pageId}/publish`, {
    method: "POST",
    session: creator,
  });
  check(
    "publishing again keeps the same slug",
    republished.data?.slug === published.data.slug,
    republished.data?.slug,
  );

  // --- EP-18 public page --------------------------------------------------------------
  section("EP-18 public page + no-leak rules");
  const guest = newVisitorSession();
  const publicPage = await call<any>(`/api/v1/public/pages/${published.data.slug}`, {
    session: guest,
  });
  check(
    "open page returns locked:false with content",
    publicPage.status === 200 &&
      publicPage.data?.locked === false &&
      publicPage.data.messages.length > 0,
    publicPage.raw?.error,
  );
  const publicJson = JSON.stringify(publicPage.raw);
  check(
    "public payload has no ownerId/email",
    !publicJson.includes("ownerId") && !publicJson.includes("@demo.com"),
  );
  check("public payload has no passwordHash", !publicJson.includes("passwordHash"));
  check("public payload hides views when showViews is false", publicPage.data?.views === undefined);
  const missing = await call(`/api/v1/public/pages/definitely-not-a-real-slug`, { session: guest });
  check(
    "unknown slug returns 404 PAGE_NOT_FOUND",
    missing.status === 404 && missing.error?.code === "PAGE_NOT_FOUND",
    missing.raw,
  );

  // --- EP-20 view dedupe --------------------------------------------------------------
  section("EP-20 view counting");
  const firstView = await call<{ counted: boolean }>(
    `/api/v1/public/pages/${published.data.slug}/view`,
    { method: "POST", session: guest },
  );
  check("first view is counted", firstView.data?.counted === true, firstView.raw);
  const secondView = await call<{ counted: boolean }>(
    `/api/v1/public/pages/${published.data.slug}/view`,
    { method: "POST", session: guest },
  );
  check(
    "second view inside 30 minutes is not counted",
    secondView.data?.counted === false,
    secondView.raw,
  );
  const ownerView = await call<{ counted: boolean }>(
    `/api/v1/public/pages/${published.data.slug}/view`,
    { method: "POST", session: creator },
  );
  check("the owner preview is never counted", ownerView.data?.counted === false, ownerView.raw);
  const insights = await call<{
    totals: { views: number; uniqueViews: number };
    viewsByDay: { date: string; views: number }[];
  }>(`/api/v1/pages/${pageId}/insights`, { session: creator });
  check(
    "insights totals count exactly one view/one unique",
    insights.data?.totals?.views === 1 && insights.data?.totals?.uniqueViews === 1,
    insights.data?.totals,
  );
  check(
    "insights returns 30 days with zeros filled",
    insights.data?.viewsByDay?.length === 30,
    insights.data?.viewsByDay?.length,
  );

  // --- EP-21/EP-22/EP-24 wishes -------------------------------------------------------
  section("EP-21/EP-22/EP-24 wishes");
  const wishOne = await call<{ wish: { id: string } }>(
    `/api/v1/public/pages/${published.data.slug}/wishes`,
    {
      method: "POST",
      session: guest,
      body: { name: "Aarav", message: "Happy birthday <b>Riya</b>" },
    },
  );
  check("first wish accepted", wishOne.status === 201, wishOne.raw);
  check(
    "wish text is sanitized",
    wishOne.data?.wish && !JSON.stringify(wishOne.raw).includes("<b>"),
    wishOne.data?.wish,
  );
  for (let i = 2; i <= 3; i++) {
    await call(`/api/v1/public/pages/${published.data.slug}/wishes`, {
      method: "POST",
      session: guest,
      body: { name: `Friend ${i}`, message: `Wish number ${i}` },
    });
  }
  const fourth = await call(`/api/v1/public/pages/${published.data.slug}/wishes`, {
    method: "POST",
    session: guest,
    body: { name: "Fourth", message: "One too many" },
  });
  check("the 4th wish from one visitor returns 429", fourth.status === 429, fourth.raw);
  const listed = await call<{ items: unknown[] }>(
    `/api/v1/public/pages/${published.data.slug}/wishes`,
    { session: guest },
  );
  check(
    "wishes list returns the 3 posted wishes",
    listed.data?.items?.length === 3,
    listed.data?.items?.length,
  );
  check(
    "wishes list hides ipHash and visitorId",
    !JSON.stringify(listed.raw).includes("ipHash") &&
      !JSON.stringify(listed.raw).includes("visitorId"),
  );

  // --- EP-19 password page ------------------------------------------------------------
  section("EP-19 password gate + token invalidation");
  const pwdDraft = await call<{ id: string; rev: number }>("/api/v1/pages", {
    method: "POST",
    session: creator,
    body: {
      occasion: "FRIENDSHIP",
      recipient: { name: "Verify Sana" },
      messages: ["secret words"],
      theme: { templateId: "pastel-dream" },
      settings: { password: "friends123" },
    },
  });
  const pwdPageId = pwdDraft.data.id;
  if (pwdPageId) createdPageIds.add(pwdPageId);
  const pwdUpload = await uploadDemoImage(
    "https://res.cloudinary.com/demo/image/upload/cld-sample.jpg",
    `wishly/${owner}`,
    sign.data.allowedFormats,
  );
  uploadedPublicIds.add(pwdUpload.public_id);
  await call("/api/v1/media", {
    method: "POST",
    session: creator,
    body: { pageId: pwdPageId, publicId: pwdUpload.public_id, resourceType: "image" },
  });
  const pwdPublished = await call<{ slug: string }>(`/api/v1/pages/${pwdPageId}/publish`, {
    method: "POST",
    session: creator,
  });
  const pwdSlug = pwdPublished.data?.slug;
  const lockedGuest = newVisitorSession();
  const locked = await call<any>(`/api/v1/public/pages/${pwdSlug}`, { session: lockedGuest });
  check(
    "password page returns a locked PASSWORD payload",
    locked.data?.locked === true && locked.data?.reason === "PASSWORD",
    locked.raw,
  );
  check(
    "locked payload contains only the first name",
    Object.keys(locked.data ?? {})
      .sort()
      .join(",") === "locked,reason,recipientFirstName",
    Object.keys(locked.data ?? {}),
  );
  const wrongUnlock = await call(`/api/v1/public/pages/${pwdSlug}/unlock`, {
    method: "POST",
    session: lockedGuest,
    body: { password: "nope" },
  });
  check(
    "wrong password returns 401 WRONG_PASSWORD",
    wrongUnlock.status === 401 && wrongUnlock.error?.code === "WRONG_PASSWORD",
    wrongUnlock.raw,
  );
  const goodUnlock = await call(`/api/v1/public/pages/${pwdSlug}/unlock`, {
    method: "POST",
    session: lockedGuest,
    body: { password: "friends123" },
  });
  check(
    "correct password unlocks and sets a view cookie",
    goodUnlock.status === 200 && lockedGuest.cookies.size > 0,
    goodUnlock.raw,
  );
  const afterUnlock = await call<any>(`/api/v1/public/pages/${pwdSlug}`, { session: lockedGuest });
  check(
    "unlocked page returns its content",
    afterUnlock.data?.locked === false && afterUnlock.data.messages[0] === "secret words",
    afterUnlock.raw?.error,
  );

  const revNow = (await call<{ rev: number }>(`/api/v1/pages/${pwdPageId}`, { session: creator }))
    .data.rev;
  await call(`/api/v1/pages/${pwdPageId}`, {
    method: "PATCH",
    session: creator,
    body: { rev: revNow, settings: { password: "newpassword1" } },
  });
  const afterChange = await call<any>(`/api/v1/public/pages/${pwdSlug}`, { session: lockedGuest });
  check(
    "changing the password invalidates the old unlock token",
    afterChange.data?.locked === true && afterChange.data?.reason === "PASSWORD",
    afterChange.raw,
  );

  // --- Scheduled page (rule 6) --------------------------------------------------------
  section("Scheduled page never leaks content");
  const schedDraft = await call<{ id: string }>("/api/v1/pages", {
    method: "POST",
    session: creator,
    body: {
      occasion: "FAREWELL",
      recipient: { name: "Verify Dev" },
      messages: ["not yet"],
      theme: { templateId: "royal-gold" },
      revealAt: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    },
  });
  if (schedDraft.data?.id) createdPageIds.add(schedDraft.data.id);
  const schedUpload = await uploadDemoImage(
    "https://res.cloudinary.com/demo/image/upload/cld-sample-2.jpg",
    `wishly/${owner}`,
    sign.data.allowedFormats,
  );
  uploadedPublicIds.add(schedUpload.public_id);
  await call("/api/v1/media", {
    method: "POST",
    session: creator,
    body: { pageId: schedDraft.data.id, publicId: schedUpload.public_id, resourceType: "image" },
  });
  const schedPublished = await call<{ slug: string; status: string }>(
    `/api/v1/pages/${schedDraft.data.id}/publish`,
    {
      method: "POST",
      session: creator,
    },
  );
  check(
    "future revealAt publishes as SCHEDULED",
    schedPublished.data?.status === "SCHEDULED",
    schedPublished.data,
  );
  const schedGuest = newVisitorSession();
  const schedPublic = await call<any>(`/api/v1/public/pages/${schedPublished.data.slug}`, {
    session: schedGuest,
  });
  check(
    "scheduled page returns only locked/reason/firstName/revealAt",
    JSON.stringify(Object.keys(schedPublic.data ?? {}).sort()) ===
      JSON.stringify(["locked", "reason", "recipientFirstName", "revealAt"]),
    Object.keys(schedPublic.data ?? {}),
  );
  const ogLocked = await fetch(`${BASE}/api/og/${schedPublished.data.slug}`);
  check(
    "OG image for a scheduled page still renders (200)",
    ogLocked.status === 200 && ogLocked.headers.get("content-type") === "image/png",
    ogLocked.status,
  );

  // --- Admin (EP-26..EP-33) -----------------------------------------------------------
  section("EP-26..EP-33 admin");
  const admin = session("admin");
  const adminLogin = await call("/api/v1/auth/login", {
    method: "POST",
    session: admin,
    body: { email: "admin@demo.com", password: "Admin@123" },
  });
  check("seeded admin can log in", adminLogin.status === 200, adminLogin.raw);
  check(
    "admin stats return counters",
    (await call<{ pages: number }>("/api/v1/admin/stats", { session: admin })).status === 200,
  );
  check(
    "creator is refused on /admin/stats (403)",
    (await call("/api/v1/admin/stats", { session: creator })).status === 403,
  );
  check(
    "anonymous is refused on /admin/stats (401)",
    (await call("/api/v1/admin/stats")).status === 401,
  );
  const adminPages = await call<{ items: { ownerEmail?: string }[] }>(
    "/api/v1/admin/pages?limit=5",
    { session: admin },
  );
  check(
    "admin pages list includes owner emails",
    adminPages.status === 200 && !!adminPages.data.items[0]?.ownerEmail,
    adminPages.data?.items?.[0],
  );
  check(
    "admin users list works",
    (await call("/api/v1/admin/users?limit=5", { session: admin })).status === 200,
  );
  check(
    "admin wishes list works",
    (await call("/api/v1/admin/wishes?limit=5", { session: admin })).status === 200,
  );
  check(
    "admin cannot deactivate themselves",
    (
      await call(
        `/api/v1/admin/users/${(await call<{ user: { id: string } }>("/api/v1/auth/me", { session: admin })).data.user.id}`,
        { method: "PATCH", session: admin, body: { isActive: false } },
      )
    ).status === 400,
  );

  const disabled = await call(`/api/v1/admin/pages/${pageId}`, {
    method: "PATCH",
    session: admin,
    body: { action: "disable" },
  });
  check("admin can disable a page", disabled.status === 200, disabled.raw);
  const disabledPublic = await call(`/api/v1/public/pages/${published.data.slug}`, {
    session: guest,
  });
  check(
    "disabled page returns 403 PAGE_UNAVAILABLE",
    disabledPublic.status === 403 && disabledPublic.error?.code === "PAGE_UNAVAILABLE",
    disabledPublic.raw,
  );
  const enabled = await call(`/api/v1/admin/pages/${pageId}`, {
    method: "PATCH",
    session: admin,
    body: { action: "enable" },
  });
  check("admin can enable it again", enabled.status === 200, enabled.raw);
  const restored = await call<any>(`/api/v1/public/pages/${published.data.slug}`, {
    session: guest,
  });
  check("enabled page is public again", restored.data?.locked === false, restored.raw?.error);

  // --- EP-15/EP-16/EP-17 dashboard API ------------------------------------------------
  section("EP-15/EP-16/EP-17 dashboard API");
  const mine = await call<{ items: unknown[]; total: number }>("/api/v1/pages/mine?limit=5", {
    session: creator,
  });
  check(
    "pages/mine returns paginated cards",
    mine.status === 200 && Array.isArray(mine.data.items) && typeof mine.data.total === "number",
    mine.raw?.data,
  );
  const duplicated = await call<{ id: string; slug: string | null; stats: { views: number } }>(
    `/api/v1/pages/${pageId}/duplicate`,
    {
      method: "POST",
      session: creator,
    },
  );
  if (duplicated.data?.id) createdPageIds.add(duplicated.data.id);
  check(
    "duplicate creates a slug-less draft with zero stats",
    duplicated.status === 201 && duplicated.data.slug === null && duplicated.data.stats.views === 0,
    duplicated.raw?.data,
  );
  const unpublished = await call<{ status: string }>(`/api/v1/pages/${pageId}/unpublish`, {
    method: "POST",
    session: creator,
  });
  check(
    "unpublish sets UNPUBLISHED",
    unpublished.status === 200 && unpublished.data.status === "UNPUBLISHED",
    unpublished.raw?.data,
  );
  const unpublishedPublic = await call(`/api/v1/public/pages/${published.data.slug}`, {
    session: guest,
  });
  check(
    "unpublished page is unavailable to strangers",
    unpublishedPublic.status === 403,
    unpublishedPublic.raw,
  );

  // --- Cleanup ------------------------------------------------------------------------
  section("cleanup");
  for (const id of createdPageIds) {
    const removed = await call(`/api/v1/pages/${id}`, { method: "DELETE", session: creator });
    check(`deleted page ${id}`, removed.status === 200, removed.raw);
    if (removed.status === 200) createdPageIds.delete(id);
  }
  console.log("\nCloudinary assets were removed by the delete route (destroyAssets).");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((err) => {
    console.error("\nVerification crashed:", err?.name, "-", err?.message);
    let cause = err?.cause;
    while (cause) {
      console.error("  caused by:", cause?.code ?? cause?.name, "-", cause?.message);
      cause = cause?.cause;
    }
    failed += 1;
  })
  .finally(async () => {
    await cleanup();
    if (failed > 0) process.exitCode = 1;
  });
