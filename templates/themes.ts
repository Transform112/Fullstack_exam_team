import { theme as neonNight } from "./neon-night/theme";
import { theme as pastelDream } from "./pastel-dream/theme";
import { theme as royalGold } from "./royal-gold/theme";
import type { TemplateId, ThemeTokens } from "@/lib/wish-theme";

// Single place that maps a template id to its tokens, used by WishRenderer (server and
// client) without importing a template component.
export const themes: Record<TemplateId, ThemeTokens> = {
  "neon-night": neonNight,
  "pastel-dream": pastelDream,
  "royal-gold": royalGold,
};
