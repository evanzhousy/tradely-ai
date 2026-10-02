/** Newest first. Add a dated entry here when a user-facing update is ready. */
export const changelog = [
	{
		id: "2026-10-01-tradingflow-workflows",
		date: "2026-10-01",
		dateLabel: "October 1, 2026",
		title: "Build your own workflows in TradingFlow",
		summary:
			"A third deeper branch, Workflows in TradingFlow, follows the core path with eight lessons on recipes, TradingFlow AI and your own agents, each paired with a lab in the live product.",
		changes: [
			{
				title: "Run recipes, then read them like an auditor",
				description:
					"Pick an official recipe by the question it answers, check which session a run shows, trace each sentence through the recipe map, and change its inputs without changing the question.",
			},
			{
				title: "Start from a checklist",
				description:
					"Turn a decision into steps a tool can check, and keep your version before Home resets it.",
			},
			{
				title: "Ask TradingFlow AI, then verify",
				description:
					"Sort each sentence of an AI answer into what the report shows, what you can calculate and what no data supports, and count the credits a conversation uses.",
			},
			{
				title: "Build your own Rank column",
				description:
					"Write a formula column on Rank Symbols whose units make sense, and keep a name with only a few trades from leading it.",
			},
			{
				title: "Change a recipe with AI",
				description:
					"Scope an edit so you can review it, undo one that changed more than you asked, and save a private recipe on purpose.",
			},
			{
				title: "Connect your own AI agent",
				description:
					"Connect Claude, Cursor, Codex or OpenClaw to TradingFlow's read-only tools, and prove the connection with a check that can fail.",
			},
			{
				title: "Labs open the right page",
				description:
					"A lesson's TradingFlow lab now opens the page it practices, such as Home, Rank Symbols or the agent connection settings, as well as recipes.",
			},
			{
				title: "Tidier text on phones",
				description:
					"Long statements in diagrams wrap inside their cards, and Chinese text no longer starts a line with a closing punctuation mark.",
			},
		],
	},
	{
		id: "2026-09-28-walkthrough-lessons",
		date: "2026-09-28",
		dateLabel: "September 28, 2026",
		title: "Predict, watch and explore every lesson",
		summary:
			"All 41 lessons are rebuilt as step-by-step walkthroughs set in one shared market, where a fictional stock called ALFA and its options carry from lesson to lesson.",
		changes: [
			{
				title: "Predict first",
				description:
					"Each scene opens with a question about what will happen next. Answer to see how your prediction compares, or skip straight to the explanation.",
			},
			{
				title: "Step through at your pace",
				description:
					"Move forward and back one step at a time, or play the steps at reading pace. Each step's result appears with its diagram, and your last scene is remembered on this device.",
			},
			{
				title: "Try it yourself",
				description:
					"After the steps, change the example and watch the diagram and its results follow.",
			},
			{
				title: "Drag the price",
				description:
					"In lessons with a price chart, drag across the chart in Explore to move ALFA's price, with a mouse or a finger, and watch the results follow as you go. A slider stays available for keyboard use.",
			},
			{
				title: "One market throughout",
				description:
					"Quotes, trades, positions and account figures come from the same stock, option chain and trading days, so a number you meet in one lesson means the same thing in the next.",
			},
			{
				title: "Order books in the same format",
				description:
					"The execution lessons walk an incoming order through the book one step at a time, replacing the separate animated and simplified views.",
			},
			{
				title: "Comfortable on any screen",
				description:
					"Diagrams reflow for phones, and animation turns off when your device asks for reduced motion.",
			},
		],
	},
	{
		id: "2026-09-28-syllabus-revision",
		date: "2026-09-28",
		dateLabel: "September 28, 2026",
		title: "Start from zero, and check yourself",
		summary:
			"Four new lessons for complete beginners lead into a core path with two deeper branches, and every lesson ends with an optional check.",
		changes: [
			{
				title: "Start from zero",
				description:
					"Four short lessons for people new to markets: shares and quotes, what an option is, how an options trade works, and how options lose money.",
			},
			{
				title: "Check yourself",
				description:
					"After each walkthrough, open an optional guided case with feedback, then solve a new case on your own. Your study mark does not depend on it.",
			},
			{
				title: "A core path, then two branches",
				description:
					"Contracts, trades, flow, research and written output come first. Greeks and market structure, and portfolios, follow as branches you can take in either order.",
			},
			{
				title: "New material",
				description:
					"A new lesson on sweeps, blocks and complex orders; the writer's side of an option and four expiry-day risks; and drawdown in the performance lesson.",
			},
			{
				title: "Clearer names",
				description:
					"Plain-language lesson titles and summaries, a corrected risk-reversal sign, and consistent Chinese terms for option writers.",
			},
		],
	},
	{
		id: "2026-09-15-animated-liquidity",
		date: "2026-09-15",
		dateLabel: "September 15, 2026",
		title: "Follow each fill through the book",
		summary:
			"The execution lesson now shows a labelled order moving through displayed liquidity, with matching price highlights and visible remaining quantities.",
		changes: [
			{
				title: "Compare limit and market orders",
				description:
					"Start either worked example directly, pause the explanation or replay it. The animation and order book use the same quantities and fills.",
			},
			{
				title: "Choose a simpler view",
				description:
					"Switch to the simplified diagram whenever you prefer. Reduced-motion preferences and animation loading failures automatically use that view.",
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
