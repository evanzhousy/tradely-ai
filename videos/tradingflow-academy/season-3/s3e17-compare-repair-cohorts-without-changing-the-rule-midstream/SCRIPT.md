# S3E17 narration outline

Compare Repair Cohorts Without Changing the Rule Midstream

## 1. 01 · Scope

**Align the cohort boundaries**

Name the recipe version, eligible rows, session window, freshness line, and invalidation before comparing any result.

## 2. 02 · Inputs

**Compare the same fields**

Confirm identity, contract, source, sequence, and required fields are comparable before reading a delta.

## 3. 03 · States

**Map each resolution state**

Keep retained, changed, unresolved, missing, and excluded states distinct instead of forcing agreement.

## 4. 04 · Lineage

**Trace the version change**

Link the repair question to the first future row it changed; never backfill it into the prior cohort.

## 5. 05 · Blind

**Compare independent reads**

Seal the prior resolution, let another analyst rerun the current packet, then reveal both notes side by side.

## 6. 06 · Movement

**Describe the delta**

Report reproducibility, missingness, and repair latency as process movement without turning them into performance.

## 7. 07 · Challenge

**Test the comparison**

Ask what would invalidate the comparison: scope drift, stale context, missing fields, or a blended rule version.

## 8. 08 · Practice

**Open the next decision**

Next: S3E18 · retire or extend a repair with an explicit boundary and keep both cohort histories intact.

## Practice

S3E18 · Retire or extend a repair with an explicit boundary.
