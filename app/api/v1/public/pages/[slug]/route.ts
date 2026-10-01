// EP-18 GET /public/pages/:slug - the one place the open payload is served.
// Locked results carry only the first name and, for scheduled pages, the reveal time.
import { NextRequest } from "next/server";
import { fail, noStore, ok, rateHeaders, route } from "@/lib/api";
import { blocked, limitIp } from "@/lib/limits";
import { getCurrentUser } from "@/lib/auth";
import { loadPublicPage } from "@/lib/public-page";
import { connectDB } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { slug: string };

export const GET = route<Params>(async (req: NextRequest, ctx) => {
  const rl = await limitIp(req, "public:read");
  if (!rl.allowed) return blocked(rl);

  await connectDB();
  const user = await getCurrentUser();
  const result = await loadPublicPage(
    ctx.params.slug,
    user,
    (name) => req.cookies.get(name)?.value,
  );
  const headers = noStore(rateHeaders(rl));

  if (result.result === "NOT_FOUND") {
    return fail(404, "PAGE_NOT_FOUND", "We could not find that page.", undefined, headers);
  }
  if (result.result === "UNAVAILABLE") {
    return fail(403, "PAGE_UNAVAILABLE", "This page is unavailable", undefined, headers);
  }
  return ok(result.payload, undefined, 200, headers);
});
