"use client";

// The phone-shaped viewport used by both the desktop preview pane and the mobile
// drawer (docs/03 P2-07, docs/04 SECTION 7.2). It renders the real template through
// WishRenderer in "preview" mode and hands its own scroll container to the renderer
// so scroll-linked sections inside the phone follow the phone, not the wizard page.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { WishRenderer } from "@/components/wish/WishRenderer";
import type { WishPageData } from "@/lib/wish-types";

// Bezel 12px on every side, viewport 360x720, radius 44px (docs/04 SECTION 7.2).
export const FRAME_WIDTH = 384;
export const FRAME_HEIGHT = 744;

export type PhoneFrameProps = {
  data: WishPageData;
  className?: string;
  // Lets the parent drive the inner scroll container (the "Replay hero" button).
  onScrollElement?: (element: HTMLDivElement | null) => void;
};

export function PhoneFrame({ data, className, onScrollElement }: PhoneFrameProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Registers the inner scroller with the parent and with WishRenderer.
  const registerScroller = useCallback(
    (element: HTMLDivElement | null) => {
      scrollerRef.current = element;
      onScrollElement?.(element);
    },
    [onScrollElement],
  );

  useLayoutEffect(() => {
    const element = scrollerRef.current;
    if (element) onScrollElement?.(element);
    return () => onScrollElement?.(null);
  }, [onScrollElement]);

  // scale(min(1, paneHeight / 780)): the frame never forces the wizard page to scroll.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const height = wrap.getBoundingClientRect().height;
      if (!height) return;
      const width = wrap.getBoundingClientRect().width;
      const fit = Math.min(height / 780, width / FRAME_WIDTH);
      setScale(Math.max(0.4, Math.min(1, fit)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`flex min-h-0 w-full flex-1 items-center justify-center ${className ?? ""}`}
    >
      <div
        style={{
          width: FRAME_WIDTH * scale,
          height: FRAME_HEIGHT * scale,
        }}
      >
        <div
          style={{
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          className="relative rounded-[44px] border-[6px] border-ink bg-ink p-3 shadow-card"
        >
          <div className="relative h-full w-full overflow-hidden rounded-[32px] bg-white">
            {/* Notch bar */}
            <div className="pointer-events-none absolute left-1/2 top-1 z-20 h-1.5 w-24 -translate-x-1/2 rounded-full bg-ink/80" />
            <div
              ref={registerScroller}
              className="no-scrollbar h-full w-full overflow-y-auto overflow-x-hidden"
            >
              <WishRenderer data={data} mode="preview" scrollRef={scrollerRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhoneFrame;
