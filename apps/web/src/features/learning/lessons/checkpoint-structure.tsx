import {
	type Copy,
	count,
	gammaExposure,
	modelValue,
	modelVolatility,
	pick,
	priceOption,
	signedCount,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import type { TapeRow } from "../walkthrough/instruments/trade-tape";
import { defineScene, type Phase } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";
import {
	CHECKPOINT_ALFA,
	CHECKPOINT_DATE,
	CHECKPOINT_DAY,
	type SheetLine,
	SheetStage,
} from "./checkpoint-kit";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);
const twoColumns = (t: (value: Copy) => string, labelShare = 0.58) => [
	{ label: t(["Input", "输入"]), share: labelShare },
	{ label: t(["Value", "数值"]), share: 1 - labelShare, align: "end" as const },
];
const row = (key: string, label: string, value: string): TapeRow => ({
	key,
	cells: [label, value],
});
const SPOT = CHECKPOINT_ALFA / 100;
const signed = (value: number, places: number) =>
	`${value < 0 ? "−" : "+"}${Math.abs(value).toFixed(places)}`;
/** "+$3.02M", "−$28k". */
const money = (dollars: number) => {
	const sign = dollars < 0 ? "−" : "+";
	const size = Math.abs(dollars);
	return size >= 1_000_000
		? `${sign}$${(size / 1_000_000).toFixed(2)}M`
		: `${sign}$${Math.round(size / 1_000)}k`;
};

// ——— Scene 1: one strike's GEX contribution ———

type GexState = { stage: 0 | 1 | 2; side: "long" | "short"; up: boolean };

const GEX_STRIKE = 105;
const OPEN_INTEREST = 5_200;
/** Gamma to four places, the figure the arithmetic uses. */
const GAMMA =
	Math.round(
		modelValue(
			{ expiry: "oct18", strike: GEX_STRIKE, right: "call" },
			CHECKPOINT_ALFA,
			CHECKPOINT_DATE,
		).gamma * 10_000,
	) / 10_000;
const SHARES = Math.round(GAMMA * OPEN_INTEREST * 100);
const gexAt = (state: Pick<GexState, "side" | "up">) =>
	gammaExposure(
		GAMMA,
		OPEN_INTEREST,
		state.up ? SPOT * 1.1 : SPOT,
		state.side === "long" ? 1 : -1,
	);
const GEX = gexAt({ side: "long", up: false });

function GexView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: GexState;
	explore: GexState | null;
	setExplore: (next: GexState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const spotCents = Math.round((shown.up ? SPOT * 1.1 : SPOT) * 100);
	const value = gexAt(shown);
	const sign = shown.side === "long" ? "" : "−";
	const rows: TapeRow[] = [
		row(
			"a",
			t([
				`Oct 18 ${GEX_STRIKE} call, gamma`,
				`10月18日 ${GEX_STRIKE} 看涨 Gamma`,
			]),
			GAMMA.toFixed(4),
		),
		row("b", t(["Open interest", "未平仓量"]), count(OPEN_INTEREST)),
		row("c", t(["ALFA", "ALFA"]), usd(spotCents)),
		row(
			"d",
			t(["Dealers assumed", "假设做市商"]),
			t(
				shown.side === "long"
					? ["long the calls", "做多看涨"]
					: ["short the calls", "做空看涨"],
			),
		),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`${sign}${GAMMA} × ${count(OPEN_INTEREST)} × 100 = ${sign}${count(SHARES)} shares per $1`,
				`${sign}${GAMMA} × ${count(OPEN_INTEREST)} × 100 = 每 $1 ${sign}${count(SHARES)} 股`,
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`× ${usd(spotCents)}² × 1% = ${money(value)} per 1% move`,
				`× ${usd(spotCents)}² × 1% = 每 1% 变动 ${money(value)}`,
			]),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"One strike's gamma exposure, built from gamma, open interest, ALFA's price and a stated dealer assumption",
						"由 Gamma、未平仓量、ALFA 价格和明确的做市商假设得出的单个行权价 Gamma 敞口",
					])}
					lineSlots={2}
					title={t([
						`GEX inputs · ${CHECKPOINT_DAY[0]}`,
						`GEX 输入 · ${CHECKPOINT_DAY[1]}`,
					])}
					columns={twoColumns(t)}
					rows={rows}
					maxRows={4}
					lines={lines}
				/>
			}
			result={[
				{
					id: "gex",
					label: t(["GEX contribution", "GEX 贡献"]),
					value: shown.stage >= 2 ? money(value) : "…",
					note: t(["per 1% move, modeled", "每 1% 变动，模型值"]),
					evidence: "modeled",
				},
			]}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Dealers assumed", "假设做市商"])}
							value={explore.side}
							options={[
								["long", t(["Long the calls", "做多看涨"])],
								["short", t(["Short the calls", "做空看涨"])],
							]}
							onChange={(side) => setExplore({ ...explore, side })}
						/>
						<ChoiceField
							label={t(["ALFA", "ALFA"])}
							value={explore.up ? "up" : "now"}
							options={[
								["now", usd(CHECKPOINT_ALFA)],
								["up", t(["10% higher", "高 10%"])],
							]}
							onChange={(value) =>
								setExplore({ ...explore, up: value === "up" })
							}
						/>
					</>
				) : null
			}
		/>
	);
}

