"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShareKit } from "@/components/app/ShareKit";

const CONFETTI_COLORS = ["#7C3AED", "#EC4899", "#FBBF24"];

export type PublishSuccessModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  url: string;
  recipientName: string;
  qrCode: string;
};

// Celebration dialog shown after EP-14 succeeds (docs/03 P2-08 upgraded by P4-03).
export function PublishSuccessModal({
  open,
  onOpenChange,
  slug,
  url,
  recipientName,
  qrCode,
}: PublishSuccessModalProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const fired = useRef(false);

  // Fires exactly one 120 particle burst per opening, skipped for reduced motion.
  useEffect(() => {
    if (!open) {
      fired.current = false;
      return;
    }
    if (fired.current) return;
    fired.current = true;
    if (reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void (async () => {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 120,
        spread: 80,
        colors: CONFETTI_COLORS,
        origin: { y: 0.35 },
        disableForReducedMotion: true,
        zIndex: 100,
      });
    })();
  }, [open, reducedMotion]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <motion.div
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reducedMotion ? { duration: 0.2 } : { type: "spring", stiffness: 260, damping: 20 }
          }
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Your surprise is ready</DialogTitle>
            <DialogDescription>
              Send it to {recipientName || "your friend"} and watch the wishes come in.
            </DialogDescription>
          </DialogHeader>

          <ShareKit
            url={url}
            recipientName={recipientName || "your friend"}
            slug={slug}
            qrCode={qrCode}
          />

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button asChild className="sm:flex-1">
              <a href={url} target="_blank" rel="noopener noreferrer">
                Open page
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="sm:flex-1"
              onClick={() => {
                onOpenChange(false);
                router.push("/dashboard");
              }}
            >
              Go to dashboard
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
