import "@tanstack/react-start/server-only";
import type { ExecutionConceptData } from "@/domain/learning/execution-concept";

export const executionConceptData: ExecutionConceptData = {
	kind: "execution-counterparties",
	contractBase: "BETA 2030-07-19 $60",
	asOf: "2030-06-03 · 10:35:00 ET",
	printedAt: "10:35:01 ET",
	bids: [
		{ price: 200, size: 30 },
		{ price: 195, size: 20 },
		{ price: 185, size: 40 },
	],
	asks: [
		{ price: 210, size: 30 },
		{ price: 215, size: 20 },
		{ price: 225, size: 40 },
	],
	unitTradeSize: 10,
	defaultQuantity: 40,
	maxQuantity: 100,
	buyLimitRange: [200, 230],
	sellLimitRange: [180, 210],
	printId: "X-601",
	records: [
		{ id: "A", instruction: "limit", limit: 210 },
		{ id: "B", instruction: "market", limit: null },
	],
};
