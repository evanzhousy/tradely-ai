# Modern exchange V4 verification

Verified locally on 2026-09-07 against the revised professional/modern direction in `v4-design.md`. The earlier sad/dystopian reference is superseded. The latest precision-line and binary-data section below is the current visual contract; earlier sections retain the verification history.

## Visual result

All three authored Blender cameras were rendered in Cycles at 128 samples with denoising. The entrance, workstation and central views show the same scene, clean stone, maintained walnut, charcoal carpet, readable extruded signage, controlled practical lighting and subtle faceted forms. Generated textures are connected to real mesh materials. The editable source has 9,767 objects, including lights/cameras; the browser export has 32 mesh batches and 232,812 triangles.

The initial raw lighting bake introduced visible grain on ceilings, carpet and walls. A Blender diagnostic using only the baked diffuse illumination reproduced the defect. Baking at 256 samples and denoising the linear HDR atlases removed that grain before range encoding. The browser was then reviewed with the final GLB and final lightmaps, not the diagnostic image.

The result retains a stylized geometric construction. It is not a photographic reconstruction or full real-time path tracer: the browser uses Cycles-baked diffuse light, PBR surfaces and a local specular environment capture. This is the intended lightweight translation of the modern concept.

## Browser observations

Used the requested interactive Browser at `http://127.0.0.1:8250/`, not a screenshot-only test runner.

| Check | Observed result |
| --- | --- |
| Desktop 1440 × 900 | Final model ready, two 4096 lightmaps, 380 market panels, no horizontal overflow. Opening copy and primary CTA readable. |
| Scroll camera | Opening, workstation and final verification views inspected; camera remained at 1.700 m. The final view shows terminals, task lights, wood panels and signage without a large carpet foreground. |
| Reveal/replay | Observed wireframe at progress 0, transition at 0.282, and solid at 1. Replay resets the same model. |
| Pause | Animation stopped; market tick and camera remained unchanged during a 600 ms observation. Resume restored updates. |
| Reduced motion | Animation inactive, solid representation, stationary entrance camera even after scrolling. |
| Offscreen | Animation inactive when scrolled below the Hero. |
| Context loss/recovery | Forced WebGL context loss produced fallback with HTML intact; restoring the context returned to ready and active rendering. |
| Mobile 390 × 844 | Two 2048 lightmaps, mobile quality, 1.700 m camera, readable controls/CTA and no horizontal overflow. |
| Chinese mobile | Chinese copy and labels fit without horizontal overflow; restored original English locale afterward. |
| Primary CTA / disposal | Opened `/learn/audited-boundary`, saw the lesson heading, and observed zero trading-hall canvases on that route. |
| Asset failure | Blocked a required lightmap. Both loading resources were released, canvas removed, and the poster, headline, CTA and statistics remained visible. Unblocked and restored normal preview afterward. |
| Console | Normal final desktop startup had no console errors. Network failure and context-loss tests were deliberate injections. |

Observed frame counters were approximately 37.5 FPS desktop and 25 FPS mobile in this local Browser on an Apple M4 Pro. These are local observations, not cross-device performance guarantees. Browser viewport/media overrides and network blocking were cleared after verification.

## Code and artifact checks

- Node 24 `pnpm --filter web check-types`: passed.
- `vitest run src/features/trading-hall`: 14 tests passed across four files, including bake UV/range/material contracts, reveal/camera behavior, partial load failure and abort cleanup.
- Scoped Biome: passed.
- Python syntax checks for V4 generation/render/bake/export/pack scripts and OIDN bridge: passed.
- Node 24 `pnpm --filter web build`: passed after the final asset export.
- `git diff --check`: passed.

Final runtime GLB: 5,854,004 bytes, SHA-256 `28c982f0750bdd226d54562a0c066a5feabf651d3c5f4ae2502dc81233561443`. The runtime `manifest.json` records current image hashes and lighting ranges. Desktop lighting textures total 4,751,236 bytes; compact textures total 1,718,016 bytes, excluding the model and decoder. Source renders, packed editable Blender files and raw bake data remain in ignored `artifacts/trading-hall/exchange-v4/`.

This verification covers the local landing page. No deployment was performed.

## Scroll simplification — 2026-09-07

User feedback requested fewer scene changes. Replaced the five-point camera/target curves with three held compositions and exactly two forward transitions. The last composition approaches the same terminal instead of turning past the foreground post toward another area. Reduced the sticky story from 270svh to 240svh.

Verified in Browser at 1440 × 900 and 390 × 844. The workstation hold is `(0, 1.7, 10.8)`; the closing hold is `(0.35, 1.7, 8.85)`. Both captions remain readable, the mobile closing view has no horizontal overflow, and reduced motion still returns to the stationary entrance camera. Temporary viewport and media settings were cleared.

The new motion test samples 1,000 scroll steps, checks that there are exactly two movement intervals, verifies stable reading holds, and rejects backward travel or a reverse pan. All 15 trading-hall tests, type checking, scoped Biome, the Node 24 production build, and `git diff --check` passed.

## Scroll-driven scan — 2026-09-07

