import type { Config } from "tailwindcss";

// Tailwind maps the app design tokens (docs/03 SECTION 5.3) onto utility class names.
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./templates/**/*.{ts,tsx}",
    "./sections/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#7C3AED", foreground: "#FFFFFF" },
        accent: { DEFAULT: "#EC4899", foreground: "#FFFFFF" },
        sunshine: { DEFAULT: "#FBBF24", foreground: "#0F0A1E" },
        ink: "#0F0A1E",
        canvas: "#FAF7FF",
        success: "#10B981",
        border: "#E9E4F5",
        muted: { DEFAULT: "#6B6480", foreground: "#6B6480" },
        surface: "#FFFFFF",
      },
      fontFamily: {
        heading: ["var(--font-poppins)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "12px" },
      boxShadow: { card: "0 8px 30px -12px rgba(15, 10, 30, 0.18)" },
    },
  },
  plugins: [],
};

export default config;
