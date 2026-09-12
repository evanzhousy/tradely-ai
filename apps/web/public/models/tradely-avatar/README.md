# Tradely study companion

Original logo-derived owl geometry: a compact body, connected ivory facial discs, short downward beak, crown feather tufts, folded wings, and three toes on each foot. The Blender owl is the source for the interactive 3D companion; the flat SVG is the source for the logo. Crown feather tufts, short beak, ivory facial discs, brown wings and feet must remain consistent.

Editable source: `docs/brand/tradely-avatar.blend`. The authored `HeadPivot` owns the upper head shell, facial discs, pupils, beak, and crown tufts. The overlapping neck seam allows head rotation while the body, brown wings, and toes remain fixed. Rebuild from the repository root:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/brand/build-avatar.py
```

The landing player lazy-loads the GLB, smoothly turns only the head toward the pointer (yaw capped at 23 degrees, pitch at 9 degrees), returns to rest when the pointer leaves the window, renders on demand, stops work offscreen/in hidden tabs, and respects reduced motion. The flat owl logo is the WebGL fallback. Mobile inherits the landing page's hidden decorative artwork. No AI or grading state is represented.

## Flat logo and 3D companion

`apps/web/public/brand/tradely-mark.svg` is the canonical flat logo. It uses solid yellow, brown, ivory and ink shapes, without gradients, lighting or shadows. It shares the owl's crown tufts, brown wings, short beak, facial discs and feet, but does not use a 3D render.

Regenerate PNG navigation/fallback marks, favicon and Apple touch icon:

```sh
python3 scripts/brand/render-brand-marks.py
```

The renderer requires ImageMagick. Update the SVG for logo changes and Blender for 3D changes, preserving the same defining anatomy and brand colors across both.
