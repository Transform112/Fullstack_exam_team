# Research notes: Custom Occasion Page Generator

## Scope and evidence

This document summarizes product and technical research **from the material supplied with this project**. It is not a record of interviews, usability tests, or a survey. The repository currently contains a short `README.md` and a proposed `workflow.md`; it does not yet contain an implemented application. The exam brief is `PS2_Custom_Occasion_Page_Generator.pdf` (20 pages, supplied separately). Requirements below come from that brief; implementation choices are identified as proposals from `workflow.md`.

## Product problem and audience

The product lets a **creator** enter an occasion, recipient, message, language, and media, then publish a personal, animated page at `/w/:slug`. A **viewer** opens that link, experiences the page, and may leave a wish. An **admin** can moderate pages and wishes. The brief emphasizes the first few seconds of the viewer experience, mobile presentation, and a working data-backed product (brief pp. 4–7).

| Audience | Main need | Journey to support |
| --- | --- | --- |
| Creator | Make a personal page quickly and share it confidently | Sign in → six-step wizard → preview → publish → link/QR → manage page |
| Viewer | Enjoy a fast, emotional experience on a phone | Open link → countdown/password if applicable → story → finale → optional wish |
| Admin | Keep public content usable and safe | Inspect pages/users → disable a page or moderate wishes |

The role permissions and the walkthrough are specified in the brief (pp. 5–8). Do not infer real user preferences from this example scenario.

## Findings that drive the build

| Finding | Evidence | Resulting design decision |
| --- | --- | --- |
| Visual quality is central to evaluation: generated-page motion has 25 marks, and templates have 12. | Brief pp. 4, 18–19 | Build three templates with different layouts and animation behavior, then test the actual generated page on mobile. |
| The form must produce a page from stored data rather than hand-built HTML for each recipient. | Brief pp. 5, 19 | Use one page data model and a template registry. Render draft preview and public page from the same template components. |
| The six wizard steps and server validation are P0. Preview and autosave are P1. | Brief pp. 6–8 | Design step schemas first; allow incomplete drafts but require a complete publish payload. |
| Media upload and a reliable share URL are P0. Cloudinary/S3 limits are explicit. | Brief pp. 7, 12–13 | Upload directly with signed parameters; verify registered assets on the server; keep slugs stable after publication. |
| English, Hinglish, and Hindi copy are P0, including a Devanagari font. | Brief pp. 6, 14 | Store copy by locale key and test names written in Hindi script under every language setting. |
| A countdown and password gate are P1, but scheduled content must not leak through the public API. | Brief pp. 7, 12–13 | Enforce lock decisions on the server before serializing page content. |
| Auto-deploy, AI suggestions, and microphone interaction are bonuses. | Brief pp. 7, 14, 19–20 | Complete the app-hosted `/w/:slug` route before bonus work. |

## Proposed architecture to validate

`workflow.md` proposes a single Next.js App Router application with TypeScript, MongoDB/Mongoose, Cloudinary, JWT in an httpOnly cookie, and Route Handlers under `/api/v1`. It also proposes MongoDB-backed rate limits and view deduplication, optimistic draft revisions, and a single renderer for preview and public pages. These are **team design proposals**, not implementation facts or explicit mandates of the brief. The brief allows Next.js Route Handlers or a separate Express backend (pp. 15–16).

The proposed rendering flow is: creator input → validated draft in MongoDB → publish validation and unique slug → public route checks status/reveal/password → template renders allowed data. Locked responses must contain only the limited teaser fields; public responses must omit hashes, owner identifiers, and private account data (brief pp. 11–13; `workflow.md` §§2, 5–6).

## Design and test questions

1. Can a new creator complete all six steps and understand which fields are needed to publish? Check step errors, save feedback, and recovery after refresh.
2. Do the three templates look structurally different with the **same** content? Compare hero, gallery, type, and finale on a 360 px screen.
3. Does the public route hide all message and media fields before `revealAt` or before password unlock? Inspect the API response, not only the screen.
4. Do one-photo pages, mixed portrait/landscape media, Hindi names, blocked autoplay, slow connections, and reduced motion remain usable? These are explicit edge cases (brief p. 13).
5. Do WhatsApp previews show the right recipient and image without revealing locked content? Check a live link and its OG response.
6. Can each team member explain one implementation area in the viva? The brief says unexplained AI-generated code receives no credit (brief pp. 3–4, 19).

## Sources and limits

- `PS2_Custom_Occasion_Page_Generator.pdf`, supplied exam brief, especially pp. 4–19: requirements, examples, API, database, evaluation rubric.
- `workflow.md`, local planning document: proposed stack, detailed schema, API behavior, seed plan, and implementation choices.
- `README.md`, local repository summary.

No external products, libraries, performance claims, or user behavior have been independently evaluated in this document. Research findings should be updated when prototypes, user feedback, or measured performance become available.
