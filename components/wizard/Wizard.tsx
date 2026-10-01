"use client";

// The wizard shell (docs/03 P2-01): step state, per-step zod validation, serialised
// saving through lib/wizard-queue, autosave to localStorage plus EP-10, conflict
// recovery, the live preview and the step transitions.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { WizardProgress } from "./WizardProgress";
import { StepOccasion } from "./StepOccasion";
import { StepRecipient } from "./StepRecipient";
import { StepWords } from "./StepWords";
import { StepMedia } from "./StepMedia";
import { StepStyle } from "./StepStyle";
import { StepReview } from "./StepReview";
import { PreviewPane } from "@/components/preview/PreviewPane";
import { PreviewDrawer } from "@/components/preview/PreviewDrawer";
import { api, ApiError } from "@/lib/client-api";
import { createWriteQueue, isNetworkError, type RetryableTask } from "@/lib/wizard-queue";
import { Button } from "@/components/ui/button";
import {
  emptyWizardData,
  fromServerPage,
  toAutosaveBody,
  toPatchBody,
  toPreviewData,
  type WizardData,
} from "@/lib/wizard";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
} from "@/lib/wizard-schemas";
import type { OwnerPage } from "@/lib/page-helpers";

const EASE = [0.22, 1, 0.36, 1] as const;
const MIRROR_PREFIX = "wishly:draft:";
const AUTOSAVE_DELAY = 800;

export type SaveState = "idle" | "saving" | "saved" | "error" | "offline" | "conflict";

export type StepErrors = Record<string, string>;

export type WizardContextValue = {
  data: WizardData;
  mode: "create" | "edit";
  userId: string;
  step: number;
  pageId: string | null;
  saveState: SaveState;
  errors: StepErrors;
  // Merges a change into wizard state and marks the wizard dirty for autosave.
  update: (patch: Partial<WizardData>) => void;
  setData: React.Dispatch<React.SetStateAction<WizardData>>;
  goStep: (step: number) => void;
  registerField: (name: string) => (element: HTMLElement | null) => void;
  setErrors: (errors: StepErrors) => void;
  saveStepData: (step: number) => Promise<void>;
  // Resolves with the draft id so a caller can navigate to it right away.
  saveDraft: () => Promise<string | null>;
  // Pulls the authoritative revision from the server (uploads and deletes bump it).
  refetchAndMerge: () => Promise<void>;
  retryWrites: () => void;
  // Merge helpers for child components that change media or memories directly.
  mergeOwnerPage: (page: OwnerPage, parts: Array<"media" | "memoryIds">) => void;
};

const WizardContext = createContext<WizardContextValue | null>(null);

// Every wizard step and the preview read state through this hook.
export function useWizardData() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizardData must be used inside Wizard");
  return ctx;
}

export type WizardProps = {
  initialPage?: OwnerPage;
  mode: "create" | "edit";
  userId?: string;
};

type Mirror = { data: WizardData; userId: string; baseRev: number; localSavedAt: number };

