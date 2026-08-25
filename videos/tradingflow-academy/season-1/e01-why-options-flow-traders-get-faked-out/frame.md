---
version: 2
name: TradingFlow Luma Research Shell
description: >
  A video-scale translation of the current TradingFlow Web App: base-luma
  geometry, Inter typography, TradingFlow dark blue actions, soft elevation,
  borderless cards, semantic data color, and compact analytical surfaces.
unit: 1920x1080 frame
source:
  repo: "/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack"
  preset: "base-luma"
  theme: "light"
principle: "Preserve context. Separate evidence, inference, and unknowns."

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
  success: "#168A3D"
  destructive: "#E5484D"
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

## Source of truth

This spec translates the checked-in TradingFlow Web App design contract into
video scale. The app uses the `base-luma` shadcn preset, Inter for body and
headings, JetBrains Mono for data, `#1E4D7B` as the primary brand action color,
soft radius, light elevation, and semantic data colors.

## Frame composition

- Keep the user-confirmed white canvas.
- Use an app-like material toolbar at the top and a separate caption surface at
  the bottom.
- Scale the Web App language for video: large Inter headings, soft elevated
  cards, rounded popovers, compact analytical rows, and pill chips.
- Use localized muted surfaces rather than a graph-paper background.
- Let each scene read as a focused TradingFlow workspace, not an editorial
  magazine spread.

## Typography

- Inter carries all headings and explanatory copy.
- Headings use 64–92px at weight 700 with tight but neutral tracking.
- Body copy uses 28–38px at weight 400.
- JetBrains Mono carries dates, evidence states, step numbers, and data labels.
- Text remains solid. Never use gradient text.

## App surfaces

- Cards are borderless by default and separated by soft elevation.
- Rectangular surfaces use Luma soft radius; chips and active navigation use
  near-pill geometry.
- Use primary blue only for actions, selection, progress, and focused emphasis.
- Preserve authentic TradingFlow screenshots and frame them like app windows,
  without square editorial borders or hard offset shadows.

## Data graphics

- Standard chart families use the TradingFlow blue ramp.
- Call/bullish and Put/bearish encodings use success green and destructive red.
- Gradients are allowed only inside chart marks, progress meters, and data bars.
- Signed values require a visible center or zero baseline.

## Motion

- Motion uses the app’s critically damped feel: no elastic overshoot for chrome.
- Entrances may combine opacity, scale, and short translation, settling cleanly.
- Product screenshots move as stable surfaces; callouts and active tabs carry
  the focus changes.
- The five-step workflow may use a restrained sequential reveal.

## Do

- Use semantic tokens and app primitive shapes.
- Keep data-dense regions compact and explanatory regions breathable.
- Use `OBSERVED`, `INFERRED`, and `UNKNOWN` as badge-like evidence states.
- Keep subtitles isolated from product UI and charts.

## Don't

- Do not use serif display typography.
- Do not use square editorial frames, graph-paper decoration, or cobalt rules.
- Do not add visible card borders solely for definition.
- Do not use neon glow, glass-on-glass layering, or generic finance HUD styling.
- Do not turn descriptive GEX or flow evidence into a predictive certainty.
