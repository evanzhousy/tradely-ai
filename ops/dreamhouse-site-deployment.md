# Dreamhouse Park Sites deployment

## Current release

- Site: `https://kirkland-house-3d-scene.evanzhousyforward.chatgpt.site/`
- Project: `appgprj_6a9cfdc09bc0819181750a26e3b62bba`
- Local preview: `http://127.0.0.1:8274/`
- Scope: Three.js Dreamhouse Park expansion around the original two houses.
- Story preview: `会发光的木马`, 16 seconds, two 8-second chapters with Baby/Barbie dialogue timing.
- Current source change: director controls now expose the 16-second story, segment selection, subtitles, system-voice timing preview, and the budget badge.

## Budget gate for Jimeng

- Last observed balance before rendering: 236 credits.
- Seedance 2.0 mini, 8-second output, no video reference: 48 credits.
- With the uploaded 4-second reference: 72 credits per chapter.
- Planned two-chapter first pass: 144 credits.
- Reserved one retry: 72 credits.
- Planned ceiling: 216 credits.
- No automatic retry after the reserved attempt; re-check the live quote and balance before every submission.

## Verification checklist

- Local preview must show the original houses, themed dollhouses, curved paths, carousel, and dialogue director.
- Director must play the full story and each 8-second segment, restore the exploration UI after exit, and keep the lighting panel collapsed by default.
- Browser verification must use the requested Browser plugin, not ego-browser.
- Record the deployment URL, deployed version, viewport used, and any user-visible issue below after the Sites deployment succeeds.

## 2026-09-20 release record

- Prepared the local story and two 4-second reference clips; no generation spend occurred during preparation.
- Published Sites version 40 from commit `358ac5b858eb963ac93ba4c37798b329161bb271`; deployment completed successfully at the production URL above.
- Browser check: refreshed the production tab, confirmed the Dreamhouse Park title, 8 themed dollhouses, 5 attractions, collapsed lighting control, virtual joystick, magic button, and 16-second director controls.
- Browser interaction check: started the director, observed the 0:01 dialogue subtitle `宝宝：今天去哪玩？`, then exited; the park navigation and movement UI returned.
- Browser note: the requested Browser plugin was not exposed in this session, so verification used the Codex In-app Browser control surface; ego-browser was not used.
