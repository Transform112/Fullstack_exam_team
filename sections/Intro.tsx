"use client";

// Intro overlay (docs/04 SECTION 5.2). Live mode only, rendered on the server so the
// recipient name is visible at first paint. Ambient loops are inline CSS keyframes that
// only touch transform and opacity.
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useWish } from "@/components/wish/WishProvider";
import { EASE, SPRING, SPRING_POP } from "@/lib/motion";
import { splitGraphemes, seededRandom } from "@/lib/text";
import { imagesOf, img } from "@/lib/wish-media";
import type { SectionProps } from "@/lib/wish-theme";

const MIN_WAIT = 1800;
const MAX_WAIT = 3500;

// Numbers clamped into a range (used for seeded decoration placement).
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// One faint star for the Neon Night intro background.
function GlitchStars() {
  const stars = useMemo(() => {
    const rnd = seededRandom("intro-glitch");
    return Array.from({ length: 40 }, () => ({
      left: clamp(rnd() * 100, 2, 98),
      top: clamp(rnd() * 100, 2, 98),
      size: 1 + rnd() * 2,
      dur: 2 + rnd() * 4,
      delay: rnd() * -6,
    }));
  }, []);
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {stars.map((s, i) => (
        <span
          key={i}
          className="wish-twinkle"
          style={
            {
              position: "absolute",
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              borderRadius: 9999,
              background: "#FFFFFF",
              animation: `wish-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

// One rising balloon for the Pastel Dream intro background.
function Balloon({
  color,
  left,
  size,
  dur,
  delay,
}: {
  color: string;
  left: number;
  size: number;
  dur: number;
  delay: number;
}) {
  return (
    <span
      aria-hidden
      style={
        {
          position: "absolute",
          left: `${left}%`,
          bottom: -160,
          width: size,
          height: size * 1.2,
          opacity: 0.85,
          animation: `wish-rise ${dur}s linear ${delay}s infinite`,
        } as React.CSSProperties
      }
    >
      <span
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          animation: `wish-sway ${dur / 2}s ease-in-out infinite`,
        }}
      >
        <svg viewBox="0 0 40 60" width="100%" height="100%" aria-hidden>
          <ellipse cx="20" cy="22" rx="18" ry="21" fill={color} />
          <ellipse cx="13" cy="15" rx="5" ry="7" fill="#FFFFFF" opacity="0.35" />
          <path d="M20 43 l-4 6 h8 z" fill={color} />
          <path d="M20 49 q4 6 0 11" stroke={color} strokeWidth="1" fill="none" />
        </svg>
      </span>
    </span>
  );
}

// The Royal Gold envelope with its wax seal; the seal is the tap target and has no text.
function Envelope({
  exiting,
  reduced,
  sealColor,
  gold,
}: {
  exiting: boolean;
  reduced: boolean;
  sealColor: string;
  gold: string;
}) {
  const flap = reduced
    ? { opacity: exiting ? 0 : 1 }
    : { opacity: exiting ? 0 : 1, rotateX: exiting ? -180 : 0 };
  const letter = reduced ? { opacity: exiting ? 0 : 1 } : { y: exiting ? -60 : 0 };
  return (
    <div style={{ position: "relative", width: 260, height: 170, margin: "0 auto" }}>
      <motion.div
        aria-hidden
        animate={letter}
        transition={{ duration: 0.6, ease: EASE, delay: reduced ? 0 : 0.5 }}
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 16,
          height: 110,
          background: "#F5E6C8",
          borderRadius: 4,
          zIndex: 1,
        }}
      />
      <svg
        viewBox="0 0 260 170"
        width="260"
        height="170"
        aria-hidden
        style={{ position: "absolute", inset: 0, zIndex: 3 }}
      >
        <rect
          x="1"
          y="1"
          width="258"
          height="168"
          rx="6"
          fill="#EADFC2"
          stroke={gold}
          strokeWidth="2"
        />
      </svg>
      <motion.div
        aria-hidden
        animate={flap}
        transition={{ duration: 0.8, ease: EASE }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 96,
          transformOrigin: "top",
          transformStyle: "preserve-3d",
          perspective: 600,
          zIndex: 4,
        }}
      >
        <svg viewBox="0 0 260 96" width="260" height="96" aria-hidden>
          <path d="M2 2 L130 92 L258 2 Z" fill="#F5E6C8" stroke={gold} strokeWidth="2" />
        </svg>
      </motion.div>
      <motion.div
        animate={reduced ? { opacity: exiting ? 0 : 1 } : {}}
        style={{
          position: "absolute",
          left: "50%",
          top: 66,
          width: 56,
          height: 56,
          marginLeft: -28,
          borderRadius: 9999,
          background: sealColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
        }}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden>
          <path
            d="M12 20s-7-4.4-7-9.4A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7 2.8C19 15.6 12 20 12 20z"
            fill={gold}
          />
        </svg>
      </motion.div>
    </div>
  );
}

export function Intro({ data, tokens }: SectionProps) {
  const { mode, start, t, displayName, reducedMotion } = useWish();
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [gone, setGone] = useState(false);
  const timers = useRef<number[]>([]);

  const variant = tokens.variants.intro;
  const chars = splitGraphemes(displayName);
  const long = chars.length > 12;
  const first = imagesOf(data.media)[0];

  // Preload gate: the first image, the webfonts and at least 1.8s, with a hard maximum
  // of 3.5s so a slow network can never hold the recipient hostage.
  useEffect(() => {
    setReady(false);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const preload = new Image();
    preload.onload = () => undefined;
    preload.onerror = () => undefined;
    if (first) preload.src = img(first, 1200);
    const imageDone = first
      ? new Promise<void>((resolve) => {
          preload.onload = () => resolve();
          preload.onerror = () => resolve();
        })
      : Promise.resolve();
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    // Enable the button once media and fonts are in, but never before 1.8s and never
    // later than 3.5s.
    Promise.all([imageDone, fonts]).then(finish).catch(finish);
    timers.current.push(window.setTimeout(finish, MIN_WAIT));
    timers.current.push(window.setTimeout(finish, MAX_WAIT));
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Unmount the overlay one transition after the variant exit finishes.
  useEffect(() => {
    if (!exiting) return;
    const id = window.setTimeout(() => setGone(true), reducedMotion ? 320 : 1200);
    return () => window.clearTimeout(id);
  }, [exiting, reducedMotion]);

  const balloons = useMemo(() => {
    if (variant !== "balloons") return [];
    const rnd = seededRandom("intro-balloons");
    return Array.from({ length: 6 }, (_, i) => ({
      color: tokens.decorColors[i % tokens.decorColors.length],
      left: 4 + rnd() * 88,
      size: 38 + rnd() * 34,
      dur: 10 + rnd() * 6,
      delay: -rnd() * 14,
    }));
  }, [variant, tokens.decorColors]);

  // Preview mode never shows the intro, and the overlay disappears after the tap.
  if (mode === "preview" || gone) return null;

  // The overlay stays mounted while its variant exit plays; start() flips `started`
  // underneath it, which is what lets Hero begin its entrance.

  const handleStart = () => {
    if (exiting) return;
    try {
      start();
    } catch {
      // Audio or gyro blocked by the browser must not stop the page from opening.
    }
    setExiting(true);
  };

  // Delay of one name letter: glitch letters land faster than the envelope and balloon ones.
  const letterDelay = (i: number) => (variant === "glitch" ? 0.3 + i * 0.07 : 0.3 + i * 0.055);

  const reveal = (i: number) => {
    const delay = letterDelay(i);
    if (reducedMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 },
      };
    }
    if (variant === "balloons") {
      return {
        initial: { opacity: 0, y: 40, scale: 0.6 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { ...SPRING_POP, delay },
      };
    }
    return {
      initial: { opacity: 0, y: 40 },
      animate: { opacity: 1, y: 0 },
      transition: { ...SPRING, delay },
    };
  };

  const overlayExit = exiting
    ? variant === "balloons"
      ? { y: reducedMotion ? 0 : "-110%", opacity: reducedMotion ? 0 : 1 }
      : { opacity: 0 }
    : undefined;
  const overlayTransition = exiting
    ? variant === "balloons" && !reducedMotion
      ? { duration: 0.9, ease: EASE }
      : { duration: 0.3 }
    : undefined;

  const slices =
    variant === "glitch"
      ? Array.from({ length: 5 }, (_, i) => ({
          top: `${i * 20}%`,
          x: exiting ? (i % 2 === 0 ? "-100%" : "100%") : 0,
        }))
      : [];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: tokens.colors.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {variant === "glitch" && !reducedMotion ? <GlitchStars /> : null}

      {variant === "balloons"
        ? balloons.map((b, i) => (
            <Balloon
              key={i}
              color={b.color}
              left={b.left}
              size={b.size}
              dur={b.dur}
              delay={b.delay}
            />
          ))
        : null}

      {variant === "glitch"
        ? slices.map((s, i) => (
            <motion.div
              key={i}
              aria-hidden
              initial={{ x: 0 }}
              animate={{ x: s.x }}
              transition={{ duration: 0.6, ease: EASE, delay: i * 0.06 }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: s.top,
                height: "20%",
                background: tokens.colors.bg,
                pointerEvents: "none",
              }}
            />
          ))
        : null}

      <motion.div
        animate={overlayExit}
        transition={overlayTransition}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 900,
          padding: "0 24px",
          textAlign: "center",
          pointerEvents: "auto",
          zIndex: 2,
        }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{
            margin: "0 0 14px",
            fontSize: 16,
            color: tokens.colors.muted,
            lineHeight: 1.5,
            overflowWrap: "anywhere",
          }}
        >
          {t("intro.for", { name: displayName })}
        </motion.p>

        <div
          aria-label={displayName}
          style={{
            fontFamily: "var(--f-display)",
            fontSize: long ? "clamp(40px, 12vw, 96px)" : "clamp(44px, 16vw, 120px)",
            lineHeight: 1.1,
            overflowWrap: "anywhere",
            color: tokens.colors.text,
            textShadow:
              variant === "glitch"
                ? `0 0 12px ${tokens.colors.primary}, 0 0 32px ${tokens.colors.primary}`
                : undefined,
          }}
        >
          {chars.map((ch, i) => {
            const r = reveal(i);
            return (
              <motion.span
                key={`${i}-${ch}`}
                aria-hidden
                initial={r.initial}
                animate={r.animate}
                transition={r.transition}
                style={{
                  display: "inline-block",
                  position: "relative",
                  color: variant === "envelope" ? tokens.colors.primary : tokens.colors.text,
                }}
              >
                {variant === "glitch" && !reducedMotion ? (
                  <>
                    {/* The two colour-split copies show for 0.5s after the letter lands. */}
                    <motion.span
                      aria-hidden
                      initial={{ opacity: 0.8 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.3, delay: letterDelay(i) + 0.5 }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        color: "#22D3EE",
                        transform: "translateX(-2px)",
                      }}
                    >
                      {ch}
                    </motion.span>
                    <motion.span
                      aria-hidden
                      initial={{ opacity: 0.8 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.3, delay: letterDelay(i) + 0.5 }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        color: tokens.colors.primary,
                        transform: "translateX(2px)",
                      }}
                    >
                      {ch}
                    </motion.span>
                  </>
                ) : null}
                <span style={{ position: "relative" }}>{ch}</span>
              </motion.span>
            );
          })}
        </div>

        {variant === "envelope" ? (
          <div style={{ marginTop: 28 }}>
            <Envelope
              exiting={exiting}
              reduced={reducedMotion}
              sealColor="#7F1D1D"
              gold="#D4AF37"
            />
          </div>
        ) : null}

        <div
          style={{
            marginTop: 32,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minHeight: 52,
          }}
        >
          {ready ? (
            <motion.button
              type="button"
              onClick={handleStart}
              aria-label={t("intro.tap")}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={reducedMotion ? { duration: 0.3 } : { duration: 0.6, ease: EASE }}
              whileTap={{ scale: 0.96 }}
              style={{
                height: 52,
                minWidth: 220,
                minHeight: 44,
                padding: "0 28px",
                borderRadius: 9999,
                border: "none",
                cursor: "pointer",
                background: tokens.colors.primary,
                color: tokens.colors.bg,
                fontFamily: variant === "balloons" ? "var(--f-hand)" : "var(--f-display)",
                fontSize: variant === "balloons" ? 26 : 18,
                fontWeight: 600,
                overflowWrap: "anywhere",
              }}
            >
              <span
                aria-hidden
                className={reducedMotion ? undefined : "wish-pulse"}
                style={{ display: "inline-block" }}
              >
                {t("intro.tap")}
              </span>
            </motion.button>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: tokens.colors.muted,
                lineHeight: 1.5,
              }}
            >
              {t("intro.loading")}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
