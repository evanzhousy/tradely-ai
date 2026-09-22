# Tradely first-time-user exploration and learning review

## Objective and ownership

Use **[@Browser](plugin://browser@openai-bundled)** to experience Tradely as a first-time learner with no source-code or internal-product knowledge. First map what the visible platform invites the learner to explore. Then review every discoverable page, feature and learning resource through ordinary and adversarial user journeys, and demonstrate what the platform itself taught you. Finish with a report answering:

1. What bugs did you find?
2. Which product features were difficult or unintuitive to use, and why?
3. After studying the resources, what can you explain and apply using only knowledge supported by those resources? What remains unlearned or unsupported?

This runbook owns the exploratory review procedure. The external run folder owns the evolving discovery queue, learning record, findings, and evidence. The [agent index](README.md) owns routing. The separate [Browser E2E workflow](e2e-testing/README.md) owns contract-driven regression testing; do not import its source-first refresh or predefined answers into this review.

### Required Browser surface

Use only the user-named **[@Browser](plugin://browser@openai-bundled)** surface for every product interaction, observation, screenshot and capture in this review. Do not use Ego Browser, Ego Lite, the `ego-browser` CLI, a different browser profile, or an external browser-automation process as a substitute. The accessibility, screenshot and DOM controls provided inside @Browser are part of the allowed surface; direct browser automation outside @Browser is not.

The Browser surface is an evidence boundary, not an interchangeable implementation detail. If @Browser is unavailable or cannot reach the target, mark the affected run `BLOCKED` rather than switching tools. Evidence captured in another browser surface cannot satisfy this runbook or be merged into a Browser-only first-visit claim. Start a new labeled external run when correcting a surface mismatch, and retain the older run only as historical, non-authoritative evidence.

Read [AGENTS.md](../../AGENTS.md), this handoff, and the installed `runbook-maintainer` skill. Writing or maintaining this document alone does not authorize or constitute an operational review.

## Agent Handoff

Last updated: 2026-09-22

Latest authoritative run: new Browser-only greenfield review started 2026-09-22 at `/tmp/tradely-new-user-review/20260922-browser-greenfield/`. The earlier 20260921 Browser run and the 20260919 Ego Browser run are historical only; their coverage, findings and learning verdicts do not count toward this run.

- Rounds 001–048 are checkpointed. Home, Guides, Curriculum, all 36 lesson children, trust pages, partner handoffs, five later reuse checks and the authenticated account boundary are recorded in the external state/report.
- Rebuild every page, resource, finding and learning verdict from @Browser evidence. Do not copy prior Ego Browser observations into the new report, even when the behavior appears similar.
- The page/resource and K matrix are now recorded in the external report. The authorized Neon Auth reset on the exact test branch followed by normal @Browser email verification reached the assigned account. The first authenticated lesson then showed `进度服务暂不可用，课程仍保持打开。` after initial load and reload; keep saved-progress/resume unverified and carry finding F-001 forward.
- Keep first-visit consent `UNASSESSED` if the @Browser session already has a persisted choice; Browser-local clearing remains outside scope.
- Keep the new report, state, screenshots and GIF evidence outside the repository. The current run is `PARTIAL`: authentication is reviewed, but F-001 blocks saved-progress/resume verification; 30 learning objectives and clean first-visit consent remain incomplete.

On subsequent runs, prune completed items before adding new ones. Keep 3–7 actionable bullets here, never more than 12. Remove findings and learning history from this handoff; they belong in the external report/state.

## Recommended invocation

```text
/goal Run ops/agent/new-user-review.md using @Browser against <target URL>.
Act as a first-time learner with no source-code or internal-product knowledge.
Before interacting, list what the visible entry page suggests you should
explore: pages, functions, learning promises and adversarial user questions.
Freeze a Browser-discovered page inventory. Review one page or one coherent
cross-page journey per round, using realistic mistakes and recovery attempts,
until every discovered page and applicable branch has a terminal result. Keep
source-linked learning notes using only material consumed in the platform.
Finish with bugs, usability problems, and a page/resource matrix of what the
platform taught you, what you can apply, and what remains unknown.
Keep checkpoints, the final report, and actual browser GIF evidence outside
the repository. Maintain this runbook and commit any owned documentation edits.
```

For a resume, supply the previous external run folder and say `continue`. Reuse its resource IDs and learner record; do not replay completed first impressions as new discoveries. Without `/goal`, use the same bounded rounds and checkpoints in the current task. Start a goal only when the user explicitly requests goal execution; do not start one for document authoring.

**Success:** the Browser-discovered page and resource inventories have been reconciled; every discoverable page, applicable feature branch, adversarial journey and learning objective has an evidenced terminal result; all three report sections are complete; and GIF evidence and handoff links are valid. Confirmed bugs, poor usability, and demonstrated learning failures are legitimate review results. Missing pages, access, unread content, unsupported media inspection, or missing required evidence prevent a claim of complete review. A clean browser-consent branch may be explicitly `UNASSESSED` when the user scopes it out; it must not block otherwise authorized authenticated review.

**Stop:** completion, user-directed pause, or a genuine global blocker. Continue independent work when only one resource or feature is blocked. Follow the active goal controller's rules; if `update_goal` is available, mark blocked only after the same global blocker persists for at least three consecutive goal turns and no meaningful independent work remains. A resumed blocked goal starts a fresh blocked-turn count. Never mark complete to escape unfinished work or create an automation to continue after a user stop.

## 1. Establish the learner and environment

1. After reading only `AGENTS.md` and this runbook, use the requested target URL. The review agent must not inspect any other repository file, README, package script, route, test or internal doc to discover or start the product. If no usable URL is supplied or already running, request it and stop the Browser review as `BLOCKED`. A separate operator may start the environment and provide the URL plus non-semantic revision/environment metadata without revealing product behavior.
2. Record UTC start time, environment (local/Preview/production), sanitized entry URL, browser/viewport, language, account alias, and supplied revision/deployment evidence. Record unknown revision evidence as unknown. Do not inspect Git or deployment source from the review context.
3. Start as a guest in a fresh, isolated @Browser session where supported. Do not clear the user's normal cookies or sign them out. If session isolation is unavailable, record existing login/progress/consent and the resulting first-visit limitation. A returning or pre-completed account cannot prove fresh onboarding.
4. Default persona: comfortable using websites, new to the platform and the subject it teaches, trying to understand its value and learn enough to use its exercises independently. Pick the user's requested language/device or record the actual default. Do not invent real personal circumstances, trading history, disabilities, or prior experience.
5. Discover the tools for the named @Browser surface and read their current instructions. Use that surface for page navigation, reading, clicking, typing, scrolling, media controls, exercises, screenshots and capture. Check actual capture/export capabilities; do not assume a GIF tool exists. Ego Browser, Ego Lite, `ego-browser`, a different browser profile, external Playwright/Puppeteer, shell requests, source tests, database reads, or hidden browser state may not substitute for @Browser user-journey or learning evidence.
6. Create an external folder such as `/tmp/tradely-new-user-review/<UTC-run-id>/` with `report.md`, `state.md`, and `evidence/`. Use absolute paths when linking artifacts. Check that the folder is outside the repository and writable. Establish a supported way to save actual browser interactions as GIFs; pause recording around credentials/OTP entry. If GIF export is unavailable, preserve observations and an evidence blocker while continuing other useful work. Screenshots alone do not satisfy the repository's GIF requirement.

For authenticated test journeys, an authorized reset of the assigned test identity in the local/test auth system followed by a normal sign-out/sign-in is sufficient to verify account creation, OTP, saved progress and resume behavior. Do not clear the user's Browser storage to achieve this. Record any existing consent or local-session contamination separately. A clean Browser-storage state is required only when the round explicitly claims a first-visit consent/banner result; if that state cannot be isolated, mark only the consent branch `UNASSESSED` and continue the authenticated review.

The review request permits ordinary browsing and reversible learner activity in the named environment, within existing authorization. Use an assigned test identity for fresh signup/progress persistence when needed. Resolve missing identity/mailbox access while continuing guest learning. Enter OTPs only in the Browser authentication flow; never retain them in chat, shell, captures, reports, or Git. Do not use another person's account, manipulate entitlements, purchase access, change real billing, enable paid services, or send messages to other people without existing explicit authorization. In-product learning interactions available to the assigned learner can be exercised within the authorized account limits. Do not repair the product during the review unless the user expands the scope.

### Authorized Feishu Mail OTP procedure

When the user assigns `public@tfsharedspace.com` for non-production auth:

1. Open Feishu Mail in a separate Browser page using the authorized Feishu session.
2. Open the mailbox account switcher (`Other Accounts`) and select `public@tfsharedspace.com`. Confirm the visible current mailbox address before searching.
3. Start the Tradely or partner sign-in flow in the target Browser page and request the code.
4. In the selected public mailbox, open the newest matching verification message and verify its visible timestamp is after the current request; same-subject older messages can remain in search results. Read the code only inside the Browser and enter it directly into the target page's OTP field. If verification rejects it, refresh the mailbox result and select the newest timestamp rather than retrying a stale code.
5. Never print, copy into shell, write to report/state, screenshot, GIF, chat, or Git the OTP or message contents. Record only that delivery and verification succeeded, plus the sanitized target/environment.
6. After the auth journey, close or release the mail page and record whether the target reached the expected signed-in state. Treat any pre-existing account, billing warning or unrelated mailbox as contamination and do not use it as new-user evidence.

### Test-state reset with Neon Auth

For a clean local/test run, an operator may provide a Neon Auth MCP reset capability or the Neon Console Auth UI for the exact test branch. Confirm the branch is test and the exact assigned identity is `public@tfsharedspace.com` before acting. Reset only that user; do not touch production or unrelated users. If using Neon Console, open the branch's Auth → Users view, verify the exact email, delete only that test user, then let the app's normal email-code sign-up recreate and verify the account. Do not recreate it through the Console form alone because that leaves email verification incomplete. Record only the reset timestamp and sanitized result, never tokens or private account data. If neither Neon Auth MCP nor the authorized test-branch Console is available, mark the clean-state gate `BLOCKED`; do not substitute direct database writes, guessed endpoints, or a destructive Browser-profile clear.

## 2. Enforce the blind-review boundary

**Discover only through the rendered UI.** Throughout the review—not merely before the first lesson—do not read application source, repository files, internal product/curriculum docs, tests, answer keys, analytics, API/database responses, route inventories, prior reports or older findings. Do not search the web for subject explanations. Discover destinations through visible links, menus, search, recommendations and browser-native back/forward behavior. Initial entry and resuming an already-discovered URL are allowed; guessing a hidden route or using a source-derived path is not evidence that a new user could find it.

Use a separate post-review diagnosis phase only after the blind report is frozen and only when the user requests investigation or remediation. Label its evidence separately. Source inspection may explain a finding; it cannot change the original expectation, observation, severity, learning verdict or discoverability result.

Keep setup metadata separate from learner knowledge. Record any prior task context or accidental exposure to internal/domain answers; exclude affected first-discovery and assessment claims or label them contaminated. Do not pretend the model has forgotten its training. This is a source-bounded demonstration of learning, not proof of zero prior knowledge or a substitute for a human user study.

**Evidence rule for learning:** every substantive definition, formula, inference rule, procedure, limitation, and assessment answer must be traceable to platform material actually consumed in this run. Language comprehension, reasoning, and arithmetic may apply those taught rules; they may not supply missing domain premises. If a needed term or step has no source, write `not established by the platform yet` and seek visible platform help. Do not silently fill the gap with a correct answer from model knowledge.

Visible lesson text, diagrams, examples, quizzes and feedback, media, help/glossaries, downloads, and enabled in-product coaching can count as sources. Record their exact provenance. Coach explanations count as **assisted** learning, separately from what the core material taught. A link merely pointing to another service teaches nothing by itself. Explicitly assigned external readings may be consumed in @Browser and labeled external; arbitrary research and exploring the entire linked service are outside scope. Local parsing of a user-facing download is supporting evidence only after a real Browser download; it does not prove browser rendering or discoverability.

## 3. Publish the exploration map, then freeze the page inventory

Do not preload routes, a sitemap, feature list, syllabus, expected outcomes or resource counts. Start with the entry page and, before clicking anything, publish an **Initial Exploration Map** in the external report and the user-facing progress update. Derive it only from visible copy and controls. Include visible pages, product promises, core first-time-user tasks, skeptical questions, and adversarial journeys such as wrong inputs, empty states, refresh/back behavior, guest/account transitions, language/viewport/keyboard use, repeated safe actions, unavailable dependencies and recovery from errors.

This opening map is a hypothesis, not coverage. After inspecting every visible global navigation, menu, footer, catalog, search/filter and recommendation surface, freeze a **Page Inventory**. Each unique page gets a stable `P-###` ID, visible title, discovery path, expected purpose, applicable states/branches and status. Retain duplicated, redirected, inaccessible and late-discovered pages with their classification and discovery evidence. Expand the inventory only when a reviewed page exposes a previously unseen destination, then record why it was added.

Use stable `P-###` page, `J-###` journey, `R-###` resource, `K-###` learning-objective, and `F-###` finding IDs. Keep these tables in external `state.md`:

| Record | Required fields |
| --- | --- |
| Page | ID, visible title, sanitized URL, discovery path/round, expected purpose, visible entry points, applicable states/branches, status, rounds/evidence |
| Journey | ID, learner's task/question, visible cue and originating resource/round, destination if known, status, dependency, next action, evidence |
| Resource | ID, visible title/type, sanitized URL plus section/timestamp, discovery path, parent, language/access state, announced versus actually consumed scope, status, rounds/evidence, linked K IDs |
| Learning objective | ID, platform's stated outcome or explicitly labeled inference from its content, supporting R IDs and exact locators, learner explanation, unknown prerequisites, first attempt, feedback/assistance, later application, learning verdict |
| Finding | ID, category, impact/severity, affected journey/resources, observed evidence, reproduction, confidence, recommendation, retest state |

Resource states: `QUEUED`, `IN PROGRESS`, `REVIEWED`, `BLOCKED`, `NOT APPLICABLE`. `REVIEWED` means the promised content was consumed and assessed; it does not mean bug-free or learned. A bug that prevents consumption leaves that resource `BLOCKED`, with a confirmed finding and its unseen content explicitly unassessed. Use `NOT APPLICABLE` only for a proven duplicate/retired/out-of-scope item with a reason, never for missing access or lack of time. Journeys use the same states, with `REVIEWED` recording an observed success or failure; a failed journey does not mark its unread resources reviewed. Track required GIF evidence separately as `READY` or `BLOCKED`.

Inventory every discoverable page as well as product journeys and teaching materials: first impression/value proposition, navigation and help, starting/resuming learning, account/progress behavior when offered, legal/trust pages, recovery/error states, and every discoverable lesson, guide, glossary, FAQ, worked example, exercise/lab, assessment, video/transcript, diagram, assigned download and explicitly linked partner handoff. These are prompts for coverage, not claims that those features exist. Do not assume legacy purchase flows, gated lessons, or optional features are currently available.

Treat a lesson as a parent with separately tracked resources where its text, video, diagram, or exercise teaches something distinct. Mark identical repeated material as an alias of the canonical R ID; retain how each presentation was reached. Sampling a few lessons or marking a parent read while skipping its children cannot establish full learning coverage.

## 4. Execute one page or coherent journey per round, adversarially

Each goal round reviews exactly one page or one coherent cross-page journey. A page round covers the page's visible purpose and all applicable states that a new user can reach without unrelated navigation. A journey round may cross pages only when the user task inherently does so, such as guest practice → signup → restored work. Do not sweep unrelated pages to inflate coverage. Every frozen `P-###` page must receive its own terminal round or a documented alias/redirect reason.

Adversarial means skeptical and realistic, not destructive. For every applicable page/function, test the happy path plus plausible first-time mistakes and boundaries revealed by the UI: choose the wrong-looking control, submit incomplete or invalid input, use back/refresh, repeat a safe action, change viewport/language, try keyboard navigation, follow an unavailable dependency, and attempt ordinary recovery. State the user hypothesis before acting. Never brute-force, bypass access, inspect hidden state, purchase, alter real billing, spam providers or invent edge cases unsupported by the visible product.

In the first round, before following a call to action, record what the entry page tells you about who the platform is for, what you can learn, access or account requirements, where to begin, and what the next action will do. Leave unclear answers unknown. Later, test offered progress/resume behavior through normal navigation and a return visit; preserve the distinction between guest activity and saved account progress.

1. **Choose.** Read the saved learner state. Pick the next action from a visible recommendation, prerequisite, unanswered question, or unreviewed resource. Prefer the platform's suggested order until it becomes unclear. Write: `I want to <task> because <visible cue/question>. I expect <observable result>.` If nothing suggests a next step, preserve that usability observation before searching menus or help.
2. **Observe before acting.** Read the current screen and relevant labels. State what you think the control or next step means. Use visible text, accessible names, and the rendered UI; automation selectors are mechanics, not extra knowledge. Start or resume sanitized evidence capture before the relevant interaction.
3. **Act naturally.** Click the most plausible control, scroll through content in reading order, use ordinary keyboard/back navigation, adjust a lab input for a stated learning reason, and inspect the settled response. Wait for actual page/media completion rather than treating loading UI as final. Do not brute-force answers, rapidly enumerate every control, inject progress, bypass prerequisites, or inspect solution state. Record detours and failed expectations without pretending they are measured human behavior.
4. **Learn the resource.** Read all relevant sections, inspect diagrams and worked examples, and use the practice the resource offers. For media, record the actual playback interval and what was observed/heard. Loading a poster or jumping to the end is not consumption. If only a platform transcript is accessible, label it transcript-based learning and separately mark video/audio-only instruction or demonstrations unassessed. Finish all distinct assigned resources or leave explicit unfinished/blocked children.
5. **Capture understanding before feedback.** Add source-linked notes and a plain-language teach-back: what was taught, when to use it, the steps/rules, its limits, and what remains confusing. Attempt the offered exercise using only premises already in the learner record; save the original response and reasoning before submission or revealing feedback. Where no exercise exists, make a bounded explain/apply check using the platform's stated objective and examples. Label these reviewer-created checks; they are not platform grades.
6. **Try ordinary recovery.** When stuck, make at most two plausible UI-led recovery attempts (for example, back to the lesson or opening its visible help). Preserve the initial confusion, then use available platform guidance and record assistance. Stop repeated guesses; add an unresolved question or blocker and continue an independent resource. An error disappearing on retry is an intermittent observation, not proof it never happened.
7. **Assess and checkpoint.** Record expected versus actual behavior, bugs/friction, consumed resources, K entries, first-attempt and assisted outcomes, remaining dependencies, and evidence paths. Expand the queue from newly visible links. Select a next candidate with its reason, then persist the checkpoint before another round or context compaction. Give a brief user progress update during sustained work.

**Page completion gate:** before closing the round, account for the page's visible links, controls, forms, filters, disclosures, language/theme behavior, empty/loading/error states that were encountered, and onward navigation. Mark unexercised branches explicitly; loading the page or reading a snapshot alone is not a completed review.

Use this compact round record in the external report:

```text
Round / timestamps / target / account alias / viewport / language:
Page ID / visible discovery path / page purpose:
Objective and reason from prior visible evidence:
Adversarial hypotheses and boundaries attempted:
Starting learner knowledge (K IDs) and expected outcome:
Actions and actual visible result (including confusion/recovery):
Resources consumed (R IDs, sections or media intervals) / newly discovered:
Teach-back / original exercise answer / source premises / feedback / retry:
New knowledge and remaining questions (K IDs):
Journey/resource disposition / findings (F IDs) / evidence status:
Absolute GIF and supporting artifact paths:
Next candidate and dependency / owned learner-state changes:
```

On resume, confirm the target, session, resource availability, and current page still match the checkpoint. Restore learning only from the saved record, not prior model knowledge. Preserve original attempts when retesting. If content/deployment changes, label affected evidence with its version and repeat affected checks; never blend two versions into one clean first-visit result. If the external record was lost, report the evidence gap and restart a labeled run rather than reconstructing invented observations.

## 5. Evaluate whether the platform taught enough

Assess each K objective against the platform's own promise, not the model's entire subject knowledge. A platform completion badge, watched video, correct multiple-choice guess, or coach-supplied answer does not establish independent understanding.

For each objective, record three checks where applicable:

1. **Explain:** state the concept/procedure and its limits in your own words, with exact source locators.
2. **Apply:** complete the platform exercise or a small changed-input example that uses only its taught rules. Preserve the first answer before feedback and the source-based expected reasoning. If the material provides no way to justify correctness, mark the result unverified instead of using model expertise as an answer key.
3. **Return and combine:** after intervening material, revisit the objective before reopening its lesson/solution and combine it with other taught concepts in a final task. For a final objective, use the synthesis round. Use the accumulated learner record as the allowed evidence base and label this notes-supported reuse, not measured human long-term retention. Build the task from the platform's own learning outcomes; map every required step to K/R IDs and expose missing bridges.

Use one learning verdict per objective:

| Verdict | Meaning |
| --- | --- |
| DEMONSTRATED | Explain, apply, and later reuse are supported by consumed platform sources without solution/coach assistance on those attempts. Justify any inapplicable check. |
| ASSISTED ONLY | The learner succeeds after hints, solution exposure, coaching, or a worked answer; independent application has not yet been demonstrated. |
| NOT DEMONSTRATED | Material was consumed, but a required explanation/application/reuse check failed or the teaching omitted a necessary definition, example, or step. |
| UNASSESSED | Missing access, unfinished consumption, unavailable media, contaminated knowledge, or inadequate evidence prevents a defensible assessment. |

A later distinct successful attempt may change the latest verdict, but preserve first-attempt difficulty and assistance history. For missing prerequisites, quote or paraphrase the point where the platform assumes them and cite the affected resource; do not supply an external lesson to make the platform look complete. Separate unread/unavailable material, unclear teaching, contradictions between platform sources, and learner mistakes despite sufficient instruction.

Track promised outcomes against evidence. Infer unstated goals cautiously and label them inferred. If the platform never explains what the learner should be able to do, report that as a usability/teaching gap rather than inventing an expansive curriculum. Describe correctness as supported by the platform's material; an independent expert fact-check is a separate task and must not improve this review's learning score.

## 6. Reconcile scope and findings

After the natural learning path, perform a Browser-only page reconciliation sweep through visible navigation/footer, menus, learning catalogs, search, help, legal/trust pages and resource recommendations. Expand collapsed modules, follow pagination/filters, and inspect nested resources where offered. Record advertised totals and compare them with unique page/resource IDs. Queue each newly found in-scope page for its own round, preserving its late discovery and any discoverability problem. This is reconciliation, not a substitute for the page's adversarial round.

Close discovery only when every visible inventory surface and discovered in-scope branch has been inspected and a final reconciliation finds no unclassified resources. Do not stop merely because the main course ended. If a catalog is inaccessible, results are unbounded/dynamic, or content keeps changing, name that boundary and report partial coverage. Treat optional generated conversations as a feature journey with representative documented interactions, not an infinite resource library to exhaust. Do not crawl whole external services; review only the explicitly assigned resources and handoff clarity.

Classify findings separately:

- **Bug:** observed malfunction or contradiction with an explicit UI promise, with expected/actual behavior and minimal reproduction. Repeat once when safe to distinguish reproducible from intermittent/unconfirmed observations; do not label an inferred backend cause confirmed. A failed request or blank screen may remain environment-attribution unknown.
- **Usability problem:** a feature works but its label, placement, sequence, feedback, effort, or explanation obstructs the learner's task. Include the initial expectation, actual path, detour/assistance, concrete consequence, and a specific improvement. Avoid unsupported claims about what most users think or measured human completion times.
- **Learning gap:** an unsupported concept, missing prerequisite, unexplained exercise, inconsistent resource, or failure to apply the taught material. Link affected K/R IDs and checks. Cross-reference usability/bug findings instead of duplicating them.

Prioritize impact: `HIGH` prevents a core learner task or produces materially misleading learning; `MEDIUM` causes significant confusion or repeated detours with a workaround; `LOW` is localized friction with limited effect. Keep confidence and evidence readiness separate from impact. One common problem may affect many resources; retain every affected ID under one finding. Do not invent findings to populate a report section.

Any source-code or diagnostic investigation requested afterward must be labeled a separate follow-up. It cannot retroactively become the learner's discovery path, knowledge source, or original answer.

## 7. Deliver the report and validate completion

Finalize external `report.md` with the environment, dates, persona, actual browser/language/device scope, prior-context limitations, and outcome (`COMPLETE REVIEW`, `PARTIAL`, `BLOCKED`, or `USER-PAUSED`). Then provide these three required sections:

### 1. Bugs found

For every bug: F ID, impact, confidence/reproducibility, affected user task/resources, environment/revision, expected versus actual, numbered reproduction steps, linked GIF and supporting evidence, and suggested next action. State explicitly when none were observed within the reviewed scope. List environment/tool blockers separately.

### 2. Features that are difficult or unintuitive to use

For every usability finding: feature and F ID, what the learner expected before acting, what actually happened, the failed attempt/detour or required help, user impact, evidence, and a concrete recommendation with an observable acceptance condition. Prioritize the highest-impact improvements; separate observed behavior from design suggestions.

### 3. What the platform taught me, and what it did not

- Give a direct, qualified answer: **all assessed advertised outcomes demonstrated**, **partially demonstrated**, or **cannot determine because coverage/evidence is incomplete**. Never claim all possible domain knowledge or competence in real trading from this review.
- Include the complete R inventory and K matrix with source locators, consumed/missing scope, teach-backs, original attempts, assisted retries, later checks, and verdicts. Summarize supported capabilities in plain language and link the final synthesis task and result.
- Name every missing prerequisite, unclear explanation, contradiction, failed application, unconsumed/unavailable resource, and advertised outcome without sufficient teaching. Say what platform explanation/example/exercise would make each gap assessable, without importing an outside answer.
- Separate core-content learning, coaching-assisted learning, explicitly assigned external material, and any contamination. An unread locked resource or missing audio capability is unknown coverage, not proof that the content teaches nothing.

Include a complete page matrix before the learning matrix. For every `P-###`, show the visible discovery path, purpose, states and adversarial branches exercised, terminal status, findings, and GIF evidence. A resource attached to a page does not replace review of that page's navigation, controls, disclosures and recovery behavior.

Reconcile counts: unique page total equals the sum of all page states; unique resource total equals the sum of all resource states; K total equals the sum of its four verdicts. Report distinct pages reviewed, resources consumed in full, failed pages/resources, aliases and redirects separately. List every blocked/queued/in-progress item, evidence blocker, unclassified branch, and remaining account/access boundary. Retests add attempts, not duplicate inventory counts. Complete review requires no unresolved required work; a complete review may still conclude learning was not demonstrated.

Before finalizing:

1. Verify round/resource/objective/finding references and counts, source locators, external report links, and actual nonempty GIF files. Inspect GIFs for playable app interactions, environment labels, and sensitive data. Use actual app captures, not staged illustrations or synthetic reenactments. For sensitive auth steps, capture safe before/after states and record the excluded interval. Link evidence per finding and round; include representative GIFs directly in the final response.
2. Preserve authorized learner progress; record any test-owned state retained or cleanup needed. Do not reset shared data or delete evidence to make the next run look new.
3. Perform the self-maintenance decision below. Validate any changed Markdown links and `git diff --check`. Stage explicit owned documentation paths only, inspect the staged diff, and commit validated edits per AGENTS.md. Do not commit external reports/captures or unrelated changes; do not push.
4. Update goal status only when its actual completion/blocking conditions are met. The final user response must stand alone: tested environment, outcome, coverage, answers to all three questions, all-findings report link, GIF embeds/links, remaining blockers, maintenance decision, and documentation commit if one was made.

For document-only creation/maintenance, validate the procedure and index links and commit the owned documentation; explicitly report that no Browser review or learning assessment ran. Do not manufacture findings, learning scores, or GIFs for an unexecuted runbook.

## Runbook Self-Maintenance

At the end of execution, use `runbook-maintainer` and the available `greenfield` skill to compare the observed procedure with the ideal next review. For a documentation-only pass, review executability without claiming operational evidence.

- Promote durable lessons about browser setup, source isolation, the opening exploration map, adversarial page coverage, resource reconciliation, learning checks, or evidence gates into the procedure. Correct tool/path drift when verified. Do not preload routes, answers, current syllabus counts, specific product defects, or preferred click paths into future first-visit reviews.
- Keep run-specific knowledge, findings, counts, raw logs, and completed progress in the external report/state only. Maintain one bounded Agent Handoff with the current run path, next action, and unresolved prerequisite evidence; prune obsolete/completed bullets first.
- Keep this exploratory workflow distinct from the contract-driven E2E procedure. Link shared routing rather than duplicating test inventories or importing source-first expectations. This document applies the installed skill; it is not its mirror and does not authorize edits to installed skills or other repositories.
- Update the [agent index](README.md) and [operations index](../README.md) when this runbook moves or changes ownership. Validate inbound links when adding, renaming, or removing procedures.
- If no reusable rule changed, write `Runbook maintenance: no change` in the report/final response. Do not edit merely to record activity or turn one-off uncertainty into permanent policy.
