import { type Copy, optionQuote, pick, signedUsd, usd } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	type PayoffBand,
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import {
	type TapeRow,
	TradeTape,
	tapeHeight,
	tapeTitle,
} from "../walkthrough/instruments/trade-tape";
import { Working, workingHeight } from "../walkthrough/instruments/working";
import { Player } from "../walkthrough/player";
import { Stage } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { multiLegStructuresFilm } from "./multi-leg-structures-film";
import {
	CALL_100,
	CALL_CREDIT,
	CLOSES,
	CREDIT,
	callSpread,
	condor,
	curve,
	LEGS,
	type Leg,
	legCash,
	legPrice,
	legValueAt,
	MAX_LOSS,
	NET_CASH,
	oct18,
	PUT_100,
	PUT_CREDIT,
	PUT_SIDE_CLOSE,
	putSpread,
	RANGE,
	resultAt,
	SIZE,
	STRADDLE_COST,
	STRADDLE_HIGH,
	STRADDLE_LOW,
	STRIKES,
	straddle,
	WIDTH,
	WORST_CASH,
	worth,
} from "./multi-leg-structures-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

/** Dollars a share to whole dollars a contract: "+$375", "−$283". */
const perContract = (perShare: number) =>
	signedUsd(Math.round(perShare * 100) * 100, 0);
const share = (dollars: number) => usd(Math.round(dollars * 100));
// ——— Scene 1: a long straddle ———

type StraddleState = { stage: 0 | 1 | 2 | 3; spot: number };

