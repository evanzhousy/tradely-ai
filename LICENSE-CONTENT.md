# Course content licence

Tradely's course content is licensed under the
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International licence](https://creativecommons.org/licenses/by-nc-sa/4.0/)
(CC BY-NC-SA 4.0). The full legal code is at
<https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode>.

Tradely's source code is licensed separately, under the MIT License in
[LICENSE](LICENSE).

## What counts as course content

Course content is Tradely's teaching material, wherever it sits in this
repository, including when it is written inside a source file:

- lesson, unit, guide and glossary text, and concept definitions;
- film scripts, storyboards, on-screen text and the worked numbers in them;
- questions, cases, scenarios, answers and feedback;
- Tradely's own lesson films and companion videos, and their captions;
- translations of any of these.

Most of it lives in `apps/web/src/content/`, `apps/web/src/features/learning/`,
`apps/web/src/features/guides/` and `videos/course-v2-companions/`. Other
material made for Tradely, such as site copy, the legal pages, the files in
`docs/` and the 3D trading hall in `apps/web/public/models/trading-hall/`, is
under the same licence.

The code that lays out, animates, checks or serves this material is source code
under the MIT License, even where it shares a file with course content.

## How to credit Tradely

Credit Tradely, link the lesson and the licence, and say whether you changed
anything, for example:

> Based on "Delta: a local price sensitivity" by Tradely
> (https://www.tradely.ai/learn/delta), licensed under CC BY-NC-SA 4.0.
> Adapted with new examples.

Share your adaptations under the same licence. Commercial use needs written
permission from Tradely: support@tradely.ai.

## Not covered by either licence

Neither [LICENSE](LICENSE) nor this file grants any rights in the following.
They stay with their owners.

- **Tradely's name, owl mascot and logos**, including the files in
  `apps/web/public/brand/` and the 3D owl in `apps/web/public/models/tradely-avatar/`.
- **TradingFlow's name, logo, screenshots and videos**: `apps/web/public/partners/`,
  the TradingFlow-branded lesson posters and captions in
  `apps/web/public/media/tradingflow/`, `videos/tradingflow-academy/`,
  `videos/tradingflow-concept-cards/`, `videos/market-recap/` and
  `videos/gex-screener-paper-collage/`.
- **Third-party posts and profiles** shown on the options-traders pages:
  `apps/web/src/features/options-traders/data/` and
  `apps/web/public/options-traders/`. They belong to their authors and the
  platforms they were posted on.
- **Google's "G" logo**: `apps/web/public/google-g.png`.
- **Side projects that are not part of Tradely**: the 3D house scene
  (`apps/web/src/features/house/`, `apps/web/src/routes/house.tsx`,
  `apps/web/public/models/kirkland-house/`) and the Blender scripts in
  `artifacts/`.

Third-party material included in this repository keeps its own licence: the UI
components listed in
[docs/third-party-ui-licenses.md](docs/third-party-ui-licenses.md), Google's
Draco decoder in the `draco/` folders under `apps/web/public/models/trading-hall/`
(Apache 2.0), the Poly Haven textures in
`apps/web/public/models/trading-hall/textures/` (CC0), and the packages
installed from npm.
