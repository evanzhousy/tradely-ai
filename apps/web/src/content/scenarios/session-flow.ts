import "@tanstack/react-start/server-only";
import type { FlowStructureComparison } from "@/domain/learning/flow-structure";
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

function comparison(
	id: string,
	independent = false,
	alternate = false,
): FlowStructureComparison {
	const scope = independent
		? "BETA calls · 100–110 · 14–30 DTE"
		: "ALFA calls · 95–105 · 14–30 DTE";
	const volumes = independent
		? [0, 400, 1200, 2800, 3600]
		: [0, 600, 2100, 6400, 8400];
	return {
		id,
		scope,
		sessionDate: "2026-09-03",
		reportedOi: {
			value: independent ? 9100 : 12000,
			asOf: "2026-09-02",
			scope,
		},
		previousOi: {
			value: independent ? 9500 : 12200,
			asOf: "2026-09-01",
			scope: alternate ? "BETA calls · 100–110 · all expiries" : scope,
		},
		gex: {
			value: alternate ? null : independent ? -0.7 : 1.8,
			asOf: "2026-09-02",
			scope,
		},
		note: copy(
			"Synthetic session. Only volume is interpolated. OI and this model snapshot retain their report dates throughout the replay. Questions use the 16:00 view.",
			"模拟时段：仅成交量进行插值。持仓量与本例模型快照在回放中保留各自报告日期。题目以 16:00 视图为准。",
		),
		replay: {
			durationMs: 14000,
			openMinute: 570,
			closeMinute: 960,
			frames: [570, 630, 720, 870, 960].map((minute, index) => ({
				position: (minute - 570) / 390,
				volume: volumes[index],
			})),
		},
	};
}

const guided = comparison("alfa-flow-clocks-v1");
const start: ScenarioStep = {
	id: "first-clock",
	kind: "prediction",
	title: copy(
		"Watch activity build. Keep the report date.",
		"观察成交累积，保留报告日期。",
	),
	brief: copy(
		"Replay the September 3 tape. At 16:00, 8,400 contracts have traded, while the latest available OI report is still dated September 2. Decide what the display establishes.",
		"回放 9 月 3 日成交。16:00 时累计成交 8,400 张，但最新可用持仓量报告仍截至 9 月 2 日。判断画面支持什么结论。",
	),
	facts: [],
	quote: null,
	flowStructure: guided,
	evidence: [],
	requiredEvidence: [],
	questions: [
		{
			id: "first-clock-claim",
			prompt: copy(
				"What can you say about September 3 positions from this display?",
				"仅凭此画面，可以怎样描述 9 月 3 日的持仓？",
			),
			choices: [
				choice(
					"add-volume",
					"Outstanding contracts increased by 8,400 today.",
					"今天未平仓合约增加了 8,400 张。",
				),
				choice(
					"await-report",
					"Today's volume is known; today's cleared position change is not yet reported here.",
					"已知今天的成交量，但这里尚未报告今天清算后的持仓变化。",
				),
				choice(
					"live-gex",
					"Positive GEX proves dealers bought all of today's calls.",
					"正 GEX 证明做市商买入了今天全部看涨合约。",
				),
			],
			accepted: ["await-report"],
			explanation: copy(
				"Volume counts contracts traded. The displayed OI describes outstanding contracts at an earlier report date; it does not increase automatically with the tape.",
				"成交量记录时段内成交的合约张数。所示持仓量描述较早报告日期的未平仓合约，不会随成交量自动增加。",
			),
		},
	],
	hint: copy(
		"Read the as-of date beside each number before combining them.",
		"合并数字前，先阅读每项数据旁的截至日期。",
	),
};

