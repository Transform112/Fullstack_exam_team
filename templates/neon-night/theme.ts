import type { ThemeTokens } from "@/lib/wish-theme";

// Neon Night: party, Gen-Z, nightlife. Space Grotesk stands in for Clash Display, which
// is not on Google Fonts (docs/DECISIONS.md).
export const theme: ThemeTokens = {
  id: "neon-night",
  accentMode: "primary",
  colors: {
    bg: "#0B0420",
    bgAlt: "#120833",
    surface: "#1A0B3A",
    text: "#F8F5FF",
    muted: "#B9A9E6",
    primary: "#FF4FA3",
    secondary: "#22D3EE",
    tertiary: "#A78BFA",
    highlight: "#FBBF24",
  },
  fonts: {
    display: "var(--font-space), var(--font-devanagari), sans-serif",
    body: "var(--font-space), var(--font-devanagari), sans-serif",
    hand: "var(--font-caveat), var(--font-devanagari), cursive",
  },
  decorColors: ["#FF4FA3", "#22D3EE", "#A78BFA", "#FBBF24"],
  variants: {
    intro: "glitch",
    hero: "starfield",
    message: "typewriter",
    timeline: "center-line",
    gallery: "masonry",
    wishes: "glass",
    finale: "neon",
  },
};

export default theme;
