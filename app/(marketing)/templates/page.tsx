import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Template } from "@/models/Template";
import { LandingNav } from "@/components/app/LandingNav";
import { SiteFooter } from "@/components/app/landing/SiteFooter";
import { TemplateCard, type TemplateCardData } from "@/components/app/TemplatePreviewDialog";

export const metadata: Metadata = {
  title: "Templates - Wishly",
  description: "Three animated looks for your surprise page. Open a full preview and pick one.",
};

// Used when the database has no active templates yet, so this public page never
// breaks or shows an empty gallery on a fresh environment.
const FALLBACK_TEMPLATES: TemplateCardData[] = [
  {
    id: "neon-night",
    name: "Neon Night",
    description:
      "Party and Gen-Z. Glowing neon text, starfield parallax, glitch reveal, confetti cannon.",
    palette: ["#0B0420", "#FF4FA3", "#22D3EE", "#A78BFA"],
    accent: "#FF4FA3",
  },
  {
    id: "pastel-dream",
    name: "Pastel Dream",
    description: "Soft and cute. Floating balloons, polaroid gallery, hand-drawn doodles, petals.",
    palette: ["#FFF1F5", "#FBCFE8", "#C4B5FD", "#FDE68A"],
    accent: "#F472B6",
  },
  {
    id: "royal-gold",
    name: "Royal Gold",
    description: "Elegant. Gold foil shimmer, slow parallax, rose petals, letter-opening intro.",
    palette: ["#0E0E10", "#D4AF37", "#F5E6C8", "#7F1D1D"],
    accent: "#D4AF37",
  },
];

// Public page: reads the active templates straight from the model, with no auth.
async function loadTemplates(): Promise<TemplateCardData[]> {
  try {
    await connectDB();
    const rows = await Template.find({ isActive: true }).lean();
    if (!rows.length) return FALLBACK_TEMPLATES;
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? "",
      palette: row.defaultPalette?.colors ?? [],
      accent: row.defaultPalette?.accent ?? "#FF4FA3",
    }));
  } catch {
    return FALLBACK_TEMPLATES;
  }
}

export default async function TemplatesPage() {
  const [user, templates] = await Promise.all([getCurrentUser(), loadTemplates()]);

  return (
    <>
      <LandingNav loggedIn={!!user} />

      <main className="container-page py-14 sm:py-20">
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="text-[clamp(32px,6vw,52px)] font-bold leading-tight text-ink">
            Templates
          </h1>
          <p className="mt-3 text-base text-muted">
            Three looks, endless surprises. Open a full preview, then use the one that fits your
            person.
          </p>
        </header>

        <div className="mt-12 flex flex-wrap justify-center gap-6">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
