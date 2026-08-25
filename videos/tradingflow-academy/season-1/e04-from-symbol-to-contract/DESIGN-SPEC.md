# Design Specification

## Direction: Cobalt Workbench

The film grows directly from TradingFlow’s application design system: near-black canvas, charcoal surfaces, white typography, cobalt navigation, cyan analytical focus, and semantic green/amber/red only when the data meaning requires it.

The lesson alternates between two modes:

- **Workbench mode:** authentic Contract Rank screenshots occupy the visual field. Camera and focus treatments direct attention without repainting the product.
- **Teaching mode:** dark analytical primitives explain relationships that screenshots cannot show cleanly. These primitives reuse the app’s spacing, border radius, typography, and data colors.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| Void | `#05070D` | film background |
| Surface | `#0B0F18` | cards and panels |
| Surface raised | `#121826` | active teaching panel |
| Ink | `#F8FAFC` | primary text |
| Muted | `#94A3B8` | secondary text |
| Cobalt | `#2563EB` | navigation and primary focus |
| Cyan | `#22D3EE` | evidence trace and focus line |
| Green | `#22C55E` | positive semantic value only |
| Amber | `#F59E0B` | caution and mixed-horizon warning |
| Red | `#EF4444` | negative semantic value only |
| Caption paper | `#F8FAFC` | dedicated subtitle rail |
| Caption ink | `#09090B` | subtitles |

No gradient text. Gradients may appear only in charts, light falloff, and depth cues, and each chart keeps one coherent hue family.

## Typography

- Product/UI: system sans, equivalent to Inter
- Numeric readouts: tabular system sans
- Episode labels and annotations: uppercase mono
- Captions: 60 px, 700 weight, black on the light rail
- One line of caption preferred, two lines maximum

## Composition

- 64 px outer safe area
- Persistent 48 px top identity rail
- Persistent 176 px bottom caption rail
- Product screenshot area remains clear of captions
- Full-color TradingFlow mark anchored top right
- Chapter marker anchored top left

## Motion

- All motion is driven by Remotion frames.
- One primary motion per shot.
- Product evidence remains readable for at least 2 seconds after each move settles.
- No perpetual floating or tail drift.
- Camera motion stops before the viewer must read small values.
- Only the selected contract receives a perimeter scan.

## Selected shot recipes

| Narrative beat | Shot card | Style | Adaptation |
| --- | --- | --- | --- |
| One symbol, many contracts | `spotlight-hero-card` | `spotlight-hero-card` | lock one authentic contract row |
| Expiry narrowing | `type-and-filter` | `type-and-filter` | expiry filter types, results contract |
| Strike and moneyness | `row-embed` | `row-embed` | strike rows land into true table slots |
| Repetition | `list-stack-press` | `list-stack-press` | repeated prints stack with weight |
| Vol/OI | `gauge-readout-moves` | `tape-scroll-fixed-pointer` | denominator-aware turnover scale |
| Exact-contract inspection | `graze-face-tour` | `graze-face-tour` | drawer becomes the UI landscape |
| Evidence handoff | `line-carry-transition` | `line-carry-transition` | evidence line connects Rank to Option Trades |
| Unified ending | `ui-to-brand-morph` | `icon-flip-bloom` | selected contract chip resolves into the TradingFlow mark, then the five evidence checks assemble around it |

## Sound

- Low-energy tech-house bed, looped and ducked under narration
- Sparse physical clicks, soft whooshes, one scan sparkle, one drawer snap
- No SFX on every row or every word
- Every cue is pinned to the final extended animation timing, not the earlier styleframe timing
- BGM and no-BGM masters share identical picture and narration timing
