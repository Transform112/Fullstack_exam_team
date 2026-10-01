import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  title?: string;
  className?: string;
};

// Shared failure placeholder with a Retry button (docs/03 SECTION 5.2). Pass onRetry
// only from a client component; a server page renders the message on its own.
export function ErrorState({
  message,
  onRetry,
  title = "Something went wrong",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-4 rounded-card border border-border bg-white px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="font-heading text-2xl font-normal text-ink">{title}</h2>
      <p className="min-w-0 max-w-full sm:max-w-md [overflow-wrap:anywhere] text-sm leading-relaxed text-muted">{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          <RotateCw className="h-4 w-4" aria-hidden />
          Retry
        </Button>
      ) : null}
    </div>
  );
}
