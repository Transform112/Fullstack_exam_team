// Text helpers for the generated pages.

type SegmenterCtor = new (
  l?: string,
  o?: { granularity: string },
) => { segment: (s: string) => Iterable<{ segment: string }> };

// Splits text into user-perceived characters. Safe for Devanagari, where a character
// split would break vowel signs and conjuncts.
export function splitGraphemes(s: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter;
  if (Seg) {
    return Array.from(new Seg(undefined, { granularity: "grapheme" }).segment(s), (x) => x.segment);
  }
  return Array.from(s);
}

// Deterministic random numbers from a string seed, so decorations are stable per page
// and identical on the server and the client.
export function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
