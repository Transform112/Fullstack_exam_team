// EP-20 POST /public/pages/:slug/view - deduped view counting. The visitor cookie is
// set on every resulting response, including failures, so rejected attempts keep a key.
import { NextRequest } from "next/server";
import { errorResponse, ok, route } from "@/lib/api";
import { blocked, limitIp } from "@/lib/limits";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getVisitorId, setVisitorCookie } from "@/lib/visitor";
import { recordView } from "@/services/public-access";
import { Page, type PageLean } from "@/models/Page";
import { viewCookieName } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { slug: string };

export const POST = route<Params>(async (req: NextRequest, ctx) => {
  const { id: visitorId, isNew } = getVisitorId(req);

  const finish = (res: Response) => {
    if (isNew) setVisitorCookie(res as never, visitorId);
    return res;
  };

  try {
    const rl = await limitIp(req, "view");
    if (!rl.allowed) return finish(blocked(rl));

    await connectDB();
    const page = (await Page.findOne({
      slug: ctx.params.slug,
    }).lean()) as unknown as PageLean | null;
    if (!page) return finish(ok({ counted: false }));

    const user = await getCurrentUser();
    const cookieToken = req.cookies.get(viewCookieName(String(page._id)))?.value;
    const result = await recordView(page, user, visitorId, cookieToken);
    return finish(ok(result));
  } catch (err) {
    return finish(errorResponse(err, ctx.requestId));
  }
});
