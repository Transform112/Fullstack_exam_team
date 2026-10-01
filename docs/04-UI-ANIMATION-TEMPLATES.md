# 04 - UI, ANIMATION, TEMPLATES AND I18N RECIPES

Project: Wishly
Prerequisite: read file 01 and finish file 02 foundation (AR-01 to AR-14). Phase 1 and 2 of file 03 are done before building the Phase 3 recipes here. SECTION 7 preview and wizard recipes are used during Phase 2. Product acceptance checkpoints are not entry gates.

This file defines HOW THE GENERATED WISH PAGE LOOKS AND MOVES. It is the visual contract for file 03 Phase 3 (steps P3-01 to P3-18), the lock screen and wishes wall steps of Phase 4, the landing page step of Phase 4, and the mobile and performance passes. It is worth 25 marks directly (generated page) plus 12 (templates) and feeds PERF-1.

All rules from file 01 SECTION 0 apply. Additional rules for this file:

1. Recipes are exact. Where a number is given (duration, offset, count, colour), use that number. Do not tune by taste.
2. REFERENCE blocks are starting points. Validate against the surrounding access, accessibility, lifecycle and reduced-motion rules; fix runtime defects rather than preserving sample behaviour.
3. If file 03 and this file disagree, file 03 decides step order and file names; this file decides visual detail.
4. Every recipe ends with a UI checkpoint. A UI checkpoint is marked together with the file 03 step that builds it, only after the VERIFY line here passes.
5. Do not add libraries. Everything here uses the libraries already installed in file 02 SECTION 1 (framer-motion, lenis, canvas-confetti, lucide-react, date-fns, sonner).
6. Never use emoji characters inside source files you write from this document. Where an emoji is needed in the product UI (the wish emoji presets), use the unicode escape sequence given.

---

## SECTION 0. WHICH RECIPE IS BUILT IN WHICH STEP

- P3-01: SECTION 2 (i18n), SECTION 3 (tokens, fonts, motion helpers), SECTION 4 (WishProvider extras, scroll, music, smooth scroll)
- P3-03: SECTION 5.2 Intro recipe
- P3-04: SECTION 5.3 Hero recipe
- P3-05: SECTION 5.4 Message recipe
- P3-06: SECTION 5.5 Timeline recipe
- P3-07: SECTION 5.6 Gallery recipe
- P3-08: SECTION 5.7 Video recipe
- P3-09: SECTION 5.9 Finale recipe
- P3-10: SECTION 5.10 Global elements recipe
- P3-11, P3-12, P3-13: SECTION 6 (three templates)
- P3-14: SECTION 5.11 Decorations recipe
- P3-15: SECTION 2 audit
- P3-16: SECTION 7.3 sample data
- P3-17: SECTION 9 mobile rules
- P3-18: SECTION 5 edge cases
- P4-05, P4-06: SECTION 5.1 Lock screen recipe
- P4-08: SECTION 5.8 Wishes wall recipe
- P4-13: SECTION 8 Landing page recipe
- P4-14: designed 404, unavailable screen, error boundaries and loading states from file 03
- P2-07 and P2-09: SECTION 7 (live preview frame, wizard micro-interactions); the real renderer replaces the preview stub in P3-16
- Phase 5: SECTION 10 (performance and reduced motion)

CHECKPOINT UI-00: file read completely before P3-01.
- [ ] Done
- VERIFY: the agent can list the 11 recipes of SECTION 5 and the 3 templates of SECTION 6 by name.

---

## SECTION 1. DESIGN PRINCIPLES (APPLY TO EVERY RECIPE)

1. One focal animation per screen. At any scroll position exactly one element is the star; everything else is quiet. Do not animate everything at once.
2. Animate ONLY transform and opacity. Never animate width, height, top, left, margin, box-shadow, filter or background. A glow is a pre-blurred element whose opacity is animated.
3. Easing: EASE = cubic-bezier(0.22, 1, 0.36, 1) for entrances; spring { stiffness 120, damping 18 } for playful pops. Durations between 0.4 and 1.2 seconds. Stagger between 0.06 and 0.12 seconds.
4. Entrances use whileInView with viewport { once: true, amount: 0.3 } so they run once and never replay while scrolling back.
5. Ambient loops (floating balloons, twinkling stars, flame flicker) are CSS keyframes in app/w/[slug]/wish.css, not Framer Motion. Scroll-linked and entrance motion uses Framer Motion.
6. Reduced motion: when the OS requests it, every section falls back to a 0.3 second opacity fade only. The exact fallback is listed in each recipe and summarised in SECTION 10.
7. Layout stability: every image and video reserves its space with aspect-ratio taken from its w and h. No layout shift when media loads.
8. Everything user-provided is rendered as React text (escaped). Never use dangerouslySetInnerHTML.
9. Each template must differ in layout, palette, fonts AND animation set. Colour swaps alone are not acceptable (file 01 SECTION 12).
10. Fixed-position UI (music toggle, scroll progress, lightbox close) respects safe-area insets: padding with env(safe-area-inset-top|bottom|left|right).

---

## SECTION 2. I18N RECIPE

Languages: ENGLISH (en.json), HINGLISH (hinglish.json), HINDI (hi.json). Keys are FLAT dotted strings (not nested objects). Variables use {name} style placeholders.

### 2.1 lib/i18n.ts (REFERENCE)

    import en from "@/locales/en.json";
    import hinglish from "@/locales/hinglish.json";
    import hi from "@/locales/hi.json";

    export type Lang = "ENGLISH" | "HINGLISH" | "HINDI";
    const dicts: Record<Lang, Record<string, string>> = { ENGLISH: en, HINGLISH: hinglish, HINDI: hi };

    // Returns the string for the language, falls back to English, then to the key itself.
    export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
      const raw = dicts[lang]?.[key] ?? dicts.ENGLISH[key] ?? key;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
    }

    // Name shown in greetings: nickname if present, else name.
    export function displayName(d: { recipient: { name: string; nickname?: string } }) {
      return d.recipient.nickname?.trim() || d.recipient.name;
    }

    // Locale for date formatting.
    export const dateLocale = (lang: Lang) => (lang === "HINDI" ? "hi-IN" : "en-IN");

The WishProvider exposes t(key, vars) = translate(language, key, vars). The lock screen and password gate do not know the page language (the locked payload contains only recipientFirstName and revealAt), so they call translate("ENGLISH", ...) directly. Record this in docs/DECISIONS.md.

### 2.2 Key rules

- Greeting keys are per occasion: hero.greeting.<OCCASION> and hero.sub.<OCCASION> for BIRTHDAY, ANNIVERSARY, WEDDING, FAREWELL, CONGRATS, FRIENDSHIP, CUSTOM. CUSTOM uses the variable {label} (customOccasionLabel, or "Surprise" if empty).
- The recipient name is NOT inside the greeting string. It is rendered separately as the giant animated name (Hero recipe), so layout works at 360px.
- Every visible string, aria-label and placeholder in templates and sections comes from t(). Brand name "Wishly" is the only allowed hard-coded word.

### 2.3 locales/en.json (REFERENCE, create exactly)

    {
      "hero.greeting.BIRTHDAY": "Happy Birthday",
      "hero.greeting.ANNIVERSARY": "Happy Anniversary",
      "hero.greeting.WEDDING": "Congratulations on your wedding",
      "hero.greeting.FAREWELL": "Farewell",
      "hero.greeting.CONGRATS": "Congratulations",
      "hero.greeting.FRIENDSHIP": "Happy Friendship Day",
      "hero.greeting.CUSTOM": "{label}",
      "hero.sub.BIRTHDAY": "Today is all about you",
      "hero.sub.ANNIVERSARY": "To every moment we shared",
      "hero.sub.WEDDING": "Wishing you a lifetime of happiness",
      "hero.sub.FAREWELL": "Your memories stay with us",
      "hero.sub.CONGRATS": "You did it",
      "hero.sub.FRIENDSHIP": "A little gift for a great friend",
      "hero.sub.CUSTOM": "Made just for you",
      "hero.scroll": "Scroll down",
      "intro.for": "A surprise for {name}",
      "intro.loading": "Getting things ready...",
      "intro.tap": "Tap to begin",
      "message.title": "A few words for you",
      "message.signature": "- {from}",
      "timeline.title": "Our memories",
      "gallery.title": "Moments",
      "gallery.close": "Close",
      "gallery.prev": "Previous photo",
      "gallery.next": "Next photo",
      "video.title": "A little video for you",
      "video.unmute": "Tap to unmute",
      "video.mute": "Tap to mute",
      "video.play": "Play video",
      "wishes.title": "Wishes from your people",
      "wishes.add": "Leave a wish",
      "wishes.name": "Your name",
      "wishes.message": "Your wish",
      "wishes.send": "Send wish",
      "wishes.sending": "Sending...",
      "wishes.thanks": "Thank you! Your wish is on the wall.",
      "wishes.empty": "Be the first to leave a wish.",
      "wishes.more": "Show more",
      "wishes.limit": "You have reached the wish limit. Try again later.",
      "wishes.profanity": "Please keep wishes kind",
      "wishes.error": "Could not send your wish. Please try again.",
      "wishes.previewNote": "Wishes appear here",
      "finale.title": "One last surprise",
      "finale.tap": "Tap the candles to blow them out",
      "finale.wish": "Make a wish...",
      "finale.closing": "Hope this made you smile, {name}.",
      "finale.signature": "With love, {from}",
      "finale.replay": "Replay",
      "finale.share": "Share",
      "finale.copied": "Link copied",
      "music.on": "Turn music off",
      "music.off": "Turn music on",
      "footer.made": "Made with love on Wishly",
      "footer.cta": "Create your own surprise",
      "footer.views": "{n} views",
      "lock.teaser": "Something special is coming for {name}...",
      "lock.opens": "Opens on {date}",
      "lock.days": "Days",
      "lock.hours": "Hours",
      "lock.minutes": "Minutes",
      "lock.seconds": "Seconds",
      "lock.password.title": "This surprise is protected",
      "lock.password.hint": "Enter the password to open it",
      "lock.password.input": "Password",
      "lock.password.button": "Unlock",
      "lock.password.wrong": "Wrong password, try again",
      "lock.password.limit": "Too many tries. Please wait a few minutes."
    }

