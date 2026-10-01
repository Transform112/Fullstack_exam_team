// EP-02 POST /auth/register
import { NextRequest, NextResponse } from "next/server";
import { created, parseBody, rateHeaders, route } from "@/lib/api";
import { blocked, limitIp } from "@/lib/limits";
import { registerSchema } from "@/lib/validators";
import { connectDB } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { hashPassword, setAuthCookie, signAuthToken } from "@/lib/auth";
import { User, publicUser, type UserLean } from "@/models/User";

export const runtime = "nodejs";

export const POST = route(async (req: NextRequest) => {
  const rl = await limitIp(req, "auth:register");
  if (!rl.allowed) return blocked(rl);

  const body = await parseBody(req, registerSchema);
  await connectDB();

  const existing = await User.findOne({ email: body.email }).lean();
  if (existing) throw Errors.conflict("EMAIL_TAKEN", "That email is already registered.");

  const user = await User.create({
    name: body.name,
    email: body.email,
    passwordHash: await hashPassword(body.password),
    role: "USER",
  });

  const res = created(
    { user: publicUser(user.toObject() as UserLean) },
    undefined,
    rateHeaders(rl),
  );
  setAuthCookie(res as NextResponse, signAuthToken(String(user._id), user.role));
  return res;
});
