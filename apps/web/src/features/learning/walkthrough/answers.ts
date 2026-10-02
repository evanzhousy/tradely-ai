import type { Prediction } from "./types";

/**
 * A fixed shuffle for a seed: the same order on the server and in every browser, so the
 * right answer isn't always the first button and the page still hydrates cleanly.
 */
export function seededOrder<T>(items: readonly T[], seed: string): T[] {
	let hash = 2166136261;
	for (const char of seed) {
		hash ^= char.codePointAt(0) ?? 0;
		hash = Math.imul(hash, 16777619);
	}
	const next = () => {
		hash ^= hash >>> 15;
		hash = Math.imul(hash, 2246822507);
		hash ^= hash >>> 13;
		hash = Math.imul(hash, 3266489909);
		hash ^= hash >>> 16;
		return hash >>> 0;
	};
	const order = [...items];
	for (let i = order.length - 1; i > 0; i--) {
		const j = next() % (i + 1);
		[order[i], order[j]] = [order[j], order[i]];
	}
	return order;
}

/** Typed predictions read numbers the same way Check yourself does. */
export { readNumber as parseEntry } from "@/domain/learning/numbers";

/** A typed value as the learner meant it: "$1,260", "−$220", "14×". */
export function formatEntry(
	value: number,
	{ prefix = "", suffix = "" }: { prefix?: string; suffix?: string },
) {
	const cents = prefix === "$" && !Number.isInteger(value);
	const digits = Math.abs(value).toLocaleString("en-US", {
		minimumFractionDigits: cents ? 2 : 0,
		maximumFractionDigits: 4,
	});
	return `${value < 0 ? "−" : ""}${prefix}${digits}${suffix}`;
}

/**
 * Whether a prediction was right. A typed answer is stored as "entry:<number>" and counts
 * within the entry's tolerance.
 */
export function judge(predict: Prediction, value: string) {
	if (!value.startsWith("entry:")) return { correct: value === predict.answer };
	const typed = Number(value.slice("entry:".length));
	const entry = predict.entry;
	if (!entry) return { typed, correct: false };
	const off = entry.eitherSign
		? Math.abs(Math.abs(typed) - Math.abs(entry.answer))
		: Math.abs(typed - entry.answer);
	return { typed, correct: off <= (entry.tolerance ?? 0) + 1e-9 };
}
