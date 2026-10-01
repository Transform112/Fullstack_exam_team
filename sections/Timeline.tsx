/* eslint-disable @next/next/no-img-element */
"use client";

// Timeline section (docs/04 SECTION 5.5): a scroll-drawn line with memory cards that
// alternate around it on desktop and stack to the right of it on mobile.
import { useEffect, useRef, useState } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { dateLocale, type Lang } from "@/lib/i18n";
import { EASE, SPRING } from "@/lib/motion";
import { img, imagesOf, ratio, type WishMedia } from "@/lib/wish-media";
import type { WishMemory } from "@/lib/wish-types";
import type { SectionProps } from "@/lib/wish-theme";
import { useWishScroll, useViewport } from "@/lib/wish-hooks";
import { useWish } from "@/components/wish/WishProvider";

// Distance between the centre line and the inner edge of a desktop card.
const GAP = 56;
// Mobile: the line hugs the left edge of the content box and cards start one gutter later.
const MOBILE_SPINE = 0;
const MOBILE_GUTTER = 44;

// True below the 768px breakpoint, where the line moves to the left edge and cards stack.
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return mobile;
}

// Long dates and unknown locales must not crash a card; on failure the date line is skipped.
function formatMemoryDate(value: string, language: Lang) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(dateLocale(language), {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(parsed);
  } catch {
    return "";
  }
}

// Memories are ordered by date only when every single one carries a date.
function ordered(memories: WishMemory[]) {
  if (!memories.length || !memories.every((m) => m.date)) return memories;
  return [...memories].sort((a, b) => a.date.localeCompare(b.date));
}

// Zero memories means no section at all (and no gap in the page rhythm).
export function Timeline({ data, tokens }: SectionProps) {
  if (!data.memories?.length) return null;
  return <TimelineBody data={data} tokens={tokens} />;
}

