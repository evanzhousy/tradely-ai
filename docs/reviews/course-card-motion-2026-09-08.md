# SVG course cards and motion

September 8, 2026. Local implementation; no deployment or media upload.

**Design statement:** each public lesson illustration owns one concept and its synthetic visual example; the shared motion renderer explains that illustration without accessing lesson evidence, assessment state or account data.

The curriculum page and homepage now share the illustrated card component. All 36 lessons have different authored SVG diagrams, English/Chinese descriptions and captions, and a complete static fallback. The curriculum groups cards into eight modules and retains module anchors, lesson anchors, ordering, progress and access labels. The lesson sidebar remains compact navigation.

`lesson-infographic-scenes.tsx` owns the 36 compositions and thin shared SVG primitives. `lesson-infographic.tsx` owns the accessible title and scene selection. `lesson-infographic-motion.ts` owns visibility, playback and cleanup. Motion uses native Web Animations, with no new dependency, raster media, canvas or video downloads.

| Before | After | Why |
| --- | --- | --- |
| Most newer lessons shared a three-box diagram | Each lesson has a distinct composition: a matched quote, payoff curve, signed bars, time boundary, source packet or other relevant relationship | Let the illustration identify the lesson's actual concept |
| The curriculum page used text rows | Eight sections of fully linked illustrated cards | Make the graphics visible at the user's course-discovery entry point |
| Motion mainly traced or pulsed generic elements | Directed matching paths, source-to-packet movement, signed bar construction and ordered classification emphasis | Tie motion to the relationship being taught |
| The two local Vite entries could overwrite optimized dependencies | The isolated lesson-preview entry has its own dependency cache | Avoid a static SSR page caused by a stale client-module 504 while both previews run |

Animation timing runs at 2× by default with a quiet rest between sequences. Only illustrations sufficiently within the viewport play. A global control pauses all cards; offscreen/hidden pages cancel active effects and pending cycles. Reduced motion keeps the complete illustration static. Hover, touch and keyboard navigation do not restart the animation. There are no per-frame React updates or analytics events.

The diagrams use explicit units and sign conventions. Numerical checks include $102,500 total premium, 30 contracts/$8,000 from two prints, IV rank 22.2% versus percentile 60%, net GEX +50 versus gross magnitude 150, and portfolio return 10% versus balance growth 32%. Positive and negative exposure bars use the same scale within a diagram. A constant-gamma example changes delta linearly; missing observations remain marked rather than becoming zeros. These are public synthetic concept previews, separate from protected assessment cases.

Validation:

- 296 tests pass in 53 files. Added checks cover all 36 unique compositions in both languages, static fallbacks, accessible title uniqueness, illustrative calculations and new motion paths/timing.
- Workspace TypeScript checks and the production build pass under Node 24. The existing non-failing TanStack circular-dependency warning remains.
- Scoped Biome and Git whitespace checks pass. PostHog credential scanning and the existing media-boundary assertion pass.
- Browser verification on the real curriculum route confirms 36 SVGs, eight module sections and preserved lesson links.
- All 36 illustrations play when brought into view and painted in the browser. A matching particle visibly moved from approximately 1.6 to 38.8 CSS pixels along the same path in successive samples.
- Global pause produces zero active lesson animations and all 36 paused states. Reduced motion produces zero active animations and all 36 reduced states, with text intact.
- English desktop and Chinese 390-pixel mobile checks find no page overflow or SVG text outside the padded viewBox. Dark and light themes were visually checked. The homepage also renders all 36 illustrated cards without overflow. A 36-diagram contact sheet was visually reviewed for units, labels and proportions.

Local screenshots and JSON observations are in ignored `artifacts/course-update/`; validation logs use `/tmp/tradely-card-*.log`. SVG source and tests are committed. Generated verification images are not production media.
