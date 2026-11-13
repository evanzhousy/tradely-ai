import { FieldGroup } from "@tradely/ui/components/field";
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
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import {
	type FlowParty,
	type FlowTransfer,
	TransferFlow,
	transferFlowHeight,
} from "../walkthrough/instruments/transfer-flow";
import { Player } from "../walkthrough/player";
import { Stage } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { sellingCoveredOptionsFilm } from "./selling-covered-options-film";
import {
	ACCOUNT,
	BUY_BACK,
	BUY_BACK_RESULT,
	CALL,
	CALL_BID,
	CALL_DELIVERY,
	CALL_PREMIUM,
	CASH,
	COVERED_BEST,
	COVERED_CAP,
	COVERED_EVEN,
	COVERED_WORST,
	coveredProfit,
	EARLY,
	EARLY_ASSIGNED_RESULT,
	EARLY_DAY,
	EARLY_INTRINSIC,
	EARLY_TIME_VALUE,
	ENDS,
	type End,
	NET_PRICE,
	PUT,
	PUT_BID,
	PUT_PREMIUM,
	PUTS_SECURED,
	RALLY,
	RANGE,
	SECURED_BEST,
	SECURED_WORST,
	SHARES,
	SHARES_AHEAD_FROM,
	STOCK_COST,
	securedProfit,
	settle,
	sharesProfit,
	TRADING_DAYS,
	type Trade,
} from "./selling-covered-options-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);
/** Whole dollars from cents: "$205", "+$705", "−$9,795". */
const whole = (cents: number) => usd(cents, 0);
const signedWhole = (cents: number) => signedUsd(cents, 0);
const price = (spot: number) =>
	Number.isInteger(spot) ? `$${spot}` : `$${spot.toFixed(2)}`;
const toneOf = (cents: number) =>
	cents > 0 ? "gain" : cents < 0 ? "loss" : "neutral";
const EXPIRY = expiries[CALL.expiry].label;

/** The lesson's figures as text, so captions and choices read them from the model. */
const f = {
	expiry: EXPIRY,
	call: CALL.strike,
	put: PUT.strike,
	callBid: usd(CALL_BID),
	putBid: usd(PUT_BID),
	callKept: whole(CALL_PREMIUM),
	putKept: whole(PUT_PREMIUM),
	cost: usd(STOCK_COST, 0),
	sharesCost: whole(STOCK_COST * SHARES),
	coveredBest: signedWhole(COVERED_BEST),
	coveredEven: usd(COVERED_EVEN),
	coveredWorst: signedWhole(COVERED_WORST),
	coveredWorstSize: whole(-COVERED_WORST),
	cap: usd(COVERED_CAP),
	sharesAhead: price(SHARES_AHEAD_FROM),
	rally: price(RALLY),
	rallyCovered: signedWhole(coveredProfit(RALLY)),
	rallyShares: signedWhole(sharesProfit(RALLY)),
	delivery: whole(CALL_DELIVERY),
	cash: whole(CASH),
	account: whole(ACCOUNT),
	cashShare: percent(CASH / ACCOUNT, 0),
	net: usd(NET_PRICE),
	securedBest: signedWhole(SECURED_BEST),
	securedWorst: signedWhole(SECURED_WORST),
	securedWorstSize: whole(-SECURED_WORST),
	low: price(ENDS.low),
	middle: price(ENDS.middle),
	high: price(ENDS.high),
	lowInBy: usd(PUT.strike * 100 - ENDS.low * 100),
	highInBy: usd(ENDS.high * 100 - CALL.strike * 100),
	lowResult: signedWhole(securedProfit(ENDS.low)),
	fall: price(RANGE[0]),
	fallResult: signedWhole(securedProfit(RANGE[0])),
	days: TRADING_DAYS.length,
	earlySpot: price(EARLY.spot / 100),
	earlyInBy: usd(EARLY_INTRINSIC),
	earlyTime: usd(EARLY_TIME_VALUE),
	earlyAssigned: signedWhole(EARLY_ASSIGNED_RESULT),
	buyBack: usd(BUY_BACK),
	buyBackResult: signedWhole(BUY_BACK_RESULT),
	twoCash: whole(CASH * 2),
} as const;

// ——— Scene 1: a call sold against shares ———

type CoveredState = { stage: 0 | 1 | 2 | 3; spot: number };

const coveredPoints = [RANGE[0], CALL.strike, RANGE[1]].map(
	(spot) => [spot, coveredProfit(spot) / 100] as const,
);
const sharesPoints = [RANGE[0], RANGE[1]].map(
	(spot) => [spot, sharesProfit(spot) / 100] as const,
);

