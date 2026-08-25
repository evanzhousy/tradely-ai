---
version: 2
name: TradingFlow Luma Research Shell
description: >
  The approved Academy translation of the current TradingFlow Web App:
  base-luma geometry, Inter typography, TradingFlow dark blue actions, soft
  elevation, borderless cards, semantic data color, and compact analytical
  surfaces.
unit: 1920x1080 frame
source:
  repo: "/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack"
  preset: "base-luma"
  theme: "light"
principle: "One option print is evidence, not a complete trade thesis."

colors:
  background: "#FFFFFF"
  foreground: "#252525"
  card: "#FFFFFF"
  popover: "#FFFFFF"
  primary: "#1E4D7B"
  primaryForeground: "#F8FAFC"
  secondary: "#F5F5F5"
  muted: "#F5F5F5"
  mutedForeground: "#737373"
  border: "#E5E5E5"
  ring: "#1E4D7B"
  chart1: "#8EC5F4"
  chart2: "#4A8FC7"
  chart3: "#356FA5"
  chart4: "#285B8D"
  chart5: "#1E4D7B"
  call: "#168A3D"
  put: "#E5484D"
  neutral: "#737373"
  warning: "#F59E0B"
  captionRail: "#FFFFFF"

typography:
  heading: "Inter"
  body: "Inter"
  data: "JetBrains Mono"
  headingWeight: 700
  bodyWeight: 400
  labelWeight: 700

spacing:
  edge: 84
  topChromeHeight: 78
  bottom: 180
  captionRailHeight: 180
  contentGap: 32

components:
  baseRadius: 10
  videoCardRadius: 30
  chipRadius: 999
  border: "1px solid rgba(37,37,37,0.05)"
  shadow: "0 24px 60px rgba(30,77,123,0.12), 0 2px 10px rgba(15,23,42,0.08)"
  material: "rgba(255,255,255,0.88)"
---

# TradingFlow Luma Research Shell

## Concept angle

The frame behaves like an evidence workbench. A real tape row enters as the
focal object, then the composition progressively separates what was observed,
what the app can infer, and what remains unknowable from a single print.

## Frame composition

- Keep the approved white canvas and solid black body text.
- Use app-like toolbar chrome at the top and a dedicated caption surface at the bottom.
- Scale authentic TradingFlow primitives for video: large headings, soft elevated cards, compact analytical rows, and pill chips.
- Keep data-dense zones compact while leaving one clear explanatory zone per scene.
- Anchor the product surface to an edge; use a second focal point for the active field, hypothesis, or evidence state.

## Typography

- Inter carries headings and explanation.
- Headings use 64–92px at weight 700.
- Body copy uses 28–38px at weight 400.
- JetBrains Mono carries date, time, strike, expiry, price, premium, and evidence states.
- Text remains solid. Never use gradient text.

## Product and data treatment

- Preserve the authentic TradingFlow screenshot and frame it as an app window.
- Reconstructed rows must use only values from `data/spx-print-pair-2026-07-24.json`.
- Call and Put color communicate contract type; blue communicates product focus and sequence.
- Gradients are allowed only inside data bars or progress marks, using one coherent blue family.
- `OBSERVED`, `INFERRED`, `UNKNOWN`, and `IF LINKED` must read as explicit evidence-state chips.

## Motion

- Use critically damped entrances for app chrome and rows.
- Move the screenshot as one stable surface; focus changes happen through callouts, cursor motion, and coordinate-targeted zoom.
- The possible linkage between the call and put uses a dotted bridge that never resolves into a solid certainty line.
- Unknowns remain visible at the end of a scene instead of animating away.

## Do

- Show SPX, 2026-07-24, Historical, and New York time wherever the case appears.
- Pair every directional label with an inference qualifier.
- Keep subtitles isolated from product UI and charts.
- Use the full-color TradingFlow logo in every frame.

## Don't

- Do not claim the two rows are proven legs of one order.
- Do not equate AAsk with a known opening buyer or BBid with a known closing seller.
- Do not equate premium or Vol/OI with conviction or opening activity.
- Do not use serif type, neon finance HUDs, gradient text, or decorative chart junk.
