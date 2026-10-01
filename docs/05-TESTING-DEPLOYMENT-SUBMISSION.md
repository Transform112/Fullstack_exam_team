# 05 - TESTING, DEPLOYMENT AND SUBMISSION

Project: Wishly
Prerequisite: finish file 03 PH5 for the baseline. Read the test matrix earlier and implement tests beside each owning feature. This file completes the missing release plan referenced by files 01 to 04.

Reviewed against the requirement PDF and root workflow.md on 2026-10-01. All boxes below are intentionally unchecked: a documentation review is not evidence that the application works.

## SECTION 1. TEST ENVIRONMENT AND EVIDENCE

- Owner B maintains Vitest logic/integration tests; F maintains Playwright creator flows; M verifies templates/mobile/accessibility; D verifies Cloudinary, OG and deployment.
- Use a dedicated Atlas test database with transaction support, separate Cloudinary test assets and isolated users. Never run destructive tests, fake clocks, limit flooding or database failure simulations against production.
- Install Playwright browsers during setup with `npx playwright install`. Mock external failures in unit tests; verify one real signed upload separately. Use production `npm run build` and `npm run start` for browser/performance release checks.
- Each result records test id, date, command or browser procedure, environment/URL, pass/fail and report location in the release PR or README verification section. Never commit secrets, auth cookie jars or screenshots containing credentials.
- On Windows use curl.exe. Mutations include Origin matching NEXT_PUBLIC_APP_URL. Port changes require the same origin change in config and requests.
- A failure blocks its checkpoint. After three unsuccessful fixes, record the exact blocker and attempted fixes in DECISIONS.md and notify the team. Do not mark a skipped test passed.

## SECTION 2. AUTOMATED AND MANUAL TEST MATRIX

Use Vitest for logic and API integration tests; Playwright for user flows and network-payload checks. Assertions below apply to JSON, HTML/RSC, metadata and OG where applicable, not just the visible UI.