User feedback moved the wireframe from loading into scrolling. The first frame now uses the complete lit model, without the old timed material reveal or entrance dolly. A single world-space horizontal plane sweeps upward during 20–64% of story progress. A narrow trailing band dims the surfaces and reveals cyan structural edges; its leading line follows the actual geometry. The complete materials return behind the band. The camera still uses the same three held compositions and two forward moves.

Verified in the requested interactive Browser:

- Desktop 1440 × 900: first frame `solid`, scan phase 0; at approximately 33% scroll, `scan-wireframe` with a scan height near 3.08 m. Visually inspected the curved trading posts, screen cases and facades inside the scanned band. Normal shader compilation produced no console errors.
- Closing view: `solid`, scan phase 1. Explicit replay activated the scan while the camera remained at `(0.35, 1.7, 8.85)`.
- Pause during replay: scan height/progress, camera and market tick remained unchanged during a 550 ms observation; resume and subsequent scrolling restored direct scroll control.
- Reverse scroll: the same scan band returned at the same story position; no extra camera turn was introduced.
- WebGL loss/restoration during scanning: entered fallback with rendering stopped, then returned to ready and resumed the scroll-controlled scan. Reflection capture temporarily disabled the band.
- Mobile 390 × 844: solid initial frame, compact 2048 lighting maps, active scan during scrolling, readable caption and no horizontal overflow.
- Reduced motion: solid representation, inactive animation and stationary entrance camera. Browser viewport/media overrides were cleared afterward.

All 16 trading-hall tests, scoped Biome, the Node 24 production build, final project type checking and `git diff --check` passed. Early type-check attempts encountered unrelated in-progress course/house errors; those files were not changed by this task, and the final type-check invocation exited successfully after the workspace updates.

The local development server stopped during verification (exit 143). It was restarted on the same port, and a fresh IAB tab was opened after readiness because the old tab remained on the browser's connection-error page. Normal preview was restored; no production deployment occurred.

## Persistent cyan closing view — 2026-09-07

Adjusted the ending to retain the cyan wireframe. The scan now converts surfaces progressively instead of restoring the materials behind a moving band. After completion, a dedicated uniform holds full-model wireframe coverage and disables the scan beam. Architectural lettering is included in the outline geometry. Reverse scrolling restores the solid entrance; the three camera compositions and two moves are unchanged.

Verified the final `wireframe` state at approximately 94% story progress in Browser, with phase 1 and no shader errors. Inspected the cyan trading posts, architecture and NYSE lettering at the normal desktop viewport and 390 × 844 mobile framing; no horizontal overflow. Updated tests cover the persistent ending, beam-completion state, reverse reset, reduced motion and resource ownership. All 16 scene tests, scoped Biome, project type checking and the production build passed.

## Precision lines and binary data — 2026-09-07

Implemented the user's request for very fine, straight engineering linework and a Matrix-inspired 0/1 background to connect the exchange imagery to the course's focus on data logic.

- Visible strokes use 0.55 CSS-pixel analytical coverage, flat caps, no random vertex displacement or sketch texture, and a small depth bias. Tiny non-structural edges are filtered out. The model was re-exported with 20-bit positions to preserve narrow trim and lettering.
- One reusable 0/1 canvas atlas feeds a slow green data-column shader. Its render target is shared by the backdrop and scanned surface materials. Scanned surfaces keep writing depth, so rear flags and equipment cannot appear through foreground wireframes. There is no per-frame canvas text generation or external data feed.
- Binary data appears with the scan and remains behind the cyan model at the end. Physical dust fades out. Copy-area dimming keeps the educational message readable.
- The English and Chinese captions now communicate the same progression: see the market's underlying data, understand its logic, and improve trading judgment.

Browser verification covered the physical opening, scanning midpoint and complete wireframe/data ending at desktop size, then 390 × 844 mobile rendering with compact 2048 lightmaps. Both English and Chinese closing captions fit without horizontal overflow. The Chinese closing reads “读懂数据逻辑，提升交易判断。” Normal rendering and WebGL restoration produced no console errors. Pause set rendering inactive and held the market clock; the binary shader uses that same clock. Reduced motion showed the solid room with the binary layer hidden. Viewport/media overrides were reset and the original English locale restored after testing.

All 18 trading-hall tests, scoped Biome, final project type checking and the production build passed. Added coverage includes binary-resource reuse/disposal, physical pixel sizing, renderer-target restoration on a drawing error, and preserving the original material/depth behavior.

Current GLB: 6,935,968 bytes, 32 mesh batches, 232,812 triangles, SHA-256 `51c131672c8a147945d0c412499673166ba61551c96869d1791e66fe261d200e`. This replaces the earlier 14-bit export and stays below the revised 7 MB geometry budget. Runtime image maps are unchanged.

The shared port 8250 development process was repeatedly terminated with exit 143 during other workspace activity. Final mobile verification and the retained design preview use the same application on isolated `http://127.0.0.1:8351/`. Its task-owned process is recorded in `/tmp/tradely-design-preview.pid`, with output in `/tmp/tradely-design-preview.log`. No deployment was performed.
