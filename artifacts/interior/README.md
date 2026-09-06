# 8311 interior reconstruction

Source: Zillow listing 59698516, gallery inspected with ego-browser. Reference screenshots are under `references/`.

Observed features: white lounge seating with forest-green, mustard and terracotta pillows; gray carpet and cream rug; circular wooden coffee table; stone fireplace; open entry half-wall and console; dark wood dining table; maple kitchen cabinetry and white appliances; oak kitchen and entry floors; staircase; cream bedrooms with dark nightstands; maple vanities, bathtub and white bathroom fixtures.

The model interprets these as two navigable maps, GroundFloor and UpperFloor. Room dimensions, adjacencies, stair placement, and exact fixture positions are inferred, not a measured reconstruction. Walls toward the camera are cut away for a Diablo-like dollhouse view. Collisions still apply to walls and furniture. No original reference photographs are uploaded or served with the application.

- `interior.blend`: editable Blender model, created via Blender MCP.
- `build_interior.py`, `refine_interior.py`: model construction and refinement.
- `export_web.py`: combines each floor for efficient rendering, retaining collision rectangles as GLB extras.
- `apps/web/public/models/kirkland-house/interior.glb`: web asset, loaded on first entrance and retained until leaving the page.

Interaction: walk to the gold marker at the front entry and press E, or tap its prompt. Fade out → load → change level, lighting, spawn and camera → fade in. The two stair markers and front exit work the same way. Transitions are locked against repeat input, reduced motion shortens fades, loading errors preserve the current level and offer retry, and unmount cancels pending fetches and releases models.
