import type { LearningCopy } from "@/domain/learning/types";

export const contractCopy = {
	replayNote: {
		en: "Synthetic, interpolated volume build-up. Prior-session data stays fixed; missing values stay missing. Questions use the 16:00 closing snapshot.",
		zh: "以模拟数据插值展示成交量累积。上一时段数据保持不变，缺失值仍为缺失。题目以 16:00 收盘快照为准。",
	},
	title: { en: "Contract neighborhood", zh: "合约邻域" },
	map: { en: "2D map", zh: "二维图" },
	three: { en: "3D + map", zh: "三维 + 二维图" },
	view: { en: "Neighborhood view", zh: "邻域视图" },
	visibility: { en: "Visible scope", zh: "显示范围" },
	all: { en: "All shown", zh: "显示全部" },
	scope: { en: "Declared scope", zh: "声明范围" },
	expiry: { en: "Expiry slice", zh: "到期切片" },
	allExpiries: { en: "All expiries", zh: "全部到期日" },
	days: { en: "days", zh: "天" },
	strike: { en: "Strike", zh: "行权价" },
	volume: { en: "Session volume (contracts)", zh: "时段成交量（张）" },
	comparable: { en: "Comparable", zh: "可比" },
	out_of_scope: { en: "Outside boundary", zh: "范围外" },
	stale: { en: "Prior-session data", zh: "上一时段数据" },
	missing: { en: "Missing volume", zh: "成交量缺失" },
	call: { en: "call", zh: "看涨" },
	select: {
		en: "Select a column or map cell to inspect its source and eligibility.",
		zh: "选择立柱或二维图单元格，检查来源与比较资格。",
	},
	filters: {
		en: "View filters keep the declared research boundary fixed.",
		zh: "显示筛选不会改变已声明的研究边界。",
	},
	empty: {
		en: "No contracts in this slice fall inside the declared scope.",
		zh: "当前切片中没有位于声明范围内的合约。",
	},
	controls: {
		en: "Drag to orbit · scroll or pinch to zoom · select a column to inspect",
		zh: "拖动旋转 · 滚动或双指缩放 · 选择立柱检查详情",
	},
	left: { en: "Turn left", zh: "向左旋转" },
	right: { en: "Turn right", zh: "向右旋转" },
	reset: { en: "Reset view", zh: "重置视角" },
	loading: { en: "Loading 3D…", zh: "正在加载三维视图…" },
	fallback: {
		en: "3D is unavailable on this device. The 2D map contains the same observations and keeps your selection.",
		zh: "此设备暂时无法显示三维视图。二维图包含相同的观测数据，并保留你的选择。",
	},
	legend: {
		en: "† prior-session data · × outside boundary · — missing (ring in 3D)",
		zh: "† 上一时段数据 · × 范围外 · — 缺失（三维图中为圆环）",
	},
} satisfies Record<string, LearningCopy>;
