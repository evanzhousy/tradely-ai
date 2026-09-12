# Tradely E2E test cases

Source inventory date: 2026-09-12. Baseline commit: `c16a86f8287065212224d39cc32a6c64884c2c9d`.

This is the source-derived acceptance inventory for the current Tradely application. It contains a browser E2E matrix, a per-lesson sweep, a route inventory, and every test declaration found in the configured web and database test directories. **Execution status: NOT RUN for every case in this document.** Creating this inventory does not establish local, Preview, production, or provider success.

## Scope and execution contract

- Browser cases below are acceptance scenarios to execute, not an existing browser automation suite. `apps/web/vitest.config.ts` configures Node/jsdom unit, component and server tests; the root package has no browser E2E command.
- The automated appendix records source declarations, including parameterized and dynamically named templates. Its count is not the number of runtime-expanded tests or passing assertions. Linked tests are supporting coverage, not proof of a browser journey.
- Use current source as the oracle. Some older README/architecture passages describe three free lessons or older table counts. Current `content/course.ts` declares seven free lessons; all other syllabus lessons are paid. Current media is withheld when `mediaCurrent` is false.
- Record environment URL, commit/deployment, browser/version, viewport, locale, identity/access fixture, relevant feature flags (no secrets), timestamp, case ID, expected result, actual result and PASS/FAIL/BLOCKED/NOT APPLICABLE. Explain every blocked or inapplicable case.
- Browser evidence must include a GIF of the actual application or local component preview, identifying the environment, with a file link in the run report. Redact identity, learner text, tokens, payment details and signed media URLs. A component preview proves only its own UI boundary.
- For account, billing and learning writes, verify visible UI plus authorized server/persistence state. For provider-dependent cases, separately record real-provider evidence versus mocks. Never infer payment from query parameters, analytics, or an unlocked-looking component.
- Use isolated non-production users/databases and Stripe test mode for mutations. Production charges, refunds, grants, revocations, uploads and configuration changes require explicit scope authorization. The inventory itself authorizes no execution.

## Fixtures and test matrix

| Fixture | Required state |
| --- | --- |
| Anonymous | Fresh browser storage, no session; repeat with analytics accepted/rejected |
| Learner A / B | Distinct verified accounts, no paid access; independent progress |
| Member | Exact configured membership Price, active or trialing; separate inactive and wrong-Price variants |
| Pass owner | Verified non-revoked Course Pass; separate revoked variant |
| Manual access | Valid grant and a grant at/after expiry |
| Failure fixtures | Auth, database, billing, media or coach unavailable, injected in an isolated environment |
| Learning versions | Current active/submitted attempt, stale tab revision, retired active version and archived submitted version |
| Coaching | Disabled baseline; enabled eligible cohort and budgets only in approved provider test environment |

Run the critical journey on desktop Chromium and mobile-sized Chromium. Repeat navigation, auth return, learning input, focus, media and responsive cases on Safari/WebKit and Firefox where available. Use 1440×900 and 390×844 as baseline viewports; check narrow 320px and 200% zoom for overflow. Repeat localized controls in English and Simplified Chinese, keyboard-only input, reduced motion, and unavailable WebGL. Report unsupported browser infrastructure as a coverage gap.

P0 = access, identity, payments, privacy or saved-work integrity release gate. P1 = core functional acceptance. P2 = secondary presentation/operational coverage. Conditional features must be marked NOT APPLICABLE with the actual flag/content evidence when disabled; do not enable them solely to claim a pass.

## Browser and integrated acceptance cases

Each row supplies setup/action and expected observable outcome. Server-negative cases require a controlled request or fixture in addition to browser inspection.

### NAV — Discovery, navigation and content

| ID | Priority | Setup and action | Expected result |
| --- | --- | --- | --- |
| NAV-001 | P1 | Open `/`, use the main free-learning CTA. | Arrive at the beginner foundation entry; free research previews are separately discoverable. |
| NAV-002 | P1 | Open `/courses/tradingflow-foundations`; inspect all modules and lessons. | All 36 lessons in eight modules follow current syllabus order and metadata. |
| NAV-003 | P0 | Filter the catalog to free lessons. | Exactly the seven explicit free IDs appear, including late-course previews; ordering does not move access. |
| NAV-004 | P1 | Search by English and Chinese title; combine free/completion filters. | Results match localized metadata and all active filters; unknown/retired progress cannot create phantom lessons. |
| NAV-005 | P1 | Search for no matches, clear filters and search. | An understandable empty state appears; clearing restores the full catalog. |
| NAV-006 | P1 | Open a lesson from catalog, use next/previous navigation, browser back and reload. | Correct lesson and URL render; current access is enforced on each load. |
| NAV-007 | P1 | Open every legal/footer link and `/changelog`. | Correct content and navigation render; no dead links or overlapping controls. |
| NAV-008 | P1 | Open `/guides/`, every published guide, and its interactive examples. | Guide content, examples and course destinations match the guide registry; synthetic examples are labeled. |
| NAV-009 | P1 | Open unknown lesson, guide and page URLs. | A useful not-found outcome appears without protected content or a blank crash. |
| NAV-010 | P0 | Inspect TradingFlow practice and community outbound URLs. | Destinations match source; attribution contains no identity, Stripe identifiers, learner work or credentials; account separation is clear. |
| NAV-011 | P1 | Reload deep links directly and navigate between public and paid pages. | Server rendering and hydration agree; no stale protected content flashes. |

### AUTH — Authentication and account isolation

| ID | Priority | Setup and action | Expected result |
| --- | --- | --- | --- |
| AUTH-001 | P0 | Sign in with a valid email OTP, starting from a lesson return URL. | Verified account session is established and the local destination is restored. |
| AUTH-002 | P1 | Enter invalid email, wrong/expired OTP; resend after cooldown. | Safe recoverable errors, 30-second resend cooldown and no false signed-in state. |
| AUTH-003 | P1 | Change the email during OTP flow and retry. | The selected email is used; pending requests cannot start competing operations. |
| AUTH-004 | P0 | Complete Google sign-in from a lesson or pricing return. | Same-origin callback exchanges the verifier and establishes server-verified identity before return. |
| AUTH-005 | P1 | Cancel Google or simulate provider failure, then choose email. | Safe retry copy appears and email remains usable without leaking provider query details. |
| AUTH-006 | P0 | Use external, protocol-relative, malformed and encoded hostile return paths. | Redirect stays on an allowed local path. |
| AUTH-007 | P0 | Replay callback without initiating challenge, invalid/expired verifier, or forged cached cookie. | No authenticated server identity is granted; safe recovery is available. |
| AUTH-008 | P0 | Sign out, reload, then revisit saved/paid routes with cached cookies. | Session is invalid; account-specific work and protected content are no longer available. |
| AUTH-009 | P0 | Switch A to B while learning/coaching requests are pending. | UI clears A state and ignores late A responses; B cannot access A attempts/results. |
| AUTH-010 | P0 | Simulate auth outage and missing auth configuration separately. | Outage is not represented as an anonymous success; configured-disabled identity actions are unavailable while public content works. |
| AUTH-011 | P0 | Send cross-origin/cross-site auth requests and invalid auth paths. | Requests fail closed; same-origin valid auth responses are not cached and only auth cookies are forwarded. |

### ACCESS — Authorization

| ID | Priority | Setup and action | Expected result |
| --- | --- | --- | --- |
| ACCESS-001 | P0 | Open all free lessons anonymously and as an unpaid account. | Public explanations and anonymous practice work; persistence requires verified sign-in. |
| ACCESS-002 | P0 | Deep-link to every paid lesson anonymously and as unpaid A; inspect response/network. | Protected body, teaching data, answers and media are withheld; appropriate sign-in/purchase UI appears. |
| ACCESS-003 | P0 | Open paid content with exact-Price active/trialing membership. | Server grants access for both statuses. |
| ACCESS-004 | P0 | Repeat with inactive subscription or active subscription for another Price. | No member access is granted from an unrelated status/Price. |
| ACCESS-005 | P0 | Use a valid Course Pass while Stripe lookup fails. | Durable grant still unlocks the course without requiring subscription lookup. |
| ACCESS-006 | P0 | Use revoked pass or expired manual grant without valid membership. | Paid access is denied; unexpired manual grant works until its boundary. |
| ACCESS-007 | P0 | Fail Stripe lookup for a learner with no durable grant. | UI reports billing unavailable and offers recovery rather than asserting unpaid. |
| ACCESS-008 | P0 | Revoke access while a paid lesson is open; submit progress/learning/coaching requests. | Every server request rechecks access; cached UI cannot save or generate unauthorized work. |

### BILL — Pricing, checkout and recovery

| ID | Priority | Setup and action | Expected result |
| --- | --- | --- | --- |
| BILL-001 | P1 | Open `/pricing` as anonymous, unpaid, member and pass owner. | Actions reflect identity and entitlement; current contract displays USD 69/month membership and USD 49 one-time Course Pass. |
| BILL-002 | P0 | Start each offer in Stripe test mode and inspect the created Session. | Membership uses subscription mode and exact membership Price; pass uses payment mode and exact pass Price; branding and account match preflight. |
| BILL-003 | P0 | Double-click/retry checkout and customer creation. | Stable idempotency prevents duplicate customer/session creation within the intended retry generation. |
| BILL-004 | P0 | Try buying the same offer while already entitled. | Existing member/pass-owner actions do not create duplicate same-offer purchases. |
| BILL-005 | P0 | Complete a test Course Pass purchase and return, then reload clean `/pricing`. | Server verifies the paid Session and durable access survives removal of return query parameters. |
| BILL-006 | P0 | Forge success query parameters without a paid Session. | No entitlement is granted. |
| BILL-007 | P0 | Vary Session user, metadata user, customer, Price, entitlement, mode, status or paid state independently; add a second Price. | Every mismatch fails the exact verification contract and leaves access unchanged. |
| BILL-008 | P0 | Repeat the successful return callback. | Existing grant remains correct and no duplicate fulfillment occurs. |
| BILL-009 | P0 | Miss the payment return, then Restore purchase; include older paginated Sessions. | Server finds and verifies the owned purchase and persists the grant. |
| BILL-010 | P1 | Cancel checkout or return with invalid/missing Session ID. | No false purchase success; clear retry/recovery remains available. |
| BILL-011 | P0 | Disable new Course Pass checkout and repeat pricing, direct creation, paid return and restore. | New sales are blocked; verification, restore and existing grants continue working. |
| BILL-012 | P0 | Start checkout in local/production-config fixture and trusted Preview; inject an untrusted Preview host. | Callbacks use the correct trusted environment origin; untrusted host is rejected. |
| BILL-013 | P1 | Open Customer Portal for the mapped test customer and return. | Correct customer portal opens; refreshed access reflects authoritative subscription state. |
| BILL-014 | P0 | Refund/revoke a test pass via the documented dry-run/apply process, then restore. | Revocation retains original Session identity and restore cannot reactivate it; later new purchase uses a new generation. |
| BILL-015 | P1 | Inspect membership partner-benefit copy and Session metadata. | Separate fulfillment is described; metadata does not imply automatic TradingFlow account creation or shared access. |

### LEARN — Practice, grading and saved progress

| ID | Priority | Setup and action | Expected result |
| --- | --- | --- | --- |
| LEARN-001 | P1 | For each lesson, read explanation and complete guided and independent cases. | Stage order and approved evidence are correct; controls advance only after required actions. |
| LEARN-002 | P0 | Inspect initial page/client data and attempt to request future case or answer-key data. | Server-only keys and withheld future evidence are not exposed. |
| LEARN-003 | P1 | Change lab controls during explanation, then start independent practice. | Exploration remains local; independent evidence and grading are not changed by demo settings. |
| LEARN-004 | P0 | Enter numeric values including zero, boundaries, decimals, missing, NaN/nonfinite and wrong units. | Server parsing/tolerance and completeness match the unit contract; invalid input does not save a forged result. |
| LEARN-005 | P0 | Save a choice/text answer, reload and resume as the same account. | Saved state, evidence, hints and revision restore exactly. |
| LEARN-006 | P0 | Interrupt a successful save response, retry with the same command ID. | The decision is applied exactly once and the current server state is returned. |
| LEARN-007 | P0 | Start the same lesson simultaneously in two tabs. | Only one active attempt is created. |
| LEARN-008 | P0 | Submit competing answers from two tabs at the same expected revision. | One update wins; stale tab must load current state without overwriting the winner. |
| LEARN-009 | P0 | Attempt submission with unanswered requirements or unsaved text drafts. | Submission is blocked; no completion or mastery is fabricated. |
| LEARN-010 | P0 | Submit correct checkable independent work without hint; repeat with hint or prose criteria. | Only fully checkable, satisfied, unhinted work earns demonstrated; other completed work is practiced with written review distinguished. |
| LEARN-011 | P0 | Reload a submitted result after rubric changes and try to edit it. | Stored assessment is immutable and remains tied to original submitted evidence/version. |
| LEARN-012 | P1 | Retry practice after submission. | Alternate independent variant is selected; source-work snapshots retain their required variant. |
| LEARN-013 | P0 | Open retired active content and a cached earlier-version tab. | Explicit restart is required and preserves history; stale mutations cannot update retired work. |
| LEARN-014 | P0 | Open an archived submitted scenario after current lesson update. | Stored assessment remains visible with archive labeling; it does not certify the new version. |
| LEARN-015 | P0 | Create research packet → recap → audit as A; then inspect as B. | Same-user submitted source and exact variant are copied immutably; cross-account source access is denied. |
| LEARN-016 | P1 | Download submitted work as Markdown. | Export contains submitted worksheet and missing observations without unrelated account data. |
| LEARN-017 | P0 | Complete a lesson and reload catalog; simulate save failure and post-save refresh failure separately. | Completion requires server confirmation; save failure is not success, while a confirmed save survives a later refresh error. |
| LEARN-018 | P1 | Save video position for matching and changed content versions. | Only matching-version position resumes; stale timestamps do not seek into replacement content. |
| LEARN-019 | P0 | Open two lessons for one account and exercise both. | Attempts and progress remain independent; course completion is distinct from assessment status. |
| LEARN-020 | P1 | Practice anonymously and reload; then sign in. | Anonymous work is explicitly nonpersistent; no automatic migration or saved completion is implied. |
| LEARN-021 | P1 | Simulate database failure during load/save and recover. | Clear unavailable/retry state; no invented progress or silent loss represented as success. |

### LAB — Interactive graphics and replay

| ID | Priority | Setup and action | Expected result |
| --- | --- | --- | --- |
| LAB-001 | P1 | On every lesson lab, change each input/selection and use reset. | Diagram/table/copy agree with teaching data; reset restores that lab’s baseline. |
| LAB-002 | P1 | Use keyboard controls and English/Chinese labels for each lab. | Named native inputs remain operable; concepts do not rely solely on color or animation. |
| LAB-003 | P0 | Inject missing, mismatched or unauthorized teaching data. | Lab withholds invalid calculations/content; missing values do not become zero or invented conclusions. |
| LAB-004 | P1 | Play a lab demonstration and edit a control mid-play. | Manual input interrupts playback and updates visible values consistently. |
| LAB-005 | P1 | Replay contract map/session flow at each supported speed; seek, pause and reach close. | One monotonic clock synchronizes values and visuals; 2× is initial rate and final assessment snapshot is unchanged. |
| LAB-006 | P1 | Hide tab or scroll replay offscreen; return and use reduced motion. | Playback pauses appropriately; reduced motion disables autoplay and manual replay uses discrete checkpoints. |
| LAB-007 | P0 | Inspect network/analytics while replay runs. | No per-frame attempt writes or analytics; presentation never changes grading. |
| LAB-008 | P1 | Select/filter in 2D contract map then switch to 3D, save answer and force WebGL failure. | Selection/snapshot are shared; saving does not reset camera; 2D fallback retains selection. |
| LAB-009 | P1 | Inspect GEX table/3D distribution and change snapshot/slice. | Common scale, signed values and explicit missing observations agree across views. |
| LAB-010 | P0 | Compare OI dates/scopes and missing model values during session-flow replay. | Only cumulative volume changes; incompatible OI differences and missing modeled values stay unavailable. |

### MEDIA — Conditional media and delivery

| ID | Priority | Setup and action | Expected result |
| --- | --- | --- | --- |
| MEDIA-001 | P1 | Open every current-edition lesson with `mediaCurrent: false`. | Older video is withheld; current notes and interactive instruction remain available. |
| MEDIA-002 | P1 | With an explicitly activated media fixture, play, pause, seek, toggle captions and resume. | Video/caption identity matches the lesson and position saves only under authorized current-version rules. |
| MEDIA-003 | P0 | Request paid video/captions anonymously or via public asset paths. | Private paid media is unavailable; public posters do not reveal protected lesson bodies. |
| MEDIA-004 | P0 | With local signed-endpoint fixture, change user, asset, lesson, token or expiry; issue valid byte ranges. | Invalid requests fail closed; valid authorized range playback works. |
| MEDIA-005 | P0 | With R2 fixture, inspect authorized URL scope/expiry and direct private-object access. | Only exact authorized objects get bounded presigned URLs; unsigned object access fails. Presigned bearer URLs remain usable until expiry, not per-request identity checked. |
| MEDIA-006 | P1 | Fail media issuance/playback/caption loading. | Visible media recovery/error state; authorized written learning remains usable. |

### COACH — Optional AI formative coaching

| ID | Priority | Setup and action | Expected result |
| --- | --- | --- | --- |
| COACH-001 | P1 | Load practice with coaching disabled or learner outside enabled cohort. | Normal learning works; no generation is started. |
| COACH-002 | P0 | Start coaching on eligible saved work and complete two rounds. | Bounded feedback persists and resumes without altering deterministic lesson assessment. |
| COACH-003 | P0 | Double-submit or start concurrently from multiple tabs. | Database reservation/deduplication prevents duplicate provider execution and enforces shared quota. |
| COACH-004 | P0 | Exhaust account quota or global admission budget; cross midnight after reserving revision. | New admissions are blocked before provider call; reserved revision follows the documented reservation contract. |
| COACH-005 | P0 | Submit stale draft, unchanged revision, competing rationale or future independent case. | Invalid request is rejected without generation or assessment changes. |
| COACH-006 | P0 | Revoke access or switch accounts before coaching operation/retrieval. | Ownership and current access are enforced; no cross-account feedback/text exposure. |
| COACH-007 | P1 | Disable generation after results exist; retrieve and delete owned feedback. | Retrieval/deletion continue; deletion does not replenish quota. |
| COACH-008 | P0 | Delete while generation is running and deliver a late provider response. | Deleted text is not resurrected. |
| COACH-009 | P0 | Inject timeout, unknown provider outcome, crashed lease, invalid references or missing usage. | No blind automatic duplicate generation; indeterminate state is durable, missing usage is not zero cost, invalid feedback is rejected. |
| COACH-010 | P0 | Inspect consent/UI, telemetry and error logs during coaching. | Required consent/eligibility gates apply; learner prose, prompts, evidence and provider secrets are absent from telemetry. |

