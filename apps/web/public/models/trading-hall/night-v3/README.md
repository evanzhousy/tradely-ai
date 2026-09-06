# Eye-level night exchange

This runtime asset is exported from the editable `Tradely_Exchange_Human_Night_v3` Blender scene, based on the supplied exchange photograph and the generated documentary reference views. It retains seven circular trading posts, 380 market display quads, 24 tower display faces, architecture, glazing, overhead equipment, and oak flooring. Proportions are photographic approximations rather than a measured reconstruction.

`exchange.glb` has 16 material batches with Draco geometry compression and embedded WebP textures. Original editable objects and Cycles lighting remain in `artifacts/trading-hall/exchange-night-v3/exchange-human-night-v3.blend`. The exporter is `scripts/trading-hall/export_exchange_night_v3.py`; the adjacent manifest records its checksum, size, geometry count, and camera positions.

The Hero uses real-time Three.js PBR shading, practical area lights, shadow-casting spotlights, an interior reflection capture, screen emission, ambient occlusion on desktop, and restrained bloom. It does not run the Cycles path tracer in the browser. All scrolling camera positions remain at standing human height. Sixteen animated atlas tiles serve all 380 screens; the visible values are explicitly simulated.

The poster is a compressed Cycles render of this same scene, used while loading and if graphics rendering is unavailable. It is not substituted for the ready-state WebGL scene.

## Licensing

- Geometry and market atlas: original procedural study for Tradely.
- Walnut texture maps: [Poly Haven natural walnut veneer](https://polyhaven.com/a/natural_walnut_veneer), CC0. Floor and fascia use independently calibrated tint, scale, normal, and roughness settings.
- `draco/` contains the decoder shipped with the installed Three.js 0.185.1 package. Draco is provided by Google under [Apache 2.0](https://github.com/google/draco/blob/main/LICENSE). The decoder is served locally; no external CDN is required.
