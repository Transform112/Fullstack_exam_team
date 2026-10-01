"use client";

import { useEffect, useState } from "react";
import { useScroll } from "framer-motion";
import { useWish } from "@/components/wish/WishProvider";

// Scroll progress that works in live mode (the window scrolls) and in preview mode
// (an inner container scrolls), so scroll-linked motion tracks the right element.
export function useWishScroll(
  target?: React.RefObject<HTMLElement | null>,
  offset?: ["start end" | "start start" | "end start" | "end end" | "center center", string],
) {
  const { scrollRef } = useWish();
  return useScroll({
    target: target as never,
    offset: offset as never,
    container: scrollRef as never,
  });
}

// Props for whileInView so entrances observe the preview container too.
export function useViewport() {
  const { scrollRef } = useWish();
  return { once: true, amount: 0.3, root: scrollRef } as const;
}

// Height of the visible viewport for parallax maths. In preview mode the phone frame
// height (720px) is used instead of the real window.
export function useViewportHeight() {
  const { mode } = useWish();
  const [height, setHeight] = useState(720);

  useEffect(() => {
    if (mode !== "live") return;
    const measure = () => setHeight(window.innerHeight);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [mode]);

  return height;
}
