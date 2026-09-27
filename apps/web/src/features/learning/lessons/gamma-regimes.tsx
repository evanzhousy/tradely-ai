import * as m from "motion/react-m";
import {
	ALFA,
	alfaStockBook,
	type Copy,
	count,
	daysToExpiry,
	modelVolatility,
	oct18OpenInterest,
	pick,
	priceOption,
	signedCount,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	type PayoffBand,
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { wrapText } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const SPOT = ALFA.open / 100;
const DAYS = daysToExpiry("oct18");
/** Model gamma to four places at a given ALFA price, as the GEX lesson rounded it. */
const gammaAt = (spot: number, strike: number) =>
	Math.round(
		priceOption({
			spot,
			strike,
			days: DAYS,
			iv: modelVolatility("oct18", strike),
			right: "call",
		}).gamma * 10_000,
	) / 10_000;

/**
 * The modeled book from the GEX lesson: dealers long every Oct 18 call and short every put.
 * Share-gamma is the change in its delta, in shares, for a $1 rise.
 */
const shareGamma = (spot: number) =>
	oct18OpenInterest.reduce(
		(sum, row) => sum + gammaAt(spot, row.strike) * (row.call - row.put) * 100,
		0,
	);
/** Net GEX in dollars per 1% move at a given spot. */
const netGex = (spot: number) => shareGamma(spot) * spot * spot * 0.01;

const money = (dollars: number) => {
	const sign = dollars < 0 ? "−" : dollars > 0 ? "+" : "";
	const size = Math.abs(dollars);
	return size >= 1_000_000
		? `${sign}$${(size / 1_000_000).toFixed(2)}M`
		: `${sign}$${Math.round(size / 1_000)}k`;
};
const stock = (dollars: number) =>
	usd(Math.round(dollars * 100), Number.isInteger(dollars) ? 0 : 2);
/** A modeled price level to one decimal: "$102.3". */
const level = (dollars: number) => `$${dollars.toFixed(1)}`;

/** The spot where the repriced book's gamma changes sign. */
const FLIP = (() => {
	let low = 95;
	let high = 110;
	for (let i = 0; i < 50; i++) {
		const mid = (low + high) / 2;
		if (shareGamma(mid) < 0) low = mid;
		else high = mid;
	}
	return Math.round(((low + high) / 2) * 10) / 10;
})();

// ——— Scene 1: the hedge response ———

type HedgeState = { spot: number; move: number; hedge: boolean };

function HedgeScene({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: HedgeState;
	explore: HedgeState | null;
	setExplore: (next: HedgeState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const g = Math.round(shareGamma(shown.spot));
	const bookChange = g * shown.move;
	const hedge = -bookChange;
	const short = g < 0;
	const lines: PayoffLine[] = [
		{
			id: "gamma",
			// The title names this line; its label would sit on the band labels.
			label: "",
			points: Array.from({ length: 45 }, (_, i) => {
				const spot = 90 + i * 0.5;
				return [spot, shareGamma(spot) / 1000] as const;
			}),
			tone: "position",
			dashed: true,
		},
	];
	const markers: PayoffMarker[] = [
		{
			id: "spot",
			x: shown.spot,
			y: g / 1000,
			label: t([`${signedCount(g)} per $1`, `每 $1 ${signedCount(g)}`]),
			tone: short ? "loss" : "gain",
		},
	];
	const bands: PayoffBand[] = [
		{
			id: "short",
			from: 90,
			to: FLIP,
			label: t(["short gamma", "负 Gamma"]),
			tone: "loss",
		},
		{
			id: "long",
			from: FLIP,
			to: 112,
			label: t(["long gamma", "正 Gamma"]),
			tone: "gain",
		},
	];
	const perDollar = (shares: number) =>
		t([
			`${signedCount(Math.round(shares))} per $1`,
			`每 $1 ${signedCount(Math.round(shares))}`,
		]);
	const result: ResultItem[] = [
		{
			id: "gamma",
			label: t([
				`Share-gamma at ${stock(shown.spot)}`,
				`${stock(shown.spot)} 时的股票 Gamma`,
			]),
			value: perDollar(g),
			tween: { to: g, format: perDollar },
			note: short
				? t(["short gamma", "负 Gamma"])
				: t(["long gamma", "正 Gamma"]),
			tone: short ? "loss" : "gain",
			evidence: "modeled",
		},
	];
	if (shown.hedge)
		result.push({
			id: "hedge",
			label: t([
				`If ALFA moves ${shown.move > 0 ? "+" : "−"}$${Math.abs(shown.move)}`,
				`若 ALFA 变动 ${shown.move > 0 ? "+" : "−"}$${Math.abs(shown.move)}`,
			]),
			value:
				hedge > 0
					? t([`hedge buys ${count(hedge)}`, `对冲买入 ${count(hedge)} 股`])
					: t([`hedge sells ${count(-hedge)}`, `对冲卖出 ${count(-hedge)} 股`]),
			note:
				hedge > 0 === shown.move > 0
					? t(["with the move", "顺着变动方向"])
					: t(["against the move", "逆着变动方向"]),
			evidence: "modeled",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The modeled book's share-gamma against ALFA's price: negative below about $102, positive above, with today's price marked",
						"模型账户的股票 Gamma 随 ALFA 价格变化：约 $102 以下为负，以上为正，并标出今天的价格",
					])}
					height={(width) => (width < 520 ? 260 : 290)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 290}
							xRange={[90, 112]}
							yRange={[-22, 18]}
							xTicks={[90, 95, 100, 105, 110]}
							yTicks={[-20, -10, 0, 10]}
							lines={lines}
							markers={markers}
							bands={bands}
							drag={
								explore
									? {
											markerId: "spot",
											min: 92,
											max: 110,
											step: 1,
											onChange: (spot) =>
												setExplore({ ...explore, spot, hedge: true }),
										}
									: undefined
							}
							formatY={(value) =>
								value === 0
									? "0"
									: `${value > 0 ? "+" : "−"}${Math.abs(value)}k`
							}
							xLabel={t(["ALFA price", "ALFA 价格"])}
							title={t([
								"Modeled Oct 18 book · shares of delta per $1",
								"模型化的 10月18日 账户 · 每 $1 的 Delta 股数",
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<>
						<RangeControl
							label={t(["ALFA price", "ALFA 价格"])}
							value={explore.spot}
							display={stock(explore.spot)}
							min={92}
							max={110}
							step={1}
							onChange={(spot) => setExplore({ ...explore, spot, hedge: true })}
						/>
						<ChoiceField
							label={t(["Move", "变动"])}
							value={explore.move > 0 ? "up" : "down"}
							options={[
								["up", "+$1"],
								["down", "−$1"],
							]}
							onChange={(value) =>
								setExplore({
									...explore,
									move: value === "up" ? 1 : -1,
									hedge: true,
								})
							}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						"Share-gamma is how many shares of delta a book gains for a $1 rise. A book that is short gamma loses delta as the stock rises, so a delta hedge buys into the rise and sells into the fall; a long-gamma book does the opposite. All of this is conditional: on the assumed positions (dealers long calls, short puts), on continuous hedging and on the model. It describes a hedge target, not anyone's trades.",
						"股票 Gamma 是股价每上涨 $1 时账户增加的 Delta 股数。负 Gamma 的账户在上涨时 Delta 减少，所以 Delta 对冲会在上涨中买入、在下跌中卖出；正 Gamma 的账户则相反。这一切都是有条件的：取决于假设的持仓（做市商做多看涨、做空看跌）、连续对冲以及模型。它描述的是对冲目标，而不是任何人的交易。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: reprice across spot ———

type FlipState = { stage: 0 | 1 | 2 };

/** The strike-chart shortcut: running sum of per-strike net GEX from the top strike down. */
const cumulativeByStrike = (() => {
	const rows = [...oct18OpenInterest].sort((a, b) => b.strike - a.strike);
	let running = 0;
	return rows
		.map((row) => {
			running +=
				gammaAt(SPOT, row.strike) *
				(row.call - row.put) *
				100 *
				SPOT *
				SPOT *
				0.01;
			return [row.strike, running / 1_000_000] as const;
		})
		.reverse();
})();
const SHORTCUT = (() => {
	for (let i = 0; i < cumulativeByStrike.length - 1; i++) {
		const [k1, v1] = cumulativeByStrike[i];
		const [k2, v2] = cumulativeByStrike[i + 1];
		if (v1 < 0 !== v2 < 0)
			return Math.round((k1 + ((0 - v1) / (v2 - v1)) * (k2 - k1)) * 10) / 10;
	}
	return null;
})();

function FlipView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: FlipState;
	explore: FlipState | null;
	setExplore: (next: FlipState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const lines: PayoffLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			id: "repriced",
			label: t(["repriced at each spot", "在每个现价重新定价"]),
			points: Array.from({ length: 45 }, (_, i) => {
				const spot = 90 + i * 0.5;
				return [spot, netGex(spot) / 1_000_000] as const;
			}),
			tone: "position",
			dashed: true,
		});
	if (shown.stage >= 2)
		lines.push({
			id: "shortcut",
			label: t(["running sum by strike", "按行权价累加"]),
			points: cumulativeByStrike.filter(([strike]) => strike <= 112),
			tone: "reference",
		});
	const markers: PayoffMarker[] = [
		{
			id: "today",
			x: SPOT,
			y: netGex(SPOT) / 1_000_000,
			label: money(netGex(SPOT)),
			tone: "loss",
		},
	];
	if (shown.stage >= 1)
		markers.push({
			id: "flip",
			x: FLIP,
			y: 0,
			label: t([`flip ${level(FLIP)}`, `转折 ${level(FLIP)}`]),
		});
	if (shown.stage >= 2 && SHORTCUT !== null)
		markers.push({ id: "shortcut", x: SHORTCUT, y: 0 });
	const result: ResultItem[] = [
		{
			id: "today",
			label: t([`Net GEX at ${stock(SPOT)}`, `${stock(SPOT)} 时的净 GEX`]),
			value: money(netGex(SPOT)),
			evidence: "modeled",
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "flip",
			label: t(["Modeled flip", "模型转折点"]),
			value: level(FLIP),
			note: t(["book repriced at each spot", "账户在每个现价重新定价"]),
			evidence: "modeled",
		});
	if (shown.stage >= 2 && SHORTCUT !== null)
		result.push({
			id: "shortcut",
			label: t(["Strike-sum crossing", "行权价累加的穿零点"]),
			value: level(SHORTCUT),
			note: t(["a different calculation", "另一种计算"]),
			tone: "loss",
			evidence: "calculated",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Net GEX of the modeled book repriced at each ALFA price, crossing zero near $102, beside a running sum of per-strike values that crosses elsewhere",
						"模型账户在每个 ALFA 价格重新定价的净 GEX，在约 $102 穿过零；旁边是按行权价累加的数值，它在别处穿零",
					])}
					height={(width) => (width < 520 ? 260 : 290)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 290}
							xRange={[90, 112]}
							yRange={[-2, 2.4]}
							xTicks={[90, 95, 100, 105, 110]}
							yTicks={[-1.5, 0, 1.5]}
							lines={lines}
							markers={markers}
							formatY={(value) =>
								value === 0 ? "0" : money(value * 1_000_000)
							}
							xLabel={t(["ALFA price", "ALFA 价格"])}
							title={t([
								"Modeled Oct 18 book · net GEX, $ per 1%",
								"模型化的 10月18日 账户 · 净 GEX，每 1% 美元",
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", t(["Today", "今天"])],
							["1", t(["+ Repriced", "+ 重新定价"])],
							["2", t(["+ Shortcut", "+ 捷径"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as FlipState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A zero-gamma flip is the price at which the book's total gamma, recomputed as if ALFA were trading there, changes sign. Every option's gamma moves with spot, so the whole book has to be repriced at each candidate price. Adding up per-strike values at today's price and seeing where the running sum crosses zero is a different calculation that lands somewhere else.",
						"零 Gamma 转折点是这样一个价格：假设 ALFA 在那里交易并重新计算后，账户的总 Gamma 改变符号。每个期权的 Gamma 都随现价变化，所以要在每个候选价格对整个账户重新定价。按今天的价格把各行权价的数值加起来、看累加和在哪里穿零，是另一种计算，得出的位置也不同。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: a hedge target is not an outcome ———

type EvidenceState = { stage: 0 | 1 | 2 };

const TARGET = Math.round(-shareGamma(SPOT));
const offered = alfaStockBook.asks.reduce((sum, level) => sum + level.size, 0);
const lastAsk = alfaStockBook.asks[alfaStockBook.asks.length - 1];

const evidence: readonly {
	id: string;
	title: Copy;
	value: Copy;
	lines: Copy;
}[] = [
	{
		id: "model",
		title: ["Model target", "模型目标"],
		value: [`buy ${count(TARGET)} shares`, `买入 ${count(TARGET)} 股`],
		lines: [
			"if ALFA rises $1, and only if dealers hold this book and hedge it continuously",
			"如果 ALFA 上涨 $1，而且只有在做市商持有这个账户并连续对冲时",
		],
	},
	{
		id: "tape",
		title: ["The tape", "成交记录"],
		value: ["prints, no names", "有成交，无身份"],
		lines: [
			"ALFA's stock prints show price, size and time, never who traded or why",
			"ALFA 股票的成交记录显示价格、数量和时间，从不显示谁交易、为什么交易",
		],
	},
	{
		id: "book",
		title: ["The book, 10:30", "10:30 的挂单簿"],
		value: [
			`${count(offered)} shares offered`,
			`卖方挂单 ${count(offered)} 股`,
		],
		lines: [
			`across three levels to ${stock(lastAsk.price / 100)}; what a ${count(TARGET)}-share order would move depends on depth that isn't displayed`,
			`分布在三个价位，最高到 ${stock(lastAsk.price / 100)}；一笔 ${count(TARGET)} 股的订单会推动多少价格，取决于未显示的深度`,
		],
	},
];

function evidenceLayout(width: number, locale: Locale) {
	let y = 26;
	const cards = evidence.map((card) => {
		const lines = wrapText(pick(card.lines, locale), width - 32, 12);
		const height = 52 + lines.length * 15 + 6;
		const block = { card, lines, y, height };
		y += height + 8;
		return block;
	});
	return { cards, height: y };
}

function EvidenceCards({
	width,
	state,
	locale,
}: {
	width: number;
	state: EvidenceState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const layout = evidenceLayout(width, locale);
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t(["Three kinds of evidence", "三种证据"])}
			</Label>
			{layout.cards.map((block, i) => (
				<m.g
					key={block.card.id}
					initial={false}
					animate={{ opacity: i <= state.stage ? 1 : 0.2 }}
					transition={motion.fade}
				>
					<rect
						x={4}
						y={block.y}
						width={width - 8}
						height={block.height}
						rx={10}
						className={i === state.stage ? "wt-focus-shape" : "wt-panel-shape"}
					/>
					<Label x={16} y={block.y + 20} tone="small">
						{t(block.card.title)}
					</Label>
					<Label x={16} y={block.y + 42} tone={i === 0 ? "accent" : undefined}>
						{t(block.card.value)}
					</Label>
					{block.lines.map((line, k) => (
						<text
							key={line}
							x={16}
							y={block.y + 62 + k * 15}
							style={{ fontSize: 12 }}
							className="wt-muted"
						>
							{line}
						</text>
					))}
				</m.g>
			))}
		</g>
	);
}

function EvidenceView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: EvidenceState;
	explore: EvidenceState | null;
	setExplore: (next: EvidenceState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		{
			id: "target",
			label: t(["Hedge target", "对冲目标"]),
			value: t([`+${count(TARGET)} shares`, `+${count(TARGET)} 股`]),
			note: t(["conditional, per +$1", "有条件，每 +$1"]),
			evidence: "modeled",
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "trades",
			label: t(["Hedge trades seen", "看到的对冲交易"]),
			value: t(["unknown", "未知"]),
			note: t(["the tape has no names", "成交记录没有身份"]),
			evidence: "unknown",
		});
	if (shown.stage >= 2)
		result.push({
			id: "depth",
			label: t(["Offered at 10:30", "10:30 卖方挂单"]),
			value: t([`${count(offered)} shares`, `${count(offered)} 股`]),
			note: t(["visible depth only", "只是可见深度"]),
			evidence: "observed",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Three evidence cards: the model's conditional hedge target, the stock tape without trader identities, and the displayed order book depth",
						"三张证据卡片：模型的有条件对冲目标、没有交易者身份的股票成交记录，以及显示的挂单深度",
					])}
					height={(width) => evidenceLayout(width, locale).height}
				>
					{(width) => (
						<EvidenceCards width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", t(["Model", "模型"])],
							["1", t(["+ Tape", "+ 成交"])],
							["2", t(["+ Book", "+ 挂单"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as EvidenceState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A regime label summarizes a modeled position; it isn't a record of trades or a forecast. To say hedging moved ALFA you would need the positions, the hedge trades and the liquidity they met, and each comes from a different source with its own clock. A 'gamma squeeze' story needs all three; the label alone supports none of it.",
						"状态标签概括的是一个模型化的持仓，而不是交易记录或预测。要说对冲推动了 ALFA，你需要持仓、对冲交易以及它们遇到的流动性，而每一样都来自不同的来源、有各自的时点。“Gamma 挤压”的故事三者都需要；单凭标签一样也支持不了。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const BOOK = Math.round(shareGamma(SPOT));
const ABOVE = 105;

const scenes = [
	defineScene<HedgeState, HedgeState>({
		id: "hedge",
		label: ["Test the hedge response", "测试对冲响应"],
		title: ["A regime changes the conditional response", "状态改变条件性响应"],
		predict: {
			prompt: [
				`Under this model the book is short gamma: ${signedCount(BOOK)} shares of delta per $1. ALFA rises $1. The hedge…`,
				`在这个模型下账户是负 Gamma：每 $1 ${signedCount(BOOK)} 股 Delta。ALFA 上涨 $1。对冲会……`,
			],
			choices: [
				{
					id: "buy",
					label: [
						`Buys about ${count(-BOOK)} shares`,
						`买入约 ${count(-BOOK)} 股`,
					],
				},
				{
					id: "sell",
					label: [
						`Sells about ${count(-BOOK)} shares`,
						`卖出约 ${count(-BOOK)} 股`,
					],
				},
				{ id: "none", label: ["Does nothing", "什么都不做"] },
			],
			answer: "buy",
			revealAt: 1,
			explain: [
				`The book's delta falls by ${count(-BOOK)} shares when ALFA rises $1, so staying neutral means buying ${count(-BOOK)}: with the move. That is the conditional short-gamma response.`,
				`ALFA 上涨 $1 时，账户的 Delta 减少 ${count(-BOOK)} 股，所以保持中性意味着买入 ${count(-BOOK)} 股：顺着变动方向。这就是负 Gamma 的条件性响应。`,
			],
		},
		beats: [
			{
				id: "today",
				label: ["Today", "今天"],
				caption: [
					`Reprice the modeled book at ${stock(SPOT)}: short gamma, ${signedCount(BOOK)} shares of delta per $1.`,
					`在 ${stock(SPOT)} 对模型账户重新定价：负 Gamma，每 $1 ${signedCount(BOOK)} 股 Delta。`,
				],
				state: { spot: SPOT, move: 1, hedge: false },
			},
			{
				id: "up",
				label: ["+$1", "+$1"],
				caption: [
					`ALFA rises $1: the book loses ${count(-BOOK)} shares of delta, so the hedge buys them, with the move.`,
					`ALFA 上涨 $1：账户失去 ${count(-BOOK)} 股 Delta，所以对冲买入这些股票，顺着变动方向。`,
				],
				state: { spot: SPOT, move: 1, hedge: true },
			},
			{
				id: "above",
				label: [stock(ABOVE), stock(ABOVE)],
				caption: [
					`Had ALFA been at ${stock(ABOVE)}, above the flip, the book would be long gamma: the hedge would sell ${count(Math.round(shareGamma(ABOVE)))} into a $1 rise, against the move.`,
					`如果 ALFA 在转折点之上的 ${stock(ABOVE)}，账户就是正 Gamma：上涨 $1 时对冲会卖出 ${count(Math.round(shareGamma(ABOVE)))} 股，逆着变动方向。`,
				],
				state: { spot: ABOVE, move: 1, hedge: true },
			},
		],
		explore: {
			prompt: [
				"Drag across the chart to move ALFA, and flip the direction of the move.",
				"在图上左右拖动来移动 ALFA，并切换变动方向。",
			],
			start: () => ({ spot: 98, move: -1, hedge: true }),
		},
		View: HedgeScene,
	}),
	defineScene<FlipState, FlipState>({
		id: "flip",
		label: ["Inspect a modeled flip", "检查模型转折"],
		title: [
			"Reprice across spot, not across strikes",
			"沿现价重定价，而非累加行权价",
		],
		predict: {
			prompt: [
				`At ${stock(SPOT)} the modeled book is short gamma. Where does it turn long?`,
				`在 ${stock(SPOT)}，模型账户是负 Gamma。它在哪里转为正 Gamma？`,
			],
			choices: [
				{
					id: "repriced",
					label: [
						`Near ${stock(Math.round(FLIP))}: reprice at each spot`,
						`约 ${stock(Math.round(FLIP))}：在每个现价重新定价`,
					],
				},
				{
					id: "shortcut",
					label: [
						`Near ${stock(Math.round(SHORTCUT ?? 92))}: where the strike sum crosses zero`,
						`约 ${stock(Math.round(SHORTCUT ?? 92))}：行权价累加穿零处`,
					],
				},
				{
					id: "wall",
					label: ["At $110: the biggest call strike", "$110：最大的看涨行权价"],
				},
			],
			answer: "repriced",
			revealAt: 1,
			explain: [
				`Recomputing the whole book at each price, net GEX crosses zero at ${level(FLIP)}. The running sum of today's per-strike values crosses near ${level(SHORTCUT ?? 0)}: a different calculation, not the flip.`,
				`在每个价格重新计算整个账户，净 GEX 在 ${level(FLIP)} 穿过零。按今天价格对各行权价数值累加，大约在 ${level(SHORTCUT ?? 0)} 穿零：这是另一种计算，不是转折点。`,
			],
		},
		beats: [
			{
				id: "today",
				label: ["Today", "今天"],
				caption: [
					`At ${stock(SPOT)} the modeled book's net GEX is ${money(netGex(SPOT))}.`,
					`在 ${stock(SPOT)}，模型账户的净 GEX 是 ${money(netGex(SPOT))}。`,
				],
				state: { stage: 0 },
			},
			{
				id: "repriced",
				label: ["Reprice", "重新定价"],
				caption: [
					`Recompute every option's gamma as if ALFA traded at each price: the total crosses zero at ${level(FLIP)}, the modeled flip.`,
					`假设 ALFA 在每个价格交易，重新计算每个期权的 Gamma：总量在 ${level(FLIP)} 穿过零，这就是模型转折点。`,
				],
				state: { stage: 1 },
			},
			{
				id: "shortcut",
				label: ["Shortcut", "捷径"],
				caption: [
					`A running sum of today's per-strike bars crosses zero near ${level(SHORTCUT ?? 0)} instead. It's a different number answering a different question.`,
					`把今天各行权价的柱子累加，穿零点却在 ${level(SHORTCUT ?? 0)} 附近。这是回答另一个问题的另一个数字。`,
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Compare the two calculations.", "比较两种计算。"],
			start: () => ({ stage: 2 }),
		},
		View: FlipView,
	}),
	defineScene<EvidenceState, EvidenceState>({
		id: "evidence",
		label: ["Open the evidence", "打开证据"],
		title: ["A hedge target is not a market outcome", "对冲目标不是市场结果"],
		predict: {
			prompt: [
				`The model says hedgers would buy about ${count(TARGET)} shares if ALFA rises $1. What does that tell you about ALFA's next move?`,
				`模型说如果 ALFA 上涨 $1，对冲者会买入约 ${count(TARGET)} 股。这能告诉你 ALFA 接下来会怎样吗？`,
			],
			choices: [
				{
					id: "nothing",
					label: [
						"Nothing by itself: it's a conditional target",
						"单凭它什么也说明不了：它是有条件的目标",
					],
				},
				{
					id: "squeeze",
					label: ["ALFA will squeeze higher", "ALFA 会被挤压上涨"],
				},
				{
					id: "bought",
					label: [
						`Dealers bought ${count(TARGET)} shares today`,
						`做市商今天买了 ${count(TARGET)} 股`,
					],
				},
			],
			answer: "nothing",
			revealAt: 1,
			explain: [
				"It holds only if dealers hold this book and hedge continuously, and even then the tape can't show who traded and the visible book can't show what the order would move.",
				"它只在做市商持有这个账户并连续对冲时成立；即便如此，成交记录也显示不出是谁交易的，可见的挂单也显示不出这笔订单会推动多少价格。",
			],
		},
		beats: [
			{
				id: "model",
				label: ["Model", "模型"],
				caption: [
					`The model's target: buy ${count(TARGET)} shares on a $1 rise, if its assumptions hold.`,
					`模型的目标：上涨 $1 时买入 ${count(TARGET)} 股，前提是它的假设成立。`,
				],
				state: { stage: 0 },
			},
			{
				id: "tape",
				label: ["Tape", "成交记录"],
				caption: [
					"The stock tape shows prints but never who traded or why. It can't confirm a single hedge trade.",
					"股票成交记录显示成交，但从不显示谁交易、为什么交易。它无法证实任何一笔对冲交易。",
				],
				state: { stage: 1 },
			},
			{
				id: "book",
				label: ["Book", "挂单簿"],
				caption: [
					`At 10:30 only ${count(offered)} shares were offered across three levels. What ${count(TARGET)} shares would move depends on liquidity no chart shows.`,
					`10:30 时三个价位合计只挂出 ${count(offered)} 股。${count(TARGET)} 股会推动多少价格，取决于图表上看不到的流动性。`,
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Step through the evidence.", "逐步查看证据。"],
			start: () => ({ stage: 2 }),
		},
		View: EvidenceView,
	}),
] as const;

export function GammaRegimesWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="gamma-regimes"
			label={["Interactive lesson on gamma regimes", "Gamma 状态互动课"]}
			scenes={scenes}
		/>
	);
}
