import {
	type Copy,
	expiries,
	percent,
	pick,
	signedUsd,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	ContractTicket,
	type TicketField,
	ticketHeight,
} from "../walkthrough/instruments/contract-ticket";
import {
	type PayoffBand,
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import { Player } from "../walkthrough/player";
import { Stage } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { firstSpreadTradeFilm } from "./first-spread-trade-film";
import {
	ACCOUNT,
	accountShare,
	BREAK_EVEN,
	bestCase,
	CALL_AHEAD_FROM,
	CALL_BREAK_EVEN,
	CAP_PERCENT,
	callProfit,
	closeCredit,
	closeProfit,
	DEBIT,
	ENDS,
	type End,
	EXIT,
	EXIT_LOSS,
	EXIT_PROFIT,
	LONG,
	LOSS_CAP,
	MAX_GAIN,
	MAX_LOSS,
	PAID,
	PLAN_SPREADS,
	RANGE,
	RECEIVED,
	SHARES,
	SHORT,
	SIZE_LIMIT,
	STRICT_CAP,
	STRICT_PERCENT,
	settle,
	sharesCash,
	spreadProfit,
	spreadsWithin,
	VIEW_LEVEL,
	WIDTH,
	worstCase,
} from "./first-spread-trade-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);
/** Whole dollars from dollars: "$215", "+$285". */
const dollars = (value: number) => usd(value * 100, 0);
const signedDollars = (value: number) => signedUsd(value * 100, 0);
const price = (spot: number) =>
	Number.isInteger(spot) ? `$${spot}` : `$${spot.toFixed(2)}`;
/** The worst case as a share of the account, exact to the cent: "4.3%", "2.15%". */
const shareOf = (spreads: number) =>
	percent(accountShare(spreads), 2).replace(/0%$/, "%");
const toneOf = (value: number) =>
	value > 0 ? "gain" : value < 0 ? "loss" : "neutral";

/** The lesson's figures as text, so captions and choices read them from the model. */
const f = {
	view: `$${VIEW_LEVEL}`,
	long: LONG.strike,
	short: SHORT.strike,
	paid: usd(PAID),
	paidEach: dollars(PAID),
	received: usd(RECEIVED),
	debit: usd(DEBIT),
	debitEach: dollars(MAX_LOSS),
	width: dollars(WIDTH),
	gain: signedDollars(MAX_GAIN),
	breakEven: price(BREAK_EVEN),
	callBreakEven: price(CALL_BREAK_EVEN),
	callAhead: price(CALL_AHEAD_FROM),
	account: dollars(ACCOUNT),
	planWorst: dollars(worstCase(PLAN_SPREADS)),
	planShare: shareOf(PLAN_SPREADS),
	cap: dollars(LOSS_CAP),
	strictCap: dollars(STRICT_CAP),
	profitAt: usd(EXIT.profitAt),
	profitEach: signedDollars(EXIT_PROFIT),
	lossAt: usd(EXIT.lossAt),
	lossEach: signedDollars(EXIT_LOSS),
	below: `$${ENDS.below}`,
	between: `$${ENDS.between}`,
	above: `$${ENDS.above}`,
	betweenIn: usd((ENDS.between - LONG.strike) * 100),
	sharesDue: dollars(sharesCash(LONG)),
	sharesGot: dollars(sharesCash(SHORT)),
	closeAt: usd(closeCredit(ENDS.between)),
	closeEach: signedDollars(closeProfit(ENDS.between)),
	betweenEach: signedDollars(spreadProfit(ENDS.between)),
	twoDue: dollars(sharesCash(LONG) * PLAN_SPREADS),
} as const;
const timeStop: Copy = [
	`Fri ${expiries[EXIT.timeStop].label[0]}`,
	`${expiries[EXIT.timeStop].label[1]} 周五`,
];

// ——— Scene 1: the view and the structure ———

type StructureState = { stage: 0 | 1; spot: number };

const callPoints = [RANGE[0], LONG.strike, RANGE[1]].map(
	(spot) => [spot, callProfit(spot)] as const,
);
const spreadPoints = [RANGE[0], LONG.strike, SHORT.strike, RANGE[1]].map(
	(spot) => [spot, spreadProfit(spot)] as const,
);

function StructureView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: StructureState;
	explore: StructureState | null;
	setExplore: (next: StructureState) => void;
}) {
	const t = tr(locale);
	const exploring = phase === "explore" && explore !== null;
	const shown = exploring && explore ? explore : state;
	const spread = shown.stage === 1;
	const lines: PayoffLine[] = [
		{
			id: "call",
			label: t([`${f.long} call alone`, `只买 ${f.long} 看涨`]),
			points: callPoints,
			tone: spread ? "reference" : "position",
		},
	];
	if (spread)
		lines.push({
			id: "spread",
			label: t([
				`${f.long}/${f.short} call spread`,
				`${f.long}/${f.short} 看涨价差`,
			]),
			points: spreadPoints,
			tone: "position",
		});
	const profit = spread ? spreadProfit(shown.spot) : callProfit(shown.spot);
	const markers: PayoffMarker[] = [
		{
			id: "at",
			x: shown.spot,
			y: profit,
			label: Math.round(profit) === 0 ? "$0" : signedDollars(profit),
			tone: toneOf(Math.round(profit)),
		},
	];
	const at = t([
		`at ALFA ${price(shown.spot)}`,
		`ALFA ${price(shown.spot)} 时`,
	]);
	const result: ResultItem[] = exploring
		? [
				{
					id: "spread-at",
					label: t(["The spread", "价差"]),
					value: signedDollars(spreadProfit(shown.spot)),
					note: at,
					tone: toneOf(spreadProfit(shown.spot)),
					evidence: "calculated",
				},
				{
					id: "call-at",
					label: t(["The call alone", "只买看涨"]),
					value: signedDollars(callProfit(shown.spot)),
					note: at,
					tone: toneOf(callProfit(shown.spot)),
					evidence: "calculated",
				},
			]
		: [
				{
					id: "paid",
					label: t(["Paid now", "现在付出"]),
					value: spread ? f.debitEach : f.paidEach,
					note: spread
						? t([
								`(${f.paid} − ${f.received}) × ${SHARES}, per spread`,
								`(${f.paid} − ${f.received}) × ${SHARES}，每组价差`,
							])
						: t([
								`${f.paid} × ${SHARES}, per contract`,
								`${f.paid} × ${SHARES}，每张合约`,
							]),
				},
				{
					id: "worst",
					label: t(["Worst case", "最坏情况"]),
					value: signedDollars(spread ? -MAX_LOSS : -PAID),
					tone: "loss",
					evidence: "calculated",
				},
				{
					id: "best",
					label: t(["Best case", "最好情况"]),
					value: spread ? f.gain : t(["no ceiling", "不封顶"]),
					note: spread
						? t([
								`${f.width} − ${f.debitEach}, from $${f.short} up`,
								`${f.width} − ${f.debitEach}，$${f.short} 及以上`,
							])
						: undefined,
					tone: "gain",
					evidence: "calculated",
				},
				{
					id: "break-even",
					label: t(["Break-even", "盈亏平衡点"]),
					value: spread ? f.breakEven : f.callBreakEven,
					evidence: "calculated",
				},
			];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						`Profit on Oct 18 for the ${f.long}/${f.short} call spread and for the ${f.long} call alone, against ALFA's price`,
						`${f.long}/${f.short} 看涨价差与只买 ${f.long} 看涨在 10月18日的盈亏，对照 ALFA 的价格`,
					])}
					height={(width) => (width < 520 ? 260 : 300)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 300}
							xRange={RANGE}
							yRange={[-500, 1200]}
							xTicks={[90, 95, 100, 105, 110, 115]}
							yTicks={[-400, 0, 400, 800]}
							lines={lines}
							markers={markers}
							drag={
								exploring && explore
									? {
											markerId: "at",
											min: RANGE[0],
											max: RANGE[1],
											step: 1,
											onChange: (spot) => setExplore({ ...explore, spot }),
										}
									: undefined
							}
							xLabel={t(["ALFA on Oct 18", "10月18日 ALFA"])}
							title={t([
								"Profit on Oct 18 · per spread or contract",
								"10月18日盈亏 · 每组价差或每张合约",
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				exploring && explore ? (
					<RangeControl
						label={t(["ALFA on Oct 18", "10月18日 ALFA"])}
						value={explore.spot}
						display={price(explore.spot)}
						min={RANGE[0]}
						max={RANGE[1]}
						onChange={(spot) => setExplore({ ...explore, spot })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A call debit spread buys one call and sells another at a higher strike in the same expiry. Its cost is the net debit, and that is also the most it can lose. The most it can make is the distance between the strikes minus the debit, and it breaks even at the lower strike plus the debit. Against the call alone it pays less and can lose less, and in exchange its gain stops at the higher strike. This shows how the structure works; it does not say which strikes or which structure to use.",
						"看涨借方价差是在同一到期日买入一张看涨，同时卖出一张行权价更高的看涨。它的成本是净支出，这也是它最多能亏的金额。最多能赚的是两个行权价的差减去净支出，盈亏平衡点是较低的行权价加上净支出。和只买看涨相比，它付得更少、最多亏得也更少，代价是盈利在较高的行权价处封顶。这里讲的是这个结构如何运作，并不说明该选哪些行权价或哪种结构。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: the order, the size and the written exits ———

type OrderState = { shown: number; focus: string | null; spreads: number };

function OrderView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: OrderState;
	explore: OrderState | null;
	setExplore: (next: OrderState) => void;
}) {
	const t = tr(locale);
	const exploring = phase === "explore" && explore !== null;
	const shown = exploring && explore ? explore : state;
	const n = shown.spreads;
	const fields: TicketField[] = [
		{
			id: "order",
			label: t(["Order", "订单"]),
			value: t(["1 order · 2 legs", "1 张订单 · 2 条腿"]),
		},
		{
			id: "leg-1",
			label: t(["Leg 1", "第 1 腿"]),
			value: t([
				`Buy to open · Oct 18 ${f.long} call`,
				`买入开仓 · 10月18日 ${f.long} 看涨`,
			]),
			short: t([`Buy ${f.long} call`, `买入 ${f.long} 看涨`]),
		},
		{
			id: "leg-2",
			label: t(["Leg 2", "第 2 腿"]),
			value: t([
				`Sell to open · Oct 18 ${f.short} call`,
				`卖出开仓 · 10月18日 ${f.short} 看涨`,
			]),
			short: t([`Sell ${f.short} call`, `卖出 ${f.short} 看涨`]),
		},
		{
			id: "limit",
			label: t(["Limit price", "限价"]),
			value: t([`net debit ${f.debit}`, `净支出 ${f.debit}`]),
		},
		{
			id: "qty",
			label: t(["Quantity", "数量"]),
			value: t([`${n} ${n === 1 ? "spread" : "spreads"}`, `${n} 组`]),
		},
		{
			id: "profit",
			label: t(["Profit point", "止盈点"]),
			value: t([
				`sell at ${f.profitAt} · ${f.profitEach} each`,
				`${f.profitAt} 卖出 · 每组 ${f.profitEach}`,
			]),
			short: `${f.profitAt} · ${f.profitEach}`,
		},
		{
			id: "loss",
			label: t(["Loss point", "止损点"]),
			value: t([
				`sell at ${f.lossAt} · ${f.lossEach} each`,
				`${f.lossAt} 卖出 · 每组 ${f.lossEach}`,
			]),
			short: `${f.lossAt} · ${f.lossEach}`,
		},
		{
			id: "time",
			label: t(["Time stop", "时间止损"]),
			value: t(timeStop),
		},
	];
	const result: ResultItem[] =
		shown.shown >= 5
			? [
					{
						id: "worst",
						label: t(["Worst case, whole position", "整个持仓的最坏情况"]),
						value: signedDollars(-worstCase(n)),
						note: `${n} × ${f.debitEach}`,
						tone: "loss",
						evidence: "calculated",
					},
					{
						id: "share",
						label: t([
							`Share of a ${f.account} account`,
							`占 ${f.account} 账户`,
						]),
						value: shareOf(n),
						evidence: "calculated",
					},
					{
						id: "best",
						label: t(["Best case, whole position", "整个持仓的最好情况"]),
						value: signedDollars(bestCase(n)),
						note: `${n} × ${dollars(MAX_GAIN)}`,
						tone: "gain",
						evidence: "calculated",
					},
				]
			: [
					{
						id: "net",
						label: t(["Net debit", "净支出"]),
						value: t([`${f.debit} a share`, `每股 ${f.debit}`]),
						note: `${f.paid} − ${f.received}`,
						evidence: "calculated",
					},
					{
						id: "each",
						label: t(["Per spread", "每组价差"]),
						value: f.debitEach,
						note: `${f.debit} × ${SHARES}`,
						evidence: "calculated",
					},
				];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The order ticket for the call spread, with its size and its three written exits",
						"这组看涨价差的订单，以及它的数量和写下的三个出场点",
					])}
					height={ticketHeight(fields.length, false)}
				>
					{(width) => (
						<ContractTicket
							width={width}
							title={t([
								"Before sending: the order and the plan",
								"下单之前：订单与计划",
							])}
							fields={fields}
							shown={shown.shown}
							focus={shown.focus ?? undefined}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				exploring && explore ? (
					<RangeControl
						label={t(["Number of spreads", "价差组数"])}
						value={explore.spreads}
						display={String(explore.spreads)}
						min={1}
						max={SIZE_LIMIT}
						onChange={(spreads) => setExplore({ ...explore, spreads })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						`A debit spread is paid for in full when it fills, so its cost and its worst case are the same ${f.debitEach} a spread. A loss point is a plan: a gap in ALFA can carry the spread's price past it before you can sell. The debit is the structure's own limit. Brokers must approve an account for options trading, and they usually ask for a higher approval level for spreads than for buying a single call or put; the levels and their names differ by broker. The exit prices here are one example of a written plan, not a rule.`,
						`借方价差在成交时就全额付清，所以它的成本和最坏情况是同一个数：每组 ${f.debitEach}。止损点是一个计划：ALFA 跳空时，价差的价格可能在你来得及卖出之前就越过它。净支出才是结构自身的限制。券商须先为账户开通期权权限，做价差通常比买入单张看涨或看跌需要更高的权限级别；级别的划分和名称因券商而异。这里的出场价位只是书面计划的一个例子，不是规则。`,
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: three ends on Oct 18 ———

type EndsState = { end: End; closed: boolean };

function EndsView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: EndsState;
	explore: EndsState | null;
	setExplore: (next: EndsState) => void;
}) {
	const t = tr(locale);
	const exploring = phase === "explore" && explore !== null;
	const shown = exploring && explore ? explore : state;
	const spot = ENDS[shown.end];
	const outcome = settle(spot);
	const credit = closeCredit(spot);
	/** Closed before the bell: there is something to sell only while the spread has a price. */
	const sold = shown.closed && credit > 0;
	const profit = sold ? closeProfit(spot) : outcome.profit;
	const worthless = t(["expires worthless", "到期作废"]);
	const lines: PayoffLine[] = [
		{
			id: "spread",
			label: t([
				`${f.long}/${f.short} call spread`,
				`${f.long}/${f.short} 看涨价差`,
			]),
			points: spreadPoints,
			tone: "position",
		},
	];
	const markers: PayoffMarker[] = [
		{
			id: "close",
			x: spot,
			y: outcome.profit,
			label: t([`close ${price(spot)}`, `收于 ${price(spot)}`]),
			tone: toneOf(outcome.profit),
		},
	];
	const bands: PayoffBand[] = [
		{
			id: "between",
			from: LONG.strike,
			to: SHORT.strike,
			label: t(["between the strikes", "两个行权价之间"]),
			tone: "neutral",
		},
	];
	const result: ResultItem[] = [
		{
			id: "long",
			label: t([`Your ${f.long} call`, `你的 ${f.long} 看涨`]),
			value: sold
				? t(["sold before the close", "收盘前卖出"])
				: outcome.exercised
					? t([
							`exercised: buy ${SHARES} shares for ${f.sharesDue}`,
							`被行权：以 ${f.sharesDue} 买入 ${SHARES} 股`,
						])
					: worthless,
		},
		{
			id: "short",
			label: t([`The ${f.short} call you sold`, `你卖出的 ${f.short} 看涨`]),
			value: sold
				? t(["bought back before the close", "收盘前买回"])
				: outcome.assigned
					? t([
							`assigned: sell ${SHARES} shares for ${f.sharesGot}`,
							`被指派：以 ${f.sharesGot} 卖出 ${SHARES} 股`,
						])
					: worthless,
		},
		{
			id: "monday",
			label: t(["Account on Monday", "周一的账户"]),
			value:
				!sold && outcome.shares > 0
					? t([
							`${outcome.shares} ALFA shares · ${dollars(outcome.due)} paid`,
							`${outcome.shares} 股 ALFA · 已付 ${dollars(outcome.due)}`,
						])
					: !sold && outcome.assigned
						? t([
								`no shares · ${dollars(outcome.received - outcome.due)} received`,
								`没有股票 · 收到 ${dollars(outcome.received - outcome.due)}`,
							])
						: t(["no position", "没有持仓"]),
			tone: !sold && outcome.shares > 0 ? "caution" : undefined,
		},
		{
			id: "result",
			label: t(["Result per spread", "每组价差的结果"]),
			value: signedDollars(profit),
			note: sold
				? t([
						`sold for a net ${usd(credit)}, a model quote`,
						`以净价 ${usd(credit)} 卖出（模型报价）`,
					])
				: shown.closed
					? t([
							"nothing to sell: both calls are worth $0",
							"没有可卖的：两张看涨都值 $0",
						])
					: outcome.shares > 0
						? t([
								`on paper at ${price(spot)}; from here it moves with the shares`,
								`按 ${price(spot)} 计算的账面结果；此后随股价变动`,
							])
						: undefined,
			tone: toneOf(profit),
			evidence: sold ? "modeled" : "calculated",
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The call spread's profit on Oct 18, with ALFA's close marked below, between or above its two strikes",
						"看涨价差在 10月18日的盈亏，并标出 ALFA 收盘价低于、位于或高于两个行权价",
					])}
					height={(width) => (width < 520 ? 240 : 270)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 240 : 270}
							xRange={RANGE}
							yRange={[-400, 400]}
							xTicks={[90, 95, 100, 105, 110, 115]}
							yTicks={[-200, 0, 200]}
							lines={lines}
							markers={markers}
							bands={bands}
							xLabel={t(["ALFA's close on Oct 18", "10月18日 ALFA 收盘价"])}
							title={t([
								`${f.long}/${f.short} call spread bought for ${f.debit} · per spread`,
								`以 ${f.debit} 买入 ${f.long}/${f.short} 看涨价差 · 每组`,
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				exploring && explore ? (
					<>
						<ChoiceField
							label={t(["ALFA closes at", "ALFA 收于"])}
							value={explore.end}
							options={[
								["below", f.below],
								["between", f.between],
								["above", f.above],
							]}
							onChange={(end) => setExplore({ ...explore, end })}
						/>
						<ChoiceField
							label={t(["Before the close", "收盘前"])}
							value={explore.closed ? "closed" : "open"}
							options={[
								["open", t(["Do nothing", "不操作"])],
								["closed", t(["Close the spread", "平掉价差"])],
							]}
							onChange={(value) =>
								setExplore({ ...explore, closed: value === "closed" })
							}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						`ALFA options are American-style and settle in shares. At expiry, a call that is $0.01 or more in the money is exercised unless its holder instructs otherwise; that is the clearing house's threshold, and a broker may set its own. Shares that arrive this way are a new position: the ${f.debitEach} limit belonged to the spread, not to the shares. Before expiry, the call you sold can be assigned on any trading day. It is most likely just before an ex-dividend date, when the call is in the money with little time value left; you would then be short ${SHARES} shares at $${f.short} and owe the dividend on them, while your ${f.long} call still limits the loss if ALFA rises. A close within a few cents of $${f.short} can leave you unsure until Monday whether the sold call was assigned.`,
						`ALFA 期权是美式期权，以股票交割。到期时，实值 $0.01 或以上的看涨会被行权，除非持有人另行指示；这是清算所的门槛，券商可以另设自己的门槛。这样得到的股票是一项新的持仓：${f.debitEach} 的限制属于价差，不属于股票。到期之前，你卖出的看涨在任何交易日都可能被指派，最常见于除息日前、它处于实值且时间价值所剩无几的时候；那时你会以 $${f.short} 卖空 ${SHARES} 股，并要补付这些股票的股息，而你的 ${f.long} 看涨仍然限制着 ALFA 上涨带来的亏损。如果收盘价离 $${f.short} 只差几美分，你可能要到周一才知道卖出的看涨有没有被指派。`,
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<StructureState, StructureState>({
		id: "structure",
		label: ["The spread", "价差"],
		title: [
			"One view, one structure with a floor and a ceiling",
			"一个看法，一个有下限也有上限的结构",
		],
		predict: {
			prompt: [
				`You buy the Oct 18 ${f.long} call for ${f.paid} and sell the Oct 18 ${f.short} call for ${f.received}, in one order. What is the most one spread can lose?`,
				`你在同一张订单里以 ${f.paid} 买入 10月18日 ${f.long} 看涨，并以 ${f.received} 卖出 10月18日 ${f.short} 看涨。一组价差最多亏多少？`,
			],
			choices: [
				{ id: "debit", label: [f.debitEach, f.debitEach] },
				{
					id: "long",
					label: [f.paidEach, f.paidEach],
					why: [
						`${f.paidEach} is the ${f.long} call bought alone. The ${f.received} a share received for the ${f.short} call comes off that cost.`,
						`${f.paidEach} 是只买 ${f.long} 看涨的成本。卖出 ${f.short} 看涨收到的每股 ${f.received} 要从中扣掉。`,
					],
				},
				{
					id: "width",
					label: [f.width, f.width],
					why: [
						`${f.width} is the distance between the strikes times ${SHARES}: the most the spread can be worth, not the most it can lose.`,
						`${f.width} 是两个行权价之差乘以 ${SHARES}：这是价差最多能值的金额，不是最多能亏的金额。`,
					],
				},
				{
					id: "unlimited",
					label: ["No limit: a call was sold", "没有上限：因为卖出了一张看涨"],
					why: [
						`A sold call alone has no limit, but here the ${f.long} call you bought covers it: above $${f.short}, each dollar the sold call loses is a dollar the bought call gains.`,
						`单独卖出看涨的亏损没有上限，但这里有买入的 ${f.long} 看涨覆盖它：高于 $${f.short} 后，卖出的看涨每亏一美元，买入的看涨就赚一美元。`,
					],
				},
			],
			answer: "debit",
			entry: { answer: MAX_LOSS, prefix: "$", eitherSign: true },
			revealAt: 1,
			explain: [
				`The pair costs ${f.paid} − ${f.received} = ${f.debit} a share, ${f.debitEach} a spread. If both calls expire worthless that is all that is lost, and it is known before the order is sent.`,
				`这一组的成本是每股 ${f.paid} − ${f.received} = ${f.debit}，每组 ${f.debitEach}。即使两张看涨都作废，亏掉的也只有这么多，而且下单之前就已知道。`,
			],
		},
		beats: [
			{
				id: "view",
				label: ["The view", "看法"],
				caption: [
					`Mon Sep 16, ALFA $100. The view, written so that it can be wrong: ALFA above ${f.view} on Oct 18. Buying the Oct 18 ${f.long} call alone costs ${f.paid} a share, ${f.paidEach} a contract.`,
					`9月16日 周一，ALFA $100。把看法写成有可能错的样子：10月18日 ALFA 高于 ${f.view}。只买 10月18日 ${f.long} 看涨，每股 ${f.paid}，每张 ${f.paidEach}。`,
				],
				state: { stage: 0, spot: VIEW_LEVEL },
			},
			{
				id: "spread",
				label: ["Add a leg", "加一条腿"],
				caption: [
					`Add a second leg in the same order: sell the Oct 18 ${f.short} call for ${f.received}. The pair costs ${f.debit} a share, ${f.debitEach} a spread. That net debit is the most the spread can lose.`,
					`在同一张订单里加上第二条腿：以 ${f.received} 卖出 10月18日 ${f.short} 看涨。这一组每股花 ${f.debit}，每组 ${f.debitEach}。这笔净支出就是价差最多能亏的金额。`,
				],
				state: { stage: 1, spot: ENDS.below },
			},
			{
				id: "ceiling",
				label: ["The ceiling", "上限"],
				caption: [
					`The sold call also sets a ceiling. Above $${f.short} it gives back every dollar the bought call adds, so the spread is worth ${f.width} at most: ${f.gain} after its cost.`,
					`卖出的看涨也带来了上限。高于 $${f.short} 后，买入的看涨每多赚一美元，卖出的看涨就要还回一美元，所以价差最多值 ${f.width}：扣除成本后 ${f.gain}。`,
				],
				state: { stage: 1, spot: ENDS.above },
			},
			{
				id: "break-even",
				label: ["Break-even", "盈亏平衡"],
				caption: [
					`Break-even is the lower strike plus the debit: $${f.long} + ${f.debit} = ${f.breakEven}. The call alone needs ${f.callBreakEven}.`,
					`盈亏平衡点是较低的行权价加上净支出：$${f.long} + ${f.debit} = ${f.breakEven}。只买看涨则要到 ${f.callBreakEven}。`,
				],
				state: { stage: 1, spot: BREAK_EVEN },
			},
		],
		explore: {
			prompt: [
				"Drag ALFA's price on Oct 18 and compare the spread with the call alone.",
				"拖动 10月18日 ALFA 的价格，比较价差和只买看涨。",
			],
			start: () => ({ stage: 1, spot: LONG.strike + 1 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the lowest whole-dollar price at which the call alone ends ahead of the spread.",
					"找出只买看涨开始比价差赚得多的最低整数价格。",
				],
				reached: (e) => e.spot === CALL_AHEAD_FROM,
				done: [
					`From ${f.callAhead} the call alone is ahead, because it has no ceiling. At every lower price the spread is ahead or level: it paid ${f.debitEach} instead of ${f.paidEach}, and it can lose ${f.debitEach} at most instead of ${f.paidEach}.`,
					`从 ${f.callAhead} 起，只买看涨赚得更多，因为它不封顶。在更低的每个价格上，价差都不落后：它付出的是 ${f.debitEach} 而不是 ${f.paidEach}，最多亏 ${f.debitEach} 而不是 ${f.paidEach}。`,
				],
			},
		},
		View: StructureView,
	}),
	defineScene<OrderState, OrderState>({
		id: "order",
		label: ["Order and plan", "订单与计划"],
		title: [
			"One order, a size and three exits, written before sending",
			"一张订单、一个数量、三个出场点，都在下单前写好",
		],
		predict: {
			prompt: [
				`You want this spread for a net ${f.debit} a share. Which way of sending it can leave you holding only one of the two calls?`,
				`你想以每股净支出 ${f.debit} 买入这组价差。哪种下单方式可能让你只成交其中一条腿？`,
			],
			choices: [
				{
					id: "separate",
					label: [
						"Two separate orders, one per leg",
						"分成两张订单，每条腿一张",
					],
				},
				{
					id: "combo",
					label: [
						"One two-leg order with a net limit price",
						"一张带净限价的两腿订单",
					],
					why: [
						"A two-leg order fills both legs together at its net price or better, or it doesn't fill. It can't leave one call on its own.",
						"两腿订单要么两条腿一起按净价或更优的价格成交，要么不成交，不会只留下一张看涨。",
					],
				},
				{
					id: "either",
					label: [
						"Either: any order can fill halfway",
						"都可能：任何订单都可能只成交一半",
					],
					why: [
						"A two-leg order can fill for fewer spreads than you asked for, but each fill is a complete pair. Only separate orders can fill one leg without the other.",
						"两腿订单可能只成交你所要数量的一部分，但每次成交都是完整的一组。只有分开下单，才会一条腿成交而另一条没有。",
					],
				},
			],
			answer: "separate",
			revealAt: 1,
			explain: [
				"Sent separately, the first leg can fill while the price of the second moves away. You then hold one call alone, bought or sold, that the plan never priced. One order with a net limit fills the pair together or waits.",
				"分开下单时，第一条腿成交后，第二条腿的价格可能已经走开。这时你手里只有一张单独买入或卖出的看涨，而计划里从没给它算过账。带净限价的一张订单则是成对成交，否则就继续等。",
			],
		},
		beats: [
			{
				id: "one-order",
				label: ["One order", "一张订单"],
				caption: [
					`The spread goes in as one order with two legs: buy to open the Oct 18 ${f.long} call, and sell to open the Oct 18 ${f.short} call.`,
					`价差作为一张两条腿的订单下达：买入开仓 10月18日 ${f.long} 看涨，卖出开仓 10月18日 ${f.short} 看涨。`,
				],
				state: { shown: 3, focus: "order", spreads: PLAN_SPREADS },
			},
			{
				id: "net",
				label: ["Net price", "净价"],
				caption: [
					`It carries one limit price for the pair, a net debit of ${f.debit}. Both legs fill together at that price or better, or the order waits. Sent as two orders, one leg can fill alone.`,
					`它给这一组定一个限价：净支出 ${f.debit}。两条腿一起按这个价格或更优的价格成交，否则订单继续等。分成两张订单下达，就可能只成交一条腿。`,
				],
				state: { shown: 4, focus: "limit", spreads: PLAN_SPREADS },
			},
			{
				id: "size",
				label: ["Size", "数量"],
				caption: [
					`Size comes from the worst case. A trader who accepts losing ${CAP_PERCENT}% of a ${f.account} account on one trade has ${f.cap}: ${PLAN_SPREADS} spreads fit, risking ${PLAN_SPREADS} × ${f.debitEach} = ${f.planWorst}, ${f.planShare} of the account.`,
					`数量由最坏情况决定。一位交易者接受单笔交易最多亏掉 ${f.account} 账户的 ${CAP_PERCENT}%，也就是 ${f.cap}：可以做 ${PLAN_SPREADS} 组，最多亏 ${PLAN_SPREADS} × ${f.debitEach} = ${f.planWorst}，占账户的 ${f.planShare}。`,
				],
				state: { shown: 5, focus: "qty", spreads: PLAN_SPREADS },
			},
			{
				id: "exits",
				label: ["Exits", "出场点"],
				caption: [
					`The exits are written down first too: sell the spread at ${f.profitAt} (${f.profitEach} each), at ${f.lossAt} (${f.lossEach} each), or on ${timeStop[0]}, whichever comes first.`,
					`出场点也先写下来：价差到 ${f.profitAt} 卖出（每组 ${f.profitEach}），跌到 ${f.lossAt} 卖出（每组 ${f.lossEach}），或者到 ${timeStop[1]} 卖出，以先到者为准。`,
				],
				state: { shown: 8, focus: null, spreads: PLAN_SPREADS },
			},
		],
		explore: {
			prompt: [
				"Change the number of spreads and read the worst case for the whole position.",
				"改变价差的组数，读出整个持仓的最坏情况。",
			],
			start: () => ({ shown: 8, focus: "qty", spreads: 1 }),
			task: {
				kind: "answer",
				prompt: [
					`Another trader keeps the last lesson's example rule: at most ${STRICT_PERCENT}% of a ${f.account} account on one trade. How many of these spreads fit?`,
					`另一位交易者沿用上一课的示例规则：单笔交易最多亏掉 ${f.account} 账户的 ${STRICT_PERCENT}%。这样的价差可以做几组？`,
				],
				choices: [
					{ id: "none", label: ["None", "一组也不行"] },
					{ id: "one", label: ["1 spread", "1 组"] },
					{ id: "two", label: ["2 spreads", "2 组"] },
				],
				answer: "none",
				done: [
					`${STRICT_PERCENT}% of ${f.account} is ${f.strictCap}, and one spread can lose ${f.debitEach}: ${spreadsWithin(STRICT_CAP)} fit. Zero is a valid size. The size follows from the worst case and the rule, not from how sure the view feels.`,
					`${f.account} 的 ${STRICT_PERCENT}% 是 ${f.strictCap}，而一组价差最多亏 ${f.debitEach}：能做 ${spreadsWithin(STRICT_CAP)} 组。零也是有效的数量。数量由最坏情况和规则决定，而不是由看法有多大把握决定。`,
				],
			},
		},
		View: OrderView,
	}),
	defineScene<EndsState, EndsState>({
		id: "ends",
		label: ["Three ends", "三种结局"],
		title: [
			"Three ways the spread can end on Oct 18",
			"10月18日，价差的三种结局",
		],
		predict: {
			prompt: [
				`On Oct 18 ALFA closes at ${f.between}, between your two strikes, and you do nothing. What is in your account on Monday?`,
				`10月18日 ALFA 收于 ${f.between}，在你的两个行权价之间，而你什么都没做。周一你的账户里有什么？`,
			],
			choices: [
				{
					id: "shares",
					label: [
						`${SHARES} ALFA shares, bought for ${f.sharesDue}`,
						`${SHARES} 股 ALFA，花了 ${f.sharesDue} 买入`,
					],
				},
				{
					id: "cash",
					label: [
						`${dollars((ENDS.between - LONG.strike) * SHARES)} in cash and no shares`,
						`${dollars((ENDS.between - LONG.strike) * SHARES)} 现金，没有股票`,
					],
					why: [
						`ALFA options settle in shares, not cash: exercising the ${f.long} call means buying ${SHARES} shares at $${f.long}. Cash settlement belongs to index options.`,
						`ALFA 期权以股票交割，不是现金：${f.long} 看涨被行权，就是以 $${f.long} 买入 ${SHARES} 股。现金结算是指数期权的做法。`,
					],
				},
				{
					id: "nothing",
					label: [
						"Nothing: both calls have expired",
						"什么都没有：两张看涨都已到期",
					],
					why: [
						`Only the ${f.short} call expires worthless. The ${f.long} call is ${f.betweenIn} in the money, and a call $0.01 or more in the money is exercised unless you instruct otherwise.`,
						`只有 ${f.short} 看涨到期作废。${f.long} 看涨有 ${f.betweenIn} 的实值，而实值 $0.01 或以上的看涨会被行权，除非你另行指示。`,
					],
				},
			],
			answer: "shares",
			revealAt: 2,
			explain: [
				`Between the strikes the call you sold expires worthless, but the one you bought is in the money and is exercised: ${SHARES} shares for ${f.sharesDue}. Closing the spread before the close avoids it.`,
				`在两个行权价之间，你卖出的看涨到期作废，但你买入的那张是实值，会被行权：用 ${f.sharesDue} 买入 ${SHARES} 股。在收盘前平掉价差就能避免。`,
			],
		},
		beats: [
			{
				id: "below",
				label: ["Below both", "都低于"],
				caption: [
					`Oct 18, ALFA closes at ${f.below}, below both strikes. Both calls expire worthless and the ${f.debitEach} debit is lost. Nothing else happens.`,
					`10月18日，ALFA 收于 ${f.below}，低于两个行权价。两张看涨都到期作废，亏掉 ${f.debitEach} 的净支出。此外什么都不会发生。`,
				],
				state: { end: "below", closed: false },
			},
			{
				id: "above",
				label: ["Above both", "都高于"],
				caption: [
					`At ${f.above} both calls are in the money. Yours is exercised and the one you sold is assigned: ${SHARES} shares bought at $${f.long} and sold at $${f.short}. ${f.width} comes in, ${f.gain} after the debit, and no shares stay.`,
					`收于 ${f.above} 时，两张看涨都是实值。你的那张被行权，你卖出的那张被指派：以 $${f.long} 买入 ${SHARES} 股，再以 $${f.short} 卖出。收入 ${f.width}，扣除净支出后 ${f.gain}，账户里不留股票。`,
				],
				state: { end: "above", closed: false },
			},
			{
				id: "between",
				label: ["In between", "在中间"],
				caption: [
					`At ${f.between} the ${f.short} call expires worthless, but your ${f.long} call is ${f.betweenIn} in the money. A call $0.01 or more in the money at expiry is exercised unless you tell your broker otherwise: you buy ${SHARES} shares for ${f.sharesDue}.`,
					`收于 ${f.between} 时，${f.short} 看涨到期作废，但你的 ${f.long} 看涨有 ${f.betweenIn} 的实值。到期时实值 $0.01 或以上的看涨会被行权，除非你另行通知券商：你要用 ${f.sharesDue} 买入 ${SHARES} 股。`,
				],
				state: { end: "between", closed: false },
			},
			{
				id: "close",
				label: ["Close first", "先平仓"],
				caption: [
					`Sold before the close instead, for a net ${f.closeAt}, the spread ends at ${f.closeEach} with no shares to pay for. That is why many traders close a spread before expiry instead of letting it settle.`,
					`如果改为在收盘前以净价 ${f.closeAt} 卖出，价差以 ${f.closeEach} 结束，也不用掏钱买股票。所以很多交易者会在到期前平掉价差，而不是等它结算。`,
				],
				state: { end: "between", closed: true },
			},
		],
		explore: {
			prompt: [
				"Choose where ALFA closes, and whether the spread was closed first.",
				"选择 ALFA 的收盘价，以及是否先平掉了价差。",
			],
			start: () => ({ end: "below", closed: false }),
			task: {
				kind: "answer",
				prompt: [
					`${PLAN_SPREADS} spreads are left open and ALFA closes at ${f.between}. How much cash is due for the shares?`,
					`${PLAN_SPREADS} 组价差没有平仓，ALFA 收于 ${f.between}。买入股票一共要付多少现金？`,
				],
				choices: [
					{ id: "all", label: [f.twoDue, f.twoDue] },
					{ id: "one", label: [f.sharesDue, f.sharesDue] },
					{ id: "debit", label: [f.planWorst, f.planWorst] },
				],
				answer: "all",
				done: [
					`Each exercised call buys ${SHARES} shares at $${f.long}: ${PLAN_SPREADS} × ${f.sharesDue} = ${f.twoDue}, twice a ${f.account} account. A broker may close a position like this on expiry day or issue a margin call; the practice differs by broker.`,
					`每张被行权的看涨以 $${f.long} 买入 ${SHARES} 股：${PLAN_SPREADS} × ${f.sharesDue} = ${f.twoDue}，是 ${f.account} 账户的两倍。券商可能在到期日替你平掉这样的持仓，或发出追加保证金通知；各家券商做法不同。`,
				],
			},
		},
		View: EndsView,
	}),
] as const;

export function FirstSpreadTradeWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="first-spread-trade"
			label={[
				"Interactive lesson on planning one call spread from the view to its end",
				"从看法到结局：规划一组看涨价差的互动课",
			]}
			film={firstSpreadTradeFilm}
			scenes={scenes}
		/>
	);
}
