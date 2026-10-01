"use client";

import { Heart } from "lucide-react";
import { useWish } from "@/components/wish/WishProvider";
import type { SectionProps } from "@/lib/wish-theme";

export function Finale({ data, tokens }: SectionProps) {
  const { t, displayName } = useWish();
  return (
    <section className="wish-section px-8 py-24 text-center sm:py-32" style={{ background: tokens.colors.bgAlt }}>
      <Heart className="mx-auto mb-8 h-12 w-12" strokeWidth={1} style={{ color: tokens.colors.primary }} aria-hidden />
      <h2 className="mx-auto max-w-2xl text-4xl leading-tight sm:text-6xl" style={{ fontFamily: "var(--f-display)" }}>{t("finale.closing", { name: displayName })}</h2>
      {data.from ? <p className="mt-6 text-xl" style={{ color: tokens.colors.muted, fontFamily: "var(--f-hand)" }}>{t("finale.signature", { from: data.from })}</p> : null}
    </section>
  );
}
