// EP-30 PATCH /admin/users/:id - activate or deactivate an account.
import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { ok, parseBody, route } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { adminUserSchema } from "@/lib/validators";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

export const PATCH = route<Params>(async (req: NextRequest, ctx) => {
  const admin = await requireAdmin();
  await connectDB();

  const { isActive } = await parseBody(req, adminUserSchema);
  const { id } = ctx.params;
  if (!Types.ObjectId.isValid(id)) throw Errors.notFound("User not found.");

  // Self-deactivation would lock the only admin out, so it is rejected outright.
  if (!isActive && String(admin._id) === id) {
    throw Errors.validation("You cannot deactivate your own account.");
  }

  const updated = await User.findByIdAndUpdate(id, { $set: { isActive } }, { new: true })
    .select({ name: 1, email: 1, role: 1, isActive: 1, createdAt: 1 })
    .lean();
  if (!updated) throw Errors.notFound("User not found.");

  return ok(
    {
      id: String(updated._id),
      name: updated.name,
      email: updated.email,
      role: updated.role,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
    },
    isActive ? "User activated." : "User deactivated.",
  );
});
