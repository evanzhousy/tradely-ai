import {
	ALFA,
	type Copy,
	daysToExpiry,
	type ExpiryId,
	expiries,
	modelVolatility,
	pick,
	priceOption,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import {
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import {
	type GridRow,
	StrikeGrid,
	strikeGridHeight,
} from "../walkthrough/instruments/strike-grid";
import { Stage } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const SPOT = ALFA.open / 100;
const STRIKES = [90, 95, 100, 105, 110] as const;
const EXPIRIES: readonly ExpiryId[] = [
	"sep20",
	"sep27",
	"oct4",
	"oct18",
	"nov15",
	"dec20",
];
/** Implied volatility in whole vol points, as the grid shows it. */
const ivPoints = (expiry: ExpiryId, strike: number) =>
	Math.round(modelVolatility(expiry, strike) * 100);

const rows = (
	locale: Locale,
	missing: readonly { row: ExpiryId; strike: number }[] = [],
): GridRow[] =>
	EXPIRIES.map((expiry) => ({
		id: expiry,
		label: pick(expiries[expiry].label, locale),
		values: STRIKES.map((strike) =>
			missing.some((cell) => cell.row === expiry && cell.strike === strike)
				? null
				: ivPoints(expiry, strike),
		),
	}));

const gridHeight = strikeGridHeight(EXPIRIES.length, false);
const percentFormat = (value: number) => `${value}%`;

// ——— Scene 1: two directions ———

type Slice = "none" | "smile" | "term";
type SliceState = { slice: Slice };

function SliceView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SliceState;
	explore: SliceState | null;
	setExplore: (next: SliceState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const smile = STRIKES.map((strike) => ivPoints("oct18", strike));
	const term = EXPIRIES.map((expiry) => ivPoints(expiry, 100));
	const result: ResultItem[] =
		shown.slice === "smile"
			? [
					{
						id: "smile",
						label: t(["Oct 18, across strikes", "10月18日，按行权价"]),
						value: `${smile[0]}% → ${smile[smile.length - 1]}%`,
						note: t([
							"$90 to $110: lower strikes richer",
							"$90 到 $110：低行权价更贵",
						]),
						evidence: "modeled",
					},
				]
			: shown.slice === "term"
				? [
						{
							id: "term",
							label: t(["$100 strike, by expiry", "$100 行权价，按到期日"]),
							value: term.map((value) => `${value}`).join(" · "),
							note: t([
								"Sep 20 to Dec 20, in %",
								"9月20日 到 12月20日，单位 %",
							]),
							evidence: "modeled",
						},
					]
				: [
						{
							id: "cells",
							label: t(["Grid", "网格"]),
							value: t([
								`${EXPIRIES.length} expiries × ${STRIKES.length} strikes`,
								`${EXPIRIES.length} 个到期日 × ${STRIKES.length} 个行权价`,
							]),
							note: t(["implied volatility, model", "隐含波动率（模型）"]),
							evidence: "modeled",
						},
					];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"ALFA implied volatility by strike across and expiry down, with one expiry's row or one strike's column outlined",
						"ALFA 隐含波动率网格：横向为行权价，纵向为到期日，并框出一个到期日的行或一个行权价的列",
					])}
					height={gridHeight}
				>
					{(width) => (
						<StrikeGrid
							width={width}
							strikes={STRIKES}
							rows={rows(locale)}
							min={27}
							max={38}
							format={percentFormat}
							focusRows={shown.slice === "smile" ? ["oct18"] : []}
							focusStrikes={shown.slice === "term" ? [100] : []}
							title={t([
								"ALFA implied volatility · Mon Sep 16",
								"ALFA 隐含波动率 · 9月16日周一",
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Slice", "切片"])}
						value={explore.slice}
						options={[
							["none", t(["Whole grid", "整个网格"])],
							["smile", t(["Oct 18 row", "10月18日 行"])],
							["term", t(["$100 column", "$100 列"])],
						]}
						onChange={(slice) => setExplore({ slice })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A volatility surface is implied volatility by strike and by expiry. Read across one expiry and you get its smile or skew; read down one strike, or a standardized at-the-money reference, and you get the term structure. ALFA's lower strikes are richer, and the October expiries that span its earnings sit above the rest.",
						"波动率曲面是按行权价和到期日排列的隐含波动率。横着读一个到期日，得到它的微笑或偏斜；竖着读一个行权价（或标准化的平值参考），得到期限结构。ALFA 的低行权价更贵，而跨越财报的十月到期日高于其他到期日。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: wings by delta, with a stated sign ———

type WingState = { stage: 0 | 1 | 2 };

const OCT18_DAYS = daysToExpiry("oct18");
const deltaAt = (strike: number, right: "call" | "put") =>
	priceOption({
		spot: SPOT,
		strike,
		days: OCT18_DAYS,
		iv: modelVolatility("oct18", strike),
		right,
	}).delta;
/** The strike whose delta is `target`, found by bisection: delta falls as strike rises. */
function strikeForDelta(right: "call" | "put", target: number) {
	let low = 60;
	let high = 140;
	for (let i = 0; i < 60; i++) {
		const mid = (low + high) / 2;
		if (deltaAt(mid, right) > target) low = mid;
		else high = mid;
	}
	return (low + high) / 2;
}
const round1 = (value: number) => Math.round(value * 10) / 10;
const CALL_WING = strikeForDelta("call", 0.25);
const PUT_WING = strikeForDelta("put", -0.25);
const CALL_IV = round1(modelVolatility("oct18", CALL_WING) * 100);
const PUT_IV = round1(modelVolatility("oct18", PUT_WING) * 100);
const ATM_IV = round1(modelVolatility("oct18", 100) * 100);
const SKEW = round1(PUT_IV - CALL_IV);
const signedPoints = (value: number) =>
	`${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(1)}`;

function WingsView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: WingState;
	explore: WingState | null;
	setExplore: (next: WingState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const lines: PayoffLine[] = [
		{
			id: "smile",
			label: t(["Oct 18 IV, model", "10月18日 IV（模型）"]),
			points: Array.from({ length: 25 }, (_, i) => {
				const strike = 88 + i;
				return [strike, modelVolatility("oct18", strike) * 100] as const;
			}),
			tone: "position",
			dashed: true,
		},
	];
	const markers: PayoffMarker[] = [
		{
			id: "atm",
			x: 100,
			y: ATM_IV,
			label: t([`ATM ${ATM_IV}%`, `平值 ${ATM_IV}%`]),
		},
		...(shown.stage >= 1
			? [
					{
						id: "put",
						x: PUT_WING,
						y: PUT_IV,
						label: t([`25Δ put ${PUT_IV}%`, `25Δ 看跌 ${PUT_IV}%`]),
						tone: "loss" as const,
					},
					{
						id: "call",
						x: CALL_WING,
						y: CALL_IV,
						label: t([`25Δ call ${CALL_IV}%`, `25Δ 看涨 ${CALL_IV}%`]),
						tone: "gain" as const,
					},
				]
			: []),
	];
	const result: ResultItem[] = [
		{
			id: "atm",
			label: t(["At the money, $100", "平值，$100"]),
			value: `${ATM_IV}%`,
			evidence: "modeled",
		},
	];
	if (shown.stage >= 1)
		result.push(
			{
				id: "put",
				label: t([
					`25Δ put · strike $${PUT_WING.toFixed(2)}`,
					`25Δ 看跌 · 行权价 $${PUT_WING.toFixed(2)}`,
				]),
				value: `${PUT_IV}%`,
				evidence: "modeled",
			},
			{
				id: "call",
				label: t([
					`25Δ call · strike $${CALL_WING.toFixed(2)}`,
					`25Δ 看涨 · 行权价 $${CALL_WING.toFixed(2)}`,
				]),
				value: `${CALL_IV}%`,
				evidence: "modeled",
			},
		);
	if (shown.stage >= 2)
		result.push(
			{
				id: "skew",
				label: t(["Skew, put − call", "偏斜，看跌 − 看涨"]),
				value: t([`${signedPoints(SKEW)} points`, `${signedPoints(SKEW)} 点`]),
				evidence: "calculated",
			},
			{
				id: "rr",
				label: t(["Risk reversal, call − put", "风险逆转，看涨 − 看跌"]),
				value: t([
					`${signedPoints(-SKEW)} points`,
					`${signedPoints(-SKEW)} 点`,
				]),
				note: t(["same wings, other sign", "同样的两翼，符号相反"]),
				evidence: "calculated",
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The Oct 18 volatility smile against strike, with the at-the-money point and the 25-delta put and call wings marked",
						"10月18日 波动率微笑随行权价变化，标出平值点以及 25 Delta 的看跌和看涨两翼",
					])}
					height={(width) => (width < 520 ? 260 : 290)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 290}
							xRange={[88, 112]}
							yRange={[31, 39]}
							xTicks={[90, 95, 100, 105, 110]}
							yTicks={[32, 34, 36, 38]}
							lines={lines}
							markers={markers}
							formatY={(value) => `${value}%`}
							xLabel={t(["strike", "行权价"])}
							title={t([
								`ALFA Oct 18 · IV by strike · ${OCT18_DAYS} days`,
								`ALFA 10月18日 · 各行权价 IV · ${OCT18_DAYS} 天`,
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
							["0", t(["ATM", "平值"])],
							["1", t(["+ Wings", "+ 两翼"])],
							["2", t(["+ Signs", "+ 符号"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as WingState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Wings are usually picked by delta, not by dollars from spot: the 25-delta put and call are the strikes whose model delta is −0.25 and +0.25, so they depend on the model, the expiry and the volatility itself. Then state the sign. Skew as put minus call and risk reversal as call minus put use the same two numbers with opposite signs. A butterfly compares the wings' average with the at-the-money level; for this straight-line model smile it is close to zero.",
						"两翼通常按 Delta 选取，而不是按离现价多少美元：25 Delta 看跌和看涨是模型 Delta 为 −0.25 和 +0.25 的行权价，所以它们取决于模型、到期日和波动率本身。然后说明符号。以看跌减看涨表示的偏斜和以看涨减看跌表示的风险逆转，用的是同样两个数字，符号相反。蝶式把两翼的平均与平值水平比较；对这个直线形的模型微笑来说，它接近零。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: estimates are not quotes ———

type EstimateState = { stage: 0 | 1 | 2 };

/** No IV where there was no usable price: the 4-day wings had no bid, Dec 20 105 no quote. */
const MISSING: readonly { row: ExpiryId; strike: number }[] = [
	{ row: "sep20", strike: 90 },
	{ row: "sep20", strike: 110 },
	{ row: "dec20", strike: 105 },
];
const INTERPOLATED = Math.round(
	(ivPoints("dec20", 100) + ivPoints("dec20", 110)) / 2,
);

function EstimatesView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: EstimateState;
	explore: EstimateState | null;
	setExplore: (next: EstimateState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const gridRows = rows(locale, MISSING).map((row) =>
		row.id === "dec20" && shown.stage >= 1
			? {
					...row,
					values: row.values.map((value, j) =>
						STRIKES[j] === 105 ? INTERPOLATED : value,
					),
				}
			: row,
	);
	const result: ResultItem[] = [
		{
			id: "missing",
			label: t(["Cells without a price", "没有价格的单元格"]),
			value: String(MISSING.length),
			note: t(["no IV to fit there", "那里没有可拟合的 IV"]),
			evidence: "unknown",
		},
	];
	if (shown.stage >= 1)
		result.push({
			id: "dec20",
			label: t(["Dec 20 · $105", "12月20日 · $105"]),
			value: `≈${INTERPOLATED}%`,
			note: t([
				`between ${ivPoints("dec20", 100)}% and ${ivPoints("dec20", 110)}%, interpolated`,
				`介于 ${ivPoints("dec20", 100)}% 与 ${ivPoints("dec20", 110)}% 之间，插值`,
			]),
			evidence: "modeled",
		});
	if (shown.stage >= 2)
		result.push({
			id: "edges",
			label: t(["Sep 20 · $90 and $110", "9月20日 · $90 与 $110"]),
			value: t(["left blank", "留空"]),
			note: t(["outside every quote: extrapolation", "在所有报价之外：外推"]),
			evidence: "unknown",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The implied volatility grid with three cells that had no usable price: one interior cell filled with a marked interpolation, two edge cells left blank",
						"隐含波动率网格中有三个单元格没有可用价格：一个内部单元格用标明的插值填充，两个边缘单元格留空",
					])}
					height={gridHeight}
				>
					{(width) => (
						<StrikeGrid
							width={width}
							strikes={STRIKES}
							rows={gridRows}
							min={27}
							max={38}
							format={percentFormat}
							estimated={
								shown.stage >= 1 ? [{ row: "dec20", strike: 105 }] : []
							}
							focusCell={
								shown.stage === 1
									? { row: "dec20", strike: 105 }
									: shown.stage === 2
										? { row: "sep20", strike: 90 }
										: undefined
							}
							title={t([
								"ALFA implied volatility · from quotes",
								"ALFA 隐含波动率 · 来自报价",
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
							["0", t(["Quotes only", "仅报价"])],
							["1", t(["+ Interpolation", "+ 插值"])],
							["2", t(["+ Edges", "+ 边缘"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as EstimateState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A surface built from quotes has holes: strikes with no bid, expiries with no quote that morning. Between two supported cells an interpolated value is a reasonable estimate if it is marked as one. Beyond the last quote, extrapolation invents the shape; leave those cells blank. A smooth, fully filled surface can hide exactly the evidence you'd want to check.",
						"由报价构建的曲面会有空洞：有的行权价没有买价，有的到期日那天早上没有报价。在两个有支持的单元格之间，插值是合理的估计，但要标明是估计。超出最后一个报价之外，外推是在编造形状；那些单元格应当留空。一个平滑、填满的曲面，可能正好掩盖了你想核查的证据。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const term = EXPIRIES.map((expiry) => ivPoints(expiry, 100));

const scenes = [
	defineScene<SliceState, SliceState>({
		id: "slice",
		label: ["Slice the grid", "切片网格"],
		title: ["A surface has more than one direction", "曲面不止一个方向"],
		predict: {
			prompt: [
				"Read the $100 strike down the expiries. Why do the October expiries sit highest?",
				"沿到期日往下读 $100 行权价。为什么十月的几个到期日最高？",
			],
			choices: [
				{
					id: "earnings",
					label: ["They span ALFA's earnings", "它们跨越了 ALFA 的财报"],
				},
				{
					id: "longer",
					label: [
						"Longer expiries always carry more IV",
						"到期越长 IV 总是越高",
					],
				},
				{ id: "error", label: ["A quote error", "报价错误"] },
			],
			answer: "earnings",
			revealAt: 2,
			explain: [
				`At $100 it runs ${term.join("%, ")}%: up into October, then down for Nov 15 and Dec 20. Earnings on Oct 3 sit inside the Oct 4 to Oct 18 expiries, and longer ones spread that event over more days.`,
				`$100 处依次为 ${term.join("%、")}%：到十月走高，再在 11月15日 和 12月20日 回落。10月3日 的财报落在 10月4日 到 10月18日 的到期日内，更长的到期日则把这一事件摊到更多天里。`,
			],
		},
		beats: [
			{
				id: "grid",
				label: ["The grid", "网格"],
				caption: [
					"ALFA's implied volatility by strike across and expiry down: one number per contract pair, not one number for the stock.",
					"ALFA 的隐含波动率网格：横向是行权价，纵向是到期日；每一格一个数，而不是整只股票一个数。",
				],
				state: { slice: "none" },
			},
			{
				id: "smile",
				label: ["A smile", "微笑"],
				caption: [
					`Across the Oct 18 row IV falls from ${ivPoints("oct18", 90)}% at $90 to ${ivPoints("oct18", 110)}% at $110: the lower strikes are richer. That slice is the skew.`,
					`沿 10月18日 这一行，IV 从 $90 的 ${ivPoints("oct18", 90)}% 降到 $110 的 ${ivPoints("oct18", 110)}%：低行权价更贵。这个切片就是偏斜。`,
				],
				state: { slice: "smile" },
			},
			{
				id: "term",
				label: ["Term structure", "期限结构"],
				caption: [
					`Down the $100 column it rises into October and falls after: ${term.join(" → ")}. That slice is the term structure.`,
					`沿 $100 这一列，它到十月走高，之后回落：${term.join(" → ")}。这个切片就是期限结构。`,
				],
				state: { slice: "term" },
			},
		],
		explore: {
			prompt: ["Switch between the slices.", "在切片之间切换。"],
			start: () => ({ slice: "smile" }),
			task: {
				kind: "answer",
				prompt: [
					"Look along the Oct 18 row. Which strike carries the highest IV?",
					"沿着 10月18日 这一行看。哪个行权价的隐含波动率最高？",
				],
				choices: [
					{ id: "low", label: ["$90", "$90"] },
					{ id: "atm", label: ["$100", "$100"] },
					{ id: "high", label: ["$110", "$110"] },
				],
				answer: "low",
				done: [
					"IV falls from the $90 strike to the $110: lower strikes are richer. That tilt across one expiry is the skew; the column down one strike is the term structure.",
					"隐含波动率从 $90 行权价到 $110 逐渐下降：较低行权价更贵。同一到期日上的这种倾斜就是偏斜；同一行权价沿到期日向下就是期限结构。",
				],
			},
		},
		View: SliceView,
	}),
	defineScene<WingState, WingState>({
		id: "wings",
		label: ["Compare the wings", "比较两翼"],
		title: [
			"State the wing convention before calculating",
			"计算前说明两翼约定",
		],
		predict: {
			prompt: [
				`The Oct 18 25Δ put's IV is ${PUT_IV}% and the 25Δ call's ${CALL_IV}%. A dashboard quotes the risk reversal as call minus put. What does it show?`,
				`10月18日 25Δ 看跌的 IV 为 ${PUT_IV}%，25Δ 看涨为 ${CALL_IV}%。某面板把风险逆转报为看涨减看跌。它显示多少？`,
			],
			choices: [
				{
					id: "negative",
					label: [`${signedPoints(-SKEW)} points`, `${signedPoints(-SKEW)} 点`],
				},
				{
					id: "positive",
					label: [`${signedPoints(SKEW)} points`, `${signedPoints(SKEW)} 点`],
				},
				{
					id: "ratio",
					label: [
						`${Math.round((PUT_IV / CALL_IV - 1) * 100)}%`,
						`${Math.round((PUT_IV / CALL_IV - 1) * 100)}%`,
					],
				},
			],
			answer: "negative",
			entry: { answer: -SKEW, tolerance: 0.15, unit: [" points", " 点"] },
			revealAt: 2,
			explain: [
				`${CALL_IV} − ${PUT_IV} = ${signedPoints(-SKEW)} vol points. The same wings read as skew, put minus call, give ${signedPoints(SKEW)}; a ratio is a different quantity again.`,
				`${CALL_IV} − ${PUT_IV} = ${signedPoints(-SKEW)} 个波动率点。同样两翼按偏斜（看跌减看涨）读，是 ${signedPoints(SKEW)}；比率则又是另一种量。`,
			],
		},
		beats: [
			{
				id: "atm",
				label: ["At the money", "平值"],
				caption: [
					`The Oct 18 smile: ${ATM_IV}% at the $100 strike, higher below, lower above.`,
					`10月18日 的微笑：$100 行权价处为 ${ATM_IV}%，下方更高，上方更低。`,
				],
				state: { stage: 0 },
			},
			{
				id: "wings",
				label: ["25Δ wings", "25Δ 两翼"],
				caption: [
					`Pick the wings by delta: the 25Δ put is the $${PUT_WING.toFixed(2)} strike at ${PUT_IV}%, the 25Δ call the $${CALL_WING.toFixed(2)} strike at ${CALL_IV}%. Not the same distance from $100.`,
					`按 Delta 选取两翼：25Δ 看跌是 $${PUT_WING.toFixed(2)} 行权价，${PUT_IV}%；25Δ 看涨是 $${CALL_WING.toFixed(2)} 行权价，${CALL_IV}%。它们离 $100 的距离并不相同。`,
				],
				state: { stage: 1 },
			},
			{
				id: "signs",
				label: ["Signs", "符号"],
				caption: [
					`Skew as put minus call is ${signedPoints(SKEW)} points; the risk reversal, call minus put, is ${signedPoints(-SKEW)}. Same wings: say which one you mean.`,
					`以看跌减看涨表示的偏斜是 ${signedPoints(SKEW)} 点；风险逆转（看涨减看跌）是 ${signedPoints(-SKEW)} 点。同样的两翼：要说明你指的是哪一个。`,
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Step through the wings.", "逐步查看两翼。"],
			start: () => ({ stage: 2 }),
			task: {
				kind: "answer",
				prompt: [
					"Why aren't the two 25Δ wings the same distance from $100?",
					"为什么两个 25Δ 的翼与 $100 的距离不一样？",
				],
				choices: [
					{
						id: "delta",
						label: [
							"Wings are picked by delta, not by dollars",
							"翼按 Delta 选取，而不是按美元距离",
						],
					},
					{
						id: "error",
						label: ["A quote error on one side", "某一侧的报价有误"],
					},
					{
						id: "cheap",
						label: ["Puts are cheaper than calls", "看跌比看涨便宜"],
					},
				],
				answer: "delta",
				done: [
					`The 25Δ put sits at $${PUT_WING.toFixed(2)} and the 25Δ call at $${CALL_WING.toFixed(2)}: each is where that option's delta is 0.25 in size, and skew shapes where that falls. State the convention before comparing.`,
					`25Δ 看跌在 $${PUT_WING.toFixed(2)}，25Δ 看涨在 $${CALL_WING.toFixed(2)}：各自是该期权 Delta 绝对值为 0.25 的位置，偏斜决定了它们落在哪里。比较之前先说明约定。`,
				],
			},
		},
		View: WingsView,
	}),
	defineScene<EstimateState, EstimateState>({
		id: "estimates",
		label: ["Inspect estimates", "检查估计"],
		title: ["Don't smooth away the missing evidence", "不要用平滑掩盖缺失证据"],
		predict: {
			prompt: [
				"The Dec 20 $105 cell has no quote, but $100 and $110 do. What should the surface show there?",
				"12月20日 $105 这一格没有报价，但 $100 和 $110 有。曲面在那里应显示什么？",
			],
			choices: [
				{
					id: "estimate",
					label: [
						"An estimate, marked as interpolated",
						"一个估计值，并标明是插值",
					],
				},
				{
					id: "quote",
					label: ["The average, shown like a quote", "平均值，像报价一样显示"],
				},
				{ id: "zero", label: ["0%", "0%"] },
			],
			answer: "estimate",
			revealAt: 1,
			explain: [
				`Between ${ivPoints("dec20", 100)}% and ${ivPoints("dec20", 110)}% an interpolated ≈${INTERPOLATED}% is reasonable, drawn as an estimate. Shown like a quote, it would pass for evidence that doesn't exist.`,
				`在 ${ivPoints("dec20", 100)}% 与 ${ivPoints("dec20", 110)}% 之间，插值 ≈${INTERPOLATED}% 是合理的，但要画成估计值。如果像报价一样显示，它就会被当成并不存在的证据。`,
			],
		},
		beats: [
			{
				id: "quotes",
				label: ["Quotes only", "仅报价"],
				caption: [
					"Built from Monday's quotes, three cells have no usable price: the 4-day $90 and $110 had no bid, and Dec 20 $105 had no quote.",
					"用周一的报价构建，有三格没有可用价格：只剩 4 天的 $90 和 $110 没有买价，12月20日 $105 没有报价。",
				],
				state: { stage: 0 },
			},
			{
				id: "interpolate",
				label: ["Interpolate", "插值"],
				caption: [
					`Dec 20 $105 sits between two quoted cells, so ≈${INTERPOLATED}% is a fair estimate. Draw it dashed and call it interpolated.`,
					`12月20日 $105 位于两个有报价的格子之间，所以 ≈${INTERPOLATED}% 是合理的估计。把它画成虚线，并标明是插值。`,
				],
				state: { stage: 1 },
			},
			{
				id: "edges",
				label: ["Edges", "边缘"],
				caption: [
					"The Sep 20 wings lie beyond every quote in their row. Filling them would be extrapolation, a shape the data never showed. Leave them blank.",
					"9月20日 的两翼超出了该行所有报价。填上它们就是外推，是数据从未显示过的形状。让它们留空。",
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Step through the estimates.", "逐步查看这些估计。"],
			start: () => ({ stage: 2 }),
			task: {
				kind: "answer",
				prompt: [
					"Which cells should stay blank, and why?",
					"哪些格子应该留空，为什么？",
				],
				choices: [
					{
						id: "edges",
						label: [
							"The Sep 20 wings: filling them is extrapolation",
							"9月20日 两翼：填上就是外推",
						],
					},
					{
						id: "dec",
						label: [
							"Dec 20 $105: it had no quote",
							"12月20日 $105：它没有报价",
						],
					},
					{
						id: "none",
						label: [
							"None: a surface needs every cell",
							"都不留：曲面需要每个格子",
						],
					},
				],
				answer: "edges",
				done: [
					"Dec 20 $105 sits between two quoted cells, so an interpolated estimate, marked as one, is fair. The Sep 20 wings lie beyond every quote in their row: filling them invents a shape.",
					"12月20日 $105 夹在两个有报价的格子之间，标明是插值的估计是合理的。9月20日 两翼超出该行所有报价：填上就是凭空造出形状。",
				],
			},
		},
		View: EstimatesView,
	}),
] as const;

export function VolatilitySurfaceWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="volatility-surface"
			label={[
				"Interactive lesson on the volatility surface",
				"波动率曲面互动课",
			]}
			scenes={scenes}
		/>
	);
}
