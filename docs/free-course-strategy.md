# Free course entry and measurement

Policy approved September 10, 2026. Local implementation; the evaluation window starts after deployment, not the approval date.

## Access and discovery

`apps/web/src/content/course.ts` owns the explicit free learning paths. Reordering the syllabus must not change access.

- Foundations: `option-contracts`, `option-rights`, `premium-payoff`, `expiration-settlement`. This is the complete Contracts and money module; all prerequisites are inside the free path.
- Optional research previews: `audited-boundary`, `symbol-universe`, `rank-symbols`. Preserve their public URLs and access. Present them to learners who already know the basics, with a clear notice that suggested prerequisites can be paid.
- The other 29 lessons remain paid. The existing GEX, OI/volume and IV-crush public guides remain discovery material.

Homepage, course overview and pricing entry actions start at `option-contracts`. Exercises and feedback are available anonymously. An account is needed to record completion; anonymous attempts reset on reload. After the fourth foundation lesson, explain the next outcome (quotes, executions and options flow) and link to pricing. Present the Lifetime Course Pass before membership when that offer is enabled. Prices, availability and entitlements remain server-owned.

The first contract exercise uses identity, premium and deliverable units, in that order. New scenarios use version 3. Version 2 remains available for reviewing submitted work; unfinished obsolete attempts follow the existing restart policy. This does not reset course completion records.

## Evaluation after launch

Review the first month of production data. This document does not schedule an automated review or claim conversion improvement.

Primary measure: unique first-time free-foundation starters who purchase lifetime course access within 14 days, per 100 unique starters. Use only cohorts with a complete 14-day observation window, and report sample sizes alongside the rate. Exclude existing paid learners and internal/testing activity. Segment acquisition source and locale where counts support it; do not compare different traffic mixes as if they were an experiment.

Use existing consented typed events:

| Question | Event and scope |
| --- | --- |
| Started the foundations experience | `preview_exercise_started` or `lesson_exercise_started`, `lesson_id = option-contracts`; deduplicate the same learner across anonymous and signed-in events |
| Finished practice | `preview_exercise_submitted` or `lesson_exercise_submitted`, by foundation lesson and result |
| Recorded account completion | `lesson_completed`; this excludes anonymous learners and is not the denominator |
| Investigated paid access after foundations | `membership_cta_clicked`, `surface = foundation_completion` |
| Opened pricing | `page_viewed`, `route_name = pricing` |
| Began a course purchase | `billing_action_started`, `action = checkout`, `offer = lifetime_course` |
| Confirmed course access on checkout return | `course_pass_access_verified`, `source = checkout_return` |

Checkout redirects and `billing_checkout_returned` are not proof of payment. Reconcile purchases with successful billing records; deduplicate repeat verification, exclude restores/existing access, and report refunds. Browser consent and learners who do not return from checkout limit analytics coverage. Report this coverage limitation rather than presenting browser events as complete revenue accounting. Do not collect answers, exercise text, emails or new identity fields for this review.

If traffic is too sparse to compare conversion credibly, observe a few learners completing the foundation sequence before moving the paywall again. Diagnose the stage: failure before exercise completion points to onboarding/content, while completed exercises followed by pricing abandonment points to the offer. More free lessons is not an automatic response to either result.

## Local validation

- Node 24: 81 regression tests passed, including anonymous grading of all seven free lessons, persistence for unpaid foundation learners, paid access denial, archived scenario lookup, and server-rendered navigation groups and links.
- Workspace typechecks and the packaged production build passed. Modified source files passed Biome.
- Browser verification could not complete: ego-browser timed out and agent-browser's daemon became unresponsive. UI tests using jsdom also hit worker-startup timeouts under local machine load; this is a verification limitation, not a passing UI result.
- No deployment, Stripe configuration change, or live analytics claim is included in this implementation.
