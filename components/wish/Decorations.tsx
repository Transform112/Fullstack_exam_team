"use client";

// Ambient decorations layer (docs/04 SECTION 5.11). A fixed (live) or absolute (preview)
// layer of CSS-keyframe loops. Counts are halved under 640px, hard capped at 24 elements
// (10 in preview) and reduced motion gets 6 static elements at opacity 0.4.
import { useEffect, useMemo, useState } from "react";
import { useWish } from "@/components/wish/WishProvider";
import { DEFAULT_DECORATIONS } from "@/lib/occasion";
import { seededRandom } from "@/lib/text";
import type { SectionProps } from "@/lib/wish-theme";

const CAP_LIVE = 24;
const CAP_PREVIEW = 10;
const CAP_REDUCED = 6;

type DecorKind = "balloons" | "confetti" | "cake" | "hearts" | "petals" | "sparkles" | "stars";

type DecorElement = {
  key: string;
  kind: DecorKind;
  color: string;
  left: number;
  top: number | null;
  bottom: number | null;
  size: number;
  w: number;
  h: number;
  radius: number;
  duration: number;
  delay: number;
  rise: boolean;
  fall: boolean;
  sway: boolean;
  twinkle: boolean;
  bob: boolean;
  dropShadow: boolean;
  opacity: number;
};

// Numbers clamped into a range, used for every seeded placement.
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// SVG silhouettes for the decorated element kinds; all aria-hidden decorations.
function Shape({ el, soft }: { el: DecorElement; soft: boolean }) {
  const s = el.size;
  if (el.kind === "balloons") {
    return (
      <svg viewBox="0 0 40 60" width={s} height={s * 1.4} aria-hidden>
        <ellipse cx="20" cy="22" rx="18" ry="21" fill={el.color} />
        <path d="M20 43 l-4 6 h8 z" fill={el.color} />
        <path d="M20 49 q4 6 0 11" stroke={el.color} strokeWidth="1" fill="none" />
      </svg>
    );
  }
  if (el.kind === "hearts") {
    return (
      <svg viewBox="0 0 24 24" width={s} height={s} aria-hidden>
        <path
          d="M12 20s-7-4.4-7-9.4A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7 2.8C19 15.6 12 20 12 20z"
          fill={el.color}
        />
      </svg>
    );
  }
  if (el.kind === "petals") {
    return (
      <svg viewBox="0 0 24 32" width={s * 0.75} height={s} aria-hidden>
        <path d="M12 1c7 9 10 15 10 20a10 10 0 0 1-20 0C2 16 5 10 12 1z" fill={el.color} />
      </svg>
    );
  }
  if (el.kind === "sparkles") {
    return (
      <svg viewBox="0 0 24 24" width={s} height={s} aria-hidden>
        <path
          d={
            soft
              ? "M12 2l2.6 6.4L21 11l-6.4 2.6L12 20l-2.6-6.4L3 11l6.4-2.6z"
              : "M12 2c1 5 2 7 7 9-5 2-6 4-7 9-1-5-2-7-7-9 5-2 6-4 7-9z"
          }
          fill={el.color}
        />
      </svg>
    );
  }
  if (el.kind === "cake") {
    return (
      <svg viewBox="0 0 48 48" width={s} height={s} aria-hidden>
        <rect x="6" y="28" width="36" height="16" rx="4" fill={el.color} />
        <rect x="12" y="18" width="24" height="12" rx="3" fill={el.color} />
        <path
          d="M14 18 q4 -6 6 0 q4 -6 6 0 q4 -6 6 0"
          stroke={el.color}
          strokeWidth="2"
          fill="none"
        />
      </svg>
    );
  }
  return null;
}

