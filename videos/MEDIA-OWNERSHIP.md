# Tradely media ownership

Tradely owns the long-form TradingFlow Academy masters and the options-concept media in this directory. The Landing repository owns short free product-onboarding cards and public marketing cuts.

## Private course media

The eight paid lessons in `tradingflow-foundations` are stored in the Tradely-owned `tradely-media` R2 bucket under:

```text
tradingflow-foundations/<media-key>.mp4
tradingflow-foundations/captions/<media-key>.vtt
```

They are issued through short-lived presigned URLs after the Tradely access decision. They must not be copied into `apps/web/public` or the Landing public media bucket.

## Concept media

The full GEX paper-collage cut and the three concept title cards are archived under `tradingflow-concepts/` in the same private bucket. The Landing site uses a separate, shorter GEX product walkthrough with only the Rank → Symbols workflow.

## Source boundary

`videos/tradingflow-academy/` is the canonical local source tree for Academy renders. `scripts/import-course-media.mjs` imports from this repository by default and accepts an explicit source root only for controlled recovery or re-import work.
