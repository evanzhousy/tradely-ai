const SCALES: Record<string, number> = {
	k: 1_000,
	m: 1_000_000,
	万: 10_000,
	亿: 100_000_000,
};

/**
 * Reads a typed number the way people write money and counts: "$1,260", "−220", "4.2×",
 * "28%", "1 260", "1.5k", "−$2.31M", "66.5万", or with a unit after it ("832 shares",
 * "+120 share-equivalents", "$0.12/share", "12 个 ATR"). Returns null for anything that
 * isn't one number.
 */
export function readNumber(text: string) {
	const [, number = "", unit = ""] =
		/^(.*?\d\.?)\s*(\D*)$/u.exec(text.trim().replace(/[−–—]/g, "-")) ?? [];
	const scale = SCALES[unit.toLowerCase()] ?? 1;
	if (unit && scale === 1 && !/^(%|×|[\p{L}\s.·/-]+)$/u.test(unit)) return null;
	const cleaned = number.replace(/^\+/, "").replace(/[$,\s ]/g, "");
	if (!/^-?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
	const value = Number(cleaned) * scale;
	return Number.isFinite(value) ? value : null;
}