### 2.4 locales/hinglish.json (REFERENCE, create exactly)

    {
      "hero.greeting.BIRTHDAY": "Happy Birthday",
      "hero.greeting.ANNIVERSARY": "Happy Anniversary",
      "hero.greeting.WEDDING": "Shaadi mubarak",
      "hero.greeting.FAREWELL": "Alvida nahi, phir milenge",
      "hero.greeting.CONGRATS": "Congratulations",
      "hero.greeting.FRIENDSHIP": "Happy Friendship Day",
      "hero.greeting.CUSTOM": "{label}",
      "hero.sub.BIRTHDAY": "tu toh star hai!",
      "hero.sub.ANNIVERSARY": "tum dono ki jodi sabse best hai",
      "hero.sub.WEDDING": "naya safar, dher saari khushiyan",
      "hero.sub.FAREWELL": "teri yaadein hamesha saath rahengi",
      "hero.sub.CONGRATS": "tune kar dikhaya!",
      "hero.sub.FRIENDSHIP": "tu hai toh sab hai",
      "hero.sub.CUSTOM": "sirf tere liye",
      "hero.scroll": "Neeche scroll karo",
      "intro.for": "{name} ke liye ek surprise",
      "intro.loading": "Sab kuch ready ho raha hai...",
      "intro.tap": "Tap karo, surprise hai!",
      "message.title": "Kuch baatein tere liye",
      "message.signature": "- {from}",
      "timeline.title": "Apni yaadein",
      "gallery.title": "Yaadgaar pal",
      "gallery.close": "Band karo",
      "gallery.prev": "Pichli photo",
      "gallery.next": "Agli photo",
      "video.title": "Ek chhota sa video",
      "video.unmute": "Awaaz on karne ke liye tap karo",
      "video.mute": "Awaaz band karne ke liye tap karo",
      "video.play": "Video chalao",
      "wishes.title": "Tere logon ki wishes",
      "wishes.add": "Apni wish likho",
      "wishes.name": "Tumhara naam",
      "wishes.message": "Tumhari wish",
      "wishes.send": "Wish bhejo",
      "wishes.sending": "Bhej rahe hain...",
      "wishes.thanks": "Shukriya! Tumhari wish wall par lag gayi.",
      "wishes.empty": "Sabse pehli wish tum likho.",
      "wishes.more": "Aur dikhao",
      "wishes.limit": "Wish ki limit khatam ho gayi. Baad mein try karo.",
      "wishes.profanity": "Please wishes pyaar se likho",
      "wishes.error": "Wish nahi bhej paye. Dobara try karo.",
      "wishes.previewNote": "Wishes yahan dikhengi",
      "finale.title": "Ek last surprise",
      "finale.tap": "Candles par tap karke bujha do",
      "finale.wish": "Ek wish maang lo...",
      "finale.closing": "Umeed hai tujhe smile aayi, {name}.",
      "finale.signature": "Pyaar se, {from}",
      "finale.replay": "Phir se dekho",
      "finale.share": "Share karo",
      "finale.copied": "Link copy ho gaya",
      "music.on": "Music band karo",
      "music.off": "Music chalao",
      "footer.made": "Wishly par pyaar se banaya",
      "footer.cta": "Apna surprise banao",
      "footer.views": "{n} views",
      "lock.teaser": "{name} ke liye kuch khaas aa raha hai...",
      "lock.opens": "{date} ko khulega",
      "lock.days": "Din",
      "lock.hours": "Ghante",
      "lock.minutes": "Minute",
      "lock.seconds": "Second",
      "lock.password.title": "Ye surprise protected hai",
      "lock.password.hint": "Kholne ke liye password daalo",
      "lock.password.input": "Password",
      "lock.password.button": "Kholo",
      "lock.password.wrong": "Galat password, dobara try karo",
      "lock.password.limit": "Bahut zyada koshishein. Kuch minute ruko."
    }

### 2.5 locales/hi.json (REFERENCE, create exactly, UTF-8)

    {
      "hero.greeting.BIRTHDAY": "जन्मदिन की हार्दिक शुभकामनाएं",
      "hero.greeting.ANNIVERSARY": "सालगिरह मुबारक",
      "hero.greeting.WEDDING": "शादी की हार्दिक बधाई",
      "hero.greeting.FAREWELL": "अलविदा नहीं, फिर मिलेंगे",
      "hero.greeting.CONGRATS": "बहुत-बहुत बधाई",
      "hero.greeting.FRIENDSHIP": "फ्रेंडशिप डे मुबारक",
      "hero.greeting.CUSTOM": "{label}",
      "hero.sub.BIRTHDAY": "आज का दिन सिर्फ़ तुम्हारा है",
      "hero.sub.ANNIVERSARY": "साथ बिताए हर पल के नाम",
      "hero.sub.WEDDING": "नई ज़िंदगी की ढेर सारी शुभकामनाएं",
      "hero.sub.FAREWELL": "तुम्हारी यादें हमेशा हमारे साथ रहेंगी",
      "hero.sub.CONGRATS": "तुमने कर दिखाया",
      "hero.sub.FRIENDSHIP": "दोस्ती के नाम एक छोटा सा तोहफ़ा",
      "hero.sub.CUSTOM": "सिर्फ़ तुम्हारे लिए",
      "hero.scroll": "नीचे स्क्रॉल करें",
      "intro.for": "{name} के लिए एक सरप्राइज़",
      "intro.loading": "सब कुछ तैयार हो रहा है...",
      "intro.tap": "शुरू करने के लिए टैप करें",
      "message.title": "तुम्हारे लिए कुछ बातें",
      "message.signature": "- {from}",
      "timeline.title": "हमारी यादें",
      "gallery.title": "यादगार पल",
      "gallery.close": "बंद करें",
      "gallery.prev": "पिछली फ़ोटो",
      "gallery.next": "अगली फ़ोटो",
      "video.title": "एक छोटा सा वीडियो",
      "video.unmute": "आवाज़ के लिए टैप करें",
      "video.mute": "आवाज़ बंद करने के लिए टैप करें",
      "video.play": "वीडियो चलाएं",
      "wishes.title": "आपके अपनों की शुभकामनाएं",
      "wishes.add": "अपनी शुभकामना लिखें",
      "wishes.name": "आपका नाम",
      "wishes.message": "आपकी शुभकामना",
      "wishes.send": "भेजें",
      "wishes.sending": "भेज रहे हैं...",
      "wishes.thanks": "शुक्रिया! आपकी शुभकामना दीवार पर लग गई।",
      "wishes.empty": "सबसे पहली शुभकामना आप लिखें।",
      "wishes.more": "और दिखाएं",
      "wishes.limit": "शुभकामना की सीमा पूरी हो गई। बाद में कोशिश करें।",
      "wishes.profanity": "कृपया प्यार से लिखें",
      "wishes.error": "शुभकामना नहीं भेज पाए। फिर से कोशिश करें।",
      "wishes.previewNote": "शुभकामनाएं यहां दिखेंगी",
      "finale.title": "एक आखिरी सरप्राइज़",
      "finale.tap": "मोमबत्तियां बुझाने के लिए टैप करें",
      "finale.wish": "कोई मन्नत मांग लो...",
      "finale.closing": "उम्मीद है तुम्हें मुस्कुराहट मिली, {name}।",
      "finale.signature": "प्यार के साथ, {from}",
      "finale.replay": "फिर से देखें",
      "finale.share": "शेयर करें",
      "finale.copied": "लिंक कॉपी हो गया",
      "music.on": "संगीत बंद करें",
      "music.off": "संगीत चालू करें",
      "footer.made": "Wishly पर प्यार से बनाया गया",
      "footer.cta": "अपना सरप्राइज़ बनाएं",
      "footer.views": "{n} बार देखा गया",
      "lock.teaser": "{name} के लिए कुछ खास आ रहा है...",
      "lock.opens": "{date} को खुलेगा",
      "lock.days": "दिन",
      "lock.hours": "घंटे",
      "lock.minutes": "मिनट",
      "lock.seconds": "सेकंड",
      "lock.password.title": "यह सरप्राइज़ सुरक्षित है",
      "lock.password.hint": "खोलने के लिए पासवर्ड डालें",
      "lock.password.input": "पासवर्ड",
      "lock.password.button": "खोलें",
      "lock.password.wrong": "गलत पासवर्ड, फिर से कोशिश करें",
      "lock.password.limit": "बहुत ज़्यादा कोशिशें। कुछ मिनट रुकें।"
    }

Rule: the three files must contain exactly the same set of keys. Add any key you introduce later to all three.

### 2.6 lib/text.ts (REFERENCE)

Letters of a name or message must be split by grapheme, not by character, otherwise Devanagari vowel signs and conjuncts break apart.

    type SegmenterCtor = new (l?: string, o?: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> };

    // Splits text into user-perceived characters. Safe for Devanagari.
    export function splitGraphemes(s: string): string[] {
      const Seg = (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter;
      if (Seg) return Array.from(new Seg(undefined, { granularity: "grapheme" }).segment(s), (x) => x.segment);
      return Array.from(s);
    }

    // Deterministic random numbers from a string seed (used so decorations are stable per page).
    export function seededRandom(seed: string) {
      let h = 2166136261;
      for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
      let a = h >>> 0;
      return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

### 2.7 Devanagari rules

- On HINDI pages the root element gets lang="hi" and ALL text uses the Devanagari font (Noto Sans Devanagari) except handwriting text, which uses Kalam (supports Devanagari).
- On ENGLISH and HINGLISH pages every font stack ends with the Devanagari font so a Hindi recipient name renders correctly.
- Devanagari text: line-height at least 1.5, letter-spacing normal (never tracking), no text-transform uppercase.

CHECKPOINT UI-01: i18n recipe implemented in P3-01 and audited in P3-15.
- [ ] Done
- VERIFY: the three json files have identical key sets (run a small node one-liner comparing Object.keys); /w/meera-birthday-9p1x?lang=ENGLISH renders the Devanagari name correctly; ?lang=HINDI shows no glyph boxes; grep for quoted English sentences in templates/ and sections/ finds only the brand name.

---

## SECTION 3. TOKENS, FONTS AND MOTION HELPERS

### 3.1 lib/wish-fonts.ts (REFERENCE)

    import { Space_Grotesk, Fredoka, Quicksand, Caveat, Kalam, Playfair_Display, Cormorant, Noto_Sans_Devanagari } from "next/font/google";

    export const fSpace = Space_Grotesk({ subsets: ["latin"], variable: "--font-space", display: "swap" });
    export const fFredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", display: "swap" });
    export const fQuicksand = Quicksand({ subsets: ["latin"], variable: "--font-quicksand", display: "swap" });
    export const fCaveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });
    export const fKalam = Kalam({ subsets: ["devanagari", "latin"], weight: ["400", "700"], variable: "--font-kalam", display: "swap" });
    export const fPlayfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
    export const fCormorant = Cormorant({ subsets: ["latin"], variable: "--font-cormorant", display: "swap" });
    export const fDevanagari = Noto_Sans_Devanagari({ subsets: ["devanagari", "latin"], variable: "--font-devanagari", display: "swap" });

    // All CSS variable classes joined; WishRenderer puts this on its root element.
    export const wishFontClasses = [fSpace, fFredoka, fQuicksand, fCaveat, fKalam, fPlayfair, fCormorant, fDevanagari]
      .map((f) => f.variable).join(" ");

Note: Clash Display is not on Google Fonts, so Neon Night uses Space Grotesk for display and body. Record in docs/DECISIONS.md.

### 3.2 lib/wish-theme.ts (REFERENCE)

    export type TemplateId = "neon-night" | "pastel-dream" | "royal-gold";

    export type ThemeTokens = {
      id: TemplateId;
      // accentMode "primary": data.theme.accent replaces colors.primary. "highlight": accent replaces colors.highlight and primary stays fixed.
      accentMode: "primary" | "highlight";
      colors: {
        bg: string; bgAlt: string; surface: string; text: string; muted: string;
        primary: string; secondary: string; tertiary: string; highlight: string;
      };
      fonts: { display: string; body: string; hand: string };   // CSS font-family stacks
      decorColors: string[];                                      // used by the Decorations layer
      variants: {
        intro: "glitch" | "balloons" | "envelope";
        hero: "starfield" | "bokeh" | "gold-frame";
        message: "typewriter" | "word-fade";
        timeline: "center-line" | "doodle-path" | "gold-medallion";
        gallery: "masonry" | "polaroid" | "carousel3d";
        wishes: "glass" | "sticky" | "ivory";
        finale: "neon" | "pastel" | "gold";
      };
    };

    // Returns a copy of the tokens with the creator's accent colour applied.
    export function withAccent(t: ThemeTokens, accent: string): ThemeTokens {
      const colors = { ...t.colors };
      if (t.accentMode === "primary") colors.primary = accent;
      else colors.highlight = accent;
      return { ...t, colors };
    }

    export type SectionProps = { data: import("./wish-types").WishPageData; tokens: ThemeTokens };

Font stacks are written once per template in its theme.ts and always end with `var(--font-devanagari), sans-serif`.

### 3.3 lib/motion.ts (REFERENCE)

    export const EASE = [0.22, 1, 0.36, 1] as const;
    export const SPRING = { type: "spring", stiffness: 120, damping: 18 } as const;
    export const SPRING_POP = { type: "spring", stiffness: 260, damping: 16 } as const;
    export const STAGGER = 0.08;
    export const VIEWPORT = { once: true, amount: 0.3 } as const;

    // Standard entrance: fade and rise 24px. When reduced is true it is a plain 0.3s fade.
    export function rise(reduced: boolean, delay = 0) {
      return reduced
        ? { initial: { opacity: 0 }, whileInView: { opacity: 1 }, transition: { duration: 0.3, delay } }
        : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.8, ease: EASE, delay } };
    }

