# AI practice coach: local verification

Date: 2026-09-09. Scope: three-lesson guided coaching, persistence, provider boundary, UI, operational tools and documentation. Runtime coaching remains disabled. No live learner records, production database migrations, provider generations or deployment changes were performed.

## Implemented behavior

- `audited-boundary` reuses the saved written response; `rank-symbols` and `rank-contracts` save a separate coaching explanation.
- Each session has an initial review and one revision review. Immutable input snapshots remain associated with the matching generated feedback. Only guided answer stages admit new model calls.
- Existing independent-case scoring, prose review requirements, hint handling and course completion remain separate. Coach text does not grant mastery or course access.
- SQL admission reserves both rounds, enforces account/global limits and deduplicates logical executions. Uncertain outcomes are durable and do not automatically repeat provider calls. Deletion racing an active request cannot restore deleted content.
- Model context uses current guided evidence only. Client history projections omit coaching criteria/rubric guidance. Provider output has bounded fields and allowlisted evidence references, is rendered as text and does not enable tools.
- Bilingual UI includes explanation save, evidence expansion, original/revised comparison, export, deletion, recoverable failures and private-content masking. Unsaved coaching edits block guided submission until saved or discarded. The AI button and deterministic guided-submission button have distinct labels.

## Checks completed

All commands used Node 24.

| Check | Result |
| --- | --- |
| `pnpm check-types` | Passed |
| `pnpm --filter web test` | 81 files, 444 tests passed |
| `pnpm test:db` | 8 utility tests passed |
| `pnpm build` | Client and Vercel server bundles built successfully |
| PostHog credential scan | Passed, 985 text files scanned |
| Media boundary | Passed, 26 owned assets / 26 unique R2 keys |
| Client artifact boundary | 83 public text artifacts scanned; no checked provider-key names, private prompt, SQL command, test secret or future-case/rubric markers |
| Evaluation dry run | 90 synthetic prompts validated: 60 development / 30 acceptance, English and Chinese across three lessons |
| Retention dry run | No database contact, no mutation |
| Provider preflight | Catalog within reservation; key/model/cohort not configured and service disabled, so the expected not-ready exit was returned |

The full `pnpm check` remains blocked by existing repository-wide Biome diagnostics (1,683 errors, including generated `site-static` resources). These unrelated resources were left untouched. All implementation files pass targeted Biome checks. The pre-commit `lint-staged` command was corrected from `biome check --write .` to `biome check --write`, so lint-staged supplies the staged paths and the hook no longer rewrites unrelated files. The independent full-repository check is unchanged; no hook bypass is used.

The PostgreSQL tests use the real migration chain in isolated PGlite, including the new SQL command and actual retention SQL. They cover complete/resumed sessions, stale revisions, unchanged revisions, concurrent admission, daily/global limits, cross-midnight continuation, owner/access checks, retired and independent stages, unknown outcomes, expired leases, deletion races, retention and immutable lesson records. This does not substitute for testing the deployed Neon database/driver combination.

## Browser evidence

An isolated preview used deterministic fixture feedback, with the banner identifying that no AI, auth, database, analytics or billing was connected.

- English desktop: saved an explanation, completed both review rounds, expanded evidence, downloaded and inspected Markdown containing both revisions and their evidence, submitted the guided case, then completed the different independent case with its existing 2/2 result.
- Chinese dark mode at 390 × 844 with reduced motion: reused the original lesson textarea, saved a Chinese explanation, completed the revision review with keyboard activation, and checked that only one textarea was presented. No horizontal document overflow or Vite error overlay was observed.
- Contract lesson: actual WebGL canvas rendered; selected Case A, 3D + map and the 3,000-volume contract. The canvas and selected controls remained unchanged through saving and receiving a coaching review.
- The browser review caught and fixed duplicate “Review my reasoning” buttons and protection for unfinished coaching drafts.
- Fixture-only HMR initially recreated the React root. The preview now retains its root through module updates; a follow-up reload check confirmed one root, a working coaching panel and no repeated-root console error. The fixture can still perform a full page reload on an incompatible Fast Refresh export, consistent with its reset-on-reload banner.
- Existing Three.js warnings about `oklch(...)` color parsing were observed in the contract preview. Coaching changes do not modify that renderer; a rendered canvas and stable selection were verified, but this report does not claim warning-free 3D rendering.

Local generated evidence is excluded from Git:

- `artifacts/coaching/desktop-completed.png`
- `artifacts/coaching/mobile-zh-feedback.png`
- `artifacts/coaching/browser-export.md`
- `artifacts/coaching/client-boundary.json`

## Remaining release gates

The model candidate has not been quality-tested through actual provider calls. The 90-prompt dry run validates input construction only, not feedback accuracy or educational benefit. The operating instructions in [AI-COACH.md](../AI-COACH.md) require a dedicated key/cohort, synthetic provider evaluation with human review, preview Neon migration verification, confirmed provider data settings, retention scheduling, and the small user study before rollout.

Before applying migration 0004 to an existing environment, confirm migrations 0000–0003 are already correctly recorded. Migration 0003 contains a historical prelaunch reset and must not be inadvertently replayed against live learner data. No migration was run against the configured database in this implementation task.
