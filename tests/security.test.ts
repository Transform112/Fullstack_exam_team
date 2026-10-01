import { beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { route, ok } from "@/lib/api";
import { signAuthToken, signViewToken, verifyViewToken, viewCookieOptions } from "@/lib/auth";

const UNLOCK_SECRET = "test-unlock-secret";
const AUTH_SECRET = "test-auth-secret";

beforeEach(() => {
  process.env.UNLOCK_JWT_SECRET = UNLOCK_SECRET;
  process.env.JWT_SECRET = AUTH_SECRET;
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  delete process.env.ALLOWED_ORIGINS;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  delete process.env.VERCEL_URL;
});

const PAGE_ID = "64b7f0c2f1a2b3c4d5e6f7a8";

// T-09: the unlock token is bound to the page and its revision, so editing the page or
// changing the password invalidates every token that was handed out before.
describe("password-page view tokens", () => {
  it("accepts a token for the same page and revision", () => {
    const token = signViewToken(PAGE_ID, 3);
    expect(verifyViewToken(token, PAGE_ID, 3)).toBe(true);
  });

  it("rejects a token after the page revision changes", () => {
    const token = signViewToken(PAGE_ID, 3);
    expect(verifyViewToken(token, PAGE_ID, 4)).toBe(false);
  });

  it("rejects a token issued for another page", () => {
    const token = signViewToken(PAGE_ID, 3);
    const otherPage = "64b7f0c2f1a2b3c4d5e6f7ff";
    expect(verifyViewToken(token, otherPage, 3)).toBe(false);
  });

  it("rejects a missing, malformed or wrongly signed token", () => {
    expect(verifyViewToken(undefined, PAGE_ID, 3)).toBe(false);
    expect(verifyViewToken("not-a-jwt", PAGE_ID, 3)).toBe(false);
    const wrongSecret = jwt.sign({ pid: PAGE_ID, rev: 3, purpose: "view" }, "attacker", {
      algorithm: "HS256",
    });
    expect(verifyViewToken(wrongSecret, PAGE_ID, 3)).toBe(false);
  });

  it("rejects an expired token", () => {
    const expired = jwt.sign({ pid: PAGE_ID, rev: 1, purpose: "view" }, UNLOCK_SECRET, {
      algorithm: "HS256",
      expiresIn: -10,
    });
    expect(verifyViewToken(expired, PAGE_ID, 1)).toBe(false);
  });

  it("rejects a token with the wrong purpose", () => {
    const wrongPurpose = jwt.sign({ pid: PAGE_ID, rev: 1, purpose: "deploy" }, UNLOCK_SECRET, {
      algorithm: "HS256",
      expiresIn: "2h",
    });
    expect(verifyViewToken(wrongPurpose, PAGE_ID, 1)).toBe(false);
  });

  it("sets the unlock cookie httpOnly, SameSite=Lax, path=/ for 2 hours", () => {
    expect(viewCookieOptions).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7200,
    });
  });
});

describe("auth tokens", () => {
  it("carries the subject and role and verifies with the same secret", () => {
    const token = signAuthToken(PAGE_ID, "ADMIN");
    const payload = jwt.verify(token, AUTH_SECRET) as { sub: string; role: string };
    expect(payload.sub).toBe(PAGE_ID);
    expect(payload.role).toBe("ADMIN");
  });

  it("is signed with HS256 and cannot be verified with another secret", () => {
    const token = signAuthToken(PAGE_ID, "USER");
    expect((jwt.decode(token, { complete: true }) as { header: { alg: string } }).header.alg).toBe(
      "HS256",
    );
    expect(() => jwt.verify(token, "wrong")).toThrow();
  });

  it("honours JWT_EXPIRES_IN", () => {
    process.env.JWT_EXPIRES_IN = "1h";
    const token = signAuthToken(PAGE_ID, "USER");
    const payload = jwt.decode(token) as { exp: number; iat: number };
    expect(payload.exp - payload.iat).toBe(3600);
    delete process.env.JWT_EXPIRES_IN;
  });
});

// T-13: CSRF protection. A missing, "null" or foreign Origin must never reach the handler.
describe("route() origin guard", () => {
  const handler = route(async () => ok({ reached: true }));

  // The exported wrapper is declared with two parameters so Next.js can validate it, so the
  // test supplies the (empty) route params itself.
  const run = (req: NextRequest) => handler(req, { params: Promise.resolve({}) });

  const post = (origin?: string | null) => {
    const headers = new Headers({ "Content-Type": "application/json" });
    if (origin !== undefined && origin !== null) headers.set("origin", origin);
    return new NextRequest("http://localhost:3000/api/v1/pages", { method: "POST", headers });
  };

  it("rejects a POST with no Origin header", async () => {
    const res = await run(post());
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error.code).toBe("INVALID_ORIGIN");
  });

  it("rejects a POST with a null Origin", async () => {
    const res = await run(post("null"));
    expect(res.status).toBe(403);
  });

  it("rejects a POST from a foreign origin", async () => {
    const res = await run(post("http://evil.example"));
    expect(res.status).toBe(403);
  });

  it("allows a same-origin POST and attaches a request id", async () => {
    const res = await run(post("http://localhost:3000"));
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Request-Id")).toBeTruthy();
  });

  it("accepts the loopback spelling of the app origin", async () => {
    const res = await run(post("http://127.0.0.1:3000"));
    expect(res.status).toBe(200);
  });

  it("does not apply the guard to GET", async () => {
    const res = await run(new NextRequest("http://localhost:3000/api/v1/pages", { method: "GET" }));
    expect(res.status).toBe(200);
  });

  it("allows an extra origin listed in ALLOWED_ORIGINS", async () => {
    process.env.ALLOWED_ORIGINS = "http://192.168.1.20:3000, http://localhost:4000";
    expect((await run(post("http://192.168.1.20:3000"))).status).toBe(200);
    expect((await run(post("http://localhost:4000"))).status).toBe(200);
    expect((await run(post("http://192.168.1.21:3000"))).status).toBe(403);
  });

  it("allows the exact Vercel production hostname", async () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "fullstack-exam-team.vercel.app";
    expect((await run(post("https://fullstack-exam-team.vercel.app"))).status).toBe(200);
  });

  it("allows this Vercel deployment hostname without accepting suffix lookalikes", async () => {
    process.env.VERCEL_URL = "fullstack-exam-team-abc123.vercel.app";
    expect((await run(post("https://fullstack-exam-team-abc123.vercel.app"))).status).toBe(200);
    expect(
      (await run(post("https://fullstack-exam-team-abc123.vercel.app.attacker.test"))).status,
    ).toBe(403);
  });
});
