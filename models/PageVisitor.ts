import { Schema, model, models, type Model, type Types } from "mongoose";

// Lifetime unique visitors per page. No TTL: it stays after the 30 minute lease expires
// so uniqueViews is independent of the view-dedupe window.
export type PageVisitorLean = {
  _id: Types.ObjectId;
  pageId: Types.ObjectId;
  visitorId: string;
  createdAt: Date;
};

const pageVisitorSchema = new Schema(
  {
    pageId: { type: Schema.Types.ObjectId, ref: "Page", required: true },
    visitorId: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

pageVisitorSchema.index({ pageId: 1, visitorId: 1 }, { unique: true });

export const PageVisitor =
  (models.PageVisitor as Model<PageVisitorLean>) || model("PageVisitor", pageVisitorSchema);
