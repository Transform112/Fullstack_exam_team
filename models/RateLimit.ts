import { Schema, model, models, type Model } from "mongoose";

// Fixed-window limiter counters with a TTL index for automatic cleanup.
export type RateLimitLean = {
  _id: unknown;
  key: string;
  count: number;
  expiresAt: Date;
};

const rateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date },
  },
  { timestamps: false },
);

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit =
  (models.RateLimit as Model<RateLimitLean>) || model("RateLimit", rateLimitSchema);
