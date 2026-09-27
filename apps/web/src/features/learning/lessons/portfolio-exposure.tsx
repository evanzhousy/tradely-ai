import * as m from "motion/react-m";
import {
	alfaCloses,
	type Copy,
	count,
	daysToExpiry,
	modelVolatility,
	oct100CallCloseQuote,
	oct100CallMonday,
	pick,
	priceOption,
	signedCount,
	signedUsd,
	yourAccount,
	yourSecondAccount,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import {
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import { Label, Stage, useStage, useTeachMotion } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

/** Monday's close: ALFA's last trade, and 32 days to the Oct 18 expiry. */
const SPOT = oct100CallCloseQuote.spot / 100;
const FRIDAY_SPOT = alfaCloses[alfaCloses.length - 1].close;
const DAYS = daysToExpiry("oct18");
const CALLS = oct100CallMonday.trades
	.filter((trade) => trade.buyer === "you")
	.reduce((sum, trade) => sum + trade.quantity, 0);
const PUTS = yourSecondAccount.puts.quantity;
const PUT_STRIKE = yourSecondAccount.puts.strike;

/** Model Greeks per share for an Oct 18 contract. */
const greeks = (
	right: "call" | "put",
	strike: number,
	spot: number,
	days = DAYS,
) =>
	priceOption({
		spot,
		strike,
		days,
		iv: modelVolatility("oct18", strike),
		right,
	});
const CALL = greeks("call", 100, SPOT);
const PUT = greeks("put", PUT_STRIKE, SPOT);
/** The puts as the second broker last valued them: at Friday's close, three days earlier. */
const PUT_FRIDAY = greeks("put", PUT_STRIKE, FRIDAY_SPOT, DAYS + 3);

const round3 = (value: number) => Math.round(value * 1000) / 1000;
/** Signed per-share sensitivity to three places: "+0.566", "−0.259". */
const fixed3 = (value: number) =>
	`${value < 0 ? "−" : value > 0 ? "+" : ""}${Math.abs(value).toFixed(3)}`;
/** A holding's delta in shares: contracts × 100 × delta per share. */
const shares = (contracts: number, delta: number) =>
	Math.round(contracts * 100 * delta);
const STOCK_DELTA = yourAccount.shares;
const CALL_DELTA = shares(CALLS, CALL.delta);
const PUT_DELTA = shares(PUTS, PUT.delta);
const PUT_DELTA_FRIDAY = shares(PUTS, PUT_FRIDAY.delta);
const SUBTOTAL = STOCK_DELTA + CALL_DELTA;
const TOTAL = SUBTOTAL + PUT_DELTA;
/** Whole dollars from dollars: "+$875", "−$964". */
const wholeUsd = (value: number) => signedUsd(Math.round(value) * 100, 0);

// ——— Scene 1: a covered subtotal ———

type CoverState = { stage: 0 | 1 | 2 };

const ROW = 40;

function HoldingsTable({
	width,
	state,
	locale,
}: {
	width: number;
	state: CoverState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const narrow = width < 520;
	const valueX = width - 16;
	const perX = narrow ? width - 64 : width - 170;
	const putsIn = state.stage >= 2;
	const rows: {
		id: string;
		label: Copy;
		per: string;
		value: number | null;
	}[] = [
		{
			id: "stock",
			label: [
				`${yourAccount.shares} ALFA shares`,
				`${yourAccount.shares} 股 ALFA`,
			],
			per: fixed3(1),
			value: STOCK_DELTA,
		},
		{
			id: "calls",
			label: [`${CALLS} Oct 18 100 calls`, `${CALLS} 张 10月18日 100 看涨`],
			per: fixed3(round3(CALL.delta)),
			value: CALL_DELTA,
		},
		{
			id: "puts",
			label: [
				`${PUTS} Oct 18 ${PUT_STRIKE} puts`,
				`${PUTS} 张 10月18日 ${PUT_STRIKE} 看跌`,
			],
			per: putsIn ? fixed3(round3(PUT.delta)) : "",
			value: putsIn ? PUT_DELTA : null,
		},
	];
	const totalY = 48 + 3 * (ROW + 6) + 4;
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{narrow
					? t([
							`Delta in shares · ALFA $${SPOT.toFixed(2)}`,
							`Delta（股） · ALFA $${SPOT.toFixed(2)}`,
						])
					: t([
							`Both accounts · delta in shares · ALFA $${SPOT.toFixed(2)}, Monday's close`,
							`两个账户 · Delta（股） · ALFA $${SPOT.toFixed(2)}，周一收盘`,
						])}
			</Label>
			<Label x={perX} y={40} anchor="end" tone="small">
				{t(["per share", "每股"])}
			</Label>
			<Label x={valueX} y={40} anchor="end" tone="small">
				{t(["shares", "股"])}
			</Label>
			{rows.map((row, i) => {
				const y = 48 + i * (ROW + 6);
				return (
					<g key={row.id}>
						<rect
							x={4}
							y={y}
							width={width - 8}
							height={ROW}
							rx={8}
							className="wt-panel-shape"
						/>
						{row.value === null ? (
							<rect
								x={perX - 50}
								y={y + 4}
								width={width - 12 - (perX - 50)}
								height={ROW - 8}
								rx={6}
								style={{ fill: hatch }}
							/>
						) : null}
						<Label x={14} y={y + ROW / 2 + 4} tone="small">
							{t(row.label)}
						</Label>
						<Label
							x={perX}
							y={y + ROW / 2 + 5}
							anchor="end"
							className={row.value === null ? "wt-halo" : undefined}
						>
							{row.per}
						</Label>
						<m.text
							key={`${row.id}-${row.value}`}
							x={valueX}
							y={y + ROW / 2 + 5}
							textAnchor="end"
							className={row.value === null ? "wt-accent wt-halo" : undefined}
							initial={motion.enabled ? { opacity: 0 } : false}
							animate={{ opacity: 1 }}
							transition={motion.fade}
						>
							{row.value === null
								? t(["missing", "缺失"])
								: signedCount(row.value)}
						</m.text>
					</g>
				);
			})}
			<m.g
				initial={false}
				animate={{ opacity: state.stage >= 1 ? 1 : 0 }}
				transition={motion.fade}
			>
				<rect
					x={4}
					y={totalY}
					width={width - 8}
					height={ROW}
					rx={8}
					className="wt-focus-shape"
				/>
				<Label x={14} y={totalY + ROW / 2 + 4} tone="accent">
					{putsIn
						? t(["Portfolio delta", "组合 Delta"])
						: t(["Covered subtotal, 2 of 3", "已覆盖小计，3 项中的 2 项"])}
				</Label>
				<Label x={valueX} y={totalY + ROW / 2 + 6} anchor="end" tone="strong">
					{signedCount(putsIn ? TOTAL : SUBTOTAL)}
				</Label>
			</m.g>
		</g>
	);
}

function CoverView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: CoverState;
	explore: CoverState | null;
	setExplore: (next: CoverState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [];
	if (shown.stage === 0)
		result.push({
			id: "known",
			label: t(["Stock and calls", "股票和看涨"]),
			value: t([
				`${signedCount(SUBTOTAL)} shares`,
				`${signedCount(SUBTOTAL)} 股`,
			]),
			note: t([
				`${signedCount(STOCK_DELTA)} + ${signedCount(CALL_DELTA)}`,
				`${signedCount(STOCK_DELTA)} + ${signedCount(CALL_DELTA)}`,
			]),
			evidence: "modeled",
		});
	if (shown.stage === 1)
		result.push(
			{
				id: "subtotal",
				label: t(["Covered subtotal", "已覆盖小计"]),
				value: t([
					`${signedCount(SUBTOTAL)} shares`,
					`${signedCount(SUBTOTAL)} 股`,
				]),
				note: t(["2 of 3 holdings", "3 项持仓中的 2 项"]),
				evidence: "modeled",
			},
			{
				id: "puts",
				label: t(["The puts' delta", "看跌的 Delta"]),
				value: t(["missing", "缺失"]),
				note: t(["unknown, not zero", "未知，不是零"]),
				evidence: "unknown",
			},
		);
	if (shown.stage === 2)
		result.push(
			{
				id: "total",
				label: t(["Portfolio delta", "组合 Delta"]),
				value: t([`${signedCount(TOTAL)} shares`, `${signedCount(TOTAL)} 股`]),
				note: t([
					`the puts add ${signedCount(PUT_DELTA)}`,
					`看跌计入 ${signedCount(PUT_DELTA)}`,
				]),
				evidence: "modeled",
			},
			{
				id: "gap",
				label: t(["Hedged on the subtotal", "按小计对冲"]),
				value: t([
					`${signedCount(TOTAL - SUBTOTAL)} shares`,
					`${signedCount(TOTAL - SUBTOTAL)} 股`,
				]),
				note: t([
					`short ${count(SUBTOTAL)} leaves you net short`,
					`做空 ${count(SUBTOTAL)} 股会变成净空头`,
				]),
				tone: "loss",
				evidence: "calculated",
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Your three holdings across two accounts with each one's delta in shares, the puts' delta missing at first, then the covered subtotal and the total",
						"你两个账户里的三项持仓及各自以股计的 Delta，起初看跌的 Delta 缺失，随后是已覆盖小计与合计",
					])}
					height={48 + 4 * (ROW + 6) + 8}
				>
					{(width) => (
						<HoldingsTable width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["The puts' Greeks", "看跌的希腊值"])}
						value={explore.stage === 2 ? "in" : "missing"}
						options={[
							["missing", t(["Missing", "缺失"])],
							["in", t(["Reported", "已报送"])],
						]}
						onChange={(value) => setExplore({ stage: value === "in" ? 2 : 1 })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Portfolio delta adds each holding's signed contribution in one unit, shares: one per long share, and for options contracts × 100 × the model delta per share. A holding whose Greeks haven't arrived makes the sum a covered subtotal, not a total: its exposure is unknown, not zero. A hedge sized on the subtotal hedges only what was counted.",
						"组合 Delta 以同一单位（股）把每项持仓带符号的贡献相加：每股多头计一股，期权则是张数 × 100 × 每股模型 Delta。某项持仓的希腊值还没到时，这个和只是已覆盖小计，而不是合计：它的敞口是未知，不是零。按小计确定的对冲只对冲了被计入的部分。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: zero delta is not zero risk ———

type HedgeState = { stage: 0 | 1 | 2 };

const HEDGE = TOTAL;
const UP = 5;
const WEEK = 7;
/** Your holdings' value in dollars at a price, with `days` left to expiry. */
const holdingsValue = (spot: number, days: number) =>
	yourAccount.shares * spot +
	CALLS * 100 * greeks("call", 100, spot, days).price +
	PUTS * 100 * greeks("put", PUT_STRIKE, spot, days).price;
const holdingsDelta = (spot: number) =>
	yourAccount.shares +
	CALLS * 100 * greeks("call", 100, spot).delta +
	PUTS * 100 * greeks("put", PUT_STRIKE, spot).delta;
/** The hedged book's P&L in dollars from Monday's close: holdings repriced, less the short shares. */
const hedgedPnl = (spot: number, daysPassed: number) =>
	holdingsValue(spot, DAYS - daysPassed) -
	holdingsValue(SPOT, DAYS) -
	HEDGE * (spot - SPOT);
const GAMMA = CALLS * 100 * CALL.gamma + PUTS * 100 * PUT.gamma;
const THETA = CALLS * 100 * CALL.theta + PUTS * 100 * PUT.theta;
const VEGA = CALLS * 100 * CALL.vega + PUTS * 100 * PUT.vega;
const UP_PNL = hedgedPnl(SPOT + UP, 0);
const UP_DELTA = Math.round(holdingsDelta(SPOT + UP) - HEDGE);
const WEEK_PNL = hedgedPnl(SPOT, WEEK);

function HedgeView({
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
	const curve = (daysPassed: number) =>
		Array.from({ length: 25 }, (_, i) => {
			const spot = 95 + i * 0.5;
			return [spot, hedgedPnl(spot, daysPassed)] as const;
		});
	const lines: PayoffLine[] = [
		{
			id: "today",
			label: shown.stage >= 2 ? t(["today", "今天"]) : "",
			points: curve(0),
			tone: "position",
		},
	];
	if (shown.stage >= 2)
		lines.push({
			id: "week",
			label: "",
			points: curve(WEEK),
			tone: "short",
			dashed: true,
		});
	const markers: PayoffMarker[] = [{ id: "now", x: SPOT, y: 0 }];
	if (shown.stage === 1)
		markers.push({
			id: "up",
			x: SPOT + UP,
			y: UP_PNL,
			label: wholeUsd(UP_PNL),
			tone: "gain",
		});
	if (shown.stage >= 2)
		markers.push({
			id: "week",
			x: SPOT,
			y: WEEK_PNL,
			label: t([
				`a week on · ${wholeUsd(WEEK_PNL)}`,
				`一周后 · ${wholeUsd(WEEK_PNL)}`,
			]),
			tone: "loss",
			labelBelow: true,
		});
	const result: ResultItem[] =
		shown.stage === 0
			? [
					{
						id: "delta",
						label: t(["Delta", "Delta"]),
						value: "0",
						note: t([
							`after shorting ${count(HEDGE)} shares`,
							`做空 ${count(HEDGE)} 股之后`,
						]),
						evidence: "modeled",
					},
					{
						id: "gamma",
						label: t(["Gamma", "Gamma"]),
						value: t([
							`${signedCount(Math.round(GAMMA))} shares per $1`,
							`每 $1 ${signedCount(Math.round(GAMMA))} 股`,
						]),
						note: t(["delta returns as ALFA moves", "ALFA 一动，Delta 就回来"]),
						evidence: "modeled",
					},
				]
			: shown.stage === 1
				? [
						{
							id: "move",
							label: t([`ALFA +$${UP} at once`, `ALFA 立即 +$${UP}`]),
							value: wholeUsd(UP_PNL),
							tone: "gain",
							evidence: "modeled",
						},
						{
							id: "delta",
							label: t(["Delta now", "此时的 Delta"]),
							value: t([
								`${signedCount(UP_DELTA)} shares`,
								`${signedCount(UP_DELTA)} 股`,
							]),
							note: t(["the hedge no longer fits", "对冲已不再合适"]),
							evidence: "modeled",
						},
					]
				: [
						{
							id: "week",
							label: t(["A week, ALFA unchanged", "一周，ALFA 不变"]),
							value: wholeUsd(WEEK_PNL),
							tone: "loss",
							evidence: "modeled",
						},
						{
							id: "theta",
							label: t(["Theta", "Theta"]),
							value: t([`${wholeUsd(THETA)} a day`, `每天 ${wholeUsd(THETA)}`]),
							note: t(["and growing toward expiry", "越近到期越大"]),
							evidence: "modeled",
						},
						{
							id: "vega",
							label: t(["Vega", "Vega"]),
							value: t([
								`${wholeUsd(VEGA)} per vol point`,
								`每个波动率点 ${wholeUsd(VEGA)}`,
							]),
							note: t(["still exposed to IV", "仍暴露于隐含波动率"]),
							evidence: "modeled",
						},
					];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The delta-hedged book's P&L against ALFA's price: flat at today's price and curving up on both sides, and a week later lower almost everywhere",
						"Delta 对冲后的账户盈亏随 ALFA 价格的变化：在今天的价格处是平的、两侧向上弯；一周后几乎处处更低",
					])}
					height={(width) => (width < 520 ? 250 : 280)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 250 : 280}
							xRange={[95, 107]}
							yRange={[-1_500, 2_000]}
							xTicks={[95, 98, 101, 104, 107]}
							yTicks={[-1_000, 0, 1_000]}
							lines={lines}
							markers={markers}
							formatY={(value) =>
								value === 0 ? "$0" : signedUsd(value * 100, 0)
							}
							xLabel={t(["ALFA price", "ALFA 价格"])}
							title={t([
								`Hedged book · short ${count(HEDGE)} shares · P&L from Monday's close`,
								`对冲后的账户 · 做空 ${count(HEDGE)} 股 · 自周一收盘的盈亏`,
							])}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Scenario", "情景"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", t(["Hedged", "已对冲"])],
							["1", `ALFA +$${UP}`],
							["2", t(["A week", "一周"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as HedgeState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Shorting shares until delta is zero neutralizes first-order price exposure at one price and one moment. Gamma brings delta back as soon as ALFA moves, theta charges for each passing day, and vega moves the book with implied volatility. A hedge changes which risks you hold and adds its own costs; it doesn't make the book riskless.",
						"做空股票直到 Delta 为零，只是在某个价格、某个时刻中和了一阶价格敞口。ALFA 一动，Gamma 就把 Delta 带回来；Theta 为流逝的每一天收费；Vega 让账户随隐含波动率变动。对冲改变的是你持有哪些风险，还会带来自身的成本；它并不会让账户没有风险。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: units and timestamps ———

type FeedState = { stage: 0 | 1 | 2 };

const CALL_VEGA = round3(CALL.vega);
/** The second broker's convention: vega per 1.00 of volatility, 100 vol points. */
const PUT_VEGA_PER_UNIT = Math.round(PUT.vega * 100 * 100) / 100;
const PUT_VEGA = round3(PUT_VEGA_PER_UNIT / 100);
const VEGA_TOTAL = Math.round(CALLS * 100 * CALL_VEGA + PUTS * 100 * PUT_VEGA);
const RAW_SUM = (CALL_VEGA + PUT_VEGA_PER_UNIT).toFixed(3);

const FEED_ROW = (width: number) => (width < 520 ? 58 : 44);

function FeedTable({
	width,
	state,
	locale,
}: {
	width: number;
	state: FeedState;
	locale: Locale;
}) {
	const t = tr(locale);
	const narrow = width < 520;
	const rowHeight = FEED_ROW(width);
	const monday: Copy = ["Mon 16:00", "周一 16:00"];
	const rows: {
		id: string;
		label: Copy;
		value: string;
		unit: Copy;
		time: Copy;
		flag: boolean;
	}[] = [
		{
			id: "call-vega",
			label: ["Call vega · main broker", "看涨 Vega · 主券商"],
			value: CALL_VEGA.toFixed(3),
			unit: ["per vol point", "每个波动率点"],
			time: monday,
			flag: false,
		},
		{
			id: "put-vega",
			label: ["Put vega · 2nd broker", "看跌 Vega · 第二券商"],
			value:
				state.stage >= 1 ? PUT_VEGA.toFixed(3) : PUT_VEGA_PER_UNIT.toFixed(2),
			unit:
				state.stage >= 1
					? ["per vol point", "每个波动率点"]
					: ["per 1.00 of vol", "每 1.00 波动率"],
			time: monday,
			flag: state.stage === 1,
		},
		{
			id: "put-delta",
			label: ["Put delta · 2nd broker", "看跌 Delta · 第二券商"],
			value: fixed3(round3(PUT_FRIDAY.delta)),
			unit: ["per share", "每股"],
			time: ["Fri 16:00", "周五 16:00"],
			flag: state.stage === 2,
		},
	];
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t(["Greeks as each broker sent them", "各券商发来的希腊值"])}
			</Label>
			{rows.map((row, i) => {
				const y = 28 + i * (rowHeight + 6);
				return (
					<g key={row.id}>
						<rect
							x={4}
							y={y}
							width={width - 8}
							height={rowHeight}
							rx={8}
							className={row.flag ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<Label x={14} y={y + 18} tone="small">
							{t(row.label)}
						</Label>
						<Label
							x={width - 14}
							y={y + 19}
							anchor="end"
							tone={row.flag ? "accent" : undefined}
						>
							{row.value}
						</Label>
						<Label
							x={narrow ? 14 : width - 14}
							y={narrow ? y + 40 : y + 35}
							anchor={narrow ? "start" : "end"}
							tone="small"
						>
							{`${t(row.unit)} · ${t(row.time)}`}
						</Label>
					</g>
				);
			})}
		</g>
	);
}

function FeedView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: FeedState;
	explore: FeedState | null;
	setExplore: (next: FeedState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [];
	if (shown.stage === 0 && phase === "explore")
		result.push({
			id: "raw",
			label: t(["Added as sent", "按原样相加"]),
			value: RAW_SUM,
			note: t(["two units mixed: meaningless", "混用两种单位：没有意义"]),
			tone: "loss",
			evidence: "calculated",
		});
	if (shown.stage >= 1)
		result.push({
			id: "vega",
			label: t(["Portfolio vega", "组合 Vega"]),
			value: t([
				`${signedUsd(VEGA_TOTAL * 100, 0)} per point`,
				`每点 ${signedUsd(VEGA_TOTAL * 100, 0)}`,
			]),
			note: t([
				`puts ${PUT_VEGA_PER_UNIT.toFixed(2)} ÷ 100 = ${PUT_VEGA.toFixed(3)}`,
				`看跌 ${PUT_VEGA_PER_UNIT.toFixed(2)} ÷ 100 = ${PUT_VEGA.toFixed(3)}`,
			]),
			evidence: "calculated",
		});
	if (shown.stage >= 2)
		result.push({
			id: "stale",
			label: t(["The puts' delta, Friday's", "看跌 Delta，周五的"]),
			value: t([
				`${signedCount(PUT_DELTA_FRIDAY)} shares`,
				`${signedCount(PUT_DELTA_FRIDAY)} 股`,
			]),
			note: t([
				`Monday's is ${signedCount(PUT_DELTA)}`,
				`周一的是 ${signedCount(PUT_DELTA)}`,
			]),
			tone: "loss",
			evidence: "modeled",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Greeks from two brokers with their units and timestamps: one vega quoted per whole unit of volatility, and a put delta stamped with Friday's close",
						"来自两家券商的希腊值及其单位和时间戳：一个 Vega 按完整的波动率单位报价，一个看跌 Delta 带着周五收盘的时间戳",
					])}
					height={(width) => 28 + 3 * (FEED_ROW(width) + 6) + 4}
				>
					{(width) => <FeedTable width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", t(["As sent", "原样"])],
							["1", t(["Converted", "已换算"])],
							["2", t(["Timestamps", "时间戳"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as FeedState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Before adding sensitivities, put them in one unit and at one valuation time. Vega per vol point and vega per 1.00 of volatility differ by 100; theta per day and per year by 365. A Greek computed at Friday's price describes Friday's book. Recompute it, or disclose which inputs are stale; never treat a missing or stale input as current or as zero.",
						"在把敏感度相加之前，先把它们换成同一单位、同一估值时点。每个波动率点的 Vega 与每 1.00 波动率的 Vega 相差 100 倍；每天的 Theta 与每年的 Theta 相差 365 倍。用周五价格算出的希腊值描述的是周五的账户。要么重新计算，要么说明哪些输入已过时；绝不要把缺失或过时的输入当作当前值或零。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<CoverState, CoverState>({
		id: "cover",
		label: ["Build a covered subtotal", "构建已覆盖小计"],
		title: ["A hedge can't fill a missing holding", "对冲不能补齐缺失的持仓"],
		predict: {
			prompt: [
				`Your main account's stock and calls add up to ${signedCount(SUBTOTAL)} shares of delta. The ${PUTS} puts in your second account haven't reported Greeks yet. What's your portfolio's delta?`,
				`你主账户里的股票和看涨合计 ${signedCount(SUBTOTAL)} 股 Delta。第二个账户里的 ${PUTS} 张看跌还没有报送希腊值。你的组合 Delta 是多少？`,
			],
			choices: [
				{
					id: "unknown",
					label: [
						`Unknown until the puts report; ${signedCount(SUBTOTAL)} covers two of three`,
						`看跌报送前未知；${signedCount(SUBTOTAL)} 只覆盖三项中的两项`,
					],
				},
				{
					id: "subtotal",
					label: [
						`${signedCount(SUBTOTAL)}: missing counts as zero`,
						`${signedCount(SUBTOTAL)}：缺失按零计`,
					],
				},
				{
					id: "more",
					label: [
						`More than ${signedCount(SUBTOTAL)}: puts add delta`,
						`大于 ${signedCount(SUBTOTAL)}：看跌会增加 Delta`,
					],
				},
			],
			answer: "unknown",
			revealAt: 1,
			explain: [
				`Missing is unknown, not zero. Protective puts carry negative delta, so ${signedCount(SUBTOTAL)} overstates the total: they turn out to be ${signedCount(PUT_DELTA)}, for ${signedCount(TOTAL)} in all.`,
				`缺失是未知，不是零。保护性看跌带负 Delta，所以 ${signedCount(SUBTOTAL)} 高估了合计：报送后它们是 ${signedCount(PUT_DELTA)}，总计 ${signedCount(TOTAL)}。`,
			],
		},
		beats: [
			{
				id: "holdings",
				label: ["Holdings", "持仓"],
				caption: [
					`Monday's close, ALFA $${SPOT.toFixed(2)}: your ${yourAccount.shares} shares give ${signedCount(STOCK_DELTA)} and your ${CALLS} calls ${signedCount(CALL_DELTA)}. The ${PUTS} puts in your second account haven't reported Greeks.`,
					`周一收盘，ALFA $${SPOT.toFixed(2)}：你的 ${yourAccount.shares} 股带来 ${signedCount(STOCK_DELTA)}，${CALLS} 张看涨带来 ${signedCount(CALL_DELTA)}。第二个账户里的 ${PUTS} 张看跌还没有报送希腊值。`,
				],
				state: { stage: 0 },
			},
			{
				id: "subtotal",
				label: ["Subtotal", "小计"],
				caption: [
					`Missing isn't zero: ${signedCount(SUBTOTAL)} is a covered subtotal, two holdings of three. A hedge sized on it can't account for the puts.`,
					`缺失不是零：${signedCount(SUBTOTAL)} 是已覆盖小计，只含三项持仓中的两项。按它确定的对冲照顾不到看跌。`,
				],
				state: { stage: 1 },
			},
			{
				id: "total",
				label: ["Total", "合计"],
				caption: [
					`The second account reports: ${PUTS} × 100 × ${fixed3(round3(PUT.delta))} ≈ ${signedCount(PUT_DELTA)}. Portfolio delta is ${signedCount(TOTAL)}; shorting ${count(SUBTOTAL)} shares would have left you net short ${count(SUBTOTAL - TOTAL)}.`,
					`第二个账户报送：${PUTS} × 100 × ${fixed3(round3(PUT.delta))} ≈ ${signedCount(PUT_DELTA)}。组合 Delta 为 ${signedCount(TOTAL)}；做空 ${count(SUBTOTAL)} 股会让你净空 ${count(SUBTOTAL - TOTAL)} 股。`,
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: [
				"Switch the puts' Greeks between missing and reported.",
				"在缺失与已报送之间切换看跌的希腊值。",
			],
			start: () => ({ stage: 1 }),
		},
		View: CoverView,
	}),
	defineScene<HedgeState, HedgeState>({
		id: "hedge",
		label: ["Stress local neutrality", "检验局部中性"],
		title: [
			"Zero delta leaves other sensitivities",
			"Delta 为零，其他敏感度仍在",
		],
		predict: {
			prompt: [
				`You short ${count(HEDGE)} ALFA shares, so your delta is 0. If a week passes and ALFA doesn't move, your P&L is…`,
				`你做空 ${count(HEDGE)} 股 ALFA，让 Delta 为 0。如果一周过去而 ALFA 不动，你的盈亏是……`,
			],
			choices: [
				{
					id: "zero",
					label: ["$0: delta is zero", "$0：Delta 为零"],
				},
				{
					id: "theta",
					label: [
						`About ${wholeUsd(WEEK_PNL)}: time decay`,
						`约 ${wholeUsd(WEEK_PNL)}：时间损耗`,
					],
				},
				{
					id: "gamma",
					label: [
						`About ${wholeUsd(-WEEK_PNL)}: gamma pays`,
						`约 ${wholeUsd(-WEEK_PNL)}：Gamma 赚钱`,
					],
				},
			],
			answer: "theta",
			revealAt: 2,
			explain: [
				`Delta was zero, but theta wasn't: about ${wholeUsd(THETA)} a day and growing toward expiry. Gamma only pays when ALFA moves; a quiet week costs ${wholeUsd(WEEK_PNL)}.`,
				`Delta 为零，但 Theta 不是：约每天 ${wholeUsd(THETA)}，越近到期越大。Gamma 只有在 ALFA 变动时才赚钱；平静的一周要花掉 ${wholeUsd(WEEK_PNL)}。`,
			],
		},
		beats: [
			{
				id: "hedged",
				label: ["Hedged", "已对冲"],
				caption: [
					`Short ${count(HEDGE)} shares and delta is zero at $${SPOT.toFixed(2)}. The P&L curve is flat there and bends up on both sides: gamma, ${signedCount(Math.round(GAMMA))} shares of delta per $1.`,
					`做空 ${count(HEDGE)} 股后，在 $${SPOT.toFixed(2)} 处 Delta 为零。盈亏曲线在那里是平的，两侧向上弯：这就是 Gamma，每 $1 ${signedCount(Math.round(GAMMA))} 股 Delta。`,
				],
				state: { stage: 0 },
			},
			{
				id: "up",
				label: [`ALFA +$${UP}`, `ALFA +$${UP}`],
				caption: [
					`If ALFA jumps $${UP} at once the book makes ${wholeUsd(UP_PNL)}, and its delta is now ${signedCount(UP_DELTA)}: the hedge no longer fits.`,
					`如果 ALFA 立即上涨 $${UP}，账户赚 ${wholeUsd(UP_PNL)}，Delta 变为 ${signedCount(UP_DELTA)}：对冲已不再合适。`,
				],
				state: { stage: 1 },
			},
			{
				id: "week",
				label: ["A week", "一周"],
				caption: [
					`If instead a week passes with ALFA unchanged, the whole curve sinks: ${wholeUsd(WEEK_PNL)} from time decay, though the price never moved.`,
					`如果换成一周过去、ALFA 不变，整条曲线下沉：时间损耗带来 ${wholeUsd(WEEK_PNL)}，尽管价格一点没动。`,
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Switch between the scenarios.", "在各情景之间切换。"],
			start: () => ({ stage: 2 }),
		},
		View: HedgeView,
	}),
	defineScene<FeedState, FeedState>({
		id: "units",
		label: ["Align units and timestamps", "对齐单位与时点"],
		title: [
			"Comparable inputs come before totals",
			"先有可比较的输入，再有合计",
		],
		predict: {
			prompt: [
				`Your main broker quotes the calls' vega per vol point (${CALL_VEGA.toFixed(3)}); the second broker quotes the puts' per 1.00 of volatility (${PUT_VEGA_PER_UNIT.toFixed(2)}). To add them you…`,
				`主券商按每个波动率点报看涨的 Vega（${CALL_VEGA.toFixed(3)}）；第二券商按每 1.00 波动率报看跌的 Vega（${PUT_VEGA_PER_UNIT.toFixed(2)}）。要把它们相加，你需要……`,
			],
			choices: [
				{
					id: "add",
					label: [`Add them: ${RAW_SUM}`, `直接相加：${RAW_SUM}`],
				},
				{
					id: "convert",
					label: [
						`Convert the puts' to per point first: ${PUT_VEGA.toFixed(3)}`,
						`先把看跌的换成每点：${PUT_VEGA.toFixed(3)}`,
					],
				},
				{
					id: "drop",
					label: [
						"Leave the puts out; use one broker",
						"不计看跌，只用一家券商",
					],
				},
			],
			answer: "convert",
			revealAt: 1,
			explain: [
				`One unit of volatility is 100 vol points, so ${PUT_VEGA_PER_UNIT.toFixed(2)} ÷ 100 = ${PUT_VEGA.toFixed(3)} per point. Weighted by position, the book's vega is ${signedUsd(VEGA_TOTAL * 100, 0)} per vol point.`,
				`一个完整的波动率单位是 100 个波动率点，所以 ${PUT_VEGA_PER_UNIT.toFixed(2)} ÷ 100 = 每点 ${PUT_VEGA.toFixed(3)}。按持仓加权，账户的 Vega 是每个波动率点 ${signedUsd(VEGA_TOTAL * 100, 0)}。`,
			],
		},
		beats: [
			{
				id: "sent",
				label: ["As sent", "原样"],
				caption: [
					"Two brokers, two vega conventions, and a timestamp on every number.",
					"两家券商，两种 Vega 约定，每个数字都带着时间戳。",
				],
				state: { stage: 0 },
			},
			{
				id: "convert",
				label: ["Converted", "已换算"],
				caption: [
					`Convert the puts' vega to per point, then weight by position: ${CALLS} × 100 × ${CALL_VEGA.toFixed(3)} + ${PUTS} × 100 × ${PUT_VEGA.toFixed(3)} ≈ ${signedUsd(VEGA_TOTAL * 100, 0)} per vol point.`,
					`把看跌的 Vega 换成每点，再按持仓加权：${CALLS} × 100 × ${CALL_VEGA.toFixed(3)} + ${PUTS} × 100 × ${PUT_VEGA.toFixed(3)} ≈ 每个波动率点 ${signedUsd(VEGA_TOTAL * 100, 0)}。`,
				],
				state: { stage: 1 },
			},
			{
				id: "stale",
				label: ["Timestamps", "时间戳"],
				caption: [
					`The second broker's put delta is stamped Friday, when ALFA closed at $${FRIDAY_SPOT.toFixed(2)}: it gives ${signedCount(PUT_DELTA_FRIDAY)} shares, not Monday's ${signedCount(PUT_DELTA)}. Recompute at one time, or say which inputs are stale.`,
					`第二券商的看跌 Delta 时间戳是周五，当时 ALFA 收于 $${FRIDAY_SPOT.toFixed(2)}：它给出 ${signedCount(PUT_DELTA_FRIDAY)} 股，而不是周一的 ${signedCount(PUT_DELTA)}。要在同一时点重新计算，或者说明哪些输入已过时。`,
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: ["Step through the feeds.", "逐步查看各数据源。"],
			start: () => ({ stage: 0 }),
		},
		View: FeedView,
	}),
] as const;

export function PortfolioExposureWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="portfolio-exposure"
			label={["Interactive lesson on portfolio Greeks", "组合希腊值互动课"]}
			scenes={scenes}
		/>
	);
}
