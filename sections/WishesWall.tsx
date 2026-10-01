"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWish } from "@/components/wish/WishProvider";
import type { SectionProps } from "@/lib/wish-theme";
import type { PublicWish } from "@/lib/wish-types";
import { api } from "@/lib/client-api";

export function WishesWall({ data, tokens }: SectionProps) {
  const { t, mode } = useWish();
  const formId = useId();
  const [wishes, setWishes] = useState<PublicWish[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(mode === "live");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [version, setVersion] = useState(0);
  const endpoint = `/public/pages/${encodeURIComponent(data.slug)}/wishes`;

  useEffect(() => {
    if (mode === "preview") return;
    let active = true;
    setLoading(true);
    setError("");
    api<{ items: PublicWish[] }>(endpoint).then((result) => {
      if (active) setWishes(result.items);
    }).catch((err: unknown) => {
      if (active) setError(err instanceof Error ? err.message : t("wishes.error"));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint, mode, t, version]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "preview" || pending) return;
    setPending(true);
    setError("");
    setSuccess(false);
    try {
      const result = await api<{ wish: PublicWish }>(endpoint, { method: "POST", body: { name: name.trim(), message: message.trim() } });
      setWishes((items) => [result.wish, ...items.filter((item) => item.id !== result.wish.id)]);
      setMessage("");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("wishes.error"));
    } finally {
      setPending(false);
    }
  }

  const fieldStyle = { background: tokens.colors.bg, color: tokens.colors.text, borderColor: tokens.colors.muted };
  return (
    <section className="wish-section px-6 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-3xl sm:text-4xl" style={{ fontFamily: "var(--f-display)" }}>{t("wishes.title")}</h2>
        {mode === "preview" ? <p className="rounded-xl border border-current p-6 text-sm" style={{ color: tokens.colors.muted }}>{t("wishes.previewNote")}</p> : <>
          {loading ? <p role="status">{t("intro.loading")}</p> : null}
          {!loading && !error && !wishes.length ? <p className="mb-6 text-sm" style={{ color: tokens.colors.muted }}>{t("wishes.empty")}</p> : null}
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {wishes.map((wish) => <article key={wish.id} className="border p-5" style={{ background: tokens.colors.surface, borderColor: tokens.colors.muted, borderRadius: tokens.id === "pastel-dream" ? 20 : 4 }}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{wish.emoji} {wish.message}</p>
              <p className="mt-4 text-sm font-semibold" style={{ color: tokens.colors.primary }}>{wish.name}</p>
            </article>)}
          </div>
          <form onSubmit={submit} className="space-y-5 rounded-xl p-5 sm:p-8" style={{ background: tokens.colors.surface }}>
            <h3 className="text-2xl" style={{ fontFamily: "var(--f-display)" }}>{t("wishes.add")}</h3>
            <div><label htmlFor={`${formId}-name`} className="mb-2 block text-sm">{t("wishes.name")}</label><input id={`${formId}-name`} required maxLength={40} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="min-h-12 w-full rounded-lg border px-3" style={fieldStyle} /></div>
            <div><label htmlFor={`${formId}-message`} className="mb-2 block text-sm">{t("wishes.message")}</label><textarea id={`${formId}-message`} required maxLength={280} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} className="w-full resize-y rounded-lg border p-3" style={fieldStyle} /><p className="mt-1 text-right text-xs" style={{ color: tokens.colors.muted }}>{message.length}/280</p></div>
            {error ? <div role="alert" className="text-sm"><p>{error}</p><button type="button" onClick={() => setVersion((value) => value + 1)} className="mt-2 min-h-11 underline">{t("wishes.retry")}</button></div> : null}
            {success ? <p role="status" className="text-sm">{t("wishes.thanks")}</p> : null}
            <button type="submit" disabled={pending || !name.trim() || !message.trim()} className="min-h-12 rounded-lg border px-6 py-3 text-sm font-semibold disabled:opacity-50" style={{ borderColor: tokens.colors.primary }}>{pending ? t("wishes.sending") : t("wishes.send")}</button>
          </form>
        </>}
      </div>
    </section>
  );
}
