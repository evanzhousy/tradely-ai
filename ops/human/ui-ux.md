# UI/UX and brand assets

## Figma design reference

Tradely.ai has an existing brand asset library in the **FLOWMAN BRAND ASSETS** Figma file. Use the **03 · Tradely** page as the starting point for new UI/UX and brand work; reuse and extend the existing identity before designing new assets.

- [Tradely page](https://www.figma.com/design/mj4ZspmkHULNeOo0W1UkSt/FLOWMAN-BRAND-ASSETS?node-id=3303-610)
- [Brand overview](https://www.figma.com/design/mj4ZspmkHULNeOo0W1UkSt/FLOWMAN-BRAND-ASSETS?node-id=3308-23): logo applications, palette, typography, 3D character references and usage guidance.
- [Flat owl logo master](https://www.figma.com/design/mj4ZspmkHULNeOo0W1UkSt/FLOWMAN-BRAND-ASSETS?node-id=3308-80): editable vector artwork; linked light/dark lockups use this master.
- [Owl brand series](https://www.figma.com/design/mj4ZspmkHULNeOo0W1UkSt/FLOWMAN-BRAND-ASSETS?node-id=3325-389): six flat poses, three application cards, a social image and small-size examples.

The file also contains other products and a **90 / Tradely / Legacy yellow identity** section. Legacy artwork is historical reference, not the current identity. Preserve unrelated product assets when editing the file.

## One character, two treatments

The owl's defining features are a yellow body, crown feather tufts, brown wings, connected ivory facial discs, dark pupils, a short beak and small feet.

- **Logo:** a two-dimensional flat vector mark. Use solid colors without gradients, rendered lighting or drop shadows. Use it for navigation, favicon and compact brand applications.
- **3D companion:** the interactive landing-page character. Its head follows the pointer while its body remains still. It shares the logo's defining anatomy, but is not the source image for the flat logo.
- **Flat illustrations:** ready, curious, reading, thinking, complete and welcome poses. Keep their silhouette and palette consistent with the logo.

Do not reintroduce the earlier yellow character without feather tufts, brown wings or a beak. Do not replace the logo with a 3D render.

The flat character palette is yellow `#FFD23F`, brown `#794829`, ivory `#FFF9EB` and ink `#171714`. Website typography uses Inter and JetBrains Mono. Website UI colors remain defined in `packages/ui/src/styles/globals.css`; character colors are not substitutes for all UI tokens.

## Editable sources and exports

Paths below are relative to the repository root.

| Asset | Source / location |
| --- | --- |
| Canonical flat logo | `apps/web/public/brand/tradely-mark.svg` |
| PNG logo, favicon and touch icon | `apps/web/public/brand/` |
| Six flat owl poses | `apps/web/public/brand/owl/*.svg` |
| Application cards, social image and series board | `docs/brand/owl-series/` |
| Editable 3D model | `docs/brand/tradely-avatar.blend` |
| Web 3D model and documentation | `apps/web/public/models/tradely-avatar/` |
| Shared flat illustration component | `apps/web/src/components/brand-owl.tsx` |
| Landing-page 3D component and player | `apps/web/src/components/tradely-avatar.tsx`, `apps/web/src/lib/tradely-avatar-renderer.ts` |

Regeneration commands, run from the repository root:

```sh
# Flat PNG marks from the canonical SVG; requires ImageMagick.
python3 scripts/brand/render-brand-marks.py

# Six flat poses and application designs from the canonical SVG.
python3 scripts/brand/build-owl-series.py

# Editable Blender model and web GLB.
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/brand/build-avatar.py
```

The Figma 3D pose references are static rendered images; edit geometry in Blender. Flat SVG artwork and Figma text/vector layers can be edited as design assets. Application-card buttons are design examples, not implemented navigation or access rules.

When changing the identity, update the appropriate source, regenerate its derived assets, and synchronize the Figma masters and examples. Inspect SVGs in a browser or Figma: ImageMagick's fallback SVG renderer can mishandle nested rotation and stroke-only paths in the series board.

## Website placement

The first website integration was implemented locally in commit `93b0598`; this record does not establish production deployment status.

| Location | Treatment |
| --- | --- |
| Landing page | Existing 3D owl with restrained head tracking |
| Navigation and favicon | Flat canonical logo |
| Course overview progress card | Welcome pose |
| Guides index introduction | Reading pose |
| Course catalog with no matching results | Thinking pose, existing explanation and reset action |
| 404 page | Curious pose, existing return links |
| Successful lesson-completion save | Complete pose, only after the server confirms the save |

Use the shared `BrandOwl` component for flat illustrations. It treats them as decorative; adjacent text must communicate the actual instruction or status. Use restrained sizing, including smaller artwork on narrow screens.

Keep exercises, analytical charts and checkout focused on the task. Avoid repeating animated owls throughout the site. An expression must not imply mastery, alter grading or substitute for learning feedback. Preserve server-owned access and completion rules, reduced-motion support and the 3D player's static fallback.

## Verification

For UI changes, check desktop and mobile layouts, light/dark appearance, text and action visibility, and the relevant interaction. Completion visuals must remain absent while saving or after a rejected save, and must not carry over to a different lesson.

After browser verification, include GIF evidence from the actual application or local component preview and identify the captured environment. Commit validated implementation changes separately from unrelated work. A local commit or screenshot is not proof that the change is deployed.
