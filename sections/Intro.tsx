"use client";

import { useEffect, useId, useRef } from "react";
import { Gift, ArrowRight } from "lucide-react";
import { useWish } from "@/components/wish/WishProvider";
import type { SectionProps } from "@/lib/wish-theme";

export function Intro({ tokens }: SectionProps) {
  const { started, start, t, displayName } = useWish();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Native modal dialogs trap keyboard focus and make the underlying wish inert.
  // Keeping the dialog in this tree also preserves the template's font variables.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!started && dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, [started]);

  if (started) return null;
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); start(); }}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none p-6 text-center"
      style={{ background: tokens.colors.bg, color: tokens.colors.text }}
    >
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-md border p-8 sm:p-12" style={{ borderColor: tokens.colors.primary, borderRadius: tokens.id === "pastel-dream" ? 40 : 4 }}>
          <Gift className="mx-auto mb-8 h-12 w-12" style={{ color: tokens.colors.primary }} aria-hidden />
          <h1 id={titleId} className="text-4xl leading-tight" style={{ fontFamily: "var(--f-display)" }}>{t("intro.for", { name: displayName })}</h1>
          <button autoFocus type="button" onClick={start} className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-lg border px-6 py-3 text-sm font-semibold" style={{ borderColor: tokens.colors.primary }}>
            {t("intro.tap")}<ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </dialog>
  );
}
