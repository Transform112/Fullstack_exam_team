// EP-01 GET /health - public uptime check that also proves the database is reachable.
import { connectDB } from "@/lib/db";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await connectDB();
  return ok({ status: "ok", db: "connected" });
});
