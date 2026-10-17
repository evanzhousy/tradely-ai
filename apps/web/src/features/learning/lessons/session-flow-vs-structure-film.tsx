import { gsap } from "gsap";
import {
	type Copy,
	count,
	expiries,
	holders,
	openInterestChange,
	pick,
	signedCount,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import type { Film, FilmContext } from "../walkthrough/film";
import {
	Backdrop,
	Brackets,
	createDirector,
	EndCard,
	filmFrame,
	Lines,
	lineCount,
	signTone,
	TitleCard,
	toneClass,
} from "../walkthrough/film-kit";
import {
	MON_CLOSE,
	MON_OPEN,
	TUE_REPORT,
} from "../walkthrough/instruments/session-clock";
import {
	bucketFacts,
	day,
	earlier,
	inBucket,
	later,
	ledgerBeats,
	minuteOf,
	stripExpiries,
} from "./session-flow-vs-structure-model";

/*
 * Volume and open interest, as a film. A hundred contracts are open; you buy 10 to open and
 * Ben sells 10 to open: does open interest rise by 10 or by 20? Two counters answer, trade
 * by trade: both open, +10; one opens and one closes, ±0; both close, −4. The hero is the
 * clock: Monday closes with volume 20; the true count, 106, steps aside, not yet published,
 * while the open interest shown holds Friday's 100, until Tuesday's report turns it to 106
 * and glowing brackets lock. Last, a 14–30 day bucket that jumps from 420 to 650: first
 * because a week moved its members, then by the few contracts that opened.
 *
 *   open      0–4        "Volume and open interest"
 *   question  4–8.6      100 open; 10 bought to open, 10 sold to open: +10 or +20?
 *   ledger    8.6–22.65  both open +10; changed hands ±0; both closed −4
 *   clock     22.65–32.55 hero: Monday's close holds; the overnight move leads to publication
 *   bucket    32.55–41.85 420 holds 32.85–34.2; → 620 as members change (+500 in, −300 out)
 *                        at Sep 9's figures, held 35.2–37.2; clears before live growth
 *                        → 650 with 620 + 10 + 20 = 650, settled 38.3–41.85
 *   claim     41.85–45.9 volume counts trading; open interest, positions
 *   next      45.9–47.5  Next: tape rows; all three end-card children settle by END
 */

const END = 47.5;
const TRADES = day.trades;
const START_OI = day.startOpenInterest;
const AFTER = ledgerBeats.slice(1);
const FINAL = ledgerBeats[ledgerBeats.length - 1];
const OI_MAX = 120;
const BEFORE = bucketFacts({ later: false, compare: false });
const AFTER_WEEK = bucketFacts({ later: true, compare: true });
const DAYS_MAX = 42;
const VALUE_MAX = 720;
/** The bucket a week later, counted with last week's figures: what membership alone did. */
const MOVED = AFTER_WEEK.columns
	.filter((column) => column.member)
	.reduce(
		(sum, column) =>
			sum + (BEFORE.columns.find((c) => c.id === column.id)?.value ?? 0),
		0,
	);
/** Whether a week moved a series into the bucket or out of it. */
const moved = (id: string) => {
	const was = BEFORE.columns.find((c) => c.id === id)?.member;
	const is = AFTER_WEEK.columns.find((c) => c.id === id)?.member;
	return was === is ? undefined : is ? "in" : "out";
};
/** Membership operands use the same historical values as the moving columns. */
const ENTERING = BEFORE.columns
	.filter((column) => moved(column.id) === "in")
	.reduce((sum, column) => sum + column.value, 0);
const LEAVING = BEFORE.columns
	.filter((column) => moved(column.id) === "out")
	.reduce((sum, column) => sum + column.value, 0);
const MEMBERSHIP_TERMS = [
	count(BEFORE.total),
	` + ${count(ENTERING)}`,
	` − ${count(LEAVING)}`,
	` = ${count(MOVED)}`,
];
/** Only the later bucket's members contribute to its growth, in chart order. */
const GROWTH_TERMS = [
	count(MOVED),
	...AFTER_WEEK.members.map((column) => ` + ${count(column.change ?? 0)}`),
	` = ${count(AFTER_WEEK.total)}`,
];
/** Where a minute of Monday sits on the clock, with the night folded into a short gap. */
const clockAt = (minute: number, closeAt: number) =>
	minute <= MON_CLOSE
		? (closeAt * (minute - MON_OPEN)) / (MON_CLOSE - MON_OPEN)
		: closeAt +
			((1 - closeAt) * (minute - MON_CLOSE)) / (TUE_REPORT - MON_CLOSE);
/** "Sep 9" from "2030-09-09". */
const monthDay = (date: string): Copy => {
	const [, month, dayOf] = date.split("-").map(Number);
	const names = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	return [`${names[month - 1]} ${dayOf}`, `${month}月${dayOf}日`];
};
const shortDate = (date: string) => {
	const [, month, dayOf] = date.split("-").map(Number);
	return `${month}/${dayOf}`;
};
const bucketRange = (locale: Locale) => {
	const start = pick(monthDay(earlier.date), locale).toUpperCase();
	const end = pick(monthDay(later.date), locale).toUpperCase();
	return locale === "zh" ? `${start}→${end}` : `${start} → ${end}`;
};
const hhmm = (minute: number) =>
	`${String(Math.floor((minute % 1440) / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
const newContracts = (quantity: number): Copy => [
	`${signedCount(quantity)} new contracts`,
	`新增 ${signedCount(quantity)} 张`,
];
const changeClass = (value: number) => {
	const tone = signTone(value);
	return tone ? toneClass[tone] : "wt-film-dim";
};

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const statW = narrow ? room / 2 : room * 0.3;
	return {
		...frame,
		statX: (i: number) => margin + i * statW,
		statY: H * (narrow ? 0.27 : 0.28),
		/** The true count's place while the screen shows Friday's: to the right, or below. */
		ghostX: narrow ? margin : margin + 2 * statW,
		ghostDY: narrow ? frame.type.num * 2.4 : 0,
		barY: (i: number) =>
			H * (narrow ? 0.5 : 0.5) + i * H * (narrow ? 0.07 : 0.08),
		barH: H * (narrow ? 0.045 : 0.05),
		barX: margin + (narrow ? 58 : 90),
		barW: room - (narrow ? 58 : 90) - (narrow ? 42 : 60),
		tradeY: H * (narrow ? 0.76 : 0.77),
		clockY: H * (narrow ? 0.62 : 0.64),
		/** On a phone the night gets more room, so "close" and the report label stay apart. */
		clockX: (minute: number) =>
			margin + clockAt(minute, narrow ? 0.64 : 0.74) * room,
		/** The expiry strip: days to expiry across, open interest up. */
		dayX: (days: number) => margin + (days / DAYS_MAX) * room,
		floor: H * (narrow ? 0.76 : 0.8),
		// Leave a clear reading lane for the membership expression above the chart.
		top: Math.max(
			H * (narrow ? 0.46 : 0.42),
			H * (narrow ? 0.25 : 0.27) +
				frame.type.small +
				frame.type.body * 4.9 +
				18,
		),
		membershipY:
			H * (narrow ? 0.25 : 0.27) + frame.type.small + frame.type.body * 3.5,
		bucketY: H * (narrow ? 0.25 : 0.27),
	};
}

const effect = (trade: (typeof TRADES)[number], locale: Locale) => {
	const t = (value: Copy) => pick(value, locale);
	/** "You buy", "Eli buys": the verb agrees with the name. */
	const verb = (who: string, buy: boolean, open: boolean): Copy => {
		const s = who === "you" ? "" : "s";
		const en = `${buy ? "buy" : "sell"}${s} to ${open ? "open" : "close"}`;
		return [en, `${buy ? "买入" : "卖出"}${open ? "开仓" : "平仓"}`];
	};
	/** A Latin name keeps its space before a Chinese verb; "你" doesn't take one. */
	const named = (who: string, buy: boolean, open: boolean) => {
		const name = t(holders[who as keyof typeof holders].name);
		const gap = locale === "zh" && !/[A-Za-z]$/.test(name) ? "" : " ";
		return `${name}${gap}${t(verb(who, buy, open))}`;
	};
	return `${named(trade.buyer, true, trade.buyerEffect === "open")} · ${named(trade.seller, false, trade.sellerEffect === "open")}`;
};

const copy = {
	title: ["Volume and open interest", "成交量与未平仓量"],
	titleSub: ["why they move differently", "为何变化不同"],
	qTag: ["Oct 18 100 call · open interest", "10月18日 100 看涨 · 未平仓量"],
	qTagShort: ["10/18 100 call · open interest", "10/18 100 看涨 · 未平仓量"],
	qLine: [
		`You buy ${TRADES[0].quantity}; Ben sells ${TRADES[0].quantity}. Both open.`,
		`你买${TRADES[0].quantity}张；Ben 卖${TRADES[0].quantity}张；都开仓。`,
	],
	qBig: [
		`Open interest +${TRADES[0].quantity} or +${TRADES[0].quantity * 2}?`,
		`未平仓量 +${TRADES[0].quantity} 还是 +${TRADES[0].quantity * 2}？`,
	],
	lHead: [
		"Every contract: one long, one short.",
		"每张合约：一个多头，一个空头。",
	],
	l2Head: [
		`Both open: +${TRADES[0].quantity}, not +${TRADES[0].quantity * 2}.`,
		`双方开仓：+${TRADES[0].quantity}，不是 +${TRADES[0].quantity * 2}。`,
	],
	l3Head: ["Changed hands: ±0.", "换手：±0。"],
	l4Head: [
		`Both closed: −${TRADES[2].quantity}.`,
		`双方平仓：−${TRADES[2].quantity}。`,
	],
	/** What waits beside the screen at Monday's close: the count Monday ends on. */
	finalCount: ["Monday's final count", "周一最终统计"],
	unpublished: ["not published yet", "尚未公布"],
	volume: ["volume today", "今日成交量"],
	mondayVolume: ["Monday's volume", "周一成交量"],
	openInterest: ["open interest", "未平仓量"],
	ledgerOpenInterest: ["Open interest · ledger", "账本未平仓量"],
	longs: ["longs", "多头"],
	shorts: ["shorts", "空头"],
	cHead: [
		"Open interest shown waits for the daily count.",
		"显示的未平仓量要等每日统计。",
	],
	c2Head: [
		`Tuesday, it reads ${FINAL.openInterest}.`,
		`周二才显示 ${FINAL.openInterest}。`,
	],
	open930: ["Mon open", "周一开盘"],
	close: ["close", "收盘"],
	report: ["Tue report", "周二报告"],
	reportShort: ["Tue", "周二"],
	friday: [`Friday's count`, "周五的统计"],
	monday: [`Monday's count`, "周一的统计"],
	bHead: ["A bucket by days to expiry.", "按距到期天数划分的到期桶。"],
	b2Head: ["Mostly turnover, not new positions.", "成员更替为主，非新开仓。"],
	/** 620 is Sep 16's members counted at Sep 9's figures: say so while it stands. */
	wasNote: ["at Sep 9 figures", "按9月9日数据"],
	bucket: ["14–30 days", "14–30 天"],
	inBucket: ["in the bucket", "桶内合计"],
	days: ["days to expiry", "距到期天数"],
	claimBig: [
		"Volume is flow; open interest is stock.",
		"交易是流量，持仓是存量。",
	],
	claimSub: ["Compare each to itself.", "同一序列，前后对照。"],
	nextBig: ["Next: tape rows", "下一课：成交记录"],
	nextSub: ["what one record represents", "一行代表什么"],
} as const satisfies Record<string, Copy>;

