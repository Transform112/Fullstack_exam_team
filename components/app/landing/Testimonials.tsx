"use client";

// Landing section 6 (docs/04 SECTION 8.6): clearly labelled sample feedback.
import { motion, useReducedMotion } from "framer-motion";
import { Quote } from "lucide-react";
import { rise } from "@/lib/motion";

const TESTIMONIALS = [
  {
    quote: "My sister cried happy tears. It took me ten minutes to make.",
    name: "Priya S.",
    role: "Sister",
  },
  {
    quote: "The countdown made the whole day more exciting.",
    name: "Rohan M.",
    role: "Friend",
  },
  {
    quote: "Our anniversary page felt like a tiny movie.",
    name: "Neha and Kunal",
    role: "Couple",
  },
];

export function Testimonials() {
  const reduced = !!useReducedMotion();

  return (
    <section className="py-16 sm:py-24">
      <div className="container-page">
        <motion.div {...rise(reduced)} className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-ink sm:text-4xl">
            People are already smiling
          </h2>
          <p className="mt-2 text-sm text-muted">Sample feedback</p>
        </motion.div>

        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <motion.li
              key={item.name}
              {...rise(reduced, index * 0.08)}
              className="flex flex-col rounded-card border border-border bg-white p-6 shadow-card"
            >
              <Quote className="h-5 w-5 text-accent" aria-hidden />
              <blockquote className="mt-4 flex-1 text-base text-ink">{item.quote}</blockquote>
              <footer className="mt-5 text-sm">
                <p className="font-semibold text-ink">{item.name}</p>
                <p className="text-muted">{item.role}</p>
              </footer>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Testimonials;
