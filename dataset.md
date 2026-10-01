# Dataset and seed-data specification

## Status and purpose

This is the **planned data contract**, not an inventory of existing records. At the time of writing, the repository has no models, seed script, database export, or live sample pages. The exam brief defines the core MongoDB collections (pp. 11–13); `workflow.md` adds operational collections for rate limits and analytics (§§3–4). Any sample names and content below are fictional test fixtures.

The dataset must support creators, public wish pages, three templates, wishes, and view analytics. Store page content as data; render it with a template component. Store media in Cloudinary and keep only references and verified metadata in MongoDB.

## Core collections

| Collection | Key fields | Required indexes and relationships |
| --- | --- | --- |
| `users` | `name`, normalized `email`, `passwordHash`, `role` (`USER`/`ADMIN`), `avatar?`, `isActive` | Unique email. A user owns many pages. |
| `templates` | `id`, `name`, `description`, `previewImage`, `supportedOccasions[]`, `defaultPalette`, `fonts`, `isActive` | Unique `id`. Seed at least three active, distinct templates. |
| `pages` | See detailed shape below | Index `(ownerId, createdAt)`; unique **partial** index on `slug` for published pages with a string slug. Drafts have no slug. |
| `wishes` | `pageId`, `name`, `message`, `emoji?`, `ipHash`, `isHidden`, `createdAt` | Index `(pageId, createdAt)`. Delete or hide with moderation; cap message at 280 characters. |

`ownerId` and `pageId` are MongoDB ObjectId references. Email normalization, `createdAt`, and `updatedAt` should be handled consistently by the models and validation layer. A partial unique slug index is an implementation choice to permit multiple drafts without slugs.

### Page document

| Field | Type / allowed values | Rule |
| --- | --- | --- |
| `ownerId` | ObjectId → `users` | Required for creator ownership. |
| `slug` | String | Set at first publish; unique and permanent thereafter. |
| `status` | `DRAFT`, `SCHEDULED`, `PUBLISHED`, `UNPUBLISHED`, `DISABLED` | Drafts may be partial. Compute lock from `revealAt` on each public read. |
| `occasion` | `BIRTHDAY`, `ANNIVERSARY`, `WEDDING`, `FAREWELL`, `CONGRATS`, `FRIENDSHIP`, `CUSTOM` | Required to publish; `customOccasionLabel` when `CUSTOM`. |
| `occasionDate`, `revealAt` | Dates or null | `revealAt` is optional; store an unambiguous instant and display in the chosen timezone. |
| `recipient` | `{ name, nickname?, relation?, age? }` | Name required to publish, max 40 characters. |
| `from`, `language` | String; `ENGLISH`, `HINGLISH`, `HINDI` | Language selects localized template copy; it does not translate user messages. |
| `messages` | Array of strings | 1–5 to publish, each max 600 characters. |
| `memories` | Array of `{ title, date?, description?, mediaId? }` | Optional, max 8; `mediaId` must refer to a page media item. |
| `media` | Array of `{ id, type, url, publicId, w?, h?, duration?, caption?, order }` | At least one image to publish; max 15 images and 2 videos. Verify asset ownership, type, size, and duration on the server. |
| `theme` | `{ templateId, accent?, font?, music?, decorations? }` | `templateId` must identify an active template. |
| `settings` | `{ passwordHash?, wishesWall, showViews, allowDownload? }` | Hash the optional page password; never return the hash publicly. `allowDownload` is an optional extension from `workflow.md`. |
| `ogImageUrl`, `thumbnailUrl` | Strings | Derived URLs for sharing and dashboard; generic OG content while locked. |
| `stats` | `{ views, uniqueViews, wishes }` | Nonnegative counters updated atomically with `$inc`. |
| `deploy` | `{ provider, deploymentId, url, state, lastDeployedAt }` | Optional bonus feature only. |
| `rev`, `createdAt`, `updatedAt` | Integer and dates | `rev` supports the proposed optimistic autosave conflict check. |

