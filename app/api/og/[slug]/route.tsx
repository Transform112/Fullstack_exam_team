// EP-34 GET /api/og/:slug - the dynamic Open Graph image.
// A scheduled or password-protected page always produces a generic teaser: the card
// must never leak the content the lock is hiding, not even for the owner.
import { ImageResponse } from "next/og";
import { loadPublicMeta } from "@/lib/public-page";
import { img } from "@/lib/wish-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIZE = { width: 1200, height: 630 };

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  // A database outage falls back to the generic card instead of failing the preview.
  let meta: Awaited<ReturnType<typeof loadPublicMeta>> = { result: "GENERIC" };
  try {
    meta = await loadPublicMeta(slug);
  } catch {
    meta = { result: "GENERIC" };
  }

  const isOpen = meta.result === "OK";
  const name = meta.result === "OK" ? meta.payload.recipient.name.trim().split(/\s+/)[0] : "";
  const firstImage =
    meta.result === "OK"
      ? meta.payload.media.filter((m) => m.type === "image").sort((a, b) => a.order - b.order)[0]
      : undefined;

  const headline = isOpen ? `A surprise for ${name || "you"}` : "A surprise is waiting for you";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "linear-gradient(135deg, #0F0A1E 0%, #2A1152 60%, #4C1D95 100%)",
        color: "#FFFFFF",
        fontFamily: "sans-serif",
      }}
    >
      {firstImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img(firstImage, 600)}
          alt=""
          width={480}
          height={630}
          style={{ objectFit: "cover", width: 480, height: 630 }}
        />
      ) : null}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 24,
          padding: "60px 64px",
          flex: 1,
        }}
      >
        <span
          style={{ fontSize: 30, letterSpacing: 2, color: "#EC4899", textTransform: "uppercase" }}
        >
          Wishly
        </span>
        <span style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>{headline}</span>
        <span style={{ fontSize: 30, color: "#D8CCF5" }}>Open the link to see it</span>
      </div>
    </div>,
    SIZE,
  );
}
