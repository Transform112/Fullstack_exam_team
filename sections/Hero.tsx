"use client";

// Hero section (docs/04 SECTION 5.3): three parallax layers, pointer and gyro tilt, and
// one entrance gated on the intro tap. Only transform and opacity are ever animated.
import { useMemo, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useWish } from "@/components/wish/WishProvider";
import { occasionLabel } from "@/lib/occasion";
import { EASE, SPRING, SPRING_POP } from "@/lib/motion";
import { splitGraphemes, seededRandom } from "@/lib/text";
import { useViewportHeight, useWishScroll } from "@/lib/wish-hooks";
import type { SectionProps } from "@/lib/wish-theme";

// Numbers clamped into a range, used for every seeded placement.
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Hand-drawn doodle shapes for the Pastel Dream middle layer.
function Doodle({
  kind,
  color,
  size,
}: {
  kind: "star" | "squiggle" | "heart" | "spiral";
  color: string;
  size: number;
}) {
  const paths: Record<string, string> = {
    star: "M12 2l2.6 6.4L21 11l-6.4 2.6L12 20l-2.6-6.4L3 11l6.4-2.6z",
    squiggle: "M2 14c3-8 6 8 9 0s6 8 9 0",
    heart: "M12 20s-7-4.4-7-9.4A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7 2.8C19 15.6 12 20 12 20z",
    spiral: "M12 12a3 3 0 1 1 3 3 5 5 0 1 1-5-5 7 7 0 1 1 7 7",
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path
        d={paths[kind]}
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// A petal for the Royal Gold middle layer.
function Petal({ color, size }: { color: string; size: number }) {
  return (
    <svg viewBox="0 0 24 32" width={size * 0.75} height={size} aria-hidden>
      <path d="M12 1c7 9 10 15 10 20a10 10 0 0 1-20 0C2 16 5 10 12 1z" fill={color} />
    </svg>
  );
}

// The four L-shaped corner ornaments of the Royal Gold frame.
function Corners({ color }: { color: string }) {
  const spots: ReadonlyArray<{
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    rot: number;
  }> = [
    { top: 0, left: 0, rot: 0 },
    { top: 0, right: 0, rot: 90 },
    { bottom: 0, right: 0, rot: 180 },
    { bottom: 0, left: 0, rot: 270 },
  ];
  return (
    <>
      {spots.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 28 28"
          width="28"
          height="28"
          aria-hidden
          style={{
            position: "absolute",
            top: s.top,
            right: s.right,
            bottom: s.bottom,
            left: s.left,
            transform: `rotate(${s.rot}deg)`,
          }}
        >
          <path d="M1 14 L1 1 L14 1" stroke={color} strokeWidth="2" fill="none" />
        </svg>
      ))}
    </>
  );
}

