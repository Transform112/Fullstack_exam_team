// EP-32 PATCH /admin/wishes/:id - hide or unhide a wish.
import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { ok, parseBody, route } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { adminWishSchema } from "@/lib/validators";
import { Wish } from "@/models/Wish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

export const PATCH = route<Params>(async (req: NextRequest, ctx) => {
  await requireAdmin();
  await connectDB();

  const { isHidden } = await parseBody(req, adminWishSchema);
  const { id } = ctx.params;
  if (!Types.ObjectId.isValid(id)) throw Errors.notFound("Wish not found.");

  const updated = await Wish.findByIdAndUpdate(id, { $set: { isHidden } }, { new: true }).lean();
  if (!updated) throw Errors.notFound("Wish not found.");

  return ok(
    { id: String(updated._id), pageId: String(updated.pageId), isHidden: updated.isHidden },
    isHidden ? "Wish hidden." : "Wish unhidden.",
  );
});
