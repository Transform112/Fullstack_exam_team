import { NextRequest, NextResponse } from "next/server";
import { ZodError, ZodTypeAny, z } from "zod";
import { AppError, Errors } from "./errors";
import { logger, newRequestId, redactSecrets } from "./logger";

// Standard success envelope.
export function ok<T>(data: T, message?: string, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(
    { success: true, data, ...(message ? { message } : {}) },
    { status, headers },
  );
}

export const created = <T>(data: T, message?: string, headers?: Record<string, string>) =>
  ok(data, message, 201, headers);

// Standard failure envelope.
export function fail(
  status: number,
  code: string,
  message: string,
  details?: unknown[],
  headers?: Record<string, string>,
) {
  return NextResponse.json(
    { success: false, error: { code, message, ...(details ? { details } : {}) } },
    { status, headers },
  );
}

// Converts any thrown error into the standard JSON error shape. Never leaks stack traces.
export function errorResponse(err: unknown, requestId = newRequestId()) {
  const headers = { "X-Request-Id": requestId };

  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join("."), issue: i.message }));
    return fail(
      400,
      "VALIDATION_ERROR",
      err.issues[0]?.message ?? "Invalid input",
      details,
      headers,
    );
  }
  if (err instanceof AppError) {
    if (err.status >= 500)
      logger.error({ requestId, code: err.code, err: redactSecrets(err.message) });
    return fail(err.status, err.code, err.message, err.details, headers);
  }

  const e = err as { code?: number | string; name?: string; message?: string };
  if (e?.code === 11000)
    return fail(409, "CONFLICT", "That value already exists.", undefined, headers);
  if (e?.name === "JsonWebTokenError" || e?.name === "TokenExpiredError") {
    return fail(401, "UNAUTHENTICATED", "Please log in to continue.", undefined, headers);
  }
  if (
    e?.code === "ECONNREFUSED" ||
    e?.name === "MongooseServerSelectionError" ||
    e?.name === "MongoServerSelectionError"
  ) {
    logger.error({ requestId, err: redactSecrets(e?.message ?? "database unavailable") });
    return fail(
      503,
      "DATABASE_UNAVAILABLE",
      "The service is temporarily unavailable.",
      undefined,
      headers,
    );
  }

  logger.error({ requestId, err: e?.message ?? String(err), name: e?.name });
  return fail(500, "INTERNAL_ERROR", "Something went wrong. Please try again.", undefined, headers);
}

const MUTATING = new Set(["POST", "PATCH", "PUT", "DELETE"]);

// Every origin allowed to call a mutating endpoint: the app URL plus any extra origins
// listed in ALLOWED_ORIGINS (comma separated), for example a LAN or preview URL.
function allowedOrigins() {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const extra = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return new Set([
    appUrl,
    appUrl.replace("localhost", "127.0.0.1"),
    appUrl.replace("127.0.0.1", "localhost"),
    ...extra,
  ]);
}

// Same-origin check for state-changing requests. CORS alone is not CSRF protection,
// so a missing, "null" or foreign Origin is rejected with 403 INVALID_ORIGIN.
function assertSameOrigin(req: NextRequest) {
  if (!MUTATING.has(req.method)) return;
  const origin = req.headers.get("origin");
  if (!origin || origin === "null")
    throw new AppError(403, "INVALID_ORIGIN", "Request origin is not allowed.");
  if (!allowedOrigins().has(origin.replace(/\/$/, ""))) {
    throw new AppError(403, "INVALID_ORIGIN", "Request origin is not allowed.");
  }
}

// Wraps every route handler: awaits params, enforces the Origin guard on mutations,
// attaches a request id and routes all errors through errorResponse.
// Next.js validates the exported handler's second parameter against its generated route
// types, so `ctx` is declared (not optional) and guarded at runtime.
export function route<P = Record<string, string>>(
  handler: (req: NextRequest, ctx: { params: P; requestId: string }) => Promise<Response>,
) {
  return async (req: NextRequest, ctx: { params: Promise<P> }) => {
    const requestId = newRequestId();
    try {
      assertSameOrigin(req);
      const params = ctx?.params ? await ctx.params : ({} as P);
      const res = await handler(req, { params, requestId });
      res.headers.set("X-Request-Id", requestId);
      return res;
    } catch (err) {
      return errorResponse(err, requestId);
    }
  };
}

// Reads JSON from the request and validates it with a zod schema.
export async function parseBody<S extends ZodTypeAny>(
  req: NextRequest,
  schema: S,
): Promise<z.infer<S>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw Errors.validation("Request body must be valid JSON.");
  }
  return schema.parse(body);
}

// Validates the query string with a zod schema (used by admin search/filter routes).
export function parseQuery<S extends ZodTypeAny>(req: NextRequest, schema: S): z.infer<S> {
  const raw: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  return schema.parse(raw);
}

// Standard list query: page, limit (capped at 50), sort, search.
export function parseListQuery(
  req: NextRequest,
  allowedSort: string[],
  defaultSort = "-createdAt",
) {
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

// Public page payloads, HTML and OG responses must never be cached in version 1.
export function noStore(headers: Record<string, string> = {}) {
  return { ...headers, "Cache-Control": "private, no-store, max-age=0" };
}

// Response headers carrying the limiter state for a limited route.
export function rateHeaders(rl: { remaining: number }, extra: Record<string, string> = {}) {
  return { ...extra, "X-RateLimit-Remaining": String(rl.remaining) };
}

// Standard 429 response with Retry-After, used when a limiter blocks a request.
export function rateLimitedResponse(retryAfter: number, requestId?: string) {
  return fail(429, "RATE_LIMITED", "Too many requests. Please try again later.", undefined, {
    "Retry-After": String(retryAfter),
    ...(requestId ? { "X-Request-Id": requestId } : {}),
  });
}
