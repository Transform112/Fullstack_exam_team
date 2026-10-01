"use client";

// Step 6 - Review (docs/03 P2-08): a read-only summary grouped per step with an Edit
// link that jumps back, plus the button that opens the generate page.
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pencil, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { occasionLabel } from "@/lib/occasion";
import { STEPS, type WizardData } from "@/lib/wizard";
import { useWizardData } from "./Wizard";

const LANGUAGE_LABELS: Record<WizardData["language"], string> = {
  ENGLISH: "English",
  HINGLISH: "Hinglish",
  HINDI: "Hindi",
};

const MUSIC_LABELS: Record<string, string> = {
  none: "No music",
  "soft-piano": "Soft piano",
  "happy-pop": "Happy pop",
  "party-beat": "Party beat",
  "romantic-strings": "Romantic strings",
};

type Section = { step: number; title: string; rows: Array<{ label: string; value: string }> };

// Builds the grouped summary shared by step 6 and the generate page.
export function summarySections(data: WizardData): Section[] {
  const messages = data.messages.map((m) => m.trim()).filter(Boolean);
  const memories = data.memories.filter((m) => m.title.trim());
  const images = data.media.filter((m) => m.type === "image").length;
  const videos = data.media.filter((m) => m.type === "video").length;
  const decorations = data.theme.decorations.length
    ? data.theme.decorations.join(", ")
    : "Occasion defaults";

  return [
    {
      step: 1,
      title: "Occasion",
      rows: [
        { label: "Celebrating", value: occasionLabel(data.occasion, data.customOccasionLabel) },
        { label: "Date", value: data.occasionDate ? formatDate(data.occasionDate) : "Not set" },
        {
          label: "Reveal",
          value: data.revealEnabled
            ? `Locked until ${data.occasionDate || "the occasion"} at ${data.revealTime || "00:00"}`
            : "Visible immediately",
        },
      ],
    },
    {
      step: 2,
      title: "Recipient",
      rows: [
        { label: "To", value: data.recipient.name || "Not set" },
        { label: "Nickname", value: data.recipient.nickname || "-" },
        { label: "Relation", value: data.recipient.relation || "-" },
        {
          label: "Age",
          value: typeof data.recipient.age === "number" ? String(data.recipient.age) : "-",
        },
        { label: "From", value: data.from || "-" },
      ],
    },
    {
      step: 3,
      title: "Words",
      rows: [
        { label: "Language", value: LANGUAGE_LABELS[data.language] },
        { label: "Messages", value: messages.length ? `${messages.length}` : "None yet" },
        { label: "First message", value: messages[0] ?? "-" },
        {
          label: "Memories",
          value: memories.length ? memories.map((m) => m.title).join(", ") : "None",
        },
      ],
    },
    {
      step: 4,
      title: "Media",
      rows: [
        { label: "Photos", value: String(images) },
        { label: "Videos", value: String(videos) },
        { label: "Music", value: MUSIC_LABELS[data.theme.music] ?? data.theme.music },
      ],
    },
    {
      step: 5,
      title: "Style",
      rows: [
        { label: "Template", value: data.theme.templateId || "Not chosen" },
        { label: "Accent", value: data.theme.accent },
        { label: "Font", value: data.theme.font === "handwriting" ? "Handwriting" : "Default" },
        { label: "Decorations", value: decorations },
        { label: "Password", value: data.settings.hasPassword ? "Protected" : "Open to anyone" },
        { label: "Wishes wall", value: data.settings.wishesWall ? "On" : "Off" },
        { label: "View count", value: data.settings.showViews ? "Shown" : "Hidden" },
      ],
    },
  ];
}

export type WizardSummaryProps = {
  data: WizardData;
  onEdit?: (step: number) => void;
};

export function WizardSummary({ data, onEdit }: WizardSummaryProps) {
  const reduced = !!useReducedMotion();
  const sections = useMemo(() => summarySections(data), [data]);

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section, index) => (
        <motion.div
          key={section.step}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.2 : 0.3, delay: reduced ? 0 : index * 0.04 }}
        >
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardTitle>{section.title}</CardTitle>
              {onEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(section.step)}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-2">
                {section.rows.map((row) => (
                  <div key={row.label} className="flex flex-wrap gap-x-3 gap-y-1">
                    <dt className="w-32 shrink-0 text-xs uppercase tracking-wide text-muted">
                      {row.label}
                    </dt>
                    <dd className="min-w-0 flex-1 break-words text-sm text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export function StepReview() {
  const { data, pageId, goStep, saveDraft } = useWizardData();
  const router = useRouter();
  const [opening, setOpening] = useState(false);

  // The generate page needs a saved draft, and every queued write must land first.
  const openGenerate = async () => {
    const id = pageId ?? (await saveDraft());
    if (!id) {
      toast.error("Save step 1 first so we can create your draft.");
      return;
    }
    router.push(`/create/${id}/review`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-ink">Everything look right?</h2>
        <p className="mt-1 text-sm text-muted">
          This is exactly what your page will show. Jump back to any step to change it.
        </p>
      </div>

      <WizardSummary data={data} onEdit={goStep} />

      <div className="flex flex-col items-start gap-2">
        <Button
          type="button"
          size="lg"
          disabled={opening}
          onClick={() => {
            setOpening(true);
            void openGenerate().finally(() => setOpening(false));
          }}
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          {opening ? "Opening..." : "Review and generate"}
        </Button>
        <p className="text-xs text-muted">
          Step {STEPS.length} of {STEPS.length}. We save your draft before opening the preview.
        </p>
      </div>
    </div>
  );
}

export default StepReview;
