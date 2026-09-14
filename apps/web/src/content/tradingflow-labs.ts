import type { Locale } from "@/i18n/messages";

const text = (en: string, zh: string): Record<Locale, string> => ({ en, zh });

/** Teaching metadata only. TradingFlow owns the reports, access and run outcomes. */
export const tradingFlowLabs = [
	{
		id: "unusual-activity",
		lessonId: "unusual-activity",
		recipeSlug: "unusual-options-activity",
		version: 1,
		title: text("Investigate unusual activity", "调查异常成交"),
		recipeTitle: "Unusual Options Activity Screener",
		goal: text(
			"Compare a contract’s activity with the right baseline before choosing what to investigate.",
			"先用正确基准比较合约成交，再决定调查对象。",
		),
		prerequisites: ["session-flow-vs-structure"],
		params: {
			min_vol_oi: "1",
			min_rel_vol: "0",
			min_volume: "500",
			min_oi: "200",
			max_dte: "60",
		},
		settings: text(
			"Latest completed session. Start with volume/OI ≥ 1, relative volume ≥ 0, volume ≥ 500, OI ≥ 200, and max DTE 60.",
			"使用最近完整交易时段。初始设置：成交量/OI ≥ 1、相对成交量 ≥ 0、成交量 ≥ 500、OI ≥ 200、最多 60 天到期。",
		),
		sample: text(
			"Illustrative contract A has volume 1,200 and standing open interest 300: volume/OI = 4. That describes activity relative to the book. A blank relative-volume value means insufficient history, not zero activity. Neither value identifies who traded or proves a new position.",
			"示例合约 A 的成交量为 1,200，已有未平仓量为 300：成交量/OI = 4。这描述成交量相对已有持仓的大小。相对成交量为空表示历史不足，不是零成交。两项指标都不能识别交易者或证明新开仓。",
		),
		steps: [
			text(
				"Open the Recipe and record the represented session and starting thresholds.",
				"打开 Recipe，记录其交易时段和初始阈值。",
			),
			text(
				"Choose one returned contract. Compare volume/OI with relative volume; note any missing history.",
				"选择一个返回的合约，比较成交量/OI 与相对成交量，并注明缺失的历史。",
			),
			text(
				"Raise only the minimum volume/OI to 2 and apply the parameters. Explain which candidates remain. An empty board is a valid result.",
				"仅把最低成交量/OI 改为 2 并应用参数，解释哪些候选仍在。空结果也是有效结果。",
			),
			text(
				"Inspect the selected contract in Option Trades before making a claim about its prints.",
				"在对成交记录作出判断前，到 Option Trades 检查所选合约。",
			),
		],
		inspect: text(
			"Write the session, contract, two ratios, one missing input and your next check. On another session, rerun the same thresholds and compare the shortlist.",
			"写下时段、合约、两个比率、一项缺失输入和下一步核查。另一个交易时段使用相同阈值重跑，比较候选名单。",
		),
	},
	{
		id: "gamma-exposure",
		lessonId: "gamma-exposure",
		recipeSlug: "gamma-key-levels",
		version: 1,
		title: text("Read a gamma structure map", "解读 Gamma 结构图"),
		recipeTitle: "Gamma Structure Map",
		goal: text(
			"Explain a dated GEX snapshot while keeping concentrations separate from forecasts.",
			"解释注明日期的 GEX 快照，并区分集中位置与预测。",
		),
		prerequisites: ["gamma", "session-flow-vs-structure"],
		params: {},
		settings: text(
			"Latest completed session. Keep the Recipe’s default scope and read its snapshot, units and sign convention before comparing levels.",
			"使用最近完整交易时段，保留 Recipe 默认范围。比较位置前，先阅读快照日期、单位与符号约定。",
		),
		sample: text(
			"Under a stated call-positive / put-negative convention, +8 and −5 in the same GEX unit sum to +3. This is a model-based net reading. The largest concentration describes the snapshot; it does not guarantee support, resistance or tomorrow’s price.",
			"在看涨为正、看跌为负的约定下，相同 GEX 单位的 +8 与 −5 相加为 +3。这是基于模型的净值。最大集中位置描述的是快照，不能保证支撑、阻力或明日价格。",
		),
		steps: [
			text(
				"Open the Recipe and record the report session and the chain snapshot date it represents.",
				"打开 Recipe，记录报告时段及其代表的期权链快照日期。",
			),
			text(
				"Read the index summary and one single-name section. Keep their scopes and units separate.",
				"阅读指数概览及一个个股部分，分别保留各自范围与单位。",
			),
			text(
				"Find one concentration and its distance from spot. Explain it using the Recipe’s sign convention.",
				"找到一个集中位置及其距现价的距离，使用 Recipe 的符号约定解释它。",
			),
			text(
				"Check session flow in Rank or Option Trades. State what the snapshot cannot tell you about actual dealer inventory.",
				"到 Rank 或 Option Trades 核查时段成交流，说明快照无法告诉你的实际做市商库存信息。",
			),
		],
		inspect: text(
			"Record the scope, snapshot, units, one concentration and one limitation. Rerun on another session and describe changes without treating them as predictions.",
			"记录范围、快照、单位、一个集中位置和一项限制。另一个时段重跑，描述变化，避免将其视为预测。",
		),
	},
	{
		id: "market-recap",
		lessonId: "market-recap",
		recipeSlug: "market-recap",
		version: 1,
		title: text("Write an evidence-backed recap", "撰写有证据支持的复盘"),
		recipeTitle: "Daily Market Recap",
		goal: text(
			"Turn one completed session into a short recap whose claims can be checked.",
			"把一个完整交易时段写成简短复盘，让每项判断都可核查。",
		),
		prerequisites: ["cookbook-research-packet"],
		params: {},
		settings: text(
			"Latest completed session. Keep the session fixed while reading the chapters and supporting charts.",
			"使用最近完整交易时段。阅读各章节和支持图表时，保持同一时段。",
		),
		sample: text(
			"An illustrative report shows 60% of premium in calls. A supported sentence is: ‘Calls accounted for 60% of this report’s session premium.’ ‘Traders expect prices to rise’ needs evidence about execution and positioning that this percentage alone does not provide.",
			"示例报告显示看涨期权占权利金的 60%。有依据的表述是：“在本报告的时段范围内，看涨期权占权利金的 60%。”而“交易者预期上涨”还需要成交与持仓证据，不能仅凭这个百分比得出。",
		),
		steps: [
			text(
				"Open Daily Market Recap and record the represented session.",
				"打开 Daily Market Recap 并记录其代表的交易时段。",
			),
			text(
				"Choose one observation from session tone or premium concentration. Find its supporting table or chart.",
				"从时段倾向或权利金集中度中选择一个观察，找到支持它的表格或图表。",
			),
			text(
				"Write three sentences: observation, supporting evidence and a limitation. Preserve the source’s units and scope.",
				"写三句话：观察、支持证据和限制。保留来源的单位与范围。",
			),
			text(
				"Check one named symbol in Rank or Option Trades. Revise any claim that exceeds the evidence.",
				"到 Rank 或 Option Trades 检查一个被提及的标的，修正超出证据的判断。",
			),
		],
		inspect: text(
			"Keep the session, evidence reference and next check with your recap. On another session, repeat the same structure and compare what changed.",
			"在复盘中保留交易时段、证据引用和下一步核查。另一个时段使用相同结构复盘，比较变化。",
		),
	},
] as const;

