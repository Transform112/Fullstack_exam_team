// EP-15 POST /pages/:id/unpublish
import { NextRequest } from "next/server";
import { ok, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { unpublishPage } from "@/services/pages";

export const runtime = "nodejs";

type Params = { id: string };

export const POST = route<Params>(async (_req: NextRequest, ctx) => {
  const user = await requireUser();
  await connectDB();
  return ok(await unpublishPage(user, ctx.params.id));
});
