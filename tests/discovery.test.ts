import { describe, expect, it } from "vitest";
import { HELP_ARTICLES, normalizeSearch, searchHelp } from "@/components/app/guides/help";
import { findOccasion } from "@/components/app/guides/occasions";

describe("help discovery", () => {
  it("finds an answer from words in its explanation, ignoring case and extra spaces", () => {
    const result = searchHelp("  QR   code  ", "All questions");
    expect(result.map((article) => article.id)).toContain("share");
  });

  it("combines the chosen topic with the search instead of ignoring either", () => {
    expect(searchHelp("password", "Sharing & privacy").map((article) => article.id)).toContain("password");
    expect(searchHelp("password", "Writing & media")).toEqual([]);
  });

  it("returns an honest empty result for an unknown query and restores all articles when reset", () => {
    expect(searchHelp("unfindable-string-xyz", "All questions")).toEqual([]);
    expect(searchHelp("", "All questions")).toEqual(HELP_ARTICLES);
  });

  it("normalizes accents and whitespace for forgiving search", () => {
    expect(normalizeSearch("  MÉMORIES  ")).toBe("memories");
  });
});

describe("occasion route selection", () => {
  it("resolves the matching guide without silently substituting another occasion", () => {
    expect(findOccasion("anniversary")?.name).toBe("Anniversaries");
    expect(findOccasion("not-a-guide")).toBeUndefined();
    expect(findOccasion("constructor")).toBeUndefined();
  });
});
