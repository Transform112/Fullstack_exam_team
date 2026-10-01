// EP-23 GET /pages/:id/wishes - owner or admin list that includes hidden wishes.
import { NextRequest } from "next/server";
import { ok, paginated, parseListQuery, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getOwnedPage } from "@/lib/page-helpers";
import { listAllWishes } from "@/services/wishes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

export const GET = route<Params>(async (req: NextRequest, ctx) => {
  const user = await requireUser();
  await connectDB();
  const page = await getOwnedPage(ctx.params.id, user, true);
  const { page: pageNo, limit, skip } = parseListQuery(req, ["createdAt"], "-createdAt");
  const result = await listAllWishes(String(page._id), pageNo, limit, skip);
  return ok(paginated(result.rows, result.total, pageNo, limit));
});
