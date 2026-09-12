import "@tanstack/react-start/server-only";
import type { RegimeConceptData } from "@/domain/learning/regime-concept";

const points = (values: readonly (number | null)[]) =>
	[90, 95, 100, 105, 110].map((spot, i) => ({ spot, sensitivity: values[i] }));
export const regimeConceptData: RegimeConceptData = {
	kind: "gamma-regimes",
	symbol: "NU",
	asOf: "2030-09-13 · fixed teaching snapshot",
	portfolios: [
		{
			id: "long",
			label: ["Long gamma · stated portfolio", "正 Gamma · 给定组合"],
			scope: [
				"Portfolio A · both supplied expiries",
				"组合 A · 两个给定到期日",
			],
			components: [600, -400],
		},
		{
			id: "short",
			label: ["Short gamma · stated portfolio", "负 Gamma · 给定组合"],
			scope: [
				"Portfolio B · both supplied expiries",
				"组合 B · 两个给定到期日",
			],
			components: [400, -600],
		},
		{
			id: "balanced",
			label: ["Near-zero net · large gross", "净值近零 · 总幅度大"],
			scope: [
				"Portfolio C · both supplied expiries",
				"组合 C · 两个给定到期日",
			],
			components: [500, -495],
		},
		{
			id: "missing",
			label: ["Missing position sensitivity", "持仓敏感度缺失"],
			scope: [
				"Portfolio D · incomplete supplied positions",
				"组合 D · 给定持仓不完整",
			],
			components: [400, null],
		},
	],
	moves: [50, 100, 0, -50, -100],
	moveRange: [-100, 100],
	curves: [
		{
			id: "a",
			label: ["Position set A · both expiries", "持仓集 A · 两个到期日"],
			scope: [
				"Fixed assumed positions A; both expiries repriced",
				"固定假设持仓 A；两个到期日重定价",
			],
			points: points([-300, -100, 100, 250, 400]),
		},
		{
			id: "b",
			label: ["Position set B · both expiries", "持仓集 B · 两个到期日"],
			scope: [
				"Changed assumed positions B; same observation date",
				"改变假设持仓 B；观测日期相同",
			],
			points: points([-400, -250, -100, 50, 200]),
		},
		{
			id: "near",
			label: ["Position set A · near expiry only", "持仓集 A · 仅近到期"],
			scope: ["Only the near expiry is included", "仅纳入近到期日"],
			points: points([50, 100, 150, 200, 250]),
		},
		{
			id: "gap",
			label: ["A · missing spot sample", "A · 缺少现价样本"],
			scope: ["A sample at spot 95 is unavailable", "现价 95 的样本不可用"],
			points: points([-300, null, 100, 250, 400]),
		},
	],
	packet: {
		source: "REGIME-PACKET-NU · synthetic portfolio and records",
		sensitivity: -200,
		moveCents: 50,
		fillShares: 100,
		fillTime: "2030-09-13 14:30:01 UTC",
		askDepthShares: 500,
		depthTime: "2030-09-13 14:30:00 UTC",
	},
};
