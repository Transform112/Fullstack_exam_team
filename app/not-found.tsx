import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

// Designed 404 for unknown app routes (docs/03 P4-14).
export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-canvas px-5 py-16 text-center">
      <p className="text-primary font-heading text-[clamp(72px,20vw,140px)] font-normal leading-none">
        404
      </p>
      <h1 className="mt-4 font-heading text-2xl font-bold text-ink sm:text-3xl">
        A little lost, but not for long.
      </h1>
      <p className="mt-3 max-w-md text-base text-muted">
        We looked everywhere. The link may be old, or the surprise may have moved.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/signup">Create your own surprise</Link>
        </Button>
        <Link
          href="/"
          className="flex min-h-12 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink hover:bg-white"
        >
          <Compass className="h-4 w-4" aria-hidden />
          Back to home
        </Link>
      </div>
    </main>
  );
}
