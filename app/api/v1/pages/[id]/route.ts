// EP-09 GET /pages/:id, EP-10 PATCH /pages/:id (autosave), EP-17 DELETE /pages/:id.
// This route file follows the Next.js catch-all convention: one file per path,
// one exported handler per HTTP method.
import { NextRequest } from "next/server";
import { ok, parseBody, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getOwnedPage, serializeOwnerPage } from "@/lib/page-helpers";
import { patchSchema } from "@/lib/validators";
import { deletePage, patchDraft } from "@/services/pages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

export const GET = route<Params>(async (_req: NextRequest, ctx) => {
  const user = await requireUser();
  await connectDB();
  const page = await getOwnedPage(ctx.params.id, user);
  return ok(serializeOwnerPage(page.toObject()));
});

export const PATCH = route<Params>(async (req: NextRequest, ctx) => {
  const user = await requireUser();
  const body = await parseBody(req, patchSchema);
  await connectDB();
  // PATCH is owner-only: an admin cannot edit someone else's page content.
  return ok(await patchDraft(user, ctx.params.id, body));
});

export const DELETE = route<Params>(async (_req: NextRequest, ctx) => {
  const user = await requireUser();
  await connectDB();
  return ok(await deletePage(user, ctx.params.id));
});
