import type { LearningCopy } from "@/domain/learning/types";

/** Public introductions and renderer capabilities; no case data or answer keys. */
export const learningRollout: Readonly<
	Record<
		string,
		{
			presentation: "supplemental" | "primary";
			three: boolean;
			title: LearningCopy;
			intro: LearningCopy;
		}
	>
> = {
	"audited-boundary": {
		presentation: "supplemental",
		three: false,
		title: { en: "Build a research boundary.", zh: "建立研究范围。" },
		intro: {
			en: "Choose a question, set invalidation, and test a changed handoff.",
			zh: "选择问题、设定失效规则，并检验变化的交接。",
		},
	},
	"symbol-universe": {
		presentation: "supplemental",
		three: false,
		title: { en: "Decide who can compete.", zh: "决定比较资格。" },
		intro: {
			en: "Test eligibility, missingness, and the comparison denominator.",
			zh: "检验资格、缺失和比较对象数。",
		},
	},
	"rank-symbols": {
		presentation: "supplemental",
		three: false,
		title: {
			en: "Watch rank change without new volume.",
			zh: "观察成交量未变时的排名变化。",
		},
		intro: {
			en: "Change the peers while holding a focal observation fixed.",
			zh: "固定目标观测，改变同组数据。",
		},
	},
	"symbol-drawer": {
		presentation: "supplemental",
		three: false,
		title: {
			en: "Audit the drawer before interpreting it.",
			zh: "先审核抽屉，再解读。",
		},
		intro: {
			en: "Inspect source clocks and make a bounded intake decision.",
			zh: "检查来源时间，作出有边界的输入决策。",
		},
	},
	"dex-dei-gex": {
		presentation: "supplemental",
		three: true,
		title: {
			en: "Separate direction, magnitude, and structure.",
			zh: "区分方向、幅度与结构。",
		},
		intro: {
			en: "Test normalization and compare signed GEX distributions with the same total.",
			zh: "检验归一化，比较总和相同的带符号 GEX 分布。",
		},
	},
	"cookbook-research-packet": {
		presentation: "supplemental",
		three: false,
		title: { en: "Assemble a rerunnable packet.", zh: "组装可重跑研究包。" },
		intro: {
			en: "Select fixed inputs, replay parameters, and a versioned handoff.",
			zh: "选择固定输入、回放参数和版本化交接。",
		},
	},
	"market-recap": {
		presentation: "supplemental",
		three: false,
		title: { en: "Attach evidence to the headline.", zh: "为标题附上证据。" },
		intro: {
			en: "Choose the supporting chart and keep its caveats visible.",
			zh: "选择支持图表并保留可见限制。",
		},
	},
	"audit-market-recap": {
		presentation: "supplemental",
		three: false,
		title: { en: "Repair an unsupported recap.", zh: "修复缺乏支持的复盘。" },
		intro: {
			en: "Trace sources, inspect a scope change, and sign off with a boundary.",
			zh: "追溯来源、检查范围变化，并作出有边界的签字。",
		},
	},

	"validate-option-print": {
		presentation: "supplemental",
		three: false,
		title: {
			en: "Read the print. Test the claim.",
			zh: "阅读成交，检验证据。",
		},
		intro: {
			en: "Make an initial judgment, inspect the evidence, then apply the method to a different execution.",
			zh: "先作出初步判断，再检查证据，最后将方法应用于另一笔成交。",
		},
	},
	"rank-contracts": {
		presentation: "supplemental",
		three: true,
		title: { en: "Explore the contract neighborhood.", zh: "探索合约邻域。" },
		intro: {
			en: "Compare strikes, expirations, and session volume. Find a valid candidate while keeping your research boundary fixed.",
			zh: "比较行权价、到期日与时段成交量，在保持研究边界不变的前提下找到有效候选。",
		},
	},
	"session-flow-vs-structure": {
		presentation: "supplemental",
		three: false,
		title: {
			en: "Keep flow and structure on their own clocks.",
			zh: "让成交与结构各守其时钟。",
		},
		intro: {
			en: "Replay session volume, inspect dated position reports, then test a new comparison without inventing live positions.",
			zh: "回放时段成交量，检查带日期的持仓报告，再检验另一组比较，避免虚构实时持仓。",
		},
	},
};
