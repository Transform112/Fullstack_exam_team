// Public page loader shared by the /w/[slug] server component and EP-18.
// It applies the access rules once and returns the exact payload shape.
import { checkPageAccess, firstName, serializePublicPage } from "./page-helpers";
import { connectDB } from "./db";
import { Page, type PageLean } from "@/models/Page";
import type { LockedPayload, WishPageData } from "./wish-types";
import type { UserLean } from "@/models/User";

// The page language is not part of the locked payload, so lock screens render in English.
export type ReadCookie = (name: string) => string | undefined;

export type PublicPageResult =
  | { result: "NOT_FOUND" }
  | { result: "UNAVAILABLE" }
  | { result: "LOCKED_SCHEDULED"; payload: Extract<LockedPayload, { reason: "SCHEDULED" }> }
  | { result: "LOCKED_PASSWORD"; payload: Extract<LockedPayload, { reason: "PASSWORD" }> }
  | { result: "OK"; page: PageLean; payload: WishPageData; isOwner: boolean };

export async function loadPublicPage(
  slug: string,
  user: UserLean | null,
  readCookie: ReadCookie,
): Promise<PublicPageResult> {
  await connectDB();
  const page = (await Page.findOne({ slug }).lean()) as unknown as PageLean | null;
  if (!page) return { result: "NOT_FOUND" };

  const token = readCookie(`wishly_view_${String(page._id)}`);
  const access = checkPageAccess(page, user, token);
  const name = firstName(page.recipient?.name);

  if (access.result === "NOT_FOUND") return { result: "NOT_FOUND" };
  if (access.result === "UNAVAILABLE") return { result: "UNAVAILABLE" };
  if (access.result === "LOCKED_SCHEDULED") {
    return {
      result: "LOCKED_SCHEDULED",
      payload: {
        locked: true,
        reason: "SCHEDULED",
        recipientFirstName: name,
        revealAt: page.revealAt ? new Date(page.revealAt).toISOString() : null,
      },
    };
  }
  if (access.result === "LOCKED_PASSWORD") {
    return {
      result: "LOCKED_PASSWORD",
      payload: { locked: true, reason: "PASSWORD", recipientFirstName: name },
    };
  }
  return {
    result: "OK",
    page,
    payload: serializePublicPage(page, true),
    isOwner: access.isOwner,
  };
}

// The public-only projection used by metadata and the OG image. It never observes the
// owner or admin lock bypass, so a locked page always looks locked to crawlers.
export async function loadPublicMeta(slug: string) {
  await connectDB();
  const page = (await Page.findOne({ slug }).lean()) as unknown as PageLean | null;
  if (!page) return { result: "GENERIC" as const };
  const access = checkPageAccess(page, null, undefined);
  if (access.result !== "OK") return { result: "GENERIC" as const };
  return { result: "OK" as const, page, payload: serializePublicPage(page, false) };
}