function Scene({
	width,
	locale,
}: {
	width: number;
	height: number;
	locale: Locale;
}) {
	const t = (value: Copy) => pick(value, locale);
	const L = layout(width);
	const { height: H, type: T, room, narrow, margin } = L;
	const W = width;
	const headline = (name: string, text: Copy) => (
		<Lines
			name={name}
			text={t(text)}
			x={margin}
			y={L.headY}
			size={T.head}
			maxWidth={narrow ? room : room * 0.74}
			anchor="start"
		/>
	);
	const text = narrow ? T.small * 1.1 : T.body;
	const ledgerTag = t(copy.ledgerOpenInterest).toUpperCase().split(" · ");
	const stat = (name: string, tag: Copy, value: string, i: number) => (
		<g data-f={name}>
			<text
				data-f={`${name}-tag`}
				x={L.statX(i)}
				y={L.statY + T.small}
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{narrow && locale === "en" && name === "oi" ? (
					<>
						<tspan x={L.statX(i)} dy={-T.small * 1.35}>
							{ledgerTag[0]}
						</tspan>
						<tspan x={L.statX(i)} dy={T.small * 1.35}>
							{` · ${ledgerTag[1]}`}
						</tspan>
					</>
				) : (
					t(tag).toUpperCase()
				)}
			</text>
			<text
				data-f={`${name}-n`}
				x={L.statX(i)}
				y={L.statY + T.small + T.num * 1.3}
				className={`wt-film-num ${i ? "wt-film-accent" : ""}`}
				style={{ fontSize: T.num * 1.2 }}
			>
				{value}
			</text>
		</g>
	);
	const barHeight = (value: number) => ((L.floor - L.top) * value) / VALUE_MAX;
	const columns = (when: "before" | "after") =>
		stripExpiries.map((id) => {
			const facts = when === "before" ? BEFORE : AFTER_WEEK;
			const column = facts.columns.find((c) => c.id === id);
			return { id, days: column?.days ?? 0, value: column?.value ?? 0 };
		});
	const barW = narrow ? 22 : 40;
	return (
		<>
			<Backdrop frame={L} />

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				{/* Measured together in build; the OI quantity is a separate mono mark. */}
				<g data-f="q-tag">
					<text
						data-f="q-tag-copy"
						x={W / 2}
						y={H * 0.32}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(narrow ? copy.qTagShort : copy.qTag).toUpperCase()}
					</text>
					<text
						data-f="q-start"
						x={W / 2}
						y={H * 0.32}
						className="wt-film-num wt-film-accent"
						style={{ fontSize: T.small }}
					>
						{count(START_OI)}
					</text>
				</g>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.43}
					size={T.head}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
				<Lines
					name="q-big"
					text={t(copy.qBig)}
					x={W / 2}
					y={H * 0.62}
					size={T.title}
					maxWidth={room}
				/>
			</g>

			{/* Two counters and the balance of longs and shorts. */}
			{headline("l-head", copy.lHead)}
			{/* The question's answer, as the first trade's count lands. */}
			<Lines
				name="l2-head"
				text={t(copy.l2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.lHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{headline("l3-head", copy.l3Head)}
			<Lines
				name="l4-head"
				text={t(copy.l4Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.l3Head), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{stat("vol", copy.volume, "0", 0)}
			<text
				data-f="vol-mon-tag"
				x={L.statX(0)}
				y={L.statY + T.small}
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(copy.mondayVolume).toUpperCase()}
			</text>
			{stat("oi", copy.ledgerOpenInterest, count(START_OI), 1)}
			{/* The true count, stepped aside while the screen shows Friday's. */}
			<g data-f="ghost">
				<text
					data-f="ghost-tag"
					x={L.ghostX}
					y={L.statY + L.ghostDY + T.small}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.finalCount).toUpperCase()}
				</text>
				<text
					data-f="ghost-n"
					x={L.ghostX}
					y={L.statY + L.ghostDY + T.small + T.num * 1.3}
					className="wt-film-num wt-film-accent"
					style={{ fontSize: T.num * 1.2 }}
				>
					{count(FINAL.openInterest)}
				</text>
			</g>
			{([["ghost-note", copy.unpublished]] as const).map(([name, label]) => (
				<text
					key={name}
					data-f={name}
					x={L.ghostX + (narrow ? T.num * 2.6 : 0)}
					y={
						L.statY +
						L.ghostDY +
						T.small +
						T.num * 1.3 +
						(narrow ? 0 : T.small * 2)
					}
					className="wt-film-type wt-film-dim"
					style={{ fontSize: T.small }}
				>
					{t(label)}
				</text>
			))}
			<g data-f="shown">
				<text
					x={L.statX(1)}
					y={L.statY + T.small}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.openInterest).toUpperCase()}
				</text>
				<text
					data-f="shown-n"
					x={L.statX(1)}
					y={L.statY + T.small + T.num * 1.68}
					className="wt-film-num wt-film-accent"
					style={{ fontSize: T.num * 1.6 }}
				>
					{count(START_OI)}
				</text>
			</g>
			<Brackets name="lock-oi" glow />
			{(
				[
					["long", copy.longs],
					["short", copy.shorts],
				] as const
			).map(([name, label], i) => (
				<g key={name} data-f={`bal-${name}`}>
					<text
						x={margin}
						y={L.barY(i) + L.barH / 2 + T.small * 0.4}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(label).toUpperCase()}
					</text>
					<rect
						data-f={`bar-${name}`}
						x={L.barX}
						y={L.barY(i)}
						width={(START_OI / OI_MAX) * L.barW}
						height={L.barH}
						rx={4}
						className="wt-film-bar"
						data-tone="neutral"
					/>
					<text
						data-f={`bar-${name}-n`}
						x={L.barX + L.barW + (narrow ? 38 : 56)}
						y={L.barY(i) + L.barH / 2 + text * 0.36}
						textAnchor="end"
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{count(START_OI)}
					</text>
				</g>
			))}
			{TRADES.map((trade, i) => (
				<g key={trade.id} data-f={`trade-${i}`}>
					<text
						x={margin}
						y={L.tradeY}
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{`${trade.time} · ${count(trade.quantity)}`}
					</text>
					<Lines
						name={`trade-${i}-who`}
						text={effect(trade, locale)}
						x={margin}
						y={L.tradeY + text * 1.6}
						size={text}
						maxWidth={room}
						anchor="start"
						className="wt-film-type wt-film-dim"
					/>
					<text
						x={margin + room}
						y={L.tradeY}
						textAnchor="end"
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{`${t(copy.openInterest)} `}
						<tspan className={changeClass(openInterestChange(trade))}>
							{openInterestChange(trade)
								? signedCount(openInterestChange(trade))
								: "±0"}
						</tspan>
					</text>
				</g>
			))}

			{/* The clock: Monday's session and Tuesday's report. */}
			{headline("c-head", copy.cHead)}
			{/* The hero's answer, as Tuesday's report turns the count. */}
			<Lines
				name="c2-head"
				text={t(copy.c2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.cHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<g data-f="clock">
				<path
					d={`M${L.clockX(MON_OPEN)} ${L.clockY}H${L.clockX(MON_CLOSE)}`}
					className="wt-axis"
					strokeWidth={2}
				/>
				<path
					d={`M${L.clockX(MON_CLOSE)} ${L.clockY}H${L.clockX(TUE_REPORT)}`}
					className="wt-film-link"
				/>
				{(
					[
						[MON_OPEN, copy.open930, "start"],
						[MON_CLOSE, copy.close, "middle"],
						[TUE_REPORT, narrow ? copy.reportShort : copy.report, "end"],
					] as const
				).map(([minute, label, anchor]) => (
					<g key={minute}>
						<path
							d={`M${L.clockX(minute)} ${L.clockY - 8}V${L.clockY + 8}`}
							className="wt-axis"
						/>
						<text
							data-f={`clock-label-${minute}`}
							x={L.clockX(minute)}
							y={L.clockY + T.small * 2.4}
							textAnchor={anchor}
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{t(label).toUpperCase()}
						</text>
					</g>
				))}
			</g>
			{TRADES.map((trade, i) => (
				<g key={trade.id} data-f={`tick-${i}`}>
					<circle
						data-f={`tick-dot-${i}`}
						cx={L.clockX(minuteOf(trade.time))}
						cy={L.clockY}
						r={5}
						className="wt-chip"
					/>
				</g>
			))}
			{/* The playhead spans the track only, so it passes under no label. */}
			<g data-f="head">
				<path
					d={`M${L.clockX(MON_CLOSE)} ${L.clockY - 11}V${L.clockY + 11}`}
					style={{ stroke: "var(--diagram-accent)", strokeWidth: 2 }}
				/>
			</g>
			<text
				data-f="clock-time"
				x={margin + room}
				y={L.clockY + T.small * 5}
				textAnchor="end"
				className="wt-film-num wt-film-dim"
				style={{ fontSize: T.small * 1.2 }}
			>
				{hhmm(MON_CLOSE)}
			</text>
			{(
				[
					["oi-fri", copy.friday],
					["oi-mon", copy.monday],
				] as const
			).map(([name, label]) => (
				<text
					key={name}
					data-f={name}
					x={L.statX(1)}
					y={L.statY + T.small + T.num * 1.68 + T.small * 2}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(label).toUpperCase()}
				</text>
			))}
			{/* A bucket defined by days, as the days move. */}
			{headline("b-head", copy.bHead)}
			{/* The answer, as the bucket's count lands. */}
			<Lines
				name="b2-head"
				text={t(copy.b2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.bHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<g data-f="strip">
				<rect
					data-f="band"
					x={L.dayX(14)}
					y={L.top - 10}
					width={L.dayX(30) - L.dayX(14)}
					height={L.floor - L.top + 10}
					rx={8}
					className="wt-band-neutral"
				/>
				<text
					x={(L.dayX(14) + L.dayX(30)) / 2}
					y={L.top - 18}
					textAnchor="middle"
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.bucket).toUpperCase()}
				</text>
				<path
					d={`M${margin} ${L.floor}H${margin + room}`}
					className="wt-axis"
				/>
				{[0, 7, 14, 21, 30, 42].map((d) => (
					<text
						key={d}
						x={L.dayX(d)}
						y={L.floor + T.small * 3.6}
						textAnchor={d === 0 ? "start" : d === DAYS_MAX ? "end" : "middle"}
						className="wt-film-num wt-film-dim"
						style={{ fontSize: T.small * 0.95 }}
					>
						{d}
					</text>
				))}
				<text
					x={margin + room}
					y={L.floor + T.small * 5.2}
					textAnchor="end"
					className="wt-film-tag"
					style={{ fontSize: T.small * 0.95 }}
				>
					{t(copy.days).toUpperCase()}
				</text>
			</g>
			{columns("before").map((column) => {
				const x = L.dayX(column.days) - barW / 2;
				return (
					<g key={column.id} data-f={`col-${column.id}`}>
						<rect
							data-f={`colbar-${column.id}`}
							x={x}
							y={L.floor - barHeight(column.value)}
							width={barW}
							height={barHeight(column.value)}
							rx={3}
							className="wt-film-bar"
							data-tone={
								BEFORE.columns.find((c) => c.id === column.id)?.member
									? "total"
									: "neutral"
							}
						/>
						<text
							data-f={`colv-${column.id}`}
							x={L.dayX(column.days)}
							y={L.floor - barHeight(column.value) - 6}
							textAnchor="middle"
							className="wt-film-num"
							style={{ fontSize: T.small * 1.05 }}
						>
							{count(column.value)}
						</text>
						<text
							x={L.dayX(column.days)}
							y={L.floor + T.small * 1.6}
							textAnchor="middle"
							className="wt-film-type wt-film-dim"
							style={{ fontSize: T.small }}
						>
							{narrow
								? shortDate(expiries[column.id].date)
								: t(expiries[column.id].label)}
						</text>
						{/* A week's membership change, over the bar that came in or left. */}
						{moved(column.id) ? (
							<text
								data-f={`colm-${column.id}`}
								x={L.dayX(column.days)}
								y={L.floor - barHeight(column.value) - 6 - T.small * 1.4}
								textAnchor="middle"
								className={`wt-film-num ${toneClass[moved(column.id) === "in" ? "up" : "down"]}`}
								style={{ fontSize: T.small * 1.05 }}
							>
								{moved(column.id) === "in"
									? `+${count(column.value)}`
									: `−${count(column.value)}`}
							</text>
						) : null}
						<text
							data-f={`colc-${column.id}`}
							x={L.dayX(column.days)}
							y={L.floor - barHeight(column.value) - 6 - T.small * 1.4}
							textAnchor="middle"
							className="wt-film-num wt-film-dim"
							style={{ fontSize: T.small * 1.05 }}
						>
							{signedCount(0)}
						</text>
					</g>
				);
			})}
			{[earlier.date, later.date].map((date, i) => {
				const label =
					i === 0
						? `${t(copy.inBucket).toUpperCase()} · ${t(monthDay(date)).toUpperCase()}`
						: bucketRange(locale);
				return (
					<text
						key={date}
						data-f={`bt-${i}`}
						x={margin}
						y={L.bucketY + T.small}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{label}
					</text>
				);
			})}
			<text
				data-f="bucket-n"
				x={margin + room}
				y={L.bucketY + T.small}
				textAnchor="end"
				className="wt-film-num wt-film-accent"
				style={{ fontSize: T.num }}
			>
				{count(BEFORE.total)}
			</text>
			{/* The historical basis and live growth both belong to the total above them. */}
			{(
				[
					["note-was", copy.wasNote],
					["note-new", newContracts(0)],
				] as const
			).map(([name, label]) => (
				<text
					key={name}
					data-f={name}
					x={margin + room}
					y={L.bucketY + T.small + T.body * 1.5}
					textAnchor="end"
					className={`wt-film-type ${name === "note-new" ? "wt-film-dim" : ""}`}
					style={{ fontSize: T.body }}
				>
					{t(label)}
				</text>
			))}
			<text
				data-f="membership-sum"
				x={margin}
				y={L.membershipY}
				className="wt-film-num"
				style={{ fontSize: T.body * 1.2 }}
			>
				{MEMBERSHIP_TERMS.map((term, i) => (
					<tspan
						key={term}
						data-f={`membership-term-${i}`}
						className={i === 3 ? toneClass.focus : undefined}
					>
						{term}
					</tspan>
				))}
			</text>
			{/* Reuse the historical calculation's lane only after live growth has settled. */}
			<text
				data-f="growth-sum"
				x={margin}
				y={L.membershipY}
				className="wt-film-num"
				style={{ fontSize: T.body * 1.2 }}
			>
				{GROWTH_TERMS.map((term, i) => (
					<tspan
						key={`${i}-${term}`}
						className={
							i === GROWTH_TERMS.length - 1 ? toneClass.focus : undefined
						}
					>
						{term}
					</tspan>
				))}
			</text>

			<g data-f="claim">
				<Lines
					name="z-big"
					text={t(copy.claimBig)}
					x={W / 2}
					y={H * 0.4}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="z-sub"
					text={t(copy.claimSub)}
					x={W / 2}
					y={
						H * 0.4 +
						T.title * 1.15 +
						(lineCount(t(copy.claimBig), room, T.title) - 1) * T.title * 1.35
					}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			<EndCard
				frame={L}
				locale={locale}
				next={t(copy.nextBig)}
				why={t(copy.nextSub)}
			/>
		</>
	);
}

