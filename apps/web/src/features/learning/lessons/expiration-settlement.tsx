import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import {
	type Contract,
	type Copy,
	count,
	instruments,
	pick,
	quoteAt,
	signedUsd,
	usd,
	valueAtExpiry,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import type { AxisDrag } from "../walkthrough/axis-drag";
import {
	PRICE_LINE_HEIGHT,
	PriceLine,
} from "../walkthrough/instruments/price-line";
import {
	type FlowParty,
	type FlowTransfer,
	TransferFlow,
	transferFlowHeight,
} from "../walkthrough/instruments/transfer-flow";
import {
	type StackRow,
	stackHeight,
	ValueStack,
} from "../walkthrough/instruments/value-stack";
import { Label, Stage, useStage, useTeachMotion } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const CALL_95: Contract = { expiry: "oct18", strike: 95, right: "call" };
const CALL_100: Contract = { expiry: "oct18", strike: 100, right: "call" };
/** ALFA's price in the close-or-exercise and settlement scenes, in cents. */
const ALFA_AT = 10_200;
const INDEX = instruments.index;

// ——— Scene 1: close or exercise ———

type ExitDay = "oct4" | "oct11" | "oct18";
type ExitState = { day: ExitDay; exercise: boolean };

const exitDays: Record<ExitDay, { date: string; label: Copy }> = {
	oct4: { date: "2030-10-04", label: ["Fri Oct 4", "10月4日 周五"] },
	oct11: { date: "2030-10-11", label: ["Fri Oct 11", "10月11日 周五"] },
	oct18: { date: "2030-10-18", label: ["expiry day", "到期日"] },
};

/**
 * Cents per share for the Oct 18 95 call with ALFA at $102: the bid a seller gets, and the
 * intrinsic value an exercise captures. At expiry the call trades at intrinsic value.
 */
function exitValues(day: ExitDay) {
	const intrinsic = valueAtExpiry(CALL_95, ALFA_AT);
	const bid =
		day === "oct18"
			? intrinsic
			: quoteAt(CALL_95, ALFA_AT, exitDays[day].date).bid;
	return { intrinsic, bid, time: Math.max(bid - intrinsic, 0) };
}

const EXIT_TOP = 30;

function ExitView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ExitState;
	explore: ExitState | null;
	setExplore: (next: ExitState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const v = exitValues(shown.day);
	const rows: StackRow[] = [
		{
			id: "close",
			label: t(["Sell to close", "卖出平仓"]),
			parts: [
				{
					id: "intrinsic",
					label: usd(v.intrinsic),
					value: v.intrinsic,
					kind: "intrinsic",
				},
				{ id: "time", label: usd(v.time), value: v.time, kind: "time" },
			],
		},
		{
			id: "exercise",
			label: t(["Exercise", "行权"]),
			parts: [
				{
					id: "intrinsic",
					label: usd(v.intrinsic),
					value: v.intrinsic,
					kind: "intrinsic",
				},
				{ id: "time", label: usd(v.time), value: v.time, kind: "forfeit" },
			],
			hidden: !shown.exercise,
		},
	];
	const result: ResultItem[] = [
		{
			id: "close",
			label: t(["Sell to close", "卖出平仓"]),
			value: signedUsd(v.bid * 100, 0),
			note: t(["cash; no shares move", "现金，不涉及股票"]),
		},
	];
	if (shown.exercise)
		result.push(
			{
				id: "exercise",
				label: t(["Exercise", "行权"]),
				value: usd(v.intrinsic * 100, 0),
				note: t([
					"pay $9,500 for $10,200 of ALFA",
					"付 $9,500 换得价值 $10,200 的 ALFA",
				]),
			},
			{
				id: "difference",
				label: t(["Selling gets", "卖出多得"]),
				value: t([
					`${usd(v.time * 100, 0)} more`,
					`多 ${usd(v.time * 100, 0)}`,
				]),
				note:
					v.time > 0
						? t(["the time value exercise gives up", "行权放弃的时间价值"])
						: t(["no time value left", "已无时间价值"]),
				evidence: "calculated",
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"What selling the call gets compared with what exercising it gets, per share",
						"每股比较：卖出看涨所得与行权所得",
					])}
					height={EXIT_TOP + stackHeight(2)}
				>
					{(width) => (
						<g>
							<Label x={14} y={18} tone="muted">
								{t([
									`Oct 18 95 call · ${exitDays[shown.day].label[0]} · ALFA $102`,
									`10月18日 95 看涨 · ${exitDays[shown.day].label[1]} · ALFA $102`,
								])}
							</Label>
							<rect x={14} y={32} width={14} height={10} className="wt-long" />
							<Label x={34} y={41} tone="small">
								{t(["intrinsic", "内在价值"])}
							</Label>
							<rect
								x={112}
								y={32}
								width={14}
								height={10}
								className="wt-long-soft ev-modeled wt-stack-time"
							/>
							<Label x={132} y={41} tone="small">
								{t(["time value", "时间价值"])}
							</Label>
							<rect
								x={222}
								y={32}
								width={14}
								height={10}
								className="wt-ghost"
							/>
							<Label x={242} y={41} tone="small">
								{t(["given up", "被放弃"])}
							</Label>
							<g transform={`translate(0 ${EXIT_TOP})`}>
								<ValueStack
									width={width}
									rows={rows}
									max={800}
									focus={shown.exercise ? "exercise" : "close"}
								/>
							</g>
						</g>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Date", "日期"])}
						value={explore.day}
						options={(Object.keys(exitDays) as ExitDay[]).map((day) => [
							day,
							t(exitDays[day].label),
						])}
						onChange={(day) => setExplore({ ...explore, day })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Selling to close is a trade: the call passes to a buyer and you receive the bid. Exercising uses the right: you pay the strike and receive shares, capturing only the intrinsic value. While time value remains, selling usually gets more, which is also why early exercise is rare. Figures are before commissions and fees.",
						"卖出平仓是一笔交易：看涨转给买方，你收到买价。行权是使用权利：你支付行权价并收到股票，只拿到内在价值。只要还有时间价值，卖出通常更划算，这也是提前行权少见的原因。数字未含佣金和费用。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: shares or cash ———

type Product = "alfa" | "index";
type SettleStep = "terms" | "settle" | "reference";
type SettleState = { product: Product; step: SettleStep; level: number };

const INDEX_STRIKE = 5_000;
const INDEX_SETTLES = 5_025;
const INDEX_LAST = 5_030;

/** Cash-settled payout in cents for a settlement value in index points. */
const indexPayout = (level: number) =>
	Math.max(level - INDEX_STRIKE, 0) * INDEX.multiplier * 100;

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
	const alfa = shown.product === "alfa";
	const settled = shown.step !== "terms";
	/** ALFA in dollars, or the index settlement value in points. */
	const level = shown.level;
	const inMoney = alfa ? level > CALL_95.strike : level > INDEX_STRIKE;
	const payout = alfa ? 0 : indexPayout(level);
	const moves = settled && inMoney;
	const transfers: FlowTransfer[] = !moves
		? []
		: alfa
			? [
					{
						id: "cash",
						from: "you",
						to: "writer",
						label: "$9,500",
						kind: "cash",
					},
					{
						id: "shares",
						from: "writer",
						to: "you",
						label: "100 ALFA",
						kind: "shares",
					},
				]
			: [
					{
						id: "cash",
						from: "writer",
						to: "you",
						label: usd(payout, 0),
						kind: "cash",
					},
				];
	const parties: [FlowParty, FlowParty] = [
		{
			id: "you",
			name: t(["You", "你"]),
			role: alfa
				? t(["long ALFA 95 call", "ALFA 95 看涨多头"])
				: t(["long IDX 5,000 call", "IDX 5,000 看涨多头"]),
			holdings: !settled
				? alfa
					? [t(["settles in shares", "以股票交收"])]
					: [
							t(["settles in cash", "以现金结算"]),
							t(["$100 per point", "每点 $100"]),
						]
				: !moves
					? [t(["expires worthless", "到期作废"])]
					: alfa
						? [
								t(["paid $9,500", "支付 $9,500"]),
								t(["got 100 ALFA", "得到 100 股 ALFA"]),
							]
						: [
								t([`got ${usd(payout, 0)}`, `得到 ${usd(payout, 0)}`]),
								t(["no index units", "没有指数份额"]),
							],
		},
		{
			id: "writer",
			name: t(["Assigned writer", "被指派的义务方"]),
			role: alfa
				? t(["short ALFA 95 call", "ALFA 95 看涨空头"])
				: t(["short IDX 5,000 call", "IDX 5,000 看涨空头"]),
			holdings: !moves
				? []
				: alfa
					? [
							t(["got $9,500", "得到 $9,500"]),
							t(["gave 100 ALFA", "交出 100 股 ALFA"]),
						]
					: [t([`paid ${usd(payout, 0)}`, `支付 ${usd(payout, 0)}`])],
		},
	];
	const result: ResultItem[] = alfa
		? [
				{
					id: "kind",
					label: t(["Settles in", "交收方式"]),
					value: t(["shares", "股票"]),
					note: t(["physical settlement", "实物交收"]),
				},
				{
					id: "pay",
					label: t(["You pay", "你支付"]),
					value: moves ? "$9,500" : "$0",
					note: moves ? "$95 × 100" : t(["not exercised", "未行权"]),
				},
				{
					id: "get",
					label: t(["You receive", "你收到"]),
					value: moves ? "100 ALFA" : "—",
					note: moves
						? t([
								`worth ${usd(level * 100 * 100, 0)} at ${usd(level * 100, 0)}`,
								`按 ${usd(level * 100, 0)} 值 ${usd(level * 100 * 100, 0)}`,
							])
						: undefined,
				},
			]
		: [
				{
					id: "kind",
					label: t(["Settles in", "结算方式"]),
					value: t(["cash", "现金"]),
					note: t(["no index units to deliver", "没有指数份额可交付"]),
				},
				settled
					? {
							id: "reference",
							label: t(["Settlement value", "结算值"]),
							value: count(level),
							note:
								shown.step === "reference"
									? t([
											`not Thursday's ${count(INDEX_LAST)}`,
											`不是周四的 ${count(INDEX_LAST)}`,
										])
									: t(["official, from Friday's open", "官方值，取自周五开盘"]),
						}
					: {
							id: "reference",
							label: t(["Settlement value", "结算值"]),
							value: t(["not known yet", "尚未公布"]),
							evidence: "unknown",
						},
				{
					id: "get",
					label: t(["You receive", "你收到"]),
					value: settled ? usd(payout, 0) : "—",
					note: settled
						? `(${count(level)} − ${count(INDEX_STRIKE)}) × $100`
						: undefined,
					tone: settled && payout > 0 ? "gain" : undefined,
					evidence: settled ? "calculated" : undefined,
				},
			];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"What moves between you and the assigned writer when the option settles",
						"期权结算时，你与被指派义务方之间转移的东西",
					])}
					height={(width) => transferFlowHeight(width, 2)}
				>
					{(width) => (
						<TransferFlow
							width={width}
							parties={parties}
							transfers={transfers}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["Option", "期权"])}
							value={explore.product}
							options={[
								["alfa", t(["ALFA 95 call", "ALFA 95 看涨"])],
								["index", t(["IDX 500 5,000 call", "IDX 500 5,000 看涨"])],
							]}
							onChange={(product) =>
								setExplore({
									product,
									step: "settle",
									level: product === "alfa" ? 102 : INDEX_SETTLES,
								})
							}
						/>
						{explore.product === "alfa" ? (
							<RangeControl
								label={t(["ALFA on Oct 18", "10月18日 ALFA"])}
								value={explore.level}
								display={usd(explore.level * 100, 0)}
								min={90}
								max={110}
								onChange={(level) => setExplore({ ...explore, level })}
							/>
						) : (
							<RangeControl
								label={t(["Settlement value", "结算值"])}
								value={explore.level}
								display={count(explore.level)}
								min={4_950}
								max={5_100}
								step={5}
								onChange={(level) => setExplore({ ...explore, level })}
							/>
						)}
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"The contract's terms decide what changes hands. ALFA options deliver 100 shares per contract. IDX 500 options cannot deliver an index, so they pay cash: the settlement value minus the strike, times $100 per point. That value is calculated from the opening prices on expiry Friday; a price shown on a screen, or Thursday's close, does not replace it.",
						"合约条款决定交付什么。ALFA 期权每张交付 100 股。IDX 500 期权无法交付指数，因此支付现金：结算值减行权价，再乘每点 $100。该结算值由到期日周五的开盘价计算；屏幕上显示的价格或周四收盘价都不能代替它。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: when exercise is allowed ———

type Style = "american" | "european";
/** No style yet means the exercise window is still unknown. */
type WindowState = { style: Style | null; early: boolean };

/** Days from Mon Sep 16 to Fri Oct 18. */
const WINDOW_DAYS = 32;
const windowTicks: readonly { day: number; label: Copy }[] = [
	{ day: 0, label: ["Sep 16", "9月16日"] },
	{ day: 7, label: ["Sep 23", "9月23日"] },
	{ day: 14, label: ["Sep 30", "9月30日"] },
	{ day: 21, label: ["Oct 7", "10月7日"] },
	{ day: 32, label: ["Oct 18", "10月18日"] },
];
const EARLY_DAY = 30;

function windowLayout(width: number) {
	const narrow = width < 520;
	const left = narrow ? 14 : 96;
	return {
		narrow,
		left,
		right: width - 18,
		lanes: narrow ? [44, 104] : [34, 84],
		laneHeight: 26,
		axis: narrow ? 168 : 148,
		height: narrow ? 202 : 180,
	};
}

function WindowStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: WindowState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const layout = windowLayout(width);
	const x = (day: number) =>
		layout.left + (day / WINDOW_DAYS) * (layout.right - layout.left);
	const american = state.style === "american";
	const unknown = state.style === null;
	const lanes = [
		{
			id: "trade",
			label: t(["Trade", "交易"]),
			note: t(["any trading day", "任一交易日"]),
			inLane: t(["buy or sell any trading day", "任一交易日均可买卖"]),
			from: 0,
		},
		{
			id: "exercise",
			label: t(["Exercise", "行权"]),
			note: unknown
				? t(["depends on the style", "取决于行权方式"])
				: american
					? t(["any trading day", "任一交易日"])
					: t(["expiry only", "仅限到期日"]),
			inLane: unknown
				? t(["depends on the exercise style", "取决于行权方式"])
				: american
					? t(["exercise any trading day", "任一交易日均可行权"])
					: t(["expiry only", "仅限到期日"]),
			from: unknown ? WINDOW_DAYS : american ? 0 : WINDOW_DAYS - 0.6,
		},
	];
	return (
		<g>
			{lanes.map((lane, i) => {
				const y = layout.lanes[i];
				return (
					<g key={lane.id}>
						<Label
							x={14}
							y={layout.narrow ? y - 8 : y + 18}
							tone={layout.narrow ? "small" : "muted"}
						>
							{layout.narrow ? `${lane.label} · ${lane.note}` : lane.label}
						</Label>
						<rect
							x={layout.left}
							y={y}
							width={layout.right - layout.left}
							height={layout.laneHeight}
							rx={6}
							className="wt-panel-shape"
							style={unknown && i === 1 ? { fill: hatch } : undefined}
						/>
						<m.rect
							y={y}
							height={layout.laneHeight}
							rx={6}
							className="wt-long-soft"
							initial={false}
							animate={{
								x: x(lane.from),
								width: x(WINDOW_DAYS) - x(lane.from),
							}}
							transition={motion.move}
						/>
						{layout.narrow ? null : (
							<m.text
								y={y + 18}
								className={`wt-small wt-on-soft${unknown && i === 1 ? "wt-halo" : ""}`}
								initial={false}
								animate={{
									x:
										american || unknown || i === 0
											? layout.left + 12
											: x(WINDOW_DAYS) - 12,
								}}
								textAnchor={american || unknown || i === 0 ? "start" : "end"}
								transition={motion.move}
							>
								{lane.inLane}
							</m.text>
						)}
					</g>
				);
			})}
			<path
				d={`M${layout.left} ${layout.axis}H${layout.right}`}
				className="wt-axis"
			/>
			{windowTicks
				.filter(
					(tick) =>
						!layout.narrow || tick.day % 14 === 0 || tick.day === WINDOW_DAYS,
				)
				.map((tick) => (
					<g key={tick.day}>
						<path
							d={`M${x(tick.day)} ${layout.axis - 4}V${layout.axis + 4}`}
							className="wt-axis"
						/>
						<Label
							x={x(tick.day)}
							y={layout.axis + 20}
							anchor={
								tick.day === 0
									? "start"
									: tick.day === WINDOW_DAYS
										? "end"
										: "middle"
							}
							tone="small"
						>
							{t(tick.label)}
						</Label>
					</g>
				))}
			{state.early ? (
				<m.g
					initial={motion.enabled ? { opacity: 0, y: -6 } : false}
					animate={{ opacity: 1, y: 0 }}
					transition={motion.fade}
				>
					<circle
						cx={x(EARLY_DAY)}
						cy={layout.lanes[1] + layout.laneHeight / 2}
						r={7}
						className="wt-short"
						stroke="var(--foreground)"
						strokeWidth={1.5}
					/>
					<Label
						x={x(EARLY_DAY) - 12}
						y={layout.lanes[1] + layout.laneHeight + 16}
						anchor="end"
						tone="accent"
						className="wt-halo"
					>
						{t(["assigned Wed Oct 16", "10月16日 周三被指派"])}
					</Label>
				</m.g>
			) : null}
		</g>
	);
}

