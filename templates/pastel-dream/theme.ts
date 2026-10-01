import type { ThemeTokens } from "@/lib/wish-theme";

// Pastel Dream: soft, cute, playful. Fredoka display, Quicksand body, Caveat hand.
export const theme: ThemeTokens = {
  id: "pastel-dream",
  accentMode: "primary",
  colors: {
    bg: "#FFF1F5",
    bgAlt: "#FFFFFF",
    surface: "#FFFFFF",
    text: "#4A2B4F",
    muted: "#8B6B93",
    primary: "#F472B6",
    secondary: "#C4B5FD",
    tertiary: "#FDE68A",
    highlight: "#FBCFE8",
  },
  fonts: {
    display: "var(--font-fredoka), var(--font-devanagari), sans-serif",
    body: "var(--font-quicksand), var(--font-devanagari), sans-serif",
    hand: "var(--font-caveat), var(--font-devanagari), cursive",
  },
  decorColors: ["#FBCFE8", "#C4B5FD", "#FDE68A", "#F472B6"],
  variants: {
    intro: "balloons",
    hero: "bokeh",
    message: "word-fade",
    timeline: "doodle-path",
    gallery: "polaroid",
    wishes: "sticky",
    finale: "pastel",
  },
};

export default theme;
