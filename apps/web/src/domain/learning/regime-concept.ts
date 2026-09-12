type Copy = readonly [string, string];
export type RegimePoint = { spot: number; sensitivity: number | null };
export type RegimeConceptData = {
	kind: "gamma-regimes";
	symbol: string;
	asOf: string;
	portfolios: readonly {
		id: string;
		label: Copy;
		scope: Copy;
		components: readonly (number | null)[];
	}[];
	moves: readonly [number, ...number[]];
	moveRange: readonly [number, number];
	curves: readonly {
		id: string;
		label: Copy;
		scope: Copy;
		points: readonly RegimePoint[];
	}[];
	packet: {
		source: string;
		sensitivity: number;
		moveCents: number;
		fillShares: number;
		fillTime: string;
		askDepthShares: number;
		depthTime: string;
	};
};
export function regimeTotals(components: readonly (number | null)[]) {
	if (
		!components.length ||
		components.some((v) => v === null || !Number.isFinite(v))
	)
		return null;
	const net = components.reduce<number>((s, v) => s + (v as number), 0);
	const gross = components.reduce<number>(
		(s, v) => s + Math.abs(v as number),
		0,
	);
	return Number.isFinite(net) && Number.isFinite(gross) ? { net, gross } : null;
}
/** Aggregate sensitivity is shares of delta per dollar, already position-scaled. */
export function conditionalHedge(
	sensitivity: number | null,
	moveCents: number,
) {
	if (
		sensitivity === null ||
		!Number.isFinite(sensitivity) ||
		!Number.isFinite(moveCents)
	)
		return null;
	const deltaChange = (sensitivity * moveCents) / 100;
	return Number.isFinite(deltaChange)
		? { deltaChange, hedgeChange: -deltaChange }
		: null;
}
export type SampledFlip = {
	lower: number;
	upper: number;
	estimate: number;
	kind: "bracket" | "node";
};
/** Only adjacent known signs or an isolated zero with opposing known neighbors establish a sampled crossing. */
export function sampledFlips(points: readonly RegimePoint[]): SampledFlip[] {
	if (
		points.some(
			(p, i) =>
				!Number.isFinite(p.spot) ||
				p.spot <= 0 ||
				(i > 0 && p.spot <= points[i - 1].spot),
		)
	)
		return [];
	const known = (v: number | null): v is number =>
		v !== null && Number.isFinite(v);
	const opposite = (a: number, b: number) =>
		(a < 0 && b > 0) || (a > 0 && b < 0);
	const flips: SampledFlip[] = [];
	for (let i = 0; i < points.length; i++) {
		const a = points[i];
		if (!known(a.sensitivity)) continue;
		const b = points[i + 1];
		if (b && known(b.sensitivity) && opposite(a.sensitivity, b.sensitivity)) {
			const scale = Math.max(Math.abs(a.sensitivity), Math.abs(b.sensitivity));
			const weight = Math.abs(a.sensitivity) / scale;
			const fraction = weight / (weight + Math.abs(b.sensitivity) / scale);
			const estimate = a.spot + (b.spot - a.spot) * fraction;
			flips.push({ lower: a.spot, upper: b.spot, estimate, kind: "bracket" });
		}
		const prev = points[i - 1];
		if (
			a.sensitivity === 0 &&
			prev &&
			b &&
			known(prev.sensitivity) &&
			known(b.sensitivity) &&
			opposite(prev.sensitivity, b.sensitivity)
		)
			flips.push({
				lower: a.spot,
				upper: a.spot,
				estimate: a.spot,
				kind: "node",
			});
	}
	return flips;
}
