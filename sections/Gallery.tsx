"use client";

import { useState } from "react";
import { useWish } from "@/components/wish/WishProvider";
import { Lightbox } from "@/components/wish/Lightbox";
import type { SectionProps } from "@/lib/wish-theme";
import { imagesOf, img, ratio } from "@/lib/wish-media";

export function Gallery({ data, tokens }: SectionProps) {
  const { t } = useWish();
  const [selected, setSelected] = useState<number | null>(null);
  const images = imagesOf(data.media);
  if (!images.length) return null;
  const polaroid = tokens.variants.gallery === "polaroid";
  const royal = tokens.variants.gallery === "carousel3d";
  return (
    <section className="wish-section px-6 py-16 sm:px-10 sm:py-24" style={{ background: tokens.colors.bgAlt }}>
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-10 text-3xl sm:text-4xl" style={{ fontFamily: "var(--f-display)", textAlign: royal ? "center" : "left" }}>{t("gallery.title")}</h2>
        <div className={royal ? "flex gap-5 overflow-x-auto snap-x snap-mandatory pb-5" : "grid grid-cols-1 gap-6 sm:grid-cols-2"}>
          {images.map((media, index) => (
            <button key={media.id} type="button" onClick={() => setSelected(index)} aria-label={`${t("gallery.title")} ${index + 1}${media.caption ? `: ${media.caption}` : ""}`} className={`block text-left ${royal ? "w-[85%] shrink-0 snap-center sm:w-[60%]" : "w-full"}`} style={{ padding: polaroid ? "10px 10px 20px" : 0, background: polaroid ? "#fffdf8" : "transparent", color: polaroid ? "#442b46" : tokens.colors.text, border: royal ? `1px solid ${tokens.colors.primary}` : undefined }}>
              <img src={img(media, 900)} alt={media.caption} loading="lazy" className="w-full object-cover" style={{ aspectRatio: royal ? "4 / 3" : ratio(media), borderRadius: polaroid ? 0 : 4 }} />
              {media.caption ? <p className="px-2 pt-4 text-sm leading-relaxed" style={{ fontFamily: polaroid ? "var(--f-hand)" : "var(--f-body)" }}>{media.caption}</p> : null}
            </button>
          ))}
        </div>
      </div>
      <Lightbox images={images} index={selected ?? 0} open={selected !== null} tokens={tokens} onClose={() => setSelected(null)} onIndexChange={setSelected} />
    </section>
  );
}
