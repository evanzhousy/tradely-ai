---
name: Tradely
description: An evidence-led learning desk for option traders.
colors:
  sunflower-yellow: "#f2c94c"
  ink-black: "#111111"
  clean-white: "#ffffff"
  focus-gold: "#8a6a00"
  paper: "#fffcf2"
  card: "#ffffff"
  muted-surface: "#f2f0e8"
  muted-ink: "#5e5a4f"
  divider: "#ddd8c7"
  night: "#111111"
  night-surface: "#1a1a1a"
typography:
  display:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "clamp(3rem, 5vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "JetBrains Mono Variable, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  base: "0.625rem"
  panel: "1.625rem"
  capsule: "1.625rem"
spacing:
  xs: "0.5rem"
  sm: "1rem"
  md: "1.5rem"
  lg: "2rem"
  xl: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.ink-black}"
    textColor: "{colors.sunflower-yellow}"
    rounded: "{rounded.capsule}"
    padding: "0.625rem 1rem"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.panel}"
    padding: "{spacing.md}"
  badge:
    backgroundColor: "{colors.muted-surface}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.capsule}"
    padding: "0.125rem 0.5rem"
    typography: "{typography.label}"
---

# Design System: Tradely

## Overview

**Creative North Star: "The Evidence Desk"**

Tradely should feel like a calm research desk placed beside a live market tool: serious enough for consequential analysis, clear enough for a learner, and restrained enough that the evidence stays louder than the interface. The yellow-black-white Night Scholar Owl gives Tradely its own memorable IP identity, while the system retains TradingFlow-authorized Luma geometry, semantic surfaces, and disciplined typography without implying shared infrastructure or accounts.

The default density is editorial rather than dashboard-heavy. Large thesis statements create orientation; compact mono labels carry sequence, time, and state; quiet elevated panels organize the curriculum. The interface avoids course-marketplace spectacle, simulated trading imagery, and generic grids of video thumbnails.

**Key Characteristics:**

- Evidence-first hierarchy with one dominant reading path.
- Borderless, deeply rounded surfaces over warm-white or ink-black canvases.
- Sunflower yellow for orientation and dark-mode action, with ink black for light-mode interaction and structure.
- The Night Scholar Owl appears as a compact brand signature, not decorative course illustration.
- Inter for readable structure and JetBrains Mono for compact metadata.
- Real TradingFlow media appears only inside explicit partner and practice contexts.

## Agent contract

This file is the design authority for agents working in this repository. Load it before changing UI. Do not load `https://vercel.com/design.md` or Geist/VBG report primitives as Tradely's visual system. Vercel's public file is a foreign brand contract. Tradely may reuse its *method* (reader job, evidence composition, eval loop) while keeping this palette, type, and identity.

### Scope

Applies to every Tradely web surface: homepage, course index, lesson, pricing, auth chrome, legal. Video and ops skills have their own frame contracts and are out of scope here.

### Reader and task

The primary reader is an options trader deciding whether to start the ordered curriculum. The strongest supported answer is: Tradely teaches one research path, then sends the learner to TradingFlow for a bounded practice task. The two products do not share accounts. No outcome, speed, or profitability claim is supported.

### Observable decisions

Agents must be able to point at the rendered page and confirm each of these:

1. The homepage first viewport contains one `h1`, one start-learning action to the first lesson, sourced lesson/minute/preview/progress figures, and the TradingFlow independence caveat.
2. The curriculum proof is a full-width semantic table (or, on in-app lesson rails, one ordered list). It is not a grid of video posters or nested cards.
3. Each homepage lesson row maps the lesson to the TradingFlow tool named in `lesson.practice.tool`.
4. Access states remain distinct in text: free, paid/membership, unlocked, access unavailable, completed.
5. Partner copy states that TradingFlow is independent and may require its own account. It never describes a shared login or shared infrastructure.
6. Inter is the interface face. JetBrains Mono is limited to counts, duration, sequence, access, and compact labels.
7. Sunflower yellow, ink black, and paper/night are the structural colors. Green and red appear only for genuine success/error or market data.
8. Product UI copy does not use em dashes or all-caps decorative eyebrows.
9. Light and dark both preserve the same hierarchy. Reduced motion, reduced transparency, and 44px coarse-pointer targets remain.

