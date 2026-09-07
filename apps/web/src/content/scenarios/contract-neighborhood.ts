import "@tanstack/react-start/server-only";
import type { ContractNeighborhood } from "@/domain/learning/contracts";
import type {
	LearningScenario,
	ScenarioStep,
} from "@/domain/learning/scenario";
import type { LearningCopy } from "@/domain/learning/types";

const copy = (en: string, zh: string): LearningCopy => ({ en, zh });
const choice = (id: string, en: string, zh: string) => ({
	id,
	label: copy(en, zh),
});
const fact = (en: string, zh: string, value: LearningCopy) => ({
	label: copy(en, zh),
	value,
});

function neighborhood(
	id: string,
	independent: boolean,
	alternate = false,
): ContractNeighborhood {
	const strikes = [95, 100, 105, 110];
	const days = [7, 14, 30, 60];
	const volumes = independent
		? [
				[1500, 9000, 3100, 2100],
				[900, 3400, 2600, 1500],
				[700, 1600, 4100, null],
				[1100, alternate ? 5200 : 6000, 1800, 2700],
			]
		: [
				[1700, 7200, 3100, 2800],
				[6000, 3200, null, 3900],
				[900, 2400, 1600, 800],
				[1800, 8400, 2200, 1500],
			];
	const contracts = days.flatMap((expiry, row) =>
		strikes.map((strike, column) => ({
			id: `c-${strike}-${expiry}`,
			strike,
			days: expiry,
			volume: volumes[row][column],
			fresh: independent
				? !(alternate
						? strike === 105 && expiry === 30
						: strike === 100 && expiry === 60)
				: !(strike === 95 && expiry === 14),
		})),
	);
	const minutes = [570, 630, 720, 870, 960];
	const profiles = [
		[0, 0.42, 0.7, 0.9, 1],
		[0, 0.06, 0.18, 0.58, 1],
		[0, 0.12, 0.6, 0.88, 1],
		[0, 0.08, 0.3, 0.82, 1],
	];
	return {
		id,
		symbol: independent ? "BETA" : "ALFA",
		asOf: copy("Synthetic session · 16:00 ET", "模拟时段 · 16:00 ET"),
		scope: independent
			? { minDays: 30, maxDays: 60, minStrike: 100, maxStrike: 110 }
			: { minDays: 14, maxDays: 30, minStrike: 95, maxStrike: 105 },
		contracts,
		replay: {
			durationMs: 14_000,
			openMinute: 570,
			closeMinute: 960,
			frames: minutes.map((minute, phase) => ({
				position: (minute - 570) / 390,
				volumes: Object.fromEntries(
					contracts.map((contract, index) => {
						const profile =
							contract.id === "c-100-14"
								? profiles[1]
								: contract.id === "c-100-30"
									? profiles[2]
									: profiles[index % profiles.length];
						return [
							contract.id,
							contract.volume === null || !contract.fresh
								? contract.volume
								: Math.round(contract.volume * profile[phase]),
						];
					}),
				),
			})),
		},
	};
}

const guidedData = neighborhood("alfa-neighborhood-v2", false);
const scopeFacts = [
	fact(
		"Frozen comparison",
		"固定比较范围",
		copy(
			"ALFA calls · strikes 95–105 · 14–30 days to expiry",
			"ALFA 看涨期权 · 行权价 95–105 · 距到期 14–30 天",
		),
	),
	fact(
		"Metric",
		"指标",
		copy("Contracts traded in the selected session", "选定时段的成交张数"),
	),
];

const first: ScenarioStep = {
	id: "neighborhood-first",
	kind: "prediction",
	title: copy("Explore a contract neighborhood", "探索合约邻域"),
	brief: copy(
		"Your question is already bounded: inspect ALFA calls at strikes 95–105 with 14–30 days to expiry. Explore the columns and select cells in the map. The axes show strike, time to expiry, and observed session volume.",
		"问题范围已确定：检查行权价 95–105、距到期 14–30 天的 ALFA 看涨期权。探索立柱并选择二维图中的单元格。三个坐标轴表示行权价、距到期天数和已观察的时段成交量。",
	),
	facts: scopeFacts,
	neighborhood: guidedData,
	quote: null,
	evidence: [],
	requiredEvidence: [],
	questions: [
		{
			id: "research-boundary",
			prompt: copy(
				"What should stay fixed as you explore?",
				"探索过程中应保持什么不变？",
			),
			choices: [
				choice(
					"largest",
					"Expand the question to whichever contract has the tallest column.",
					"把问题扩大到立柱最高的合约。",
				),
				choice(
					"scope",
					"Keep the declared strike, expiry, session, and freshness rules.",
					"保持已声明的行权价、到期范围、时段和时效规则。",
				),
				choice(
					"direction",
					"Keep a bullish forecast because these are calls.",
					"因为这些是看涨期权，所以保持看涨预测。",
				),
			],
			accepted: ["scope"],
			explanation: copy(
				"A view filter changes what is visible, not the research contract. A dramatic outside-scope row can remain context without changing the comparison.",
				"显示筛选改变可见内容，但不改变研究范围。范围外的突出合约可以作为上下文保留，不能因此重定义比较。",
			),
		},
	],
	hint: copy(
		"Read the frozen comparison before ranking a row. A tall column does not grant eligibility.",
		"排名前先阅读固定比较范围。立柱高并不代表合约符合资格。",
	),
};

