// EP-07 POST /pages - creates a draft. Partial data is allowed (the wizard's step 1).
import { NextRequest } from "next/server";
import { created, parseBody, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { draftSchema } from "@/lib/validators";
import { connectDB } from "@/lib/db";
import { createDraft } from "@/services/pages";

export const runtime = "nodejs";

export const POST = route(async (req: NextRequest) => {
  const user = await requireUser();
  const body = await parseBody(req, draftSchema);
  await connectDB();
  return created(await createDraft(user, body));
});
