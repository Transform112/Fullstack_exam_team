# Wishly: Specification

## Goal
Let a non-technical person create a beautiful, personal celebration page and share it in under five minutes.

## Roles
- **visitor**: opens a public page, optionally leaves a wish.
- **creator**: signs up, builds, publishes and tracks pages.
- **admin**: moderates pages and wishes, sees platform stats.

## Core flows
1. Sign up / log in (email + password, JWT in httpOnly cookie).
2. Wizard: occasion, recipient, message, timeline, photos, video, music, template, language, lock (optional passcode).
3. Autosave draft every few seconds; review; publish (generates unique slug).
4. Share: link, QR code, WhatsApp, dynamic OG image.
5. Public page `/w/[slug]`: lock screen, intro, hero, message, timeline, gallery, video, wishes wall, finale.
6. Visitors leave wishes (profanity filtered, rate limited, creator can hide).
7. Insights: views, unique visitors, daily series, wishes.
8. Admin: users, pages, takedown.

## Non-functional
- Mobile first, `prefers-reduced-motion` respected.
- All inputs validated with Zod on both client and server (schemas in `src/shared`).
- Rate limits per route (see docs/RATE_LIMITS.md).
- Images compressed on client, uploaded with server-signed Cloudinary params.
- Max 12 images per page, message <= 1200 chars, wish <= 280 chars.
- Languages: English, Hinglish, Hindi.

## Out of scope (v1)
Payments, custom domains, OAuth, real-time wishes. See docs/FUTURE_SCOPE.md.