| ID | Owning step / coverage | Required assertion |
| --- | --- | --- |
| T-01 | P1-01, AUTH-1 | Register/login/logout/me work; duplicate email is 409; weak password is 400; wrong password and unknown email share the same error; no passwordHash response; bcrypt stored hash. |
| T-02 | P1-02, AUTH-2, permissions | Anonymous creator routes redirect and APIs give 401; inactive users are rejected on their next request; USER admin requests give 403; seeded ADMIN works; self-deactivation fails. |
| T-03 | P1-04, roles, rule 11 | Second creator cannot read/edit/delete another page; owner can; admin deletion/insights/moderation are permitted but owner-only PATCH is not. Owner serialization excludes hashes; public serialization excludes ownerId/email/ipHash/visitorId/deploy. |
| T-04 | AR-08, P1-01, P4-06, rule 8 | Check every file 02 rate bucket at limit and limit+1. Login sixth/15 min and unlock sixth/10 min fail; fourth wish/page/hour fails. Assert Retry-After and remaining headers, bounded duplicate-key retry, failure policies, trusted proxy IP handling and window rollover with fake time. |
| T-05 | P1-04, P2-07, FORM-2 | Two atomic PATCHes with one rev yield one success and one 409; no lost edits. Upload/reorder/autosave queue refreshes rev. Refresh/back preserve draft; offline retry resumes; conflict preserves local data. localStorage contains no password/token or another account's mirror. |
| T-06 | P1-06, P2-05, MEDIA-1/2, rules 4/9 | Real signed direct browser upload succeeds and no secret leaks. Reject invalid MIME/format, image >8 MB, video >50 MB or >60 s, foreign folder, 16th image and third video. Concurrent registrations cannot exceed counts; repeated registration is idempotent. Compression, progress, captions, reorder, delete and memory linking persist. |
| T-07 | P1-07, GEN-1, rules 1/2/5 | Missing occasion/name/message/image/template cannot publish; enforce name/message/memory/media maxima and CUSTOM label. Forced slug collision retries boundedly; two pages get different slugs; concurrent first publishes of one page return the same persisted slug. Editing/republishing keeps slug; stale publish cannot overwrite disable. |
| T-08 | P1-05, P4-05, PAGE-3, rule 6 | Test just before/at/after revealAt with fake server time. Before reveal, exact scheduled projection only; no messages, media, memories or theme in anonymous JSON/HTML/RSC. Advancing only the client clock never unlocks; refresh after server time passes does. No cron required. |
| T-09 | P4-06, PAGE-4, rule 7 | Wrong password fails; correct password sets secure/httpOnly/SameSite cookie and opens unchanged page for 2 h. Expired, malformed, wrong-page and old-revision tokens fail; password change/relock/disable is respected on the next request. Owner/admin preview bypass never changes anonymous or OG responses. |
| T-10 | P4-04, GEN-3 | Public live OG uses name/photo. Scheduled/password OG is teaser-only even for owners/admins. Unknown/draft/unpublished/disabled metadata and OG expose no recipient details/media. Check private, no-store and Next.js cache opt-outs on all states; switching an open page to locked does not serve cached content. |
| T-11 | P4-07/09, DASH-2, rule 10 | Many simultaneous requests using one established visitor cookie count once in 30 min. At expiry count again even if TTL cleanup lags; after TTL deletion lifetime unique stays unchanged. Owner/locked views add zero. Transaction retry/failure leaves leases, page totals and UTC daily stats consistent; insights fills 30 days with zeros. |
| T-12 | P4-08/09, PAGE-5, permissions | Viewer/creator post within limits; signed-in ADMIN posting is rejected per file 01. Disabled wall/locked pages reject access; hidden wishes never appear publicly. Owner/admin may delete; another creator may not; wrong-page wish id fails; concurrent delete decrements once and never below zero. |
| T-13 | AR-06/10, security, rule 3 | HTML, malformed tags, script/event payloads, entities and Hindi text are cleaned safely and rendered as React text. No user dangerouslySetInnerHTML. Invalid JSON/IDs return controlled errors. Missing/null/foreign Origin mutation fails; correct Origin passes. Enforced CSP permits actual app assets without unexpected violations. Logs/errors have request IDs, no secret or stack leakage. |
| T-14 | P4-01/11, DASH-1, ADM-1, permissions | CRUD/duplicate/unpublish works; duplicate draft has no slug/hash/views/wishes. Disable blocks all public content; enabling restores prior lifecycle, not an unpublished page to live. Delete removes related database records; shared assets survive; unshared assets are cleaned or failed cleanup is reported for retry. Template activation requires ADMIN. |
| T-15 | P2-01/08, FORM-1 | Six steps, validation, keyboard focus, back/next, draft refresh and review/generate work. Flush pending saves before review. Preview updates without saving; maximum messages/memories enforced; share link returned by publish opens. |
| T-16 | P3-11/16, TPL-1/2, FORM-3 | Same data yields three distinct layouts/fonts/motion; birthday/anniversary/custom decorations differ; preview uses real renderer and no tracking, music, intro gate or live wishes mutation. Only chosen template chunk loads. |
| T-17 | P3-15, LANG-1, edge cases | Locale key sets match; all UI and aria copy translates. Hindi name with English language and full Hindi page have correct glyphs/graphemes; long names/messages do not overflow. |
| T-18 | P3-18, PAGE-1/2, edge cases | One image renders without empty slots; mixed orientations reserve aspect ratios; no video/memories hides sections; 15 images/2 videos works. Slow 3G uses progressive images/lazy video. Blocked autoplay leaves music/video controls usable; sound starts only after interaction. |
| T-19 | P3-17, P5-01, PERF-1 | Test 360, 390, 768 and 1280 px with no overflow/overlap, touch targets >=44 px, safe areas and denied gyro. All sections flow in order. Reduced motion removes parallax/tilt/loops/3D/confetti and video autoplay. Lighthouse mobile >=80 on all templates and a 9-image/1-video page; attach reports. |
| T-20 | P4-14, edge cases | Unknown slug gives designed 404; disabled/unpublished page gives unavailable UI; error boundary offers Retry without stack trace; loading/empty/error/success states work on all data screens. |
| T-21 | AR-11, seed | Run seed twice with no duplicate errors, no unrelated data lost and no production reset. Two roles, three templates, three open sample links plus lock fixtures exist; asset URLs and dimensions are real; seeded stats/wishes/daily data are internally consistent. |
| T-22 | AR-05, deploy | A failed initial MongoDB connection can recover on a later request; health and normal handlers return controlled failures, never hang or expose URI. Cold start and production health succeed once connectivity returns. |

CHECKPOINT QA-01: baseline verification.
- [ ] Done
- VERIFY: T-01 to T-22 pass or a skipped P1 has a specific documented limitation approved by the team. P0/security/data-integrity failures cannot be waived. `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build` and `npm run test:e2e` pass with reports. Do not call an unrun check passed.

## SECTION 3. DEPLOYMENT AND RELEASE

1. D confirms the agreed Node version, lockfile, .env.example comments, Vercel Node runtime, Atlas indexes/transaction support and least-privilege credentials. Configure production and preview independently; bonus secrets are optional.
2. Deploy the release commit from main through the team's reviewed PR. Required baseline is the single Next.js app, not a separate Express service. Seed production non-destructively; never use the test reset there.
3. Check HTTPS health, registration/login/logout, creator ownership, real media upload, wizard publish, anonymous public view, lock/password, QR, wishes and admin disable. Recheck CSP/Origin/cookie/no-store headers on the deployed origin and verify OG with a real shared link.
4. Record three live sample links: Neon Night Birthday Hinglish, Royal Gold Anniversary English, Pastel Dream Birthday Hindi. All open without a creator login; locked fixtures are additional test links, not substitutes for the three samples.
5. Preserve the previous healthy deployment for rollback. On failed release smoke checks, roll back using Vercel deployment controls, record the failure and leave this checkpoint unchecked; do not reset git or destroy production data.

