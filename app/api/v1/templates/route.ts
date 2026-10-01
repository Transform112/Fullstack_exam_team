// EP-06 GET /templates - the active templates shown by the wizard and the gallery.
import { NextRequest } from "next/server";
import { ok, rateHeaders, route } from "@/lib/api";
import { blocked, limitIp } from "@/lib/limits";
import { connectDB } from "@/lib/db";
import { Template } from "@/models/Template";

export const runtime = "nodejs";

export const GET = route(async (req: NextRequest) => {
  const rl = await limitIp(req, "public:read");
  if (!rl.allowed) return blocked(rl);

  await connectDB();
  const items = await Template.find({ isActive: true })
    .select({
      _id: 0,
      id: 1,
      name: 1,
      description: 1,
      previewImage: 1,
      supportedOccasions: 1,
      defaultPalette: 1,
      fonts: 1,
    })
    .sort({ id: 1 })
    .lean();
  return ok({ items }, undefined, 200, rateHeaders(rl));
});
