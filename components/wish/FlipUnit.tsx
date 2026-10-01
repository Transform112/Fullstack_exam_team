"use client";

import { AnimatePresence, motion } from "framer-motion";

// One countdown digit group. A changed value flips away and the new one flips in; with
// reduced motion it is a plain fade.
export function FlipUnit({ value, reduced }: { value: string; reduced: boolean }) {
  return (
    <div style={{ perspective: 400 }} className="relative h-full w-full overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          className="absolute inset-0 flex items-center justify-center"
          initial={reduced ? { opacity: 0 } : { rotateX: 90, opacity: 0 }}
          animate={reduced ? { opacity: 1 } : { rotateX: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { rotateX: -90, opacity: 0 }}
          transition={{ duration: reduced ? 0.2 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
