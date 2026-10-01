// Profanity filtering for the wishes wall. leo-profanity's built-in English list is
// extended with common Hinglish terms (docs/02 SECTION 1 reconciliation).
import leoProfanity from "leo-profanity";

const HINGLISH_BLOCKLIST = [
  "chutiya",
  "chutiye",
  "chutya",
  "gandu",
  "gaandu",
  "madarchod",
  "madarchood",
  "behenchod",
  "bhosdi",
  "bhosdike",
  "bhosdiwala",
  "harami",
  "haramkhor",
  "kamina",
  "kamine",
  "kutte",
  "kutta",
  "randi",
  "saala",
  "sala",
  "suar",
  "bhadwa",
  "lodu",
  "loda",
  "jhatu",
  "chodu",
];

let loaded = false;
function ensureLoaded() {
  if (loaded) return;
  leoProfanity.add(HINGLISH_BLOCKLIST);
  loaded = true;
}

// True when any blocked word appears in the cleaned text.
export function isProfane(...parts: (string | undefined)[]): boolean {
  ensureLoaded();
  return parts.some((p) => (p ? leoProfanity.check(p) : false));
}

export { HINGLISH_BLOCKLIST };
