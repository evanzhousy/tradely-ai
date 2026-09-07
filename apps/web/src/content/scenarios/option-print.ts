import "@tanstack/react-start/server-only";
import type {
	LearningScenario,
	ScenarioQuestion,
	ScenarioStep,
} from "@/domain/learning/scenario";
import type { LearningCopy } from "@/domain/learning/types";

const copy = (en: string, zh: string): LearningCopy => ({ en, zh });
const choice = (id: string, en: string, zh: string) => ({
	id,
	label: copy(en, zh),
});
const fact = (en: string, zh: string, valueEn: string, valueZh = valueEn) => ({
	label: copy(en, zh),
	value: copy(valueEn, valueZh),
});

const initial: ScenarioStep = {
	id: "first-read",
	kind: "prediction",
	title: copy("A large call print", "一笔大额看涨期权成交"),
	brief: copy(
		"You are inspecting a synthetic execution in a fixed session. Record what the displayed facts support before opening the quote context. The snapshot's timing has not been checked yet.",
		"你正在检查固定时段内的一笔模拟成交。在查看报价上下文前，先记录展示的事实支持什么。报价快照的时间尚未核实。",
	),
	facts: [
		fact(
			"Contract",
			"合约",
			"ALFA · 100 call · 30 days to expiry",
			"ALFA · 100 看涨 · 距到期 30 天",
		),
		fact(
			"Execution",
			"成交",
			"500 contracts × $2.05 × 100 = $102,500",
			"500 张 × $2.05 × 100 = $102,500",
		),
		fact("Trade time", "成交时间", "10:02:00 ET"),
	],
	evidence: [],
	requiredEvidence: [],
	quote: {
		bid: 2,
		ask: 2.05,
		trade: 2.05,
		caption: copy(
			"Displayed quote snapshot · timing not yet inspected",
			"展示的报价快照 · 时间尚未检查",
		),
	},
	questions: [
		{
			id: "first-claim",
			prompt: copy(
				"What can you record with confidence now?",
				"现在可以确定记录什么？",
			),
			choices: [
				choice(
					"bullish",
					"A trader opened a bullish position.",
					"有人建立了看涨仓位。",
				),
				choice(
					"execution",
					"500 calls traded at $2.05; execution premium is $102,500.",
					"500 张看涨期权以 $2.05 成交；成交权利金为 $102,500。",
				),
				choice(
					"forecast",
					"This print predicts a rise in ALFA.",
					"这笔成交预示 ALFA 会上涨。",
				),
			],
			accepted: ["execution"],
			explanation: copy(
				"Price, size, and the stated multiplier establish premium. They do not establish opening versus closing, a full strategy, or a future price path. Next, investigate the quote timing.",
				"价格、数量和给定乘数可以确定权利金。它们不能确定开仓或平仓、完整策略或未来价格路径。接下来检查报价时间。",
			),
		},
	],
	hint: copy(
		"Start with quantities directly recorded in the execution.",
		"从成交记录中直接给出的数量和价格开始。",
	),
};

