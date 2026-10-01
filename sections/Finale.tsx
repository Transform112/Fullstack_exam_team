"use client";

// Finale (docs/04 SECTION 5.9): an inline SVG cake whose candles blow out on tap, followed
// by cannon and firework confetti and the closing message with Replay and Share.
import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useWish } from "@/components/wish/WishProvider";
import { useViewport } from "@/lib/wish-hooks";
import { EASE, SPRING, rise } from "@/lib/motion";
import { cannon, fireworks } from "@/lib/confetti";
import type { SectionProps, ThemeTokens } from "@/lib/wish-theme";

type FinaleVariant = ThemeTokens["variants"]["finale"];

// Occasions that get two candles and a heart instead of five candles.
const PAIR_OCCASIONS = ["ANNIVERSARY", "WEDDING"];

// Tier geometry on the 240x240 canvas, bottom tier first.
const TIERS = [
  { x: 30, y: 168, w: 180, h: 50, drips: 6 },
  { x: 50, y: 124, w: 140, h: 44, drips: 5 },
  { x: 70, y: 86, w: 100, h: 38, drips: 4 },
];

const CANDLE_Y = 56;
const CANDLE_H = 30;
const FLAME_H = 14;
const SMOKE_STEPS = [0, 1, 2];

type CakeColors = {
  tiers: [string, string, string];
  icing: string;
  stroke: string;
  candle: string;
  flameFrom: string;
  flameTo: string;
  glow: string | null;
  plate: string;
  heart: string;
};

// Builds one tier's icing: a straight band with rounded fondant drips along its lower edge,
// drawn as arcs so no filter or image is involved.
function icingPath(x: number, y: number, w: number, drips: number): string {
  const step = w / drips;
  const bottom = y + 9;
  let d = `M ${x} ${y} H ${x + w} V ${bottom}`;
  for (let i = drips; i >= 1; i--) {
    const cx = x + step * (i - 0.5);
    const r = step * (i % 2 === 0 ? 0.34 : 0.42);
    d += ` L ${(cx + r).toFixed(2)} ${bottom} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${(cx - r).toFixed(2)} ${bottom}`;
  }
  return `${d} L ${x} ${bottom} Z`;
}

// Teardrop flame: a point at the top and a rounded base that sits on the candle.
function flamePath(cx: number, baseY: number): string {
  return `M ${cx} ${baseY - FLAME_H} Q ${cx + 6} ${baseY - 7} ${cx} ${baseY} Q ${cx - 6} ${baseY - 7} ${cx} ${baseY - FLAME_H} Z`;
}

// Heart sitting between the two candles on anniversary and wedding cakes.
function heartPath(cx: number, cy: number): string {
  return `M ${cx} ${cy + 12} C ${cx - 8} ${cy + 5} ${cx - 12} ${cy + 1} ${cx - 12} ${cy - 4} C ${cx - 12} ${cy - 9} ${cx - 8} ${cy - 12} ${cx - 4} ${cy - 12} C ${cx - 1.5} ${cy - 12} ${cx} ${cy - 10.5} ${cx} ${cy - 8.5} C ${cx} ${cy - 10.5} ${cx + 1.5} ${cy - 12} ${cx + 4} ${cy - 12} C ${cx + 8} ${cy - 12} ${cx + 12} ${cy - 9} ${cx + 12} ${cy - 4} C ${cx + 12} ${cy + 1} ${cx + 8} ${cy + 5} ${cx} ${cy + 12} Z`;
}

// Cake palette per template variant (docs/04 SECTION 5.9).
function cakeColors(variant: FinaleVariant, tokens: ThemeTokens): CakeColors {
  if (variant === "pastel") {
    return {
      tiers: ["#FBCFE8", "#C4B5FD", "#FBCFE8"],
      icing: "#FFFFFF",
      stroke: "#FFFFFF",
      candle: tokens.colors.primary,
      flameFrom: "#FDE68A",
      flameTo: "#FBBF24",
      glow: null,
      plate: "#C4B5FD",
      heart: tokens.colors.primary,
    };
  }
  if (variant === "gold") {
    return {
      tiers: ["#7F1D1D", "#F5E6C8", "#7F1D1D"],
      icing: "#D4AF37",
      stroke: "#D4AF37",
      candle: "#F5E6C8",
      flameFrom: "#FDE68A",
      flameTo: "#FBBF24",
      glow: "#D4AF37",
      plate: "#D4AF37",
      heart: "#D4AF37",
    };
  }
  return {
    tiers: ["#1a0b3a", "#1a0b3a", "#1a0b3a"],
    icing: tokens.colors.primary,
    stroke: tokens.colors.primary,
    candle: tokens.colors.secondary,
    flameFrom: "#FDE68A",
    flameTo: "#22D3EE",
    glow: "#22D3EE",
    plate: tokens.colors.surface,
    heart: tokens.colors.primary,
  };
}

