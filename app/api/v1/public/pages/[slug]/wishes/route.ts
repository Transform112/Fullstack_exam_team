// EP-21 GET and EP-22 POST /public/pages/:slug/wishes
import { NextRequest } from "next/server";
import { created, errorResponse, ok, parseBody, route } from "@/lib/api";
import { blocked, limitIp, limitKey } from "@/lib/limits";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { hashIp } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/rate-limit";
import { getVisitorId, setVisitorCookie } from "@/lib/visitor";
import { wishSchema } from "@/lib/validators";
import { createWish, listPublicWishes } from "@/services/wishes";
import { findPageBySlug } from "@/services/public-access";
import { viewCookieName } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { slug: string };

export const GET = route<Params>(async (req: NextRequest, ctx) => {
  const rl = await limitIp(req, "public:read");
  if (!rl.allowed) return blocked(rl);

  await connectDB();
  const user = await getCurrentUser();
  const page = await findPageBySlug(ctx.params.slug);
  const token = req.cookies.get(viewCookieName(String(page._id)))?.value;
  const items = await listPublicWishes(page, user, token);
  return ok({ items });
});

export const POST = route<Params>(async (req: NextRequest, ctx) => {
  // The visitor cookie is created before any validation or limit check so a rejected
  // attempt still has a stable key. The IP bucket applies even when cookies are reset.
  const { id: visitorId, isNew } = getVisitorId(req);
  const finish = (res: Response) => {
    if (isNew) setVisitorCookie(res as never, visitorId);
    return res;
  };

  try {
    const body = await parseBody(req, wishSchema);
    const perVisitor = await limitKey("wish:page", `${ctx.params.slug}:${visitorId}`);
    if (!perVisitor.allowed) return finish(blocked(perVisitor));
    const perIp = await limitIp(req, "wish:ip");
    if (!perIp.allowed) return finish(blocked(perIp));

    await connectDB();
    const user = await getCurrentUser();
    const page = await findPageBySlug(ctx.params.slug);
    const token = req.cookies.get(viewCookieName(String(page._id)))?.value;
    const wish = await createWish(page, body, user, visitorId, hashIp(getClientIp(req)), token);
    return finish(created({ wish }));
  } catch (err) {
    return finish(errorResponse(err, ctx.requestId));
  }
});
