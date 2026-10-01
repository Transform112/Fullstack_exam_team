"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { SAMPLE_WISH } from "@/lib/sample-data";
import { getTemplateId } from "@/templates/registry";
import { PhoneFrame } from "@/components/preview/PhoneFrame";
import { cn } from "@/lib/utils";
import { CelebrationCard } from "@/components/app/CelebrationCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
export type TemplateCardData = {
  id: string;
  name: string;
  description: string;
  palette: string[];
  accent: string;
};
export function MiniPreview({ templateId, className }: {
  templateId: string;
  accent: string;
  active?: boolean;
  className?: string;
}) {
  return <div className={cn("template-art", className)}>
    <CelebrationCard variant={templateId} compact />
  </div>;
}
export function TemplatePreviewDialog({ template, open, onOpenChange }: {
  template: TemplateCardData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const sample = useMemo(() => {
    const data = SAMPLE_WISH(getTemplateId(template.id), "ENGLISH");
    return { ...data, media: [], theme: { ...data.theme, accent: template.accent } };
  }, [template.id, template.accent]);
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="studio-preview-dialog max-w-3xl max-h-[92dvh] overflow-y-auto p-5 sm:p-8">
      <div className="preview-dialog-grid">
        <div>
          <p className="eyebrow">DESIGN PREVIEW</p>
          <DialogTitle className="mt-3 text-3xl">{template.name}
          </DialogTitle>
          <DialogDescription className="mt-3 text-muted">{template.description}
          </DialogDescription>
          <p className="my-6 text-sm text-muted">A sample celebration with example text. Scroll the page to explore. Your own words, photos, and memories make it personal.</p>
          <Button asChild>
            <Link href="/signup">Create your surprise <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
        <div className="full-template-preview"><PhoneFrame data={sample} /></div>
      </div>
    </DialogContent>
  </Dialog>;
}
export function TemplateCard({ template, className }: {
  template: TemplateCardData;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return <article className={cn("studio-template", className)}>
    <button className="template-preview-button" type="button" onClick={() => setOpen(true)} aria-label={`Preview the ${template.name} template`}>
      <MiniPreview templateId={template.id} accent={template.accent} />
      <span className="preview-label">Preview design <ArrowUpRight size={16} />
      </span>
    </button>
    <div className="template-caption">
      <div>
        <h3>{template.name}
        </h3>
        <p>{template.id === "neon-night" ? "For the life of the party" : template.id === "royal-gold" ? "For a truly golden moment" : "For your favourite soft spot"}
        </p>
      </div>
      <button aria-label={`Open ${template.name} preview`} className="template-arrow" onClick={() => setOpen(true)}>
        <ArrowUpRight size={20} />
      </button>
    </div>
    <TemplatePreviewDialog template={template} open={open} onOpenChange={setOpen} />
  </article>;
}
export default TemplatePreviewDialog;
