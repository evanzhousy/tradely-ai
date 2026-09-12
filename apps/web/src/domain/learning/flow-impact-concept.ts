type Copy = readonly [string, string];
export type FlowClass = "bullish" | "bearish" | "neutral";
export type FlowPrint = {
	id: string;
	delta: number | null;
	contracts: number;
	multiplier: number;
	premium: number | null;
	classification: FlowClass;
};
export type VolumeReference = {
	id: string;
	label: Copy;
	kind: "shares" | "proxy";
	volume: number | null;
	scale: number | null;
	method: string | null;
};
export type FlowImpactConceptData = {
	kind: "dex-dei-gex";
	symbol: string;
	session: string;
	convention: Copy;
	prints: readonly [FlowPrint, ...FlowPrint[]];
	contractRange: readonly [number, number];
	contractFrames: readonly [number, ...number[]];
	volumeRange: readonly [number, number];
	references: readonly [VolumeReference, ...VolumeReference[]];
	gex: {
		value: number;
		unit: Copy;
		source: string;
		asOf: string;
		convention: Copy;
	};
	oi: { magnitude: number; source: string; asOf: string };
};
const nonnegative = (n: number | null): n is number =>
	n !== null && Number.isFinite(n) && n >= 0;
export function tradeMagnitude(print: FlowPrint) {
	if (
		print.delta === null ||
		!Number.isFinite(print.delta) ||
		Math.abs(print.delta) > 1 ||
		!Number.isInteger(print.contracts) ||
		print.contracts < 0 ||
		!Number.isFinite(print.multiplier) ||
		print.multiplier <= 0
	)
		return null;
	const value = Math.abs(print.delta) * print.contracts * print.multiplier;
	return Number.isFinite(value) ? value : null;
}
export function summarizeFlow(prints: readonly FlowPrint[]) {
	const magnitudes = prints.map(tradeMagnitude);
	const valid = prints.length > 0 && magnitudes.every((n) => n !== null);
	const sign = (p: FlowPrint) =>
		p.classification === "bullish"
			? 1
			: p.classification === "bearish"
				? -1
				: 0;
	const net = valid
		? prints.reduce((sum, p, i) => sum + sign(p) * (magnitudes[i] as number), 0)
		: null;
	const gross = valid
		? magnitudes.reduce<number>((sum, n) => sum + (n as number), 0)
		: null;
	const neutral = valid
		? prints.reduce(
				(sum, p, i) =>
					sum +
					(p.classification === "neutral" ? (magnitudes[i] as number) : 0),
				0,
			)
		: null;
	const directional = prints.filter((p) => p.classification !== "neutral");
	const premium =
		prints.length && directional.every((p) => nonnegative(p.premium))
			? directional.reduce((sum, p) => sum + sign(p) * (p.premium as number), 0)
			: null;
	const finite = (n: number | null) =>
		n !== null && Number.isFinite(n) ? n : null;
	return {
		net: finite(net),
		gross: finite(gross),
		neutral: finite(neutral),
		premium: finite(premium),
	};
}
export function effectiveVolume(reference: VolumeReference) {
	if (!nonnegative(reference.volume) || reference.volume === 0) return null;
	if (reference.kind === "shares") return reference.volume;
	if (
		!nonnegative(reference.scale) ||
		reference.scale === 0 ||
		!reference.method?.trim()
	)
		return null;
	const value = reference.volume * reference.scale;
	return Number.isFinite(value) && value > 0 ? value : null;
}
/** This lesson's DEI requires classified tape flow, not an OI or GEX substitute. */
export function flowImpact(
	net: number | null,
	reference: VolumeReference,
	lineage: "tape" | "oi" | "gex" = "tape",
) {
	const denominator = effectiveVolume(reference);
	if (
		lineage !== "tape" ||
		net === null ||
		!Number.isFinite(net) ||
		denominator === null
	)
		return null;
	const value = (Math.abs(net) / denominator) * 100;
	return Number.isFinite(value) ? value : null;
}
