"use client";

// Message section (docs/04 SECTION 5.4): the creator's words, revealed by a grapheme
// typewriter (Neon Night, Royal Gold) or a word-by-word fade (Pastel Dream).
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Typewriter } from "@/components/wish/Typewriter";
import { useWish } from "@/components/wish/WishProvider";
import { EASE } from "@/lib/motion";
import { useViewport } from "@/lib/wish-hooks";
import type { SectionProps } from "@/lib/wish-theme";

// A gold ornament divider used above and below the Royal Gold message block.
function Ornament({ color }: { color: string }) {
  return (
    <div
      aria-hidden
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
    >
      <span style={{ display: "block", width: 90, height: 1, background: color }} />
      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
        <path d="M8 0l8 8-8 8-8-8z" fill={color} />
      </svg>
      <span style={{ display: "block", width: 90, height: 1, background: color }} />
    </div>
  );
}

// Word-by-word reveal for the Pastel Dream variant, driven by the section entrance so
// the words cannot start before their message's turn.
function Words({
  text,
  show,
  reduced,
  base,
  scale,
  wordStyle,
}: {
  text: string;
  show: boolean;
  reduced: boolean;
  base: number;
  scale: number;
  wordStyle: React.CSSProperties;
}) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => {
        const delay = Math.min(3, (base + i) * 0.08 * scale);
        return (
          <motion.span
            key={`${i}-${w}`}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={show ? { opacity: 1, y: 0 } : reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
            transition={reduced ? { duration: 0.3 } : { duration: 0.5, ease: EASE, delay }}
            style={wordStyle}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        );
      })}
    </>
  );
}

