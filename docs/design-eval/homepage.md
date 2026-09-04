# Scenario: homepage

**Route:** `/`  
**Contract:** `DESIGN.md`  
**Mechanical checks:** `apps/web/src/design-eval/homepage.contract.test.ts`

## Reader

An options trader deciding whether to start the ordered curriculum.

## Frozen inputs

These values must be derived from `tradingFlowCourse`, not invented in the page:

| Field | Value |
| --- | --- |
| Course title | Evidence-Led Options Research |
| Lesson count | 11 |
| Guided minutes | 132 |
| Free / preview lessons | 3 |
| First lesson slug | `audited-boundary` |
| Practice tools | the `practice.tool` on each lesson |
| Partner caveat | TradingFlow is independent and may require its own account |

Viewport for comparison: 1440×900 desktop and 390×844 mobile. Themes: light and dark.

## Rubric

Score yes/no. A no blocks shipping the homepage.

1. Supplied facts survive (counts, minutes, first lesson, tool names, independence caveat).
2. One `h1`. The start action goes to lesson one.
3. First viewport carries the claim, the sourced figures, and the caveat. It is not a masthead followed by empty setup.
4. Curriculum proof is a full-width table mapping lesson → TradingFlow tool. No poster grid, no nested cards, no metadata badges.
5. Access states are written as text (free / paid / unlocked / unavailable / completed).
6. Inter + JetBrains Mono. No Geist. No `vbg-*`. No Vercel wordmark.
7. Light and dark keep the same hierarchy. Mobile stacks claim above figures; the table remains readable (scroll locally if needed).
8. No em dashes or all-caps eyebrows in homepage copy.

## Baseline (2026-09-03)

Loaded `https://vercel.com/design.md` plus `vercel-brand.css`. Composition was already claim + stats + curriculum table. Visual system was Geist on a black/white report canvas, with a second chrome path on `/`.

Failures against this rubric: 6 (foreign type and tokens), 3 (report chrome split from the product shell), and the dual-system exception in `DESIGN.md`.

## Candidate (this loop)

Same composition, Evidence Desk tokens, one product header/footer, `desk-*` primitives. Winner of the matched comparison: this candidate, because it keeps the reader-job structure and restores Tradely identity.

## How to rerun

1. `pnpm --filter web test` (includes homepage.contract.test.ts).
2. `pnpm --filter web dev` and open `/` in light and dark, desktop and mobile.
3. Click Start learning and one table row. Confirm course and lesson pages still use product chrome, not a second visual system.
