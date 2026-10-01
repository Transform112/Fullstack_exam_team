// Pages service: draft creation, autosave (with optimistic concurrency), publish,
// unpublish, duplicate and delete. Route handlers stay thin and call these functions.
import { Types } from "mongoose";
import QRCode from "qrcode";
import { nanoid } from "nanoid";
import { z } from "zod";
import { Errors } from "@/lib/errors";
import { hashPassword } from "@/lib/auth";
import { buildSlug } from "@/lib/slug";
import { decorationsFor } from "@/lib/occasion";
import {
  destroyAssets,
  effectiveStatus,
  getOwnedPage,
  refreshThumbnail,
  serializeOwnerPage,
} from "@/lib/page-helpers";
import { withOptionalTransaction } from "@/lib/tx";
import { publishSchema, type draftSchema, type patchSchema } from "@/lib/validators";
import { Page, type PageLean } from "@/models/Page";
import { Template } from "@/models/Template";
import { DailyStat } from "@/models/DailyStat";
import { PageView } from "@/models/PageView";
import { PageVisitor } from "@/models/PageVisitor";
import { Wish } from "@/models/Wish";
import type { UserLean } from "@/models/User";

export const PAGE_LIMIT = 50;

export const appUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

type DraftInput = z.infer<typeof draftSchema>;
type PatchInput = z.infer<typeof patchSchema>;

// Fields the wizard may write. Everything else (ownerId, status, slug, stats) is
// server-controlled, which is what stops mass assignment.
function draftFields(input: DraftInput) {
  const set: Record<string, unknown> = {};
  if (input.occasion !== undefined) set.occasion = input.occasion;
  if (input.customOccasionLabel !== undefined) set.customOccasionLabel = input.customOccasionLabel;
  if (input.occasionDate !== undefined) set.occasionDate = input.occasionDate;
  if (input.revealAt !== undefined) set.revealAt = input.revealAt;
  if (input.from !== undefined) set.from = input.from;
  if (input.language !== undefined) set.language = input.language;
  if (input.draftStep !== undefined) set.draftStep = input.draftStep;
  if (input.recipient) {
    for (const key of ["name", "nickname", "relation", "age"] as const) {
      if (input.recipient[key] !== undefined) set[`recipient.${key}`] = input.recipient[key];
    }
  }
  if (input.theme) {
    for (const key of ["templateId", "accent", "font", "music", "decorations"] as const) {
      if (input.theme[key] !== undefined) set[`theme.${key}`] = input.theme[key];
    }
  }
  if (input.settings) {
    if (input.settings.wishesWall !== undefined)
      set["settings.wishesWall"] = input.settings.wishesWall;
    if (input.settings.showViews !== undefined)
      set["settings.showViews"] = input.settings.showViews;
  }
  if (input.messages !== undefined) set.messages = input.messages;
  if (input.memories !== undefined) {
    set.memories = input.memories.map((m) => ({
      id: m.id || nanoid(8),
      title: m.title,
      date: m.date ?? "",
      description: m.description ?? "",
      mediaId: m.mediaId ?? "",
    }));
  }
  return set;
}

// EP-07: create a draft. Partial data is allowed; the first wizard step is usually
// the first write.
export async function createDraft(user: UserLean, input: DraftInput) {
  const owned = await Page.countDocuments({ ownerId: user._id });
  if (owned >= PAGE_LIMIT) {
    throw Errors.conflict("PAGE_LIMIT", `You have reached the limit of ${PAGE_LIMIT} pages.`);
  }
  const set = draftFields(input);
  const doc: Record<string, unknown> = {
    ownerId: user._id,
    status: "DRAFT",
    rev: 0,
    ...set,
  };
  // A page password arrives as plain text and is only ever stored as a bcrypt hash.
  if (input.settings?.password) {
    doc["settings.passwordHash"] = await hashPassword(input.settings.password);
  }
  const page = await Page.create(doc);
  return serializeOwnerPage(page.toObject() as PageLean);
}

