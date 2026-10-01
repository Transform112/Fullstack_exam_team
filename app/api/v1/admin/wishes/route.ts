// EP-31 GET /admin/wishes - paginated wishes across every page, with the page owner name.
import { NextRequest } from "next/server";
import { escapeRegex, ok, paginated, parseListQuery, route } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Page } from "@/models/Page";
import { Wish } from "@/models/Wish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async (req: NextRequest) => {
  await requireAdmin();
  await connectDB();

  const { page, limit, skip, sort, search } = parseListQuery(req, ["createdAt"], "-createdAt");

  const filter: Record<string, unknown> = {};
  if (search) filter.message = new RegExp(escapeRegex(search), "i");

  const [rows, total] = await Promise.all([
    Wish.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Wish.countDocuments(filter),
  ]);

  // One query for all the pages behind the returned wishes.
  const pageIds = [...new Set(rows.map((w) => String(w.pageId)))];
  const pages = pageIds.length
    ? await Page.find({ _id: { $in: pageIds } })
        .select({ "recipient.name": 1 })
        .lean()
    : [];
  const recipients = new Map(pages.map((p) => [String(p._id), p.recipient?.name ?? ""] as const));

  const items = rows.map((w) => ({
    id: String(w._id),
    pageId: String(w.pageId),
    name: w.name,
    message: w.message,
    emoji: w.emoji,
    isHidden: w.isHidden,
    recipientName: recipients.get(String(w.pageId)) ?? "",
    createdAt: w.createdAt,
  }));

  return ok(paginated(items, total, page, limit));
});
