"use client";

// Landing section 7 (docs/04 SECTION 8.7): the six FAQ answers, one panel open at a time.
import { motion, useReducedMotion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { rise } from "@/lib/motion";

const FAQS = [
  { q: "Is Wishly free?", a: "Yes. Creating and sharing pages is free." },
  {
    q: "Can I schedule a surprise?",
    a: "Yes. Set a reveal date and the page shows a countdown until then. The content stays hidden on the server until the time comes.",
  },
  {
    q: "Can I protect a page with a password?",
    a: "Yes. Add a password in the Style step and only people who know it can open the page.",
  },
  { q: "Which languages are supported?", a: "English, Hinglish and Hindi." },
  { q: "How many photos and videos can I add?", a: "Up to 15 photos and 2 videos per page." },
  {
    q: "Can friends add wishes?",
    a: "Yes. Visitors can leave a short wish on the wishes wall and you can remove any wish.",
  },
];

export function Faq() {
  const reduced = !!useReducedMotion();

  return (
    <section id="faq" className="scroll-mt-20 py-16 sm:py-24">
      <div className="container-page">
        <motion.div {...rise(reduced)} className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-normal text-ink sm:text-4xl">
            Questions, answered
          </h2>
          <p className="mt-3 text-base text-muted">Everything you might ask before you start.</p>
        </motion.div>

        <motion.div {...rise(reduced, 0.08)} className="mx-auto mt-10 max-w-2xl">
          <Accordion
            type="single"
            collapsible
            className="border-y border-border bg-transparent px-1"
          >
            {FAQS.map((item, index) => (
              <AccordionItem key={item.q} value={`faq-${index}`} className="last:border-b-0">
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

export default Faq;
