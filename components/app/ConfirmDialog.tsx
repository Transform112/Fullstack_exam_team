"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  destructive?: boolean;
};

// One reusable confirmation dialog for destructive actions such as EP-17 and EP-24.
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  // Awaits the action so the dialog can show a pending state and only closes on success.
  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // The caller already reported the failure with a toast; keep the dialog open to retry.
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={destructive ? "danger" : "default"}
            onClick={confirm}
            disabled={busy}
          >
            {busy ? "Working..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
