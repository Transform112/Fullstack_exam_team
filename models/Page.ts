import { Schema, model, models, type Model, type Types } from "mongoose";

export type MediaItemLean = {
  id: string;
  type: "image" | "video";
  url: string;
  publicId: string;
  w?: number;
  h?: number;
  duration?: number | null;
  caption?: string;
  order: number;
};

export type MemoryLean = {
  id: string;
  title: string;
  date?: string;
  description?: string;
  mediaId?: string;
};

export type PageLean = {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  slug?: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "UNPUBLISHED" | "DISABLED";
  rev: number;
  disabledFromStatus?: string;
  draftStep: number;
  occasion?: string;
  customOccasionLabel?: string;
  occasionDate?: Date | null;
  revealAt?: Date | null;
  recipient: { name: string; nickname: string; relation: string; age?: number };
  from: string;
  language: string;
  messages: string[];
  memories: MemoryLean[];
  media: MediaItemLean[];
  theme: {
    templateId: string;
    accent: string;
    font: "default" | "handwriting";
    music: string;
    decorations: string[];
  };
  settings: { passwordHash?: string; wishesWall: boolean; showViews: boolean };
  ogImageUrl?: string;
  thumbnailUrl?: string;
  stats: { views: number; uniqueViews: number; wishes: number };
  deploy?: {
    provider?: string;
    deploymentId?: string;
    url?: string;
    state?: string;
    lastDeployedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
};

const memorySchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, maxlength: 60 },
    date: { type: String, default: "" },
    description: { type: String, default: "", maxlength: 300 },
    mediaId: { type: String, default: "" },
  },
  { _id: false },
);

const mediaSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    w: { type: Number, default: 0 },
    h: { type: Number, default: 0 },
    duration: { type: Number, default: null },
    caption: { type: String, default: "", maxlength: 120 },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const pageSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Absent (never null) until the first publish; the unique index is partial so many
    // drafts without a slug can coexist.
    slug: { type: String },
    status: {
      type: String,
      enum: ["DRAFT", "SCHEDULED", "PUBLISHED", "UNPUBLISHED", "DISABLED"],
      default: "DRAFT",
      index: true,
    },
    rev: { type: Number, default: 0 },
    disabledFromStatus: { type: String },
    draftStep: { type: Number, default: 1 },
    occasion: {
      type: String,
      enum: ["BIRTHDAY", "ANNIVERSARY", "WEDDING", "FAREWELL", "CONGRATS", "FRIENDSHIP", "CUSTOM"],
    },
    customOccasionLabel: { type: String, default: "", maxlength: 40 },
    occasionDate: { type: Date, default: null },
    revealAt: { type: Date, default: null },
    recipient: {
      name: { type: String, default: "", maxlength: 40 },
      nickname: { type: String, default: "", maxlength: 40 },
      relation: { type: String, default: "", maxlength: 40 },
      age: { type: Number },
    },
    from: { type: String, default: "", maxlength: 60 },
    language: { type: String, enum: ["HINGLISH", "ENGLISH", "HINDI"], default: "ENGLISH" },
    messages: { type: [String], default: [] },
    memories: { type: [memorySchema], default: [] },
    media: { type: [mediaSchema], default: [] },
    theme: {
      templateId: { type: String, default: "" },
      accent: { type: String, default: "#FF4FA3" },
      font: { type: String, enum: ["default", "handwriting"], default: "default" },
      music: { type: String, default: "none" },
      decorations: { type: [String], default: [] },
    },
    settings: {
      passwordHash: { type: String },
      wishesWall: { type: Boolean, default: true },
      showViews: { type: Boolean, default: false },
    },
    ogImageUrl: { type: String },
    thumbnailUrl: { type: String },
    stats: {
      views: { type: Number, default: 0 },
      uniqueViews: { type: Number, default: 0 },
      wishes: { type: Number, default: 0 },
    },
    deploy: {
      provider: { type: String },
      deploymentId: { type: String },
      url: { type: String },
      state: { type: String },
      lastDeployedAt: { type: Date },
    },
  },
  { timestamps: true },
);

pageSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { slug: { $type: "string" } } },
);
pageSchema.index({ ownerId: 1, createdAt: -1 });

export const Page = (models.Page as Model<PageLean>) || model("Page", pageSchema);
