"use client";

// EP-33 template management. The list comes from the public catalogue (EP-06),
// which only returns ACTIVE templates, so the three seeded templates are known
// by id and kept in the list after they are switched off.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, Skeleton } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/client-api";

type TemplateItem = {
  id: string;
  name: string;
  description: string;
  supportedOccasions: string[];
  defaultPalette: { accent: string; colors: string[] };
};

type TemplateRow = TemplateItem & { isActive: boolean };

// The three templates that always exist (docs 04 SECTION 6).
const CATALOG: TemplateRow[] = [
  {
    id: "neon-night",
    name: "Neon Night",
    description: "Dark, glowing and playful.",
    supportedOccasions: [],
    defaultPalette: { accent: "#7C3AED", colors: [] },
    isActive: false,
  },
  {
    id: "pastel-dream",
    name: "Pastel Dream",
    description: "Soft, light and romantic.",
    supportedOccasions: [],
    defaultPalette: { accent: "#EC4899", colors: [] },
    isActive: false,
  },
  {
    id: "royal-gold",
    name: "Royal Gold",
    description: "Rich gold and deep jewel tones.",
    supportedOccasions: [],
    defaultPalette: { accent: "#FBBF24", colors: [] },
    isActive: false,
  },
];

// Fetched rows win, previously seen rows keep their details, and the catalogue
// guarantees all three templates stay listed so a switch can turn them back on.
function mergeTemplates(fetched: TemplateItem[], previous: TemplateRow[]): TemplateRow[] {
  const rows = new Map<string, TemplateRow>();
  for (const entry of CATALOG) rows.set(entry.id, { ...entry });
  for (const row of previous) rows.set(row.id, { ...row });
  for (const item of fetched) {
    const existing = rows.get(item.id);
    rows.set(item.id, {
      id: item.id,
      name: item.name || existing?.name || item.id,
      description: item.description || existing?.description || "",
      supportedOccasions: item.supportedOccasions ?? existing?.supportedOccasions ?? [],
      defaultPalette: item.defaultPalette ?? existing?.defaultPalette ?? { accent: "", colors: [] },
      isActive: true,
    });
  }
  const activeIds = new Set(fetched.map((f) => f.id));
  return [...rows.values()].map((row) => ({ ...row, isActive: activeIds.has(row.id) }));
}

export function TemplatesPanel() {
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [pending, setPending] = useState<{ row: TemplateRow; next: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ items: TemplateItem[] }>("/templates");
      setRows((previous) => mergeTemplates(data.items ?? [], previous));
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, version]);

  // EP-33: the template slug is the path segment.
  // Throwing keeps the ConfirmDialog open so the admin can retry.
  async function runPending() {
    if (!pending) return;
    setBusy(true);
    try {
      await api(`/admin/templates/${pending.row.id}`, {
        method: "PATCH",
        body: { isActive: pending.next },
      });
      toast.success(
        pending.next ? `${pending.row.name} activated.` : `${pending.row.name} deactivated.`,
      );
      setPending(null);
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Inactive templates disappear from the wizard and the public gallery.
      </p>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-5">
            <p className="text-sm text-ink">{error}</p>
            <Button variant="outline" onClick={() => setVersion((v) => v + 1)}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : loading && !loaded ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CATALOG.map((template) => (
            <Card key={template.id}>
              <CardContent className="flex flex-col gap-4 p-5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-11 w-[4.5rem] rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted">
            No templates found. Run the seed script.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-heading text-lg font-semibold text-ink">{row.name}</h3>
                    <span className="text-xs text-muted">{row.id}</span>
                  </div>
                  <Badge tone={row.isActive ? "live" : "disabled"}>
                    {row.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {row.description ? <p className="text-sm text-muted">{row.description}</p> : null}

                {row.defaultPalette.colors.length > 0 ? (
                  <div className="flex items-center gap-2">
                    {row.defaultPalette.colors.slice(0, 4).map((color) => (
                      <span
                        key={color}
                        aria-hidden
                        className="h-6 w-6 rounded-full border border-border"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                ) : null}

                <div className="flex min-h-11 items-center justify-between gap-3">
                  <span className="text-sm text-ink">
                    {row.isActive ? "Visible in the wizard" : "Hidden"}
                  </span>
                  <Switch
                    checked={row.isActive}
                    disabled={busy}
                    aria-label={`Toggle ${row.name}`}
                    onCheckedChange={(checked) => setPending({ row, next: checked })}
                    className="h-11 w-[4.5rem] [&>span]:h-9 [&>span]:w-9 [&>span]:data-[state=checked]:translate-x-8"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={
          pending?.next ? `Activate ${pending?.row.name}?` : `Deactivate ${pending?.row.name}?`
        }
        description={
          pending?.next
            ? "The template becomes selectable in the wizard again."
            : "Existing pages keep their template, but it can no longer be picked."
        }
        confirmLabel={pending?.next ? "Activate" : "Deactivate"}
        destructive={pending ? !pending.next : false}
        onConfirm={runPending}
      />
    </div>
  );
}
