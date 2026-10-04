import {
	type Contract,
	type Copy,
	OCT_100_CALL,
	optionQuote,
} from "@/content/world";

/** The positions, trades and assignment the rights lesson teaches with, shared by its film and its playground. */

export type Right = "call" | "put";
export type Side = "long" | "short";

export const PUT_95: Contract = { expiry: "oct18", strike: 95, right: "put" };
export const contractFor = (right: Right) =>
	right === "call" ? OCT_100_CALL : PUT_95;

/** What each side of each type holds or owes. */
export const cellCopy: Record<
	Right,
	Record<
		Side,
		{ duty: Copy; terms: Copy; brief: Copy; when: Copy; premium: Copy }
	>
> = {
	call: {
		long: {
			duty: ["Right to buy", "有权买入"],
			terms: ["100 ALFA at $100", "按 $100 买 100 股"],
			brief: ["100 at $100", "100 股 · $100"],
			when: ["if you exercise", "若你行权"],
			premium: ["paid the premium", "已支付权利金"],
		},
		short: {
			duty: ["Must sell", "必须卖出"],
			terms: ["100 ALFA at $100", "按 $100 卖 100 股"],
			brief: ["100 at $100", "100 股 · $100"],
			when: ["if you're assigned", "若你被指派"],
			premium: ["received premium", "已收取权利金"],
		},
	},
	put: {
		long: {
			duty: ["Right to sell", "有权卖出"],
			terms: ["100 ALFA at $95", "按 $95 卖 100 股"],
			brief: ["100 at $95", "100 股 · $95"],
			when: ["if you exercise", "若你行权"],
			premium: ["paid the premium", "已支付权利金"],
		},
		short: {
			duty: ["Must buy", "必须买入"],
			terms: ["100 ALFA at $95", "按 $95 买 100 股"],
			brief: ["100 at $95", "100 股 · $95"],
			when: ["if you're assigned", "若你被指派"],
			premium: ["received premium", "已收取权利金"],
		},
	},
};

export type Trade = "buy" | "sell";

export function tradeCopy(from: number, trade: Trade): Copy {
	if (trade === "buy")
		return from < 0
			? ["Buy to close", "买入平仓"]
			: ["Buy to open", "买入开仓"];
	return from > 0
		? ["Sell to close", "卖出平仓"]
		: ["Sell to open", "卖出开仓"];
}

export function positionCopy(position: number): Copy {
	if (position > 0) return [`Long ${position} call`, `多头 ${position} 张`];
	if (position < 0) return [`Short ${-position} call`, `空头 ${-position} 张`];
	return ["Flat", "空仓"];
}

/** Everyone short the contract. Ben sold the learner theirs; the clearinghouse picks Eli. */
export const writers = [
	{ id: "ben", name: "Ben", short: 1 },
	{ id: "cara", name: "Cara", short: 2 },
	{ id: "eli", name: "Eli", short: 3 },
] as const;
export const ASSIGNED = "eli";

/** At expiry ALFA closes $7 below the put's strike, or $8 above the call's. Cents. */
export function exerciseCase(right: Right) {
	const contract = contractFor(right);
	const close = right === "put" ? 88 : 108;
	const premium = optionQuote(contract).ask * 100;
	const cash = contract.strike * 100 * 100;
	const gain = Math.abs(cash - close * 100 * 100);
	return { contract, close, premium, cash, gain, net: gain - premium };
}
