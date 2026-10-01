import type { TradingFlowPractice } from "@/content/course";
import type { Locale } from "@/i18n/messages";

const text = (en: string, zh: string): Record<Locale, string> => ({ en, zh });

/**
 * Teaching metadata only. TradingFlow owns the reports, access and run outcomes. A lab runs one
 * recipe, or, with `path`, opens another TradingFlow page such as Home.
 */
type LabText = Readonly<Record<Locale, string>>;

export type TradingFlowLab = {
	id: string;
	lessonId: string;
	/** The recipe the lab runs, or null when the lab opens another page. */
	recipeSlug: string | null;
	/** The app page a non-recipe lab opens, such as "/app/home". */
	path: string | null;
	version: number;
	title: LabText;
	/** What the lab works in: a recipe's name or a TradingFlow page. */
	recipeTitle: string;
	/** The TradingFlow surface a page lab opens; recipe labs open Cookbooks. */
	tool?: TradingFlowPractice["tool"];
	goal: LabText;
	prerequisites: readonly string[];
	params: Readonly<Record<string, string>>;
	settings: LabText;
	sample: LabText;
	steps: readonly LabText[];
	inspect: LabText;
};

export const tradingFlowLabs: readonly TradingFlowLab[] = [
	{
		id: "unusual-activity",
		lessonId: "unusual-activity",
		recipeSlug: "unusual-options-activity",
		path: null,
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
		path: null,
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
		path: null,
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
	{
		id: "tradingflow-recipes",
		lessonId: "tradingflow-recipes",
		recipeSlug: "unusual-options-activity",
		path: null,
		version: 1,
		title: text("Read which session a run shows", "看清一次运行展示的交易时段"),
		recipeTitle: "Unusual Options Activity Screener",
		goal: text(
			"Read a recipe's session and run time before any number, then re-run it for an earlier session.",
			"先看 Recipe 的交易时段和运行时间，再读任何数字；然后针对更早的时段重新运行。",
		),
		prerequisites: ["cookbook-research-packet"],
		params: {
			min_vol_oi: "1",
			min_rel_vol: "0",
			min_volume: "500",
			min_oi: "200",
			max_dte: "60",
		},
		settings: text(
			"Latest completed session, at the recipe's default thresholds.",
			"最近一个完整的交易时段，使用 Recipe 的默认阈值。",
		),
		sample: text(
			"In the course's market, Monday's run at these thresholds passes five contracts, led by the CRUX Oct 4 60 put at 2.67 times its open interest. Opened at 8:00 on Tuesday, the report still shows Monday; after Tuesday's close it shows Tuesday's two.",
			"在课程的市场里，周一按这些阈值运行，通过五份合约，排在最前的是 CRUX 10月4日 60 看跌，为其未平仓量的 2.67 倍。周二 8:00 打开时报告仍显示周一；周二收盘后则显示周二的两份。",
		),
		steps: [
			text(
				"Open the recipe and write down the session named in its header and the time it ran.",
				"打开 Recipe，记下页眉注明的交易时段和运行时间。",
			),
			text(
				"Use the date picker to choose the previous session. Note which figures change and which explanations stay word for word the same.",
				"用日期选择器选择上一个交易时段。记下哪些数字变了，哪些说明文字一字未变。",
			),
			text(
				"Open Cookbooks and find one quick lookup, one session screen and one multi-step report by the question on each card.",
				"打开 Cookbooks，按每张卡片上写的问题找到一个快速查询、一个时段筛选和一个多步骤报告。",
			),
			text(
				"Check whether your account shows New recipe or Edit with AI. If it doesn't, recipe editing isn't enabled for it; every official recipe still runs. Don't save anything for this lab.",
				"看看你的账户是否显示 New recipe 或 Edit with AI。如果没有，说明该账户未开通 Recipe 编辑；所有官方 Recipe 照样可以运行。本练习不要保存任何内容。",
			),
		],
		inspect: text(
			"Write the session, its run time, and one figure that changed when you picked the earlier session.",
			"写下交易时段、运行时间，以及选择更早时段后发生变化的一个数字。",
		),
	},
	{
		id: "recipe-map",
		lessonId: "recipe-map",
		recipeSlug: "market-recap",
		path: null,
		version: 1,
		title: text(
			"Trace a sentence through the recipe map",
			"通过 Recipe 地图追溯一句话",
		),
		recipeTitle: "Daily Market Recap",
		goal: text(
			"Audit a report's text: find what each sentence is computed from, and what was written in advance.",
			"审核报告的文字：找出每句话由什么算出，哪些是预先写好的。",
		),
		prerequisites: ["tradingflow-recipes"],
		params: {},
		settings: text(
			"Latest completed session. Keep it fixed while you trace.",
			"使用最近一个完整的交易时段，追溯时保持不变。",
		),
		sample: text(
			"In the course's market, the screener's Bottom line is fed by the session and all five thresholds, so it changes from Monday to Tuesday; its Takeaways are recipe content and read the same on both days.",
			"在课程的市场里，筛选器的核心结论由交易时段和全部五个阈值提供，所以从周一到周二会变；它的要点是 Recipe 内容，两天读起来一样。",
		),
		steps: [
			text(
				"Open the recipe, then Open recipe map. Write down the market session and last-run time it shows.",
				"打开 Recipe，再打开 Recipe 地图。记下它显示的交易时段和最近一次运行时间。",
			),
			text(
				"Pick one sentence in the Bottom line. In the map, find its cell, the live data behind it and the inputs that feed that data.",
				"在核心结论里选一句话。在地图中找到它的单元格、背后的实时数据，以及为这些数据提供输入的项目。",
			),
			text(
				"Find one text cell marked as recipe content and explain why it isn't evidence about this session.",
				"找到一个标为 Recipe 内容的文字单元格，并说明它为何不是关于本交易时段的证据。",
			),
			text(
				"Find one table and compare how many rows it shows with the count in the key figures.",
				"找到一个表格，比较它显示的行数与关键数字中的总数。",
			),
		],
		inspect: text(
			"Write the sentence you traced, its live data and inputs, one recipe-content cell, and the shown-versus-total counts.",
			"写下你追溯的句子、它的实时数据和输入、一个 Recipe 内容单元格，以及显示数与总数。",
		),
	},
	{
		id: "recipe-inputs",
		lessonId: "recipe-inputs",
		recipeSlug: "unusual-options-activity",
		path: null,
		version: 1,
		title: text("Draft, run and discard an input", "草拟、运行并放弃一个输入"),
		recipeTitle: "Unusual Options Activity Screener",
		goal: text(
			"See exactly when a report changes, and what the screen's floors keep out.",
			"弄清报告究竟何时变化，以及筛选门槛挡住了什么。",
		),
		prerequisites: ["recipe-map"],
		params: {
			min_vol_oi: "1",
			min_rel_vol: "0",
			min_volume: "500",
			min_oi: "200",
			max_dte: "60",
		},
		settings: text(
			"Latest completed session, starting from the default thresholds.",
			"最近一个完整的交易时段，从默认阈值开始。",
		),
		sample: text(
			"In the course's market, typing 1,000 into Min OI changes nothing until Run; then one contract passes instead of five. With both floors at 0, a contract with 30 trades against 5 open interest leads at 6.00.",
			"在课程的市场里，在最低未平仓量里输入 1,000，点“运行”之前什么都不变；运行后只有一份合约通过，而不是五份。两个门槛都为 0 时，一份成交 30 张、未平仓量 5 的合约以 6.00 领先。",
		),
		steps: [
			text(
				"Open the recipe at its defaults and note how many contracts the key figures count.",
				"以默认值打开 Recipe，记下关键数字统计的合约数量。",
			),
			text(
				"Change Min OI without running. Check that the key figures and the table haven't moved, then press Discard changes.",
				"修改最低未平仓量但不运行。确认关键数字和表格没有变化，然后点“放弃更改”。",
			),
			text(
				"Set Min volume and Min OI lower and press Run. Note which contract now leads, with its volume and open interest.",
				"把最低成交量和最低未平仓量调低后点“运行”。记下现在领先的合约及其成交量和未平仓量。",
			),
			text(
				"Reload the report to return to the defaults before you leave.",
				"离开前重新加载报告，恢复默认值。",
			),
		],
		inspect: text(
			"Write the count at the defaults, the count after your change, the new leader with its volume and open interest, and whether your change re-ran the question or asked a new one.",
			"写下默认设置下的数量、改动后的数量、新的领先合约及其成交量和未平仓量，以及你的改动是重新运行问题还是提出了新问题。",
		),
	},
];

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
		lab.recipeSlug
			? `https://app.tradingflow.com/app/cookbooks/${lab.recipeSlug}${options.date ? `~${options.date}` : ""}`
			: `https://app.tradingflow.com${lab.path}`,
	);
	if (lab.recipeSlug)
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
