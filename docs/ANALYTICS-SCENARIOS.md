# Analytics scenarios

This is the implementation contract for Tradely's registered application events, reviewed
on 2026-09-17. The typed names and permitted properties live in
[`events.ts`](../apps/web/src/analytics/events.ts). Consent, identity, and delivery
belong to [`AnalyticsProvider`](../apps/web/src/analytics/provider.tsx), with SDK
imports restricted to the shared browser and server clients.

## Shared rules

- Browser events require analytics consent and respect Do Not Track. Unknown or
  denied consent does not load the PostHog SDK. Server events require the same-site
  `tradely_analytics_consent_v2=granted` cookie. Version 2 includes masked replay
  and heatmaps; the previous event-only consent does not opt visitors into them.
- PostHog events carry `app=tradely`, `environment`, `runtime`, `release`, and
  `event_schema_version=1`. Custom properties are pruned to the typed allowlist.
- Route URLs omit query strings and fragments. Learner answers, case bodies,
  protected media URLs, email, payment details, and secrets are excluded from
  application event properties. Exceptions pass through bounded redaction.
- Browser application events also go to GA4 when configured; GA4 route views use
  `page_view`. Server timing and PostHog SDK diagnostics stay in PostHog.
- After consent, a bounded queue can hold events while the PostHog SDK loads.
  Withdrawal clears that queue. GA4 readiness does not substitute for PostHog
  identity readiness.
- Business actions continue to work when analytics is disabled or unavailable.
  Successful saves/restorations remain successful if refreshing the UI fails;
  refresh errors may emit `$exception`, never a false save/payment failure.

## Application events

Paths below are relative to `apps/web/src`.

| Event | Trigger and interpretation | Implementation |
| --- | --- | --- |
| `analytics_consent_updated` | Explicit grant, once per provider in the current consent window; only `status=granted`. | `analytics/provider.tsx` |
| `page_viewed` | Current page after consent, then each pathname change. Query-only or language-only changes do not duplicate the visit. Auth entry uses `route_name=auth_sign_in`. | `analytics/route-analytics.tsx` |
| `locale_changed` | Language selection changes; previous/new locale only. | `components/locale-switcher.tsx` |
| `auth_sign_in_opened` | Click sign-in from a registered entry surface; records intent only. | `components/auth-controls.tsx` and other sign-in links |
| `auth_sign_in_completed` | A Tradely-started email-OTP or Google sign-in reaches an identified Neon session. Failed/stale pending markers are cleared and expire. | `analytics/auth-sign-in.ts`, `analytics/auth-identity.tsx`, `routes/auth.sign-in.tsx` |
| `auth_session_established` | PostHog identifies an available signed-in Neon identity after consent. Deduplicated while that mounted identity remains active; existing restored sessions also qualify. | `analytics/auth-identity.tsx` |
| `tradingflow_link_opened` | Click a header or lesson-practice TradingFlow link; optional bounded lesson ID/tool. `home_hero` is reserved in the type but has no current emitter. | `components/header.tsx`, `practice-card.tsx` |
| `lesson_opened` | View a valid lesson after consent, once per lesson visit, including restricted access. Captures access state at that moment, locale, and media availability. | `routes/learn.$lessonSlug.tsx` |
| `lesson_video_started` | First captured play in a mounted lesson/revision player; pause/resume does not duplicate it. A new lesson or content revision starts a fresh player lifecycle. | `components/video-player.tsx` |
| `lesson_video_completed` | Video `ended`; records duration and lesson ID, not media URL. Replay can produce another completion. | `components/video-player.tsx` |
| `lesson_completed` | Server confirms a requested completion save. | `components/complete-lesson-button.tsx` |
| `lesson_progress_save_failed` | Completion save is rejected (`signed_out`, `access_denied`) or throws (`unavailable`). Optional video-position writes do not emit this event. | `components/complete-lesson-button.tsx` |
| `visual_lesson_scene_started` | A visual scene walkthrough starts. `mode=autoplay` is visibility-driven playback; `mode=manual` is learner-started navigation. Deduplicated per scene for the page visit. | `features/learning/concept-lab.tsx` |
| `visual_lesson_scene_completed` | A visual scene reaches its final authored step. Records bounded lesson/scene IDs, locale, and start mode. | `features/learning/concept-lab.tsx` |
| `visual_lesson_explored` | First direct interaction with the interactive scene for the page visit. | `features/learning/concept-lab.tsx` |
| `lesson_exercise_started` | Signed-in exercise successfully opens, resumes, or restarts. This is not a unique-attempt count. | `features/learning/learning-exercise.tsx` |
| `lesson_hint_opened` | Server successfully processes a hint request; scenario IDs/version and current stage only. | `features/learning/learning-exercise.tsx` |
| `lesson_exercise_submitted` | An update returns an assessment; once per returned attempt within the mounted learning session. Records criteria counts and `practiced`/`demonstrated`, not answers. | `features/learning/learning-exercise.tsx` |
| `lesson_exercise_save_failed` | Signed-in exercise open/update fails; bounded failure reason only. | `features/learning/learning-exercise.tsx` |
| `lesson_renderer_changed` | Select 2D/3D or fall back to 2D on renderer failure. | `features/learning/learning-exercise.tsx`, `contract-explorer.tsx` |
| `billing_action_started` | A supported billing-support action begins: `portal` or `course_pass_restore`. | `components/pricing-actions.tsx` |
| `billing_action_redirected` | The customer portal returns a hosted URL immediately before navigation. | `components/pricing-actions.tsx` |
| `billing_action_failed` | Customer portal or historical Course Pass restoration fails with a bounded reason. | `components/pricing-actions.tsx` |
| `course_pass_access_verified` | Server-side verification/restoration confirms historical Course Pass access after the database grant is authoritative; source is `checkout_return`, `restore`, or `existing`. | `server/billing.server.ts`, `server/analytics/posthog.server.ts` |
| `server_route_timing` | Course-progress read takes at least 1,000 ms; duration capped at 60,000 ms, plus status and signed-in state. | `server/progress.server.ts`, `server/analytics/posthog.server.ts` |