const investigate: ScenarioStep = {
	id: "inspect-clocks",
	kind: "guided",
	title: copy("Inspect the two ledgers and the model.", "检查两本台账与模型。"),
	brief: copy(
		"The same screen contains session executions, cleared OI reports, and a dated model. Inspect their source records before combining them.",
		"同一画面包含时段成交、清算持仓量报告和带日期的模型。合并解释前，先检查来源记录。",
	),
	facts: [],
	quote: null,
	flowStructure: guided,
	evidence: [
		{
			id: "oi-reports",
			title: copy("Cleared OI report pair", "清算持仓量报告对"),
			facts: [
				fact("September 1", "9 月 1 日", copy("12,200 contracts", "12,200 张")),
				fact(
					"September 2",
					"9 月 2 日",
					copy("12,000 contracts · same scope", "12,000 张 · 相同范围"),
				),
			],
			note: copy(
				"The -200 change compares September 1 and 2 reports. September 3 executions are not part of that comparison.",
				"-200 比较的是 9 月 1 日与 2 日报告，9 月 3 日的成交不属于此比较。",
			),
		},
		{
			id: "model-clock",
			title: copy("Model source and clock", "模型来源与时钟"),
			facts: [
				fact("As of", "截至", copy("September 2 close", "9 月 2 日收盘")),
				fact("Scope", "范围", copy(guided.scope, guided.scope)),
			],
			note: copy(
				"This illustrative GEX model uses a fixed prior-close snapshot and assumed position signs. It is context, not an observation of live dealer trades.",
				"本例 GEX 模型使用固定的前日收盘快照和假设的持仓方向。它提供背景，而非实时做市商成交观测。",
			),
		},
	],
	requiredEvidence: ["oi-reports", "model-clock"],
	questions: [
		{
			id: "delta-clock",
			prompt: copy("What does ΔOI = -200 describe?", "ΔOI = -200 描述什么？"),
			choices: [
				choice(
					"reports",
					"A net decrease between the September 1 and 2 reports.",
					"9 月 1 日与 2 日报告之间的净减少。",
				),
				choice(
					"today",
					"Two hundred contracts closed on today's tape.",
					"今天成交中平仓了 200 张。",
				),
				choice(
					"bearish",
					"A confirmed bearish position held by one trader.",
					"某交易者持有已证实的看跌仓位。",
				),
			],
			accepted: ["reports"],
			explanation: copy(
				"The dates and scope define the delta. It does not identify which executions opened or closed positions, or who held them.",
				"日期与范围定义该变化值。它无法识别具体成交的开平仓或持有人。",
			),
		},
		{
			id: "gex-clock",
			prompt: copy(
				"How should this GEX snapshot be used?",
				"应如何使用此 GEX 快照？",
			),
			choices: [
				choice(
					"context",
					"As dated model context with its scope and assumptions attached.",
					"作为注明日期、范围与假设的模型背景。",
				),
				choice(
					"dealer",
					"As proof of current dealer buying.",
					"作为做市商当前买入的证据。",
				),
				choice(
					"refresh",
					"Move its date forward whenever volume increases.",
					"成交量增加时，自动把其日期更新为今天。",
				),
			],
			accepted: ["context"],
			explanation: copy(
				"A moving tape cannot refresh a separate model. Inspect the model's actual input date and methodology.",
				"成交数据的变化不会刷新另一个模型。应检查模型实际输入日期和方法。",
			),
		},
	],
	hint: copy(
		"Pair the report dates first. Keep model assumptions separate from observed trades.",
		"先配对报告日期，并区分模型假设与实际成交。",
	),
};