function WindowView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: WindowState;
	explore: WindowState | null;
	setExplore: (next: WindowState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const american = shown.style === "american";
	const result: ResultItem[] =
		shown.style === null
			? [
					{
						id: "style",
						label: t(["Exercise style", "行权方式"]),
						value: t(["not shown yet", "尚未给出"]),
						evidence: "unknown",
					},
					{
						id: "holder",
						label: t(["Holder may exercise", "持有人可行权"]),
						value: t(["depends on the style", "取决于行权方式"]),
						evidence: "unknown",
					},
				]
			: [
					{
						id: "style",
						label: t(["Exercise style", "行权方式"]),
						value: american ? t(["American", "美式"]) : t(["European", "欧式"]),
						note: american
							? t(["ALFA options", "ALFA 期权"])
							: t(["IDX 500 options", "IDX 500 期权"]),
					},
					{
						id: "holder",
						label: t(["Holder may exercise", "持有人可行权"]),
						value: american
							? t(["any trading day", "任一交易日"])
							: t(["only at expiry", "仅在到期时"]),
					},
					{
						id: "writer",
						label: t(["Writer can be assigned", "义务方可能被指派"]),
						value: american
							? t(["any day, without warning", "任何一天，毫无预警"])
							: t(["only at expiry", "仅在到期时"]),
						tone: american ? "loss" : undefined,
					},
				];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The days an option can be traded and the days it can be exercised, from Sep 16 to Oct 18",
						"9月16日至10月18日期间，期权可交易的日子与可行权的日子",
					])}
					height={(width) => windowLayout(width).height}
				>
					{(width) => (
						<WindowStage width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Exercise style", "行权方式"])}
						value={explore.style ?? "american"}
						options={[
							["american", t(["American (ALFA)", "美式（ALFA）"])],
							["european", t(["European (IDX 500)", "欧式（IDX 500）"])],
						]}
						onChange={(style) => setExplore({ style, early: false })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"American and European describe when exercise is allowed, not where an option trades. Either kind can be bought or sold on any trading day. Holders rarely exercise early while time value remains, because selling gets more; it becomes likelier when an option is deep in the money close to expiry, or just before the stock pays a dividend.",
						"美式和欧式描述的是何时可以行权，而不是在哪里交易。两种期权都可以在任一交易日买卖。只要还有时间价值，持有人很少提前行权，因为卖出更划算；当期权深度实值且临近到期，或股票即将派息时，提前行权更可能发生。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 4: expiry-day surprises ———

type ExpiryRole = "holder" | "writer";
type ExpiryState = {
	role: ExpiryRole;
	/** ALFA's close on Oct 18, in dollars. */
	close: number;
	/** Where ALFA trades after the close, when it moves. */
	after: number | null;
	/** The holder told the broker not to exercise. */
	decline: boolean;
	/** False while the learner is still asked what will happen. */
	reveal: boolean;
};

const EXPIRY_CARD_TOP = PRICE_LINE_HEIGHT - 4;
const EXPIRY_HEIGHT = EXPIRY_CARD_TOP + 96;

/** What happens to the Oct 18 100 call, and what the account shows on Monday Oct 21. */
function expiryOutcome(state: ExpiryState) {
	const finalPrice = state.after ?? state.close;
	const exercised =
		state.role === "holder"
			? state.close >= CALL_100.strike + 0.01 && !state.decline
			: state.after !== null && finalPrice > CALL_100.strike;
	const known =
		state.reveal && (state.role === "holder" || state.after !== null);
	return { exercised, known };
}

function ExpiryStage({
	width,
	state,
	locale,
	drag,
}: {
	width: number;
	state: ExpiryState;
	locale: Locale;
	/** Drags the close; off while the marker shows an after-hours price instead. */
	drag?: AxisDrag;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const holder = state.role === "holder";
	const { exercised, known } = expiryOutcome(state);
	const lines = !known
		? holder
			? [t(["?", "?"])]
			: [t(["not known until Monday", "要到周一才知道"])]
		: exercised
			? holder
				? [
						t(["+100 ALFA", "+100 股 ALFA"]),
						t(["−$10,000 cash", "−$10,000 现金"]),
					]
				: [
						t(["−100 ALFA (short)", "−100 股 ALFA（空头）"]),
						t(["+$10,000 cash", "+$10,000 现金"]),
					]
			: holder && state.decline
				? [
						t(["call expired unexercised", "看涨未行权即到期"]),
						t(["no shares, no cash", "没有股票，也没有现金"]),
					]
				: [
						t(["call expired", "看涨已到期"]),
						t(["nothing changes", "没有变化"]),
					];
	const cardX = 8;
	const cardWidth = width - 16;
	return (
		<g>
			<PriceLine
				width={width}
				min={99.8}
				max={100.8}
				ticks={[99.8, 100.2, 100.4, 100.6, 100.8]}
				tickLabel={(tick) => usd(Math.round(tick * 100))}
				header={
					holder
						? t([
								"You hold 1 ALFA Oct 18 100 call",
								"你持有 1 张 ALFA 10月18日 100 看涨",
							])
						: t([
								"You wrote 1 ALFA Oct 18 100 call",
								"你卖出了 1 张 ALFA 10月18日 100 看涨",
							])
				}
				strike={{ value: 100, label: t(["strike $100", "行权价 $100"]) }}
				zone={{
					from: 100.01,
					to: 100.8,
					label: !state.reveal
						? t(["in the money", "实值"])
						: holder
							? t(["exercised automatically", "自动行权"])
							: t(["holders exercise", "持有人会行权"]),
				}}
				marker={{
					value: state.after ?? state.close,
					before: state.after === null ? undefined : state.close,
					label:
						state.after === null
							? t([
									`close ${usd(state.close * 100)}`,
									`收盘 ${usd(state.close * 100)}`,
								])
							: t([
									`after hours ${usd(state.after * 100)}`,
									`盘后 ${usd(state.after * 100)}`,
								]),
					tone: "neutral",
				}}
				drag={state.after === null ? drag : undefined}
			/>
			<rect
				x={cardX}
				y={EXPIRY_CARD_TOP}
				width={cardWidth}
				height={84}
				rx={12}
				className="wt-panel-shape"
				style={known ? undefined : { fill: hatch }}
			/>
			<Label x={cardX + 14} y={EXPIRY_CARD_TOP + 24} tone="muted">
				{t(["Your account, Monday Oct 21", "你的账户，10月21日 周一"])}
			</Label>
			{lines.map((line, row) => (
				<m.text
					key={`${state.role}-${line}`}
					x={cardX + 14}
					y={EXPIRY_CARD_TOP + 50 + row * 22}
					className={row === 0 ? "wt-strong" : undefined}
					initial={motion.enabled ? { opacity: 0 } : false}
					animate={{ opacity: 1 }}
					transition={motion.after(0.2)}
				>
					{line}
				</m.text>
			))}
		</g>
	);
}

function ExpiryView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ExpiryState;
	explore: ExpiryState | null;
	setExplore: (next: ExpiryState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const holder = shown.role === "holder";
	const { exercised, known } = expiryOutcome(shown);
	const gap = Math.round((shown.close - CALL_100.strike) * 100);
	const result: ResultItem[] = [
		shown.after === null
			? {
					id: "price",
					label: t(["ALFA close, Oct 18", "10月18日 ALFA 收盘"]),
					value: usd(shown.close * 100),
					tween: { to: shown.close, format: (close) => usd(close * 100) },
					note:
						gap > 0
							? t([`${gap}¢ above the strike`, `高于行权价 ${gap} 美分`])
							: gap < 0
								? t([`${-gap}¢ below the strike`, `低于行权价 ${-gap} 美分`])
								: t(["exactly at the strike", "恰好等于行权价"]),
				}
			: {
					id: "price",
					label: t(["ALFA after hours", "ALFA 盘后"]),
					value: usd(shown.after * 100),
					note: t([
						`closed at ${usd(shown.close * 100)}`,
						`收盘 ${usd(shown.close * 100)}`,
					]),
				},
		{
			id: "option",
			label: holder
				? t(["Your call", "你的看涨"])
				: t(["Your short call", "你的看涨空头"]),
			value: !known
				? holder
					? "?"
					: t(["expected to expire", "预计到期作废"])
				: exercised
					? holder
						? t(["exercised automatically", "自动行权"])
						: t(["assigned", "被指派"])
					: shown.decline && gap > 0
						? t(["not exercised", "未行权"])
						: t(["expires worthless", "到期作废"]),
			note: !known
				? holder
					? t(["you do nothing", "你什么也没做"])
					: t(["holders may still exercise", "持有人仍可行权"])
				: exercised && holder
					? t(["$0.01 or more in the money", "实值 $0.01 或以上"])
					: shown.decline && gap > 0
						? t(["you told your broker", "你已通知券商"])
						: undefined,
			tone: exercised && !holder ? "loss" : undefined,
			evidence: known ? undefined : "unknown",
		},
		{
			id: "monday",
			label: t(["Monday", "周一"]),
			value: !known
				? "?"
				: exercised
					? holder
						? t(["+100 ALFA, −$10,000", "+100 股，−$10,000"])
						: t(["−100 ALFA, +$10,000", "−100 股，+$10,000"])
					: t(["no change", "没有变化"]),
			evidence: known ? undefined : "unknown",
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"ALFA's price at the Oct 18 close against the $100 strike, and the account it leaves on Monday",
						"10月18日收盘时 ALFA 价格与 $100 行权价的关系，以及周一的账户结果",
					])}
					height={EXPIRY_HEIGHT}
				>
					{(width) => (
						<ExpiryStage
							width={width}
							state={shown}
							locale={locale}
							drag={
								explore
									? {
											min: 99.9,
											max: 100.1,
											step: 0.01,
											onChange: (close) =>
												setExplore({
													...explore,
													close: Math.round(close * 100) / 100,
												}),
										}
									: undefined
							}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<FieldGroup>
						<RangeControl
							label={t(["ALFA close, Oct 18", "10月18日 ALFA 收盘"])}
							value={explore.close}
							display={usd(Math.round(explore.close * 100))}
							min={99.9}
							max={100.1}
							step={0.01}
							onChange={(close) =>
								setExplore({ ...explore, close: Math.round(close * 100) / 100 })
							}
						/>
						<ChoiceField
							label={t(["Your instruction", "你的指示"])}
							value={explore.decline ? "decline" : "default"}
							options={[
								["default", t(["None", "无"])],
								["decline", t(["Do not exercise", "不要行权"])],
							]}
							onChange={(value) =>
								setExplore({ ...explore, decline: value === "decline" })
							}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"At expiry, a long option $0.01 or more in the money is exercised automatically unless you tell your broker otherwise before its cutoff, usually in the late afternoon. Holders can also exercise after the close, so a writer only learns on Monday whether an option near the strike was assigned. Brokers may close positions you cannot pay for.",
						"到期时，实值 $0.01 或以上的多头期权会被自动行权，除非你在券商截止时间（通常是傍晚）前另行指示。持有人在收盘后仍可行权，因此行权价附近的期权是否被指派，义务方要到周一才知道。若你无力支付，券商可能会为你平仓。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<ExitState, ExitState>({
		id: "close-or-exercise",
		label: ["Close or exercise", "平仓或行权"],
		title: [
			"Selling the option and exercising it are different",
			"卖出期权与行权是两回事",
		],
		predict: {
			prompt: [
				"Fri Oct 4: ALFA is $102 and your Oct 18 95 call bids $7.40. Which gets you more?",
				"10月4日周五：ALFA 为 $102，你的 10月18日 95 看涨买价 $7.40。哪种方式得到更多？",
			],
			choices: [
				{ id: "sell", label: ["Selling the call", "卖出看涨"] },
				{ id: "exercise", label: ["Exercising it", "行权"] },
				{ id: "same", label: ["They are the same", "两者一样"] },
			],
			answer: "sell",
			revealAt: 1,
			explain: [
				"Selling gets the $7.40 bid, time value included. Exercising captures only the $7.00 intrinsic value, so it gives up $40 on one contract.",
				"卖出能拿到含时间价值的 $7.40 买价；行权只能拿到 $7.00 的内在价值，一张合约少得 $40。",
			],
		},
		beats: [
			{
				id: "close",
				label: ["Sell to close", "卖出平仓"],
				caption: [
					"Fri Oct 4: ALFA is $102 and your 95 call bids $7.40, which is $7.00 intrinsic plus $0.40 time value. Selling gets all of it: $740.",
					"10月4日周五：ALFA 为 $102，你的 95 看涨买价 $7.40，即 $7.00 内在价值加 $0.40 时间价值。卖出可全部拿到：$740。",
				],
				state: { day: "oct4", exercise: false },
			},
			{
				id: "exercise",
				label: ["Exercise", "行权"],
				caption: [
					"Exercising instead pays $9,500 for 100 shares worth $10,200: $700. The $0.40 of time value is given up.",
					"改为行权，就是花 $9,500 买入价值 $10,200 的 100 股：$700。$0.40 的时间价值被放弃。",
				],
				state: { day: "oct4", exercise: true },
			},
			{
				id: "expiry",
				label: ["At expiry", "到期时"],
				caption: [
					"On Oct 18 no time value is left, so selling and exercising both capture $7.00 a share, or $700.",
					"到 10月18日 已没有时间价值，卖出和行权都拿到每股 $7.00，即 $700。",
				],
				state: { day: "oct18", exercise: true },
			},
		],
		explore: {
			prompt: [
				"Pick a date and watch the gap between selling and exercising.",
				"选择日期，观察卖出与行权之间的差距。",
			],
			start: () => ({ day: "oct4", exercise: true }),
			task: {
				kind: "answer",
				prompt: [
					"On which date do selling and exercising pay the same?",
					"在哪个日期卖出和行权得到的一样多？",
				],
				choices: [
					{ id: "oct18", label: ["Expiry day, Oct 18", "到期日，10月18日"] },
					{ id: "oct4", label: ["Fri Oct 4", "10月4日 周五"] },
					{ id: "oct11", label: ["Fri Oct 11", "10月11日 周五"] },
				],
				answer: "oct18",
				done: [
					"Before expiry the bid includes time value that an exercise throws away. On Oct 18 none is left, so both capture the same $7.00 a share.",
					"到期前，买价里包含时间价值，行权会把它丢掉。10月18日 时间价值归零，两种方式都得到每股 $7.00。",
				],
			},
		},
		View: ExitView,
	}),
	defineScene<SettleState, SettleState>({
		id: "settlement",
		label: ["Shares or cash", "股票或现金"],
		title: [
			"Settlement moves shares or cash, as the contract says",
			"结算按合约交付股票或现金",
		],
		predict: {
			prompt: [
				"Your IDX 500 Oct 18 5,000 call settles at an official 5,025. What do you receive?",
				"你的 IDX 500 10月18日 5,000 看涨，官方结算值为 5,025。你会收到什么？",
			],
			choices: [
				{ id: "cash", label: ["$2,500 in cash", "$2,500 现金"] },
				{ id: "units", label: ["Units of the index", "指数份额"] },
				{ id: "points", label: ["$25", "$25"] },
			],
			answer: "cash",
			entry: { answer: 2500, prefix: "$" },
			revealAt: 2,
			explain: [
				"An index can't be delivered, so the option pays cash: 25 points above the strike × $100 per point = $2,500.",
				"指数无法交付，所以期权支付现金：高于行权价 25 点 × 每点 $100 = $2,500。",
			],
		},
		beats: [
			{
				id: "shares",
				label: ["Shares", "股票"],
				caption: [
					"ALFA options settle in shares. Exercising the 95 call with ALFA at $102 sends $9,500 one way and 100 shares the other.",
					"ALFA 期权以股票交收。ALFA 为 $102 时行使 95 看涨，$9,500 流向一方，100 股流向另一方。",
				],
				state: { product: "alfa", step: "settle", level: 102 },
			},
			{
				id: "index",
				label: ["An index option", "指数期权"],
				caption: [
					"An IDX 500 option has nothing to deliver: you can't hand over an index. It settles in cash, at $100 per index point.",
					"IDX 500 期权没有东西可交付：指数无法转交。它以现金结算，每个指数点 $100。",
				],
				state: { product: "index", step: "terms", level: INDEX_SETTLES },
			},
			{
				id: "cash",
				label: ["Cash", "现金"],
				caption: [
					"The official settlement value is 5,025, so the writer pays (5,025 − 5,000) × $100 = $2,500. No index units move.",
					"官方结算值为 5,025，因此义务方支付 (5,025 − 5,000) × $100 = $2,500。没有指数份额转移。",
				],
				state: { product: "index", step: "settle", level: INDEX_SETTLES },
			},
			{
				id: "reference",
				label: ["Which value counts", "以哪个值为准"],
				caption: [
					"IDX closed Thursday at 5,030, but these options stop trading Thursday and settle on Friday's opening prices: 5,025. Only 5,025 counts.",
					"IDX 周四收于 5,030，但这些期权周四停止交易，按周五开盘价结算：5,025。只有 5,025 算数。",
				],
				state: { product: "index", step: "reference", level: INDEX_SETTLES },
			},
		],
		explore: {
			prompt: [
				"Switch between the two options and move the final price.",
				"在两种期权之间切换，并移动最终价格。",
			],
			start: () => ({ product: "index", step: "settle", level: INDEX_SETTLES }),
			task: {
				kind: "reach",
				prompt: [
					"Find the IDX 500 settlement value that pays the call holder exactly $5,000.",
					"找出让看涨持有人正好得到 $5,000 的 IDX 500 结算值。",
				],
				reached: (e) => e.product === "index" && e.level === 5_050,
				done: [
					"50 points above the 5,000 strike × $100 a point = $5,000, paid in cash. No index units change hands; only the official settlement value counts.",
					"比 5,000 行权价高 50 点 × 每点 $100 = $5,000，以现金支付。没有任何指数单位易手，只有官方结算值算数。",
				],
			},
		},
		View: SettleView,
	}),
	defineScene<WindowState, WindowState>({
		id: "exercise-window",
		label: ["When to exercise", "何时行权"],
		title: [
			"American options can be exercised any day; European only at expiry",
			"美式期权任一天可行权，欧式只能在到期时",
		],
		predict: {
			prompt: [
				"You wrote an ALFA Oct 18 100 call on Sep 16. When could you be assigned?",
				"你在 9月16日 卖出了 ALFA 10月18日 100 看涨。你何时可能被指派？",
			],
			choices: [
				{
					id: "any",
					label: ["Any trading day until Oct 18", "10月18日前任一交易日"],
				},
				{ id: "expiry", label: ["Only on Oct 18", "只在 10月18日"] },
				{ id: "agree", label: ["Only if I agree", "只有我同意时"] },
			],
			answer: "any",
			revealAt: 1,
			explain: [
				"ALFA options are American-style: the holder may exercise on any trading day, so you can be assigned on any of them.",
				"ALFA 期权是美式的：持有人可在任一交易日行权，所以你在其中任何一天都可能被指派。",
			],
		},
		beats: [
			{
				id: "window",
				label: ["Two windows", "两个时间窗口"],
				caption: [
					"Any option can be bought or sold on any trading day until it expires. When it can be exercised depends on its exercise style.",
					"任何期权在到期前的每个交易日都可以买卖。何时可以行权，取决于它的行权方式。",
				],
				state: { style: null, early: false },
			},
			{
				id: "american",
				label: ["American", "美式"],
				caption: [
					"ALFA options are American-style: a holder may exercise on any trading day up to Oct 18, so writers can be assigned on any of them.",
					"ALFA 期权是美式的：持有人可在 10月18日 前任一交易日行权，因此义务方在任何一天都可能被指派。",
				],
				state: { style: "american", early: false },
			},
			{
				id: "early",
				label: ["Early assignment", "提前指派"],
				caption: [
					"It is rare while time value remains, since selling gets more. Deep in the money days before expiry, a writer can be assigned early.",
					"只要还有时间价值，这种情况就很少见，因为卖出更划算。但在到期前几天、深度实值时，义务方可能被提前指派。",
				],
				state: { style: "american", early: true },
			},
			{
				id: "european",
				label: ["European", "欧式"],
				caption: [
					"IDX 500 options are European-style: they can be exercised only at expiry. Before then the way out is to sell.",
					"IDX 500 期权是欧式的：只能在到期时行权。在那之前，退出的方式是卖出。",
				],
				state: { style: "european", early: false },
			},
		],
		explore: {
			prompt: ["Switch between the two styles.", "在两种行权方式之间切换。"],
			start: () => ({ style: "american", early: false }),
			task: {
				kind: "answer",
				prompt: [
					"It's Oct 4 and you own an IDX 500 Oct 18 call. How can you take its value now?",
					"现在是 10月4日，你持有 IDX 500 10月18日 看涨。你怎样现在就兑现它的价值？",
				],
				choices: [
					{ id: "sell", label: ["Sell it", "卖出它"] },
					{ id: "exercise", label: ["Exercise it", "行权"] },
					{
						id: "wait",
						label: ["You can't until Oct 18", "要等到 10月18日 才行"],
					},
				],
				answer: "sell",
				done: [
					"European-style options can't be exercised before expiry, but they trade every day. Selling is the way out, and it keeps the time value too.",
					"欧式期权到期前不能行权，但每天都可以交易。卖出就是退出的方式，而且还能保留时间价值。",
				],
			},
		},
		View: WindowView,
	}),
	defineScene<ExpiryState, ExpiryState>({
		id: "expiry-day",
		label: ["Expiry-day surprises", "到期日意外"],
		title: [
			"A few cents decide what happens at expiry",
			"几美分决定到期时会发生什么",
		],
		predict: {
			prompt: [
				"Your Oct 18 100 call finishes at $100.02, 2 cents in the money, and you do nothing. What happens?",
				"你的 10月18日 100 看涨收在 $100.02，实值 2 美分，而你什么也没做。会发生什么？",
			],
			choices: [
				{
					id: "exercised",
					label: [
						"It is exercised: I buy 100 ALFA for $10,000",
						"被行权：我以 $10,000 买入 100 股",
					],
				},
				{ id: "expires", label: ["It expires worthless", "到期作废"] },
				{ id: "paid", label: ["I am paid $2", "我收到 $2"] },
			],
			answer: "exercised",
			revealAt: 1,
			explain: [
				"Any long option $0.01 or more in the money is exercised automatically at expiry. You end up owning 100 shares and owing $10,000, even though the call was worth only $2.",
				"到期时，实值 $0.01 或以上的多头期权会被自动行权。即使这张看涨只值 $2，你也会持有 100 股并欠 $10,000。",
			],
		},
		beats: [
			{
				id: "close",
				label: ["The close", "收盘"],
				caption: [
					"Oct 18, 4:00 pm: ALFA closes at $100.02. Your 100 call finishes 2 cents in the money, worth $2, and you do nothing.",
					"10月18日 下午 4:00：ALFA 收于 $100.02。你的 100 看涨以实值 2 美分收盘，价值 $2，而你什么也没做。",
				],
				state: {
					role: "holder",
					close: 100.02,
					after: null,
					decline: false,
					reveal: false,
				},
			},
			{
				id: "automatic",
				label: ["Automatic exercise", "自动行权"],
				caption: [
					"Being $0.01 or more in the money, it is exercised automatically. On Monday you own 100 shares and owe $10,000.",
					"由于实值 $0.01 或以上，它被自动行权。周一你持有 100 股，并欠 $10,000。",
				],
				state: {
					role: "holder",
					close: 100.02,
					after: null,
					decline: false,
					reveal: true,
				},
			},
			{
				id: "decline",
				label: ["Say no", "拒绝行权"],
				caption: [
					"Don't want $10,000 of ALFA? Sell the call before the close, or tell your broker not to exercise before its cutoff.",
					"不想要价值 $10,000 的 ALFA？在收盘前卖出看涨，或在券商截止时间前通知它不要行权。",
				],
				state: {
					role: "holder",
					close: 100.02,
					after: null,
					decline: true,
					reveal: true,
				},
			},
			{
				id: "pin",
				label: ["Pinned", "贴近行权价"],
				caption: [
					"Now you wrote the 100 call. ALFA closes at $99.98, 2 cents out of the money, and you expect it to expire.",
					"现在你是 100 看涨的卖方。ALFA 收于 $99.98，虚值 2 美分，你以为它会到期作废。",
				],
				state: {
					role: "writer",
					close: 99.98,
					after: null,
					decline: false,
					reveal: true,
				},
			},
			{
				id: "after-hours",
				label: ["After the close", "收盘之后"],
				caption: [
					"After the close ALFA jumps to $100.60. Holders can still exercise, so on Monday you find you are short 100 shares. That is pin risk.",
					"收盘后 ALFA 跳到 $100.60。持有人仍可行权，所以周一你发现自己空头 100 股。这就是钉住风险。",
				],
				state: {
					role: "writer",
					close: 99.98,
					after: 100.6,
					decline: false,
					reveal: true,
				},
			},
		],
		explore: {
			prompt: [
				"You hold the call. Drag the close along the price line and choose whether to decline exercise.",
				"你持有这张看涨。在价格轴上拖动收盘价，并选择是否拒绝行权。",
			],
			start: () => ({
				role: "holder",
				close: 100.02,
				after: null,
				decline: false,
				reveal: true,
			}),
			task: {
				kind: "reach",
				prompt: [
					"As the holder, find a close where your call finishes in the money but you end the weekend without shares.",
					"作为持有人，找出一个收盘价：看涨期权以实值到期，但你周末过后并没有持有股票。",
				],
				reached: (e) => e.close >= 100.01 && e.decline,
				done: [
					"An instruction not to exercise, given before your broker's cutoff, overrides automatic exercise. Without it, $0.01 in the money is enough to buy 100 shares for $10,000.",
					"在券商截止时间前发出不行权指示，就能取消自动行权。没有这项指示，只要实值 $0.01，你就会以 $10,000 买入 100 股。",
				],
			},
		},
		View: ExpiryView,
	}),
] as const;

export function ExpirationSettlementWalkthrough({
	locale,
}: {
	locale: Locale;
}) {
	return (
		<Walkthrough
			locale={locale}
			id="expiration-settlement"
			label={[
				"Interactive lesson on expiration and settlement",
				"到期与结算互动课",
			]}
			scenes={scenes}
		/>
	);
}
