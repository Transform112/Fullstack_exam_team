// Default decorations per occasion, used when theme.decorations is empty at publish
// time (docs/02 SECTION 5) or when the public payload carries none.
export const DEFAULT_DECORATIONS: Record<string, string[]> = {
  BIRTHDAY: ["balloons", "confetti", "cake"],
  ANNIVERSARY: ["hearts", "petals"],
  WEDDING: ["petals", "hearts", "sparkles"],
  FAREWELL: ["stars", "sparkles"],
  CONGRATS: ["confetti", "stars"],
  FRIENDSHIP: ["balloons", "stars", "hearts"],
  CUSTOM: ["sparkles"],
};

export function decorationsFor(occasion: string | undefined, stored: string[] | undefined) {
  if (stored && stored.length > 0) return stored;
  return DEFAULT_DECORATIONS[occasion ?? "CUSTOM"] ?? DEFAULT_DECORATIONS.CUSTOM;
}

// Human label for an occasion, used by the dashboard chips and the wizard.
export const OCCASION_LABELS: Record<string, string> = {
  BIRTHDAY: "Birthday",
  ANNIVERSARY: "Anniversary",
  WEDDING: "Wedding",
  FAREWELL: "Farewell",
  CONGRATS: "Congratulations",
  FRIENDSHIP: "Friendship Day",
  CUSTOM: "Custom",
};

export function occasionLabel(occasion: string | undefined, customLabel?: string) {
  if (occasion === "CUSTOM") return customLabel?.trim() || "Surprise";
  return OCCASION_LABELS[occasion ?? ""] ?? "Occasion";
}
