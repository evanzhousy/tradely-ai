# Operations runbooks

Read the repository [agent instructions](../AGENTS.md) and the selected runbook's
handoff before execution.

| Task | Canonical runbook |
| --- | --- |
| Investigate errors reported by PostHog | [PostHog error analysis](posthog-error-analysis.md) |

This index owns root-level operational runbooks. Keep one canonical procedure
per task and update this index when a root runbook is added, moved, or removed.
Existing subdirectory runbooks retain their own indexes.

## Indexed workflows

- [Browser E2E testing](agent/e2e-testing/README.md): refresh coverage from Git history, execute one @Browser case per goal round, and report findings with GIF evidence.
