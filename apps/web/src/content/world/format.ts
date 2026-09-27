import type { Copy } from "./calendar";

export type Locale = "en" | "zh";

/** Picks the locale's half of a bilingual pair. */
export const pick = (copy: Copy, locale: Locale) =>
	locale === "zh" ? copy[1] : copy[0];

const minus = "−";

/** Whole numbers with thousands separators; negatives use a true minus sign. */
export function count(value: number) {
	const text = Math.abs(value).toLocaleString("en-US", {
		maximumFractionDigits: 0,
	});
	return value < 0 ? `${minus}${text}` : text;
}

/** Signed whole numbers, "+10", "−4", "0". */
export function signedCount(value: number) {
	return value > 0 ? `+${count(value)}` : count(value);
}

/** Dollars from cents: "$4.15", "−$53.00". Pass digits 0 for "$400". */
export function usd(cents: number, digits = 2) {
	const text = (Math.abs(cents) / 100).toLocaleString("en-US", {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	});
	return cents < 0 ? `${minus}$${text}` : `$${text}`;
}

/** Signed dollars from cents: "+$6.00", "−$53.00", "$0.00". */
export function signedUsd(cents: number, digits = 2) {
	return cents > 0 ? `+${usd(cents, digits)}` : usd(cents, digits);
}

/** Percent from a fraction: 0.1234 → "12.3%". */
export function percent(fraction: number, digits = 1) {
	const text = (Math.abs(fraction) * 100).toFixed(digits);
	return fraction < 0 ? `${minus}${text}%` : `${text}%`;
}
