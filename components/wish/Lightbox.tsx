"use client";

// Lightbox (docs/04 SECTION 5.6): full-screen image viewer with prev/next, keyboard and
// swipe navigation. It owns scroll locking and focus restoration while it is open.
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";
import { useWish } from "@/components/wish/WishProvider";
import { EASE } from "@/lib/motion";
import { img, type WishMedia } from "@/lib/wish-media";
import type { SectionProps } from "@/lib/wish-theme";

type LightboxProps = {
  images: WishMedia[];
  index: number;
  open: boolean;
  tokens: SectionProps["tokens"];
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export function Lightbox({ images, index, open, tokens, onClose, onIndexChange }: LightboxProps) {
  const { t, mode, reducedMotion, lenisRef } = useWish();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const count = images.length;
  // The absolute body height that fits inside 92vw and 80vh once the image width is capped.
  const boxVh = mode === "live" ? "80vh" : "calc(var(--wish-vh) * 0.8)";
  const current = count ? images[((index % count) + count) % count] : null;

  const go = useCallback(
    (step: number) => {
      if (count < 2) return;
      onIndexChange((((index + step) % count) + count) % count);
    },
    [count, index, onIndexChange],
  );

  const release = useCallback(() => {
    lenisRef.current?.start();
    document.documentElement.style.overflow = "";
  }, [lenisRef]);

  // Lock the page while open and hand scrolling back when it closes or unmounts.
  useEffect(() => {
    if (!open) return;
    lenisRef.current?.stop();
    document.documentElement.style.overflow = "hidden";
    return release;
  }, [open, lenisRef, release]);

  // Escape closes, the arrow keys navigate.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft") go(-1);
      else if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, go]);

  // Focus moves into the dialog on open and back to the opener when it closes.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      window.clearTimeout(timer);
      opener?.focus?.();
    };
  }, [open]);

  const stepStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 9999,
    border: "1px solid rgba(255,255,255,0.35)",
    color: "#FFFFFF",
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
  };

  return (
    <AnimatePresence>
      {open && current ? (
        <motion.div
          key="wish-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={current.caption || t("gallery.title")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.15 : 0.25, ease: EASE }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.92)" }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              padding: "12px 12px 24px",
            }}
          >
            <motion.img
              key={current.id}
              src={img(current, 1600)}
              alt={current.caption || ""}
              width={current.w}
              height={current.h}
              decoding="async"
              drag={reducedMotion || count < 2 ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_event, info) => {
                if (info.offset.x <= -60) go(1);
                else if (info.offset.x >= 60) go(-1);
              }}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              transition={{ duration: reducedMotion ? 0.2 : 0.4, ease: EASE }}
              style={{
                maxWidth: "92vw",
                maxHeight: boxVh,
                objectFit: "contain",
                background: tokens.colors.bgAlt,
                borderRadius: 12,
                touchAction: "pan-y",
                cursor: "grab",
              }}
            />

            {current.caption ? (
              <p
                style={{
                  color: "#FFFFFF",
                  fontFamily: tokens.fonts.body,
                  fontSize: 16,
                  textAlign: "center",
                  margin: 0,
                }}
              >
                {current.caption}
              </p>
            ) : null}

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                style={stepStyle}
                aria-label={t("gallery.prev")}
                onClick={() => go(-1)}
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
              <span
                aria-live="polite"
                style={{
                  color: "#FFFFFF",
                  fontFamily: tokens.fonts.body,
                  fontSize: 14,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {`${index + 1} / ${count}`}
              </span>
              <button
                type="button"
                style={stepStyle}
                aria-label={t("gallery.next")}
                onClick={() => go(1)}
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
          </div>

          <button
            ref={closeRef}
            type="button"
            aria-label={t("gallery.close")}
            onClick={onClose}
            style={{
              position: "absolute",
              top: "calc(12px + env(safe-area-inset-top))",
              right: "calc(12px + env(safe-area-inset-right))",
              width: 44,
              height: 44,
              borderRadius: 9999,
              border: "1px solid rgba(255,255,255,0.35)",
              background: "rgba(0,0,0,0.35)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
