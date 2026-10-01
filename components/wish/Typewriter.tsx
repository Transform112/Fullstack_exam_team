"use client";

// Types a message grapheme by grapheme (docs/04 SECTION 5.4 REFERENCE). The untyped
// remainder is rendered invisibly so wrapping and line breaks never move, and the caret
// is an absolutely positioned overlay so it can never push a word onto another line.
// The caller owns the aria-label: every node rendered here is aria-hidden.
import { useEffect, useRef, useState } from "react";
import { splitGraphemes } from "@/lib/text";

type Props = {
  text: string;
  active: boolean;
  reduced: boolean;
  onDone?: () => void;
  caretColor: string;
};

export function Typewriter({ text, active, reduced, onDone, caretColor }: Props) {
  const chars = splitGraphemes(text);
  const [n, setN] = useState(reduced ? chars.length : 0);
  const done = useRef(false);
  // Kept in a ref so an unstable onDone prop cannot restart the typing timers.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (reduced) {
      setN(chars.length);
      return;
    }
    if (!active || n >= chars.length) return;
    const step = chars.length > 300 ? 2 : 1;
    const id = setTimeout(() => setN((v) => Math.min(chars.length, v + step)), 35);
    return () => clearTimeout(id);
  }, [active, n, chars.length, reduced]);

  useEffect(() => {
    if (n < chars.length) return;
    if (!reduced && !active) return;
    if (done.current) return;
    done.current = true;
    onDoneRef.current?.();
  }, [n, chars.length, reduced, active]);

  return (
    <span aria-hidden style={{ display: "block", position: "relative", whiteSpace: "pre-wrap" }}>
      {" "}
      <span>{chars.slice(0, n).join("")}</span>
      {!reduced && n < chars.length && active ? (
        <span
          className="wish-caret"
          style={{
            position: "absolute",
            bottom: "0.15em",
            width: 2,
            height: "1em",
            background: caretColor,
            pointerEvents: "none",
          }}
        />
      ) : null}
      <span style={{ opacity: 0 }}>{chars.slice(n).join("")}</span>
    </span>
  );
}
