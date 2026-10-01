// Types shared by the public page payload, the templates and the wizard preview.
import type { Language } from "./validators";

export type WishMediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  w: number;
  h: number;
  duration: number | null;
  caption: string;
  order: number;
};

export type WishMemory = {
  id: string;
  title: string;
  date: string;
  description: string;
  mediaId: string;
};

export type WishTheme = {
  templateId: string;
  accent: string;
  font: "default" | "handwriting";
  music: string;
  decorations: string[];
};

// The open payload of EP-18. Every public template and section renders from this.
export type WishPageData = {
  locked: false;
  slug: string;
  occasion: string;
  customOccasionLabel: string;
  occasionDate: string | null;
  recipient: { name: string; nickname: string; relation: string };
  from: string;
  language: Language;
  messages: string[];
  memories: WishMemory[];
  media: WishMediaItem[];
  theme: WishTheme;
  settings: { wishesWall: boolean; showViews: boolean };
  views?: number;
};

export type WishTemplateProps = {
  data: WishPageData;
  // "preview" skips the intro tap gate, music, Lenis and confetti, and shows sample wishes.
  mode: "live" | "preview";
};

// Locked variants of the public payload (EP-18/EP-19).
export type LockedPayload =
  | { locked: true; reason: "SCHEDULED"; recipientFirstName: string; revealAt: string | null }
  | { locked: true; reason: "PASSWORD"; recipientFirstName: string };

export type PublicWish = {
  id: string;
  name: string;
  message: string;
  emoji: string;
  createdAt: string;
};
