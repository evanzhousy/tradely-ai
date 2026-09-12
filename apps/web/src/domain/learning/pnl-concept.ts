import { signedPositionUnits } from "./local-greeks";

type Copy = readonly [string, string];
export type StockLot = {
	id: string;
	openedAt: string;
	quantity: number;
	priceCents: number;
	feeCents: number | null;
};
export type StockClose = {
	at: string;
	quantity: number;
	priceCents: number;
	feeCents: number | null;
};
export type StockCase = {
	id: string;
	label: Copy;
	lots: readonly StockLot[];
	close: StockClose;
	initialMark: number;
	closeMark: number;
	finalMark: number;
	markAt: string;
};
export type PnlConceptData = {
	kind: "portfolio-pnl";
	source: string;
	stockCases: readonly StockCase[];
	account: {
		asOf: string;
		cashCents: number;
		reportedBuyingPowerCents: number;
		realizedCents: number;
		stockQuantity: number;
		stockCost: number;
		stockMark: number;
		optionQuantity: number;
		optionCost: number;
		optionMark: number;
		optionMultiplier: number;
		optionSpot: number;
	};
	option: {
		asOf: string;
		quantity: number;
		multiplier: number;
		entryCents: number;
		markCents: number;
		underlyingCents: number;
	};
};
const nonnegative = (v: number) => Number.isFinite(v) && v >= 0;
const sumKnown = (values: readonly (number | null)[]) =>
	values.some((v) => v === null)
		? null
		: values.reduce<number>((s, v) => s + (v as number), 0);
export function stockAccounting(
	lots: readonly StockLot[],
	close: StockClose,
	mark: number | null,
	method: "fifo" | "average",
	fees: boolean,
) {
	const ordered = [...lots].sort(
		(a, b) =>
			Date.parse(a.openedAt) - Date.parse(b.openedAt) ||
			a.id.localeCompare(b.id),
	);
	const quantity = ordered.reduce((s, l) => s + l.quantity, 0);
	if (
		!lots.length ||
		new Set(lots.map((l) => l.id)).size !== lots.length ||
		!Number.isSafeInteger(close.quantity) ||
		close.quantity < 0 ||
		close.quantity > quantity ||
		!nonnegative(close.priceCents) ||
		!Number.isFinite(Date.parse(close.at)) ||
		lots.some(
			(l) =>
				!Number.isSafeInteger(l.quantity) ||
				l.quantity <= 0 ||
				!nonnegative(l.priceCents) ||
				!Number.isFinite(Date.parse(l.openedAt)) ||
				Date.parse(l.openedAt) > Date.parse(close.at),
		)
	)
		return null;
	let toMatch = close.quantity;
	const matched = ordered.map((l) => {
		const q =
			method === "average"
				? (l.quantity * close.quantity) / quantity
				: Math.min(toMatch, l.quantity);
		if (method === "fifo") toMatch -= q;
		return { ...l, closed: q, remaining: l.quantity - q };
	});
	const basis = (remaining: boolean, withFees: boolean) =>
		sumKnown(
			matched.map((l) => {
				const q = remaining ? l.remaining : l.closed;
				if (q === 0) return 0;
				if (withFees && (l.feeCents === null || !nonnegative(l.feeCents)))
					return null;
				return (
					q * l.priceCents +
					(withFees ? ((l.feeCents as number) * q) / l.quantity : 0)
				);
			}),
		);
	const closedGross = basis(false, false);
	const openGross = basis(true, false);
	const closedCost = basis(false, fees);
	const openCost = basis(true, fees);
	const saleFee =
		!fees || close.quantity === 0
			? 0
			: close.feeCents !== null && nonnegative(close.feeCents)
				? close.feeCents
				: null;
	const remaining = quantity - close.quantity;
	const value =
		remaining === 0
			? 0
			: mark !== null && nonnegative(mark)
				? remaining * mark
				: null;
	const proceeds = close.quantity * close.priceCents;
	const realized =
		closedCost !== null && saleFee !== null
			? proceeds - closedCost - saleFee
			: null;
	const unrealized =
		value !== null && openCost !== null ? value - openCost : null;
	if (
		[
			quantity,
			remaining,
			proceeds,
			closedGross,
			openGross,
			closedCost,
			openCost,
			value,
			realized,
			unrealized,
		].some((v) => v !== null && !Number.isFinite(v))
	)
		return null;
	return {
		quantity,
		remaining,
		matched,
		value,
		closedCost,
		openCost,
		realized,
		unrealized,
		total:
			realized !== null && unrealized !== null ? realized + unrealized : null,
		grossRealized: closedGross === null ? null : proceeds - closedGross,
		grossUnrealized:
			value !== null && openGross !== null ? value - openGross : null,
	};
}
export function optionValuation(
	quantity: number,
	multiplier: number,
	side: "long" | "short",
	entry: number,
	mark: number | null,
	spot: number,
) {
	const units = signedPositionUnits(quantity, multiplier, side);
	if (units === null || !nonnegative(entry) || !nonnegative(spot)) return null;
	const value =
		units === 0 ? 0 : mark !== null && nonnegative(mark) ? units * mark : null;
	const result = {
		units,
		openingCash: -units * entry,
		value,
		unrealized: value === null ? null : value - units * entry,
		notional: Math.abs(units) * spot,
	};
	return Object.values(result).some((v) => v !== null && !Number.isFinite(v))
		? null
		: result;
}
export function markedAccount(
	data: PnlConceptData["account"],
	deposit: number,
	stockMark: number | null,
	optionMark: number | null,
) {
	if (
		!nonnegative(deposit) ||
		![data.cashCents, data.realizedCents].every(Number.isFinite) ||
		![
			data.stockQuantity,
			data.stockCost,
			data.optionQuantity,
			data.optionCost,
			data.optionMultiplier,
		].every(nonnegative) ||
		!Number.isInteger(data.optionQuantity) ||
		data.optionMultiplier <= 0
	)
		return null;
	const cash = data.cashCents + deposit;
	const stock =
		data.stockQuantity === 0
			? 0
			: stockMark !== null && nonnegative(stockMark)
				? data.stockQuantity * stockMark
				: null;
	const option =
		data.optionQuantity === 0
			? 0
			: optionMark !== null && nonnegative(optionMark)
				? data.optionQuantity * data.optionMultiplier * optionMark
				: null;
	const equity =
		stock !== null && option !== null ? cash + stock + option : null;
	const unrealized =
		stock !== null && option !== null
			? stock -
				data.stockQuantity * data.stockCost +
				option -
				data.optionQuantity * data.optionMultiplier * data.optionCost
			: null;
	const result = {
		cash,
		stock,
		option,
		equity,
		unrealized,
		totalPnl: unrealized === null ? null : data.realizedCents + unrealized,
	};
	return Object.values(result).some(
		(value) => value !== null && !Number.isFinite(value),
	)
		? null
		: result;
}
