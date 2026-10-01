"use client";

// Route error boundary (docs/03 P4-14). The visitor sees one friendly line and a
// Retry button; the stack trace only ever goes to the console.
import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-canvas px-5 py-16 text-center">
      <p className="font-heading text-[clamp(64px,18vw,120px)] font-bold leading-none text-ink/10">
        Oops
      </p>
      <h1 className="mt-2 font-heading text-2xl font-bold text-ink sm:text-3xl">
        Something went wrong on our side
      </h1>
      <p className="mt-3 max-w-md text-base text-muted">
        Nothing you did caused this. Try again, and if it keeps happening come back in a minute.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Button size="lg" onClick={() => reset()}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Retry
        </Button>
        <Link
          href="/"
          className="flex min-h-12 items-center rounded-full px-4 text-sm font-medium text-ink hover:bg-white"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
