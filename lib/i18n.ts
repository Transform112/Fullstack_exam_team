// Tiny key-based translation for the generated pages. Keys are flat dotted strings
// and the fallback chain is language -> English -> the key itself.
import en from "@/locales/en.json";
import hinglish from "@/locales/hinglish.json";
import hi from "@/locales/hi.json";

export type Lang = "ENGLISH" | "HINGLISH" | "HINDI";

const dicts: Record<Lang, Record<string, string>> = {
  ENGLISH: en,
  HINGLISH: hinglish,
  HINDI: hi,
};

// Returns the string for the language, falls back to English, then to the key itself.
export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const raw = dicts[lang]?.[key] ?? dicts.ENGLISH[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

// Name shown in greetings: nickname if present, else name.
export function displayName(d: { recipient: { name: string; nickname?: string } }) {
  return d.recipient.nickname?.trim() || d.recipient.name;
}

// Locale used for date formatting.
export const dateLocale = (lang: Lang) => (lang === "HINDI" ? "hi-IN" : "en-IN");
