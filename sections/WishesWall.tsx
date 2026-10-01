"use client";

// Wishes wall (docs/04 SECTION 5.8): loads the newest wishes, posts a new one optimistically
// and styles the cards per template variant.
import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useWish } from "@/components/wish/WishProvider";
import { useViewport } from "@/lib/wish-hooks";
import { EASE, SPRING_POP, STAGGER, rise } from "@/lib/motion";
import { api, ApiError } from "@/lib/client-api";
import { SAMPLE_WISHES } from "@/lib/sample-data";
import { seededRandom } from "@/lib/text";
import type { PublicWish } from "@/lib/wish-types";
import type { SectionProps, ThemeTokens } from "@/lib/wish-theme";

const PAGE_SIZE = 9;
const MAX_NAME = 40;
const MAX_MESSAGE = 280;

// The eight emoji presets, written as escapes because source files never contain emoji.
const EMOJI_PRESETS = [
  "\u{1F389}",
  "\u2764\uFE0F",
  "\u{1F973}",
  "\u{1F382}",
  "\u2728",
  "\u{1F64C}",
  "\u{1F60D}",
  "\u{1F381}",
];

const STICKY_ROTATIONS = [-3, 2, -1, 3, -2];

type WishVariant = ThemeTokens["variants"]["wishes"];

// A wish plus the React key it keeps for its whole life, so the optimistic card is not
// remounted when the stored record replaces it.
type WallItem = { key: string; wish: PublicWish };

type WallStyles = {
  card: CSSProperties;
  message: CSSProperties;
  name: CSSProperties;
  input: CSSProperties;
  submit: CSSProperties;
  chip: CSSProperties;
  chipOn: CSSProperties;
  align: "left" | "center";
};

const toItems = (wishes: PublicWish[]): WallItem[] =>
  wishes.map((wish) => ({ key: wish.id, wish }));

// Seeded bob duration (6-9s) and negative delay so every card floats out of phase but stays
// identical on the server and the client.
function floatStyle(id: string): CSSProperties {
  const rand = seededRandom(id);
  const duration = 6 + rand() * 3;
  const delay = -rand() * 3;
  return {
    animation: `wish-bob ${duration.toFixed(2)}s ease-in-out ${delay.toFixed(2)}s infinite`,
  };
}

// Entrance: the first row staggers in with the standard rise, later cards only fade.
function entranceFor(index: number, reduced: boolean) {
  if (index < 3) return rise(reduced, index * STAGGER);
  return {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    transition: { duration: reduced ? 0.3 : 0.5, ease: EASE },
  };
}

