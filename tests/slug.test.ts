import { describe, expect, it } from "vitest";
import { buildSlug } from "@/lib/slug";

// GEN-1: two pages for the same name and occasion must never share a slug.
describe("buildSlug", () => {
  it("builds slugify(name-occasion) plus a 4 character suffix", () => {
    const slug = buildSlug("Riya", "BIRTHDAY");
    expect(slug).toMatch(/^riya-birthday-[a-z0-9]{4}$/);
  });

  it("produces different slugs for the same input", () => {
    const first = buildSlug("Riya", "BIRTHDAY");
    const second = buildSlug("Riya", "BIRTHDAY");
    expect(first).not.toEqual(second);
  });

  it("keeps a Devanagari-only name out of the slug and still produces a valid one", () => {
    const slug = buildSlug("\u092E\u0940\u0930\u093E", "BIRTHDAY");
    expect(slug).toMatch(/^birthday-[a-z0-9]{4}$/);
    expect(slug).not.toMatch(/[^\x20-\x7E]/);
  });

  it("falls back to 'wish' when neither the name nor the occasion has latin letters", () => {
    const slug = buildSlug(
      "\u092E\u0940\u0930\u093E",
      "\u091C\u0928\u094D\u092E\u0926\u093F\u0928",
    );
    expect(slug).toMatch(/^wish-[a-z0-9]{4}$/);
  });

  it("strips punctuation and spaces", () => {
    const slug = buildSlug("Arjun & gang!", "CONGRATS");
    expect(
      slug.startsWith("arjun-gang-congrats-") || slug.startsWith("arjun-and-gang-congrats-"),
    ).toBe(true);
    expect(slug).not.toMatch(/\s/);
  });
});
