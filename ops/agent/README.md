# Agent runbooks

Read the [repository agent instructions](../../AGENTS.md) and the selected
runbook's handoff before execution.

| Task | Canonical procedure |
| --- | --- |
| Explore as a first-time user, assess usability, and learn only from platform resources | [New-user platform review](new-user-review.md) |
| Refresh source-based acceptance coverage and execute one Browser test case per round | [Browser E2E testing](e2e-testing/README.md) |
| Analyze website traffic and learner/product behavior | [PostHog analysis](../cursor/posthog-analysis.md) |
| Add or correct public product updates | [Update the changelog](../cursor/update-changelog.md) |

For first-visit reviews, begin with the new-user runbook and visible UI; do not
pre-read the E2E inventory or internal teaching/answer material. Keep all run
reports, learning records, screenshots, and GIFs outside the repository.

This is the agent workflow routing index. Procedures linked under `ops/cursor/`
retain their existing canonical files and [local index](../cursor/README.md).
Update this index and the [operations index](../README.md) when adding, moving,
or removing a workflow. Use links instead of duplicate runbook bodies.
