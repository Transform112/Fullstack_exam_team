"use client";

import { ArrowDown, Sparkles } from "lucide-react";
import { useWish } from "@/components/wish/WishProvider";
import type { SectionProps } from "@/lib/wish-theme";
import { dateLocale } from "@/lib/i18n";

export function Hero({ data, tokens }: SectionProps) {
  const { t, displayName, language } = useWish();
  const neon = tokens.id === "neon-night";
  const royal = tokens.id === "royal-gold";
  const date = data.occasionDate ? new Date(data.occasionDate) : null;
  return (
    <section className="wish-section flex min-h-[620px] items-center px-7 py-20 sm:px-12" style={{ minHeight: "var(--wish-vh, 720px)" }}>
      <div className={`mx-auto w-full max-w-4xl ${neon ? "text-left" : "text-center"}`}>
        <div className={royal ? "border p-6 sm:p-12" : "py-8"} style={{ borderColor: tokens.colors.primary }}>
          <Sparkles className={`mb-8 h-8 w-8 ${neon ? "" : "mx-auto"}`} aria-hidden style={{ color: tokens.colors.primary }} />
          <p className="mb-6 text-xs uppercase tracking-[0.2em]" style={{ color: tokens.colors.muted }}>{t(`hero.greeting.${data.occasion}`, { label: data.customOccasionLabel })}</p>
          <h1 className="break-words text-[clamp(3.5rem,13vw,8rem)] leading-[1.08]" style={{ fontFamily: "var(--f-display)", color: tokens.colors.primary, fontWeight: neon ? 700 : 400 }}>{displayName}</h1>
          <p className="mt-7 text-xl" style={{ fontFamily: "var(--f-display)" }}>{t(`hero.sub.${data.occasion}`)}</p>
          {date && !Number.isNaN(date.getTime()) ? <p className="mt-5 text-xs uppercase tracking-widest" style={{ color: tokens.colors.muted }}>{date.toLocaleDateString(dateLocale(language), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</p> : null}
        </div>
        <p className={`mt-12 flex items-center gap-3 text-xs ${neon ? "" : "justify-center"}`} style={{ color: tokens.colors.muted }}><ArrowDown className="h-4 w-4" aria-hidden />{t("hero.scroll")}</p>
      </div>
    </section>
  );
}
