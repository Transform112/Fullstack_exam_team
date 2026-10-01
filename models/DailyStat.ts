import { Schema, model, models, type Model, type Types } from "mongoose";

// Per-page per-UTC-day view counter that feeds the insights chart.
export type DailyStatLean = {
  _id: Types.ObjectId;
  pageId: Types.ObjectId;
  date: string;
  views: number;
};

const dailyStatSchema = new Schema({
  pageId: { type: Schema.Types.ObjectId, ref: "Page", required: true },
  date: { type: String, required: true },
  views: { type: Number, default: 0 },
});

dailyStatSchema.index({ pageId: 1, date: 1 }, { unique: true });

export const DailyStat =
  (models.DailyStat as Model<DailyStatLean>) || model("DailyStat", dailyStatSchema);
