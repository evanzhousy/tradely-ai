# Night Hero verification — 2026-09-06

## Charcoal carpet update

The current floor uses original seamless charcoal carpet color, normal, and roughness maps with a 0.5 m repeat. Both room-floor sections use `EX3_CharcoalCarpetPBR`; the old wood-plank-joint object is hidden and excluded from export. The trading-post wood fascia remains unchanged. The previous wood-floor Blender file and renders are preserved in the ignored `exchange-night-v3/wood-floor-backup/` directory.

Re-rendered all five Cycles views and updated the same-scene WebP loading poster. The actual local Hero was inspected in Browser with `state=ready`, `representation=solid`, eye height 1.700 m, and 380 animated screen surfaces; no console errors were observed. The runtime uses matte carpet shading and neutral ground fill.

Node 24 type checking, all 9 trading-hall tests, scoped Biome, and the production build passed. The exported GLB is 3,063,504 bytes, 16 material batches, and 719,560 triangles. SHA-256: `cac9379b3091e465f1f3d7db17eb51ffb8fa7f8aeeb9c1a4fe49fe99869078fc`. The older counts below describe the earlier wood-floor integration.

## Wireframe transition update

The current opening is now a 0.5 s structural-wireframe hold followed by a material reveal completing at 2.35 s. In-app Browser checks captured the actual wireframe (`revealProgress=0.000`) and a mixed wire/solid frame (`0.460`) with the headline and CTA visible. Pause preserved those frames; replay restarted the transition. The extra wire/occlusion groups are hidden once solid.

A fresh reduced-motion visit rendered the solid scene immediately with no animation loop. A 390 × 844 mobile review verified the wireframe, no horizontal overflow, and headline/CTA opacity 1 when paused early. Losing and restoring WebGL while paused at progress 0 returned to the same paused wireframe state; the reflection capture uses the fully shaded room. Temporary emulation and context-test state were restored afterward.

For this update, Node 24 type checking, all **9 trading-hall tests**, scoped Biome, `git diff --check`, and the production build passed. The added tests cover timing endpoints, reduced-motion bypass, hidden completed overlays, and preserving the source model's shared geometry/materials when disposing the reveal. The full-suite count below records the preceding night-scene integration.

## Night-scene integration checks

Verified the actual running landing page in Codex's in-app Browser at `http://127.0.0.1:8250/`. This is a local implementation; no deployment was requested or performed.

| Requirement | Current evidence |
| --- | --- |
| Model reconstructed from the exchange references | The editable `Tradely_Exchange_Human_Night_v3` scene exists in `artifacts/trading-hall/exchange-night-v3/exchange-human-night-v3.blend`. The exporter evaluated that scene, excluded its hidden proportional figures, and exported the actual geometry. |
| Same physical scene, standing human viewpoint, night | Browser screenshots showed the seven circular posts, flags, dark windows, oak flooring, and monitor rows. Runtime camera height was 1.700 m at rest. The camera test samples the complete path and pointer extremes, verifying standing height and clearance from all seven post footprints. |
| Three.js Hero integration | The homepage loaded `night-v3/exchange.glb` with `data-asset-version=night-v3`, `state=ready`, and 380 screen surfaces. The visible ready-state image was an actual perspective WebGL rendering; the Cycles poster appeared specifically during the tested context-loss fallback. |
| Materials and lighting | Actual glTF checks verify color, normal, and roughness textures plus restored Blender wood tint factors. Browser views show lit surfaces, emissive displays, shadows, dark reflective glazing, and restrained bloom. The lighting is real-time PBR raster rendering; Cycles path tracing remains the offline reference. |
| Motion graphics | Visually reviewed entrance/inspection/context views, eye-level travel, fading/staggered HTML copy, projected terminal marker, and chapter captions. Replay reset the entrance scan to an observed value of 0.048 and resumed animation. |
| Animated simulated market atlas | The 4 × 4 atlas matches Blender UVs and animates all 380 quads. After pause, `marketTick=97` remained unchanged across separate observations; replay was disabled. Resume restarted updates. |
| Desktop and phone layouts | Checked 1440 × 900, 1280 × 720, and 390 × 844. English and Chinese phone screens had no horizontal overflow, with CTA, course facts, disclosure, and motion controls visible. Observed approximately 37.5 FPS on desktop and 25 FPS in the phone-size profile on this machine; this is not a physical-phone benchmark. |
| Reduced motion | Browser media emulation produced `animationActive=false`, a stationary 1.700 m camera, unchanged market tick 601, and matching story/stage heights of 780 px. The media override was cleared after testing. |
| Offscreen suspension | At scrollY 3300 the hall bounds were entirely above the viewport, `animationActive=false`, and market tick 277 remained fixed. Returning to the Hero resumed rendering. |
| Context loss and recovery | Explicitly lost/restored the WebGL context. Loss showed the matching poster and “Trading hall preview”; the headline remained visible and the free-lesson CTA remained present. Restore returned `state=ready`, resumed market updates (103 → 277), and the lit scene was visually checked again. The temporary test handle was deleted. |
| Navigation and resource lifecycle | Clicking the Hero free-lesson CTA reached `/learn/audited-boundary` with the expected lesson heading and zero hall canvases. Reviewed cleanup for the model's geometries/materials/textures and ImageBitmaps, decoder workers, reflection target, postprocess targets, lighting shadows, observers, and animation frame. No console errors were observed in the final verification window. |

## Build and asset checks

- Node 24 type checking passed on the final source.
- Full suite: **124 tests in 32 files passed**.
- Scoped Biome and `git diff --check` passed.
- Production build passed, including the existing Vercel React runtime post-build patch.
- Final GLB: **2,651,424 bytes**, 16 material batches, 732,040 triangles; the source editable scene is preserved separately.
- GLB SHA-256: `4539ae114f84f9efe5ce525a30c58757fb0d1415c7fa81cbae97c7278f2717e3`.
- Same-scene WebP poster: 182,446 bytes. Draco decoder assets are served from the project.
- All current runtime assets are in `apps/web/public/models/trading-hall/night-v3/`. Generated Blender files and reference renders remain in the ignored trading-hall artifact directory.

The original day scene, previous exchange assets, and unrelated house artifacts were preserved. The earlier straight-desk verification document does not describe this release.
