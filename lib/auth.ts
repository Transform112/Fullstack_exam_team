import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { connectDB } from "./db";
import { Errors } from "./errors";
import { User, type UserLean } from "@/models/User";

export const AUTH_COOKIE = "wishly_token";

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
};

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

// Token lifetime comes from JWT_EXPIRES_IN when set, otherwise the documented 7 days.
export function signAuthToken(userId: string, role: string) {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ sub: userId, role }, secret(), {
    algorithm: "HS256",
    expiresIn,
  } as jwt.SignOptions);
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

// Returns the logged-in user (re-read from the database so role and isActive are
// always current) or null when there is no valid session.
export async function getCurrentUser(): Promise<UserLean | null> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return null;
  let payload: { sub: string };
  try {
    payload = jwt.verify(token, secret(), { algorithms: ["HS256"] }) as { sub: string };
  } catch (err) {
    if (
      err instanceof jwt.JsonWebTokenError ||
      err instanceof jwt.TokenExpiredError ||
      err instanceof jwt.NotBeforeError
    ) {
      return null;
    }
    throw err;
  }
  if (!payload.sub || !/^[a-fA-F0-9]{24}$/.test(payload.sub)) return null;
  await connectDB();
  const user = await User.findById(payload.sub).lean();
  if (!user || !user.isActive) return null;
  return user;
}

export async function requireUser(): Promise<UserLean> {
  const user = await getCurrentUser();
  if (!user) throw Errors.unauthenticated();
  return user;
}

export async function requireAdmin(): Promise<UserLean> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw Errors.forbidden();
  return user;
}

// View token for password-protected pages. Stored in the cookie wishly_view_<pageId>.
// It carries the page revision, so any content or password change invalidates it.
export function signViewToken(pageId: string, rev: number) {
  const unlockSecret = process.env.UNLOCK_JWT_SECRET;
  if (!unlockSecret) throw new Error("UNLOCK_JWT_SECRET is not set");
  return jwt.sign({ pid: pageId, rev, purpose: "view" }, unlockSecret, {
    algorithm: "HS256",
    expiresIn: "2h",
  });
}

export function verifyViewToken(token: string | undefined, pageId: string, rev: number) {
  if (!token) return false;
  try {
    const unlockSecret = process.env.UNLOCK_JWT_SECRET;
    if (!unlockSecret) return false;
    const p = jwt.verify(token, unlockSecret, { algorithms: ["HS256"] }) as {
      pid?: string;
      rev?: number;
      purpose?: string;
    };
    return p.purpose === "view" && p.pid === pageId && p.rev === rev;
  } catch {
    return false;
  }
}

export const viewCookieName = (pageId: string) => `wishly_view_${pageId}`;

// Cookie options shared by the unlock cookie.
export const viewCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 7200,
};
