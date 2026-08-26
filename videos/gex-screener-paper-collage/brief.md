# GEX Screener Paper-Collage Tutorial Brief

## Product promise

TradingFlow helps options traders read the gamma regime and strike-level structure before acting on flow. In the current product, the GEX workflow lives in **Rank → Symbols** at `/app/rank/symbols`; the former standalone Gamma Exposure Screener route is legacy.

## Audience and context

- Options traders who know basic calls and puts but are new to gamma exposure.
- Embedded near the top of `/blogs/gex-screener/` as a landscape, sound-on tutorial with useful on-screen text when muted.
- English narration and captions.

## Required product facts

- Positive gamma often makes dealer hedging lean against price moves, which can support calmer, mean-reverting conditions.
- Negative gamma can make dealer hedging reinforce moves, which can support faster, trendier conditions.
- In TradingFlow: open **Rank → Symbols**, use a GEX sort, then open a symbol.
- Read the GEX environment, zero-gamma flip, call wall, and put wall as probabilistic structure—not predictions or guaranteed support/resistance.
- Core gamma structure is snapshot-first. Live spot may overlay as context when available; it does not turn the chain calculation into an intraday recomputation.
- Pair the gamma regime and walls with option flow for confirmation.

## Creative angle

**A paper pinball table makes invisible dealer pressure visible:** price is a blue paper puck, call and put walls are bumpers, and dealer hands either push against the puck or chase it. TradingFlow folds the same table into a readable market map.

## Visual system direction

- 16:9, 1920×1080, approximately 38 seconds across five scenes.
- Handmade paper collage with warm off-white stock, visible fibers, cobalt TradingFlow blue, amber gamma accents, charcoal ink, white cut edges, restrained halftone, and short stop-motion settles.
- Use the exact TradingFlow logo and current Rank Symbols screenshots as references. Product UI shown inside the collage must inherit the paper/halftone treatment without changing labels or inventing controls.
- All critical labels, steps, and the final URL remain real HTML in HyperFrames for spelling and legibility.

## CTA

**Explore GEX in TradingFlow**  
`app.tradingflow.com/app/rank/symbols`

## Production route

Generate real textured paper-cut assets, then animate them deterministically in HyperFrames. Render one scene at a time, create narration/music candidates, assemble to H.264/AAC, and validate duration plus a five-frame contact sheet.

