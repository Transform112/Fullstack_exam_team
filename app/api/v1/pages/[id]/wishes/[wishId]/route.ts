// EP-24 DELETE /pages/:id/wishes/:wishId - owner or admin, scoped to the page.
import { NextRequest } from "next/server";
import { ok, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getOwnedPage } from "@/lib/page-helpers";
import { deleteWish } from "@/services/wishes";

export const runtime = "nodejs";

type Params = { id: string; wishId: string };

export const DELETE = route<Params>(async (_req: NextRequest, ctx) => {
  const user = await requireUser();
  await connectDB();
  const page = await getOwnedPage(ctx.params.id, user, true);
  return ok(await deleteWish(page.toObject(), ctx.params.wishId));
});
