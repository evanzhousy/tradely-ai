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

export const SIZE = 200;
export type Leg = {
	key: string;
	contract: Contract;
	side: "buy" | "sell";
	label: "bullish" | "bearish";
};
export const LEGS: readonly Leg[] = [
	{ key: "a", contract: PUT_95, side: "sell", label: "bullish" },
	{ key: "b", contract: PUT_90, side: "buy", label: "bearish" },
	{ key: "c", contract: CALL_105, side: "sell", label: "bearish" },
	{ key: "d", contract: CALL_110, side: "buy", label: "bullish" },
];
export const legPrice = (leg: Leg) =>
	leg.side === "buy"
		? optionQuote(leg.contract).ask
		: optionQuote(leg.contract).bid;
/** Premium of one leg's print, in cents. */
export const legPremium = (leg: Leg) => legPrice(leg) * SIZE * 100;
export const BULLISH = LEGS.filter((leg) => leg.label === "bullish").reduce(
	(sum, leg) => sum + legPremium(leg),
	0,
);
export const BEARISH = LEGS.filter((leg) => leg.label === "bearish").reduce(
	(sum, leg) => sum + legPremium(leg),
	0,
);
export const PACKAGE_CREDIT = Math.round(CREDIT * 100) * SIZE * 100;
export const PACKAGE_RISK = Math.round(MAX_LOSS * 100) * SIZE * 100;
