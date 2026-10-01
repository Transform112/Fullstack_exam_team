"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, SlidersHorizontal, X } from "lucide-react";
import { TemplateCard, type TemplateCardData } from "./TemplatePreviewDialog";

const MOODS = ["All designs", "Playful", "Soft", "Elegant"] as const;
type Mood = (typeof MOODS)[number];
type Sort = "featured" | "name";

const NOTES: Record<string, { mood: Mood; occasions: string; detail: string }> = {
  "neon-night": {
    mood: "Playful",
    occasions: "Birthdays · Friendship · Congratulations",
    detail: "Bright accents, oversized greetings and a midnight backdrop. Bring the inside jokes and the big personality.",
  },
  "pastel-dream": {
    mood: "Soft",
    occasions: "Birthdays · Friendship · Just because",
    detail: "Gentle colours, personal notes and a scrapbook feel. Let the small memories have their moment.",
  },
  "royal-gold": {
    mood: "Elegant",
    occasions: "Anniversaries · Weddings · Farewells",
    detail: "A framed greeting, rich tones and gold details. Give a meaningful milestone a little room to shine.",
  },
};

export function TemplateExplorer({ templates }: { templates: TemplateCardData[] }) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [mood, setMood] = useState<Mood>("All designs");
  const [sort, setSort] = useState<Sort>("featured");

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = templates.filter((template) => {
      const note = NOTES[template.id];
      const haystack = `${template.name} ${template.description} ${note?.occasions ?? ""} ${note?.mood ?? ""}`.toLowerCase();
      return (!normalized || haystack.includes(normalized)) && (mood === "All designs" || note?.mood === mood);
    });
    return sort === "name" ? [...result].sort((a, b) => a.name.localeCompare(b.name)) : result;
  }, [templates, query, mood, sort]);

  function reset() {
    setQuery("");
    setMood("All designs");
    setSort("featured");
  }

  return (
    <section className="template-discovery" aria-label="Explore templates">
      <div className="discovery-toolbar">
        <div className="discovery-search">
          <label htmlFor={searchId}>Find a feeling</label>
          <div className="discovery-search-field">
            <Search size={18} aria-hidden />
            <input id={searchId} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try birthday, soft or gold" />
            {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear template search"><X size={16} /></button> : null}
          </div>
        </div>
        <div className="discovery-sort">
          <label htmlFor={`${searchId}-sort`}><SlidersHorizontal size={14} aria-hidden /> Sort designs</label>
          <select id={`${searchId}-sort`} value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
            <option value="featured">Collection order</option>
            <option value="name">Name: A to Z</option>
          </select>
        </div>
      </div>

      <fieldset className="discovery-moods">
        <legend>Choose a mood</legend>
        <div>
          {MOODS.map((option) => <button key={option} type="button" aria-pressed={mood === option} onClick={() => setMood(option)}>{option}</button>)}
        </div>
      </fieldset>

      <div className="discovery-results-line">
        <p role="status" aria-live="polite">{visible.length} {visible.length === 1 ? "design" : "designs"}{mood !== "All designs" ? ` · ${mood.toLowerCase()} mood` : " in the collection"}</p>
        {query || mood !== "All designs" || sort !== "featured" ? <button type="button" onClick={reset}>Reset filters</button> : <span>Preview before you choose</span>}
      </div>

      {visible.length ? <div className="template-grid discovery-grid">
        {visible.map((template) => <div key={template.id}>
          <TemplateCard template={template} />
          <div className="discovery-design-note">
            <p className="discovery-occasion-label">{NOTES[template.id]?.occasions ?? "For your next celebration"}</p>
            <p>{NOTES[template.id]?.detail ?? template.description}</p>
          </div>
        </div>)}
      </div> : <div className="discovery-empty">
        <Search size={28} strokeWidth={1.3} aria-hidden />
        <h2>No designs found, just yet.</h2>
        <p>Try a shorter search, another mood, or see the whole collection. Any design can work for any occasion.</p>
        <button type="button" onClick={reset}>Show all designs <ArrowRight size={16} aria-hidden /></button>
      </div>}

      <aside className="discovery-advice">
        <div><p className="eyebrow">A SMALL DESIGN NOTE</p><h2>Start with the person.</h2></div>
        <div><p>The occasion gives you a starting point. Their personality makes the choice: bright and lively, soft and sentimental, or quietly elegant. You can change the style in the creator before publishing.</p><Link href="/occasions">Find ideas for your occasion <ArrowRight size={16} aria-hidden /></Link></div>
      </aside>
    </section>
  );
}
