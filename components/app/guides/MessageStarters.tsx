"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { OccasionGuide } from "./occasions";

export function MessageStarters({ starters }: { starters: OccasionGuide["starters"] }) {
  const [copied, setCopied] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");

  async function copy(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(index);
      setFeedback("Starter copied. Add your own memory to make it yours.");
    } catch {
      setCopied(null);
      setFeedback("Copy is unavailable here. Select the message text to copy it manually.");
    }
  }

  return (
    <div className="guide-starters">
      {starters.map((starter, index) => (
        <article key={starter.label} className="guide-starter">
          <div className="guide-starter-top"><h3>{starter.label}</h3><button type="button" onClick={() => void copy(starter.text, index)} aria-label={`Copy ${starter.label.toLowerCase()} message starter`}>{copied === index ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}<span>{copied === index ? "Copied" : "Copy"}</span></button></div>
          <blockquote>{starter.text}</blockquote>
          <p>{starter.tip}</p>
        </article>
      ))}
      <p className="guide-copy-feedback" role="status" aria-live="polite">{feedback}</p>
    </div>
  );
}
