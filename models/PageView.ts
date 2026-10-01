import { Schema, model, models, type Model, type Types } from "mongoose";

// One dedupe lease per visitor per page. A successful claim inside the 30 minute window
// is the only way a view is counted; TTL deletion is asynchronous and never decides
// eligibility (lastCountedAt does).
export type PageViewLean = {
  _id: Types.ObjectId;
  pageId: Types.ObjectId;
  visitorId: string;
  lastCountedAt: Date;
  expiresAt: Date;
};

const pageViewSchema = new Schema({
  pageId: { type: Schema.Types.ObjectId, ref: "Page", required: true },
  visitorId: { type: String, required: true },
  lastCountedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
});

pageViewSchema.index({ pageId: 1, visitorId: 1 }, { unique: true });
pageViewSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PageView =
  (models.PageView as Model<PageViewLean>) || model("PageView", pageViewSchema);
