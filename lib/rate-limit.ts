import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { connectDB } from "./db";
import { RateLimit } from "@/models/RateLimit";

// Fixed-window rate limiter backed by MongoDB. No Redis: one atomic upsert per check
// (docs/02 SECTION 5). failOpen true keeps public reads alive if the limiter breaks;
// fail closed (the default) rejects when the limiter itself errors.
export async function rateLimit(opts: {
  key: string;
  limit: number;
  windowSec: number;
  failOpen?: boolean;
}) {
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
        {
          $inc: { count: 1 },
          $setOnInsert: { expiresAt: new Date((bucket + 1) * windowMs + 60_000) },
        },
        { upsert: true, new: true },
      );
    } catch (err) {
      // Concurrent upsert race: one retry against the now-existing document.
      if ((err as { code?: number }).code !== 11000) throw err;
      doc = await RateLimit.findOneAndUpdate({ key }, { $inc: { count: 1 } }, { new: true });
    }
    if (!doc) throw new Error("Rate limit counter missing");
    return {
      allowed: doc.count <= opts.limit,
      remaining: Math.max(0, opts.limit - doc.count),
      retryAfter,
    };
  } catch {
    return { allowed: opts.failOpen === true, remaining: 0, retryAfter };
  }
}

// First entry of x-forwarded-for, which the deployment proxy (Vercel) sets.
export function getClientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

// Never store or log a raw IP: only sha256(ip + IP_HASH_SECRET).
export function hashIp(ip: string) {
  const ipSecret = process.env.IP_HASH_SECRET;
  if (!ipSecret) throw new Error("IP_HASH_SECRET is not set");
  return createHash("sha256")
    .update(ip + ipSecret)
    .digest("hex");
}
