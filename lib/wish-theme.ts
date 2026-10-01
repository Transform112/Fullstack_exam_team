// Theme tokens for the three templates (docs/04 SECTION 3.2).
export type TemplateId = "neon-night" | "pastel-dream" | "royal-gold";

export type ThemeTokens = {
  id: TemplateId;
  // "primary": the creator accent replaces colors.primary. "highlight": it replaces
  // colors.highlight and the template keeps its identity colour as primary.
  accentMode: "primary" | "highlight";
  colors: {
    bg: string;
    bgAlt: string;
    surface: string;
    text: string;
    muted: string;
    primary: string;
    secondary: string;
    tertiary: string;
    highlight: string;
  };
  fonts: { display: string; body: string; hand: string };
  decorColors: string[];
  variants: {
    intro: "glitch" | "balloons" | "envelope";
    hero: "starfield" | "bokeh" | "gold-frame";
    message: "typewriter" | "word-fade";
    timeline: "center-line" | "doodle-path" | "gold-medallion";
    gallery: "masonry" | "polaroid" | "carousel3d";
    wishes: "glass" | "sticky" | "ivory";
    finale: "neon" | "pastel" | "gold";
  };
};

// Returns a copy of the tokens with the creator's accent colour applied.
export function withAccent(t: ThemeTokens, accent: string): ThemeTokens {
  const colors = { ...t.colors };
  if (t.accentMode === "primary") colors.primary = accent;
  else colors.highlight = accent;
  return { ...t, colors };
}

export type SectionProps = {
  data: import("./wish-types").WishPageData;
  tokens: ThemeTokens;
};