export function Hero({ data, tokens }: SectionProps) {
  const { mode, started, reducedMotion, t, displayName, language, gyro } = useWish();
  const vh = useViewportHeight();
  const heroRef = useRef<HTMLElement | null>(null);
  const tiltEnabled = !reducedMotion && mode === "live";
  const variant = tokens.variants.hero;
  const slow = variant === "gold-frame" ? 0.6 : 1;

  const { scrollYProgress } = useWishScroll(heroRef, ["start start", "end start"]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, vh * 0.8 * slow]);
  const midY = useTransform(scrollYProgress, [0, 1], [0, vh * 0.5 * slow]);
  const yZero = useTransform(scrollYProgress, [0, 1], [0, 0]);

  // Tilt: pointer position on pointer-capable devices, gyro everywhere else. Only
  // transform values are produced, and they stay at rest when tilt is disabled.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const tiltX = useSpring(pointerX, { stiffness: 80, damping: 20 });
  const tiltY = useSpring(pointerY, { stiffness: 80, damping: 20 });
  // Gyro is squeezed into the same range so both tilt sources share the layer offsets.
  const gyroScale = tiltEnabled ? 22 : 0;
  const gyroX = useTransform(gyro.x, (v) => v * gyroScale);
  const gyroY = useTransform(gyro.y, (v) => v * gyroScale);
  const activeX: MotionValue<number> = tiltEnabled ? tiltX : gyroX;
  const activeY: MotionValue<number> = tiltEnabled ? tiltY : gyroY;
  const bgX = useTransform(activeX, (v) => v * (6 / 22));
  const bgTY = useTransform(activeY, (v) => v * (6 / 22));
  const midX = useTransform(activeX, (v) => v * (14 / 22));
  const midTY = useTransform(activeY, (v) => v * (14 / 22));
  const frontX = useTransform(activeX, (v) => v);
  const frontY = useTransform(activeY, (v) => v);

  // Pointer tilt is desktop-only and disabled in preview mode and reduced motion.
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!tiltEnabled || e.pointerType !== "mouse") return;
    const box = heroRef.current?.getBoundingClientRect();
    if (!box) return;
    const nx = clamp((e.clientX - (box.left + box.width / 2)) / (box.width / 2), -1, 1);
    const ny = clamp((e.clientY - (box.top + box.height / 2)) / (box.height / 2), -1, 1);
    pointerX.set(nx * 22);
    pointerY.set(ny * 22);
  };

  const occasion = data.occasion || "CUSTOM";
  // CUSTOM uses the creator's label; the shared helper supplies the product default.
  const greeting = t(`hero.greeting.${occasion}`, {
    label: occasionLabel(occasion, data.customOccasionLabel),
  });
  const sub = t(`hero.sub.${occasion}`);
  const chars = splitGraphemes(displayName);
  const long = chars.length > 10;
  const nameSize = long ? "clamp(44px, 15vw, 150px)" : "clamp(56px, 22vw, 200px)";
  const isHindi = language === "HINDI";

  const startedHero = mode === "preview" ? true : started;
  const bodyFont = tokens.fonts.body;

  const stars = useMemo(() => {
    if (variant !== "starfield") return [];
    const rnd = seededRandom(data.slug || "preview");
    return Array.from({ length: 60 }, () => ({
      left: clamp(rnd() * 100, 1, 99),
      top: clamp(rnd() * 100, 1, 99),
      size: 1 + rnd() * 2,
      dur: 2 + rnd() * 4,
      delay: -rnd() * 6,
      twinkle: rnd() > 0.5,
      color: rnd() > 0.75 ? tokens.colors.bg : "#FFFFFF",
    }));
  }, [variant, data.slug, tokens.colors.bg]);

  const bokeh = useMemo(() => {
    if (variant !== "bokeh") return [];
    const rnd = seededRandom(`${data.slug || "preview"}-bokeh`);
    return Array.from({ length: 10 }, (_, i) => ({
      color: tokens.decorColors[i % tokens.decorColors.length],
      left: clamp(rnd() * 100, 2, 94),
      top: clamp(rnd() * 100, 2, 94),
      size: 60 + rnd() * 100,
      dur: 10 + rnd() * 10,
      delay: -rnd() * 8,
    }));
  }, [variant, data.slug, tokens.decorColors]);

  const petals = useMemo(() => {
    if (variant !== "gold-frame") return [];
    const rnd = seededRandom(`${data.slug || "preview"}-petals`);
    return Array.from({ length: 14 }, (_, i) => ({
      color: i % 2 === 0 ? "#7F1D1D" : "#D4AF37",
      left: clamp(rnd() * 100, 1, 97),
      size: 14 + rnd() * 12,
      dur: 18 + rnd() * 10,
      delay: -rnd() * 24,
    }));
  }, [variant, data.slug]);

  const balloons = useMemo(() => {
    if (variant !== "bokeh") return [];
    const rnd = seededRandom(`${data.slug || "preview"}-balloons`);
    return Array.from({ length: 5 }, (_, i) => ({
      color: tokens.decorColors[i % tokens.decorColors.length],
      left: clamp(rnd() * 100, 3, 92),
      size: 38 + rnd() * 26,
      dur: 12 + rnd() * 8,
      delay: -rnd() * 16,
    }));
  }, [variant, data.slug, tokens.decorColors]);

  const doodles = useMemo(() => {
    if (variant !== "bokeh") return [];
    const kinds = ["star", "squiggle", "heart", "spiral"] as const;
    const rnd = seededRandom(`${data.slug || "preview"}-doodles`);
    return kinds.map((kind) => ({
      kind,
      left: clamp(rnd() * 100, 4, 90),
      top: clamp(rnd() * 100, 4, 90),
      size: 26 + rnd() * 18,
      rot: -12 + rnd() * 24,
    }));
  }, [variant, data.slug]);

  const glowShapes = useMemo(() => {
    if (variant !== "starfield") return [];
    const rnd = seededRandom(`${data.slug || "preview"}-glow`);
    const colors = [tokens.colors.primary, tokens.colors.secondary, tokens.colors.tertiary];
    return Array.from({ length: 6 }, (_, i) => ({
      ring: i % 3 === 0,
      color: colors[i % colors.length],
      left: clamp(rnd() * 100, 2, 88),
      top: clamp(rnd() * 100, 2, 88),
      size: 80 + rnd() * 140,
    }));
  }, [variant, data.slug, tokens.colors.primary, tokens.colors.secondary, tokens.colors.tertiary]);

  const layerTransition = (delay: number) =>
    reducedMotion ? { duration: 0.3, delay: 0 } : { duration: 0.8, ease: EASE, delay };
  const fade = (delay: number) =>
    reducedMotion
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.3, delay: 0 },
        }
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: layerTransition(delay),
        };

  const nameBackground =
    variant === "gold-frame"
      ? "linear-gradient(110deg, #8a6d1d, #D4AF37, #F5E6C8, #D4AF37, #8a6d1d)"
      : undefined;

  return (
    <section
      ref={heroRef}
      id="hero"
      className="wish-section px-6 py-16 md:py-24"
      onPointerMove={onPointerMove}
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "min(var(--wish-vh), 560px)",
        background: tokens.colors.bg,
      }}
    >
      {/* Background layer: parallax 0.2x */}
      <motion.div
        className="wish-layer"
        style={{ position: "absolute", inset: 0, y: reducedMotion ? yZero : bgY, x: bgX }}
      >
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            x: tiltEnabled ? bgX : 0,
            y: tiltEnabled ? bgTY : 0,
          }}
        >
          {variant === "starfield" ? (
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(circle at 50% 30%, ${tokens.colors.primary}26, transparent 60%)`,
              }}
            >
              {stars.map((s, i) => (
                <span
                  key={i}
                  className={s.twinkle && !reducedMotion ? "wish-twinkle" : undefined}
                  style={
                    {
                      position: "absolute",
                      left: `${s.left}%`,
                      top: `${s.top}%`,
                      width: s.size,
                      height: s.size,
                      borderRadius: 9999,
                      background: s.color,
                      animation:
                        s.twinkle && !reducedMotion
                          ? `wish-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`
                          : undefined,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          ) : null}

          {variant === "bokeh" ? (
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(180deg, ${tokens.colors.bg}, ${tokens.colors.bgAlt})`,
              }}
            >
              {bokeh.map((b, i) => (
                <span
                  key={i}
                  style={
                    {
                      position: "absolute",
                      left: `${b.left}%`,
                      top: `${b.top}%`,
                      width: b.size,
                      height: b.size,
                      borderRadius: 9999,
                      background: b.color,
                      opacity: 0.5,
                      filter: "blur(20px)",
                      animation: reducedMotion
                        ? undefined
                        : `wish-drift ${b.dur}s ease-in-out ${b.delay}s infinite`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          ) : null}

          {variant === "gold-frame" ? (
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(180deg, ${tokens.colors.bg}, #1a1410)`,
                overflow: "hidden",
              }}
            >
              {!reducedMotion ? (
                <span
                  style={{
                    position: "absolute",
                    top: "-25%",
                    bottom: "-25%",
                    left: 0,
                    width: "40%",
                    opacity: 0.08,
                    background:
                      "linear-gradient(100deg, transparent, #D4AF37 45%, #F5E6C8 50%, #D4AF37 55%, transparent)",
                    animation: "wish-shimmer 9s linear infinite",
                  }}
                />
              ) : null}
            </div>
          ) : null}
        </motion.div>
      </motion.div>

      {/* Middle layer: parallax 0.5x */}
      <motion.div
        className="wish-layer"
        style={{ position: "absolute", inset: 0, y: reducedMotion ? yZero : midY }}
      >
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            x: tiltEnabled ? midX : 0,
            y: tiltEnabled ? midTY : 0,
          }}
        >
          {variant === "starfield"
            ? glowShapes.map((g, i) => (
                <span
                  key={i}
                  aria-hidden
                  style={
                    {
                      position: "absolute",
                      left: `${g.left}%`,
                      top: `${g.top}%`,
                      width: g.size,
                      height: g.size,
                      borderRadius: g.ring ? 9999 : "50%",
                      border: g.ring ? `10px solid ${g.color}` : undefined,
                      background: g.ring ? "transparent" : g.color,
                      opacity: 0.3,
                      filter: "blur(40px)",
                    } as React.CSSProperties
                  }
                />
              ))
            : null}

          {variant === "bokeh" ? (
            <>
              {balloons.map((b, i) => (
                <span
                  key={i}
                  aria-hidden
                  style={
                    {
                      position: "absolute",
                      left: `${b.left}%`,
                      bottom: -140,
                      width: b.size,
                      height: b.size * 1.2,
                      opacity: 0.9,
                      animation: reducedMotion
                        ? undefined
                        : `wish-rise ${b.dur}s linear ${b.delay}s infinite`,
                    } as React.CSSProperties
                  }
                >
                  <svg viewBox="0 0 40 60" width="100%" height="100%" aria-hidden>
                    <ellipse cx="20" cy="22" rx="18" ry="21" fill={b.color} />
                    <ellipse cx="13" cy="15" rx="5" ry="7" fill="#FFFFFF" opacity="0.4" />
                    <path d="M20 43 l-4 6 h8 z" fill={b.color} />
                    <path d="M20 49 q4 6 0 11" stroke={b.color} strokeWidth="1" fill="none" />
                  </svg>
                </span>
              ))}
              {doodles.map((d, i) => (
                <span
                  key={i}
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: `${d.left}%`,
                    top: `${d.top}%`,
                    transform: `rotate(${d.rot}deg)`,
                    opacity: 0.7,
                  }}
                >
                  <Doodle kind={d.kind} color={tokens.colors.primary} size={d.size} />
                </span>
              ))}
            </>
          ) : null}

          {variant === "gold-frame"
            ? petals.map((p, i) => (
                <span
                  key={i}
                  aria-hidden
                  style={
                    {
                      position: "absolute",
                      left: `${p.left}%`,
                      top: -60,
                      opacity: 0.85,
                      animation: reducedMotion
                        ? undefined
                        : `wish-fall ${p.dur}s linear ${p.delay}s infinite`,
                    } as React.CSSProperties
                  }
                >
                  <Petal color={p.color} size={p.size} />
                </span>
              ))
            : null}
        </motion.div>
      </motion.div>

      {/* Front layer: the text, parallax 1x (no scroll transform) */}
      <motion.div
        className="wish-layer"
        style={{
          position: "absolute",
          inset: 0,
          x: tiltEnabled ? frontX : 0,
          y: tiltEnabled ? frontY : 0,
        }}
      >
        <div
          style={{
            position: "relative",
            height: "100%",
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 12,
          }}
        >
          {variant === "gold-frame" ? (
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 20,
                border: `1px solid ${tokens.colors.primary}99`,
                pointerEvents: "none",
              }}
            >
              <Corners color={tokens.colors.primary} />
            </div>
          ) : null}

          <motion.p
            initial={startedHero ? fade(0.1).initial : { opacity: 0 }}
            animate={startedHero ? fade(0.1).animate : { opacity: 0 }}
            transition={fade(0.1).transition}
            style={{
              margin: 0,
              fontSize: "clamp(20px, 5vw, 36px)",
              fontWeight: 600,
              color: tokens.colors.text,
              fontFamily: "var(--f-display)",
              lineHeight: 1.35,
              overflowWrap: "anywhere",
            }}
          >
            {greeting}
          </motion.p>

          <div
            aria-label={`${displayName}!`}
            style={{
              position: "relative",
              fontFamily: "var(--f-display)",
              fontStyle: variant === "gold-frame" ? "italic" : "normal",
              fontWeight: variant === "gold-frame" ? 600 : 700,
              fontSize: nameSize,
              lineHeight: 1.05,
              overflowWrap: "anywhere",
              maxWidth: "100%",
              background: nameBackground,
              backgroundSize: variant === "gold-frame" ? "200% 100%" : undefined,
              WebkitBackgroundClip: variant === "gold-frame" ? "text" : undefined,
              backgroundClip: variant === "gold-frame" ? "text" : undefined,
              WebkitTextFillColor: variant === "gold-frame" ? "transparent" : undefined,
              color: variant === "gold-frame" ? "transparent" : tokens.colors.text,
              textShadow:
                variant === "starfield"
                  ? `0 0 16px ${tokens.colors.primary}, 0 0 48px ${tokens.colors.primary}`
                  : undefined,
            }}
          >
            {chars.map((ch, i) => (
              <motion.span
                key={`${i}-${ch}`}
                aria-hidden
                initial={
                  startedHero
                    ? reducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 40 }
                    : { opacity: 0 }
                }
                animate={
                  startedHero
                    ? reducedMotion
                      ? { opacity: 1 }
                      : { opacity: 1, y: 0 }
                    : { opacity: 0 }
                }
                transition={
                  reducedMotion
                    ? { duration: 0.3 }
                    : { ...(variant === "bokeh" ? SPRING_POP : SPRING), delay: 0.3 + i * 0.06 }
                }
                style={{
                  display: "inline-block",
                  transform: variant === "bokeh" ? `rotate(${i % 2 === 0 ? -3 : 3}deg)` : undefined,
                }}
              >
                {ch}
              </motion.span>
            ))}
            <motion.span
              aria-hidden
              initial={
                startedHero
                  ? reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 40 }
                  : { opacity: 0 }
              }
              animate={
                startedHero
                  ? reducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, y: 0 }
                  : { opacity: 0 }
              }
              transition={
                reducedMotion
                  ? { duration: 0.3 }
                  : {
                      ...(variant === "bokeh" ? SPRING_POP : SPRING),
                      delay: 0.3 + chars.length * 0.06,
                    }
              }
              style={{ display: "inline-block" }}
            >
              !
            </motion.span>
            {variant === "gold-frame" && !reducedMotion ? (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: "40%",
                  pointerEvents: "none",
                  background:
                    "linear-gradient(100deg, transparent, rgba(245,230,200,0.55), transparent)",
                  animation: "wish-shimmer 6s linear infinite",
                }}
              />
            ) : null}
          </div>

          <motion.p
            initial={startedHero ? fade(reducedMotion ? 0 : 1.0).initial : { opacity: 0 }}
            animate={startedHero ? fade(reducedMotion ? 0 : 1.0).animate : { opacity: 0 }}
            transition={fade(reducedMotion ? 0 : 1.0).transition}
            style={{
              margin: 0,
              fontSize: variant === "bokeh" ? "clamp(22px, 5.6vw, 34px)" : "clamp(16px, 4vw, 24px)",
              fontFamily: variant === "bokeh" ? "var(--f-hand)" : "var(--f-display)",
              color: tokens.colors.muted,
              lineHeight: isHindi ? 1.6 : 1.4,
              overflowWrap: "anywhere",
            }}
          >
            {sub}
          </motion.p>

          <motion.div
            initial={startedHero ? { opacity: 0 } : { opacity: 0 }}
            animate={startedHero ? { opacity: 1 } : { opacity: 0 }}
            transition={
              reducedMotion ? { duration: 0.3 } : { duration: 0.8, ease: EASE, delay: 1.6 }
            }
            style={{
              marginTop: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              color: tokens.colors.muted,
              fontFamily: bodyFont,
              fontSize: 14,
            }}
          >
            <span>{t("hero.scroll")}</span>
            <span
              aria-hidden
              className={reducedMotion ? undefined : "wish-bob"}
              style={{ display: "inline-flex" }}
            >
              <ChevronDown size={22} />
            </span>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
