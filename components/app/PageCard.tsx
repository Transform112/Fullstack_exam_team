"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Copy,
  ExternalLink,
  MoreVertical,
  Pencil,
  Share2,
  Trash2,
  Upload,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { occasionLabel } from "@/lib/occasion";
import { formatDate } from "@/lib/utils";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { ShareDialog } from "@/components/app/ShareDialog";

export type DashboardCardStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "UNPUBLISHED" | "DISABLED";

// Exactly the serializeCard shape returned by EP-08 and EP-27.
export type DashboardCard = {
  id: string;
  slug: string | null;
  status: DashboardCardStatus;
  recipientName: string;
  occasion: string;
  customOccasionLabel: string;
  templateId: string;
  thumbnailUrl: string | null;
  stats: { views: number; uniqueViews: number; wishes: number };
  revealAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PageCardProps = { page: DashboardCard; onChanged: () => void };

// Status chip colours from docs/03 SECTION 5.4.
const STATUS_TONES: Record<
  DashboardCardStatus,
  "draft" | "scheduled" | "live" | "unpublished" | "disabled"
> = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  PUBLISHED: "live",
  UNPUBLISHED: "unpublished",
  DISABLED: "disabled",
};

const STATUS_LABELS: Record<DashboardCardStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Live",
  UNPUBLISHED: "Unpublished",
  DISABLED: "Disabled",
};

// Public base URL for share links: build-time env first, browser origin as fallback.
function appBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  return typeof window === "undefined" ? "" : window.location.origin;
}

// One dashboard card: thumbnail, chips, views, date and the actions menu (docs/03 P4-02).
export function PageCard({ page, onChanged }: PageCardProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const disabled = page.status === "DISABLED";
  const canOpen =
    Boolean(page.slug) && (page.status === "PUBLISHED" || page.status === "SCHEDULED");
  const canUnpublish = page.status === "PUBLISHED" || page.status === "SCHEDULED";
  const canPublish = page.status === "UNPUBLISHED" || page.status === "DRAFT";
  const recipient = page.recipientName || "Untitled surprise";

  const errorMessage = (err: unknown) =>
    err instanceof Error ? err.message : "Something went wrong";

  // EP-16: a fresh draft copy; the creator continues in its edit page.
  async function duplicatePage() {
    try {
      const copy = await api<{ id: string }>(`/pages/${page.id}/duplicate`, { method: "POST" });
      toast.success("Draft duplicated");
      onChanged();
      router.push(`/pages/${copy.id}/edit`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  // EP-15: keeps the slug so publishing again restores the same link.
  async function unpublishPage() {
    try {
      await api(`/pages/${page.id}/unpublish`, { method: "POST" });
      toast.success("Page unpublished");
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function openShare() {
    if (!page.slug) {
      toast.error("Publish this page first to get a share link");
      return;
    }
    setShareOpen(true);
  }

  // EP-17: deletes the page and everything that belongs to it.
  async function deletePage() {
    try {
      await api(`/pages/${page.id}`, { method: "DELETE" });
      toast.success("Page deleted");
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
      throw err;
    }
  }

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-canvas">
        {page.thumbnailUrl ? (
          <img
            src={page.thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
        ) : (
          <div aria-hidden className="flex h-full items-center justify-center bg-primary/5 p-10 pt-16">
            <div className="flex h-full w-full -rotate-3 flex-col items-center justify-center gap-3 border border-primary/20 bg-canvas p-4 text-primary shadow-sm">
              <span className="text-[10px] uppercase tracking-[0.2em]">Made especially for</span>
              <span className="max-w-full truncate font-heading text-3xl">{recipient}</span>
              <span className="h-px w-10 bg-accent" />
            </div>
          </div>
        )}
        <div className="absolute left-3 right-3 top-3 flex flex-wrap gap-2">
          <Badge tone={STATUS_TONES[page.status]}>{STATUS_LABELS[page.status]}</Badge>
          <Badge>{occasionLabel(page.occasion, page.customOccasionLabel)}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-heading text-2xl font-normal text-ink">{recipient}</h3>
            <p className="mt-1 text-xs text-muted">
              {page.stats.views} {page.stats.views === 1 ? "view" : "views"} ·{" "}
              {formatDate(page.createdAt)}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Actions for ${recipient}`}
              >
                <MoreVertical className="h-5 w-5" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!disabled && canOpen && page.slug ? (
                <DropdownMenuItem asChild>
                  <a href={`/w/${page.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    Open
                  </a>
                </DropdownMenuItem>
              ) : null}

              {!disabled ? (
                <DropdownMenuItem onSelect={() => router.push(`/pages/${page.id}/edit`)}>
                  <Pencil className="h-4 w-4" aria-hidden />
                  Edit
                </DropdownMenuItem>
              ) : null}

              {!disabled ? (
                <DropdownMenuItem onSelect={duplicatePage}>
                  <Copy className="h-4 w-4" aria-hidden />
                  Duplicate
                </DropdownMenuItem>
              ) : null}

              {!disabled ? (
                <DropdownMenuItem onSelect={openShare}>
                  <Share2 className="h-4 w-4" aria-hidden />
                  Share
                </DropdownMenuItem>
              ) : null}

              {!disabled ? (
                <DropdownMenuItem onSelect={() => router.push(`/pages/${page.id}/insights`)}>
                  <BarChart3 className="h-4 w-4" aria-hidden />
                  Insights
                </DropdownMenuItem>
              ) : null}

              {!disabled && canUnpublish ? (
                <DropdownMenuItem onSelect={unpublishPage}>
                  <EyeOff className="h-4 w-4" aria-hidden />
                  Unpublish
                </DropdownMenuItem>
              ) : null}

              {!disabled && canPublish ? (
                <DropdownMenuItem onSelect={() => router.push(`/create/${page.id}/review`)}>
                  <Upload className="h-4 w-4" aria-hidden />
                  Publish
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setConfirmDelete(true)}
                className="text-red-600 focus:bg-red-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {disabled ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            Disabled by admin
          </p>
        ) : null}
        {!disabled ? (
          <div className="mt-auto flex items-center gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.push(`/pages/${page.id}/edit`)}>
              <Pencil className="h-4 w-4" aria-hidden />
              {page.status === "DRAFT" ? "Continue creating" : "Edit surprise"}
            </Button>
            {canOpen ? (
              <Button type="button" variant="ghost" size="icon" onClick={openShare} aria-label={`Share ${recipient}'s surprise`}>
                <Share2 className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this surprise?"
        description="The page, its wishes, its analytics and its uploaded photos are removed. This cannot be undone."
        confirmLabel="Delete page"
        destructive
        onConfirm={deletePage}
      />

      {shareOpen && page.slug ? (
        <ShareDialog
          open
          onOpenChange={(next) => {
            if (!next) setShareOpen(false);
          }}
          url={`${appBaseUrl()}/w/${page.slug}`}
          recipientName={recipient}
          slug={page.slug}
        />
      ) : null}
    </Card>
  );
}
