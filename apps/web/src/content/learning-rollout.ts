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
};
