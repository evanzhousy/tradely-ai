---
# DESIGN.md. Google Labs spec (alpha) + shadcn/ui Luma preset.
# Tokens are normative. Prose is how to apply them.
# Source: https://ui.shadcn.com/create?preset=b1aIaoaxs
# Style:  official shadcn Base Luma (March 2026). Not "Luna".
version: alpha
name: Tradely
description: >
  An editorial options-learning hub. Visual identity is official shadcn/ui
  Base Luma (preset b1aIaoaxs). Apply the preset for colors, fonts, and
  radius. Product rules below keep Tradely a reading desk, not a dashboard
  or course marketplace.

preset:
  code: b1aIaoaxs
  url: https://ui.shadcn.com/create?preset=b1aIaoaxs
  apply: pnpm dlx shadcn@latest apply b1aIaoaxs --only theme,font -y -c apps/web
  style: luma
  base: base
  baseColor: neutral
  theme: neutral
  chartColor: blue
  iconLibrary: lucide
  font: inter
  fontHeading: inherit
  radius: default
  menuAccent: subtle
  menuColor: default

colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.145 0 0)"
  popover: "oklch(1 0 0)"
  popover-foreground: "oklch(0.145 0 0)"
  primary: "oklch(0.205 0 0)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.97 0 0)"
  secondary-foreground: "oklch(0.205 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  accent: "oklch(0.97 0 0)"
  accent-foreground: "oklch(0.205 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  border: "oklch(0.922 0 0)"
  input: "oklch(0.922 0 0)"
  ring: "oklch(0.708 0 0)"
  sidebar: "oklch(0.985 0 0)"
  sidebar-foreground: "oklch(0.145 0 0)"
  sidebar-primary: "oklch(0.205 0 0)"
  sidebar-primary-foreground: "oklch(0.985 0 0)"
  chart-1: "oklch(0.809 0.105 251.813)"
  chart-2: "oklch(0.623 0.214 259.815)"
  chart-3: "oklch(0.546 0.245 262.881)"
  chart-4: "oklch(0.488 0.243 264.376)"
  chart-5: "oklch(0.424 0.199 265.638)"
  night: "oklch(0.145 0 0)"
  night-card: "oklch(0.205 0 0)"
  night-foreground: "oklch(0.985 0 0)"
  night-primary: "oklch(0.922 0 0)"
  night-primary-foreground: "oklch(0.205 0 0)"
  night-border: "oklch(1 0 0 / 10%)"

typography:
  display:
    fontFamily: Inter Variable, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, sans-serif
    fontSize: clamp(3rem, 5vw, 4.5rem)
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  headline:
    fontFamily: Inter Variable, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, sans-serif
    fontSize: 1.875rem
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: Inter Variable, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, sans-serif
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: Inter Variable, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, sans-serif
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: JetBrains Mono Variable, ui-monospace, SFMono-Regular, monospace
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4

rounded:
  sm: "calc(0.625rem - 4px)"
  md: "calc(0.625rem - 2px)"
  lg: "0.625rem"
  xl: "calc(0.625rem + 4px)"
  2xl: "calc(0.625rem + 8px)"
  3xl: "calc(0.625rem + 12px)"
  4xl: "calc(0.625rem + 16px)"
  full: "9999px"

spacing:
  xs: "0.5rem"
  sm: "1rem"
  md: "1.5rem"
  lg: "2rem"
  xl: "3rem"
  section: "4rem"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.4xl}"
    padding: "0.625rem 0.75rem"
    typography: "{typography.body}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.4xl}"
    padding: "0.625rem 0.75rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.4xl}"
    padding: "{spacing.md}"
  badge:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.3xl}"
    padding: "0.125rem 0.5rem"
    typography: "{typography.label}"
  input:
    backgroundColor: "color-mix(in oklch, var(--input) 50%, transparent)"
    textColor: "{colors.foreground}"
    rounded: "{rounded.3xl}"
    padding: "0.25rem 0.75rem"
---

# Design System: Tradely

## Overview

Tradely uses **shadcn/ui Base Luma**. Luma is the official style (March 2026): rounded geometry, soft elevation, breathable layout, inspired by macOS Tahoe without glass. The named preset in this repo is `b1aIaoaxs` (`style: luma`, `theme: neutral`, `font: inter`, `iconLibrary: lucide`, `radius: default`). Components live in `packages/ui` on Base UI, not Radix.

The product is an editorial learning hub, not a dashboard and not a course marketplace. It should feel like a calm research desk: one thesis, one next action, real lesson media, then an ordered curriculum. TradingFlow appears only in practice, partnership, and the header tool action.

Luma supplies the component geometry. Tradely supplies the reading voice.

**Principles, in order:**

1. Clarity over decoration. Type and layout carry hierarchy before color does.
2. Semantic tokens, not raw colors. Use `bg-primary`, never `bg-blue-500` or `#1e4d7b`.
3. Composition over invention. Prefer shadcn primitives (`Button`, `Card`, `Sheet`, `Alert`) over custom chrome.
4. One thesis per viewport. Supporting sections step down instead of competing with it.
5. Accessibility is a floor. WCAG AA, visible focus, captions, reduced motion, 44px coarse-pointer targets.

