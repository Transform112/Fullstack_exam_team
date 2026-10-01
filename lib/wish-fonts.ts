// Local font stacks keep previews and builds independent of font download services.
// Preserve the variable-class exports consumed by the renderer and theme tokens.
export const fSpace = { variable: "wish-font-space" };
export const fFredoka = { variable: "wish-font-fredoka" };
export const fQuicksand = { variable: "wish-font-quicksand" };
export const fCaveat = { variable: "wish-font-caveat" };
export const fKalam = { variable: "wish-font-kalam" };
export const fPlayfair = { variable: "wish-font-playfair" };
export const fCormorant = { variable: "wish-font-cormorant" };
export const fDevanagari = { variable: "wish-font-devanagari" };
export const wishFontClasses = [
  fSpace, fFredoka, fQuicksand, fCaveat, fKalam, fPlayfair, fCormorant, fDevanagari,
].map((font) => font.variable).join(" ");
