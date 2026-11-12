import "@tanstack/react-start/server-only";
import {
	breakEven,
	decayPerDay,
	EXPIRY_SPOT,
	expiryCall,
	paid,
	quoteRow,
	resultAtExpiry,
	resultOnCheck,
	resultSoon,
	SOON_SPOT,
	SPOT,
	strikeCalls,
} from "@/features/learning/lessons/strike-and-expiry-model";
import {
	basics,
	type ChoiceSpec,
	choose as c,
	fact,
	greeks,
	money,
	numberQuestion as n,
	oi,
	plain,
	quotes,
	signedMoney,
	type TeachingUnit,
	t,
} from "./authoring.server";

/** The lesson's own ALFA figures, read from its model so the unit never types them twice. */
const [ITM, ATM, OTM] = strikeCalls.map((row) => row.contract);
const MID = expiryCall("mid").contract;
const FAR = expiryCall("far").contract;
const LIQUID = quoteRow("c105");
const THIN = quoteRow("dec110");
/** Whole dollars for one contract, and a per-share price from cents. */
const whole = (value: number) => money(value, 0);
const signedWhole = (value: number) => signedMoney(value, 0);
const share = (cents: number) => money(cents / 100);

type Quote = {
	label: string;
	labelZh: string;
	bid: number;
	ask: number;
	oi: number;
};
type Case = {
	symbol: string;
	spot: number;
	strikes: [number, number, number];
	/** Asks in dollars per share, lowest strike first. */
	premiums: [number, number, number];
	close: number;
	a: Quote;
	b: Quote;
};

/**
 * The guided case is the lesson's ALFA example. Each independent case changes how far the
 * stock goes against the three break-evens, so the calls that end ahead differ every time,
 * and which of two quotes costs more to trade.
 */
const cases: Case[] = [
	{
		symbol: "ALFA",
		spot: SPOT,
		strikes: [ITM.strike, ATM.strike, OTM.strike],
		premiums: [paid(ITM) / 100, paid(ATM) / 100, paid(OTM) / 100],
		close: EXPIRY_SPOT,
		a: {
			label: `Oct 18 ${LIQUID.contract.strike} call`,
			labelZh: `10月18日 ${LIQUID.contract.strike} 看涨`,
			bid: LIQUID.bid / 100,
			ask: LIQUID.ask / 100,
			oi: LIQUID.openInterest,
		},
		b: {
			label: `Dec 20 ${THIN.contract.strike} call`,
			labelZh: `12月20日 ${THIN.contract.strike} 看涨`,
			bid: THIN.bid / 100,
			ask: THIN.ask / 100,
			oi: THIN.openInterest,
		},
	},
	{
		symbol: "DUNE",
		spot: 35,
		strikes: [30, 35, 40],
		premiums: [5.6, 2.1, 0.55],
		close: 42,
		a: {
			label: "Contract A",
			labelZh: "合约 A",
			bid: 0.45,
			ask: 0.55,
			oi: 900,
		},
		b: {
			label: "Contract B",
			labelZh: "合约 B",
			bid: 2.05,
			ask: 2.15,
			oi: 850,
		},
	},
	{
		symbol: "CRUX",
		spot: 65,
		strikes: [60, 65, 70],
		premiums: [6.3, 3.2, 1.35],
		close: 67,
		a: { label: "Contract A", labelZh: "合约 A", bid: 3, ask: 3.4, oi: 40 },
		b: {
			label: "Contract B",
			labelZh: "合约 B",
			bid: 1.3,
			ask: 1.35,
			oi: 2_400,
		},
	},
	{
		symbol: "EMBR",
		spot: 80,
		strikes: [75, 80, 85],
		premiums: [6.4, 3.1, 1.2],
		close: 81,
		a: {
			label: "Contract A",
			labelZh: "合约 A",
			bid: 1.15,
			ask: 1.25,
			oi: 700,
		},
		b: { label: "Contract B", labelZh: "合约 B", bid: 3, ask: 3.2, oi: 350 },
	},
];

