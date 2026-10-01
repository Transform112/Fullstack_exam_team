// Public access service: the password unlock (EP-19) and the deduped view counter (EP-20).
import { AppError, Errors } from "@/lib/errors";
import { signViewToken, verifyPassword } from "@/lib/auth";
import { checkPageAccess, effectiveStatus } from "@/lib/page-helpers";
import { withOptionalTransaction } from "@/lib/tx";
import { Page, type PageLean } from "@/models/Page";
import { DailyStat } from "@/models/DailyStat";
import { PageView } from "@/models/PageView";
import { PageVisitor } from "@/models/PageVisitor";
import type { UserLean } from "@/models/User";

// Views count once per visitor per page inside this window.
export const VIEW_WINDOW_MS = 30 * 60 * 1000;

export const unavailable = () => new AppError(403, "PAGE_UNAVAILABLE", "This page is unavailable");
export const locked = () => new AppError(403, "PAGE_LOCKED", "This page opens later.");

export async function findPageBySlug(slug: string) {
  const page = await Page.findOne({ slug }).lean();
  if (!page) throw Errors.notFound("We could not find that page.");
  return page as unknown as PageLean;
}

// EP-19: verify the page password and return a short-lived, revision-bound token.
export async function unlockPage(slug: string, password: string) {
  const page = await findPageBySlug(slug);
  const status = effectiveStatus(page);
  if (status === "DRAFT") throw Errors.notFound("We could not find that page.");
  if (status === "DISABLED" || status === "UNPUBLISHED") throw unavailable();
  if (status === "SCHEDULED") throw locked();
  if (!page.settings?.passwordHash) throw Errors.validation("This page is not password protected.");

  const ok = await verifyPassword(password, page.settings.passwordHash);
  if (!ok) throw new AppError(401, "WRONG_PASSWORD", "Wrong password, try again.");

  return {
    pageId: String(page._id),
    rev: page.rev,
    token: signViewToken(String(page._id), page.rev),
  };
}

// EP-20. Claims a 30 minute lease for this visitor, then updates the counters. A lease
// that is still active makes the duplicate-key error mean "already counted".
export async function recordView(
  page: PageLean,
  user: UserLean | null,
  visitorId: string,
  cookieToken: string | undefined,
): Promise<{ counted: boolean }> {
  const access = checkPageAccess(page, user, cookieToken);
  if (access.result !== "OK" || access.isOwner) return { counted: false };

  const pageId = page._id;
  const utcDay = new Date().toISOString().slice(0, 10);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await withOptionalTransaction(async (session) => {
        const opts = session ? { session } : {};
        const now = new Date();
        const cutoff = new Date(now.getTime() - VIEW_WINDOW_MS);
        const expiresAt = new Date(now.getTime() + VIEW_WINDOW_MS);

        let claimed = false;
        try {
          await PageView.findOneAndUpdate(
            { pageId, visitorId, lastCountedAt: { $lte: cutoff } },
            { $set: { lastCountedAt: now, expiresAt } },
            { upsert: true, new: true, ...opts },
          );
          claimed = true;
        } catch (err) {
          // Unique (pageId, visitorId) index: an active lease already exists.
          if ((err as { code?: number }).code !== 11000) throw err;
        }
        if (!claimed) return { counted: false };

        const seen = await PageVisitor.updateOne(
          { pageId, visitorId },
          { $setOnInsert: { pageId, visitorId } },
          { upsert: true, ...opts },
        );
        const isNewUnique = (seen.upsertedCount ?? 0) > 0;

        const inc: Record<string, number> = { "stats.views": 1 };
        if (isNewUnique) inc["stats.uniqueViews"] = 1;
        await Page.updateOne({ _id: pageId }, { $inc: inc }, opts);
        await DailyStat.updateOne(
          { pageId, date: utcDay },
          { $inc: { views: 1 }, $setOnInsert: { pageId, date: utcDay } },
          { upsert: true, ...opts },
        );
        return { counted: true };
      });
    } catch (err) {
      // Bounded retry for a transient transaction conflict; the lease is re-evaluated.
      const label = (err as { codeName?: string; hasErrorLabel?: (l: string) => boolean }).codeName;
      const transient =
        label === "TransientTransactionError" ||
        (err as { hasErrorLabel?: (l: string) => boolean }).hasErrorLabel?.(
          "TransientTransactionError",
        );
      if (!transient || attempt === 2) throw err;
    }
  }
  return { counted: false };
}
