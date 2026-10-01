"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { Camera, Copy, Download, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/card";

// qrcode.react draws on a browser canvas, so it is loaded only on the client (docs/03 P4-03).
const QRCodeCanvas = dynamic(() => import("qrcode.react").then((module) => module.QRCodeCanvas), {
  ssr: false,
  loading: () => <Skeleton className="h-[256px] w-[256px]" />,
});

export type ShareKitProps = {
  url: string;
  recipientName: string;
  slug: string;
  qrCode?: string;
};

// Copies text, falling back to a temporary textarea when the Clipboard API is blocked.
async function writeToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path below.
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    return copied;
  } catch {
    return false;
  }
}

// The share kit from docs/03 P4-03: link + copy, QR + PNG download, WhatsApp, Instagram.
export function ShareKit({ url, recipientName, slug, qrCode }: ShareKitProps) {
  const qrBoxRef = useRef<HTMLDivElement>(null);

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`A surprise for ${recipientName}: ${url}`)}`;

  async function copyLink() {
    const copied = await writeToClipboard(url);
    if (copied) toast.success("Link copied");
    else toast.error("Could not copy the link");
  }

  // Prefers the EP-14 data URL, otherwise exports the rendered canvas as a PNG file.
  function downloadQr() {
    const canvas = qrBoxRef.current?.querySelector("canvas");
    const href = qrCode ?? canvas?.toDataURL("image/png");
    if (!href) {
      toast.error("The QR code is still loading");
      return;
    }
    const link = document.createElement("a");
    link.href = href;
    link.download = `wishly-${slug}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("QR code downloaded");
  }

  // Uses the native share sheet on phones; on desktop it copies and points to Instagram.
  async function shareToInstagram() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "A Wishly surprise",
          text: `A surprise for ${recipientName}`,
          url,
        });
        return;
      } catch {
        // The user dismissed the native sheet; there is nothing more to do.
        return;
      }
    }
    const copied = await writeToClipboard(url);
    if (copied) toast.success("Link copied. Paste it in your Instagram story or message");
    else toast.error("Could not copy the link");
    window.open("https://www.instagram.com", "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          readOnly
          value={url}
          aria-label="Share link"
          className="text-sm"
          onFocus={(event) => event.currentTarget.select()}
        />
        <Button type="button" variant="outline" className="shrink-0" onClick={copyLink}>
          <Copy className="h-4 w-4" aria-hidden />
          Copy
        </Button>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-canvas p-4">
        <div ref={qrBoxRef} className="rounded-xl bg-white p-2">
          <QRCodeCanvas
            value={url}
            size={256}
            level="M"
            marginSize={2}
            title={`QR code for ${recipientName}'s surprise`}
          />
        </div>
        <Button type="button" variant="outline" onClick={downloadQr}>
          <Download className="h-4 w-4" aria-hidden />
          Download QR
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button asChild variant="outline">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" aria-hidden />
            WhatsApp
          </a>
        </Button>
        <Button type="button" variant="outline" onClick={shareToInstagram}>
          <Camera className="h-4 w-4" aria-hidden />
          Instagram
        </Button>
      </div>
    </div>
  );
}
