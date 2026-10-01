"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const STARTERS = [
  {
    label: "Heartfelt",
    message: "You make the ordinary days feel special. Here’s to more little adventures, big laughs, and memories with you.",
    closing: "With all my love",
  },
  {
    label: "Playful",
    message: "Life is better with you in it. Thanks for the questionable jokes, excellent snacks, and very good company.",
    closing: "Your partner in everything",
  },
  {
    label: "Short & sweet",
    message: "Just a little reminder: you are loved, you are appreciated, and I’m so glad you’re you.",
    closing: "Always in your corner",
  },
];

export function PersonalNoteStudio({ loggedIn = false }: { loggedIn?: boolean }) {
  const id = useId();
  const [name, setName] = useState("Riya");
  const [message, setMessage] = useState(STARTERS[0].message);
  const [tone, setTone] = useState(0);

  function chooseTone(index: number) {
    setTone(index);
    setMessage(STARTERS[index].message);
  }

  function reset() {
    setName("Riya");
    chooseTone(0);
  }

  return (
    <section className="note-studio container-page" aria-labelledby={`${id}-title`}>
      <div className="note-studio-intro">
        <p className="eyebrow">IT SOUNDS BETTER WHEN IT SOUNDS LIKE YOU</p>
        <h2 id={`${id}-title`}>The loveliest part?<br /><em>Your own words.</em></h2>
        <p>You don’t need to be a writer. Start with something true, add their name, and see how a few words can feel like a gift.</p>
      </div>
      <div className="note-studio-workspace">
        <div className="note-studio-controls">
          <div className="note-studio-step">
            <span aria-hidden>01</span>
            <div>
              <label htmlFor={`${id}-name`}>Who’s it for?</label>
              <input
                id={`${id}-name`}
                type="text"
                autoComplete="off"
                value={name}
                maxLength={30}
                onChange={(event) => setName(event.target.value)}
                aria-describedby={`${id}-hint`}
                placeholder="Their first name"
              />
            </div>
          </div>
          <div className="note-studio-step">
            <span aria-hidden>02</span>
            <fieldset>
              <legend>Find a starting point</legend>
              <div className="note-tone-buttons">
                {STARTERS.map((starter, index) => (
                  <button
                    type="button"
                    key={starter.label}
                    aria-pressed={tone === index}
                    onClick={() => chooseTone(index)}
                  >
                    {starter.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="note-studio-step">
            <span aria-hidden>03</span>
            <div>
              <label htmlFor={`${id}-message`}>Make the words your own</label>
              <textarea
                id={`${id}-message`}
                value={message}
                maxLength={220}
                rows={4}
                onChange={(event) => setMessage(event.target.value)}
                aria-describedby={`${id}-hint ${id}-count`}
              />
              <div className="note-studio-field-footer">
                <button type="button" onClick={reset}><RotateCcw size={12} aria-hidden /> Reset example</button>
                <span id={`${id}-count`}>{message.length} / 220</span>
              </div>
            </div>
          </div>
          <p id={`${id}-hint`} className="note-studio-hint">A little playground for your words. This example stays on this page and isn’t saved to an account.</p>
        </div>
        <div className="note-studio-preview">
          <span className="note-studio-preview-label"><span aria-hidden /> YOUR WORDS, BROUGHT TO LIFE</span>
          <article className="personal-note" aria-label="Your sample note preview">
            <div className="personal-note-top"><Sparkles size={20} strokeWidth={1.1} aria-hidden /><span>A LITTLE SOMETHING FOR YOU</span><span aria-hidden>✳</span></div>
            <h3>Dear {name.trim() || "you"},</h3>
            <p>{message.trim() || "Your lovely words will appear here."}</p>
            <span className="personal-note-closing">{STARTERS[tone].closing},</span>
            <Heart size={24} strokeWidth={1.1} aria-hidden />
          </article>
          <p className="note-studio-caption">Add your photos and memories when you create your own page.</p>
        </div>
      </div>
      <div className="note-studio-next">
        <p>That’s the beginning of something lovely.</p>
        <Button asChild><Link href={loggedIn ? "/create" : "/signup"}>Create your own page <ArrowRight size={16} aria-hidden /></Link></Button>
      </div>
    </section>
  );
}
