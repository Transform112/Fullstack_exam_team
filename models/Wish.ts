import { Schema, model, models, type Model, type Types } from "mongoose";

// A visitor's wish on a page. ipHash is stored hashed and never returned publicly.
export type WishLean = {
  _id: Types.ObjectId;
  pageId: Types.ObjectId;
  name: string;
  message: string;
  emoji: string;
  visitorId: string;
  ipHash: string;
  isHidden: boolean;
  createdAt: Date;
};

const wishSchema = new Schema(
  {
    pageId: { type: Schema.Types.ObjectId, ref: "Page", required: true, index: true },
    name: { type: String, default: "", maxlength: 40 },
    message: { type: String, default: "", maxlength: 280 },
    emoji: { type: String, default: "", maxlength: 8 },
    visitorId: { type: String, default: "" },
    ipHash: { type: String, default: "" },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

wishSchema.index({ pageId: 1, createdAt: -1 });

export const Wish = (models.Wish as Model<WishLean>) || model("Wish", wishSchema);

// Public shape: never exposes ipHash or visitorId.
export function publicWish(w: WishLean) {
  return {
    id: String(w._id),
    name: w.name,
    message: w.message,
    emoji: w.emoji,
    createdAt: w.createdAt,
  };
}
