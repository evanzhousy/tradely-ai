import { type Copy, count, pick, signedCount, usd } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import { Player } from "../walkthrough/player";
import { Label, Stage } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { dealersAndHedgingFilm } from "./dealers-and-hedging-film";
import {
	type Assumption,
	BUY_AFTER_RISE,
	CONTRACTS,
	DELTA,
	type DealerSide,
	deltaAfter,
	GAMMA,
	HEDGE_SHARES,
	hedgeBook,
	MOVE,
	MULTIPLIER,
	NEEDED_AFTER,
	NEW_DELTA,
	OPEN_INTEREST,
	PREMIUM,
	perContract,
	QUOTE,
	SHARES_PER_CONTRACT,
	SPOT,
	SPREAD,
	STRIKE,
	STRIKE_GAMMA,
	STRIKE_SHARES,
	shareEquivalent,
	strikeTrade,
} from "./dealers-and-hedging-model";
import { fixed2, signedStock, stock } from "./gamma-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

/** The bars' scale: a little past the most the five calls come to move like. */
const BAR_MAX = 320;
const BAR_ROW = 58;
/** The size the first task asks for, and the hedge it comes to. */
const REACH_CONTRACTS = 3;
const REACH_SHARES = shareEquivalent(REACH_CONTRACTS, DELTA);
const HALF = OPEN_INTEREST / 2;
const longAfterFall = hedgeBook("long", -MOVE);

/** "buy 40 shares" / "sell 40 shares", or no trade at zero. */
const tradeText = (trade: number): Copy =>
	trade === 0
		? ["no trade", "不用交易"]
		: trade > 0
			? [`buy ${count(trade)} shares`, `买入 ${count(trade)} 股`]
			: [`sell ${count(-trade)} shares`, `卖出 ${count(-trade)} 股`];

/** Two bars one under the other: what the options move like, and the shares held against them. */
function HedgeBars({
	width,
	locale,
	heading,
	rows,
	gap,
}: {
	width: number;
	locale: Locale;
	heading: string;
	rows: readonly { id: string; label: string; shares: number | null }[];
	/** The stretch between the two bars, when they differ, and what closing it takes. */
	gap?: { from: number; to: number; label: string };
}) {
	const t = tr(locale);
	const left = 8;
	const span = width - left - (width < 520 ? 96 : 120);
	const x = (shares: number) => left + (shares / BAR_MAX) * span;
	return (
		<g>
			<Label x={left} y={16} tone="muted">
				{heading}
			</Label>
			{rows.map((row, i) => {
				const y = 34 + i * BAR_ROW;
				return (
					<g key={row.id}>
						<Label x={left} y={y + 10} tone="small">
							{row.label}
						</Label>
						<rect
							x={left}
							y={y + 18}
							width={span}
							height={18}
							rx={4}
							className="wt-panel-shape"
						/>
						{row.shares === null ? null : (
							<rect
								x={left}
								y={y + 18}
								width={x(row.shares) - left}
								height={18}
								rx={4}
								className={
									i === 0 ? "wt-bar-neutral ev-modeled" : "wt-bar-neutral"
								}
							/>
						)}
						<Label x={width - 8} y={y + 32} anchor="end">
							{row.shares === null
								? "—"
								: t([`${count(row.shares)} shares`, `${count(row.shares)} 股`])}
						</Label>
					</g>
				);
			})}
			{gap ? (
				<g>
					<rect
						x={x(Math.min(gap.from, gap.to))}
						y={34 + BAR_ROW + 18}
						width={x(Math.abs(gap.to - gap.from)) - left}
						height={18}
						rx={4}
						className="wt-focus-shape"
					/>
					<Label x={left} y={34 + 2 * BAR_ROW + 6} tone="accent">
						{gap.label}
					</Label>
				</g>
			) : null}
		</g>
	);
}

const barsHeight = 34 + 2 * BAR_ROW + 16;

// ——— Scene 1: who sold you the calls, and what they do next ———

type SoldState = { contracts: number; stage: 0 | 1 | 2 };

