# Tradely study companion

Original logo-derived owl geometry: a compact body, connected ivory facial discs, short downward beak, crown feather tufts, folded wings, and three toes on each foot. The logo remains the canonical brand mark.

Editable source: `docs/brand/tradely-avatar.blend`. The authored `HeadPivot` owns the upper head shell, facial discs, pupils, beak, and crown tufts. The overlapping neck seam allows head rotation while the body, brown wings, and toes remain fixed. Rebuild from the repository root:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/brand/build-avatar.py
```

The landing player lazy-loads the GLB, smoothly turns only the head toward the pointer (yaw capped at 23 degrees, pitch at 9 degrees), returns to rest when the pointer leaves the window, renders on demand, stops work offscreen/in hidden tabs, and respects reduced motion. The original logo is the WebGL fallback. Mobile inherits the landing page's hidden decorative artwork. No AI or grading state is represented.
