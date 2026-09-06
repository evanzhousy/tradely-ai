# Trading hall verification

Verified locally in Codex @Browser on 2026-09-05. This is a local implementation; it has not been deployed.

| Requested outcome | Evidence |
| --- | --- |
| Imagegen references | Two built-in imagegen outputs were inspected and saved as `artifacts/trading-hall/references/hall-wide.png` and `hall-detail.png`; exact prompts are in `reference-prompts.md`. |
| Blender MCP construction | MCP executed setup, architecture, desk, lighting, refinement, PBR, and export phases. The dedicated Blender scene has 1,231 objects; the existing house scene was preserved. Editable scene is saved as `artifacts/trading-hall/trading-hall.blend`. |
| Three.js trading hall | The running homepage loads the exported GLB and renders an actual perspective scene. GLB has 14 material batches and 45,272 Blender polygons. It is 6,508,680 bytes; SHA-256 is recorded in the asset manifest. |
| Cinematic materials, light, particles | Visually reviewed live PBR walnut/slate surfaces, color/normal/roughness maps, metallic highlights, shadow maps, floor reflection, SSAO, SMAA, bloom, window light shafts, and GPU dust. This is real-time rendering; the imagegen poster is only a loading/failure fallback. |
| Scroll motion graphics | Verified opening, workstation inspection, and market-wall chapters, camera movement, fading text, progress indicator, and a projected inspection frame. A camera test ensures the inspected screen is in frame at the close-up waypoint. |
| Dynamic market screens | The GLB contains 60 screen quads plus two ticker ribbons. Screens display an updating texture atlas with simulated quotes, candles, volume, and order books. Data tests validate every screen's update and OHLC bounds. Runtime market tick advances and remains unchanged while paused. |
| Sylva reference | Studied the reference in @Browser and restarted its reveal. Adapted its wireframe-to-surface progression, layered atmosphere, particles, and parallax into an original exchange-hall environment. No ThreeUI source or assets were copied. |

## Additional checks

- Desktop 1440×900 and mobile 390×844 inspected; no horizontal overflow on mobile.
- English and Chinese layouts inspected.
- Reduced motion disables continuous rendering and removes the extended sticky-scroll section.
- Pause and replay controls verified; replay is disabled while paused.
- Graphics context loss exposes the static fallback and keeps the free-lesson CTA usable; context restoration recovers the scene.
- Clicking the first free lesson opens `/learn/audited-boundary` and removes the hall canvas; resources and image bitmaps are disposed by the renderer.
- Node 24 type check, scoped Biome, `git diff --check`, and production build passed. The repository's Vercel React runtime post-build patch was applied.
- Full suite: 123 tests across 32 files passed.
- Fresh live PBR rendering produced no console errors in the observed verification window.

## Asset licensing

The geometry and dynamic screen textures are original. PBR textures are CC0 assets from Poly Haven:
- https://polyhaven.com/a/natural_walnut_veneer
- https://polyhaven.com/a/slate_floor

Textures are packed in the Blender source, exported as WebP in the GLB, and retained at permanent project paths for editing.