## SDK scenarios

- `$pageview` accompanies `page_viewed` for the same visit. Do not add them together
  as separate visits.
- `$identify`/`$set` associate the permitted Tradely user ID and `auth_provider`.
  Sign-out/account changes reset identity; there is no dedicated sign-out event.
- `$web_vitals` records available LCP, CLS, FCP, and INP without DOM attribution.
- `$exception` covers unhandled browser errors/rejections, route boundaries,
  unexpected completion/billing failures, and instrumented server access, billing,
  media, progress, and learning failures. Browser console-error capture and global
  Node exception autocapture stay disabled.

Masked replay and coordinate heatmaps are enabled after consent. `$pageleave`
records scroll information before SPA navigation and on unload. Generic click
autocapture and optional product widgets remain disabled. Anonymous exercise previews intentionally do not emit
the signed-in exercise events. Sales are retired, so the active contract contains no
new-checkout, payment-success, subscription-activation, refund, or revenue event.
`auth_sign_in_completed` proves completion of a Tradely-started sign-in flow, but
Neon does not expose a trustworthy new-account boundary here, so it is not labeled signup.

Recordings retain layout and interaction paths while masking text and inputs.
Images, media, canvases, embedded frames, protected lesson prose, and interactive
practice contents are blocked. DOM attributes are restricted to layout/state
fields; replay URLs and nested heatmap URL buckets omit queries and fragments.
Console logs, request/response details, and canvas capture remain off. Retention
is 30 days. See [Replay setup](POSTHOG-REPLAY.md) for live activation and checks.

## Verification
Run `pnpm check-types`, `pnpm check`, and `pnpm build`. Then use the Browser
to grant consent, navigate between home, pricing, and sign-in, and withdraw
consent. Verify one `$pageview`/`page_viewed` pair per navigation, no
sensitive query values, and no further events after withdrawal. Local event
delivery remains separate from deployed event delivery and PostHog dashboard
population.
Use a normal Chrome user agent and `navigator.webdriver=false`; keep production
bot filtering enabled. Exercise visual playback, direct exploration, and a normal
sign-in flow when credentials are available. Do not mutate production learning
records solely to generate analytics.

Reference: [PostHog event tracking guidance](https://posthog.com/tutorials/event-tracking-guide).
See [observability configuration](OBSERVABILITY.md) for deployment and alerting.

The 2026-09-17 contract follows the free visual-learning product: visual scene
engagement is first-class, sign-in completion is distinct from restored sessions,
and historical Course Pass verification is emitted from the server after the
authoritative grant. Deployment and live PostHog observation remain separate proof.
# Public guides and anonymous previews

The SEO implementation adds these registered events through the existing consent boundary:

| Event | Trigger | Allowed fields |
|---|---|---|
| `guide_demo_started` | First active interaction in a public demo run; never on render. | `guide_id`, `demo_id`, `locale` |
| `guide_demo_completed` | Correct understanding check, once per run whose start was captured. | `guide_id`, `demo_id`, `locale` |
| `guide_next_step_clicked` | Free lesson, related lesson or curriculum link in a guide. | `guide_id`, `destination_kind`, optional `lesson_id` |
| `preview_exercise_started` | A public lesson preview successfully opens/restarts, once per run. | `lesson_id`, `scenario_id`, `scenario_version` |
| `preview_exercise_submitted` | Preview service returns a result, once per run whose start was captured. | `lesson_id`, `scenario_id`, `scenario_version`, `result` |

`page_viewed.route_name` also supports `guides` and `guide`. Public guide content is English. Anonymous preview events are separate from the existing signed-in `lesson_exercise_*` events. No answer, action history, worksheet text or raw referrer query is sent. Actions performed before consent are not replayed afterward. A reset creates a new run; a failed request does not count as a successful open or submission.

These events measure learning behavior, not verified purchases. See [SEO.md](SEO.md) for the publishing and release checks.

## AI coaching pilot

`lesson_coach_started`, `lesson_coach_feedback_viewed`, `lesson_coach_revision_saved`, `lesson_coach_cycle_completed`, and `lesson_coach_failed` use the typed event registry and property allowlist. Only lesson/scenario/version, locale, feedback round and fixed failure reasons are included. Explanations, feedback, evidence, snapshots and provider bodies are excluded. All coaching DOM is marked `data-analytics-private` and remains inside the protected exercise surface. Declining analytics consent does not disable coaching.

The database owns actual executions, quota and cost. Client events describe UX milestones and must not be used for billing or claims of mastery. Use consented learners for behavioral funnels. Compare existing independent-case results only when the case is new to the learner, distinguish hint use and repeat attempts, and use human review for prose. Saved coaching text is never sent to the analytics provider.
