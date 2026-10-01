// Plain-text cleaning for every user string before it is stored (docs/01 rule 3).
// sanitize-html with no allowed tags strips markup and scripts; React then escapes
// the remaining text on render. dangerouslySetInnerHTML is never used.
import sanitizeHtml from "sanitize-html";

export function cleanText(input: string): string {
  if (typeof input !== "string") return "";
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
    .replace(/[ \t\u00a0]+/g, " ")
    .trim();
}

// Array variant used by services that clean lists of strings.
export function cleanTextList(list: string[]): string[] {
  return list.map(cleanText).filter((s) => s.length > 0);
}
