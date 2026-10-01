// Public wish page. This server component applies the access rules through
// loadPublicPage and renders either the real template, the lock screen, the password
// gate or the unavailable screen. Nothing is cached publicly in version 1.
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { wishFontClasses } from "@/lib/wish-fonts";
import { loadPublicMeta, loadPublicPage } from "@/lib/public-page";
import { WishRenderer } from "@/components/wish/WishRenderer";
import { LockScreen } from "@/components/wish/LockScreen";
import { PasswordGate } from "@/components/wish/PasswordGate";
import { UnavailableScreen } from "@/components/wish/UnavailableScreen";
import "./wish.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0F0A1E",
};

const APP_URL = () =>
  (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Metadata uses the public-only projection: a scheduled or password page never leaks
// the recipient name or a photo, even for its owner (EP-34).
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const generic: Metadata = {
    title: "A surprise on Wishly",
    description: "Something special is being prepared.",
    robots: { index: false, follow: false },
  };
  let meta: Awaited<ReturnType<typeof loadPublicMeta>>;
  try {
    meta = await loadPublicMeta(slug);
  } catch {
    // Metadata must never fail the page or leak internals during a database outage.
    return generic;
  }
  if (meta.result !== "OK") return generic;
  const firstName = meta.payload.recipient.name.trim().split(/\s+/)[0] || "you";
  const title = `A surprise for ${firstName}`;
  const description = "Open the link to see the surprise waiting for you.";
  const image = `${APP_URL()}/api/og/${slug}`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function WishPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const cookieStore = await cookies();
  const user = await getCurrentUser();

  // A database outage must not surface a stack trace or an internal error page: the
  // visitor sees the same friendly screen a disabled page shows.
  let result: Awaited<ReturnType<typeof loadPublicPage>>;
  try {
    result = await loadPublicPage(slug, user, (name) => cookieStore.get(name)?.value);
  } catch {
    return <UnavailableScreen />;
  }

  if (result.result === "NOT_FOUND") notFound();
  if (result.result === "UNAVAILABLE") return <UnavailableScreen />;

  if (result.result === "LOCKED_SCHEDULED") {
    return (
      <div className={wishFontClasses}>
        <LockScreen
          firstName={result.payload.recipientFirstName}
          revealAt={result.payload.revealAt ?? null}
        />
      </div>
    );
  }

  if (result.result === "LOCKED_PASSWORD") {
    return (
      <div className={wishFontClasses}>
        <PasswordGate slug={slug} firstName={result.payload.recipientFirstName} />
      </div>
    );
  }

  // Development-only overrides so every template and language can be checked on one
  // seed page. In a production build these parameters are ignored.
  const data = { ...result.payload };
  if (process.env.NODE_ENV !== "production") {
    const template = typeof query.template === "string" ? query.template : undefined;
    const lang = typeof query.lang === "string" ? query.lang : undefined;
    if (template) data.theme = { ...data.theme, templateId: template };
    if (lang === "ENGLISH" || lang === "HINGLISH" || lang === "HINDI") data.language = lang;
  }

  return <WishRenderer data={data} mode="live" />;
}