// Card, input and button styling for the three wishes variants (docs/04 SECTION 5.8).
function wallStyles(variant: WishVariant, tokens: ThemeTokens, index = 0): WallStyles {
  const input: CSSProperties = {
    width: "100%",
    minHeight: 48,
    padding: "12px 14px",
    fontSize: 16,
    lineHeight: 1.5,
    fontFamily: tokens.fonts.body,
    outlineColor: tokens.colors.primary,
  };

  if (variant === "sticky") {
    return {
      card: {
        background: tokens.decorColors[index % tokens.decorColors.length] ?? tokens.colors.surface,
        border: `1px solid ${tokens.colors.primary}40`,
        borderRadius: 4,
        padding: "24px 16px 20px",
        boxShadow: "0 6px 14px rgba(74, 43, 79, 0.12)",
        rotate: `${STICKY_ROTATIONS[index % STICKY_ROTATIONS.length]}deg`,
      },
      message: {
        fontFamily: tokens.fonts.hand,
        fontSize: 20,
        lineHeight: 1.5,
        color: tokens.colors.text,
      },
      name: { fontFamily: tokens.fonts.hand, fontSize: 18, color: tokens.colors.text },
      input: {
        ...input,
        background: "#FFFFFF",
        border: `1px solid ${tokens.colors.primary}66`,
        borderRadius: 16,
        color: tokens.colors.text,
      },
      submit: { background: tokens.colors.primary, color: tokens.colors.text, borderRadius: 9999 },
      chip: {
        background: "#FFFFFF",
        border: `1px solid ${tokens.colors.primary}40`,
        borderRadius: 12,
      },
      chipOn: {
        background: `${tokens.colors.primary}26`,
        border: `2px solid ${tokens.colors.primary}`,
        borderRadius: 12,
      },
      align: "center",
    };
  }

  if (variant === "ivory") {
    return {
      card: {
        background: "#F5E6C8",
        border: `1px solid ${tokens.colors.primary}`,
        borderRadius: 2,
        padding: 18,
      },
      message: {
        fontFamily: tokens.fonts.display,
        fontStyle: "italic",
        fontSize: 16,
        lineHeight: 1.5,
        color: "#1a1410",
      },
      name: { fontFamily: tokens.fonts.body, fontSize: 18, color: "#1a1410" },
      input: {
        ...input,
        background: "rgba(245, 230, 200, 0.06)",
        border: "none",
        borderBottom: `1px solid ${tokens.colors.primary}`,
        borderRadius: 0,
        color: tokens.colors.text,
      },
      submit: { background: tokens.colors.primary, color: tokens.colors.bg, borderRadius: 2 },
      chip: {
        background: "rgba(245, 230, 200, 0.08)",
        border: `1px solid ${tokens.colors.primary}66`,
        borderRadius: 2,
      },
      chipOn: {
        background: `${tokens.colors.primary}33`,
        border: `2px solid ${tokens.colors.primary}`,
        borderRadius: 2,
      },
      align: "center",
    };
  }

  return {
    card: {
      background: `${tokens.colors.surface}8C`,
      border: `1px solid ${tokens.colors.primary}73`,
      borderRadius: 16,
      padding: 18,
    },
    message: {
      fontFamily: tokens.fonts.body,
      fontSize: 16,
      lineHeight: 1.5,
      color: tokens.colors.text,
    },
    name: { fontFamily: tokens.fonts.hand, fontSize: 18, color: tokens.colors.secondary },
    input: {
      ...input,
      background: "rgba(255, 255, 255, 0.06)",
      border: `1px solid ${tokens.colors.primary}73`,
      borderRadius: 12,
      color: tokens.colors.text,
    },
    submit: { background: tokens.colors.primary, color: tokens.colors.bg, borderRadius: 12 },
    chip: {
      background: "rgba(255, 255, 255, 0.06)",
      border: `1px solid ${tokens.colors.muted}66`,
      borderRadius: 10,
    },
    chipOn: {
      background: `${tokens.colors.primary}33`,
      border: `2px solid ${tokens.colors.primary}`,
      borderRadius: 10,
    },
    align: "left",
  };
}

// One wish card: the outer element runs the entrance, the inner wrapper carries the float.
// "pop" is a freshly posted wish, "settled" one that already popped (never re-enters).
function WishCard({
  wish,
  index,
  variant,
  tokens,
  reduced,
  state,
}: {
  wish: PublicWish;
  index: number;
  variant: WishVariant;
  tokens: ThemeTokens;
  reduced: boolean;
  state: "pop" | "settled" | "entrance";
}) {
  const viewport = useViewport();
  const styles = wallStyles(variant, tokens, index);
  const entrance =
    state === "pop"
      ? {
          initial: reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          transition: reduced ? { duration: 0.3 } : SPRING_POP,
        }
      : state === "settled"
        ? { initial: false, animate: { opacity: 1, scale: 1 } }
        : { ...entranceFor(index, reduced), viewport };

  return (
    <motion.article
      {...entrance}
      style={{ ...styles.card, position: "relative", overflowWrap: "anywhere" }}
    >
      <div
        className={reduced ? undefined : "wish-bob"}
        style={{ position: "relative", ...(reduced ? {} : floatStyle(wish.id)) }}
      >
        {variant === "sticky" && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: -18,
              left: "50%",
              marginLeft: -30,
              width: 60,
              height: 18,
              background: "rgba(255, 255, 255, 0.6)",
              borderRadius: 2,
            }}
          />
        )}
        {variant === "ivory" && (
          <svg
            aria-hidden
            width="10"
            height="10"
            viewBox="0 0 10 10"
            style={{ position: "absolute", top: -14, left: "50%", marginLeft: -5 }}
          >
            <rect
              x="2.2"
              y="2.2"
              width="5.6"
              height="5.6"
              fill="none"
              stroke={tokens.colors.primary}
              strokeWidth="1"
              transform="rotate(45 5 5)"
            />
          </svg>
        )}
        {wish.emoji && (
          <p aria-hidden style={{ margin: "0 0 8px", fontSize: 28, lineHeight: 1 }}>
            {wish.emoji}
          </p>
        )}
        <p
          style={{ ...styles.message, margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
        >
          {wish.message}
        </p>
        <p style={{ ...styles.name, margin: "12px 0 0" }}>- {wish.name}</p>
      </div>
    </motion.article>
  );
}

