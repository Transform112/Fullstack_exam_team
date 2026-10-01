"use client";

// Landing section 5 (docs/04 SECTION 8.5): three real seed pages, opened in a new tab.
/* eslint-disable @next/next/no-img-element */
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { DEMO_IMAGES, SAMPLE_PAGE_LINKS } from "@/lib/sample-data";
import { rise } from "@/lib/motion";

export function SamplePages() {
  const reduced = !!useReducedMotion();

  return (
    <section id="sample-pages" className="scroll-mt-20 py-16 sm:py-24">
      <div className="container-page">
        <motion.div {...rise(reduced)} className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-ink sm:text-4xl">
            See real examples
          </h2>
          <p className="mt-3 text-base text-muted">
            Three pages made with Wishly. Tap one and scroll through it.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {SAMPLE_PAGE_LINKS.map((page, index) => (
            <motion.a
              key={page.slug}
              {...rise(reduced, index * 0.08)}
              href={`/w/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col overflow-hidden rounded-card border border-border bg-white shadow-card transition-transform hover:-translate-y-1"
            >
              <img
                src={DEMO_IMAGES[index % DEMO_IMAGES.length]}
                alt={`Sample page for ${page.occasion}`}
                width={1080}
                height={720}
                loading="lazy"
                decoding="async"
                className="h-44 w-full object-cover"
              />
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-heading text-lg font-semibold text-ink">{page.occasion}</h3>
                  <ArrowUpRight className="h-4 w-4 text-muted" aria-hidden />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Chip>{page.occasion}</Chip>
                  <Chip>{page.language}</Chip>
                  <Chip>{page.template}</Chip>
                </div>
                <p className="text-xs text-muted">/w/{page.slug}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-canvas px-3 py-1 text-xs font-medium text-muted">
      {children}
    </span>
  );
}

export default SamplePages;
