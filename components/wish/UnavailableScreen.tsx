// Friendly screen for a page that exists but must not be shown (PAGE_UNAVAILABLE in
// app/w/[slug]/page.tsx). Deliberately dependency-free: only plain markup, static
// blurs and a link, so the public route can render it before any client JS loads.
import Link from "next/link";
import { Ghost } from "lucide-react";

export function UnavailableScreen() {
  return (
    <main
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-5 py-16 text-center"
      style={{ background: "#0F0A1E" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full"
        style={{ background: "#7C3AED", opacity: 0.28, filter: "blur(80px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-20 h-[360px] w-[360px] rounded-full"
        style={{ background: "#EC4899", opacity: 0.28, filter: "blur(80px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "#4F46E5", opacity: 0.22, filter: "blur(80px)" }}
      />

      <div className="relative mx-auto flex max-w-md flex-col items-center gap-4">
        <span
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full"
          style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
        >
          <Ghost className="h-8 w-8 text-white" aria-hidden />
        </span>

        <h1 className="font-heading text-[clamp(24px,6vw,40px)] font-bold leading-snug text-white">
          This page is unavailable
        </h1>
        <p className="text-base leading-relaxed text-white/70">
          The person who made it has taken it down, or it is switched off for now. The surprise is
          still a surprise.
        </p>

        <Link
          href="/signup"
          className="mt-2 flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition-transform active:scale-[0.97]"
          style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
        >
          Create your own surprise
        </Link>
      </div>
    </main>
  );
}

export default UnavailableScreen;
