import { type Contract, optionQuote, valueAtExpiry } from "@/content/world";

export const oct18 = (strike: number, right: "call" | "put"): Contract => ({
	expiry: "oct18",
	strike,
	right,
});
/** Value at expiry in dollars a share. */
export const worth = (contract: Contract, spot: number) =>
	valueAtExpiry(contract, Math.round(spot * 100)) / 100;
export const RANGE = [80, 120] as const;

/** Points along a payoff in dollars a contract, with a kink at every strike. */
export const curve = (
	f: (spot: number) => number,
	strikes: readonly number[],
) =>
	[RANGE[0], ...strikes, RANGE[1]].map(
		(spot) => [spot, f(spot) * 100] as const,
	);

export const CALL_100 = oct18(100, "call");
export const PUT_100 = oct18(100, "put");
/** Both legs bought at their asks, dollars a share. */
export const STRADDLE_COST =
	(optionQuote(CALL_100).ask + optionQuote(PUT_100).ask) / 100;
export const STRADDLE_LOW = 100 - STRADDLE_COST;
export const STRADDLE_HIGH = 100 + STRADDLE_COST;
export const straddle = (spot: number) =>
	worth(CALL_100, spot) + worth(PUT_100, spot);

export const PUT_95 = oct18(95, "put");
export const PUT_90 = oct18(90, "put");
export const CALL_105 = oct18(105, "call");
export const CALL_110 = oct18(110, "call");
/** Short legs at their bids, long wings at their asks, dollars a share. */
export const PUT_CREDIT =
	(optionQuote(PUT_95).bid - optionQuote(PUT_90).ask) / 100;
export const CALL_CREDIT =
	(optionQuote(CALL_105).bid - optionQuote(CALL_110).ask) / 100;
export const CREDIT = PUT_CREDIT + CALL_CREDIT;
export const WIDTH = 5;
export const MAX_LOSS = WIDTH - CREDIT;
export const putSpread = (spot: number) =>
	PUT_CREDIT - worth(PUT_95, spot) + worth(PUT_90, spot);
export const callSpread = (spot: number) =>
	CALL_CREDIT - worth(CALL_105, spot) + worth(CALL_110, spot);
export const condor = (spot: number) => putSpread(spot) + callSpread(spot);
export const STRIKES = [90, 95, 105, 110] as const;

/** Contracts of each leg in the learner's one condor. */
export const SIZE = 1;
export type Leg = {
	key: string;
	contract: Contract;
	side: "buy" | "sell";
};
/** The learner's one iron condor, entered as one order of four legs. */
export const LEGS: readonly Leg[] = [
	{ key: "a", contract: PUT_95, side: "sell" },
	{ key: "b", contract: PUT_90, side: "buy" },
	{ key: "c", contract: CALL_105, side: "sell" },
	{ key: "d", contract: CALL_110, side: "buy" },
];
/** A leg's price in cents a share: a sold leg at its bid, a bought leg at its ask. */
export const legPrice = (leg: Leg) =>
	leg.side === "buy"
		? optionQuote(leg.contract).ask
		: optionQuote(leg.contract).bid;
/** What one leg brings in (+) or costs (−) at entry, in cents: SIZE contracts of 100 shares. */
export const legCash = (leg: Leg) =>
	(leg.side === "sell" ? 1 : -1) * legPrice(leg) * 100 * SIZE;
/** The four legs' cash added up, in cents a condor: the net credit. */
export const NET_CASH = LEGS.reduce((sum, leg) => sum + legCash(leg), 0);
/** The most one condor can lose at expiry, in cents: one side's width less the credit. */
export const WORST_CASH = NET_CASH - WIDTH * 100 * 100;
/** What a leg is worth to the learner at expiry, in cents a contract: owned +, owed −. */
export const legValueAt = (leg: Leg, spot: number) => {
	const value = Math.round(worth(leg.contract, spot) * 100) * 100;
	return value === 0 ? 0 : leg.side === "buy" ? value : -value;
};
/** One condor's result at expiry, in cents: the credit plus what the legs are then worth. */
export const resultAt = (spot: number) =>
	NET_CASH + LEGS.reduce((sum, leg) => sum + legValueAt(leg, spot), 0);
/** The film's worked close: past the short call, inside its wing. */
export const CLOSE = 108;
/** What the legs sold are worth against the learner at that close, in cents a condor. */
export const CLOSE_OWED = -LEGS.reduce(
	(sum, leg) => sum + legValueAt(leg, CLOSE),
	0,
);
export const CLOSE_RESULT = resultAt(CLOSE);
/** Closes the playground offers: in the range, between a short strike and its wing, past a wing. */
export const CLOSES = [100, 109, 112] as const;
/** The playground's put-side close, asked about but not offered. */
export const PUT_SIDE_CLOSE = 93;