function CoveredView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: CoveredState;
	explore: CoveredState | null;
	setExplore: (next: CoveredState) => void;
}) {
	const t = tr(locale);
	const exploring = phase === "explore" && explore !== null;
	const shown = exploring && explore ? explore : state;
	const compare = exploring || shown.stage === 3;
	const lines: PayoffLine[] = [
		{
			id: "covered",
			label: t(["covered call", "备兑看涨"]),
			points: coveredPoints,
			tone: "position",
		},
	];
	if (compare)
		lines.push({
			id: "shares",
			label: t([`${SHARES} shares alone`, `只持有 ${SHARES} 股`]),
			shortLabel: t(["shares alone", "只持股"]),
			points: sharesPoints,
			tone: "reference",
		});
	const profit = coveredProfit(shown.spot);
	const markers: PayoffMarker[] = [
		{
			id: "at",
			x: shown.spot,
			y: profit / 100,
			label: profit === 0 ? "$0" : signedWhole(profit),
			tone: toneOf(profit),
		},
	];
	const at = t([
		`at ALFA ${price(shown.spot)}`,
		`ALFA ${price(shown.spot)} 时`,
	]);
	const result: ResultItem[] = exploring
		? [
				{
					id: "covered-at",
					label: t(["Covered call", "备兑看涨"]),
					value: signedWhole(profit),
					note: at,
					tone: toneOf(profit),
					evidence: "calculated",
				},
				{
					id: "shares-at",
					label: t(["Shares alone", "只持股"]),
					value: signedWhole(sharesProfit(shown.spot)),
					note: at,
					tone: toneOf(sharesProfit(shown.spot)),
					evidence: "calculated",
				},
				{
					id: "call-at",
					label: t([
						`The ${f.call} call on ${f.expiry[0]}`,
						`${f.expiry[1]}的 ${f.call} 看涨`,
					]),
					value: settle("call", shown.spot, false).assigned
						? t([
								`assigned: shares sold at $${f.call}`,
								`被指派：股票以 $${f.call} 卖出`,
							])
						: shown.spot === CALL.strike
							? t(["not exercised automatically", "不会自动行权"])
							: t(["expires worthless", "到期作废"]),
					note:
						shown.spot === CALL.strike
							? t([
									"exactly at the strike: whether it is assigned is not known until Monday",
									"正好在行权价：是否被指派要到周一才知道",
								])
							: undefined,
				},
			]
		: shown.stage === 3
			? [
					{
						id: "covered-rally",
						label: t([
							`Covered call at ${f.rally}`,
							`ALFA ${f.rally} 时的备兑看涨`,
						]),
						value: f.rallyCovered,
						tone: "gain",
						evidence: "calculated",
					},
					{
						id: "shares-rally",
						label: t([
							`Shares alone at ${f.rally}`,
							`ALFA ${f.rally} 时只持股`,
						]),
						value: f.rallyShares,
						tone: "gain",
						evidence: "calculated",
					},
					{
						id: "cap",
						label: t(["Shares alone ahead above", "只持股领先的起点"]),
						value: f.cap,
						note: t([
							`$${f.call} strike + ${f.callBid} premium`,
							`行权价 $${f.call} + 权利金 ${f.callBid}`,
						]),
						evidence: "calculated",
					},
				]
			: [
					{
						id: "kept",
						label: t(["Premium kept", "留下的权利金"]),
						value: f.callKept,
						note: t([
							`${f.callBid} × ${SHARES}, sold at the bid`,
							`${f.callBid} × ${SHARES}，按买价卖出`,
						]),
					},
					...(shown.stage >= 1
						? [
								{
									id: "best",
									label: t(["Best case", "最好情况"]),
									value: f.coveredBest,
									note: t([
										`($${f.call} − ${f.cost} + ${f.callBid}) × ${SHARES}, at $${f.call} or above`,
										`($${f.call} − ${f.cost} + ${f.callBid}) × ${SHARES}，$${f.call} 及以上`,
									]),
									tone: "gain" as const,
									evidence: "calculated" as const,
								},
							]
						: []),
					...(shown.stage >= 2
						? [
								{
									id: "break-even",
									label: t(["Break-even", "盈亏平衡点"]),
									value: f.coveredEven,
									note: `${f.cost} − ${f.callBid}`,
									evidence: "calculated" as const,
								},
								{
									id: "worst",
									label: t(["Worst case", "最坏情况"]),
									value: f.coveredWorst,
									note: t([
										`(${f.cost} − ${f.callBid}) × ${SHARES}, if ALFA falls to $0`,
										`(${f.cost} − ${f.callBid}) × ${SHARES}，ALFA 跌到 $0 时`,
									]),
									tone: "loss" as const,
									evidence: "calculated" as const,
								},
							]
						: []),
				];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						`Profit on ${f.expiry[0]} for ${SHARES} ALFA shares with the ${f.call} call sold against them, and for the shares alone, against ALFA's price`,
						`${SHARES} 股 ALFA 加上对着它们卖出的 ${f.call} 看涨，以及只持股，在 ${f.expiry[1]}的盈亏，对照 ALFA 的价格`,
					])}
					height={(width) => (width < 520 ? 260 : 300)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 300}
							xRange={RANGE}
							yRange={[-1600, 2200]}
							xTicks={[85, 95, 105, 115]}
							yTicks={[-1000, 0, 1000, 2000]}
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
							xLabel={t([`ALFA on ${f.expiry[0]}`, `${f.expiry[1]} ALFA`])}
							title={t([
								`Profit on ${f.expiry[0]} · per contract, shares bought at ${f.cost}`,
								`${f.expiry[1]}盈亏 · 每张合约，股票以 ${f.cost} 买入`,
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				exploring && explore ? (
					<RangeControl
						label={t([`ALFA on ${f.expiry[0]}`, `${f.expiry[1]} ALFA`])}
						value={explore.spot}
						display={price(explore.spot)}
						min={RANGE[0]}
						max={RANGE[1]}
						onChange={(spot) => setExplore({ ...explore, spot })}
					/>
				) : null
			}
			details={
				// The detail states the scene's answer: it opens once the prediction is made.
				phase === "predict" ? null : (
					<p>
						{t([
							`A covered call sells one call against 100 shares you already own. The premium is kept whatever happens; in exchange you take on the obligation to sell the shares at the strike if the call is assigned, and the shares are what covers it. Its best case is the strike less what the shares cost, plus the premium; it breaks even at the shares' cost less the premium; its worst case is the shares falling to $0, offset only by the premium. Above the strike plus the premium, here ${f.cap}, the shares alone would have made more: giving up that gain is what the premium pays for. Some traders write covered calls on shares they already hold; this shows the trade-off, not whether to make it.`,
							`备兑看涨是对着你已持有的 100 股卖出一张看涨。无论发生什么，权利金都留在你手里；作为交换，你承担了一项义务：如果看涨被指派，就按行权价卖出这些股票，而这些股票就是它的保障。它的最好情况是行权价减去股票成本，再加上权利金；盈亏平衡点是股票成本减去权利金；最坏情况是股价跌到 $0，能抵消的只有权利金。高于行权价加权利金（这里是 ${f.cap}）时，只持股会赚得更多：放弃这部分涨幅，正是权利金换来的代价。有些交易者会对已持有的股票卖出备兑看涨；这里展示的是其中的取舍，而不是该不该这样做。`,
						])}
					</p>
				)
			}
		/>
	);
}

// ——— Scene 2: a put sold against cash ———

type SecuredState = { stage: 0 | 1 | 2 | 3 | 4; spot: number; puts: number };

const securedPoints = [RANGE[0], PUT.strike, RANGE[1]].map(
	(spot) => [spot, securedProfit(spot) / 100] as const,
);

