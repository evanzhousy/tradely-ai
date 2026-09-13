# Update the Tradely changelog

## Objective and ownership

Maintain an accurate, readable public record at `/changelog`. The content owner is
[`apps/web/src/content/changelog.ts`](../../apps/web/src/content/changelog.ts);
the [route](../../apps/web/src/routes/changelog.tsx) renders that record. Routine
updates change content, not routing, layout, or a second release-history source.

This is the canonical procedure, listed in the [agent runbook index](README.md).

## Agent Handoff

Last updated: 2026-09-12

No open handoff items. This pass created documentation only; the changelog update
procedure was not executed and no production checks were performed.

## Recommended Invocation

```text
/goal Use ops/agent/update-changelog.md to update the public changelog for
[release or change scope]. Verify each claim, preserve existing permalinks,
validate the page and capture local browser GIF evidence, maintain the runbook,
and commit only the scoped changes. Do not push or deploy without authorization.
```

Success means the requested changes are accurately described, existing history
and permalinks remain intact, relevant checks pass, browser evidence identifies
its environment, and the scoped implementation is committed. Stop when complete,
when the user pauses the work, or when a specific missing release decision or
source of evidence prevents an accurate entry. Do not invent dates or claims to
remove a blocker.

## Prerequisites and boundaries

- Read [AGENTS.md](../../AGENTS.md), this handoff, and any more-specific instructions.
- Run from the repository root. Check `git status --short` and the current branch;
  preserve all unrelated modified and untracked files. Never stage the whole tree.
- Check the runtime and package manager against [package.json](../../package.json)
  and [apps/web/package.json](../../apps/web/package.json). Use their declared
  versions and existing dependencies; do not upgrade tooling for a copy update.
- Establish the requested scope from user instructions, relevant diffs, commits,
  and current product behavior. Recheck handoff items instead of trusting old state.
- Local commits and local browser checks prove implementation, not deployment.
  For retrospective release notes, verify availability in the intended deployed
  environment. For an entry accompanying a release, verify the included code and
  describe it as prepared locally until that release is verified. If the release
  date or inclusion is unknown, keep the candidate in the handoff rather than
  adding an unsupported public announcement.
- Pushing, deploying, changing production settings, or notifying others requires
  authorization in the current task context. Do not repeat an already granted
  approval request. Do not execute those actions merely to populate this runbook.

## Procedure

### 1. Review the changes

Read the content file and route. Use `git log` and scoped `git show`/`git diff` to
trace each candidate claim to its implementation. Compare against existing entries
so previously announced work is not presented as new. Do not use commit subjects
alone as evidence of behavior or production availability.

Select changes that matter to learners: new material, changed behavior, meaningful
fixes, or access changes. Omit internal refactors, provider architecture, secrets,
customer identifiers, and unsupported performance or learning-outcome claims.
Retain relevant educational and hypothetical-example boundaries.

### 2. Edit the canonical content

The current entry shape is:

```ts
{
  id: "YYYY-MM-DD-descriptive-slug",
  date: "YYYY-MM-DD",
  dateLabel: "Month D, YYYY",
  title: "Concrete learner-facing improvement",
  summary: "What changed and why it helps the learner.",
  changes: [
    { title: "Specific change", description: "Observable behavior and limits." },
  ],
}
```

- Prepend entries in newest-first order, using the agreed release date. Keep
  `dateLabel` consistent with `date`; do not parse dates through a timezone that
  shifts the displayed calendar day.
- Use a unique URL-safe ID. Existing IDs are public fragment links and must remain
  stable, including when correcting copy. Make change titles unique within an
  entry because the renderer uses them as React keys.
- Keep titles concrete, summaries short, and bullets focused on user-visible
  behavior. Group related work; do not dump the Git history into the page.
- Correct inaccurate history in place without silently erasing a material behavior
  change. Use a new dated correction when readers need to understand a reversal.
- The page currently declares English content. The footer label is translated in
  [messages.ts](../../apps/web/src/i18n/messages.ts); routine content changes do not
  require a new translation system or changes to that label.
- Preserve the footer link, route metadata, and sitemap registration. Their owners
  are [footer.tsx](../../apps/web/src/components/footer.tsx) and
  [seo/pages.ts](../../apps/web/src/seo/pages.ts). The current renderer uses a shared
  curriculum link for each entry; do not invent unsupported per-entry fields.

### 3. Validate the result

For content updates, run these commands from the repository root:

```sh
pnpm exec biome check apps/web/src/content/changelog.ts
pnpm --filter web check-types
pnpm --filter web test src/seo/pages.test.ts
git diff --check
```

Include any other edited source files in the formatting check. Manually verify
unique IDs, valid dates, newest-first ordering, matching date labels, nonempty
copy, and unchanged historical IDs. Broaden tests only if code behavior changed.
If a check fails outside the scope, identify the file and failure; do not repair
or commit another agent's work or report a clean check.

Reuse an appropriate running local server, or start `pnpm --filter web dev` and
use the URL it prints (currently port 8250). Use the available browser skill to:

1. Open `/changelog` and confirm the new and prior entries render without an error
   overlay or browser runtime errors.
2. Inspect desktop and narrow mobile layouts, including the boundary between
   consecutive entries, readable wrapping, and absence of horizontal overflow.
3. Follow the footer link, the new dated permalink, a prior permalink when present,
   and the curriculum link. Wait for destination content, not just the URL change.
4. Check the document title and canonical URL. If metadata or routing changed,
   verify `/sitemap.xml` still includes the public changelog URL.
5. Record the actual application interactions as a GIF, as required by AGENTS.md.
   Save evidence outside tracked source, inspect the capture, and include an
   absolute file link and the captured environment in the final report. Do not
   substitute a mockup or claim local footage proves production behavior.

If browser access or recording fails, state the missing verification and leave
one actionable handoff item with the blocker. Do not claim full verification.
Stop only the dev server or browser task space created by this run.

### 4. Maintain, commit, and report

Perform the self-maintenance review below, then re-read the diff and verify all
runbook links resolve. Stage explicit owned paths only, inspect
`git diff --cached`, and commit the validated update under the repository's Git
workflow. Keep unrelated changes out of the commit; do not push without authority.

Report the entry/date, changed paths, checks and any limitations, GIF evidence and
environment, commit hash, deployment status, runbook maintenance decision, and
remaining handoff items. A documentation-only pass reports path/diff checks and
explicitly states that no changelog update or production verification was run.

## Runbook Self-Maintenance

At the end of each run, use the runbook-maintainer skill and its greenfield review
when available. Compare the procedure with the ideal next execution and:

1. Promote observed, reusable lessons into prerequisites, procedure, or validation:
   changed file owners, entry schema, commands, verification gaps, or repeated
   ambiguity. Keep one canonical content source and one canonical runbook.
2. Keep transient blockers only in `Agent Handoff`. Prune resolved or obsolete
   items first; retain at most 3–7 actionable items, each with a next action and
   evidence or blocker. If none remain, say so without empty subsections.
3. Update the handoff date when its state changes. Do not accumulate completed
   todos, raw logs, release history, or speculative improvements in this runbook.
4. Update the index when a runbook is added, moved, removed, or replaced. Verify
   referenced paths and run `git diff --check` before committing documentation.
5. If no durable rule changed, report `Runbook maintenance: no change`. Do not
   rewrite the procedure simply because a new changelog entry was added.
