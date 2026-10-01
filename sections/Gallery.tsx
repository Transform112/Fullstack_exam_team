/* eslint-disable @next/next/no-img-element */
"use client";

// Gallery section (docs/04 SECTION 5.6): responsive image layouts plus the lightbox entry
// point. The count rules (1 / 2 / 3+) are shared by every template variant.
import { useEffect, useRef, useState } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { useWish } from "@/components/wish/WishProvider";
import { Lightbox } from "@/components/wish/Lightbox";
import { EASE, SPRING } from "@/lib/motion";
import { img, imagesOf, ratio, type WishMedia } from "@/lib/wish-media";
import type { SectionProps } from "@/lib/wish-theme";
import { useViewport, useWishScroll } from "@/lib/wish-hooks";

// Built-in rotation list for the pastel polaroid wall, cycled by index.
const POLAROID_ROTATION = [-5, 3, -2, 6, -4, 2, -6, 4];

// True from the 768px breakpoint up, where the carousel ring gets its desktop sizing.
function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return desktop;
}

type FrameProps = {
  media: WishMedia;
  index: number;
  tokens: SectionProps["tokens"];
  radius: number;
  delay: number;
  onClick: () => void;
};

// One scroll-linked image frame: the image is scaled inside an overflow-hidden box and
// drifts vertically as the frame crosses the viewport.
function Frame({ media, index, tokens, radius, delay, onClick }: FrameProps) {
  const { t, mode, reducedMotion } = useWish();
  const frameRef = useRef<HTMLButtonElement | null>(null);
  const viewport = useViewport();
  const { scrollYProgress } = useWishScroll(frameRef, ["start end", "end start"]);
  const [failed, setFailed] = useState(false);

  let parallax: MotionValue<string> | string = "0%";
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    parallax = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  } catch {
    parallax = "0%";
  }

  const still = reducedMotion || mode === "preview";

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
      whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      viewport={viewport}
      transition={{ duration: reducedMotion ? 0.3 : 0.7, ease: EASE, delay }}
    >
      <button
        ref={frameRef}
        type="button"
        onClick={onClick}
        aria-label={media.caption || t("gallery.photo", { n: index + 1 })}
        className="wish-hover-lift block w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          aspectRatio: String(ratio(media)),
          overflow: "hidden",
          borderRadius: radius,
          background: tokens.colors.bgAlt,
          position: "relative",
          cursor: "zoom-in",
        }}
      >
        {failed ? (
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: tokens.colors.muted,
              fontFamily: tokens.fonts.body,
              fontSize: 16,
              padding: 16,
              textAlign: "center",
            }}
          >
            {media.caption || t("gallery.title")}
          </span>
        ) : (
          <motion.img
            src={img(media, 600)}
            srcSet={`${img(media, 900)} 2x`}
            alt={media.caption || ""}
            width={media.w}
            height={media.h}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              scale: 1.15,
              y: still ? "0%" : parallax,
            }}
          />
        )}
      </button>
    </motion.div>
  );
}

// The preview-only placeholder: three skeleton rectangles so an empty draft still reads
// as a gallery instead of disappearing.
function Skeletons({ tokens }: { tokens: SectionProps["tokens"] }) {
  return (
    <div aria-hidden className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            aspectRatio: "4 / 5",
            borderRadius: 14,
            background: tokens.colors.bgAlt,
            border: `1px dashed ${tokens.colors.primary}66`,
          }}
        />
      ))}
    </div>
  );
}

