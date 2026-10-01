import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

export const VISITOR_COOKIE = "wishly_vid";

// Returns the visitor id from the cookie, or a new id plus a flag so the caller can
// set the cookie on the response.
export function getVisitorId(req: NextRequest) {
  const existing = req.cookies.get(VISITOR_COOKIE)?.value;
  if (existing) return { id: existing, isNew: false };
  return { id: nanoid(16), isNew: true };
}

export function setVisitorCookie(res: NextResponse, id: string) {
  res.cookies.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
