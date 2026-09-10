import type { Locale } from "@/i18n/messages";

export const platformWidgetCopy = {
	progress: { en: "Learning checkpoints", zh: "学习检查点" },
	sample: { en: "Interactive example", zh: "互动示例" },
	progressHint: {
		en: "Try the checklist to update this preview.",
		zh: "勾选检查清单，看看进度如何变化。",
	},
	completed: {
		en: "{completed} of {total} checked",
		zh: "已勾选 {completed}/{total} 项",
	},
	remaining: { en: "{count} remaining", zh: "剩余 {count} 项" },
	checklist: { en: "Evidence checklist", zh: "证据检查清单" },
	source: { en: "Inspect the source", zh: "检查数据来源" },
	comparison: { en: "Check the comparison", zh: "核对比较范围" },
	conclusion: { en: "Explain the conclusion", zh: "解释判断理由" },
	sourceShort: { en: "Source", zh: "来源" },
	comparisonShort: { en: "Compare", zh: "比较" },
	conclusionShort: { en: "Explain", zh: "解释" },
	reset: { en: "Reset example", zh: "重置示例" },
	notSaved: {
		en: "Example only · your course progress is unchanged.",
		zh: "仅为示例 · 不会更改你的课程进度。",
	},
	note: { en: "A note on your reasoning", zh: "给你的推理留个批注" },
} satisfies Record<string, Record<Locale, string>>;

export const sampleCheckpoints = [
	{ id: "source", label: "source", shortLabel: "sourceShort" },
	{ id: "comparison", label: "comparison", shortLabel: "comparisonShort" },
	{ id: "conclusion", label: "conclusion", shortLabel: "conclusionShort" },
] as const;
export type SampleCheckpointId = (typeof sampleCheckpoints)[number]["id"];
export const initialSampleCheckpoints: readonly SampleCheckpointId[] = [
	"source",
	"comparison",
];