const investigation: ScenarioStep = {
	id: "neighborhood-inspect",
	kind: "guided",
	title: copy("Choose a comparable candidate", "选择可比的候选合约"),
	brief: copy(
		"The 60-day 100 call is visually dominant, but it is outside the question. Inspect the records, compare neighboring cells, and choose the highest-volume fresh candidate inside the original boundary.",
		"60 天到期、行权价 100 的看涨合约视觉上最突出，但它不在问题范围内。检查记录并比较邻近单元格，在原始范围内选择成交量最高且数据有效的候选合约。",
	),
	facts: scopeFacts,
	neighborhood: guidedData,
	quote: null,
	evidence: [
		{
			id: "scope-record",
			title: copy("Comparison contract", "比较规则"),
			facts: scopeFacts,
			note: copy(
				"The 60-day expiry and strike 110 are excluded by the original boundary. Viewing them does not admit them to the ranking.",
				"原始范围排除了 60 天到期以及行权价 110 的合约。查看它们不会使其进入有效排名。",
			),
		},
		{
			id: "quality-record",
			title: copy("Freshness and missingness", "时效与缺失"),
			facts: [
				fact(
					"95 call · 14 days",
					"95 看涨 · 14 天",
					copy("6,000 contracts · prior session", "6,000 张 · 上一时段"),
				),
				fact(
					"105 call · 14 days",
					"105 看涨 · 14 天",
					copy("Volume missing", "成交量缺失"),
				),
			],
			note: copy(
				"The 95 call is stale for this session. Missing volume on the 105 call is not zero volume. Neither row can outrank a valid observation by assumption.",
				"95 看涨合约的数据相对于本时段已过时。105 看涨合约的成交量缺失不等于零。不能用假设让它们排在有效观测之前。",
			),
		},
	],
	requiredEvidence: ["scope-record", "quality-record"],
	questions: [
		{
			id: "candidate",
			prompt: copy(
				"At 16:00, which contract earns the next inspection under these rules?",
				"在 16:00，按照这些规则，哪个合约值得进入下一步检查？",
			),
			choices: [
				choice(
					"c-100-60",
					"100 call · 60 days · 8,400 contracts",
					"100 看涨 · 60 天 · 8,400 张",
				),
				choice(
					"c-95-14",
					"95 call · 14 days · 6,000 contracts",
					"95 看涨 · 14 天 · 6,000 张",
				),
				choice(
					"c-100-14",
					"100 call · 14 days · 3,200 contracts",
					"100 看涨 · 14 天 · 3,200 张",
				),
			],
			accepted: ["c-100-14"],
			explanation: copy(
				"The 100 call at 14 days has the highest valid volume inside the boundary. The larger observations are out of scope or stale.",
				"14 天到期、行权价 100 的看涨合约拥有范围内最高的有效成交量。更大的观测值位于范围外，或已经过时。",
			),
		},
		{
			id: "rank-claim",
			prompt: copy(
				"What does this selection support?",
				"这次选择支持什么结论？",
			),
			choices: [
				choice(
					"priority",
					"A priority for tape inspection within this comparison.",
					"在本次比较中优先检查它的成交记录。",
				),
				choice(
					"forecast",
					"A forecast that the underlying will rise.",
					"预测标的将上涨。",
				),
				choice(
					"position",
					"Proof that a new bullish position was opened.",
					"证明有人建立了新的看涨仓位。",
				),
			],
			accepted: ["priority"],
			explanation: copy(
				"Ranking concentrates attention. It does not establish intent, position changes, or future direction.",
				"排名用于集中注意力，不能确定意图、持仓变化或未来方向。",
			),
		},
		{
			id: "missing-volume",
			prompt: copy(
				"How should the missing cell be treated?",
				"应如何处理缺失的单元格？",
			),
			choices: [
				choice("zero", "Treat missing volume as zero.", "将缺失成交量当作零。"),
				choice(
					"estimate",
					"Interpolate a value from neighboring columns.",
					"根据邻近立柱插值估算。",
				),
				choice(
					"unknown",
					"Keep it visibly missing and obtain the source before comparison.",
					"明确保留缺失状态，取得来源数据后再比较。",
				),
			],
			accepted: ["unknown"],
			explanation: copy(
				"A gap is evidence about coverage. A fabricated height would imply a measured observation that does not exist.",
				"缺口说明覆盖范围存在限制。编造高度会让人误以为存在并未获得的测量值。",
			),
		},
	],
	hint: copy(
		"Compare the scope and source clock first, then the metric. The ring and dash indicate missing data.",
		"先比较范围和来源时间，再比较指标。圆环和横线表示数据缺失。",
	),
};

