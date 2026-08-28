# S3E17 storyboard

1. **01 · Scope** — Align the cohort boundaries — Name the recipe version, eligible rows, session window, freshness line, and invalidation before comparing any result. — visual: `s3e17-scope`
2. **02 · Inputs** — Compare the same fields — Confirm identity, contract, source, sequence, and required fields are comparable before reading a delta. — visual: `s3e17-inputs`
3. **03 · States** — Map each resolution state — Keep retained, changed, unresolved, missing, and excluded states distinct instead of forcing agreement. — visual: `s3e17-states`
4. **04 · Lineage** — Trace the version change — Link the repair question to the first future row it changed; never backfill it into the prior cohort. — visual: `s3e17-lineage`
5. **05 · Blind** — Compare independent reads — Seal the prior resolution, let another analyst rerun the current packet, then reveal both notes side by side. — visual: `s3e17-blind`
6. **06 · Movement** — Describe the delta — Report reproducibility, missingness, and repair latency as process movement without turning them into performance. — visual: `s3e17-movement`
7. **07 · Challenge** — Test the comparison — Ask what would invalidate the comparison: scope drift, stale context, missing fields, or a blended rule version. — visual: `s3e17-challenge`
8. **08 · Practice** — Open the next decision — Next: S3E18 · retire or extend a repair with an explicit boundary and keep both cohort histories intact. — visual: `s3e17-outro`
