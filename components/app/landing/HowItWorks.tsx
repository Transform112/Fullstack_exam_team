"use client";

// Landing section 3 (docs/04 SECTION 8.3): the three real steps of making a Wishly page.
import { motion, useReducedMotion } from "framer-motion";
import { ImagePlus, PenLine, Share2 } from "lucide-react";
import { rise } from "@/lib/motion";

const STEPS = [
  {
    icon: PenLine,
    title: "Fill a short form",
    text: "Occasion, the name and a few words. Two minutes, tops.",
  },
  {
    icon: ImagePlus,
    title: "Upload your photos",
    text: "Up to 15 photos and 2 videos, or start with one favourite.",
  },
  {
    icon: Share2,
    title: "Share one link",
    text: "Send it on WhatsApp. It opens like a tiny movie.",
  },
];

export function HowItWorks() {
  const reduced = !!useReducedMotion();

  return (
    <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-24">
      <div className="container-page">
        <motion.div {...rise(reduced)} className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-ink sm:text-4xl">How it works</h2>
          <p className="mt-3 text-base text-muted">Three steps between an idea and a happy tear.</p>
        </motion.div>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <motion.li
              key={step.title}
              {...rise(reduced, index * 0.08)}
              className="rounded-card border border-border bg-white p-6 shadow-card"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-heading text-sm font-bold text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-1 text-sm text-muted">{step.text}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default HowItWorks;