### Available primitives

Compose from installed tokens and these named pieces. Do not invent a parallel type scale or a second chrome.

- Theme tokens in `packages/ui/src/styles/globals.css`: `background`, `foreground`, `card`, `muted`, `primary`, `border`, `ring`.
- shadcn controls for behavior: `Button`, `Sheet`, `Header` product chrome, `CourseList` on course/lesson rails.
- Homepage composition classes in `apps/web/src/styles/desk.css`: `desk-opening`, `desk-opening-claim`, `desk-opening-proof`, `desk-opening-context`, `desk-stat-strip`, `desk-stat`, `desk-stat-label`, `desk-stat-value`, `desk-stat-detail`, `desk-curriculum`, `desk-numeric`.
- `LandingCurriculumTable` is the homepage evidence table. `CourseList` is the in-app ordered path. They are cousins; do not merge them.

### Generated-design patterns to refuse

- Marketplace thumbnail grids and stacked video-card catalogs.
- Generic centered hero plus three equal feature cards.
- All-caps or tracked eyebrows, kickers, and decorative numbered section labels.
- Badges or pills for ordinary metadata (course title, "the course", partner kicker).
- Nested cards used to repair weak hierarchy.
- Gradients, glow, blobs, glass spectacle, or decorative finance imagery.
- Geist, Vercel wordmark/triangle, or `vbg-*` classes on Tradely product surfaces.
- Invented testimonials, win rates, or "fast/safe" trading claims.

### Eval loop

Homepage is the first frozen scenario: `docs/design-eval/homepage.md`. Mechanical checks live in `apps/web/src/design-eval/homepage.contract.test.ts`. When a review correction repeats, encode it here as an observable rule, in `desk.css` as a primitive, or in that test as a check. Do not hand-tune one generated page and leave the contract unchanged.

## Colors

The palette is derived directly from the selected YBW B1 Night Scholar Owl: sunflower yellow, ink black, and clean white. Light-mode focus gold is a darker yellow sibling used only where the exact brand yellow would not provide sufficient focus contrast on white.

### Brand and action

- **Sunflower Yellow** (`#f2c94c`): The owl body, dark-mode primary actions, progress, and high-salience orientation.
- **Ink Black** (`#111111`): The owl background, primary text, light-mode primary actions, and structural dark surface.
- **Clean White** (`#ffffff`): The owl eye mask, card surfaces, and dark-mode primary text.
- **Focus Gold** (`#8a6a00`): Light-mode focus rings only; it preserves the yellow family while reaching 4.94:1 against the paper canvas.

### Neutral

- **Paper** (`#fffcf2`): Warm-white light canvas.
- **Card** (`#ffffff`): Raised reading and curriculum surfaces.
- **Muted Surface** (`#f2f0e8`): Chips, secondary controls, and quiet grouping.
- **Muted Ink** (`#5e5a4f`): Supporting copy and metadata.
- **Divider** (`#ddd8c7`): Fine separators and low-contrast rings.
- **Night** (`#111111`): Dark canvas and logo field.
- **Night Surface** (`#1a1a1a`): Dark cards and sheets.

**The Semantic Color Rule.** Yellow communicates interaction, progress, and orientation; black and white carry structure and reading hierarchy. Green, red, orange, and blue remain reserved for genuine market data or success/error/info state; they never decorate lessons.

## Typography

**Display Font:** Inter Variable (sans-serif fallback)  
**Body Font:** Inter Variable (sans-serif fallback)  
**Label/Mono Font:** JetBrains Mono Variable (system monospace fallback)

**Character:** Inter keeps the reading voice contemporary and low-friction. JetBrains Mono makes lesson counts, time, categories, and workflow labels feel measured rather than ornamental.

### Hierarchy

- **Display** (600, 3–4.5rem, 1.02): One thesis-level heading per primary surface.
- **Headline** (600, 1.875–2.25rem, 1.1): Section transitions and course framing.
- **Title** (500–600, 1–1.25rem, 1.35): Cards, lessons, and practice assignments.
- **Body** (400, 1rem, 1.8): Lesson prose with a target width of 68–72 characters.
- **Label** (500, 0.75rem, 1.4): Counts, duration, category, and small all-caps wayfinding.