function build(context: FilmContext) {
	const { width: W } = context;
	const L = layout(W);
	const d = createDirector(context, L, END);
	const { tl, one, kids, show, hide } = d;
	const flat = (name: string) =>
		kids(name).flatMap((el) =>
			el.tagName === "g" && !el.hasAttribute("data-f")
				? [...el.children]
				: [el],
		);
	/** A line lands slightly large and settles, without overshoot. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const num = (name: string) => one<SVGTextElement>(name);
	const counter = (
		name: string,
		to: number,
		from: number,
		time: number,
		duration: number,
	) =>
		d.count(num(name), to, time, (v) => count(Math.round(v)), from, duration);
	const balanceTo = (
		to: number,
		from: number,
		time: number,
		duration: number,
	) => {
		for (const side of ["long", "short"]) {
			tl.to(
				one(`bar-${side}`),
				{
					attr: { width: (to / OI_MAX) * L.barW },
					duration,
					ease: "power2.out",
				},
				time,
			);
			counter(`bar-${side}-n`, to, from, time, duration);
		}
	};
	const heads = [
		"l-head",
		"l2-head",
		"l3-head",
		"l4-head",
		"c-head",
		"c2-head",
		"b-head",
		"b2-head",
	].map((name) => one(name));
	const trades = TRADES.map((_, i) => one(`trade-${i}`));
	const ticks = TRADES.map((_, i) => one(`tick-${i}`));
	const tickDots = TRADES.map((_, i) => one(`tick-dot-${i}`));
	const cols = stripExpiries.map((id) => one(`col-${id}`));
	const changes = stripExpiries.map((id) => one(`colc-${id}`));
	const memberChanges = AFTER_WEEK.members.map((column) =>
		one(`colc-${column.id}`),
	);
	const membershipSum = one("membership-sum");
	const membershipTerms = MEMBERSHIP_TERMS.map((_, i) =>
		one(`membership-term-${i}`),
	);
	const growthSum = one("growth-sum");
	const questionTag = num("q-tag-copy");
	const questionStart = num("q-start");
	const tagWidth = questionTag.getComputedTextLength();
	const startWidth = questionStart.getComputedTextLength();
	const tagGap = L.type.small * 0.6;
	const tagX = (W - tagWidth - tagGap - startWidth) / 2;
	gsap.set(questionTag, { attr: { x: tagX } });
	gsap.set(questionStart, { attr: { x: tagX + tagWidth + tagGap } });
	const clockTime = num("clock-time");
	const clockHead = one("head");
	const volumeReadout = num("vol-n");
	const lockOi = one<SVGGraphicsElement>("lock-oi");

	d.hidden([
		...flat("q"),
		...heads,
		one("vol"),
		one("vol-mon-tag"),
		one("oi"),
		one("oi-tag"),
		num("oi-n"),
		one("bal-long"),
		one("bal-short"),
		...trades,
		...kids("clock"),
		...ticks,
		...tickDots,
		one("head"),
		clockTime,
		one("oi-fri"),
		one("oi-mon"),
		one("ghost"),
		one("ghost-tag"),
		one("ghost-note"),
		one("shown"),
		lockOi,
		...kids("strip"),
		...cols,
		...changes,
		one("bt-0"),
		one("bt-1"),
		one("bucket-n"),
		...stripExpiries.filter((id) => moved(id)).map((id) => one(`colm-${id}`)),
		one("note-was"),
		one("note-new"),
		membershipSum,
		...membershipTerms,
		growthSum,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 4.6);
	word(one("q-big"), 5.1);

	// ——— ledger: three trades, two counters ———
	tl.addLabel("ledger", 8.6);
	// Keep the starting 100 while its surrounding question clears, then inherit it.
	hide([questionTag, one("q-line"), one("q-big")], 8.6);
	show(heads[0], 8.8);
	show(one("vol"), 8.9);
	show(one("bal-long"), 8.9, "right");
	show(one("bal-short"), 9.05, "right");
	// Enable the empty stat, then bring its label down from above during the flight's
	// final approach; the numeral travels underneath it, and the ledger still settles at 9.6.
	tl.set(one("oi"), { opacity: 1 }, 8.9);
	d.carry(questionStart, num("oi-n"), 8.95, { duration: 0.5, arc: "y" });
	show(one("oi-tag"), 9.3, "above", 0.3);
	// The full initial ledger settles at 9.6 and reads quietly until the first trade.
	/** One trade: its row comes up, volume adds it, open interest moves or doesn't. */
	const trade = (i: number, at: number) => {
		const beat = AFTER[i];
		// The closing row gets a full entrance; its counters follow its settlement.
		const closing = i === TRADES.length - 1;
		// The opening counts start only once their row has settled (at + 0.5).
		const oiAt = at + (closing ? 0.3 : i === 0 ? 1 : 0.65);
		// Count the opening volume, OI and both sides together. Later prints compare
		// exact snapshots and cut at their original settlement, preserving every rest.
		const duration = i === 0 ? 1 : 0.01;
		if (i) hide(trades[i - 1], at - 0.35, 0.3);
		show(trades[i], at, "right", closing ? 0.3 : 0.5);
		counter(
			"vol-n",
			beat.volume,
			beat.volumeBefore ?? 0,
			i === 0 ? oiAt - 0.5 : at + (closing ? 0.3 : 0.45) + 0.49,
			duration,
		);
		if (beat.openInterest === beat.openInterestBefore) {
			// The unchanged figure and its ±0 row already show that open interest stayed put.
			return;
		}
		const start = oiAt + 0.5 - duration;
		counter(
			"oi-n",
			beat.openInterest,
			beat.openInterestBefore ?? START_OI,
			start,
			duration,
		);
		balanceTo(
			beat.openInterest,
			beat.openInterestBefore ?? START_OI,
			start,
			duration,
		);
	};
	trade(0, 10.6);
	// The row settles at 11.1 and its counts run to 12.1; the answer enters after them.
	show(heads[1], 12.1);
	// Each trade row and headline keeps 3.5 s: the answer until 15.6, row 1 until 18.75,
	// row 2 and its headline until the clock at 22.65.
	trade(1, 15.25);
	d.swap([heads[0], heads[1]], heads[2], 15.6);
	trade(2, 19.1);
	show(heads[3], 19.15);
	// Keep the completed 106/106 balance: it settles at 19.9 and reads quietly until 22.65.

	// ——— clock: the hero. Volume live, open interest daily. ———
	tl.addLabel("clock", 22.65);
	d.swap([heads[2], heads[3]], heads[4], 22.65);
	d.swap(one("vol-tag"), one("vol-mon-tag"), 22.65);
	hide(trades[2], 22.65);
	// Clear the bars before the OI carry reaches the phone's lower stat.
	tl.to(
		[one("bal-long"), one("bal-short")],
		{ opacity: 0, duration: 0.35, ease: "power3.out" },
		22.65,
	);
	// The completed trades remain as dots, without repeating their quantity flights.
	tl.set(ticks, { opacity: 1 }, 22.65);
	// Keep Monday's completed volume. Its true count steps aside, unpublished,
	// while the figure a screen shows is still Friday's.
	d.carry(num("oi-n"), num("ghost-n"), 22.85, {
		duration: 0.6,
		arc: L.narrow ? "y" : undefined,
		reveal: false,
	});
	hide(one("oi"), 22.85, 0.3);
	// Unpublished, it steps back.
	tl.set(one("ghost"), { opacity: 1 }, 23.45);
	show(one("ghost-tag"), 23.45, "above", 0.3);
	tl.to(one("ghost"), { opacity: 0.7, duration: 0.4 }, 23.55);
	show(one("ghost-note"), 23.55);
	show(one("shown"), 23.25);
	show(one("oi-fri"), 23.45);
	show(kids("clock"), 22.95);
	show(clockHead, 23.15);
	show(clockTime, 23.15);
	tl.fromTo(tickDots, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 23.75);
	/** The displayed minute drives the time, playhead and completed-print volume. */
	const tue = L.narrow ? copy.reportShort : (["Tue", "周二"] as const);
	const clockState = { minute: MON_CLOSE };
	const renderClock = () => {
		gsap.set(clockHead, {
			x: L.clockX(clockState.minute) - L.clockX(MON_CLOSE),
		});
		const minute = Math.round(clockState.minute);
		clockTime.textContent =
			minute >= 1440
				? `${pick(tue, context.locale)} ${hhmm(minute)}`
				: hhmm(minute);
		volumeReadout.textContent = count(
			TRADES.reduce(
				(total, trade) =>
					total + (minuteOf(trade.time) <= minute ? trade.quantity : 0),
				0,
			),
		);
	};
	const clockTo = (to: number, from: number, at: number, duration: number) => {
		tl.fromTo(
			clockState,
			{ minute: from },
			{
				minute: to,
				duration,
				ease: "none",
				immediateRender: false,
				onUpdate: renderClock,
			},
			at,
		);
	};
	// Initialize through the same state tween, so reverse seeks restore the close too.
	clockTo(MON_CLOSE, MON_CLOSE, 22.65, 0.3);
	// The completed close tableau keeps its full 2.4 s rest, with the clock at full strength.
	clockTo(TUE_REPORT, MON_CLOSE, 26.45, 1.5);
	// Tuesday's report: the shown figure turns to the true count, which is now published.
	d.flip(one("oi-fri"), one("oi-mon"), 27.95);
	tl.set(one("oi-fri"), { opacity: 0 }, 28.25);
	// The true count, published, travels from where it waited to the screen; the screen's
	// Friday figure makes way for it.
	tl.to(num("shown-n"), { opacity: 0, duration: 0.3 }, 28.05);
	d.count(
		num("shown-n"),
		FINAL.openInterest,
		28.6,
		(v) => count(Math.round(v)),
		START_OI,
		0.01,
	);
	d.carry(num("ghost-n"), num("shown-n"), 28.05, { duration: 0.6 });
	tl.to(
		[one("ghost"), one("ghost-note")],
		{ opacity: 0, duration: 0.3 },
		28.15,
	);
	// Round the whole stat, its tag too, so no arm runs through the tag.
	d.lock(lockOi, 28.95, { around: [one("shown"), one("oi-mon")], pad: 6 });
	tl.addLabel("hero-lock", 28.95);
	show(heads[5], 28.95);
	// After the brackets and answer settle, step back only the clock below the hero.
	tl.to(
		[...kids("clock"), ...ticks, clockHead, clockTime],
		{ opacity: 0.2, duration: 0.3 },
		30.95,
	);

	// ——— bucket: a week moves the members ———
	tl.addLabel("bucket", 32.55);
	const clockShot = [
		heads[4],
		heads[5],
		one("vol"),
		one("vol-mon-tag"),
		one("shown"),
		one("ghost"),
		one("ghost-note"),
		...kids("clock"),
		...ticks,
		one("head"),
		clockTime,
		one("oi-fri"),
		one("oi-mon"),
		lockOi,
	];
	// A deliberate cut between beats replaces the outgoing clock's separate fade. The
	// hero keeps its entire settled hold, and the bucket retains a full 0.3 s entrance.
	tl.set([...clockShot, one("clock")], { opacity: 0 }, 32.55);
	// Establish the comparison together, then give all its settled marks 1.35 seconds.
	show(
		[
			heads[6],
			...kids("strip"),
			...cols,
			one("bt-0"),
			one("bucket-n"),
			one("note-was"),
		],
		32.55,
		"below",
		0.3,
	);
	// A week passes: each expiry slides 7 days closer; the band stays. Counted with last
	// week's figures first: what the members' change alone does.
	const shift = L.dayX(0) - L.dayX(7);
	const slideAt = 34.2;
	const slideDuration = 0.7;
	const after = AFTER_WEEK.columns;
	// One state drives geometry, membership, colour and every displayed figure. During the
	// slide the total is pending; otherwise it sums the same rounded member labels shown.
	const bucketState = { week: 0, growth: 0 };
	const bucketColumns = BEFORE.columns.flatMap((before) => {
		const column = after.find((column) => column.id === before.id);
		return column
			? [
					{
						before,
						after: column,
						group: one(`col-${before.id}`),
						bar: one(`colbar-${before.id}`),
						label: num(`colv-${before.id}`),
						change: num(`colc-${before.id}`),
					},
				]
			: [];
	});
	const renderBucket = () => {
		let total = 0;
		for (const column of bucketColumns) {
			const days =
				column.before.days +
				(column.after.days - column.before.days) * bucketState.week;
			const value = Math.round(
				column.before.value +
					(column.after.value - column.before.value) * bucketState.growth,
			);
			const member = inBucket(days);
			const height = ((L.floor - L.top) * value) / VALUE_MAX;
			gsap.set(column.group, { x: shift * bucketState.week });
			column.bar.setAttribute("data-tone", member ? "total" : "neutral");
			column.bar.setAttribute("y", String(L.floor - height));
			column.bar.setAttribute("height", String(height));
			column.label.setAttribute("y", String(L.floor - height - 6));
			column.label.textContent = count(value);
			column.change.setAttribute(
				"y",
				String(L.floor - height - 6 - L.type.small * 1.4),
			);
			column.change.textContent = signedCount(value - column.before.value);
			column.change.setAttribute(
				"class",
				`wt-film-num ${member ? changeClass(value - column.before.value) : "wt-film-dim"}`,
			);
			if (member) total += value;
		}
		num("bucket-n").textContent =
			bucketState.week > 0 && bucketState.week < 1 ? "—" : count(total);
		num("note-new").textContent = pick(
			newContracts(bucketState.week === 1 ? total - MOVED : 0),
			context.locale,
		);
		num("note-new").setAttribute(
			"class",
			`wt-film-type ${changeClass(bucketState.week === 1 ? total - MOVED : 0)}`,
		);
	};
	tl.fromTo(
		bucketState,
		{ week: 0, growth: 0 },
		{
			week: 1,
			duration: slideDuration,
			ease: "none",
			immediateRender: false,
			onUpdate: renderBucket,
		},
		slideAt,
	);
	// The new date finishes unfolding with the settled members and their 620 total.
	d.flip(one("bt-0"), one("bt-1"), slideAt + 0.05);
	tl.set(one("bt-0"), { opacity: 0 }, slideAt + 0.35);
	const marks = stripExpiries
		.filter((id) => moved(id))
		.map((id) => one(`colm-${id}`));
	const growthAt = 37.5;
	const growthCompleteAt = growthAt + 0.5;
	show(marks, 34.9, "above", 0.3);
	// Read the spatial membership changes as one settled calculation. The equals/result
	// pair lands only after its operands, and disappears before live growth changes them.
	// Gate the parent text too: hiding tspans alone leaves the text mark visible to scans.
	tl.set(membershipSum, { opacity: 1 }, slideAt + slideDuration - 0.3);
	tl.fromTo(
		membershipTerms.slice(0, -1),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		slideAt + slideDuration - 0.3,
	);
	// Reveal the result settled with the total; the complete row gets the full 2 s baseline.
	tl.fromTo(
		membershipTerms[3],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		slideAt + slideDuration,
	);
	// The complete member-growth comparison now arrives with its concluding headline.
	show(heads[7], growthCompleteAt, "below", 0.3);
	// All membership evidence settles by 35.2, then keeps the full 2 s quiet hold.
	// Then the week's new contracts: each series grows by tens.
	const membershipExit = 37.2;
	// Clear the historical basis smoothly while its figures are still true. Live growth
	// waits until the whole counterfactual has gone, so no fading equality becomes false.
	tl.to(
		[one("note-was"), membershipSum, ...membershipTerms, ...marks],
		{ opacity: 0, duration: 0.3 },
		membershipExit,
	);
	tl.fromTo(
		bucketState,
		{ week: 1, growth: 0 },
		{
			growth: 1,
			duration: 0.01,
			ease: "power2.out",
			immediateRender: false,
			onUpdate: renderBucket,
		},
		growthAt + 0.49,
	);
	// Begin at zero as growth starts; every annotation follows the displayed rounded values.
	show(one("note-new"), growthCompleteAt, "below", 0.3);
	// In place, without travel: each live change stays over its own column's figure.
	tl.fromTo(
		memberChanges,
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		growthCompleteAt,
	);
	// Compare the exact weekly snapshots with a cut, not a short count. The shared
	// state settles every bar, label and total before the unchanged equation entrance;
	// neither the membership rest nor the completed growth-proof hold loses time.
	tl.fromTo(
		growthSum,
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		growthCompleteAt,
	);

	// ——— claim ———
	tl.addLabel("claim", 41.85);
	// Cut to big type between beats; removing the outgoing chart fade keeps both
	// the full growth-proof pause and the claim's original reading holds.
	tl.set(
		[
			heads[6],
			heads[7],
			...kids("strip"),
			...cols,
			...changes,
			one("bt-1"),
			one("bucket-n"),
			one("note-new"),
			one("note-was"),
			membershipSum,
			...membershipTerms,
			growthSum,
		],
		{ opacity: 0 },
		41.85,
	);
	word(one("z-big"), 41.85);
	show(one("z-sub"), 42.25);

	// ——— next ———
	tl.addLabel("next", 45.9);
	hide(kids("claim"), 45.9);
	d.close(45.9);
	return tl;
}

