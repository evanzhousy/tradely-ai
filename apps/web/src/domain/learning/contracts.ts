import type { LearningCopy } from "./types";

export type NeighborhoodContract = {
	id: string;
	strike: number;
	days: number;
	volume: number | null;
	fresh: boolean;
};
export type ContractNeighborhood = {
	id: string;
	symbol: string;
	asOf: LearningCopy;
	scope: {
		minDays: number;
		maxDays: number;
		minStrike: number;
		maxStrike: number;
	};
	contracts: NeighborhoodContract[];
	replay?: {
		durationMs: number;
		openMinute: number;
		closeMinute: number;
		frames: Array<{ position: number; volumes: Record<string, number | null> }>;
	};
};
export type ContractViewState = {
	selectedId: string | null;
	scopeOnly: boolean;
	expiry: number | null;
	replay?: ReplayClock;
};
export type ReplayClock = {
	position: number;
	startedAt: number;
	playing: boolean;
	rate: number;
	stepOnly: boolean;
};
export type ContractStatus =
	| "comparable"
	| "out_of_scope"
	| "stale"
	| "missing";

export function inContractScope(
	data: ContractNeighborhood,
	contract: NeighborhoodContract,
) {
	return (
		contract.days >= data.scope.minDays &&
		contract.days <= data.scope.maxDays &&
		contract.strike >= data.scope.minStrike &&
		contract.strike <= data.scope.maxStrike
	);
}

export function contractStatus(
	data: ContractNeighborhood,
	contract: NeighborhoodContract,
): ContractStatus {
	if (!inContractScope(data, contract)) return "out_of_scope";
	if (contract.volume === null) return "missing";
	return contract.fresh ? "comparable" : "stale";
}

export function visibleContracts(
	data: ContractNeighborhood,
	state: ContractViewState,
) {
	return data.contracts.filter(
		(contract) =>
			(!state.scopeOnly || inContractScope(data, contract)) &&
			(state.expiry === null || state.expiry === contract.days),
	);
}

/** Numeric axes and volume scale stay fixed as view filters change. */
export function contractLayout(data: ContractNeighborhood) {
	const strikes = [
		...new Set(data.contracts.map((contract) => contract.strike)),
	].sort((a, b) => a - b);
	const expiries = [
		...new Set(data.contracts.map((contract) => contract.days)),
	].sort((a, b) => a - b);
	const maximum = Math.max(
		1,
		...data.contracts.map((contract) => contract.volume ?? 0),
	);
	const magnitude = 10 ** Math.floor(Math.log10(maximum));
	const volumeMax = Math.ceil(maximum / magnitude) * magnitude;
	const minStrike = strikes[0] ?? 0;
	const maxStrike = strikes.at(-1) ?? minStrike;
	const minDays = expiries[0] ?? 0;
	const maxDays = expiries.at(-1) ?? minDays;
	const x = (strike: number) =>
		((strike - minStrike) / (maxStrike - minStrike || 1)) * 4.2;
	const z = (days: number) => ((days - minDays) / (maxDays - minDays || 1)) * 6;
	const y = (volume: number) => (volume / volumeMax) * 5;
	return { strikes, expiries, volumeMax, x, y, z };
}
