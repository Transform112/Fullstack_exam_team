import { Schema, model, models, type Model } from "mongoose";

// A visual style. Exactly three templates exist: neon-night, pastel-dream, royal-gold.
export type TemplateLean = {
  _id: unknown;
  id: string;
  name: string;
  description: string;
  previewImage: string;
  supportedOccasions: string[];
  defaultPalette: { accent: string; colors: string[] };
  fonts: string[];
  isActive: boolean;
};

const templateSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    previewImage: { type: String, default: "" },
    supportedOccasions: { type: [String], default: [] },
    defaultPalette: {
      accent: { type: String, default: "#FF4FA3" },
      colors: { type: [String], default: [] },
    },
    fonts: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Template =
  (models.Template as Model<TemplateLean>) || model("Template", templateSchema);
