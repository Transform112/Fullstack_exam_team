// EP-19 POST /public/pages/:slug/unlock - sets the short-lived, revision-bound view cookie.
import { NextRequest, NextResponse } from "next/server";
import { ok, parseBody, route } from "@/lib/api";
import { blocked, limitIp } from "@/lib/limits";
import { connectDB } from "@/lib/db";
import { unlockSchema } from "@/lib/validators";
import { unlockPage } from "@/services/public-access";
import { viewCookieName, viewCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { slug: string };

export const POST = route<Params>(async (req: NextRequest, ctx) => {
  const rl = await limitIp(req, "unlock", ctx.params.slug);
  if (!rl.allowed) return blocked(rl);

  const body = await parseBody(req, unlockSchema);
  await connectDB();
  const result = await unlockPage(ctx.params.slug, body.password);

  const res = ok({ unlocked: true }) as NextResponse;
  res.cookies.set(viewCookieName(result.pageId), result.token, viewCookieOptions);
  return res;
});
