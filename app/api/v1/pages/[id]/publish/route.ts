// EP-14 POST /pages/:id/publish - the generation pipeline (validate, slug, status, QR).
import { NextRequest } from "next/server";
import { ok, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { blocked, limitUser } from "@/lib/limits";
import { publishPage } from "@/services/pages";

export const runtime = "nodejs";

type Params = { id: string };

export const POST = route<Params>(async (_req: NextRequest, ctx) => {
  const user = await requireUser();
  const rl = await limitUser("publish", String(user._id));
  if (!rl.allowed) return blocked(rl);
  await connectDB();
  return ok(await publishPage(user, ctx.params.id));
});
