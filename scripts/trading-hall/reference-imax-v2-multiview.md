# Exchange-floor IMAX-style multiview references

Generated with the built-in imagegen tool from one shared master image. Four independent image-generation calls used the same master and the shared scene constraints below.

Master: `artifacts/trading-hall/references/hall-documentary-imax-v2.png`.

These are photographic concept references for the same scene. Exact metric camera/geometry consistency would be established by rendering the eventual shared Blender model; no Blender or application changes were made in this image-generation step.

## Outputs

- 机位 1：反向高位全景: `artifacts/trading-hall/references/imax-v2-multiview/01-reverse-balcony.png`
- 机位 2：中央通道平视: `artifacts/trading-hall/references/imax-v2-multiview/02-central-aisle.png`
- 机位 3：交易席位近景: `artifacts/trading-hall/references/imax-v2-multiview/03-workstation-close.png`
- 机位 4：侧面俯视: `artifacts/trading-hall/references/imax-v2-multiview/04-side-overview.png`

## Exact prompt construction

Each effective prompt was the shared text below, followed by two newline characters, followed by that image's camera-view text. The same master file was supplied through `referenced_image_paths` for all four calls.

### Shared scene constraints

Use case: photorealistic-natural.
This is a MULTI-VIEW CONTINUITY photograph of the EXACT SAME existing securities-exchange interior shown in reference image 1. The reference is the authoritative set, not loose inspiration. Change only the camera position, orientation and appropriate focal length. Do not redesign the room or create a different stock exchange.

Lock the set: the same large rounded trading posts and winding oak-floor aisles; the same warm brown wooden fascias and black concentric equipment trays; the same dense rows of thin market-data monitors and exposed monitor mounts; the same tall rectangular screen towers. Preserve the distinguishing landmarks: the central American-flag tower above the central circular trading post; the prominent foreground-right circular post with the black NYSE/blue-bars tower and an open inner equipment bay; the foreground-left GTS/NYSE trading post; further flag-topped posts receding toward the high black-mullioned window wall. Keep the same cream-beige historic stone walls, upper gallery, industrial overhead pipe/cable support grid, banners, and light honey-colored oak floor. Preserve their relative placement and physical scale. Surfaces and architecture must be consistent with the reference even when foreshortened or partially occluded. No new furniture islands or new architectural style.

Maintain the same trading session and light: soft daylight from the same upper windows, practical overhead lamps, subtle blue screen spill, natural shadow directions, realistic contact shadows and ordinary satin reflections. A small believable population of floor brokers in navy trading jackets/business clothes remains naturally distributed through this same scene. Financial monitors show plausible quote tables and charts at normal brightness; some tall screens retain the same flag/NYSE displays. Real documentary color, restrained contrast, physically credible light transport, subtle large-format film texture. IMAX-style 65/70mm documentary photographic quality, wide 1.90:1 image, lifelike materials and people, not a visibly computer-rendered environment.
No science fiction, no cyberpunk, no holograms, no artificial gold architecture, no black-marble replacement floor, no smoky atmosphere, no dramatic light beams, no neon grading, no miniature effect, no website interface, no captions or view labels burned into the image, no collage, no border, no watermark. Deliver one independent photograph for the requested camera view.

### 机位 1：反向高位全景

Camera view: reverse three-quarter elevated establishing shot. Move the camera to the opposite/right-hand mezzanine of the SAME hall, approximately 5 meters above the oak floor, and look diagonally back across the central trading post toward the original foreground-left GTS post. Use a 28mm-equivalent wide lens. The original foreground-right NYSE tower/post is now near the left foreground or left edge, and the central flag tower and further circular posts occupy the middle distance. Show a broad interconnected floor plan with ring tops and walkways visible. This must unmistakably be the same set observed from the other side, not a mirrored copy of the source image.

### 机位 2：中央通道平视

Camera view: ground-level human-eye-height view from the central oak walkway visible in the reference, at approximately 1.65 meters, looking toward the central circular trading post and its American-flag tower. Use a 32mm-equivalent lens. The curved fronts of the SAME left GTS post and right NYSE post frame the foreground edges; banks of quote screens wrap around their brown fascias at standing height. Include the real scale of nearby floor brokers and enough of the high stone architecture and overhead pipes to connect this viewpoint to the master. The circular-post structure and tall flag tower must remain legible, with believable wide-angle perspective rather than an unrelated straight-row office.

### 机位 3：交易席位近景

Camera view: a close three-quarter photograph at the outer workstation edge of the prominent foreground-right NYSE circular trading post from the master. Camera height approximately 1.45 meters, 45mm-equivalent lens, looking tangentially along its curved monitor bank and across the central aisle. Show several physically detailed financial monitors in the near foreground, realistic thin black bezels, keyboard, desk phone, papers, subtle glass reflections and the SAME brown wooden fascia/black desk material. Beyond them retain the recognizable central American-flag tower and neighboring GTS ring in the correct relative positions. Moderate depth of field: the foreground workstation is crisp while the hall remains recognizable, not creamy bokeh. It must read as a closer view of that precise trading post, not a separate generic desk or redesigned room.

### 机位 4：侧面俯视

Camera view: elevated lateral side overview, approximately 7 meters high on the left-side gallery, looking down at a 50-degree angle across the SAME foreground-left GTS ring, central flag-tower post and foreground-right NYSE ring. Use a 35mm-equivalent lens. Emphasize the nested circular work surfaces, open equipment bays, monitor arms and honey-colored walkways threading between the same posts. The view should clearly explain the floor plan and the relationship among these three landmarks. Keep enough of the far window wall and overhead pipework at the upper edge to anchor the space. A realistic oblique photograph, not an orthographic diagram, drone exterior, miniature, or top-down redesign.

