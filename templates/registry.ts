import type { ComponentType } from "react";
import type { TemplateId } from "@/lib/wish-theme";
import type { WishTemplateProps } from "@/lib/wish-types";

type Loader = () => Promise<{ default: ComponentType<WishTemplateProps> }>;

// Only the chosen template chunk is downloaded: WishRenderer resolves this map with
// next/dynamic (docs/03 P3-01).
export const registry: Record<TemplateId, Loader> = {
  "neon-night": () => import("./neon-night"),
  "pastel-dream": () => import("./pastel-dream"),
  "royal-gold": () => import("./royal-gold"),
};

export const TEMPLATE_IDS: TemplateId[] = ["neon-night", "pastel-dream", "royal-gold"];

// Unknown ids fall back to neon-night so a bad template never breaks the page.
export function getTemplateId(id: string | undefined | null): TemplateId {
  return TEMPLATE_IDS.includes(id as TemplateId) ? (id as TemplateId) : "neon-night";
}

export default registry;
