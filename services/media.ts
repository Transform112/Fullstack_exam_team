// Media service: server-side verification of direct Cloudinary uploads and the
// register/remove operations behind EP-12 and EP-13 (docs/02 SECTION 10).
import { nanoid } from "nanoid";
import { Errors } from "@/lib/errors";
import {
  IMAGE_FORMATS,
  MAX_IMAGES,
  MAX_VIDEOS,
  VIDEO_FORMATS,
  VIDEO_MAX_BYTES,
  VIDEO_MAX_SECONDS,
  IMAGE_MAX_BYTES,
  cloudinary,
} from "@/lib/cloudinary";
import {
  destroyAssets,
  getOwnedPage,
  refreshThumbnail,
  serializeOwnerPage,
} from "@/lib/page-helpers";
import { Page, type MediaItemLean, type PageLean } from "@/models/Page";
import type { UserLean } from "@/models/User";

type RegisterInput = {
  pageId: string;
  publicId: string;
  resourceType: "image" | "video";
  caption?: string;
};

type CloudinaryResource = {
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
  secure_url?: string;
};

// EP-12. The client-reported numbers are ignored: size, type and duration come from
// the Cloudinary Admin API for the asset the browser just uploaded.
export async function registerMedia(user: UserLean, input: RegisterInput) {
  const page = await getOwnedPage(input.pageId, user);
  const owned = page.toObject() as PageLean;
  const folderPrefix = `wishly/${user._id}/`;
  if (!input.publicId.startsWith(folderPrefix)) {
    throw Errors.forbidden("That asset does not belong to your upload folder.");
  }

  // Idempotent retry: the same asset registered twice returns the existing item.
  const existing = (owned.media ?? []).find(
    (m) => m.publicId === input.publicId && m.type === input.resourceType,
  );
  if (existing) return { media: existing, rev: page.rev, created: false };

  let resource: CloudinaryResource;
  try {
    resource = (await cloudinary.api.resource(input.publicId, {
      resource_type: input.resourceType,
    })) as CloudinaryResource;
  } catch {
    throw Errors.validation("That upload could not be verified. Please try again.");
  }

  const format = (resource.format ?? "").toLowerCase();
  const bytes = resource.bytes ?? 0;
  const duration = resource.duration ?? 0;
  const isImage = input.resourceType === "image";

  const problems: string[] = [];
  if (isImage) {
    if (!IMAGE_FORMATS.includes(format)) problems.push("Use a jpg, png, webp, heic or heif image");
    if (bytes > IMAGE_MAX_BYTES) problems.push("Photos must be 8 MB or smaller");
  } else {
    if (!VIDEO_FORMATS.includes(format)) problems.push("Use an mp4 video");
    if (bytes > VIDEO_MAX_BYTES) problems.push("Videos must be 50 MB or smaller");
    if (duration > VIDEO_MAX_SECONDS) problems.push("Videos must be 60 seconds or shorter");
  }

  const current = owned.media ?? [];
  const imageCount = current.filter((m) => m.type === "image").length;
  const videoCount = current.filter((m) => m.type === "video").length;
  if (isImage && imageCount >= MAX_IMAGES) problems.push(`Use at most ${MAX_IMAGES} photos`);
  if (!isImage && videoCount >= MAX_VIDEOS) problems.push(`Use at most ${MAX_VIDEOS} videos`);

  if (problems.length) {
    // Only the asset we just verified, and only when no page references it yet.
    await destroyAssets(
      [{ id: "rejected", type: input.resourceType, url: "", publicId: input.publicId, order: 0 }],
      String(page._id),
    );
    throw Errors.validation(problems[0]);
  }

  const item: MediaItemLean = {
    id: nanoid(8),
    type: input.resourceType,
    url: resource.secure_url as string,
    publicId: input.publicId,
    w: resource.width ?? 0,
    h: resource.height ?? 0,
    duration: isImage ? null : Math.round(duration),
    caption: input.caption ?? "",
    order: current.length,
  };

  // The index guard (media.<count> must not exist) makes concurrent registrations
  // unable to exceed the image or video limits.
  const updated = await Page.findOneAndUpdate(
    {
      _id: page._id,
      ownerId: user._id,
      rev: owned.rev,
      "media.publicId": { $ne: input.publicId },
      [`media.${current.length}`]: { $exists: false },
    },
    { $push: { media: item } },
    { new: true },
  ).lean();
  if (!updated) {
    throw Errors.conflict("STALE_REVISION", "This page changed elsewhere. Reload to try again.");
  }
  const thumbnailUrl = refreshThumbnail(updated);
  const saved = await Page.findOneAndUpdate(
    { _id: updated._id, ownerId: user._id, rev: updated.rev },
    { $set: { thumbnailUrl }, $inc: { rev: 1 } },
    { new: true },
  ).lean();
  if (!saved)
    throw Errors.conflict("STALE_REVISION", "This page changed elsewhere. Reload to try again.");
  return { media: item, rev: saved.rev, created: true, page: serializeOwnerPage(saved) };
}

// EP-13. Removing media also clears any memory linked to it, renumbers the order and
// deletes the Cloudinary asset when no other page still uses it.
export async function removeMedia(user: UserLean, pageId: string, mediaId: string) {
  const page = await getOwnedPage(pageId, user);
  const plain = page.toObject() as PageLean;
  const item = (plain.media ?? []).find((m) => m.id === mediaId);
  if (!item) throw Errors.notFound("That photo is not on this page.");

  const media = (plain.media ?? [])
    .filter((m) => m.id !== mediaId)
    .map((m, index) => ({ ...m, order: index }));
  const memories = (plain.memories ?? []).map((m) =>
    m.mediaId === mediaId ? { ...m, mediaId: "" } : m,
  );
  const thumbnailUrl = refreshThumbnail({ ...plain, media });

  const updated = await Page.findOneAndUpdate(
    { _id: page._id, ownerId: user._id, rev: plain.rev },
    { $set: { media, memories, thumbnailUrl }, $inc: { rev: 1 } },
    { new: true },
  ).lean();
  if (!updated)
    throw Errors.conflict("STALE_REVISION", "This page changed elsewhere. Reload to try again.");

  await destroyAssets([item], String(page._id));
  return { rev: updated.rev, page: serializeOwnerPage(updated) };
}