function StraddleView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: StraddleState;
	explore: StraddleState | null;
	setExplore: (next: StraddleState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const costed = shown.stage >= 3;
	const lines: PayoffLine[] = [
		{
			id: "call",
			label: t(["long 100 call", "100 看涨多头"]),
			shortLabel: t(["call", "看涨"]),
			points: curve((spot) => worth(CALL_100, spot), [100]),
			tone: shown.stage === 0 ? "position" : "call",
		},
	];
	if (shown.stage >= 1)
		lines.push({
			id: "put",
			label: t(["long 100 put", "100 看跌多头"]),
			shortLabel: t(["put", "看跌"]),
			points: curve((spot) => worth(PUT_100, spot), [100]),
			tone: "put",
		});
	if (shown.stage >= 2)
		lines.push({
			id: "sum",
			label: costed
				? t(["straddle profit", "跨式盈亏"])
				: t(["both legs", "两条腿合计"]),
			shortLabel: t(["straddle", "跨式"]),
			points: curve(
				(spot) => straddle(spot) - (costed ? STRADDLE_COST : 0),
				[100],
			),
			tone: "position",
		});
	const value = straddle(shown.spot) - (costed ? STRADDLE_COST : 0);
	const markers: PayoffMarker[] = [];
	if (costed)
		markers.push(
			{
				id: "low",
				x: STRADDLE_LOW,
				y: 0,
				label: share(STRADDLE_LOW),
				labelBelow: true,
			},
			{
				id: "high",
				x: STRADDLE_HIGH,
				y: 0,
				label: share(STRADDLE_HIGH),
				labelBelow: true,
			},
		);
	if (phase === "explore")
		markers.push({
			id: "at",
			x: shown.spot,
			y: value * 100,
			label: perContract(value),
			tone: value > 0 ? "gain" : value < 0 ? "loss" : "neutral",
			// Near the strike the V rises on both sides of the point.
			labelBelow: Math.abs(shown.spot - 100) <= 8,
		});
	const bands: PayoffBand[] = costed
		? [{ id: "loses", from: STRADDLE_LOW, to: STRADDLE_HIGH, tone: "loss" }]
		: [];
	const result: ResultItem[] = [
		{
			id: "call",
			label: t(["Long 100 call", "100 看涨多头"]),
			value: perContract(worth(CALL_100, shown.spot)),
			note: t([`at ALFA $${shown.spot}`, `ALFA $${shown.spot} 时`]),
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "put",
			label: t(["Long 100 put", "100 看跌多头"]),
			value: perContract(worth(PUT_100, shown.spot)),
		});
	if (shown.stage >= 2)
		result.push({
			id: "sum",
			label: costed ? t(["Profit", "盈亏"]) : t(["Both legs", "两条腿合计"]),
			value: perContract(value),
			note: costed
				? t([
						`after ${share(STRADDLE_COST)} a share paid`,
						`扣除每股已付 ${share(STRADDLE_COST)}`,
					])
				: undefined,
			tone: costed
				? value > 0
					? "gain"
					: value < 0
						? "loss"
						: "neutral"
				: undefined,
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A long Oct 18 100 straddle at expiry: the call, the put, their sum and the profit after their cost",
						"10月18日 100 跨式多头的到期情况：看涨、看跌、两者之和，以及扣除成本后的盈亏",
					])}
					height={(width) => (width < 520 ? 260 : 300)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 300}
							xRange={RANGE}
							yRange={[-1500, 2200]}
							xTicks={[80, 90, 100, 110, 120]}
							yTicks={[-1000, 0, 1000, 2000]}
							lines={lines}
							markers={markers}
							bands={bands}
							drag={
								explore
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
								`Buy the 100 call and 100 put · ${share(STRADDLE_COST / 2)} each · per straddle`,
								`买入 100 看涨和 100 看跌 · 每股各 ${share(STRADDLE_COST / 2)} · 每组跨式`,
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<RangeControl
						label={t(["ALFA on Oct 18", "10月18日 ALFA"])}
						value={explore.spot}
						display={`$${explore.spot}`}
						min={RANGE[0]}
						max={RANGE[1]}
						onChange={(spot) => setExplore({ ...explore, spot })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						`A straddle buys a call and a put at one strike, so it pays if ALFA moves far enough either way and loses most if it doesn't move. A strangle buys them at different strikes, such as the 105 call and the 95 put for ${share((optionQuote(oct18(105, "call")).ask + optionQuote(oct18(95, "put")).ask) / 100)}: cheaper, but ALFA has to get past about $109.30 or $90.70. Selling either one reverses the picture: you collect the premium and carry the risk of a big move.`,
						`跨式在同一行权价买入一张看涨和一张看跌，所以 ALFA 无论朝哪个方向走得足够远都能赚钱，不动则亏得最多。宽跨式在不同行权价买入两者，例如 105 看涨和 95 看跌，共 ${share((optionQuote(oct18(105, "call")).ask + optionQuote(oct18(95, "put")).ask) / 100)}：更便宜，但 ALFA 要越过约 $109.30 或 $90.70。卖出其中任何一种，情形就反过来：你收取权利金，承担大幅变动的风险。`,
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: an iron condor ———

type CondorState = { stage: 0 | 1 | 2 | 3; spot: number };

function CondorView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: CondorState;
	explore: CondorState | null;
	setExplore: (next: CondorState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const lines: PayoffLine[] = [
		{
			id: "puts",
			label: t(["95/90 put spread", "95/90 看跌价差"]),
			shortLabel: t(["puts", "看跌"]),
			points: curve(putSpread, STRIKES),
			tone: shown.stage === 0 ? "position" : "put",
		},
	];
	if (shown.stage >= 1)
		lines.push({
			id: "calls",
			label: t(["105/110 call spread", "105/110 看涨价差"]),
			shortLabel: t(["calls", "看涨"]),
			points: curve(callSpread, STRIKES),
			tone: "call",
		});
	if (shown.stage >= 2)
		lines.push({
			id: "condor",
			label: t(["iron condor", "铁鹰"]),
			points: curve(condor, STRIKES),
			tone: "position",
		});
	const value =
		shown.stage >= 2
			? condor(shown.spot)
			: shown.stage === 1
				? callSpread(shown.spot)
				: putSpread(shown.spot);
	const low = 95 - CREDIT;
	const high = 105 + CREDIT;
	const markers: PayoffMarker[] = [];
	if (shown.stage >= 3)
		markers.push(
			{ id: "low", x: low, y: 0, label: share(low), labelBelow: true },
			{ id: "high", x: high, y: 0, label: share(high), labelBelow: true },
		);
	if (phase === "explore")
		markers.push({
			id: "at",
			x: shown.spot,
			y: value * 100,
			label: perContract(value),
			tone: value > 0 ? "gain" : value < 0 ? "loss" : "neutral",
		});
	const bands: PayoffBand[] =
		shown.stage >= 3 ? [{ id: "keeps", from: 95, to: 105, tone: "gain" }] : [];
	const result: ResultItem[] = [
		{
			id: "puts",
			label: t(["Put spread", "看跌价差"]),
			value: perContract(putSpread(shown.spot)),
			note: t([
				`credit ${share(PUT_CREDIT)} · at ALFA $${shown.spot}`,
				`收入 ${share(PUT_CREDIT)} · ALFA $${shown.spot} 时`,
			]),
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "calls",
			label: t(["Call spread", "看涨价差"]),
			value: perContract(callSpread(shown.spot)),
			note: t([`credit ${share(CALL_CREDIT)}`, `收入 ${share(CALL_CREDIT)}`]),
		});
	if (shown.stage >= 2)
		result.push({
			id: "condor",
			label: t(["Iron condor", "铁鹰"]),
			value: perContract(condor(shown.spot)),
			note: t([
				`best ${perContract(CREDIT)} · worst ${perContract(-MAX_LOSS)}`,
				`最好 ${perContract(CREDIT)} · 最坏 ${perContract(-MAX_LOSS)}`,
			]),
			tone:
				condor(shown.spot) > 0
					? "gain"
					: condor(shown.spot) < 0
						? "loss"
						: "neutral",
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A short Oct 18 iron condor at expiry: the 95/90 put spread, the 105/110 call spread, and their sum",
						"10月18日 铁鹰空头的到期情况：95/90 看跌价差、105/110 看涨价差，以及两者之和",
					])}
					height={(width) => (width < 520 ? 260 : 300)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 300}
							xRange={RANGE}
							yRange={[-450, 350]}
							xTicks={[80, 90, 100, 110, 120]}
							yTicks={[-400, -200, 0, 200]}
							lines={lines}
							markers={markers}
							bands={bands}
							drag={
								explore
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
								`Short 95 put, 105 call · long 90 put, 110 call · ${share(CREDIT)} credit`,
								`卖出 95 看跌和 105 看涨 · 买入 90 看跌和 110 看涨 · 收入 ${share(CREDIT)}`,
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<RangeControl
						label={t(["ALFA on Oct 18", "10月18日 ALFA"])}
						value={explore.spot}
						display={`$${explore.spot}`}
						min={RANGE[0]}
						max={RANGE[1]}
						onChange={(spot) => setExplore({ ...explore, spot })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"An iron condor sells a put spread and a call spread around the stock, collecting a credit that it keeps if the stock stays between the short strikes. The long wings cap the loss: at most one side can finish in the money, so the worst case is one spread's width minus the whole credit. A butterfly is the same idea with the short strikes pushed together, here the 95/100/105 calls: it pays most if ALFA pins one price.",
						"铁鹰在股价两侧各卖出一个看跌价差和一个看涨价差，收取一笔权利金；只要股价留在两个卖出行权价之间，就能全部保留。买入的两翼限制了亏损：到期时最多只有一侧会是实值，所以最坏情况是一个价差的宽度减去全部收入。蝶式是同一个思路，只是把卖出的行权价合到一起，例如 95/100/105 看涨：ALFA 恰好停在一个价格时赚得最多。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: your condor as one order ———

type OrderState = { stage: 0 | 1 | 2; close: number };

/** "Sell 95 put", or with its size on a wider stage: "Sell 1 · 95 put". */
const legName = (leg: Leg, narrow: boolean): Copy => {
	const right: Copy =
		leg.contract.right === "call" ? ["call", "看涨"] : ["put", "看跌"];
	const side: Copy = leg.side === "sell" ? ["Sell", "卖出"] : ["Buy", "买入"];
	return narrow
		? [
				`${side[0]} ${leg.contract.strike} ${right[0]}`,
				`${side[1]} ${leg.contract.strike} ${right[1]}`,
			]
		: [
				`${side[0]} ${SIZE} · ${leg.contract.strike} ${right[0]}`,
				`${side[1]} ${SIZE} 张 ${leg.contract.strike} ${right[1]}`,
			];
};
/** Signed amounts in cents as a sum: "+$205 − $100 + $205 − $93". */
const sum = (cents: readonly number[]) =>
	cents
		.map((value, i) =>
			i === 0
				? signedUsd(value, 0)
				: `${value < 0 ? "−" : "+"} ${usd(Math.abs(value), 0)}`,
		)
		.join(" ");
const SOLD_CASH = LEGS.filter((leg) => leg.side === "sell").reduce(
	(total, leg) => total + legCash(leg),
	0,
);
const BOUGHT_CASH = NET_CASH - SOLD_CASH;
/** What the four legs are worth to you at a close, added up, in cents a condor. */
const legsAt = (close: number) =>
	LEGS.reduce((total, leg) => total + legValueAt(leg, close), 0);
const signTone = (cents: number): ResultItem["tone"] =>
	cents > 0 ? "gain" : cents < 0 ? "loss" : "neutral";
const PUT_SIDE_LEG = LEGS.find((leg) => legValueAt(leg, PUT_SIDE_CLOSE) !== 0);
const PUT_SIDE_OWED = -legsAt(PUT_SIDE_CLOSE);

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
	const shown = phase === "explore" && explore ? explore : state;
	const closed = shown.stage >= 2;
	const atClose = t([`At $${shown.close}`, `收于 $${shown.close}`]);
	const rows = (narrow: boolean): TapeRow[] =>
		LEGS.map((leg) => ({
			key: leg.key,
			cells: [
				t(legName(leg, narrow)),
				usd(legPrice(leg)),
				signedUsd(legCash(leg), 0),
				...(closed ? [signedUsd(legValueAt(leg, shown.close), 0)] : []),
			],
		}));
	const columns = (narrow: boolean) => {
		const leg = { label: t(["Leg", "腿"]), share: closed ? 0.41 : 0.44 };
		const price = {
			label: narrow ? t(["Price", "价格"]) : t(["Price a share", "每股价格"]),
			share: closed ? 0.16 : 0.24,
			align: "end" as const,
		};
		const entry = {
			label: narrow ? t(["Entry", "入场"]) : t(["At entry", "入场时"]),
			share: closed ? 0.21 : 0.32,
			align: "end" as const,
		};
		return closed
			? [
					leg,
					price,
					entry,
					{ label: atClose, share: 0.22, align: "end" as const },
				]
			: [leg, price, entry];
	};
	const entryCash = sum(LEGS.map(legCash));
	const result = resultAt(shown.close);
	const lines: string[] = closed
		? [
				`${sum([NET_CASH, legsAt(shown.close)])} = ${signedUsd(result, 0)}`,
				t([
					"credit at entry, plus the legs at expiry: the whole condor",
					"入场时的收入，加上到期时各腿的价值：整组铁鹰",
				]),
			]
		: shown.stage === 1
			? [
					`${entryCash} = ${signedUsd(NET_CASH, 0)}`,
					t([
						`one order, one net price: a ${share(CREDIT)} credit a share`,
						`一张订单，一个净价：每股净收入 ${share(CREDIT)}`,
					]),
				]
			: [
					entryCash,
					t([
						"per contract (×100 shares): sold legs bring cash in, bought legs cost it",
						"每张（×100 股）：卖出的腿收入现金，买入的腿支出现金",
					]),
				];
	const items: ResultItem[] =
		shown.stage === 0
			? [
					{
						id: "in",
						label: t(["Sold legs bring in", "卖出的腿收入"]),
						value: signedUsd(SOLD_CASH, 0),
					},
					{
						id: "out",
						label: t(["Bought legs cost", "买入的腿支出"]),
						value: signedUsd(BOUGHT_CASH, 0),
					},
				]
			: [
					{
						id: "net",
						label: t(["Net credit, one condor", "每组净收入"]),
						value: signedUsd(NET_CASH, 0),
						note: t([
							`${share(CREDIT)} a share × 100`,
							`每股 ${share(CREDIT)} × 100`,
						]),
						tone: "gain",
						evidence: "calculated",
					},
					{
						id: "worst",
						label: t(["Worst case at expiry", "到期最坏情况"]),
						value: signedUsd(WORST_CASH, 0),
						note: t([
							`${share(WIDTH)} width − ${share(CREDIT)}, a share`,
							`每股宽度 ${share(WIDTH)} − ${share(CREDIT)}`,
						]),
						tone: "loss",
						evidence: "calculated",
					},
					...(closed
						? [
								{
									id: "close",
									label: t([
										`Whole condor at ALFA $${shown.close}`,
										`ALFA 收于 $${shown.close} 时整组铁鹰`,
									]),
									value: signedUsd(result, 0),
									tone: signTone(result),
									evidence: "calculated" as const,
								},
							]
						: []),
				];
	const orderTitle = t([
		"Your order · ALFA Oct 18 iron condor",
		"你的订单 · ALFA 10月18日 铁鹰",
	]);
	/** The tape's height in a stage `width` wide: its title takes two lines on a phone. */
	const tapeBottom = (width: number) =>
		tapeHeight(4, tapeTitle(orderTitle, width - 16).length);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Your ALFA Oct 18 iron condor as one order: its four legs, the cash each brings in or costs, the net credit, and what each leg is worth at an Oct 18 close",
						"你的 ALFA 10月18日 铁鹰作为一张订单：四条腿、每条腿收入或支出的现金、净收入，以及 10月18日收盘时每条腿的价值",
					])}
					height={(width) => tapeBottom(width) + 18 + workingHeight(width, 2)}
				>
					{(width) => (
						<g>
							<TradeTape
								x={8}
								y={4}
								width={width - 16}
								title={orderTitle}
								columns={columns(width < 520)}
								rows={rows(width < 520)}
								maxRows={4}
								empty={t(["No legs", "没有腿"])}
							/>
							<Working
								x={14}
								y={tapeBottom(width) + 12}
								width={width - 28}
								lines={lines.map((text, i) => ({
									text,
									tone: i === 0 ? undefined : "small",
								}))}
							/>
						</g>
					)}
				</Stage>
			}
			result={items}
			controls={
				explore ? (
					<ChoiceField
						label={t(["ALFA on Oct 18", "10月18日 ALFA"])}
						value={String(explore.close)}
						options={CLOSES.map((close) => [String(close), `$${close}`])}
						onChange={(close) =>
							setExplore({ ...explore, close: Number(close) })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						`Each leg on its own looks like a different bet: a sold put, a bought call. None of them is your position. You decided on the condor once, entered it as one order at one net price, and what you hold is the sum: the ${signedUsd(NET_CASH, 0)} credit at entry plus what the four legs are worth at expiry. Judge it by that whole. Its best case is the credit, its worst case is one side's width minus the credit, ${signedUsd(WORST_CASH, 0)}, and in between the result depends on where ALFA closes.`,
						`单看每条腿，它们像是不同的押注：卖出一张看跌，买入一张看涨。但没有哪一条腿是你的持仓。你只做了一个决定：铁鹰，用一张订单、一个净价下达；你持有的是总和：入场时的 ${signedUsd(NET_CASH, 0)} 收入，加上四条腿到期时的价值。要按这个整体来评判。最好情况是这笔收入，最坏情况是一侧的宽度减去收入，即 ${signedUsd(WORST_CASH, 0)}；两者之间的结果取决于 ALFA 收在哪里。`,
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<StraddleState, StraddleState>({
		id: "straddle",
		label: ["Straddle", "跨式"],
		title: [
			"A straddle pays on a big move either way",
			"跨式在任一方向的大幅变动中获利",
		],
		predict: {
			prompt: [
				"You buy the Oct 18 100 call and the Oct 18 100 put at $4.20 each. Above $100, where does the pair break even at expiry?",
				"你以每股 $4.20 分别买入 10月18日 100 看涨和 10月18日 100 看跌。在 $100 以上，这一组到期的盈亏平衡点在哪里？",
			],
			choices: [
				{ id: "both", label: ["$108.40", "$108.40"] },
				{
					id: "one",
					label: ["$104.20: one premium", "$104.20：一份权利金"],
					why: [
						"$104.20 covers only the call's premium. You paid for the put too, so above $100 the call must recover $8.40.",
						"$104.20 只覆盖了看涨的权利金。你还为看跌付了钱，所以在 $100 以上看涨要收回 $8.40。",
					],
				},
				{
					id: "strike",
					label: ["$100: the strike", "$100：行权价"],
					why: [
						"At $100 both legs expire worthless and you lose the full $8.40. The pair needs a move of $8.40 either way.",
						"在 $100，两条腿都到期作废，你损失全部 $8.40。这一组需要向任一方向变动 $8.40。",
					],
				},
			],
			answer: "both",
			entry: { answer: STRADDLE_HIGH, tolerance: 0.01, prefix: "$" },
			revealAt: 3,
			explain: [
				"You paid $8.40 a share for the two legs, and above $100 only the call pays. It has to be worth $8.40, so ALFA must reach $108.40. Below, the put needs ALFA at $91.60.",
				"两条腿每股共付 $8.40，而在 $100 以上只有看涨赚钱。它必须值 $8.40，所以 ALFA 要到 $108.40。在下方，看跌需要 ALFA 跌到 $91.60。",
			],
		},
		beats: [
			{
				id: "call",
				label: ["The call", "看涨"],
				caption: [
					"The long Oct 18 100 call pays above $100: $1,000 at $110, nothing at $90.",
					"10月18日 100 看涨多头在 $100 以上赚钱：$110 时为 $1,000，$90 时为零。",
				],
				state: { stage: 0, spot: 110 },
			},
			{
				id: "put",
				label: ["The put", "看跌"],
				caption: [
					"The long Oct 18 100 put pays below $100: $1,000 at $90, nothing at $110.",
					"10月18日 100 看跌多头在 $100 以下赚钱：$90 时为 $1,000，$110 时为零。",
				],
				state: { stage: 1, spot: 110 },
			},
			{
				id: "sum",
				label: ["Together", "合起来"],
				caption: [
					"Together they pay in either direction: a V with its point at $100, where both expire worthless.",
					"合起来，无论朝哪个方向都能赚钱：一个 V 字，尖点在 $100，那里两者都到期作废。",
				],
				state: { stage: 2, spot: 110 },
			},
			{
				id: "profit",
				label: ["After the cost", "扣除成本"],
				caption: [
					"Subtract the $8.40 a share paid: break-even at $91.60 and $108.40. ALFA has to move more than $8.40 either way before the straddle makes money.",
					"减去每股已付的 $8.40：盈亏平衡点在 $91.60 和 $108.40。ALFA 要朝任一方向变动超过 $8.40，跨式才开始赚钱。",
				],
				state: { stage: 3, spot: 110 },
			},
		],
		explore: {
			prompt: [
				"Drag ALFA's expiry price and read the straddle's profit.",
				"拖动 ALFA 的到期价格，读出跨式的盈亏。",
			],
			start: () => ({ stage: 3, spot: 100 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the lowest whole-dollar price above $100 at which the straddle makes money.",
					"找出 $100 以上、跨式开始赚钱的最低整数美元价格。",
				],
				reached: (e) => e.spot === Math.ceil(STRADDLE_HIGH),
				done: [
					"At $109 the call is worth $9.00 a share against $8.40 paid: +$60. At $108 it's still −$40. The straddle needs a move bigger than its own price.",
					"$109 时看涨每股值 $9.00，对照已付的 $8.40：+$60。$108 时仍是 −$40。跨式需要的变动幅度要大于它自身的价格。",
				],
			},
		},
		View: StraddleView,
	}),
	defineScene<CondorState, CondorState>({
		id: "condor",
		label: ["Iron condor", "铁鹰"],
		title: [
			"An iron condor sells a range and caps the loss",
			"铁鹰卖出一个区间，并限制亏损",
		],
		predict: {
			prompt: [
				"You sell an iron condor for a $2.17 credit: short the 95 put and 105 call, long the 90 put and 110 call. What's the most it can lose per condor?",
				"你以 $2.17 的收入卖出一组铁鹰：卖出 95 看跌和 105 看涨，买入 90 看跌和 110 看涨。每组最多可能亏多少？",
			],
			choices: [
				{ id: "net", label: ["$283", "$283"] },
				{
					id: "width",
					label: ["$500: the width", "$500：价差宽度"],
					why: [
						"$500 is one side's width, but you keep the $217 credit whatever happens. The worst case is $500 − $217.",
						"$500 是一侧的宽度，但无论发生什么，你都保留 $217 的收入。最坏情况是 $500 − $217。",
					],
				},
				{
					id: "credit",
					label: ["$217: the credit", "$217：收入"],
					why: [
						"$217 is the most it can make, not lose. If ALFA ends beyond a long strike, one side costs $500, less the credit.",
						"$217 是它最多能赚的，而不是最多会亏的。如果 ALFA 收在买入的行权价之外，一侧要付 $500，再减去收入。",
					],
				},
			],
			answer: "net",
			entry: { answer: Math.round(MAX_LOSS * 100), tolerance: 1, prefix: "$" },
			revealAt: 2,
			explain: [
				"Each side is $5 wide, and only one side can finish in the money. That side costs $5.00 a share at worst, less the whole $2.17 credit: $2.83, or $283.",
				"每一侧宽 $5，而且到期时只有一侧会是实值。那一侧最多每股损失 $5.00，再减去全部 $2.17 的收入：$2.83，即 $283。",
			],
		},
		beats: [
			{
				id: "puts",
				label: ["Put spread", "看跌价差"],
				caption: [
					"Sell the 95 put at $2.05 and buy the 90 put at $1.00: a put spread for a $1.05 credit. Below $90 it can cost no more than $5.00 a share.",
					"以 $2.05 卖出 95 看跌，以 $1.00 买入 90 看跌：一个收入 $1.05 的看跌价差。低于 $90 时，每股最多需付 $5.00。",
				],
				state: { stage: 0, spot: 100 },
			},
			{
				id: "calls",
				label: ["Call spread", "看涨价差"],
				caption: [
					"Sell the 105 call at $2.05 and buy the 110 call at $0.93: a call spread for $1.12. Above $110 it costs at most $5.00.",
					"以 $2.05 卖出 105 看涨，以 $0.93 买入 110 看涨：一个收入 $1.12 的看涨价差。高于 $110 时，每股最多需付 $5.00。",
				],
				state: { stage: 1, spot: 100 },
			},
			{
				id: "together",
				label: ["Together", "合起来"],
				caption: [
					"Together: a $2.17 credit, kept in full anywhere from $95 to $105. Only one side can lose at expiry, so the worst case is $5.00 − $2.17 = $2.83 a share.",
					"合起来：收入 $2.17，ALFA 在 $95 到 $105 之间任何位置都能全部保留。到期时只有一侧可能亏损，所以最坏情况是每股 $5.00 − $2.17 = $2.83。",
				],
				state: { stage: 2, spot: 100 },
			},
			{
				id: "range",
				label: ["The range", "区间"],
				caption: [
					"Break-even at $92.83 and $107.17. The condor wins if ALFA stays inside, and loses up to $283 if it breaks out.",
					"盈亏平衡点在 $92.83 和 $107.17。ALFA 留在区间内，铁鹰就赢；突破出去，最多亏 $283。",
				],
				state: { stage: 3, spot: 100 },
			},
		],
		explore: {
			prompt: [
				"Drag ALFA's expiry price across the condor.",
				"拖动 ALFA 的到期价格，看铁鹰的变化。",
			],
			start: () => ({ stage: 3, spot: 100 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the highest price at which the condor still keeps its full credit.",
					"找出铁鹰仍能保留全部收入的最高价格。",
				],
				reached: (e) => e.spot === 105,
				done: [
					"Up to $105 every option you sold expires worthless and the $217 is yours. Each dollar above $105 costs $100, until the long 110 call stops it at −$283.",
					"在 $105 及以下，你卖出的期权全部到期作废，$217 归你。高于 $105 每多一美元损失 $100，直到 110 看涨多头在 −$283 处止住。",
				],
			},
		},
		View: CondorView,
	}),
	defineScene<OrderState, OrderState>({
		id: "package",
		label: ["One order", "一张订单"],
		title: [
			"Enter the condor as one order, judge the whole",
			"把铁鹰作为一张订单下达，按整体评判",
		],
		predict: {
			prompt: [
				`Your condor went in as one order for a ${signedUsd(NET_CASH, 0)} net credit. On Oct 18 ALFA closes at $${PUT_SIDE_CLOSE}. What does the whole condor make or lose?`,
				`你的铁鹰作为一张订单下达，净收入 ${signedUsd(NET_CASH, 0)}。10月18日 ALFA 收于 $${PUT_SIDE_CLOSE}。整组铁鹰赚或亏多少？`,
			],
			choices: [
				{
					id: "whole",
					label: [
						signedUsd(resultAt(PUT_SIDE_CLOSE), 0),
						signedUsd(resultAt(PUT_SIDE_CLOSE), 0),
					],
				},
				{
					id: "leg",
					label: [signedUsd(-PUT_SIDE_OWED, 0), signedUsd(-PUT_SIDE_OWED, 0)],
					why: [
						`${usd(PUT_SIDE_OWED, 0)} is only what the 95 put you sold owes at $${PUT_SIDE_CLOSE}. The ${usd(NET_CASH, 0)} came in when the order filled, so the whole condor is ${signedUsd(NET_CASH, 0)} − ${usd(PUT_SIDE_OWED, 0)} = ${signedUsd(resultAt(PUT_SIDE_CLOSE), 0)}.`,
						`${usd(PUT_SIDE_OWED, 0)} 只是你卖出的 95 看跌在 $${PUT_SIDE_CLOSE} 时要付的钱。${usd(NET_CASH, 0)} 在订单成交时就已收到，所以整组铁鹰是 ${signedUsd(NET_CASH, 0)} − ${usd(PUT_SIDE_OWED, 0)} = ${signedUsd(resultAt(PUT_SIDE_CLOSE), 0)}。`,
					],
				},
				{
					id: "credit",
					label: [signedUsd(NET_CASH, 0), signedUsd(NET_CASH, 0)],
					why: [
						`$${PUT_SIDE_CLOSE} is below the 95 put you sold, so that put is worth ${share(PUT_SIDE_OWED / 10_000)} a share against you. The credit is kept in full only between $95 and $105.`,
						`$${PUT_SIDE_CLOSE} 低于你卖出的 95 看跌的行权价，所以这张看跌每股有 ${share(PUT_SIDE_OWED / 10_000)} 的价值，要由你来付。只有在 $95 到 $105 之间，收入才能全部保留。`,
					],
				},
				{
					id: "worst",
					label: [signedUsd(WORST_CASH, 0), signedUsd(WORST_CASH, 0)],
					why: [
						`The worst case needs ALFA at $90 or below, where the 95 put owes the full ${usd(WIDTH * 10_000, 0)} and the 90 put stops the loss. At $${PUT_SIDE_CLOSE} it owes ${usd(PUT_SIDE_OWED, 0)}.`,
						`最坏情况要 ALFA 跌到 $90 或以下：那时 95 看跌要付满 ${usd(WIDTH * 10_000, 0)}，90 看跌把亏损止住。在 $${PUT_SIDE_CLOSE}，它只要付 ${usd(PUT_SIDE_OWED, 0)}。`,
					],
				},
			],
			answer: "whole",
			revealAt: 2,
			explain: [
				`The order brought in ${usd(NET_CASH, 0)}. At $${PUT_SIDE_CLOSE} only the 95 put you sold is in the money, worth ${usd(PUT_SIDE_OWED, 0)} a condor against you; the 90 put and both calls expire worthless. ${signedUsd(NET_CASH, 0)} − ${usd(PUT_SIDE_OWED, 0)} = ${signedUsd(resultAt(PUT_SIDE_CLOSE), 0)}.`,
				`这张订单收入 ${usd(NET_CASH, 0)}。在 $${PUT_SIDE_CLOSE}，只有你卖出的 95 看跌是实值，每组要由你付 ${usd(PUT_SIDE_OWED, 0)}；90 看跌和两张看涨都到期作废。${signedUsd(NET_CASH, 0)} − ${usd(PUT_SIDE_OWED, 0)} = ${signedUsd(resultAt(PUT_SIDE_CLOSE), 0)}。`,
			],
		},
		beats: [
			{
				id: "legs",
				label: ["Four legs", "四条腿"],
				caption: [
					`Your iron condor is one order with four legs, one contract each: ${LEGS.map((leg) => `${leg.side === "sell" ? "sell" : "buy"} the ${leg.contract.strike} ${leg.contract.right} at ${usd(legPrice(leg))} (${signedUsd(legCash(leg), 0)})`).join(", ")}.`,
					`你的铁鹰是一张有四条腿的订单，每条腿 1 张：${LEGS.map((leg) => `以 ${usd(legPrice(leg))} ${leg.side === "sell" ? "卖出" : "买入"} ${leg.contract.strike} ${leg.contract.right === "call" ? "看涨" : "看跌"}（${signedUsd(legCash(leg), 0)}）`).join("，")}。`,
				],
				state: { stage: 0, close: CLOSES[0] },
			},
			{
				id: "net",
				label: ["One net price", "一个净价"],
				caption: [
					`The legs add up to one number: ${signedUsd(NET_CASH, 0)}, a net credit of ${share(CREDIT)} a share. The order carries that one price, so the four legs fill together at ${share(CREDIT)} or better, or the order waits. The worst case at expiry is ${share(WIDTH)} − ${share(CREDIT)} = ${share(MAX_LOSS)} a share, ${signedUsd(WORST_CASH, 0)}.`,
					`四条腿加起来是一个数：${signedUsd(NET_CASH, 0)}，即每股净收入 ${share(CREDIT)}。订单只带这一个价格，四条腿一起按 ${share(CREDIT)} 或更优的价格成交，否则订单继续等。到期最坏情况是每股 ${share(WIDTH)} − ${share(CREDIT)} = ${share(MAX_LOSS)}，即 ${signedUsd(WORST_CASH, 0)}。`,
				],
				state: { stage: 1, close: CLOSES[0] },
			},
			{
				id: "close",
				label: [`At $${PUT_SIDE_CLOSE}`, `收于 $${PUT_SIDE_CLOSE}`],
				caption: [
					`Judge the whole, not the legs. At $${PUT_SIDE_CLOSE} the ${PUT_SIDE_LEG?.contract.strike} put you sold owes ${usd(PUT_SIDE_OWED, 0)} and the other three legs expire worthless: ${signedUsd(NET_CASH, 0)} − ${usd(PUT_SIDE_OWED, 0)} = ${signedUsd(resultAt(PUT_SIDE_CLOSE), 0)}.`,
					`要看整体，而不是单条腿。在 $${PUT_SIDE_CLOSE}，你卖出的 ${PUT_SIDE_LEG?.contract.strike} 看跌要付 ${usd(PUT_SIDE_OWED, 0)}，另外三条腿到期作废：${signedUsd(NET_CASH, 0)} − ${usd(PUT_SIDE_OWED, 0)} = ${signedUsd(resultAt(PUT_SIDE_CLOSE), 0)}。`,
				],
				state: { stage: 2, close: PUT_SIDE_CLOSE },
			},
		],
		explore: {
			prompt: [
				"Choose where ALFA closes on Oct 18 and read each leg and the whole condor.",
				"选择 ALFA 在 10月18日的收盘价，读出每条腿和整组铁鹰的结果。",
			],
			start: () => ({ stage: 2, close: CLOSES[0] }),
			task: {
				kind: "answer",
				prompt: [
					"At which close does the whole condor lose money, but less than its worst case?",
					"收盘价在哪里时，整组铁鹰亏钱，但亏得比最坏情况少？",
				],
				choices: CLOSES.map((close) => ({
					id: String(close),
					label: [`$${close}`, `$${close}`] as Copy,
				})),
				answer: String(CLOSES[1]),
				done: [
					`At $${CLOSES[1]} only the 105 call you sold is worth anything, ${usd(-legsAt(CLOSES[1]), 0)} against you: ${signedUsd(NET_CASH, 0)} − ${usd(-legsAt(CLOSES[1]), 0)} = ${signedUsd(resultAt(CLOSES[1]), 0)}. At $${CLOSES[0]} every leg expires worthless and the whole keeps ${signedUsd(resultAt(CLOSES[0]), 0)}. At $${CLOSES[2]} the 110 call you bought pays ${usd(legValueAt(LEGS[3], CLOSES[2]), 0)} back and stops the loss at ${signedUsd(resultAt(CLOSES[2]), 0)}, the worst case.`,
					`在 $${CLOSES[1]}，只有你卖出的 105 看涨还有价值，你要付 ${usd(-legsAt(CLOSES[1]), 0)}：${signedUsd(NET_CASH, 0)} − ${usd(-legsAt(CLOSES[1]), 0)} = ${signedUsd(resultAt(CLOSES[1]), 0)}。在 $${CLOSES[0]}，每条腿都到期作废，整组保留 ${signedUsd(resultAt(CLOSES[0]), 0)}。在 $${CLOSES[2]}，你买入的 110 看涨付回 ${usd(legValueAt(LEGS[3], CLOSES[2]), 0)}，把亏损止在 ${signedUsd(resultAt(CLOSES[2]), 0)}，即最坏情况。`,
				],
			},
		},
		View: OrderView,
	}),
] as const;

export function MultiLegStructuresWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="multi-leg-structures"
			label={[
				"Interactive lesson on straddles and condors, trades with no view on direction",
				"跨式与铁鹰互动课：不判断方向的交易",
			]}
			film={multiLegStructuresFilm}
			scenes={scenes}
		/>
	);
}
