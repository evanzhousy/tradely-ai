# Modern exchange V4

The current direction is professional, modern and confident. The user's correction supersedes the earlier sad/dystopian study. Keep night lighting, eye-level framing, charcoal carpet and subtle faceted construction. The latest iteration starts fully solid and adds one spatial scan/wireframe sweep during scrolling. See `v4-design.md` for the acceptance criteria.

## Editable assets

- `artifacts/trading-hall/exchange-v4/exchange-modern-v4.blend`: editable source scene, separate trading-post, architecture, prop, lighting and camera collections.
- `concept-modern.png`: current concept; the earlier `concept.png` is superseded.
- `textures/modern/`: five imagegen albedos plus technical normal/roughness maps derived from those albedos.
- `v4-modern-imagegen-prompts.json`: exact built-in imagegen prompts, original source paths and project destinations.
- `00-entry-modern.png`, `01-workstation-modern.png`, `02-central-modern.png`: Cycles views of the same modeled scene, at standing eye height.

All physical geometry is authored in Blender by `build_exchange_v4.py`. No third-party model or geometry generator is used. The scene contains seven trading islands, 380 market panels, keyboards, phones, files, chairs, fixtures, stone piers, glazing, ceiling utilities and a simple exterior skyline. Architectural signs are extruded sans-serif geometry for readability.

## Rebuild on this Mac

Use Blender 5.2 with Cycles Metal, its bundled NumPy/Open Image Denoise libraries, macOS Arial and Python 3 with Pillow. Generated input images must exist in the paths above. From the repository root, run each command after the previous command succeeds:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b -t 8 --python scripts/trading-hall/build_exchange_v4.py
/Applications/Blender.app/Contents/MacOS/Blender -b artifacts/trading-hall/exchange-v4/exchange-modern-v4.blend -t 8 --python scripts/trading-hall/render_exchange_v4.py -- final
/Applications/Blender.app/Contents/MacOS/Blender -b artifacts/trading-hall/exchange-v4/exchange-modern-v4.blend -t 8 --python scripts/trading-hall/bake_exchange_v4.py
/Applications/Blender.app/Contents/MacOS/Blender -b artifacts/trading-hall/exchange-v4/exchange-modern-v4-baked.blend -t 8 --python scripts/trading-hall/export_exchange_v4.py
python3 scripts/trading-hall/pack_exchange_v4.py
```

The builder resets only its separate background process. It must never run inside a user's foreground Blender session. Check success markers/status JSON, since Blender can exit zero after a Python exception.

## Runtime lighting and resources

The exported GLB batches meshes by source material and bake group. UV0 maps generated material textures and market imagery; independent UV1 maps two lighting atlases. Direct/indirect diffuse illumination is baked in Cycles at 256 samples, denoised in linear HDR with OIDN, range-scaled and sRGB-encoded. The model stores each range multiplied by pi to match Three.js diffuse irradiance conventions.

The browser decodes 4K lightmaps on desktop and 2K on compact/coarse-pointer devices. A local reflection capture supplies specular response; baked materials disable a second environment diffuse contribution. Surface roughness and normal maps remain active. Screens use a simulated animated market atlas; no market account or financial API is accessed. Restrained bloom and particles finish the scene.

`attachBakedLighting` validates UVs and finite ranges before loading, waits for both decodes, closes partial results on failure/abort, and transfers successful texture ownership to model disposal. `scan.ts` adds a world-space scan plane during 20–64% of scroll progress. Surfaces behind it retain cyan structural edges through the closing view, including the signs. Scanned surfaces sample the same binary background texture while continuing to write depth, so rear physical objects and hidden edges do not show through. The shader wraps the existing baked/PBR material hooks; cleanup restores those hooks and releases only the scan-owned geometry/material. Outline draws continue in the final wireframe view; they are omitted before scanning and in reduced-motion mode. The completed-state uniform covers the entire model and disables the beam.

The precision wireframe uses `LineSegments2` with an antialiased 0.55 CSS-pixel visible stroke. Its slightly wider raster quad supplies antialiasing coverage, not a thick visible line. Flat ends, a small depth bias, and short-edge filtering reduce clutter. The GLB uses 20-bit position quantization and remains under the revised 7 MB geometry budget.

`binary-backdrop.ts` owns the 0/1 glyph atlas, GPU render target, display quad, timing and disposal. It renders the data field once per frame and shares the resulting texture with the scan shaders. The texture is linear and uses the actual drawing-buffer dimensions, keeping the glyphs aligned across surfaces. The background is excluded from physical reflection captures; paused/offscreen/reduced-motion behavior follows the existing renderer lifecycle. No external data source or per-frame canvas text generation is involved.

Reduced motion skips scanning and camera travel. The replay button runs the same scan over 2.8 seconds at the current camera position; subsequent scrolling returns to scroll control. Pause freezes timed replay and ambient animation. Offscreen/context-loss stop rendering; the poster and HTML remain available. Floor cropping remains 16% desktop and 12% mobile, without raising the 1.7 m camera.

## Verification

Record final Browser observations and build results in `v4-verification.md`. Loading a GLB alone is insufficient: inspect opening, middle and final camera views, both display sizes/locales, reveal/replay, pause, reduced motion, fallback/recovery and route disposal. Generated Blender files and review captures stay under ignored `artifacts/`; runtime GLB/WebP/decoder files and reproducible source scripts belong in Git.
