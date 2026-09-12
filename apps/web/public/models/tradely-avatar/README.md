# Tradely study companion

Original logo-derived owl geometry: a compact body, connected ivory facial discs, short downward beak, crown feather tufts, folded wings, and three toes on each foot. The logo remains the canonical brand mark.

Editable source: `docs/brand/tradely-avatar.blend`. Separate body, wings, facial discs, pupils, beak, crown tufts, and toes. Rebuild from the repository root:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/brand/build-avatar.py
```

The landing player lazy-loads the GLB, renders on pointer changes, stops work offscreen/in hidden tabs, and respects reduced motion. The original logo is the WebGL fallback. Mobile inherits the landing page's hidden decorative artwork. No AI or grading state is represented.
