import type { CohortSeries } from "./oi-concept";

type Copy = readonly [string, string];
export type SourceValue =
	| { state: "observed"; value: number }
	| { state: "missing" | "not-applicable" };
export type SourceRequirement = {
	id: string;
	label: Copy;
	symbol: string;
	session: string;
	window: string;
	unit: "contracts";
	seriesCount: number;
};
export type SourceRecord = {
	id: string;
	label: Copy;
	source: string;
	symbol: string;
	session: string;
	window: string;
	receivedAt: string;
	unit: "contracts" | "shares";
	measurement: SourceValue;
	coverage: { covered: number; expected: number };
};
export type SourceConceptData = {
	kind: "symbol-drawer";
	clock: {
		date: string;
		contract: string;
		frames: readonly [number, ...number[]];
		eventMinute: number;
		receiptMinute: number;
		quantity: number;
		oi: { asOf: string; receivedAt: string; value: number };
		model: { asOf: string; receivedAt: string };
	};
	audit: {
		asOf: string;
		requirements: readonly [SourceRequirement, ...SourceRequirement[]];
		records: readonly [SourceRecord, ...SourceRecord[]];
	};
	cohort: {
		scope: string;
		reportDates: readonly [string, string];
		dteRange: readonly [number, number];
		series: readonly CohortSeries[];
		expiredId: string;
		retainedId: string;
	};
};
export function observeSourceClock(
	clock: SourceConceptData["clock"],
	minute: number,
) {
	const occurred = minute >= clock.eventMinute;
	const received = occurred && minute >= clock.receiptMinute;
	return {
		occurred,
		received,
		visibleQuantity: received ? clock.quantity : null,
	};
}
export function auditSource(
	record: SourceRecord,
	requirement: SourceRequirement,
	asOf: string,
) {
	const checks = {
		identity: record.symbol === requirement.symbol,
		session: record.session === requirement.session,
		window: record.window === requirement.window,
		unit: record.unit === requirement.unit,
		received:
			Number.isFinite(Date.parse(record.receivedAt)) &&
			Date.parse(record.receivedAt) <= Date.parse(asOf),
		value:
			record.measurement.state === "observed" &&
			Number.isFinite(record.measurement.value) &&
			record.measurement.value >= 0,
		coverage:
			record.coverage.expected === requirement.seriesCount &&
			record.coverage.covered === requirement.seriesCount,
	};
	return { checks, accepted: Object.values(checks).every(Boolean) };
}