function SoldScene({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SoldState;
	explore: SoldState | null;
	setExplore: (next: SoldState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const shares = shareEquivalent(shown.contracts, DELTA);
	const result: ResultItem[] = [
		{
			id: "like",
			label: t(["The calls sold move like", "卖出的看涨相当于"]),
			value: t([`${count(shares)} shares short`, `做空 ${count(shares)} 股`]),
			note: `${shown.contracts} × ${MULTIPLIER} × ${fixed2(DELTA)}`,
			evidence: "modeled",
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "hedge",
			label: t(["Shares the dealer buys", "做市商买入的股票"]),
			value: t([`${count(shares)} shares`, `${count(shares)} 股`]),
			note: t(["net 0: direction hedged", "净额 0：方向已对冲"]),
			evidence: "calculated",
		});
	if (shown.stage >= 2)
		result.push({
			id: "spread",
			label: t(["The spread", "价差"]),
			value: t([`${usd(SPREAD)} a share`, `每股 ${usd(SPREAD)}`]),
			note: t([
				`${usd(perContract(SPREAD), 0)} a contract: ${usd(QUOTE.bid)} to buy, ${usd(QUOTE.ask)} to sell`,
				`每张 ${usd(perContract(SPREAD), 0)}：${usd(QUOTE.bid)} 买入，${usd(QUOTE.ask)} 卖出`,
			]),
			evidence: "observed",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Two bars: the shares the dealer's sold calls move like, and the shares the dealer buys as a hedge",
						"两条横条：做市商卖出的看涨相当于多少股，以及做市商买入多少股作为对冲",
					])}
					height={barsHeight}
				>
					{(width) => (
						<HedgeBars
							width={width}
							locale={locale}
							heading={t([
								`Dealer · sold ${shown.contracts} Oct 18 100 calls · delta ${fixed2(DELTA)}`,
								`做市商 · 卖出 ${shown.contracts} 张 10月18日 100 看涨 · Delta ${fixed2(DELTA)}`,
							])}
							rows={[
								{
									id: "like",
									label: t([
										"Sold calls: like being short",
										"卖出看涨：相当于做空",
									]),
									shares,
								},
								{
									id: "held",
									label: t(["Shares bought as the hedge", "买入股票作为对冲"]),
									shares: shown.stage >= 1 ? shares : null,
								},
							]}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<RangeControl
						label={t(["Calls you buy", "你买入的看涨张数"])}
						value={explore.contracts}
						display={String(explore.contracts)}
						min={1}
						max={CONTRACTS}
						step={1}
						onChange={(contracts) => setExplore({ ...explore, contracts })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"When you buy an option, the seller may be a market maker, also called a dealer: a firm that stands ready to buy and to sell at the prices it quotes, and aims to earn the gap between them, the bid-ask spread. It doesn't want the stock's direction, so it hedges: an option position moves like delta × contracts × 100 shares, and the dealer holds the opposite number of shares. A dealer who sold puts would sell shares short instead, because a put's delta is negative. The seller isn't always a dealer; it can be another investor, and a trade record doesn't say which.",
						"你买入期权时，卖方可能是做市商（dealer）：这类机构随时准备按自己报出的买入价和卖出价成交，目标是赚取两者之间的差额，也就是买卖价差。它不想承担股价的方向，所以会对冲：一笔期权持仓的涨跌相当于 Delta × 张数 × 100 股，做市商就持有相反数量的股票。卖出看跌的做市商则会卖空股票，因为看跌的 Delta 为负。卖方不一定是做市商，也可能是另一位投资者，成交记录并不说明是哪一种。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: the hedge moves with the stock ———

type RehedgeState = { side: DealerSide; move: number; rehedged: boolean };

function RehedgeScene({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: RehedgeState;
	explore: RehedgeState | null;
	setExplore: (next: RehedgeState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const book = hedgeBook(shown.side, shown.move);
	const short = shown.side === "short";
	const delta = deltaAfter(shown.move);
	const needed = Math.abs(book.options);
	const held = Math.abs(book.shares);
	const done = shown.rehedged && !explore;
	const result: ResultItem[] = [
		{
			id: "delta",
			label: t([
				`Delta at ${stock(SPOT + shown.move)}`,
				`${stock(SPOT + shown.move)} 时的 Delta`,
			]),
			value: fixed2(delta),
			note:
				shown.move === 0
					? t(["today", "今天"])
					: `${fixed2(DELTA)} + ${fixed2(GAMMA)} × ${signedStock(shown.move)}`,
			evidence: "modeled",
		},
		{
			id: "net",
			label: t(["Calls and shares together", "看涨与股票合计"]),
			value: done
				? t(["0 shares", "0 股"])
				: t([`${signedCount(book.net)} shares`, `${signedCount(book.net)} 股`]),
			note: done
				? t(["hedged again", "重新对冲完成"])
				: `${signedCount(book.options)} ${book.shares < 0 ? "−" : "+"} ${count(Math.abs(book.shares))}`,
			tone: !done && book.net !== 0 ? "caution" : "neutral",
			evidence: "calculated",
		},
	];
	if (shown.rehedged || explore)
		result.push({
			id: "trade",
			label: t(["To be hedged again", "要重新对冲"]),
			value: t(tradeText(book.trade)),
			note:
				book.trade === 0
					? t(["the hedge still fits", "对冲仍然合适"])
					: book.trade > 0 === shown.move > 0
						? t(["with the move", "顺着变动"])
						: t(["against the move", "逆着变动"]),
			tone: "focus",
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Two bars: the shares the dealer's calls move like at this price, and the shares held as the hedge, with the stretch between them",
						"两条横条：在这个价格上做市商的看涨相当于多少股，以及作为对冲持有多少股，并标出两者之间的差距",
					])}
					height={barsHeight}
				>
					{(width) => (
						<HedgeBars
							width={width}
							locale={locale}
							heading={
								short
									? t([
											`Dealer · sold ${CONTRACTS} calls · ALFA ${stock(SPOT + shown.move)}`,
											`做市商 · 卖出 ${CONTRACTS} 张看涨 · ALFA ${stock(SPOT + shown.move)}`,
										])
									: t([
											`Dealer · bought ${CONTRACTS} calls · ALFA ${stock(SPOT + shown.move)}`,
											`做市商 · 买入 ${CONTRACTS} 张看涨 · ALFA ${stock(SPOT + shown.move)}`,
										])
							}
							rows={[
								{
									id: "like",
									label: short
										? t([
												"Sold calls: like being short",
												"卖出看涨：相当于做空",
											])
										: t([
												"Bought calls: like being long",
												"买入看涨：相当于做多",
											]),
									shares: needed,
								},
								{
									id: "held",
									label: short
										? t(["Shares held as the hedge", "作为对冲持有的股票"])
										: t([
												"Shares sold short as the hedge",
												"作为对冲卖空的股票",
											]),
									shares: done ? needed : held,
								},
							]}
							gap={
								done || needed === held
									? undefined
									: {
											from: held,
											to: needed,
											label: t([
												`${count(Math.abs(needed - held))} shares apart`,
												`相差 ${count(Math.abs(needed - held))} 股`,
											]),
										}
							}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["The dealer", "做市商"])}
							value={explore.side}
							options={[
								[
									"short",
									t([`Sold ${CONTRACTS} calls`, `卖出 ${CONTRACTS} 张看涨`]),
								],
								[
									"long",
									t([`Bought ${CONTRACTS} calls`, `买入 ${CONTRACTS} 张看涨`]),
								],
							]}
							onChange={(side) => setExplore({ ...explore, side })}
						/>
						<RangeControl
							label={t(["ALFA moves", "ALFA 变动"])}
							value={explore.move}
							display={signedStock(explore.move)}
							min={-MOVE}
							max={MOVE}
							step={1}
							onChange={(move) => setExplore({ ...explore, move })}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						"A hedge matches delta at one price, and delta changes as the stock moves: that change is gamma. A dealer who is short options is short gamma. Its option position gains delta the wrong way on every move, so to stay hedged it buys shares after a rise and sells after a fall, trading with the move. A dealer who is long options is long gamma and does the opposite: it sells after a rise and buys after a fall, against the move. This holds for calls and puts alike. It describes the dealer's own trades; it doesn't say where the stock goes next.",
						"对冲只在一个价格上与 Delta 相配，而股价一动 Delta 就变：这个变化就是 Gamma。做空期权的做市商是空 Gamma（Gamma 为负）。每次变动，它的期权持仓的 Delta 都朝不利的方向变，所以要保持对冲，上涨后得买入股票、下跌后得卖出，顺着变动交易。做多期权的做市商是多 Gamma（Gamma 为正），做法相反：上涨后卖出、下跌后买入，逆着变动交易。看涨和看跌都是如此。这描述的是做市商自己的交易，并不说明股价接下来往哪里走。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: many contracts at one strike, and a side nobody outside can see ———

type SideState = { assumption: Assumption | "none"; move: 1 | -1 };

const SIDE_ROW = 44;

function SideScene({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SideState;
	explore: SideState | null;
	setExplore: (next: SideState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const rows: { id: Assumption; label: Copy }[] = [
		{
			id: "short",
			label: [
				`Dealers sold all ${count(OPEN_INTEREST)}`,
				`做市商卖出了全部 ${count(OPEN_INTEREST)} 张`,
			],
		},
		{
			id: "long",
			label: [
				`Dealers bought all ${count(OPEN_INTEREST)}`,
				`做市商买入了全部 ${count(OPEN_INTEREST)} 张`,
			],
		},
		{
			id: "split",
			label: [
				`Dealers bought ${count(HALF)}, sold ${count(HALF)}`,
				`做市商买入 ${count(HALF)} 张、卖出 ${count(HALF)} 张`,
			],
		},
	];
	const chosen = shown.assumption === "none" ? null : shown.assumption;
	const result: ResultItem[] = [
		{
			id: "open-interest",
			label: t(["Open interest", "未平仓量"]),
			value: t([
				`${count(OPEN_INTEREST)} contracts`,
				`${count(OPEN_INTEREST)} 张`,
			]),
			note: t([`Oct 18 ${STRIKE} call`, `10月18日 ${STRIKE} 看涨`]),
			evidence: "observed",
		},
		{
			id: "per-dollar",
			label: t(["Delta change per $1", "每 $1 的 Delta 变化"]),
			value: t([
				`${count(STRIKE_SHARES)} shares`,
				`${count(STRIKE_SHARES)} 股`,
			]),
			note: `${STRIKE_GAMMA} × ${count(OPEN_INTEREST)} × ${MULTIPLIER}`,
			evidence: "modeled",
		},
		chosen
			? {
					id: "hedge",
					label: t(["Hedge under this assumption", "这个假设下的对冲"]),
					value: t(tradeText(strikeTrade(chosen, shown.move))),
					note: t([
						`if ALFA ${shown.move > 0 ? "rises" : "falls"} $1`,
						`若 ALFA ${shown.move > 0 ? "上涨" : "下跌"} $1`,
					]),
					tone: "caution",
					evidence: "modeled",
				}
			: {
					id: "hedge",
					label: t(["Which side dealers hold", "做市商在哪一边"]),
					value: t(["not shown", "未显示"]),
					note: t(["open interest counts contracts", "未平仓量只统计张数"]),
					tone: "caution",
					evidence: "unknown",
				},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Three assumptions about who holds the open contracts at one strike, each with the hedge trade it implies for a one-dollar move",
						"关于某个行权价上未平仓合约由谁持有的三种假设，以及每种假设在 $1 变动下对应的对冲交易",
					])}
					height={30 + rows.length * (SIDE_ROW + 6)}
				>
					{(width) => (
						<g>
							<Label x={8} y={16} tone="muted">
								{t([
									`Oct 18 ${STRIKE} call · ${count(OPEN_INTEREST)} open · ALFA ${shown.move > 0 ? "+" : "−"}$1`,
									`10月18日 ${STRIKE} 看涨 · 未平仓 ${count(OPEN_INTEREST)} 张 · ALFA ${shown.move > 0 ? "+" : "−"}$1`,
								])}
							</Label>
							{rows.map((row, i) => {
								const y = 26 + i * (SIDE_ROW + 6);
								const on = row.id === chosen;
								return (
									<g key={row.id}>
										<rect
											x={4}
											y={y}
											width={width - 8}
											height={SIDE_ROW}
											rx={8}
											className={on ? "wt-focus-shape" : "wt-panel-shape"}
										/>
										<Label
											x={14}
											y={y + SIDE_ROW / 2 + 4}
											tone={on ? "accent" : "small"}
										>
											{t(row.label)}
										</Label>
										<Label
											x={width - 14}
											y={y + SIDE_ROW / 2 + 5}
											anchor="end"
											tone={on ? undefined : "small"}
										>
											{chosen
												? t(tradeText(strikeTrade(row.id, shown.move)))
												: "?"}
										</Label>
									</g>
								);
							})}
						</g>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Assume dealers", "假设做市商"])}
							value={
								explore.assumption === "none" ? "short" : explore.assumption
							}
							options={[
								["short", t(["Sold all", "全部卖出"])],
								["long", t(["Bought all", "全部买入"])],
								["split", t(["Half and half", "各一半"])],
							]}
							onChange={(assumption) => setExplore({ ...explore, assumption })}
						/>
						<ChoiceField
							label={t(["ALFA moves", "ALFA 变动"])}
							value={explore.move > 0 ? "up" : "down"}
							options={[
								["up", "+$1"],
								["down", "−$1"],
							]}
							onChange={(move) =>
								setExplore({ ...explore, move: move === "up" ? 1 : -1 })
							}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						"Open interest is the number of contracts still open, counted once a day. Every open contract has a holder and a writer, so the count is the same whoever they are. Dealers don't publish their books, and nobody outside sees them. A dealer-positioning figure, such as the gamma exposure numbers in later lessons, starts from open interest and adds an assumption about which side dealers hold; change the assumption and the same contracts give the opposite trade. With many contracts open at one strike the hedge can be a large, mechanical flow in the stock, unrelated to anyone's view of the company. It is still a model of a response, not a forecast of the price.",
						"未平仓量是仍然存续的合约张数，每天统计一次。每张未平仓合约都有一个持有人和一个义务方，所以不论他们是谁，这个数字都一样。做市商不公布自己的持仓，外界也看不到。所谓“做市商持仓”数字（例如后面课程里的 Gamma 敞口），都是从未平仓量出发，再加上“做市商在哪一边”的假设；换一个假设，同样的合约就得出相反的交易。当某个行权价上有大量未平仓合约时，对冲可能成为股票上一股规模很大的机械性交易，与任何人对公司的看法无关。但它仍然只是对一种反应的建模，不是对价格的预测。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<SoldState, SoldState>({
		id: "sold",
		label: ["Meet the other side", "认识对手方"],
		title: [
			"The dealer who sells you a call hedges it",
			"卖给你看涨的做市商会对冲",
		],
		predict: {
			prompt: [
				`You buy ${CONTRACTS} ALFA Oct 18 100 calls, each with delta ${fixed2(DELTA)}, from a dealer, who hedges the sale. One contract covers ${MULTIPLIER} shares. How many ALFA shares does the dealer trade? Enter a sale as a negative number.`,
				`你从一家做市商手里买入 ${CONTRACTS} 张 ALFA 10月18日 100 看涨，每张 Delta 为 ${fixed2(DELTA)}；做市商会为这笔卖出做对冲。一张合约对应 ${MULTIPLIER} 股。做市商要交易多少股 ALFA？卖出请填负数。`,
			],
			choices: [
				{
					id: "buy",
					label: [
						`Buys ${count(HEDGE_SHARES)} shares`,
						`买入 ${count(HEDGE_SHARES)} 股`,
					],
				},
				{
					id: "sell",
					label: [
						`Sells ${count(HEDGE_SHARES)} shares short`,
						`卖空 ${count(HEDGE_SHARES)} 股`,
					],
					why: [
						`The dealer sold the calls, so it loses when ALFA rises. Selling shares short would lose on a rise too; it buys ${count(HEDGE_SHARES)} so the two cancel.`,
						`做市商卖出了看涨，ALFA 上涨时它会亏。卖空股票在上涨时同样亏；它要买入 ${count(HEDGE_SHARES)} 股，两边才能抵消。`,
					],
				},
				{
					id: "full",
					label: [
						`Buys ${count(CONTRACTS * MULTIPLIER)} shares`,
						`买入 ${count(CONTRACTS * MULTIPLIER)} 股`,
					],
					why: [
						`That is ${MULTIPLIER} shares for every call, as if delta were 1. Each call moves like ${fixed2(DELTA)} of ${MULTIPLIER} shares, so the hedge is ${CONTRACTS} × ${MULTIPLIER} × ${fixed2(DELTA)} = ${count(HEDGE_SHARES)}.`,
						`这是按每张看涨 ${MULTIPLIER} 股来算，等于把 Delta 当成了 1。每张看涨只相当于 ${MULTIPLIER} 股的 ${fixed2(DELTA)}，所以对冲是 ${CONTRACTS} × ${MULTIPLIER} × ${fixed2(DELTA)} = ${count(HEDGE_SHARES)} 股。`,
					],
				},
			],
			answer: "buy",
			entry: {
				answer: HEDGE_SHARES,
				tolerance: 0,
				unit: [" shares", " 股"],
			},
			explain: [
				`${CONTRACTS} × ${MULTIPLIER} × ${fixed2(DELTA)} = ${count(HEDGE_SHARES)}: the short calls move like ${count(HEDGE_SHARES)} shares short, so the dealer buys ${count(HEDGE_SHARES)} shares and the two cancel.`,
				`${CONTRACTS} × ${MULTIPLIER} × ${fixed2(DELTA)} = ${count(HEDGE_SHARES)}：做空的看涨相当于做空 ${count(HEDGE_SHARES)} 股，所以做市商买入 ${count(HEDGE_SHARES)} 股，两边抵消。`,
			],
		},
		beats: [
			{
				id: "sold",
				label: ["Sold", "卖出"],
				caption: [
					`You pay ${usd(QUOTE.ask)} a share: ${usd(perContract(QUOTE.ask), 0)} a contract, ${usd(PREMIUM, 0)} for ${CONTRACTS}. The dealer is now short ${CONTRACTS} calls, which lose when ALFA rises: like being short ${CONTRACTS} × ${MULTIPLIER} × ${fixed2(DELTA)} = ${count(HEDGE_SHARES)} shares.`,
					`你每股付 ${usd(QUOTE.ask)}：每张 ${usd(perContract(QUOTE.ask), 0)}，${CONTRACTS} 张共 ${usd(PREMIUM, 0)}。做市商现在做空 ${CONTRACTS} 张看涨，ALFA 上涨时会亏：相当于做空 ${CONTRACTS} × ${MULTIPLIER} × ${fixed2(DELTA)} = ${count(HEDGE_SHARES)} 股。`,
				],
				state: { contracts: CONTRACTS, stage: 0 },
			},
			{
				id: "hedged",
				label: ["Hedged", "已对冲"],
				caption: [
					`So the dealer buys ${count(HEDGE_SHARES)} ALFA shares. On a small move, what the calls lose the shares gain: the net is 0, and the dealer isn't betting on direction.`,
					`于是做市商买入 ${count(HEDGE_SHARES)} 股 ALFA。小幅变动时，看涨亏掉的由股票赚回：净额为 0，做市商并没有赌方向。`,
				],
				state: { contracts: CONTRACTS, stage: 1 },
			},
			{
				id: "spread",
				label: ["The spread", "价差"],
				caption: [
					`What it aims to keep is the gap between its two prices: ${usd(QUOTE.bid)} to buy, ${usd(QUOTE.ask)} to sell, a spread of ${usd(SPREAD)} a share, ${usd(perContract(SPREAD), 0)} a contract.`,
					`它想赚的是两个报价之间的差额：${usd(QUOTE.bid)} 买入、${usd(QUOTE.ask)} 卖出，价差为每股 ${usd(SPREAD)}，每张 ${usd(perContract(SPREAD), 0)}。`,
				],
				state: { contracts: CONTRACTS, stage: 2 },
			},
		],
		explore: {
			prompt: ["Change how many calls you buy.", "改变你买入的看涨张数。"],
			start: () => ({ contracts: CONTRACTS, stage: 2 }),
			task: {
				kind: "reach",
				prompt: [
					`Find the size at which the dealer's hedge is ${count(REACH_SHARES)} shares.`,
					`找出让做市商的对冲正好是 ${count(REACH_SHARES)} 股的张数。`,
				],
				reached: (e) => e.contracts === REACH_CONTRACTS,
				done: [
					`Each call moves like ${fixed2(DELTA)} × ${MULTIPLIER} = ${count(SHARES_PER_CONTRACT)} shares, so ${REACH_CONTRACTS} contracts take ${count(REACH_SHARES)}. The hedge follows the size and the delta; the dealer's opinion of ALFA never enters.`,
					`每张看涨相当于 ${fixed2(DELTA)} × ${MULTIPLIER} = ${count(SHARES_PER_CONTRACT)} 股，所以 ${REACH_CONTRACTS} 张需要 ${count(REACH_SHARES)} 股。对冲取决于张数和 Delta，与做市商对 ALFA 的看法无关。`,
				],
			},
		},
		View: SoldScene,
	}),
	defineScene<RehedgeState, RehedgeState>({
		id: "rehedge",
		label: ["Follow the hedge", "跟随对冲"],
		title: ["The hedge moves with the stock", "对冲会随股价变动"],
		predict: {
			prompt: [
				`The dealer is short ${CONTRACTS} calls and holds ${count(HEDGE_SHARES)} shares. ALFA rises $${MOVE}, and each call's delta goes from ${fixed2(DELTA)} to ${fixed2(NEW_DELTA)}. How many shares does the dealer trade to be hedged again? Enter a sale as a negative number.`,
				`做市商做空 ${CONTRACTS} 张看涨，持有 ${count(HEDGE_SHARES)} 股。ALFA 上涨 $${MOVE}，每张看涨的 Delta 从 ${fixed2(DELTA)} 变为 ${fixed2(NEW_DELTA)}。做市商要交易多少股才能重新对冲？卖出请填负数。`,
			],
			choices: [
				{
					id: "buy",
					label: [
						`Buys ${count(BUY_AFTER_RISE)} more shares`,
						`再买入 ${count(BUY_AFTER_RISE)} 股`,
					],
				},
				{
					id: "sell",
					label: [
						`Sells ${count(BUY_AFTER_RISE)} shares`,
						`卖出 ${count(BUY_AFTER_RISE)} 股`,
					],
					why: [
						`The short calls now move like ${count(NEEDED_AFTER)} shares short against ${count(HEDGE_SHARES)} held, so the dealer is ${count(BUY_AFTER_RISE)} short. Selling would widen that; it buys.`,
						`做空的看涨现在相当于做空 ${count(NEEDED_AFTER)} 股，而持有的只有 ${count(HEDGE_SHARES)} 股，所以还差 ${count(BUY_AFTER_RISE)} 股。卖出只会让差距更大；它要买入。`,
					],
				},
				{
					id: "none",
					label: ["None: it is already hedged", "不交易：已经对冲好了"],
					why: [
						`The hedge was sized for a delta of ${fixed2(DELTA)}. At ${fixed2(NEW_DELTA)} the calls move like ${count(NEEDED_AFTER)} shares, and the dealer holds ${count(HEDGE_SHARES)}.`,
						`对冲是按 Delta ${fixed2(DELTA)} 设定的。Delta 为 ${fixed2(NEW_DELTA)} 时，看涨相当于 ${count(NEEDED_AFTER)} 股，而做市商只持有 ${count(HEDGE_SHARES)} 股。`,
					],
				},
			],
			answer: "buy",
			entry: {
				answer: BUY_AFTER_RISE,
				tolerance: 0,
				unit: [" shares", " 股"],
			},
			revealAt: 2,
			explain: [
				`${CONTRACTS} × ${MULTIPLIER} × ${fixed2(NEW_DELTA)} = ${count(NEEDED_AFTER)} against ${count(HEDGE_SHARES)} held: the dealer buys ${count(BUY_AFTER_RISE)} more, after the price has risen.`,
				`${CONTRACTS} × ${MULTIPLIER} × ${fixed2(NEW_DELTA)} = ${count(NEEDED_AFTER)}，而持有的是 ${count(HEDGE_SHARES)} 股：做市商在价格上涨之后再买入 ${count(BUY_AFTER_RISE)} 股。`,
			],
		},
		beats: [
			{
				id: "hedged",
				label: ["Hedged", "已对冲"],
				caption: [
					`At ALFA ${stock(SPOT)} the dealer's ${CONTRACTS} short calls move like ${count(HEDGE_SHARES)} shares short, and it holds ${count(HEDGE_SHARES)} shares: net 0.`,
					`ALFA 为 ${stock(SPOT)} 时，做市商做空的 ${CONTRACTS} 张看涨相当于做空 ${count(HEDGE_SHARES)} 股，而它持有 ${count(HEDGE_SHARES)} 股：净额为 0。`,
				],
				state: { side: "short", move: 0, rehedged: false },
			},
			{
				id: "move",
				label: [`+$${MOVE}`, `+$${MOVE}`],
				caption: [
					`ALFA rises $${MOVE}. Gamma lifts delta to about ${fixed2(NEW_DELTA)}, so the calls now move like ${count(NEEDED_AFTER)} shares short. The dealer still holds ${count(HEDGE_SHARES)}.`,
					`ALFA 上涨 $${MOVE}。Gamma 把 Delta 抬到约 ${fixed2(NEW_DELTA)}，这些看涨现在相当于做空 ${count(NEEDED_AFTER)} 股。做市商持有的仍是 ${count(HEDGE_SHARES)} 股。`,
				],
				state: { side: "short", move: MOVE, rehedged: false },
			},
			{
				id: "rehedge",
				label: ["Rehedge", "重新对冲"],
				caption: [
					`It buys ${count(BUY_AFTER_RISE)} more shares, after the rise. A dealer who is short options is short gamma: it buys rises and sells falls, trading with the move.`,
					`它在上涨之后再买入 ${count(BUY_AFTER_RISE)} 股。做空期权的做市商是空 Gamma：涨时买入、跌时卖出，顺着变动交易。`,
				],
				state: { side: "short", move: MOVE, rehedged: true },
			},
		],
		explore: {
			prompt: [
				"Switch the dealer's side and move ALFA.",
				"切换做市商的方向，并移动 ALFA。",
			],
			start: () => ({ side: "short", move: 0, rehedged: false }),
			task: {
				kind: "answer",
				prompt: [
					`A dealer who bought ${CONTRACTS} calls is short ${count(HEDGE_SHARES)} shares as its hedge. ALFA falls $${MOVE}. What does it trade to be hedged again?`,
					`一家做市商买入了 ${CONTRACTS} 张看涨，并卖空 ${count(HEDGE_SHARES)} 股作为对冲。ALFA 下跌 $${MOVE}。它要怎么交易才能重新对冲？`,
				],
				choices: [
					{
						id: "buy",
						label: [
							`Buys ${count(longAfterFall.trade)} shares`,
							`买入 ${count(longAfterFall.trade)} 股`,
						],
					},
					{
						id: "sell",
						label: [
							`Sells ${count(longAfterFall.trade)} shares`,
							`卖出 ${count(longAfterFall.trade)} 股`,
						],
					},
					{
						id: "all",
						label: [
							`Buys ${count(longAfterFall.options)} shares`,
							`买入 ${count(longAfterFall.options)} 股`,
						],
					},
				],
				answer: "buy",
				done: [
					`After the fall its calls move like ${count(longAfterFall.options)} shares against ${count(-longAfterFall.shares)} sold short, so it buys ${count(longAfterFall.trade)} back. Long options is long gamma: it sells rises and buys falls, against the move. The dealer who sold calls does the opposite.`,
					`下跌之后，它的看涨相当于 ${count(longAfterFall.options)} 股，而卖空的是 ${count(-longAfterFall.shares)} 股，所以它买回 ${count(longAfterFall.trade)} 股。做多期权就是多 Gamma：涨时卖出、跌时买入，逆着变动交易。卖出看涨的做市商则正好相反。`,
				],
			},
		},
		View: RehedgeScene,
	}),
	defineScene<SideState, SideState>({
		id: "side",
		label: ["Check what is known", "核对已知信息"],
		title: [
			"Open interest doesn't show the dealer's side",
			"未平仓量看不出做市商在哪一边",
		],
		predict: {
			prompt: [
				`${count(OPEN_INTEREST)} Oct 18 ${STRIKE} calls are open, and a $1 move in ALFA changes their delta by ${count(STRIKE_SHARES)} shares in all. What do dealers trade when ALFA rises $1?`,
				`10月18日 ${STRIKE} 看涨有 ${count(OPEN_INTEREST)} 张未平仓，ALFA 每变动 $1，它们的 Delta 合计变化 ${count(STRIKE_SHARES)} 股。ALFA 上涨 $1 时，做市商会怎么交易？`,
			],
			choices: [
				{
					id: "unknown",
					label: [
						"It can't be told from this: it depends on which side they hold",
						"仅凭这些无法判断：取决于他们在哪一边",
					],
				},
				{
					id: "buy",
					label: [
						`They buy ${count(STRIKE_SHARES)} shares`,
						`买入 ${count(STRIKE_SHARES)} 股`,
					],
					why: [
						`That is right only if dealers sold all ${count(OPEN_INTEREST)} calls. Open interest counts open contracts; it doesn't say which side dealers hold.`,
						`只有当做市商卖出了全部 ${count(OPEN_INTEREST)} 张看涨时才是这样。未平仓量统计的是未平仓合约的张数，不说明做市商在哪一边。`,
					],
				},
				{
					id: "sell",
					label: [
						`They sell ${count(STRIKE_SHARES)} shares`,
						`卖出 ${count(STRIKE_SHARES)} 股`,
					],
					why: [
						`That is right only if dealers bought all ${count(OPEN_INTEREST)} calls. Open interest counts open contracts; it doesn't say which side dealers hold.`,
						`只有当做市商买入了全部 ${count(OPEN_INTEREST)} 张看涨时才是这样。未平仓量统计的是未平仓合约的张数，不说明做市商在哪一边。`,
					],
				},
			],
			answer: "unknown",
			revealAt: 2,
			explain: [
				`If dealers sold them they buy ${count(STRIKE_SHARES)}; if they bought them they sell ${count(STRIKE_SHARES)}. Open interest is ${count(OPEN_INTEREST)} either way, so the answer rests on an assumption.`,
				`如果做市商卖出了它们，就买入 ${count(STRIKE_SHARES)} 股；如果买入了它们，就卖出 ${count(STRIKE_SHARES)} 股。两种情况下未平仓量都是 ${count(OPEN_INTEREST)}，所以答案取决于假设。`,
			],
		},
		beats: [
			{
				id: "count",
				label: ["The count", "张数"],
				caption: [
					`Open interest is the number of contracts still open: ${count(OPEN_INTEREST)} of the Oct 18 ${STRIKE} calls. Each has gamma ${STRIKE_GAMMA}, so a $1 move changes their delta by ${STRIKE_GAMMA} × ${count(OPEN_INTEREST)} × ${MULTIPLIER} = ${count(STRIKE_SHARES)} shares. The count names no holder.`,
					`未平仓量是仍然存续的合约张数：10月18日 ${STRIKE} 看涨有 ${count(OPEN_INTEREST)} 张。每张 Gamma 为 ${STRIKE_GAMMA}，所以 ALFA 变动 $1，它们的 Delta 变化 ${STRIKE_GAMMA} × ${count(OPEN_INTEREST)} × ${MULTIPLIER} = ${count(STRIKE_SHARES)} 股。这个数字不说明谁持有。`,
				],
				state: { assumption: "none", move: 1 },
			},
			{
				id: "short",
				label: ["If sold", "假设卖出"],
				caption: [
					`Assume dealers sold all ${count(OPEN_INTEREST)}. They are short gamma, and a $1 rise has them buy ${count(STRIKE_SHARES)} shares.`,
					`假设做市商卖出了全部 ${count(OPEN_INTEREST)} 张。他们是空 Gamma，上涨 $1 时要买入 ${count(STRIKE_SHARES)} 股。`,
				],
				state: { assumption: "short", move: 1 },
			},
			{
				id: "long",
				label: ["If bought", "假设买入"],
				caption: [
					`Assume they bought all ${count(OPEN_INTEREST)} instead: long gamma, and the same rise has them sell ${count(STRIKE_SHARES)}. Same open interest, opposite trade. The figure is a model of a hedge, not a forecast of ALFA.`,
					`改为假设他们买入了全部 ${count(OPEN_INTEREST)} 张：多 Gamma，同样的上涨要卖出 ${count(STRIKE_SHARES)} 股。未平仓量相同，交易相反。这个数字是对一笔对冲的建模，不是对 ALFA 的预测。`,
				],
				state: { assumption: "long", move: 1 },
			},
		],
		explore: {
			prompt: [
				"Change the assumption and the direction of the move.",
				"改变假设和变动的方向。",
			],
			start: () => ({ assumption: "short", move: 1 }),
			task: {
				kind: "reach",
				prompt: [
					`Find an assumption under which these ${count(OPEN_INTEREST)} contracts call for no hedge trade at all.`,
					`找出一种假设，让这 ${count(OPEN_INTEREST)} 张合约完全不需要对冲交易。`,
				],
				reached: (e) => e.assumption === "split",
				done: [
					`If dealers bought ${count(HALF)} and sold ${count(HALF)}, their hedges cancel: no trade. Open interest is ${count(OPEN_INTEREST)} under all three assumptions, which is why it can't tell you the hedging flow by itself.`,
					`如果做市商买入 ${count(HALF)} 张、卖出 ${count(HALF)} 张，对冲互相抵消：不用交易。三种假设下未平仓量都是 ${count(OPEN_INTEREST)}，所以单凭它无法知道对冲交易的方向。`,
				],
			},
		},
		View: SideScene,
	}),
] as const;

export function DealersAndHedgingWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="dealers-and-hedging"
			label={[
				"Interactive lesson on dealers and hedging",
				"做市商与对冲互动课",
			]}
			film={dealersAndHedgingFilm}
			scenes={scenes}
		/>
	);
}
