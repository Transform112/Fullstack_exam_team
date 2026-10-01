import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import "./studio-shell.css";


export const metadata: Metadata = {
  title: "Wishly - Custom Occasion Page Generator",
  description:
    "Turn a few photos and a few words into an animated surprise page and share it with one link.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FAF7F0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
