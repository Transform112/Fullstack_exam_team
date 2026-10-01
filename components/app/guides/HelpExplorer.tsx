"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { HELP_CATEGORIES, searchHelp, type HelpCategory } from "./help";

export function HelpExplorer() {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HelpCategory>("All questions");
  const articles = useMemo(() => searchHelp(query, category), [query, category]);
  function reset() { setQuery(""); setCategory("All questions"); }

  return (
    <section className="help-explorer" aria-label="Search help articles">
      <label className="help-search-label" htmlFor={searchId}>What would you like to know?</label>
      <div className="help-search"><Search size={20} aria-hidden /><input id={searchId} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try password, photos or sharing" />{query ? <button type="button" aria-label="Clear help search" onClick={() => setQuery("")}><X size={18} /></button> : null}</div>
      <div className="help-layout">
        <fieldset className="help-categories"><legend>Browse by topic</legend>{HELP_CATEGORIES.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}<ArrowRight size={14} aria-hidden /></button>)}</fieldset>
        <div>
          <div className="help-results-line"><p role="status" aria-live="polite">{articles.length} {articles.length === 1 ? "answer" : "answers"}{category !== "All questions" ? ` in ${category.toLowerCase()}` : " to help you along"}</p>{query || category !== "All questions" ? <button type="button" onClick={reset}>Reset search</button> : null}</div>
          {articles.length ? <div className="help-articles">{articles.map((article) => <details key={`${category}-${query}-${article.id}`} className="help-article"><summary>{article.question}<span aria-hidden>+</span></summary><div><p>{article.answer}</p>{article.detail ? <p>{article.detail}</p> : null}{article.link ? <Link href={article.link.href}>{article.link.label}<ArrowRight size={15} aria-hidden /></Link> : null}<span className="help-article-category">{article.category}</span></div></details>)}</div> : <div className="guide-help-empty"><h2>No exact match yet.</h2><p>Try one or two words, such as “save” or “music”, or broaden the topic to see more answers.</p><button type="button" onClick={reset}>Show all questions <ArrowRight size={16} aria-hidden /></button></div>}
        </div>
      </div>
    </section>
  );
}
