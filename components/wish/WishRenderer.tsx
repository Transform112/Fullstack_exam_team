"use client";

// Loads exactly one template chunk through next/dynamic and wraps it in the wish
// context. The same component renders the live page and the wizard preview.
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { wishFontClasses } from "@/lib/wish-fonts";
import { getTemplateId, registry } from "@/templates/registry";
import { withAccent } from "@/lib/wish-theme";
import { themes } from "@/templates/themes";
import type { WishPageData } from "@/lib/wish-types";
import { WishProvider } from "./WishProvider";
import { ViewTracker } from "./ViewTracker";
import "@/app/w/[slug]/wish.css";

export type WishRendererProps = {
  data: WishPageData;
  mode: "live" | "preview";
  scrollRef?: React.RefObject<HTMLElement | null>;
};

export function WishRenderer({ data, mode, scrollRef }: WishRendererProps) {
  const templateId = getTemplateId(data.theme.templateId);
  const Template = useMemo(
    () =>
      dynamic(registry[templateId], {
        loading: () => <div style={{ minHeight: "60vh", background: "#0B0420" }} aria-hidden />,
      }),
    [templateId],
  );

  const tokens = useMemo(
    () => withAccent(themes[templateId], data.theme.accent),
    [templateId, data.theme.accent],
  );

  const isHindi = data.language === "HINDI";
  const fontVars = {
    "--wish-vh": mode === "live" ? "100svh" : "720px",
    "--f-display": isHindi ? "var(--font-devanagari), sans-serif" : tokens.fonts.display,
    "--f-body": isHindi ? "var(--font-devanagari), sans-serif" : tokens.fonts.body,
    "--f-hand": isHindi
      ? "var(--font-kalam), var(--font-devanagari), sans-serif"
      : tokens.fonts.hand,
  } as React.CSSProperties;

  return (
    <WishProvider data={data} mode={mode} tokens={tokens} scrollRef={scrollRef}>
      <div className={`${wishFontClasses} wish-root`} lang={isHindi ? "hi" : "en"} style={fontVars}>
        {mode === "live" && <ViewTracker slug={data.slug} />}
        <Template data={data} mode={mode} />
      </div>
    </WishProvider>
  );
}
