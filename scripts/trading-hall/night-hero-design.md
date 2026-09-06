# Night exchange Hero: ownership and motion direction

The existing TradingHall React component owns accessible content and controls; the renderer owns one WebGL lifecycle; Blender owns the shared exchange model, materials, and reference geometry. The night version replaces the earlier straight-desk scene in the landing Hero.

## Visual contract

- A standing observer inside the same seven-post exchange, at approximately 1.7 m eye height throughout.
- The Hero crops the bottom 16% of the virtual camera frame on desktop and 12% on mobile to reduce empty floor. The camera stays at eye height, render resolution stays unchanged, and both projected terminal markers and the loading poster use the cropped composition. The responsive crop is owned by `--hall-floor-crop` in the Hero stylesheet.
- Dark exterior, restrained warm practical lighting, matte charcoal low-pile carpet, brown wood fascia, blue/green quote screens, and reflective dark glazing. Original carpet color/normal/roughness maps replace the floor's wood maps; plank-joint geometry is hidden and excluded from export.
- Materials keep real color, normal, and roughness textures. Cycles is the offline reference renderer; the website uses real-time PBR raster rendering, shadow maps, an interior environment capture, and desktop SSAO.
- The HTML headline and lesson CTA remain usable during loading and graphics failure; the static fallback is a render of the actual night model.

## Motion sequence

1. Opening: a 260 ms fade into a structural wireframe, held for the first 500 ms. From 0.5–2.35 s the original lit materials reveal upward and the outlines disappear. A gentle 45 cm dolly stays at eye height. Headline/body/actions enter over 700 ms with 70 ms stagger steps; interaction is never gated by the sequence. The wireframe uses selected structural edges and an occlusion pass, avoiding dense microgeometry and x-ray clutter. Its extra draw calls stop once the scene is solid.
2. Observe: scrolling advances through the central aisle, then aims at a real terminal. The caption and a projected corner marker connect the movement to inspecting evidence.
3. Context: the camera clears the foreground trading post before turning toward the middle of the exchange. A second caption introduces the broader research context.
4. Ambient details: restrained dust under practical lights and deterministic simulated quote updates at 2 Hz. Pointer movement produces at most a few centimeters of eye-height change.

Pause freezes the wireframe transition, ambient time, and market updates; scrolling remains directly controlled by the reader. Replay restarts the wireframe-to-solid sequence and only uses the entry dolly in the opening chapter. Reduced motion skips the wireframe, removes the extended sticky story, freezes the camera at the entrance, and stops continuous rendering. Offscreen/hidden tabs stop their animation loop. Context loss shows the same-scene fallback and restoration recreates the reflection environment from the fully shaded model, then restores the current reveal progress.

Pausing settles the finite HTML copy entrance immediately, so it cannot leave the headline or CTA invisible. That copy stays settled on resume; only the scene transition resumes from its paused position.

## Asset path

`exchange-human-night-v3.blend` → evaluated and material-batched geometry → `night-v3/exchange.glb` with Draco and WebP → Three.js GLTFLoader. The export reduces bevel subdivisions and hidden actor geometry while preserving the circular posts and their display surfaces. Runtime textures use a 4 × 4 atlas, matching the Blender UVs.

## Evidence

See `night-hero-verification.md` for current checks. The old `verification.md` documents the earlier version and is not evidence for this night scene.