Apply or re-apply the preset from the app workspace; do not paste OKLCH into components:

```bash
pnpm dlx shadcn@latest apply b1aIaoaxs --only theme,font -y -c apps/web
pnpm dlx shadcn@latest info --json -c packages/ui
pnpm dlx shadcn@latest docs button
```

`--only theme,font` updates `packages/ui/src/styles/globals.css` and leaves installed Luma components in place. Full `apply` without `--only` reinstalls UI source; do that only when the user asks to overwrite.

Tradely overlays on top of the preset, in `globals.css` only:

- CJK fallbacks on `--font-sans` (`PingFang SC`, `Hiragino Sans GB`, `Noto Sans SC`, `Microsoft YaHei`).
- JetBrains Mono for metadata (`--font-mono`).
- Luma radius ramp through `--radius-4xl` (cards and primary buttons use `rounded-4xl`).
- `material-chrome`, `text-display`, `press-scale`, reduced-motion, reduced-transparency, and 44px coarse-pointer targets.

## Colors

The palette is official Luma **neutral**: near-black primary on paper in light mode, inverted near-white primary in dark mode. Chart tokens stay blue (`chartColor: blue`). Do not restore TradingFlow evidence-blue `#1e4d7b` as `--primary`.

Live values live in `packages/ui/src/styles/globals.css`. The YAML tokens above match that file. Re-apply the preset to change them.

| Token | Use |
| --- | --- |
| `background` / `foreground` | Page canvas and default text |
| `card` / `card-foreground` | Elevated panels, lesson rows, membership card |
| `primary` / `primary-foreground` | The single most important action on a screen |
| `secondary` | Quiet chips, secondary controls |
| `muted` / `muted-foreground` | Captions, duration, category, helper copy |
| `accent` | Hover and selected-row wash |
| `destructive` | Errors and irreversible actions only |
| `border` / `input` / `ring` | Hairline chrome and focus |
| `chart-1`…`chart-5` | Categorical marks if a chart appears |
| `sidebar-*` | Only if a Sidebar primitive is introduced |

**Rules.**

- Never hard-code hex or Tailwind palette classes (`bg-blue-500`, `text-emerald-600`).
- Never author `dark:` color utilities. The `.dark` class redefines the same variables. Primary inverts in dark mode; the role stays.
- Green and red are reserved for genuine success/error or actual market data. They never decorate lessons.
- Dark borders use alpha (`oklch(1 0 0 / 10%)`) so chrome stays quiet on both `background` and `card`.

## Typography

**Sans / heading:** Inter Variable, with CJK system fallbacks.  
**Mono:** JetBrains Mono Variable, for sequence numbers, duration, category, locale labels, and code.

Maximum two font weights on one screen (400 and 600). Optical sizing is on for display type.

| Role | Size | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| Display | `clamp(3rem, 5vw, 4.5rem)` | 600 | `-0.025em` | One thesis per primary surface (`text-display`) |
| Headline | `1.875–2.25rem` | 600 | `-0.025em` | Section breaks, course title |
| Title | `1–1.25rem` | 500–600 | 0 | Cards, lesson names, practice assignment |
| Body | `1rem` / line-height `1.8` | 400 | 0 | Lesson prose, ~68–72ch |
| Label | `0.75rem` mono | 500 | wide caps ok | Counts, time, stage, access state |

Chinese editions keep the same scale. Do not shrink type to “fit more CJK.” Line length may run shorter; size does not.

## Layout

Widest shell is **1480px**. Gutters: 16px mobile, 24px tablet, 32px desktop. Marketing and course-overview surfaces use split grids. Reading surfaces use a ~330px curriculum rail and a lesson column capped near 920px. Prose itself stays near 72ch.

The landing sequence is preserved, not compressed: thesis, one start/continue action, opening-lesson media, how the hub works, grouped curriculum, membership. Below 1024px the lesson rail becomes an accordion. Below 768px primary navigation moves into a right-hand `Sheet`. CTAs stack; they do not center the reading voice.

Spacing uses an 8px base. Inside components: 16–24px. Between local groups: 32–48px. Between major story sections: 64–96px. Use `flex` + `gap-*`, never `space-y-*` / `space-x-*`. Equal width and height use `size-*`.

