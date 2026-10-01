// Shared page business logic (docs/02 SECTION 8): computed status, access rules,
// serializers, thumbnails and asset cleanup.
import { Types } from "mongoose";
import { Errors } from "./errors";
import { cld } from "./cloudinary-url";
import { buildSlug } from "./slug";
import { verifyViewToken } from "./auth";
import { cloudinary } from "./cloudinary";
import { Page, type MediaItemLean, type PageLean } from "@/models/Page";
import { User, type UserLean } from "@/models/User";
import type { WishPageData } from "./wish-types";

export type PageLike = PageLean;

// Mongoose documents expose toObject(); lean objects are already plain.
export function toPlain<T>(doc: T): T {
  const d = doc as unknown as { toObject?: () => T };
  return typeof d?.toObject === "function" ? d.toObject!() : doc;
}

export type EffectiveStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "UNPUBLISHED" | "DISABLED";

// The lifecycle status as visitors experience it. There is no cron job: a page with a
// future revealAt simply reads as SCHEDULED until that time passes.
export function effectiveStatus(page: Pick<PageLean, "status" | "revealAt">): EffectiveStatus {
  const stored = page.status as EffectiveStatus;
  if (stored === "DRAFT" || stored === "UNPUBLISHED" || stored === "DISABLED") return stored;
  if (page.revealAt && new Date(page.revealAt).getTime() > Date.now()) return "SCHEDULED";
  return "PUBLISHED";
}

export const STATUS_LABELS: Record<EffectiveStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Live",
  UNPUBLISHED: "Unpublished",
  DISABLED: "Disabled",
};

// First whitespace-separated word of the recipient name.
export function firstName(name: string | undefined): string {
  return (name ?? "").trim().split(/\s+/)[0] ?? "";
}

export type AccessResult =
  | { result: "NOT_FOUND" }
  | { result: "UNAVAILABLE" }
  | { result: "LOCKED_SCHEDULED" }
  | { result: "LOCKED_PASSWORD" }
  | { result: "OK"; isOwner: boolean };

// What a requester may see, decided in this exact order (docs/02 SECTION 8.3).
export function checkPageAccess(
  page: PageLike,
  user: UserLean | null,
  cookieToken: string | undefined,
): AccessResult {
  const status = effectiveStatus(page);
  const ownerId = String(page.ownerId);
  const isOwner = !!user && String(user._id) === ownerId;

  if (status === "DISABLED") return { result: "UNAVAILABLE" };
  if (status === "DRAFT") return { result: "NOT_FOUND" };

  const isPrivileged = isOwner || user?.role === "ADMIN";

  if (status === "UNPUBLISHED" && !isPrivileged) return { result: "UNAVAILABLE" };
  if (status === "SCHEDULED" && !isPrivileged) return { result: "LOCKED_SCHEDULED" };
  if (
    page.settings?.passwordHash &&
    !isPrivileged &&
    !verifyViewToken(cookieToken, String(page._id), page.rev)
  ) {
    return { result: "LOCKED_PASSWORD" };
  }
  return { result: "OK", isOwner };
}

