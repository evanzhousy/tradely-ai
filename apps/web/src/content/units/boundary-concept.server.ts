import "@tanstack/react-start/server-only";
import type {
	BoundaryConceptData,
	ResearchIdentity,
} from "@/domain/learning/boundary-concept";

const identity: ResearchIdentity = {
	subject: "RHO",
	population: "calls · 2030-10-18 · strikes 95/100/105",
	quantity: "session contract volume",
	interval: "2030-09-13 09:30–16:00 America/New_York",
	method: "sum corrected executions by contract · TAPE-R",
};
export const boundaryConceptData: BoundaryConceptData = {
	kind: "audited-boundary",
	source: "BOUNDARY-R · synthetic research record",
	fields: [
		{
			id: "subject",
			label: ["Subject", "对象"],
			value: ["RHO option activity", "RHO 期权活动"],
		},
		{
			id: "quantity",
			label: ["Quantity / method", "测量量 / 方法"],
			value: [
				"Contract volume, summing corrected executions by series",
				"按序列汇总更正后的执行张数",
			],
		},
		{
			id: "universe",
			label: ["Universe", "范围"],
			value: [
				"RHO calls expiring 2030-10-18, strikes 95/100/105",
				"RHO 2030-10-18 到期看涨，行权价 95/100/105",
			],
		},
		{
			id: "interval",
			label: ["Session / cutoff", "时段 / 截止"],
			value: [
				"2030-09-13, 09:30–16:00 America/New_York; complete-session cutoff",
				"2030-09-13，纽约时间 09:30–16:00；完整时段截止",
			],
		},
		{
			id: "evidence",
			label: ["Evidence requirements", "证据要求"],
			value: [
				"TAPE-R, corrected records and coverage for all three required series",
				"TAPE-R、更正记录及全部三个必需序列的覆盖",
			],
		},
		{
			id: "invalidation",
			label: ["Revision rule", "修订规则"],
			value: [
				"Missing required coverage withholds the full-universe leader; corrections require recomputation",
				"必需覆盖缺失时不发布完整范围领先者；更正后重新计算",
			],
		},
		{
			id: "outcome",
			label: ["Future outcome", "未来结果"],
			value: [
				"Positive next-session close-to-close underlying return",
				"下一时段标的收盘至收盘收益为正",
			],
		},
		{
			id: "horizon",
			label: ["Forecast horizon", "预测期限"],
			value: [
				"One subsequent trading session, measured after the input cutoff",
				"输入截止后的一个交易时段",
			],
		},
		{
			id: "evaluation",
			label: ["Held-out evaluation", "样本外评价"],
			value: [
				"Prespecify features and baseline, then test on an untouched later date block; no results supplied",
				"预先规定特征与基准，再测试未触碰的后续日期区间；未提供结果",
			],
		},
	],
	layers: [
		{ id: "observation", label: ["Observation", "观测"] },
		{ id: "calculation", label: ["Calculation", "计算"] },
		{ id: "interpretation", label: ["Interpretation", "解读"] },
		{ id: "contradiction", label: ["Contradiction", "反证"] },
		{ id: "unknown", label: ["Unknown", "未知"] },
	],
	cards: [
		{
			id: "row",
			label: ["Source row", "来源行"],
			statement: [
				"TAPE-R reports 800 contracts for series A in the declared session.",
				"TAPE-R 报告序列 A 在声明时段有 800 张。",
			],
			accepted: ["observation"],
			explanation: [
				"This states what the supplied source reports. Source coverage and corrections still matter.",
				"这是给定来源的报告内容；来源覆盖与更正仍重要。",
			],
		},
		{
			id: "share",
			label: ["Volume share", "成交占比"],
			statement: [
				"800 / 1,700 supplied contracts ≈ 47.06% of the declared sample.",
				"800 / 给定 1,700 张 ≈ 声明样本的 47.06%。",
			],
			accepted: ["calculation"],
			explanation: [
				"A derived percentage depends on its declared denominator. It is not a claim about unseen contracts.",
				"推导百分比依赖声明分母，不是对未见合约的结论。",
			],
		},
		{
			id: "story",
			label: ["Directional story", "方向叙事"],
			statement: [
				"This activity may reflect bullish positioning.",
				"此活动可能反映看涨持仓。",
			],
			accepted: ["interpretation"],
			explanation: [
				"This is a hypothesis about intent, not an observed position or a validated forecast.",
				"这是意图假设，不是已观测持仓或已验证预测。",
			],
		},
		{
			id: "correction",
			label: ["Corrected leader", "更正领先者"],
			statement: [
				"A corrected source gives A 650 and B 700, opposing the earlier claim that A leads.",
				"更正来源显示 A 650、B 700，与先前 A 领先的结论相反。",
			],
			accepted: ["contradiction", "observation"],
			explanation: [
				"The corrected counts are observations and also contradict the earlier leader claim. Evidence can have more than one role.",
				"更正张数是观测，也反驳先前领先者结论；证据可有多种作用。",
			],
		},
		{
			id: "gap",
			label: ["Missing series", "缺失序列"],
			statement: [
				"Required series C is absent from the supplied coverage report.",
				"必需序列 C 未出现在给定覆盖报告中。",
			],
			accepted: ["unknown", "observation"],
			explanation: [
				"Its volume is unknown, not zero. The report's absence is observable, but a full-universe leader is unsupported.",
				"其成交量未知，不是零。报告中的缺失可观测，但完整范围领先者不受支持。",
			],
		},
	],
	original: {
		identity,
		claim: [
			"Version 1: A leads the complete declared sample, 800 versus B 700 and C 200.",
			"版本 1：A 800、B 700、C 200，A 在完整声明样本领先。",
		],
		version: "TAPE-R v1",
	},
	revisions: [
		{
			id: "corrected",
			label: ["Corrected same-session print", "同日成交更正"],
			identity: { ...identity },
			evidence: [
				"TAPE-R v2 corrects A from 800 to 650; B 700 and C 200 are unchanged.",
				"TAPE-R v2 将 A 从 800 更正为 650，B 700、C 200 不变。",
			],
			claim: [
				"Recomputed: B leads this complete declared sample.",
				"重算后：B 在此完整声明样本领先。",
			],
			sourceVersion: "TAPE-R v2",
		},
		{
			id: "puts",
			label: ["Switch to puts after ranking", "排名后改看跌"],
			identity: {
				...identity,
				population: "puts · 2030-10-18 · strikes 95/100/105",
			},
			evidence: [
				"After viewing the call result, the proposal replaces calls with puts.",
				"看到看涨结果后，建议将看涨替换为看跌。",
			],
			claim: [
				"New population: retain Q1 and define Q2 before making a new comparison.",
				"新人群：保留 Q1，先声明 Q2 再进行新比较。",
			],
			sourceVersion: "TAPE-R · proposed put scope",
		},
		{
			id: "premium",
			label: ["Change volume to premium", "张数改权利金"],
			identity: {
				...identity,
				quantity: "session premium dollars",
				method: "sum corrected premium dollars by contract · TAPE-R",
			},
			evidence: [
				"The proposal ranks premium dollars instead of contract volume.",
				"建议按权利金美元排名，替代合约张数。",
			],
			claim: [
				"New quantity and method: preserve the old question and its result.",
				"新测量量与方法：保留原问题及结果。",
			],
			sourceVersion: "TAPE-R · proposed premium method",
		},
		{
			id: "coverage",
			label: ["Required coverage withdrawn", "必需覆盖撤回"],
			identity: { ...identity },
			evidence: [
				"The source now marks required series C incomplete.",
				"来源现将必需序列 C 标为不完整。",
			],
			claim: [
				"Same question, revised conclusion: the complete leader is unavailable.",
				"同一问题，修订结论：完整领先者不可用。",
			],
			sourceVersion: "TAPE-R v2 · coverage notice",
		},
	],
};
