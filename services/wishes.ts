// Wishes service: EP-21 (public list), EP-22 (public create), EP-23/EP-24 (owner
// moderation). Rate limits are applied by the route handlers.
import { AppError, Errors } from "@/lib/errors";
import { isProfane } from "@/lib/profanity";
import { checkPageAccess, effectiveStatus } from "@/lib/page-helpers";
import { withOptionalTransaction } from "@/lib/tx";
import { Page, type PageLean } from "@/models/Page";
import { Wish } from "@/models/Wish";
import type { UserLean } from "@/models/User";

type WishInput = { name: string; message: string; emoji?: string };

// Shared access gate for both public wish routes.
function requireOpenPage(page: PageLean, user: UserLean | null, cookieToken: string | undefined) {
  const status = effectiveStatus(page);
  if (status === "DRAFT") throw Errors.notFound("We could not find that page.");
  const access = checkPageAccess(page, user, cookieToken);
  if (access.result === "NOT_FOUND") throw Errors.notFound("We could not find that page.");
  if (access.result === "UNAVAILABLE")
    throw new AppError(403, "PAGE_UNAVAILABLE", "This page is unavailable");
  if (access.result === "LOCKED_SCHEDULED" || access.result === "LOCKED_PASSWORD") {
    throw new AppError(403, "PAGE_LOCKED", "This page opens later.");
  }
  return access;
}

export async function listPublicWishes(
  page: PageLean,
  user: UserLean | null,
  cookieToken: string | undefined,
) {
  requireOpenPage(page, user, cookieToken);
  const rows = await Wish.find({ pageId: page._id, isHidden: false })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return rows.map((w) => ({
    id: String(w._id),
    name: w.name,
    message: w.message,
    emoji: w.emoji,
    createdAt: w.createdAt,
  }));
}

// EP-22. Admins may not post wishes (file 01 SECTION 3) and ipHash is only ever stored.
export async function createWish(
  page: PageLean,
  input: WishInput,
  user: UserLean | null,
  visitorId: string,
  ipHash: string,
  cookieToken: string | undefined,
) {
  requireOpenPage(page, user, cookieToken);
  if (user?.role === "ADMIN") throw Errors.forbidden("Admins cannot post wishes.");
  if (!page.settings?.wishesWall)
    throw new AppError(403, "WISHES_DISABLED", "Wishes are turned off for this page.");
  if (isProfane(input.name, input.message)) {
    throw new AppError(400, "PROFANITY", "Please keep wishes kind");
  }

  const wish = await withOptionalTransaction(async (session) => {
    const opts = session ? { session } : {};
    const [doc] = await Wish.create(
      [
        {
          pageId: page._id,
          name: input.name,
          message: input.message,
          emoji: input.emoji ?? "",
          visitorId,
          ipHash,
        },
      ],
      opts,
    );
    await Page.updateOne({ _id: page._id }, { $inc: { "stats.wishes": 1 } }, opts);
    return doc;
  });

  return {
    id: String(wish._id),
    name: wish.name,
    message: wish.message,
    emoji: wish.emoji,
    createdAt: wish.createdAt,
  };
}

// EP-23: owner or admin list, including hidden wishes.
export async function listAllWishes(pageId: string, page: number, limit: number, skip: number) {
  const filter = { pageId };
  const [rows, total] = await Promise.all([
    Wish.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Wish.countDocuments(filter),
  ]);
  return {
    rows: rows.map((w) => ({
      id: String(w._id),
      name: w.name,
      message: w.message,
      emoji: w.emoji,
      isHidden: w.isHidden,
      createdAt: w.createdAt,
    })),
    total,
    page,
    limit,
  };
}

// EP-24: delete scoped to the page and decrement at most once.
export async function deleteWish(page: PageLean, wishId: string) {
  if (!/^[a-fA-F0-9]{24}$/.test(wishId)) throw Errors.notFound("That wish no longer exists.");
  const removed = await withOptionalTransaction(async (session) => {
    const opts = session ? { session } : {};
    const doc = await Wish.findOneAndDelete({ _id: wishId, pageId: page._id }, opts);
    if (!doc) return false;
    await Page.updateOne(
      { _id: page._id, "stats.wishes": { $gt: 0 } },
      { $inc: { "stats.wishes": -1 } },
      opts,
    );
    return true;
  });
  if (!removed) throw Errors.notFound("That wish no longer exists.");
  return { id: wishId, deleted: true };
}
