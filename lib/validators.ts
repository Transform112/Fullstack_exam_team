// Zod schemas shared by the client forms and the server route handlers
// (docs/02 SECTION 7). Unknown keys are stripped by zod, which also blocks
// mass assignment of ownerId, status, slug and stats.
import { z } from "zod";
import { cleanText } from "./sanitize";

export const OCCASIONS = [
  "BIRTHDAY",
  "ANNIVERSARY",
  "WEDDING",
  "FAREWELL",
  "CONGRATS",
  "FRIENDSHIP",
  "CUSTOM",
] as const;
export const LANGUAGES = ["HINGLISH", "ENGLISH", "HINDI"] as const;
export const MUSIC = ["none", "soft-piano", "happy-pop", "party-beat", "romantic-strings"] as const;
export const DECORATIONS = [
  "balloons",
  "confetti",
  "cake",
  "hearts",
  "petals",
  "sparkles",
  "stars",
] as const;
export const FONTS = ["default", "handwriting"] as const;
export const STATUSES = ["DRAFT", "SCHEDULED", "PUBLISHED", "UNPUBLISHED", "DISABLED"] as const;

export type Occasion = (typeof OCCASIONS)[number];
export type Language = (typeof LANGUAGES)[number];
export type PageStatus = (typeof STATUSES)[number];

const text = (max: number) => z.string().max(max).transform(cleanText);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid colour");

export const registerSchema = z.object({
  name: text(60).refine((v) => v.length >= 2, "Name is too short"),
  email: z.string().trim().toLowerCase().email("Invalid email").max(120),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .regex(/[A-Za-z]/, "Password needs a letter")
    .regex(/[0-9]/, "Password needs a number"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(1, "Password is required").max(72),
});

const memoryInput = z.object({
  id: z.string().max(20).optional(),
  title: text(60).refine((v) => v.length > 0, "Memory title is required"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional(),
  description: text(300).optional(),
  mediaId: z.string().max(20).optional(),
});

export const draftSchema = z.object({
  occasion: z.enum(OCCASIONS).optional(),
  customOccasionLabel: text(40).optional(),
  occasionDate: z.coerce.date().nullable().optional(),
  revealAt: z.coerce.date().nullable().optional(),
  recipient: z
    .object({
      name: text(40).optional(),
      nickname: text(40).optional(),
      relation: text(40).optional(),
      age: z.number().int().min(1).max(120).optional(),
    })
    .optional(),
  from: text(60).optional(),
  language: z.enum(LANGUAGES).optional(),
  messages: z
    .array(text(600))
    .max(5)
    .transform((a) => a.filter((m) => m.length > 0))
    .optional(),
  memories: z.array(memoryInput).max(8).optional(),
  media: z
    .array(
      z.object({
        id: z.string().max(20),
        caption: text(120).optional(),
        order: z.number().int().min(0).max(100).optional(),
      }),
    )
    .max(17)
    .optional(),
  theme: z
    .object({
      templateId: z.string().max(40).optional(),
      accent: hex.optional(),
      font: z.enum(FONTS).optional(),
      music: z.enum(MUSIC).optional(),
      decorations: z.array(z.enum(DECORATIONS)).max(7).optional(),
    })
    .optional(),
  settings: z
    .object({
      password: z.string().min(4).max(50).nullable().optional(),
      wishesWall: z.boolean().optional(),
      showViews: z.boolean().optional(),
    })
    .optional(),
  draftStep: z.number().int().min(1).max(6).optional(),
});

export const patchSchema = draftSchema.extend({ rev: z.number().int().min(0) });

// Checked against the STORED page document at publish time.
export const publishSchema = z
  .object({
    occasion: z.enum(OCCASIONS, { required_error: "Choose an occasion" }),
    customOccasionLabel: z.string().optional(),
    recipient: z.object(
      { name: z.string().trim().min(1, "Add the recipient name").max(40) },
      { required_error: "Add the recipient name" },
    ),
    messages: z.array(z.string().trim().min(1).max(600)).min(1, "Add at least 1 message").max(5),
    memories: z.array(memoryInput).max(8),
    media: z
      .array(z.object({ type: z.enum(["image", "video"]) }))
      .max(17)
      .refine((m) => m.some((item) => item.type === "image"), "Add at least 1 photo")
      .refine(
        (m) => m.filter((item) => item.type === "image").length <= 15,
        "Use at most 15 photos",
      )
      .refine((m) => m.filter((item) => item.type === "video").length <= 2, "Use at most 2 videos"),
    theme: z.object(
      { templateId: z.string().min(1, "Pick a template") },
      { required_error: "Pick a template" },
    ),
  })
  .refine((p) => p.occasion !== "CUSTOM" || !!p.customOccasionLabel?.trim(), {
    message: "Add a name for your custom occasion",
    path: ["customOccasionLabel"],
  });

export const mediaRegisterSchema = z.object({
  pageId: z.string().length(24),
  publicId: z.string().min(1).max(200),
  resourceType: z.enum(["image", "video"]),
  caption: text(120).optional(),
});

export const uploadSignSchema = z.object({ resourceType: z.enum(["image", "video"]) });
export const unlockSchema = z.object({ password: z.string().min(1).max(50) });

export const wishSchema = z.object({
  name: text(40).refine((v) => v.length > 0, "Name is required"),
  message: text(280).refine((v) => v.length > 0, "Message is required"),
  emoji: z.string().max(8).optional(),
});

// Admin bodies (EP-28, EP-30, EP-32, EP-33).
export const adminPageActionSchema = z.object({ action: z.enum(["disable", "enable"]) });
export const adminUserSchema = z.object({ isActive: z.boolean() });
export const adminWishSchema = z.object({ isHidden: z.boolean() });
export const adminTemplateSchema = z.object({ isActive: z.boolean() });

// Bonus AI suggestions (EP-B3).
export const aiMessageSchema = z.object({
  occasion: z.enum(OCCASIONS),
  relation: z.string().max(40).optional(),
  recipientName: z.string().min(1).max(40),
  language: z.enum(LANGUAGES),
  tone: z.enum(["warm", "funny", "emotional"]).optional(),
});
