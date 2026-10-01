"use client";

// Landing section 4 (docs/04 SECTION 8.4): a snap-scrolling row of the three
// templates. Each card mounts its live preview only when it comes near the
// viewport, which keeps the landing page light on mobile.
import { motion, useReducedMotion } from "framer-motion";
import { TemplateCard, type TemplateCardData } from "@/components/app/TemplatePreviewDialog";
import { rise } from "@/lib/motion";

const TEMPLATES: TemplateCardData[] = [
  {
    id: "neon-night",
    name: "Neon Night",
    description:
      "Party and Gen-Z. Glowing neon text, starfield parallax, glitch reveal, confetti cannon.",
    palette: ["#0B0420", "#FF4FA3", "#22D3EE", "#A78BFA"],
    accent: "#FF4FA3",
  },
  {
    id: "pastel-dream",
    name: "Pastel Dream",
    description: "Soft and cute. Floating balloons, polaroid gallery, hand-drawn doodles, petals.",
    palette: ["#FFF1F5", "#FBCFE8", "#C4B5FD", "#FDE68A"],
    accent: "#F472B6",
  },
  {
    id: "royal-gold",
    name: "Royal Gold",
    description: "Elegant. Gold foil shimmer, slow parallax, rose petals, letter-opening intro.",
    palette: ["#0E0E10", "#D4AF37", "#F5E6C8", "#7F1D1D"],
    accent: "#D4AF37",
  },
];

export function TemplateShowcase() {
  const reduced = !!useReducedMotion();

  return (
    <section id="templates" className="scroll-mt-20 overflow-hidden py-16 sm:py-24">
      <div className="container-page">
        <motion.div {...rise(reduced)} className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-ink sm:text-4xl">
            Three looks, endless surprises
          </h2>
          <p className="mt-3 text-base text-muted">
            Pick a mood now, change your mind later. Swipe through them.
          </p>
        </motion.div>
      </div>

      <div
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4"
        role="list"
        aria-label="Wishly templates"
      >
        {TEMPLATES.map((template) => (
          <div key={template.id} role="listitem" className="snap-center">
            <TemplateCard template={template} />
          </div>
        ))}
        <span className="w-1 shrink-0" aria-hidden />
      </div>
    </section>
  );
}

export default TemplateShowcase;
