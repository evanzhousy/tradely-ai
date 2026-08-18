import "@tanstack/react-start/server-only";

const lessonContent: Record<string, string> = {
	"audited-boundary": `## Begin with a research contract

A useful options workflow begins before the first ranked row. Name one question about one session, one source lens, and one decision. A question such as “Where did same-session call pressure concentrate inside this eligible universe?” can be tested. “What will rally next?” cannot.

Declare the symbol universe, session window, freshness requirement, contract scope, and invalidation rule. Those fields stop the research target from drifting after an interesting candidate appears.

### Open a controlled packet

Assign an owner and keep four states separate:

- **Observed:** directly present in the selected source.
- **Inferred:** a bounded interpretation of those observations.
- **Contradicted:** evidence that weakens the interpretation.
- **Unknown:** information the current sources cannot establish.

New evidence may test the question. It should not silently rewrite the boundary or prior record.`,
	"symbol-universe": `## The denominator comes before the ranking

Rank can only compare the rows admitted to its universe. Define that universe first: index constituents, a liquid equity set, a watchlist, or another canonical scope. Then choose the session and verify that each candidate meets the same freshness rule.

Eligibility rules can include minimum liquidity, valid symbol identity, required fields, and comparable session coverage. A stale or incomplete row should not compete with a fresh row merely because both can be displayed.

### Compare like with like

Record the universe, exclusions, date, and important denominators. If any of those change, you have started a different comparison. Rank should concentrate attention inside a declared scope—not decide the scope after seeing a result.`,
	"rank-symbols": `## Rank is an attention queue

Rank Symbols helps answer where activity is concentrating relative to a defined universe. It does not answer whether the underlying is a trade, whether direction will continue, or whether the most extreme row is correctly interpreted.

Read the fields behind a row: source session, direction, magnitude, denominator, coverage, and any missing values. Relative strength inside the ranking is not the same as absolute market significance.

### Promote a candidate, not a conclusion

Before opening the symbol drawer, write why the candidate deserves inspection and what could invert that priority. The handoff should preserve the original question, selected session, and source lens. A ranked row earns the next check; it does not skip it.`,
	"symbol-drawer": `## Check the as-of line first

Open one symbol drawer and freeze the identity of the underlying, session, and lens you intended to inspect. Before interpreting a chart or metric, locate its as-of date and coverage. Flow, open interest, volatility, and modeled positioning may each describe a different clock.

Audit the fields required by your research contract. If the source is stale, a denominator is missing, or the lens no longer matches the question, stop and record that limitation rather than filling the gap with narrative.

### Separate observed from unknown

The drawer can show what the selected data says about the underlying. It cannot reveal a participant's complete portfolio or guarantee a future price path. Carry the supported observations forward and keep unresolved claims open.`,
	"rank-contracts": `## Narrow in two stages

Symbol ranking identifies an underlying worth inspecting. Rank Contracts narrows that same question to individual expiries and strikes. Do not change the universe, session, or evidence lens simply because a contract looks more dramatic.

Read expiry and moneyness together, then inspect the contract neighborhood. Compare nearby strikes, surrounding expirations, turnover, repetition, and the metric that produced the rank. A contract is meaningful only inside that local structure.

### Keep comparison scope fixed

Compare contracts like with like. Different expiry horizons or denominators may be valid, but they answer different questions. The output of this lesson is one contract to validate in the tape, plus a written reason it earned that validation.`,
	"validate-option-print": `## Start with one observed execution

Read the contract identity and the print's location relative to bid and ask. Ask-side execution supports an aggressive-buyer inference; bid-side execution supports an aggressive-seller inference; mid-market execution preserves more uncertainty.

Keep premium and size separate. Premium measures dollars exchanged after price, contracts, and the one-hundred multiplier are combined. It does not directly measure contract count or conviction.

### Return to context

Check moneyness, expiry, open interest, surrounding prints, repetition, and the available quote context. Repetition can strengthen an interpretation without proving accumulation. A later open-interest snapshot may add evidence without identifying the original participant.

Finish with three lines: the execution facts, what remains unknown, and the next observation that could update the hypothesis.`,
	"session-flow-vs-structure": `## Keep two ledgers

Session flow is a ledger of executions inside the selected trading session. Open interest is a reported snapshot of outstanding contracts after clearing. Delta-OI compares reported snapshots. GEX is modeled structural context for a selected date and expiry scope.

All four can be correct while describing different horizons. The common error is placing them on one screen and treating them as simultaneous measures of the same thing.

### Write the freshness line

For every comparison, record source, as-of date, update cadence, and scope. Today's volume cannot be treated as today's confirmed position change. A prior-close structural model cannot be described as live dealer behavior. Preserve the clocks before combining the evidence.`,
	"dex-dei-gex": `## Three lenses, three questions

DEX describes signed directional exposure from the selected session-flow lens. DEI describes magnitude relative to an effective denominator. GEX describes modeled gamma structure for a selected date and expiry scope.

Direction, normalized magnitude, and modeled structure are related, but they are not interchangeable. Before comparison, align date, universe, denominator, and expiry horizon.

### Disagreement is evidence

The lenses do not need to agree. Strong signed flow can appear against structural context that points elsewhere, or normalized magnitude can be modest even when raw dollars look large. Record what each lens supports, what it cannot answer, and which next check would resolve the most important gap.`,
	"cookbook-research-packet": `## Turn the question into a rerunnable packet

A Cookbook should preserve a bounded question, declared inputs, versioned recipe fields, and visible ownership. The goal is not a static answer; it is a workflow another reviewer can inspect and rerun without changing the question midstream.

Attach the evidence inputs used by each block. Separate fixed parameters from replay parameters such as session date. Record exclusions, missingness, and the reason a block is present.

### Leave a challenge path

The packet should end with observed results, contradicted evidence, unknowns, and the next check. A reviewer must be able to rerun the recipe, inspect the same sources, or lower the claim when the evidence is weaker than expected.`,
	"market-recap": `## Publish from a completed packet

A Market Recap should begin from a completed research packet with preserved lineage. Select evidence because it answers the question—not because it produces the most dramatic chart.

Every chart needs a visible date, axis, source, denominator, and scope. Write the headline at the same altitude as the evidence. Descriptive evidence supports a descriptive claim; it does not become a forecast through stronger wording.

### Keep caveats beside the number

DEX, DEI, and GEX may appear in one recap, but their lenses and horizons remain separate. Place freshness limits, missing values, and counter-evidence beside the claim they qualify. The reader should not need a footnote hunt to understand the boundary.`,
	"audit-market-recap": `## Freeze the audit contract

Audit the recap against the question and packet that produced it. Check freshness before typography or polish. Trace each headline, number, and chart back to an inspectable input and confirm that the transformation preserved its meaning.

Review chart axes, date, denominator, source, and missingness—not only whether the chart looks plausible. A visually clean chart can still answer the wrong question or hide an incomparable horizon.

### Sign off with a boundary

Run the documented challenge path. If the evidence fails, rerun the packet or lower the claim; do not repair the narrative around it. Final signoff should state what is supported, what remains unresolved, who reviewed it, and what new evidence would trigger another review.`,
};

export function getLessonBody(slug: string): string | undefined {
	return lessonContent[slug];
}
