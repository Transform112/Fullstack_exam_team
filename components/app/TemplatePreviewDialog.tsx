"use client";

// Public template gallery pieces (docs/03 P3-16): a lazily mounted animated mini
// preview, the full-screen preview dialog and the card both the gallery and the
// landing showcase render. Previews only mount when they are near the viewport.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { getTemplateId } from "@/templates/registry";
import { SAMPLE_WISH } from "@/lib/sample-data";
import { cn } from "@/lib/utils";
import { WishRenderer } from "@/components/wish/WishRenderer";
import { PhoneFrame } from "@/components/preview/PhoneFrame";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

// Shape shared by the DB rows and the landing copy. Types are erased, so the
// server gallery page can import this type from a client module.
export type TemplateCardData = {
  id: string;
  name: string;
  description: string;
  palette: string[];
  accent: string;
};

// Scrolls a preview container at 40px per second and loops back to the top.
function useAutoScroll(ref: React.RefObject<HTMLDivElement | null>, active: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(80, now - last);
      last = now;
      const max = el.scrollHeight - el.clientHeight;
      el.scrollTop = max <= 0 || el.scrollTop >= max - 1 ? 0 : el.scrollTop + (40 * dt) / 1000;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, active]);
}

// A 280x500 window onto the real renderer, scaled to 0.78 and not interactive.
export function MiniPreview({
  templateId,
  accent,
  active = false,
  className,
}: {
  templateId: string;
  accent: string;
  active?: boolean;
  className?: string;
}) {
  const reduced = !!useReducedMotion();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const data = useMemo(() => withAccentSample(templateId, accent), [templateId, accent]);
  useAutoScroll(scrollRef, active && !reduced);

  return (
    <div
      className={cn("relative h-[500px] w-[280px] overflow-hidden rounded-2xl bg-ink", className)}
    >
      <div
        className="pointer-events-none origin-top-left"
        style={{ width: 360, height: 720, transform: "scale(0.78)" }}
        aria-hidden
        inert
      >
        <div ref={scrollRef} className="no-scrollbar h-[720px] w-[360px] overflow-y-auto">
          <WishRenderer data={data} mode="preview" scrollRef={scrollRef} />
        </div>
      </div>
    </div>
  );
}

// Builds the sample payload with the gallery card's own accent colour.
function withAccentSample(templateId: string, accent: string) {
  const sample = SAMPLE_WISH(getTemplateId(templateId), "HINGLISH");
  return { ...sample, theme: { ...sample.theme, accent: accent || sample.theme.accent } };
}

export function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
}: {
  template: TemplateCardData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const data = useMemo(
    () => withAccentSample(template.id, template.accent),
    [template.id, template.accent],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {" "}
      <DialogContent className="inset-0 left-0 top-0 h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-ink p-0">
        <div className="flex h-full flex-col">
          <header className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3 pr-16 pt-4 sm:px-6">
            <div>
              <DialogTitle className="text-white">{template.name}</DialogTitle>
              <DialogDescription className="max-w-md text-white/60">
                {template.description}
              </DialogDescription>
            </div>
            <Button asChild size="lg">
              <Link href="/signup">Use this template</Link>
            </Button>
          </header>

          <div className="flex min-h-0 flex-1 justify-center px-4 pb-6 sm:px-6">
            <div className="flex h-full w-full max-w-[384px]">
              <PhoneFrame data={data} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TemplateCard({
  template,
  className,
}: {
  template: TemplateCardData;
  className?: string;
}) {
  const reduced = !!useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Mount within 200px, keep alive until the card is more than 600px away.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const near = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setMounted(true);
      },
      { rootMargin: "200px 0px" },
    );
    const far = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) setMounted(false);
      },
      { rootMargin: "600px 0px" },
    );
    near.observe(el);
    far.observe(el);
    return () => {
      near.disconnect();
      far.disconnect();
    };
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "flex w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-card border border-border bg-white shadow-card",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Preview the ${template.name} template`}
        className="group relative block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        {mounted ? (
          <MiniPreview
            templateId={template.id}
            accent={template.accent}
            active={visible}
            className="rounded-none"
          />
        ) : (
          <div className="h-[500px] w-[280px] animate-pulse bg-gradient-to-br from-ink via-primary/40 to-accent/40" />
        )}
        <span className="absolute inset-x-3 bottom-3 flex min-h-11 items-center justify-center rounded-full bg-white/95 text-sm font-medium text-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Open full preview
        </span>
      </button>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading text-lg font-semibold text-ink">{template.name}</h3>
        <p className="mt-1 flex-1 text-sm text-muted">{template.description}</p>

        <div className="mt-4 flex items-center gap-2" aria-label={`${template.name} palette`}>
          {template.palette.slice(0, 4).map((color) => (
            <span
              key={color}
              title={color}
              className="h-6 w-6 rounded-full border border-border"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <Button asChild className="mt-4 w-full">
          <Link href="/signup">
            <Sparkles className="h-4 w-4" aria-hidden />
            Use this template
          </Link>
        </Button>
      </div>

      <TemplatePreviewDialog template={template} open={open} onOpenChange={setOpen} />
    </motion.div>
  );
}

export default TemplatePreviewDialog;
