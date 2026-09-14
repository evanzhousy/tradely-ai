/** Newest first. Add a dated entry here when a user-facing update is ready. */
export const changelog = [
	{
		id: "2026-09-14-foundation-learning-evidence",
		date: "2026-09-14",
		dateLabel: "September 14, 2026 · Unreleased",
		title: "Clearer foundations and more meaningful progress",
		summary:
			"The first four lessons introduce their purpose and key terms, then test the concept in different situations.",
		changes: [
			{
				title: "See what you studied and what you practiced",
				description:
					"Personal study marks and independent exercise results now appear separately. Hints, written work needing review and earlier-version results keep their own labels.",
			},
			{
				title: "Apply the idea to a different case",
				description:
					"Foundation cases now contrast contract identity, missing terms, closing and assignment, costs and payoff, and physical and cash settlement. Previous attempts retain their original grading rules.",
			},
		],
	},
	{
		id: "2026-09-14-tradingflow-labs",
		date: "2026-09-14",
		dateLabel: "September 14, 2026",
		title: "Practice with guided TradingFlow Recipes",
		summary:
			"Three guided labs connect free lessons to unusual activity, gamma structure and session recaps in TradingFlow.",
		changes: [
			{
				title: "Follow a complete research task",
				description:
					"Review a free worked example, open the matching Recipe in a new tab, and use the lesson’s steps to inspect its evidence. TradingFlow access is required to run reports.",
			},
			{
				title: "Choose when to create an account",
				description:
					"Go straight to the partner platform, or save your Tradely exercise to a free account. Lesson progress remains separate from Recipe execution.",
			},
		],
	},
	{
		id: "2026-09-14-save-guest-learning",
		date: "2026-09-14",
		dateLabel: "September 14, 2026",
		title: "Keep your guest practice when you sign in",
		summary:
			"Save a result, your place, or a research exercise to a free account without starting over.",
		changes: [
			{
				title: "Save after trying a lesson",
				description:
					"A contextual save action keeps your pending exercise in the same tab while you sign in. Cancelling sign-in restores that pending work.",
			},
			{
				title: "Preserve existing work",
				description:
					"Saving checks the case version and keeps existing account attempts intact. Retrying an interrupted save does not create duplicate results.",
			},
		],
	},
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
