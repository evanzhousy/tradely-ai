# Tradely trading hall

Original environment constructed through Blender MCP from two imagegen references. Runtime model is approximately 6.5 MB, with embedded WebP PBR textures.

- `trading-hall.glb`: 14 material batches, 45,272 Blender polygons, 60 atlas-mapped market surfaces and two ticker surfaces.
- `poster.png`: imagegen concept reference used as a loading/failure fallback, not the interactive renderer.
- `manifest.json`: geometry and source metadata.
- Editable scene: `artifacts/trading-hall/trading-hall.blend` (local generated artifact).
- Reproducible build phases: `scripts/trading-hall/build_scene.py`.
- Exact image prompts: `scripts/trading-hall/reference-prompts.md`.

All runtime market quotes are invented and marked simulated. No external market-data source, customer account, or payment service is used by the scene.

The runtime uses Three.js r185 with PBR materials, procedural grain/roughness, a planar floor reflection, shadow maps, SSAO, SMAA antialiasing, bloom, atmosphere, GPU dust and a wireframe-to-material reveal. Camera and HTML annotations are driven by page scrolling. Reduced motion, pause, graphics fallback and route teardown are supported.

Reference studied visually: https://threeui.com/three-js/sylva-living-world. No ThreeUI source code or assets were copied. CC0 PBR textures from Poly Haven are used alongside original procedural surface detail: https://polyhaven.com/a/natural_walnut_veneer and https://polyhaven.com/a/slate_floor. Their color, OpenGL normal, and roughness maps are embedded in the GLB. Source texture files are retained in `textures/` for the editable Blender project. Geometry and screen-data textures are original.