const investigation: ScenarioStep = {
	id: "quote-context",
	kind: "guided",
	title: copy("Check the evidence behind the read", "检查判断背后的证据"),
	brief: copy(
		"Inspect the quote and neighboring activity. Then revise the interpretation of the same 500-contract call print. Each card opens a different source; the decision is yours.",
		"检查报价和邻近成交，再修正对同一笔 500 张看涨期权成交的解读。每张证据卡对应不同来源，由你作出判断。",
	),
	facts: [
		fact(
			"Execution",
			"成交",
			"500 calls at $2.05 · 10:02:00 ET",
			"500 张看涨期权，价格 $2.05 · 10:02:00 ET",
		),
	],
	evidence: [
		{
			id: "quote-clock",
			title: copy("Quote timing", "报价时间"),
			facts: [
				fact("Snapshot time", "快照时间", "10:00:30 ET"),
				fact("Execution time", "成交时间", "10:02:00 ET"),
				fact("Snapshot bid / ask", "快照买价 / 卖价", "$2.00 / $2.05"),
			],
			note: copy(
				"This is a prior snapshot, 90 seconds before the print. The fixture contains no execution-time quote. Its displayed ask cannot establish the print's aggressor side.",
				"这是成交前 90 秒的历史快照。模拟数据中没有成交时刻的报价，不能用快照的卖价确定成交的主动方向。",
			),
		},
		{
			id: "neighboring-prints",
			title: copy("Nearby executions", "邻近成交"),
			facts: [
				fact(
					"Next execution",
					"下一笔成交",
					"10:02:10 ET · 200 calls at $2.06",
					"10:02:10 ET · 200 张看涨期权，价格 $2.06",
				),
			],
			note: copy(
				"Another execution is observed. No order linkage or strategy identifier is available, so repetition alone does not prove one participant is accumulating.",
				"确实观察到另一笔成交，但没有订单关联或策略标识。重复成交本身不能证明同一参与者在持续建仓。",
			),
		},
		{
			id: "position-context",
			title: copy("Position context", "持仓上下文"),
			facts: [
				fact(
					"Reported OI",
					"已报告未平仓量",
					"2,400 · prior cleared session",
					"2,400 · 上一已清算时段",
				),
			],
			note: copy(
				"This reported OI snapshot predates the print. Opening/closing status, other legs, and the participant's portfolio are not identified.",
				"这份未平仓量快照早于该笔成交。开仓或平仓、其他策略腿以及参与者的组合均无法确定。",
			),
		},
	],
	requiredEvidence: ["quote-clock", "neighboring-prints", "position-context"],
	quote: null,
	questions: [
		{
			id: "aggressor",
			prompt: copy(
				"How should the aggressor-side interpretation change?",
				"应如何修正主动买卖方向的判断？",
			),
			choices: [
				choice(
					"buyer",
					"Keep the buyer classification because the price equals the displayed ask.",
					"价格等于展示的卖价，因此继续判定为主动买入。",
				),
				choice(
					"unresolved",
					"Leave aggressor side unresolved without a contemporaneous quote.",
					"缺少同时刻报价，主动买卖方向应保留为未知。",
				),
				choice(
					"seller",
					"Classify it as seller-initiated because the quote is old.",
					"因为报价过时，所以判定为主动卖出。",
				),
			],
			accepted: ["unresolved"],
			explanation: copy(
				"The missing execution-time quote weakens the classification. It does not reverse it into a seller classification.",
				"缺少成交时刻的报价会削弱分类依据，但不会因此变成主动卖出。",
			),
		},
		{
			id: "intent",
			prompt: copy(
				"What remains unknown after inspecting all three sources?",
				"检查三个来源后，什么仍然未知？",
			),
			choices: [
				choice("size", "The executed contract count.", "成交合约数量。"),
				choice(
					"premium",
					"The premium calculated from this execution.",
					"根据该笔成交计算的权利金。",
				),
				choice(
					"position",
					"Whether this opens, closes, or belongs to a larger strategy.",
					"这笔成交是开仓、平仓，还是更大策略的一部分。",
				),
			],
			accepted: ["position"],
			explanation: copy(
				"Size and execution premium are observed or directly calculated. Participant intent and position effects require evidence this fixture does not provide.",
				"数量与成交权利金是已观察或可直接计算的信息。参与者意图和持仓变化需要模拟数据未提供的证据。",
			),
		},
		{
			id: "next-check",
			prompt: copy(
				"Which next check addresses the aggressor-side gap most directly?",
				"哪项下一步检查最直接地补足主动方向的证据缺口？",
			),
			choices: [
				choice(
					"matched-quote",
					"Obtain and align the quote at the execution timestamp.",
					"获取并对齐成交时刻的报价。",
				),
				choice(
					"later-price",
					"Wait for ALFA to rise and use that to label this print.",
					"等待 ALFA 上涨，再用结果给这笔成交分类。",
				),
				choice(
					"larger-print",
					"Find a larger call print.",
					"寻找更大的一笔看涨期权成交。",
				),
			],
			accepted: ["matched-quote"],
			explanation: copy(
				"A time-aligned quote addresses execution-side evidence. Later prices or larger trades cannot repair a missing quote for this execution.",
				"时间对齐的报价可以补足成交方向证据。后来的价格或更大成交都不能补上这笔成交缺失的报价。",
			),
		},
	],
	hint: copy(
		"Check each source's clock before combining it with the execution. Missing evidence can require a narrower claim.",
		"先检查各来源的时间，再与成交合并解读。证据缺失时，应缩小结论范围。",
	),
};

