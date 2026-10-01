// EP-16 POST /pages/:id/duplicate - a fresh draft with no slug and zero stats.
import { NextRequest } from "next/server";
import { created, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { duplicatePage } from "@/services/pages";

export const runtime = "nodejs";

type Params = { id: string };

export const POST = route<Params>(async (_req: NextRequest, ctx) => {
  const user = await requireUser();
  await connectDB();
  return created(await duplicatePage(user, ctx.params.id));
});
