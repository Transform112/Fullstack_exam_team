// EP-26 GET /admin/stats - platform counters for the admin dashboard.
import { NextRequest } from "next/server";
import { ok, route } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { platformStats } from "@/services/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async (_req: NextRequest) => {
  await requireAdmin();
  await connectDB();
  return ok(await platformStats());
});
