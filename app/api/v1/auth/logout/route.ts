// EP-04 POST /auth/logout - clears the auth cookie.
import { NextResponse } from "next/server";
import { ok, route } from "@/lib/api";
import { clearAuthCookie } from "@/lib/auth";

export const runtime = "nodejs";

export const POST = route(async () => {
  const res = ok({ loggedOut: true });
  clearAuthCookie(res as NextResponse);
  return res;
});
