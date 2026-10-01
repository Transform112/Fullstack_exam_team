// EP-25 GET /pages/:id/insights - totals plus 30 days of views with zeros filled.
import { NextRequest } from "next/server";
import { ok, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getOwnedPage } from "@/lib/page-helpers";
import { pageInsights } from "@/services/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

export const GET = route<Params>(async (_req: NextRequest, ctx) => {
  const user = await requireUser();
  await connectDB();
  const page = await getOwnedPage(ctx.params.id, user, true);
  return ok(await pageInsights(page.toObject()));
});
