// Wizard state model and the mapping between wizard data and the API bodies
// (docs/03 PHASE 2 "Wizard data model", docs/02 SECTION 12).
import { format } from "date-fns";
import type { OwnerPage } from "./page-helpers";
import type { WishPageData } from "./wish-types";

export type MediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  publicId: string;
  w?: number;
  h?: number;
  duration?: number;
  caption?: string;
  order: number;
};

export type WizardMemory = {
  id?: string;
  title: string;
  date?: string;
  description?: string;
  mediaId?: string;
};

export type WizardData = {
  occasion?: string;
  customOccasionLabel: string;
  occasionDate: string; // yyyy-mm-dd, local date
  revealEnabled: boolean; // client only
  revealTime: string; // HH:mm, client only, default "00:00"
  recipient: { name: string; nickname: string; relation: string; age?: number };
  from: string;
  language: "HINGLISH" | "ENGLISH" | "HINDI";
  messages: string[];
  memories: WizardMemory[];
  media: MediaItem[];
  theme: {
    templateId: string;
    accent: string;
    font: "default" | "handwriting";
    music: string;
    decorations: string[];
  };
  settings: {
    password?: string | null;
    hasPassword: boolean;
    wishesWall: boolean;
    showViews: boolean;
  };
  rev: number;
  draftStep: number;
};

export function emptyWizardData(): WizardData {
  return {
    occasion: undefined,
    customOccasionLabel: "",
    occasionDate: "",
    revealEnabled: false,
    revealTime: "00:00",
    recipient: { name: "", nickname: "", relation: "" },
    from: "",
    language: "ENGLISH",
    messages: [""],
    memories: [],
    media: [],
    theme: { templateId: "", accent: "#FF4FA3", font: "default", music: "none", decorations: [] },
    settings: { password: undefined, hasPassword: false, wishesWall: true, showViews: false },
    rev: 0,
    draftStep: 1,
  };
}

// Converts a serializeOwnerPage result into wizard state.
export function fromServerPage(page: OwnerPage): WizardData {
  const base = emptyWizardData();
  const revealAt = page.revealAt ? new Date(page.revealAt) : null;
  return {
    ...base,
    occasion: page.occasion ?? undefined,
    customOccasionLabel: page.customOccasionLabel ?? "",
    occasionDate: page.occasionDate ? format(new Date(page.occasionDate), "yyyy-MM-dd") : "",
    revealEnabled: !!revealAt,
    revealTime: revealAt ? format(revealAt, "HH:mm") : "00:00",
    recipient: {
      name: page.recipient?.name ?? "",
      nickname: page.recipient?.nickname ?? "",
      relation: page.recipient?.relation ?? "",
      ...(page.recipient?.age ? { age: page.recipient.age } : {}),
    },
    from: page.from ?? "",
    language: page.language as WizardData["language"],
    messages: page.messages?.length ? page.messages : [""],
    memories: (page.memories ?? []).map((m) => ({
      id: m.id,
      title: m.title,
      date: m.date || undefined,
      description: m.description || undefined,
      mediaId: m.mediaId || undefined,
    })),
    media: (page.media ?? []).map((m) => ({
      id: m.id,
      type: m.type,
      url: m.url,
      publicId: m.publicId,
      w: m.w,
      h: m.h,
      duration: m.duration ?? undefined,
      caption: m.caption,
      order: m.order,
    })),
    theme: {
      templateId: page.theme?.templateId ?? "",
      accent: page.theme?.accent ?? "#FF4FA3",
      font: (page.theme?.font as "default" | "handwriting") ?? "default",
      music: page.theme?.music ?? "none",
      decorations: page.theme?.decorations ?? [],
    },
    settings: {
      password: undefined,
      hasPassword: !!page.settings?.hasPassword,
      wishesWall: page.settings?.wishesWall ?? true,
      showViews: page.settings?.showViews ?? false,
    },
    rev: page.rev ?? 0,
    draftStep: page.draftStep ?? 1,
  };
}

const clean = (s: string | undefined) => {
  const v = (s ?? "").trim();
  return v.length ? v : undefined;
};

// Builds the EP-10 body for one wizard step. Empty optional strings are omitted so a
// step never clears a field the creator filled in earlier.
export function toPatchBody(data: WizardData, step: number): Record<string, unknown> {
  const body: Record<string, unknown> = { rev: data.rev, draftStep: step };

  if (step === 1) {
    if (data.occasion) body.occasion = data.occasion;
    const custom = clean(data.customOccasionLabel);
    if (custom !== undefined) body.customOccasionLabel = custom;
    if (data.occasionDate) {
      body.occasionDate = new Date(`${data.occasionDate}T00:00:00`).toISOString();
      body.revealAt =
        data.revealEnabled && data.revealTime
          ? new Date(`${data.occasionDate}T${data.revealTime}:00`).toISOString()
          : null;
    }
  }

  if (step === 2) {
    const recipient: Record<string, unknown> = {};
    const name = clean(data.recipient.name);
    if (name !== undefined) recipient.name = name;
    const nickname = clean(data.recipient.nickname);
    if (nickname !== undefined) recipient.nickname = nickname;
    const relation = clean(data.recipient.relation);
    if (relation !== undefined) recipient.relation = relation;
    if (typeof data.recipient.age === "number" && !Number.isNaN(data.recipient.age)) {
      recipient.age = data.recipient.age;
    }
    if (Object.keys(recipient).length) body.recipient = recipient;
    const from = clean(data.from);
    if (from !== undefined) body.from = from;
  }

  if (step === 3) {
    body.language = data.language;
    body.messages = data.messages.map((m) => m.trim()).filter((m) => m.length > 0);
    body.memories = data.memories
      .filter((m) => m.title.trim().length > 0)
      .map((m) => ({
        ...(m.id ? { id: m.id } : {}),
        title: m.title.trim(),
        ...(m.date ? { date: m.date } : {}),
        ...(clean(m.description) ? { description: m.description!.trim() } : {}),
        ...(m.mediaId ? { mediaId: m.mediaId } : {}),
      }));
  }

  if (step === 4) {
    body.theme = { music: data.theme.music };
    if (data.media.length) {
      body.media = data.media.map((m, index) => ({
        id: m.id,
        caption: clean(m.caption) ?? "",
        order: index,
      }));
    }
  }

  if (step === 5) {
    body.theme = {
      templateId: data.theme.templateId,
      accent: data.theme.accent,
      font: data.theme.font,
      decorations: data.theme.decorations,
    };
    const settings: Record<string, unknown> = {
      wishesWall: data.settings.wishesWall,
      showViews: data.settings.showViews,
    };
    if (data.settings.password === null) settings.password = null;
    else if (data.settings.password) settings.password = data.settings.password;
    body.settings = settings;
  }

  return body;
}

