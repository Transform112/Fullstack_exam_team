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
    <div className="min-w-0 w-full rounded-card border border-border bg-white px-2 py-5 sm:px-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Step {step} of {STEPS.length}
          </p>
          <p className="mt-1 font-heading text-2xl text-ink">{STEPS[step - 1]?.label}</p>
        </div>
        <span className="text-xs font-medium text-muted">{STEPS.length - step} {STEPS.length - step === 1 ? "step" : "steps"} after this</span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Wizard progress"
        className="h-1 w-full overflow-hidden rounded-full bg-border"
      >
        <motion.div
          className="h-full w-full origin-left rounded-full bg-primary"
          initial={false}
          animate={{ scaleX: step / STEPS.length }}
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 18 }}
        />
      </div>

      <ol className="mt-3 flex items-center justify-between gap-0 overflow-x-auto p-1 sm:gap-1">
        {STEPS.map((s) => {
          const done = s.key < step;
          const current = s.key === step;
          const clickable = done && !!onStepClick;
          return (
            <li key={s.key} className="flex min-w-11 flex-1 flex-col items-center gap-1">
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
                    "flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition-colors",
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
