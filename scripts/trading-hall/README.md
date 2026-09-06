# Tradely exchange hall

The current landing Hero is **the human-eye-level night exchange V3**. See [the current motion/design contract](night-hero-design.md), [current verification](night-hero-verification.md), and [Blender night-scene instructions](exchange-night-v3-README.md). Its runtime model is `apps/web/public/models/trading-hall/night-v3/exchange.glb`, exported by `export_exchange_night_v3.py`. The following notes describe the preserved earlier straight-desk version.

The user requested imagegen references, Blender MCP construction, a Three.js securities trading hall with many animated market screens, cinematic lighting and particles, scroll motion graphics, and the layered reveal/natural atmosphere of https://threeui.com/three-js/sylva-living-world.

## Sources and ownership

- `reference-prompts.md`: exact prompts used with built-in imagegen.
- `artifacts/trading-hall/references/hall-wide.png` and `hall-detail.png`: generated scene references.
- `build_scene.py`: source for the independent `Tradely_Exchange_Hall_v1` Blender scene; execute its phases through Blender MCP. Existing house scenes are not modified.
- `artifacts/trading-hall/trading-hall.blend`: editable scene-only Blender file.
- `apps/web/public/models/trading-hall/trading-hall.glb`: optimized runtime model, with 60 atlas-mapped market screens and two ticker surfaces.
- `apps/web/src/features/trading-hall/`: renderer, camera choreography, simulated market display atlas, procedural surface detail and atmosphere.
- `apps/web/src/components/trading-hall.tsx`: accessible HTML scene wrapper and controls.

Market displays are fictional and explicitly labeled as simulated. The scene must never use a real user account or financial API. Keep the curriculum, paid/free access states, and independent TradingFlow disclosure intact.

## Verification requirements

Inspect both opening and scrolled camera views in @Browser. Verify dynamic market textures, pointer parallax, reveal, pause, reduced motion, GPU resource disposal on route changes, desktop/mobile layout, and both locales. Run type checking, scoped Biome, tests, and a Node 24 production build. Review visual fidelity against the generated references; loading successfully alone does not prove completion.

## PBR assets

Download `natural_walnut_veneer` and `slate_floor` at 1k through Blender MCP, then run `apply_pbr_assets()` before `export()`. The helper applies tangent-space normal nodes explicitly, packs images, and creates world-scale UVs. Export uses WebP quality 90. Both texture assets are CC0 from Poly Haven; exact source URLs are recorded beside the GLB.
