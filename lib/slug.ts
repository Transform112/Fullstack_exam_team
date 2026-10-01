import slugify from "slugify";
import { customAlphabet } from "nanoid";

// Lowercase letters and digits, 4 characters: the public slug suffix.
const suffix = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 4);

// Example: riya-birthday-7f3a. Falls back to "wish" when the name has no latin letters
// (a Hindi-only name slugifies to an empty string).
export function buildSlug(name: string, occasion: string) {
  const base = slugify(`${name} ${occasion}`, { lower: true, strict: true }) || "wish";
  return `${base}-${suffix()}`;
}
