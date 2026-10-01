"use client";

import { useWish } from "@/components/wish/WishProvider";
import type { SectionProps } from "@/lib/wish-theme";
import { videosOf, videoSrc, poster } from "@/lib/wish-media";

export function VideoSection({ data, tokens }: SectionProps) {
  const { t, music } = useWish();
  const videos = videosOf(data.media);
  if (!videos.length) return null;
  return (
    <section className="wish-section px-6 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-3xl sm:text-4xl" style={{ fontFamily: "var(--f-display)" }}>{t("video.title")}</h2>
        <div className="space-y-8">
          {videos.map((video) => <figure key={video.id}>
            <video controls playsInline preload="none" src={videoSrc(video.url)} poster={poster(video.url)} aria-label={video.caption || t("video.title")} className="w-full rounded-lg bg-black" style={{ aspectRatio: `${video.w || 16} / ${video.h || 9}`, maxHeight: 600 }} onPlay={() => music.pause()} />
            {video.caption ? <figcaption className="mt-3 text-sm" style={{ color: tokens.colors.muted }}>{video.caption}</figcaption> : null}
          </figure>)}
        </div>
      </div>
    </section>
  );
}
