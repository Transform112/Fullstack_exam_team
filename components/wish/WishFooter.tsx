"use client";

// Page footer, rendered in live and preview modes (docs/04 SECTION 5.10). It sits after the
// Finale and carries the Wishly credit, the signup call to action and the view counter.
import Link from "next/link";
import { Heart } from "lucide-react";
import { useWish } from "@/components/wish/WishProvider";
import type { SectionProps } from "@/lib/wish-theme";

export function WishFooter({ data, tokens }: SectionProps) {
  const { t } = useWish();

  return (
    <footer
      className="wish-section px-6"
      style={{
        textAlign: "center",
        paddingTop: 24,
        paddingBottom: "calc(40px + env(safe-area-inset-bottom))",
        color: tokens.colors.muted,
        fontSize: 14,
      }}
    >
      <p
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {t("footer.made")}
        <Heart size={14} fill={tokens.colors.primary} stroke={tokens.colors.primary} aria-hidden />
      </p>
      <p style={{ margin: "8px 0 0" }}>
        <Link
          href="/signup"
          style={{
            color: tokens.colors.primary,
            textDecoration: "underline",
            textUnderlineOffset: 3,
            fontSize: 14,
          }}
        >
          {t("footer.cta")}
        </Link>
      </p>
      {data.views !== undefined && (
        <p style={{ margin: "8px 0 0", fontSize: 13 }}>{t("footer.views", { n: data.views })}</p>
      )}
    </footer>
  );
}