### 3.4 lib/wish-media.ts (REFERENCE)

    import { cld } from "./cloudinary-url";

    export type WishMedia = { id: string; type: "image" | "video"; url: string; w: number; h: number; duration: number | null; caption: string; order: number };

    // Responsive image URL. Example: img(m, 600) -> .../upload/w_600,f_auto,q_auto/...
    export const img = (m: Pick<WishMedia, "url">, width: number) => cld(m.url, `w_${width},f_auto,q_auto`);
    // Video poster frame at second 0 as a jpg.
    export const poster = (url: string) => cld(url, "so_0,w_800,f_jpg,q_auto").replace(/\.\w+$/, ".jpg");
    // Compressed video delivery.
    export const videoSrc = (url: string) => cld(url, "w_720,f_auto,q_auto");
    // Aspect ratio clamped between 4/5 and 5/4 so extreme images do not break layouts (the real image uses object-fit cover).
    export const ratio = (m: Pick<WishMedia, "w" | "h">) => Math.min(1.25, Math.max(0.8, (m.w || 1080) / (m.h || 1350)));
    export const imagesOf = (media: WishMedia[]) => media.filter((m) => m.type === "image").sort((a, b) => a.order - b.order);
    export const videosOf = (media: WishMedia[]) => media.filter((m) => m.type === "video").sort((a, b) => a.order - b.order);

Use plain img elements (not next/image) for Cloudinary media, with width and height attributes, loading="lazy", decoding="async". Add `/* eslint-disable @next/next/no-img-element */` at the top of files that do. Record in docs/DECISIONS.md.

### 3.5 app/w/[slug]/wish.css (REFERENCE, imported once by WishRenderer)

    .wish-root { overflow-x: clip; min-height: var(--wish-vh, 100svh); font-family: var(--f-body); }
    .wish-root[lang="hi"] * { letter-spacing: normal !important; text-transform: none !important; }
    .wish-layer { will-change: transform; }
    @keyframes wish-rise   { from { transform: translate3d(0, 110vh, 0); } to { transform: translate3d(0, -30vh, 0); } }
    @keyframes wish-fall   { from { transform: translate3d(0, -10vh, 0) rotate(0deg); } to { transform: translate3d(0, 110vh, 0) rotate(360deg); } }
    @keyframes wish-sway   { 0%,100% { transform: translate3d(-12px, 0, 0); } 50% { transform: translate3d(12px, 0, 0); } }
    @keyframes wish-twinkle{ 0%,100% { opacity: 0.15; transform: scale(0.7); } 50% { opacity: 1; transform: scale(1.1); } }
    @keyframes wish-bob    { 0%,100% { transform: translate3d(0, -6px, 0); } 50% { transform: translate3d(0, 6px, 0); } }
    @keyframes wish-drift  { 0%,100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(30px, -20px, 0); } }
    @keyframes wish-flicker{ 0%,100% { transform: scaleY(1) scaleX(1); opacity: 1; } 50% { transform: scaleY(1.15) scaleX(0.92); opacity: 0.85; } }
    @keyframes wish-pulse  { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes wish-shake  { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-8px); } 40%,80% { transform: translateX(8px); } }
    @keyframes wish-shimmer{ from { transform: translateX(-120%); } to { transform: translateX(120%); } }
    @media (prefers-reduced-motion: reduce) {
      .wish-root *, .wish-root *::before, .wish-root *::after { animation: none !important; transition-duration: 0.01ms !important; }
    }

Ambient elements set per-element CSS variables inline: animation-duration, animation-delay, left, and a --s scale. They only use the keyframes above.

CHECKPOINT UI-02: tokens, fonts, motion helpers, media helpers and wish.css created in P3-01.
- [ ] Done
- VERIFY: a throwaway page renders text in Space Grotesk, Fredoka, Playfair Display and Noto Sans Devanagari with no layout flash; npm run build passes.

---

## SECTION 4. SHARED RUNTIME (EXTENDS P3-01)

The WishProvider from file 03 P3-01 must additionally expose:

- displayName: string (nickname or name)
- scrollRef: RefObject<HTMLElement | null> | undefined. In mode "live" it is undefined (the window scrolls). In mode "preview" it is the ref of the preview scroll container (overflow-y auto) so scroll-linked animations track the right element.
- lenisRef: a ref holding the Lenis instance (or null).
- start(): called by the Intro tap. It sets started = true, starts music, requests gyro permission, and starts Lenis.
- gyro: { x: MotionValue<number>; y: MotionValue<number> } fed by device orientation after permission (otherwise stays 0).
- colors and fonts are NOT in the provider; they come from tokens.

In mode "preview": started is true from the beginning; music, Lenis, gyro and pointer tilt are disabled; confetti is disabled.

WishRenderer root element:

    <div className={`${wishFontClasses} wish-root`} lang={language === "HINDI" ? "hi" : "en"}
         style={{ "--wish-vh": mode === "live" ? "100svh" : "720px", "--f-display": ..., "--f-body": ..., "--f-hand": ... }}>

Font variables: for HINDI, --f-display and --f-body are "var(--font-devanagari), sans-serif" and --f-hand is "var(--font-kalam), var(--font-devanagari), sans-serif". For other languages use tokens.fonts.display/body/hand, and when data.theme.font is "handwriting" the Message section uses --f-hand.

In preview mode every section sizes its full-screen areas with min-height: var(--wish-vh) instead of 100vh or 100svh, so the phone frame preview shows correct proportions. NEVER use 100vh directly in a section.

### 4.1 lib/wish-hooks.ts (REFERENCE)

    "use client";
    import { RefObject } from "react";
    import { useScroll } from "framer-motion";
    import { useWish } from "@/components/wish/WishProvider";

    // Scroll progress that works in live mode (window) and preview mode (inner container).
    export function useWishScroll(target?: RefObject<HTMLElement | null>, offset?: ["start end" | "start start" | "end start" | "end end" | "center center", string]) {
      const { scrollRef } = useWish();
      return useScroll({ target, offset: offset as never, container: scrollRef });
    }

    // Props for whileInView so it observes the right scroll container.
    export function useViewport() {
      const { scrollRef } = useWish();
      return { once: true, amount: 0.3, root: scrollRef } as const;
    }

Use useWishScroll and useViewport in every section instead of useScroll and a literal viewport.

