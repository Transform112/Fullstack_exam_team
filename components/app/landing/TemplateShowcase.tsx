"use client";

// Landing section 4 (docs/04 SECTION 8.4): a snap-scrolling row of the three
// templates. Each card mounts its live preview only when it comes near the
// viewport, which keeps the landing page light on mobile.

import { TemplateCard, type TemplateCardData } from "@/components/app/TemplatePreviewDialog";


const TEMPLATES: TemplateCardData[] = [
  {
    id: "neon-night",
    name: "Neon Night",
    description:
      "A bold midnight palette with bright pink details. For a celebration with a little extra energy.",
    palette: ["#0B0420", "#FF4FA3", "#22D3EE", "#A78BFA"],
    accent: "#FF4FA3",
  },
  {
    id: "pastel-dream",
    name: "Pastel Dream",
    description: "Soft blush tones and a playful, heartfelt feel. A lovely way to celebrate your favourite person.",
    palette: ["#FFF1F5", "#FBCFE8", "#C4B5FD", "#FDE68A"],
    accent: "#F472B6",
  },
  {
    id: "royal-gold",
    name: "Royal Gold",
    description: "Rich dark tones and warm golden accents. An elegant setting for words worth keeping.",
    palette: ["#0E0E10", "#D4AF37", "#F5E6C8", "#7F1D1D"],
    accent: "#D4AF37",
  },
];

export function TemplateShowcase() {
  return (
    <section id="templates" className="collection-section container-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">THE CELEBRATION COLLECTION</p>
          <h2>A feeling for every favourite person.</h2>
          <p>Pick their kind of lovely. Make it unmistakably yours.</p>
        </div>
        <a href="/templates" className="text-link">View all designs ↗</a>
      </div>
      <div className="template-grid" aria-label="Wishly templates">
        {[TEMPLATES[1], TEMPLATES[0], TEMPLATES[2]].map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </section>
  );
}

export default TemplateShowcase;
