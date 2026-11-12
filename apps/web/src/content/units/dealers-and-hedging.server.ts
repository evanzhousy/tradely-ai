import "@tanstack/react-start/server-only";
import {
	choose as c,
	greeks,
	numberQuestion as n,
	oi,
	plain,
	signed,
	type TeachingUnit,
	t,
} from "./authoring.server";

export const dealersAndHedgingUnit: TeachingUnit = {
	id: "dealers-and-hedging",
	version: 1,
	conceptLab: {
		kind: "dealers-and-hedging",
		intro: t(
			"Follow the dealer who sells you 5 Oct 18 100 calls: 260 shares bought as a hedge, 40 more after ALFA rises $2, and the same trade reversed for a dealer who bought calls. Then see why the 2,500 contracts open at one strike can't tell you which way dealers trade.",
			"跟随卖给你 5 张 10月18日 100 看涨的做市商：先买入 260 股作为对冲，ALFA 上涨 $2 后再买 40 股；买入看涨的做市商则反过来交易。再看某个行权价上 2,500 张未平仓合约，为什么不能告诉你做市商往哪个方向交易。",
		),
	},
	sources: [greeks, oi],
	explanation: t(
		"When you buy an option, the seller is often a market maker, also called a dealer: a firm that quotes a price to buy and a price to sell all day and aims to earn the gap between them, the bid-ask spread. A dealer doesn't want the stock's direction, so it hedges. An option position moves like delta × contracts × 100 shares; a dealer who is short calls buys that many shares, and one who is long calls sells them short, so the net is zero. The hedge is not fixed, because delta changes as the stock moves (gamma). A dealer who is short options is short gamma: to stay hedged it buys shares as the price rises and sells as it falls, trading with the move. A dealer who is long options is long gamma and does the opposite, selling rises and buying dips, against the move. With many contracts open at one strike, that re-hedging can be a large, mechanical flow in the stock that has nothing to do with anyone's view of the company. Nobody outside sees a dealer's book. Open interest, the count of contracts still open, says the contracts exist, not who holds which side, so every dealer-positioning figure is a model built on an assumption about who is long and who is short. Such a figure describes a hedge the assumed book would call for; it doesn't say where the price goes.",
		"你买入期权时，卖给你的往往是做市商（dealer）：这类机构全天同时报出买入价和卖出价，目标是赚取两者之间的差额，也就是买卖价差。做市商不想承担股价的方向，所以会对冲。一笔期权持仓的涨跌相当于 Delta × 张数 × 100 股；做空看涨的做市商买入这么多股票，做多看涨的做市商则卖空这么多股票，让净额归零。对冲不是一次就完事，因为股价变动时 Delta 也在变（Gamma）。做空期权的做市商是空 Gamma（Gamma 为负）：要保持对冲，股价上涨时得买入股票、下跌时得卖出，顺着变动交易。做多期权的做市商是多 Gamma（Gamma 为正），做法相反：涨时卖出、跌时买入，逆着变动交易。当某个行权价上有大量未平仓合约时，这种重新对冲可能成为股票上一股规模很大的机械性交易，与任何人对公司的看法无关。外界看不到做市商的持仓。未平仓量统计的是仍然存续的合约张数，只说明合约存在，不说明谁持有哪一边；所以每一个“做市商持仓”数字都是模型，建立在“谁做多、谁做空”的假设之上。这样的数字描述的是假设持仓所需要的对冲，并不说明价格会往哪里走。",
	),
	example: t(
		"You buy 5 Oct 18 100 calls at $4.20 a share ($420 a contract) from a dealer quoting $4.05 to buy and $4.20 to sell: a $0.15 spread, $15 a contract. Each call has delta 0.52, so the dealer's short 5 calls move like 5 × 100 × 0.52 = 260 shares short, and the dealer buys 260 shares. ALFA rises $2 and delta goes to about 0.60: the calls now move like 300 shares, so the dealer buys 40 more. Had ALFA fallen $2, delta would be about 0.44, 220 shares, and the dealer would sell 40. A dealer who had bought 5 calls instead would trade the other way each time. At the 110 strike 2,500 calls are open with gamma 0.0266: if dealers were short all of them, a $1 rise would call for buying 0.0266 × 2,500 × 100 = 6,650 shares; if long all of them, selling 6,650. Open interest doesn't say which.",
		"你以每股 $4.20（每张 $420）从做市商手里买入 5 张 10月18日 100 看涨；做市商的报价是 $4.05 买入、$4.20 卖出，价差 $0.15，每张 $15。每张看涨的 Delta 为 0.52，所以做市商做空的 5 张看涨相当于做空 5 × 100 × 0.52 = 260 股，于是它买入 260 股。ALFA 上涨 $2，Delta 升到约 0.60：这些看涨现在相当于 300 股，做市商再买 40 股。如果 ALFA 下跌 $2，Delta 约为 0.44，相当于 220 股，做市商就卖出 40 股。如果做市商当初是买入 5 张看涨，每一步的交易方向都相反。行权价 110 的看涨有 2,500 张未平仓，Gamma 为 0.0266：假设做市商全部做空，上涨 $1 需要买入 0.0266 × 2,500 × 100 = 6,650 股；假设全部做多，则卖出 6,650 股。未平仓量并不说明是哪一种。",
	),
	misconception: t(
		"The dealer who sold you a call isn't betting the stock falls: once hedged, the dealer's result barely depends on direction. And which way dealers re-hedge depends on whether they are short or long the options, which open interest doesn't show. Work out the option position's delta first, hedge with the opposite number of shares, then ask how that delta changed.",
		"卖给你看涨的做市商并不是在赌股价下跌：对冲之后，它的结果几乎与方向无关。做市商重新对冲时往哪边交易，取决于它做空还是做多这些期权，而未平仓量看不出这一点。先算出期权持仓的 Delta，用相反数量的股票对冲，再看这个 Delta 变了多少。",
	),
	case: (v) => {
		const short = [true, false, true, false][v];
		const put = [false, false, true, true][v];
		const count = [4, 3, 5, 2][v];
		const size = [0.5, 0.6, 0.4, 0.3][v];
		const gamma = [0.05, 0.03, 0.04, 0.05][v];
		const move = [1, 2, -2, -1][v];
		// Two cases state the dealer's own book; two start from a website's assumption.
		const assumed = v >= 2;
		const side = short ? -1 : 1;
		const delta = put ? -size : size;
		const position = Math.round(side * count * 100 * delta);
		const hedge = -position;
		const nextDelta = delta + gamma * move;
		const nextPosition = Math.round(side * count * 100 * nextDelta);
		const trade = -(nextPosition - position);
		const amount = Math.abs(trade);
		const kind = put ? t("puts", "看跌") : t("calls", "看涨");
		const held = short ? t("short", "做空") : t("long", "做多");
		const moved = move > 0 ? t("rises", "上涨") : t("falls", "下跌");
		const dollars = `$${Math.abs(move)}`;
		const drift = t(
			`The ${kind.en}' delta goes from ${plain(delta, 2)} to ${plain(nextDelta, 2)}, so the position moves from ${signed(position)} to ${signed(nextPosition)} share-equivalents against a hedge that hasn't changed, ${signed(hedge)} shares.`,
			`这些${kind.zh}的 Delta 从 ${plain(delta, 2)} 变为 ${plain(nextDelta, 2)}，持仓从 ${signed(position)} 股等价变为 ${signed(nextPosition)}，而对冲没有变，仍是 ${signed(hedge)} 股。`,
		);
		return {
			brief: t(
				`${assumed ? `A positioning website lists a dealer as ${held.en} ${count} ALFA ${kind.en}. Its method note says the figure is worked out from open interest, and the dealer itself has published nothing. Work the case with the website's figure.` : `A dealer opens its trading book to you: it is ${held.en} ${count} ALFA ${kind.en}, ${short ? "sold to" : "bought from"} customers.`} Each has delta ${plain(delta, 2)} and gamma ${plain(gamma, 2)} per $1, and one contract covers 100 shares. The dealer hedges with ALFA shares so the position starts delta-neutral. Then ALFA ${moved.en} ${dollars} and nothing else changes.`,
				`${assumed ? `某个持仓网站把一家做市商列为${held.zh} ${count} 张 ALFA ${kind.zh}。网站的方法说明写着，这个数字由未平仓量推算而来；做市商自己没有公布任何信息。请按网站的数字作答。` : `一家做市商向你打开了它的交易账户：它${held.zh} ${count} 张 ALFA ${kind.zh}，是${short ? "卖给客户" : "从客户手里买入"}的。`}每张 Delta 为 ${plain(delta, 2)}、每 $1 的 Gamma 为 ${plain(gamma, 2)}，一张合约对应 100 股。做市商用 ALFA 股票对冲，让持仓一开始 Delta 中性。随后 ALFA ${moved.zh} ${dollars}，其他条件不变。`,
			),
			questions: [
				n(
					"first-hedge",
					"How many ALFA shares does the dealer trade to start delta-neutral? Enter a purchase as positive and a short sale as negative.",
					"做市商一开始要交易多少股 ALFA 才能做到 Delta 中性？买入填正数，卖空填负数。",
					hedge,
					"shares",
					"股",
					`The ${kind.en} move like ${short ? "−" : ""}${count} × 100 × ${plain(delta, 2)} = ${signed(position)} shares, so the hedge is the opposite: ${signed(hedge)}.`,
					`这些${kind.zh}相当于 ${short ? "−" : ""}${count} × 100 × ${plain(delta, 2)} = ${signed(position)} 股，所以对冲是相反的数量：${signed(hedge)}。`,
				),
				c(
					"rehedge",
					`After ALFA ${moved.en} ${dollars}, what does the dealer do to be delta-neutral again?`,
					`ALFA ${moved.zh} ${dollars} 之后，做市商要怎么做才能重新回到 Delta 中性？`,
					[
						[
							"buy",
							`Buys ${plain(amount)} shares`,
							`买入 ${plain(amount)} 股`,
							`${drift.en} The position gained delta, so buying would add to it; the dealer sells ${plain(amount)}.`,
							`${drift.zh}持仓的 Delta 增加了，买入只会让它更大；做市商要卖出 ${plain(amount)} 股。`,
						],
						[
							"sell",
							`Sells ${plain(amount)} shares`,
							`卖出 ${plain(amount)} 股`,
							`${drift.en} The position lost delta, so selling would take away more; the dealer buys ${plain(amount)}.`,
							`${drift.zh}持仓的 Delta 减少了，卖出只会让它更小；做市商要买入 ${plain(amount)} 股。`,
						],
						[
							"none",
							"Nothing: the first hedge still holds",
							"什么都不做：最初的对冲仍然有效",
							`The first hedge was sized for a delta of ${plain(delta, 2)}. ${drift.en} That leaves ${signed(nextPosition + hedge)} until the dealer trades.`,
							`最初的对冲是按 Delta ${plain(delta, 2)} 设定的。${drift.zh}在做市商交易之前，净额是 ${signed(nextPosition + hedge)}。`,
						],
					],
					trade > 0 ? "buy" : "sell",
					`${drift.en} To get back to zero the dealer ${trade > 0 ? "buys" : "sells"} ${plain(amount)} shares: ${plain(gamma, 2)} × ${dollars} × ${count} × 100.`,
					`${drift.zh}要回到零，做市商${trade > 0 ? "买入" : "卖出"} ${plain(amount)} 股：${plain(gamma, 2)} × ${dollars} × ${count} × 100。`,
				),
				c(
					"gamma-side",
					"How does this dealer's re-hedging trade, compared with ALFA's own moves?",
					"与 ALFA 自身的涨跌相比，这家做市商的重新对冲是怎样交易的？",
					[
						[
							"with",
							"With the move: it buys rises and sells falls (short gamma)",
							"顺着变动：涨时买入、跌时卖出（空 Gamma）",
							`That is a dealer who is short options. This one is long ${count} ${kind.en}, so it is long gamma: here ALFA ${moved.en} and it ${trade > 0 ? "buys" : "sells"}, against the move.`,
							`那是做空期权的做市商。这一家做多 ${count} 张${kind.zh}，是多 Gamma：这里 ALFA ${moved.zh}，它${trade > 0 ? "买入" : "卖出"}，逆着变动。`,
						],
						[
							"against",
							"Against the move: it sells rises and buys falls (long gamma)",
							"逆着变动：涨时卖出、跌时买入（多 Gamma）",
							`That is a dealer who is long options. This one is short ${count} ${kind.en}, so it is short gamma: here ALFA ${moved.en} and it ${trade > 0 ? "buys" : "sells"}, with the move.`,
							`那是做多期权的做市商。这一家做空 ${count} 张${kind.zh}，是空 Gamma：这里 ALFA ${moved.zh}，它${trade > 0 ? "买入" : "卖出"}，顺着变动。`,
						],
						[
							"neither",
							"Neither: a hedged position needs no more trades",
							"都不是：对冲好的持仓不需要再交易",
							`A hedge matches delta at one price. Gamma, ${plain(gamma, 2)} per $1 on each of the ${count} ${kind.en}, changes that delta as ALFA moves, so the dealer has to trade again.`,
							`对冲只在一个价格上与 Delta 相配。这 ${count} 张${kind.zh}每张每 $1 的 Gamma 为 ${plain(gamma, 2)}，ALFA 一动 Delta 就变，所以做市商得再交易。`,
						],
					],
					short ? "with" : "against",
					short
						? `Short ${count} ${kind.en} is short gamma, whether the options are calls or puts: to stay hedged the dealer buys as ALFA rises and sells as it falls, with the move. That describes the dealer's trades, not where ALFA goes next.`
						: `Long ${count} ${kind.en} is long gamma, whether the options are calls or puts: to stay hedged the dealer sells as ALFA rises and buys as it falls, against the move. That describes the dealer's trades, not where ALFA goes next.`,
					short
						? `做空 ${count} 张${kind.zh}就是空 Gamma，不论期权是看涨还是看跌：要保持对冲，ALFA 上涨时做市商买入、下跌时卖出，顺着变动。这描述的是做市商的交易，而不是 ALFA 接下来的走向。`
						: `做多 ${count} 张${kind.zh}就是多 Gamma，不论期权是看涨还是看跌：要保持对冲，ALFA 上涨时做市商卖出、下跌时买入，逆着变动。这描述的是做市商的交易，而不是 ALFA 接下来的走向。`,
				),
				c(
					"evidence",
					`How far can "${held.en} ${count} ${kind.en}" be trusted as this dealer's real position?`,
					`“${held.zh} ${count} 张${kind.zh}”在多大程度上可以当作这家做市商的真实持仓？`,
					[
						[
							"stated",
							"As a fact: it is the dealer's position as the dealer holds it",
							"可以当作事实：这就是做市商实际持有的仓位",
							"Here the dealer has published nothing. The website started from open interest, which counts contracts and names no side, so which side the dealer holds is the website's guess.",
							"这里做市商没有公布任何信息。网站从未平仓量出发，而未平仓量只统计合约张数、不说明方向，所以做市商在哪一边是网站的猜测。",
						],
						[
							"assumed",
							"Only as a guess at the side: nothing here shows which side the dealer holds",
							"只能当作对方向的猜测：这里没有任何信息显示做市商在哪一边",
							"Here you are reading the dealer's own trading book, so the side is known. It is a guess only when someone outside works it out from open interest.",
							"这里你看到的是做市商自己的交易账户，所以方向是已知的。只有外界从未平仓量去推算时，它才是猜测。",
						],
						[
							"open-interest",
							"As a fact: open interest lists each holder's side",
							"可以当作事实：未平仓量列出了每个持有人的方向",
							"Open interest is one number per contract: how many are still open. It names no holder and no side.",
							"未平仓量对每个合约只有一个数字：还有多少张未平仓。它不列出持有人，也不列出方向。",
						],
					],
					assumed ? "assumed" : "stated",
					assumed
						? "The website can see open interest, which says the contracts exist, and nothing about who holds which side. The dealer's side is its assumption, and the hedge you worked out is only as good as that assumption."
						: "This case states the dealer's own book, so the hedge follows from it. Outside the firm nobody sees that book: a positioning figure built from open interest has to assume the side instead.",
					assumed
						? "网站能看到未平仓量，它只说明合约存在，不说明谁持有哪一边。做市商的方向是网站的假设，你算出的对冲也只和这个假设一样可靠。"
						: "这个案例给出了做市商自己的持仓，所以对冲由它直接得出。在机构之外没有人能看到这份持仓：由未平仓量推算的持仓数字，只能改为假设方向。",
				),
			],
		};
	},
};
