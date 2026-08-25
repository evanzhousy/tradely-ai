---
workflow: general-video
flow: companion
storyboard: yes
message: "One option print is evidence, not a complete trade thesis."
destination: youtube
aspect: 1920x1080
language: en
audience: "Options traders who use flow scanners and want a repeatable way to read the tape."
length: 420s
angle: "Evidence-first single-print autopsy"
narration: yes
voice: frederick
style_preset: tradingflow-luma-research-shell
---

## Intent

TradingFlow Academy Season 1, Episode 2 teaches the viewer how to read one
option print without collapsing an execution into a confident story. The
lesson begins with a seemingly bullish SPX call, separates observed fields
from execution-side inference, then reveals a same-second put print that makes
a structured-trade hypothesis more plausible without claiming that the two
rows belong to the same participant.

The platform is the teaching tool. The visual language and reasoning contract
continue the approved S1E01 system: calm analyst delivery, authentic
TradingFlow surfaces, explicit data provenance, and visible separation between
OBSERVED, INFERRED, and UNKNOWN.

## Assets

- `assets/app/01-option-trades-2026-07-24.png` — authentic TradingFlow Option Trades Historical tape used for the case study.
- `assets/brand/tradingflow-logo.png` — full-color TradingFlow logo shown throughout.
- `assets/fonts/Inter-Regular.woff2` and `assets/fonts/Inter-Bold.woff2` — app typography for narration-led copy.
- `assets/fonts/JetBrainsMono-400.woff2` — dates, prices, strikes, and evidence states.
- `data/spx-print-pair-2026-07-24.json` — exact visible values and interpretation boundaries for the case.

## Customizations

- Use the TradingFlow Luma Research Shell established in S1E01.
- Keep black English captions in a dedicated 180px bottom rail.
- Keep the full-color TradingFlow logo visible in every frame.
- Use solid text only. Gradients may appear only inside data marks, using one blue family per chart.
- Use authentic product footage as the primary surface, then reconstruct exact row values as larger video-scale primitives for legibility.
- Frederick narration remains the series voice, with a calm analyst cadence.

## Notes

- The case is SPX on 2026-07-24, Historical session data, New York time.
- The two highlighted rows share `17:06:38`, 2026-09-18 expiry, 7445 strike, and size 4.
- The call is `AAsk`; the put is `BBid`. If linked, the pair is consistent with a synthetic-long or risk-reversal-like structure, but the tape alone cannot prove linkage, participant identity, opening/closing status, or full portfolio intent.
- Bid/ask location is an aggressor inference. Premium is money traded, not conviction.
- OI and Vol/OI provide contract context but do not prove a new position.
- The lesson must include counter-evidence, an invalidation test, and a practice task in Option Trades Historical.
