# Lesson 30: point-in-time research — SVG review

The Learn stage of `point-in-time-research` now includes four interactive SVG scenes. The domain model owns availability-gated source revisions, recency decay, descriptive score eligibility and toy evaluation counts. Server-only fixtures own records, baseline summaries and evaluation cases. Exploration remains local and ungraded.

## Teaching behavior

- **Respect the cutoff.** A timeline separates event and receipt clocks. At 10:00, only the early 40-contract record is usable; the 09:59 event arrives at 10:02. At 10:03 its correction replaces 100 with 70, giving known subtotal 110 instead of adding revisions. Receipt establishes availability; the supplied source revision number establishes supersession, so a late-arriving older version cannot overwrite a known newer one. Unknown receipt clocks remain unsupported. A newest available correction with unknown quantity does not revive the prior quantity.
- **Let weight decay.** Explicit playback and time/half-life controls apply 80 × (1/2)^(elapsed/half-life). With half-life 60 seconds the weight becomes 40, 20 and 10 after 60, 120 and 180 seconds. The separate example's four raw events and 200 contracts stay fixed. Missing or invalid half-life withholds the weight.
- **Read score meaning.** Native score cards distinguish a strictly-below percentile, a standardized distance and an unavailable outcome probability. The default supplied report gives 90% and z=2; neither is a profit probability. Coverage, comparability and this example's explicit sample policy gate publication. The 30-sample minimum is labeled as a toy protocol, not a universal rule. Zero deviation withholds z while the supported percentile remains available.
- **Protect the holdout.** The learner sets a toy rule before revealing outcomes. The first threshold/result is frozen and retained. With threshold 80, the held-out agreement is 1/2; tuning to 70 after reveal makes a replay 2/2 but marks it as development reuse. Returning to 80 does not restore independence. Reset is explicitly only a reset of the illustration, not a way to unsee real data. Tiny synthetic counts do not establish predictive skill or tradable returns.

## Validation

- **29 tests across four files passed**, including 12 new tests for availability/replacement, out-of-order source revisions, unknown latest quantities, decay, baseline conditions, score semantics, direct geometry, controls, pre/post-reveal protocol state, Chinese and the authorized Learn boundary.
- Workspace type checks, production build, changed-file Biome, credential scan, media-boundary assertion and `git diff --check` passed.
- Version 2 assessment remains unchanged. Its original first case accepts recency weight 20 and rejects use of the late correction at the 10:00 cutoff. Exploration dispatches no assessment actions; Continue opens the existing questions.
- Desktop review caught explanatory text exposing the holdout's aggregate result before the freeze action. The pre-reveal text now contains only protocol guidance; outcome interpretation appears after reveal, with regression checks.
- A reduced-motion coordinate check caught the cutoff marker lagging behind the numeric cutoff. The decorative cutoff line and decay point now render direct SVG coordinates whenever explicit playback is inactive. Regression tests check immediate coordinates, and the browser confirmed x=325 at cutoff 10:03 with subtotal 110 and motion off. Explicit playback alone animates those positions.
- All four scenes fit at 390px in Chinese dark mode without document or SVG-text overflow. Keyboard adjustment after outcome reveal retained the first 1/2 result while showing replay 2/2 and the development-reuse label. Reduced motion remained off. Continue opened the original assessment and removed the lab.
- The production-built route `http://127.0.0.1:8252/learn/point-in-time-research` enforced the anonymous paid gate with no lab or authored source marker. The source marker was absent from client JavaScript while the lab title was present. No authenticated paid-account session was used.

## Evidence

[Lesson 30 interaction GIF](/Users/evansmacbookpro/.codex/visualizations/2026/09/11/01a08f18-1191-7d02-8460-ca434a213789/lesson-30-interactive-evidence.gif)

The GIF records the **actual local component preview** at `http://127.0.0.1:8261/?lesson=point-in-time-research&lang=en&theme=light`. It renders the real learning UI with synthetic fixtures and no account/database/billing/analytics connections. It is not deployed or authenticated paid-account evidence.

The final export is 39.01 seconds, 784 × 1350 pixels, 312 frames and 549,244 bytes. All 27 recorded assertions passed with no browser exceptions or log errors. Frame sampling pauses while tabs settle; actual capture times are retained. The decoded contact sheet, source frames and mobile screenshot were visually reviewed. The adjacent `lesson-30-evidence-frames/capture.json` stores the environment, URL, timestamps, assertions and errors; separate desktop, mobile and paid-gate JSON files retain those checks.

Lessons 31–36 and the final curriculum-wide audit remain required. The owned production preview was stopped after verification. No push or deployment was performed.
