"use client";

import { useWish } from "@/components/wish/WishProvider";
import type { SectionProps } from "@/lib/wish-theme";
import { dateLocale } from "@/lib/i18n";
import { img } from "@/lib/wish-media";

export function Timeline({ data, tokens }: SectionProps) {
  const { t, language } = useWish();
  if (!data.memories.length) return null;
  return (
    <section className="wish-section px-6 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-10 text-3xl sm:text-4xl" style={{ fontFamily: "var(--f-display)" }}>{t("timeline.title")}</h2>
        <ol className="space-y-9 border-l pl-6" style={{ borderColor: tokens.colors.primary }}>
          {data.memories.map((memory, index) => {
            const media = data.media.find((item) => item.id === memory.mediaId && item.type === "image");
            const date = new Date(memory.date);
            return (
              <li key={memory.id || index} className="relative p-5 sm:p-7" style={{ background: tokens.colors.surface, borderRadius: tokens.id === "pastel-dream" ? 22 : 3 }}>
                <span className="absolute -left-8 top-7 h-4 w-4 rounded-full border-4" style={{ background: tokens.colors.primary, borderColor: tokens.colors.bg }} />
                {!Number.isNaN(date.getTime()) ? <p className="mb-3 text-xs uppercase tracking-widest" style={{ color: tokens.colors.muted }}>{date.toLocaleDateString(dateLocale(language), { month: "long", year: "numeric", timeZone: "UTC" })}</p> : null}
                <h3 className="text-2xl" style={{ fontFamily: "var(--f-display)" }}>{memory.title}</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{memory.description}</p>
                {media ? <img src={img(media, 800)} alt={media.caption || memory.title} loading="lazy" className="mt-5 w-full rounded-lg object-cover" style={{ aspectRatio: "4 / 3" }} /> : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
