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

const SCALES: Record<string, number> = {
	k: 1_000,
	m: 1_000_000,
	万: 10_000,
	亿: 100_000_000,
};

/**
 * Reads a typed number the way people write money and counts: "$1,260", "−220", "4.2×",
 * "28%", "1 260", "1.5k", "−$2.31M", "66.5万", or with a unit word after it
 * ("832 shares", "12 个 ATR"). Returns null for anything that isn't one number.
 */
export function parseEntry(text: string) {
	const [, number = "", unit = ""] =
		/^(.*?\d\.?)\s*(\D*)$/u.exec(text.trim().replace(/[−–—]/g, "-")) ?? [];
	const scale = SCALES[unit.toLowerCase()] ?? 1;
	if (unit && scale === 1 && !/^(%|×|[\p{L}\s.·]+)$/u.test(unit)) return null;
	const cleaned = number.replace(/^\+/, "").replace(/[$,\s ]/g, "");
	if (!/^-?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
	return Number(cleaned) * scale;
}

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
