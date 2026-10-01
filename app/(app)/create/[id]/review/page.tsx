"use client";

// The generate page (docs/03 P2-08): the stored summary, the real preview and the
// Generate button that calls EP-14 and opens the success modal.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { PublishSuccessModal } from "@/components/app/PublishSuccessModal";
import { PreviewPane } from "@/components/preview/PreviewPane";
import { WizardSummary } from "@/components/wizard/StepReview";
import { api, ApiError } from "@/lib/client-api";
import { fromServerPage, type WizardData } from "@/lib/wizard";
import type { OwnerPage } from "@/lib/page-helpers";

type RouteParams = { id: string };

type PublishResult = {
  slug: string;
  url: string;
  status: string;
  revealAt: string | null;
  qrCode: string;
  ogImage: string;
  rev: number;
};

const STEP_LABELS: Record<number, string> = {
  1: "Occasion",
  2: "Recipient",
  3: "Words",
  4: "Media",
  5: "Style",
};

// The API reports the failing field path; the step that owns it is the fix.
function stepForIssuePath(path: string): number {
  const key = path.toLowerCase();
  if (key.includes("media") || key.includes("photo")) return 4;
  if (key.includes("template")) return 5;
  if (key.includes("occasion") || key.includes("reveal")) return 1;
  if (key.includes("recipient") || key === "from") return 2;
  if (key.includes("message") || key.includes("memo") || key.includes("language")) return 3;
  if (key.includes("theme") || key.includes("settings") || key.includes("accent")) return 5;
  return 1;
}

export default function GenerateReviewPage() {
  const params = useParams<RouteParams>();
  const id = typeof params?.id === "string" ? params.id : "";
  const router = useRouter();
  const [owner, setOwner] = useState<OwnerPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<Array<{ path: string; issue: string }>>([]);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await api<OwnerPage>(`/pages/${id}`);
      setOwner(page);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        router.replace("/dashboard");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not load this page.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const generate = async () => {
    setPublishing(true);
    setMessage(null);
    setDetails([]);
    try {
      const published = await api<PublishResult>(`/pages/${id}/publish`, { method: "POST" });
      setResult(published);
      setModalOpen(true);
      // The local mirror is no longer needed once the page is generated.
      try {
        window.localStorage.removeItem(`wishly:draft:${id}`);
      } catch {
        // Storage may be unavailable; the publish already succeeded.
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setMessage(err.message);
        setDetails(err.details ?? []);
        toast.error(err.message);
      } else {
        setMessage("Something went wrong. Please try again.");
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setPublishing(false);
    }
  };

  const data: WizardData | null = owner ? fromServerPage(owner) : null;
  const alreadyPublished = owner?.status === "PUBLISHED" || owner?.status === "SCHEDULED";

  return (
    <div className="min-h-screen bg-canvas">
      <div className="py-2">
        <Link
          href={`/pages/${id}/edit`}
          className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to editing
        </Link>

        <h1 className="font-heading text-4xl font-normal tracking-tight text-ink sm:text-5xl">Ready for their big moment?</h1>
        <p className="mt-1 text-sm text-muted">
          Take one last look at your surprise. When it feels right, publish it and share your personal link.
        </p>

        {loading && (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_400px]">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="hidden h-[560px] w-full lg:block" />
          </div>
        )}

        {!loading && error && (
          <div className="mt-6 rounded-card border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => void load()}
            >
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && data && owner && (
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <WizardSummary data={data} />

              <div className="mt-6 flex flex-col gap-3">
                <Button
                  type="button"
                  size="lg"
                  onClick={() => void generate()}
                  disabled={publishing}
                  className="self-start"
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  {publishing
                    ? "Generating..."
                    : alreadyPublished
                      ? "Update page"
                      : "Generate page"}
                </Button>

                {message && (
                  <div className="rounded-card border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-700">{message}</p>
                    {details.length > 0 && (
                      <ul className="mt-2 flex flex-col gap-2">
                        {details.map((detail) => {
                          const step = stepForIssuePath(detail.path);
                          return (
                            <li
                              key={`${detail.path}-${detail.issue}`}
                              className="flex flex-wrap items-center gap-2 text-sm text-red-700"
                            >
                              <span>{detail.issue}</span>
                              <Link
                                href={`/pages/${id}/edit`}
                                onClick={() => {
                                  try {
                                    // The wizard reads this hint and opens the matching step.
                                    window.sessionStorage.setItem("wishly:gotoStep", String(step));
                                  } catch {
                                    // The link still works without the hint.
                                  }
                                }}
                                className="font-medium underline underline-offset-4"
                              >
                                Fix in {STEP_LABELS[step] ?? "this"} step
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="hidden lg:sticky lg:top-6 lg:flex lg:h-[calc(100vh-3rem)] lg:w-[400px] lg:shrink-0 lg:flex-col">
              <PreviewPane data={data} className="h-full" />
            </div>
          </div>
        )}
      </div>

      {result && (
        <PublishSuccessModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          slug={result.slug}
          url={result.url}
          recipientName={owner?.recipient.name ?? ""}
          qrCode={result.qrCode}
        />
      )}
    </div>
  );
}
