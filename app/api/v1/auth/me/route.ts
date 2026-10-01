// EP-05 GET /auth/me - the current user, never the password hash.
import { ok, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { publicUser } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  return ok({ user: publicUser(user) });
});