// ——— Scene 2: which side of zero gamma ———

type RegimeState = { stage: 0 | 1 | 2; spot: number };

/** The modeled zero-gamma level, in cents. */
const ZERO = 10_113;
/** A simplified model: book gamma grows 600 shares per $1 for each dollar above zero gamma. */
const bookGamma = (spotCents: number) =>
	Math.round((600 * (spotCents - ZERO)) / 100);
const MOVE = 1.5;
/** Shares the hedge trades to stay flat after ALFA rises $1.50, holding gamma fixed. */
const hedgeFor = (spotCents: number) =>
	-Math.round(bookGamma(spotCents) * MOVE);
const HEDGE = hedgeFor(CHECKPOINT_ALFA);

function RegimeView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: RegimeState;
	explore: RegimeState | null;
	setExplore: (next: RegimeState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const g = bookGamma(shown.spot);
	const hedge = hedgeFor(shown.spot);
	const rows = (narrow: boolean): TapeRow[] => [
		row("a", t(["ALFA", "ALFA"]), usd(shown.spot)),
		row(
			"b",
			t([
				narrow ? "Zero gamma (modeled)" : "Zero-gamma level (modeled)",
				"零 Gamma 位置（模型）",
			]),
			usd(ZERO),
		),
		row(
			"c",
			t(["Book gamma (modeled)", "账户 Gamma（模型）"]),
			t([`${signedCount(g)} / $1`, `每 $1 ${signedCount(g)}`]),
		),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t(
				g > 0
					? [
							`above ${usd(ZERO)}: modeled long gamma`,
							`高于 ${usd(ZERO)}：模型为正 Gamma`,
						]
					: g < 0
						? [
								`below ${usd(ZERO)}: modeled short gamma`,
								`低于 ${usd(ZERO)}：模型为负 Gamma`,
							]
						: [
								`at ${usd(ZERO)}: modeled flat gamma`,
								`在 ${usd(ZERO)}：模型 Gamma 为零`,
							],
			),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t(
				hedge < 0
					? [
							`+$1.50: the hedge sells ${count(-hedge)} shares`,
							`+$1.50：对冲卖出 ${count(-hedge)} 股`,
						]
					: hedge > 0
						? [
								`+$1.50: the hedge buys ${count(hedge)} shares`,
								`+$1.50：对冲买入 ${count(hedge)} 股`,
							]
						: ["+$1.50: no hedge trade needed", "+$1.50：无需对冲交易"],
			),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"ALFA against a modeled zero-gamma level, and the hedge a modeled dealer book would trade on a $1.50 rise",
						"ALFA 相对模型零 Gamma 位置的位置，以及上涨 $1.50 时模型做市商账户的对冲交易",
					])}
					lineSlots={2}
					title={t([
						`Modeled dealer book · ${CHECKPOINT_DAY[0]}`,
						`模型做市商账户 · ${CHECKPOINT_DAY[1]}`,
					])}
					columns={twoColumns(t)}
					rows={(width) => rows(width < 520)}
					maxRows={3}
					lines={lines}
				/>
			}
			result={[
				{
					id: "hedge",
					label: t(["Hedge on a $1.50 rise", "上涨 $1.50 时的对冲"]),
					value: shown.stage >= 2 ? signedCount(hedge) : "…",
					note: t(["shares, modeled", "股，模型值"]),
					evidence: "modeled",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["ALFA", "ALFA"])}
						value={explore.spot}
						display={usd(explore.spot)}
						min={9_813}
						max={10_613}
						step={50}
						onChange={(spot) => setExplore({ ...explore, spot })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 3: how far is the wall ———

type Unit = "dollars" | "percent" | "atr";
type DistanceState = { stage: 0 | 1 | 2; unit: Unit };

const WALL = 110;
const ATR = 1.85;
const GAP = WALL - SPOT;
const IN_ATRS = GAP / ATR;
const distance = (unit: Unit) =>
	unit === "dollars"
		? usd(Math.round(GAP * 100))
		: unit === "percent"
			? `${((GAP / SPOT) * 100).toFixed(1)}%`
			: `${IN_ATRS.toFixed(1)} ATR`;

function DistanceView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: DistanceState;
	explore: DistanceState | null;
	setExplore: (next: DistanceState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const rows = (narrow: boolean): TapeRow[] => [
		row("a", t(["ALFA", "ALFA"]), usd(CHECKPOINT_ALFA)),
		row(
			"b",
			t([
				narrow ? "Call wall (top call GEX)" : "Call wall (largest call GEX)",
				"看涨墙（最大看涨 GEX）",
			]),
			usd(WALL * 100),
		),
		row("c", t(["ATR, 14 sessions", "ATR，14 个交易日"]), `$${ATR.toFixed(2)}`),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`${usd(WALL * 100)} − ${usd(CHECKPOINT_ALFA)} = ${distance("dollars")}, ${distance("percent")} of ALFA`,
				`${usd(WALL * 100)} − ${usd(CHECKPOINT_ALFA)} = ${distance("dollars")}，为 ALFA 的 ${distance("percent")}`,
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`${distance("dollars")} ÷ $${ATR.toFixed(2)} = ${IN_ATRS.toFixed(1)} ATRs`,
				`${distance("dollars")} ÷ $${ATR.toFixed(2)} = ${IN_ATRS.toFixed(1)} 个 ATR`,
			]),
			tone: "strong",
		});
	const unitLabel: Record<Unit, Copy> = {
		dollars: ["In dollars", "以美元计"],
		percent: ["In percent", "以百分比计"],
		atr: ["In ATRs", "以 ATR 计"],
	};
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"The distance from ALFA to its call wall, in dollars, percent and ATRs",
						"ALFA 到看涨墙的距离，分别以美元、百分比和 ATR 衡量",
					])}
					lineSlots={2}
					title={t([
						`Oct 18 call wall · ${CHECKPOINT_DAY[0]}`,
						`10月18日 看涨墙 · ${CHECKPOINT_DAY[1]}`,
					])}
					columns={twoColumns(t)}
					rows={(width) => rows(width < 520)}
					maxRows={3}
					lines={lines}
				/>
			}
			result={[
				{
					id: "distance",
					label: t(["Distance to the wall", "到墙的距离"]),
					value:
						shown.stage >= 2 || shown.unit !== "atr"
							? distance(shown.unit)
							: "…",
					note: t(unitLabel[shown.unit]),
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Measure in", "衡量单位"])}
						value={explore.unit}
						options={[
							["dollars", t(["Dollars", "美元"])],
							["percent", t(["Percent", "百分比"])],
							["atr", "ATR"],
						]}
						onChange={(unit) => setExplore({ ...explore, unit })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 4: delta that changes without a trade ———

type CharmState = { stage: 0 | 1 | 2; strike: 100 | 110; ivDrop: boolean };

const HELD = 20;
const DAYS = 16;
const deltaAt = (strike: number, daysPassed: number, ivDrop: boolean) =>
	priceOption({
		spot: SPOT,
		strike,
		days: DAYS - daysPassed,
		iv: modelVolatility("oct18", strike) - (ivDrop ? 0.05 : 0),
		right: "call",
	}).delta;
/**
 * Charm per year of time left, to two places, as a screen would list it. Time left shrinks
 * as days pass, so a day's change in delta has the opposite sign.
 */
const charmAt = (strike: number, ivDrop: boolean) =>
	Math.round(
		(deltaAt(strike, 0, ivDrop) - deltaAt(strike, 1, ivDrop)) * 365 * 100,
	) / 100;
const position = (delta: number) => Math.round(delta * 100 * HELD);
const perShareDay = (charm: number) => -charm / 365;
const perDay = (charm: number) => perShareDay(charm) * 100 * HELD;
const CHARM = charmAt(110, false);
const DAY_CHANGE = Math.round(perDay(CHARM) * 10) / 10;
const TODAY = position(deltaAt(110, 0, false));
const WEEK = position(deltaAt(110, 7, false));

function CharmView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: CharmState;
	explore: CharmState | null;
	setExplore: (next: CharmState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const delta = deltaAt(shown.strike, 0, shown.ivDrop);
	const charm = charmAt(shown.strike, shown.ivDrop);
	const now = position(delta);
	const week = position(deltaAt(shown.strike, 7, shown.ivDrop));
	const iv = Math.round(
		(modelVolatility("oct18", shown.strike) - (shown.ivDrop ? 0.05 : 0)) * 100,
	);
	const rows = (narrow: boolean): TapeRow[] => [
		row(
			"a",
			t([
				`Oct 18 ${shown.strike} call, delta`,
				`10月18日 ${shown.strike} 看涨 Delta`,
			]),
			delta.toFixed(4),
		),
		row(
			"b",
			t([
				narrow ? "Charm per year left" : "Charm, per year of time left",
				"Charm，每一年剩余期限",
			]),
			signed(charm, 2),
		),
		row(
			"c",
			t(["Implied volatility", "隐含波动率"]),
			shown.ivDrop ? t([`${iv}% (−5 pts)`, `${iv}%（−5 点）`]) : `${iv}%`,
		),
		row("d", t(["Calls held", "持有的看涨"]), count(HELD)),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push(
			{
				text: t([
					`a day passed: ${signed(-charm, 2)} ÷ 365 = ${signed(perShareDay(charm), 4)}`,
					`经过一天：${signed(-charm, 2)} ÷ 365 = ${signed(perShareDay(charm), 4)}`,
				]),
			},
			{
				text: t([
					`× 100 × ${HELD} = ${signed(perDay(charm), 0)} a day`,
					`× 100 × ${HELD} = 每天 ${signed(perDay(charm), 0)}`,
				]),
				tone: "strong",
			},
		);
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`a week on: ${signedCount(week)}, from ${signedCount(now)} (${signedCount(week - now)})`,
				`一周后：${signedCount(week)}，原为 ${signedCount(now)}（${signedCount(week - now)}）`,
			]),
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"A call position's delta today, its charm, and its delta a week later with no trade",
						"看涨持仓今天的 Delta、它的 Charm，以及一周后在没有交易时的 Delta",
					])}
					lineSlots={3}
					title={t([
						`Your calls · ${CHECKPOINT_DAY[0]}`,
						`你的看涨 · ${CHECKPOINT_DAY[1]}`,
					])}
					columns={twoColumns(t)}
					rows={(width) => rows(width < 520)}
					maxRows={4}
					lines={lines}
				/>
			}
			result={[
				{
					id: "now",
					label: t(["Position delta today", "今天的持仓 Delta"]),
					value: signedCount(now),
					note: t(["share-equivalents", "股等价"]),
					evidence: "modeled",
				},
				{
					id: "day",
					label: t(["Change over a day", "一天的变化"]),
					value: shown.stage >= 1 ? signed(perDay(charm), 0) : "…",
					note: t(["ALFA and IV unchanged", "ALFA 与 IV 不变"]),
					evidence: "modeled",
				},
			]}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Contract", "合约"])}
							value={String(explore.strike) as "100" | "110"}
							options={[
								["110", t(["Oct 18 110 call", "10月18日 110 看涨"])],
								["100", t(["Oct 18 100 call", "10月18日 100 看涨"])],
							]}
							onChange={(value) =>
								setExplore({ ...explore, strike: value === "100" ? 100 : 110 })
							}
						/>
						<ChoiceField
							label={t(["Implied volatility", "隐含波动率"])}
							value={explore.ivDrop ? "drop" : "same"}
							options={[
								["same", t(["Unchanged", "不变"])],
								["drop", t(["Down 5 points", "下降 5 个点"])],
							]}
							onChange={(value) =>
								setExplore({ ...explore, ivDrop: value === "drop" })
							}
						/>
					</>
				) : null
			}
		/>
	);
}

