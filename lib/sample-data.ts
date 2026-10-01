// Sample data used by the template gallery, the landing page and preview placeholders.
// The demo Cloudinary URLs are the fallback fixtures documented in docs/02 SECTION 13.
import type { WishPageData, PublicWish } from "./wish-types";
import type { TemplateId } from "./wish-theme";

const DEMO_IMAGES = [
  "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  "https://res.cloudinary.com/demo/image/upload/cld-sample.jpg",
  "https://res.cloudinary.com/demo/image/upload/cld-sample-2.jpg",
  "https://res.cloudinary.com/demo/image/upload/cld-sample-3.jpg",
  "https://res.cloudinary.com/demo/image/upload/cld-sample-4.jpg",
  "https://res.cloudinary.com/demo/image/upload/cld-sample-5.jpg",
];

const ACCENTS: Record<TemplateId, string> = {
  "neon-night": "#FF4FA3",
  "pastel-dream": "#F472B6",
  "royal-gold": "#D4AF37",
};

const MESSAGES: Record<string, string> = {
  ENGLISH: "You are the best, every day without you is boring",
  HINGLISH: "Tu best hai yaar, har din tere bina boring hai",
  HINDI:
    "\u0924\u0941\u092e \u0938\u092c\u0938\u0947 \u0905\u091a\u094d\u091b\u0947 \u0939\u094b, \u0924\u0941\u092e\u094d\u0939\u093e\u0930\u0947 \u092c\u093f\u0928\u093e \u0939\u0930 \u0926\u093f\u0928 \u092b\u0940\u0915\u093e \u0939\u0948",
};

export function SAMPLE_WISH(
  templateId: TemplateId,
  language: "ENGLISH" | "HINGLISH" | "HINDI" = "HINGLISH",
): WishPageData {
  return {
    locked: false,
    slug: "sample",
    occasion: "BIRTHDAY",
    customOccasionLabel: "",
    occasionDate: "2026-10-14T00:00:00.000Z",
    recipient: { name: "Riya", nickname: "Riyu", relation: "Best friend" },
    from: "Arjun & gang",
    language,
    messages: [MESSAGES[language] ?? MESSAGES.HINGLISH],
    memories: [
      {
        id: "m1",
        title: "First day of college",
        date: "2024-07-01",
        description: "",
        mediaId: "i1",
      },
      { id: "m2", title: "Goa trip", date: "2025-12-20", description: "", mediaId: "i2" },
      { id: "m3", title: "Farewell", date: "2026-05-10", description: "", mediaId: "i3" },
    ],
    media: DEMO_IMAGES.map((url, index) => ({
      id: `i${index + 1}`,
      type: "image" as const,
      url,
      w: 1080,
      h: 1350,
      duration: null,
      caption: "",
      order: index,
    })),
    theme: {
      templateId,
      accent: ACCENTS[templateId],
      font: "default",
      music: "none",
      decorations: [],
    },
    settings: { wishesWall: true, showViews: false },
  };
}

export const SAMPLE_WISHES: PublicWish[] = [
  {
    id: "s1",
    name: "Aarav",
    message: "Happy birthday Riya!",
    emoji: "",
    createdAt: new Date().toISOString(),
  },
  {
    id: "s2",
    name: "Meera",
    message: "Best day for the best person",
    emoji: "\u2728",
    createdAt: new Date().toISOString(),
  },
  {
    id: "s3",
    name: "Kabir",
    message: "Party kab hai?",
    emoji: "\u{1F389}",
    createdAt: new Date().toISOString(),
  },
];

export const SAMPLE_PAGE_LINKS = [
  {
    slug: "riya-birthday-7f3a",
    occasion: "Birthday",
    language: "Hinglish",
    template: "Neon Night",
  },
  {
    slug: "kavya-anniversary-2k4m",
    occasion: "Anniversary",
    language: "English",
    template: "Royal Gold",
  },
  {
    slug: "meera-birthday-9p1x",
    occasion: "Birthday",
    language: "Hindi",
    template: "Pastel Dream",
  },
];

export { DEMO_IMAGES, ACCENTS };