export function Finale({ data, tokens }: SectionProps) {
  const { mode, t, displayName, reducedMotion, lenisRef } = useWish();
  const viewport = useViewport();
  const uid = useId().replace(/:/g, "");
  const [blown, setBlown] = useState(false);
  const timers = useRef<number[]>([]);
  const preview = mode === "preview";
  const pair = PAIR_OCCASIONS.includes(data.occasion);
  const colors = cakeColors(tokens.variants.finale, tokens);
  const candles = pair ? [90, 150] : [80, 100, 120, 140, 160];

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    },
    [],
  );

  // Blows the candles: flames out at 0.0s, smoke at 0.1s, cannon at 0.7s, fireworks at 1.4s.
  const blow = () => {
    if (blown) return;
    setBlown(true);
    if (preview || reducedMotion) return;
    const confettiColors = [
      tokens.colors.primary,
      tokens.colors.secondary,
      tokens.colors.tertiary,
      "#FBBF24",
    ];
    timers.current.push(window.setTimeout(() => void cannon(confettiColors, reducedMotion), 700));
    timers.current.push(
      window.setTimeout(() => void fireworks(confettiColors, reducedMotion), 1400),
    );
  };

  // Relights the candles, hides the closing block and scrolls the page back to the top.
  const replay = () => {
    setBlown(false);
    if (lenisRef.current) lenisRef.current.scrollTo(0, { duration: 2 });
    else window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  // Shares the page, or copies the link when the Web Share API is unavailable.
  const share = async () => {
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: document.title, url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("finale.copied"));
    } catch (err) {
      // Dismissing the share sheet is not an error, so only real failures are reported.
      if ((err as { name?: string }).name !== "AbortError") toast.error(t("wishes.error"));
    }
  };

  const buttonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    minWidth: 120,
    padding: "0 18px",
    borderRadius: 9999,
    background: `${tokens.colors.surface}CC`,
    border: `1px solid ${tokens.colors.primary}80`,
    color: tokens.colors.text,
    fontFamily: tokens.fonts.body,
    fontSize: 16,
    cursor: preview ? "not-allowed" : "pointer",
    opacity: preview ? 0.6 : 1,
  } as const;

  return (
    <section
      id="finale"
      className="wish-section px-6 py-16 md:py-24"
      style={{
        background: tokens.colors.bg,
        minHeight: "var(--wish-vh)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <motion.h2
        {...rise(reducedMotion)}
        viewport={viewport}
        style={{
          margin: 0,
          fontFamily: tokens.fonts.display,
          fontSize: "clamp(22px, 5vw, 32px)",
          lineHeight: 1.25,
          color: tokens.colors.text,
        }}
      >
        {t("finale.title")}
      </motion.h2>

      <p
        style={{
          margin: "16px 0 0",
          fontFamily: "var(--f-hand)",
          fontSize: 20,
          lineHeight: 1.5,
          color: tokens.colors.muted,
        }}
      >
        {t("finale.wish")}
      </p>

      <button
        type="button"
        onClick={blow}
        aria-label={t("finale.tap")}
        style={{
          width: "min(80vw, 300px)",
          marginTop: 8,
          padding: 0,
          background: "transparent",
          border: "none",
          cursor: blown ? "default" : "pointer",
        }}
      >
        <svg
          viewBox="0 0 240 240"
          width="100%"
          height="auto"
          aria-hidden
          style={{ display: "block" }}
        >
          <defs>
            <linearGradient id={`${uid}-flame`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.flameFrom} />
              <stop offset="100%" stopColor={colors.flameTo} />
            </linearGradient>
            {colors.glow && (
              <radialGradient id={`${uid}-glow`}>
                <stop offset="0%" stopColor={colors.glow} stopOpacity="0.55" />
                <stop offset="100%" stopColor={colors.glow} stopOpacity="0" />
              </radialGradient>
            )}
          </defs>

          {TIERS.map((tier, index) => (
            <rect
              key={`tier-${tier.y}`}
              x={tier.x}
              y={tier.y}
              width={tier.w}
              height={tier.h}
              rx={8}
              fill={colors.tiers[index]}
              stroke={colors.stroke}
              strokeWidth={2}
            />
          ))}
          {TIERS.map((tier) => (
            <path
              key={`icing-${tier.y}`}
              d={icingPath(tier.x, tier.y, tier.w, tier.drips)}
              fill={colors.icing}
            />
          ))}
          <rect x={24} y={218} width={192} height={8} rx={4} fill={colors.plate} />

          {candles.map((cx, index) => (
            <g key={cx}>
              <rect
                x={cx - 3}
                y={CANDLE_Y}
                width={6}
                height={CANDLE_H}
                rx={3}
                fill={colors.candle}
              />
              <motion.g
                initial={false}
                animate={
                  blown
                    ? reducedMotion
                      ? { opacity: 0 }
                      : { scaleY: 0, opacity: 0 }
                    : { scaleY: 1, opacity: 1 }
                }
                transition={
                  blown
                    ? {
                        duration: reducedMotion ? 0.3 : 0.35,
                        delay: reducedMotion ? 0 : index * 0.08,
                        ease: EASE,
                      }
                    : reducedMotion
                      ? { duration: 0.3 }
                      : SPRING
                }
                className={!reducedMotion && !blown ? "wish-flicker" : undefined}
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "bottom center",
                  ...(reducedMotion || blown
                    ? {}
                    : {
                        animation: `wish-flicker 0.9s ease-in-out ${(index * 0.1).toFixed(2)}s infinite`,
                      }),
                }}
              >
                {colors.glow && (
                  <circle cx={cx} cy={CANDLE_Y - 8} r={12} fill={`url(#${uid}-glow)`} />
                )}
                <path d={flamePath(cx, CANDLE_Y)} fill={`url(#${uid}-flame)`} />
              </motion.g>
              {blown &&
                !reducedMotion &&
                SMOKE_STEPS.map((step) => (
                  <motion.circle
                    key={step}
                    cx={cx}
                    cy={CANDLE_Y - 14}
                    r={3}
                    fill={tokens.colors.muted}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: [0, 0.55, 0], y: -40 }}
                    transition={{ duration: 1.2, delay: 0.1 + step * 0.1, ease: "easeOut" }}
                  />
                ))}
            </g>
          ))}

          {pair && <path d={heartPath(120, 44)} fill={colors.heart} />}
        </svg>
      </button>

      {!blown && (
        <p style={{ margin: "8px 0 0", fontSize: 14, color: tokens.colors.muted }}>
          {t("finale.tap")}
        </p>
      )}

      {blown && (
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reducedMotion ? 0.4 : 1.8,
            duration: reducedMotion ? 0.3 : 0.6,
            ease: EASE,
          }}
          style={{ marginTop: 24, maxWidth: 560 }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: tokens.fonts.display,
              fontSize: "clamp(20px, 5vw, 30px)",
              lineHeight: 1.35,
              color: tokens.colors.text,
            }}
          >
            {t("finale.closing", { name: displayName })}
          </p>
          {data.from.trim() !== "" && (
            <p
              style={{
                margin: "12px 0 0",
                fontFamily: "var(--f-hand)",
                fontSize: 20,
                lineHeight: 1.5,
                color: tokens.colors.muted,
              }}
            >
              {t("finale.signature", { from: data.from })}
            </p>
          )}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
              marginTop: 24,
            }}
          >
            <button type="button" onClick={replay} disabled={preview} style={buttonStyle}>
              <RotateCcw size={18} aria-hidden />
              {t("finale.replay")}
            </button>
            <button
              type="button"
              onClick={() => void share()}
              disabled={preview}
              style={buttonStyle}
            >
              <Share2 size={18} aria-hidden />
              {t("finale.share")}
            </button>
          </div>
        </motion.div>
      )}
    </section>
  );
}
