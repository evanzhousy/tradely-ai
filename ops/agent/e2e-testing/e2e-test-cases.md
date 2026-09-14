# Tradely E2E test cases

Execution procedure: [Browser E2E runbook](browser-e2e-runbook.md). Refresh this inventory from Git history before running; execute one concrete case per goal round and retain outcomes in the run report.

Source inventory date: 2026-09-14. Baseline commit: `bb426208433a4d9d299ad98b051137c54525fd78`.

This is the source-derived acceptance inventory for the current Tradely application. It contains a browser E2E matrix, a per-lesson sweep, and a route inventory. Unit-test declarations are intentionally not maintained in this repository. **Execution status: NOT RUN for every case in this document.** Creating this inventory does not establish local, Preview, production, or provider success.

## Scope and execution contract

- Browser cases below are acceptance scenarios to execute, not an existing browser automation suite. The repository has no browser E2E command; execute these cases through the documented Browser workflow.
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

Account and billing lifecycle coverage: returning-user sign-in (`AUTH-001`–`AUTH-011`), first-time registration (`AUTH-012`–`AUTH-015`), successful Course Pass payment (`BILL-005`), successful membership payment and failed/authenticated payments (`BILL-016`–`BILL-017`), and subscription cancellation through effective access loss and repurchase (`BILL-018`–`BILL-025`). Canceling an unfinished Checkout (`BILL-010`) is distinct from canceling an existing subscription. All remain NOT RUN until evidenced in a named environment.

Each row supplies setup/action and expected observable outcome. Server-negative cases require a controlled request or fixture in addition to browser inspection.

### NAV — Discovery, navigation and content

| ID | Priority | Setup and action | Expected result |
| --- | --- | --- | --- |
| NAV-001 | P1 | Open `/`, use the main free-learning CTA. | Arrive at the beginner foundation entry; free research previews are separately discoverable. |
| NAV-002 | P1 | Open `/courses/tradingflow-foundations`; inspect all modules and lessons. | All 36 lessons in eight modules follow current syllabus order and metadata; current interactive lab additions must remain attached to their lesson without changing syllabus identity. |
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
| AUTH-012 | P0 | Use a never-registered email in the shared sign-in/sign-up OTP flow; verify the code and return to a free lesson. | With provider sign-up enabled, a new verified Tradely identity is established; account-backed learning can save, and no paid entitlement is invented. There is no separate sign-up page in the current route set. |
| AUTH-013 | P0 | Register with a new Google identity, then sign out and sign in again with the same provider. | First successful callback establishes the account; subsequent sign-in returns the same identity and its saved work without creating a duplicate learner. |
| AUTH-014 | P0 | Start registration but abandon verification or enter wrong/expired codes; attempt saved progress and paid access. | Unverified registration does not grant server identity, saved progress, or paid access; valid verification can subsequently recover the flow. |
| AUTH-015 | P0 | Return with an existing email OTP account, then exercise the same-email Google flow in a controlled provider fixture. | Existing email sign-in preserves identity and progress. Record the configured provider linking policy; Google either links through verified provider rules or presents a safe explicit conflict/recovery, never an unverified account merge or transfer of another account's entitlement. |

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
| BILL-016 | P0 | As a newly registered unpaid learner, finish membership Checkout with a successful Stripe test payment; return and reload clean pricing and a paid lesson. | Stripe shows the correct customer, exact membership Price and successful payment/subscription state; the server sees active membership and unlocks paid content. Access survives reload and sign-out/sign-in; a success query alone is insufficient. |
| BILL-017 | P0 | For each offer, use a declined test payment and an authentication-required payment; fail/cancel authentication, then retry successfully. | Failed/incomplete payment grants no new access or false success. Successful authentication and payment grant only the selected offer after its authoritative checks, without duplicate successful purchases from retries. |
| BILL-018 | P0 | As a member without a pass/manual grant, open Manage billing and confirm subscription cancellation in the Stripe Customer Portal. | The correct customer's exact membership subscription is selected; confirmation and Stripe state agree. Record whether the configured portal cancels at period end or immediately. Portal opening alone does not satisfy this case; unavailable cancellation is a blocked acceptance gap. |
| BILL-019 | P0 | With period-end cancellation configured, schedule cancellation and return before the effective end; reload a paid lesson. | Stripe records scheduled cancellation while the subscription remains active/trialing; current server rules retain access until the subscription actually leaves those statuses. No duplicate subscription is created. |
| BILL-020 | P0 | Advance an isolated test subscription through its scheduled end, or use a supported test fixture; refresh pricing and request paid content/progress from an already-open tab. | Stripe confirms canceled/non-active status; without another valid grant, fresh requests deny paid content and writes. Historical learner work is retained, free lessons remain available, and no post-cancellation renewal is collected for that subscription. |
| BILL-021 | P0 | If the configured portal supports immediate cancellation, confirm it and refresh Tradely. | Once Stripe status is no longer active/trialing, paid access is denied absent another valid grant. Record actual refund/proration behavior from the configured test policy; do not assume cancellation produces a refund. |
| BILL-022 | P1 | Open cancellation but abandon before confirmation; separately resume a scheduled cancellation before its end when the portal supports it. | Abandoning leaves the subscription unchanged. Successful resumption clears the scheduled cancellation on the same subscription, retains access and does not create a second subscription. Unsupported resumption is explicitly recorded. |
| BILL-023 | P0 | Cancel membership for a learner who also owns a valid Course Pass, then let membership end. | Recurring membership ends while Course Pass access to its covered course remains active; cancellation does not revoke the independent one-time grant. |
| BILL-024 | P0 | After membership cancellation becomes effective, purchase membership again in test mode. | Exactly one new intended active membership is established on the correct mapped customer; paid access returns and earlier saved learning remains associated with the same user. |
| BILL-025 | P0 | Start Manage billing anonymously, as another account, with no mapped customer, and during a portal/provider error. | Server-owned identity selects the customer; another account cannot manage or cancel the original member's subscription. Missing mapping or provider failure yields safe recovery and does not change membership state. |

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

## Maintenance and coverage gaps

- Reconcile this inventory when route modules, syllabus entries, access IDs, flags or acceptance behavior change. Preserve stable acceptance IDs; add new IDs instead of renumbering recorded runs.
- No browser automation was added or run while writing this document. No provider flow, payment, deployment or media delivery was executed for this inventory.
- There is no current browser-runner configuration to execute these rows automatically. Retain Browser GIFs and domain-state evidence for actual acceptance.
- Feature flags, hosted migrations, real OAuth/email delivery, Stripe transactions, R2 playback, coach output quality and analytics ingestion must be established in the named execution environment. Local mocks are explicitly insufficient for those claims.
- Current disabled media and coaching states are valid baseline cases; activated-path acceptance cases require explicit fixtures and must not be reported passing from the disabled UI.