export const sessionFlowVsStructureFilm: Film = {
	id: "session-flow-vs-structure",
	label: [
		`Volume and open interest, as a short film: Monday's three Oct 18 100 call trades against two counters, both sides opening (+${TRADES[0].quantity}), the contracts changing hands (±0) and both sides closing (${signedCount(openInterestChange(TRADES[2]))}), for volume ${FINAL.volume} and open interest ${FINAL.openInterest}; a session clock where volume moves at every print while open interest shows Friday's ${START_OI} until Tuesday's report; and a 14–30 day bucket that rises from ${BEFORE.total} to ${AFTER_WEEK.total} in a week because its members changed, while each expiry grew by tens`,
		`成交量与未平仓量短片：周一三笔 10月18日 100 看涨成交与两个计数器：双方开仓（+${TRADES[0].quantity}）、合约换手（±0）、双方平仓（${signedCount(openInterestChange(TRADES[2]))}），成交量 ${FINAL.volume}、未平仓量 ${FINAL.openInterest}；一条交易时段时间轴，成交量随每笔成交变化，未平仓量直到周二报告前都显示周五的 ${START_OI}；以及 14–30 天到期桶一周内从 ${BEFORE.total} 升到 ${AFTER_WEEK.total}，原因是成员变了，而每个到期日只增加了几十张`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Volume and open interest", "成交量与未平仓量"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "ledger", label: ["Three trades", "三笔成交"] },
		{ id: "clock", label: ["The clock", "时间"] },
		{ id: "bucket", label: ["A bucket", "到期桶"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
