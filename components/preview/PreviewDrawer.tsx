"use client";

// Mobile full-screen preview sheet (docs/03 P2-07, docs/04 SECTION 7.2). It renders
// the same PhoneFrame as the desktop pane, scaled to fit the width of the sheet.
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import type { WishPageData } from "@/lib/wish-types";

export type PreviewDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: WishPageData;
};

export function PreviewDrawer({ open, onOpenChange, data }: PreviewDrawerProps) {
  const reduced = !!useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Page preview"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: reduced ? 0.2 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex h-[100dvh] w-full flex-col bg-canvas lg:hidden"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-heading text-base font-semibold text-ink">Preview</span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close preview"
              className="flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-3 pb-6">
            <PhoneFrame data={data} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PreviewDrawer;
