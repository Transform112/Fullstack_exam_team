"use client";

import { useEffect } from "react";
import { api } from "@/lib/client-api";

// Rendered once inside WishRenderer in live mode. It records one view per visitor per
// 30 minutes; the result, including errors, is ignored on purpose.
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      api(`/public/pages/${slug}/view`, { method: "POST" }).catch(() => {
        if (!cancelled) {
          // Analytics must never break the page a guest is looking at.
        }
      });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug]);

  return null;
}
