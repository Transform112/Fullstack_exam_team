// EP-11 POST /uploads/sign - server-signed parameters for a direct browser upload.
// The Cloudinary API secret is never returned.
import { NextRequest } from "next/server";
import { ok, parseBody, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { blocked, limitUser } from "@/lib/limits";
import { signUpload } from "@/lib/cloudinary";
import { uploadSignSchema } from "@/lib/validators";

export const runtime = "nodejs";

export const POST = route(async (req: NextRequest) => {
  const user = await requireUser();
  const rl = await limitUser("upload:sign", String(user._id));
  if (!rl.allowed) return blocked(rl);

  const { resourceType } = await parseBody(req, uploadSignSchema);
  const { folder, timestamp, allowedFormats, signature } = signUpload(
    String(user._id),
    resourceType,
  );
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "";

  return ok({
    cloudName,
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    timestamp,
    folder,
    allowedFormats,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
  });
});
