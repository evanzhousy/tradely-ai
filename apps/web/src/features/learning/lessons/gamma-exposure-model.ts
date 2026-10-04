import {
	ALFA,
	gammaExposure,
	modelValue,
	oct18OpenInterest,
} from "@/content/world";

/** The numbers the gamma exposure lesson teaches with, shared by its film and its playground. */

export const SPOT = ALFA.open / 100;
/** Gamma to four places, the figure the arithmetic below uses. */
export const gammaAt = (strike: number) =>
	Math.round(
		modelValue({ expiry: "oct18", strike, right: "call" }).gamma * 10_000,
	) / 10_000;

/** "+$665k", "−$2.31M". */
export const money = (dollars: number, signed = true) => {
	const sign = dollars < 0 ? "−" : signed && dollars > 0 ? "+" : "";
	const size = Math.abs(dollars);
	return size >= 1_000_000
		? `${sign}$${(size / 1_000_000).toFixed(2)}M`
		: `${sign}$${Math.round(size / 1_000)}k`;
};

export type Side = "call" | "put";
/** Dealers assumed long calls and short puts: a common convention, not an observation. */
export const assumedSign = (side: Side): 1 | -1 => (side === "call" ? 1 : -1);
export const contribution = (
	strike: number,
	side: Side,
	sign = assumedSign(side),
) => {
	const row = oct18OpenInterest.find((entry) => entry.strike === strike);
	return row ? gammaExposure(gammaAt(strike), row[side], SPOT, sign) : 0;
};
export const STRIKES = oct18OpenInterest.map((row) => row.strike);
export const sum = (values: number[]) =>
	values.reduce((total, value) => total + value, 0);
export const CALLS = sum(STRIKES.map((strike) => contribution(strike, "call")));
export const PUTS = sum(STRIKES.map((strike) => contribution(strike, "put")));
export const NET = CALLS + PUTS;
export const GROSS = CALLS - PUTS;

export const FOCUS_STRIKE = 110;
export const focusRow = oct18OpenInterest.find(
	(row) => row.strike === FOCUS_STRIKE,
);
export const FOCUS_OI = focusRow?.call ?? 0;
export const FOCUS_GAMMA = gammaAt(FOCUS_STRIKE);
export const SHARES = Math.round(FOCUS_GAMMA * FOCUS_OI * 100);

export type BarsView = {
	calls: boolean;
	puts: boolean;
	net: boolean;
	/** Only these contracts count; the rest are drawn faint. */
	only?: readonly string[];
	/** Contracts whose open interest never arrived. */
	missing?: readonly string[];
};

export const key = (strike: number, side: Side) =>
	`${strike}${side === "call" ? "C" : "P"}`;
export const counts = (view: BarsView, strike: number, side: Side) =>
	(side === "call" ? view.calls : view.puts) &&
	(!view.only || view.only.includes(key(strike, side))) &&
	!view.missing?.includes(key(strike, side));

export function totalOf(view: BarsView) {
	return sum(
		STRIKES.flatMap((strike) =>
			(["call", "put"] as const).map((side) =>
				counts(view, strike, side) ? contribution(strike, side) : 0,
			),
		),
	);
}

export const TRADED = ["100C", "105C", "110C"];
export const MISSING = ["95P"];
export const tradedOnly = totalOf({
	calls: true,
	puts: true,
	net: true,
	only: TRADED,
});
export const withGap = totalOf({
	calls: true,
	puts: true,
	net: true,
	missing: MISSING,
});

export const LONG = gammaExposure(FOCUS_GAMMA, FOCUS_OI, SPOT, 1);