function independent(alternate: boolean): ScenarioStep {
	return {
		id: "neighborhood-independent",
		kind: "independent",
		title: copy("Apply the boundary to a new grid", "将边界规则应用于新网格"),
		brief: copy(
			"This BETA case uses a new boundary: calls at strikes 100–110 with 30–60 days to expiry. Select rows to inspect their quality, then choose the highest valid session-volume candidate. Your earlier selection is not carried into this question.",
			"BETA 案例使用新的边界：行权价 100–110、距到期 30–60 天的看涨期权。选择单元格检查数据质量，再选出有效时段成交量最高的候选合约。之前的选择不会沿用到这个问题。",
		),
		facts: [
			fact(
				"Frozen comparison",
				"固定比较范围",
				copy(
					"BETA calls · strikes 100–110 · 30–60 days to expiry",
					"BETA 看涨期权 · 行权价 100–110 · 距到期 30–60 天",
				),
			),
		],
		neighborhood: neighborhood(
			`beta-neighborhood-${alternate ? "b" : "a"}-v2`,
			true,
			alternate,
		),
		quote: null,
		evidence: [],
		requiredEvidence: [],
		questions: [
			{
				id: "new-candidate",
				prompt: copy(
					"In the 16:00 closing snapshot, which comparable contract has the highest valid volume?",
					"在 16:00 收盘快照中，哪个可比合约的有效成交量最高？",
				),
				choices: [
					choice(
						"c-100-7",
						"100 call · 7 days · 9,000 contracts",
						"100 看涨 · 7 天 · 9,000 张",
					),
					choice(
						"c-100-60",
						alternate
							? "100 call · 60 days · 5,200 contracts"
							: "100 call · 60 days · 6,000 contracts",
						alternate
							? "100 看涨 · 60 天 · 5,200 张"
							: "100 看涨 · 60 天 · 6,000 张",
					),
					choice(
						"c-105-30",
						"105 call · 30 days · 4,100 contracts",
						"105 看涨 · 30 天 · 4,100 张",
					),
				],
				accepted: [alternate ? "c-100-60" : "c-105-30"],
				explanation: alternate
					? copy(
							"The 100 call at 60 days is fresh and inside the boundary. The 105 call at 30 days is stale, and the 7-day peak is outside scope.",
							"60 天到期、行权价 100 的看涨合约数据有效且位于范围内。30 天的 105 看涨合约数据已过时，7 天的峰值则位于范围外。",
						)
					: copy(
							"The 105 call at 30 days is the highest valid comparable observation. The 60-day 100 call is stale; the 7-day peak is out of scope.",
							"30 天到期、行权价 105 的看涨合约是最高的有效可比观测。60 天的 100 看涨合约数据过时，7 天的峰值位于范围外。",
						),
			},
			{
				id: "filter-boundary",
				prompt: copy(
					"Does switching the visible expiry slice change the research boundary?",
					"切换可见到期切片，会改变研究边界吗？",
				),
				choices: [
					choice(
						"yes",
						"Yes; any displayed row becomes eligible.",
						"会，任何显示的合约都变为合格候选。",
					),
					choice(
						"no",
						"No; visibility and eligibility are different.",
						"不会，可见性与比较资格不同。",
					),
					choice(
						"three",
						"Only the 3D view changes eligibility.",
						"只有三维视图会改变比较资格。",
					),
				],
				accepted: ["no"],
				explanation: copy(
					"The same fixed comparison and data quality rules apply in both views and every visible slice.",
					"两种视图和所有可见切片都遵循同一套固定比较与数据质量规则。",
				),
			},
			{
				id: "next-evidence",
				prompt: copy(
					"What is the appropriate next step?",
					"合适的下一步是什么？",
				),
				choices: [
					choice(
						"buy",
						"Act on the rank as a buy signal.",
						"把排名作为买入信号。",
					),
					choice(
						"tape",
						"Inspect the candidate's executions and matched quote context.",
						"检查候选合约的成交和匹配报价上下文。",
					),
					choice(
						"rewrite",
						"Widen the boundary to include the largest excluded column.",
						"扩大边界，将最高的被排除立柱纳入。",
					),
				],
				accepted: ["tape"],
				explanation: copy(
					"A ranked candidate earns validation in the tape. Scope changes require a new declared question, not a retroactive justification.",
					"排名候选应进入成交记录验证。范围变化需要重新声明问题，不能事后为结果寻找理由。",
				),
			},
		],
		hint: copy(
			"Inspect source quality on the selected row. High volume is comparable only inside the declared scope and session.",
			"检查所选行的来源质量。高成交量只有在声明的范围和时段内才具有可比性。",
		),
	};
}

export const contractNeighborhoodScenarios: LearningScenario[] = [
	false,
	true,
].map((alternate) => ({
	id: `contract-neighborhood-${alternate ? "b" : "a"}`,
	lessonId: "rank-contracts",
	version: 2,
	steps: [first, investigation, independent(alternate)],
}));
