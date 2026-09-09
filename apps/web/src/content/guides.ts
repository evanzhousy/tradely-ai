/** Deliberately public material. Never import paid teaching units or scenarios here. */
export type GuideSlug =
	| "gamma-exposure"
	| "open-interest-vs-volume"
	| "iv-crush";
export type Guide = {
	slug: GuideSlug;
	title: string;
	description: string;
	updated: string;
	minutes: number;
	sections: { id: string; title: string; body: string }[];
	sources: { title: string; href: string }[];
	lessonIds: string[];
};

export const guides: Guide[] = [
	{
		slug: "gamma-exposure",
		title: "Gamma Exposure (GEX), explained with examples",
		description:
			"Understand net and gross gamma exposure, calculate a worked example, and see how missing data and position assumptions change a GEX chart.",
		updated: "2026-09-09",
		minutes: 7,
		lessonIds: ["gamma-exposure", "gamma-regimes"],
		sections: [
			{
				id: "meaning",
				title: "What does gamma exposure measure?",
				body: "Gamma describes how an option’s delta changes as its underlying price changes. A gamma exposure estimate aggregates those sensitivities over a specified set of positions or modeled positions. Before reading a chart, identify its units, contract coverage, snapshot date and position-sign assumptions.\n\nOpen interest counts outstanding contracts; it does not identify who holds the long or short side. A chart that assigns signs by option type is making a modeling choice. Its net value is not a direct observation of dealer inventory, future trades or the next market move.",
			},
			{
				id: "calculation",
				title: "A GEX calculation with explicit units",
				body: "In one commonly used scaling, a row’s dollar delta exposure per 1% underlying move is **gamma × contracts × multiplier × spot² × 0.01 × assumed position sign**. Check your provider’s definition before comparing numbers.\n\nOur hypothetical row has gamma 0.02 per $1, 10 contracts, multiplier 100, spot $100 and an assumed positive sign. Its contribution is 0.02 × 10 × 100 × 100² × 0.01 = **$2,000 of delta exposure per 1% move**. That is a sensitivity estimate, not a $2,000 profit prediction. Changing the assumed position sign reverses this contribution.",
			},
			{
				id: "net-gross",
				title: "Net GEX can hide offsetting exposure",
				body: "Consider three supplied synthetic contributions: **+2,000, −1,500 and +500**, all in the same units. Net GEX is +1,000. Gross magnitude is 2,000 + 1,500 + 500 = **4,000**, not the absolute net of 1,000.\n\nIf the last contribution is missing, the known net subtotal is +500. The complete net and gross totals are unknown. A missing observation is not an observed zero. Likewise, a filtered expiry slice is a subtotal rather than the complete chain. Try these distinctions in the example below.",
			},
			{
				id: "interpretation",
				title: "How to read a gamma exposure chart",
				body: "Read the snapshot and assumptions first. Then compare the signed total, gross magnitude and location of contributions by strike and expiry. A positive net can coexist with a negative local region.\n\nFor a specified delta-neutral hedging model, a long-gamma position has a different local hedge response from a short-gamma position. Translating that relationship into market impact requires additional evidence about actual positions, hedge choices and liquidity. A prominent level is a research question to investigate, not a guaranteed entry or support line.\n\n**Before comparing two providers:** match units, underlying, expiry coverage, source dates and sign conventions. If those differ, a disagreement in totals may be a disagreement in definition.",
			},
		],
		sources: [
			{
				title: "OIC: Gamma — the underlying sensitivity",
				href: "https://www.optionseducation.org/advancedconcepts/gamma",
			},
			{
				title: "OIC: Open interest — outstanding contracts",
				href: "https://www.optionseducation.org/news/open-interest-why-it-matters",
			},
		],
	},
	{
		slug: "open-interest-vs-volume",
		title: "Open interest vs volume: follow two different ledgers",
		description:
			"Learn why options volume and open interest differ. Follow opening, closing and transferred positions through an interactive two-ledger example.",
		updated: "2026-09-09",
		minutes: 6,
		lessonIds: ["session-flow-vs-structure", "option-strategies"],
		sections: [
			{
				id: "difference",
				title: "Volume records activity; open interest records positions",
				body: "Options volume counts contracts traded during a stated interval. Open interest (OI) counts outstanding contracts at a report’s cutoff. Count a contract once, not once for the buyer and again for the seller.\n\nA tape can update during the session while displayed OI still refers to a prior cleared report. Comparing today’s volume with that OI does not reveal today’s final outstanding positions. Always retain the dates and the contract identity.",
			},
			{
				id: "opening-closing",
				title: "What changes open interest?",
				body: "In this simplified trade-only ledger, both sides opening a new 10-contract position adds 10 to OI and 10 to volume. Both sides closing 10 contracts subtracts 10 from OI but still adds 10 to volume. One side opening while the other closes transfers an existing position: volume rises by 10 and OI is unchanged.\n\nThe ledger assumes opening/closing designations are known. A normal trade print generally does not provide all that information. Exercise, expiry, clearing adjustments and other lifecycle events can also change actual reported OI.",
			},
			{
				id: "worked-example",
				title: "A worked example: 190 volume, only 40 additional contracts",
				body: "Start with **100 outstanding contracts** in one hypothetical series. Both sides open 80, both sides close 40, then 70 contracts transfer between an opening and a closing participant.\n\nSession volume is 80 + 40 + 70 = **190**. Modeled ending OI is 100 + 80 − 40 + 0 = **140**. Volume exceeds the starting OI, yet the net increase in outstanding contracts is only 40. The same contract exposure can change hands repeatedly.\n\nThis example supplies the position designations so that the arithmetic can be checked. You cannot reconstruct those designations from the volume total alone.",
			},
			{
				id: "research",
				title: "How to use the distinction in research",
				body: "Compare reports for the same underlying, option type, strike, expiry and deliverable. Record the earlier and later cutoffs; if either report is absent, preserve the missing value. A difference across different series or reversed report dates is not a valid OI change.\n\nHigh volume relative to prior OI can identify activity worth inspecting. It does not independently establish new institutional buying, bullish intent or a profitable trade. Inspect executions and broader strategy context before forming that interpretation.",
			},
		],
		sources: [
			{
				title: "OIC: Open Interest — Why It Matters",
				href: "https://www.optionseducation.org/news/open-interest-why-it-matters",
			},
			{
				title: "OIC: General information — volume and open interest FAQ",
				href: "https://www.optionseducation.org/referencelibrary/faq/general-information",
			},
		],
	},
	{
		slug: "iv-crush",
		title: "IV crush: why a rising stock can still leave a call worth less",
		description:
			"Understand implied volatility crush with hypothetical before-and-after option prices. Separate the stock move, time and volatility from realized profit.",
		updated: "2026-09-09",
		minutes: 6,
		lessonIds: ["implied-realized-volatility", "theta-vega-rho"],
		sections: [
			{
				id: "meaning",
				title: "What is IV crush?",
				body: "IV crush describes a sharp reduction in implied volatility: the volatility input consistent with an option’s price under a chosen model. This often becomes a concern around a scheduled event such as earnings. Event uncertainty can be reflected in the pre-event option price; that uncertainty can change once the news is known.\n\nA call’s value depends on more than whether the stock went up. Time remaining, implied volatility, strike and other pricing inputs matter. A favorable underlying move may be outweighed by changes in the other inputs.",
			},
			{
				id: "worked-example",
				title: "A hypothetical before-and-after quote",
				body: "Assume one long call with strike **$105**, multiplier **100**, bought for **$3 per share** while the stock was at $100. Its cost is $300 before fees.\n\nAfter the event, suppose the stock is $103 and the option can be marked at **$1 per share**. The marked change is (1 − 3) × 100 = **−$200**, despite the stock’s rise. If instead a sufficiently large move leaves a $6 quote, the marked change is +$300. Neither outcome follows from the stock’s direction alone.\n\nThese are authored quote scenarios, not model-generated prices or actual fills. They illustrate accounting, not an isolated causal estimate of IV. An actual exit depends on executable quotes, spreads and fees.",
			},
			{
				id: "vega",
				title: "Vega helps explain sensitivity, with limits",
				body: "Vega describes local sensitivity to implied volatility. Check the convention: a move from 60% IV to 40% is **−20 percentage points**, not −20% relative. A local vega approximation should not be stretched across a large volatility change and presented as an exact revaluation.\n\nTo isolate IV’s contribution, reprice the same contract while holding the other inputs fixed in a suitable model. Our example deliberately reports only the change between supplied quotes; it does not attribute the entire loss to IV.",
			},
			{
				id: "checklist",
				title: "Questions to ask before interpreting an earnings trade",
				body: "Record the contract, premium, time remaining and event timing. Distinguish a mark from an executed fill. Compare multiple underlying-price outcomes rather than assuming a correct directional view guarantees a gain.\n\nFor spreads, inspect both legs and the combined exposure; the behavior of one long call does not automatically describe the position. Short options also retain substantial movement and assignment risks. IV falling does not guarantee that selling options earns a profit. Use these distinctions to evaluate your reasoning before risking capital.",
			},
		],
		sources: [
			{
				title: "OIC: Vega — sensitivity to implied volatility",
				href: "https://www.optionseducation.org/advancedconcepts/vega",
			},
			{
				title: "OIC: Volatility and the Greeks",
				href: "https://www.optionseducation.org/advancedconcepts/volatility-the-greeks",
			},
		],
	},
];

export function getGuide(slug: string): Guide | undefined {
	return guides.find((guide) => guide.slug === slug);
}

export function guidesForLesson(lessonId: string): Guide[] {
	return guides.filter((guide) => guide.lessonIds.includes(lessonId));
}
