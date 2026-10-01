"use client";

// Thin reading-progress bar pinned under the notch (docs/04 SECTION 5.10). It only exists
// on a live page and stays invisible until the intro has been tapped.
import { motion, useSpring } from "framer-motion";
import { useWish } from "@/components/wish/WishProvider";
import { useWishScroll } from "@/lib/wish-hooks";
import type { ThemeTokens } from "@/lib/wish-theme";

export function ScrollProgress({ tokens }: { tokens: ThemeTokens }) {
  const { mode, started, reducedMotion } = useWish();
  const { scrollYProgress } = useWishScroll();
  // Reduced motion keeps the raw value, so the bar tracks the scroll with no easing lag.
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  if (mode !== "live") return null;

  return (
    <motion.div
      aria-hidden
      initial={false}
      animate={{ opacity: started ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed",
        top: "env(safe-area-inset-top)",
        left: 0,
        right: 0,
        height: 3,
        background: tokens.colors.primary,
        transformOrigin: "left",
        scaleX: reducedMotion ? scrollYProgress : smooth,
        zIndex: 40,
        pointerEvents: "none",
      }}
    />
  );
}
