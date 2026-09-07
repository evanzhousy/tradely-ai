import "@tanstack/react-start/server-only";
import type { NeighborhoodPair } from "@/domain/learning/contracts";
import { copy, fact, question, step } from "./authoring.server";

function pair(independent: boolean, alternate: boolean): NeighborhoodPair {
	const spot = independent ? (alternate ? 108 : 98) : 100;
	const strikes = independent ? [100, 105, 110] : [95, 100, 105];
	const concentrated = [0, 0, 0, 0, 3000, 0, 0, 0, 0];
	const distributed = [500, 800, 500, 800, 3000, 800, 500, 800, 500];
	const profiles = alternate
		? [distributed, concentrated]
		: [concentrated, distributed];
	return {
		id:
			"neighborhood-shape-" +
			(independent ? "independent" : "guided") +
			(alternate ? "-b" : "-a"),
		cases: profiles.map((volumes, index) => ({
			label: copy(
				index === 0 ? "Case A" : "Case B",
				index === 0 ? "案例 A" : "案例 B",
			),
			data: {
				id: `shape-${spot}-${index}-${alternate}`,
				symbol: independent ? "BETA" : "ALFA",
				spot,
				asOf: copy(
					"Synthetic closing snapshot · 16:00 ET",
					"模拟收盘快照 · 16:00 ET",
				),
				scope: {
					minStrike: strikes[0],
					maxStrike: strikes[2],
					minDays: 14,
					maxDays: 60,
				},
				contracts: [14, 30, 60].flatMap((days, row) =>
					strikes.map((strike, column) => ({
						id: `shape-${strike}-${days}`,
						strike,
						days,
						volume: volumes[row * 3 + column],
						fresh: true,
					})),
				),
			},
		})),
	};
}

export function neighborhoodComparisonStep(
	independent: boolean,
	alternate = false,
) {
	const strike = independent ? 105 : 100;
	return step({
		id: independent ? "shape-independent" : "shape-guided",
		kind: independent ? "independent" : "guided",
		title: copy("Same peak, different neighborhood", "相同峰值，不同邻域"),
		brief: copy(
			"Switch between two closing snapshots. Each peaks at 3,000 contracts, but the surrounding activity differs. Inspect a strike and expiry slice, then describe the evidence without inferring a strategy.",
			"切换两份收盘快照。峰值均为 3,000 张，但周围成交分布不同。检查行权价和到期切片，再描述证据，不推断交易策略。",
		),
		neighborhoodPair: pair(independent, alternate),
		facts: [
			fact(
				"Question",
				"问题",
				"Compare the same call-contract universe and session. Spot is a fixed reference; this is not a repricing simulation.",
				"比较同一看涨合约范围与时段。现价为固定参考，不是重新定价模拟。",
			),
		],
		questions: [
			question(
				"breadth",
				"Which case shows activity across neighboring strikes and expiries?",
				"哪个案例在相邻行权价和到期日均有成交？",
				[
					["a", "Case A", "案例 A"],
					["b", "Case B", "案例 B"],
					[
						"same",
						"The peaks match, so the neighborhoods are identical.",
						"峰值相同，邻域也相同。",
					],
				],
				alternate ? "a" : "b",
				"The surrounding nonzero observations establish broader activity. The identical peak alone hides that difference; neither pattern proves common ownership or intent.",
				"周围的非零观测证明成交分布更广。相同峰值会掩盖这一差异；两种模式均不能证明共同持有人或意图。",
			),
			question(
				"moneyness",
				`Relative to the fixed spot, the ${strike} call is…`,
				`相对于固定现价，${strike} 看涨期权属于……`,
				[
					["itm", "In the money: strike below spot.", "实值：行权价低于现价。"],
					[
						"atm",
						"At the money: strike equals spot.",
						"平值：行权价等于现价。",
					],
					[
						"otm",
						"Out of the money: strike above spot.",
						"虚值：行权价高于现价。",
					],
				],
				independent ? (alternate ? "itm" : "otm") : "atm",
				"For these calls, compare strike with the stated spot reference. Moneyness describes the contract, not a future price forecast.",
				"对这些看涨期权，比较行权价与给定现价即可。价内外状态描述合约，不预测未来价格。",
			),
		],
	});
}
