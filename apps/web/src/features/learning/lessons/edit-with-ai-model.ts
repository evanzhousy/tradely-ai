import type { Copy } from "@/content/world";

/** The recap blocks, prompts and edits the Edit with AI lesson teaches with, shared by its film and its playground. */

/** The recap's blocks as a draft shows them; chapter titles stay as the report prints them. */
export type BlockId = "title" | "tone" | "money" | "gex" | "spotlight";
export const BLOCKS: readonly { id: BlockId; label: Copy }[] = [
	{ id: "title", label: ["Title and description", "标题与说明"] },
	{ id: "tone", label: ["Market tone", "Market tone"] },
	{ id: "money", label: ["Where the money went", "Where the money went"] },
	{ id: "gex", label: ["Index GEX", "Index GEX"] },
	{ id: "spotlight", label: ["Spotlight", "Spotlight"] },
];

export type Status =
	| "unknown"
	| "recheck"
	| "review"
	| "confirm"
	| "changed"
	| "removed"
	| "same";
export const STATUS: Record<Status, Copy> = {
	unknown: ["?", "?"],
	recheck: ["re-check: may have changed", "重新检查：可能已改动"],
	review: ["review the change", "审阅这处修改"],
	confirm: ["confirm unchanged", "确认没有改动"],
	changed: ["changed", "已修改"],
	removed: ["removed", "已删除"],
	same: ["unchanged", "未改动"],
};
export const FOCUS: ReadonlySet<Status> = new Set([
	"recheck",
	"review",
	"changed",
]);

export type PromptId = "vague" | "bounded" | "subjective";

export const PROMPTS: Record<PromptId, Copy> = {
	vague: ["Make this an ALFA report.", "把它改成一份 ALFA 报告。"],
	bounded: [
		"Keep every existing chapter. Change Spotlight so the reader can choose a symbol, with ALFA as the default. Keep Market tone and Index GEX unchanged.",
		"保留所有现有章节。修改 Spotlight，让读者可以选择标的，默认 ALFA。Market tone 和 Index GEX 保持不变。",
	],
	subjective: ["Make it smarter.", "让它更聪明一点。"],
};
export const PROMPT_IDS = Object.keys(PROMPTS) as PromptId[];

export const FIRST_EDIT: Copy = [
	"Change Spotlight so the reader can choose a symbol, with ALFA as the default.",
	"修改 Spotlight，让读者可以选择标的，默认 ALFA。",
];
export const SECOND_EDIT: Copy = [
	"Keep everything else unchanged. Change only Spotlight so the reader can choose a symbol, with ALFA as the default. Do not remove any existing blocks.",
	"其他一切保持不变。只修改 Spotlight，让读者可以选择标的，默认 ALFA。不要删除任何已有区块。",
];
