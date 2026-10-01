"use client";

// Pastel Dream composition (docs/04 SECTION 6): light, rounded, centred and playful.
import { Decorations } from "@/components/wish/Decorations";
import { MusicToggle } from "@/components/wish/MusicToggle";
import { ScrollProgress } from "@/components/wish/ScrollProgress";
import { SmoothScroll } from "@/components/wish/SmoothScroll";
import { WishFooter } from "@/components/wish/WishFooter";
import { Finale } from "@/sections/Finale";
import { Gallery } from "@/sections/Gallery";
import { Hero } from "@/sections/Hero";
import { Intro } from "@/sections/Intro";
import { Message } from "@/sections/Message";
import { Timeline } from "@/sections/Timeline";
import { VideoSection } from "@/sections/VideoSection";
import { WishesWall } from "@/sections/WishesWall";
import type { WishTemplateProps } from "@/lib/wish-types";
import { withAccent } from "@/lib/wish-theme";
import { theme } from "./theme";

export default function PastelDreamTemplate({ data, mode }: WishTemplateProps) {
  // The creator's accent colour is applied to the template palette before rendering.
  const tokens = withAccent(theme, data.theme.accent);
  return (
    <div
      className="wish-root relative"
      style={{ background: tokens.colors.bg, color: tokens.colors.text }}
    >
      <SmoothScroll />
      <Decorations data={data} tokens={tokens} />
      <ScrollProgress tokens={tokens} />
      {mode === "live" && <Intro data={data} tokens={tokens} />}
      <Hero data={data} tokens={tokens} />
      <Message data={data} tokens={tokens} />
      <Timeline data={data} tokens={tokens} />
      <Gallery data={data} tokens={tokens} />
      <VideoSection data={data} tokens={tokens} />
      {data.settings.wishesWall && <WishesWall data={data} tokens={tokens} />}
      <Finale data={data} tokens={tokens} />
      <WishFooter data={data} tokens={tokens} />
      <MusicToggle tokens={tokens} />
    </div>
  );
}