function SecuredView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SecuredState;
	explore: SecuredState | null;
	setExplore: (next: SecuredState) => void;
}) {
	const t = tr(locale);
	const exploring = phase === "explore" && explore !== null;
	const shown = exploring && explore ? explore : state;
	const lines: PayoffLine[] = [
		{
			id: "secured",
			label: t(["cash-secured put", "现金担保看跌"]),
			points: securedPoints,
			tone: "position",
		},
	];
	const profit = securedProfit(shown.spot);
	const markers: PayoffMarker[] =
		shown.stage >= 2 || exploring
			? [
					{
						id: "at",
						x: shown.spot,
						y: profit / 100,
						label: profit === 0 ? "$0" : signedWhole(profit),
						tone: toneOf(profit),
					},
				]
			: [];
	const n = shown.puts;
	const needed = CASH * n;
	const result: ResultItem[] = exploring
		? [
				{
					id: "cash-n",
					label: t([
						`Cash set aside for ${n} ${n === 1 ? "put" : "puts"}`,
						`${n} 张看跌需预留的现金`,
					]),
					value: whole(needed),
					note:
						needed > ACCOUNT
							? t([
									`more than the ${f.account} account holds`,
									`超过 ${f.account} 账户里的钱`,
								])
							: t([
									`${percent(needed / ACCOUNT, 0)} of a ${f.account} account`,
									`占 ${f.account} 账户的 ${percent(needed / ACCOUNT, 0)}`,
								]),
					evidence: "calculated",
				},
				{
					id: "result-n",
					label: t([
						`Result at ALFA ${price(shown.spot)}`,
						`ALFA ${price(shown.spot)} 时的结果`,
					]),
					value: signedWhole(profit * n),
					note: settle("put", shown.spot, false).assigned
						? t([
								`assigned: ${SHARES * n} shares at $${f.put}, valued at ${price(shown.spot)}`,
								`被指派：以 $${f.put} 买入 ${SHARES * n} 股，按 ${price(shown.spot)} 计`,
							])
						: shown.spot === PUT.strike
							? t([
									"exactly at the strike: not exercised automatically; whether it is assigned is not known until Monday",
									"正好在行权价：不会自动行权；是否被指派要到周一才知道",
								])
							: t(["expires worthless: premium kept", "到期作废：留下权利金"]),
					tone: toneOf(profit),
					evidence: "calculated",
				},
			]
		: [
				{
					id: "kept",
					label: t(["Premium kept", "留下的权利金"]),
					value: f.putKept,
					note: t([
						`${f.putBid} × ${SHARES}, sold at the bid`,
						`${f.putBid} × ${SHARES}，按买价卖出`,
					]),
				},
				...(shown.stage >= 1
					? [
							{
								id: "cash",
								label: t(["Cash set aside", "预留的现金"]),
								value: f.cash,
								note: t([
									`$${f.put} × ${SHARES} · ${f.cashShare} of a ${f.account} account`,
									`$${f.put} × ${SHARES} · 占 ${f.account} 账户的 ${f.cashShare}`,
								]),
								evidence: "calculated" as const,
							},
						]
					: []),
				...(shown.stage >= 2
					? [
							{
								id: "best",
								label: t(["Best case", "最好情况"]),
								value: f.securedBest,
								note: t([
									`at $${f.put} or above on ${f.expiry[0]}`,
									`${f.expiry[1]} $${f.put} 及以上`,
								]),
								tone: "gain" as const,
								evidence: "calculated" as const,
							},
						]
					: []),
				...(shown.stage >= 3
					? [
							{
								id: "net",
								label: t(["If assigned, a share", "被指派时每股"]),
								value: f.net,
								note: t([
									`$${f.put} − ${f.putBid}: also the break-even`,
									`$${f.put} − ${f.putBid}：也是盈亏平衡点`,
								]),
								evidence: "calculated" as const,
							},
						]
					: []),
				...(shown.stage >= 4
					? [
							{
								id: "worst",
								label: t(["Worst case", "最坏情况"]),
								value: f.securedWorst,
								note: t([
									`($${f.put} − ${f.putBid}) × ${SHARES}, if ALFA falls to $0`,
									`($${f.put} − ${f.putBid}) × ${SHARES}，ALFA 跌到 $0 时`,
								]),
								tone: "loss" as const,
								evidence: "calculated" as const,
							},
						]
					: []),
			];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						`Profit on ${f.expiry[0]} for the ${f.put} put sold with cash set aside, against ALFA's price`,
						`预留现金卖出的 ${f.put} 看跌在 ${f.expiry[1]}的盈亏，对照 ALFA 的价格`,
					])}
					height={(width) => (width < 520 ? 260 : 300)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 300}
							xRange={RANGE}
							yRange={[-1600, 2200]}
							xTicks={[85, 95, 105, 115]}
							yTicks={[-1000, 0, 1000, 2000]}
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
							xLabel={t([`ALFA on ${f.expiry[0]}`, `${f.expiry[1]} ALFA`])}
							title={t([
								`Profit on ${f.expiry[0]} · per contract`,
								`${f.expiry[1]}盈亏 · 每张合约`,
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				exploring && explore ? (
					<FieldGroup>
						<RangeControl
							label={t([`ALFA on ${f.expiry[0]}`, `${f.expiry[1]} ALFA`])}
							value={explore.spot}
							display={price(explore.spot)}
							min={RANGE[0]}
							max={RANGE[1]}
							onChange={(spot) => setExplore({ ...explore, spot })}
						/>
						<RangeControl
							label={t(["Puts sold", "卖出的看跌张数"])}
							value={explore.puts}
							display={String(explore.puts)}
							min={1}
							max={3}
							onChange={(puts) => setExplore({ ...explore, puts })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				// The detail states the scene's answer: it opens once the prediction is made.
				phase === "predict" ? null : (
					<p>
						{t([
							`A cash-secured put sells one put and sets aside the strike × 100 in cash, enough to buy the shares if it is assigned. Its best case is the premium. If it is assigned, the shares cost the strike less the premium, here ${f.net} a share, which is also its break-even, and they can keep falling after you own them; its worst case is that price × 100 if the stock falls to $0. The cash stays tied up while the put is open: one put on ALFA uses ${f.cash} of a ${f.account} account. Brokers grant options approval in levels and decide which level covers covered calls, cash-secured puts, spreads and uncovered writing; the levels and their names differ by broker, so check yours before you sell. This shows how the obligation works; it does not say whether to sell a put or at which strike.`,
							`现金担保看跌是卖出一张看跌，并预留行权价 × 100 的现金，足够在被指派时买下股票。它的最好情况就是权利金。如果被指派，股票的成本是行权价减去权利金（这里是每股 ${f.net}），这也是它的盈亏平衡点，而买到手之后股价还可能继续下跌；最坏情况是股价跌到 $0 时，这个价格 × 100。只要这张看跌还在，现金就一直被占用：在 ALFA 上卖出一张看跌，要占用 ${f.account} 账户中的 ${f.cash}。券商按级别开通期权权限，并自行决定备兑看涨、现金担保看跌、价差和卖出未备兑期权各属哪一级；级别的划分和名称因券商而异，卖出之前先向你的券商确认。这里讲的是这项义务如何运作，并不说明该不该卖出看跌，或该选哪个行权价。`,
						])}
					</p>
				)
			}
		/>
	);
}

// ——— Scene 3: assignment, at expiry and before it ———

type AssignState = {
	trade: Trade;
	end: End;
	closed: boolean;
	/** The put on Mon Oct 14, deep in the money, instead of on expiry day. */
	early: boolean;
};

function AssignView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: AssignState;
	explore: AssignState | null;
	setExplore: (next: AssignState) => void;
}) {
	const t = tr(locale);
	const exploring = phase === "explore" && explore !== null;
	const shown = exploring && explore ? explore : state;
	const call = shown.trade === "call";
	const early = shown.early && !call;
	const spot = ENDS[shown.end];
	const outcome = settle(shown.trade, spot, shown.closed);
	const assigned = !early && outcome.assigned;
	const sharesLabel = (strike: number): Copy => [
		`${SHARES} ALFA at $${strike}`,
		`${SHARES} 股 ALFA，每股 $${strike}`,
	];
	const transfers: FlowTransfer[] = !assigned
		? []
		: call
			? [
					{
						id: "shares",
						from: "you",
						to: "holder",
						label: t(sharesLabel(CALL.strike)),
						kind: "shares",
					},
					{
						id: "cash",
						from: "holder",
						to: "you",
						label: f.delivery,
						kind: "cash",
					},
				]
			: [
					{
						id: "cash",
						from: "you",
						to: "holder",
						label: f.cash,
						kind: "cash",
					},
					{
						id: "shares",
						from: "holder",
						to: "you",
						label: t(sharesLabel(PUT.strike)),
						kind: "shares",
					},
				];
	const yours: string[] = shown.closed
		? [
				t(["bought back: nothing to assign", "已买回：没有可指派的"]),
				call
					? t([`${SHARES} ALFA shares`, `${SHARES} 股 ALFA`])
					: t([`${f.cash} cash free`, `${f.cash} 现金可用`]),
			]
		: early
			? [
					t(["may be assigned tonight", "今晚可能被指派"]),
					t([`${f.cash} set aside`, `预留 ${f.cash}`]),
				]
			: assigned
				? call
					? [
							t(["no ALFA shares", "没有 ALFA 股票"]),
							t([`+${f.delivery} cash`, `现金 +${f.delivery}`]),
						]
					: [
							t([`${SHARES} ALFA shares`, `${SHARES} 股 ALFA`]),
							t([`−${f.cash} cash`, `现金 −${f.cash}`]),
						]
				: [
						t(["expired worthless", "到期作废"]),
						call
							? t([`${SHARES} ALFA shares`, `${SHARES} 股 ALFA`])
							: t([`${f.cash} cash free`, `${f.cash} 现金可用`]),
					];
	const parties: [FlowParty, FlowParty] = [
		{
			id: "you",
			name: t(["You", "你"]),
			role: call
				? t([`wrote the ${f.call} call`, `卖出 ${f.call} 看涨`])
				: t([`wrote the ${f.put} put`, `卖出 ${f.put} 看跌`]),
			holdings: yours,
		},
		{
			id: "holder",
			name: t(["A holder who exercised", "行权的持有人"]),
			role: t(["matched by the clearing house", "由清算所匹配"]),
			holdings: assigned
				? call
					? [t([`got ${SHARES} ALFA`, `得到 ${SHARES} 股 ALFA`])]
					: [t([`got ${f.cash}`, `得到 ${f.cash}`])]
				: [],
		},
	];
	const result: ResultItem[] = early
		? [
				{
					id: "in",
					label: t(["In the money by", "实值幅度"]),
					value: f.earlyInBy,
					note: t([
						`ALFA ${f.earlySpot} on ${EARLY_DAY[0]}`,
						`${EARLY_DAY[1]} ALFA ${f.earlySpot}`,
					]),
					evidence: "calculated",
				},
				{
					id: "time",
					label: t(["Time value left", "剩余时间价值"]),
					value: f.earlyTime,
					note: t(["a share, model value", "每股，模型值"]),
					evidence: "modeled",
				},
				shown.closed
					? {
							id: "back",
							label: t(["Bought back to close", "买回平仓"]),
							value: f.buyBackResult,
							note: t([
								`at the ${f.buyBack} ask, a model quote`,
								`按卖价 ${f.buyBack}，模型报价`,
							]),
							tone: "loss",
							evidence: "modeled",
						}
					: {
							id: "tonight",
							label: t(["If assigned tonight", "如果今晚被指派"]),
							value: f.earlyAssigned,
							note: t([
								`pay ${f.cash} for shares worth ${whole(EARLY.spot * SHARES)}, less the ${f.putKept} kept`,
								`为价值 ${whole(EARLY.spot * SHARES)} 的股票支付 ${f.cash}，减去留下的 ${f.putKept}`,
							]),
							tone: "loss",
							evidence: "calculated",
						},
			]
		: [
				{
					id: "option",
					label: call
						? t([`Your ${f.call} call`, `你卖出的 ${f.call} 看涨`])
						: t([`Your ${f.put} put`, `你卖出的 ${f.put} 看跌`]),
					value: shown.closed
						? t([
								`bought back at ${usd(outcome.ask)}`,
								`以 ${usd(outcome.ask)} 买回`,
							])
						: assigned
							? t(["assigned", "被指派"])
							: t(["expires worthless", "到期作废"]),
					note: shown.closed
						? t([
								"the ask on expiry afternoon, a model quote",
								"到期日下午的卖价，模型报价",
							])
						: t([`ALFA closes at ${price(spot)}`, `ALFA 收于 ${price(spot)}`]),
					evidence: shown.closed ? "modeled" : undefined,
				},
				{
					id: "result",
					label: t(["Result per contract", "每张合约的结果"]),
					value: signedWhole(outcome.profit),
					note:
						outcome.shares > 0
							? t([
									`${SHARES} shares valued at ${price(spot)}`,
									`${SHARES} 股按 ${price(spot)} 计`,
								])
							: undefined,
					tone: toneOf(outcome.profit),
					evidence: shown.closed ? "modeled" : "calculated",
				},
			];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"What moves between you and the holder who exercised when an option you sold is assigned",
						"你卖出的期权被指派时，你与行权的持有人之间转移的东西",
					])}
					height={(width) => transferFlowHeight(width, 2)}
				>
					{(width) => (
						<TransferFlow
							width={width}
							parties={parties}
							transfers={transfers}
							slots={2}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				exploring && explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["You sold", "你卖出的"])}
							value={explore.trade}
							options={[
								["call", t(["Covered call", "备兑看涨"])],
								["put", t(["Cash-secured put", "现金担保看跌"])],
							]}
							onChange={(trade) => setExplore({ ...explore, trade })}
						/>
						<ChoiceField
							label={t([
								`ALFA closes on ${f.expiry[0]} at`,
								`${f.expiry[1]} ALFA 收于`,
							])}
							value={explore.end}
							options={[
								["low", f.low],
								["middle", f.middle],
								["high", f.high],
							]}
							onChange={(end) => setExplore({ ...explore, end })}
						/>
						<ChoiceField
							label={t(["Before the close", "收盘前"])}
							value={explore.closed ? "closed" : "open"}
							options={[
								["open", t(["Leave it open", "保持不动"])],
								["closed", t(["Buy it back", "买回平仓"])],
							]}
							onChange={(value) =>
								setExplore({ ...explore, closed: value === "closed" })
							}
						/>
					</FieldGroup>
				) : null
			}
			details={
				// The detail states the scene's answer: it opens once the prediction is made.
				phase === "predict" ? null : (
					<p>
						{t([
							`ALFA options are American-style: the holder may exercise on any trading day, so the writer can be assigned on any of the ${f.days} trading days to ${f.expiry[0]}, and there is no way to tell which. It is likelier when the option is in the money with little time value left, and for a call just before the stock goes ex-dividend, when a holder may exercise to collect the dividend. At expiry, an equity option $0.01 or more in the money is exercised unless its holder instructs otherwise; a broker may set its own threshold, and a close within a few cents of a strike can leave you unsure until Monday. The only sure way not to be assigned is to buy the option back before the close. Prices on days after Sep 16 come from the course's model.`,
							`ALFA 期权是美式期权：持有人可以在任一交易日行权，所以到 ${f.expiry[1]}为止的 ${f.days} 个交易日里，义务方在任何一天都可能被指派，而且无法预知是哪一天。期权处于实值且时间价值所剩无几时，被指派的可能性更大；对看涨来说，股票除息日前夕也是如此，因为持有人可能为了拿到股息而行权。到期时，实值 $0.01 或以上的股票期权会被行权，除非持有人另行指示；券商也可以另设自己的门槛，而收盘价离行权价只差几美分时，你可能要到周一才知道是否被指派。唯一能确保不被指派的办法，是在收盘前把期权买回。9月16日之后各天的价格来自课程的模型。`,
						])}
					</p>
				)
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<CoveredState, CoveredState>({
		id: "covered",
		label: ["Covered call", "备兑看涨"],
		title: ["A call sold against shares you own", "对着自己持有的股票卖出看涨"],
		predict: {
			prompt: [
				`You own ${SHARES} ALFA shares bought at ${f.cost} and sell one ${f.expiry[0]} ${f.call} call against them at its ${f.callBid} bid. If ALFA fell to $0 by ${f.expiry[0]}, what would the shares and the call lose together?`,
				`你持有以 ${f.cost} 买入的 ${SHARES} 股 ALFA，并对着它们按买价 ${f.callBid} 卖出一张 ${f.expiry[1]} ${f.call} 看涨。如果到 ${f.expiry[1]}，ALFA 跌到 $0，股票和看涨合计会亏多少？`,
			],
			choices: [
				{
					id: "worst",
					label: [f.coveredWorstSize, f.coveredWorstSize],
				},
				{
					id: "shares",
					label: [f.sharesCost, f.sharesCost],
					why: [
						`${f.sharesCost} is what the shares cost. The ${f.callKept} kept for the call comes off it: (${f.cost} − ${f.callBid}) × ${SHARES} = ${f.coveredWorstSize}.`,
						`${f.sharesCost} 是股票的成本。卖出看涨留下的 ${f.callKept} 要从中扣掉：(${f.cost} − ${f.callBid}) × ${SHARES} = ${f.coveredWorstSize}。`,
					],
				},
				{
					id: "covered",
					label: ["$0: the call is covered", "$0：这张看涨有保障"],
					why: [
						`Covered means the shares can be delivered if the call is assigned. It does not protect the shares from falling: below ${f.coveredEven} the pair loses money.`,
						`有保障的意思是，看涨被指派时可以交出股票。它并不能防止股票下跌：低于 ${f.coveredEven} 时，这一组就会亏钱。`,
					],
				},
				{
					id: "unlimited",
					label: ["No limit: a call was sold", "没有上限：因为卖出了看涨"],
					why: [
						`A call sold on its own has no limit, but these shares cover it: above $${f.call}, each dollar the call loses, the shares gain. The large loss is on the way down, and it stops at $0.`,
						`单独卖出的看涨亏损没有上限，但这些股票覆盖了它：高于 $${f.call} 后，看涨每亏一美元，股票就赚一美元。大的亏损在下跌的方向，而且到 $0 为止。`,
					],
				},
			],
			answer: "worst",
			entry: { answer: -COVERED_WORST / 100, prefix: "$", eitherSign: true },
			revealAt: 2,
			explain: [
				`At $0 the shares lose ${f.sharesCost}, and the ${f.callKept} kept for the call offsets part of it: (${f.cost} − ${f.callBid}) × ${SHARES} = ${f.coveredWorstSize}. The call covers nothing on the way down.`,
				`股价到 $0 时，股票亏掉 ${f.sharesCost}，卖出看涨留下的 ${f.callKept} 抵消其中一部分：(${f.cost} − ${f.callBid}) × ${SHARES} = ${f.coveredWorstSize}。下跌时，这张看涨什么也挡不住。`,
			],
		},
		beats: [
			{
				id: "pair",
				label: ["The pair", "这一组"],
				caption: [
					`Mon Sep 16, ALFA $100. You own ${SHARES} shares bought at ${f.cost} and sell one ${f.expiry[0]} ${f.call} call against them at its ${f.callBid} bid: ${f.callKept} is yours whatever happens. In exchange you take on an obligation: if the call is assigned, you sell the shares at $${f.call}.`,
					`9月16日 周一，ALFA $100。你持有以 ${f.cost} 买入的 ${SHARES} 股，并对着它们按买价 ${f.callBid} 卖出一张 ${f.expiry[1]} ${f.call} 看涨：无论发生什么，${f.callKept} 都归你。作为交换，你承担了一项义务：如果看涨被指派，就以 $${f.call} 卖出这些股票。`,
				],
				state: { stage: 0, spot: 100 },
			},
			{
				id: "best",
				label: ["Best case", "最好情况"],
				caption: [
					`At $${f.call} or above on ${f.expiry[0]}, the pair makes its most: the shares are up $${f.call - STOCK_COST / 100} a share to the strike, plus the premium, ${f.coveredBest} a contract. Above $${f.call} the call is assigned and the shares go at $${f.call}, so ALFA rising further adds nothing.`,
					`${f.expiry[1]}收在 $${f.call} 及以上时，这一组赚到最多：股票涨到行权价，每股赚 $${f.call - STOCK_COST / 100}，再加上权利金，每张 ${f.coveredBest}。高于 $${f.call} 时看涨被指派，股票以 $${f.call} 卖出，所以 ALFA 再涨也不会多赚。`,
				],
				state: { stage: 1, spot: ENDS.high },
			},
			{
				id: "worst",
				label: ["Worst case", "最坏情况"],
				caption: [
					`The premium lowers break-even to ${f.cost} − ${f.callBid} = ${f.coveredEven}. Below it the pair loses, and if ALFA fell to $0 it would lose ${f.coveredWorstSize}: the shares are still yours to lose.`,
					`权利金把盈亏平衡点降到 ${f.cost} − ${f.callBid} = ${f.coveredEven}。低于这个价格就会亏钱，如果 ALFA 跌到 $0，会亏 ${f.coveredWorstSize}：股票下跌的风险仍然在你身上。`,
				],
				state: { stage: 2, spot: ENDS.low },
			},
			{
				id: "trade-off",
				label: ["The trade-off", "取舍"],
				caption: [
					`Above $${f.call} + ${f.callBid} = ${f.cap}, the shares alone would have made more. At ${f.rally} they are up ${f.rallyShares}; with the call sold, the pair stays at ${f.rallyCovered}.`,
					`高于 $${f.call} + ${f.callBid} = ${f.cap} 时，只持股会赚得更多。收在 ${f.rally} 时，只持股赚 ${f.rallyShares}；卖出了看涨，这一组仍是 ${f.rallyCovered}。`,
				],
				state: { stage: 3, spot: RALLY },
			},
		],
		explore: {
			prompt: [
				`Drag ALFA's price on ${f.expiry[0]} and compare the pair with the shares alone.`,
				`拖动 ${f.expiry[1]} ALFA 的价格，比较这一组和只持股。`,
			],
			start: () => ({ stage: 3, spot: 100 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the lowest whole-dollar price at which the shares alone end ahead of the covered call.",
					"找出只持股开始比备兑看涨赚得多的最低整数价格。",
				],
				reached: (e) => e.spot === SHARES_AHEAD_FROM,
				done: [
					`From ${f.sharesAhead} the shares alone are ahead: above $${f.call} the call takes every further dollar, and the ${f.callBid} premium makes up for it only up to ${f.cap}. At ${f.sharesAhead} the shares alone make ${signedWhole(sharesProfit(SHARES_AHEAD_FROM))}, the pair ${f.coveredBest}.`,
					`从 ${f.sharesAhead} 起，只持股领先：高于 $${f.call} 后，看涨拿走之后的每一美元，${f.callBid} 的权利金只能补到 ${f.cap}。收在 ${f.sharesAhead} 时，只持股赚 ${signedWhole(sharesProfit(SHARES_AHEAD_FROM))}，这一组是 ${f.coveredBest}。`,
				],
			},
		},
		View: CoveredView,
	}),
	defineScene<SecuredState, SecuredState>({
		id: "secured",
		label: ["Cash-secured put", "现金担保看跌"],
		title: ["A put sold against cash set aside", "对着预留的现金卖出看跌"],
		predict: {
			prompt: [
				`You sell one ${f.expiry[0]} ${f.put} put at its ${f.putBid} bid as a cash-secured put. How much cash is set aside for it?`,
				`你按买价 ${f.putBid} 卖出一张 ${f.expiry[1]} ${f.put} 看跌，作为现金担保看跌。要为它预留多少现金？`,
			],
			choices: [
				{ id: "strike", label: [f.cash, f.cash] },
				{
					id: "premium",
					label: [f.putKept, f.putKept],
					why: [
						`${f.putKept} is what you receive for the put. The obligation is to buy ${SHARES} shares at $${f.put} if it is assigned: $${f.put} × ${SHARES} = ${f.cash}.`,
						`${f.putKept} 是你卖出看跌收到的钱。义务是在被指派时以 $${f.put} 买入 ${SHARES} 股：$${f.put} × ${SHARES} = ${f.cash}。`,
					],
				},
				{
					id: "spot",
					label: [f.sharesCost, f.sharesCost],
					why: [
						`${f.sharesCost} is ${SHARES} shares at today's $100. The put obliges you to buy at its $${f.put} strike, not at today's price.`,
						`${f.sharesCost} 是按今天的 $100 买 ${SHARES} 股。看跌的义务是按 $${f.put} 的行权价买入，而不是按今天的价格。`,
					],
				},
			],
			answer: "strike",
			entry: { answer: CASH / 100, prefix: "$" },
			revealAt: 1,
			explain: [
				`Assigned, you must buy ${SHARES} shares at $${f.put}, so $${f.put} × ${SHARES} = ${f.cash} is set aside: ${f.cashShare} of a ${f.account} account, tied up while the put is open.`,
				`被指派时，你必须以 $${f.put} 买入 ${SHARES} 股，所以要预留 $${f.put} × ${SHARES} = ${f.cash}：占 ${f.account} 账户的 ${f.cashShare}，在这张看跌存续期间一直被占用。`,
			],
		},
		beats: [
			{
				id: "sell",
				label: ["The sale", "卖出"],
				caption: [
					`Now with no shares: sell one ${f.expiry[0]} ${f.put} put at its ${f.putBid} bid. ${f.putKept} is yours whatever happens. In exchange you take on an obligation: if the put is assigned, you buy ${SHARES} ALFA shares at $${f.put}.`,
					`这次手里没有股票：按买价 ${f.putBid} 卖出一张 ${f.expiry[1]} ${f.put} 看跌。无论发生什么，${f.putKept} 都归你。作为交换，你承担了一项义务：如果看跌被指派，就以 $${f.put} 买入 ${SHARES} 股 ALFA。`,
				],
				state: { stage: 0, spot: 100, puts: 1 },
			},
			{
				id: "cash",
				label: ["The cash", "现金"],
				caption: [
					`To cover it, $${f.put} × ${SHARES} = ${f.cash} in cash is set aside, and it stays tied up while the put is open. In a ${f.account} example account, that is ${f.cashShare} of it.`,
					`为了保障这项义务，要预留 $${f.put} × ${SHARES} = ${f.cash} 现金，在这张看跌存续期间一直被占用。在一个 ${f.account} 的示例账户里，这占了 ${f.cashShare}。`,
				],
				state: { stage: 1, spot: 100, puts: 1 },
			},
			{
				id: "kept",
				label: ["Best case", "最好情况"],
				caption: [
					`If ALFA ends ${f.expiry[0]} at $${f.put} or above, the put expires worthless: the ${f.putKept} is kept and the cash is free again. That is the most it can make.`,
					`如果 ${f.expiry[1]} ALFA 收在 $${f.put} 及以上，看跌到期作废：${f.putKept} 留下，现金也重新可用。这就是它最多能赚的。`,
				],
				state: { stage: 2, spot: 100, puts: 1 },
			},
			{
				id: "assigned",
				label: ["Assigned", "被指派"],
				caption: [
					`At ${f.low} the put is assigned: the ${f.cash} buys ${SHARES} shares at $${f.put}, a net ${f.net} each after the premium. Valued at ${f.low}, that is ${f.lowResult}, and from here the shares move with ALFA.`,
					`收在 ${f.low} 时，看跌被指派：用 ${f.cash} 以 $${f.put} 买入 ${SHARES} 股，扣除权利金后每股净价 ${f.net}。按 ${f.low} 计算是 ${f.lowResult}，此后这些股票随 ALFA 涨跌。`,
				],
				state: { stage: 3, spot: ENDS.low, puts: 1 },
			},
			{
				id: "falling",
				label: ["Worst case", "最坏情况"],
				caption: [
					`The shares can keep falling after you own them: at ${f.fall} the result is ${f.fallResult}, and if ALFA fell to $0 it would be ${f.securedWorst}. Some traders sell a put at a price they would pay for the shares anyway; the premium does not stop the fall.`,
					`买到手之后，股价还可能继续下跌：收在 ${f.fall} 时结果是 ${f.fallResult}；如果 ALFA 跌到 $0，会是 ${f.securedWorst}。有些交易者会在自己本来就愿意买股的价格卖出看跌；但权利金挡不住下跌。`,
				],
				state: { stage: 4, spot: RANGE[0], puts: 1 },
			},
		],
		explore: {
			prompt: [
				`Move ALFA's price on ${f.expiry[0]} and change how many puts are sold.`,
				`移动 ${f.expiry[1]} ALFA 的价格，并改变卖出的看跌张数。`,
			],
			start: () => ({ stage: 4, spot: 100, puts: 1 }),
			task: {
				kind: "answer",
				prompt: [
					`How many of these puts can a ${f.account} account secure with cash at once?`,
					`一个 ${f.account} 的账户，一次最多能用现金担保几张这样的看跌？`,
				],
				choices: [
					{ id: "one", label: ["1 put", "1 张"] },
					{ id: "two", label: ["2 puts", "2 张"] },
					{
						id: "many",
						label: [
							`${Math.floor(ACCOUNT / PUT_PREMIUM)} puts`,
							`${Math.floor(ACCOUNT / PUT_PREMIUM)} 张`,
						],
					},
				],
				answer: PUTS_SECURED === 1 ? "one" : "two",
				done: [
					`Each needs $${f.put} × ${SHARES} = ${f.cash} set aside: ${PUTS_SECURED} fits in ${f.account}, and two would need ${f.twoCash}. The cash for the obligation, not the premium, sets how many.`,
					`每张都要预留 $${f.put} × ${SHARES} = ${f.cash}：${f.account} 里只放得下 ${PUTS_SECURED} 张，两张就需要 ${f.twoCash}。决定张数的是履行义务所需的现金，而不是权利金。`,
				],
			},
		},
		View: SecuredView,
	}),
	defineScene<AssignState, AssignState>({
		id: "assignment",
		label: ["Assignment", "指派"],
		title: [
			"Assignment: one of the ways a sold option ends",
			"指派：卖出的期权可能的结局之一",
		],
		predict: {
			prompt: [
				`Below, your covered call is assigned on ${f.expiry[0]}. Now the ${f.put} put you sold on Sep 16: on ${EARLY_DAY[0]}, ALFA is ${f.earlySpot}. Can you be assigned before ${f.expiry[0]}?`,
				`下方是你的备兑看涨在 ${f.expiry[1]}被指派。再看你在 9月16日 卖出的 ${f.put} 看跌：${EARLY_DAY[1]}，ALFA 为 ${f.earlySpot}。在 ${f.expiry[1]}之前，你会被指派吗？`,
			],
			choices: [
				{
					id: "any",
					label: [
						"Yes: on any trading day until it expires",
						"会：到期前的任一交易日都可能",
					],
				},
				{
					id: "expiry",
					label: [`No: only on ${f.expiry[0]}`, `不会：只会在 ${f.expiry[1]}`],
					why: [
						"ALFA options are American-style: the holder may exercise on any trading day, so you can be assigned on any of them, and you can't tell which in advance.",
						"ALFA 期权是美式期权：持有人可以在任一交易日行权，所以你在任何一天都可能被指派，而且无法提前知道是哪一天。",
					],
				},
				{
					id: "agree",
					label: ["Only if you agree to it", "只有你同意才会"],
					why: [
						"Assignment isn't a request: you took on the obligation when you sold the put. The holder decides to exercise, and the assignment reaches a writer through the clearing house and the broker.",
						"指派不是请求：卖出看跌时你就承担了这项义务。行权由持有人决定，指派经清算所和券商落到某位义务方身上。",
					],
				},
				{
					id: "otm",
					label: ["No: the put is out of the money", "不会：这张看跌是虚值"],
					why: [
						`At ${f.earlySpot} the ${f.put} put is ${f.earlyInBy} in the money: its holder has the right to sell at $${f.put} shares that trade at ${f.earlySpot}.`,
						`ALFA 为 ${f.earlySpot} 时，${f.put} 看跌有 ${f.earlyInBy} 的实值：它的持有人有权以 $${f.put} 卖出市价只有 ${f.earlySpot} 的股票。`,
					],
				},
			],
			answer: "any",
			revealAt: 2,
			explain: [
				`ALFA options are American-style, so the writer can be assigned on any trading day. On ${EARLY_DAY[0]} the put is ${f.earlyInBy} in the money, and the course's model puts its time value at ${f.earlyTime} a share: a holder gains little by waiting, so assignment that night is possible, and likelier than earlier on. Only buying the put back would rule it out.`,
				`ALFA 期权是美式期权，所以义务方在任一交易日都可能被指派。${EARLY_DAY[1]}，这张看跌有 ${f.earlyInBy} 的实值，按课程的模型，时间价值只剩每股 ${f.earlyTime}：持有人等下去也得不到多少，所以当晚被指派是可能的，而且比之前更可能。只有把看跌买回，才能排除这种可能。`,
			],
		},
		beats: [
			{
				id: "call-assigned",
				label: ["Covered call assigned", "备兑看涨被指派"],
				caption: [
					`On ${f.expiry[0]} ALFA closes at ${f.high}: the ${f.call} call is ${f.highInBy} in the money and is exercised, and you are assigned. Your ${SHARES} shares go to the holder at $${f.call} and ${f.delivery} comes in: ${f.coveredBest} in all. Assignment is one of the ways a covered call ends.`,
					`${f.expiry[1]} ALFA 收于 ${f.high}：${f.call} 看涨有 ${f.highInBy} 的实值，被行权，你被指派。你的 ${SHARES} 股以 $${f.call} 交给持有人，收到 ${f.delivery}：合计 ${f.coveredBest}。被指派是备兑看涨的结局之一。`,
				],
				state: { trade: "call", end: "high", closed: false, early: false },
			},
			{
				id: "put-assigned",
				label: ["Cash-secured put assigned", "现金担保看跌被指派"],
				caption: [
					`At ${f.low} the ${f.put} put is ${f.lowInBy} in the money and you are assigned: the ${f.cash} set aside goes out and ${SHARES} shares come in, a net ${f.net} each. Valued at ${f.low}, ${f.lowResult}. That is the obligation the cash was there for.`,
					`收于 ${f.low} 时，${f.put} 看跌有 ${f.lowInBy} 的实值，你被指派：预留的 ${f.cash} 付出去，${SHARES} 股进来，每股净价 ${f.net}。按 ${f.low} 计算，${f.lowResult}。预留的现金就是为这项义务准备的。`,
				],
				state: { trade: "put", end: "low", closed: false, early: false },
			},
			{
				id: "early",
				label: ["Before expiry", "到期之前"],
				caption: [
					`Assignment does not wait for ${f.expiry[0]}. On ${EARLY_DAY[0]} ALFA is ${f.earlySpot}: the put is ${f.earlyInBy} in the money, and the course's model puts its time value at ${f.earlyTime} a share. A holder gains little by waiting, so you could be assigned that night, and you can't tell in advance. For a call, it is also likelier just before the stock goes ex-dividend.`,
					`指派不会等到 ${f.expiry[1]}。${EARLY_DAY[1]} ALFA 为 ${f.earlySpot}：这张看跌有 ${f.earlyInBy} 的实值，按课程的模型，时间价值只剩每股 ${f.earlyTime}。持有人等下去也得不到多少，所以你当晚就可能被指派，而且无法提前知道。对看涨来说，股票除息日前夕被指派的可能性也会更大。`,
				],
				state: { trade: "put", end: "low", closed: false, early: true },
			},
			{
				id: "buy-back",
				label: ["Buy it back", "买回平仓"],
				caption: [
					`The only sure way not to be assigned is to buy the option back to close. That day the put costs its ${f.buyBack} ask, a model quote: ${f.buyBackResult} per contract, and nothing is left to assign. Closing ends the obligation; it does not undo the loss.`,
					`唯一能确保不被指派的办法，是把期权买回平仓。当天这张看跌按卖价 ${f.buyBack} 买回（模型报价）：每张 ${f.buyBackResult}，之后就没有可指派的东西了。平仓结束了义务，但不会抹掉亏损。`,
				],
				state: { trade: "put", end: "low", closed: true, early: true },
			},
		],
		explore: {
			prompt: [
				`Choose what you sold, where ALFA closes on ${f.expiry[0]}, and whether you buy the option back first.`,
				`选择你卖出的期权、${f.expiry[1]} ALFA 的收盘价，以及是否先把期权买回。`,
			],
			start: () => ({
				trade: "call",
				end: "middle",
				closed: false,
				early: false,
			}),
			task: {
				kind: "answer",
				prompt: [
					"Which one action makes sure an option you sold is not assigned?",
					"哪一个做法能确保你卖出的期权不被指派？",
				],
				choices: [
					{ id: "close", label: ["Buy it back to close", "买回平仓"] },
					{
						id: "tell",
						label: ["Tell your broker not to exercise it", "告诉券商不要行权"],
					},
					{ id: "wait", label: ["Hold it to expiry", "一直持有到期"] },
				],
				answer: "close",
				done: [
					"Bought back, the option is closed and nothing is left to assign. Exercise is the holder's decision, not yours, and an option held to expiry $0.01 or more in the money is exercised unless its holder instructs otherwise.",
					"买回之后，期权已经平仓，没有可指派的东西了。行权由持有人决定，不由你决定；而一直持有到期、实值 $0.01 或以上的期权，除非持有人另行指示，就会被行权。",
				],
			},
		},
		View: AssignView,
	}),
] as const;

export function SellingCoveredOptionsWalkthrough({
	locale,
}: {
	locale: Locale;
}) {
	return (
		<Player
			locale={locale}
			id="selling-covered-options"
			label={[
				"Interactive lesson on selling a covered call and a cash-secured put, and on assignment",
				"关于卖出备兑看涨与现金担保看跌、以及指派的互动课",
			]}
			film={sellingCoveredOptionsFilm}
			scenes={scenes}
		/>
	);
}
