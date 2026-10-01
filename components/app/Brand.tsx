import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandProps = {
  href?: string;
  light?: boolean;
  caption?: boolean;
  className?: string;
  onClick?: () => void;
};

/** One wordmark for the public studio, account entry, and navigation. */
export function Brand({
  href = "/",
  light = false,
  caption = false,
  className,
  onClick,
}: BrandProps) {
  return (
    <Link
      href={href}
      aria-label="Wishly home"
      onClick={onClick}
      className={cn("wishly-brand", light && "wishly-brand-light", className)}
    >
      <span className="wishly-brand-mark" aria-hidden="true">
        <Heart size={21} strokeWidth={1.4} />
        <span className="wishly-brand-dot" />
      </span>
      <span className="wishly-brand-type">
        <span className="wishly-brand-name">wishly<span aria-hidden="true">.</span></span>
        {caption && <span className="wishly-brand-caption">THE CELEBRATION STUDIO</span>}
      </span>
    </Link>
  );
}
