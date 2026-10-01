"use client";

// Context shared by every section of a wish page: page data, theme tokens, translation,
// reduced-motion state, smooth scroll and music controls (docs/04 SECTION 4).
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMotionValue, useReducedMotion, type MotionValue } from "framer-motion";
import type Lenis from "lenis";
import { displayName as displayNameOf, translate, type Lang } from "@/lib/i18n";
import type { ThemeTokens } from "@/lib/wish-theme";
import type { WishPageData } from "@/lib/wish-types";
import { useMusic, type MusicControls } from "./useMusic";

export type WishContextValue = {
  data: WishPageData;
  mode: "live" | "preview";
  tokens: ThemeTokens;
  accent: string;
  language: Lang;
  t: (key: string, vars?: Record<string, string | number>) => string;
  displayName: string;
  reducedMotion: boolean;
  started: boolean;
  start: () => void;
  scrollRef?: React.RefObject<HTMLElement | null>;
  lenisRef: React.MutableRefObject<Lenis | null>;
  gyro: { x: MotionValue<number>; y: MotionValue<number> };
  music: MusicControls;
};

const WishContext = createContext<WishContextValue | null>(null);

type Props = {
  data: WishPageData;
  mode: "live" | "preview";
  tokens: ThemeTokens;
  scrollRef?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
};

export function WishProvider({ data, mode, tokens, scrollRef, children }: Props) {
  const prefersReduced = useReducedMotion();
  const reducedMotion = !!prefersReduced;
  const [started, setStarted] = useState(mode === "preview");
  const lenisRef = useRef<Lenis | null>(null);
  const gyroX = useMotionValue(0);
  const gyroY = useMotionValue(0);
  const music = useMusic(data.theme.music, mode === "live" && !reducedMotion);
  const musicRef = useRef(music);
  musicRef.current = music;

  const language = (data.language ?? "ENGLISH") as Lang;
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language],
  );

  // While the intro overlay is showing, the page must not scroll.
  useEffect(() => {
    if (mode !== "live" || started) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [mode, started]);

  // Device tilt: iOS needs an explicit permission request, everything else degrades
  // silently to zero (docs/04 SECTION 9.6).
  const requestGyro = useCallback(() => {
    if (typeof window === "undefined" || reducedMotion) return;
    type PermissionCtor = { requestPermission?: () => Promise<"granted" | "denied"> };
    const DOE = (window as unknown as { DeviceOrientationEvent?: PermissionCtor })
      .DeviceOrientationEvent;

    const attach = () => {
      window.addEventListener("deviceorientation", (event) => {
        const beta = Math.max(-30, Math.min(30, event.beta ?? 0));
        const gamma = Math.max(-30, Math.min(30, event.gamma ?? 0));
        gyroX.set(gamma / 30);
        gyroY.set(beta / 30);
      });
    };

    try {
      if (DOE && typeof DOE.requestPermission === "function") {
        DOE.requestPermission()
          .then((state) => {
            if (state === "granted") attach();
          })
          .catch(() => undefined);
      } else {
        attach();
      }
    } catch {
      // Denied or unsupported: tilt simply stays at 0.
    }
  }, [gyroX, gyroY, reducedMotion]);

  const start = useCallback(() => {
    setStarted(true);
    // Music starts inside the tap gesture, before any await.
    musicRef.current.play();
    document.documentElement.style.overflow = "";
    lenisRef.current?.start();
    requestGyro();
  }, [requestGyro]);

  const value = useMemo<WishContextValue>(
    () => ({
      data,
      mode,
      tokens,
      accent: data.theme.accent,
      language,
      t,
      displayName: displayNameOf(data),
      reducedMotion,
      started,
      start,
      scrollRef,
      lenisRef,
      gyro: { x: gyroX, y: gyroY },
      music,
    }),
    [
      data,
      mode,
      tokens,
      language,
      t,
      reducedMotion,
      started,
      start,
      scrollRef,
      gyroX,
      gyroY,
      music,
    ],
  );

  return <WishContext.Provider value={value}>{children}</WishContext.Provider>;
}

// Every section reads the page through this hook.
export function useWish() {
  const ctx = useContext(WishContext);
  if (!ctx) throw new Error("useWish must be used inside WishProvider");
  return ctx;
}
