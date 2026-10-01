// EP-33 PATCH /admin/templates/:id - activate or deactivate a template by slug.
import { NextRequest } from "next/server";
import { ok, parseBody, route } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { adminTemplateSchema } from "@/lib/validators";
import { Template } from "@/models/Template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

export const PATCH = route<Params>(async (req: NextRequest, ctx) => {
  await requireAdmin();
  await connectDB();

  const { isActive } = await parseBody(req, adminTemplateSchema);
  const { id } = ctx.params;

  const updated = await Template.findOneAndUpdate({ id }, { $set: { isActive } }, { new: true })
    .select({ _id: 0, id: 1, name: 1, isActive: 1 })
    .lean();
  if (!updated) throw Errors.notFound("Template not found.");

  return ok(
    { id: updated.id, name: updated.name, isActive: updated.isActive },
    isActive ? "Template activated." : "Template deactivated.",
  );
});
