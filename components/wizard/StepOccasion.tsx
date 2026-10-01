"use client";

// Step 1 - Occasion (docs/03 P2-02): seven occasion cards, an optional custom name,
// the occasion date and the optional reveal lock.
import { motion, useReducedMotion } from "framer-motion";
import {
  Cake,
  Check,
  Gem,
  Gift,
  PartyPopper,
  Plane,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useWizardData, FieldError } from "./Wizard";

const OCCASION_ICONS: Record<string, LucideIcon> = {
  BIRTHDAY: Cake,
  ANNIVERSARY: Gift,
  WEDDING: Gem,
  FAREWELL: Plane,
  CONGRATS: PartyPopper,
  FRIENDSHIP: Users,
  CUSTOM: Sparkles,
};

const OCCASIONS: Array<{ value: string; label: string }> = [
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "ANNIVERSARY", label: "Anniversary" },
  { value: "WEDDING", label: "Wedding" },
  { value: "FAREWELL", label: "Farewell" },
  { value: "CONGRATS", label: "Congratulations" },
  { value: "FRIENDSHIP", label: "Friendship Day" },
  { value: "CUSTOM", label: "Custom" },
];

// Today as yyyy-mm-dd in the visitor's local timezone (no UTC shift surprises).
function todayLocal() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function StepOccasion() {
  const { data, update, errors, registerField } = useWizardData();
  const reduced = !!useReducedMotion();
  const selected = data.occasion ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-normal tracking-tight text-ink sm:text-3xl">What are we celebrating?</h2>
        <p className="mt-1 text-sm text-muted">
          Pick an occasion - it decides the decorations and the wording of the page.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Occasion"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {OCCASIONS.map((occasion, index) => {
          const Icon = OCCASION_ICONS[occasion.value] ?? Sparkles;
          const active = selected === occasion.value;
          return (
            <motion.button
              key={occasion.value}
              type="button"
              role="radio"
              aria-checked={active}
              ref={index === 0 ? registerField("occasion") : undefined}
              onClick={() => update({ occasion: occasion.value })}
              whileTap={{ scale: 0.97 }}
              animate={{ scale: active && !reduced ? 1.03 : 1 }}
              transition={
                reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 16 }
              }
              className={[
                "relative flex min-h-[88px] flex-col items-start gap-2 rounded-card border p-3 text-left transition-colors",
                active
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : "border-border bg-white hover:bg-canvas",
              ].join(" ")}
            >
              <Icon
                className={active ? "h-5 w-5 text-primary" : "h-5 w-5 text-muted"}
                aria-hidden
              />
              <span className="text-sm font-medium text-ink">{occasion.label}</span>
              {active && (
                <motion.span
                  initial={reduced ? { opacity: 0 } : { scale: 0, opacity: 0 }}
                  animate={reduced ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                  transition={
                    reduced ? { duration: 0.2 } : { type: "spring", stiffness: 260, damping: 16 }
                  }
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
      <FieldError message={errors.occasion} />

      {selected === "CUSTOM" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="customOccasionLabel">Name your occasion</Label>
          <Input
            id="customOccasionLabel"
            ref={registerField("customOccasionLabel")}
            value={data.customOccasionLabel}
            maxLength={40}
            placeholder="Graduation day"
            onChange={(event) => update({ customOccasionLabel: event.target.value })}
          />
          <span className="self-end text-xs text-muted">{data.customOccasionLabel.length}/40</span>
          <FieldError message={errors.customOccasionLabel} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="occasionDate">Date of the occasion</Label>
        <Input
          id="occasionDate"
          type="date"
          min={todayLocal()}
          ref={registerField("occasionDate")}
          value={data.occasionDate}
          onChange={(event) => update({ occasionDate: event.target.value })}
          className="max-w-xs"
        />
        <FieldError message={errors.occasionDate} />
      </div>

      <div className="rounded-card border border-border bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="revealEnabled" className="flex-1">
            Lock the page until the occasion
          </Label>
          <Switch
            id="revealEnabled"
            checked={data.revealEnabled}
            onCheckedChange={(checked) => update({ revealEnabled: checked })}
          />
        </div>
        {data.revealEnabled && (
          <div className="mt-4 flex flex-col gap-2">
            <Label htmlFor="revealTime">Unlock at</Label>
            <Input
              id="revealTime"
              type="time"
              ref={registerField("revealTime")}
              value={data.revealTime || "00:00"}
              onChange={(event) => update({ revealTime: event.target.value })}
              className="max-w-[10rem]"
            />
            <p className="text-xs text-muted">Visitors see a countdown until this time</p>
            <FieldError message={errors.revealTime} />
          </div>
        )}
      </div>
    </div>
  );
}

export default StepOccasion;
