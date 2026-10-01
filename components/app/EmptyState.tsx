import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
};

// Shared empty placeholder with an optional call to action (docs/03 SECTION 5.2).
// It has no "use client" so both server pages and client pages can render it; pass
// onAction only from a client component.
export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
  className,
}: EmptyStateProps) {
  const showAction = Boolean(actionLabel && (actionHref || onAction));

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-5 rounded-card border border-border bg-white px-6 py-16 text-center sm:py-20",
        className,
      )}
    >
      <span className="flex h-16 w-16 -rotate-6 items-center justify-center rounded-2xl border border-border bg-canvas text-primary">
        {icon ?? <Sparkles className="h-6 w-6" aria-hidden />}
      </span>
      <h2 className="font-heading text-3xl font-normal tracking-tight text-ink">{title}</h2>
      {description ? <p className="max-w-sm text-sm leading-relaxed text-muted">{description}</p> : null}
      {showAction && actionLabel ? (
        actionHref ? (
          <Button asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : (
          <Button type="button" onClick={onAction}>
            {actionLabel}
          </Button>
        )
      ) : null}
    </div>
  );
}