// Owner-facing serialization: never includes ownerId or the password hash.
export function serializeOwnerPage(page: PageLike) {
  const p = toPlain(page) as PageLean;
  const status = effectiveStatus(p);
  return {
    id: String(p._id),
    slug: p.slug ?? null,
    status,
    statusLabelKey: status,
    rev: p.rev,
    draftStep: p.draftStep ?? 1,
    disabledFromStatus: p.disabledFromStatus ?? null,
    occasion: p.occasion ?? null,
    customOccasionLabel: p.customOccasionLabel ?? "",
    occasionDate: p.occasionDate ? new Date(p.occasionDate).toISOString() : null,
    revealAt: p.revealAt ? new Date(p.revealAt).toISOString() : null,
    recipient: {
      name: p.recipient?.name ?? "",
      nickname: p.recipient?.nickname ?? "",
      relation: p.recipient?.relation ?? "",
      age: p.recipient?.age,
    },
    from: p.from ?? "",
    language: p.language,
    messages: p.messages ?? [],
    memories: (p.memories ?? []).map((m) => ({
      id: m.id,
      title: m.title,
      date: m.date ?? "",
      description: m.description ?? "",
      mediaId: m.mediaId ?? "",
    })),
    media: (p.media ?? []).map(mediaOut),
    theme: {
      templateId: p.theme?.templateId ?? "",
      accent: p.theme?.accent ?? "#FF4FA3",
      font: p.theme?.font ?? "default",
      music: p.theme?.music ?? "none",
      decorations: p.theme?.decorations ?? [],
    },
    settings: {
      wishesWall: p.settings?.wishesWall ?? true,
      showViews: p.settings?.showViews ?? false,
      hasPassword: !!p.settings?.passwordHash,
    },
    ogImageUrl: p.ogImageUrl ?? null,
    thumbnailUrl: p.thumbnailUrl ?? null,
    stats: {
      views: p.stats?.views ?? 0,
      uniqueViews: p.stats?.uniqueViews ?? 0,
      wishes: p.stats?.wishes ?? 0,
    },
    deploy: p.deploy ?? null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// Owner payload as produced by serializeOwnerPage (also what the wizard receives).
export type OwnerPage = ReturnType<typeof serializeOwnerPage>;

function mediaOut(m: MediaItemLean) {
  return {
    id: m.id,
    type: m.type,
    url: m.url,
    publicId: m.publicId,
    w: m.w ?? 0,
    h: m.h ?? 0,
    duration: m.duration ?? null,
    caption: m.caption ?? "",
    order: m.order ?? 0,
  };
}

// Card shape for the dashboard and admin lists.
export function serializeCard(page: PageLike) {
  return {
    id: String(page._id),
    slug: page.slug ?? null,
    status: effectiveStatus(page),
    recipientName: page.recipient?.name ?? "",
    occasion: page.occasion ?? "",
    customOccasionLabel: page.customOccasionLabel ?? "",
    templateId: page.theme?.templateId ?? "",
    thumbnailUrl: page.thumbnailUrl ?? null,
    stats: {
      views: page.stats?.views ?? 0,
      uniqueViews: page.stats?.uniqueViews ?? 0,
      wishes: page.stats?.wishes ?? 0,
    },
    revealAt: page.revealAt ? new Date(page.revealAt).toISOString() : null,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  };
}

// Public open payload (EP-18). Never includes passwordHash, ownerId, owner email,
// deploy data or stats other than views when showViews is on.
export function serializePublicPage(page: PageLike, includeViews: boolean): WishPageData {
  const p = toPlain(page) as PageLean;
  const showViews = includeViews && (p.settings?.showViews ?? false);
  return {
    locked: false as const,
    slug: p.slug as string,
    occasion: p.occasion ?? "CUSTOM",
    customOccasionLabel: p.customOccasionLabel ?? "",
    occasionDate: p.occasionDate ? new Date(p.occasionDate).toISOString() : null,
    recipient: {
      name: p.recipient?.name ?? "",
      nickname: p.recipient?.nickname ?? "",
      relation: p.recipient?.relation ?? "",
    },
    from: p.from ?? "",
    language: (p.language ?? "ENGLISH") as WishPageData["language"],
    messages: p.messages ?? [],
    memories: (p.memories ?? []).map((m) => ({
      id: m.id,
      title: m.title,
      date: m.date ?? "",
      description: m.description ?? "",
      mediaId: m.mediaId ?? "",
    })),
    media: (p.media ?? []).map(mediaOut),
    theme: {
      templateId: p.theme?.templateId ?? "neon-night",
      accent: p.theme?.accent ?? "#FF4FA3",
      font: p.theme?.font ?? "default",
      music: p.theme?.music ?? "none",
      decorations: p.theme?.decorations ?? [],
    },
    settings: {
      wishesWall: p.settings?.wishesWall ?? true,
      showViews: p.settings?.showViews ?? false,
    },
    ...(showViews ? { views: p.stats?.views ?? 0 } : {}),
  };
}

// Thumbnail = the lowest-order image, cropped to a 4:5 card. Mutates the page object.
export function refreshThumbnail(page: PageLike): string {
  const images = (page.media ?? [])
    .filter((m) => m.type === "image")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const url = images[0] ? cld(images[0].url, "w_400,h_500,c_fill,g_auto,f_auto,q_auto") : "";
  page.thumbnailUrl = url;
  return url;
}

// Removes Cloudinary assets for deleted media. Seed fixtures and assets still
// referenced by another page are kept. Failures are logged, never thrown.
export async function destroyAssets(mediaItems: MediaItemLean[], excludePageId: string) {
  for (const item of mediaItems) {
    if (!item?.publicId || item.publicId.startsWith("seed/")) continue;
    try {
      const other = await Page.findOne({
        _id: { $ne: new Types.ObjectId(excludePageId) },
        "media.publicId": item.publicId,
      })
        .select({ _id: 1 })
        .lean();
      if (other) continue;
      await cloudinary.uploader.destroy(item.publicId, {
        resource_type: item.type === "video" ? "video" : "image",
      });
    } catch (err) {
      console.error(
        "[cloudinary] failed to delete asset, manual retry needed:",
        item.publicId,
        err,
      );
    }
  }
}

// Loads a page for its owner (or an admin when allowAdmin is true).
export async function getOwnedPage(id: string, user: UserLean, allowAdmin = false) {
  if (!Types.ObjectId.isValid(id)) throw Errors.notFound("Page not found.");
  const page = await Page.findById(id);
  if (!page) throw Errors.notFound("Page not found.");
  const isOwner = String(page.ownerId) === String(user._id);
  if (!isOwner && !(allowAdmin && user.role === "ADMIN")) throw Errors.forbidden();
  return page;
}

// Loads the page owner (used by admin listings and the admin wish table).
export async function ownerOf(ownerId: Types.ObjectId) {
  return User.findById(ownerId).select({ name: 1, email: 1 }).lean();
}

export { buildSlug };
