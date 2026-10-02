import {
	type Contract,
	type Copy,
	count,
	modelValue,
	pick,
	quoteAt,
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
const twoColumns = (t: (value: Copy) => string) => [
	{ label: t(["Field", "项目"]), share: 0.52 },
	{ label: t(["Value", "数值"]), share: 0.48, align: "end" as const },
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
const share = (dollars: number) => usd(Math.round(dollars * 100));

// ——— Scene 1: what contracts cost ———

type UnitsState = { stage: 0 | 1 | 2; contracts: number };

const PUT_95: Contract = { expiry: "nov15", strike: 95, right: "put" };
const PUT_QUOTE = quoteAt(PUT_95, CHECKPOINT_ALFA, CHECKPOINT_DATE);
const cost = (contracts: number) => PUT_QUOTE.ask * 100 * contracts;
const OVER_1000 =
	Array.from({ length: 10 }, (_, i) => i + 1).find(
		(contracts) => cost(contracts) > 100_000,
	) ?? 10;

function UnitsView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: UnitsState;
	explore: UnitsState | null;
	setExplore: (next: UnitsState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	// A phone has room for the quote's label only without its spaces.
	const rows = (narrow: boolean): TapeRow[] => [
		row("a", t(["Underlying", "标的"]), "ALFA"),
		row(
			"b",
			t(["Expiry · type", "到期日 · 类型"]),
			t(["Nov 15 · put", "11月15日 · 看跌"]),
		),
		row("c", t(["Strike", "行权价"]), "$95"),
		row(
			"d",
			t([
				narrow ? "Bid/ask per share" : "Bid / ask, per share",
				"买价 / 卖价，每股",
			]),
			`${usd(PUT_QUOTE.bid)} / ${usd(PUT_QUOTE.ask)}`,
		),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`one contract: ${usd(PUT_QUOTE.ask)} × 100 shares = ${usd(cost(1), 0)}`,
				`一张：${usd(PUT_QUOTE.ask)} × 100 股 = ${usd(cost(1), 0)}`,
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`${shown.contracts} contracts: ${shown.contracts} × ${usd(cost(1), 0)} = ${usd(cost(shown.contracts), 0)}`,
				`${shown.contracts} 张：${shown.contracts} × ${usd(cost(1), 0)} = ${usd(cost(shown.contracts), 0)}`,
			]),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"The ALFA Nov 15 95 put's defining facts and quote on the checkpoint day, and what contracts cost",
						"检查点当天 ALFA 11月15日 95 看跌的定义要素和报价，以及买入合约的成本",
					])}
					lineSlots={2}
					title={t([
						`The contract · ${CHECKPOINT_DAY[0]}`,
						`合约 · ${CHECKPOINT_DAY[1]}`,
					])}
					columns={twoColumns(t)}
					rows={(width) => rows(width < 520)}
					maxRows={4}
					lines={lines}
				/>
			}
			result={[
				{
					id: "cost",
					label: t([
						`${shown.contracts} contracts at the ask`,
						`按卖价买 ${shown.contracts} 张`,
					]),
					value: usd(cost(shown.contracts), 0),
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["Contracts", "张数"])}
						value={explore.contracts}
						display={String(explore.contracts)}
						min={1}
						max={10}
						onChange={(contracts) => setExplore({ ...explore, contracts })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 2: assignment on a short put ———

type RightsState = { stage: 0 | 1 | 2; short: "puts" | "calls" };

const ASSIGNED = 3;
const SHORT_PUT = 95;
const SHORT_CALL = 105;

function RightsView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: RightsState;
	explore: RightsState | null;
	setExplore: (next: RightsState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const puts = shown.short === "puts";
	const strike = puts ? SHORT_PUT : SHORT_CALL;
	const cash = strike * 100 * ASSIGNED;
	// On a phone the labels shorten so each value keeps its size.
	const rows = (narrow: boolean): TapeRow[] => [
		row(
			"a",
			t([narrow ? "Position" : "Your position", "你的持仓"]),
			t(
				puts
					? [
							`short ${ASSIGNED} Nov 15 95 puts`,
							`空头 ${ASSIGNED} 张 11月15日 95 看跌`,
						]
					: [
							`short ${ASSIGNED} Nov 15 105 calls`,
							`空头 ${ASSIGNED} 张 11月15日 105 看涨`,
						],
			),
		),
		row(
			"b",
			t(["Settles in", "交割方式"]),
			t([
				narrow ? "100 shares each" : "shares, 100 a contract",
				"股票，每张 100 股",
			]),
		),
		row(
			"c",
			t([narrow ? "Holder's right" : "The holder's right", "持有人的权利"]),
			t(
				puts
					? ["to sell at $95", "按 $95 卖出"]
					: ["to buy at $105", "按 $105 买入"],
			),
		),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t(
				puts
					? [
							"assigned: you must buy what the holder sells",
							"被指派：持有人卖出，你必须买入",
						]
					: [
							"assigned: you must sell what the holder buys",
							"被指派：持有人买入，你必须卖出",
						],
			),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`${puts ? "pay" : "receive"} $${strike} × 100 × ${ASSIGNED} = ${usd(cash * 100, 0)} for ${count(ASSIGNED * 100)} shares`,
				`${puts ? "支付" : "收到"} $${strike} × 100 × ${ASSIGNED} = ${usd(cash * 100, 0)}，对应 ${count(ASSIGNED * 100)} 股`,
			]),
			tone: puts ? "loss" : "gain",
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"A short option position that gets assigned, and the cash and shares that move",
						"一个被指派的期权空头持仓，以及随之转移的现金和股票",
					])}
					lineSlots={2}
					title={t(["Assignment notice", "指派通知"])}
					columns={twoColumns(t)}
					rows={(width) => rows(width < 520)}
					maxRows={3}
					lines={lines}
				/>
			}
			result={[
				{
					id: "cash",
					label: puts ? t(["You pay", "你支付"]) : t(["You receive", "你收到"]),
					value: usd(cash * 100, 0),
					note: t(
						puts
							? [
									`and receive ${count(ASSIGNED * 100)} shares`,
									`并收到 ${count(ASSIGNED * 100)} 股`,
								]
							: [
									`and deliver ${count(ASSIGNED * 100)} shares`,
									`并交付 ${count(ASSIGNED * 100)} 股`,
								],
					),
					tone: puts ? "loss" : "gain",
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["You're short", "你做空的是"])}
						value={explore.short}
						options={[
							["puts", t(["95 puts", "95 看跌"])],
							["calls", t(["105 calls", "105 看涨"])],
						]}
						onChange={(short) => setExplore({ ...explore, short })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 3: price a put from its call ———

type ParityState = { stage: 0 | 1 | 2; spot: number };

const CALL_100: Contract = { expiry: "nov15", strike: 100, right: "call" };
const PUT_100: Contract = { expiry: "nov15", strike: 100, right: "put" };
const mid = (contract: Contract, spot: number) =>
	Math.round(
		modelValue(contract, Math.round(spot * 100), CHECKPOINT_DATE).price * 100,
	) / 100;
const SPOT = CHECKPOINT_ALFA / 100;
const CALL_MID = mid(CALL_100, SPOT);
const PUT_MID = mid(PUT_100, SPOT);
const PUT_DEARER = [...Array.from({ length: 13 }, (_, i) => 96 + i)]
	.reverse()
	.find((spot) => mid(PUT_100, spot) > mid(CALL_100, spot));

function ParityView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ParityState;
	explore: ParityState | null;
	setExplore: (next: ParityState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const call = mid(CALL_100, shown.spot);
	const put = mid(PUT_100, shown.spot);
	const rows: TapeRow[] = [
		row("a", t(["ALFA", "ALFA"]), share(shown.spot)),
		row(
			"b",
			t(["Nov 15 100 call, mid", "11月15日 100 看涨中间价"]),
			share(call),
		),
		row(
			"c",
			t(["Nov 15 100 put, mid", "11月15日 100 看跌中间价"]),
			shown.stage >= 2 ? share(put) : "?",
			shown.stage < 2,
		),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`C − P = S − K = ${share(shown.spot)} − $100 = ${share(shown.spot - 100)}`,
				`C − P = S − K = ${share(shown.spot)} − $100 = ${share(shown.spot - 100)}`,
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`P = ${share(call)} − ${share(shown.spot - 100)} = ${share(put)}`,
				`P = ${share(call)} − ${share(shown.spot - 100)} = ${share(put)}`,
			]),
			tone: "strong",
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"The Nov 15 100 call and put on the checkpoint day, priced against each other with put-call parity",
						"检查点当天的 11月15日 100 看涨与看跌，用看涨看跌平价相互定价",
					])}
					lineSlots={2}
					title={t([
						`Model mids · no rates or dividends · ${CHECKPOINT_DAY[0]}`,
						`模型中间价 · 无利息与股息 · ${CHECKPOINT_DAY[1]}`,
					])}
					columns={twoColumns(t)}
					rows={rows}
					maxRows={3}
					lines={lines}
				/>
			}
			result={[
				{
					id: "call",
					label: t(["Call", "看涨"]),
					value: share(call),
					evidence: "modeled",
				},
				{
					id: "put",
					label: t(["Put", "看跌"]),
					value: share(put),
					evidence: "modeled",
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["ALFA", "ALFA"])}
						value={explore.spot}
						display={`$${explore.spot}`}
						min={96}
						max={108}
						onChange={(spot) => setExplore({ ...explore, spot })}
					/>
				) : null
			}
		/>
	);
}

