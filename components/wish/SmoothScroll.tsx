"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useWish } from "./WishProvider";

// Mounts Lenis only in live mode, never with reduced motion, and keeps it locked until
// the intro is tapped (docs/04 SECTION 4.2).
export function SmoothScroll() {
  const { mode, reducedMotion, started, lenisRef } = useWish();

  useEffect(() => {
    if (mode !== "live" || reducedMotion) return;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    if (!started) lenis.stop();
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, reducedMotion]);

  useEffect(() => {
    if (started) lenisRef.current?.start();
  }, [started, lenisRef]);

  return null;
}
