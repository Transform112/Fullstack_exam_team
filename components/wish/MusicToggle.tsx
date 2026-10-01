"use client";

// Floating music control for a live page (docs/04 SECTION 5.10). It appears only after the
// intro tap, only when the page has a track, and only while that track is playable.
import { Volume2, VolumeX } from "lucide-react";
import { useWish } from "@/components/wish/WishProvider";
import type { ThemeTokens } from "@/lib/wish-theme";

const BAR_DELAYS = [0, 0.15, 0.3];

export function MusicToggle({ tokens }: { tokens: ThemeTokens }) {
  const { mode, started, data, music, t } = useWish();

  if (mode !== "live" || !started || data.theme.music === "none" || !music.available) return null;

  const audible = music.playing && !music.muted;
  const label = audible ? t("music.on") : t("music.off");

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(16px + env(safe-area-inset-bottom))",
        right: "calc(16px + env(safe-area-inset-right))",
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {audible && (
        <span aria-hidden style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 14 }}>
          {BAR_DELAYS.map((delay) => (
            <span
              key={delay}
              className="wish-flicker"
              style={{
                display: "block",
                width: 3,
                height: 14,
                borderRadius: 2,
                background: tokens.colors.primary,
                transformOrigin: "bottom center",
                animation: `wish-flicker 0.9s ease-in-out ${delay}s infinite`,
              }}
            />
          ))}
        </span>
      )}
      <button
        type="button"
        onClick={music.toggleMute}
        aria-label={label}
        style={{
          width: 44,
          height: 44,
          borderRadius: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `${tokens.colors.surface}CC`,
          border: `1px solid ${tokens.colors.primary}80`,
          color: tokens.colors.text,
          cursor: "pointer",
          pointerEvents: "auto",
        }}
      >
        {audible ? <Volume2 size={20} aria-hidden /> : <VolumeX size={20} aria-hidden />}
      </button>
    </div>
  );
}
