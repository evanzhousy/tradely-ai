# S2E04 narration outline

Build a Replay Cohort

## 1. 01 · Cohort

**One replay is not a sample**

A cohort keeps repeated observations together without pretending the rows are independent forecasts.

## 2. 02 · Version

**Keep the recipe version fixed**

Rows from recipe v1 stay together; a method change opens v2 instead of silently blending history.

## 3. 03 · Rows

**Keep every eligible session**

A, B, and C preserve the same contract, filters, and session fields across 2026-07-24 → 07-26.

## 4. 04 · Coverage

**Describe the sample boundary**

List selected dates, missing rows, session coverage, as-of lines, and the source lens before comparing outcomes.

## 5. 05 · Checks

**Apply the same gates to every row**

Neighboring leg, OI persistence, quote context, and follow-through stay consistent across the cohort.

## 6. 06 · Resolution

**Describe the cohort without a scorecard**

Retained, downgraded, and unresolved rows are descriptive states—not probabilities or performance claims.

## 7. 07 · Outlier

**Investigate the row that changed**

Do not delete a drifted row; check contract identity, freshness, quote context, and recipe version first.

## 8. 08 · Practice

**Make the cohort challengeable**

Next: S2E05 · write a cohort report another analyst can inspect and challenge.

## Practice

S2E05 · Write a cohort report another analyst can challenge.