// EP-10: autosave. The atomic filter { _id, ownerId, rev } makes a stale tab fail with
// 409 STALE_REVISION instead of silently overwriting newer edits.
export async function patchDraft(user: UserLean, id: string, input: PatchInput) {
  const page = await getOwnedPage(id, user);
  const existing = page.toObject() as PageLean;

  // Media can only be reordered or re-captioned here: never added, removed or re-pointed.
  const mediaIds = new Set((existing.media ?? []).map((m) => m.id));
  if (input.media) {
    for (const item of input.media) {
      if (!mediaIds.has(item.id)) throw Errors.validation(`Unknown media id: ${item.id}`);
    }
  }
  const set = draftFields(input);
  let updatedMedia = existing.media ?? [];
  if (input.media) {
    const patchById = new Map(input.media.map((m) => [m.id, m]));
    updatedMedia = (existing.media ?? []).map((m) => {
      const patch = patchById.get(m.id);
      return patch
        ? { ...m, caption: patch.caption ?? m.caption, order: patch.order ?? m.order }
        : m;
    });
    set.media = updatedMedia;
  }
  if (input.memories) {
    for (const memory of input.memories) {
      if (memory.mediaId && !mediaIds.has(memory.mediaId)) {
        throw Errors.validation("That memory links to a photo that is not on this page.");
      }
    }
  }

  const unset: Record<string, ""> = {};
  if (input.settings && "password" in input.settings) {
    if (input.settings.password === null || input.settings.password === "") {
      unset["settings.passwordHash"] = "";
    } else if (typeof input.settings.password === "string") {
      set["settings.passwordHash"] = await hashPassword(input.settings.password);
    }
  }

  // A published page whose reveal time moved must flip between SCHEDULED and PUBLISHED.
  if (
    existing.slug &&
    (existing.status === "PUBLISHED" || existing.status === "SCHEDULED") &&
    input.revealAt !== undefined
  ) {
    const reveal = input.revealAt ? new Date(input.revealAt).getTime() : 0;
    set.status = reveal > Date.now() ? "SCHEDULED" : "PUBLISHED";
  }

  const mediaChanged = input.media !== undefined;
  const thumbnailUrl = mediaChanged
    ? refreshThumbnail({ ...existing, media: updatedMedia })
    : existing.thumbnailUrl;
  if (mediaChanged) set.thumbnailUrl = thumbnailUrl;

  const update: Record<string, unknown> = { $inc: { rev: 1 } };
  if (Object.keys(set).length) update.$set = set;
  if (Object.keys(unset).length) update.$unset = unset;

  const updated = await Page.findOneAndUpdate(
    { _id: page._id, ownerId: user._id, rev: input.rev },
    update,
    { new: true },
  ).lean();
  if (!updated)
    throw Errors.conflict(
      "STALE_REVISION",
      "This page changed elsewhere. Reload to see the latest version.",
    );
  return serializeOwnerPage(updated);
}

// EP-14: the generation pipeline. Validates the stored page, assigns a permanent slug
// (bounded retry on a duplicate key) and returns the share kit payload.
export async function publishPage(user: UserLean, id: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const page = await getOwnedPage(id, user);
    const plain = page.toObject() as PageLean;
    if (plain.status === "DISABLED") throw Errors.forbidden("This page is disabled by an admin.");

    const parsed = publishSchema.safeParse({
      occasion: plain.occasion,
      customOccasionLabel: plain.customOccasionLabel,
      recipient: { name: plain.recipient?.name ?? "" },
      messages: plain.messages ?? [],
      memories: plain.memories ?? [],
      media: (plain.media ?? []).map((m) => ({ type: m.type })),
      theme: { templateId: plain.theme?.templateId ?? "" },
    });
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        issue: i.message,
      }));
      throw Errors.validation(parsed.error.issues[0]?.message ?? "Invalid page", details);
    }

    const template = await Template.findOne({ id: plain.theme?.templateId, isActive: true }).lean();
    if (!template) throw Errors.validation("Pick a template");

    const revealAt = plain.revealAt ? new Date(plain.revealAt) : null;
    const status = revealAt && revealAt.getTime() > Date.now() ? "SCHEDULED" : "PUBLISHED";
    const decorations =
      plain.theme?.decorations && plain.theme.decorations.length > 0
        ? plain.theme.decorations
        : decorationsFor(plain.occasion, undefined);
    const thumbnailUrl = refreshThumbnail(plain);
    const base = appUrl();
    const existingSlug = plain.slug;

    if (existingSlug) {
      // Slug is permanent: keep it and only move the lifecycle forward.
      const updated = await Page.findOneAndUpdate(
        { _id: page._id, ownerId: user._id, rev: plain.rev, status: { $ne: "DISABLED" } },
        {
          $set: {
            slug: existingSlug,
            status,
            "theme.decorations": decorations,
            thumbnailUrl,
            ogImageUrl: `${base}/api/og/${existingSlug}`,
          },
          $inc: { rev: 1 },
        },
        { new: true },
      ).lean();
      if (updated) return publishResponse(updated);
      const fresh = await Page.findById(page._id).lean();
      if (!fresh) throw Errors.notFound("Page not found.");
      if (fresh.status === "DISABLED") throw Errors.forbidden("This page is disabled by an admin.");
      if (fresh.slug) return publishResponse(fresh);
      continue; // rare: concurrent unpublish cleared state, try again
    }

    // First publish: the unique slug index is the real guard, not a pre-check.
    let duplicate = false;
    for (let i = 0; i < 5; i++) {
      const slug = buildSlug(plain.recipient?.name ?? "", plain.occasion ?? "");
      try {
        const updated = await Page.findOneAndUpdate(
          {
            _id: page._id,
            ownerId: user._id,
            rev: plain.rev,
            slug: { $exists: false },
            status: { $ne: "DISABLED" },
          },
          {
            $set: {
              slug,
              status,
              "theme.decorations": decorations,
              thumbnailUrl,
              ogImageUrl: `${base}/api/og/${slug}`,
            },
            $inc: { rev: 1 },
          },
          { new: true },
        ).lean();
        if (updated) return publishResponse(updated);
        break; // filter did not match: someone else changed the page
      } catch (err) {
        if ((err as { code?: number }).code === 11000) {
          duplicate = true;
          continue;
        }
        throw err;
      }
    }
    if (duplicate) throw new Error("Could not generate a unique slug after 5 attempts");

    const fresh = await Page.findById(page._id).lean();
    if (!fresh) throw Errors.notFound("Page not found.");
    if (fresh.status === "DISABLED") throw Errors.forbidden("This page is disabled by an admin.");
    if (fresh.slug) return publishResponse(fresh);
  }
  throw Errors.conflict("CONFLICT", "The page changed while publishing. Please try again.");
}

