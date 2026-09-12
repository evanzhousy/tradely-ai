# Tradely flat owl brand series

Six SVG poses preserve the canonical flat owl anatomy and four character colors:

| Asset | Intended use |
| --- | --- |
| ready | Default brand presence |
| curious | Discovery and introductions |
| reading | Lessons and guides |
| thinking | Reflection and empty states |
| complete | Confirmed lesson completion, never inferred mastery |
| welcome | First-time orientation |

Pose files: `apps/web/public/brand/owl/*.svg` (168 × 168, transparent).

This folder also contains three independent 600 × 420 product illustration cards, a 1200 × 630 social card, and a 1440 × 2400 overview board. Cards are design assets, not wired application UI. Buttons and wording are examples; they do not change access or grading behavior.

Run `python3 scripts/brand/build-owl-series.py` to regenerate from the canonical `apps/web/public/brand/tradely-mark.svg`. Inspect in a standards-compliant browser or Figma: ImageMagick's fallback SVG renderer mishandles nested rotation and some stroke-only paths.

The reading book, thought dots, completion seal and greeting gesture are approved extensions for this series. Keep the original silhouette and palette; do not communicate essential instructions through expression alone.
