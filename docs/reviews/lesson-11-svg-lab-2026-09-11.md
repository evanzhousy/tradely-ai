# Lesson 11: what a tape row represents — SVG review

The Learn stage of `trade-records` now has three interactive SVG scenes. The model owns aggregation and the current execution view; authored source records and definitions remain server-only. Grading and progress continue through the existing learning engine.

## Teaching interactions

1. **Build the row.** Initial uncorrected examples reconstruct contract quantity, unique execution count, premium and quantity-weighted price. A/B produce 40 contracts, two executions, $11,000 premium and $2.75 weighted price versus a $2.50 simple mean. Different contracts, incompatible quote units and duplicate IDs cannot form the proposed aggregate. Missing multiplier evidence does not become an assumed premium. Groups cover selected IDs, not an entire session or an identified investor order.
2. **Replay the messages.** A native SVG timeline and explicit playback follow two initial execution reports, a duplicate, a correction and a cancellation. Three received messages still represent two active executions/40 contracts. Correction replaces B with 20 at $2.80: current quantity 30, premium $7,600. Cancellation removes A: one active execution, quantity 20 and premium $5,600. The underlying initial records remain unchanged for historical replay. Receipt order differs from linked execution-time order. Explicit IDs and revision links, not matching prices/times, drive reconciliation.
3. **Read the condition.** Supplied definitions cover routing, matching, venue/method, linkage and size attributes. They establish the documented meaning only. A large illustrative row does not establish common ownership, institutional identity, inside information or a full strategy. A codebook may be unavailable or may omit the selected flag; neither case is guessed. These are teaching categories, not universal exchange codes.

The aggregation scene uses the initial reports; the message scene explicitly revises their later counted view. Condition examples are separately labeled illustrations. The teaching protocol uses normalized IDs; it is not a production feed decoder, and actual namespaces/correction chains require their own source specification.

## Access and assessment

- `tape-concept.server.ts` owns authored records, receipt times, revision links and definitions. Only the authorized Learn projection supplies these values. Missing or mismatched data receives no client fixture fallback.
- The version 2 assessment remains unchanged: premium 11000, weighted price 2.75 and `no` for aggregation establishing strategy linkage. Independent cases and scoring remain intact.
- Teaching controls send no assessment actions. Continue to practice uses the existing transition; public anonymous practice still rejects this paid lesson.
- The separate local component preview renders the real `LearningScreen` with authored synthetic fixtures and no account/database/billing/analytics connection. It is excluded from the production build.

## Verification

- Final learning/domain/content/server regression run: **34 files, 270 tests passed**.
- Type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed. Authored contract and receipt-time markers are absent from production client JavaScript.
- Ten focused tests passed on the finished source, covering aggregation, inconsistent units/identity, missing multiplier, all replay states, orphan revisions, canceled-ID replay, definition boundaries, native-input interruption, Chinese reset, projection and existing assessment answers.
- Verification was restarted after a condition-label refinement: the intermediate run combined already-loaded old modules with new test expectations. The fresh focused run passed with assertions intact; final regression results are recorded below.
- Desktop checks matched every aggregate and replay quantity above. Unknown condition mappings and institutional claims remained unestablished. No exceptions or browser log errors occurred in the completed interaction sequence.
- At 390px, all Chinese dark-mode scenes fit without horizontal overflow or SVG text outside the viewBox. Reduced motion stayed off during pointer input. Keyboard ArrowRight advanced the native message timeline to one received message/one active execution. Continue to practice opened the existing premium question.

- The production-built local route at `http://127.0.0.1:8252/learn/trade-records` showed the paid-lesson sign-in/access message for the anonymous browser, with no lab or authored contract marker in the document. Paid-account persistence was covered by server regressions; no live authenticated paid-account session was used.
- The final recorded desktop sequence reported no exceptions or browser log errors.

## Evidence

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=trade-records&lang=en&theme=light`. It is not a deployed or authenticated paid-account recording.

[Lesson 11 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-11-interactive-evidence.gif)

The reviewed GIF is 27.38 seconds, 784 × 1100 pixels, 219 frames and 492,101 bytes. A contact sheet decoded from the final GIF was visually checked.

The adjacent `lesson-11-evidence-frames/capture.json` records the source URL, frame timestamps, observed values and browser errors. Frames are assembled directly into a GIF without recreating the interface.

The existing OIC references remain. [Cboe's options feed specification](https://www.cboe.com/document/tech-spec/document/technical-specifications/cboe-titanium-cboe-one-options-feed-specification/) also illustrates why trade breaks refer to execution identifiers. This classroom replay declares its own normalized-ID rules rather than asserting that all feeds use the same wire protocol.

No push or deployment was performed.
