// EP-08 GET /pages/mine - the creator dashboard list.
import { NextRequest } from "next/server";
import { ok, paginated, parseListQuery, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { serializeCard } from "@/lib/page-helpers";
import { Page, type PageLean } from "@/models/Page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async (req: NextRequest) => {
  const user = await requireUser();
  await connectDB();

  const { page, limit, skip, sort, search } = parseListQuery(
    req,
    ["createdAt", "updatedAt"],
    "-createdAt",
  );
  const status = req.nextUrl.searchParams.get("status");
  const filter: Record<string, unknown> = { ownerId: user._id };
  if (status) filter.status = status;
  if (search) filter["recipient.name"] = { $regex: search, $options: "i" };

  const [rows, total] = await Promise.all([
    Page.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Page.countDocuments(filter),
  ]);

  return ok(paginated((rows as unknown as PageLean[]).map(serializeCard), total, page, limit));
});
