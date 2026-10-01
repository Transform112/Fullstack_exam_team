// EP-12 POST /media - registers an uploaded asset after verifying it with Cloudinary.
import { NextRequest } from "next/server";
import { created, ok, parseBody, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { mediaRegisterSchema } from "@/lib/validators";
import { registerMedia } from "@/services/media";

export const runtime = "nodejs";

export const POST = route(async (req: NextRequest) => {
  const user = await requireUser();
  const body = await parseBody(req, mediaRegisterSchema);
  await connectDB();
  const result = await registerMedia(user, body);
  // A repeated registration is idempotent and answers 200 instead of 201.
  return result.created
    ? created({ media: result.media, rev: result.rev, page: result.page })
    : ok({ media: result.media, rev: result.rev }, "This asset is already on the page.");
});
