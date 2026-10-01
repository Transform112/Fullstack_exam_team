// Motion constants and the standard entrance helper (docs/04 SECTION 3.3).
export const EASE = [0.22, 1, 0.36, 1] as const;
export const SPRING = { type: "spring", stiffness: 120, damping: 18 } as const;
export const SPRING_POP = { type: "spring", stiffness: 260, damping: 16 } as const;
export const STAGGER = 0.08;
export const VIEWPORT = { once: true, amount: 0.3 } as const;

// Standard entrance: fade and rise 24px. When reduced is true it is a plain 0.3s fade.
export function rise(reduced: boolean, delay = 0) {
  return reduced
    ? {
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        transition: { duration: 0.3, delay },
      }
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        transition: { duration: 0.8, ease: EASE, delay },
      };
}