### PRIV — Analytics, privacy and observability

| ID | Priority | Setup and action | Expected result |
| --- | --- | --- | --- |
| PRIV-001 | P0 | Fresh visit, reject analytics, browse and interact. | Nonessential analytics/replay do not collect before consent or after rejection. |
| PRIV-002 | P0 | Accept consent, reload, revoke consent and reload again. | Preference persists; collection follows current consent and stops after withdrawal. |
| PRIV-003 | P0 | Sign in/out and switch accounts under accepted consent. | Identity association/reset follows verified session; no previous-user carryover. |
| PRIV-004 | P1 | Navigate through public/course/lesson pages and use success/failure actions. | Allowlisted events fire at correct boundaries without duplicate pageviews or premature completion. |
| PRIV-005 | P0 | Trigger a controlled browser/server error and inspect sanitized payload. | Useful bounded diagnostics contain no raw learner answers, email, auth verifier, tokens or signed media query. |
| PRIV-006 | P0 | Enable approved replay fixture and type in auth, learning and coaching inputs. | Sensitive text is masked/excluded; replay loading remains consent/config gated. |
| PRIV-007 | P1 | Fail/block analytics SDK or ingestion and continue learning. | Primary application actions continue; no analytics-induced crash. |
| PRIV-008 | P1 | Verify an approved event in the configured Tradely PostHog project. | Delivery and environment/release attribution are proven at the provider; empty dashboards alone are not health evidence. |

### UX — Accessibility, localization and secondary surfaces

| ID | Priority | Setup and action | Expected result |
| --- | --- | --- | --- |
| UX-001 | P1 | Keyboard through shell, skip link, menus, catalog, lesson and dialogs. | Visible focus, semantic names/landmarks and logical order; no focus trap or inaccessible essential control. |
| UX-002 | P1 | Switch English/Chinese, navigate and reload. | Preference persists and translated controls/metadata render; untranslated lesson prose has an explicit language note. |
| UX-003 | P1 | Repeat core pages on narrow viewports and at 200% zoom. | No clipped essential controls or unintended page overflow; readable layout and usable touch targets. |
| UX-004 | P1 | Set reduced motion and disable WebGL. | Core learning remains usable via nonanimated/2D paths; graphics failure never blocks access or grading. |
| UX-005 | P2 | Open `/house`; use views, layers, sunlight, quality, zoom/reset and interior navigation. | Visible controls change the intended model state; loading/busy state prevents conflicting actions. |
| UX-006 | P2 | Force house model/context load failure then Retry; leave and re-enter route. | Clear failure/retry state; fresh renderer recovers and prior resources/listeners are disposed. |
| UX-007 | P2 | Inspect homepage trading-hall background on desktop/mobile and reduced motion. | Background does not block content, input or primary navigation; fallback remains usable. |
| UX-008 | P1 | Inspect title/canonical/description/social tags, robots and sitemap for every public route. | Metadata matches current route registry; private dynamic lesson data is absent and sitemap URLs are canonical. |

## Per-lesson acceptance sweep

Execute L01–L07 for **each** row below, recording the lesson ID and variant in the result (for example `LESSON-option-contracts-L03-A`). These are parameterized acceptance checks, not claims that every lab has identical controls.

| Check | Action | Expected result |
| --- | --- | --- |
| L01 | Open anonymously/unpaid and with valid entitlement | Free/paid boundary matches metadata, including payload and direct requests |
| L02 | Read explanation, worked example and available lab | Content matches lesson concept, units and current authorized teaching data |
| L03 | Operate every lab control, reset and repeat in Chinese/keyboard/reduced motion | Visual and accessible representations agree; no grading side effects |
| L04 | Complete guided then independent variant A, including one invalid response | Required steps and validation work; evidence/answers are not revealed early |
| L05 | Save/reload/submit; compare numerical criteria and written-review status | Server result is accurate and durable; prose is not automatic mastery |
| L06 | Retry variant B, preserving any source-work binding | Alternative case or immutable source-bound variant follows server contract |
| L07 | Inspect completion, download, next lesson and locked state after access change | Progress is independent of mastery; exports and subsequent requests preserve ownership/access |

| # | Lesson ID / `/learn/` slug | Module | Title | Access |
| --- | --- | --- | --- | --- |
| 1 | `option-contracts` | contracts | What an option contract describes | Free |
| 2 | `option-rights` | contracts | Buyers, writers, rights and obligations | Free |
| 3 | `premium-payoff` | contracts | Price, premium, payoff and profit | Free |
| 4 | `expiration-settlement` | contracts | Expiration, exercise and settlement | Free |
| 5 | `quotes-orders-trades` | execution | A quote, an order and a trade | Paid |
| 6 | `execution-counterparties` | execution | Who buys and who sells in one execution? | Paid |
| 7 | `execution-side` | execution | Read execution side against a reliable quote | Paid |
| 8 | `flow-sentiment` | execution | How flow gets a bullish or bearish label | Paid |
| 9 | `validate-option-print` | execution | Validate one execution from its evidence | Paid |
| 10 | `session-flow-vs-structure` | flow | Why volume and open interest move differently | Paid |
| 11 | `trade-records` | flow | What a tape row represents | Paid |
| 12 | `unusual-activity` | flow | When activity is actually unusual | Paid |
| 13 | `option-strategies` | flow | One leg can belong to many strategies | Paid |
| 14 | `symbol-drawer` | flow | Read each source on its own clock | Paid |
| 15 | `delta` | exposure | Delta: a local price sensitivity | Paid |
| 16 | `gamma` | exposure | Gamma: how delta changes | Paid |
| 17 | `theta-vega-rho` | exposure | Time, volatility and rates | Paid |
| 18 | `implied-realized-volatility` | exposure | Implied and realized volatility | Paid |
| 19 | `volatility-surface` | exposure | Smile, skew and term structure | Paid |
| 20 | `iv-rank-percentile` | exposure | IV rank and percentile can disagree | Paid |
| 21 | `dex-dei-gex` | exposure | From delta equivalents to DEX and DEI | Paid |
| 22 | `gamma-exposure` | structure | Build and interpret a GEX snapshot | Paid |
| 23 | `gamma-regimes` | structure | Gamma regimes and the zero-gamma boundary | Paid |
| 24 | `structural-levels` | structure | Walls, concentration, max pain and distance | Paid |
| 25 | `charm-vanna` | structure | Exposure changes without a new trade | Paid |
| 26 | `audited-boundary` | research | Write a question the evidence can answer | Free |
| 27 | `symbol-universe` | research | Define who belongs in the comparison | Free |
| 28 | `rank-symbols` | research | Rank observations without inventing a prediction | Free |
| 29 | `rank-contracts` | research | Read a contract neighborhood | Paid |
| 30 | `point-in-time-research` | research | Test a pattern without hindsight | Paid |
| 31 | `cookbook-research-packet` | production | Build a reproducible research packet | Paid |
| 32 | `market-recap` | production | Write a supported recap | Paid |
| 33 | `audit-market-recap` | production | Audit and repair an unfamiliar recap | Paid |
| 34 | `portfolio-pnl` | portfolio | Positions, cost, cash and P&L | Paid |
| 35 | `portfolio-performance` | portfolio | Evaluate performance rather than balance growth | Paid |
| 36 | `portfolio-exposure` | portfolio | Aggregate portfolio exposure and its limits | Paid |

## Route source inventory

Every current route module is listed, including metadata endpoints and server-only boundaries. Dynamic lesson and guide paths must be expanded from their registries during execution.

- [__root.tsx](../../../apps/web/src/routes/__root.tsx)
- [api.auth.$.ts](../../../apps/web/src/routes/api.auth.$.ts)
- [api.lesson-media.$lessonSlug.$asset.ts](../../../apps/web/src/routes/api.lesson-media.$lessonSlug.$asset.ts)
- [auth.callback.ts](../../../apps/web/src/routes/auth.callback.ts)
- [auth.sign-in.tsx](../../../apps/web/src/routes/auth.sign-in.tsx)
- [changelog.tsx](../../../apps/web/src/routes/changelog.tsx)
- [cookies.tsx](../../../apps/web/src/routes/cookies.tsx)
- [courses.tradingflow-foundations.tsx](../../../apps/web/src/routes/courses.tradingflow-foundations.tsx)
- [guides.$guideSlug.tsx](../../../apps/web/src/routes/guides.$guideSlug.tsx)
- [guides.index.tsx](../../../apps/web/src/routes/guides.index.tsx)
- [house.tsx](../../../apps/web/src/routes/house.tsx)
- [index.tsx](../../../apps/web/src/routes/index.tsx)
- [learn.$lessonSlug.tsx](../../../apps/web/src/routes/learn.$lessonSlug.tsx)
- [pricing.tsx](../../../apps/web/src/routes/pricing.tsx)
- [privacy.tsx](../../../apps/web/src/routes/privacy.tsx)
- [risk-disclosure.tsx](../../../apps/web/src/routes/risk-disclosure.tsx)
- [robots[.]txt.ts](../../../apps/web/src/routes/robots[.]txt.ts)
- [sitemap[.]xml.ts](../../../apps/web/src/routes/sitemap[.]xml.ts)
- [terms.tsx](../../../apps/web/src/routes/terms.tsx)

## Existing automated test declarations

The source locations below enumerate all declarations in `apps/web/src/**/*.test.{ts,tsx}` and `packages/db/scripts/*.test.mjs`. Titles are preserved with suite context. **[parameterized]** means an `.each(...)`/similar template; `${...}` titles can also expand inside loops. Check the linked source for input rows, setup, assertions and mocked dependencies. Static source checks, jsdom components and mocked providers are not browser/provider acceptance evidence.

Run existing suites from the repository root with Node 24 and the repository pnpm version:

```bash
pnpm test
pnpm test:db
```

Additional release checks, when executing an implementation/release rather than just editing this inventory:

```bash
pnpm check-types
pnpm check
pnpm build
```

The integrated learning journey uses isolated PGlite with real application services and migrations, but mocked identity/billing/media. Provider acceptance and browser interaction therefore remain separate cases above. Billing preflight and media verification require the correct environment configuration and are not implied by the commands above.

Inventory totals: **119 test files; 672 source test declarations/templates; 108 acceptance rows; 36 lessons × 7 lesson checks** before browser/locale/fixture expansion.

### `apps/web/src/analytics/client-sdk.test.ts`

