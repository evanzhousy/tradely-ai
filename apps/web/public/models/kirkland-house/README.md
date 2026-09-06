# Kirkland house web asset

`house.glb` is the optimized, self-contained glTF 2 export of the Blender reconstruction at `artifacts/kirkland-house/8311-kirkland-house.blend`. Source material: the user-provided front / roof photographs and Zillow listing 59698516. Dimensions and unseen geometry are approximate; no interiors are modeled.

The export combines mesh geometry into six named layers. Roofs, Landscape and Context have matching `extras.layer` values consumed by the viewer. Procedural Blender bump textures are not baked; the web model uses exported PBR colors and geometry. Preview image is a render of the same model.

Regenerate from the repository root:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b artifacts/kirkland-house/8311-kirkland-house.blend -S '8311 Kirkland | Photo reconstruction' --python artifacts/kirkland-house/export_web.py
```

The `/house` route dynamically imports Three.js, renders on interaction or resize, and releases GPU resources and cancels fetches when unmounted. The GLB is a public app asset. The original Blender file and listing reference photos are not served by the page.

The browser enhances the exported materials with world-space procedural grain, small surface-normal variations, roughness adjustments, and environment reflections on glazing. A 16-sample SSAO pass adds contact shading, followed by tone mapping and display color conversion. Environment illumination fades with the existing sunset controls. Rendering stays event-driven; pixel ratio is capped at 1.5 to limit postprocessing cost. All environment and postprocessing GPU resources are released on unmount.

A procedural child avatar is authored separately in `avatar.ts`, inspired by the user's reference outfit and hairstyle; the reference photo is not shipped or uploaded. WASD is scoped to the focused canvas. Touch buttons support pointer capture; blur, tab hiding, context loss and unmount clear held movement. Camera-relative movement is normalized and time-based, uses conservative building footprints and site bounds, and has a walk cycle respecting reduced-motion preferences. The follow camera is opt-in through “Walk with avatar.” Avatar reset returns to the driveway. House-view presets exit follow mode. These simple collisions cover building masses, not individual shrubs or steps.

## Cinematic lighting

The interior GLB and `groundfloor-indirect.png` / `upperfloor-indirect.png` are a matched set: regenerate them together with `artifacts/interior/bake_lighting.py`. That script unwraps unique UV atlases and bakes Cycles diffuse indirect illumination with direct lighting excluded. The original editable source remains `artifacts/interior/interior.blend`; the bake is saved as `interior-baked.blend`. Running only the older interior export script would invalidate the lightmap UVs.

Static indirect illumination is calibrated for the warm interior study, rather than recalculated for every sun direction. Runtime lights and avatar shadows remain dynamic. Window light shafts use local translucent shader geometry (an efficient visual approximation, not full volumetric ray marching). Dust, fireplace embers, outdoor leaves and dusk fireflies use batched GPU particle shaders. Bloom, subtle grading and exposure adaptation run through the existing composer. Low quality disables shafts, SSAO and bloom and reduces resolution and particle counts. Rendering pauses when hidden or outside the viewport; reduced motion keeps particles and flames static.
