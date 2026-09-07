# Scenario: homepage

**Route:** `/`  
**Contract:** `DESIGN.md` (Research Notebook homepage, 2026-09-07)
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
4. Curriculum proof is a full-width table mapping lesson → TradingFlow tool. Mobile rows stack labeled metadata beneath the lesson. No poster grid, no nested cards, no metadata badges.
5. Access states are written as text (free / paid / unlocked / unavailable / completed).
6. Inter + JetBrains Mono. No Geist. No `vbg-*`. No Vercel wordmark.
7. Light and dark keep the same hierarchy. Mobile stacks claim above figures; the table remains readable (scroll locally if needed).
8. No em dashes or all-caps eyebrows in homepage copy.
9. The hero frames the claim with original typographic field notes at desktop widths and removes the decorative materials on mobile. Neither hero nor footer mounts WebGL or downloads 3D assets. Content requires no animation.
10. The learning outline links to real lesson rows and derives the ranges from the course: scope and discovery, inspection and context, then research and review. The three stages remain one ordered course. Anchor targets stay clear of the sticky header.
11. The illustrative research exercise reveals reasoning on demand and links to the matching free lesson. It makes no live-data or performance claim.

## Baseline (2026-09-03)

Loaded `https://vercel.com/design.md` plus `vercel-brand.css`. Composition was already claim + stats + curriculum table. Visual system was Geist on a black/white report canvas, with a second chrome path on `/`.

Failures against this rubric: 6 (foreign type and tokens), 3 (report chrome split from the product shell), and the dual-system exception in `DESIGN.md`.

## Candidate (2026-09-07)

Fanout reference: spacious typography, tangible study materials, and a clear route into the learning content. Tradely adapts those principles using its own yellow field guide, actual first-lesson note, sourced course figures, continuous learning outline, interactive example, and full evidence table. The original brand, independent TradingFlow relationship, lesson access, and progress contracts remain.

## How to rerun

1. `pnpm --filter web test` (includes homepage.contract.test.ts).
2. `pnpm --filter web dev` and open `/` in light and dark, desktop and mobile.
3. Click Start learning and one table row. Confirm course and lesson pages still use product chrome, not a second visual system.

## Local verification (2026-09-07)

- Node 24 production build and the 9 existing homepage, curriculum-access, and locale checks pass. Scoped Biome checks pass.
- Browser coverage: 320, 390, 768, 1024, and 1440px, each in English/Chinese and light/dark. All 20 combinations fit without horizontal page overflow.
- First-lesson navigation, lesson-row anchors, desktop/mobile exercise reveal and reset, and the responsive menu to pricing work. The hero's course facts and partnership caveat fit the reference viewports.
- Reduced-motion mode has no homepage animations. The homepage mounts no canvas and requests no 3D models.
- The full workspace type check encountered a geometry assignment error in the concurrently edited learning-lab `gex-scene.ts`; the production build and landing checks above are separate evidence. No deployment was performed.
