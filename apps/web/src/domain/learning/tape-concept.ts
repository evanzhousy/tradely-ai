export type TapePrint = {
	id: string;
	contract: string;
	option: "CALL" | "PUT";
	unit: "USD/share" | "USD/point";
	price: number;
	quantity: number;
	multiplier: number | null;
	executionAt: string;
};
export type TapeGroupIssue =
	| "empty"
	| "duplicate"
	| "contract"
	| "unit"
	| "multiplier"
	| "invalid";
export type TapeAggregate =
	| { ok: false; issue: TapeGroupIssue }
	| {
			ok: true;
			count: number;
			quantity: number;
			premium: number | null;
			weightedPrice: number;
			meanPrice: number;
	  };
/** Prices are cents in one consistent quote unit. Group only the explicitly selected unique executions. */
export function aggregateTape(prints: readonly TapePrint[]): TapeAggregate {
	if (!prints.length) return { ok: false, issue: "empty" };
	if (new Set(prints.map((p) => p.id)).size !== prints.length)
		return { ok: false, issue: "duplicate" };
	const first = prints[0];
	if (prints.some((p) => p.contract !== first.contract))
		return { ok: false, issue: "contract" };
	if (prints.some((p) => p.unit !== first.unit))
		return { ok: false, issue: "unit" };
	const multipliers = prints
		.map((p) => p.multiplier)
		.filter((m): m is number => m !== null);
	if (new Set(multipliers).size > 1) return { ok: false, issue: "multiplier" };
	if (
		prints.some(
			(p) =>
				!Number.isInteger(p.quantity) ||
				p.quantity <= 0 ||
				!Number.isFinite(p.price) ||
				p.price < 0 ||
				(p.multiplier !== null &&
					(!Number.isFinite(p.multiplier) || p.multiplier <= 0)),
		)
	)
		return { ok: false, issue: "invalid" };
	const quantity = prints.reduce((sum, p) => sum + p.quantity, 0);
	const weightedValue = prints.reduce(
		(sum, p) => sum + p.quantity * p.price,
		0,
	);
	return {
		ok: true,
		count: prints.length,
		quantity,
		premium: prints.some((p) => p.multiplier === null)
			? null
			: prints.reduce(
					(sum, p) =>
						sum + (p.quantity * p.price * (p.multiplier as number)) / 100,
					0,
				),
		weightedPrice: weightedValue / quantity,
		meanPrice: prints.reduce((sum, p) => sum + p.price, 0) / prints.length,
	};
}
export type TapeMessage = {
	id: string;
	receivedAt: string;
	executionAt: string;
} & (
	| { kind: "new"; print: TapePrint }
	| { kind: "duplicate" | "cancel"; targetId: string }
	| { kind: "correct"; targetId: string; replacement: TapePrint }
);
/** Teaching protocol uses explicit IDs and message kinds, never price/time similarity as an identity key. */
export function replayTape(messages: readonly TapeMessage[], count: number) {
	const active = new Map<string, TapePrint>();
	const seen = new Set<string>();
	let duplicates = 0;
	let unresolved = 0;
	const visible = messages.slice(0, Math.max(0, Math.floor(count)));
	for (const message of visible) {
		if (message.kind === "new") {
			if (seen.has(message.print.id)) {
				duplicates++;
				continue;
			}
			seen.add(message.print.id);
			active.set(message.print.id, message.print);
		} else if (message.kind === "duplicate") {
			if (seen.has(message.targetId)) duplicates++;
			else unresolved++;
		} else if (message.kind === "correct") {
			if (
				active.has(message.targetId) &&
				message.replacement.id === message.targetId
			)
				active.set(message.targetId, message.replacement);
			else unresolved++;
		} else if (!active.delete(message.targetId)) unresolved++;
	}
	return {
		messages: visible.length,
		active: [...active.values()],
		duplicates,
		unresolved,
	};
}
export type TapeCondition = {
	id: string;
	label: readonly [string, string];
	meaning: readonly [string, string] | null;
};
export type ConditionClaim =
	| "meaning"
	| "owner"
	| "institution"
	| "inside"
	| "strategy";
export function conditionSupports(
	condition: TapeCondition,
	definitionAvailable: boolean,
	claim: ConditionClaim,
) {
	return (
		definitionAvailable && condition.meaning !== null && claim === "meaning"
	);
}
export type TapeConceptData = {
	kind: "trade-records";
	date: string;
	window: string;
	contract: string;
	records: Record<string, TapePrint>;
	groups: readonly [
		{ id: string; label: readonly [string, string]; ids: readonly string[] },
		...{
			id: string;
			label: readonly [string, string];
			ids: readonly string[];
		}[],
	];
	messages: readonly TapeMessage[];
	conditionQuantity: number;
	conditions: readonly [TapeCondition, ...TapeCondition[]];
};
