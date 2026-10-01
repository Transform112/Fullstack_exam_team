import { describe, expect, it } from "vitest";
import enJson from "@/locales/en.json";
import hiJson from "@/locales/hi.json";
import hinglishJson from "@/locales/hinglish.json";
import { translate } from "@/lib/i18n";

// Widened to a plain dictionary so the per-occasion loop can index dynamic keys.
const en = enJson as Record<string, string>;
const hi = hiJson as Record<string, string>;
const hinglish = hinglishJson as Record<string, string>;

// LANG-1 / UI-01: the three locale files must contain exactly the same key set, and the
// translation helper must fall back from the language to English and then to the key.
describe("locale files", () => {
  const enKeys = Object.keys(en).sort();

  it("have identical key sets", () => {
    expect(Object.keys(hinglish).sort()).toEqual(enKeys);
    expect(Object.keys(hi).sort()).toEqual(enKeys);
  });

  it("contain no empty strings", () => {
    for (const [key, value] of Object.entries(en)) expect(value, key).not.toBe("");
    for (const [key, value] of Object.entries(hinglish)) expect(value, key).not.toBe("");
    for (const [key, value] of Object.entries(hi)) expect(value, key).not.toBe("");
  });

  it("cover every occasion greeting and sub line", () => {
    for (const occasion of [
      "BIRTHDAY",
      "ANNIVERSARY",
      "WEDDING",
      "FAREWELL",
      "CONGRATS",
      "FRIENDSHIP",
      "CUSTOM",
    ]) {
      expect(en[`hero.greeting.${occasion}`]).toBeTruthy();
      expect(en[`hero.sub.${occasion}`]).toBeTruthy();
    }
  });
});

describe("translate", () => {
  it("returns the string for the requested language", () => {
    expect(translate("HINDI", "intro.tap")).toBe(hi["intro.tap"]);
    expect(translate("HINGLISH", "intro.tap")).toBe(hinglish["intro.tap"]);
    expect(translate("ENGLISH", "intro.tap")).toBe(en["intro.tap"]);
  });

  it("interpolates variables", () => {
    expect(translate("ENGLISH", "finale.closing", { name: "Riya" })).toContain("Riya");
    expect(translate("ENGLISH", "footer.views", { n: 47 })).toBe("47 views");
  });

  it("falls back to the key itself when it is missing", () => {
    expect(translate("ENGLISH", "does.not.exist")).toBe("does.not.exist");
  });

  it("renders the lock screen copy in English because the locked payload has no language", () => {
    expect(translate("ENGLISH", "lock.teaser", { name: "Dev" })).toBe(
      "Something special is coming for Dev...",
    );
  });
});
