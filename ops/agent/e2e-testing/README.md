# Browser E2E testing

Read the [repository agent instructions](../../../AGENTS.md), then the runbook's handoff.

For a first-visit usability and learning review, use the [new-user platform review](../new-user-review.md). That workflow discovers behavior through the UI; do not pre-read this test inventory for it.

| Purpose | Canonical file |
| --- | --- |
| Refresh coverage from Git and run one @Browser case per goal round | [Browser E2E runbook](browser-e2e-runbook.md) |
| Expected browser behavior and lesson sweep | [E2E test cases](e2e-test-cases.md) |

Actual runs create sanitized reports outside the repository, for example under `/tmp/tradely-browser-e2e/<UTC-run-id>/report.md`. Evidence paths and all findings belong in those external reports; the runbook retains only a bounded next-run handoff. No browser run has been performed merely by creating these documents.

Update this index when the canonical files are added, moved or renamed. Keep procedure, case definitions and run results in their respective files.