function TimelineBody({ data, tokens }: SectionProps) {
  const { language, t, reducedMotion } = useWish();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewport = useViewport();
  const isMobile = useIsMobile();
  const variant = tokens.variants.timeline;
  const memories = data.memories ?? [];

  const { scrollYProgress } = useWishScroll(containerRef, ["start end", "end center"]);
  let lineScale: MotionValue<number> | number = 1;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  } catch {
    lineScale = 1;
  }

  const photoById = new Map<string, WishMedia>(imagesOf(data.media ?? []).map((m) => [m.id, m]));
  const photoFor = (memory: WishMemory) =>
    memory.mediaId ? (photoById.get(memory.mediaId) ?? null) : null;

  const singleColumn = isMobile || variant === "doodle-path";
  const cards = ordered(memories);
  const polaroid = variant === "doodle-path";

  const spine: React.CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: singleColumn ? MOBILE_SPINE : "50%",
    width: variant === "gold-medallion" ? 1 : 2,
    transform: "translateX(-50%)",
    transformOrigin: "top",
  };

  return (
    <section
      id="timeline"
      className="wish-section px-6 py-16 md:py-24"
      style={{ background: tokens.colors.bg }}
    >
      <div className="mx-auto" style={{ maxWidth: 1100 }}>
        <motion.h2
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: reducedMotion ? 0.3 : 0.7, ease: EASE }}
          className="mb-10 md:mb-16"
          style={{
            fontFamily: tokens.fonts.display,
            color: tokens.colors.text,
            fontSize: "clamp(26px, 6vw, 40px)",
          }}
        >
          {t("timeline.title")}
        </motion.h2>

        <div
          ref={containerRef}
          className="relative"
          style={{ maxWidth: polaroid ? 620 : undefined, margin: "0 auto" }}
        >
          <div aria-hidden style={{ ...spine, background: tokens.colors.text, opacity: 0.2 }} />
          {variant === "center-line" && !singleColumn ? (
            <div
              aria-hidden
              style={{
                ...spine,
                background: tokens.colors.primary,
                filter: "blur(8px)",
                opacity: 0.45,
              }}
            />
          ) : null}
          <motion.div
            aria-hidden
            style={{ ...spine, background: tokens.colors.primary, scaleY: lineScale }}
          />

          <ol className="relative list-none" style={{ margin: 0, padding: 0 }}>
            {cards.map((memory, index) => {
              const photo = photoFor(memory);
              const isRight = singleColumn || index % 2 === 1;
              const dateLabel = formatMemoryDate(memory.date, language);
              const rotation = polaroid ? (index % 2 === 0 ? -2 : 2) : 0;

              return (
                <li
                  key={memory.id}
                  className="relative"
                  style={{
                    marginBottom: 32,
                    paddingLeft: singleColumn ? MOBILE_SPINE + MOBILE_GUTTER : 0,
                    display: singleColumn ? undefined : "flex",
                    justifyContent: isRight ? "flex-end" : "flex-start",
                  }}
                >
                  <Node
                    variant={variant}
                    tokens={tokens}
                    reducedMotion={reducedMotion}
                    viewport={viewport}
                    isRight={isRight}
                    isMobile={singleColumn}
                  />

                  <motion.article
                    initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: isRight ? 40 : -40 }}
                    whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                    viewport={viewport}
                    transition={{ duration: reducedMotion ? 0.3 : 0.8, ease: EASE }}
                    style={{ width: singleColumn ? "100%" : `calc(50% - ${GAP}px)` }}
                  >
                    <div
                      style={{
                        borderRadius:
                          variant === "doodle-path" ? 4 : variant === "gold-medallion" ? 2 : 16,
                        background:
                          variant === "center-line"
                            ? "rgba(255,255,255,0.06)"
                            : variant === "doodle-path"
                              ? "#FFFFFF"
                              : tokens.colors.surface,
                        border:
                          variant === "center-line"
                            ? `1px solid ${tokens.colors.primary}66`
                            : variant === "doodle-path"
                              ? `2px dashed ${tokens.colors.primary}99`
                              : `1px solid ${tokens.colors.primary}80`,
                        padding: polaroid ? "10px 10px 36px" : 16,
                        transform: rotation ? `rotate(${rotation}deg)` : undefined,
                      }}
                    >
                      {photo ? (
                        <img
                          src={img(photo, 600)}
                          alt={photo.caption || memory.title}
                          width={photo.w}
                          height={photo.h}
                          loading="lazy"
                          decoding="async"
                          style={{
                            width: "100%",
                            aspectRatio: String(ratio(photo)),
                            objectFit: "cover",
                            borderRadius: variant === "gold-medallion" ? 0 : polaroid ? 2 : 12,
                            display: "block",
                            marginBottom: 12,
                            background: tokens.colors.bgAlt,
                          }}
                        />
                      ) : null}

                      {dateLabel ? (
                        <p
                          style={{
                            fontFamily: polaroid ? tokens.fonts.hand : tokens.fonts.body,
                            fontSize: polaroid ? 20 : 14,
                            color:
                              variant === "center-line"
                                ? tokens.colors.secondary
                                : tokens.colors.muted,
                            fontVariant: variant === "gold-medallion" ? "small-caps" : undefined,
                            marginBottom: 4,
                          }}
                        >
                          {dateLabel}
                        </p>
                      ) : null}

                      <h3
                        style={{
                          fontFamily: tokens.fonts.display,
                          fontStyle: variant === "gold-medallion" ? "italic" : undefined,
                          fontSize: 22,
                          color: tokens.colors.text,
                        }}
                      >
                        {memory.title}
                      </h3>
                      {memory.description ? (
                        <p
                          style={{
                            fontFamily: tokens.fonts.body,
                            fontSize: 16,
                            color: tokens.colors.muted,
                            marginTop: 6,
                          }}
                        >
                          {memory.description.slice(0, 300)}
                        </p>
                      ) : null}
                    </div>
                  </motion.article>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

type NodeProps = {
  variant: "center-line" | "doodle-path" | "gold-medallion";
  tokens: SectionProps["tokens"];
  reducedMotion: boolean;
  viewport: ReturnType<typeof useViewport>;
  isRight: boolean;
  isMobile: boolean;
};

// The marker that sits on the line for one card: neon dot, doodle star or gold medallion.
function Node({ variant, tokens, reducedMotion, viewport, isRight, isMobile }: NodeProps) {
  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    top: 18,
    zIndex: 1,
    transform: "translate(-50%, -50%)",
    left: isMobile ? MOBILE_SPINE : isRight ? `calc(50% + ${GAP}px)` : `calc(50% - ${GAP}px)`,
  };

  const size = variant === "gold-medallion" ? 28 : 16;

  return (
    <motion.div
      aria-hidden
      style={wrapperStyle}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0 }}
      whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      viewport={viewport}
      transition={reducedMotion ? { duration: 0.3 } : SPRING}
    >
      {variant === "doodle-path" ? (
        <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
          <path
            d="M11 1.5l2.4 6.3 6.6.4-5.1 4.2 1.8 6.4L11 15.1 5.3 18.8l1.8-6.4L2 8.2l6.6-.4L11 1.5z"
            stroke={tokens.colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: 9999,
            background:
              variant === "gold-medallion" ? tokens.colors.secondary : tokens.colors.primary,
            border: `2px solid ${variant === "gold-medallion" ? tokens.colors.primary : tokens.colors.bg}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {variant === "gold-medallion" ? (
            <svg width={10} height={10} viewBox="0 0 10 10" aria-hidden>
              <path d="M5 0l2 5-2 5-2-5 2-5z" fill={tokens.colors.primary} />
            </svg>
          ) : null}
        </div>
      )}
    </motion.div>
  );
}