**The One Thesis Rule.** A viewport gets one display-scale claim. Supporting sections step down sharply instead of competing with it.

## Layout

The widest shell is 1480px with 16px mobile gutters, 24px tablet gutters, and 32px desktop gutters. The homepage opening is claim-led: thesis and start action share the first viewport with sourced figures; the curriculum table then owns the full evidence width. Course-overview surfaces use split grids. Reading surfaces use a 330px curriculum rail with a centered lesson column capped near 920px. Prose itself stays near 72ch.

The responsive sequence is preserved rather than compressed: thesis, action, sourced figures, curriculum table, then partnership context. Below 1024px the lesson rail becomes an accordion. Below 768px primary navigation moves into a right-hand sheet, controls retain 44px touch targets, and CTAs stack without centering the reading voice.

Spacing follows an 8px base rhythm, with 16–24px inside components, 32–48px between local groups, and 64–96px between major story sections.

## Elevation & Depth

Depth is hybrid and quiet. Cards use tonal separation, a low ambient shadow, and a 5–10% foreground ring. The sticky header uses translucent material with 20px blur and saturation, but becomes opaque when reduced transparency or increased contrast is requested.

**The Borderless Surface Rule.** Use fill, ambient shadow, and a hairline ring to establish containers. Avoid thick strokes, colored side tabs, and nested boxes.

## Shapes

The base radius is 10px. Buttons, chips, cards, media frames, and sheets extend that base into soft capsules and 26px panels. Circles are reserved for sequence numbers, completion marks, and icon-only controls. Straight dividers may separate list rows, but they do not outline every element.

## Components

### Buttons

- **Shape:** Soft capsule (26px radius) with 36–40px desktop height and 44px coarse-pointer minimum.
- **Primary:** Ink black with sunflower-yellow text in light mode; sunflower yellow with ink-black text in dark mode. Large CTAs use 16px horizontal padding. Homepage start learning is content-sized in the claim column, not a full-width bar.
- **Hover / Focus:** Background darkens or softens; focus adds a semantic ring; press scales to 0.97 with a short ease-out.
- **Secondary / Ghost:** Neutral fill or transparent surface. Outline is quiet and never the page's focal action.

### Chips

- **Style:** Compact neutral fill, capsule silhouette, 12px text; mono is used when the chip conveys measured metadata.
- **State:** Primary fill is reserved for real active emphasis. Most taxonomy chips remain neutral.

### Cards / Containers

- **Corner Style:** 26px panels.
- **Background:** Paper or Night Surface.
- **Shadow Strategy:** Low ambient shadow plus subtle foreground ring.
- **Border:** No heavy border; separators are internal and low contrast.
- **Internal Padding:** 16px compact, 24px standard.

### Navigation

The 64px sticky header uses the Night Scholar Owl mark with the indivisible `Tradely.ai` wordmark, low-contrast links, one partnered-tool action, theme control, and account state. The complete wordmark yields to the standalone mark on small screens. Active links become foreground rather than gaining a decorative underline. Mobile navigation is a right-side sheet with the same order and language.

### Lesson Path

Lessons appear as one ordered list, not a thumbnail gallery. Each row combines a two-digit sequence, title, access state, bounded summary, duration, and category. Completed, unavailable, locked, and unlocked states remain semantically distinct.

### Practice with TradingFlow

The practice card is the only intentionally saturated panel. It pairs the authorized TradingFlow mark with one bounded goal, one deep link, and an explicit independent-service disclosure.

## Do's and Don'ts

### Do:

- **Do** make the next learning action and the next evidence question obvious.
- **Do** keep lesson prose within 68–72ch and use generous line height.
- **Do** use real course media, synchronized text tracks, and explicit partner labeling.
- **Do** preserve separate visual language for access unavailable, payment required, and signed out.
- **Do** support light, dark, reduced-motion, reduced-transparency, and coarse-pointer modes.

### Don't:

- **Don't** turn the curriculum into a generic marketplace of thumbnail cards.
- **Don't** use gradients, glow, or decorative finance imagery in place of real instructional evidence.
- **Don't** use green or red as lifestyle accents or imply trading outcomes.
- **Don't** present TradingFlow as Tradely's shared account, infrastructure, or primary brand.
- **Don't** add heavy borders, colored side tabs, or nested rounded containers without a functional hierarchy.
