import { beforeEach, describe, expect, it, vi } from "vitest";

// The limiter is the non-obvious piece the viva asks about: one atomic upsert per check,
// fail closed for auth/unlock and fail open for public reads.
vi.mock("@/lib/db", () => ({ connectDB: vi.fn(async () => undefined) }));
vi.mock("@/models/RateLimit", () => ({
  RateLimit: { findOneAndUpdate: vi.fn() },
}));

import { RateLimit } from "@/models/RateLimit";
import { getClientIp, hashIp, rateLimit } from "@/lib/rate-limit";

const findOneAndUpdate = RateLimit.findOneAndUpdate as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  findOneAndUpdate.mockReset();
  process.env.IP_HASH_SECRET = "test-secret";
});

describe("rateLimit", () => {
  it("allows requests at or below the limit and reports the remaining budget", async () => {
    findOneAndUpdate.mockResolvedValue({ count: 3 });
    const result = await rateLimit({ key: "auth:login:abc", limit: 5, windowSec: 900 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("blocks the request above the limit", async () => {
    findOneAndUpdate.mockResolvedValue({ count: 6 });
    const result = await rateLimit({ key: "auth:login:abc", limit: 5, windowSec: 900 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("fails closed by default when the database errors", async () => {
    findOneAndUpdate.mockRejectedValue(new Error("db down"));
    const result = await rateLimit({ key: "unlock:abc", limit: 5, windowSec: 600 });
    expect(result.allowed).toBe(false);
  });

  it("fails open for public reads when the database errors", async () => {
    findOneAndUpdate.mockRejectedValue(new Error("db down"));
    const result = await rateLimit({
      key: "public:read:abc",
      limit: 120,
      windowSec: 60,
      failOpen: true,
    });
    expect(result.allowed).toBe(true);
  });

  it("retries exactly once after a concurrent upsert duplicate-key race", async () => {
    const duplicate = Object.assign(new Error("E11000"), { code: 11000 });
    findOneAndUpdate.mockRejectedValueOnce(duplicate).mockResolvedValueOnce({ count: 2 });
    const result = await rateLimit({ key: "auth:register:abc", limit: 5, windowSec: 3600 });
    expect(result.allowed).toBe(true);
    expect(findOneAndUpdate).toHaveBeenCalledTimes(2);
  });
});

describe("ip helpers", () => {
  it("reads only the first forwarded address", () => {
    const req = {
      headers: {
        get: (name: string) => (name === "x-forwarded-for" ? "203.0.113.9, 10.0.0.1" : null),
      },
    } as never;
    expect(getClientIp(req)).toBe("203.0.113.9");
  });

  it("never returns the raw ip", () => {
    const hashed = hashIp("203.0.113.9");
    expect(hashed).toHaveLength(64);
    expect(hashed).not.toContain("203.0.113.9");
    expect(hashIp("203.0.113.9")).toBe(hashed);
  });
});