CHECKPOINT QA-02: deployed smoke checks.
- [ ] Done
- VERIFY: health is 200, release smoke checks pass on the recorded deployed URL, three sample links work anonymously and live OG/QR sharing works. If hosting is genuinely unavailable, document the PDF-permitted local fallback and prove fresh-machine setup instead; do not claim live verification.

## SECTION 4. ACCEPTANCE AND HANDOFF

1. F executes file 01 SECTION 5 steps 1 to 10 on the release build with 9 photos and a 20-second video. Choose a future date/reveal a few minutes ahead and record local timezone plus stored UTC time; October 14 is an illustrative date, not a fixed test dependency.
2. M records a mobile/emulated-phone segment opening the shared link through intro, story, wishes and finale. Include all three templates and language switching. D records share kit, lock/password and admin moderation.
3. Produce a 3-5 minute voiced demo showing every P0 end to end. Include the mobile segment and note unfinished P1/bonus honestly. Make video access available to the evaluator.
4. README follows the PDF template: team/roll numbers/GitHub/ownership; frontend URL and backend URL (same origin, API under /api/v1); video; stack; checked features; architecture; reproducible setup; test credentials; API table; three sample links; known limitations and verification evidence.
5. Verify a fresh clone with the pinned Node version: `npm ci`, copy .env.example to .env, fill credentials locally, `npm run seed`, `npm run dev`. Also test build/start and health. No undocumented global tools, .env values or pre-existing database edits are allowed.
6. Keep 10-20 actual important prompts in PROMPTS.md, not unused example prompts. SPEC.md matches current models/routes/revision contract. `git shortlog -sn` shows each member; everyone can explain their module, limiter, lock rules and atomic analytics.
7. Check tracked files and history for real secrets; demo credentials are intentional public fixtures, not provider credentials. Rotate any exposed secret before release. Confirm evaluator repository/video access and submit through the announced channel.

CHECKPOINT QA-03: acceptance and submission readiness.
- [ ] Done
- VERIFY: acceptance steps 1-10 pass without manual database edits; fresh-clone setup succeeds; repo, README, .env.example, video/mobile segment, credentials, PROMPTS.md and three samples are complete. Mark OV-03 only now. P2 features are not prerequisites for this baseline gate.

## SECTION 5. OPTIONAL BONUS DEPLOY (BN-03)

Do this only after QA-01 to QA-03. The required /w/[slug] baseline already exists; do not relabel it as a completed deploy bonus.

Preferred lower-risk PDF alternative: deploy a separate minimal renderer to Vercel and return its slug URL. It fetches the same public API and preserves scheduling/password/unavailable access. Document this as a pre-deployed renderer, not a newly built standalone site. Cross-origin credentialed password unlock needs an explicitly tested cookie/auth design; never embed a page password, JWT or private content in renderer files. If the separate renderer cannot honor a page's protections, reject bonus deploy for that page with a clear error and keep the baseline link.

For actual per-page deployments, use provider APIs only after reading current official docs. Use a prebuilt renderer plus public data rather than running unbounded builds inside a Vercel request. EP-B1 and EP-B2 verify owner/admin, validate input, limit requests, persist provider id/state/url and poll with timeouts/retries. Provider secrets remain server-only. Do not statically export locked content: reject protected/scheduled pages unless an equivalent server gate exists. Document that standalone exports may remain public after source edits/unpublish/disable unless revocation is implemented.

CHECKPOINT QA-B1: optional deploy verified.
- [ ] Done
- VERIFY: BN-03 returns a real live renderer/deployment URL; loading/error/ready states work; provider failure and unauthorized requests are tested; protection restrictions and stale-copy limitations are disclosed. Mark DEPLOY-1 and acceptance step 11 only when demonstrated. Unattempted bonus remains unchecked and recorded in README.

If BN-01 or BN-02 is added, re-run affected baseline tests and production smoke checks before submission. Verify mic permission denial/stream cleanup and Gemini timeout/output/limit handling; do not let optional work regress a passing baseline.

## SECTION 6. FINAL GATE

- [ ] QA-01 baseline tests passed with evidence
- [ ] QA-02 live deployment verified or explicit tested local fallback documented
- [ ] QA-03 acceptance and all submission artifacts verified
- [ ] Every P0 is complete; skipped P1 items remain unchecked and are documented
- [ ] Bonuses either verified individually or explicitly listed as not implemented

END OF FILE 05