// EP-29 GET /admin/users - paginated users with their page counts.
import { NextRequest } from "next/server";
import { escapeRegex, ok, paginated, parseListQuery, route } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Page } from "@/models/Page";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async (req: NextRequest) => {
  await requireAdmin();
  await connectDB();

  const { page, limit, skip, sort, search } = parseListQuery(
    req,
    ["createdAt", "name", "email"],
    "-createdAt",
  );

  const filter: Record<string, unknown> = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [rows, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  // One aggregation for every returned user id: pages grouped by ownerId.
  const ids = rows.map((u) => u._id);
  const grouped = ids.length
    ? await Page.aggregate<{ _id: unknown; count: number }>([
        { $match: { ownerId: { $in: ids } } },
        { $group: { _id: "$ownerId", count: { $sum: 1 } } },
      ])
    : [];
  const counts = new Map(grouped.map((g) => [String(g._id), g.count]));

  const items = rows.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
    pagesCount: counts.get(String(u._id)) ?? 0,
  }));

  return ok(paginated(items, total, page, limit));
});