export function Message({ data, tokens }: SectionProps) {
  const { t, reducedMotion, language } = useWish();
  const viewport = useViewport();
  const sectionRef = useRef<HTMLElement | null>(null);
  const inView = useInView(sectionRef, { ...viewport, root: viewport.root as never });
  const [activeIndex, setActiveIndex] = useState(0);
  // Holds the latest index so the typewriter's onDone can advance without re-subscribing.
  const activeRef = useRef(0);
  activeRef.current = activeIndex;

  const variant = tokens.variants.message;
  const messages = data.messages.slice(0, 5).filter((m) => m.trim().length > 0);
  const isHindi = language === "HINDI";
  const hand = data.theme.font === "handwriting";
  const size = hand ? "clamp(27.5px, 6.9vw, 42.5px)" : "clamp(22px, 5.5vw, 34px)";
  const font = hand ? "var(--f-hand)" : "var(--f-body)";
  const lineHeight = isHindi ? 1.7 : 1.5;

  useEffect(() => {
    if (reducedMotion) setActiveIndex(messages.length);
  }, [reducedMotion, messages.length]);

  if (messages.length === 0) return null;

  const wordCounts = messages.map((m) => m.split(" ").length);
  // Delay base of each message: every earlier message's words already consumed slots.
  const delayBase = messages.map((_, i) => wordCounts.slice(0, i).reduce((sum, n) => sum + n, 0));
  const typewriterDone = (index: number) => () => {
    if (activeRef.current === index) setActiveIndex(index + 1);
  };

  const blockStyle: React.CSSProperties = {
    margin: 0,
    fontFamily: font,
    fontSize: size,
    lineHeight,
    color: tokens.colors.text,
    letterSpacing: isHindi ? "normal" : undefined,
    overflowWrap: "anywhere",
    textAlign: variant === "word-fade" ? "center" : "left",
  };

  return (
    <section
      ref={sectionRef}
      id="message"
      className="wish-section px-6 py-16 md:py-24"
      style={{ background: tokens.colors.bgAlt, minHeight: "var(--wish-vh)" }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <p
          style={{
            margin: "0 0 28px",
            fontSize: 18,
            color: tokens.colors.muted,
            textAlign: "center",
            fontFamily: "var(--f-body)",
            lineHeight: 1.5,
          }}
        >
          {t("message.title")}
        </p>

        {variant === "word-fade" ? (
          <div
            style={{
              position: "relative",
              background: tokens.colors.surface,
              borderRadius: 28,
              padding: 28,
              transform: "rotate(-1.2deg)",
              border: `2px dashed ${tokens.colors.primary}99`,
              overflowWrap: "anywhere",
            }}
          >
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: -12,
                left: "50%",
                width: 80,
                height: 24,
                marginLeft: -40,
                background: `${tokens.colors.tertiary}b3`,
                transform: "rotate(-2deg)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {messages.map((m, i) => (
                <p key={i} style={blockStyle}>
                  <Words
                    text={m}
                    show={inView}
                    reduced={reducedMotion}
                    base={delayBase[i]}
                    scale={wordCounts[i] * 0.08 > 3 ? 3 / (wordCounts[i] * 0.08) : 1}
                    wordStyle={{ display: "inline-block", whiteSpace: "pre" }}
                  />
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 32,
              alignItems:
                variant === "typewriter" && tokens.id === "royal-gold" ? "center" : "stretch",
            }}
          >
            {variant === "typewriter" && tokens.id === "royal-gold" ? (
              <Ornament color={tokens.colors.primary} />
            ) : null}

            {messages.map((m, i) => {
              const active = inView && activeIndex === i;
              // Messages still waiting their turn keep their space but stay invisible.
              const started = reducedMotion || activeIndex >= i;
              const body = (
                <span aria-label={m}>
                  {active ? (
                    <Typewriter
                      key={`${i}-${m}`}
                      text={m}
                      active
                      reduced={reducedMotion}
                      onDone={typewriterDone(i)}
                      caretColor={tokens.colors.primary}
                    />
                  ) : (
                    <span aria-hidden>{m}</span>
                  )}
                </span>
              );

              const wrapped =
                variant === "typewriter" && tokens.id === "neon-night" ? (
                  <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
                    <span aria-hidden style={{ position: "relative", flex: "0 0 3px", width: 3 }}>
                      <span
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: tokens.colors.primary,
                          filter: "blur(6px)",
                          opacity: 0.7,
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: tokens.colors.primary,
                        }}
                      />
                    </span>
                    <p style={{ ...blockStyle, flex: 1, minWidth: 0 }}>{body}</p>
                  </div>
                ) : (
                  <p style={blockStyle}>{body}</p>
                );

              const first = i === 0 && variant === "typewriter" && tokens.id === "royal-gold";

              return (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{ opacity: started ? 1 : 0 }}
                  transition={{ duration: reducedMotion ? 0.3 : 0.4, ease: EASE }}
                  style={{ position: "relative" }}
                >
                  {first ? (
                    <span
                      aria-hidden
                      style={{
                        float: "left",
                        fontSize: "3.2em",
                        lineHeight: 0.85,
                        color: tokens.colors.primary,
                        fontFamily: "var(--f-display)",
                        paddingRight: 10,
                      }}
                    >
                      {m.slice(0, 1)}
                    </span>
                  ) : null}
                  {wrapped}
                </motion.div>
              );
            })}

            {variant === "typewriter" && tokens.id === "royal-gold" ? (
              <Ornament color={tokens.colors.primary} />
            ) : null}
          </div>
        )}

        {data.from.trim() ? (
          <motion.p
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={
              reducedMotion || activeIndex >= messages.length
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: reducedMotion ? 0 : 12 }
            }
            transition={{ duration: 0.8, ease: EASE }}
            style={{
              margin: "32px 0 0",
              fontSize: 20,
              fontFamily: "var(--f-hand)",
              color: tokens.colors.muted,
              textAlign: variant === "word-fade" ? "center" : "right",
              lineHeight: isHindi ? 1.6 : 1.4,
              overflowWrap: "anywhere",
            }}
          >
            {t("message.signature", { from: data.from })}
          </motion.p>
        ) : null}
      </div>
    </section>
  );
}
