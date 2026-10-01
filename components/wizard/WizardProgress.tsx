"use client";

// Wizard progress: a scaleX bar driven by a Framer Motion spring plus six dots, where
// completed steps show a check and the current step pulses once on change
// (docs/03 P2-01, docs/04 SECTION 7.1).
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { STEPS } from "@/lib/wizard";

export type WizardProgressProps = {
  step: number;
  onStepClick?: (step: number) => void;
};

export function WizardProgress({ step, onStepClick }: WizardProgressProps) {
  const reduced = !!useReducedMotion();
  const percent = Math.round((step / STEPS.length) * 100);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="font-heading text-sm font-semibold text-ink">
            Step {step} of {STEPS.length}
          </p>
          <p className="text-xs text-muted">{STEPS[step - 1]?.label}</p>
        </div>
        <span className="text-xs font-medium text-muted">{percent}% complete</span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Wizard progress"
        className="h-2 w-full overflow-hidden rounded-full bg-border"
      >
        <motion.div
          className="h-full w-full origin-left rounded-full bg-primary"
          initial={false}
          animate={{ scaleX: step / STEPS.length }}
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 18 }}
        />
      </div>

      <ol className="mt-3 flex items-center justify-between gap-1">
        {STEPS.map((s) => {
          const done = s.key < step;
          const current = s.key === step;
          const clickable = done && !!onStepClick;
          return (
            <li key={s.key} className="flex flex-1 flex-col items-center gap-1">
              <motion.button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(s.key)}
                aria-label={`Step ${s.key}: ${s.label}${current ? " (current)" : ""}`}
                aria-current={current ? "step" : undefined}
                animate={current && !reduced ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full disabled:cursor-default"
              >
                <span
                  className={[
                    "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                    current
                      ? "border-primary bg-primary text-white"
                      : done
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-white text-muted",
                  ].join(" ")}
                >
                  {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : s.key}
                </span>
              </motion.button>
              <span
                className={[
                  "hidden text-[11px] sm:block",
                  current ? "font-medium text-ink" : "text-muted",
                ].join(" ")}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default WizardProgress;
