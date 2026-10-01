import {
  Space_Grotesk,
  Fredoka,
  Quicksand,
  Caveat,
  Kalam,
  Playfair_Display,
  Cormorant,
  Noto_Sans_Devanagari,
} from "next/font/google";

// Wish-page fonts. All of them are loaded together and exposed as CSS variables, so a
// template can switch family without another request.
export const fSpace = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});
export const fFredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: "swap",
});
export const fQuicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});
export const fCaveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });
export const fKalam = Kalam({
  subsets: ["devanagari", "latin"],
  weight: ["400", "700"],
  variable: "--font-kalam",
  display: "swap",
});
export const fPlayfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});
export const fCormorant = Cormorant({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});
export const fDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-devanagari",
  display: "swap",
});

// All CSS variable classes joined; WishRenderer puts this on its root element.
export const wishFontClasses = [
  fSpace,
  fFredoka,
  fQuicksand,
  fCaveat,
  fKalam,
  fPlayfair,
  fCormorant,
  fDevanagari,
]
  .map((f) => f.variable)
  .join(" ");
