export type Copy = readonly [string, string];
export type QuestionField =
	| "subject"
	| "quantity"
	| "universe"
	| "interval"
	| "evidence"
	| "invalidation"
	| "outcome"
	| "horizon"
	| "evaluation";
export type EvidenceLayer =
	| "observation"
	| "calculation"
	| "interpretation"
	| "contradiction"
	| "unknown";
export type ResearchIdentity = {
	subject: string;
	population: string;
	quantity: string;
	interval: string;
	method: string;
};
export type BoundaryConceptData = {
	kind: "audited-boundary";
	source: string;
	fields: readonly { id: QuestionField; label: Copy; value: Copy }[];
	layers: readonly { id: EvidenceLayer; label: Copy }[];
	cards: readonly {
		id: string;
		label: Copy;
		statement: Copy;
		accepted: readonly EvidenceLayer[];
		explanation: Copy;
	}[];
	original: { identity: ResearchIdentity; claim: Copy; version: string };
	revisions: readonly {
		id: string;
		label: Copy;
		identity: ResearchIdentity;
		evidence: Copy;
		claim: Copy;
		sourceVersion: string;
	}[];
};
export function requiredQuestionFields(
	forecast: boolean,
): readonly QuestionField[] {
	return forecast
		? [
				"subject",
				"quantity",
				"universe",
				"interval",
				"evidence",
				"invalidation",
				"outcome",
				"horizon",
				"evaluation",
			]
		: [
				"subject",
				"quantity",
				"universe",
				"interval",
				"evidence",
				"invalidation",
			];
}
/** Declared fields are a design checklist, never evidence of a valid finding. */
export function questionDeclaration(
	selected: readonly QuestionField[],
	forecast: boolean,
) {
	const required = requiredQuestionFields(forecast);
	const missing = required.filter((field) => !selected.includes(field));
	return { required, missing, declared: required.length - missing.length };
}
export function changedQuestionFields(
	a: ResearchIdentity,
	b: ResearchIdentity,
) {
	const keys = [
		"subject",
		"population",
		"quantity",
		"interval",
		"method",
	] as const;
	return keys.filter((key) => a[key] !== b[key]);
}