// The 3D ring used by Royal Gold: offsets wrap around the active index and only the five
// nearest cards stay on stage.
function Carousel({
  images,
  tokens,
  onOpen,
}: {
  images: WishMedia[];
  tokens: SectionProps["tokens"];
  onOpen: (index: number) => void;
}) {
  const { t, reducedMotion } = useWish();
  const isDesktop = useIsDesktop();
  const [active, setActive] = useState(0);
  const [stopped, setStopped] = useState(false);

  const wrap = (index: number) => (index + images.length) % images.length;
  // Shortest signed distance from the active card, used for the ring transform.
  const offsetOf = (index: number) => {
    const total = images.length;
    let offset = (index - active + total) % total;
    if (offset > total / 2) offset -= total;
    return offset;
  };

  const goTo = (index: number) => {
    setStopped(true);
    setActive(wrap(index));
  };

  // Autoplay stops permanently on the first interaction and never runs with reduced motion.
  useEffect(() => {
    if (stopped || reducedMotion || images.length < 3) return;
    const id = setInterval(() => setActive((i) => (i + 1) % images.length), 3500);
    return () => clearInterval(id);
  }, [stopped, reducedMotion, images.length]);

  const arrowStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 9999,
    border: `1px solid ${tokens.colors.primary}`,
    color: tokens.colors.primary,
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
  };

  return (
    <div>
      <div
        role="group"
        aria-label={t("gallery.title")}
        style={{ height: isDesktop ? 460 : 380, perspective: 1200, position: "relative" }}
      >
        <motion.div
          drag={reducedMotion ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_event, info) => {
            if (info.offset.x <= -60) goTo(active + 1);
            else if (info.offset.x >= 60) goTo(active - 1);
          }}
          style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}
        >
          {images.map((media, index) => {
            const offset = offsetOf(index);
            const distance = Math.abs(offset);
            const visible = distance <= 2;
            const isActive = offset === 0;
            return (
              <div
                key={media.id}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: visible ? "auto" : "none",
                }}
              >
                <motion.div
                  animate={{
                    x: `${offset * 62}%`,
                    z: -distance * 120,
                    rotateY: reducedMotion ? 0 : offset * -32,
                    scale: reducedMotion ? 1 : 1 - distance * 0.12,
                    opacity: visible
                      ? reducedMotion
                        ? isActive
                          ? 1
                          : 0
                        : 1 - distance * 0.3
                      : 0,
                  }}
                  transition={
                    reducedMotion ? { duration: 0.3, ease: EASE } : { duration: 0.7, ease: EASE }
                  }
                  style={{
                    width: isDesktop ? "56%" : "72%",
                    position: "relative",
                    zIndex: 10 - distance,
                    transformStyle: "preserve-3d",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => (isActive ? onOpen(index) : goTo(index))}
                    aria-label={media.caption || t("gallery.photo", { n: index + 1 })}
                    style={{
                      display: "block",
                      width: "100%",
                      aspectRatio: String(ratio(media)),
                      overflow: "hidden",
                      borderRadius: 4,
                      border: `1px solid ${isActive ? tokens.colors.primary : "transparent"}`,
                      background: tokens.colors.bgAlt,
                    }}
                  >
                    <img
                      src={img(media, 600)}
                      srcSet={`${img(media, 900)} 2x`}
                      alt={media.caption || ""}
                      width={media.w}
                      height={media.h}
                      loading="lazy"
                      decoding="async"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </button>
                </motion.div>
              </div>
            );
          })}
        </motion.div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          style={arrowStyle}
          aria-label={t("gallery.prev")}
          onClick={() => goTo(active - 1)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          style={arrowStyle}
          aria-label={t("gallery.next")}
          onClick={() => goTo(active + 1)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M9 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <p
        style={{
          minHeight: 28,
          marginTop: 12,
          textAlign: "center",
          fontFamily: tokens.fonts.hand,
          fontSize: 18,
          color: tokens.colors.muted,
        }}
      >
        {images[active]?.caption || ""}
      </p>
    </div>
  );
}

