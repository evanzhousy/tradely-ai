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
	createDirector,
	EndCard,
	filmFrame,
	Lines,
	lineCount,
	TitleCard,
	Word,
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
	later,
	ledgerBeats,
	minuteOf,
	stripExpiries,
} from "./session-flow-vs-structure-model";

/*
 * Volume and open interest, as a film. A hundred contracts are open; you buy 10 to open and
 * Ben sells 10 to open: does open interest rise by 10 or by 20? Two counters answer, trade
 * by trade: both open, +10; one opens and one closes, ±0; both close, −4. Then the clock:
 * volume moves at every print while open interest holds Friday's 100 until Tuesday's
 * report. Last, a 14–30 day bucket that jumps from 420 to 650 because a week moved its
 * members, not because 230 contracts opened.
 *
 *   open      0–4      "Volume and open interest"
 *   question  4–9.5    100 open; 10 bought to open, 10 sold to open: +10 or +20?
 *   ledger    9.5–20   both open +10; changed hands ±0; both close −4
 *   clock     20–30    volume all day; open interest waits for the count
 *   bucket    30–39.5  420 → 650; the members changed; each series +10, +10, +20
 *   next      39.5–42  Next: tape rows
 */

const END = 42;
const TRADES = day.trades;
const START_OI = day.startOpenInterest;
const AFTER = ledgerBeats.slice(1);
const FINAL = ledgerBeats[ledgerBeats.length - 1];
const OI_MAX = 120;
const BEFORE = bucketFacts({ later: false, compare: false });
const AFTER_WEEK = bucketFacts({ later: true, compare: true });
const DAYS_MAX = 42;
const VALUE_MAX = 720;
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
const hhmm = (minute: number) =>
	`${String(Math.floor((minute % 1440) / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const statW = narrow ? room / 2 : room * 0.3;
	return {
		...frame,
		statX: (i: number) => margin + i * statW,
		statY: H * (narrow ? 0.27 : 0.28),
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
		top: H * (narrow ? 0.38 : 0.36),
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
	return `${t(holders[trade.buyer].name)} ${t(verb(trade.buyer, true, trade.buyerEffect === "open"))} · ${t(holders[trade.seller].name)} ${t(verb(trade.seller, false, trade.sellerEffect === "open"))}`;
};

const copy = {
	title: ["Volume and open interest", "成交量与未平仓量"],
	titleSub: ["why they move differently", "为何变化不同"],
	qTag: [
		`Oct 18 100 call · ${START_OI} contracts open`,
		`10月18日 100 看涨 · 未平仓 ${START_OI} 张`,
	],
	qLine: [
		`You buy ${TRADES[0].quantity} to open; Ben sells ${TRADES[0].quantity} to open.`,
		`你买入 ${TRADES[0].quantity} 张开仓；Ben 卖出 ${TRADES[0].quantity} 张开仓。`,
	],
	qBig: [
		`Open interest +${TRADES[0].quantity} or +${TRADES[0].quantity * 2}?`,
		`未平仓量 +${TRADES[0].quantity} 还是 +${TRADES[0].quantity * 2}？`,
	],
	l0: [
		`Every open contract has one long and one short: ${START_OI} of each.`,
		`每张未平仓合约都有一个多头和一个空头：各 ${START_OI} 张。`,
	],
	l0Short: [`${START_OI} longs, ${START_OI} shorts.`, `多空各 ${START_OI}。`],
	l1: [
		`Both sides open: ${TRADES[0].quantity} new contracts exist. Open interest +${TRADES[0].quantity}, not +${TRADES[0].quantity * 2}.`,
		`双方都开仓：新增 ${TRADES[0].quantity} 张合约。未平仓量 +${TRADES[0].quantity}，而不是 +${TRADES[0].quantity * 2}。`,
	],
	l1Short: ["Both open: +10.", "双方开仓：+10。"],
	l2: [
		"One opens, one closes: the contracts only change hands. Volume rises; open interest doesn't.",
		"一方开仓、一方平仓：合约只是换手。成交量增加，未平仓量不变。",
	],
	l2Short: ["Changed hands: ±0.", "换手：±0。"],
	l3: [
		`Both close: ${TRADES[2].quantity} contracts stop existing. Volume ${FINAL.volume}, open interest ${FINAL.openInterest}.`,
		`双方平仓：${TRADES[2].quantity} 张合约不复存在。成交量 ${FINAL.volume}，未平仓量 ${FINAL.openInterest}。`,
	],
	l3Short: ["Both close: −4.", "双方平仓：−4。"],
	volume: ["volume today", "今日成交量"],
	openInterest: ["open interest", "未平仓量"],
	longs: ["longs", "多头"],
	shorts: ["shorts", "空头"],
	c0: [
		"On Monday's screen, volume counts every print as it happens.",
		"周一的屏幕上，成交量随每笔成交即时变化。",
	],
	c0Short: ["Volume: live.", "成交量：实时。"],
	c1: [
		`Open interest still reads Friday's ${START_OI}: it is counted once a day.`,
		`未平仓量仍显示周五的 ${START_OI}：它每天只统计一次。`,
	],
	c1Short: ["Open interest: daily.", "未平仓量：每日。"],
	c2: [
		`Before Tuesday's open, Monday's count arrives: ${FINAL.openInterest}.`,
		`周二开盘前，周一的统计到了：${FINAL.openInterest}。`,
	],
	c2Short: [`Tuesday: ${FINAL.openInterest}.`, `周二：${FINAL.openInterest}。`],
	open930: ["Mon open", "周一开盘"],
	close: ["close", "收盘"],
	report: ["Tue report", "周二报告"],
	reportShort: ["Tue", "周二"],
	shown: ["open interest shown", "显示的未平仓量"],
	friday: [`Friday's count`, "周五的统计"],
	monday: [`Monday's count`, "周一的统计"],
	b0: [
		`Sep 9: the 14–30 day bucket holds Sep 27 and Oct 4, ${BEFORE.total} contracts.`,
		`9月9日：14–30 天到期桶包含 9月27日 与 10月4日，共 ${BEFORE.total} 张。`,
	],
	b0Short: [`Bucket: ${BEFORE.total}.`, `到期桶：${BEFORE.total}。`],
	b1: [
		`A week later every expiry is 7 days closer: Sep 27 leaves, Oct 11 joins. ${AFTER_WEEK.total}.`,
		`一周后每个到期日都近了 7 天：9月27日 移出，10月11日 加入。${AFTER_WEEK.total}。`,
	],
	b1Short: [`A week on: ${AFTER_WEEK.total}.`, `一周后：${AFTER_WEEK.total}。`],
	b2: [
		"Compare each series with itself: the new positions are tens, not hundreds.",
		"每个序列与自身比较：新持仓是几十张，不是几百张。",
	],
	b2Short: ["Like with like.", "同类相比。"],
	bucket: ["14–30 days", "14–30 天"],
	inBucket: ["in the bucket", "桶内合计"],
	days: ["days to expiry", "距到期天数"],
	claimBig: [
		"Volume counts trades; open interest counts contracts.",
		"成交量数成交，未平仓量数合约。",
	],
	claimSub: [
		"Volume moves with every print; open interest waits for the daily count and nets opens against closes. Compare a series with itself.",
		"成交量随每笔成交变化；未平仓量等每日统计，并以开仓抵消平仓。要把同一个序列与自己比较。",
	],
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
	const headline = (name: string, text: Copy, short: Copy) => (
		<Lines
			name={name}
			text={t(narrow ? short : text)}
			x={margin}
			y={L.headY}
			size={T.head}
			maxWidth={narrow ? room : room * 0.74}
			anchor="start"
		/>
	);
	const text = narrow ? T.small * 1.1 : T.body;
	const stat = (name: string, tag: Copy, value: string, i: number) => (
		<g data-f={name}>
			<text
				x={L.statX(i)}
				y={L.statY + T.small}
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(tag).toUpperCase()}
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
				<Word
					name="q-tag"
					x={W / 2}
					y={H * 0.32}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
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
			{headline("l0", copy.l0, copy.l0Short)}
			{headline("l1", copy.l1, copy.l1Short)}
			{headline("l2", copy.l2, copy.l2Short)}
			{headline("l3", copy.l3, copy.l3Short)}
			{stat("vol", copy.volume, "0", 0)}
			{stat("oi", copy.openInterest, count(START_OI), 1)}
			{(
				[
					["long", copy.longs, "gain"],
					["short", copy.shorts, "loss"],
				] as const
			).map(([name, label, tone], i) => (
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
						data-tone={tone}
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
						className="wt-film-num wt-film-accent"
						style={{ fontSize: text }}
					>
						{`OI ${openInterestChange(trade) ? signedCount(openInterestChange(trade)) : "±0"}`}
					</text>
				</g>
			))}

			{/* The clock: Monday's session and Tuesday's report. */}
			{headline("c0", copy.c0, copy.c0Short)}
			{headline("c1", copy.c1, copy.c1Short)}
			{headline("c2", copy.c2, copy.c2Short)}
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
						cx={L.clockX(minuteOf(trade.time))}
						cy={L.clockY}
						r={5}
						className="wt-chip"
					/>
					<text
						x={L.clockX(minuteOf(trade.time))}
						y={L.clockY - 14}
						textAnchor="middle"
						className="wt-film-num wt-film-accent"
						style={{ fontSize: T.small }}
					>
						{narrow ? `+${trade.quantity}` : `${trade.time} +${trade.quantity}`}
					</text>
				</g>
			))}
			<g data-f="head">
				<path
					d={`M${L.clockX(MON_OPEN)} ${L.clockY - 26}V${L.clockY + 26}`}
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
				{hhmm(MON_OPEN)}
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
					y={L.statY + T.small + T.num * 1.3 + T.small * 2}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(label).toUpperCase()}
				</text>
			))}

			{/* A bucket defined by days, as the days move. */}
			{headline("b0", copy.b0, copy.b0Short)}
			{headline("b1", copy.b1, copy.b1Short)}
			{headline("b2", copy.b2, copy.b2Short)}
			<g data-f="strip">
				<rect
					data-f="band"
					x={L.dayX(14)}
					y={L.top - 10}
					width={L.dayX(30) - L.dayX(14)}
					height={L.floor - L.top + 10}
					rx={8}
					className="wt-band-gain"
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
			{columns("before").map((column, i) => {
				const after = columns("after")[i];
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
							{t(expiries[column.id].label)}
						</text>
						<text
							data-f={`colc-${column.id}`}
							x={L.dayX(column.days)}
							y={L.floor - barHeight(after.value) - 6 - T.small * 1.4}
							textAnchor="middle"
							className="wt-film-num wt-film-gain"
							style={{ fontSize: T.small * 1.05 }}
						>
							{signedCount(after.value - column.value)}
						</text>
					</g>
				);
			})}
			{[earlier.date, later.date].map((date, i) => (
				<text
					key={date}
					data-f={`bt-${i}`}
					x={margin}
					y={L.bucketY + T.small}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{`${t(copy.inBucket).toUpperCase()} · ${t(monthDay(date)).toUpperCase()}`}
				</text>
			))}
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
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			time,
		);
	const num = (name: string) => one<SVGTextElement>(name);
	const counter = (name: string, to: number, from: number, time: number) =>
		d.count(num(name), to, time, (v) => count(Math.round(v)), from, 0.5);
	const balanceTo = (to: number, from: number, time: number) => {
		for (const side of ["long", "short"]) {
			tl.to(
				one(`bar-${side}`),
				{
					attr: { width: (to / OI_MAX) * L.barW },
					duration: 0.5,
					ease: "power2.out",
				},
				time,
			);
			counter(`bar-${side}-n`, to, from, time);
		}
	};
	const heads = [
		"l0",
		"l1",
		"l2",
		"l3",
		"c0",
		"c1",
		"c2",
		"b0",
		"b1",
		"b2",
	].map((name) => one(name));
	const trades = TRADES.map((_, i) => one(`trade-${i}`));
	const ticks = TRADES.map((_, i) => one(`tick-${i}`));
	const cols = stripExpiries.map((id) => one(`col-${id}`));
	const changes = stripExpiries.map((id) => one(`colc-${id}`));
	const clockTime = num("clock-time");

	d.hidden([
		...flat("q"),
		...heads,
		one("vol"),
		one("oi"),
		one("bal-long"),
		one("bal-short"),
		...trades,
		...kids("clock"),
		...ticks,
		one("head"),
		clockTime,
		one("oi-fri"),
		one("oi-mon"),
		...kids("strip"),
		...cols,
		...changes,
		one("bt-0"),
		one("bt-1"),
		one("bucket-n"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 5.1);
	word(one("q-big"), 6.6);

	// ——— ledger: three trades, two counters ———
	tl.addLabel("ledger", 9.5);
	hide(flat("q"), 9.5);
	show(heads[0], 9.7, "above");
	show([one("vol"), one("oi")], 10.0);
	show(one("bal-long"), 10.4, "right");
	show(one("bal-short"), 10.6, "right");
	AFTER.forEach((beat, i) => {
		const at = 11.6 + i * 2.8;
		d.swap(heads[i], heads[i + 1], at);
		if (i) hide(trades[i - 1], at, 0.3);
		show(trades[i], at + 0.35, "right");
		counter("vol-n", beat.volume, beat.volumeBefore ?? 0, at + 0.8);
		if (beat.openInterest !== beat.openInterestBefore) {
			counter(
				"oi-n",
				beat.openInterest,
				beat.openInterestBefore ?? START_OI,
				at + 1.0,
			);
			balanceTo(
				beat.openInterest,
				beat.openInterestBefore ?? START_OI,
				at + 1.0,
			);
		} else {
			tl.fromTo(
				one("oi"),
				{ x: 0 },
				{ x: 6, duration: 0.08, yoyo: true, repeat: 3 },
				at + 1.0,
			);
		}
	});

	// ——— clock: volume live, open interest daily ———
	tl.addLabel("clock", 20);
	d.swap(heads[3], heads[4], 20.0);
	hide([trades[2], one("bal-long"), one("bal-short")], 20.0);
	// Back to Monday's open: the counters start again.
	counter("vol-n", 0, FINAL.volume, 20.2);
	counter("oi-n", START_OI, FINAL.openInterest, 20.2);
	show(kids("clock"), 20.3);
	show(one("head"), 20.5);
	show(clockTime, 20.5);
	show(one("oi-fri"), 20.6);
	/** The playhead runs from one minute to another, its time counting with it. */
	const clockTo = (to: number, from: number, at: number, duration: number) => {
		tl.to(
			one("head"),
			{ x: L.clockX(to) - L.clockX(MON_OPEN), duration, ease: "power1.inOut" },
			at,
		);
		d.count(
			clockTime,
			to,
			at,
			(v) => (v >= 1440 ? `Tue ${hhmm(Math.round(v))}` : hhmm(Math.round(v))),
			from,
			duration,
		);
	};
	let volume = 0;
	let minuteNow = MON_OPEN;
	TRADES.forEach((trade, i) => {
		const at = 21.0 + i * 0.9;
		const minute = minuteOf(trade.time);
		clockTo(minute, minuteNow, at, 0.7);
		minuteNow = minute;
		d.pop(ticks[i], at + 0.6);
		counter("vol-n", volume + trade.quantity, volume, at + 0.6);
		volume += trade.quantity;
	});
	d.swap(heads[4], heads[5], 24.0);
	clockTo(MON_CLOSE, minuteNow, 24.4, 0.8);
	tl.fromTo(
		one("oi"),
		{ x: 0 },
		{ x: 6, duration: 0.08, yoyo: true, repeat: 3 },
		25.3,
	);
	d.swap(heads[5], heads[6], 26.6);
	clockTo(TUE_REPORT, MON_CLOSE, 27.0, 0.9);
	d.flip(one("oi-fri"), one("oi-mon"), 27.9);
	tl.set(one("oi-fri"), { opacity: 0 }, 28.2);
	counter("oi-n", FINAL.openInterest, START_OI, 28.0);

	// ——— bucket: a week moves the members ———
	tl.addLabel("bucket", 30);
	hide(
		[
			heads[6],
			one("vol"),
			one("oi"),
			...kids("clock"),
			...ticks,
			one("head"),
			clockTime,
			one("oi-mon"),
		],
		30.0,
	);
	show(heads[7], 30.2, "above");
	show(kids("strip"), 30.4);
	cols.forEach((col, i) => {
		show(col, 30.6 + i * 0.15);
	});
	show(one("bt-0"), 31.0);
	show(one("bucket-n"), 31.2);
	// A week passes: each expiry slides 7 days closer; the band stays.
	d.swap(heads[7], heads[8], 32.8);
	const shift = L.dayX(0) - L.dayX(7);
	tl.to(cols, { x: shift, duration: 1.0, ease: "power2.inOut" }, 33.2);
	const after = AFTER_WEEK.columns;
	stripExpiries.forEach((id) => {
		const column = after.find((c) => c.id === id);
		const before = BEFORE.columns.find((c) => c.id === id);
		if (!column || !before) return;
		const h = ((L.floor - L.top) * column.value) / VALUE_MAX;
		tl.to(
			one(`colbar-${id}`),
			{ attr: { y: L.floor - h, height: h }, duration: 0.6 },
			34.0,
		);
		tl.to(
			one(`colv-${id}`),
			{ attr: { y: L.floor - h - 6 }, duration: 0.6 },
			34.0,
		);
		d.count(
			num(`colv-${id}`),
			column.value,
			34.0,
			(v) => count(Math.round(v)),
			before.value,
			0.6,
		);
		// In the bucket or out of it, by its days now.
		tl.set(
			one(`colbar-${id}`),
			{ attr: { "data-tone": column.member ? "total" : "neutral" } },
			34.2,
		);
	});
	counter("bucket-n", AFTER_WEEK.total, BEFORE.total, 34.0);
	d.flip(one("bt-0"), one("bt-1"), 33.2);
	tl.set(one("bt-0"), { opacity: 0 }, 33.5);
	d.swap(heads[8], heads[9], 35.4);
	changes.forEach((change, i) => {
		d.pop(change, 35.8 + i * 0.25);
	});
	// Cut: the claim.
	hide(
		[
			heads[9],
			...kids("strip"),
			...cols,
			...changes,
			one("bt-1"),
			one("bucket-n"),
		],
		37.4,
	);
	word(one("z-big"), 37.7);
	show(one("z-sub"), 38.1);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
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
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
