# Project-wide 21st component polish

The full web application now composes a shared set of 21st-listed community components. Sources, local adaptations and licenses are recorded in [the component inventory](../21st-components.md).

## Route coverage

| Surface | Result |
| --- | --- |
| Home | Shared theme/chrome, native hover CTA, illustrated guide bento cards; ordered curriculum retained |
| Course overview | Sourced course facts, circular progress, search, all/free/completed tabs, matching module anchors |
| All 36 lesson routes | Breadcrumbs, current lesson rail, reading hierarchy, reference disclosure, access states, shared exercise stepper |
| Guide index and all three guides | Subject diagrams, bento cards, page openings, contents navigation, article reading progress and next steps |
| Pricing | Free entry beside the existing server-provided offers, aligned prices, account actions and accessible FAQ |
| Sign-in | Responsive account layout, email/code steps, original Google and email-code handlers |
| Privacy, terms, cookies, risk disclosure | Common reading layout, breadcrumb and contents rail; original document content retained |
| House viewer | Breadcrumb, control surfaces and keyboard hints; existing 3D runtime retained |
| Loading, 404 and route errors | Skeletons and shared empty-state compositions |

## Verification

- Node 24 workspace type checks passed.
- Vitest: **405 tests across 76 files passed**, including new catalog-order/access-metadata and link/button-semantics regressions.
- Production build passed. The built application was served locally on port 8262 for browser verification.
- PostHog credential scan passed; the media boundary check passed with 26 owned assets and 26 unique R2 keys.
- Biome passed for all **42 changed TypeScript/TSX/CSS files**. `git diff --check` passed.
- Built-app browser sweep: **51 checks** covering 17 routes at 390, 768 and 1440px. Each had one main landmark, one h1, no horizontal page overflow, no route error boundary and no captured window error or unhandled rejection.
- Dark mode: **14 checks** across seven page families at 390 and 1440px passed.
- All **36 local synthetic lesson fixtures** rendered their initial stage at 390px with no page overflow. Additional contract-neighborhood and metrics investigation stages and a Chinese portfolio independent stage also passed. These fixtures validate the lesson UI; they do not prove paid account persistence.
- Verified the three free-entry slugs, completed/no-results states, case-insensitive search, matching module targets, full reset to 36 lessons, and keyboard tab focus/activation.
- Verified the guide's example anchor and active contents entry, the pricing FAQ, mobile menu dismissal, and reopening/declining analytics preferences.
- Chinese course content and filter labels rendered correctly at 390px. Reduced-motion emulation preserved content, and reduced-transparency emulation removed the decorative pattern. Remaining reported CSS transitions had the existing reduced-motion duration of 0.01ms.
- The house viewer produced a canvas and keyboard hints without page overflow at 390 and 1440px.

Development hot reload briefly produced stale-module errors while imports were changing. The fresh built-app sweep above was run against the finished build and had no failures.

## Repository-wide lint boundary

The repository-wide `pnpm check` reports **1,677 errors, 437 warnings and 34 infos** in unchanged generated/standalone files. The largest sources are the two Draco decoder wrappers under `apps/web/public/models/trading-hall/`; other diagnostics occur in existing `local/dollhouse` and `site-static` files. A complete JSON diagnostic report contained **zero diagnostics in the changed files**.

The existing pre-commit hook invokes `lint-staged`, whose configured command is `biome check --write .`. This would rewrite unrelated files. The local UI commit therefore bypasses that hook after the focused checks above. Repository-wide lint cleanup is not included in this UI change.

This is local implementation and preview evidence. Checkout purchases, email delivery, live paid-account persistence, deployment and publication were not exercised.
