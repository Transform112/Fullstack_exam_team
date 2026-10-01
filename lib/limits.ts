// Named rate-limit buckets (docs/02 SECTION 9 table) and the helpers the route
// handlers use to apply them. Keys are hashed: no raw IP is ever stored or logged.
import { NextRequest } from "next/server";
import { getClientIp, hashIp, rateLimit } from "./rate-limit";
import { rateLimitedResponse } from "./api";

export type LimitName =
  | "auth:register"
  | "auth:login"
  | "unlock"
  | "public:read"
  | "view"
  | "wish:page"
  | "wish:ip"
  | "upload:sign"
  | "publish"
  | "ai";

type Bucket = { windowSec: number; limit: number; failOpen?: boolean };

export const BUCKETS: Record<LimitName, Bucket> = {
  "auth:register": { windowSec: 3600, limit: 5 },
  "auth:login": { windowSec: 900, limit: 5 },
  unlock: { windowSec: 600, limit: 5 },
  "public:read": { windowSec: 60, limit: 120, failOpen: true },
  view: { windowSec: 60, limit: 60, failOpen: true },
  "wish:page": { windowSec: 3600, limit: 3 },
  "wish:ip": { windowSec: 3600, limit: 20 },
  "upload:sign": { windowSec: 3600, limit: 30 },
  publish: { windowSec: 3600, limit: 10 },
  ai: { windowSec: 3600, limit: 10 },
};

export type LimitResult = { allowed: boolean; remaining: number; retryAfter: number };

// Bucket keyed by the hashed client IP, optionally scoped by a second identifier.
export async function limitIp(
  req: NextRequest,
  name: LimitName,
  extra?: string,
): Promise<LimitResult> {
  const bucket = BUCKETS[name];
  const ipKey = hashIp(getClientIp(req));
  return rateLimit({
    key: `${name}:${ipKey}${extra ? `:${extra}` : ""}`,
    limit: bucket.limit,
    windowSec: bucket.windowSec,
    failOpen: bucket.failOpen,
  });
}

// Bucket keyed by a signed-in user (uploads, publish, AI).
export async function limitUser(name: LimitName, userId: string): Promise<LimitResult> {
  const bucket = BUCKETS[name];
  return rateLimit({
    key: `${name}:user:${userId}`,
    limit: bucket.limit,
    windowSec: bucket.windowSec,
    failOpen: bucket.failOpen,
  });
}

// Bucket keyed by an anonymous identifier such as the visitor cookie.
export async function limitKey(name: LimitName, key: string): Promise<LimitResult> {
  const bucket = BUCKETS[name];
  return rateLimit({
    key: `${name}:${key}`,
    limit: bucket.limit,
    windowSec: bucket.windowSec,
    failOpen: bucket.failOpen,
  });
}

// The standard 429 response for a blocked request.
export function blocked(rl: LimitResult) {
  return rateLimitedResponse(rl.retryAfter);
}
