"use client";

// Step 5 - Style (docs/03 P2-06): template cards from EP-06, accent colour, font,
// decoration chips and the extras (password, wishes wall, view count).
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/client-api";
import { DEFAULT_DECORATIONS } from "@/lib/occasion";
import { DECORATIONS } from "@/lib/validators";
import { useWizardData, FieldError } from "./Wizard";

const SWATCHES = [
  "#FF4FA3",
  "#7C3AED",
  "#22D3EE",
  "#FBBF24",
  "#10B981",
  "#F97316",
  "#EF4444",
  "#D4AF37",
];

const DECORATION_LABELS: Record<string, string> = {
  balloons: "Balloons",
  confetti: "Confetti",
  cake: "Cake",
  hearts: "Hearts",
  petals: "Petals",
  sparkles: "Sparkles",
  stars: "Stars",
};

type TemplateItem = {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  supportedOccasions: string[];
  defaultPalette: { accent: string; colors: string[] };
  fonts: string[];
};

export function StepStyle() {
  const { data, setData, update, errors, registerField } = useWizardData();
  const reduced = !!useReducedMotion();
  const [templates, setTemplates] = useState<TemplateItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hex, setHex] = useState(data.theme.accent);
  const [editingPassword, setEditingPassword] = useState(false);
  const pickedAccentRef = useRef(false);
  const decorationsSeededRef = useRef(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await api<{ items: TemplateItem[] }>("/templates");
      setTemplates(result.items ?? []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load the templates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  // Pre-select the occasion defaults the first time the creator sees this step.
  useEffect(() => {
    if (decorationsSeededRef.current) return;
    decorationsSeededRef.current = true;
    if (data.theme.decorations.length > 0) return;
    const defaults = DEFAULT_DECORATIONS[data.occasion ?? "CUSTOM"] ?? [];
    if (defaults.length) {
      setData((current) => ({ ...current, theme: { ...current.theme, decorations: defaults } }));
    }
  }, [data.occasion, data.theme.decorations.length, setData]);

  useEffect(() => {
    setHex(data.theme.accent);
  }, [data.theme.accent]);

  const chooseTemplate = (template: TemplateItem) => {
    const accent = template.defaultPalette?.accent ?? data.theme.accent;
    setData((current) => ({
      ...current,
      theme: {
        ...current.theme,
        templateId: template.id,
        // A custom accent the creator set by hand is never overwritten.
        accent: pickedAccentRef.current ? current.theme.accent : accent,
      },
    }));
  };

  const chooseAccent = (colour: string) => {
    pickedAccentRef.current = true;
    setHex(colour);
    setData((current) => ({ ...current, theme: { ...current.theme, accent: colour } }));
  };

  const toggleDecoration = (decoration: string) => {
    setData((current) => ({
      ...current,
      theme: {
        ...current.theme,
        decorations: current.theme.decorations.includes(decoration)
          ? current.theme.decorations.filter((item) => item !== decoration)
          : [...current.theme.decorations, decoration],
      },
    }));
  };

  // "Password is set" is shown for a stored password until the creator edits it.
  const passwordSet = data.settings.hasPassword && !editingPassword;

  const setPasswordProtection = (checked: boolean) => {
    setEditingPassword(false);
    setData((current) => ({
      ...current,
      settings: checked
        ? { ...current.settings, hasPassword: true, password: "" }
        : { ...current.settings, hasPassword: false, password: null },
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-normal tracking-tight text-ink sm:text-3xl">Make it look right</h2>
        <p className="mt-1 text-sm text-muted">Pick a template, then tune the colour and extras.</p>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Template</Label>
        {loading && (
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-[168px] w-full" />
            ))}
          </div>
        )}
        {!loading && loadError && (
          <div className="rounded-card border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{loadError}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => void loadTemplates()}
            >
              Retry
            </Button>
          </div>
        )}
        {!loading && !loadError && (
          <div role="radiogroup" aria-label="Template" className="grid gap-3 sm:grid-cols-3">
            {(templates ?? []).map((template, index) => {
              const active = data.theme.templateId === template.id;
              return (
                <motion.button
                  key={template.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  ref={index === 0 ? registerField("theme.templateId") : undefined}
                  onClick={() => chooseTemplate(template)}
                  whileTap={{ scale: 0.97 }}
                  animate={{ scale: active && !reduced ? 1.03 : 1 }}
                  transition={
                    reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 16 }
                  }
                  className={[
                    "relative flex min-h-[168px] flex-col items-start gap-3 rounded-card border p-4 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-border bg-white hover:bg-canvas",
                  ].join(" ")}
                >
                  <span className="font-heading text-base font-semibold text-ink">
                    {template.name}
                  </span>
                  <span className="text-xs leading-relaxed text-muted">{template.description}</span>
                  <span className="mt-auto flex items-center gap-1.5">
                    {(template.defaultPalette?.colors ?? []).slice(0, 4).map((colour) => (
                      <span
                        key={colour}
                        aria-hidden
                        className="h-5 w-5 rounded-full border border-border"
                        style={{ backgroundColor: colour }}
                      />
                    ))}
                  </span>
                  {active && (
                    <motion.span
                      initial={reduced ? { opacity: 0 } : { scale: 0, opacity: 0 }}
                      animate={reduced ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                      transition={
                        reduced
                          ? { duration: 0.2 }
                          : { type: "spring", stiffness: 260, damping: 16 }
                      }
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
        <FieldError message={errors["theme.templateId"]} />
      </div>

      <div className="flex flex-col gap-3">
        <Label>Accent colour</Label>
        <div className="flex flex-wrap items-center gap-2">
          {SWATCHES.map((colour) => {
            const active = data.theme.accent.toLowerCase() === colour.toLowerCase();
            return (
              <motion.button
                key={colour}
                type="button"
                aria-label={`Use ${colour}`}
                aria-pressed={active}
                onClick={() => chooseAccent(colour)}
                whileTap={{ scale: 0.97 }}
                animate={{ scale: active && !reduced ? 1.03 : 1 }}
                className={[
                  "flex h-11 w-11 items-center justify-center rounded-full border-2",
                  active ? "border-primary ring-2 ring-primary" : "border-border",
                ].join(" ")}
                style={{ backgroundColor: colour }}
              >
                {active && <Check className="h-4 w-4 text-white" aria-hidden />}
              </motion.button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Input
            aria-label="Hex colour"
            value={hex}
            maxLength={7}
            placeholder="#FF4FA3"
            ref={registerField("theme.accent")}
            onChange={(event) => {
              const value = event.target.value;
              setHex(value);
              if (/^#[0-9a-fA-F]{6}$/.test(value)) chooseAccent(value);
            }}
            className="max-w-[10rem]"
          />
          <span
            aria-hidden
            className="h-11 w-11 rounded-full border border-border"
            style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : data.theme.accent }}
          />
        </div>
        <FieldError message={errors["theme.accent"]} />
      </div>

      <div className="flex flex-col gap-3">
        <Label>Message font</Label>
        <div className="flex flex-wrap gap-2">
          {(["default", "handwriting"] as const).map((font) => {
            const active = data.theme.font === font;
            return (
              <motion.button
                key={font}
                type="button"
                aria-pressed={active}
                whileTap={{ scale: 0.97 }}
                animate={{ scale: active && !reduced ? 1.03 : 1 }}
                onClick={() =>
                  setData((current) => ({ ...current, theme: { ...current.theme, font } }))
                }
                className={[
                  "flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary/5 text-ink ring-2 ring-primary"
                    : "border-border bg-white text-ink hover:bg-canvas",
                ].join(" ")}
              >
                {font === "default" ? "Default" : "Handwriting"}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Decorations</Label>
        <div className="flex flex-wrap gap-2">
          {DECORATIONS.map((decoration) => {
            const active = data.theme.decorations.includes(decoration);
            return (
              <motion.button
                key={decoration}
                type="button"
                aria-pressed={active}
                whileTap={{ scale: 0.97 }}
                animate={{ scale: active && !reduced ? 1.03 : 1 }}
                onClick={() => toggleDecoration(decoration)}
                className={[
                  "flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary/5 text-ink ring-2 ring-primary"
                    : "border-border bg-white text-ink hover:bg-canvas",
                ].join(" ")}
              >
                {active && <Check className="h-4 w-4 text-primary" aria-hidden />}
                {DECORATION_LABELS[decoration] ?? decoration}
              </motion.button>
            );
          })}
        </div>
        <FieldError message={errors["theme.decorations"]} />
      </div>

      <div className="flex flex-col gap-4 rounded-card border border-border bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="passwordProtect" className="flex-1">
            Password protect this page
          </Label>
          <Switch
            id="passwordProtect"
            checked={!!data.settings.password || data.settings.hasPassword}
            onCheckedChange={setPasswordProtection}
          />
        </div>

        {passwordSet ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-ink">Password is set</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingPassword(true);
                setData((current) => ({
                  ...current,
                  settings: { ...current.settings, password: "" },
                }));
              }}
            >
              Change
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                setData((current) => ({
                  ...current,
                  settings: { ...current.settings, password: null, hasPassword: false },
                }))
              }
            >
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="pagePassword">Password</Label>
            <Input
              id="pagePassword"
              type="password"
              autoComplete="new-password"
              ref={registerField("settings.password")}
              value={data.settings.password ?? ""}
              maxLength={50}
              placeholder="4 to 50 characters"
              onChange={(event) => {
                const value = event.target.value;
                setData((current) => ({
                  ...current,
                  settings: {
                    ...current.settings,
                    // An emptied input means "remove the password" on the next save.
                    password: value === "" ? null : value,
                    hasPassword: true,
                  },
                }));
              }}
            />
            <p className="text-xs text-muted">
              Visitors need this password to open the page. It is saved securely and never shown
              again.
            </p>
            <FieldError message={errors["settings.password"]} />
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="wishesWall" className="flex-1">
            Let friends leave wishes
          </Label>
          <Switch
            id="wishesWall"
            checked={data.settings.wishesWall}
            onCheckedChange={(checked) =>
              update({ settings: { ...data.settings, wishesWall: checked } })
            }
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="showViews" className="flex-1">
            Show view count on the page
          </Label>
          <Switch
            id="showViews"
            checked={data.settings.showViews}
            onCheckedChange={(checked) =>
              update({ settings: { ...data.settings, showViews: checked } })
            }
          />
        </div>
      </div>
    </div>
  );
}

export default StepStyle;
