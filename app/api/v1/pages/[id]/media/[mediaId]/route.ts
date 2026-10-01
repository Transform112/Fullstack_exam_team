// EP-13 DELETE /pages/:id/media/:mediaId
import { NextRequest } from "next/server";
import { ok, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { removeMedia } from "@/services/media";

export const runtime = "nodejs";

type Params = { id: string; mediaId: string };

export const DELETE = route<Params>(async (_req: NextRequest, ctx) => {
  const user = await requireUser();
  await connectDB();
  return ok(await removeMedia(user, ctx.params.id, ctx.params.mediaId));
});
