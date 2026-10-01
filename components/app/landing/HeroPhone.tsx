"use client";

// The landing hero phone (docs/04 SECTION 8.2): PhoneFrame running the real
// WishRenderer in preview mode, self-scrolling at 40px per second, with three
// floating cards that drift beside it. The landing page does not load wish.css, so
// the drift uses Framer Motion y keyframes instead of the wish-bob keyframe, and
// reduced motion removes the rise, the cards and the auto-scroll.
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Gift, QrCode, Timer } from "lucide-react";
import { PhoneFrame } from "@/components/preview/PhoneFrame";
import { SPRING } from "@/lib/motion";
import type { WishPageData } from "@/lib/wish-types";

const AUTOSCROLL_PX_PER_S = 40;

export function HeroPhone({ data }: { data: WishPageData }) {
  const reduced = !!useReducedMotion();
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);

  // Drifts the preview down 40px per second and loops back to the top at the end.
  useEffect(() => {
    if (!scroller || reduced) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(80, now - last);
      last = now;
      if (!pausedRef.current) {
        const max = scroller.scrollHeight - scroller.clientHeight;
        scroller.scrollTop =
          max <= 0 || scroller.scrollTop >= max - 1
            ? 0
            : scroller.scrollTop + (AUTOSCROLL_PX_PER_S * dt) / 1000;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scroller, reduced]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  // A definite height keeps PhoneFrame's own fit-to-pane scaling stable.
  const phone = (
    <div
      className="flex h-[520px] w-full sm:h-[640px] lg:h-[720px]"
      onPointerEnter={pause}
      onPointerLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
      onTouchCancel={resume}
    >
      <PhoneFrame data={data} onScrollElement={setScroller} />
    </div>
  );

  const name = data.recipient.nickname?.trim() || data.recipient.name;

  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-[80px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 bottom-0 -z-10 h-[280px] w-[280px] rounded-full bg-accent/25 blur-[80px]"
      />

      {reduced ? (
        phone
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
        >
          {phone}
        </motion.div>
      )}

      {reduced ? null : (
        <>
          <FloatingCard
            icon={<Gift className="h-4 w-4 text-primary" aria-hidden />}
            label={`Happy birthday ${name}!`}
            style={{ left: -70, top: 96 }}
            delay={0}
          />
          <FloatingCard
            icon={<Timer className="h-4 w-4 text-accent" aria-hidden />}
            label="Opens in 3 days"
            style={{ right: -62, top: 300 }}
            delay={0.5}
          />
          <FloatingCard
            icon={<QrCode className="h-4 w-4 text-sunshine" aria-hidden />}
            label="Scan to open"
            style={{ bottom: 104, left: -54 }}
            delay={1}
          />
        </>
      )}
    </div>
  );
}

// One small card that drifts up and down beside the phone; hidden under 768px.
function FloatingCard({
  icon,
  label,
  style,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  style: React.CSSProperties;
  delay: number;
}) {
  return (
    <motion.div
      className="absolute hidden items-center gap-2 rounded-2xl border border-border bg-white/95 px-4 py-3 text-sm font-medium text-ink shadow-card md:flex"
      style={style}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {icon}
      {label}
    </motion.div>
  );
}

export default HeroPhone;
