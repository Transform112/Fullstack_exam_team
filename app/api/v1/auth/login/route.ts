// EP-03 POST /auth/login - the same error for an unknown email and a wrong password.
import { NextRequest, NextResponse } from "next/server";
import { ok, parseBody, rateHeaders, route } from "@/lib/api";
import { blocked, limitIp } from "@/lib/limits";
import { loginSchema } from "@/lib/validators";
import { connectDB } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { setAuthCookie, signAuthToken, verifyPassword } from "@/lib/auth";
import { User, publicUser, type UserLean } from "@/models/User";

export const runtime = "nodejs";

export const POST = route(async (req: NextRequest) => {
  const body = await parseBody(req, loginSchema);

  // The bucket is keyed by IP plus the normalized email address.
  const rl = await limitIp(req, "auth:login", body.email);
  if (!rl.allowed) return blocked(rl);

  await connectDB();
  const user = await User.findOne({ email: body.email });
  const invalid = new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  if (!user) throw invalid;

  const okPassword = await verifyPassword(body.password, user.passwordHash);
  if (!okPassword) throw invalid;

  if (!user.isActive)
    throw new AppError(403, "ACCOUNT_DISABLED", "This account has been deactivated.");

  const res = ok(
    { user: publicUser(user.toObject() as UserLean) },
    undefined,
    200,
    rateHeaders(rl),
  );
  setAuthCookie(res as NextResponse, signAuthToken(String(user._id), user.role));
  return res;
});