// ——— Checkpoint ———

const ITM_NOW = deltaAt(100, 0, false);
const ITM_DROP = deltaAt(100, 0, true);
const OTM_DROP = deltaAt(110, 0, true);

const scenes = [
	defineScene<GexState, GexState>({
		id: "gex",
		label: ["GEX", "GEX"],
		title: [
			"Gamma × open interest × 100 × price² × 1%",
			"Gamma × 未平仓量 × 100 × 价格² × 1%",
		],
		revisit: "gamma-exposure",
		predict: {
			prompt: [
				`On ${CHECKPOINT_DAY[0]}, with ALFA at ${usd(CHECKPOINT_ALFA)}, the Oct 18 ${GEX_STRIKE} call has a model gamma of ${GAMMA} and open interest of ${count(OPEN_INTEREST)}. Assume dealers are long these calls. What is their GEX contribution, in dollars per 1% move?`,
				`${CHECKPOINT_DAY[1]}，ALFA 为 ${usd(CHECKPOINT_ALFA)}，10月18日 ${GEX_STRIKE} 看涨的模型 Gamma 为 ${GAMMA}，未平仓量为 ${count(OPEN_INTEREST)}。假设做市商做多这些看涨。它们的 GEX 贡献是每 1% 变动多少美元？`,
			],
			choices: [
				{ id: "right", label: [money(GEX), money(GEX)] },
				{ id: "shares", label: [money(SHARES), money(SHARES)] },
				{ id: "sign", label: [money(-GEX), money(-GEX)] },
			],
			answer: "right",
			entry: {
				answer: Math.round(GEX),
				tolerance: Math.round(GEX * 0.01),
				prefix: "$",
			},
			revealAt: 2,
			explain: [
				`${GAMMA} × ${count(OPEN_INTEREST)} × 100 × ${usd(CHECKPOINT_ALFA)}² × 1% ≈ ${money(GEX)} per 1% move. It's positive only because of the stated assumption: if dealers were short these calls, the same inputs give ${money(-GEX)}.`,
				`${GAMMA} × ${count(OPEN_INTEREST)} × 100 × ${usd(CHECKPOINT_ALFA)}² × 1% ≈ 每 1% 变动 ${money(GEX)}。它为正只是因为给定的假设：如果做市商做空这些看涨，同样的输入得出 ${money(-GEX)}。`,
			],
		},
		beats: [
			{
				id: "inputs",
				label: ["Inputs", "输入"],
				caption: [
					"Gamma and open interest for one strike, ALFA's price, and the dealer side, which is an assumption, not an observation.",
					"一个行权价的 Gamma 和未平仓量、ALFA 的价格，以及做市商的方向；这是假设，不是观察。",
				],
				state: { stage: 0, side: "long", up: false },
			},
			{
				id: "shares",
				label: ["Shares", "股数"],
				caption: [
					`${GAMMA} × ${count(OPEN_INTEREST)} contracts × 100 shares = ${count(SHARES)} shares of delta for each $1 ALFA moves.`,
					`${GAMMA} × ${count(OPEN_INTEREST)} 张 × 100 股 = ALFA 每变动 $1 带来 ${count(SHARES)} 股 Delta。`,
				],
				state: { stage: 1, side: "long", up: false },
			},
			{
				id: "dollars",
				label: ["Dollars", "美元"],
				caption: [
					`Scale to dollars for a 1% move: × ${usd(CHECKPOINT_ALFA)}² × 1% gives ${money(GEX)}.`,
					`换算成 1% 变动的美元：× ${usd(CHECKPOINT_ALFA)}² × 1%，得到 ${money(GEX)}。`,
				],
				state: { stage: 2, side: "long", up: false },
			},
		],
		explore: {
			prompt: [
				"Switch the dealer assumption and ALFA's price.",
				"切换做市商假设和 ALFA 的价格。",
			],
			start: () => ({ stage: 2, side: "long", up: false }),
			task: {
				kind: "answer",
				prompt: [
					"Hold gamma and open interest fixed and raise ALFA 10%. About how much bigger is the contribution?",
					"保持 Gamma 和未平仓量不变，把 ALFA 提高 10%。贡献大约变大多少？",
				],
				choices: [
					{ id: "ten", label: ["About 10%", "约 10%"] },
					{ id: "squared", label: ["About 21%", "约 21%"] },
					{ id: "none", label: ["No change", "不变"] },
				],
				answer: "squared",
				done: [
					`Price enters squared: 1.1² = 1.21, so ${money(GEX)} becomes ${money(gexAt({ side: "long", up: true }))}. In practice gamma changes too when ALFA moves; this check holds it fixed.`,
					`价格以平方进入：1.1² = 1.21，所以 ${money(GEX)} 变成 ${money(gexAt({ side: "long", up: true }))}。实际中 ALFA 变动时 Gamma 也会变；这里把它固定。`,
				],
			},
		},
		View: GexView,
	}),
	defineScene<RegimeState, RegimeState>({
		id: "regime",
		label: ["Gamma regime", "Gamma 状态"],
		title: [
			"Long gamma hedges against the move",
			"正 Gamma 的对冲与变动方向相反",
		],
		revisit: "gamma-regimes",
		predict: {
			prompt: [
				`A model puts ALFA's zero-gamma level at ${usd(ZERO)}. At ${usd(CHECKPOINT_ALFA)} its modeled dealer book has ${signedCount(bookGamma(CHECKPOINT_ALFA))} shares of delta per $1. ALFA rises $1.50. Using that gamma for the whole move, how many shares does the hedge trade? Enter a sale as a negative number.`,
				`某模型把 ALFA 的零 Gamma 位置定在 ${usd(ZERO)}。在 ${usd(CHECKPOINT_ALFA)}，它的模型做市商账户每 $1 有 ${signedCount(bookGamma(CHECKPOINT_ALFA))} 股 Delta。ALFA 上涨 $1.50。整段变动都用这个 Gamma，对冲交易多少股？卖出填负数。`,
			],
			choices: [
				{
					id: "sell",
					label: [`Sell ${count(-HEDGE)}`, `卖出 ${count(-HEDGE)}`],
				},
				{ id: "buy", label: [`Buy ${count(-HEDGE)}`, `买入 ${count(-HEDGE)}`] },
				{
					id: "gamma",
					label: [
						`Sell ${count(bookGamma(CHECKPOINT_ALFA))}`,
						`卖出 ${count(bookGamma(CHECKPOINT_ALFA))}`,
					],
				},
			],
			answer: "sell",
			entry: { answer: HEDGE, unit: [" shares", " 股"] },
			revealAt: 2,
			explain: [
				`Long gamma: the rise adds ${signedCount(bookGamma(CHECKPOINT_ALFA))} × 1.5 = ${signedCount(-HEDGE)} deltas, so the hedge sells ${count(-HEDGE)} shares to get back to flat. That's pressure against the move under the model, not a forecast that ALFA stalls.`,
				`正 Gamma：上涨增加 ${signedCount(bookGamma(CHECKPOINT_ALFA))} × 1.5 = ${signedCount(-HEDGE)} Delta，所以对冲卖出 ${count(-HEDGE)} 股回到中性。这是模型下与变动方向相反的压力，不是 ALFA 会停滞的预测。`,
			],
		},
		beats: [
			{
				id: "level",
				label: ["The level", "位置"],
				caption: [
					`ALFA is ${usd(CHECKPOINT_ALFA - ZERO)} above the modeled zero-gamma level.`,
					`ALFA 比模型零 Gamma 位置高 ${usd(CHECKPOINT_ALFA - ZERO)}。`,
				],
				state: { stage: 0, spot: CHECKPOINT_ALFA },
			},
			{
				id: "regime",
				label: ["Regime", "状态"],
				caption: [
					"Above zero gamma the modeled book is long gamma: a rise adds deltas, a fall removes them.",
					"高于零 Gamma 时，模型账户是正 Gamma：上涨增加 Delta，下跌减少 Delta。",
				],
				state: { stage: 1, spot: CHECKPOINT_ALFA },
			},
			{
				id: "hedge",
				label: ["The hedge", "对冲"],
				caption: [
					`To stay flat after +$1.50, the hedge sells ${count(-HEDGE)} shares, into the rise.`,
					`上涨 $1.50 后要保持中性，对冲在上涨中卖出 ${count(-HEDGE)} 股。`,
				],
				state: { stage: 2, spot: CHECKPOINT_ALFA },
			},
		],
		explore: {
			prompt: ["Move ALFA.", "移动 ALFA。"],
			start: () => ({ stage: 2, spot: CHECKPOINT_ALFA }),
			task: {
				kind: "reach",
				prompt: [
					"Find the price at which a small move needs no hedge trade under the model.",
					"找出在模型下小幅变动无需对冲交易的价格。",
				],
				reached: (e) => e.spot === ZERO,
				done: [
					`At ${usd(ZERO)} the modeled book is flat on gamma. Below it the hedge would buy rallies and sell dips, adding to moves. It's a model's map of hedging, not a forecast of where ALFA goes.`,
					`在 ${usd(ZERO)}，模型账户的 Gamma 为零。低于它时，对冲会在上涨时买入、下跌时卖出，放大变动。这是模型对对冲的描绘，不是对 ALFA 走向的预测。`,
				],
			},
		},
		View: RegimeView,
	}),
	defineScene<DistanceState, DistanceState>({
		id: "distance",
		label: ["Distance", "距离"],
		title: ["Say the unit with every distance", "每个距离都要说明单位"],
		revisit: "structural-levels",
		predict: {
			prompt: [
				`ALFA is ${usd(CHECKPOINT_ALFA)} and its Oct 18 call wall is ${usd(WALL * 100)}. ALFA's 14-session ATR is $${ATR.toFixed(2)}. How far is the wall, in ATRs?`,
				`ALFA 为 ${usd(CHECKPOINT_ALFA)}，它 10月18日 的看涨墙在 ${usd(WALL * 100)}。ALFA 14 个交易日的 ATR 为 $${ATR.toFixed(2)}。这堵墙有多少个 ATR 远？`,
			],
			choices: [
				{
					id: "atr",
					label: [
						`About ${IN_ATRS.toFixed(1)} ATRs`,
						`约 ${IN_ATRS.toFixed(1)} 个 ATR`,
					],
				},
				{
					id: "dollars",
					label: [
						`About ${GAP.toFixed(1)} ATRs`,
						`约 ${GAP.toFixed(1)} 个 ATR`,
					],
				},
				{
					id: "percent",
					label: [
						`About ${((GAP / SPOT) * 100).toFixed(1)} ATRs`,
						`约 ${((GAP / SPOT) * 100).toFixed(1)} 个 ATR`,
					],
				},
			],
			answer: "atr",
			entry: {
				answer: Math.round(IN_ATRS * 100) / 100,
				tolerance: 0.05,
				unit: [" ATRs", " 个 ATR"],
			},
			revealAt: 2,
			explain: [
				`${distance("dollars")} ÷ $${ATR.toFixed(2)} ≈ ${IN_ATRS.toFixed(1)} ATRs. The same gap is ${distance("dollars")} or ${distance("percent")}; say which unit you mean.`,
				`${distance("dollars")} ÷ $${ATR.toFixed(2)} ≈ ${IN_ATRS.toFixed(1)} 个 ATR。同一段距离也是 ${distance("dollars")} 或 ${distance("percent")}；要说明用的是哪个单位。`,
			],
		},
		beats: [
			{
				id: "inputs",
				label: ["Inputs", "输入"],
				caption: [
					"ALFA, the call wall from the GEX profile, and a 14-session ATR.",
					"ALFA、GEX 分布中的看涨墙，以及 14 个交易日的 ATR。",
				],
				state: { stage: 0, unit: "atr" },
			},
			{
				id: "gap",
				label: ["The gap", "差距"],
				caption: [
					`${distance("dollars")} away, or ${distance("percent")} of ALFA's price.`,
					`距离 ${distance("dollars")}，即 ALFA 价格的 ${distance("percent")}。`,
				],
				state: { stage: 1, unit: "atr" },
			},
			{
				id: "atr",
				label: ["In ATRs", "以 ATR 计"],
				caption: [
					`${distance("dollars")} ÷ $${ATR.toFixed(2)} = ${IN_ATRS.toFixed(1)}: about three typical days' ranges away.`,
					`${distance("dollars")} ÷ $${ATR.toFixed(2)} = ${IN_ATRS.toFixed(1)}：约三个典型交易日的波幅。`,
				],
				state: { stage: 2, unit: "atr" },
			},
		],
		explore: {
			prompt: ["Switch the unit.", "切换单位。"],
			start: () => ({ stage: 2, unit: "atr" }),
			task: {
				kind: "answer",
				prompt: [
					`The wall is about ${IN_ATRS.toFixed(1)} ATRs away. What does that tell you?`,
					`这堵墙约 ${IN_ATRS.toFixed(1)} 个 ATR 远。这说明了什么？`,
				],
				choices: [
					{
						id: "days",
						label: [
							"ALFA should reach it in about three sessions",
							"ALFA 约三个交易日就会到达",
						],
					},
					{
						id: "distance",
						label: [
							"How far it is in typical daily ranges, nothing more",
							"以典型日波幅计有多远，仅此而已",
						],
					},
					{
						id: "barrier",
						label: ["ALFA can't trade through it", "ALFA 无法突破它"],
					},
				],
				answer: "distance",
				done: [
					"ATR measures how much ALFA has tended to move in a day, not which way. A wall is a reference level from a model, not a target, a date or a barrier.",
					"ATR 衡量 ALFA 一天通常波动多少，而不是方向。墙是模型得出的参考位置，不是目标、日期或屏障。",
				],
			},
		},
		View: DistanceView,
	}),
	defineScene<CharmState, CharmState>({
		id: "charm",
		label: ["Charm", "Charm"],
		title: ["Delta changes with no trade", "没有交易，Delta 也会变"],
		revisit: "charm-vanna",
		predict: {
			prompt: [
				`You hold ${HELD} Oct 18 110 calls, delta ${deltaAt(110, 0, false).toFixed(4)}. A screen lists their charm as ${signed(CHARM, 2)} per year of time left. With ALFA and IV unchanged, by how much does your position's delta change over one day, in share-equivalents?`,
				`你持有 ${HELD} 张 10月18日 110 看涨，Delta ${deltaAt(110, 0, false).toFixed(4)}。屏幕把它们的 Charm 列为每一年剩余期限 ${signed(CHARM, 2)}。ALFA 与 IV 不变，一天后你持仓的 Delta 变化多少股等价？`,
			],
			choices: [
				{ id: "right", label: [signed(DAY_CHANGE, 0), signed(DAY_CHANGE, 0)] },
				{ id: "flip", label: [signed(-DAY_CHANGE, 0), signed(-DAY_CHANGE, 0)] },
				{
					id: "year",
					label: [
						signedCount(-Math.round(CHARM * 100 * HELD)),
						signedCount(-Math.round(CHARM * 100 * HELD)),
					],
				},
			],
			answer: "right",
			entry: {
				answer: DAY_CHANGE,
				tolerance: 0.3,
				unit: [" share-equivalents", " 股等价"],
			},
			revealAt: 1,
			explain: [
				`Time left shrinks as a day passes, so the sign flips: ${signed(-CHARM, 2)} ÷ 365 ≈ ${signed(perShareDay(CHARM), 4)} a share; × 100 × ${HELD} ≈ ${signed(DAY_CHANGE, 0)}. Your exposure shrinks with no trade and no move in ALFA.`,
				`经过一天，剩余期限变短，所以符号相反：${signed(-CHARM, 2)} ÷ 365 ≈ 每股 ${signed(perShareDay(CHARM), 4)}；× 100 × ${HELD} ≈ ${signed(DAY_CHANGE, 0)}。没有交易、ALFA 也没动，你的敞口却在缩小。`,
			],
		},
		beats: [
			{
				id: "today",
				label: ["Today", "今天"],
				caption: [
					`${HELD} out-of-the-money calls: ${signedCount(TODAY)} share-equivalents today.`,
					`${HELD} 张虚值看涨：今天为 ${signedCount(TODAY)} 股等价。`,
				],
				state: { stage: 0, strike: 110, ivDrop: false },
			},
			{
				id: "day",
				label: ["One day", "一天"],
				caption: [
					`A day passing shortens time left, so flip the sign, ÷ 365, × 100 × ${HELD}: about ${signed(DAY_CHANGE, 0)} a day.`,
					`经过一天会缩短剩余期限，所以符号取反，÷ 365，× 100 × ${HELD}：每天约 ${signed(DAY_CHANGE, 0)}。`,
				],
				state: { stage: 1, strike: 110, ivDrop: false },
			},
			{
				id: "week",
				label: ["A week", "一周"],
				caption: [
					`A week on it's ${signedCount(WEEK)}, down ${count(TODAY - WEEK)}: more than 7 × ${Math.abs(Math.round(DAY_CHANGE))}, because charm speeds up as expiry nears.`,
					`一周后是 ${signedCount(WEEK)}，减少 ${count(TODAY - WEEK)}：比 7 × ${Math.abs(Math.round(DAY_CHANGE))} 更多，因为临近到期时 Charm 会加快。`,
				],
				state: { stage: 2, strike: 110, ivDrop: false },
			},
		],
		explore: {
			prompt: ["Switch the contract and the IV.", "切换合约和 IV。"],
			start: () => ({ stage: 2, strike: 110, ivDrop: false }),
			task: {
				kind: "answer",
				prompt: [
					"Your 110 calls lose delta when IV drops 5 points. Switch to the 100 call. What does the same drop do to its delta?",
					"IV 下降 5 个点时，你的 110 看涨会失去 Delta。切换到 100 看涨。同样的下降对它的 Delta 有什么影响？",
				],
				choices: [
					{ id: "raises", label: ["Raises it", "提高"] },
					{ id: "lowers", label: ["Lowers it too", "同样降低"] },
					{
						id: "nothing",
						label: [
							"Nothing: only time moves delta",
							"没有影响：只有时间会改变 Delta",
						],
					},
				],
				answer: "raises",
				done: [
					`The 100 call is in the money: with less volatility it's more likely to stay there, so its delta rises from ${ITM_NOW.toFixed(3)} to ${ITM_DROP.toFixed(3)}, while the 110's falls to ${OTM_DROP.toFixed(3)}. Vanna's sign depends on moneyness.`,
					`100 看涨是实值：波动率更低时，它更可能保持实值，所以 Delta 从 ${ITM_NOW.toFixed(3)} 升到 ${ITM_DROP.toFixed(3)}，而 110 看涨降到 ${OTM_DROP.toFixed(3)}。Vanna 的方向取决于价内外程度。`,
				],
			},
		},
		View: CharmView,
	}),
] as const;

export function CheckpointStructureWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="checkpoint-structure"
			label={[
				"Checkpoint for modeled positioning and structure",
				"“模型持仓与结构”检查点",
			]}
			scenes={scenes}
			review
		/>
	);
}
