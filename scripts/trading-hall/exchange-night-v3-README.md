# Exchange V3: human viewpoint at night

Requested correction: every camera is a standing person's viewpoint, and the room is shown after dark. All five cameras sit 1.67–1.70 m above the floor. The physical exchange geometry and layout are shared across every view.

- Editable deliverable: `artifacts/trading-hall/exchange-night-v3/exchange-human-night-v3.blend`
- Scene: `Tradely_Exchange_Human_Night_v3`
- Final renders: `artifacts/trading-hall/exchange-night-v3/renders/`, five 1800 × 948 PNGs, Cycles, 96 samples, denoised.
- Cameras: entry, west aisle, central passage, workstation, rear walkway.
- Lighting: black night exterior; 25 ceiling lights aligned with existing luminaires, 56 small under-canopy work lights, and emissive quote/tower displays. No daylight area lights are included.
- Photographic treatment: large-format 70 mm sensor setting, AgX, restrained exposure. It is a visual approximation, not an IMAX-certified optical simulation.

The V2 scene and file remain preserved. V3 copies objects, world, and object-linked materials while reusing immutable mesh geometry. This prevents night lighting and shader edits from changing the daylight scene. Optional proportional background figures remain hidden. Photographic wear, decorative details, and equipment clutter remain simplified; the underlying geometry was not rebuilt during this lighting/camera correction.

## Rebuild and render

With the documentary V2 scene loaded in Blender, execute `build_exchange_night_v3.py` through Blender MCP and call `clone_scene()`, `lighting_and_cameras()`, `carpet_floor()`, and `save()` once in that order. The carpet phase creates original seamless color, roughness, and normal maps, assigns a matte charcoal material to both room-floor sections, and hides the old wood-plank joints. Resume an existing V3 instead of repeating construction. Then run:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b artifacts/trading-hall/exchange-night-v3/exchange-human-night-v3.blend --python scripts/trading-hall/render_exchange_night_v3.py -- final
```

The background render process normalizes the isolated library into a standalone file, saves the entry camera as the opening view, and records actual render completion in `render-final-status.json`. Packed images make the delivered file independent of external texture paths. `standalone-verification.json` records the saved file's camera heights, lighting, and texture checks.

See `exchange-v2-README.md` for reference and texture provenance. No landing-page asset was replaced during this correction.
