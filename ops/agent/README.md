# Agent runbooks

Read the [repository agent instructions](../../AGENTS.md) and the selected
runbook's handoff before execution.

| Task | Canonical procedure |
| --- | --- |
| Blind, adversarial review of every discoverable page as a first-time user | [New-user platform review](new-user-review.md) |
| Refresh source-based acceptance coverage and execute one Browser test case per round | [Browser E2E testing](e2e-testing/README.md) |
| Analyze website traffic and learner/product behavior | [PostHog analysis](../cursor/posthog-analysis.md) |
| Add or correct public product updates | [Update the changelog](../cursor/update-changelog.md) |

For first-visit reviews, begin with the new-user runbook and visible UI; publish
the exploration map before interacting, and do not pre-read repository files,
the E2E inventory, prior findings, or internal teaching/answer material. Keep all run
reports, learning records, screenshots, and GIFs outside the repository.

This is the agent workflow routing index. Procedures linked under `ops/cursor/`
retain their existing canonical files and [local index](../cursor/README.md).
Update this index and the [operations index](../README.md) when adding, moving,
or removing a workflow. Use links instead of duplicate runbook bodies.
