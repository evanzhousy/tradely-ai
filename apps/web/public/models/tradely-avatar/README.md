# Tradely study companion

Original logo-derived owl geometry: a compact body, connected ivory facial discs, short downward beak, crown feather tufts, folded wings, and three toes on each foot. The Blender owl is the single source of truth for both the static logo and 3D companion. Crown feather tufts, short beak, ivory facial discs, brown wings and feet must remain consistent.

Editable source: `docs/brand/tradely-avatar.blend`. The authored `HeadPivot` owns the upper head shell, facial discs, pupils, beak, and crown tufts. The overlapping neck seam allows head rotation while the body, brown wings, and toes remain fixed. Rebuild from the repository root:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/brand/build-avatar.py
```

The landing player lazy-loads the GLB, smoothly turns only the head toward the pointer (yaw capped at 23 degrees, pitch at 9 degrees), returns to rest when the pointer leaves the window, renders on demand, stops work offscreen/in hidden tabs, and respects reduced motion. The static render of the same owl is the WebGL fallback. Mobile inherits the landing page's hidden decorative artwork. No AI or grading state is represented.

## Unified website marks

After rebuilding the model, render all four website PNG marks from the same saved model:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/brand/render-brand-marks.py
```

This produces the full-resolution mark, navigation mark, favicon and Apple touch icon. Do not restore the earlier featureless yellow character or create a separate owl anatomy for small icons. Keep all distinctive features and a neutral forward-facing pose.