function independent(alternate: boolean): ScenarioStep {
	const data = comparison(
		alternate ? "beta-flow-clocks-b-v1" : "beta-flow-clocks-a-v1",
		true,
		alternate,
	);
	return {
		id: "independent-clocks",
		kind: "independent",
		title: copy(
			"Audit another session without mixing clocks.",
			"审计另一时段，避免混用时钟。",
		),
		brief: copy(
			"BETA finishes September 3 with volume of 3,600. Inspect the supplied report pair, then record only the comparison it supports.",
			"BETA 在 9 月 3 日收盘时成交量为 3,600。检查所给报告对，仅记录其支持的比较。",
		),
		facts: [],
		quote: null,
		flowStructure: data,
		evidence: [
			{
				id: "independent-reports",
				title: copy("BETA report provenance", "BETA 报告来源"),
				facts: [
					fact(
						"September 1 OI",
						"9 月 1 日持仓量",
						copy(
							`9,500 · ${data.previousOi?.scope}`,
							`9,500 · ${data.previousOi?.scope}`,
						),
					),
					fact(
						"September 2 OI",
						"9 月 2 日持仓量",
						copy(
							`9,100 · ${data.reportedOi.scope}`,
							`9,100 · ${data.reportedOi.scope}`,
						),
					),
				],
				note: copy(
					alternate
						? "The earlier report includes all expiries; the later one includes only 14–30 DTE. The model value was not supplied."
						: "Both reports use the same strike and expiry scope. No September 3 cleared OI report is supplied.",
					alternate
						? "较早报告包含全部到期日，较晚报告仅包含 14–30 天到期。未提供模型数值。"
						: "两份报告使用相同行权价与到期范围。未提供 9 月 3 日清算持仓量报告。",
				),
			},
		],
		requiredEvidence: ["independent-reports"],
		questions: [
			{
				id: "report-change",
				prompt: copy("Which ΔOI comparison is valid?", "哪项 ΔOI 比较有效？"),
				choices: [
					choice(
						"minus-400",
						"-400 between the September 1 and 2 reports.",
						"9 月 1 日至 2 日报告之间减少 400。",
					),
					choice(
						"plus-volume",
						"+3,600, equal to today's volume.",
						"+3,600，等于今天的成交量。",
					),
					choice(
						"scope-mismatch",
						"No comparable delta: the report scopes differ.",
						"无法得到可比变化值：两份报告范围不同。",
					),
				],
				accepted: [alternate ? "scope-mismatch" : "minus-400"],
				explanation: copy(
					alternate
						? "Subtracting unlike expiry scopes creates a misleading delta. Obtain the earlier 14–30 DTE report first."
						: "9,100 minus 9,500 is -400 across the two cleared reports. It is not September 3 intraday position change.",
					alternate
						? "相减不同到期范围会产生误导。应先取得较早日期的 14–30 天到期报告。"
						: "两份清算报告之间，9,100 减 9,500 为 -400。这不是 9 月 3 日盘中持仓变化。",
				),
			},
			{
				id: "today-claim",
				prompt: copy(
					"What does the 3,600 volume establish?",
					"成交量 3,600 能确定什么？",
				),
				choices: [
					choice(
						"executions",
						"3,600 contracts traded within the declared session and scope.",
						"声明时段和范围内成交了 3,600 张合约。",
					),
					choice(
						"new-positions",
						"Exactly 3,600 new positions remained open.",
						"恰好新增并保留了 3,600 张持仓。",
					),
					choice(
						"forecast",
						"A bullish next-session price move is certain.",
						"下一时段一定上涨。",
					),
				],
				accepted: ["executions"],
				explanation: copy(
					"Volume counts contracts traded, not net new positions. It does not establish trader identity or future direction.",
					"成交量统计成交，不是净新增持仓，也不能确定交易者身份或未来方向。",
				),
			},
			{
				id: "next-source",
				prompt: copy(
					"What is the next useful source check?",
					"下一步应检查什么来源？",
				),
				choices: [
					choice(
						"aligned-report",
						"Obtain the relevant cleared report and verify its date and matching scope.",
						"取得相关清算报告，核实其日期与一致范围。",
					),
					choice(
						"rename-time",
						"Relabel yesterday's OI as today's live position.",
						"把昨日持仓量改标为今天实时持仓。",
					),
					choice(
						"infer-model",
						"Fill missing model data from the sign of the volume change.",
						"根据成交量变化的符号补全缺失模型数据。",
					),
				],
				accepted: ["aligned-report"],
				explanation: copy(
					"Preserve missingness and report lineage. A later aligned report adds evidence; it still cannot identify the full strategy behind an individual print.",
					"保留缺失状态与报告来源。后续同范围报告可补充证据，但仍无法确定单笔成交的完整策略。",
				),
			},
		],
		hint: copy(
			"Compare scope before subtracting. Then ask which session each source describes.",
			"先比较范围，再相减；随后检查每个来源描述哪个时段。",
		),
	};
}

export const sessionFlowScenarios: LearningScenario[] = [false, true].map(
	(alternate) => ({
		id: alternate ? "session-flow-clocks-b" : "session-flow-clocks-a",
		lessonId: "session-flow-vs-structure",
		version: 1,
		steps: [start, investigate, independent(alternate)],
	}),
);
