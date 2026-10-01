// EP-27 GET /admin/pages - paginated card list of every page with its owner.
import { NextRequest } from "next/server";
import { escapeRegex, ok, paginated, parseListQuery, route } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { serializeCard } from "@/lib/page-helpers";
import { STATUSES } from "@/lib/validators";
import { Page, type PageLean } from "@/models/Page";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async (req: NextRequest) => {
  await requireAdmin();
  await connectDB();

  const { page, limit, skip, sort, search } = parseListQuery(
    req,
    ["createdAt", "updatedAt", "recipient.name", "stats.views"],
    "-createdAt",
  );

  const status = req.nextUrl.searchParams.get("status");
  const filter: Record<string, unknown> = {};
  if (status && (STATUSES as readonly string[]).includes(status)) filter.status = status;
  if (search) {
    // One escaped regex reused for both the recipient name and the slug.
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ "recipient.name": rx }, { slug: rx }];
  }

  const [rows, total] = await Promise.all([
    Page.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Page.countDocuments(filter),
  ]);

  const pages = rows as unknown as PageLean[];
  // Batch-load every owner in a single query so the list never becomes N+1.
  const ownerIds = [...new Set(pages.map((p) => String(p.ownerId)))];
  const owners = await User.find({ _id: { $in: ownerIds } })
    .select({ name: 1, email: 1 })
    .lean();
  const byId = new Map(owners.map((o) => [String(o._id), o]));

  const items = pages.map((p) => {
    const owner = byId.get(String(p.ownerId));
    return {
      ...serializeCard(p),
      ownerName: owner?.name ?? "Deleted user",
      ownerEmail: owner?.email ?? "",
    };
  });

  return ok(paginated(items, total, page, limit));
});
