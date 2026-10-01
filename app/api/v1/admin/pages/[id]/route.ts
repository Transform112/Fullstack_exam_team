// EP-28 PATCH /admin/pages/:id - admin disable/enable of any page.
import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { ok, parseBody, route } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { serializeCard } from "@/lib/page-helpers";
import { adminPageActionSchema } from "@/lib/validators";
import { Page, type PageLean } from "@/models/Page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

export const PATCH = route<Params>(async (req: NextRequest, ctx) => {
  await requireAdmin();
  await connectDB();

  const { action } = await parseBody(req, adminPageActionSchema);
  const { id } = ctx.params;
  if (!Types.ObjectId.isValid(id)) throw Errors.notFound("Page not found.");

  const page = (await Page.findById(id).lean()) as PageLean | null;
  if (!page) throw Errors.notFound("Page not found.");

  if (action === "disable") {
    // A repeated disable must keep the status saved the first time, so the write is
    // guarded by status != DISABLED and only bumps rev when the state really changes.
    if (page.status === "DISABLED")
      return ok(serializeCard(page), "This page is already disabled.");

    const updated = (await Page.findOneAndUpdate(
      { _id: page._id, status: { $ne: "DISABLED" } },
      { $set: { status: "DISABLED", disabledFromStatus: page.status }, $inc: { rev: 1 } },
      { new: true },
    ).lean()) as PageLean | null;

    if (!updated) {
      const current = (await Page.findById(page._id).lean()) as PageLean | null;
      if (!current) throw Errors.notFound("Page not found.");
      return ok(serializeCard(current), "This page is already disabled.");
    }
    return ok(serializeCard(updated), "Page disabled.");
  }

  if (page.status !== "DISABLED") return ok(serializeCard(page), "This page is already active.");

  // DRAFT and UNPUBLISHED come back exactly as they were; only a previously
  // live/scheduled page is recomputed, so enabling never leaks a draft publicly.
  const from = (page.disabledFromStatus ?? "DRAFT") as PageLean["status"];
  const restored: PageLean["status"] =
    from === "SCHEDULED" || from === "PUBLISHED"
      ? page.revealAt && new Date(page.revealAt).getTime() > Date.now()
        ? "SCHEDULED"
        : "PUBLISHED"
      : from;

  const updated = (await Page.findOneAndUpdate(
    { _id: page._id, status: "DISABLED", rev: page.rev },
    { $set: { status: restored }, $unset: { disabledFromStatus: "" }, $inc: { rev: 1 } },
    { new: true },
  ).lean()) as PageLean | null;

  if (!updated) {
    const current = (await Page.findById(page._id).lean()) as PageLean | null;
    if (!current) throw Errors.notFound("Page not found.");
    return ok(serializeCard(current), "This page state was already updated.");
  }
  return ok(serializeCard(updated), "Page enabled.");
});