async function publishResponse(page: PageLean) {
  const url = `${appUrl()}/w/${page.slug}`;
  const qrCode = await QRCode.toDataURL(url, { width: 512, margin: 1 });
  const status = effectiveStatus(page);
  return {
    slug: page.slug as string,
    url,
    status,
    revealAt: page.revealAt ?? null,
    qrCode,
    ogImage: page.ogImageUrl ?? `${appUrl()}/api/og/${page.slug}`,
    rev: page.rev,
  };
}

// EP-15
export async function unpublishPage(user: UserLean, id: string) {
  const page = await getOwnedPage(id, user);
  if (page.status === "DRAFT") throw Errors.validation("This page has not been published yet.");
  if (page.status === "DISABLED") throw Errors.forbidden("This page is disabled by an admin.");
  const updated = await Page.findOneAndUpdate(
    { _id: page._id, ownerId: user._id, status: { $nin: ["DRAFT", "DISABLED"] } },
    { $set: { status: "UNPUBLISHED" }, $inc: { rev: 1 } },
    { new: true },
  ).lean();
  if (!updated) throw Errors.conflict("CONFLICT", "The page changed. Please try again.");
  return serializeOwnerPage(updated);
}

// EP-16: a duplicate is a fresh draft with no slug, no password and zero stats.
export async function duplicatePage(user: UserLean, id: string) {
  const page = await getOwnedPage(id, user);
  const owned = await Page.countDocuments({ ownerId: user._id });
  if (owned >= PAGE_LIMIT) {
    throw Errors.conflict("PAGE_LIMIT", `You have reached the limit of ${PAGE_LIMIT} pages.`);
  }
  const src = page.toObject() as PageLean;
  const copy = await Page.create({
    ownerId: user._id,
    status: "DRAFT",
    rev: 0,
    draftStep: 1,
    occasion: src.occasion,
    customOccasionLabel: src.customOccasionLabel,
    occasionDate: src.occasionDate,
    revealAt: src.revealAt,
    recipient: src.recipient,
    from: src.from,
    language: src.language,
    messages: src.messages,
    memories: (src.memories ?? []).map((m) => ({ ...m, id: nanoid(8) })),
    media: (src.media ?? []).map((m) => ({ ...m, id: nanoid(8) })),
    theme: src.theme,
    settings: {
      wishesWall: src.settings?.wishesWall ?? true,
      showViews: src.settings?.showViews ?? false,
    },
    stats: { views: 0, uniqueViews: 0, wishes: 0 },
  });
  const out = copy.toObject() as PageLean;
  refreshThumbnail(out);
  await Page.updateOne({ _id: copy._id }, { $set: { thumbnailUrl: out.thumbnailUrl } });
  return serializeOwnerPage({ ...out, thumbnailUrl: out.thumbnailUrl });
}

// EP-17: delete the page with everything that belongs to it, then clean Cloudinary.
export async function deletePage(user: UserLean, id: string) {
  const page = await getOwnedPage(id, user, true);
  const plain = page.toObject() as PageLean;
  const pageId = page._id;

  await withOptionalTransaction(async (session) => {
    const opts = session ? { session } : {};
    await Wish.deleteMany({ pageId }, opts);
    await PageView.deleteMany({ pageId }, opts);
    await PageVisitor.deleteMany({ pageId }, opts);
    await DailyStat.deleteMany({ pageId }, opts);
    await Page.deleteOne({ _id: pageId }, opts);
  });

  await destroyAssets(plain.media ?? [], String(pageId));
  return { id: String(pageId), deleted: true };
}

export { Types };
