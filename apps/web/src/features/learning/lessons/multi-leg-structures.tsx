import {
	type Contract,
	type Copy,
	count,
	optionQuote,
	pick,
	signedUsd,
	usd,
	valueAtExpiry,
} from "@/content/world";
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
} from "../walkthrough/instruments/trade-tape";
import { Label, Stage } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const oct18 = (strike: number, right: "call" | "put"): Contract => ({
	expiry: "oct18",
	strike,
	right,
});
/** Value at expiry in dollars a share. */
const worth = (contract: Contract, spot: number) =>
	valueAtExpiry(contract, Math.round(spot * 100)) / 100;
const RANGE = [80, 120] as const;
/** Dollars a share to whole dollars a contract: "+$375", "−$283". */
const perContract = (perShare: number) =>
	signedUsd(Math.round(perShare * 100) * 100, 0);
const share = (dollars: number) => usd(Math.round(dollars * 100));
/** Points along a payoff in dollars a contract, with a kink at every strike. */
const curve = (f: (spot: number) => number, strikes: readonly number[]) =>
	[RANGE[0], ...strikes, RANGE[1]].map(
		(spot) => [spot, f(spot) * 100] as const,
	);

// ——— Scene 1: a long straddle ———

type StraddleState = { stage: 0 | 1 | 2 | 3; spot: number };

const CALL_100 = oct18(100, "call");
const PUT_100 = oct18(100, "put");
/** Both legs bought at their asks, dollars a share. */
const STRADDLE_COST =
	(optionQuote(CALL_100).ask + optionQuote(PUT_100).ask) / 100;
