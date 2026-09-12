import "@tanstack/react-start/server-only";
import type { PnlConceptData } from "@/domain/learning/pnl-concept";
export const pnlConceptData: PnlConceptData = {
	kind: "portfolio-pnl",
	source: "PNL-SIGMA-R · independent synthetic accounting examples",
	stockCases: [
		{
			id: "single",
			label: ["One stock lot", "一笔股票批次"],
			lots: [
				{
					id: "L1",
					openedAt: "2030-09-10T14:00:00Z",
					quantity: 100,
					priceCents: 2000,
					feeCents: 500,
				},
			],
			close: {
				at: "2030-09-13T14:00:00Z",
				quantity: 40,
				priceCents: 2300,
				feeCents: 300,
			},
			initialMark: 2000,
			closeMark: 2300,
			finalMark: 2200,
			markAt: "2030-09-13 20:00 UTC",
		},
		{
			id: "two",
			label: ["Two lots · compare cost matching", "两笔批次 · 比较成本匹配"],
			lots: [
				{
					id: "L1",
					openedAt: "2030-09-10T14:00:00Z",
					quantity: 100,
					priceCents: 2000,
					feeCents: 500,
				},
				{
					id: "L2",
					openedAt: "2030-09-12T14:00:00Z",
					quantity: 100,
					priceCents: 3000,
					feeCents: 500,
				},
			],
			close: {
				at: "2030-09-13T14:00:00Z",
				quantity: 100,
				priceCents: 3500,
				feeCents: 500,
			},
			initialMark: 3000,
			closeMark: 3500,
			finalMark: 2800,
			markAt: "2030-09-13 20:00 UTC",
		},
	],
	account: {
		asOf: "2030-09-13 20:00 UTC · provided post-trade snapshot",
		cashCents: 52000,
		reportedBuyingPowerCents: 400000,
		realizedCents: 12000,
		stockQuantity: 60,
		stockCost: 2000,
		stockMark: 2200,
		optionQuantity: 2,
		optionCost: 200,
		optionMark: 250,
		optionMultiplier: 100,
		optionSpot: 10000,
	},
	option: {
		asOf: "2030-09-13 · standalone call position, no stock hedge, fees excluded",
		quantity: 2,
		multiplier: 100,
		entryCents: 200,
		markCents: 300,
		underlyingCents: 10000,
	},
};
