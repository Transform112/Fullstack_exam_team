// Per-step client validation for the wizard (docs/03 PHASE 2).
import { z } from "zod";
import { DECORATIONS, LANGUAGES, MUSIC, OCCASIONS } from "./validators";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date");

export const step1Schema = z
  .object({
    occasion: z.enum(OCCASIONS, { required_error: "Choose an occasion" }),
    customOccasionLabel: z.string().max(40).optional(),
    occasionDate: dateString,
    revealEnabled: z.boolean(),
    revealTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional(),
  })
  .refine((d) => d.occasion !== "CUSTOM" || !!d.customOccasionLabel?.trim(), {
    message: "Name your occasion",
    path: ["customOccasionLabel"],
  })
  .refine(
    (d) => {
      if (!d.revealEnabled || !d.occasionDate) return true;
      const at = new Date(`${d.occasionDate}T${d.revealTime ?? "00:00"}:00`).getTime();
      return at > Date.now();
    },
    { message: "Reveal time must be in the future", path: ["revealTime"] },
  );

export const step2Schema = z.object({
  recipient: z.object({
    name: z.string().trim().min(1, "Add the recipient name").max(40, "Keep it under 40 characters"),
    nickname: z.string().trim().max(40, "Keep it under 40 characters").optional(),
    relation: z.string().trim().max(40, "Keep it under 40 characters").optional(),
    age: z.number().int().min(1).max(120).optional(),
  }),
  from: z.string().trim().max(60, "Keep it under 60 characters").optional(),
});

export const step3Schema = z.object({
  language: z.enum(LANGUAGES),
  messages: z
    .array(z.string().max(600, "Keep each message under 600 characters"))
    .min(1)
    .max(5)
    .refine((list) => list.some((m) => m.trim().length > 0), "Write at least one message"),
  memories: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Memory title is required").max(60),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .or(z.literal("")),
        description: z.string().max(300).optional(),
      }),
    )
    .max(8)
    .optional(),
});

export const step4Schema = z.object({
  media: z
    .array(z.object({ type: z.enum(["image", "video"]) }))
    .refine((list) => list.some((m) => m.type === "image"), "Add at least one photo"),
  theme: z.object({ music: z.enum(MUSIC) }),
});

export const step5Schema = z.object({
  theme: z.object({
    templateId: z.string().min(1, "Pick a template"),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid colour"),
    font: z.enum(["default", "handwriting"]),
    decorations: z.array(z.enum(DECORATIONS)),
  }),
  settings: z.object({
    password: z
      .union([z.string().min(4, "Use at least 4 characters").max(50), z.null()])
      .optional(),
    hasPassword: z.boolean(),
    wishesWall: z.boolean(),
    showViews: z.boolean(),
  }),
});

export const step6Schema = z.object({});