const STRADDLE_LOW = 100 - STRADDLE_COST;
const STRADDLE_HIGH = 100 + STRADDLE_COST;
const straddle = (spot: number) => worth(CALL_100, spot) + worth(PUT_100, spot);

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
			points: curve((spot) => worth(CALL_100, spot), [100]),
			tone: shown.stage >= 2 ? "reference" : "long",
		},
	];
	if (shown.stage >= 1)
		lines.push({
			id: "put",
			label: t(["long 100 put", "100 看跌多头"]),
			points: curve((spot) => worth(PUT_100, spot), [100]),
			tone: shown.stage >= 2 ? "reference" : "long",
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
			tone: value >= 0 ? "gain" : "loss",
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
			tone: costed ? (value >= 0 ? "gain" : "loss") : undefined,
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
								`Buy the 100 call and the 100 put at ${share(STRADDLE_COST / 2)} each · per straddle`,
								`以每张 ${share(STRADDLE_COST / 2)} 买入 100 看涨和 100 看跌 · 每组跨式`,
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

const PUT_95 = oct18(95, "put");
const PUT_90 = oct18(90, "put");
const CALL_105 = oct18(105, "call");
const CALL_110 = oct18(110, "call");
/** Short legs at their bids, long wings at their asks, dollars a share. */
const PUT_CREDIT = (optionQuote(PUT_95).bid - optionQuote(PUT_90).ask) / 100;
const CALL_CREDIT =
	(optionQuote(CALL_105).bid - optionQuote(CALL_110).ask) / 100;
const CREDIT = PUT_CREDIT + CALL_CREDIT;
const WIDTH = 5;
const MAX_LOSS = WIDTH - CREDIT;
const putSpread = (spot: number) =>
	PUT_CREDIT - worth(PUT_95, spot) + worth(PUT_90, spot);
const callSpread = (spot: number) =>
	CALL_CREDIT - worth(CALL_105, spot) + worth(CALL_110, spot);
const condor = (spot: number) => putSpread(spot) + callSpread(spot);
const STRIKES = [90, 95, 105, 110] as const;

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
			tone: shown.stage >= 2 ? "reference" : "short",
		},
	];
	if (shown.stage >= 1)
		lines.push({
			id: "calls",
			label: t(["105/110 call spread", "105/110 看涨价差"]),
			shortLabel: t(["calls", "看涨"]),
			points: curve(callSpread, STRIKES),
			tone: shown.stage >= 2 ? "reference" : "short",
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
			tone: value >= 0 ? "gain" : "loss",
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
			tone: condor(shown.spot) >= 0 ? "gain" : "loss",
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
								`Short 95 put and 105 call, long 90 put and 110 call · ${share(CREDIT)} credit`,
								`卖出 95 看跌和 105 看涨，买入 90 看跌和 110 看涨 · 收入 ${share(CREDIT)}`,
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

// ——— Scene 3: four prints, one package ———

type PackageState = { view: "legs" | "tally" | "package" };

const SIZE = 200;
type Leg = {
	key: string;
	contract: Contract;
	side: "buy" | "sell";
	label: "bullish" | "bearish";
};
const LEGS: readonly Leg[] = [
	{ key: "a", contract: PUT_95, side: "sell", label: "bullish" },
	{ key: "b", contract: PUT_90, side: "buy", label: "bearish" },
	{ key: "c", contract: CALL_105, side: "sell", label: "bearish" },
	{ key: "d", contract: CALL_110, side: "buy", label: "bullish" },
];
const legPrice = (leg: Leg) =>
	leg.side === "buy"
		? optionQuote(leg.contract).ask
		: optionQuote(leg.contract).bid;
/** Premium of one leg's print, in cents. */
const legPremium = (leg: Leg) => legPrice(leg) * SIZE * 100;
const BULLISH = LEGS.filter((leg) => leg.label === "bullish").reduce(
	(sum, leg) => sum + legPremium(leg),
	0,
);
const BEARISH = LEGS.filter((leg) => leg.label === "bearish").reduce(
	(sum, leg) => sum + legPremium(leg),
	0,
);
const PACKAGE_CREDIT = Math.round(CREDIT * 100) * SIZE * 100;
const PACKAGE_RISK = Math.round(MAX_LOSS * 100) * SIZE * 100;

function PackageView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: PackageState;
	explore: PackageState | null;
	setExplore: (next: PackageState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const legName = (leg: Leg): string =>
		t([
			`${leg.side === "buy" ? "Bought" : "Sold"} ${leg.contract.strike} ${leg.contract.right}`,
			`${leg.side === "buy" ? "买入" : "卖出"} ${leg.contract.strike} ${leg.contract.right === "call" ? "看涨" : "看跌"}`,
		]);
	const rows: TapeRow[] = LEGS.map((leg) => ({
		key: leg.key,
		cells: [
			"11:20:04",
			legName(leg),
			count(SIZE),
			usd(legPrice(leg)),
			shown.view === "package"
				? t(["multi-leg", "多腿"])
				: leg.label === "bullish"
					? t(["bullish", "看涨"])
					: t(["bearish", "看跌"]),
		],
	}));
	const lines: string[] =
		shown.view === "legs"
			? [
					t([
						"Four prints in one second, each flagged multi-leg",
						"同一秒内四笔成交，每笔都带多腿标记",
					]),
					t([
						"labelled one by one: 2 bullish, 2 bearish",
						"逐笔贴标签：2 笔看涨，2 笔看跌",
					]),
				]
			: shown.view === "tally"
				? [
						t([
							`bullish premium ${usd(BULLISH, 0)} · bearish ${usd(BEARISH, 0)}`,
							`看涨权利金 ${usd(BULLISH, 0)} · 看跌 ${usd(BEARISH, 0)}`,
						]),
						t([
							`net ${signedUsd(BULLISH - BEARISH, 0)}: "slightly bearish"`,
							`净额 ${signedUsd(BULLISH - BEARISH, 0)}：“略偏看跌”`,
						]),
					]
				: [
						t([
							`one short iron condor × ${SIZE}: ${usd(PACKAGE_CREDIT, 0)} credit`,
							`一组铁鹰空头 × ${SIZE}：收入 ${usd(PACKAGE_CREDIT, 0)}`,
						]),
						t([
							`kept if ALFA stays $95–$105 · up to ${usd(PACKAGE_RISK, 0)} at risk`,
							`ALFA 留在 $95–$105 即全部保留 · 最多 ${usd(PACKAGE_RISK, 0)} 风险`,
						]),
					];
	const result: ResultItem[] =
		shown.view === "package"
			? [
					{
						id: "view",
						label: t(["The package", "整体"]),
						value: t(["ALFA stays in a range", "ALFA 留在区间内"]),
					},
					{
						id: "credit",
						label: t(["Credit collected", "收入"]),
						value: usd(PACKAGE_CREDIT, 0),
						note: t([
							`${share(CREDIT)} × 100 × ${SIZE}`,
							`${share(CREDIT)} × 100 × ${SIZE}`,
						]),
						tone: "gain",
						evidence: "calculated",
					},
					{
						id: "risk",
						label: t(["Most it can lose", "最大亏损"]),
						value: signedUsd(-PACKAGE_RISK, 0),
						tone: "loss",
						evidence: "calculated",
					},
				]
			: [
					{
						id: "labels",
						label: t(["Leg labels", "单腿标签"]),
						value: t(["2 bullish · 2 bearish", "2 看涨 · 2 看跌"]),
					},
					...(shown.view === "tally"
						? [
								{
									id: "net",
									label: t(["Premium by label, net", "按标签计的净权利金"]),
									value: signedUsd(BULLISH - BEARISH, 0),
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
						"Four ALFA Oct 18 option prints in the same second, read leg by leg and as one iron condor",
						"同一秒内四笔 ALFA 10月18日 期权成交，逐腿解读与作为一个铁鹰整体解读",
					])}
					height={(width) => tapeHeight(4) + (width < 520 ? 64 : 58)}
				>
					{(width) => (
						<g>
							<TradeTape
								x={8}
								y={4}
								width={width - 16}
								title={t([
									"Time and sales · ALFA Oct 18 options",
									"逐笔成交 · ALFA 10月18日 期权",
								])}
								columns={
									width < 520
										? [
												{ label: t(["Leg", "腿"]), share: 0.36 },
												{
													label: t(["Qty", "张数"]),
													share: 0.14,
													align: "end",
												},
												{
													label: t(["Price", "价格"]),
													share: 0.2,
													align: "end",
												},
												{
													label: t(["Label", "标签"]),
													share: 0.3,
													align: "end",
												},
											]
										: [
												{ label: t(["Time", "时间"]), share: 0.18 },
												{ label: t(["Leg", "腿"]), share: 0.3 },
												{ label: t(["Qty", "张数"]), share: 0.1, align: "end" },
												{
													label: t(["Price", "价格"]),
													share: 0.16,
													align: "end",
												},
												{
													label: t(["Label", "标签"]),
													share: 0.26,
													align: "end",
												},
											]
								}
								rows={
									width < 520
										? rows.map((row) => ({ ...row, cells: row.cells.slice(1) }))
										: rows
								}
								maxRows={4}
								empty={t(["No prints", "没有成交"])}
							/>
							{lines.map((text, i) => (
								<Label
									key={text}
									x={14}
									y={tapeHeight(4) + 26 + i * 20}
									maxWidth={width - 28}
									tone={i === 0 ? undefined : "small"}
								>
									{text}
								</Label>
							))}
						</g>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Read the prints", "解读成交"])}
						value={explore.view}
						options={[
							["legs", t(["Leg by leg", "逐腿"])],
							["tally", t(["Premium by label", "按标签计权利金"])],
							["package", t(["As one package", "作为整体"])],
						]}
						onChange={(view) => setExplore({ view })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A multi-leg order is priced and executed as one package, but the tape prints each leg separately. A feed that labels prints one at a time will call some legs bullish and others bearish, and adding premium by label can even produce a direction the trader never had. Prints in the same second with a multi-leg condition, matching sizes and strikes that fit a known structure are the clues to read them together; only linked-leg records prove it.",
						"多腿订单作为一个整体定价和执行，但逐笔成交会把每条腿分开打印。逐笔贴标签的数据会把一些腿标为看涨、另一些标为看跌，按标签加总权利金甚至会得出交易者从未有过的方向。同一秒内、带多腿条件、数量一致、行权价符合某种已知结构，这些都是把它们合起来解读的线索；只有关联腿记录才能证明。",
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
				"你以每张 $4.20 买入 10月18日 100 看涨和 10月18日 100 看跌。在 $100 以上，这一组到期的盈亏平衡点在哪里？",
			],
			choices: [
				{ id: "both", label: ["$108.40", "$108.40"] },
				{ id: "one", label: ["$104.20: one premium", "$104.20：一份权利金"] },
				{ id: "strike", label: ["$100: the strike", "$100：行权价"] },
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
				{ id: "width", label: ["$500: the width", "$500：价差宽度"] },
				{ id: "credit", label: ["$217: the credit", "$217：收入"] },
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
					"以 $2.05 卖出 95 看跌，以 $1.00 买入 90 看跌：一个收入 $1.05 的看跌价差。低于 $90 时，每股损失最多 $5.00。",
				],
				state: { stage: 0, spot: 100 },
			},
			{
				id: "calls",
				label: ["Call spread", "看涨价差"],
				caption: [
					"Sell the 105 call at $2.05 and buy the 110 call at $0.93: a call spread for $1.12. Above $110 it costs at most $5.00.",
					"以 $2.05 卖出 105 看涨，以 $0.93 买入 110 看涨：一个收入 $1.12 的看涨价差。高于 $110 时最多损失 $5.00。",
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
	defineScene<PackageState, PackageState>({
		id: "package",
		label: ["Four prints, one trade", "四笔成交，一笔交易"],
		title: [
			"Read a multi-leg trade as one package",
			"把多腿交易作为一个整体来读",
		],
		predict: {
			prompt: [
				"Four ALFA Oct 18 prints arrive in the same second, all flagged multi-leg, 200 contracts each: sold 95 puts, bought 90 puts, sold 105 calls, bought 110 calls. What's the trader's view?",
				"同一秒内出现四笔 ALFA 10月18日 成交，都带多腿标记，每笔 200 张：卖出 95 看跌、买入 90 看跌、卖出 105 看涨、买入 110 看涨。交易者的看法是什么？",
			],
			choices: [
				{
					id: "range",
					label: [
						"ALFA stays between about $95 and $105",
						"ALFA 大致留在 $95 到 $105 之间",
					],
				},
				{
					id: "bullish",
					label: ["Bullish: two legs are bullish", "看涨：有两条腿是看涨的"],
				},
				{
					id: "bearish",
					label: ["Slightly bearish, by premium", "按权利金算，略偏看跌"],
				},
			],
			answer: "range",
			revealAt: 2,
			explain: [
				"Together the four legs are the short iron condor from the last scene: $43,400 collected, kept in full if ALFA stays between $95 and $105. The leg labels cancel out and say nothing about that view.",
				"四条腿合起来就是上一个场景的铁鹰空头：收入 $43,400，ALFA 留在 $95 到 $105 之间就能全部保留。各腿的标签相互抵消，完全说明不了这个看法。",
			],
		},
		beats: [
			{
				id: "legs",
				label: ["Leg by leg", "逐腿"],
				caption: [
					"A feed that labels each print alone calls the sold 95 put and bought 110 call bullish, and the bought 90 put and sold 105 call bearish.",
					"逐笔贴标签的数据会把卖出的 95 看跌和买入的 110 看涨标为看涨，把买入的 90 看跌和卖出的 105 看涨标为看跌。",
				],
				state: { view: "legs" },
			},
			{
				id: "tally",
				label: ["By premium", "按权利金"],
				caption: [
					'Add premium by label and it\'s $59,600 bullish against $61,000 bearish: net −$1,400, "slightly bearish". A direction nobody chose.',
					"按标签加总权利金：看涨 $59,600，看跌 $61,000，净额 −$1,400，“略偏看跌”。一个没人选择过的方向。",
				],
				state: { view: "tally" },
			},
			{
				id: "package",
				label: ["One package", "整体"],
				caption: [
					"Read together, it's 200 short iron condors: $2.17 × 100 × 200 = $43,400 collected, kept if ALFA stays between $95 and $105, with up to $56,600 at risk.",
					"合起来读，这是 200 组铁鹰空头：$2.17 × 100 × 200 = $43,400 收入，ALFA 留在 $95 到 $105 之间就能保留，最多有 $56,600 的风险。",
				],
				state: { view: "package" },
			},
		],
		explore: {
			prompt: [
				"Switch between reading the prints leg by leg and as one package.",
				"在逐腿解读和整体解读之间切换。",
			],
			start: () => ({ view: "legs" }),
			task: {
				kind: "answer",
				prompt: [
					"Read leg by leg, what does the feed's premium tally say about this trade?",
					"如果逐腿解读，数据按权利金加总会怎么说这笔交易？",
				],
				choices: [
					{
						id: "bearish",
						label: ["Slightly bearish: −$1,400", "略偏看跌：−$1,400"],
					},
					{ id: "neutral", label: ["Neutral: $0", "中性：$0"] },
					{ id: "bullish", label: ["Bullish: +$43,400", "看涨：+$43,400"] },
				],
				answer: "bearish",
				done: [
					"The tally says −$1,400, a slight bearish lean, because the sold 105 calls and the bought 90 puts carry a little more premium. The trader's real view is a range, and the $43,400 credit only shows up when the legs are read as one package.",
					"加总结果是 −$1,400，略偏看跌，因为卖出的 105 看涨和买入的 90 看跌权利金稍多。交易者真正的看法是一个区间，而 $43,400 的收入只有把各腿作为整体来读时才会出现。",
				],
			},
		},
		View: PackageView,
	}),
] as const;

export function MultiLegStructuresWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="multi-leg-structures"
			label={[
				"Interactive lesson on straddles, condors and multi-leg prints",
				"跨式、铁鹰与多腿成交互动课",
			]}
			scenes={scenes}
		/>
	);
}
