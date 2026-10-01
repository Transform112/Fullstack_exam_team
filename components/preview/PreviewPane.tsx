"use client";

// The live preview shown next to the wizard: a PhoneFrame rendering the real template
// straight from wizard state, with no network call (docs/03 P2-07).
import { useCallback, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { toPreviewData, type WizardData } from "@/lib/wizard";

export type PreviewPaneProps = {
  data: WizardData;
  className?: string;
};

export function PreviewPane({ data, className }: PreviewPaneProps) {
  const reduced = !!useReducedMotion();
  const scroller = useRef<HTMLDivElement | null>(null);

  // toPreviewData lowercases the media order; the creator's own order wins in the preview.
  const previewData = useMemo(() => {
    const base = toPreviewData(data);
    return {
      ...base,
      media: [...base.media]
        .map((item) => {
          const local = data.media.find((m) => m.id === item.id);
          return local ? { ...item, order: local.order } : item;
        })
        .sort((a, b) => a.order - b.order)
        .map((item, index) => ({ ...item, order: index })),
    };
  }, [data]);

  const onScrollElement = useCallback((element: HTMLDivElement | null) => {
    scroller.current = element;
  }, []);

  const replay = () => {
    scroller.current?.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div className={`flex min-h-0 flex-col ${className ?? ""}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Live preview</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={replay}
            aria-label="Replay hero"
            title="Replay hero"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.3 : 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <PhoneFrame data={previewData} onScrollElement={onScrollElement} />
      </motion.div>
    </div>
  );
}

export default PreviewPane;
