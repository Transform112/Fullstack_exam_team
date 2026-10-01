// Analytics service: the 30 day insights payload (EP-25) and platform stats (EP-26).
import { Page, type PageLean } from "@/models/Page";
import { DailyStat } from "@/models/DailyStat";
import { User } from "@/models/User";
import { Wish } from "@/models/Wish";

// Last 30 UTC days of views with missing days filled with zero.
export async function pageInsights(page: PageLean) {
  const days: string[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i),
    );
    days.push(d.toISOString().slice(0, 10));
  }
  const rows = await DailyStat.find({ pageId: page._id, date: { $in: days } }).lean();
  const byDay = new Map(rows.map((r) => [r.date, r.views]));
  return {
    totals: {
      views: page.stats?.views ?? 0,
      uniqueViews: page.stats?.uniqueViews ?? 0,
      wishes: page.stats?.wishes ?? 0,
    },
    viewsByDay: days.map((date) => ({ date, views: byDay.get(date) ?? 0 })),
    deploy: page.deploy ?? null,
  };
}

export async function platformStats() {
  const [users, pages, livePages, disabledPages, wishes, viewAgg] = await Promise.all([
    User.countDocuments({}),
    Page.countDocuments({}),
    Page.countDocuments({ status: { $in: ["PUBLISHED", "SCHEDULED"] } }),
    Page.countDocuments({ status: "DISABLED" }),
    Wish.countDocuments({}),
    Page.aggregate([{ $group: { _id: null, total: { $sum: "$stats.views" } } }]),
  ]);
  return {
    users,
    pages,
    livePages,
    disabledPages,
    wishes,
    totalViews: viewAgg[0]?.total ?? 0,
  };
}
