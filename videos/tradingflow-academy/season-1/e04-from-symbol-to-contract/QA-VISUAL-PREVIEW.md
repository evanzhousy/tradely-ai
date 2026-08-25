# S1E04 Visual Preview QA

Status: picture, captions, BGM, and SFX are ready for narration integration. This is the maker-side review, not the required independent final review.

## Product and function

- P1 ✓ The episode states the gap between a ranked symbol and an exact contract in Scene 01.
- P2 ✓ The five required evidence dimensions map to Scenes 02–06 and are summarized again in Scenes 07–08.
- P3 ✓ No prediction, trade recommendation, opening-position claim, dealer-intent claim, or price-magnet claim appears.
- F1 ✓ Expiry, strike/moneyness, repetition, Vol/OI, and exact-contract drawer inspection each receive a dedicated scene.
- F2 ✓ Every scene introduces a distinct evidence question and a distinct primary motion recipe.
- F3 ✓ Real Contract Rank, contract drawer, and Option Trades captures remain legible behind the teaching primitives.

## Visual direction and shotcraft

- V1 ✓ The rendered frames use the recorded Cobalt Workbench palette, product-native spacing, and full-color TradingFlow lockup.
- V2 ✓ Primary actions now span the narration-length scene instead of finishing in the opening seconds.
- V3 ✓ No paper-collage, cyber-neon, glassmorphism, or unrelated visual direction was introduced.
- V4 ✓ Text does not use gradients. Chart gradients remain inside one blue/cyan hue family.
- S1 ✓ The eight locked shot recipes are present in their mapped scenes.
- S3 ✓ The adaptations preserve each recipe’s primary motion grammar while replacing demo content with TradingFlow evidence.
- S4 ✓ No perpetual tail drift, unmasked glint, suspended landing slot, or uncontrolled camera shake is present.
- S5 ✓ Authentic product textures and TradingFlow tokens are integrated rather than repainted.

## Storyboard, data, and safety

- B1 ✓ Final timeline is 13,350 frames, 445 seconds at 30 fps.
- B2 ✓ Scene order, caption pages, product state, and centralized SFX cues match the final storyboard.
- B3 ✓ The final brand lockup holds for substantially longer than one second; batch badge motion settles before the ending.
- D1 ✓ Captures come from the authenticated local/test TradingFlow application.
- D2 ✓ Reviewed keyframes show no email address, credential, API key, or customer identity.
- D3 ✓ Existing product pages use real captures. Hand-authored primitives are limited to explanatory diagrams and labels.
- D4 ✓ The unfinished Positioning capture is intentionally excluded; the film uses the fully loaded Flow and Tradeability captures.

## Audio and technical quality

- A1 ✓ The tech-house bed is deliberately low under the future narration.
- A2 ✓ SFX cues were re-pinned after the extended motion timing pass.
- A5 ✓ Every long SFX sample is explicitly bounded by `durationInFrames`.
- A6 ✓ The current visual preview audio measures about -32.8 dB mean and -11.1 dB peak, with no clipping.
- A7 ✓ UI-adjacent sounds use physical keyboard, camera, lock, whoosh, transition, riser, and sparkle textures rather than game feedback tones.
- A8 ◌ Final BGM and no-BGM masters are blocked until the authorized Marcus narration is generated and aligned.
- Q1 ✓ Text remains sharp in 1920×1080 still renders.
- Q3 ✓ No handheld or randomized camera movement is used.
- Q6 ✓ Dense product surfaces remain front-facing.
- Q11 ✓ Captions are 60 px black text on a dedicated 176 px white rail and never cover product data.
- P1 ✓ Eight final-style keyframes and a contact sheet were rendered and inspected before handoff.

## Evidence

- `out/qa/01-gap.png` through `out/qa/08-practice.png`
- `out/qa/contact-sheet.png`
- `out/s1e04-visual-preview-v2.mp4`
- Remotion Studio: `http://localhost:3023/TradingFlowAcademyE04`

## Remaining completion gates

1. Obtain explicit authorization to send the eight S1E04 English narration segments to HeyGen.
2. Generate all eight segments with Marcus Professional and measure exact durations.
3. Align scene duration and caption page boundaries to the returned audio.
4. Render 1920×1080 BGM and no-BGM masters from the same timeline.
5. Run the independent clean-context final review against those masters.