export function Decorations({ data, tokens }: SectionProps) {
  const { mode, reducedMotion } = useWish();
  const [mounted, setMounted] = useState(false);
  const [small, setSmall] = useState(false);

  // Rendered only after mount so seeded positions can never mismatch during hydration.
  useEffect(() => {
    setMounted(true);
    const measure = () => setSmall(window.innerWidth < 640);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const kinds = useMemo<DecorKind[]>(() => {
    const stored = data.theme.decorations?.filter(Boolean) ?? [];
    const list =
      stored.length > 0
        ? stored
        : (DEFAULT_DECORATIONS[data.occasion] ?? DEFAULT_DECORATIONS.CUSTOM);
    return (list as string[]).filter((k): k is DecorKind =>
      ["balloons", "confetti", "cake", "hearts", "petals", "sparkles", "stars"].includes(k),
    );
  }, [data.theme.decorations, data.occasion]);

  const elements = useMemo<DecorElement[]>(() => {
    const seed = data.slug || "preview";
    const rnd = seededRandom(seed);
    const colors = tokens.decorColors;
    const cap = mode === "preview" ? CAP_PREVIEW : CAP_LIVE;
    // Halve the per-type counts under 640px (docs/04 SECTION 9.9).
    const half = small ? 0.5 : 1;
    const soft = tokens.id === "pastel-dream";
    const royal = tokens.id === "royal-gold";
    const speed = royal ? 1.5 : 1;
    const perKind = Math.max(1, Math.floor(cap / Math.max(1, kinds.length)));
    const out: DecorElement[] = [];

    const push = (
      kind: Exclude<DecorKind, "cake">,
      count: number,
      build: (i: number) => Partial<DecorElement>,
    ) => {
      const total = Math.max(1, Math.round(count * half));
      for (let i = 0; i < total; i++) {
        out.push({
          key: `${kind}-${i}`,
          kind,
          color: colors[Math.floor(rnd() * colors.length)] ?? tokens.colors.primary,
          left: clamp(rnd() * 92, 2, 95),
          top: null,
          bottom: null,
          size: 20,
          w: 8,
          h: 12,
          radius: 9999,
          duration: 10,
          delay: -rnd() * 12,
          rise: false,
          fall: false,
          sway: false,
          twinkle: false,
          bob: false,
          dropShadow: false,
          opacity: soft ? 0.85 : royal ? 0.7 : 1,
          ...build(i),
        });
      }
    };

    if (kinds.includes("balloons")) {
      push("balloons", Math.min(6, perKind), () => ({
        size: 38 + rnd() * 26,
        bottom: -160,
        duration: (14 + rnd() * 10) * speed,
        rise: true,
        sway: true,
      }));
    }
    if (kinds.includes("confetti")) {
      push("confetti", Math.min(18, perKind), () => {
        const round = rnd() > 0.5;
        return {
          size: round ? 6 + rnd() * 4 : 0,
          w: 6,
          h: 10,
          radius: round ? 9999 : 1,
          top: -40,
          duration: (9 + rnd() * 7) * speed,
          fall: mode !== "preview",
        };
      });
    }
    if (kinds.includes("cake")) {
      // One static-size silhouette bobbing near the bottom left at 40 percent opacity.
      out.push({
        key: "cake-0",
        kind: "cake",
        color: colors[0] ?? tokens.colors.primary,
        left: clamp(rnd() * 6 + 2, 2, 10),
        top: null,
        bottom: 40,
        size: 56,
        w: 56,
        h: 56,
        radius: 0,
        duration: 5 + rnd() * 2,
        delay: -rnd() * 4,
        rise: false,
        fall: false,
        sway: false,
        twinkle: false,
        bob: true,
        dropShadow: false,
        opacity: 0.4,
      });
    }
    if (kinds.includes("hearts")) {
      push("hearts", Math.min(10, perKind), () => ({
        size: 16 + rnd() * 18,
        bottom: -120,
        color: rnd() > 0.5 ? tokens.colors.primary : tokens.colors.highlight,
        duration: (12 + rnd() * 8) * speed,
        rise: true,
        twinkle: true,
      }));
    }
    if (kinds.includes("petals")) {
      push("petals", Math.min(14, perKind), () => {
        const palette = royal
          ? ["#7F1D1D", "#D4AF37"]
          : soft
            ? ["#FBCFE8", "#C4B5FD"]
            : [tokens.colors.primary, tokens.colors.secondary];
        return {
          size: 14 + rnd() * 12,
          top: -60,
          color: palette[Math.floor(rnd() * palette.length)],
          duration: (14 + rnd() * 10) * speed,
          fall: true,
          sway: true,
        };
      });
    }
    if (kinds.includes("sparkles")) {
      push("sparkles", Math.min(16, perKind), () => ({
        size: 8 + rnd() * 10,
        top: clamp(rnd() * 96, 1, 95),
        duration: (2 + rnd() * 3) * speed,
        twinkle: true,
      }));
    }
    if (kinds.includes("stars")) {
      push("stars", Math.min(24, perKind), () => ({
        size: 2 + rnd() * 2,
        top: clamp(rnd() * 96, 1, 95),
        w: 2 + rnd() * 2,
        h: 2 + rnd() * 2,
        duration: (2 + rnd() * 4) * speed,
        twinkle: true,
      }));
    }

    return out.slice(0, cap);
  }, [
    data.slug,
    kinds,
    mode,
    small,
    tokens.decorColors,
    tokens.id,
    tokens.colors.primary,
    tokens.colors.secondary,
    tokens.colors.highlight,
  ]);

  if (!mounted) return null;

  const soft = tokens.id === "pastel-dream";
  const royal = tokens.id === "royal-gold";
  const staticCount = reducedMotion ? Math.min(CAP_REDUCED, elements.length) : elements.length;
  const shown = elements.slice(0, staticCount);

  return (
    <div
      aria-hidden
      style={{
        position: mode === "live" ? "fixed" : "absolute",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {shown.map((el) => {
        const animated = !reducedMotion;
        // Loops live on the outer box; sway/rotation lives on an inner wrapper so the
        // two keyframes never fight over the same transform.
        const outerAnimation = animated
          ? el.rise
            ? `wish-rise ${el.duration}s linear ${el.delay}s infinite`
            : el.fall
              ? `wish-fall ${el.duration}s linear ${el.delay}s infinite`
              : el.bob
                ? `wish-bob ${el.duration}s ease-in-out ${el.delay}s infinite`
                : el.twinkle
                  ? `wish-twinkle ${el.duration}s ease-in-out ${el.delay}s infinite`
                  : undefined
          : undefined;
        const innerAnimation = animated
          ? el.sway
            ? `wish-sway ${el.duration / 2}s ease-in-out ${el.delay}s infinite`
            : undefined
          : undefined;
        const isDot = el.kind === "stars";

        return (
          <span
            key={el.key}
            style={
              {
                position: "absolute",
                left: `${el.left}%`,
                ...(el.top !== null ? { top: el.top } : {}),
                ...(el.bottom !== null ? { bottom: el.bottom } : {}),
                width: isDot ? el.w : el.size,
                height: isDot ? el.h : "auto",
                opacity: animated ? el.opacity : 0.4,
                animation: outerAnimation,
                filter:
                  animated && tokens.id === "neon-night"
                    ? `drop-shadow(0 0 6px ${el.color})`
                    : undefined,
              } as React.CSSProperties
            }
          >
            <span style={{ display: "block", animation: innerAnimation }}>
              {isDot ? (
                <span
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    borderRadius: 9999,
                    background: el.color,
                  }}
                />
              ) : el.kind === "confetti" ? (
                <span
                  style={{
                    display: "block",
                    width: el.w,
                    height: el.h,
                    borderRadius: el.radius,
                    background: el.color,
                    transform: royal ? "scale(0.9)" : undefined,
                  }}
                />
              ) : (
                <Shape el={el} soft={soft} />
              )}
            </span>
          </span>
        );
      })}
    </div>
  );
}
