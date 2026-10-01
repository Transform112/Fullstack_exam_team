"use client";

import { Heart } from "lucide-react";
import { useWish } from "@/components/wish/WishProvider";
import type { SectionProps } from "@/lib/wish-theme";

export function Message({ data, tokens }: SectionProps) {
  const { t } = useWish();
  if (!data.messages.some((message) => message.trim())) return null;
  return (
    <section className="wish-section px-6 py-16 sm:px-10 sm:py-24" style={{ background: tokens.colors.bgAlt }}>
      <div className="mx-auto max-w-2xl">
        <Heart className="mb-5 h-6 w-6" style={{ color: tokens.colors.primary }} aria-hidden />
        <h2 className="mb-8 text-3xl sm:text-4xl" style={{ fontFamily: "var(--f-display)" }}>{t("message.title")}</h2>
        <div className="space-y-6 border-l-2 pl-6" style={{ borderColor: tokens.colors.primary }}>
          {data.messages.filter(Boolean).map((message, index) => <p key={index} className="whitespace-pre-wrap text-lg leading-relaxed" style={{ fontFamily: data.theme.font === "handwriting" ? "var(--f-hand)" : "var(--f-body)" }}>{message}</p>)}
        </div>
        {data.from ? <p className="mt-10 text-right text-2xl" style={{ fontFamily: "var(--f-hand)", color: tokens.colors.primary }}>{t("message.signature", { from: data.from })}</p> : null}
      </div>
    </section>
  );
}