Breakpoints match Tailwind: `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.

## Elevation & Depth

Luma elevation is quiet: a tonal step, a low `shadow-md`, and a 5–10% foreground ring (`ring-1 ring-foreground/5`, `dark:ring-foreground/10`). Cards sit on `background` without a heavy stroke.

The sticky header uses `material-chrome` (translucent fill, 20px blur, saturation). It becomes opaque under `prefers-reduced-transparency` or `prefers-contrast: more`.

Overlays (`Dialog`, `Sheet`, `Drawer`, `Popover`) get one soft shadow plus a ring. Do not stack shadows. Focus is always `ring`.

**Borderless surface rule.** Establish containers with fill, ambient shadow, and a hairline ring. Avoid thick strokes, colored side tabs, and nested rounded boxes.

## Shapes

`--radius` is `0.625rem`. Luma components derive a long ramp from it; buttons, cards, media frames, and sheets use `rounded-4xl` (26px). Inputs and chips use `rounded-3xl`. Tabs and switches are capsules (`rounded-full`). Circles are for sequence numbers, completion marks, and icon-only controls.

Do not mix sharp 4px corners with Luma capsules on the same view.

## Components

Search existing registries before writing markup: `pnpm dlx shadcn@latest search <intent>`. Installed primitives today: accordion, alert, badge, button, card, progress, separator, sheet, sonner, tooltip. Add with the CLI; do not copy GitHub files by hand.

This project is **Base UI** (`base: base`). Custom triggers use `render`, not Radix `asChild`. Confirm with `pnpm dlx shadcn@latest info -c packages/ui`.

**Compose first**

| Need | Use |
| --- | --- |
| Primary action | `Button` (default). One per viewport. |
| Quiet action | `Button variant="outline"` or `ghost` |
| Callout | `Alert` |
| Empty | `Empty` (add if missing; do not fake it with a dashed `div`) |
| Loading | `Skeleton`; buttons compose `Spinner` + `disabled` |
| Side nav on small screens | `Sheet` with required `SheetTitle` |
| Status | `Badge` variants, not colored spans |
| Toast | `sonner` |

**Buttons.** Soft capsule (`rounded-4xl`), height 36px default / 40px `lg` / 44px coarse-pointer minimum. Primary is near-black (light) or near-white (dark). Hover uses `bg-primary/80`. Press may scale to `0.97`. Icons inside buttons use `data-icon="inline-start"` or `inline-end` with no sizing classes.

**Cards.** `rounded-4xl`, `shadow-md`, hairline ring, `--card-spacing` 24px (16px at `size="sm"`). Use `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter`. Do not dump everything into `CardContent`.

**Chips / badges.** Neutral fill, capsule, 12px. Mono when the chip is measured metadata (duration, sequence). Primary fill is for real active emphasis only.

**Navigation.** 64px sticky header: wordmark, low-contrast links, one partnered-tool action, language, theme, account. Active links become `foreground`. Mobile: right `Sheet`, same order.

**Lesson path.** One ordered list grouped by research stage, not a thumbnail gallery. Stage label above each group. Each row: two-digit sequence, title, access state, bounded summary, duration. Completed, unavailable, and locked stay distinct. Members do not get an extra “unlocked” badge.

**Practice with TradingFlow.** The only intentionally saturated partner panel. Authorized TradingFlow mark, one bounded goal, one deep link, independent-service disclosure. Never Tradely’s primary brand.

**Forms.** `FieldGroup` + `Field`. Validation: `data-invalid` on `Field`, `aria-invalid` on the control. Option sets of 2–7 use `ToggleGroup`. Destructive confirmation uses `AlertDialog`, not `Dialog`.

**Styling contract (shadcn skill).** `className` is for layout, not recoloring primitives. No manual `dark:` colors. No `z-index` on overlays. Conditional classes go through `cn()`. Items belong in their `*Group`. Overlays require a title (`SheetTitle`, `DialogTitle`); hide with `sr-only` if needed.

## Do's and Don'ts

### Do

- Apply preset `b1aIaoaxs` when tokens need to change. Do not paste OKLCH into components.
- Reserve `primary` for the single most important action on the screen.
- Keep lesson prose in 68–72ch with line-height 1.8.
- Use real course media, synchronized text tracks, and explicit partner labeling.
- Keep unavailable, payment-required, and signed-out states visually distinct.
- Support light, dark, reduced-motion, reduced-transparency, and coarse-pointer.
- Check `shadcn search` before inventing chrome.
- Maintain WCAG AA (4.5:1 body text, 3:1 large text and UI chrome).

### Don't

- Don't name this style Luna. The official shadcn style is **Luma**.
- Don't reintroduce `#1e4d7b` or other TradingFlow brand blue as `--primary`.
- Don't turn the curriculum into a marketplace of thumbnail cards.
- Don't use gradients, glow, or decorative finance imagery in place of real instructional evidence.
- Don't use green or red as lifestyle accents, or imply trading outcomes.
- Don't present TradingFlow as Tradely’s shared account, infrastructure, or primary brand.
- Don't fabricate testimonials, outcome claims, or Chinese caption tracks.
- Don't use raw Tailwind palette colors or `dark:` color overrides.
- Don't use `space-y-*`, `w-* h-*` for equal sizes, or extra `z-index` on overlays.
- Don't mix icon libraries. Lucide only.
- Don't mix sharp and Luma-round corners in one view.
- Don't use more than two font weights on one screen.