function independent(variant: "a" | "b"): ScenarioStep {
	const isA = variant === "a";
	const questions: ScenarioQuestion[] = [
		{
			id: "execution-side",
			prompt: copy(
				"Which interpretation is supported by this case?",
				"这个案例支持哪种解读？",
			),
			choices: [
				choice(
					"buyer",
					"Aggressive buying is plausible from the quote location.",
					"从报价位置看，主动买入是合理推断。",
				),
				choice(
					"seller",
					"Aggressive selling is plausible from the quote location.",
					"从报价位置看，主动卖出是合理推断。",
				),
				choice(
					"uncertain",
					"The midpoint execution leaves aggressor side unresolved.",
					"中间价成交使主动买卖方向无法确定。",
				),
			],
			accepted: [isA ? "seller" : "uncertain"],
			explanation: isA
				? copy(
						"The fixture provides a matched quote and a bid-side execution. This supports an aggressive-seller inference, with participant intent still unresolved.",
						"案例提供了对齐的报价，且成交位于买价。这支持主动卖出的推断，但参与者意图仍然未知。",
					)
				: copy(
						"The execution is at the midpoint of a matched quote. The quote location does not establish buyer or seller aggression.",
						"成交发生在对齐报价的中间价。该报价位置不能确定主动买入或卖出。",
					),
		},
		{
			id: "execution-premium",
			prompt: copy(
				"What is the execution premium using the stated 100 multiplier?",
				"使用给定的 100 倍乘数，成交权利金是多少？",
			),
			choices: [
				choice("small", isA ? "$720" : "$1,025", isA ? "$720" : "$1,025"),
				choice(
					"premium",
					isA ? "$72,000" : "$102,500",
					isA ? "$72,000" : "$102,500",
				),
				choice(
					"large",
					isA ? "$720,000" : "$1,025,000",
					isA ? "$720,000" : "$1,025,000",
				),
			],
			accepted: ["premium"],
			explanation: isA
				? copy(
						"400 contracts × $1.80 × 100 = $72,000. This dollar quantity does not measure conviction.",
						"400 张 × $1.80 × 100 = $72,000。这一金额不能衡量确信程度。",
					)
				: copy(
						"250 contracts × $4.10 × 100 = $102,500. Different price and size can produce the same premium.",
						"250 张 × $4.10 × 100 = $102,500。不同的价格与数量可以得到相同的权利金。",
					),
		},
		{
			id: "claim-boundary",
			prompt: copy(
				"Which statement preserves the evidence boundary?",
				"哪项表述保留了证据边界？",
			),
			choices: [
				choice(
					"opening",
					"The print proves a new position was opened.",
					"这笔成交证明有人新开了仓位。",
				),
				choice(
					"forecast",
					"The option type tells us the underlying's next direction.",
					"期权类型告诉我们标的接下来的方向。",
				),
				choice(
					"unknown",
					"Opening/closing status and the full strategy remain unknown.",
					"开仓或平仓状态以及完整策略仍然未知。",
				),
			],
			accepted: ["unknown"],
			explanation: copy(
				"A matched quote helps interpret execution location. It does not identify position effects, other legs, or a future price path.",
				"对齐的报价有助于解读成交位置，但不能确定持仓变化、其他策略腿或未来价格路径。",
			),
		},
	];
	return {
		id: "independent-case",
		kind: "independent",
		title: copy("Apply the method to a new print", "将方法应用于新成交"),
		brief: copy(
			"This is a separate synthetic case. Inspect its own evidence and answer all three questions. Help is available; using it records this case as practice rather than an independent demonstration.",
			"这是另一个独立的模拟案例。检查它自己的证据并回答三个问题。可以查看提示；使用提示后，本次记录为练习，而非独立掌握。",
		),
		facts: [
			fact(
				"Contract",
				"合约",
				isA
					? "BETA · 80 put · 21 days to expiry"
					: "GAMMA · 120 call · 45 days to expiry",
				isA
					? "BETA · 80 看跌 · 距到期 21 天"
					: "GAMMA · 120 看涨 · 距到期 45 天",
			),
			fact(
				"Execution",
				"成交",
				isA
					? "400 contracts at $1.80 · multiplier 100"
					: "250 contracts at $4.10 · multiplier 100",
				isA ? "400 张，价格 $1.80 · 乘数 100" : "250 张，价格 $4.10 · 乘数 100",
			),
			fact("Execution time", "成交时间", "11:15:00 ET"),
		],
		quote: {
			bid: isA ? 1.8 : 4,
			ask: isA ? 1.9 : 4.2,
			trade: isA ? 1.8 : 4.1,
			caption: copy(
				"Matched execution-time quote · synthetic case",
				"与成交时刻对齐的报价 · 模拟案例",
			),
		},
		evidence: [
			{
				id: "case-record",
				title: copy("Inspect the source record", "检查来源记录"),
				facts: [
					fact(
						"Quote alignment",
						"报价对齐",
						"Quote matched to the execution timestamp",
						"报价已对齐成交时刻",
					),
					fact(
						"Position and strategy linkage",
						"持仓与策略关联",
						"Not supplied",
						"未提供",
					),
				],
				note: copy(
					"This fixture establishes execution-time quote alignment. It supplies no opening/closing flag, multi-leg linkage, or participant portfolio.",
					"本案例明确报价已与成交时间对齐，但未提供开平仓标记、多腿关联或参与者组合。",
				),
			},
		],
		requiredEvidence: ["case-record"],
		questions,
		hint: copy(
			"Compare execution price with the matched bid and ask. Calculate price × contracts × multiplier. Keep trade location separate from position intent.",
			"比较成交价与对齐的买卖价。计算价格 × 张数 × 乘数，并区分成交位置与持仓意图。",
		),
	};
}

export const optionPrintScenarios: LearningScenario[] = ["a", "b"].map(
	(variant) => ({
		id: `option-print-${variant}`,
		lessonId: "validate-option-print",
		version: 1,
		steps: [initial, investigation, independent(variant as "a" | "b")],
	}),
);
