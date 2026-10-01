"use client";

// Landing section 8 (docs/04 SECTION 8.8): the closing call to action. It fires one
// small confetti burst the first time it enters the view, and never for reduced motion.
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useInView, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

const COLORS = ["#7C3AED", "#EC4899", "#FBBF24"];

export function CtaBand() {
  const reduced = !!useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const firedRef = useRef(false);

  // canvas-confetti is imported on demand so it never lands in the initial bundle.
  useEffect(() => {
    if (!inView || reduced || firedRef.current) return;
    firedRef.current = true;
    let cancelled = false;
    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      confetti({
        particleCount: 80,
        spread: 70,
        startVelocity: 42,
        origin: { y: 0.7 },
        colors: COLORS,
        zIndex: 60,
        disableForReducedMotion: true,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [inView, reduced]);

  return (
    <section className="py-16 sm:py-24">
      <div className="container-page">
        <div
          ref={ref}
          className="relative overflow-hidden rounded-[28px] bg-ink px-6 py-16 text-center sm:px-12"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-[80px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-accent/30 blur-[80px]"
          />
          <h2 className="relative font-heading text-3xl font-bold text-white sm:text-4xl">
            Ready to make someone smile?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-base text-white/70">
            Your first surprise takes about ten minutes.
          </p>
          <div className="relative mt-8 flex justify-center">
            <Button asChild size="lg">
              <Link href="/signup">Create a surprise</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CtaBand;
