import {
	type Copy,
	count,
	dayCount,
	modelValue,
	OCT_100_CALL,
	pick,
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
const row = (
	key: string,
	label: string,
	value: string,
	muted = false,
): TapeRow => ({
	key,
	cells: [label, value],
	muted,
});
const SPOT = CHECKPOINT_ALFA / 100;

// ——— Scene 1: a position's delta ———

type DeltaState = { stage: 0 | 1 | 2; contracts: number };

/** The model delta that morning, to two places as a screen would show it. */
const DELTA =
	Math.round(
		modelValue(OCT_100_CALL, CHECKPOINT_ALFA, CHECKPOINT_DATE).delta * 100,
	) / 100;
const HELD = 16;
const positionDelta = (contracts: number) =>
	Math.round(DELTA * 100 * contracts);
const NEAREST_1000 = Array.from({ length: 30 }, (_, i) => i + 1).reduce(
	(best, n) =>
		Math.abs(positionDelta(n) - 1000) < Math.abs(positionDelta(best) - 1000)
			? n
			: best,
);

function DeltaView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: DeltaState;
	explore: DeltaState | null;
	setExplore: (next: DeltaState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const rows: TapeRow[] = [
		row("a", t(["ALFA", "ALFA"]), usd(CHECKPOINT_ALFA)),
		row(
			"b",
			t(["Oct 18 100 call, model delta", "10月18日 100 看涨模型 Delta"]),
			DELTA.toFixed(2),
		),
		row("c", t(["Calls you hold", "你持有的看涨"]), count(shown.contracts)),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`${DELTA.toFixed(2)} × 100 × ${shown.contracts} = +${count(positionDelta(shown.contracts))} share-equivalents`,
				`${DELTA.toFixed(2)} × 100 × ${shown.contracts} = +${count(positionDelta(shown.contracts))} 股等价`,
			]),
			tone: "strong",
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`a $1 rise adds about $${count(positionDelta(shown.contracts))}, before gamma, time and IV`,
				`上涨 $1 约增加 $${count(positionDelta(shown.contracts))}，未计 Gamma、时间和 IV`,
			]),
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"A position in the Oct 18 100 call and its delta in share-equivalents",
						"10月18日 100 看涨的持仓及其以股等价计的 Delta",
					])}
					lineSlots={2}
					title={t([
						`Your calls · ${CHECKPOINT_DAY[0]}, 16 days to Oct 18`,
						`你的看涨 · ${CHECKPOINT_DAY[1]}，距 10月18日 16 天`,
					])}
					columns={twoColumns(t)}
					rows={rows}
					maxRows={3}
					lines={lines}
				/>
			}
			result={[
				{
					id: "delta",
					label: t(["Position delta", "持仓 Delta"]),
					value:
						shown.stage >= 1
							? `+${count(positionDelta(shown.contracts))}`
							: "…",
					note: t(["share-equivalents", "股等价"]),
					evidence: "modeled",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["Calls held", "持有的看涨"])}
						value={explore.contracts}
						display={String(explore.contracts)}
						min={1}
						max={30}
						onChange={(contracts) => setExplore({ ...explore, contracts })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 2: the move options price in ———

type MoveState = { stage: 0 | 1 | 2; days: number };

const IV = 35;
const DAYS = 16;
const oneSd = (days: number) => SPOT * (IV / 100) * Math.sqrt(days / 365);

function MoveView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: MoveState;
	explore: MoveState | null;
	setExplore: (next: MoveState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const move = oneSd(shown.days);
	const rows: TapeRow[] = [
		row("a", t(["ALFA", "ALFA"]), usd(CHECKPOINT_ALFA)),
		row("b", t(["Implied volatility", "隐含波动率"]), `${IV}%`),
		row("c", t(["Days left", "剩余天数"]), String(shown.days)),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`a year: ${usd(CHECKPOINT_ALFA)} × ${IV}% = ±${usd(Math.round(SPOT * IV))}; × √(${shown.days} ÷ 365) = × ${Math.sqrt(shown.days / 365).toFixed(3)}`,
				`一年：${usd(CHECKPOINT_ALFA)} × ${IV}% = ±${usd(Math.round(SPOT * IV))}；× √(${shown.days} ÷ 365) = × ${Math.sqrt(shown.days / 365).toFixed(3)}`,
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`one SD: ±${usd(Math.round(move * 100))}, about ${usd(Math.round((SPOT - move) * 100))} to ${usd(Math.round((SPOT + move) * 100))}`,
				`一个标准差：±${usd(Math.round(move * 100))}，约 ${usd(Math.round((SPOT - move) * 100))} 至 ${usd(Math.round((SPOT + move) * 100))}`,
			]),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"ALFA's one-standard-deviation move implied by its options, for the days left",
						"由 ALFA 期权隐含的、剩余天数内的一个标准差变动",
					])}
					lineSlots={2}
					title={t([
						`Oct 18 options · ${CHECKPOINT_DAY[0]}`,
						`10月18日 期权 · ${CHECKPOINT_DAY[1]}`,
					])}
					columns={twoColumns(t)}
					rows={rows}
					maxRows={3}
					lines={lines}
				/>
			}
			result={[
				{
					id: "move",
					label: t([
						`One SD in ${dayCount(shown.days)}`,
						`${shown.days} 天的一个标准差`,
					]),
					value: shown.stage >= 2 ? `±${usd(Math.round(move * 100))}` : "…",
					evidence: "modeled",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["Days left", "剩余天数"])}
						value={explore.days}
						display={String(explore.days)}
						min={1}
						max={30}
						onChange={(days) => setExplore({ ...explore, days })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 3: rank and percentile ———

type RankState = { stage: 0 | 1 | 2; drop: boolean };

const HISTORY = [22, 25, 28, 31, 33, 36, 52];
const TODAY = 34;
const measures = (drop: boolean) => {
	const sample = drop ? HISTORY.filter((value) => value !== 52) : HISTORY;
	const low = Math.min(...sample);
	const high = Math.max(...sample);
	return {
		sample,
		low,
		high,
		rank: ((TODAY - low) / (high - low)) * 100,
		percentile:
			(sample.filter((value) => value < TODAY).length / sample.length) * 100,
	};
};

function RankView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: RankState;
	explore: RankState | null;
	setExplore: (next: RankState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const m = measures(shown.drop);
	const rows: TapeRow[] = [
		row("a", t(["Past IV30", "过去的 IV30"]), m.sample.join(" ")),
		row("b", t(["Today", "今天"]), `${TODAY}%`),
		row("c", t(["Low · high", "最低 · 最高"]), `${m.low}% · ${m.high}%`),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`rank: (${TODAY} − ${m.low}) ÷ (${m.high} − ${m.low}) = ${m.rank.toFixed(1)}%`,
				`Rank：(${TODAY} − ${m.low}) ÷ (${m.high} − ${m.low}) = ${m.rank.toFixed(1)}%`,
			]),
			tone: "strong",
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`percentile: ${m.sample.filter((value) => value < TODAY).length} of ${m.sample.length} below = ${m.percentile.toFixed(1)}%`,
				`百分位：${m.sample.length} 个中有 ${m.sample.filter((value) => value < TODAY).length} 个更低 = ${m.percentile.toFixed(1)}%`,
			]),
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"ALFA's past IV30 readings and today's, read as IV rank and IV percentile",
						"ALFA 过去的 IV30 读数和今天的读数，分别读作 IV Rank 和 IV 百分位",
					])}
					lineSlots={2}
					title={t([
						"ALFA IV30 · short practice sample",
						"ALFA IV30 · 练习用的短样本",
					])}
					columns={twoColumns(t, 0.36)}
					rows={rows}
					maxRows={3}
					lines={lines}
				/>
			}
			result={[
				{
					id: "rank",
					label: t(["IV rank", "IV Rank"]),
					value: shown.stage >= 1 ? `${m.rank.toFixed(1)}%` : "…",
					evidence: "calculated",
				},
				{
					id: "pct",
					label: t(["IV percentile", "IV 百分位"]),
					value: shown.stage >= 2 ? `${m.percentile.toFixed(1)}%` : "…",
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["The 52% reading", "52% 的读数"])}
						value={explore.drop ? "drop" : "keep"}
						options={[
							["keep", t(["Keep it", "保留"])],
							["drop", t(["Drop it", "去掉"])],
						]}
						onChange={(value) =>
							setExplore({ ...explore, drop: value === "drop" })
						}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 4: a same-day option at the close ———

type CloseState = { stage: 0 | 1 | 2; close: number };

const STRIKE = 104;
const CLOSE = 10_430;
const valueAt = (closeCents: number) => Math.max(closeCents - STRIKE * 100, 0);

function CloseView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: CloseState;
	explore: CloseState | null;
	setExplore: (next: CloseState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const value = valueAt(shown.close);
	const rows = (narrow: boolean): TapeRow[] => [
		row(
			"a",
			t(["Contract", "合约"]),
			t(["Oct 4 104 call", "10月4日 104 看涨"]),
		),
		row(
			"b",
			t([narrow ? "3:00 pm" : "At 3:00 pm", "下午 3:00"]),
			t([
				narrow ? "ALFA $104.00, 1 hr left" : "ALFA $104.00, an hour left",
				"ALFA $104.00，还剩一小时",
			]),
		),
		row(
			"c",
			t(["ALFA at the 4:00 close", "4:00 收盘时 ALFA"]),
			usd(shown.close),
			shown.stage === 0,
		),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				"at the close: ALFA minus $104, or nothing",
				"收盘时：ALFA 减 $104，否则为零",
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`${usd(value)} a share${value > 0 ? ": exercised, 100 shares" : ": expires"}`,
				`每股 ${usd(value)}${value > 0 ? "：行权，100 股" : "：到期作废"}`,
			]),
			tone: value > 0 ? "gain" : "loss",
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"A same-day call an hour before its close, and what it's worth at the close",
						"一张当天到期的看涨在收盘前一小时的情况，以及它在收盘时的价值",
					])}
					lineSlots={2}
					title={t(["Fri Oct 4 · expires today", "10月4日 周五 · 今天到期"])}
					columns={twoColumns(t)}
					rows={(width) => rows(width < 520)}
					maxRows={3}
					lines={lines}
				/>
			}
			result={[
				{
					id: "value",
					label: t(["Worth at the close", "收盘时价值"]),
					value: shown.stage >= 2 ? usd(value) : "…",
					note: t(["per share", "每股"]),
					tone: shown.stage >= 2 ? (value > 0 ? "gain" : "loss") : undefined,
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["ALFA at the close", "收盘时 ALFA"])}
						value={explore.close}
						display={usd(explore.close)}
						min={10_350}
						max={10_450}
						step={10}
						onChange={(close) => setExplore({ ...explore, close })}
					/>
				) : null
			}
		/>
	);
}

