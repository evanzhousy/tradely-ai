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
