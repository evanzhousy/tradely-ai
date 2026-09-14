/** Newest first. Add a dated entry here when a user-facing update is ready. */
export const changelog = [
	{
		id: "visual-lessons-unreleased",
		date: "2026-09-15",
		dateLabel: "Unreleased",
		title: "Learn through visual explanations",
		summary:
			"All 36 lessons put animated diagrams and worked examples first, with free navigation between scenes and lessons.",
		changes: [
			{
				title: "Watch, pause and explore",
				description:
					"Follow 110 illustrated scenes with English and Chinese captions. Replay the explanation or change the controls to explore the relationship. Reduced-motion preferences use a manual step-by-step view.",
			},
			{
				title: "Continue without answering questions",
				description:
					"Lessons open directly into visual teaching. Study marks are separate from earlier exercise records, which remain available in a read-only history view.",
			},
			{
				title: "Pick up the thread",
				description:
					"Your last scene is remembered on this device. Sign in to save study marks across devices; notes, formulas and sources remain available when you want more detail.",
			},
		],
	},
	{
		id: "2026-09-14-foundation-learning-evidence",
		date: "2026-09-14",
		dateLabel: "September 14, 2026",
		title: "Clearer foundations and more meaningful progress",
		summary:
			"The first four lessons introduce their purpose and key terms, then test the concept in different situations.",
		changes: [
			{
				title: "Keep the privacy choice compact",
				description:
					"The initial analytics notice gives a short explanation with expandable details, keeping more of the learning page visible. Necessary storage and optional analytics remain separate choices.",
			},
			{
				title: "Know what your result records",
				description:
					"Exercise results explain whether they are guest work or saved to your account. Account results link to the separate study-mark action.",
			},
			{
				title: "Start with a worked example",
				description:
					"Each of the first four lessons opens with a practical question, a learning goal and a worked example. Expand key terms for definitions as you need them.",
			},
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
			{
				title: "Read your progress at a glance",
				description:
					"The course summary gives practice results their own space below study progress, making submitted exercises and independent checks easier to scan.",
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
