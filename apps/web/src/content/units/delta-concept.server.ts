import "@tanstack/react-start/server-only";
import type { DeltaConceptData } from "@/domain/learning/delta-concept";

export const deltaConceptData: DeltaConceptData = {
	kind: "delta",
	asOf: "2030-09-06 10:00 ET",
	underlying: "SIGMA illustrative equity",
	spotCents: 10000,
	options: [
		{
			id: "call",
			label: ["Call · delta +0.50", "看涨 · Delta +0.50"],
			contract: "SIGMA 2030-10-18 $100 CALL",
			priceCents: 400,
			delta: 0.5,
		},
		{
			id: "put",
			label: ["Put · delta −0.40", "看跌 · Delta −0.40"],
			contract: "SIGMA 2030-10-18 $95 PUT",
			priceCents: 250,
			delta: -0.4,
		},
	],
	localMoveRange: [-100, 100],
	defaultMoveCents: 40,
	localPriceRange: [150, 500],
	defaultQuantity: 2,
	quantityMax: 5,
	multipliers: [100, 10],
	positionMoveCents: 40,
	curve: {
		priceCents: 400,
		delta: 0.5,
		gammaPerDollar: 0.04,
		moveRange: [-800, 800],
		priceRange: [0, 1000],
		frames: [0, 40, 200, 400, 800],
	},
};