// ——— Scene 4: cash settlement ———

type SettleState = { stage: 0 | 1 | 2; against: "official" | "last" };

const INDEX_STRIKE = 5_100;
const OFFICIAL = 5_062;
const LAST = 5_055;
const PER_POINT = 100;

function SettleView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SettleState;
	explore: SettleState | null;
	setExplore: (next: SettleState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const level = shown.against === "official" ? OFFICIAL : LAST;
	const paid = Math.max(INDEX_STRIKE - level, 0) * PER_POINT;
	const rows: TapeRow[] = [
		row(
			"a",
			t(["IDX 500 Oct 18 put, strike", "IDX 500 10月18日 看跌，行权价"]),
			count(INDEX_STRIKE),
		),
		row(
			"b",
			t(["Official settlement value", "官方结算值"]),
			count(OFFICIAL),
			shown.against !== "official",
		),
		row(
			"c",
			t(["Last index level shown", "最近显示的指数"]),
			count(LAST),
			shown.against === "official",
		),
		row("d", t(["Per index point", "每个指数点"]), `$${PER_POINT}`),
	];
	const lines: SheetLine[] = [];
	if (shown.stage >= 1)
		lines.push({
			text: t([
				`${count(INDEX_STRIKE)} − ${count(level)} = ${count(INDEX_STRIKE - level)} points`,
				`${count(INDEX_STRIKE)} − ${count(level)} = ${count(INDEX_STRIKE - level)} 点`,
			]),
		});
	if (shown.stage >= 2)
		lines.push({
			text: t([
				`${count(INDEX_STRIKE - level)} × $${PER_POINT} = ${usd(paid * 100, 0)} in cash, no shares`,
				`${count(INDEX_STRIKE - level)} × $${PER_POINT} = 现金 ${usd(paid * 100, 0)}，不交付股票`,
			]),
			tone: shown.against === "official" ? "gain" : "loss",
		});
	return (
		<SceneFrame
			stage={
				<SheetStage
					label={t([
						"A cash-settled index put at expiry: its strike, the official settlement value and the last level shown",
						"到期的现金结算指数看跌：行权价、官方结算值和最近显示的指数",
					])}
					lineSlots={2}
					title={t(["Settlement · Oct 18", "结算 · 10月18日"])}
					columns={twoColumns(t)}
					rows={rows}
					maxRows={4}
					lines={lines}
				/>
			}
			result={[
				{
					id: "paid",
					label:
						shown.against === "official"
							? t(["Paid, against the official value", "按官方结算值支付"])
							: t([
									"Against the last level: not how it settles",
									"按最近指数：并非结算方式",
								]),
					value: usd(paid * 100, 0),
					tone: shown.against === "official" ? "gain" : "loss",
					evidence: "calculated",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Settle against", "结算依据"])}
						value={explore.against}
						options={[
							["official", t(["Official value", "官方结算值"])],
							["last", t(["Last level shown", "最近显示的指数"])],
						]}
						onChange={(against) => setExplore({ ...explore, against })}
					/>
				) : null
			}
		/>
	);
}

// ——— Checkpoint ———

const scenes = [
	defineScene<UnitsState, UnitsState>({
		id: "units",
		label: ["What it costs", "成本"],
		title: [
			"A quote is per share; a contract is 100 shares",
			"报价按每股，一张合约是 100 股",
		],
		revisit: "option-contracts",
		predict: {
			prompt: [
				`On ${CHECKPOINT_DAY[0]} the ALFA Nov 15 95 put is quoted ${usd(PUT_QUOTE.bid)} bid, ${usd(PUT_QUOTE.ask)} ask. What do 4 contracts cost at the ask?`,
				`${CHECKPOINT_DAY[1]}，ALFA 11月15日 95 看跌报价为买价 ${usd(PUT_QUOTE.bid)}、卖价 ${usd(PUT_QUOTE.ask)}。按卖价买 4 张要多少钱？`,
			],
			choices: [
				{ id: "right", label: [usd(cost(4), 0), usd(cost(4), 0)] },
				{
					id: "share",
					label: [usd(PUT_QUOTE.ask * 4), usd(PUT_QUOTE.ask * 4)],
				},
				{ id: "one", label: [usd(cost(1), 0), usd(cost(1), 0)] },
			],
			answer: "right",
			entry: { answer: cost(4) / 100, tolerance: 0.5, prefix: "$" },
			revealAt: 2,
			explain: [
				`${usd(PUT_QUOTE.ask)} a share × 100 shares = ${usd(cost(1), 0)} a contract, × 4 = ${usd(cost(4), 0)}.`,
				`每股 ${usd(PUT_QUOTE.ask)} × 100 股 = 每张 ${usd(cost(1), 0)}，× 4 = ${usd(cost(4), 0)}。`,
			],
		},
		beats: [
			{
				id: "contract",
				label: ["The contract", "合约"],
				caption: [
					"Four facts name it: ALFA, Nov 15, put, $95. Its quote is per share.",
					"四个要素确定它：ALFA、11月15日、看跌、$95。它的报价按每股计。",
				],
				state: { stage: 0, contracts: 4 },
			},
			{
				id: "one",
				label: ["One contract", "一张"],
				caption: [
					`One contract covers 100 shares: ${usd(PUT_QUOTE.ask)} × 100 = ${usd(cost(1), 0)}.`,
					`一张合约对应 100 股：${usd(PUT_QUOTE.ask)} × 100 = ${usd(cost(1), 0)}。`,
				],
				state: { stage: 1, contracts: 4 },
			},
			{
				id: "four",
				label: ["Four", "四张"],
				caption: [
					`Four contracts: ${usd(cost(4), 0)}, for the right to sell 400 shares at $95.`,
					`四张：${usd(cost(4), 0)}，买到按 $95 卖出 400 股的权利。`,
				],
				state: { stage: 2, contracts: 4 },
			},
		],
		explore: {
			prompt: ["Change the number of contracts.", "改变合约张数。"],
			start: () => ({ stage: 2, contracts: 4 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the fewest contracts that cost more than $1,000.",
					"找出成本超过 $1,000 的最少张数。",
				],
				reached: (e) => e.contracts === OVER_1000,
				done: [
					`${OVER_1000} contracts cost ${usd(cost(OVER_1000), 0)}; ${OVER_1000 - 1} cost ${usd(cost(OVER_1000 - 1), 0)}. Multiply by 100 once, for the shares, and once more for the contracts.`,
					`${OVER_1000} 张要 ${usd(cost(OVER_1000), 0)}；${OVER_1000 - 1} 张是 ${usd(cost(OVER_1000 - 1), 0)}。先乘 100 股，再乘张数。`,
				],
			},
		},
		View: UnitsView,
	}),
	defineScene<RightsState, RightsState>({
		id: "rights",
		label: ["Assigned", "被指派"],
		title: [
			"Assignment turns a short option into a trade in shares",
			"指派让期权空头变成股票交易",
		],
		revisit: "option-rights",
		predict: {
			prompt: [
				`You're short ${ASSIGNED} ALFA Nov 15 95 puts, settled in shares, and you're assigned. How much cash do you pay?`,
				`你做空了 ${ASSIGNED} 张以股票交割的 ALFA 11月15日 95 看跌，现在被指派了。你要支付多少现金？`,
			],
			choices: [
				{
					id: "pay",
					label: [
						usd(SHORT_PUT * 100 * ASSIGNED * 100, 0),
						usd(SHORT_PUT * 100 * ASSIGNED * 100, 0),
					],
				},
				{ id: "receive", label: ["$0: you receive cash", "$0：你会收到现金"] },
				{
					id: "premium",
					label: [usd(cost(ASSIGNED), 0), usd(cost(ASSIGNED), 0)],
				},
			],
			answer: "pay",
			entry: { answer: SHORT_PUT * 100 * ASSIGNED, prefix: "$" },
			revealAt: 2,
			explain: [
				`The put's holder may sell at $95, so you, the writer, must buy: $95 × 100 × ${ASSIGNED} = ${usd(SHORT_PUT * 100 * ASSIGNED * 100, 0)} for ${ASSIGNED * 100} shares.`,
				`看跌的持有人可以按 $95 卖出，所以作为义务方的你必须买入：$95 × 100 × ${ASSIGNED} = ${usd(SHORT_PUT * 100 * ASSIGNED * 100, 0)}，买入 ${ASSIGNED * 100} 股。`,
			],
		},
		beats: [
			{
				id: "position",
				label: ["The position", "持仓"],
				caption: [
					`You're short ${ASSIGNED} Nov 15 95 puts. Their holders have the right to sell ALFA to someone short at $95.`,
					`你做空 ${ASSIGNED} 张 11月15日 95 看跌。它们的持有人有权按 $95 把 ALFA 卖给空头。`,
				],
				state: { stage: 0, short: "puts" },
			},
			{
				id: "assigned",
				label: ["Assigned", "被指派"],
				caption: [
					"An exercise notice is assigned to you: you must buy the shares the holder sells.",
					"一份行权通知指派给了你：你必须买入持有人卖出的股票。",
				],
				state: { stage: 1, short: "puts" },
			},
			{
				id: "cash",
				label: ["The cash", "现金"],
				caption: [
					`You pay ${usd(SHORT_PUT * 100 * ASSIGNED * 100, 0)} and receive ${ASSIGNED * 100} ALFA shares, whatever ALFA trades at.`,
					`你支付 ${usd(SHORT_PUT * 100 * ASSIGNED * 100, 0)}，收到 ${ASSIGNED * 100} 股 ALFA，不管 ALFA 当时价格多少。`,
				],
				state: { stage: 2, short: "puts" },
			},
		],
		explore: {
			prompt: [
				"Switch between short puts and short calls.",
				"在看跌空头与看涨空头之间切换。",
			],
			start: () => ({ stage: 2, short: "puts" }),
			task: {
				kind: "answer",
				prompt: [
					`Short ${ASSIGNED} Nov 15 105 calls instead and assigned, what do you do?`,
					`如果改为做空 ${ASSIGNED} 张 11月15日 105 看涨并被指派，你要做什么？`,
				],
				choices: [
					{
						id: "deliver",
						label: [
							`Deliver ${ASSIGNED * 100} shares and receive $31,500`,
							`交付 ${ASSIGNED * 100} 股，收到 $31,500`,
						],
					},
					{
						id: "buy",
						label: [
							`Buy ${ASSIGNED * 100} shares at $105`,
							`按 $105 买入 ${ASSIGNED * 100} 股`,
						],
					},
					{ id: "premium", label: ["Pay back the premium", "退还权利金"] },
				],
				answer: "deliver",
				done: [
					"A call's holder may buy at $105, so its writer must sell: deliver 300 shares and receive $105 × 300 = $31,500. A put writer buys; a call writer sells.",
					"看涨的持有人可以按 $105 买入，所以义务方必须卖出：交付 300 股，收到 $105 × 300 = $31,500。看跌义务方买入，看涨义务方卖出。",
				],
			},
		},
		View: RightsView,
	}),
	defineScene<ParityState, ParityState>({
		id: "parity",
		label: ["Price the put", "为看跌定价"],
		title: [
			"Call minus put equals stock minus strike",
			"看涨减看跌，等于股价减行权价",
		],
		revisit: "put-call-parity",
		predict: {
			prompt: [
				`ALFA is ${share(SPOT)} and the Nov 15 100 call's mid is ${share(CALL_MID)}. With no rates or dividends, what should the Nov 15 100 put's mid be?`,
				`ALFA 为 ${share(SPOT)}，11月15日 100 看涨的中间价为 ${share(CALL_MID)}。没有利息和股息时，11月15日 100 看跌的中间价应该是多少？`,
			],
			choices: [
				{ id: "parity", label: [share(PUT_MID), share(PUT_MID)] },
				{ id: "same", label: [share(CALL_MID), share(CALL_MID)] },
				{
					id: "added",
					label: [share(CALL_MID + SPOT - 100), share(CALL_MID + SPOT - 100)],
				},
			],
			answer: "parity",
			entry: { answer: PUT_MID, tolerance: 0.02, prefix: "$" },
			revealAt: 2,
			explain: [
				`C − P = S − K: ${share(CALL_MID)} − P = ${share(SPOT)} − $100 = ${share(SPOT - 100)}, so P = ${share(PUT_MID)}.`,
				`C − P = S − K：${share(CALL_MID)} − P = ${share(SPOT)} − $100 = ${share(SPOT - 100)}，所以 P = ${share(PUT_MID)}。`,
			],
		},
		beats: [
			{
				id: "pair",
				label: ["The pair", "这一组"],
				caption: [
					`ALFA ${share(SPOT)}; the Nov 15 100 call's model mid is ${share(CALL_MID)}. The put is the unknown.`,
					`ALFA ${share(SPOT)}；11月15日 100 看涨的模型中间价为 ${share(CALL_MID)}。看跌是未知数。`,
				],
				state: { stage: 0, spot: SPOT },
			},
			{
				id: "rule",
				label: ["Parity", "平价"],
				caption: [
					`Call minus put must equal ALFA minus the strike: ${share(SPOT - 100)}.`,
					`看涨减看跌必须等于 ALFA 减行权价：${share(SPOT - 100)}。`,
				],
				state: { stage: 1, spot: SPOT },
			},
			{
				id: "put",
				label: ["The put", "看跌"],
				caption: [
					`So the put is ${share(CALL_MID)} − ${share(SPOT - 100)} = ${share(PUT_MID)}.`,
					`所以看跌为 ${share(CALL_MID)} − ${share(SPOT - 100)} = ${share(PUT_MID)}。`,
				],
				state: { stage: 2, spot: SPOT },
			},
		],
		explore: {
			prompt: ["Move ALFA and watch both mids.", "移动 ALFA，观察两个中间价。"],
			start: () => ({ stage: 2, spot: 104 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the highest whole-dollar price at which the put costs more than the call.",
					"找出看跌比看涨更贵的最高整数美元价格。",
				],
				reached: (e) => e.spot === PUT_DEARER,
				done: [
					`At $${PUT_DEARER} ALFA is below the strike, so call minus put is negative: the put is dearer. At $100 they're equal.`,
					`$${PUT_DEARER} 时 ALFA 低于行权价，所以看涨减看跌为负：看跌更贵。$100 时两者相等。`,
				],
			},
		},
		View: ParityView,
	}),
	defineScene<SettleState, SettleState>({
		id: "settle",
		label: ["Cash settlement", "现金结算"],
		title: [
			"An index option settles in cash, at the official value",
			"指数期权按官方结算值以现金结算",
		],
		revisit: "expiration-settlement",
		predict: {
			prompt: [
				`Your IDX 500 Oct 18 5,100 put settles at an official ${count(OFFICIAL)}, though the index last showed ${count(LAST)}. At $100 a point, what are you paid?`,
				`你的 IDX 500 10月18日 5,100 看跌官方结算值为 ${count(OFFICIAL)}，而指数最近显示为 ${count(LAST)}。每点 $100，你会收到多少？`,
			],
			choices: [
				{
					id: "official",
					label: [
						usd((INDEX_STRIKE - OFFICIAL) * PER_POINT * 100, 0),
						usd((INDEX_STRIKE - OFFICIAL) * PER_POINT * 100, 0),
					],
				},
				{
					id: "last",
					label: [
						usd((INDEX_STRIKE - LAST) * PER_POINT * 100, 0),
						usd((INDEX_STRIKE - LAST) * PER_POINT * 100, 0),
					],
				},
				{ id: "shares", label: ["100 index shares", "100 股指数"] },
			],
			answer: "official",
			entry: { answer: (INDEX_STRIKE - OFFICIAL) * PER_POINT, prefix: "$" },
			revealAt: 2,
			explain: [
				`The official value sets it: (${count(INDEX_STRIKE)} − ${count(OFFICIAL)}) × $100 = ${usd((INDEX_STRIKE - OFFICIAL) * PER_POINT * 100, 0)}, in cash. The last level shown doesn't count.`,
				`由官方结算值决定：(${count(INDEX_STRIKE)} − ${count(OFFICIAL)}) × $100 = ${usd((INDEX_STRIKE - OFFICIAL) * PER_POINT * 100, 0)}，以现金支付。最近显示的指数不算数。`,
			],
		},
		beats: [
			{
				id: "terms",
				label: ["The terms", "条款"],
				caption: [
					"An IDX 500 put settles in cash at $100 per point, against the official settlement value.",
					"IDX 500 看跌以现金结算，每点 $100，依据官方结算值。",
				],
				state: { stage: 0, against: "official" },
			},
			{
				id: "points",
				label: ["The points", "点数"],
				caption: [
					`${count(INDEX_STRIKE)} − ${count(OFFICIAL)} = ${INDEX_STRIKE - OFFICIAL} points in the money.`,
					`${count(INDEX_STRIKE)} − ${count(OFFICIAL)} = 实值 ${INDEX_STRIKE - OFFICIAL} 点。`,
				],
				state: { stage: 1, against: "official" },
			},
			{
				id: "paid",
				label: ["Paid", "支付"],
				caption: [
					`${INDEX_STRIKE - OFFICIAL} × $100 = ${usd((INDEX_STRIKE - OFFICIAL) * PER_POINT * 100, 0)} in cash. No shares move.`,
					`${INDEX_STRIKE - OFFICIAL} × $100 = 现金 ${usd((INDEX_STRIKE - OFFICIAL) * PER_POINT * 100, 0)}。不交付任何股票。`,
				],
				state: { stage: 2, against: "official" },
			},
		],
		explore: {
			prompt: ["Choose which value to settle against.", "选择结算依据的数值。"],
			start: () => ({ stage: 2, against: "last" }),
			task: {
				kind: "answer",
				prompt: [
					"Settled against the last level shown, how much would the payout be off?",
					"如果按最近显示的指数结算，支付金额会差多少？",
				],
				choices: [
					{ id: "seven", label: ["$700 too much", "多出 $700"] },
					{ id: "none", label: ["Not at all", "完全不差"] },
					{ id: "thirty", label: ["$3,800 too much", "多出 $3,800"] },
				],
				answer: "seven",
				done: [
					"The last level gives 45 points, $4,500, against 38 points, $3,800, at the official value: $700 too much. Only the value the terms name counts.",
					"按最近指数是 45 点，$4,500；按官方结算值是 38 点，$3,800：多出 $700。只有条款指定的数值才算数。",
				],
			},
		},
		View: SettleView,
	}),
] as const;

export function CheckpointContractsWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="checkpoint-contracts"
			label={["Checkpoint for contracts and money", "“合约与金额”检查点"]}
			scenes={scenes}
			review
		/>
	);
}
