"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShareKit } from "@/components/app/ShareKit";

export type ShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  recipientName: string;
  slug: string;
  qrCode?: string;
};

// Wraps the share kit in a dialog for the dashboard "Share" action (docs/03 P4-03).
export function ShareDialog({
  open,
  onOpenChange,
  url,
  recipientName,
  slug,
  qrCode,
}: ShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share this surprise</DialogTitle>
          <DialogDescription>
            Send the link, show the QR code or post it to social media.
          </DialogDescription>
        </DialogHeader>
        <ShareKit url={url} recipientName={recipientName} slug={slug} qrCode={qrCode} />
      </DialogContent>
    </Dialog>
  );
}