export function Wizard({ initialPage, mode, userId: initialUserId }: WizardProps) {
  const router = useRouter();
  const reduced = !!useReducedMotion();
  const shakeControls = useAnimationControls();
  const [userId, setUserId] = useState(initialUserId ?? "");

  const [data, setDataState] = useState<WizardData>(() =>
    initialPage ? fromServerPage(initialPage) : emptyWizardData(),
  );
  const [step, setStep] = useState(() => {
    if (!initialPage) return 1;
    // Create mode resumes where the creator stopped; edit mode always starts at step 1.
    return mode === "edit" ? 1 : Math.min(6, Math.max(1, initialPage.draftStep || 1));
  });
  const [direction, setDirection] = useState<1 | -1>(1);
  const [pageId, setPageId] = useState<string | null>(initialPage?.id ?? null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errors, setErrors] = useState<StepErrors>({});
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mirror, setMirror] = useState<Mirror | null>(null);

  const queue = useMemo(() => createWriteQueue(), []);
  const revRef = useRef<number>(initialPage?.rev ?? 0);
  const pageIdRef = useRef<string | null>(initialPage?.id ?? null);
  const dataRef = useRef<WizardData>(data);
  const stepRef = useRef<number>(step);
  const dirtyRef = useRef(false);
  const conflictRef = useRef(false);
  const mirroredRef = useRef(false);
  const hintReadRef = useRef(false);
  const fieldRefs = useRef(new Map<string, HTMLElement>());
  const stepContainerRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeRef = useRef<() => void>(() => undefined);

  // Every helper below reads the newest values through these refs.
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  useEffect(() => {
    stepRef.current = step;
    // The autosave body carries draftStep, so it must always match the visible step.
    dataRef.current = { ...dataRef.current, draftStep: step };
    setDataState((current) =>
      current.draftStep === step ? current : { ...current, draftStep: step },
    );
  }, [step]);
  useEffect(() => {
    pageIdRef.current = pageId;
  }, [pageId]);

  // Offline mirrors belong to one account: an empty id means "do not restore".
  useEffect(() => {
    if (userId) return;
    let cancelled = false;
    void api<{ user?: { id?: string }; id?: string }>("/auth/me")
      .then((result) => {
        const id = result?.user?.id ?? result?.id ?? "";
        if (!cancelled && id) setUserId(id);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ------------------------------------------------------------------- validation

  // Mirrors the step-to-body mapping of docs/02 SECTION 12 for validation.
  const stepInput = useCallback((source: WizardData, target: number): unknown => {
    if (target === 1) {
      return {
        occasion: source.occasion,
        customOccasionLabel: source.customOccasionLabel,
        occasionDate: source.occasionDate,
        revealEnabled: source.revealEnabled,
        revealTime: source.revealTime,
      };
    }
    if (target === 2) return { recipient: source.recipient, from: source.from };
    if (target === 3) {
      return { language: source.language, messages: source.messages, memories: source.memories };
    }
    if (target === 4) return { media: source.media, theme: { music: source.theme.music } };
    if (target === 5) {
      return {
        theme: {
          templateId: source.theme.templateId,
          accent: source.theme.accent,
          font: source.theme.font,
          decorations: source.theme.decorations,
        },
        settings: source.settings,
      };
    }
    return {};
  }, []);

  // Runs the step schema and returns the errors keyed by field name.
  const validateStep = useCallback(
    (target: number, source: WizardData): StepErrors => {
      const parsed = schemaFor(target).safeParse(stepInput(source, target));
      if (parsed.success) return {};
      const next: StepErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "form";
        if (!next[key]) next[key] = issue.message;
      }
      return next;
    },
    [stepInput],
  );

  const focusFirstError = useCallback((nextErrors: StepErrors) => {
    const first = Object.keys(nextErrors)[0];
    if (!first) return;
    const element = fieldRefs.current.get(first);
    if (element) {
      element.focus();
      element.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, []);

  // The shake playbook from docs/04 SECTION 7.1, skipped when reduced motion is on.
  shakeRef.current = () => {
    if (reduced) return;
    void shakeControls.start({ x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.35 } });
  };

  const failStep = useCallback(
    (nextErrors: StepErrors) => {
      setErrors(nextErrors);
      shakeRef.current();
      focusFirstError(nextErrors);
    },
    [focusFirstError],
  );

  const registerField = useCallback(
    (name: string) => (element: HTMLElement | null) => {
      if (element) fieldRefs.current.set(name, element);
      else fieldRefs.current.delete(name);
    },
    [],
  );

  // --------------------------------------------------------------------- merging

  // Copies server-owned facts (ids, order, rev) back into local state without
  // overwriting text the creator may be typing right now.
  const mergeOwnerPage = useCallback((page: OwnerPage, parts: Array<"media" | "memoryIds">) => {
    setDataState((current) => {
      const next: WizardData = {
        ...current,
        rev: page.rev,
        draftStep: page.draftStep || current.draftStep,
      };
      if (parts.includes("memoryIds")) {
        const saved = current.memories.filter((m) => m.title.trim().length > 0);
        next.memories = current.memories.map((memory) => {
          if (memory.id) return memory;
          const index = saved.indexOf(memory);
          const server = index >= 0 ? page.memories[index] : undefined;
          return server?.id ? { ...memory, id: server.id } : memory;
        });
      }
      if (parts.includes("media")) {
        const localById = new Map(current.media.map((m) => [m.id, m]));
        next.media = page.media.map((item) => {
          const local = localById.get(item.id);
          return {
            id: item.id,
            type: item.type,
            url: item.url,
            publicId: item.publicId,
            w: item.w,
            h: item.h,
            duration: item.duration ?? undefined,
            caption: local?.caption ?? item.caption,
            order: item.order,
          };
        });
      }
      dataRef.current = next;
      return next;
    });
  }, []);

  // ---------------------------------------------------------------------- saving

  // The single place a wizard write is performed. It returns the new page id and rev
  // so a retry closure can pick up fresh values after a reconnect.
  const applySave = useCallback(
    async (body: Record<string, unknown>, targetStep: number) => {
      const id = pageIdRef.current;
      if (!id) {
        const page = await api<OwnerPage>("/pages", { method: "POST", body });
        pageIdRef.current = page.id;
        revRef.current = page.rev;
        setPageId(page.id);
        setDataState((current) => ({ ...current, rev: page.rev, draftStep: targetStep }));
        return { id: page.id, rev: page.rev };
      }
      const page = await api<OwnerPage>(`/pages/${id}`, { method: "PATCH", body });
      revRef.current = page.rev;
      if (targetStep === 3) mergeOwnerPage(page, ["memoryIds"]);
      else if (body.media !== undefined) mergeOwnerPage(page, ["media"]);
      else
        setDataState((current) => ({
          ...current,
          rev: page.rev,
          draftStep: page.draftStep || current.draftStep,
        }));
      return { id, rev: page.rev };
    },
    [mergeOwnerPage],
  );

  const handleWriteError = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.code === "STALE_REVISION") {
      conflictRef.current = true;
      setSaveState("conflict");
      toast.error("This page changed elsewhere. Reload to see the latest version.");
      return;
    }
    if (isNetworkError(err)) {
      setSaveState("offline");
      return;
    }
    setSaveState("error");
    toast.error(err instanceof Error ? err.message : "Could not save your draft.");
  }, []);

  // Builds a task whose retry re-reads the live revision instead of replaying a stale one.
  const queuedTask = useCallback(
    (bodyFn: () => Record<string, unknown>, stepFn: () => number): RetryableTask => {
      const task: RetryableTask = {
        run: async () => {
          const result = await applySave(bodyFn(), stepFn());
          if (pageIdRef.current === result.id) {
            dirtyRef.current = false;
            setSaveState("saved");
          }
        },
      };
      task.retry = () => queuedTask(bodyFn, stepFn);
      return task;
    },
    [applySave],
  );

  // Hands one write to the queue. Returns the page id once the server answered.
  const runSave = useCallback(
    async (body: Record<string, unknown>, targetStep: number): Promise<string | null> => {
      if (conflictRef.current) return pageIdRef.current;
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setSaveState("offline");
        await queue.enqueueStep(
          queuedTask(
            () => body,
            () => targetStep,
          ),
        );
        return pageIdRef.current;
      }
      setSaveState("saving");
      const wasNew = !pageIdRef.current;
      const task = queuedTask(
        () => body,
        () => targetStep,
      );
      let failure: unknown = null;
      await queue.enqueueStep({
        run: async () => {
          try {
            await task.run();
          } catch (err) {
            failure = err;
            throw err;
          }
        },
        retry: () =>
          queuedTask(
            () => body,
            () => targetStep,
          ),
      });
      if (failure) {
        handleWriteError(failure);
      } else if (wasNew && pageIdRef.current) {
        // First save of a new draft: keep the id in the URL so a refresh resumes.
        router.replace(`/create?id=${pageIdRef.current}`);
      }
      return pageIdRef.current;
    },
    [queue, queuedTask, handleWriteError, router],
  );

  // Next: validate this step only, save it, then advance.
  const next = useCallback(async () => {
    const target = stepRef.current;
    const snapshot = dataRef.current;
    const nextErrors = validateStep(target, snapshot);
    if (Object.keys(nextErrors).length) {
      failStep(nextErrors);
      return;
    }
    setSaving(true);
    try {
      await runSave(toPatchBody(snapshot, target), target);
      if (conflictRef.current) return;
      setDataState((current) => ({
        ...current,
        settings: { ...current.settings, password: undefined },
      }));
      if (target === 6) {
        const id = pageIdRef.current;
        if (id) {
          // Every queued write must land before the page is generated (SECTION 5.6).
          await queue.drain();
          router.push(`/create/${id}/review`);
        }
        return;
      }
      setDirection(1);
      setStep(Math.min(6, target + 1));
    } catch (err) {
      handleWriteError(err);
    } finally {
      setSaving(false);
    }
  }, [validateStep, failStep, runSave, queue, router, handleWriteError]);

  const goStep = useCallback((target: number) => {
    setDirection(target >= stepRef.current ? 1 : -1);
    setStep(Math.min(6, Math.max(1, target)));
  }, []);

  // Back never validates and never loses data.
  const back = useCallback(() => {
    setDirection(-1);
    setStep((current) => Math.max(1, current - 1));
  }, []);

  // Saves the current step with toAutosaveBody and without validating the form.
  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      if (!pageIdRef.current) return await runSave(toPatchBody(dataRef.current, 1), 1);
      await runSave(toAutosaveBody(dataRef.current), stepRef.current);
      return pageIdRef.current;
    } catch (err) {
      handleWriteError(err);
      return pageIdRef.current;
    } finally {
      setSaving(false);
    }
  }, [runSave, handleWriteError]);

  const saveStepData = useCallback(
    async (target: number) => {
      await runSave(toPatchBody(dataRef.current, target), target);
    },
    [runSave],
  );

  const refetchAndMerge = useCallback(async () => {
    const id = pageIdRef.current;
    if (!id) return;
    const page = await api<OwnerPage>(`/pages/${id}`);
    revRef.current = page.rev;
    mergeOwnerPage(page, ["media", "memoryIds"]);
    setPageId(page.id);
  }, [mergeOwnerPage]);

  const retryWrites = useCallback(() => {
    if (conflictRef.current) return;
    setSaveState("saving");
    void queue
      .drain()
      .then(() => {
        setSaveState(queue.pending() > 0 ? "offline" : "saved");
      })
      .catch(() => {
        setSaveState("error");
      });
  }, [queue]);

  // -------------------------------------------------------------------- autosave

  useEffect(() => {
    if (!dirtyRef.current || conflictRef.current) return;
    const snapshot = data;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      // The mirror never holds settings.password, cookies or tokens.
      const payload: Mirror = {
        data: { ...snapshot, settings: { ...snapshot.settings, password: undefined } },
        userId,
        baseRev: revRef.current,
        localSavedAt: Date.now(),
      };
      try {
        window.localStorage.setItem(
          `${MIRROR_PREFIX}${pageIdRef.current ?? "new"}`,
          JSON.stringify(payload),
        );
      } catch {
        // Private mode or a full quota: server autosave still works.
      }
      void runSave(toAutosaveBody(snapshot), snapshot.draftStep || stepRef.current);
    }, AUTOSAVE_DELAY);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, runSave, userId]);

  // -------------------------------------------------------------------- recovery

  // The generate page leaves a "fix this step" hint behind (P2-08 error links).
  useEffect(() => {
    if (hintReadRef.current) return;
    hintReadRef.current = true;
    try {
      const hint = window.sessionStorage.getItem("wishly:gotoStep");
      if (!hint) return;
      window.sessionStorage.removeItem("wishly:gotoStep");
      const target = Number(hint);
      if (target >= 1 && target <= 6) setStep(target);
    } catch {
      // Session storage can be unavailable; the wizard just starts at step 1.
    }
  }, []);

  // Moving to another step puts the cursor on its first field (docs/03 P2-01 item 7).
  useEffect(() => {
    const container = stepContainerRef.current;
    if (!container) return;
    const first = container.querySelector<HTMLElement>(
      'input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    first?.focus({ preventScroll: true });
  }, [step]);

  // Offers (never forces) the local mirror back after a refresh.
  useEffect(() => {
    if (mirroredRef.current) return;
    mirroredRef.current = true;
    const key = `${MIRROR_PREFIX}${initialPage?.id ?? "new"}`;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return;
    }
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Mirror;
      // Never restore another user's data.
      if (parsed?.userId !== userId || !parsed.data) return;
      setMirror(parsed);
    } catch {
      window.localStorage.removeItem(key);
    }
  }, [initialPage?.id, userId]);

  // Retry queued writes as soon as the browser is back online.
  useEffect(() => {
    const onOnline = () => {
      if (conflictRef.current) return;
      retryWrites();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [retryWrites]);

  const acceptMirror = () => {
    if (!mirror) return;
    setDataState({ ...mirror.data, settings: { ...mirror.data.settings, password: undefined } });
    setMirror(null);
    dirtyRef.current = true;
    toast.success("Your unsaved edits were restored.");
  };

  const acceptServer = () => {
    setMirror(null);
    void refetchAndMerge().catch(() => toast.error("Could not reload the page."));
  };

  // Keeps the local edits and writes them on top of the newest server revision.
  const keepMine = () => {
    conflictRef.current = false;
    retryWrites();
  };

  const reloadPage = () => {
    conflictRef.current = false;
    setSaveState("idle");
    void refetchAndMerge()
      .then(() => toast.success("Loaded the latest version."))
      .catch(() => toast.error("Could not reload the page."));
  };

  const preview = useMemo(() => toPreviewData(data), [data]);

  const context = useMemo<WizardContextValue>(
    () => ({
      data,
      mode,
      userId,
      step,
      pageId,
      saveState,
      errors,
      update: (patch) => {
        dirtyRef.current = true;
        setDataState((current) => {
          const next = { ...current, ...patch };
          dataRef.current = next;
          return next;
        });
      },
      setData: (value) => {
        dirtyRef.current = true;
        setDataState(value);
      },
      goStep,
      registerField,
      setErrors,
      saveStepData,
      saveDraft,
      refetchAndMerge,
      retryWrites,
      mergeOwnerPage,
    }),
    [
      data,
      mode,
      userId,
      step,
      pageId,
      saveState,
      errors,
      goStep,
      registerField,
      saveStepData,
      saveDraft,
      refetchAndMerge,
      retryWrites,
      mergeOwnerPage,
    ],
  );

  // ------------------------------------------------------------------------ view

  const slide = reduced ? 0 : 24;
  const statusLabel: Record<SaveState, string> = {
    idle: mode === "create" ? "Draft not saved yet" : "Loaded",
    saving: "Saving...",
    saved: "Saved",
    error: "Could not save. Retry",
    offline: "Offline / Unsaved",
    conflict: "Conflict: this page changed elsewhere",
  };

  return (
    <WizardContext.Provider value={context}>
      <div className="py-2">
        <header className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">The Wishly studio</p>
          <h1 className="mt-3 font-heading text-4xl tracking-tight text-ink sm:text-5xl">
            {mode === "edit" ? "Make it even more personal." : "A little effort. A big feeling."}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">Build your surprise one step at a time. Your preview changes as you create; you choose when to publish.</p>
        </header>
        <WizardProgress step={step} onStepClick={goStep} />

        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 rounded-card border border-border bg-white p-4 pb-24 sm:p-6 lg:pb-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
              <span aria-live="polite" className="text-xs font-medium text-muted">
                {statusLabel[saveState]}
              </span>
              <div className="flex items-center gap-2">
                {(saveState === "offline" || saveState === "error") && (
                  <Button type="button" variant="outline" size="sm" onClick={retryWrites}>
                    Retry
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void saveDraft()}
                  disabled={saving}
                >
                  Save draft
                </Button>
              </div>
            </div>

            {saveState === "conflict" && (
              <div className="mb-4 rounded-card border border-amber-300 bg-amber-50 p-4">
                <p className="text-sm font-medium text-ink">
                  This page was changed somewhere else. Your edits are kept here.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={reloadPage}>
                    Reload
                  </Button>
                  <Button type="button" size="sm" onClick={keepMine}>
                    Keep mine
                  </Button>
                </div>
              </div>
            )}

            {mirror && (
              <div className="mb-4 rounded-card border border-primary/40 bg-white p-4">
                <p className="text-sm font-medium text-ink">
                  We found unsaved edits from {new Date(mirror.localSavedAt).toLocaleString()}.
                </p>
                <p className="mt-1 text-xs text-muted">
                  The server is on revision {revRef.current}; your local copy was based on revision{" "}
                  {mirror.baseRev}.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={acceptMirror}>
                    Restore my edits
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={acceptServer}>
                    Use the server version
                  </Button>
                </div>
              </div>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void next();
              }}
              data-step={step}
              noValidate
              className="overflow-x-clip"
            >
              <motion.div animate={shakeControls}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={step}
                    ref={stepContainerRef}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, x: slide * direction }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, x: -slide * direction }}
                    transition={{ duration: reduced ? 0.2 : 0.3, ease: EASE }}
                  >
                    {step === 1 && <StepOccasion />}
                    {step === 2 && <StepRecipient />}
                    {step === 3 && <StepWords />}
                    {step === 4 && <StepMedia />}
                    {step === 5 && <StepStyle />}
                    {step === 6 && <StepReview />}
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
                <Button type="button" variant="outline" onClick={back} disabled={step === 1}>
                  Back
                </Button>
                <Button type="submit" disabled={saving} className="min-w-[7rem]">
                  {saving ? "Saving..." : step === 6 ? "Review and generate" : "Continue"}
                </Button>
              </div>
            </form>
          </div>

          <div className="hidden lg:sticky lg:top-24 lg:flex lg:h-[calc(100vh-7rem)] lg:w-[360px] lg:shrink-0 lg:flex-col">
            <PreviewPane data={data} className="h-full" />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="fixed bottom-4 left-1/2 z-40 flex h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-white shadow-card lg:hidden"
      >
        Preview
      </button>

      <PreviewDrawer open={previewOpen} onOpenChange={setPreviewOpen} data={preview} />
    </WizardContext.Provider>
  );
}

const schemaFor = (target: number) => {
  if (target === 1) return step1Schema;
  if (target === 2) return step2Schema;
  if (target === 3) return step3Schema;
  if (target === 4) return step4Schema;
  if (target === 5) return step5Schema;
  return step6Schema;
};

// Inline validation message: a 0.2s fade with a 4px rise (docs/04 SECTION 7.1).
export function FieldError({ message }: { message?: string }) {
  const reduced = !!useReducedMotion();
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
          transition={{ duration: 0.2 }}
          role="alert"
          className="text-xs font-medium text-red-600"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export default Wizard;
