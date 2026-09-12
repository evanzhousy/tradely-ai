import { gammaTerms, localDeltaChange } from "./local-greeks";

export type GammaSnapshot = {
	id: string;
	label: readonly [string, string];
	contract: string;
	option: "CALL" | "PUT";
	delta: number | null;
	gamma: number | null;
	dte: number;
};
export type GammaConceptData = {
	kind: "gamma";
	asOf: string;
	spotCents: number;
	options: readonly [GammaSnapshot, ...GammaSnapshot[]];
	moveRange: readonly [number, number];
	defaultMoveCents: number;
	quantity: number;
	multiplier: number;
	hedgeMoves: readonly [number, ...number[]];
	sensitivity: readonly [GammaSnapshot, ...GammaSnapshot[]];
	maximumShownGamma: number;
};
export function gammaApproximation(snapshot: GammaSnapshot, moveCents: number) {
	const terms = gammaTerms(snapshot.delta, snapshot.gamma, moveCents);
	if (!terms || snapshot.gamma === null || snapshot.gamma < 0)
		return {
			ok: false as const,
			issue: "missing-or-invalid" as const,
			terms: null,
		};
	const min = snapshot.option === "CALL" ? 0 : -1;
	const max = snapshot.option === "CALL" ? 1 : 0;
	if (
		snapshot.delta === null ||
		snapshot.delta < min ||
		snapshot.delta > max ||
		terms.nextDelta < min ||
		terms.nextDelta > max
	)
		return { ok: false as const, issue: "delta-bounds" as const, terms };
	return { ok: true as const, terms };
}
export function gammaHedge(
	snapshot: GammaSnapshot,
	moveCents: number,
	quantity: number,
	multiplier: number,
	side: "long" | "short",
	knownPosition: boolean,
	stage: number,
) {
	const approximation = gammaApproximation(snapshot, moveCents);
	if (!knownPosition || !approximation.ok) return null;
	const before = localDeltaChange(
		snapshot.delta,
		moveCents,
		quantity,
		multiplier,
		side,
	);
	const after = localDeltaChange(
		approximation.terms.nextDelta,
		moveCents,
		quantity,
		multiplier,
		side,
	);
	if (!before || !after || snapshot.gamma === null) return null;
	const initialHedge = -before.positionDelta;
	const targetHedge = -after.positionDelta;
	const optionDelta = stage === 0 ? before.positionDelta : after.positionDelta;
	const stock = stage < 2 ? initialHedge : targetHedge;
	return {
		optionDelta,
		stock,
		netDelta: optionDelta + stock,
		initialHedge,
		targetHedge,
		trade: targetHedge - initialHedge,
		positionGamma:
			snapshot.gamma * quantity * multiplier * (side === "long" ? 1 : -1),
	};
}
