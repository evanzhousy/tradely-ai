# S3E16 storyboard

1. **01 · Boundary** — Open only eligible rows — Limit the cohort to future rows that match the retained recipe version, scope, freshness line, and required fields. — visual: `s3e16-boundary`
2. **02 · Intake** — Validate each row — Check identity, session, freshness, sequence, and source before a row can enter the analyst read. — visual: `s3e16-intake`
3. **03 · Recipe** — Apply the same method — Use the retained packet and resolution vocabulary without editing the rule because one row feels inconvenient. — visual: `s3e16-recipe`
4. **04 · Logging** — Keep gaps visible — Record missing fields, stale context, unresolved checks, and invalidations instead of filling them with confidence. — visual: `s3e16-log`
5. **05 · Lineage** — Keep cohorts separate — Show prior and current rows side by side; a new repair changes future scope, not the historical cohort. — visual: `s3e16-compare`
6. **06 · Review** — Challenge the sample — Run a blind review, assign the packet owner, and keep the resolution history available for another analyst. — visual: `s3e16-review`
7. **07 · Movement** — Describe process change — Compare reproducibility, missingness, and repair latency as descriptive movement—not as a score or directional claim. — visual: `s3e16-decision`
8. **08 · Practice** — Close the cohort run — Next: S3E17 · compare repair cohorts without changing the rule midstream and keep each boundary visible. — visual: `s3e16-outro`