export const strikeAndExpiryUnit: TeachingUnit = {
	id: "strike-and-expiry",
	version: 1,
	conceptLab: {
		kind: "strike-and-expiry",
		intro: t(
			`Compare three Oct 18 calls on one view of ALFA, the ${ITM.strike}, the ${ATM.strike} and the ${OTM.strike}: what each costs, where it breaks even and what ALFA at ${whole(EXPIRY_SPOT)} does to it. Then the same strike for three expiries, and the quote check that applies to any of them.`,
			`用同一个对 ALFA 的看法比较三张 10月18日 看涨：${ITM.strike}、${ATM.strike} 与 ${OTM.strike}，各自的成本、盈亏平衡点，以及 ALFA 到 ${whole(EXPIRY_SPOT)} 时的结果。再看同一行权价的三个到期日，以及对任何一张合约都适用的报价检查。`,
		),
	},
	sources: [basics, greeks, quotes, oi],
	explanation: t(
		"One view of a stock can be expressed with many contracts, and each is a different bet. A call is in the money when its strike is below the stock's price, at the money when the two are about equal, and out of the money when the strike is above the price. The strike sets how far the stock must go: at expiry a bought call is ahead only above its break-even, the strike plus the premium paid. A lower strike costs more and has a lower break-even; a higher strike costs less, ends worthless at more prices, and gains more per dollar paid when a large move comes. Before expiry every call moves with the stock, by about its delta per share for a small move. The expiry sets how long the stock has: with the same strike, a later expiry costs more and has a higher break-even, loses less to time decay each day, and is still alive when a nearer one has expired; a nearer expiry is cheaper, decays faster and needs the move sooner. Whatever the strike and expiry, check the contract's own quote: you buy at the ask and sell at the bid, so a wide gap between them is a cost paid on the way in and again on the way out, and low open interest (few contracts opened and not yet closed) usually goes with a wide gap. None of this picks a contract. It shows what each choice costs and what it needs.",
		"对一只股票的同一个看法，可以用很多张合约来表达，而每一张都是不同的押注。看涨期权的行权价低于股价时是实值，两者大致相等时是平值，行权价高于股价时是虚值。行权价决定股票要走多远：到期时，买入的看涨只有在盈亏平衡点之上才盈利，也就是行权价加上所付的权利金。行权价越低越贵，盈亏平衡点也越低；行权价越高越便宜，在更多的价格上到期归零，而大行情到来时每付出一美元赚得更多。到期之前，每张看涨都随股价变动，小幅变动时每股大约变动它的 Delta。到期日决定股票有多久：行权价相同时，到期越晚越贵，盈亏平衡点越高，每天的时间损耗越小，较近的合约到期时它还在；到期越近越便宜，损耗越快，需要行情来得更早。无论选哪个行权价和到期日，都要看这张合约自己的报价：买入按卖价，卖出按买价，所以两者之差很宽，就是进场付一次、出场再付一次的成本；未平仓量低（已开仓、尚未平仓的合约很少）时，这个差通常也宽。这些都不替你挑选合约，只说明每种选择要花多少、需要什么。",
	),
	example: t(
		`ALFA is ${whole(SPOT)} on Sep 16 and you think it will be higher in a month. Three Oct 18 calls, bought at the ask: the ${ITM.strike} at ${share(paid(ITM))} (${whole(paid(ITM))} a contract, break-even ${money(breakEven(ITM))}), the ${ATM.strike} at ${share(paid(ATM))} (${whole(paid(ATM))}, break-even ${money(breakEven(ATM))}) and the ${OTM.strike} at ${share(paid(OTM))} (${whole(paid(OTM))}, break-even ${money(breakEven(OTM))}). A day later with ALFA at ${whole(SOON_SPOT)}, a model quote has them sold for ${signedWhole(resultSoon(ITM))}, ${signedWhole(resultSoon(ATM))} and ${signedWhole(resultSoon(OTM))}. Held to Oct 18 with ALFA at ${whole(EXPIRY_SPOT)}, the results are ${signedWhole(resultAtExpiry(ITM, EXPIRY_SPOT))}, ${signedWhole(resultAtExpiry(ATM, EXPIRY_SPOT))} and ${signedWhole(resultAtExpiry(OTM, EXPIRY_SPOT))}: the stock rose ${whole(EXPIRY_SPOT - SPOT)} and the ${OTM.strike} call still lost. The Nov 15 ${FAR.strike} call costs ${whole(paid(FAR))} against ${whole(paid(MID))} for Oct 18 and loses about ${money(-decayPerDay(FAR))} a day to time decay against ${money(-decayPerDay(MID))}; if ALFA is still ${whole(SPOT)} on Oct 18, the Oct call is ${signedWhole(resultOnCheck("mid", SPOT) ?? 0)} and the Nov call about ${signedWhole(resultOnCheck("far", SPOT) ?? 0)} in the model. The Oct 18 ${LIQUID.contract.strike} call is quoted ${share(LIQUID.bid)} bid, ${share(LIQUID.ask)} ask: ${whole(LIQUID.ask - LIQUID.bid)} a contract to get in and out. The Dec 20 ${THIN.contract.strike} call, ${share(THIN.bid)} bid, ${share(THIN.ask)} ask with ${plain(THIN.openInterest)} contracts of open interest, costs ${whole(THIN.ask - THIN.bid)}.`,
		`9月16日 ALFA 为 ${whole(SPOT)}，你认为一个月后它会更高。三张 10月18日 看涨，按卖价买入：${ITM.strike} 每股 ${share(paid(ITM))}（每张 ${whole(paid(ITM))}，盈亏平衡点 ${money(breakEven(ITM))}），${ATM.strike} 每股 ${share(paid(ATM))}（${whole(paid(ATM))}，盈亏平衡点 ${money(breakEven(ATM))}），${OTM.strike} 每股 ${share(paid(OTM))}（${whole(paid(OTM))}，盈亏平衡点 ${money(breakEven(OTM))}）。一天后 ALFA 为 ${whole(SOON_SPOT)}，按模型报价卖出的结果是 ${signedWhole(resultSoon(ITM))}、${signedWhole(resultSoon(ATM))} 和 ${signedWhole(resultSoon(OTM))}。持有到 10月18日、ALFA 为 ${whole(EXPIRY_SPOT)} 时，结果是 ${signedWhole(resultAtExpiry(ITM, EXPIRY_SPOT))}、${signedWhole(resultAtExpiry(ATM, EXPIRY_SPOT))} 和 ${signedWhole(resultAtExpiry(OTM, EXPIRY_SPOT))}：股票涨了 ${whole(EXPIRY_SPOT - SPOT)}，${OTM.strike} 看涨仍然亏损。11月15日 ${FAR.strike} 看涨要 ${whole(paid(FAR))}，10月18日 的是 ${whole(paid(MID))}；前者每天的时间损耗约 ${money(-decayPerDay(FAR))}，后者约 ${money(-decayPerDay(MID))}。如果 10月18日 ALFA 仍是 ${whole(SPOT)}，模型中 10月 看涨是 ${signedWhole(resultOnCheck("mid", SPOT) ?? 0)}，11月 看涨约 ${signedWhole(resultOnCheck("far", SPOT) ?? 0)}。10月18日 ${LIQUID.contract.strike} 看涨的报价是买价 ${share(LIQUID.bid)}、卖价 ${share(LIQUID.ask)}：一进一出每张 ${whole(LIQUID.ask - LIQUID.bid)}。12月20日 ${THIN.contract.strike} 看涨买价 ${share(THIN.bid)}、卖价 ${share(THIN.ask)}，未平仓量只有 ${plain(THIN.openInterest)} 张，一进一出要 ${whole(THIN.ask - THIN.bid)}。`,
	),
	misconception: t(
		"A rising stock doesn't make every call a winner: at expiry the stock has to be above the strike by more than the premium paid. The cheapest call risks the fewest dollars, and it is also the one that ends worth nothing at the most prices. Compare break-evens, not only prices.",
		"股票上涨，并不会让每张看涨都赚钱：到期时，股价要比行权价高出所付的权利金才行。最便宜的看涨最多亏掉的金额最少，但它也是在最多的价格上到期归零的那一张。要比较盈亏平衡点，而不只是价格。",
	),
	case: (v) => {
		const { symbol, spot, strikes, premiums, close, a, b } = cases[v];
		const worth = strikes.map((strike) => Math.max(close - strike, 0));
		const results = strikes.map((_, i) => worth[i] - premiums[i]);
		const evens = strikes.map((strike, i) => strike + premiums[i]);
		const winners = results.filter((result) => result > 0).length;
		const profit = (["none", "one", "two", "all"] as const)[winners];
		/** One call's value at the close against what it cost, per share. */
		const line = (i: number) =>
			t(
				`the ${strikes[i]} call is worth ${money(worth[i])} a share at ${whole(close)} and cost ${money(premiums[i])}`,
				`${whole(close)} 时 ${strikes[i]} 看涨每股值 ${money(worth[i])}，成本是 ${money(premiums[i])}`,
			);
		const verdict = (i: number) =>
			results[i] > 0 ? t("a gain", "盈利") : t("a loss", "亏损");
		/** The first call a wrong count gets wrong: one it calls a winner that lost, or the reverse. */
		const miss = (claimed: number) => {
			const i = claimed > winners ? winners : claimed;
			return t(
				`Check each call against its own break-even: ${line(i).en}, ${verdict(i).en}.`,
				`逐张对照各自的盈亏平衡点：${line(i).zh}，是${verdict(i).zh}。`,
			);
		};
		const profitChoices: ChoiceSpec[] = (
			[
				["all", 3, "All three", "三张都盈利"],
				[
					"two",
					2,
					`Two: the ${strikes[0]} and the ${strikes[1]}`,
					`两张：${strikes[0]} 和 ${strikes[1]}`,
				],
				["one", 1, `One: the ${strikes[0]}`, `一张：${strikes[0]}`],
				["none", 0, "None", "都不盈利"],
			] as const
		).map(([id, claimed, en, zh]) => [
			id,
			en,
			zh,
			miss(claimed).en,
			miss(claimed).zh,
		]);
		const spreadA = a.ask - a.bid;
		const spreadB = b.ask - b.bid;
		const same = Math.abs(spreadA - spreadB) < 0.001;
		const dearer = same ? "same" : spreadA > spreadB ? "a" : "b";
		const both = t(
			`${a.label}: ${money(a.ask)} − ${money(a.bid)} = ${money(spreadA)} a share, ${whole(spreadA * 100)} a contract. ${b.label}: ${money(b.ask)} − ${money(b.bid)} = ${money(spreadB)}, ${whole(spreadB * 100)} a contract.`,
			`${a.labelZh}：${money(a.ask)} − ${money(a.bid)} = 每股 ${money(spreadA)}，每张 ${whole(spreadA * 100)}。${b.labelZh}：${money(b.ask)} − ${money(b.bid)} = ${money(spreadB)}，每张 ${whole(spreadB * 100)}。`,
		);
		/** Why naming one contract misses: the other loses more, or neither does. */
		const oneSided = same
			? t(`Neither loses more. ${both.en}`, `两张亏得一样多。${both.zh}`)
			: both;
		const tradeChoices: ChoiceSpec[] = [
			["a", a.label, a.labelZh, oneSided.en, oneSided.zh],
			["b", b.label, b.labelZh, oneSided.en, oneSided.zh],
			[
				"same",
				"They cost the same",
				"两者相同",
				`The gaps differ. ${both.en}`,
				`两者的差并不相同。${both.zh}`,
			],
		];
		return {
			brief: t(
				`${symbol} is ${whole(spot)} and you expect it to be higher in a month. You compare three calls with the same expiry, each bought at its ask: the ${strikes[0]} call at ${money(premiums[0])} a share, the ${strikes[1]} call at ${money(premiums[1])} and the ${strikes[2]} call at ${money(premiums[2])}. One contract covers 100 shares. On expiry day ${symbol} closes at ${whole(close)}. Leave out commissions and fees. Two more contracts you looked at are listed with their quotes.`,
				`${symbol} 现价 ${whole(spot)}，你预计一个月后它会更高。你比较三张到期日相同的看涨，都按卖价买入：${strikes[0]} 看涨每股 ${money(premiums[0])}，${strikes[1]} 看涨 ${money(premiums[1])}，${strikes[2]} 看涨 ${money(premiums[2])}。一张合约对应 100 股。到期日 ${symbol} 收在 ${whole(close)}。不计佣金与费用。另外两张你看过的合约连同报价列在下面。`,
			),
			facts: [
				...[a, b].map((quote) =>
					fact(
						`${quote.label}: bid / ask · open interest`,
						`${quote.labelZh}：买价 / 卖价 · 未平仓量`,
						`${money(quote.bid)} / ${money(quote.ask)} · ${plain(quote.oi)}`,
					),
				),
			],
			questions: [
				n(
					"break-even",
					`What is the ${strikes[2]} call's break-even price at expiry?`,
					`${strikes[2]} 看涨到期时的盈亏平衡点是多少？`,
					evens[2],
					"dollars",
					"美元",
					`Strike plus premium paid: ${whole(strikes[2])} + ${money(premiums[2])} = ${money(evens[2])}. At expiry the stock must be above that price before this call is ahead.`,
					`行权价加上所付的权利金：${whole(strikes[2])} + ${money(premiums[2])} = ${money(evens[2])}。到期时股价要高于这个价格，这张看涨才盈利。`,
				),
				c(
					"profit",
					`With ${symbol} at ${whole(close)} at expiry, how many of the three calls end with a profit?`,
					`到期时 ${symbol} 为 ${whole(close)}，三张看涨里有几张盈利？`,
					profitChoices,
					profit,
					`The break-evens are ${evens.map((even) => money(even)).join(", ")}. ${whole(close)} is above ${winners === 0 ? "none of them" : winners === 3 ? "all three" : winners === 1 ? "the first only" : "the first two"}, so per share the results are ${results.map((result) => signedMoney(result)).join(", ")}.`,
					`盈亏平衡点是 ${evens.map((even) => money(even)).join("、")}。${whole(close)} ${winners === 0 ? "一个也没超过" : winners === 3 ? "三个都超过了" : winners === 1 ? "只超过第一个" : "超过了前两个"}，所以每股结果是 ${results.map((result) => signedMoney(result)).join("、")}。`,
				),
				n(
					"otm-result",
					`What is one ${strikes[2]} call's result at expiry, in dollars per contract? Use a minus sign for a loss.`,
					`一张 ${strikes[2]} 看涨到期时的结果是多少美元？亏损请用负号。`,
					Math.round(results[2] * 100),
					"dollars",
					"美元",
					`(${money(worth[2])} − ${money(premiums[2])}) × 100 shares = ${signedWhole(Math.round(results[2] * 100))}. ${symbol} rose ${whole(close - spot)}; whether this call gained depended on its break-even of ${money(evens[2])}.`,
					`（${money(worth[2])} − ${money(premiums[2])}）× 100 股 = ${signedWhole(Math.round(results[2] * 100))}。${symbol} 上涨了 ${whole(close - spot)}；这张看涨是否盈利，取决于它 ${money(evens[2])} 的盈亏平衡点。`,
				),
				c(
					"round-trip",
					"You buy one contract at the ask and sell it at the bid with the quote unchanged. Which of the two listed contracts loses more dollars?",
					"按卖价买入一张，再在报价不变时按买价卖出。列出的两张合约中，哪一张亏的金额更多？",
					tradeChoices,
					dearer,
					same
						? `${both.en} The dollars are equal, but that is ${plain((spreadA / a.ask) * 100, 0)}% of ${a.label}'s price and ${plain((spreadB / b.ask) * 100, 0)}% of ${b.label}'s.`
						: `${both.en} Open interest is ${plain(a.oi)} against ${plain(b.oi)}: the wider quote goes with the contract fewer people hold.`,
					same
						? `${both.zh}金额相同，但这相当于${a.labelZh} 价格的 ${plain((spreadA / a.ask) * 100, 0)}%，${b.labelZh} 价格的 ${plain((spreadB / b.ask) * 100, 0)}%。`
						: `${both.zh}未平仓量是 ${plain(a.oi)} 对 ${plain(b.oi)}：报价更宽的，正是持有人更少的那张合约。`,
				),
			],
		};
	},
};
