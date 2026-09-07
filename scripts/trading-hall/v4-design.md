# The modern exchange — revised art direction

The Blender asset pack owns every physical object and the generated surface maps; the existing Hero renderer owns responsive camera framing, reveal choreography, and the WebGL lifecycle.

## Current working goal

Continue polishing the exchange until its visual quality approaches the approved concept art. Model every physical asset in Blender and use imagegen to generate mesh textures. The art direction is a professional, modern stock exchange with subtle voxel-inspired geometry and realistic physical lighting. Communicate precision, confidence, activity, and clarity. Use well-maintained materials and deliberate architectural lighting. Preserve the night setting, charcoal carpet, standing human viewpoint and restrained floor framing. The latest user correction moves the wireframe effect from loading to a scroll-driven 3D scan.

This user correction supersedes the earlier sad/dystopian direction. Remove abandonment, decay, heavy rust, peeling finishes, and oppressive darkness from the acceptance criteria. The original geometry/texture/lighting quality requirements remain in scope.

## Reference and quality target

`artifacts/trading-hall/exchange-v4/concept-modern.png` is the current professional/modern reference. The generated clean material set lives in `artifacts/trading-hall/exchange-v4/textures/modern/`; exact prompts and source paths are recorded in `v4-modern-imagegen-prompts.json`.

`artifacts/trading-hall/exchange-v4/concept.png` and the earlier textures are superseded mood studies. They are retained with `v4-imagegen-prompts.json` for provenance and must not be used as the acceptance target.

The visual target is precise faceted silhouettes, clean stone and metal, refined wood, charcoal carpet, clear market terminals, and balanced warm-neutral practical light against subtle cool night glazing. Shadows add depth while keeping the trading floor readable. Keep the seven-post layout and the existing accessible Hero behavior. All physical props, visible light housings, architectural elements, and exterior forms are authored in Blender; generated imagery is used as UV-mapped surface material.

## Asset kit

- Faceted trading posts assembled with precise panel joints and stepped metal edges.
- Blocky monitor housings, keyboards, phones, organized file trays, managed cables, chairs, task lamps, and cabinets.
- Refined stone piers, inset panels, stone bands, ceiling beams, integrated utilities, gallery railings, night glazing, and a restrained block-built exterior skyline.
- Clean tower display panels and clear lettering, with purposeful market information and restrained brightness variation.

## Lighting and delivery

Use balanced warm-neutral practical lamps as the key and subtle cool night-window light for depth. Build contact shadows and indirect bounce in Cycles; retain that depth through baked lighting where useful for the browser. Texture color maps come from imagegen, with technical normal/roughness data derived for PBR use. Review the entrance and scroll camera views in Blender and Browser against the new professional concept. Preserve accessible copy, controls, pause, reduced motion, and fallback behavior.

## Scroll pacing

The user requested fewer scene changes. Use three stable compositions and only two forward transitions: entrance overview, workstation approach, then a modest closer view of the same terminal. Remove the former turn past the foreground post toward the far hall. Hold the entrance through 16% of scroll progress, move through 42%, hold the workstation until 66%, make the final small push through 86%, then hold until the Hero ends. The sticky section is 240svh rather than 270svh. The existing opening/observe/verify captions follow the three compositions.

The initial scene is fully solid. During 20–64% of scroll progress, one horizontal scan plane travels upward through the actual model. Scanned surfaces retain the cyan structural wireframe, including the architectural signs. After the sweep, the closing view holds the complete cyan wireframe and the scan beam stops. This adds a deliberate sci-fi accent to the professional environment without another camera transition or an idle scanning loop. Scrolling backward reverses the conversion and restores the solid entrance. The replay control scans the current view over 2.8 seconds without moving the camera; scrolling takes control back. Pause freezes timed replay and ambient updates. Reduced motion omits the scan entirely.

## Precision lines and the data metaphor

The user's latest direction calls for very thin, straight engineering lines and a Matrix-inspired binary background. Use a 0.55 CSS-pixel visible stroke with analytical antialiasing, flat ends and no jitter, sketch texture or line glow. Omit tiny equipment edges below 4.5 cm, with a 2 mm threshold for lettering, and export model positions at 20-bit precision so small trims remain precise.

As surfaces are scanned, their solid appearance is replaced by a shared black/green 0/1 backdrop while their depth still hides rear geometry. The data layer uses one reusable glyph atlas and a GPU-rendered texture sampled consistently by the background and scanned surfaces. This prevents rear flags or unscanned equipment from showing through foreground wireframes. Code columns descend slowly and remain subdued around copy. Dust fades out as the digital layer appears. Pause freezes the data flow; reduced motion retains the solid room.

The educational progression is physical market → underlying data and structure → informed judgment. The Chinese closing caption is “读懂数据逻辑，提升交易判断。” The English counterpart is “Understand the data. Sharpen your judgment.” The binary rain is a visual metaphor, not a live feed or a claim about trading results.

## Delivery checkpoints

1. Professional/modern concept and clean texture set generated.
2. Blender scene rebuilt with maintained materials, precise panel joints, organized desks, chairs and architectural fixtures.
3. Balanced physical night lighting, 256-sample diffuse baking and linear HDR denoising completed; surface texture detail remains independent of the lighting bake.
4. Integrated Hero reviewed at desktop/mobile sizes and along the camera path. Scroll scan, pause, reduced motion, fallback/recovery and route cleanup verified; results are recorded in `v4-verification.md`.