// Draft-valid subset used by autosave: it must be able to save an incomplete draft.
export function toAutosaveBody(data: WizardData): Record<string, unknown> {
  const body: Record<string, unknown> = { rev: data.rev, draftStep: data.draftStep };
  if (data.occasion) body.occasion = data.occasion;
  if (data.customOccasionLabel.trim()) body.customOccasionLabel = data.customOccasionLabel.trim();
  if (data.occasionDate) {
    body.occasionDate = new Date(`${data.occasionDate}T00:00:00`).toISOString();
    body.revealAt =
      data.revealEnabled && data.revealTime
        ? new Date(`${data.occasionDate}T${data.revealTime}:00`).toISOString()
        : null;
  }
  body.recipient = {
    name: data.recipient.name.trim(),
    nickname: data.recipient.nickname.trim(),
    relation: data.recipient.relation.trim(),
  };
  body.from = data.from.trim();
  body.language = data.language;
  body.messages = data.messages.map((m) => m.trim()).filter((m) => m.length > 0);
  body.memories = data.memories
    .filter((m) => m.title.trim().length > 0)
    .map((m) => ({
      ...(m.id ? { id: m.id } : {}),
      title: m.title.trim(),
      ...(m.date ? { date: m.date } : {}),
      ...(m.description?.trim() ? { description: m.description.trim() } : {}),
      ...(m.mediaId ? { mediaId: m.mediaId } : {}),
    }));
  body.theme = {
    ...(data.theme.templateId ? { templateId: data.theme.templateId } : {}),
    accent: data.theme.accent,
    font: data.theme.font,
    music: data.theme.music,
    decorations: data.theme.decorations,
  };
  const settings: Record<string, unknown> = {
    wishesWall: data.settings.wishesWall,
    showViews: data.settings.showViews,
  };
  if (data.settings.password) settings.password = data.settings.password;
  else if (data.settings.password === null) settings.password = null;
  body.settings = settings;
  return body;
}

// Converts wizard state into the public payload shape so the preview can render the
// real template before anything is published.
export function toPreviewData(data: WizardData): WishPageData {
  const firstImage = data.media.find((m) => m.type === "image");
  const placeholderImage = firstImage
    ? null
    : {
        id: "placeholder",
        type: "image" as const,
        url: "https://res.cloudinary.com/demo/image/upload/cld-sample.jpg",
        w: 1080,
        h: 1350,
        duration: null,
        caption: "",
        order: 0,
      };
  const media = [
    ...data.media.map((m) => ({
      id: m.id,
      type: m.type,
      url: m.url,
      w: m.w ?? 1080,
      h: m.h ?? 1350,
      duration: m.duration ?? null,
      caption: m.caption ?? "",
      order: m.order,
    })),
    ...(placeholderImage ? [placeholderImage] : []),
  ];
  const messages = data.messages.map((m) => m.trim()).filter((m) => m.length > 0);
  return {
    locked: false,
    slug: "preview",
    occasion: data.occasion ?? "BIRTHDAY",
    customOccasionLabel: data.customOccasionLabel,
    occasionDate: data.occasionDate
      ? new Date(`${data.occasionDate}T00:00:00`).toISOString()
      : null,
    recipient: {
      name: data.recipient.name.trim() || "Your Friend",
      nickname: data.recipient.nickname.trim(),
      relation: data.recipient.relation.trim(),
    },
    from: data.from.trim(),
    language: data.language,
    messages: messages.length ? messages : ["Your message will appear here..."],
    memories: data.memories
      .filter((m) => m.title.trim().length > 0)
      .map((m, i) => ({
        id: m.id ?? `preview-memory-${i}`,
        title: m.title.trim(),
        date: m.date ?? "",
        description: m.description ?? "",
        mediaId: m.mediaId ?? "",
      })),
    media,
    theme: {
      templateId: data.theme.templateId || "neon-night",
      accent: data.theme.accent,
      font: data.theme.font,
      music: data.theme.music,
      decorations: data.theme.decorations,
    },
    settings: { wishesWall: data.settings.wishesWall, showViews: false },
  };
}

export const STEPS = [
  { key: 1, label: "Occasion" },
  { key: 2, label: "Recipient" },
  { key: 3, label: "Words" },
  { key: 4, label: "Media" },
  { key: 5, label: "Style" },
  { key: 6, label: "Review" },
] as const;