export type TradingFlowLab = (typeof tradingFlowLabs)[number];
export type TradingFlowLabId = TradingFlowLab["id"];

export function getTradingFlowLab(lessonId: string) {
	return tradingFlowLabs.find((lab) => lab.lessonId === lessonId);
}

export function tradingFlowLabUrl(
	id: TradingFlowLabId,
	options: { attribution?: boolean; date?: string } = {},
) {
	const lab = getTradingFlowLab(id);
	if (!lab) throw new Error("Unknown TradingFlow lab");
	if (
		options.date &&
		(!/^\d{4}-\d{2}-\d{2}$/.test(options.date) ||
			!Number.isFinite(Date.parse(options.date)) ||
			new Date(options.date).toISOString().slice(0, 10) !== options.date)
	)
		throw new Error("Invalid session date");
	const url = new URL(
		`https://app.tradingflow.com/app/cookbooks/${lab.recipeSlug}${options.date ? `~${options.date}` : ""}`,
	);
	for (const [key, value] of Object.entries(lab.params))
		url.searchParams.set(`p_${key}`, value);
	if (options.attribution) {
		url.searchParams.set("utm_source", "tradely");
		url.searchParams.set("utm_medium", "course");
		url.searchParams.set("utm_campaign", "recipe_labs");
		url.searchParams.set("tf_lab", lab.id);
		url.searchParams.set("tf_lab_version", `v${lab.version}`);
	}
	return url.toString();
}