The brief permits jpg/png/webp/heic images up to 8 MB each and mp4 video up to 50 MB and 60 seconds (p. 7). Client compression is useful, but the server must enforce the limits. HTML in user-supplied strings should be stripped before storage or safely rejected; public rendering must escape content (brief pp. 12, 15).

## Operational collections proposed in `workflow.md`

| Collection | Fields | Purpose and index |
| --- | --- | --- |
| `pageViews` | `pageId`, `visitorId`, `lastCountedAt`, `expiresAt` | Unique `(pageId, visitorId)`; atomically claim another count only after 30 minutes. TTL can clean up old records. |
| `pageVisitors` | `pageId`, `visitorId` | Unique `(pageId, visitorId)` to count unique visitors. |
| `dailyStats` | `pageId`, UTC `date`, `views` | Unique `(pageId, date)` for views-over-time charts. |
| `ratelimits` | `key`, `count`, `expiresAt` | Unique `key`; TTL on `expiresAt` for fixed-window counters. |

**Implementation note:** A TTL index deletes whole documents asynchronously and does not by itself enforce the 30-minute rule. Use an atomic conditional update of the visitor's last count time before incrementing the page counter. A fixed 30-minute bucket would allow another count at the bucket boundary even if only seconds had passed. The 30-minute counting rule comes from the brief (p. 13); the extra collections are a proposal in `workflow.md`.

Use a random visitor ID in a cookie for view deduplication. Hash IP addresses with a server secret when needed for wish abuse limits; do not put raw IPs in seed data. A `ratelimits` key should encode its bucket and window. Publish, view, wish, and unique-visitor counter changes should be atomic and idempotent where applicable.

## Minimum seed matrix

The seed script should be repeatable (upsert by stable email/template ID/sample key) and should create fictional data only. The sample pages should use media that the team has rights to use, and every media reference should point to a real asset in the configured Cloudinary account.

| Fixture | Role / template | Occasion | Language | What it demonstrates |
| --- | --- | --- | --- | --- |
| `admin@demo.com` | `ADMIN` | — | — | Admin sign-in and moderation. |
| `creator@demo.com` | `USER` | — | — | Creator dashboard and wizard. |
| `sample-neon-birthday` | `neon-night` | `BIRTHDAY` | `HINGLISH` | Published page, lively hero, gallery and sharing. |
| `sample-pastel-birthday` | `pastel-dream` | `BIRTHDAY` | `HINDI` | Devanagari text, a one-photo layout, mobile rendering. |
| `sample-royal-anniversary` | `royal-gold` | `ANNIVERSARY` | `ENGLISH` | Different composition, mixed image orientations. |

This meets the brief's minimum of three sample links, one per template, Birthday plus Anniversary, and at least two languages (brief p. 17). `workflow.md` proposes all three languages. Seeded passwords must be development/demo credentials, never production secrets; document the actual seeded credentials in the README only after the seed script exists. Do not commit database URIs, Cloudinary secrets, or real personal photos.

## Validation and access rules

1. Draft creation accepts partial data. Publish revalidates the complete page, including template, messages, and at least one verified image.
2. Slug collisions are resolved by generating a new suffix and retrying against the unique database index. Editing content preserves the slug.
3. Public reads of scheduled pages return only a lock flag, recipient first name, and `revealAt`. Password-protected reads return no private content until a server-verified unlock token is present.
4. Public payloads omit `passwordHash`, `ownerId`, creator email, IP hashes, and internal moderation fields.
5. Wishes are limited to three per visitor per page per hour and 280 characters; filter abusive content. Owner/admin access governs deletion.
6. Owners do not count their own previews as views. View and wish counts should remain consistent with the event collections.
7. Deleting a page also handles its wishes, analytics records, and Cloudinary assets. Test the failure path so orphaned media can be identified.

These are requirements or direct consequences of the brief's business rules (pp. 12–13) plus implementation detail from `workflow.md`. Data should be checked again when models and routes are implemented.
