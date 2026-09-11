# Lesson 2 interactive SVG lab

Lesson 2 (`option-rights`) now has three bilingual scenes inside Learn:

1. **Rights:** switch Call/Put and holder/writer to compare all four rights and obligations. The SVG focus moves to the selected role.
2. **Open/close:** vary starting position, Buy/Sell, and contract count. A signed inventory diagram distinguishes all four position actions and preserves uncertainty when the starting position is not supplied.
3. **Assignment:** step or play through holding, valid exercise, and assignment. Cash and shares move in opposite directions, and changing Call/Put reverses the displayed comparison. Quantity/type changes pause playback at the selected stage. The opening premium stays separate from gross exercise cash.

The lab reuses Lesson 1's extracted `ConceptLab` navigation/reset shell and `concept-scene` presentation controls. Motion, keyboard behavior, and reduced-motion policy remain shared. Scene models and fixtures are public teaching examples; they dispatch no assessment actions. Lesson 2's existing version 2 rubric and case questions are unchanged. Full lesson notes remain available.

The rights and exercise descriptions were checked against [OIC Options Basics](https://www.optionseducation.org/optionsoverview/options-basics) and [OIC Exercising Options](https://www.optionseducation.org/optionsoverview/exercising-options). Examples specify physical settlement, a $50 strike, 100 shares per contract, and valid exercise. Clearing determines assignment; the diagram does not claim that the assigned writer was the holder's original trading counterparty.

`AGENTS.md` now requires GIF evidence after browser verification, identifying the captured environment and linking the GIF in the final response.

## Verification

- Node 24 type checks and production build passed. Changed-file Biome, credential scan, media-boundary validation, and `git diff --check` passed.
- Full web suite: 86 files / 468 tests passed with two workers and command-line allowances for local PGlite startup (`--testTimeout=30000 --hookTimeout=60000`). No repository timeout configuration changed.
- Both lessons' 14 interaction tests were rerun successfully after the final comparison/pause refinement. Coverage includes four rights, four trade actions, unknown initial inventory, cash/share direction, premium separation, pause/reset, Chinese rendering, and Learn-only integration.
- The actual local `/learn/option-rights` route opened the lab through the anonymous preview API and advanced to the guided case. Its development tools overlay intercepted a pointer click during review; dispatching the existing button's click verified the same UI/server action without modifying application state directly.
- Desktop and 390 px Chinese/dark mobile component review passed. All three mobile scenes had no document overflow. Keyboard quantity adjustment in the reduced-motion view changed exercise cash from $5,000 to $10,000 while retaining the selected assignment stage.
- GIF evidence records the implemented local component preview at `http://127.0.0.1:8261/?lesson=option-rights`, showing roles, position changes, and assignment flows. The GIF is supplied as a separate artifact in the task response.

This is local implementation and verification. It does not constitute a production deployment or measured evidence of improved student learning.
