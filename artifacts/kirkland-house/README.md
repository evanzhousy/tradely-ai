# 8311 NE 140th St — exterior reconstruction

Built through Blender MCP, using the Zillow listing inspected with ego-browser and the two supplied front / roof photographs.

## Deliverables

- `8311-kirkland-house.blend` — editable scene, materials, 3 cameras, lighting, and packed reference images.
- `house-preview.png` — front three-quarter render.
- `front-view.png` — near-frontal comparison view.
- `roof-view.png` — elevated roof overview.
- `build_house.py`, `refine_house.py` — reproducible Blender Python construction scripts, executed through MCP.

The model is open in Blender. Use the collection eye icons to isolate architecture, roofs, windows and doors, trim and masonry, landscape, or adjacent-unit context. Cameras are named by view. The pre-existing startup scene is retained separately as `Scene`.

## Evidence and accuracy

Reference: https://www.zillow.com/homedetails/8311-NE-140th-St-8311-Kirkland-WA-98034/59698516_zpid/

Listing inspected September 5, 2026 with ego-browser. The listing states 1,430 sq ft and construction in 2001. Gallery inspection confirmed the supplied front photo, community aerial context, and additional interior/community photographs.

This is a visual exterior reconstruction, not a measured architectural or construction model. The front gable, cedar shake treatment, cream siding, white trim, double garage, 8311 address, red bell, recessed dark entry, stone porch bases, and landscaping are based on visible references. Dimensions use an estimated double-garage width as a scale anchor. Building depth, unseen walls, roof intersections, property boundaries, window positions on unseen elevations, and landscape spacing are approximate. Adjacent-unit context is simplified. Interior rooms and floorplans are not reconstructed. The listed living area was not treated as the building footprint or used to assert measured model accuracy.

Scene uses meters. Materials and vegetation are procedural; references are embedded for comparison rather than projected onto the model.
