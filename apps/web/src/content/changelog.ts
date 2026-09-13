/** Newest first. Add a dated entry here when a user-facing update is ready. */
export const changelog = [
	{
		id: "2026-09-13-free-learning",
		date: "2026-09-13",
		dateLabel: "September 13, 2026",
		title: "The complete curriculum is free",
		summary:
			"All 36 current lessons and interactive exercises are open without payment or an account.",
		changes: [
			{
				title: "Learn and practice freely",
				description:
					"Work through the full curriculum as a guest, or create a free account to save progress and attempts.",
			},
			{
				title: "Apply what you learn",
				description:
					"Relevant completed exercises link to TradingFlow, which remains a separate service with its own access and pricing.",
			},
			{
				title: "Previous purchases",
				description:
					"New Tradely purchases are retired. Signed-in learners can still manage previous billing and recover purchase records.",
			},
		],
	},
	{
		id: "2026-09-12-interactive-lessons",
		date: "2026-09-12",
		dateLabel: "September 12, 2026",
		title: "More ways to work through options concepts",
		summary:
			"Interactive lesson labs let you change an assumption and see how the example responds, step by step.",
		changes: [
			{
				title: "Explore the Greeks",
				description:
					"Work through delta, gamma, time, volatility and rates with interactive diagrams that connect changing inputs to an option’s behavior.",
			},
			{
				title: "Compare volatility",
				description:
					"Explore implied versus realized volatility and the shape of a volatility surface through visual examples.",
			},
			{
				title: "Practice the research process",
				description:
					"Work through option strategies, source timestamps and cohort audits with guided visual exercises. Examples are educational and hypothetical.",
			},
		],
	},
] as const;