export function Gallery({ data, tokens }: SectionProps) {
  const { t, mode, reducedMotion } = useWish();
  const viewport = useViewport();
  const images = imagesOf(data.media ?? []);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!images.length) {
    // Preview drafts have no uploads yet: three skeleton frames keep the layout honest.
    if (mode !== "preview") return null;
    return (
      <section
        id="gallery"
        className="wish-section px-6 py-16 md:py-24"
        style={{ background: tokens.colors.bgAlt }}
      >
        <div className="mx-auto" style={{ maxWidth: 1100 }}>
          <h2
            className="mb-8"
            style={{
              fontFamily: tokens.fonts.display,
              color: tokens.colors.text,
              fontSize: "clamp(26px, 6vw, 40px)",
            }}
          >
            {t("gallery.title")}
          </h2>
          <Skeletons tokens={tokens} />
        </div>
      </section>
    );
  }

  const variant = tokens.variants.gallery;
  const useVariant = images.length >= 3;
  const open = (index: number) => setOpenIndex(index);

  let body: React.ReactNode;

  if (images.length === 1) {
    // One image: a hero frame, never a grid with empty slots.
    body = (
      <div className="mx-auto" style={{ maxWidth: 520 }}>
        <Frame
          media={images[0]}
          index={0}
          tokens={tokens}
          radius={24}
          delay={0}
          onClick={() => open(0)}
        />
        {images[0].caption ? (
          <p
            className="mt-3 text-center"
            style={{ color: tokens.colors.muted, fontFamily: tokens.fonts.body, fontSize: 16 }}
          >
            {images[0].caption}
          </p>
        ) : null}
      </div>
    );
  } else if (images.length === 2 || !useVariant) {
    // Two images: two columns on desktop, stacked on mobile.
    body = (
      <div className="mx-auto grid grid-cols-1 gap-5 md:grid-cols-2" style={{ maxWidth: 900 }}>
        {images.map((media, index) => (
          <Frame
            key={media.id}
            media={media}
            index={index}
            tokens={tokens}
            radius={24}
            delay={(index % 3) * 0.08}
            onClick={() => open(index)}
          />
        ))}
      </div>
    );
  } else if (variant === "masonry") {
    body = (
      <div className="columns-2 md:columns-3" style={{ columnGap: 12 }}>
        {images.map((media, index) => (
          <div key={media.id} style={{ breakInside: "avoid", marginBottom: 12 }}>
            <Frame
              media={media}
              index={index}
              tokens={tokens}
              radius={14}
              delay={(index % 3) * 0.08}
              onClick={() => open(index)}
            />
            {media.caption ? (
              <p
                className="mt-2"
                style={{ color: tokens.colors.muted, fontFamily: tokens.fonts.body, fontSize: 14 }}
              >
                {media.caption}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    );
  } else if (variant === "polaroid") {
    body = (
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
        {images.map((media, index) => {
          const rotation = POLAROID_ROTATION[index % POLAROID_ROTATION.length];
          return (
            <motion.div
              key={media.id}
              initial={
                reducedMotion ? { opacity: 0 } : { opacity: 0, y: -50, rotate: rotation + 10 }
              }
              whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, rotate: rotation }}
              viewport={viewport}
              whileHover={reducedMotion ? undefined : { scale: 1.06, rotate: 0, zIndex: 5 }}
              transition={reducedMotion ? { duration: 0.3 } : { ...SPRING, delay: index * 0.08 }}
              style={{
                background: "#FFFFFF",
                padding: "10px 10px 40px",
                borderRadius: 4,
                position: "relative",
              }}
            >
              <Frame
                media={media}
                index={index}
                tokens={tokens}
                radius={2}
                delay={0}
                onClick={() => open(index)}
              />
              <p
                style={{
                  position: "absolute",
                  left: 10,
                  right: 10,
                  bottom: 10,
                  fontFamily: tokens.fonts.hand,
                  fontSize: 18,
                  color: "#4A2B4F",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {media.caption}
              </p>
            </motion.div>
          );
        })}
      </div>
    );
  } else {
    body = <Carousel images={images} tokens={tokens} onOpen={open} />;
  }

  return (
    <section
      id="gallery"
      className="wish-section px-6 py-16 md:py-24"
      style={{ background: tokens.colors.bgAlt }}
    >
      <div className="mx-auto" style={{ maxWidth: 1100 }}>
        <motion.h2
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: reducedMotion ? 0.3 : 0.7, ease: EASE }}
          className="mb-8 md:mb-12"
          style={{
            fontFamily: tokens.fonts.display,
            color: tokens.colors.text,
            fontSize: "clamp(26px, 6vw, 40px)",
          }}
        >
          {t("gallery.title")}
        </motion.h2>
        {body}
      </div>
      <Lightbox
        images={images}
        index={openIndex ?? 0}
        open={openIndex !== null}
        tokens={tokens}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </section>
  );
}
