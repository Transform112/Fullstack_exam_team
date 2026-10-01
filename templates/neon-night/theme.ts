import type { ThemeTokens } from "@/lib/wish-theme";

// Royal Gold: elegant, anniversary and wedding. Gold stays fixed as the identity
// colour; the creator accent replaces the highlight colour.
export const theme: ThemeTokens = {
  id: "royal-gold",
  accentMode: "highlight",
  colors: {
    bg: "#0E0E10",
    bgAlt: "#16130F",
    surface: "#1C1813",
    text: "#F5E6C8",
    muted: "#B8A57C",
    primary: "#D4AF37",
    secondary: "#F5E6C8",
    tertiary: "#7F1D1D",
    highlight: "#7F1D1D",
  },
  fonts: {
    display: "var(--font-playfair), var(--font-devanagari), serif",
    body: "var(--font-cormorant), var(--font-devanagari), serif",
    hand: "var(--font-caveat), var(--font-devanagari), cursive",
  },
  decorColors: ["#7F1D1D", "#D4AF37", "#F5E6C8", "#A52A2A"],
  variants: {
    intro: "envelope",
    hero: "gold-frame",
    message: "typewriter",
    timeline: "gold-medallion",
    gallery: "carousel3d",
    wishes: "ivory",
    finale: "gold",
  },
};

export default theme;
