/** Deliberately public material. Never import paid teaching units or scenarios here. */
export type GuideSlug =
	| "choose-strike-and-expiration"
	| "how-many-option-contracts"
	| "covered-call-vs-cash-secured-put"
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

/**
 * Beginner guides come first, in the order of their lessons: this order is the order on the home
 * page and /guides.
 * Their figures are literals copied from the matching lesson's model (this file stays free of
 * imports, since it is in the root bundle); each guide's demo computes from that model itself.
 */
export const guides: Guide[] = [
	{
		slug: "choose-strike-and-expiration",
		title: "How to choose a strike price and expiration date for an option",
		description:
			"Compare three strikes and three expiries on one view of a $100 stock: what each call costs, where it breaks even, what time decay takes and what the spread costs.",
		updated: "2026-11-14",
		minutes: 7,
		lessonIds: ["strike-and-expiry", "premium-payoff"],
		sections: [
			{
				id: "view",
				title: "Start from a view: direction, size and time",
				body: "A strike and an expiry are how a trade turns your view into a contract. Before comparing contracts, write the view down: what you expect the stock to do, by how much and by when. This guide follows one view: ALFA, a made-up stock at **$100** on Sep 16, higher within about a month.\n\nEvery call below agrees with that direction. They differ in how far ALFA has to move, how soon, and what each costs if the view is wrong. All figures are for one contract (100 shares) bought at the ask, before fees.",
			},
			{
				id: "strike",
				title: "Three strikes, one expiry",
				body: "Three Oct 18 calls, 32 days from expiry:\n\n- **95 call (in the money):** costs $730, breaks even at $102.30, delta 0.70.\n- **100 call (at the money):** costs $420, breaks even at $104.20, delta 0.52.\n- **105 call (out of the money):** costs $215, breaks even at $107.15, delta 0.33.\n\nSay ALFA ends at **$106** on Oct 18. The view was right, but the results differ: the 95 call makes **+$370** (+51%), the 100 call **+$180** (+43%), and the 105 call ends at **−$115** (−53%) because it needed $107.15. A cheaper strike needs a bigger move. Only from about $110 does the 105 call’s percentage return pass the 95 call’s.\n\nIf ALFA ends unchanged at $100, the 95 call loses $230, since it is still $5 in the money. The 100 and 105 calls lose all they cost.",
			},
			{
				id: "expiry",
				title: "One strike, three expiries",
				body: "Now one strike, the 100 call, at three expiries. Each day’s decay is the course model’s figure for Sep 16:\n\n- **Sep 20, 4 days left:** costs $145 and loses about **$17.20 a day** to time decay.\n- **Oct 18, 32 days left:** costs $420 and loses about $6.50 a day.\n- **Nov 15, 60 days left:** costs $545 and loses about $4.40 a day.\n\nThe shortest call is the cheapest, but it leaves four days for the move to happen. Compare the other two on Oct 18. If ALFA is still at $100, the Oct 18 call expires worthless (−$420), while the Nov 15 call can still be sold, at a modeled bid, for −$190. If ALFA is at $106, the two end close: +$180 and +$185. From about $107 up, the shorter call does at least as well.\n\nMore time costs more up front. It also loses value more slowly each day and leaves room for a move that comes late.",
			},
			{
				id: "liquidity",
				title: "Check the quote before you choose",
				body: "A contract can fit your view and still be expensive to trade. Look at the bid, the ask and the open interest before choosing:\n\n- **Oct 18 105 call:** $2.05 bid, $2.15 ask, 1,200 contracts open. The spread is 10¢, about 5% of the ask.\n- **Dec 20 110 call:** $2.20 bid, $2.65 ask, 3 contracts open. The spread is 45¢, about 17% of the ask.\n\nBuying at the ask and selling at the bid straight away costs the spread. Five Dec 20 110 calls give up **$225** that way before the stock moves at all. A wide spread and little open interest make a contract costlier to get into and out of.\n\n**A checklist, not a rule:** how much time your view needs, the break-even against the move you expect, the decay you pay each day, and the spread. Which strike and expiry fit is yours to decide; the lesson below lets you try each combination.",
			},
		],
		sources: [
			{
				title: "OIC: Options basics",
				href: "https://www.optionseducation.org/optionsoverview/options-basics",
			},
			{
				title: "OIC: Understanding options Greeks",
				href: "https://www.optionseducation.org/advancedconcepts/understanding-options-greeks",
			},
			{
				title: "OIC: Bid and ask",
				href: "https://www.optionseducation.org/news/understanding-the-bid-and-ask-prices-for-options",
			},
			{
				title: "OIC: Open interest — why it matters",
				href: "https://www.optionseducation.org/news/open-interest-why-it-matters",
			},
		],
	},
	{
		slug: "how-many-option-contracts",
		title: "How many option contracts to buy: size from the worst case",
		description:
			"Work out how many contracts fit a loss budget from what one contract can lose. A worked example with a $10,000 account, an example 2% rule and an answer of zero.",
		updated: "2026-11-14",
		minutes: 6,
		lessonIds: ["size-and-exit", "first-spread-trade"],
		sections: [
			{
				id: "worst-case",
				title: "Start from what one contract can lose",
				body: "When you buy an option, the most you can lose is what you paid: the premium per share × 100 shares, plus fees. That worst case is the unit to size with, not the price per share and not how many you can afford.\n\nThen set a loss budget: the most you are willing to lose on this one trade if the worst happens. A common rule of thumb sets it as a small percentage of the account. This guide uses **2% of a $10,000 account, so $200**, as an example to do arithmetic with. It is not a recommendation; your percentage is yours to set.\n\n**Contracts = loss budget ÷ worst case of one contract, rounded down.** Round down, never up: rounding up puts more at risk than the budget.",
			},
			{
				id: "worked-example",
				title: "A worked example: three candidates, one budget",
				body: "ALFA, a made-up stock, is at $100. Here are three ways to bet on a rise, each with the worst case of one contract:\n\n- **Oct 18 100 call at $4.20:** worst case $420. $200 ÷ $420 rounds down to **0**.\n- **Nov 15 110 call at $1.80:** worst case $180. $200 ÷ $180 rounds down to **1**, with $180 at risk.\n- **Oct 18 105/110 call spread at $1.30 net:** worst case $130. $200 ÷ $130 rounds down to **1**, with $130 at risk.\n\n**Zero is an answer.** Under this example rule the $420 call does not fit at all; it fits only once the rule reaches 4.5%. The cheaper call fits, but it is cheaper because it needs a bigger move. Fitting the budget does not make it a better trade.",
			},
			{
				id: "streak",
				title: "Why the percentage matters: ten losses in a row",
				body: "A run of losses can happen to any plan. Suppose ten trades in a row each lose their full budget, with the budget reset each time as a share of what is left:\n\n- **At 2% a trade:** $10,000 becomes **$8,171**. Getting back to $10,000 then takes a gain of about **22%**.\n- **At 20% a trade:** $10,000 becomes **$1,074**. Getting back takes a gain of about **831%**.\n\nLosses and gains are not symmetric: after a loss, it takes a larger percentage gain to get back. A small percentage keeps a run of losses survivable.",
			},
			{
				id: "exits",
				title: "A planned exit is not a cap on the loss",
				body: "Write the exit plan down on the day you buy. One example plan for the $1.80 Nov 15 call: sell at **$3.60**, twice the premium (+$180); sell at **$0.90**, half the premium (−$90); and sell on **Oct 25**, with three weeks left, whatever the price.\n\nThe plan does not cap the loss at −$90. Options do not trade overnight. If ALFA reports earnings after the close and opens at $94 the next morning, with implied volatility lower, the call’s first price can be far below $0.90. In the course’s model it opens at **$0.20**. Sold there, the result is **−$160**, not the planned −$90. Held to expiry out of the money, it loses the whole **$180**.\n\nThat is why the size comes from the worst case, not from the planned exit: $180 a contract is what the budget has to hold.",
			},
		],
		sources: [
			{
				title: "OIC: Getting started with options",
				href: "https://www.optionseducation.org/optionsoverview/getting-started-with-options",
			},
			{
				title: "FINRA: Options",
				href: "https://www.finra.org/investors/investing/investment-products/options",
			},
			{
				title: "Investor.gov: Understanding order types",
				href: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-14",
			},
		],
	},
	{
		slug: "covered-call-vs-cash-secured-put",
		title: "Covered call vs cash-secured put, worked through on one stock",
		description:
			"Compare a covered call and a cash-secured put on one $100 stock: the premium kept, the break-even, the best and worst case, and what assignment does to each.",
		updated: "2026-11-14",
		minutes: 7,
		lessonIds: ["selling-covered-options", "expiration-settlement"],
		sections: [
			{
				id: "obligation",
				title: "What you agree to when you sell an option",
				body: "Selling an option pays you a premium now in exchange for an obligation. Sell a call and you may have to sell 100 shares at its strike. Sell a put and you may have to buy 100 shares at its strike. The premium is yours to keep whatever happens next.\n\nA **covered call** covers that obligation with 100 shares you already own. A **cash-secured put** covers it with the strike × 100 in cash, set aside until the put expires or you buy it back. Covered means the worst outcome is giving up or buying shares you can deliver or pay for. It does not mean the trade cannot lose money.\n\nBrokers grant options approval in levels and decide which level covers covered calls, cash-secured puts, spreads and uncovered writing. The levels and their names differ by broker, so check yours before you sell.",
			},
			{
				id: "covered-call",
				title: "A covered call, worked through",
				body: "The example uses ALFA, a made-up stock at **$100** on Sep 16. You own 100 shares bought at $100 and sell one Oct 18 **105 call** at its $2.05 bid, so you keep **$205**. All figures are for one contract at expiry, before fees.\n\n- **Break-even: $97.95.** That is the $100 you paid for each share, less the $2.05 premium.\n- **Best case: +$705.** At $105 or above, the call is assigned and your shares are sold at $105: +$500 on the shares plus the $205 premium.\n- **The cap: $107.05.** Above it, the shares on their own would have done better. At $115 the shares alone make +$1,500; with the call sold, the result is still +$705.\n- **Worst case: −$9,795**, if ALFA fell to $0. The premium cushions only the first $2.05 a share of a fall.\n\nAt $90 the call expires worthless and you keep both the shares and the premium: −$1,000 on the shares and +$205 kept, so −$795 overall.",
			},
			{
				id: "cash-secured-put",
				title: "A cash-secured put, worked through",
				body: "Now start from cash instead of shares. You set aside **$9,500**, the 95 strike × 100, and sell one Oct 18 **95 put** at its $2.05 bid, so you keep **$205**.\n\n- **At $95 or above**, the put expires worthless. You keep the $205 and the cash is free again.\n- **Below $95**, the put is assigned and you buy 100 shares at $95 with the cash you set aside. With the premium, that is a net **$92.95 a share**, which is also the break-even.\n- **Worst case: −$9,295**, if ALFA fell to $0: $9,500 paid for shares worth nothing, less the $205 kept.\n\nAt $90 you are assigned. Shares bought for $9,500 are worth $9,000, and with the $205 premium the result is −$295. The $9,500 set aside is 95% of a $10,000 account, so that account can secure only one of these puts at a time.",
			},
			{
				id: "compare",
				title: "Covered call vs cash-secured put at three closing prices",
				body: "In this example both options happen to have a $2.05 bid, so each keeps $205. Here is each result for one contract at expiry:\n\n- **ALFA at $90:** the covered call is at −$795 and still owns the shares. The cash-secured put is at −$295 and now owns shares bought at $95.\n- **ALFA at $100:** both are at +$205. Neither is assigned.\n- **ALFA at $110:** the covered call is at +$705, its shares sold at $105. The cash-secured put is at +$205.\n\nThe gap comes from where each trade starts. The covered call already owns shares bought at $100, so it carries the whole fall from $100. The put buys shares only if ALFA ends below $95. Both trade away gains above a point for the premium, and both still take most of the loss if the stock collapses. Whether either fits depends on whether you want to own the stock, and at what price. This guide does not say which to sell.",
			},
			{
				id: "assignment",
				title: "Assignment can come before expiry",
				body: "ALFA’s options, like US equity options generally, are American-style: the holder can exercise on any trading day, so the seller can be assigned on any of them. At expiry, an equity option that is a cent or more in the money is normally exercised automatically unless its holder instructs otherwise.\n\nEarly assignment is most likely when an option is deep in the money with little time value left. Say ALFA is at **$86 on Oct 14**, four days before expiry. Your 95 put is $9 in the money and, in the course’s model, has no time value left, so its holder gains little by waiting. Buying the put back at its modeled $9.20 ask locks in **−$715**. Being assigned that night instead means buying 100 shares at $95 while ALFA is at $86: **−$695** with the premium, before whatever the shares do next.\n\nAssignment risk also rises just before an ex-dividend date for a short call, and just after one for a short put. Either way, a covered seller can meet the assignment: the shares or the cash are already there.",
			},
		],
		sources: [
			{
				title: "OIC: Covered call (buy/write)",
				href: "https://www.optionseducation.org/strategies/all-strategies/covered-call-buy-write",
			},
			{
				title: "OIC: Cash-secured put",
				href: "https://www.optionseducation.org/strategies/all-strategies/cash-secured-put",
			},
			{
				title: "OIC: Options assignment",
				href: "https://www.optionseducation.org/referencelibrary/faq/options-assignment",
			},
			{
				title: "FINRA: Regulatory Notice 21-15 (options account approval)",
				href: "https://www.finra.org/rules-guidance/notices/21-15",
			},
		],
	},
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