export function WishesWall({ data, tokens }: SectionProps) {
  const { mode, t, reducedMotion } = useWish();
  const viewport = useViewport();
  const variant = tokens.variants.wishes;
  const preview = mode === "preview";
  const styles = wallStyles(variant, tokens);

  const [items, setItems] = useState<WallItem[] | null>(() =>
    preview ? toItems(SAMPLE_WISHES) : null,
  );
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [emoji, setEmoji] = useState("");
  const [pending, setPending] = useState(false);
  const [popKey, setPopKey] = useState<string | null>(null);
  const [popped, setPopped] = useState<string[]>([]);

  // Reads the wall from EP-21; used on mount and by the Retry button.
  const load = useCallback(async () => {
    setFailed(false);
    setItems(null);
    setVisible(PAGE_SIZE);
    try {
      const res = await api<{ items: PublicWish[] }>(`/public/pages/${data.slug}/wishes`);
      setItems(toItems(res.items));
    } catch {
      setItems(null);
      setFailed(true);
    }
  }, [data.slug]);

  useEffect(() => {
    if (preview) return;
    void load();
  }, [preview, load]);

  // Optimistically inserts the wish, then swaps in the stored record or rolls it back.
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();
    if (preview || pending || !trimmedName || !trimmedMessage) return;

    const tempKey = `pending-${Date.now()}`;
    const optimistic: WallItem = {
      key: tempKey,
      wish: {
        id: tempKey,
        name: trimmedName,
        message: trimmedMessage,
        emoji,
        createdAt: new Date().toISOString(),
      },
    };
    setItems((prev) => [optimistic, ...(prev ?? [])]);
    setPopKey(tempKey);
    setPopped((prev) => [...prev, tempKey]);
    setPending(true);
    try {
      const res = await api<{ wish: PublicWish }>(`/public/pages/${data.slug}/wishes`, {
        method: "POST",
        body: { name: trimmedName, message: trimmedMessage, emoji },
      });
      setItems((prev) =>
        (prev ?? []).map((item) =>
          item.key === tempKey ? { key: tempKey, wish: res.wish } : item,
        ),
      );
      setMessage("");
      toast.success(t("wishes.thanks"));
    } catch (err) {
      setItems((prev) => (prev ?? []).filter((item) => item.key !== tempKey));
      setPopKey(null);
      if (err instanceof ApiError && err.status === 429) toast.error(t("wishes.limit"));
      else if (err instanceof ApiError && err.code === "PROFANITY")
        toast.error(t("wishes.profanity"));
      else toast.error(t("wishes.error"));
    } finally {
      setPending(false);
    }
  };

  if (!data.settings.wishesWall) return null;

  const list = items ?? [];
  const shown = list.slice(0, visible);

  return (
    <section
      id="wishes"
      className="wish-section px-6 py-16 md:py-24"
      style={{ background: tokens.colors.bgAlt }}
    >
      <div className="mx-auto w-full max-w-[1100px]">
        <motion.h2
          {...rise(reducedMotion)}
          viewport={viewport}
          style={{
            margin: 0,
            fontFamily: tokens.fonts.display,
            fontSize: "clamp(22px, 5vw, 32px)",
            lineHeight: 1.25,
            textAlign: styles.align,
            color: tokens.colors.text,
          }}
        >
          {t("wishes.title")}
        </motion.h2>

        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          style={{ marginTop: 32 }}
        >
          {items === null &&
            !failed &&
            [0, 1, 2].map((index) => (
              <div
                key={index}
                aria-hidden
                style={{
                  ...wallStyles(variant, tokens, index + 1).card,
                  height: 150,
                  opacity: 0.45,
                  animation: "wish-pulse 1.6s ease-in-out infinite",
                }}
              />
            ))}

          {failed && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "24px 0" }}>
              <p style={{ margin: "0 0 12px", color: tokens.colors.muted, fontSize: 15 }}>
                {t("wishes.error")}
              </p>
              {/* No retry key exists in the locale files (outside this file set), so the
                  closest translated action label is reused. */}
              <button
                type="button"
                onClick={() => void load()}
                style={{
                  ...styles.submit,
                  minHeight: 44,
                  padding: "0 20px",
                  border: "none",
                  fontFamily: tokens.fonts.body,
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                {t("wishes.retry")}
              </button>
            </div>
          )}

          {items !== null && list.length === 0 && (
            <p
              style={{
                gridColumn: "1 / -1",
                margin: 0,
                padding: "32px 0",
                textAlign: "center",
                color: tokens.colors.muted,
                fontSize: 15,
              }}
            >
              {t("wishes.empty")}
            </p>
          )}

          {shown.map((item, index) => (
            <WishCard
              key={item.key}
              wish={item.wish}
              index={index}
              variant={variant}
              tokens={tokens}
              reduced={reducedMotion}
              state={
                item.key === popKey ? "pop" : popped.includes(item.key) ? "settled" : "entrance"
              }
            />
          ))}

          {list.length > visible && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setVisible((value) => value + PAGE_SIZE)}
                style={{
                  ...styles.chip,
                  minHeight: 44,
                  padding: "0 20px",
                  color: tokens.colors.text,
                  fontFamily: tokens.fonts.body,
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                {t("wishes.more")}
              </button>
            </div>
          )}
        </div>

        <form
          onSubmit={submit}
          style={{ maxWidth: 520, margin: "40px auto 0", display: "grid", gap: 12 }}
        >
          {preview && (
            <p style={{ margin: 0, textAlign: "center", color: tokens.colors.muted, fontSize: 14 }}>
              {t("wishes.previewNote")}
            </p>
          )}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={MAX_NAME}
            placeholder={t("wishes.name")}
            aria-label={t("wishes.name")}
            disabled={preview || pending}
            style={{ ...styles.input, opacity: preview ? 0.65 : 1 }}
          />
          <div>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={MAX_MESSAGE}
              rows={3}
              placeholder={t("wishes.message")}
              aria-label={t("wishes.message")}
              disabled={preview || pending}
              style={{
                ...styles.input,
                resize: "none",
                display: "block",
                opacity: preview ? 0.65 : 1,
              }}
            />
            <p
              style={{
                margin: "4px 0 0",
                textAlign: "right",
                color: tokens.colors.muted,
                fontSize: 13,
              }}
            >
              {message.length} / {MAX_MESSAGE}
            </p>
          </div>
          <div
            role="group"
            aria-label={t("wishes.add")}
            style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
          >
            {EMOJI_PRESETS.map((preset) => {
              const selected = preset === emoji;
              return (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={selected}
                  disabled={preview || pending}
                  onClick={() => setEmoji(selected ? "" : preset)}
                  style={{
                    ...(selected ? styles.chipOn : styles.chip),
                    width: 44,
                    height: 44,
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    lineHeight: 1,
                    opacity: preview || pending ? 0.6 : 1,
                    cursor: "pointer",
                  }}
                >
                  {preset}
                </button>
              );
            })}
          </div>
          <motion.button
            type="submit"
            disabled={preview || pending}
            whileTap={{ scale: 0.97 }}
            style={{
              ...styles.submit,
              minHeight: 48,
              border: "none",
              fontFamily: tokens.fonts.body,
              fontSize: 16,
              fontWeight: 600,
              opacity: preview || pending ? 0.6 : 1,
              cursor: preview || pending ? "not-allowed" : "pointer",
            }}
          >
            {pending ? t("wishes.sending") : t("wishes.send")}
          </motion.button>
        </form>
      </div>
    </section>
  );
}