### 4.2 components/wish/SmoothScroll.tsx (REFERENCE)

    "use client";
    import { useEffect } from "react";
    import Lenis from "lenis";
    import "lenis/dist/lenis.css";
    import { useWish } from "./WishProvider";

    // Mounts Lenis only in live mode, and not when the user prefers reduced motion. Locked until the intro is tapped.
    export function SmoothScroll() {
      const { mode, reducedMotion, started, lenisRef } = useWish();
      useEffect(() => {
        if (mode !== "live" || reducedMotion) return;
        const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
        lenisRef.current = lenis;
        if (!started) lenis.stop();
        let raf = 0;
        const loop = (time: number) => { lenis.raf(time); raf = requestAnimationFrame(loop); };
        raf = requestAnimationFrame(loop);
        return () => { cancelAnimationFrame(raf); lenis.destroy(); lenisRef.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [mode, reducedMotion]);
      useEffect(() => { if (started) lenisRef.current?.start(); }, [started, lenisRef]);
      return null;
    }

While started is false (intro showing) the page must not scroll: also set document.documentElement.style.overflow = "hidden" in Intro and remove it on start.

### 4.3 components/wish/useMusic.ts (REFERENCE)

Implement the hook with one owned audio element and explicit lifecycle tests, not effect closures that capture initial playing/muted values:

- Return { play, pause, muted, toggleMute, available, playing }. Keep current playback intent in refs (or useEffectEvent on a pinned compatible React version) for visibilitychange handlers.
- play() creates Audio lazily and calls audio.play() synchronously from the Intro gesture before awaiting anything or requesting gyro permission. Playing only in an effect after setStarted can lose browser user activation. Preview mode never creates audio.
- Set loop true, preload none and volume 0; fade toward 0.5 after play resolves. Allow one fade timer; cancel it before a new fade and on pause, track change and unmount.
- Pause/mute updates playback intent first. Showing a hidden tab resumes only previously playing, unmuted audio. A video resumes music only if it paused music that was actually playing.
- Reset availability on track change; a missing file hides the toggle. Autoplay rejection is not proof of a missing file: retain an explicit retry control and paused state.
- Remove audio/error/visibility listeners, stop playback and clear timers on cleanup. Rapid toggles, track changes and unmount must not leave audio/timers running.

Rules: music never starts without start() from the Intro tap; mode "preview" passes enabled false; when the Video section is unmuted by the viewer, call pause() and when it is muted again or leaves the view call play() if music was playing before.

CHECKPOINT UI-03: shared runtime built in P3-01.
- [ ] Done
- VERIFY: in live mode the page does not scroll until start() is called; Lenis is absent when reduced motion is on; the audio element is created only after the tap (network tab shows no mp3 request before it); a missing mp3 does not throw and hides the toggle.

---

## SECTION 5. SECTION RECIPES

All sections are client components in sections/ (and components/wish/ where noted). Props: { data, tokens }. Each section is wrapped in <section> with an id (intro, hero, message, timeline, gallery, video, wishes, finale) and padding py-24 (mobile py-16), px-6, max width 1100px centered unless stated.

### 5.1 Lock screen recipe (P4-05 countdown, P4-06 password gate)

Files: components/wish/LockBackground.tsx, components/wish/LockScreen.tsx (countdown), components/wish/PasswordGate.tsx, components/wish/FlipUnit.tsx.

Inputs: only recipientFirstName and revealAt (never template, accent or language).

LockBackground (shared): full-screen min-height 100svh, background #0F0A1E. Three absolutely positioned blurred circles (blur applied statically with CSS blur(80px)): violet #7C3AED 420px at top-left, pink #EC4899 360px at bottom-right, indigo #4F46E5 300px at center; each uses animation wish-drift 18s, 22s, 26s ease-in-out infinite with different delays. 18 tiny white dots (4px) placed with seededRandom(firstName) using animation wish-twinkle with durations 3 to 6 seconds.

LockScreen (SCHEDULED):
1. Centered column. A 72px circle with a lucide Gift icon in white on a violet-to-pink gradient, animation wish-pulse 2.4s infinite.
2. Teaser text translate("ENGLISH", "lock.teaser", { name: firstName }), font Poppins with sans-serif fallback, size clamp(24px, 6vw, 40px), color white, centered, max width 560px, line-height 1.3. Entrance: rise recipe.
3. Four FlipUnit blocks in a row (gap 12px, 16px on desktop): days, hours, minutes, seconds, each with a label under it from lock.days, lock.hours, lock.minutes, lock.seconds. Each block is 64px by 80px on mobile (84px by 104px on desktop), background rgba(255,255,255,0.08), border 1px solid rgba(255,255,255,0.15), radius 14px, number in font size 32px (48px desktop) weight 700, color white, tabular-nums.
4. Under the countdown, small muted text lock.opens with the reveal date formatted by Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short" }) in the viewer's timezone. Render the date and the digits only after mount (use a mounted flag) to avoid hydration mismatch; before mount show "--" placeholders.
5. Timer: setInterval every 1000 ms computes diff = revealAt - Date.now() (never below 0). When diff reaches 0 once: call router.refresh(), then call router.refresh() every 5000 ms while the component is still mounted (it unmounts when the server returns the open page). The server stays the only source of truth.

FlipUnit (REFERENCE):

    "use client";
    import { AnimatePresence, motion } from "framer-motion";

    // Shows one number. When the value changes the old digits flip away and the new ones flip in. Reduced motion: plain fade.
    export function FlipUnit({ value, reduced }: { value: string; reduced: boolean }) {
      return (
        <div style={{ perspective: 400 }} className="relative h-full w-full overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={value} className="absolute inset-0 flex items-center justify-center"
              initial={reduced ? { opacity: 0 } : { rotateX: 90, opacity: 0 }}
              animate={reduced ? { opacity: 1 } : { rotateX: 0, opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { rotateX: -90, opacity: 0 }}
              transition={{ duration: reduced ? 0.2 : 0.45, ease: [0.22, 1, 0.36, 1] }}>
              {value}
            </motion.span>
          </AnimatePresence>
        </div>
      );
    }

FlipUnit imports only framer-motion. LockScreen reads reduced motion with useReducedMotion from framer-motion and passes it down as the reduced prop.

PasswordGate (PASSWORD):
1. Same LockBackground. A glass card (max width 380px, padding 28px, radius 20px, background rgba(255,255,255,0.08), border 1px solid rgba(255,255,255,0.18), no backdrop blur) centered.
2. Lock icon (lucide Lock), title lock.password.title, hint lock.password.hint (use the recipient first name in the title area: show firstName in large text above the card title).
3. Password input (type password, autofocus, aria-label lock.password.input) and a Unlock button (height 48px, full width, gradient violet to pink, white text, whileTap scale 0.97).
4. Submit calls POST /public/pages/<slug>/unlock through the api() client. Success: router.refresh(). WRONG_PASSWORD (401): add the class that plays wish-shake 0.4s on the card, clear the input, show lock.password.wrong in red-300 text below the field. 429: show lock.password.limit. Other errors: toast.error(err.message).
5. Press Enter submits. The button shows a spinner while pending and is disabled.

Edge cases: revealAt already passed on first render (client clock ahead) shows 00 values and starts the refresh loop immediately; a Hindi recipient first name must render (font stack includes var(--font-devanagari) via the root layout of the w/[slug] page: put wishFontClasses on a wrapper in the lock components too).

CHECKPOINT UI-04: lock screen and password gate built in P4-05 and P4-06.
- [ ] Done
- VERIFY: on the seed page dev-farewell-3c8z (SCHEDULED) the countdown ticks every second with a flip; the network response contains no page content; sana-friendship-5h2q shows the gate, a wrong password shakes the card, friends123 opens the page; at 360px everything fits without horizontal scroll; reduced motion removes flips and blob drift.

### 5.2 Intro recipe (P3-03)

File: sections/Intro.tsx. Live mode only (return null when mode is "preview" or started is true after the exit animation completes).

Common behaviour:
1. Fixed overlay, inset 0, z-index 50, background tokens.colors.bg, rendered on the server so the name is visible at first paint (no flash of the page behind it).
2. Preload: on mount start preloading the first image (new Image().src = img(firstImage, 1200)) and wait for document.fonts.ready. The "Tap to begin" button becomes enabled when both are done AND at least 1.8 seconds have passed, or after a hard maximum of 3.5 seconds. Before then show intro.loading in small muted text.
3. Name letters: the display name split with splitGraphemes. Each letter is a motion.span, initial { opacity 0, y 40 }, animate { opacity 1, y 0 }, spring SPRING, delay index * 0.07 starting at 0.3 seconds. Font: var(--f-display), size clamp(44px, 16vw, 120px) (clamp(40px, 12vw, 96px) for names longer than 12 graphemes), line-height 1.1, centered, wraps by word.
4. Above the big letters show one small line (16px, muted, centered): the key intro.for with {name} set to the display name, fading in at 0.1 seconds. The big letters repeat the name; this is intended (the small line frames it, the big letters are the show).

5. Button: pill, height 52px, min width 220px, label intro.tap, background tokens.colors.primary, text color from variant. Appears at 1.8 seconds with opacity and y 12 to 0. Idle pulse via wish-pulse. whileTap scale 0.96.
6. On tap: call start() from WishProvider (music, gyro permission, Lenis), remove the html overflow lock, run the variant exit, then unmount the overlay and let Hero start its entrance (Hero reads started).

Variants:
- glitch (Neon Night): letters appear with a glitch: each letter also has two absolutely positioned copies (cyan #22D3EE and pink tokens.colors.primary) offset by -2px and +2px, opacity 0.8, shown for the first 0.5 seconds after the letter appears then faded to 0. Name text has text-shadow 0 0 12px primary, 0 0 32px primary (static). Background has a faint starfield: 40 dots with wish-twinkle. Exit: overlay split into 5 horizontal slices (each 20 percent height, background bg) that translate off to alternating left and right (x -100 percent or 100 percent) with stagger 0.06 and duration 0.6, EASE.
- balloons (Pastel Dream): letters use spring SPRING_POP and also scale 0.6 to 1. Background: tokens.colors.bg with 6 balloon shapes (inline SVG, colours from decorColors) rising slowly with wish-rise at 10 to 16 seconds. Button is a rounded bubble (radius 9999px) with a Caveat-style label using --f-hand. Exit: the whole overlay translateY 0 to -110 percent in 0.9s EASE while the balloons continue upward.
- envelope (Royal Gold): letters in Playfair, gold color. Below the name, an inline SVG envelope (width 260px, ivory fill #F5E6C8, gold #D4AF37 stroke 2px) with a wax seal circle (deep red #7F1D1D, 56px) in the center carrying a small gold heart. The seal is the tap target and contains no text; the visible label intro.tap sits under the envelope as text (button semantics apply to the whole group, aria-label intro.tap). Exit: flap (a triangle with transform-origin top, perspective 600px) rotates rotateX 0 to -180 degrees over 0.8s; the letter card (ivory rectangle) slides up y 0 to -60 over 0.6s starting at 0.5s; then the overlay fades opacity 1 to 0 over 0.5s starting at 1.1s.

Reduced motion: letters and button fade in together over 0.3s with no stagger or movement; exit is a 0.3s overlay fade.

Edge cases: very long name (40 graphemes) wraps without overflow and uses the smaller size; Hindi name uses graphemes correctly; if the tap handler throws (audio blocked) the page still starts; slow 3G: overlay is visible instantly (server rendered) and the button waits up to 3.5 seconds.

CHECKPOINT UI-05: Intro built in P3-03.
- [ ] Done
- VERIFY: the three variants play on riya-birthday-7f3a?template=neon-night, ?template=pastel-dream, ?template=royal-gold; Devanagari name letters stay intact; page cannot scroll before the tap; music starts only after the tap; reduced motion shows fades.

### 5.3 Hero recipe (P3-04)

File: sections/Hero.tsx. Height: min-height var(--wish-vh); overflow hidden; relative.

Structure (back to front):
1. Background layer (parallax net speed 0.2x).
2. Middle layer (net speed 0.5x).
3. Front layer: the text (net speed 1x, no transform).
Parallax method (use exactly): useWishScroll(heroRef, ["start start", "end start"]) gives progress 0 to 1. H = window.innerHeight in live mode (container clientHeight in preview), stored in state on mount and resize. Background y = useTransform(progress, [0, 1], [0, H * 0.8]) (moves down so it appears slower), middle y = useTransform(progress, [0, 1], [0, H * 0.5]). Each layer is a motion.div with className "wish-layer" absolutely filling the hero. Layers never create gaps because they are translated down while the hero scrolls up.
Tilt (live mode, desktop and mobile): inside each parallax layer add an inner motion.div whose x and y come from tilt MotionValues. Desktop: on pointer move over the hero compute nx, ny in range -1 to 1 from the pointer position relative to the hero center; set targets with useSpring (stiffness 80, damping 20). Mobile: gyro.x and gyro.y from the provider (beta and gamma clamped to plus or minus 30 degrees, divided by 30). Offsets in px: background 6, middle 14, front 22. Skip entirely when reduced motion or preview mode.
Entrance: the hero content starts when started is true (in preview start immediately). Greeting line fades and rises (rise recipe, delay 0.1), the name letters stagger in (spring, 0.06 stagger, delay 0.3), the sub line fades at 1.0 s, the scroll hint (lucide ChevronDown with wish-bob) fades at 1.6 s.
Text content:
- Greeting line: t("hero.greeting." + occasion, { label }), size clamp(20px, 5vw, 36px), weight 600, color tokens.colors.text.
- Name: giant animated letters of the display name followed by an exclamation mark, size clamp(56px, 22vw, 200px) (clamp(44px, 15vw, 150px) when the name has more than 10 graphemes), font var(--f-display), line-height 1.05, each letter a motion.span.
- Sub line: t("hero.sub." + occasion, { label }), size clamp(16px, 4vw, 24px), color tokens.colors.muted.
- Do not render the name twice in the DOM for accessibility: the letters container has aria-label with the full name and each letter span aria-hidden.

Variants:
- starfield (Neon Night): background = tokens.colors.bg with a radial gradient (primary at 15 percent alpha at 50 percent 30 percent), plus 60 star dots (1 to 3px) placed with seededRandom(slug), 30 of them with wish-twinkle. Middle layer = 6 blurred neon shapes (circles and rings, colours primary, secondary, tertiary at 30 percent alpha, sizes 80 to 220px, static blur 40px) plus the Decorations layer content for the hero (balloons or hearts per occasion) at low opacity. Name has text-shadow 0 0 16px primary, 0 0 48px primary (static). Glitch reveal: when the name letters finish entering, for 0.6 seconds two color-split copies (cyan and primary) offset plus or minus 3px with opacity 0.7 flash then fade (opacity only).
- bokeh (Pastel Dream): background = linear gradient from bg to bgAlt (top to bottom) with 10 bokeh circles (blurred 20px static, colours from decorColors at 50 percent alpha, 60 to 160px) drifting with wish-drift. Middle layer = 5 floating balloons (SVG) and 4 small hand-drawn doodles (inline SVG: star, squiggle, heart, spiral with stroke tokens.colors.primary, stroke-width 3, no fill). Name in Fredoka, letters have a springy overshoot (SPRING_POP) and alternate rotation of -3 and 3 degrees. Sub line uses --f-hand at 1.4 times the size.
- gold-frame (Royal Gold): background = tokens.colors.bg with a vertical gradient to #1a1410 and a slow gold light sweep (a 40 percent wide translucent diagonal band using wish-shimmer 9s linear infinite, opacity 0.08). Middle layer = 14 slow rose petals (deep red #7F1D1D and gold) falling with wish-fall at 18 to 28 seconds. A thin gold frame (1px, color primary at 60 percent alpha) inset 20px (12px on mobile) around the hero with 4 small corner ornaments (inline SVG L-shaped lines). Name in Playfair Display italic weight 600 with a gold foil effect: background linear-gradient(110deg, #8a6d1d, #D4AF37, #F5E6C8, #D4AF37, #8a6d1d) clipped to text, background-size 200 percent; a shimmer is done by a pseudo element overlay band moving with wish-shimmer 6s (opacity and transform only). Parallax is slower: multiply the two layer factors by 0.6 (0.12 and 0.3 net).

Reduced motion: no parallax transforms (y stays 0), no tilt, letters fade in together over 0.3s, no shimmer, ambient keyframes disabled by wish.css.
Edge cases: occasion CUSTOM uses customOccasionLabel (fallback "Surprise") in {label}; names with Devanagari or 40 characters wrap and shrink as specified; the hero never exceeds the viewport width.

CHECKPOINT UI-06: Hero built in P3-04.
- [ ] Done
- VERIFY: scrolling down moves the background slower than the middle layer and the text (visible depth); no gap appears at the hero top or bottom edge; mouse move tilts layers on desktop; Chrome performance panel shows no layout work during scroll; the three variants look different at 360px and 1280px.

### 5.4 Message recipe (P3-05)

File: sections/Message.tsx.

Layout: centered column, max width 680px. Section title message.title (small, muted, size 18px) above the text. Each message is a paragraph block, size clamp(22px, 5.5vw, 34px), line-height 1.5 (1.7 for Devanagari), font var(--f-body) or var(--f-hand) when data.theme.font === "handwriting" (handwriting size is multiplied by 1.25). Between messages 32px gap. Signature below the last message: translate message.signature with {from}; skip it when data.from is empty. Signature size 20px, font var(--f-hand), appears after all messages finish with a 0.8s fade and a 12px rise.

Variants:
- typewriter (Neon Night and Royal Gold): REFERENCE component below. Messages type one after another. Speed 35 ms per grapheme (2 graphemes per tick when the message is over 300 graphemes). Starts when the section is 40 percent in view (useInView once). A blinking caret (a 2px by 1em span, color primary, opacity keyframe via wish-twinkle 1s) follows the typing and is removed when all text is done.
- word-fade (Pastel Dream): each message is split into words (split on spaces, keep spaces); each word is a motion.span inline-block, initial { opacity 0, y 10 }, whileInView { opacity 1, y 0 }, duration 0.5, delay index * 0.08 capped at 3 seconds total (when there are more than 37 words reduce the delay to 3 / words). Messages appear sequentially by adding the previous message word count to the delay base.
Neon Night styling: left aligned text, a 3px neon bar (color primary, a pre-blurred twin behind it for glow) on the left of the block. Royal Gold styling: centered text, a gold ornament divider (thin line, diamond, thin line, inline SVG) above and below, the first letter of the first message is a drop cap (float left, font size 3.2em, color primary). Pastel Dream styling: the text sits on a card (background surface, radius 28px, padding 28px, rotate -1.2 degrees, border 2px dashed primary at 60 percent) with a tape strip (a 80px by 24px rectangle of tokens.colors.tertiary at 70 percent alpha) at the top center.

Typewriter REFERENCE (no per-letter DOM nodes; the full text stays in the layout so nothing shifts):

    "use client";
    import { useEffect, useRef, useState } from "react";
    import { useInView } from "framer-motion";
    import { splitGraphemes } from "@/lib/text";

    // Types a message grapheme by grapheme. The untyped remainder is rendered invisible so line breaks never move.
    export function Typewriter({ text, active, reduced, onDone, caretColor }: { text: string; active: boolean; reduced: boolean; onDone?: () => void; caretColor: string }) {
      const chars = splitGraphemes(text);
      const [n, setN] = useState(reduced ? chars.length : 0);
      const done = useRef(false);
      useEffect(() => {
        if (reduced) { setN(chars.length); if (!done.current) { done.current = true; onDone?.(); } return; }
        if (!active || n >= chars.length) return;
        const step = chars.length > 300 ? 2 : 1;
        const id = setTimeout(() => setN((v) => Math.min(chars.length, v + step)), 35);
        return () => clearTimeout(id);
      }, [active, n, chars.length, reduced, onDone]);
      useEffect(() => { if (n >= chars.length && !done.current) { done.current = true; onDone?.(); } }, [n, chars.length, onDone]);
      return (
        <p style={{ whiteSpace: "pre-wrap" }}>
          <span>{chars.slice(0, n).join("")}</span>
          {n < chars.length && active && <span aria-hidden style={{ display: "inline-block", width: 2, height: "1em", background: caretColor, verticalAlign: "text-bottom" }} className="wish-caret" />}
          <span style={{ opacity: 0 }} aria-hidden>{chars.slice(n).join("")}</span>
        </p>
      );
    }

Key each Typewriter by message id plus text so changed preview text resets n/done state. Add .wish-caret { animation: wish-twinkle 1s step-end infinite; } to wish.css. Give the paragraph an aria-label equal to full text and mark the text spans aria-hidden. Position the caret as an overlay so it cannot push a wrapping word onto another line.

In the Message section keep state activeIndex (starts 0). Message i is active only when the section is in view and activeIndex === i; onDone increments activeIndex. Messages with index greater than activeIndex render fully invisible (opacity 0) but keep their space.

Reduced motion: all text visible immediately with a 0.3s fade of the whole block.
Edge cases: a 600 character message finishes in about 10 seconds (2 graphemes per tick) and the page can be scrolled while typing; five messages type in sequence; Hindi text never splits a conjunct (graphemes); preview mode types at the same speed.

CHECKPOINT UI-07: Message built in P3-05.
- [ ] Done
- VERIFY: the riya seed message types out on first view; layout does not shift while typing (check by watching the next section's top edge); the Hindi seed message types without broken characters; the signature appears at the end; pastel variant uses word fades.

### 5.5 Timeline recipe (P3-06)

File: sections/Timeline.tsx. Returns null when data.memories is empty. Title timeline.title.

Data: each memory { title, date (YYYY-MM-DD or empty), description, mediaId }. Photo = the media item whose id equals mediaId (image type only); no mediaId or no match means a card without a photo. Sort memories by date ascending when every memory has a date; otherwise keep the creator's order.

Layout (shared): a container with a vertical line. Line progress: a motion.div (width 2px, full height, transform-origin top) with scaleY bound to scroll progress of the container (useWishScroll(containerRef, ["start end", "end center"])) so the line draws as the viewer scrolls; a dim static track behind it at 20 percent alpha.
Cards: each card is a motion.article, whileInView with viewport (useViewport). Entrance: opacity 0 to 1, x from 40px (cards on the right or on mobile) or -40px (cards on the left) to 0, duration 0.8, EASE. Inside: optional photo (img w_600, aspect ratio from ratio(), object-fit cover, radius per variant), date line (formatted with Intl.DateTimeFormat(dateLocale(language), { day: "numeric", month: "long", year: "numeric" }); skip when empty), title (var(--f-display), 22px), description (var(--f-body), 16px, muted, max 300 chars).
Responsive: mobile (under 768px) single column with the line on the left at 16px and cards to its right; desktop alternates left and right of a center line.
Node on the line: a 16px circle at each card, appearing with a scale 0 to 1 spring when its card enters.

Variants:
- center-line (Neon Night): center line is a neon bar (primary) with a pre-blurred glow twin; nodes are filled circles with a ring; cards are glass panels (surface at 60 percent alpha, 1px border primary at 40 percent alpha, radius 16px, no backdrop blur).
- doodle-path (Pastel Dream): line on the LEFT on all screen sizes (single column on desktop too, max width 620px), drawn dashed (stroke-dasharray 6 8) in primary; nodes are small hand-drawn stars (inline SVG); photos are polaroid frames (white 10px padding, 36px bottom, rotate alternating -2 and 2 degrees); date text uses --f-hand.
- gold-medallion (Royal Gold): center line is a 1px gold line; nodes are 28px medallions (gold ring, ivory center with a small diamond inline SVG); cards have a thin gold border, no radius (2px), titles in Playfair italic, dates in small caps style using font-variant small-caps (no uppercase).

Reduced motion: cards fade only; line is fully drawn immediately.
Edge cases: memory without photo; memory without date; one memory only (no alternating issues); memory whose media was deleted (no match, no photo); 8 memories.

CHECKPOINT UI-08: Timeline built in P3-06.
- [ ] Done
- VERIFY: riya seed page shows 3 memories sliding in on scroll; the line draws with scroll; a page with zero memories shows no Timeline section and no gap; mobile shows a left-aligned single column.

### 5.6 Gallery recipe (P3-07)

File: sections/Gallery.tsx plus components/wish/Lightbox.tsx. Title gallery.title. Uses imagesOf(data.media) in order. Returns null when there are no images (cannot happen after publish but happens in preview drafts: render a placeholder card of 3 skeleton rectangles in preview mode).

Count rules (all variants):
- 1 image: a single hero-style image, max width 520px centered, aspect ratio from ratio(), radius 24px, scroll parallax inside the frame, caption below. No grid, no empty slots.
- 2 images: two columns on desktop, stacked on mobile, same frame style.
- 3 or more: the variant layout below.

ScrollImage (shared building block): a frame with overflow hidden and aspect-ratio from ratio(); the inner img has object-fit cover and is scaled 1.15 with y bound by useTransform(progress, [0, 1], ["-6%", "6%"]) where progress = useWishScroll(frameRef, ["start end", "end start"]). Frame entrance: opacity 0 to 1 and scale 0.92 to 1, 0.7s, EASE, delay (index modulo 3) * 0.08. Image src img(m, 600) with srcSet adding img(m, 900) 2x; lightbox uses img(m, 1600). Click or Enter opens the Lightbox at that index (the frame is a button with aria-label from caption or "Photo n").

Variants:
- masonry (Neon Night): CSS columns: 2 on mobile, 3 on desktop, column-gap 12px, each item margin-bottom 12px with break-inside avoid. Frames radius 14px with a 1px border primary at 35 percent alpha; on hover (desktop, pointer fine) the frame gets translateY -4px and a pre-blurred glow twin raises its opacity from 0 to 0.6.
- polaroid (Pastel Dream): grid of 2 columns (mobile) and 3 (desktop) with 20px gap. Each item is a polaroid: white background, padding 10px 10px 40px, radius 4px, rotation from this list by index modulo 8: -5, 3, -2, 6, -4, 2, -6, 4 degrees; the caption (or empty) sits in the bottom strip in var(--f-hand) 18px. Entrance: dropped in from y -50 with rotation +10 degrees extra, spring SPRING, stagger 0.08. Hover/tap-lift: whileHover scale 1.06, rotate 0, zIndex 5.
- carousel3d (Royal Gold): REFERENCE logic. A stage with perspective 1200px and height 460px (380px on mobile). State active index. For every item compute offset = shortest signed distance from active (wrap around) limited to plus or minus 2; items with |offset| greater than 2 are hidden (opacity 0, pointer-events none). Item transform: translateX(offset * 62%) translateZ(-|offset| * 120px) rotateY(offset * -32deg) scale(1 - |offset| * 0.12); opacity 1 - |offset| * 0.3; zIndex 10 - |offset|; implemented as a motion.div animate with transition { duration 0.7, ease EASE }. The item width is 56 percent of the stage (72 percent on mobile). The active item is bordered with 1px gold and shows its caption below the stage. Controls: previous and next buttons (lucide ChevronLeft and ChevronRight, 44px, gold border, aria-labels gallery.prev and gallery.next) and drag="x" on the stage (dragConstraints left 0, right 0, dragElastic 0.2; on drag end if offset.x is under -60 go next, over 60 go previous). Autoplay every 3.5 seconds, stopped permanently after the first user interaction and when reduced motion is on. Tapping the active item opens the Lightbox. With fewer than 3 images use the 2-image rule instead (no ring).

Lightbox (components/wish/Lightbox.tsx): AnimatePresence overlay fixed inset 0 z-60 background rgba(0,0,0,0.92), fade 0.25s. Shows the current image img(m, 1600) with object-fit contain max 92vw by 80vh (use 80 percent of --wish-vh in preview), caption below, previous and next buttons, a close button top right (44px, padding with env(safe-area-inset-top)), a counter "n / total". Close with the button, the overlay click, and the Escape key; arrow keys navigate; horizontal swipe (drag x, threshold 60px) navigates; while open call lenisRef.current?.stop() and set html overflow hidden, restore on close. Focus moves to the close button on open and returns to the opener on close.

Reduced motion: frames fade only; polaroids have no rotation drop, carousel switches with a 0.3s opacity change and no 3D, no autoplay, no parallax.
Edge cases: 1 image; 2 images; 15 images (carousel keeps only 5 visible); portrait plus landscape mix (ratio clamped, object-fit cover, so no gaps or stretching); missing caption; image still loading shows a background of bgAlt color so the frame never collapses.

CHECKPOINT UI-09: Gallery and Lightbox built in P3-07.
- [ ] Done
- VERIFY: with the riya seed (6 images) and a test page with exactly 1 image and one with 2 images, no empty grid slots appear; lightbox opens, swipes, closes with Escape and restores page scroll; images load lazily (network tab shows requests as you scroll); three variants are visibly different.

### 5.7 Video recipe (P3-08)

File: sections/VideoSection.tsx. Returns null when there are no videos. Title video.title. Renders each video (maximum 2) stacked with 32px gap.

Frame: max width 420px (portrait) or 720px (landscape, w greater than h) centered, aspect ratio from the media w and h (fallback 9/16), radius 24px, overflow hidden. Glow: a sibling element behind the frame, same size, background tokens.colors.primary, filter blur(40px), opacity 0.35, transform scale 1.05; its opacity is animated between 0.25 and 0.5 with wish-twinkle at 4s (opacity only).
Video element attributes: muted, playsInline, loop, preload="none", poster={poster(url)}, src={videoSrc(url)} set only after the frame is within 300px of the viewport (IntersectionObserver rootMargin 300px) so the video is lazy loaded.
Playback: a second IntersectionObserver (threshold 0.5) plays the video when at least half visible and pauses it when not. Autoplay is only attempted when reduced motion is off; with reduced motion show the poster and a centered Play button (lucide Play in a 64px circle, aria-label video.play).
Sound: a button at the bottom right of the frame (44px, lucide Volume2 or VolumeX) toggles muted; tap on the video does the same. A small label text video.unmute is shown for 3 seconds at first view. When the viewer unmutes: call music pause(); when re-muted or the video leaves the view: call music play() if music was playing before.
Variants: the frame border is 1px primary at 50 percent alpha (Neon Night), 6px white border with radius 32px and a slight rotation of -1 degree (Pastel Dream), 1px gold border with a second 6px inset gold hairline (Royal Gold).
Entrance: rise recipe on the frame.
Edge cases: a video failing to load shows the poster and hides the sound button; two videos never play at the same time (pause the other when one starts); preview mode shows the poster only and never plays.

CHECKPOINT UI-10: Video built in P3-08.
- [ ] Done
- VERIFY: the riya seed video autoplays muted only when scrolled into view and pauses when scrolled away; tapping unmutes and background music pauses; the video network request appears only near the section; on throttled Slow 3G the poster shows first.

### 5.8 Wishes wall recipe (P4-08)

File: sections/WishesWall.tsx. Hidden when data.settings.wishesWall is false. Title wishes.title.

Data: live mode loads GET /public/pages/<slug>/wishes (EP-21) on mount through the api() client (items: id, name, message, emoji, createdAt). Show a skeleton of 3 cards while loading, wishes.empty when none, and an inline error with a Retry button on failure. Preview mode shows three built-in sample wishes (from lib/sample-data.ts) plus the text wishes.previewNote, and the form is disabled.
Display: show the newest 9, a button wishes.more reveals 9 more each press. Layout: columns 1 (mobile), 2 (tablet), 3 (desktop), column-gap 16px.
Card content: emoji (28px) top left if present, message (var(--f-body), 16px, line-height 1.5, wraps), name (var(--f-hand), 18px) at the bottom prefixed with a dash. All as plain text.
Float motion: each card has wish-bob with a duration between 6 and 9 seconds and a delay from seededRandom(wish id) (this is a CSS animation on an inner wrapper so entrance and float do not conflict). Entrance: rise recipe with stagger 0.08 per card (first row only; later cards just fade).

Variants:
- glass (Neon Night): surface at 55 percent alpha, 1px border primary at 45 percent alpha, radius 16px, padding 18px; name in tokens.colors.secondary.
- sticky (Pastel Dream): square-ish notes, background cycles through decorColors by index, rotation by index modulo 5 of -3, 2, -1, 3, -2 degrees, a tape strip at top (60px by 18px, white at 60 percent alpha), soft shadow (static), radius 4px; text in --f-hand 20px.
- ivory (Royal Gold): background #F5E6C8, text color #1a1410, 1px gold border, radius 2px, a small diamond ornament at the top center, message in Playfair italic, name in Cormorant 18px.

Form (below the cards, max width 520px): inputs for name (maxlength 40, placeholder wishes.name) and message (textarea 3 rows, maxlength 280, placeholder wishes.message) with a live counter "n / 280", an emoji row of 8 preset buttons (44px each) with these unicode escapes: "\u{1F389}", "\u2764\uFE0F", "\u{1F973}", "\u{1F382}", "\u2728", "\u{1F64C}", "\u{1F60D}", "\u{1F381}" (tapping selects one; tapping again deselects), and a submit button wishes.send (wishes.sending while pending). Submit calls POST /public/pages/<slug>/wishes (EP-22) with { name, message, emoji }. Optimistic insert at the top with a temporary id; on error remove it. Error handling: 429 shows toast.error(t("wishes.limit")); 400 with code PROFANITY shows toast.error(t("wishes.profanity")); other errors toast.error(t("wishes.error")). Success: clear the message, keep the name, toast.success(t("wishes.thanks")), and the new card pops in with SPRING_POP scale 0.8 to 1.
The form field styling follows the template (dark glass inputs on Neon Night, white rounded inputs on Pastel Dream, ivory inputs with gold underline on Royal Gold). Inputs font size at least 16px so iOS does not zoom.

Reduced motion: no float; cards fade only.
Edge cases: 0 wishes; 50 wishes (show 9 then more); long unbroken text wraps (overflow-wrap anywhere); the 4th wish within an hour returns 429 and shows the limit toast; Hindi wishes render correctly.

CHECKPOINT UI-11: Wishes wall built in P4-08.
- [ ] Done
- VERIFY: riya seed page shows its 3 wishes floating; posting a wish adds a card instantly and survives refresh; the 4th post within an hour shows the limit toast; wishesWall false hides the whole section; the three variants look different.

### 5.9 Finale recipe (P3-09)

File: sections/Finale.tsx. Full height section (min-height var(--wish-vh)), centered. Title finale.title above; the cake below; text under the cake.

Cake (inline SVG, viewBox 0 0 240 240, no external images): three tiers (rounded rectangles) with icing drips (paths), 5 candles evenly spaced on the top tier, each a thin rounded rect with a flame (teardrop path). For ANNIVERSARY and WEDDING use 2 candles and a small heart on top. Colours by variant: neon (dark body #1a0b3a, edges primary, flames cyan-yellow gradient #FDE68A to #22D3EE, glow ring around flames as a blurred twin), pastel (pink #FBCFE8 and lilac #C4B5FD tiers, white icing, flames #FBBF24), gold (tiers #7F1D1D and #F5E6C8, gold #D4AF37 trim, flames #FBBF24).
States: lit (default), blown.
Flames flicker with wish-flicker 0.9s infinite, each with a different delay (0 to 0.4s), transform-origin bottom center.
Prompt text: finale.tap (and finale.wish above it in the hand font). The cake is a button (aria-label finale.tap); tapping anywhere on the cake (or pressing Enter or Space) blows the candles.
Blow sequence (on tap, state lit to blown):
1. 0.0s: each flame animates to scaleY 0 and opacity 0 over 0.35s with stagger 0.08 (framer, replace the CSS flicker by switching class).
2. 0.1s: for each candle 3 small smoke circles (r 3) rise y 0 to -40 and fade over 1.2s with stagger 0.1.
3. 0.7s: confetti cannon (SECTION 5.9.1).
4. 1.4s: fireworks (SECTION 5.9.1).
5. 1.8s: closing block fades in: finale.closing with the display name, then finale.signature with from (skip when from is empty), then two buttons: Replay (lucide RotateCcw) and Share (lucide Share2).
Replay: sets state back to lit (flames return with scale 0 to 1 spring), hides the closing block, and scrolls to the top of the page (lenisRef.current?.scrollTo(0, { duration: 2 }) when Lenis exists, otherwise window.scrollTo({ top: 0, behavior: "smooth" }) unless reduced motion, in which case behavior is "auto"). The intro is not shown again.
Share: if navigator.share exists call navigator.share({ title: document.title, url: window.location.href }) (ignore AbortError); otherwise copy window.location.href with navigator.clipboard.writeText and toast.success(t("finale.copied")). Share button label finale.share. In preview mode both buttons are disabled.

#### 5.9.1 Confetti (REFERENCE, lib/confetti.ts)

    // Loads canvas-confetti only when needed.
    export async function cannon(colors: string[], reduced: boolean) {
      if (reduced) return;
      const confetti = (await import("canvas-confetti")).default;
      const base = { colors, ticks: 220, gravity: 0.9, disableForReducedMotion: true, zIndex: 70 };
      confetti({ ...base, particleCount: 90, angle: 60, spread: 70, origin: { x: 0, y: 0.9 }, startVelocity: 55 });
      confetti({ ...base, particleCount: 90, angle: 120, spread: 70, origin: { x: 1, y: 0.9 }, startVelocity: 55 });
    }
    export async function fireworks(colors: string[], reduced: boolean) {
      if (reduced) return;
      const confetti = (await import("canvas-confetti")).default;
      let i = 0;
      const id = setInterval(() => {
        confetti({ colors, particleCount: 60, spread: 360, startVelocity: 30, ticks: 70, gravity: 0.8, zIndex: 70,
          origin: { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.3 }, disableForReducedMotion: true });
        if (++i >= 6) clearInterval(id);
      }, 280);
    }

Colours passed: [tokens.colors.primary, tokens.colors.secondary, tokens.colors.tertiary, "#FBBF24"]. In preview mode do not call cannon or fireworks.

Reduced motion: flames static, tapping simply switches flames off with a 0.3s fade and shows the closing block; no confetti, no smoke.
Edge cases: tap twice quickly (ignore taps when state is blown); confetti must not cause horizontal scroll (canvas is fixed and pointer-events none, handled by the library); small phones: cake width min(80vw, 300px).

CHECKPOINT UI-12: Finale built in P3-09.
- [ ] Done
- VERIFY: tap blows the candles with smoke, then cannon and fireworks fire, then the closing text and the two buttons appear; Replay relights and scrolls to the top; Share opens the share sheet on mobile or copies the link on desktop; reduced motion shows no confetti.

### 5.10 Global elements recipe (P3-10)

Files: components/wish/ScrollProgress.tsx, components/wish/MusicToggle.tsx, components/wish/WishFooter.tsx. Live mode only (render nothing in preview, except WishFooter which is rendered in both).

- ScrollProgress: fixed at top (top: env(safe-area-inset-top)), height 3px, full width, background tokens.colors.primary, transform-origin left, scaleX = useSpring(scrollYProgress, { stiffness 120, damping 30 }); z-index 40. Hidden until started.
- MusicToggle: fixed bottom right (bottom: calc(16px + env(safe-area-inset-bottom)), right: calc(16px + env(safe-area-inset-right))), 44px circle, background surface at 80 percent alpha, 1px border primary at 50 percent alpha, lucide Volume2 when playing and not muted else VolumeX, aria-label music.on or music.off, z-index 40. Rendered only when started, theme.music is not "none" and the track is available. A tiny equalizer (3 bars scaleY loops with wish-flicker at different delays) shows beside the icon while playing.
- WishFooter: centered small text t("footer.made") with a lucide Heart icon (filled, color primary) inline, then a link t("footer.cta") to /signup (underline in primary). If data.views exists show t("footer.views", { n }) in muted text. Padding bottom 40px plus safe-area. The footer sits after the Finale.

CHECKPOINT UI-13: Global elements built in P3-10.
- [ ] Done
- VERIFY: progress bar fills across the page; toggle appears only after the tap and mutes and unmutes music; footer text switches with ?lang=; the riya seed footer shows "47 views" because showViews is true.

### 5.11 Decorations recipe (P3-14)

File: components/wish/Decorations.tsx. A fixed layer (position fixed in live mode, absolute inside the preview container in preview mode), inset 0, z-index 1, pointer-events none, overflow hidden, aria-hidden. Sections have position relative and z-index 2 so decorations sit behind text but above the background.

Input: decorations = data.theme.decorations; when empty use DEFAULT_DECORATIONS[data.occasion] from lib/occasion.ts. Colours from tokens.decorColors. Render only after mount (mounted flag) to avoid hydration mismatch. Random values come from seededRandom(data.slug or "preview").

Element counts per decoration (halve on viewport width under 640px; hard cap of 24 animated elements in total, 10 in preview mode):
- balloons: 6 SVG balloons (ellipse body, small knot, thin string), size 38 to 64px, left 5 to 95 percent, animation wish-rise 14 to 24s linear infinite with negative delays so they are already spread out, plus wish-sway on an inner wrapper.
- confetti: 18 small rectangles (6 by 10px) and circles in decorColors, animation wish-fall 9 to 16s linear infinite.
- cake: no floating element; adds a 56px cake silhouette that bobs (wish-bob) near the bottom left corner at 40 percent opacity, and guarantees the Finale cake is shown.
- hearts: 10 SVG hearts, size 16 to 34px, color primary or highlight, wish-rise 12 to 20s with wish-twinkle on opacity.
- petals: 14 SVG petals (teardrop path), 14 to 26px, colours rose (royal gold: #7F1D1D and #D4AF37; pastel: #FBCFE8 and #C4B5FD; neon: primary and secondary), wish-fall 14 to 24s with wish-sway.
- sparkles: 16 four-point star SVGs, 8 to 18px, wish-twinkle 2 to 5s with random delays.
- stars: 24 dots (2 to 4px) with wish-twinkle 2 to 6s.
Per-template styling: Neon Night adds a static drop-shadow glow in the element colour; Pastel Dream uses rounded softer shapes at 85 percent opacity; Royal Gold keeps opacity at 70 percent and slower durations (multiply by 1.5).
Occasion expectations: BIRTHDAY defaults (balloons, confetti, cake), ANNIVERSARY (hearts, petals), CUSTOM (sparkles).

Reduced motion: render 6 static elements (no animation classes) at fixed seeded positions with opacity 0.4. Preview mode: cap 10 elements and no confetti falling.

CHECKPOINT UI-14: Decorations built in P3-14.
- [ ] Done
- VERIFY: riya seed (birthday) shows balloons, falling confetti and the small cake; kavya seed (anniversary) shows hearts and petals; a test page with occasion CUSTOM and empty decorations shows sparkles; the Elements panel shows at most 24 animated nodes; scrolling stays at 60 fps.

---

## SECTION 6. THE THREE TEMPLATES (P3-11, P3-12, P3-13)

Each template is templates/<id>/index.tsx (default export, props WishTemplateProps) and templates/<id>/theme.ts (exports the ThemeTokens object). The template index does exactly this, in this order, and nothing else:

    export default function Template({ data, mode }: WishTemplateProps) {
      const tokens = withAccent(theme, data.theme.accent);
      return (
        <div style={{ background: tokens.colors.bg, color: tokens.colors.text }} className="wish-root">
          <SmoothScroll />
          <Decorations data={data} tokens={tokens} />
          <ScrollProgress tokens={tokens} />
          {mode === "live" && <Intro data={data} tokens={tokens} />}
          <Hero data={data} tokens={tokens} />
          <Message data={data} tokens={tokens} />
          <Timeline data={data} tokens={tokens} />
          <Gallery data={data} tokens={tokens} />
          <VideoSection data={data} tokens={tokens} />
          {data.settings.wishesWall && <WishesWall data={data} tokens={tokens} />}
          <Finale data={data} tokens={tokens} />
          <WishFooter data={data} tokens={tokens} />
          <MusicToggle tokens={tokens} />
        </div>
      );
    }

The WishProvider and the dynamic import are handled by WishRenderer (file 03 P3-01), so templates never import the registry.

Section vertical spacing: py-24 desktop, py-16 mobile. Section backgrounds alternate between colors.bg and colors.bgAlt for rhythm (hero bg, message bgAlt, timeline bg, gallery bgAlt, video bg, wishes bgAlt, finale bg).

### 6.1 Neon Night (templates/neon-night/theme.ts)

Mood: party, Gen-Z, nightlife.

    export const theme: ThemeTokens = {
      id: "neon-night",
      accentMode: "primary",
      colors: { bg: "#0B0420", bgAlt: "#120833", surface: "#1A0B3A", text: "#F8F5FF", muted: "#B9A9E6",
                primary: "#FF4FA3", secondary: "#22D3EE", tertiary: "#A78BFA", highlight: "#FBBF24" },
      fonts: { display: "var(--font-space), var(--font-devanagari), sans-serif",
               body: "var(--font-space), var(--font-devanagari), sans-serif",
               hand: "var(--font-caveat), var(--font-devanagari), cursive" },
      decorColors: ["#FF4FA3", "#22D3EE", "#A78BFA", "#FBBF24"],
      variants: { intro: "glitch", hero: "starfield", message: "typewriter", timeline: "center-line",
                  gallery: "masonry", wishes: "glass", finale: "neon" },
    };

Display type: Space Grotesk weight 700, letter-spacing 0. Signature effects: glowing neon text (static text-shadow), starfield parallax, glitch reveal, confetti cannon in neon colours. Layout character: dark, left-aligned text blocks, full-bleed masonry, glass cards.

### 6.2 Pastel Dream (templates/pastel-dream/theme.ts)

Mood: soft, cute, playful.

    export const theme: ThemeTokens = {
      id: "pastel-dream",
      accentMode: "primary",
      colors: { bg: "#FFF1F5", bgAlt: "#FFFFFF", surface: "#FFFFFF", text: "#4A2B4F", muted: "#8B6B93",
                primary: "#F472B6", secondary: "#C4B5FD", tertiary: "#FDE68A", highlight: "#FBCFE8" },
      fonts: { display: "var(--font-fredoka), var(--font-devanagari), sans-serif",
               body: "var(--font-quicksand), var(--font-devanagari), sans-serif",
               hand: "var(--font-caveat), var(--font-devanagari), cursive" },
      decorColors: ["#FBCFE8", "#C4B5FD", "#FDE68A", "#F472B6"],
      variants: { intro: "balloons", hero: "bokeh", message: "word-fade", timeline: "doodle-path",
                  gallery: "polaroid", wishes: "sticky", finale: "pastel" },
    };

Display type: Fredoka weight 600, rounded; body Quicksand weight 500; handwriting Caveat. Signature effects: floating balloons, polaroid gallery, hand-drawn doodles, petals. Layout character: light, rounded everything (radius 24 to 32px), slightly rotated cards, centered and playful.

### 6.3 Royal Gold (templates/royal-gold/theme.ts)

Mood: elegant, anniversary, wedding.

    export const theme: ThemeTokens = {
      id: "royal-gold",
      accentMode: "highlight",
      colors: { bg: "#0E0E10", bgAlt: "#16130F", surface: "#1C1813", text: "#F5E6C8", muted: "#B8A57C",
                primary: "#D4AF37", secondary: "#F5E6C8", tertiary: "#7F1D1D", highlight: "#7F1D1D" },
      fonts: { display: "var(--font-playfair), var(--font-devanagari), serif",
               body: "var(--font-cormorant), var(--font-devanagari), serif",
               hand: "var(--font-caveat), var(--font-devanagari), cursive" },
      decorColors: ["#7F1D1D", "#D4AF37", "#F5E6C8", "#A52A2A"],
      variants: { intro: "envelope", hero: "gold-frame", message: "typewriter", timeline: "gold-medallion",
                  gallery: "carousel3d", wishes: "ivory", finale: "gold" },
    };

Display type: Playfair Display italic weight 600; body Cormorant weight 500 at 1.15 times the normal size (Cormorant renders small). The creator accent colour replaces highlight (petals, ornament accents, underline) while gold stays fixed as the identity. Signature effects: gold foil shimmer, slow parallax, rose petals, letter-opening (envelope) intro. Layout character: dark, symmetrical, centered, thin gold lines, serif, generous whitespace.

### 6.4 Distinctness test (must pass)

On riya-birthday-7f3a with ?template=neon-night, ?template=pastel-dream and ?template=royal-gold, all of these must differ: intro style, hero layering and name treatment, message reveal and alignment, timeline line and card style, gallery layout, wishes card style, finale cake colours, fonts and palette. If any two templates share the same value for four or more of these, rework the weaker template.

CHECKPOINT UI-15: all three templates composed in P3-11 to P3-13.
- [ ] Done
- VERIFY: distinctness test passes; each template shows all sections in order on riya, kavya and meera seed pages; "wow" within 3 seconds: the intro name animation plays immediately at first paint on all three.

---

## SECTION 7. APP-SIDE MOTION AND WIZARD UX

The app (landing, wizard, dashboard, admin) uses the app tokens of file 03 SECTION 5.3. Keep it clean and playful: motion only where it explains a change.

### 7.1 Wizard micro-interactions (apply during Phase 2 and polish later)

- Step change: AnimatePresence mode wait; the leaving step slides x 0 to -24px (or +24px when going back) and fades out in 0.2s; the entering step slides from +24px (or -24px) to 0 and fades in over 0.3s, EASE. Direction is stored in state.
- Progress bar: a track with a filled bar whose width change is done with scaleX (transform-origin left) via spring; six dots below with the current step highlighted; completed steps show a check icon (lucide Check).
- Buttons: whileTap scale 0.97; Next shows a spinner while saving; Back and Next are reachable with the keyboard; Enter in a text input goes to the next field, Enter on the last field of a step triggers Next.
- Validation: errors appear under the field with a 0.2s fade and rise of 4px; on a failed Next the first invalid field is focused and the form container does a 0.35s shake (wish-shake equivalent via Framer x keyframes [0, -8, 8, -6, 6, 0]).
- Choice cards (occasion, language, template): selected state scales to 1.03 with a primary ring; unselected stay at 1.
- Autosave indicator: Saving/Saved/Offline/Unsaved/Conflict matching file 03 P2-07; never show Saved for failed or pending writes.
- Upload tiles (Media step): each tile shows a determinate progress bar (transform-origin left, scaleX from 0 to 1), the thumbnail fades in on completion, drag handle lifts the tile (scale 1.05 and elevated shadow) while dragging, delete shows a 0.2s scale-out.
- Generate success: a modal with scale 0.9 to 1 spring, canvas-confetti burst (origin center, particleCount 120, spread 80) using app colours [#7C3AED, #EC4899, #FBBF24], the link in a copy field with a copy button that switches to a check for 1.5s, the QR code, and share buttons.
- Toasts: sonner at top center on mobile and bottom right on desktop.

### 7.2 Live preview

- Desktop (width 1024px and above): right-hand pane with PhoneFrame, a 360 by 720 inner viewport (the frame adds a 12px bezel, a notch bar and radius 44px). Scale the frame with CSS transform scale(min(1, paneHeight / 780)) so it always fits without scrolling the wizard page.
- The preview scroll container (inside the frame, overflow-y auto, scrollbar hidden) is passed to WishRenderer as scrollRef (SECTION 4). A small "Replay hero" icon button above the frame scrolls it back to the top.
- Mobile: a floating Preview button (bottom center, 48px tall) opens a full-screen sheet with the same frame scaled to fit width; close button top right.
- Updates: the preview reads the wizard form state and rebuilds WishPageData with toPreviewData(); edits show instantly; a debounce of 150ms is allowed. Missing data uses placeholders: name "Your Friend", message "Your message will appear here...", a gray placeholder image when there are no photos.

### 7.3 lib/sample-data.ts

Exports SAMPLE_WISH(templateId, language) returning WishPageData used by the /templates gallery, the landing page and the preview placeholders. Content: slug "sample", occasion BIRTHDAY, recipient { name "Riya", nickname "Riyu", relation "Best friend" }, from "Arjun & gang", message "Tu best hai yaar, har din tere bina boring hai" (for ENGLISH use "You are the best, every day without you is boring"; for HINDI use "तुम सबसे अच्छे हो, तुम्हारे बिना हर दिन फीका है"), 3 memories (First day of college 2024-07-01, Goa trip 2025-12-20, Farewell 2026-05-10) linked to the first three images, 6 images using the Cloudinary demo URLs from file 02 SECTION 13 step 5 with w 1080 and h 1350, no video, theme { templateId, accent: template default accent, font "default", music "none", decorations [] }, settings { wishesWall true, showViews false }. SAMPLE_WISHES: three entries { name "Aarav", message "Happy birthday Riya!", emoji "" }, { name "Meera", message "Best day for the best person", emoji "\u2728" }, { name "Kabir", message "Party kab hai?", emoji "\u{1F389}" }.

CHECKPOINT UI-16: wizard motion and live preview rules applied in Phase 2 and P3-16.
- [ ] Done
- VERIFY: step changes slide in the correct direction; the preview scales to fit at 1280 by 720 without scrolling; the preview scrolls on its own and parallax and timeline progress respond to that inner scroll; a failed Next shakes and focuses the first error.

---

## SECTION 8. LANDING PAGE RECIPE (P4-13)

File: app/(marketing)/page.tsx plus components in components/app/landing/. Server component page with client islands. App design tokens (violet #7C3AED, pink #EC4899, sunshine #FBBF24, ink #0F0A1E, canvas #FAF7FF). Fonts Poppins headings and Inter body (file 03 SECTION 5.3). Keep motion restrained: ONE orchestrated moment (the hero phone), everything else is a simple 0.5s fade-in once.

Sections in order:
1. Navbar: sticky, blurred canvas background (static), logo "Wishly" (Poppins 700, with a small gradient heart icon), links How it works, Templates, FAQ (anchor links), buttons Login (text) and "Create a surprise" (primary pill). Collapses to a menu sheet under 768px.
2. Hero: two columns on desktop (text left, phone right), stacked on mobile (text first, phone below). Headline: "Turn a few photos and a few words into a surprise they will never forget." (Poppins 700, size clamp(36px, 7vw, 68px), line-height 1.05, ink). Sub: "Fill a short form, upload your photos and get an animated website with its own link. Share it on WhatsApp in a minute." Buttons: primary "Create a surprise" (to /signup) and secondary "See a sample" (to /w/riya-birthday-7f3a). The right side is a PhoneFrame running WishRenderer in preview mode with SAMPLE_WISH("neon-night", "HINGLISH") and autoScroll on (the preview container scrolls itself at 40px per second, pauses on hover and touch, loops back to the top at the end). The orchestrated moment: the phone rises from y 60 to 0 with opacity and a spring while 3 floating cards (a wish bubble, a countdown chip, a QR chip) drift beside it with wish-bob. Background: soft blurred violet and pink blobs (static blur) at 25 percent alpha.
3. How it works (id how-it-works): three steps in a row (column on mobile): Fill a short form (lucide PenLine), Upload your photos (lucide ImagePlus), Share one link (lucide Share2). Each with a one-line description. Step numbers are shown because it is a real sequence.
4. Template showcase (id templates): heading "Three looks, endless surprises". A horizontally scrollable snap row (scroll-snap-type x mandatory, cards 280px wide, gap 16px) of the 3 templates. Each card: a 280 by 500 mini preview (WishRenderer in preview mode scaled to 0.78 via transform, pointer-events none, autoScroll on only while the card is in view) mounted lazily with IntersectionObserver rootMargin 200px, the template name, a one-line description from the seed, 4 palette swatches, and a "Use this template" button to /signup. Only mount previews for visible cards (unmount when more than 600px away) to protect performance.
5. Sample pages: heading "See real examples". Three link cards to /w/riya-birthday-7f3a (Birthday, Hinglish, Neon Night), /w/kavya-anniversary-2k4m (Anniversary, English, Royal Gold), /w/meera-birthday-9p1x (Birthday, Hindi, Pastel Dream), each with a thumbnail (the seed thumbnailUrl or the first demo image), chips for occasion, language and template, opening in a new tab.
6. Testimonials (clearly sample content, add the text "Sample feedback" in muted small type under the heading): three cards with a quote, name, and role:
   - "My sister cried happy tears. It took me ten minutes to make." Name: Priya S. Role: Sister
   - "The countdown made the whole day more exciting." Name: Rohan M. Role: Friend
   - "Our anniversary page felt like a tiny movie." Name: Neha and Kunal. Role: Couple
7. FAQ (id faq): shadcn Accordion, single open at a time, 6 items:
   - Is Wishly free? Answer: Yes. Creating and sharing pages is free.
   - Can I schedule a surprise? Answer: Yes. Set a reveal date and the page shows a countdown until then. The content stays hidden on the server until the time comes.
   - Can I protect a page with a password? Answer: Yes. Add a password in the Style step and only people who know it can open the page.
   - Which languages are supported? Answer: English, Hinglish and Hindi.
   - How many photos and videos can I add? Answer: Up to 15 photos and 2 videos per page.
   - Can friends add wishes? Answer: Yes. Visitors can leave a short wish on the wishes wall and you can remove any wish.
8. Final call to action band: ink background, headline "Ready to make someone smile?", primary button "Create a surprise". When the band enters the view, fire a small confetti burst once (canvas-confetti, 80 particles, app colours, disabled for reduced motion).
9. Footer: logo, links (Templates, Login, Sign up), text "Made with love on Wishly".

States: the sample page links and previews need no API; the page works logged out; the Navbar shows "Dashboard" instead of Login when logged in (read user on the server).
Responsive: 360px no horizontal scroll; hero phone scaled to fit width 260px on mobile; template row scrolls horizontally inside its own container only.
Reduced motion: no phone rise, no floating cards, no autoScroll, no confetti.

CHECKPOINT UI-17: landing page built in P4-13.
- [ ] Done
- VERIFY: all sections render at 360px and 1280px; the hero phone plays a self-scrolling preview; template cards mount previews only when near the viewport (check the DOM); Lighthouse mobile performance of / is 80 or higher; all links work.

---

## SECTION 9. MOBILE RULES (P3-17)

The recipient opens the page on a phone almost every time. Test at 360px, 390px and 768px.

1. No horizontal scroll: wish-root has overflow-x clip; images max-width 100 percent; long words wrap with overflow-wrap anywhere.
2. Use svh units (100svh) for full-screen areas in live mode, via --wish-vh. Never 100vh.
3. Tap targets at least 44px by 44px (buttons, toggles, carousel arrows, emoji presets, lightbox controls).
4. Safe areas: fixed elements use env(safe-area-inset-*) padding as listed in each recipe; the page meta viewport includes viewport-fit=cover (set via the Next.js viewport export in app/w/[slug]/page.tsx).
5. Text sizes use clamp() as given; body text never below 16px; inputs at least 16px to prevent iOS zoom.
6. Gyro: DeviceOrientationEvent.requestPermission exists only on iOS 13+; call it inside the Intro tap handler; if it does not exist just attach the deviceorientation listener; if permission is denied or the call throws, ignore silently and keep tilt at 0.
7. Touch: gallery lightbox and carousel use drag/swipe; hover-only effects are wrapped in @media (hover: hover) and (pointer: fine).
8. Lenis: wheel smoothing only (syncTouch is off) so native touch scrolling and momentum are preserved.
9. Keep ambient decorations to half count under 640px (Decorations recipe).
10. Avoid backdrop-filter on mobile; the glass surfaces use solid rgba backgrounds as specified.
11. Devanagari: line-height at least 1.5 and no letter-spacing.
12. The finale cake width is min(80vw, 300px); the intro name size uses the smaller clamp for long names.
13. Landscape phone (height under 500px): hero min-height is 560px, not the viewport, so content is not squashed.

CHECKPOINT UI-18: mobile rules applied in P3-17.
- [ ] Done
- VERIFY: with Chrome device emulation at 360px, 390px and 768px: no horizontal scroll on any template or lock screen; all buttons 44px or larger; the full flow from intro to finale completes using touch emulation only; iOS gyro denial does not break the page.

---

## SECTION 10. PERFORMANCE AND REDUCED MOTION CHECKLIST (FEEDS PERF-1)

Targets: Lighthouse mobile performance 80 or higher on a page with 9 images and 1 video; 60 fps scroll.

Performance rules:
1. Only the chosen template chunk loads (dynamic import in the registry). Confetti loads on demand via dynamic import. The Lightbox may be dynamically imported on first open.
2. Image sizes by role: gallery 600 (srcSet 900), timeline 600, lightbox 1600, preload only the first image during the intro with width 1200. All images loading="lazy" decoding="async" with width and height attributes.
3. Video preload none; src assigned only near the viewport; poster from Cloudinary.
4. will-change: transform only on the three hero layers (class wish-layer). Do not add will-change elsewhere.
5. No box-shadow, filter, width, height, top or left animation anywhere; blurs are static.
6. At most 24 ambient animated elements at once; each ScrollImage uses a single useTransform and one useWishScroll.
7. Fonts: display swap; load only the weights listed; Neon Night loads Space Grotesk and Caveat, Pastel Dream loads Fredoka, Quicksand and Caveat, Royal Gold loads Playfair, Cormorant and Caveat. All fonts are included in wishFontClasses by default; if Lighthouse flags font weight, split wishFontClasses per template and record it in docs/DECISIONS.md.
8. Server data: the page is rendered from the same payload with no client waterfall (only wishes load after mount).
9. CLS: all media has reserved aspect ratio; the intro overlay is server rendered.
10. Music: preload none; created only after the tap.

Reduced motion summary (all of these must hold when the OS asks for reduced motion):
- Intro: fade only. Hero: no parallax, no tilt, letters fade together. Message: full text with a fade. Timeline: cards fade, line fully drawn. Gallery: fades, no rotation drop, no 3D, no autoplay, no parallax inside frames. Video: no autoplay, poster with Play button. Wishes: no float. Finale: no flicker, no smoke, no confetti. Lock screen: no flip, no drift. Decorations: 6 static elements. Lenis: not mounted. Progress bar: no spring smoothing.

CHECKPOINT UI-19: performance and reduced motion verified in Phase 5.
- [ ] Done
- VERIFY: production-build Lighthouse mobile runs on all three seed templates and a 9-image/1-video acceptance page report 80 or higher (record reports in README); with reduced-motion emulation every item above holds.

---

## SECTION 11. MUSIC FILES (public/music)

Required files (exactly these names, mp3, each 2 MB or smaller, loopable, royalty-free):

- public/music/soft-piano.mp3
- public/music/happy-pop.mp3
- public/music/party-beat.mp3
- public/music/romantic-strings.mp3

Steps:
1. Download one royalty-free track per name from Pixabay Music (pixabay.com/music) or the YouTube Audio Library. Choose: soft-piano a gentle solo piano; happy-pop an upbeat light pop; party-beat an energetic dance beat; romantic-strings a slow string piece.
2. Trim and compress each to at most 90 seconds with ffmpeg: ffmpeg -i input.mp3 -t 90 -b:a 96k -ac 2 -af "afade=t=out:st=86:d=4" public/music/<name>.mp3 (about 1 MB each).
3. Write public/music/CREDITS.txt listing each file, the source URL and the license.
4. If the agent cannot download files in its environment, create nothing placeholder, leave the files missing (useMusic hides the toggle and the wizard preview buttons stay disabled), and add this line to docs/DECISIONS.md: "Music files must be added by a human before the demo: public/music/*.mp3". Do not skip the other steps in this file because of it.
5. Default music per template is NOT set automatically; theme.music comes from the creator's choice in the wizard (seed page riya uses soft-piano).

CHECKPOINT UI-20: music files in place. A missing-files note records a blocker/limitation, not a verification pass for working music.
- [ ] Done
- VERIFY: with the files present, opening riya-birthday-7f3a and tapping Tap to begin starts soft piano with a fade-in; the wizard preview buttons play a sample of each track; no file is larger than 2 MB.

---

## SECTION 12. DECISIONS TO RECORD (append to docs/DECISIONS.md)

Add these lines verbatim (create the file if missing):

- Neon Night display font is Space Grotesk because Clash Display is not available on Google Fonts.
- Lock screen and password gate render in English because the locked API payload does not include the page language.
- Cloudinary media uses plain img elements with Cloudinary transformations instead of next/image.
- Hindi handwriting text uses Kalam because Caveat has no Devanagari glyphs.
- Ambient decoration loops are CSS keyframes in app/w/[slug]/wish.css; scroll and entrance motion use Framer Motion.
- Royal Gold keeps gold fixed as the primary colour; the creator accent replaces the highlight colour.

CHECKPOINT UI-21: decisions recorded.
- [ ] Done
- VERIFY: all six lines exist in docs/DECISIONS.md.

---

## SECTION 13. MASTER UI COMPLETION TABLE

This file is complete when every line is marked [x].

- [ ] UI-00 to UI-03 (read, i18n, tokens and fonts, shared runtime)
- [ ] UI-04 Lock screen and password gate
- [ ] UI-05 Intro
- [ ] UI-06 Hero
- [ ] UI-07 Message
- [ ] UI-08 Timeline
- [ ] UI-09 Gallery and Lightbox
- [ ] UI-10 Video
- [ ] UI-11 Wishes wall
- [ ] UI-12 Finale
- [ ] UI-13 Global elements
- [ ] UI-14 Decorations
- [ ] UI-15 Three templates distinct
- [ ] UI-16 Wizard motion and live preview
- [ ] UI-17 Landing page
- [ ] UI-18 Mobile rules
- [ ] UI-19 Performance and reduced motion
- [ ] UI-20 Music files
- [ ] UI-21 Decisions recorded
- [ ] Final visual review: open the three seed pages and the landing page on a real phone (or device emulation) and on desktop; each shows a clear first-3-seconds wow, one focal animation per screen, no console errors, no horizontal scroll

Next file: 05-TESTING-DEPLOYMENT-SUBMISSION.md.

END OF FILE 04
