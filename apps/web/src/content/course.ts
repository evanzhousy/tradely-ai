export type LessonAccess = "preview" | "paid";

export type TradingFlowPractice = {
	title: string;
	goal: string;
	href: string;
	tool:
		| "Home"
		| "Option Trades"
		| "Rank Contracts"
		| "Rank Symbols"
		| "Cookbooks"
		| "Market Recap";
};

export type LessonMedia = {
	video: string;
	poster: string;
	captions: string;
};

export type Lesson = {
	id: string;
	slug: string;
	title: string;
	summary: string;
	category: string;
	minutes: number;
	order: number;
	access: LessonAccess;
	contentVersion: number;
	mediaKey: string;
	poster: string;
	prerequisites: string[];
	practice: TradingFlowPractice;
};

const MEDIA_ROOT = "/media/tradingflow";

export const tradingFlowCourse = {
	id: "tradingflow-foundations",
	slug: "tradingflow-foundations",
	title: "Evidence-Led Options Research",
	description:
		"Build one auditable research path from a bounded market question through Rank, Option Trades, structural context, Cookbooks, and Market Recap.",
	lessons: [
		{
			id: "audited-boundary",
			slug: "audited-boundary",
			title: "Start with an audited boundary",
			summary:
				"Define one question, source, horizon, owner, and invalidation rule before opening a candidate.",
			category: "Method",
			minutes: 12,
			order: 0,
			access: "preview",
			contentVersion: 1,
			mediaKey: "00-audited-boundary",
			poster: `${MEDIA_ROOT}/posters/00-audited-boundary.jpg`,
			prerequisites: [],
			practice: {
				title: "Write one bounded research question",
				goal: "Open TradingFlow Home and choose one session, one source lens, and one decision you want the evidence to inform.",
				href: "https://app.tradingflow.com/app/home?utm_source=tradely&utm_medium=course&utm_campaign=audited-boundary",
				tool: "Home",
			},
		},
		{
			id: "symbol-universe",
			slug: "symbol-universe",
			title: "Choose the correct symbol universe",
			summary:
				"Set eligibility, freshness, and like-for-like comparison rules before asking Rank to concentrate attention.",
			category: "Discovery",
			minutes: 12,
			order: 1,
			access: "preview",
			contentVersion: 1,
			mediaKey: "01-symbol-universe",
			poster: `${MEDIA_ROOT}/posters/01-symbol-universe.jpg`,
			prerequisites: ["audited-boundary"],
			practice: {
				title: "Declare the universe first",
				goal: "Open Rank Symbols, choose a comparable universe and session, then note which stale or ineligible rows should stay out.",
				href: "https://app.tradingflow.com/app/rank/symbols?utm_source=tradely&utm_medium=course&utm_campaign=symbol-universe",
				tool: "Rank Symbols",
			},
		},
		{
			id: "rank-symbols",
			slug: "rank-symbols",
			title: "Use Rank Symbols without turning rank into a signal",
			summary:
				"Read the fields behind a ranked row, test counter-evidence, and promote only a candidate for inspection.",
			category: "Discovery",
			minutes: 12,
			order: 2,
			access: "preview",
			contentVersion: 1,
			mediaKey: "02-rank-symbols",
			poster: `${MEDIA_ROOT}/posters/02-rank-symbols.jpg`,
			prerequisites: ["symbol-universe"],
			practice: {
				title: "Promote one candidate",
				goal: "Choose one ranked symbol, record why it deserves inspection, and write one fact that could reverse that priority.",
				href: "https://app.tradingflow.com/app/rank/symbols?utm_source=tradely&utm_medium=course&utm_campaign=rank-symbols",
				tool: "Rank Symbols",
			},
		},
		{
			id: "symbol-drawer",
			slug: "symbol-drawer",
			title: "Open a symbol drawer with freshness checks",
			summary:
				"Freeze symbol identity, name the active lens, audit required fields, and stop when context is stale or missing.",
			category: "Inspection",
			minutes: 12,
			order: 3,
			access: "paid",
			contentVersion: 1,
			mediaKey: "03-symbol-drawer",
			poster: `${MEDIA_ROOT}/posters/03-symbol-drawer.jpg`,
			prerequisites: ["rank-symbols"],
			practice: {
				title: "Run the drawer freshness gate",
				goal: "Open the selected symbol drawer, check every as-of line, and separate what is observed from what is still unknown.",
				href: "https://app.tradingflow.com/app/rank/symbols?utm_source=tradely&utm_medium=course&utm_campaign=symbol-drawer",
				tool: "Rank Symbols",
			},
		},
		{
			id: "rank-contracts",
			slug: "rank-contracts",
			title: "Rank contracts without redefining the universe",
			summary:
				"Move from symbol to contract while keeping expiry, moneyness, neighborhood, and comparison scope fixed.",
			category: "Inspection",
			minutes: 12,
			order: 4,
			access: "paid",
			contentVersion: 1,
			mediaKey: "04-rank-contracts",
			poster: `${MEDIA_ROOT}/posters/04-rank-contracts.jpg`,
			prerequisites: ["symbol-drawer"],
			practice: {
				title: "Narrow without changing the question",
				goal: "Select one ranked contract and explain how expiry, strike, moneyness, and neighboring contracts affect its priority.",
				href: "https://app.tradingflow.com/app/rank/contracts?utm_source=tradely&utm_medium=course&utm_campaign=rank-contracts",
				tool: "Rank Contracts",
			},
		},
		{
			id: "validate-option-print",
			slug: "validate-option-print",
			title: "Validate one print in Option Trades",
			summary:
				"Read bid/ask location, premium, size, contract context, repetition, and quote evidence without inventing intent.",
			category: "Validation",
			minutes: 12,
			order: 5,
			access: "paid",
			contentVersion: 1,
			mediaKey: "05-option-trades",
			poster: `${MEDIA_ROOT}/posters/05-option-trades.jpg`,
			prerequisites: ["rank-contracts"],
			practice: {
				title: "Write fact, unknown, next check",
				goal: "Open one historical print, record the execution facts, leave unresolved intent open, and name the next check.",
				href: "https://app.tradingflow.com/app/option-trades/historical?utm_source=tradely&utm_medium=course&utm_campaign=validate-print",
				tool: "Option Trades",
			},
		},
		{
			id: "session-flow-vs-structure",
			slug: "session-flow-vs-structure",
			title: "Separate session flow from standing structure",
			summary:
				"Keep today's tape, reported open interest, delta-OI, and modeled GEX on their own clocks.",
			category: "Structure",
			minutes: 12,
			order: 6,
			access: "paid",
			contentVersion: 1,
			mediaKey: "06-session-flow-structure",
			poster: `${MEDIA_ROOT}/posters/06-session-flow-structure.jpg`,
			prerequisites: ["validate-option-print"],
			practice: {
				title: "Write the freshness line",
				goal: "Compare the selected session's prints with displayed OI and structural context, naming each source date and horizon.",
				href: "https://app.tradingflow.com/app/rank/symbols?utm_source=tradely&utm_medium=course&utm_campaign=flow-vs-structure",
				tool: "Rank Symbols",
			},
		},
		{
			id: "dex-dei-gex",
			slug: "dex-dei-gex",
			title: "Compare DEX, DEI, and GEX without collapsing horizons",
			summary:
				"Keep signed flow, normalized magnitude, and modeled structure distinct—even when the lenses disagree.",
			category: "Structure",
			minutes: 12,
			order: 7,
			access: "paid",
			contentVersion: 1,
			mediaKey: "07-dex-dei-gex",
			poster: `${MEDIA_ROOT}/posters/07-dex-dei-gex.jpg`,
			prerequisites: ["session-flow-vs-structure"],
			practice: {
				title: "Let the lenses disagree",
				goal: "For one symbol, write what DEX, DEI, and GEX each support, what each cannot answer, and where their scopes differ.",
				href: "https://app.tradingflow.com/app/rank/symbols?utm_source=tradely&utm_medium=course&utm_campaign=dex-dei-gex",
				tool: "Rank Symbols",
			},
		},
		{
			id: "cookbook-research-packet",
			slug: "cookbook-research-packet",
			title: "Build a repeatable research packet in Cookbooks",
			summary:
				"Version the question, attach inspectable inputs, assign ownership, record missingness, and preserve a challenge path.",
			category: "Research output",
			minutes: 12,
			order: 8,
			access: "paid",
			contentVersion: 1,
			mediaKey: "08-cookbooks-packet",
			poster: `${MEDIA_ROOT}/posters/08-cookbooks-packet.jpg`,
			prerequisites: ["dex-dei-gex"],
			practice: {
				title: "Run one bounded Cookbook",
				goal: "Open an official Cookbook, keep its question fixed, and record the result, exclusions, unknowns, and next check.",
				href: "https://app.tradingflow.com/app/cookbooks?utm_source=tradely&utm_medium=course&utm_campaign=research-packet",
				tool: "Cookbooks",
			},
		},
		{
			id: "market-recap",
			slug: "market-recap",
			title: "Turn a completed packet into a Market Recap",
			summary:
				"Choose evidence with lineage, use charts that answer the question, and keep caveats beside every claim.",
			category: "Research output",
			minutes: 12,
			order: 9,
			access: "paid",
			contentVersion: 1,
			mediaKey: "09-market-recap",
			poster: `${MEDIA_ROOT}/posters/09-market-recap.jpg`,
			prerequisites: ["cookbook-research-packet"],
			practice: {
				title: "Review the Daily Market Recap",
				goal: "Trace one recap headline back to its chart, date, denominator, source, and visible caveats.",
				href: "https://app.tradingflow.com/app/cookbooks/market-recap?utm_source=tradely&utm_medium=course&utm_campaign=market-recap",
				tool: "Market Recap",
			},
		},
		{
			id: "audit-market-recap",
			slug: "audit-market-recap",
			title: "Audit a Market Recap before publishing",
			summary:
				"Freeze the audit contract, trace claim lineage, keep gaps visible, run the challenge path, and sign off with a boundary.",
			category: "Research output",
			minutes: 12,
			order: 10,
			access: "paid",
			contentVersion: 1,
			mediaKey: "10-recap-audit",
			poster: `${MEDIA_ROOT}/posters/10-recap-audit.jpg`,
			prerequisites: ["market-recap"],
			practice: {
				title: "Run the publish audit",
				goal: "Audit one recap for freshness, claim-to-packet lineage, chart context, missingness, challengeability, and bounded signoff.",
				href: "https://app.tradingflow.com/app/cookbooks/market-recap?utm_source=tradely&utm_medium=course&utm_campaign=recap-audit",
				tool: "Market Recap",
			},
		},
	] satisfies Lesson[],
} as const;

export type Course = typeof tradingFlowCourse;

export function getLesson(slug: string): Lesson | undefined {
	return tradingFlowCourse.lessons.find((lesson) => lesson.slug === slug);
}

export function getLessonById(id: string): Lesson | undefined {
	return tradingFlowCourse.lessons.find((lesson) => lesson.id === id);
}

export function getNextLesson(slug: string): Lesson | undefined {
	const lesson = getLesson(slug);
	return lesson
		? tradingFlowCourse.lessons.find((item) => item.order === lesson.order + 1)
		: undefined;
}

export function getPreviousLesson(slug: string): Lesson | undefined {
	const lesson = getLesson(slug);
	return lesson
		? tradingFlowCourse.lessons.find((item) => item.order === lesson.order - 1)
		: undefined;
}