- [L41](../../../apps/web/src/analytics/client-sdk.test.ts#L41) — bundled PostHog browser SDK → provides web vitals and error observers without loading CDN scripts
- [L59](../../../apps/web/src/analytics/client-sdk.test.ts#L59) — bundled PostHog browser SDK → captures redacted automatic exceptions only while consented
- [L96](../../../apps/web/src/analytics/client-sdk.test.ts#L96) — bundled PostHog browser SDK → clears pending heatmap clicks and ignores interactions during withdrawal

### `apps/web/src/analytics/client.test.ts`

- [L45](../../../apps/web/src/analytics/client.test.ts#L45) — browser PostHog initialization contract → pins privacy, host, release, and capture settings
- [L162](../../../apps/web/src/analytics/client.test.ts#L162) — browser PostHog initialization contract → captures a route exception once the consented client is ready
- [L178](../../../apps/web/src/analytics/client.test.ts#L178) — browser PostHog initialization contract → does not capture a route exception after consent is withdrawn
- [L190](../../../apps/web/src/analytics/client.test.ts#L190) — browser PostHog initialization contract → contains synchronous SDK failures while capturing exceptions

### `apps/web/src/analytics/coaching-events.test.ts`

- [L9](../../../apps/web/src/analytics/coaching-events.test.ts#L9) — coaching privacy contract → registers %s with bounded metadata only **[parameterized]**
- [L35](../../../apps/web/src/analytics/coaching-events.test.ts#L35) — coaching privacy contract → blocks both inline and exported coaching surfaces from replay

### `apps/web/src/analytics/consent.test.ts`

- [L6](../../../apps/web/src/analytics/consent.test.ts#L6) — analytics consent → accepts only the persisted consent states
- [L13](../../../apps/web/src/analytics/consent.test.ts#L13) — analytics consent → creates a bounded same-site consent cookie for server observability

### `apps/web/src/analytics/events.test.ts`

- [L18](../../../apps/web/src/analytics/events.test.ts#L18) — analytics event boundaries → keeps public guide and preview events bounded and separate from account progress
- [L37](../../../apps/web/src/analytics/events.test.ts#L37) — analytics event boundaries → keeps learner answers and evidence out of learning events
- [L60](../../../apps/web/src/analytics/events.test.ts#L60) — analytics event boundaries → keeps a versioned exhaustive runtime event registry
- [L74](../../../apps/web/src/analytics/events.test.ts#L74) — analytics event boundaries → allows registered product events and PostHog system events only
- [L81](../../../apps/web/src/analytics/events.test.ts#L81) — analytics event boundaries → keeps the runtime property registry exhaustive
- [L87](../../../apps/web/src/analytics/events.test.ts#L87) — analytics event boundaries → maps concrete URLs to bounded route names
- [L95](../../../apps/web/src/analytics/events.test.ts#L95) — analytics event boundaries → removes query strings and fragments from captured URLs
- [L104](../../../apps/web/src/analytics/events.test.ts#L104) — analytics event boundaries → sanitizes URL-like PostHog system properties beyond the core fields
- [L121](../../../apps/web/src/analytics/events.test.ts#L121) — analytics event boundaries → preserves runtime attribution while pruning custom properties
- [L135](../../../apps/web/src/analytics/events.test.ts#L135) — analytics event boundaries → marks production, preview, and local traffic explicitly
- [L141](../../../apps/web/src/analytics/events.test.ts#L141) — analytics event boundaries → keeps expected billing states out of exception tracking

### `apps/web/src/analytics/exception-payload.test.ts`

- [L6](../../../apps/web/src/analytics/exception-payload.test.ts#L6) — serialized PostHog exception privacy → redacts chained errors and frame data while retaining symbolication fields
- [L54](../../../apps/web/src/analytics/exception-payload.test.ts#L54) — serialized PostHog exception privacy → bounds long exception chains, messages and stacks

### `apps/web/src/analytics/google.test.ts`

- [L33](../../../apps/web/src/analytics/google.test.ts#L33) — Google Analytics privacy boundary → detects browser Do Not Track values
- [L42](../../../apps/web/src/analytics/google.test.ts#L42) — Google Analytics privacy boundary → does not initialize or capture while Do Not Track is enabled
- [L48](../../../apps/web/src/analytics/google.test.ts#L48) — Google Analytics privacy boundary → starts in denied consent mode before an explicit grant
- [L64](../../../apps/web/src/analytics/google.test.ts#L64) — Google Analytics privacy boundary → stops an active stream when Do Not Track changes
- [L75](../../../apps/web/src/analytics/google.test.ts#L75) — Google Analytics privacy boundary → forwards only allowlisted custom properties

### `apps/web/src/analytics/posthog-config.test.ts`

- [L10](../../../apps/web/src/analytics/posthog-config.test.ts#L10) — PostHog host boundaries → uses the Tradely proxy host by default
- [L14](../../../apps/web/src/analytics/posthog-config.test.ts#L14) — PostHog host boundaries → trims trailing slashes without changing the host
- [L20](../../../apps/web/src/analytics/posthog-config.test.ts#L20) — PostHog host boundaries → supports an explicit control-plane fallback

### `apps/web/src/analytics/provider.test.tsx`

- [L160](../../../apps/web/src/analytics/provider.test.tsx#L160) — AnalyticsProvider consent readiness → defers PostHog initialization until explicit consent
- [L170](../../../apps/web/src/analytics/provider.test.tsx#L170) — AnalyticsProvider consent readiness → does not upgrade event-only consent to replay consent
- [L180](../../../apps/web/src/analytics/provider.test.tsx#L180) — AnalyticsProvider consent readiness → emits a sanitized previous-page leave before a new SPA page view
- [L210](../../../apps/web/src/analytics/provider.test.tsx#L210) — AnalyticsProvider consent readiness → queues a fast grant until PostHog is ready and captures it once
- [L264](../../../apps/web/src/analytics/provider.test.tsx#L264) — AnalyticsProvider consent readiness → replays consented events captured while PostHog is loading
- [L302](../../../apps/web/src/analytics/provider.test.tsx#L302) — AnalyticsProvider consent readiness → identifies a signed-in learner when PostHog becomes ready after GA4
- [L335](../../../apps/web/src/analytics/provider.test.tsx#L335) — AnalyticsProvider consent readiness → discards queued events when consent is withdrawn during SDK loading
- [L359](../../../apps/web/src/analytics/provider.test.tsx#L359) — AnalyticsProvider consent readiness → deduplicates authenticated sessions and resets identity when accounts change
- [L404](../../../apps/web/src/analytics/provider.test.tsx#L404) — AnalyticsProvider consent readiness → does not initialize PostHog for a denied choice
- [L423](../../../apps/web/src/analytics/provider.test.tsx#L423) — AnalyticsProvider consent readiness → syncs consent withdrawal from another browser tab
- [L446](../../../apps/web/src/analytics/provider.test.tsx#L446) — AnalyticsProvider consent readiness → swallows PostHog initialization failures without breaking consent
- [L464](../../../apps/web/src/analytics/provider.test.tsx#L464) — AnalyticsProvider consent readiness → contains PostHog event and identity failures without breaking UI actions
- [L501](../../../apps/web/src/analytics/provider.test.tsx#L501) — AnalyticsProvider consent readiness → keeps consent usable when browser storage is unavailable
- [L531](../../../apps/web/src/analytics/provider.test.tsx#L531) — AnalyticsProvider consent readiness → retries PostHog after a later consent grant

### `apps/web/src/analytics/redaction.test.ts`

- [L12](../../../apps/web/src/analytics/redaction.test.ts#L12) — analytics error redaction → removes personal, credential, and provider identifiers
- [L24](../../../apps/web/src/analytics/redaction.test.ts#L24) — analytics error redaction → copies bounded safe errors without mutating the source
- [L34](../../../apps/web/src/analytics/redaction.test.ts#L34) — analytics error redaction → keeps expected customer states out of server exception paging
- [L43](../../../apps/web/src/analytics/redaction.test.ts#L43) — analytics error redaction → redacts sensitive nested person properties without touching safe fields
- [L56](../../../apps/web/src/analytics/redaction.test.ts#L56) — analytics error redaction → labels Vercel production, previews, and local execution
- [L78](../../../apps/web/src/analytics/redaction.test.ts#L78) — redacts Neon user and session UUIDs from diagnostic text

### `apps/web/src/analytics/release.test.ts`

- [L11](../../../apps/web/src/analytics/release.test.ts#L11) — normalizeAnalyticsRelease → falls back to local when no release is configured
- [L16](../../../apps/web/src/analytics/release.test.ts#L16) — normalizeAnalyticsRelease → trims and bounds release metadata
- [L23](../../../apps/web/src/analytics/release.test.ts#L23) — normalizeAnalyticsRelease → uses the explicit fallback when the primary source is blank

### `apps/web/src/analytics/replay-privacy.test.ts`

- [L11](../../../apps/web/src/analytics/replay-privacy.test.ts#L11) — replay and heatmap privacy → keeps useful layout but masks user and media attributes
- [L36](../../../apps/web/src/analytics/replay-privacy.test.ts#L36) — replay and heatmap privacy → sanitizes replay page locations and drops request headers and bodies
- [L71](../../../apps/web/src/analytics/replay-privacy.test.ts#L71) — replay and heatmap privacy → merges heatmap URL buckets without retaining query strings or fragments
- [L89](../../../apps/web/src/analytics/replay-privacy.test.ts#L89) — replay and heatmap privacy → disables visual capture as well as event delivery when consent is withdrawn

### `apps/web/src/analytics/replay-recorder.test.ts`

- [L14](../../../apps/web/src/analytics/replay-recorder.test.ts#L14) — real recorder privacy → masks real snapshot text and attributes while blocking lesson and media subtrees

### `apps/web/src/analytics/route-analytics.test.tsx`

- [L42](../../../apps/web/src/analytics/route-analytics.test.tsx#L42) — consented route view scenarios → captures the current page when consent becomes ready without copying query parameters
- [L55](../../../apps/web/src/analytics/route-analytics.test.tsx#L55) — consented route view scenarios → classifies auth navigation and uses the latest locale on the next route
- [L73](../../../apps/web/src/analytics/route-analytics.test.tsx#L73) — consented route view scenarios → stops navigation capture after withdrawal and resumes on the current page

### `apps/web/src/analytics/server-timing.test.ts`

- [L9](../../../apps/web/src/analytics/server-timing.test.ts#L9) — server timing → rounds and bounds duration values
- [L16](../../../apps/web/src/analytics/server-timing.test.ts#L16) — server timing → captures only slow loader timings

### `apps/web/src/auth/client.test.tsx`

- [L5](../../../apps/web/src/auth/client.test.tsx#L5) — initializes the same-origin auth client during server rendering without a browser URL

### `apps/web/src/auth/fresh-start-migration.test.ts`

- [L12](../../../apps/web/src/auth/fresh-start-migration.test.ts#L12) — clears prelaunch learner data and creates provider-neutral foreign keys

### `apps/web/src/auth/google-sign-in.test.tsx`

- [L50](../../../apps/web/src/auth/google-sign-in.test.tsx#L50) — Google and email sign-in choices → starts Google without an email and uses a same-origin server callback
- [L67](../../../apps/web/src/auth/google-sign-in.test.tsx#L67) — Google and email sign-in choices → blocks conflicting sign-in requests and safely recovers from provider failure
- [L99](../../../apps/web/src/auth/google-sign-in.test.tsx#L99) — Google and email sign-in choices → shows a retry message after cancellation and keeps email login available

### `apps/web/src/auth/neon-session.test.ts`

- [L80](../../../apps/web/src/auth/neon-session.test.ts#L80) — Neon SDK session round trip with an isolated auth upstream → mints SDK-signed cookies and validates the same identity in a server function
- [L111](../../../apps/web/src/auth/neon-session.test.ts#L111) — Neon SDK session round trip with an isolated auth upstream → does not accept a forged cached identity when the opaque session is invalid
- [L134](../../../apps/web/src/auth/neon-session.test.ts#L134) — Neon SDK session round trip with an isolated auth upstream → does not authenticate a cached cookie alone after logout

### `apps/web/src/auth/neon.server.test.ts`

- [L54](../../../apps/web/src/auth/neon.server.test.ts#L54) — TanStack Start Neon Auth adapter → binds each server call to its own request and forwards only auth cookies
- [L77](../../../apps/web/src/auth/neon.server.test.ts#L77) — TanStack Start Neon Auth adapter → rejects auth POST from %s before contacting Neon **[parameterized]**
- [L90](../../../apps/web/src/auth/neon.server.test.ts#L90) — TanStack Start Neon Auth adapter → rejects a cross-site request even with a matching supplied Origin
- [L100](../../../apps/web/src/auth/neon.server.test.ts#L100) — TanStack Start Neon Auth adapter → routes same-origin auth calls through the SDK and prevents response caching
- [L126](../../../apps/web/src/auth/neon.server.test.ts#L126) — TanStack Start Neon Auth adapter → rejects an invalid proxy path %s **[parameterized]**
- [L140](../../../apps/web/src/auth/neon.server.test.ts#L140) — TanStack Start Neon Auth adapter → fails closed when authentication is not configured

### `apps/web/src/auth/oauth-callback.test.ts`

- [L84](../../../apps/web/src/auth/oauth-callback.test.ts#L84) — OAuth callback using the real Neon server toolkit → exchanges the verifier, sets every SDK cookie, and authenticates the next server request
- [L136](../../../apps/web/src/auth/oauth-callback.test.ts#L136) — OAuth callback using the real Neon server toolkit → rejects unsafe return destination %s **[parameterized]**
- [L147](../../../apps/web/src/auth/oauth-callback.test.ts#L147) — OAuth callback using the real Neon server toolkit → rejects a verifier without the initiating browser challenge
- [L158](../../../apps/web/src/auth/oauth-callback.test.ts#L158) — OAuth callback using the real Neon server toolkit → fails closed on %s without exposing upstream details **[parameterized]**
- [L176](../../../apps/web/src/auth/oauth-callback.test.ts#L176) — OAuth callback using the real Neon server toolkit → handles provider cancellation without forwarding its query details

### `apps/web/src/auth/redirect.test.ts`

- [L5](../../../apps/web/src/auth/redirect.test.ts#L5) — authentication return path → preserves a local lesson or checkout return
- [L15](../../../apps/web/src/auth/redirect.test.ts#L15) — authentication return path → rejects unsafe or looping destination %s **[parameterized]**

### `apps/web/src/components/access-panel.test.tsx`

- [L43](../../../apps/web/src/components/access-panel.test.tsx#L43) — visible billing availability tracking → captures an existing unavailable state when consent becomes ready
- [L66](../../../apps/web/src/components/access-panel.test.tsx#L66) — visible billing availability tracking → counts a new unavailable episode after recovery or renewed consent

### `apps/web/src/components/community-navigation.test.tsx`

- [L12](../../../apps/web/src/components/community-navigation.test.tsx#L12) — community action semantics → keeps navigational actions as links with a single accessible label
- [L22](../../../apps/web/src/components/community-navigation.test.tsx#L22) — community action semantics → keeps form actions as disabled native buttons while pending

### `apps/web/src/components/complete-lesson-button.test.tsx`

- [L46](../../../apps/web/src/components/complete-lesson-button.test.tsx#L46) — lesson completion outcomes → emits completion only after the server confirms the save
- [L69](../../../apps/web/src/components/complete-lesson-button.test.tsx#L69) — lesson completion outcomes → keeps a confirmed save successful when refreshing the page fails
- [L86](../../../apps/web/src/components/complete-lesson-button.test.tsx#L86) — lesson completion outcomes → reports a rejected save (%s) without a completion event **[parameterized]**
- [L110](../../../apps/web/src/components/complete-lesson-button.test.tsx#L110) — lesson completion outcomes → reports an unexpected save failure as a failed save and an exception

### `apps/web/src/components/course-catalog.test.ts`

- [L8](../../../apps/web/src/components/course-catalog.test.ts#L8) — curriculum discovery → retains the full curriculum order by default
- [L11](../../../apps/web/src/components/course-catalog.test.ts#L11) — curriculum discovery → finds free lessons by their access metadata, including late-course entry points
- [L24](../../../apps/web/src/components/course-catalog.test.ts#L24) — curriculum discovery → intersects completion and search without exposing unknown or retired records
- [L44](../../../apps/web/src/components/course-catalog.test.ts#L44) — curriculum discovery → searches localized lesson content and recovers from no matches

### `apps/web/src/components/free-lesson-paths.test.tsx`

- [L21](../../../apps/web/src/components/free-lesson-paths.test.tsx#L21) — free learning entry paths → renders a beginner sequence and separately labeled advanced previews

### `apps/web/src/components/landing-curriculum.test.ts`

- [L6](../../../apps/web/src/components/landing-curriculum.test.ts#L6) — lessonAccessLabel → labels preview lessons as free even when paid access is closed
- [L20](../../../apps/web/src/components/landing-curriculum.test.ts#L20) — lessonAccessLabel → distinguishes unlocked, unavailable, and paid states for member lessons

### `apps/web/src/components/landing-platform-widgets.test.tsx`

- [L19](../../../apps/web/src/components/landing-platform-widgets.test.tsx#L19) — landing widget demo → keeps the checklist, remaining count and progress rings consistent through completion and reset
- [L54](../../../apps/web/src/components/landing-platform-widgets.test.tsx#L54) — landing widget demo → preserves chosen checkpoints when switching languages and keeps AI availability explicit

### `apps/web/src/components/lesson-infographic-motion.test.tsx`

- [L140](../../../apps/web/src/components/lesson-infographic-motion.test.tsx#L140) — lesson illustration loops → animates the matching path at 2x and cancels it to the complete static diagram
- [L174](../../../apps/web/src/components/lesson-infographic-motion.test.tsx#L174) — lesson illustration loops → grows positive and negative exposure bars from zero in their declared directions
- [L188](../../../apps/web/src/components/lesson-infographic-motion.test.tsx#L188) — lesson illustration loops → repeats complete sequences with a quiet gap and keeps parallel starts from stacking
- [L214](../../../apps/web/src/components/lesson-infographic-motion.test.tsx#L214) — lesson illustration loops → cancels active effects offscreen and starts again when the diagram returns
- [L233](../../../apps/web/src/components/lesson-infographic-motion.test.tsx#L233) — lesson illustration loops → clears the scheduled cycle when scrolling away during the rest
- [L245](../../../apps/web/src/components/lesson-infographic-motion.test.tsx#L245) — lesson illustration loops → honors reduced motion and resumes only after the preference is disabled
- [L269](../../../apps/web/src/components/lesson-infographic-motion.test.tsx#L269) — lesson illustration loops → stops active and scheduled loops in hidden tabs, then resumes when visible
- [L290](../../../apps/web/src/components/lesson-infographic-motion.test.tsx#L290) — lesson illustration loops → pauses both active effects and pending cycles through the playback control
- [L311](../../../apps/web/src/components/lesson-infographic-motion.test.tsx#L311) — lesson illustration loops → keeps hover, touch, and keyboard navigation from restarting the loop
- [L324](../../../apps/web/src/components/lesson-infographic-motion.test.tsx#L324) — lesson illustration loops → drops an old subject's pending cycle when the subject changes
- [L336](../../../apps/web/src/components/lesson-infographic-motion.test.tsx#L336) — lesson illustration loops → uses the latest visibility entry when the browser batches intersection changes
- [L350](../../../apps/web/src/components/lesson-infographic-motion.test.tsx#L350) — lesson illustration loops → retains the full diagram when animation APIs are unavailable

### `apps/web/src/components/lesson-infographic.test.tsx`

- [L12](../../../apps/web/src/components/lesson-infographic.test.tsx#L12) — course card SVGs → gives every lesson its own diagram with a complete static state, localized description and authored motion
- [L48](../../../apps/web/src/components/lesson-infographic.test.tsx#L48) — course card SVGs → keeps numerical claims and sign conventions in the static fallback
- [L69](../../../apps/web/src/components/lesson-infographic.test.tsx#L69) — course card SVGs → uses unique accessible titles when several cards are rendered together

### `apps/web/src/components/pricing-actions.test.tsx`

- [L65](../../../apps/web/src/components/pricing-actions.test.tsx#L65) — PricingAccountActions → shows existing Course Pass ownership while new sales are disabled
- [L80](../../../apps/web/src/components/pricing-actions.test.tsx#L80) — PricingAccountActions → shows Restore Purchase independently of new-sale availability
- [L95](../../../apps/web/src/components/pricing-actions.test.tsx#L95) — PricingAccountActions → reports verified restoration even if refreshing access fails
- [L126](../../../apps/web/src/components/pricing-actions.test.tsx#L126) — PricingAccountActions → keeps an expected missing purchase separate from an unexpected exception
- [L149](../../../apps/web/src/components/pricing-actions.test.tsx#L149) — PricingAccountActions → tracks portal intent and its failure without claiming a redirect
- [L168](../../../apps/web/src/components/pricing-actions.test.tsx#L168) — PricingAccountActions → tracks %s checkout intent and unexpected failures **[parameterized]**

### `apps/web/src/components/video-player.test.tsx`

- [L35](../../../apps/web/src/components/video-player.test.tsx#L35) — lesson video tracking → tracks the first play once, then starts a new lifecycle for each lesson and revision
- [L66](../../../apps/web/src/components/video-player.test.tsx#L66) — lesson video tracking → allows a later consented play when the first play was not captured
- [L76](../../../apps/web/src/components/video-player.test.tsx#L76) — lesson video tracking → tracks completion on ended and never sends the protected media URL

### `apps/web/src/content/course.test.ts`

- [L10](../../../apps/web/src/content/course.test.ts#L10) — tradingFlowCourse manifest → offers a complete free foundation and three research previews while keeping all other lessons paid
- [L42](../../../apps/web/src/content/course.test.ts#L42) — tradingFlowCourse manifest → uses unique, contiguous lesson identities
- [L58](../../../apps/web/src/content/course.test.ts#L58) — tradingFlowCourse manifest → references only earlier lessons as prerequisites

### `apps/web/src/content/guides.test.ts`

- [L6](../../../apps/web/src/content/guides.test.ts#L6) — public guide catalog → has valid navigation, substantial public answers and original examples

### `apps/web/src/content/legal.test.ts`

- [L6](../../../apps/web/src/content/legal.test.ts#L6) — legal content → has substantive English and Chinese documents for every legal route
- [L28](../../../apps/web/src/content/legal.test.ts#L28) — legal content → privacy content names the core account, billing, and partner boundaries
- [L37](../../../apps/web/src/content/legal.test.ts#L37) — legal content → discloses masked replay, heatmaps, and retention in both languages

### `apps/web/src/content/lesson-content.test.ts`

- [L7](../../../apps/web/src/content/lesson-content.test.ts#L7) — lesson content → has a substantive written lesson for every manifest entry

### `apps/web/src/content/units/foundations.test.ts`

- [L9](../../../apps/web/src/content/units/foundations.test.ts#L9) — contract foundations revision → starts every case with identity and premium calculated from explicit execution units
- [L30](../../../apps/web/src/content/units/foundations.test.ts#L30) — contract foundations revision → issues version 3 while retaining the original rubric for saved version 2 work

### `apps/web/src/design-eval/homepage.contract.test.ts`

- [L45](../../../apps/web/src/design-eval/homepage.contract.test.ts#L45) — homepage design contract → has a subject-specific infographic for every lesson in the catalog
- [L51](../../../apps/web/src/design-eval/homepage.contract.test.ts#L51) — homepage design contract → keeps sourced course facts stable for the frozen scenario
- [L66](../../../apps/web/src/design-eval/homepage.contract.test.ts#L66) — homepage design contract → renders the learning claim, sourced figures, caveat, and ordered illustrated curriculum
- [L82](../../../apps/web/src/design-eval/homepage.contract.test.ts#L82) — homepage design contract → keeps homepage English copy free of em dashes and all-caps eyebrows
- [L91](../../../apps/web/src/design-eval/homepage.contract.test.ts#L91) — homepage design contract → uses one Evidence Desk chrome path instead of a Vercel report shell

### `apps/web/src/domain/access.test.ts`

- [L10](../../../apps/web/src/domain/access.test.ts#L10) — resolveLessonAccess → keeps previews public
- [L20](../../../apps/web/src/domain/access.test.ts#L20) — resolveLessonAccess → does not describe unavailable billing as unpaid
- [L30](../../../apps/web/src/domain/access.test.ts#L30) — resolveLessonAccess → accepts a current subscription
- [L40](../../../apps/web/src/domain/access.test.ts#L40) — resolveLessonAccess → accepts a durable course pass before consulting billing state
- [L51](../../../apps/web/src/domain/access.test.ts#L51) — resolveLessonAccess → treats a revoked course pass as inactive
- [L66](../../../apps/web/src/domain/access.test.ts#L66) — resolveLessonAccess → expires a manual grant at its configured boundary

### `apps/web/src/domain/billing-preflight.test.ts`

- [L70](../../../apps/web/src/domain/billing-preflight.test.ts#L70) — billing preflight arguments → parses test acceptance with a Session proof
- [L87](../../../apps/web/src/domain/billing-preflight.test.ts#L87) — billing preflight arguments → requires a Session proof for launch
- [L100](../../../apps/web/src/domain/billing-preflight.test.ts#L100) — billing preflight checks → passes the complete test acceptance contract
- [L105](../../../apps/web/src/domain/billing-preflight.test.ts#L105) — billing preflight checks → detects a mismatched account and stale Checkout brand
- [L119](../../../apps/web/src/domain/billing-preflight.test.ts#L119) — billing preflight checks → enforces production source, key, URL, and disabled rollout flag

### `apps/web/src/domain/billing.test.ts`

- [L10](../../../apps/web/src/domain/billing.test.ts#L10) — subscriptionGrantsCourse → accepts the configured active price
- [L20](../../../apps/web/src/domain/billing.test.ts#L20) — subscriptionGrantsCourse → rejects an unrelated active product
- [L30](../../../apps/web/src/domain/billing.test.ts#L30) — subscriptionGrantsCourse → rejects a canceled course subscription
- [L56](../../../apps/web/src/domain/billing.test.ts#L56) — checkoutSessionGrantsCoursePass → accepts a paid course-pass session for the exact user and price
- [L60](../../../apps/web/src/domain/billing.test.ts#L60) — checkoutSessionGrantsCoursePass → rejects %s sessions **[parameterized]**

### `apps/web/src/domain/coaching/coaching.test.ts`

- [L15](../../../apps/web/src/domain/coaching/coaching.test.ts#L15) — coaching context and learning boundary → projects only saved guided evidence for %s **[parameterized]**
- [L43](../../../apps/web/src/domain/coaching/coaching.test.ts#L43) — coaching context and learning boundary → uses the saved written response, not extra client text, in the boundary lesson
- [L55](../../../apps/web/src/domain/coaching/coaching.test.ts#L55) — coaching context and learning boundary → rejects future, submitted and retired stages and incomplete answers
- [L91](../../../apps/web/src/domain/coaching/coaching.test.ts#L91) — coaching context and learning boundary → rejects fabricated references, criteria and grade fields
- [L126](../../../apps/web/src/domain/coaching/coaching.test.ts#L126) — coaching context and learning boundary → tracks work changes without confusing hints or display state with a revision
- [L144](../../../apps/web/src/domain/coaching/coaching.test.ts#L144) — coaching context and learning boundary → does not accept client-owned context or role instructions

### `apps/web/src/domain/learning/contract-replay.test.ts`

- [L14](../../../apps/web/src/domain/learning/contract-replay.test.ts#L14) — illustrative session replay → has exact authored checkpoints and the unchanged closing assessment snapshot
- [L27](../../../apps/web/src/domain/learning/contract-replay.test.ts#L27) — illustrative session replay → grows current-session volume monotonically while stale and missing observations stay fixed
- [L47](../../../apps/web/src/domain/learning/contract-replay.test.ts#L47) — illustrative session replay → samples a shared clock deterministically and clamps the end
- [L64](../../../apps/web/src/domain/learning/contract-replay.test.ts#L64) — illustrative session replay → reduced-motion playback holds at checkpoints without rewinding a resumed position

### `apps/web/src/domain/learning/contracts.test.ts`

- [L27](../../../apps/web/src/domain/learning/contracts.test.ts#L27) — contract neighborhood evidence → keeps scope, stale observations, and missing data distinct
- [L43](../../../apps/web/src/domain/learning/contracts.test.ts#L43) — contract neighborhood evidence → uses numeric expiry distance and a volume scale independent of view filters
- [L57](../../../apps/web/src/domain/learning/contracts.test.ts#L57) — contract neighborhood evidence → each independent case identifies the highest fresh candidate inside its own boundary
- [L77](../../../apps/web/src/domain/learning/contracts.test.ts#L77) — contract neighborhood evidence → projects only the current grid and grades both variants with the common attempt engine

### `apps/web/src/domain/learning/curriculum.test.ts`

- [L28](../../../apps/web/src/domain/learning/curriculum.test.ts#L28) — curriculum teaching contracts → has reachable bilingual assessments without leaking rubrics: %s **[parameterized]**
- [L110](../../../apps/web/src/domain/learning/curriculum.test.ts#L110) — curriculum teaching contracts → teaches magnitude separately from direction and rejects non-positive denominators
- [L117](../../../apps/web/src/domain/learning/curriculum.test.ts#L117) — curriculum teaching contracts → equal complete GEX totals hide opposite near-expiry signs, and missing is never zero
- [L127](../../../apps/web/src/domain/learning/curriculum.test.ts#L127) — curriculum teaching contracts → equal contract peaks do not establish equal neighborhood breadth or moneyness
- [L150](../../../apps/web/src/domain/learning/curriculum.test.ts#L150) — curriculum teaching contracts → rank changes with peer observations while the focal volume remains fixed

### `apps/web/src/domain/learning/engine.test.ts`

- [L55](../../../apps/web/src/domain/learning/engine.test.ts#L55) — option print learning contract → does not send answer keys, unrevealed timing, or future case data
- [L89](../../../apps/web/src/domain/learning/engine.test.ts#L89) — option print learning contract → requires current-stage choices and inspected evidence; committed answers cannot be rewritten
- [L121](../../../apps/web/src/domain/learning/engine.test.ts#L121) — option print learning contract → records improvement after an incorrect initial judgment; guided help does not invalidate independent work
- [L135](../../../apps/web/src/domain/learning/engine.test.ts#L135) — option print learning contract → requires every independent criterion and records independent hints as practice
- [L159](../../../apps/web/src/domain/learning/engine.test.ts#L159) — option print learning contract → the alternate case grades a midpoint execution differently
- [L179](../../../apps/web/src/domain/learning/engine.test.ts#L179) — option print learning contract → both authored cases have valid evidence references, independent rubrics and bilingual copy

### `apps/web/src/domain/learning/flow-structure.test.ts`

- [L18](../../../apps/web/src/domain/learning/flow-structure.test.ts#L18) — flow and structure clocks → replays exact volume checkpoints, rewinds deterministically, and leaves report snapshots intact
- [L34](../../../apps/web/src/domain/learning/flow-structure.test.ts#L34) — flow and structure clocks → does not fabricate a delta from mismatched scopes, missing data, or reversed dates
- [L59](../../../apps/web/src/domain/learning/flow-structure.test.ts#L59) — flow and structure clocks → projects only the current case, and keeps unopened evidence and rubrics on the server
- [L67](../../../apps/web/src/domain/learning/flow-structure.test.ts#L67) — flow and structure clocks → grades independent report reasoning for variant %i and rejects memorizing the other variant **[parameterized]**

### `apps/web/src/domain/learning/strategy-concept.test.ts`

- [L23](../../../apps/web/src/domain/learning/strategy-concept.test.ts#L23) — signed strategy valuation → keeps expiry payoff, signed entry premium and fees separate for a vertical
- [L47](../../../apps/web/src/domain/learning/strategy-concept.test.ts#L47) — signed strategy valuation → distinguishes covered and uncovered short-call upside exposure
- [L74](../../../apps/web/src/domain/learning/strategy-concept.test.ts#L74) — signed strategy valuation → combines protective puts, straddles and collars from the actual supplied legs
- [L107](../../../apps/web/src/domain/learning/strategy-concept.test.ts#L107) — signed strategy valuation → rejects incomplete, invalid or mixed-expiry baskets instead of fabricating one payoff

### `apps/web/src/domain/learning/teaching-units.test.ts`

- [L26](../../../apps/web/src/domain/learning/teaching-units.test.ts#L26) — expanded concept curriculum → maps all 36 lessons and all 30 coverage families to authored teaching and distinct evaluation cases
- [L74](../../../apps/web/src/domain/learning/teaching-units.test.ts#L74) — expanded concept curriculum → keeps the known financial calculations and units correct
- [L98](../../../apps/web/src/domain/learning/teaching-units.test.ts#L98) — expanded concept curriculum → tests both aggressors, all five quote locations and all four sentiment combinations
- [L126](../../../apps/web/src/domain/learning/teaching-units.test.ts#L126) — expanded concept curriculum → cannot certify any current or evaluation case by a fixed answer position, zero arithmetic and blind prose
- [L167](../../../apps/web/src/domain/learning/teaching-units.test.ts#L167) — expanded concept curriculum → requires new evidence instead of certifying copied guided answers
- [L213](../../../apps/web/src/domain/learning/teaching-units.test.ts#L213) — expanded concept curriculum → accepts familiar numeric notation, rejects non-numbers and does not leak numeric keys or auto-grade prose

### `apps/web/src/domain/pricing-search.test.ts`

- [L6](../../../apps/web/src/domain/pricing-search.test.ts#L6) — pricing search boundary → keeps a valid lifetime Checkout return
- [L18](../../../apps/web/src/domain/pricing-search.test.ts#L18) — pricing search boundary → drops malformed and oversized Session IDs without throwing
- [L33](../../../apps/web/src/domain/pricing-search.test.ts#L33) — pricing search boundary → drops unknown checkout results

### `apps/web/src/domain/progress.test.ts`

- [L6](../../../apps/web/src/domain/progress.test.ts#L6) — calculateCourseProgress → derives completion from required lessons

### `apps/web/src/features/guides/demos.test.tsx`

- [L22](../../../apps/web/src/features/guides/demos.test.tsx#L22) — public examples and consented funnel → does not count a render; records first interaction and correct completion once
- [L42](../../../apps/web/src/features/guides/demos.test.tsx#L42) — public examples and consented funnel → never backfills a run started before consent
- [L58](../../../apps/web/src/features/guides/demos.test.tsx#L58) — public examples and consented funnel → treats a reset/remount as a new run, and withholds completion when consent is revoked
- [L83](../../../apps/web/src/features/guides/demos.test.tsx#L83) — public examples and consented funnel → advances the two ledgers and keeps the final trade from being counted again
- [L91](../../../apps/web/src/features/guides/demos.test.tsx#L91) — public examples and consented funnel → changes the supplied IV quote scenario without claiming a model forecast

### `apps/web/src/features/guides/examples.test.ts`

- [L12](../../../apps/web/src/features/guides/examples.test.ts#L12) — public teaching calculations → distinguishes cancellation, missing values and explicit zeros
- [L34](../../../apps/web/src/features/guides/examples.test.ts#L34) — public teaching calculations → counts volume once per traded contract, including closing and transfer trades
- [L51](../../../apps/web/src/features/guides/examples.test.ts#L51) — public teaching calculations → calculates only changes in supplied quotes with a single multiplier

### `apps/web/src/features/house/cinematic.test.ts`

- [L6](../../../apps/web/src/features/house/cinematic.test.ts#L6) — cinematic quality budgets → reduces costly passes, pixel density and particle budgets on low quality
- [L13](../../../apps/web/src/features/house/cinematic.test.ts#L13) — cinematic quality budgets → ships both baked lightmaps with the atlas resolution

### `apps/web/src/features/house/interior.test.ts`

- [L63](../../../apps/web/src/features/house/interior.test.ts#L63) — interior level navigation → keeps spawn locations inside level bounds
- [L70](../../../apps/web/src/features/house/interior.test.ts#L70) — interior level navigation → provides connected paths through living, dining, kitchen, powder room and stairs
- [L84](../../../apps/web/src/features/house/interior.test.ts#L84) — interior level navigation → provides connected upstairs paths to both bedrooms, bathrooms and the stair exit
- [L97](../../../apps/web/src/features/house/interior.test.ts#L97) — interior level navigation → does not allow walking through walls or outside the interior bounds

### `apps/web/src/features/house/model.test.ts`

- [L5](../../../apps/web/src/features/house/model.test.ts#L5) — web house asset contract → ships a self-contained GLB with all toggleable layers and no original scene or lights

### `apps/web/src/features/house/sunlight.test.ts`

- [L5](../../../apps/web/src/features/house/sunlight.test.ts#L5) — sunset lighting → moves around the house at constant distance and elevation
- [L14](../../../apps/web/src/features/house/sunlight.test.ts#L14) — sunset lighting → fades direct sun completely below the horizon while keeping dusk ambient light

### `apps/web/src/features/house/walking.test.ts`

- [L5](../../../apps/web/src/features/house/walking.test.ts#L5) — avatar movement boundaries → allows driveway and routes around both sides and rear
- [L14](../../../apps/web/src/features/house/walking.test.ts#L14) — avatar movement boundaries → blocks house volumes and the edge of the site
- [L24](../../../apps/web/src/features/house/walking.test.ts#L24) — avatar movement boundaries → blocks large landscape and neighbor objects
- [L28](../../../apps/web/src/features/house/walking.test.ts#L28) — avatar movement boundaries → slides along a wall without moving inside it

### `apps/web/src/features/learning/activity-concept-lab.test.tsx`

- [L50](../../../apps/web/src/features/learning/activity-concept-lab.test.tsx#L50) — unusual activity SVG lesson → distinguishes valid zero activity from missing or invalid denominators
- [L59](../../../apps/web/src/features/learning/activity-concept-lab.test.tsx#L59) — unusual activity SVG lesson → requires matching windows, population and coverage
- [L69](../../../apps/web/src/features/learning/activity-concept-lab.test.tsx#L69) — unusual activity SVG lesson → separates equal-row means, pooled ratios and selected populations
- [L84](../../../apps/web/src/features/learning/activity-concept-lab.test.tsx#L84) — unusual activity SVG lesson → does not manufacture a summary for empty or incomplete selected data
- [L99](../../../apps/web/src/features/learning/activity-concept-lab.test.tsx#L99) — unusual activity SVG lesson → links the SVG denominator to ratio controls while keeping volume fixed
- [L114](../../../apps/web/src/features/learning/activity-concept-lab.test.tsx#L114) — unusual activity SVG lesson → plays comparison cases and stops when the source window is edited
- [L130](../../../apps/web/src/features/learning/activity-concept-lab.test.tsx#L130) — unusual activity SVG lesson → makes screening and the choice of metric affect the explicit summary population
- [L149](../../../apps/web/src/features/learning/activity-concept-lab.test.tsx#L149) — unusual activity SVG lesson → supports Chinese controls and reset
- [L156](../../../apps/web/src/features/learning/activity-concept-lab.test.tsx#L156) — unusual activity SVG lesson → rejects absent or mismatched authorized data
- [L162](../../../apps/web/src/features/learning/activity-concept-lab.test.tsx#L162) — unusual activity SVG lesson → preserves version 2 assessment and the paid lesson boundary

### `apps/web/src/features/learning/boundary-concept-lab.test.tsx`

- [L50](../../../apps/web/src/features/learning/boundary-concept-lab.test.tsx#L50) — audited research SVG lesson → requires explicit baseline and additional forecast design fields without double counting
- [L62](../../../apps/web/src/features/learning/boundary-concept-lab.test.tsx#L62) — audited research SVG lesson → distinguishes changed identity from corrected observations or coverage
- [L76](../../../apps/web/src/features/learning/boundary-concept-lab.test.tsx#L76) — audited research SVG lesson → makes required declarations inspectable through native SVG fields
- [L90](../../../apps/web/src/features/learning/boundary-concept-lab.test.tsx#L90) — audited research SVG lesson → plays declarations and stops when a learner changes one
- [L104](../../../apps/web/src/features/learning/boundary-concept-lab.test.tsx#L104) — audited research SVG lesson → keeps classification feedback local and distinguishes observations from interpretations
- [L116](../../../apps/web/src/features/learning/boundary-concept-lab.test.tsx#L116) — audited research SVG lesson → accepts multiple evidence roles without converting missing values to zero
- [L129](../../../apps/web/src/features/learning/boundary-concept-lab.test.tsx#L129) — audited research SVG lesson → preserves the original through same-question revisions and new question drafts
- [L146](../../../apps/web/src/features/learning/boundary-concept-lab.test.tsx#L146) — audited research SVG lesson → plays revision stages with no premature new conclusion
- [L158](../../../apps/web/src/features/learning/boundary-concept-lab.test.tsx#L158) — audited research SVG lesson → supports Chinese and guards unavailable data
- [L165](../../../apps/web/src/features/learning/boundary-concept-lab.test.tsx#L165) — audited research SVG lesson → preserves version 2 grading and reflective self-review without granting mastery

### `apps/web/src/features/learning/charm-vanna-concept-lab.test.tsx`

- [L49](../../../apps/web/src/features/learning/charm-vanna-concept-lab.test.tsx#L49) — charm and vanna SVG lesson → multiplies matching changes before addition and retains cancellation
- [L60](../../../apps/web/src/features/learning/charm-vanna-concept-lab.test.tsx#L60) — charm and vanna SVG lesson → preserves equivalent elapsed remaining and decimal-volatility representations
- [L66](../../../apps/web/src/features/learning/charm-vanna-concept-lab.test.tsx#L66) — charm and vanna SVG lesson → retains partial terms without inventing unknown units or inputs
- [L89](../../../apps/web/src/features/learning/charm-vanna-concept-lab.test.tsx#L89) — charm and vanna SVG lesson → uses signed position units without changing option delta or filling missing evidence
- [L97](../../../apps/web/src/features/learning/charm-vanna-concept-lab.test.tsx#L97) — charm and vanna SVG lesson → links independent event controls to the combined result
- [L110](../../../apps/web/src/features/learning/charm-vanna-concept-lab.test.tsx#L110) — charm and vanna SVG lesson → plays controlled events and stops on direct input
- [L123](../../../apps/web/src/features/learning/charm-vanna-concept-lab.test.tsx#L123) — charm and vanna SVG lesson → supports native SVG unit inspection and honest partial totals
- [L139](../../../apps/web/src/features/learning/charm-vanna-concept-lab.test.tsx#L139) — charm and vanna SVG lesson → separates option and position changes across signed sides and missing holdings
- [L156](../../../apps/web/src/features/learning/charm-vanna-concept-lab.test.tsx#L156) — charm and vanna SVG lesson → supports Chinese and guards unavailable data
- [L163](../../../apps/web/src/features/learning/charm-vanna-concept-lab.test.tsx#L163) — charm and vanna SVG lesson → preserves authorized Learn and original version 2 grading

### `apps/web/src/features/learning/coaching-panel.test.tsx`

- [L49](../../../apps/web/src/features/learning/coaching-panel.test.tsx#L49) — inline coaching → distinguishes coaching from guided submission and preserves an unfinished coaching draft
- [L96](../../../apps/web/src/features/learning/coaching-panel.test.tsx#L96) — inline coaching → saves, reviews, revises and deletes a complete cycle with private text masked
- [L155](../../../apps/web/src/features/learning/coaching-panel.test.tsx#L155) — inline coaching → reuses saved written answers and blocks calls for unsaved lesson edits
- [L182](../../../apps/web/src/features/learning/coaching-panel.test.tsx#L182) — inline coaching → hides a disabled feature and does not offer generation on independent cases
- [L211](../../../apps/web/src/features/learning/coaching-panel.test.tsx#L211) — inline coaching → ignores a prior account's late reply after remount
- [L238](../../../apps/web/src/features/learning/coaching-panel.test.tsx#L238) — inline coaching → recovers a failed read without losing a typed explanation

### `apps/web/src/features/learning/contract-concept-lab.test.tsx`

- [L46](../../../apps/web/src/features/learning/contract-concept-lab.test.tsx#L46) — contract concept lab → calculates units from explicit terms and never invents shares for cash settlement
- [L67](../../../apps/web/src/features/learning/contract-concept-lab.test.tsx#L67) — contract concept lab → updates a contract comparison independently of the selected observation and resets the scene
- [L95](../../../apps/web/src/features/learning/contract-concept-lab.test.tsx#L95) — contract concept lab → keeps cards and premium synchronized and removes unsupported results when terms are missing
- [L120](../../../apps/web/src/features/learning/contract-concept-lab.test.tsx#L120) — contract concept lab → shows cash terms, provides selectable diagram fields, and stops playback on direct input
- [L146](../../../apps/web/src/features/learning/contract-concept-lab.test.tsx#L146) — contract concept lab → scrubs only supplied observations, supports keyboard reversal, and cancels playback
- [L178](../../../apps/web/src/features/learning/contract-concept-lab.test.tsx#L178) — contract concept lab → renders all four scenes in Chinese with reduced motion
- [L186](../../../apps/web/src/features/learning/contract-concept-lab.test.tsx#L186) — contract concept lab → mounts only in Learn, keeps exploration out of grading, and preserves notes and older work

### `apps/web/src/features/learning/contract-explorer.test.tsx`

- [L36](../../../apps/web/src/features/learning/contract-explorer.test.tsx#L36) — optional contract renderer → loads Three.js only when requested and preserves selection in both directions
- [L81](../../../apps/web/src/features/learning/contract-explorer.test.tsx#L81) — optional contract renderer → falls back on context loss without losing the selected observation
- [L110](../../../apps/web/src/features/learning/contract-explorer.test.tsx#L110) — optional contract renderer → removes a hidden selection without treating missing volume as zero
- [L130](../../../apps/web/src/features/learning/contract-explorer.test.tsx#L130) — optional contract renderer → starts motion on the first 3D view, lets the learner pause, and restores exact closing numbers

### `apps/web/src/features/learning/course-update.test.tsx`

- [L32](../../../apps/web/src/features/learning/course-update.test.tsx#L32) — new course learning surfaces → distinguishes one fill, canceled liquidity and inferred sentiment at the fastest default
- [L72](../../../apps/web/src/features/learning/course-update.test.tsx#L72) — new course learning surfaces → teaches a partial fill without displaying premature sentiment concepts
- [L97](../../../apps/web/src/features/learning/course-update.test.tsx#L97) — new course learning surfaces → keeps a numeric edit unsaved until explicit save and blocks submission while it is dirty
- [L156](../../../apps/web/src/features/learning/course-update.test.tsx#L156) — new course learning surfaces → preserves a missing source row in the chart and exports learner work without a mastery claim

### `apps/web/src/features/learning/delta-concept-lab.test.tsx`

- [L52](../../../apps/web/src/features/learning/delta-concept-lab.test.tsx#L52) — delta SVG lesson → applies cents, quantity, multiplier and position sign exactly once
- [L75](../../../apps/web/src/features/learning/delta-concept-lab.test.tsx#L75) — delta SVG lesson → preserves valid zero while rejecting missing, nonfinite or invalid inputs
- [L94](../../../apps/web/src/features/learning/delta-concept-lab.test.tsx#L94) — delta SVG lesson → uses a declared curve tangent at the anchor and exposes wider-move error
- [L122](../../../apps/web/src/features/learning/delta-concept-lab.test.tsx#L122) — delta SVG lesson → keeps supplied local price lines inside the chart at either move extreme
- [L130](../../../apps/web/src/features/learning/delta-concept-lab.test.tsx#L130) — delta SVG lesson → links the SVG move control to the form and preserves fractional-cent estimates
- [L147](../../../apps/web/src/features/learning/delta-concept-lab.test.tsx#L147) — delta SVG lesson → reverses position exposure without changing the option delta
- [L168](../../../apps/web/src/features/learning/delta-concept-lab.test.tsx#L168) — delta SVG lesson → withholds total estimates for changed inputs and also the spot calculation for missing delta
- [L188](../../../apps/web/src/features/learning/delta-concept-lab.test.tsx#L188) — delta SVG lesson → plays the declared move sequence and stops when the SVG control is grabbed
- [L203](../../../apps/web/src/features/learning/delta-concept-lab.test.tsx#L203) — delta SVG lesson → supports Chinese and withholds missing or mismatched teaching data
- [L212](../../../apps/web/src/features/learning/delta-concept-lab.test.tsx#L212) — delta SVG lesson → preserves version 2 grading and the authorized Learn boundary

### `apps/web/src/features/learning/eligibility-concept-lab.test.tsx`

- [L51](../../../apps/web/src/features/learning/eligibility-concept-lab.test.tsx#L51) — symbol universe SVG lesson → derives eligibility from facts rather than ready badges
- [L70](../../../apps/web/src/features/learning/eligibility-concept-lab.test.tsx#L70) — symbol universe SVG lesson → keeps observed subtotal separate from a complete qualifying total
- [L82](../../../apps/web/src/features/learning/eligibility-concept-lab.test.tsx#L82) — symbol universe SVG lesson → includes the floor boundary and keeps unknown candidates even above observed maxima
- [L92](../../../apps/web/src/features/learning/eligibility-concept-lab.test.tsx#L92) — symbol universe SVG lesson → requires a positive compatible numeric baseline independently of peer count
- [L101](../../../apps/web/src/features/learning/eligibility-concept-lab.test.tsx#L101) — symbol universe SVG lesson → makes source reasons inspectable and recomputes after rule changes
- [L114](../../../apps/web/src/features/learning/eligibility-concept-lab.test.tsx#L114) — symbol universe SVG lesson → plays check stages without publishing a partial admission count
- [L128](../../../apps/web/src/features/learning/eligibility-concept-lab.test.tsx#L128) — symbol universe SVG lesson → changes a numeric ratio without changing peer count and then reveals correction effects
- [L142](../../../apps/web/src/features/learning/eligibility-concept-lab.test.tsx#L142) — symbol universe SVG lesson → preserves historical observations while exposing membership substitutions
- [L161](../../../apps/web/src/features/learning/eligibility-concept-lab.test.tsx#L161) — symbol universe SVG lesson → supports Chinese and guards unavailable data
- [L168](../../../apps/web/src/features/learning/eligibility-concept-lab.test.tsx#L168) — symbol universe SVG lesson → preserves version 2 grading and anonymous free-preview access

### `apps/web/src/features/learning/execution-concept-lab.test.tsx`

- [L52](../../../apps/web/src/features/learning/execution-concept-lab.test.tsx#L52) — execution counterparties SVG lesson → counts both parties as one execution and one traded quantity
- [L74](../../../apps/web/src/features/learning/execution-concept-lab.test.tsx#L74) — execution counterparties SVG lesson → fills in price order without violating a buy or sell limit
- [L93](../../../apps/web/src/features/learning/execution-concept-lab.test.tsx#L93) — execution counterparties SVG lesson → keeps no-fill averages missing and cannot invent liquidity beyond the displayed book
- [L119](../../../apps/web/src/features/learning/execution-concept-lab.test.tsx#L119) — execution counterparties SVG lesson → shows how market and marketable limit instructions yield identical small fills
- [L130](../../../apps/web/src/features/learning/execution-concept-lab.test.tsx#L130) — execution counterparties SVG lesson → plays a single match, reverses the incoming side, and keeps put volume undoubled
- [L151](../../../apps/web/src/features/learning/execution-concept-lab.test.tsx#L151) — execution counterparties SVG lesson → updates partial fills directly and distinguishes an ineligible price from unused depth
- [L182](../../../apps/web/src/features/learning/execution-concept-lab.test.tsx#L182) — execution counterparties SVG lesson → requires additional evidence to establish the order instruction, and clears stale revelations
- [L203](../../../apps/web/src/features/learning/execution-concept-lab.test.tsx#L203) — execution counterparties SVG lesson → supports Chinese controls and selected-scene reset
- [L211](../../../apps/web/src/features/learning/execution-concept-lab.test.tsx#L211) — execution counterparties SVG lesson → does not use missing or mismatched paid fixture data
- [L219](../../../apps/web/src/features/learning/execution-concept-lab.test.tsx#L219) — execution counterparties SVG lesson → uses authorized Learn data without changing version 2 assessment answers or progress

### `apps/web/src/features/learning/flow-impact-concept-lab.test.tsx`

- [L51](../../../apps/web/src/features/learning/flow-impact-concept-lab.test.tsx#L51) — flow impact SVG lesson → uses absolute trade delta and stated classification, retaining neutral coverage
- [L65](../../../apps/web/src/features/learning/flow-impact-concept-lab.test.tsx#L65) — flow impact SVG lesson → can cancel or reverse net flow without erasing gross activity
- [L75](../../../apps/web/src/features/learning/flow-impact-concept-lab.test.tsx#L75) — flow impact SVG lesson → does not replace unknown magnitude or directional premium with zero
- [L94](../../../apps/web/src/features/learning/flow-impact-concept-lab.test.tsx#L94) — flow impact SVG lesson → requires positive volume and a declared proxy scale and method
- [L113](../../../apps/web/src/features/learning/flow-impact-concept-lab.test.tsx#L113) — flow impact SVG lesson → does not silently route OI or GEX into tape DEI
- [L118](../../../apps/web/src/features/learning/flow-impact-concept-lab.test.tsx#L118) — flow impact SVG lesson → links contract size, classification, gross and premium independently
- [L134](../../../apps/web/src/features/learning/flow-impact-concept-lab.test.tsx#L134) — flow impact SVG lesson → plays size changes and stops on direct input
- [L147](../../../apps/web/src/features/learning/flow-impact-concept-lab.test.tsx#L147) — flow impact SVG lesson → changes DEI while keeping independent GEX fixed and rejects incomplete references
- [L164](../../../apps/web/src/features/learning/flow-impact-concept-lab.test.tsx#L164) — flow impact SVG lesson → supports SVG report selection and equivalent form controls
- [L177](../../../apps/web/src/features/learning/flow-impact-concept-lab.test.tsx#L177) — flow impact SVG lesson → supports Chinese and guards unavailable data
- [L184](../../../apps/web/src/features/learning/flow-impact-concept-lab.test.tsx#L184) — flow impact SVG lesson → preserves authorized Learn and original version 2 grading

### `apps/web/src/features/learning/flow-structure-explorer.test.tsx`

- [L12](../../../apps/web/src/features/learning/flow-structure-explorer.test.tsx#L12) — flow comparison controls → starts at the fastest speed and changes only volume when seeking
- [L45](../../../apps/web/src/features/learning/flow-structure-explorer.test.tsx#L45) — flow comparison controls → keeps unavailable comparisons and model values explicit in Chinese

### `apps/web/src/features/learning/gamma-concept-lab.test.tsx`

- [L54](../../../apps/web/src/features/learning/gamma-concept-lab.test.tsx#L54) — gamma SVG lesson → separates delta change from the half-gamma squared price term in cents
- [L70](../../../apps/web/src/features/learning/gamma-concept-lab.test.tsx#L70) — gamma SVG lesson → preserves zero gamma and withholds missing, invalid or out-of-bounds estimates without clamping
- [L92](../../../apps/web/src/features/learning/gamma-concept-lab.test.tsx#L92) — gamma SVG lesson → rebalances the known hedge with the correct long/short and move signs
- [L120](../../../apps/web/src/features/learning/gamma-concept-lab.test.tsx#L120) — gamma SVG lesson → does not invent hedge instructions for absent positions or invalid quantities
- [L132](../../../apps/web/src/features/learning/gamma-concept-lab.test.tsx#L132) — gamma SVG lesson → preserves dates and bounds for the authored sensitivity comparison
- [L148](../../../apps/web/src/features/learning/gamma-concept-lab.test.tsx#L148) — gamma SVG lesson → links chart/form controls while distinguishing the two quantities
- [L167](../../../apps/web/src/features/learning/gamma-concept-lab.test.tsx#L167) — gamma SVG lesson → plays the hedge, pauses on direct input and withholds unknown holdings
- [L195](../../../apps/web/src/features/learning/gamma-concept-lab.test.tsx#L195) — gamma SVG lesson → selects snapshots directly in SVG and rejects raw extrapolation beyond delta bounds
- [L213](../../../apps/web/src/features/learning/gamma-concept-lab.test.tsx#L213) — gamma SVG lesson → supports Chinese and rejects absent or mismatched teaching data
- [L222](../../../apps/web/src/features/learning/gamma-concept-lab.test.tsx#L222) — gamma SVG lesson → keeps grading version 2 and routes only Continue into assessment state

### `apps/web/src/features/learning/gex-concept-lab.test.tsx`

- [L46](../../../apps/web/src/features/learning/gex-concept-lab.test.tsx#L46) — gamma exposure SVG lesson → scales the stated dollar per 1 percent expression and keeps assumed sign explicit
- [L54](../../../apps/web/src/features/learning/gex-concept-lab.test.tsx#L54) — gamma exposure SVG lesson → withholds invalid and missing inputs
- [L62](../../../apps/web/src/features/learning/gex-concept-lab.test.tsx#L62) — gamma exposure SVG lesson → distinguishes equal net totals from gross and local distribution
- [L78](../../../apps/web/src/features/learning/gex-concept-lab.test.tsx#L78) — gamma exposure SVG lesson → retains zero observations but never substitutes missing or excluded values
- [L109](../../../apps/web/src/features/learning/gex-concept-lab.test.tsx#L109) — gamma exposure SVG lesson → rejects duplicate or foreign identities instead of double counting
- [L124](../../../apps/web/src/features/learning/gex-concept-lab.test.tsx#L124) — gamma exposure SVG lesson → links formula controls, absent assumptions and reset
- [L136](../../../apps/web/src/features/learning/gex-concept-lab.test.tsx#L136) — gamma exposure SVG lesson → plays OI steps and stops when the learner changes an input
- [L149](../../../apps/web/src/features/learning/gex-concept-lab.test.tsx#L149) — gamma exposure SVG lesson → selects SVG cells without confusing the expiry slice with full totals
- [L165](../../../apps/web/src/features/learning/gex-concept-lab.test.tsx#L165) — gamma exposure SVG lesson → makes coverage and explicit zero distinctions inspectable
- [L182](../../../apps/web/src/features/learning/gex-concept-lab.test.tsx#L182) — gamma exposure SVG lesson → supports Chinese and guards unavailable teaching data
- [L189](../../../apps/web/src/features/learning/gex-concept-lab.test.tsx#L189) — gamma exposure SVG lesson → preserves authorized Learn and original version 2 grading

### `apps/web/src/features/learning/iv-rank-concept-lab.test.tsx`

- [L53](../../../apps/web/src/features/learning/iv-rank-concept-lab.test.tsx#L53) — IV rank and percentile SVG lesson → separates range position from frequency and retains ties in the denominator
- [L77](../../../apps/web/src/features/learning/iv-rank-concept-lab.test.tsx#L77) — IV rank and percentile SVG lesson → changes rank with a high outlier while preserving membership counts
- [L93](../../../apps/web/src/features/learning/iv-rank-concept-lab.test.tsx#L93) — IV rank and percentile SVG lesson → keeps percentile defined on a zero range and rejects missing values instead of dropping them
- [L117](../../../apps/web/src/features/learning/iv-rank-concept-lab.test.tsx#L117) — IV rank and percentile SVG lesson → checks reference, earlier window, declared count and distinct observation dates
- [L156](../../../apps/web/src/features/learning/iv-rank-concept-lab.test.tsx#L156) — IV rank and percentile SVG lesson → links the native current-IV controls and exposes tie changes
- [L174](../../../apps/web/src/features/learning/iv-rank-concept-lab.test.tsx#L174) — IV rank and percentile SVG lesson → plays the controlled outlier sequence and stops on direct input
- [L192](../../../apps/web/src/features/learning/iv-rank-concept-lab.test.tsx#L192) — IV rank and percentile SVG lesson → preserves a valid percentile when flat histories make rank undefined
- [L205](../../../apps/web/src/features/learning/iv-rank-concept-lab.test.tsx#L205) — IV rank and percentile SVG lesson → withholds unsupported sample statistics and restores them on reset
- [L221](../../../apps/web/src/features/learning/iv-rank-concept-lab.test.tsx#L221) — IV rank and percentile SVG lesson → supports Chinese and rejects missing or mismatched teaching data
- [L230](../../../apps/web/src/features/learning/iv-rank-concept-lab.test.tsx#L230) — IV rank and percentile SVG lesson → preserves version 2 grading and the authorized Learn boundary

### `apps/web/src/features/learning/learning-exercise.test.tsx`

- [L63](../../../apps/web/src/features/learning/learning-exercise.test.tsx#L63) — interactive learning UI → starts on demand and recovers a lost save response with the same command id
- [L103](../../../apps/web/src/features/learning/learning-exercise.test.tsx#L103) — interactive learning UI → tracks a successful open and hint without sending answers or case content
- [L138](../../../apps/web/src/features/learning/learning-exercise.test.tsx#L138) — interactive learning UI → tracks the server's assessment once after submission
- [L193](../../../apps/web/src/features/learning/learning-exercise.test.tsx#L193) — interactive learning UI → tracks an unsuccessful exercise open (%s) without a start event **[parameterized]**
- [L211](../../../apps/web/src/features/learning/learning-exercise.test.tsx#L211) — interactive learning UI → drops an old account's pending response after an identity change
- [L235](../../../apps/web/src/features/learning/learning-exercise.test.tsx#L235) — interactive learning UI → removes paid evidence immediately when the server reports revoked access
- [L247](../../../apps/web/src/features/learning/learning-exercise.test.tsx#L247) — interactive learning UI → renders the Chinese exercise and named controls without exposing unrevealed context

### `apps/web/src/features/learning/lesson-motion.test.tsx`

- [L62](../../../apps/web/src/features/learning/lesson-motion.test.tsx#L62) — lesson presentation motion → keeps initial content visible and disables incidental motion for keyboard and reduced-motion changes
- [L94](../../../apps/web/src/features/learning/lesson-motion.test.tsx#L94) — lesson presentation motion → reorders rows while preserving the focal observation and the fixed scenario
- [L124](../../../apps/web/src/features/learning/lesson-motion.test.tsx#L124) — lesson presentation motion → changes only the illustrative quote position and resolves instantly with reduced motion
- [L154](../../../apps/web/src/features/learning/lesson-motion.test.tsx#L154) — lesson presentation motion → replays calculation emphasis without altering exact terms
- [L174](../../../apps/web/src/features/learning/lesson-motion.test.tsx#L174) — lesson presentation motion → draws only inspected source links and labels an ungraded wrong answer as a draft

### `apps/web/src/features/learning/levels-concept-lab.test.tsx`

- [L51](../../../apps/web/src/features/learning/levels-concept-lab.test.tsx#L51) — structural levels SVG lesson → keeps concentration rule, option type and expiry scope explicit
- [L75](../../../apps/web/src/features/learning/levels-concept-lab.test.tsx#L75) — structural levels SVG lesson → retains ties and rejects incomplete scope or a zero-only concentration
- [L103](../../../apps/web/src/features/learning/levels-concept-lab.test.tsx#L103) — structural levels SVG lesson → calculates intrinsic payout without gamma or premiums and preserves candidate ties
- [L122](../../../apps/web/src/features/learning/levels-concept-lab.test.tsx#L122) — structural levels SVG lesson → keeps partial distance availability and refuses incompatible scales
- [L138](../../../apps/web/src/features/learning/levels-concept-lab.test.tsx#L138) — structural levels SVG lesson → updates SVG concentration and selected-strike details
- [L154](../../../apps/web/src/features/learning/levels-concept-lab.test.tsx#L154) — structural levels SVG lesson → plays settlement candidates and stops on direct input
- [L169](../../../apps/web/src/features/learning/levels-concept-lab.test.tsx#L169) — structural levels SVG lesson → exposes candidate ties and withholds missing OI totals
- [L184](../../../apps/web/src/features/learning/levels-concept-lab.test.tsx#L184) — structural levels SVG lesson → distinguishes ATR availability from price-scale compatibility
- [L200](../../../apps/web/src/features/learning/levels-concept-lab.test.tsx#L200) — structural levels SVG lesson → supports Chinese and guards unavailable data
- [L207](../../../apps/web/src/features/learning/levels-concept-lab.test.tsx#L207) — structural levels SVG lesson → preserves authorized Learn and original version 2 grading

### `apps/web/src/features/learning/metrics-explorer.test.tsx`

- [L52](../../../apps/web/src/features/learning/metrics-explorer.test.tsx#L52) — metric teaching controls → honors the lesson capability while keeping its 2D evidence available
- [L62](../../../apps/web/src/features/learning/metrics-explorer.test.tsx#L62) — metric teaching controls → changes only normalization and exposes unavailable denominators
- [L79](../../../apps/web/src/features/learning/metrics-explorer.test.tsx#L79) — metric teaching controls → shares signed selection, preserves the scene on answer saves, and recovers from context loss
- [L104](../../../apps/web/src/features/learning/metrics-explorer.test.tsx#L104) — metric teaching controls → separates a filtered subtotal from the full scope, including unknown totals
- [L119](../../../apps/web/src/features/learning/metrics-explorer.test.tsx#L119) — metric teaching controls → renders all five contract stages and changes the paired observations

### `apps/web/src/features/learning/neighborhood-concept-lab.test.tsx`

- [L49](../../../apps/web/src/features/learning/neighborhood-concept-lab.test.tsx#L49) — contract neighborhood SVG lesson → separates equal totals and peaks from nonzero breadth
- [L63](../../../apps/web/src/features/learning/neighborhood-concept-lab.test.tsx#L63) — contract neighborhood SVG lesson → withholds complete totals and peaks for missing or prior-session required cells
- [L83](../../../apps/web/src/features/learning/neighborhood-concept-lab.test.tsx#L83) — contract neighborhood SVG lesson → does not admit an outside-scope maximum or duplicate identities
- [L103](../../../apps/web/src/features/learning/neighborhood-concept-lab.test.tsx#L103) — contract neighborhood SVG lesson → keeps explicit zero known and rejects non-finite or negative current values
- [L119](../../../apps/web/src/features/learning/neighborhood-concept-lab.test.tsx#L119) — contract neighborhood SVG lesson → keeps expiry focus and moneyness changes separate from full observed activity
- [L134](../../../apps/web/src/features/learning/neighborhood-concept-lab.test.tsx#L134) — contract neighborhood SVG lesson → compares layouts through explicit playback without changing peak or total
- [L147](../../../apps/web/src/features/learning/neighborhood-concept-lab.test.tsx#L147) — contract neighborhood SVG lesson → exposes missing and stale evidence without promoting a known peak to the complete peak
- [L164](../../../apps/web/src/features/learning/neighborhood-concept-lab.test.tsx#L164) — contract neighborhood SVG lesson → makes the out-of-scope attraction directly inspectable while preserving the fixed scope
- [L179](../../../apps/web/src/features/learning/neighborhood-concept-lab.test.tsx#L179) — contract neighborhood SVG lesson → supports Chinese and guards unavailable data
- [L186](../../../apps/web/src/features/learning/neighborhood-concept-lab.test.tsx#L186) — contract neighborhood SVG lesson → preserves version 2 grading, neighborhood investigation and paid access

### `apps/web/src/features/learning/oi-concept-lab.test.tsx`

- [L59](../../../apps/web/src/features/learning/oi-concept-lab.test.tsx#L59) — volume and open interest concept lesson → counts one OI effect for each matched contract and zero for either transfer direction
- [L64](../../../apps/web/src/features/learning/oi-concept-lab.test.tsx#L64) — volume and open interest concept lesson → keeps reported OI fixed until publication while correctly accounting for trades and paired exercise
- [L81](../../../apps/web/src/features/learning/oi-concept-lab.test.tsx#L81) — volume and open interest concept lesson → preserves observed volume and reports when position effects are unavailable
- [L95](../../../apps/web/src/features/learning/oi-concept-lab.test.tsx#L95) — volume and open interest concept lesson → separates within-series change from entry and exit in rolling buckets
- [L117](../../../apps/web/src/features/learning/oi-concept-lab.test.tsx#L117) — volume and open interest concept lesson → includes exact DTE boundaries and keeps incomplete reports distinct from an empty cohort
- [L156](../../../apps/web/src/features/learning/oi-concept-lab.test.tsx#L156) — volume and open interest concept lesson → links both party controls and quantity without treating transfers as no trading
- [L169](../../../apps/web/src/features/learning/oi-concept-lab.test.tsx#L169) — volume and open interest concept lesson → plays session events, pauses on SVG input and withholds calculated OI without flags
- [L190](../../../apps/web/src/features/learning/oi-concept-lab.test.tsx#L190) — volume and open interest concept lesson → changes cohort membership with the report date while fixed membership remains stable
- [L210](../../../apps/web/src/features/learning/oi-concept-lab.test.tsx#L210) — volume and open interest concept lesson → supports Chinese resets and rejects missing or mismatched paid data
- [L222](../../../apps/web/src/features/learning/oi-concept-lab.test.tsx#L222) — volume and open interest concept lesson → keeps exploration separate from version 2 assessment and its reported-OI contract

### `apps/web/src/features/learning/packet-concept-lab.test.tsx`

- [L51](../../../apps/web/src/features/learning/packet-concept-lab.test.tsx#L51) — reproducible packet SVG lesson → calculates exact premium cents and retains actual row IDs and missingness
- [L61](../../../apps/web/src/features/learning/packet-concept-lab.test.tsx#L61) — reproducible packet SVG lesson → distinguishes zero observations from missing inputs and rejects ambiguous identities
- [L105](../../../apps/web/src/features/learning/packet-concept-lab.test.tsx#L105) — reproducible packet SVG lesson → allows only the declared replay parameter without silently changing the method
- [L126](../../../apps/web/src/features/learning/packet-concept-lab.test.tsx#L126) — reproducible packet SVG lesson → exposes source formulas and the unavailable full total through native rows
- [L136](../../../apps/web/src/features/learning/packet-concept-lab.test.tsx#L136) — reproducible packet SVG lesson → plays calculation stages and stops when a stage is selected directly
- [L150](../../../apps/web/src/features/learning/packet-concept-lab.test.tsx#L150) — reproducible packet SVG lesson → records concrete fields while keeping omitted metadata visibly absent
- [L172](../../../apps/web/src/features/learning/packet-concept-lab.test.tsx#L172) — reproducible packet SVG lesson → preserves the original while showing a new dated subtotal and its row inputs
- [L183](../../../apps/web/src/features/learning/packet-concept-lab.test.tsx#L183) — reproducible packet SVG lesson → does not publish a new result for undeclared source universe or transformation changes
- [L198](../../../apps/web/src/features/learning/packet-concept-lab.test.tsx#L198) — reproducible packet SVG lesson → supports Chinese and guards unavailable data
- [L205](../../../apps/web/src/features/learning/packet-concept-lab.test.tsx#L205) — reproducible packet SVG lesson → preserves shared capstone data, version 2 grading and writing self-review

### `apps/web/src/features/learning/payoff-concept-lab.test.tsx`

- [L43](../../../apps/web/src/features/learning/payoff-concept-lab.test.tsx#L43) — premium and payoff concept lesson → preserves an ITM loss and limits an OTM buyer's loss to the paid premium before fees
- [L70](../../../apps/web/src/features/learning/payoff-concept-lab.test.tsx#L70) — premium and payoff concept lesson → keeps cent arithmetic and break-even consistent across both option types and quantity
- [L92](../../../apps/web/src/features/learning/payoff-concept-lab.test.tsx#L92) — premium and payoff concept lesson → uses only authored premiums and separates the expiry comparison from market-price prediction
- [L107](../../../apps/web/src/features/learning/payoff-concept-lab.test.tsx#L107) — premium and payoff concept lesson → changes purchase premium without changing entry notional until quantity changes
- [L132](../../../apps/web/src/features/learning/payoff-concept-lab.test.tsx#L132) — premium and payoff concept lesson → updates the value decomposition at the same spot for Call, Put and expiry
- [L151](../../../apps/web/src/features/learning/payoff-concept-lab.test.tsx#L151) — premium and payoff concept lesson → moves through loss, break-even and profit and keeps per-share curves independent of quantity
- [L181](../../../apps/web/src/features/learning/payoff-concept-lab.test.tsx#L181) — premium and payoff concept lesson → shifts break-even with paid premium and correctly reverses the put example
- [L218](../../../apps/web/src/features/learning/payoff-concept-lab.test.tsx#L218) — premium and payoff concept lesson → provides Chinese controls and resets the chart to the worked example
- [L231](../../../apps/web/src/features/learning/payoff-concept-lab.test.tsx#L231) — premium and payoff concept lesson → keeps the new lab in Learn and leaves version 2 grading and reference notes intact

### `apps/web/src/features/learning/point-time-concept-lab.test.tsx`

- [L52](../../../apps/web/src/features/learning/point-time-concept-lab.test.tsx#L52) — point-in-time research SVG lesson → uses availability as well as event time and replaces superseded versions
- [L77](../../../apps/web/src/features/learning/point-time-concept-lab.test.tsx#L77) — point-in-time research SVG lesson → does not revive an older quantity when the latest available correction has an unknown amount
- [L89](../../../apps/web/src/features/learning/point-time-concept-lab.test.tsx#L89) — point-in-time research SVG lesson → applies a positive half-life without deleting raw events
- [L99](../../../apps/web/src/features/learning/point-time-concept-lab.test.tsx#L99) — point-in-time research SVG lesson → keeps descriptive scores separate and respects the declared baseline protocol
- [L114](../../../apps/web/src/features/learning/point-time-concept-lab.test.tsx#L114) — point-in-time research SVG lesson → counts toy outcome matches without interpreting them as probabilities
- [L120](../../../apps/web/src/features/learning/point-time-concept-lab.test.tsx#L120) — point-in-time research SVG lesson → makes the availability cutoff and superseded versions inspectable
- [L137](../../../apps/web/src/features/learning/point-time-concept-lab.test.tsx#L137) — point-in-time research SVG lesson → plays decay and stops when the half-life is changed
- [L155](../../../apps/web/src/features/learning/point-time-concept-lab.test.tsx#L155) — point-in-time research SVG lesson → uses native score cards and preserves a valid percentile when z is undefined
- [L169](../../../apps/web/src/features/learning/point-time-concept-lab.test.tsx#L169) — point-in-time research SVG lesson → preserves the first frozen result and irreversibly marks subsequent tuning within the walkthrough
- [L187](../../../apps/web/src/features/learning/point-time-concept-lab.test.tsx#L187) — point-in-time research SVG lesson → allows development edits before the first outcome reveal
- [L198](../../../apps/web/src/features/learning/point-time-concept-lab.test.tsx#L198) — point-in-time research SVG lesson → supports Chinese and guards unavailable data
- [L205](../../../apps/web/src/features/learning/point-time-concept-lab.test.tsx#L205) — point-in-time research SVG lesson → preserves version 2 grading and the paid Learn boundary

### `apps/web/src/features/learning/preview-learning.test.tsx`

- [L80](../../../apps/web/src/features/learning/preview-learning.test.tsx#L80) — anonymous preview analytics → counts successful runs separately from account exercises without duplicate assessments
- [L103](../../../apps/web/src/features/learning/preview-learning.test.tsx#L103) — anonymous preview analytics → retries the failed restart rather than replaying the previous completed history
- [L125](../../../apps/web/src/features/learning/preview-learning.test.tsx#L125) — anonymous preview analytics → does not reconstruct a start after consent or count a failed open

### `apps/web/src/features/learning/print-review-concept-lab.test.tsx`

- [L53](../../../apps/web/src/features/learning/print-review-concept-lab.test.tsx#L53) — execution review teaching lab → calculates dollars from execution units without assuming a missing multiplier
- [L60](../../../apps/web/src/features/learning/print-review-concept-lab.test.tsx#L60) — execution review teaching lab → keeps quote inference and cash arithmetic independent
- [L75](../../../apps/web/src/features/learning/print-review-concept-lab.test.tsx#L75) — execution review teaching lab → separates observations, calculations, inferences and unknowns as records are added
- [L110](../../../apps/web/src/features/learning/print-review-concept-lab.test.tsx#L110) — execution review teaching lab → matches each evidence gap to a targeted follow-up without repairing it with a larger print or price move
- [L122](../../../apps/web/src/features/learning/print-review-concept-lab.test.tsx#L122) — execution review teaching lab → plays the inspection, interrupts on native SVG input, and retains unknown cash amounts
- [L143](../../../apps/web/src/features/learning/print-review-concept-lab.test.tsx#L143) — execution review teaching lab → reclassifies a selected statement after new evidence and clears prior feedback
- [L164](../../../apps/web/src/features/learning/print-review-concept-lab.test.tsx#L164) — execution review teaching lab → shows what a follow-up actually resolves, preserving unrelated unknowns and original print amounts
- [L186](../../../apps/web/src/features/learning/print-review-concept-lab.test.tsx#L186) — execution review teaching lab → supports Chinese keyboard-ready controls and selected-scene reset
- [L197](../../../apps/web/src/features/learning/print-review-concept-lab.test.tsx#L197) — execution review teaching lab → does not substitute a client fixture when authorized teaching data is missing or mismatched
- [L205](../../../apps/web/src/features/learning/print-review-concept-lab.test.tsx#L205) — execution review teaching lab → uses only the authorized Learn projection and preserves the version 2 premium/inference assessment

### `apps/web/src/features/learning/quote-concept-lab.test.tsx`

- [L48](../../../apps/web/src/features/learning/quote-concept-lab.test.tsx#L48) — quotes, orders and trades teaching lab → keeps exact half-cent midpoints and measures spreads in cents
- [L52](../../../apps/web/src/features/learning/quote-concept-lab.test.tsx#L52) — quotes, orders and trades teaching lab → requires confirmation, distinguishing an added order, a cancellation and a trade
- [L79](../../../apps/web/src/features/learning/quote-concept-lab.test.tsx#L79) — quotes, orders and trades teaching lab → combines eligible venues, preserves ties and leaves missing prices unknown
- [L97](../../../apps/web/src/features/learning/quote-concept-lab.test.tsx#L97) — quotes, orders and trades teaching lab → changes quote references without fabricating a new last trade and resets the scene
- [L109](../../../apps/web/src/features/learning/quote-concept-lab.test.tsx#L109) — quotes, orders and trades teaching lab → plays supplied outcomes, pauses on direct edits and compares equal size decreases
- [L132](../../../apps/web/src/features/learning/quote-concept-lab.test.tsx#L132) — quotes, orders and trades teaching lab → changes eligibility independently from venue inspection in Chinese
- [L145](../../../apps/web/src/features/learning/quote-concept-lab.test.tsx#L145) — quotes, orders and trades teaching lab → does not ship a fallback fixture when authorized data is absent
- [L150](../../../apps/web/src/features/learning/quote-concept-lab.test.tsx#L150) — quotes, orders and trades teaching lab → projects authored data only into Learn and preserves the existing version 2 assessment

### `apps/web/src/features/learning/rank-symbol-concept-lab.test.tsx`

- [L49](../../../apps/web/src/features/learning/rank-symbol-concept-lab.test.tsx#L49) — symbol ranking SVG lesson → distinguishes signed and absolute order while retaining original sign
- [L57](../../../apps/web/src/features/learning/rank-symbol-concept-lab.test.tsx#L57) — symbol ranking SVG lesson → preserves tied ranks and changes rank without changing the focal value
- [L83](../../../apps/web/src/features/learning/rank-symbol-concept-lab.test.tsx#L83) — symbol ranking SVG lesson → separates raw and relative metrics and discloses missing or incomparable baselines
- [L98](../../../apps/web/src/features/learning/rank-symbol-concept-lab.test.tsx#L98) — symbol ranking SVG lesson → withholds invalid values instead of treating them as zero
- [L112](../../../apps/web/src/features/learning/rank-symbol-concept-lab.test.tsx#L112) — symbol ranking SVG lesson → reorders native SVG rows and keeps the selected source sign visible
- [L124](../../../apps/web/src/features/learning/rank-symbol-concept-lab.test.tsx#L124) — symbol ranking SVG lesson → plays only peer changes and stops on snapshot selection
- [L138](../../../apps/web/src/features/learning/rank-symbol-concept-lab.test.tsx#L138) — symbol ranking SVG lesson → exposes small-baseline extremes and exclusions when the volume floor changes
- [L156](../../../apps/web/src/features/learning/rank-symbol-concept-lab.test.tsx#L156) — symbol ranking SVG lesson → keeps candidate B while separating peer baseline and coverage revisions
- [L176](../../../apps/web/src/features/learning/rank-symbol-concept-lab.test.tsx#L176) — symbol ranking SVG lesson → supports Chinese and guards unavailable data
- [L183](../../../apps/web/src/features/learning/rank-symbol-concept-lab.test.tsx#L183) — symbol ranking SVG lesson → preserves version 2 grading and anonymous free-preview access

### `apps/web/src/features/learning/recap-concept-lab.test.tsx`

- [L48](../../../apps/web/src/features/learning/recap-concept-lab.test.tsx#L48) — market recap SVG lesson → uses the same teaching packet and keeps volume and premium units separate
- [L63](../../../apps/web/src/features/learning/recap-concept-lab.test.tsx#L63) — market recap SVG lesson → keeps volume available when price is unknown and distinguishes missing from zero
- [L92](../../../apps/web/src/features/learning/recap-concept-lab.test.tsx#L92) — market recap SVG lesson → quantifies axis distortion without changing the source ratio
- [L99](../../../apps/web/src/features/learning/recap-concept-lab.test.tsx#L99) — market recap SVG lesson → distinguishes a supported packet fact from a mismatched chart quantity
- [L113](../../../apps/web/src/features/learning/recap-concept-lab.test.tsx#L113) — market recap SVG lesson → changes only geometry when the axis minimum changes
- [L123](../../../apps/web/src/features/learning/recap-concept-lab.test.tsx#L123) — market recap SVG lesson → plays marked crop examples and stops on direct axis input
- [L137](../../../apps/web/src/features/learning/recap-concept-lab.test.tsx#L137) — market recap SVG lesson → repairs fixed overclaim examples while retaining the valid observed quantity
- [L156](../../../apps/web/src/features/learning/recap-concept-lab.test.tsx#L156) — market recap SVG lesson → assembles concrete caption fields without pretending metadata certifies prose
- [L171](../../../apps/web/src/features/learning/recap-concept-lab.test.tsx#L171) — market recap SVG lesson → supports Chinese and guards unavailable data
- [L178](../../../apps/web/src/features/learning/recap-concept-lab.test.tsx#L178) — market recap SVG lesson → preserves version 2 grading, shared capstone data and writing self-review

### `apps/web/src/features/learning/regime-concept-lab.test.tsx`

- [L50](../../../apps/web/src/features/learning/regime-concept-lab.test.tsx#L50) — gamma regime SVG lesson → keeps local sensitivity units and offsets the delta change
- [L66](../../../apps/web/src/features/learning/regime-concept-lab.test.tsx#L66) — gamma regime SVG lesson → does not confuse near-zero net with low gross or incomplete positions with zero
- [L75](../../../apps/web/src/features/learning/regime-concept-lab.test.tsx#L75) — gamma regime SVG lesson → finds adjacent repriced sign brackets under the specified position scope
- [L86](../../../apps/web/src/features/learning/regime-concept-lab.test.tsx#L86) — gamma regime SVG lesson → distinguishes an exact sign-changing node from a zero touch and permits multiple crossings
- [L104](../../../apps/web/src/features/learning/regime-concept-lab.test.tsx#L104) — gamma regime SVG lesson → links portfolio and move controls while preserving gross sensitivity
- [L119](../../../apps/web/src/features/learning/regime-concept-lab.test.tsx#L119) — gamma regime SVG lesson → plays the supplied moves and stops when the learner changes the move
- [L132](../../../apps/web/src/features/learning/regime-concept-lab.test.tsx#L132) — gamma regime SVG lesson → selects supplied SVG samples and changes scope without inventing gap values
- [L148](../../../apps/web/src/features/learning/regime-concept-lab.test.tsx#L148) — gamma regime SVG lesson → reveals fixed records independently without treating a target as a fill
- [L166](../../../apps/web/src/features/learning/regime-concept-lab.test.tsx#L166) — gamma regime SVG lesson → supports Chinese and guards unavailable data
- [L173](../../../apps/web/src/features/learning/regime-concept-lab.test.tsx#L173) — gamma regime SVG lesson → preserves authorized Learn and original version 2 grading

### `apps/web/src/features/learning/rights-concept-lab.test.tsx`

- [L47](../../../apps/web/src/features/learning/rights-concept-lab.test.tsx#L47) — rights concept lesson → keeps all four rights correct and reverses cash and shares for puts
- [L65](../../../apps/web/src/features/learning/rights-concept-lab.test.tsx#L65) — rights concept lesson → distinguishes all four position actions and preserves an unknown initial position
- [L88](../../../apps/web/src/features/learning/rights-concept-lab.test.tsx#L88) — rights concept lesson → lets students compare all roles without clearing the current choice
- [L102](../../../apps/web/src/features/learning/rights-concept-lab.test.tsx#L102) — rights concept lesson → updates signed inventory and removes any claimed result when the starting position is missing
- [L125](../../../apps/web/src/features/learning/rights-concept-lab.test.tsx#L125) — rights concept lesson → separates premium from exercise cash, reverses the current comparison and pauses on direct selection
- [L167](../../../apps/web/src/features/learning/rights-concept-lab.test.tsx#L167) — rights concept lesson → provides Chinese scenes, stops playback on hide and restores scene defaults on reset
- [L180](../../../apps/web/src/features/learning/rights-concept-lab.test.tsx#L180) — rights concept lesson → adds a Learn-only lab without changing the assessment or dispatching exploration as answers

### `apps/web/src/features/learning/sentiment-concept-lab.test.tsx`

- [L51](../../../apps/web/src/features/learning/sentiment-concept-lab.test.tsx#L51) — flow sentiment teaching lab → maps every option/action combination from the likely aggressor's perspective
- [L58](../../../apps/web/src/features/learning/sentiment-concept-lab.test.tsx#L58) — flow sentiment teaching lab → requires a usable reference and keeps uncertain evidence indeterminate
- [L91](../../../apps/web/src/features/learning/sentiment-concept-lab.test.tsx#L91) — flow sentiment teaching lab → preserves missing inventory and distinguishes protection from closing a short
- [L109](../../../apps/web/src/features/learning/sentiment-concept-lab.test.tsx#L109) — flow sentiment teaching lab → links matrix controls, plays all four mappings, and stops when edited
- [L135](../../../apps/web/src/features/learning/sentiment-concept-lab.test.tsx#L135) — flow sentiment teaching lab → teaches neutral as uncertainty without implying a flat view or neutral portfolio
- [L159](../../../apps/web/src/features/learning/sentiment-concept-lab.test.tsx#L159) — flow sentiment teaching lab → withholds direction for missing and complex evidence while retaining the recorded trade
- [L170](../../../apps/web/src/features/learning/sentiment-concept-lab.test.tsx#L170) — flow sentiment teaching lab → replays different position contexts without changing the flow label or inventing missing shares
- [L194](../../../apps/web/src/features/learning/sentiment-concept-lab.test.tsx#L194) — flow sentiment teaching lab → lets native timeline input interrupt playback and supports Chinese
- [L211](../../../apps/web/src/features/learning/sentiment-concept-lab.test.tsx#L211) — flow sentiment teaching lab → rejects absent and mismatched paid teaching data
- [L217](../../../apps/web/src/features/learning/sentiment-concept-lab.test.tsx#L217) — flow sentiment teaching lab → keeps exploration local, uses authorized Learn data, and preserves version 2 grading

### `apps/web/src/features/learning/settlement-concept-lab.test.tsx`

- [L49](../../../apps/web/src/features/learning/settlement-concept-lab.test.tsx#L49) — expiration and settlement concept lesson → distinguishes a closing sale from exercising a call or put
- [L72](../../../apps/web/src/features/learning/settlement-concept-lab.test.tsx#L72) — expiration and settlement concept lesson → separates style, trading and calendar DTE under the stated schedule
- [L98](../../../apps/web/src/features/learning/settlement-concept-lab.test.tsx#L98) — expiration and settlement concept lesson → preserves raw negative differences, floors only payoff and retains missing references
- [L121](../../../apps/web/src/features/learning/settlement-concept-lab.test.tsx#L121) — expiration and settlement concept lesson → plays the closing example and switches to exercise without dispatching a real trade
- [L142](../../../apps/web/src/features/learning/settlement-concept-lab.test.tsx#L142) — expiration and settlement concept lesson → keeps 0DTE distinct from an open window and lets a timeline edit stop playback
- [L179](../../../apps/web/src/features/learning/settlement-concept-lab.test.tsx#L179) — expiration and settlement concept lesson → never substitutes the inspected last display for the official settlement reference
- [L203](../../../apps/web/src/features/learning/settlement-concept-lab.test.tsx#L203) — expiration and settlement concept lesson → changes product units and keeps missing cash references missing after a physical comparison
- [L228](../../../apps/web/src/features/learning/settlement-concept-lab.test.tsx#L228) — expiration and settlement concept lesson → renders Chinese scenes with reduced motion and resets the selected scene
- [L246](../../../apps/web/src/features/learning/settlement-concept-lab.test.tsx#L246) — expiration and settlement concept lesson → keeps exploration in Learn and preserves the existing version 2 assessment

### `apps/web/src/features/learning/side-concept-lab.test.tsx`

- [L52](../../../apps/web/src/features/learning/side-concept-lab.test.tsx#L52) — execution-side teaching lab → classifies exact quote boundaries and the entire interior without rounding prices
- [L64](../../../apps/web/src/features/learning/side-concept-lab.test.tsx#L64) — execution-side teaching lab → withholds unreliable reference classifications with a specific reason
- [L92](../../../apps/web/src/features/learning/side-concept-lab.test.tsx#L92) — execution-side teaching lab → separates a location observation from an inference and unavailable order or intent information
- [L102](../../../apps/web/src/features/learning/side-concept-lab.test.tsx#L102) — execution-side teaching lab → links SVG dragging and the normal range, preserving non-midpoint MID prices
- [L125](../../../apps/web/src/features/learning/side-concept-lab.test.tsx#L125) — execution-side teaching lab → visits all supplied regions and retains the last frame after playback completes
- [L140](../../../apps/web/src/features/learning/side-concept-lab.test.tsx#L140) — execution-side teaching lab → stops playback immediately when the SVG marker is grabbed or edited
- [L156](../../../apps/web/src/features/learning/side-concept-lab.test.tsx#L156) — execution-side teaching lab → keeps the print unchanged when reference evidence changes and reset restores only this scene
- [L176](../../../apps/web/src/features/learning/side-concept-lab.test.tsx#L176) — execution-side teaching lab → changes the evidence level without changing the selected print, and handles outside-spread claims conservatively
- [L195](../../../apps/web/src/features/learning/side-concept-lab.test.tsx#L195) — execution-side teaching lab → renders Chinese controls and rejects missing or mismatched teaching data
- [L206](../../../apps/web/src/features/learning/side-concept-lab.test.tsx#L206) — execution-side teaching lab → projects paid Learn data without changing the version 2 classification assessment

### `apps/web/src/features/learning/source-concept-lab.test.tsx`

- [L54](../../../apps/web/src/features/learning/source-concept-lab.test.tsx#L54) — source audit SVG lesson → withholds an occurred event until receipt and exposes it exactly at receipt
- [L76](../../../apps/web/src/features/learning/source-concept-lab.test.tsx#L76) — source audit SVG lesson → audits identity, date, window, unit, receipt and coverage independently
- [L98](../../../apps/web/src/features/learning/source-concept-lab.test.tsx#L98) — source audit SVG lesson → accepts observed zero but not missing, not-applicable or invalid values
- [L123](../../../apps/web/src/features/learning/source-concept-lab.test.tsx#L123) — source audit SVG lesson → matches the explicitly selected session rather than always preferring the newest
- [L135](../../../apps/web/src/features/learning/source-concept-lab.test.tsx#L135) — source audit SVG lesson → keeps calendar dates, cohort membership and the difference decomposition consistent
- [L168](../../../apps/web/src/features/learning/source-concept-lab.test.tsx#L168) — source audit SVG lesson → replays clocks without invalidating dated context and stops on direct input
- [L187](../../../apps/web/src/features/learning/source-concept-lab.test.tsx#L187) — source audit SVG lesson → keeps wrong-source and selected-session decisions visible in the UI
- [L207](../../../apps/web/src/features/learning/source-concept-lab.test.tsx#L207) — source audit SVG lesson → renders zero, missing and not-applicable as separate states
- [L221](../../../apps/web/src/features/learning/source-concept-lab.test.tsx#L221) — source audit SVG lesson → withholds only comparisons that need the missing series and resets local controls
- [L243](../../../apps/web/src/features/learning/source-concept-lab.test.tsx#L243) — source audit SVG lesson → supports Chinese and rejects absent or mismatched teaching data
- [L252](../../../apps/web/src/features/learning/source-concept-lab.test.tsx#L252) — source audit SVG lesson → preserves version 2 grading, Learn projection and paid access

### `apps/web/src/features/learning/strategy-concept-lab.test.tsx`

- [L51](../../../apps/web/src/features/learning/strategy-concept-lab.test.tsx#L51) — option strategies SVG lesson → has complete example curves inside the declared shared ranges, including fee extremes
- [L73](../../../apps/web/src/features/learning/strategy-concept-lab.test.tsx#L73) — option strategies SVG lesson → includes the actual strikes rather than approximating the expiry bends
- [L88](../../../apps/web/src/features/learning/strategy-concept-lab.test.tsx#L88) — option strategies SVG lesson → records roll inventory and cash without inventing the old position's profit
- [L95](../../../apps/web/src/features/learning/strategy-concept-lab.test.tsx#L95) — option strategies SVG lesson → withholds a named structure when viewing only one position
- [L107](../../../apps/web/src/features/learning/strategy-concept-lab.test.tsx#L107) — option strategies SVG lesson → links the SVG and form price controls and separates fees from terminal value
- [L123](../../../apps/web/src/features/learning/strategy-concept-lab.test.tsx#L123) — option strategies SVG lesson → distinguishes covering stock from an uncovered call on the same spot and scale
- [L134](../../../apps/web/src/features/learning/strategy-concept-lab.test.tsx#L134) — option strategies SVG lesson → plays roll records and stops when the native timeline is grabbed
- [L151](../../../apps/web/src/features/learning/strategy-concept-lab.test.tsx#L151) — option strategies SVG lesson → supports Chinese controls and missing or mismatched data
- [L162](../../../apps/web/src/features/learning/strategy-concept-lab.test.tsx#L162) — option strategies SVG lesson → preserves version 2 grading and the authorized Learn boundary

### `apps/web/src/features/learning/surface-concept-lab.test.tsx`

- [L47](../../../apps/web/src/features/learning/surface-concept-lab.test.tsx#L47) — volatility surface SVG lesson → keeps grid dimensions, dates and ATM anchors consistent
- [L74](../../../apps/web/src/features/learning/surface-concept-lab.test.tsx#L74) — volatility surface SVG lesson → does not fill missing trade coverage with a quoted value or zero
- [L81](../../../apps/web/src/features/learning/surface-concept-lab.test.tsx#L81) — volatility surface SVG lesson → separates wing compatibility from the additional ATM requirement
- [L117](../../../apps/web/src/features/learning/surface-concept-lab.test.tsx#L117) — volatility surface SVG lesson → keeps supplied tenors separate from two explicitly different interpolation rules
- [L143](../../../apps/web/src/features/learning/surface-concept-lab.test.tsx#L143) — volatility surface SVG lesson → does not extrapolate or substitute missing anchors, but preserves an exact known node
- [L173](../../../apps/web/src/features/learning/surface-concept-lab.test.tsx#L173) — volatility surface SVG lesson → selects SVG cells and switches source and slice without filling gaps
- [L196](../../../apps/web/src/features/learning/surface-concept-lab.test.tsx#L196) — volatility surface SVG lesson → shows the changed skew sign and preserves only calculable wing metrics
- [L209](../../../apps/web/src/features/learning/surface-concept-lab.test.tsx#L209) — volatility surface SVG lesson → requires opt-in interpolation and marks the result's provenance
- [L243](../../../apps/web/src/features/learning/surface-concept-lab.test.tsx#L243) — volatility surface SVG lesson → supports Chinese and withholds missing or mismatched teaching data
- [L254](../../../apps/web/src/features/learning/surface-concept-lab.test.tsx#L254) — volatility surface SVG lesson → keeps version 2 grading and local exploration behind the existing access boundary

### `apps/web/src/features/learning/tape-concept-lab.test.tsx`

- [L52](../../../apps/web/src/features/learning/tape-concept-lab.test.tsx#L52) — tape record concept lesson → separates quantity, execution count, premium and quantity-weighted price
- [L70](../../../apps/web/src/features/learning/tape-concept-lab.test.tsx#L70) — tape record concept lesson → rejects incompatible or duplicated records and leaves missing premium evidence missing
- [L100](../../../apps/web/src/features/learning/tape-concept-lab.test.tsx#L100) — tape record concept lesson → counts messages separately while duplicates, corrections and cancellations update the current view
- [L129](../../../apps/web/src/features/learning/tape-concept-lab.test.tsx#L129) — tape record concept lesson → does not invent executions for orphan revisions or resurrect a canceled execution ID
- [L153](../../../apps/web/src/features/learning/tape-concept-lab.test.tsx#L153) — tape record concept lesson → allows only a documented condition-meaning claim and never derives identity from condition size
- [L168](../../../apps/web/src/features/learning/tape-concept-lab.test.tsx#L168) — tape record concept lesson → updates the aggregate display and explicitly blocks wrong contracts or units
- [L185](../../../apps/web/src/features/learning/tape-concept-lab.test.tsx#L185) — tape record concept lesson → plays, pauses and rewinds message history without double-counting a repeated print
- [L209](../../../apps/web/src/features/learning/tape-concept-lab.test.tsx#L209) — tape record concept lesson → keeps unknown and undocumented condition claims unresolved
- [L222](../../../apps/web/src/features/learning/tape-concept-lab.test.tsx#L222) — tape record concept lesson → supports Chinese reset and rejects missing or mismatched paid teaching data
- [L233](../../../apps/web/src/features/learning/tape-concept-lab.test.tsx#L233) — tape record concept lesson → uses authorized Learn data without changing version 2 aggregation assessment

### `apps/web/src/features/learning/time-vol-rate-concept-lab.test.tsx`

- [L55](../../../apps/web/src/features/learning/time-vol-rate-concept-lab.test.tsx#L55) — time volatility and rates SVG lesson → separates point changes from relative percentages and elapsed calendar days
- [L68](../../../apps/web/src/features/learning/time-vol-rate-concept-lab.test.tsx#L68) — time volatility and rates SVG lesson → scales each contribution once and preserves the supplied long/short signs
- [L92](../../../apps/web/src/features/learning/time-vol-rate-concept-lab.test.tsx#L92) — time volatility and rates SVG lesson → reconciles all build-up stages on the declared common dollar scale
- [L110](../../../apps/web/src/features/learning/time-vol-rate-concept-lab.test.tsx#L110) — time volatility and rates SVG lesson → keeps observed zero valid while withholding missing and invalid contributions
- [L141](../../../apps/web/src/features/learning/time-vol-rate-concept-lab.test.tsx#L141) — time volatility and rates SVG lesson → links the SVG input and displays days, IV points and rate points correctly
- [L158](../../../apps/web/src/features/learning/time-vol-rate-concept-lab.test.tsx#L158) — time volatility and rates SVG lesson → reverses the position sensitivities without treating them as addable quantities
- [L176](../../../apps/web/src/features/learning/time-vol-rate-concept-lab.test.tsx#L176) — time volatility and rates SVG lesson → plays the attribution and stops when the native timeline is grabbed
- [L199](../../../apps/web/src/features/learning/time-vol-rate-concept-lab.test.tsx#L199) — time volatility and rates SVG lesson → withholds incomplete totals but retains unaffected components
- [L222](../../../apps/web/src/features/learning/time-vol-rate-concept-lab.test.tsx#L222) — time volatility and rates SVG lesson → supports Chinese and rejects missing or mismatched teaching data
- [L233](../../../apps/web/src/features/learning/time-vol-rate-concept-lab.test.tsx#L233) — time volatility and rates SVG lesson → preserves grading version 2, access and local-only exploration

### `apps/web/src/features/learning/use-learning-replay.test.tsx`

- [L71](../../../apps/web/src/features/learning/use-learning-replay.test.tsx#L71) — replay transport → plays, pauses, resumes, changes speed and stops at the close
- [L91](../../../apps/web/src/features/learning/use-learning-replay.test.tsx#L91) — replay transport → scrubbing interrupts playback and unmount cancels scheduled work
- [L103](../../../apps/web/src/features/learning/use-learning-replay.test.tsx#L103) — replay transport → pauses when hidden or offscreen and does not skip forward on return
- [L129](../../../apps/web/src/features/learning/use-learning-replay.test.tsx#L129) — replay transport → reduced-motion preference starts at the closing snapshot and offers stepped playback
- [L141](../../../apps/web/src/features/learning/use-learning-replay.test.tsx#L141) — replay transport → pauses normal motion when reduced motion is enabled, then allows explicit stepped playback

### `apps/web/src/features/learning/volatility-concept-lab.test.tsx`

- [L48](../../../apps/web/src/features/learning/volatility-concept-lab.test.tsx#L48) — implied and realized volatility SVG lesson → matches independent Python math.erf price benchmarks to much less than one cent
- [L64](../../../apps/web/src/features/learning/volatility-concept-lab.test.tsx#L64) — implied and realized volatility SVG lesson → inverts price under the stated assumptions and responds to price source and maturity
- [L90](../../../apps/web/src/features/learning/volatility-concept-lab.test.tsx#L90) — implied and realized volatility SVG lesson → rejects missing prices, invalid terms and targets outside the search interval
- [L100](../../../apps/web/src/features/learning/volatility-concept-lab.test.tsx#L100) — implied and realized volatility SVG lesson → uses sample variance, compounding and frequency-matched annualization
- [L128](../../../apps/web/src/features/learning/volatility-concept-lab.test.tsx#L128) — implied and realized volatility SVG lesson → preserves zero dispersion and missing observations instead of dropping them
- [L145](../../../apps/web/src/features/learning/volatility-concept-lab.test.tsx#L145) — implied and realized volatility SVG lesson → distinguishes points from relative percentages and rejects incomplete pair definitions
- [L183](../../../apps/web/src/features/learning/volatility-concept-lab.test.tsx#L183) — implied and realized volatility SVG lesson → fits the price in the UI and does not infer IV from an absent price
- [L206](../../../apps/web/src/features/learning/volatility-concept-lab.test.tsx#L206) — implied and realized volatility SVG lesson → changes the realized estimator's window and sampling while retaining missingness
- [L223](../../../apps/web/src/features/learning/volatility-concept-lab.test.tsx#L223) — implied and realized volatility SVG lesson → does not initialize a missing authored final return as zero
- [L237](../../../apps/web/src/features/learning/volatility-concept-lab.test.tsx#L237) — implied and realized volatility SVG lesson → keeps unspecified historical volatility separate from the required RV20
- [L259](../../../apps/web/src/features/learning/volatility-concept-lab.test.tsx#L259) — implied and realized volatility SVG lesson → supports Chinese and rejects missing or mismatched teaching data
- [L270](../../../apps/web/src/features/learning/volatility-concept-lab.test.tsx#L270) — implied and realized volatility SVG lesson → preserves grading version 2 and the authorized Learn projection

### `apps/web/src/features/trading-hall/baked-lighting.test.ts`

- [L19](../../../apps/web/src/features/trading-hall/baked-lighting.test.ts#L19) — attaches compact lighting with independent UVs and physical ranges
- [L45](../../../apps/web/src/features/trading-hall/baked-lighting.test.ts#L45) — closes decoded images when the other lighting request fails
- [L64](../../../apps/web/src/features/trading-hall/baked-lighting.test.ts#L64) — drains and closes both decodes when navigation aborts during decoding
- [L89](../../../apps/web/src/features/trading-hall/baked-lighting.test.ts#L89) — rejects missing UVs and non-finite intensity before requesting assets

### `apps/web/src/features/trading-hall/binary-backdrop.test.ts`

- [L10](../../../apps/web/src/features/trading-hall/binary-backdrop.test.ts#L10) — reveals one reusable binary layer with the scan and releases its resources
- [L42](../../../apps/web/src/features/trading-hall/binary-backdrop.test.ts#L42) — restores the renderer target and clearing state if drawing the data layer fails

### `apps/web/src/features/trading-hall/market.test.ts`

- [L5](../../../apps/web/src/features/trading-hall/market.test.ts#L5) — fictional market display data → updates every screen deterministically without invalid OHLC bars
- [L17](../../../apps/web/src/features/trading-hall/market.test.ts#L17) — fictional market display data → keeps historical bars stable while the current bar updates

### `apps/web/src/features/trading-hall/model.test.ts`

- [L15](../../../apps/web/src/features/trading-hall/model.test.ts#L15) — ships the modern Blender asset with the complete screen set and generated PBR surfaces
- [L50](../../../apps/web/src/features/trading-hall/model.test.ts#L50) — exports an independent second UV set and physical lighting range for every baked batch
- [L70](../../../apps/web/src/features/trading-hall/model.test.ts#L70) — human viewpoint choreography → uses only two forward transitions with stable reading holds and no reverse pan
- [L106](../../../apps/web/src/features/trading-hall/model.test.ts#L106) — human viewpoint choreography → clamps scroll progress to the story endpoints
- [L113](../../../apps/web/src/features/trading-hall/model.test.ts#L113) — human viewpoint choreography → keeps the entire camera path at human height and outside the seven trading posts
- [L141](../../../apps/web/src/features/trading-hall/model.test.ts#L141) — human viewpoint choreography → frames the real foreground terminal during the inspection beat

### `apps/web/src/features/trading-hall/scan.test.ts`

- [L12](../../../apps/web/src/features/trading-hall/scan.test.ts#L12) — scroll-driven 3D scan → starts solid, scans once, and holds the complete wireframe at the end
- [L42](../../../apps/web/src/features/trading-hall/scan.test.ts#L42) — scroll-driven 3D scan → holds scanned outlines through closing and preserves shared model resources
- [L93](../../../apps/web/src/features/trading-hall/scan.test.ts#L93) — scroll-driven 3D scan → keeps the existing material hook and updates the scan without rebuilding shaders
- [L127](../../../apps/web/src/features/trading-hall/scan.test.ts#L127) — scroll-driven 3D scan → skips outline construction for a reduced-motion visit

### `apps/web/src/i18n/course.test.ts`

- [L6](../../../apps/web/src/i18n/course.test.ts#L6) — localized course manifest → provides Chinese metadata for every lesson
- [L17](../../../apps/web/src/i18n/course.test.ts#L17) — localized course manifest → preserves ids, links, and access contracts when localizing

### `apps/web/src/i18n/messages.test.ts`

- [L11](../../../apps/web/src/i18n/messages.test.ts#L11) — i18n messages → normalizes browser locale hints to supported locales
- [L18](../../../apps/web/src/i18n/messages.test.ts#L18) — i18n messages → keeps every message key usable in both supported locales
- [L25](../../../apps/web/src/i18n/messages.test.ts#L25) — i18n messages → interpolates dynamic values without dropping unknown placeholders

### `apps/web/src/seo/pages.test.ts`

- [L17](../../../apps/web/src/seo/pages.test.ts#L17) — public search contract → discovers every published guide and only publicly readable lessons
- [L40](../../../apps/web/src/seo/pages.test.ts#L40) — public search contract → uses a final canonical host, unique metadata and truthful update dates
- [L63](../../../apps/web/src/seo/pages.test.ts#L63) — public search contract → keeps preview deployments noindex without changing production canonicals
- [L75](../../../apps/web/src/seo/pages.test.ts#L75) — public search contract → publishes real article identity without turning lessons into fake courses

### `apps/web/src/server/access.server.test.ts`

- [L46](../../../apps/web/src/server/access.server.test.ts#L46) — course access server → short-circuits Stripe lookup for an active Course Pass
- [L57](../../../apps/web/src/server/access.server.test.ts#L57) — course access server → preserves unavailable billing when no durable grant exists

### `apps/web/src/server/analytics/posthog.server.test.ts`

- [L50](../../../apps/web/src/server/analytics/posthog.server.test.ts#L50) — server PostHog telemetry boundary → contains SDK construction failures without rejecting the request
- [L74](../../../apps/web/src/server/analytics/posthog.server.test.ts#L74) — server PostHog telemetry boundary → keeps server exceptions consented and release-correlated
- [L145](../../../apps/web/src/server/analytics/posthog.server.test.ts#L145) — server PostHog telemetry boundary → emits slow route timing with local release fallback
- [L169](../../../apps/web/src/server/analytics/posthog.server.test.ts#L169) — server PostHog telemetry boundary → does not construct or call the transport without consent

### `apps/web/src/server/auth.server.test.ts`

- [L17](../../../apps/web/src/server/auth.server.test.ts#L17) — verified server identity → accepts only a verified user backed by a session
- [L35](../../../apps/web/src/server/auth.server.test.ts#L35) — verified server identity → denies missing or unverified identity **[parameterized]**
- [L46](../../../apps/web/src/server/auth.server.test.ts#L46) — verified server identity → does not downgrade an auth outage into an anonymous session or expose upstream errors
- [L55](../../../apps/web/src/server/auth.server.test.ts#L55) — verified server identity → has no identity when auth is disabled

### `apps/web/src/server/billing.server.test.ts`

- [L138](../../../apps/web/src/server/billing.server.test.ts#L138) — Stripe billing server → creates a subscription Checkout Session for the exact membership Price
- [L174](../../../apps/web/src/server/billing.server.test.ts#L174) — Stripe billing server → paginates past old subscriptions to find a valid membership
- [L220](../../../apps/web/src/server/billing.server.test.ts#L220) — Stripe billing server → uses the trusted Vercel deployment origin for Preview callbacks
- [L238](../../../apps/web/src/server/billing.server.test.ts#L238) — Stripe billing server → rejects an untrusted Preview callback host
- [L248](../../../apps/web/src/server/billing.server.test.ts#L248) — Stripe billing server → creates a one-time Checkout Session with bounded entitlement metadata
- [L289](../../../apps/web/src/server/billing.server.test.ts#L289) — Stripe billing server → keeps integration and idempotency identifiers stable for retries
- [L304](../../../apps/web/src/server/billing.server.test.ts#L304) — Stripe billing server → starts a new idempotency generation after Course Pass revocation
- [L327](../../../apps/web/src/server/billing.server.test.ts#L327) — Stripe billing server → blocks new Course Pass sessions when checkout is disabled
- [L336](../../../apps/web/src/server/billing.server.test.ts#L336) — Stripe billing server → keeps Course Pass recovery configured when new sales are disabled
- [L351](../../../apps/web/src/server/billing.server.test.ts#L351) — Stripe billing server → grants access only after exact paid-session verification
- [L367](../../../apps/web/src/server/billing.server.test.ts#L367) — Stripe billing server → continues verifying paid returns after new checkout is disabled
- [L377](../../../apps/web/src/server/billing.server.test.ts#L377) — Stripe billing server → rejects a paid session belonging to another user
- [L388](../../../apps/web/src/server/billing.server.test.ts#L388) — Stripe billing server → restores a verified purchase when the return callback was missed
- [L402](../../../apps/web/src/server/billing.server.test.ts#L402) — Stripe billing server → paginates Checkout Sessions while restoring an older purchase

### `apps/web/src/server/coaching-provider.server.test.ts`

- [L38](../../../apps/web/src/server/coaching-provider.server.test.ts#L38) — coaching provider contract → uses bounded structured output, one provider, zero retries and no text telemetry
- [L56](../../../apps/web/src/server/coaching-provider.server.test.ts#L56) — coaching provider contract → rejects unknown references or false blanket approval
- [L87](../../../apps/web/src/server/coaching-provider.server.test.ts#L87) — coaching provider contract → does not record missing usage as zero cost

### `apps/web/src/server/coaching.server.test.ts`

- [L135](../../../apps/web/src/server/coaching.server.test.ts#L135) — coaching with actual PostgreSQL migrations → completes and resumes two rounds without touching the lesson assessment
- [L155](../../../apps/web/src/server/coaching.server.test.ts#L155) — coaching with actual PostgreSQL migrations → reuses saved prose and rejects an extra competing rationale
- [L169](../../../apps/web/src/server/coaching.server.test.ts#L169) — coaching with actual PostgreSQL migrations → keeps the first result and never calls twice on repeated requests
- [L178](../../../apps/web/src/server/coaching.server.test.ts#L178) — coaching with actual PostgreSQL migrations → serializes simultaneous starts and enforces a shared daily account quota
- [L191](../../../apps/web/src/server/coaching.server.test.ts#L191) — coaching with actual PostgreSQL migrations → rejects a new session before a provider call when the global budget is exhausted
- [L201](../../../apps/web/src/server/coaching.server.test.ts#L201) — coaching with actual PostgreSQL migrations → completes a reserved revision across midnight and lowered admission budget
- [L215](../../../apps/web/src/server/coaching.server.test.ts#L215) — coaching with actual PostgreSQL migrations → rejects stale drafts, unchanged revisions and future independent cases
- [L245](../../../apps/web/src/server/coaching.server.test.ts#L245) — coaching with actual PostgreSQL migrations → isolates accounts and rechecks paid access
- [L269](../../../apps/web/src/server/coaching.server.test.ts#L269) — coaching with actual PostgreSQL migrations → retains result retrieval and deletion when generation is switched off
- [L284](../../../apps/web/src/server/coaching.server.test.ts#L284) — coaching with actual PostgreSQL migrations → scrubs deletion without restoring the used quota
- [L295](../../../apps/web/src/server/coaching.server.test.ts#L295) — coaching with actual PostgreSQL migrations → does not resurrect text if deletion races a running generation
- [L319](../../../apps/web/src/server/coaching.server.test.ts#L319) — coaching with actual PostgreSQL migrations → keeps unknown provider outcomes durable, without retries or private exception logs
- [L335](../../../apps/web/src/server/coaching.server.test.ts#L335) — coaching with actual PostgreSQL migrations → marks crashed leases indeterminate and keeps late feedback tied to its original work
- [L347](../../../apps/web/src/server/coaching.server.test.ts#L347) — coaching with actual PostgreSQL migrations → allows three entitled sessions and stops new calls after an access change
- [L375](../../../apps/web/src/server/coaching.server.test.ts#L375) — coaching with actual PostgreSQL migrations → purges old usage while preserving the reservation and learning text
- [L402](../../../apps/web/src/server/coaching.server.test.ts#L402) — coaching with actual PostgreSQL migrations → purges old deletion tombstones without changing the original lesson

### `apps/web/src/server/learning-journey.test.ts`

- [L99](../../../apps/web/src/server/learning-journey.test.ts#L99) — integrated course persistence journey → opens free foundation %s anonymously and saves completion for an unpaid account **[parameterized]**
- [L133](../../../apps/web/src/server/learning-journey.test.ts#L133) — integrated course persistence journey → checks access, resumes evidence and answers, and preserves completion for %s **[parameterized]**

### `apps/web/src/server/learning.server.test.ts`

- [L132](../../../apps/web/src/server/learning.server.test.ts#L132) — learning persistence and authorization (isolated PostgreSQL) → migrates, saves a numerical response, resumes and retries a lost response exactly once
- [L153](../../../apps/web/src/server/learning.server.test.ts#L153) — learning persistence and authorization (isolated PostgreSQL) → permits one active attempt under simultaneous starts and repeated retries
- [L159](../../../apps/web/src/server/learning.server.test.ts#L159) — learning persistence and authorization (isolated PostgreSQL) → keeps two lessons independent for the same learner
- [L174](../../../apps/web/src/server/learning.server.test.ts#L174) — learning persistence and authorization (isolated PostgreSQL) → atomically resolves concurrent numerical decisions without overwriting the winner
- [L187](../../../apps/web/src/server/learning.server.test.ts#L187) — learning persistence and authorization (isolated PostgreSQL) → checks identity and paid access on every request
- [L221](../../../apps/web/src/server/learning.server.test.ts#L221) — learning persistence and authorization (isolated PostgreSQL) → rejects a cached tab update to a known earlier active case without changing its record
- [L250](../../../apps/web/src/server/learning.server.test.ts#L250) — learning persistence and authorization (isolated PostgreSQL) → requires an explicit restart for retired content and preserves the old record
- [L264](../../../apps/web/src/server/learning.server.test.ts#L264) — learning persistence and authorization (isolated PostgreSQL) → stores immutable results, alternates practice cases and preserves historical progress
- [L285](../../../apps/web/src/server/learning.server.test.ts#L285) — learning persistence and authorization (isolated PostgreSQL) → preserves an archived submitted scenario without certifying the updated lesson
- [L320](../../../apps/web/src/server/learning.server.test.ts#L320) — learning persistence and authorization (isolated PostgreSQL) → copies submitted source work and its exact case into recap, without crossing accounts
- [L349](../../../apps/web/src/server/learning.server.test.ts#L349) — learning persistence and authorization (isolated PostgreSQL) → rejects forged results, invalid numeric input and unanswered submission without logging learner work

### `apps/web/src/server/preview-learning.server.test.ts`

- [L12](../../../apps/web/src/server/preview-learning.server.test.ts#L12) — public practice boundary → rejects paid lesson IDs, invalid histories, and unbounded requests
- [L31](../../../apps/web/src/server/preview-learning.server.test.ts#L31) — public practice boundary → grades a free lesson from validated actions without account storage: %s **[parameterized]**

### `packages/db/scripts/purge-coaching.test.mjs`

- [L5](../../../packages/db/scripts/purge-coaching.test.mjs#L5) — retention defaults to a dry run without connecting
- [L16](../../../packages/db/scripts/purge-coaching.test.mjs#L16) — retention clears only old usage and already-deleted content records

### `packages/db/scripts/revoke-course-pass.test.mjs`

- [L23](../../../packages/db/scripts/revoke-course-pass.test.mjs#L23) — parses a dry-run revocation
- [L35](../../../packages/db/scripts/revoke-course-pass.test.mjs#L35) — accepts the pnpm argument separator
- [L39](../../../packages/db/scripts/revoke-course-pass.test.mjs#L39) — requires exact confirmation for an applied revocation
- [L55](../../../packages/db/scripts/revoke-course-pass.test.mjs#L55) — rejects a Session from the wrong environment
- [L67](../../../packages/db/scripts/revoke-course-pass.test.mjs#L67) — evaluates revocation state using the exact Checkout Session
- [L91](../../../packages/db/scripts/revoke-course-pass.test.mjs#L91) — requires an explicitly injected production database

## Maintenance and coverage gaps

- Reconcile this inventory when route modules, syllabus entries, access IDs, flags or test declarations change. Preserve stable acceptance IDs; add new IDs instead of renumbering recorded runs.
- No browser automation was added or run while writing this document. No test suite, provider flow, payment, deployment or media delivery was executed for this inventory.
- There is no current browser-runner configuration to execute these rows automatically. Existing source assertions can cover code structure without proving real behavior; retain browser GIFs and domain-state evidence for actual acceptance.
- Feature flags, hosted migrations, real OAuth/email delivery, Stripe transactions, R2 playback, coach output quality and analytics ingestion must be established in the named execution environment. Local mocks are explicitly insufficient for those claims.
- Current disabled media and coaching states are valid baseline cases; activated-path tests require explicit fixtures and must not be reported passing from the disabled UI.
