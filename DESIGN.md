---
name: Tradely
description: An evidence-led learning desk for option traders.
colors:
  evidence-blue: "#1e4d7b"
  paper: "oklch(1 0 0)"
  ink: "oklch(0.145 0 0)"
  muted-surface: "oklch(0.97 0 0)"
  muted-ink: "oklch(0.556 0 0)"
  divider: "oklch(0.922 0 0)"
  night: "oklch(0.145 0 0)"
  night-surface: "oklch(0.205 0 0)"
  light-ink: "oklch(0.985 0 0)"
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
    backgroundColor: "{colors.evidence-blue}"
    textColor: "{colors.light-ink}"
    rounded: "{rounded.capsule}"
    padding: "0.625rem 1rem"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.md}"
  badge:
    backgroundColor: "{colors.muted-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.capsule}"
    padding: "0.125rem 0.5rem"
    typography: "{typography.label}"
---

# Design System: Tradely

## Overview

**Creative North Star: "The Evidence Desk"**

Tradely should feel like a calm research desk placed beside a live market tool: serious enough for consequential analysis, clear enough for a learner, and restrained enough that the evidence stays louder than the interface. The system inherits TradingFlow's authorized Luma geometry, semantic surfaces, disciplined typography, and deep blue action color while keeping a separate Tradely identity.

The default density is editorial rather than dashboard-heavy. Large thesis statements create orientation; compact mono labels carry sequence, time, and state; quiet elevated panels organize the curriculum. The interface avoids course-marketplace spectacle, simulated trading imagery, and generic grids of video thumbnails.

**Key Characteristics:**

- Evidence-first hierarchy with one dominant reading path.
- Borderless, deeply rounded surfaces over neutral light or night canvases.
- Restrained evidence blue for action and navigation, never for invented market meaning.
- Inter for readable structure and JetBrains Mono for compact metadata.
- Real TradingFlow media appears only inside explicit partner and practice contexts.

## Colors

The palette combines a single sober blue accent with high-clarity neutral surfaces that work in both paper and night modes.

### Primary

- **Evidence Blue** (`#1e4d7b`): Primary actions, progress, links, and small orientation labels.

### Neutral

- **Paper** (`oklch(1 0 0)`): Light canvas and light card surface.
- **Ink** (`oklch(0.145 0 0)`): Primary light-mode text.
- **Muted Surface** (`oklch(0.97 0 0)`): Chips, secondary controls, and quiet grouping.
- **Muted Ink** (`oklch(0.556 0 0)`): Supporting copy and metadata.
- **Divider** (`oklch(0.922 0 0)`): Fine separators and low-contrast rings.
- **Night** (`oklch(0.145 0 0)`): Dark canvas.
- **Night Surface** (`oklch(0.205 0 0)`): Dark cards and sheets.
- **Light Ink** (`oklch(0.985 0 0)`): Primary text on dark surfaces.

**The Semantic Color Rule.** Evidence blue communicates interaction and progress. Green and red are reserved for genuine market data or success/error state; they never decorate lessons.

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

The widest shell is 1480px with 16px mobile gutters, 24px tablet gutters, and 32px desktop gutters. Marketing and course-overview surfaces use split grids; reading surfaces use a 330px curriculum rail and a centered lesson column capped near 920px. Prose itself stays near 72ch.

The responsive sequence is preserved rather than compressed: thesis, action, media, progress, then curriculum. Below 1024px the lesson rail becomes an accordion. Below 768px primary navigation moves into a right-hand sheet, controls retain 44px touch targets, and CTAs stack without centering the reading voice.

Spacing follows an 8px base rhythm, with 16–24px inside components, 32–48px between local groups, and 64–96px between major story sections.

## Elevation & Depth

Depth is hybrid and quiet. Cards use tonal separation, a low ambient shadow, and a 5–10% foreground ring. The sticky header uses translucent material with 20px blur and saturation, but becomes opaque when reduced transparency or increased contrast is requested.

**The Borderless Surface Rule.** Use fill, ambient shadow, and a hairline ring to establish containers. Avoid thick strokes, colored side tabs, and nested boxes.

## Shapes

The base radius is 10px. Buttons, chips, cards, media frames, and sheets extend that base into soft capsules and 26px panels. Circles are reserved for sequence numbers, completion marks, and icon-only controls. Straight dividers may separate list rows, but they do not outline every element.

## Components

### Buttons

- **Shape:** Soft capsule (26px radius) with 36–40px desktop height and 44px coarse-pointer minimum.
- **Primary:** Evidence Blue with light text; large CTAs use 16px horizontal padding.
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

The 64px sticky header uses a text wordmark, low-contrast links, one partnered-tool action, theme control, and account state. Active links become foreground rather than gaining a decorative underline. Mobile navigation is a right-side sheet with the same order and language.

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