// ——— Checkpoint ———

const scenes = [
	defineScene<DeltaState, DeltaState>({
		id: "delta",
		label: ["Position delta", "持仓 Delta"],
		title: ["Delta × 100 × contracts", "Delta × 100 × 张数"],
		revisit: "delta",
		predict: {
			prompt: [
				`On ${CHECKPOINT_DAY[0]}, with ALFA at ${usd(CHECKPOINT_ALFA)}, the Oct 18 100 call's model delta is ${DELTA.toFixed(2)}. You hold ${HELD} of them. What is your position's delta, in share-equivalents?`,
				`${CHECKPOINT_DAY[1]}，ALFA 为 ${usd(CHECKPOINT_ALFA)}，10月18日 100 看涨的模型 Delta 为 ${DELTA.toFixed(2)}。你持有 ${HELD} 张。你持仓的 Delta 是多少股等价？`,
			],
			choices: [
				{
					id: "right",
					label: [count(positionDelta(HELD)), count(positionDelta(HELD))],
				},
				{
					id: "per",
					label: [
						String(Math.round(DELTA * HELD * 100) / 100),
						String(Math.round(DELTA * HELD * 100) / 100),
					],
				},
				{ id: "shares", label: [count(HELD * 100), count(HELD * 100)] },
			],
			answer: "right",
			entry: {
				answer: positionDelta(HELD),
				tolerance: 10,
				unit: [" share-equivalents", " 股等价"],
			},
			revealAt: 1,
			explain: [
				`${DELTA.toFixed(2)} × 100 × ${HELD} = ${count(positionDelta(HELD))}. The calls move like about ${count(positionDelta(HELD))} shares for a small move, not ${count(HELD * 100)}.`,
				`${DELTA.toFixed(2)} × 100 × ${HELD} = ${count(positionDelta(HELD))}。小幅变动时，这些看涨约像 ${count(positionDelta(HELD))} 股一样变动，而不是 ${count(HELD * 100)} 股。`,
			],
		},
		beats: [
			{
				id: "inputs",
				label: ["Inputs", "输入"],
				caption: [
					`Two weeks on, ALFA is higher and the call deeper in the money: delta ${DELTA.toFixed(2)}.`,
					`两周后，ALFA 更高，看涨更深地处于实值：Delta ${DELTA.toFixed(2)}。`,
				],
				state: { stage: 0, contracts: HELD },
			},
			{
				id: "position",
				label: ["Position", "持仓"],
				caption: [
					`${DELTA.toFixed(2)} × 100 shares × ${HELD} contracts = +${count(positionDelta(HELD))} share-equivalents.`,
					`${DELTA.toFixed(2)} × 100 股 × ${HELD} 张 = +${count(positionDelta(HELD))} 股等价。`,
				],
				state: { stage: 1, contracts: HELD },
			},
			{
				id: "meaning",
				label: ["Meaning", "含义"],
				caption: [
					`A $1 rise adds about $${count(positionDelta(HELD))}, until gamma, time and volatility change delta.`,
					`上涨 $1 约增加 $${count(positionDelta(HELD))}，直到 Gamma、时间和波动率改变 Delta。`,
				],
				state: { stage: 2, contracts: HELD },
			},
		],
		explore: {
			prompt: ["Change how many calls you hold.", "改变你持有的看涨数量。"],
			start: () => ({ stage: 2, contracts: HELD }),
			task: {
				kind: "reach",
				prompt: [
					"Find the number of calls whose delta comes closest to 1,000 shares.",
					"找出 Delta 最接近 1,000 股的看涨张数。",
				],
				reached: (e) => e.contracts === NEAREST_1000,
				done: [
					`${NEAREST_1000} calls are +${count(positionDelta(NEAREST_1000))} share-equivalents, the nearest to 1,000. A share-equivalent target needs delta, not just a count of contracts.`,
					`${NEAREST_1000} 张看涨为 +${count(positionDelta(NEAREST_1000))} 股等价，最接近 1,000。要达到某个股等价目标，需要用 Delta，而不只是数合约。`,
				],
			},
		},
		View: DeltaView,
	}),
	defineScene<MoveState, MoveState>({
		id: "move",
		label: ["Expected move", "预期变动"],
		title: ["Scale IV by the square root of time", "按时间的平方根缩放 IV"],
		revisit: "expected-move",
		predict: {
			prompt: [
				`ALFA is ${usd(CHECKPOINT_ALFA)} and its Oct 18 options imply ${IV}% volatility, with ${DAYS} days left. What is the one-standard-deviation move to Oct 18, in dollars?`,
				`ALFA 为 ${usd(CHECKPOINT_ALFA)}，它 10月18日 的期权隐含波动率为 ${IV}%，还剩 ${DAYS} 天。到 10月18日 的一个标准差变动是多少美元？`,
			],
			choices: [
				{
					id: "right",
					label: [
						usd(Math.round(oneSd(DAYS) * 100)),
						usd(Math.round(oneSd(DAYS) * 100)),
					],
				},
				{
					id: "year",
					label: [usd(Math.round(SPOT * IV)), usd(Math.round(SPOT * IV))],
				},
				{
					id: "linear",
					label: [
						usd(Math.round(SPOT * IV * (DAYS / 365))),
						usd(Math.round(SPOT * IV * (DAYS / 365))),
					],
				},
			],
			answer: "right",
			entry: {
				answer: Math.round(oneSd(DAYS) * 100) / 100,
				tolerance: 0.1,
				prefix: "$",
			},
			revealAt: 2,
			explain: [
				`${usd(CHECKPOINT_ALFA)} × ${IV}% × √(${DAYS} ÷ 365) ≈ ${usd(Math.round(oneSd(DAYS) * 100))}. Scale by the square root of the time, not the time itself.`,
				`${usd(CHECKPOINT_ALFA)} × ${IV}% × √(${DAYS} ÷ 365) ≈ ${usd(Math.round(oneSd(DAYS) * 100))}。要按时间的平方根缩放，而不是按时间本身。`,
			],
		},
		beats: [
			{
				id: "inputs",
				label: ["Inputs", "输入"],
				caption: [
					"ALFA's price, its options' IV, and the days left.",
					"ALFA 的价格、期权的 IV 和剩余天数。",
				],
				state: { stage: 0, days: DAYS },
			},
			{
				id: "scale",
				label: ["Scale", "缩放"],
				caption: [
					`A year's move is ${usd(Math.round(SPOT * IV))}; ${DAYS} days scale it by √(${DAYS} ÷ 365) ≈ ${Math.sqrt(DAYS / 365).toFixed(3)}.`,
					`一年的变动是 ${usd(Math.round(SPOT * IV))}；${DAYS} 天要乘以 √(${DAYS} ÷ 365) ≈ ${Math.sqrt(DAYS / 365).toFixed(3)}。`,
				],
				state: { stage: 1, days: DAYS },
			},
			{
				id: "move",
				label: ["The move", "变动"],
				caption: [
					`One standard deviation: about ±${usd(Math.round(oneSd(DAYS) * 100))}. About two times in three, under the model, ALFA ends inside.`,
					`一个标准差：约 ±${usd(Math.round(oneSd(DAYS) * 100))}。按模型，大约三次中有两次 ALFA 收在区间内。`,
				],
				state: { stage: 2, days: DAYS },
			},
		],
		explore: {
			prompt: ["Change the days left.", "改变剩余天数。"],
			start: () => ({ stage: 2, days: DAYS }),
			task: {
				kind: "reach",
				prompt: [
					`Find the days left at which the move is half of the ${DAYS}-day move.`,
					`找出变动正好是 ${DAYS} 天变动一半时的剩余天数。`,
				],
				reached: (e) => e.days === DAYS / 4,
				done: [
					`${DAYS / 4} days, a quarter of the time, gives half the move: ±${usd(Math.round(oneSd(DAYS / 4) * 100))}. That's the square root at work.`,
					`${DAYS / 4} 天，也就是四分之一的时间，对应一半的变动：±${usd(Math.round(oneSd(DAYS / 4) * 100))}。这就是平方根的作用。`,
				],
			},
		},
		View: MoveView,
	}),
	defineScene<RankState, RankState>({
		id: "rank",
		label: ["IV rank", "IV Rank"],
		title: [
			"Rank is a place in the range; percentile is a count",
			"Rank 是区间中的位置，百分位是计数",
		],
		revisit: "iv-rank-percentile",
		predict: {
			prompt: [
				`ALFA's past IV30 readings: ${HISTORY.join("%, ")}%. Today it's ${TODAY}%. What is today's IV rank, in percent?`,
				`ALFA 过去的 IV30 读数：${HISTORY.join("%、")}%。今天是 ${TODAY}%。今天的 IV Rank 是百分之几？`,
			],
			choices: [
				{
					id: "rank",
					label: [
						`${measures(false).rank.toFixed(0)}%`,
						`${measures(false).rank.toFixed(0)}%`,
					],
				},
				{
					id: "pct",
					label: [
						`${measures(false).percentile.toFixed(0)}%`,
						`${measures(false).percentile.toFixed(0)}%`,
					],
				},
				{ id: "iv", label: [`${TODAY}%`, `${TODAY}%`] },
			],
			answer: "rank",
			entry: { answer: measures(false).rank, tolerance: 0.5, unit: ["%", "%"] },
			revealAt: 1,
			explain: [
				`(${TODAY} − 22) ÷ (52 − 22) = ${measures(false).rank.toFixed(0)}%. The percentile is different: 5 of 7 readings are below today, ${measures(false).percentile.toFixed(0)}%.`,
				`(${TODAY} − 22) ÷ (52 − 22) = ${measures(false).rank.toFixed(0)}%。百分位不同：7 个读数中有 5 个低于今天，${measures(false).percentile.toFixed(0)}%。`,
			],
		},
		beats: [
			{
				id: "sample",
				label: ["The sample", "样本"],
				caption: [
					"Seven past readings, a short sample for practice, and today's 34%.",
					"七个过去的读数（练习用的短样本），以及今天的 34%。",
				],
				state: { stage: 0, drop: false },
			},
			{
				id: "rank",
				label: ["Rank", "Rank"],
				caption: [
					`Rank places today between the low and high: ${measures(false).rank.toFixed(0)}%.`,
					`Rank 把今天放在最低和最高之间：${measures(false).rank.toFixed(0)}%。`,
				],
				state: { stage: 1, drop: false },
			},
			{
				id: "percentile",
				label: ["Percentile", "百分位"],
				caption: [
					`Percentile counts readings below today: 5 of 7, ${measures(false).percentile.toFixed(0)}%. One high reading drags rank down much more.`,
					`百分位数的是低于今天的读数：7 个中有 5 个，${measures(false).percentile.toFixed(0)}%。一个极高的读数对 Rank 的拉低要大得多。`,
				],
				state: { stage: 2, drop: false },
			},
		],
		explore: {
			prompt: ["Keep or drop the 52% reading.", "保留或去掉 52% 的读数。"],
			start: () => ({ stage: 2, drop: false }),
			task: {
				kind: "answer",
				prompt: [
					"Drop the 52% reading. Which number moves more?",
					"去掉 52% 的读数。哪个数变化更大？",
				],
				choices: [
					{ id: "rank", label: ["IV rank", "IV Rank"] },
					{ id: "pct", label: ["IV percentile", "IV 百分位"] },
					{ id: "same", label: ["They move the same", "变化一样"] },
				],
				answer: "rank",
				done: [
					`Rank jumps from ${measures(false).rank.toFixed(0)}% to ${measures(true).rank.toFixed(0)}% because the top of the range falls to 36%; percentile only goes from ${measures(false).percentile.toFixed(0)}% to ${measures(true).percentile.toFixed(0)}%.`,
					`Rank 从 ${measures(false).rank.toFixed(0)}% 跳到 ${measures(true).rank.toFixed(0)}%，因为区间顶端降到了 36%；百分位只从 ${measures(false).percentile.toFixed(0)}% 变到 ${measures(true).percentile.toFixed(0)}%。`,
				],
			},
		},
		View: RankView,
	}),
	defineScene<CloseState, CloseState>({
		id: "close",
		label: ["At the close", "收盘时"],
		title: [
			"On its last day, only intrinsic value is left",
			"在最后一天，只剩内在价值",
		],
		revisit: "zero-dte",
		predict: {
			prompt: [
				"Fri Oct 4, 3:00 pm: the Oct 4 104 call has an hour left with ALFA at $104.00. ALFA closes at $104.30. What is the call worth at the close, per share?",
				"10月4日 周五下午 3:00：ALFA 为 $104.00，10月4日 104 看涨还剩一小时。ALFA 收在 $104.30。收盘时这张看涨每股值多少？",
			],
			choices: [
				{ id: "right", label: [usd(valueAt(CLOSE)), usd(valueAt(CLOSE))] },
				{ id: "zero", label: ["$0: it was at the money", "$0：它是平值"] },
				{
					id: "more",
					label: ["More: it still has time value", "更多：它还有时间价值"],
				},
			],
			answer: "right",
			entry: { answer: valueAt(CLOSE) / 100, tolerance: 0.01, prefix: "$" },
			revealAt: 2,
			explain: [
				"At the close no time is left, so the call is worth exactly ALFA minus $104: $0.30. Being in the money by $0.01 or more, it's exercised into 100 shares.",
				"收盘时没有时间了，所以看涨正好值 ALFA 减 $104：$0.30。实值 $0.01 或以上，它会被行权，变成 100 股。",
			],
		},
		beats: [
			{
				id: "hour",
				label: ["An hour left", "还剩一小时"],
				caption: [
					"At 3:00 pm ALFA sits right at the strike, and the call is all time value.",
					"下午 3:00，ALFA 正好在行权价上，这张看涨全是时间价值。",
				],
				state: { stage: 0, close: CLOSE },
			},
			{
				id: "close",
				label: ["The close", "收盘"],
				caption: [
					"At 4:00 pm the time value is gone. Only how far ALFA finished above $104 counts.",
					"下午 4:00 时间价值归零。只有 ALFA 收在 $104 以上多少才算数。",
				],
				state: { stage: 1, close: CLOSE },
			},
			{
				id: "value",
				label: ["Its value", "价值"],
				caption: [
					"ALFA closes at $104.30: the call is worth $0.30 and is exercised into 100 shares at $104.",
					"ALFA 收在 $104.30：看涨值 $0.30，并被行权，以 $104 变成 100 股。",
				],
				state: { stage: 2, close: CLOSE },
			},
		],
		explore: {
			prompt: ["Move ALFA's closing price.", "移动 ALFA 的收盘价。"],
			start: () => ({ stage: 2, close: CLOSE }),
			task: {
				kind: "reach",
				prompt: [
					"Find the highest close at which the call expires worthless.",
					"找出看涨到期作废的最高收盘价。",
				],
				reached: (e) => e.close === STRIKE * 100,
				done: [
					"At exactly $104.00 it's worth nothing and isn't exercised. Ten cents higher and it's worth $0.10 and becomes 100 shares. On the last day, cents decide the outcome.",
					"正好 $104.00 时它一文不值，不会被行权。再高 10 美分，它就值 $0.10，并变成 100 股。在最后一天，几美分就决定结果。",
				],
			},
		},
		View: CloseView,
	}),
] as const;

export function CheckpointExposureWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="checkpoint-exposure"
			label={[
				"Checkpoint for Greeks, volatility and exposure",
				"“希腊值、波动率与敞口”检查点",
			]}
			scenes={scenes}
			review
		/>
	);
}
