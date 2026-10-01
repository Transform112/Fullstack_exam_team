import { describe, expect, it } from "vitest";
import { cleanText } from "@/lib/sanitize";
import { isProfane } from "@/lib/profanity";
import {
  draftSchema,
  loginSchema,
  patchSchema,
  publishSchema,
  registerSchema,
  wishSchema,
} from "@/lib/validators";

// Rule 3: every user string is cleaned on write and rendered as React text.
describe("cleanText", () => {
  it("strips html and script payloads", () => {
    expect(cleanText("Hello <b>Riya</b>")).toBe("Hello Riya");
    // sanitize-html removes the script element together with its text content.
    expect(cleanText("<script>alert(1)</script>hi")).toBe("hi");
    expect(cleanText("a &amp; b")).toBe("a &amp; b");
  });

  it("collapses whitespace and trims", () => {
    expect(cleanText("  too   many    spaces  ")).toBe("too many spaces");
  });

  it("keeps Devanagari text intact", () => {
    expect(
      cleanText("\u092E\u0940\u0930\u093E \u0915\u093E \u091C\u0928\u094D\u092E\u0926\u093F\u0928"),
    ).toBe("\u092E\u0940\u0930\u093E \u0915\u093E \u091C\u0928\u094D\u092E\u0926\u093F\u0928");
  });
});

describe("auth schemas", () => {
  it("rejects a weak password and keeps the same message for both login failures", () => {
    expect(
      registerSchema.safeParse({ name: "Test", email: "a@b.com", password: "short" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ name: "Test", email: "a@b.com", password: "Test1234" }).success,
    ).toBe(true);
    expect(loginSchema.safeParse({ email: "A@B.com", password: "x" }).success).toBe(true);
  });

  it("normalizes the email to lowercase", () => {
    const parsed = loginSchema.parse({ email: " Mixed@Case.COM ", password: "secret" });
    expect(parsed.email).toBe("mixed@case.com");
  });
});

describe("draft and patch schemas", () => {
  it("strips unknown keys so status, slug and ownerId cannot be mass assigned", () => {
    const parsed = draftSchema.parse({
      occasion: "BIRTHDAY",
      status: "PUBLISHED",
      slug: "hack",
      ownerId: "64b7f0c2f1a2b3c4d5e6f7a8",
      stats: { views: 9999 },
    }) as Record<string, unknown>;
    expect(parsed.occasion).toBe("BIRTHDAY");
    expect(parsed.status).toBeUndefined();
    expect(parsed.slug).toBeUndefined();
    expect(parsed.ownerId).toBeUndefined();
    expect(parsed.stats).toBeUndefined();
  });

  it("cleans message text and drops empty messages", () => {
    const parsed = draftSchema.parse({ messages: ["Hello <b>Riya</b>", "   "] });
    expect(parsed.messages).toEqual(["Hello Riya"]);
  });

  it("requires a non negative revision on patch", () => {
    expect(patchSchema.safeParse({ occasion: "BIRTHDAY" }).success).toBe(false);
    expect(patchSchema.safeParse({ rev: 0 }).success).toBe(true);
  });

  it("accepts a password of 4 to 50 characters and null to remove it", () => {
    expect(draftSchema.safeParse({ settings: { password: "abcd" } }).success).toBe(true);
    expect(draftSchema.safeParse({ settings: { password: "abc" } }).success).toBe(false);
    expect(draftSchema.safeParse({ settings: { password: null } }).success).toBe(true);
  });
});

// GEN-1 / rules 1 and 2: what is required to publish.
describe("publishSchema", () => {
  const base = {
    occasion: "BIRTHDAY",
    recipient: { name: "Riya" },
    messages: ["Hello"],
    memories: [],
    media: [{ type: "image" as const }],
    theme: { templateId: "neon-night" },
  };

  it("accepts a complete page", () => {
    expect(publishSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a page with no photo", () => {
    const result = publishSchema.safeParse({ ...base, media: [] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("Add at least 1 photo");
  });

  it("rejects 16 photos and 3 videos", () => {
    const tooManyImages = publishSchema.safeParse({
      ...base,
      media: Array.from({ length: 16 }, () => ({ type: "image" as const })),
    });
    expect(tooManyImages.success).toBe(false);
    const tooManyVideos = publishSchema.safeParse({
      ...base,
      media: [
        { type: "image" as const },
        ...Array.from({ length: 3 }, () => ({ type: "video" as const })),
      ],
    });
    expect(tooManyVideos.success).toBe(false);
  });

  it("requires a message, a name and a custom occasion label when CUSTOM", () => {
    expect(publishSchema.safeParse({ ...base, messages: [] }).success).toBe(false);
    expect(publishSchema.safeParse({ ...base, recipient: { name: "" } }).success).toBe(false);
    expect(publishSchema.safeParse({ ...base, occasion: "CUSTOM" }).success).toBe(false);
    expect(
      publishSchema.safeParse({ ...base, occasion: "CUSTOM", customOccasionLabel: "Graduation" })
        .success,
    ).toBe(true);
  });
});

describe("wishSchema", () => {
  it("limits the message to 280 characters and requires both fields", () => {
    expect(wishSchema.safeParse({ name: "Aarav", message: "Happy birthday!" }).success).toBe(true);
    expect(wishSchema.safeParse({ name: "", message: "Hi" }).success).toBe(false);
    expect(wishSchema.safeParse({ name: "Aarav", message: "x".repeat(281) }).success).toBe(false);
  });
});

// PAGE-5: the profanity filter covers English and Hinglish terms.
describe("isProfane", () => {
  it("flags a blocked Hinglish word", () => {
    expect(isProfane("kutta", "nice wish")).toBe(true);
  });

  it("allows a normal wish", () => {
    expect(isProfane("Aarav", "Happy birthday Riya!")).toBe(false);
  });
});
