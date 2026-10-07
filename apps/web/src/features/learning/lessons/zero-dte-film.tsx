import { gsap } from "gsap";
import { useId } from "react";
import { type Copy, count, pick } from "@/content/world";
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
	TitleCard,
	Word,
} from "../walkthrough/film-kit";
import {
	AT_OPEN,
	CLOSE,
	FRIDAY_VOLUME,
	fixed2,
	HEDGE_CONTRACTS,
	HIGH,
	hedgeShares,
	LOW,
	OPEN,
	oct18Delta,
	sep20,
	share,
	THURSDAY_OI,
} from "./zero-dte-model";

/*
 * 0DTE, as a film: an option's last day. Subject: the Sep 20 100 call, worth $0.36 at the
 * open with ALFA at $100. A clock runs through the day; type carries the claims, and three
 * charts take turns as the proof: the value draining by the hour, delta swinging on cents
 * as the close nears, and open interest that never sees the day's trading.
 *
 *   open      0–4        "0DTE"
 *   question  4–9.6      9:30, $0.36 → the 4:00 pm close, ?
 *   hours     9.6–20.4   the value drains with the clock: $0.26 at 12:30, $0.14 at 15:00,
 *                        $0 at the close, all of it time value
 *   swing     20.4–32.2  hero: 40 cents moves a month-out delta 0.51 → 0.53; the last
 *                        day's, as the clock runs to 15:00, 0.29 → 0.72, locked; the hedge
 *   oi        32.2–40.6  3,400 open Thursday, 12,000 traded Friday, 0 on Monday
 *   claim     40.6–45    "0DTE: cheap, fast, gone by 4 pm."
 *   next      45–47      Next: implied and realized volatility
 */

const END = 47;
const MIDDAY = 12.5;
const LATE = 15;
const H_TOP = 0.4;
const SWING = [98.5, 101.5] as const;
const OI_TOP = 13_000;
const hoursCurve = Array.from(
	{ length: (CLOSE - OPEN) * 8 + 1 },
	(_, i) => [OPEN + i / 8, sep20(OPEN + i / 8).price] as const,
);
const swingXs = Array.from({ length: 61 }, (_, i) => SWING[0] + i * 0.05);
const midday = sep20(MIDDAY).price;
const late = sep20(LATE).price;
/** A time of day, "9:30", "15:05", to the nearest five minutes. */
const clockFace = (time: number) => {
	const total = Math.round((time * 60) / 5) * 5;
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};
const bars = [
	{ id: "thu", value: THURSDAY_OI, tone: "neutral" },
	{ id: "fri", value: FRIDAY_VOLUME, tone: "total" },
	{ id: "mon", value: 0, tone: "neutral" },
] as const;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	// On a phone the dollar ticks sit left of the plot: leave them room.
	const left = narrow ? frame.margin + 18 : frame.margin;
	const right = width * 0.965;
	// Headroom for a two-line headline above the charts' captions.
	const top = height * (narrow ? 0.3 : 0.25);
	const bottom = height * 0.8;
	const xH = (time: number) =>
		left + ((time - OPEN) / (CLOSE - OPEN)) * (right - left);
	const yH = (dollars: number) => bottom - (dollars / H_TOP) * (bottom - top);
	const xS = (spot: number) =>
		left + ((spot - SWING[0]) / (SWING[1] - SWING[0])) * (right - left);
	const yS = (delta: number) => bottom - delta * (bottom - top);
	const yO = (contracts: number) =>
		bottom - (contracts / OI_TOP) * (bottom - top);
	const slot = (right - left) / bars.length;
	const barX = (i: number) => left + slot * (i + 0.5);
	const barWidth = Math.min(slot * 0.44, 96);
	const path = (
		points: readonly (readonly [number, number])[],
		x: (value: number) => number,
		y: (value: number) => number,
	) =>
		points
			.map(
				([px, py], i) =>
					`${i ? "L" : "M"}${x(px).toFixed(1)} ${y(py).toFixed(1)}`,
			)
			.join("");
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		xH,
		yH,
		xS,
		yS,
		yO,
		barX,
		barWidth,
		path,
		/** Two figures side by side, as columns at these fractions of the width. */
		pair: narrow ? [0.27, 0.73] : [0.32, 0.68],
	};
}

const copy = {
	title: ["0DTE", "0DTE"],
	titleSub: ["options on their last day", "最后一天的期权"],
	qTagOpen: ["Fri Sep 20, 9:30", "9月20日 周五 9:30"],
	qTagClose: ["4:00 pm close", "下午 4:00 收盘"],
	qLine: [
		"ALFA stays at $100 all day. What is the call worth at the close?",
		"ALFA 一整天都在 $100。收盘时这张看涨值多少？",
	],
	hoursHead: [
		"Every hour costs more than the last.",
		"每一小时都比上一小时更贵。",
	],
	hoursHeadShort: ["Each hour costs more.", "每一小时都更贵。"],
	hoursAxis: ["Sep 20 100 call, per share", "9月20日 100 看涨，每股"],
	heldAxis: ["Fri Sep 20 · ALFA held at $100", "9月20日 周五 · ALFA 保持 $100"],
	closeHead: [
		"At the close: $0, all time value.",
		"收盘时：$0，全是时间价值。",
	],
	swingHead: [
		"Near the strike, delta swings on cents.",
		"在行权价附近，Delta 随几美分摆动。",
	],
	swingHeadShort: ["Delta swings on cents.", "Delta 随几美分摆动。"],
	swingAxis: ["delta, model", "Delta，模型"],
	priceAxis: ["ALFA price", "ALFA 价格"],
	octLegend: ["Oct 18, 32 days", "10月18日，32 天"],
	sepLegend: ["Sep 20, its last day", "9月20日，最后一天"],
	swingWord: [
		`delta, ALFA $${LOW.toFixed(2)} → $${HIGH.toFixed(2)}, at ${LATE}:00`,
		`Delta，ALFA $${LOW.toFixed(2)} → $${HIGH.toFixed(2)}，${LATE}:00`,
	],
	hedge: [
		`Short ${count(HEDGE_CONTRACTS)} calls and hedged? Buy about ${count(hedgeShares(LATE))} shares on those 40 cents.`,
		`做空 ${count(HEDGE_CONTRACTS)} 张看涨并对冲？这 40 美分就要买入约 ${count(hedgeShares(LATE))} 股。`,
	],
	caveat: [
		"That's the hedge such a position needs, not proof anyone holds it.",
		"这是这类持仓需要的对冲，并不能证明有人持有它。",
	],
	oiHead: [
		"Same-day flow never reaches open interest.",
		"当天的成交流进不了未平仓量。",
	],
	oiHeadShort: [
		"Same-day flow skips open interest.",
		"当天成交进不了未平仓量。",
	],
	oiAnswer: [
		"Volume counts it. Open interest never does.",
		"成交量算它，未平仓量从不算。",
	],
	oiAnswerShort: [
		"Volume counts it. OI never does.",
		"成交量算它，OI 从不算。",
	],
	oiAxis: ["Sep 20 100 call, contracts", "9月20日 100 看涨，张"],
	thu: ["Thu close, OI", "周四收盘 OI"],
	fri: ["Fri, volume", "周五成交量"],
	mon: ["Mon, OI", "周一 OI"],
	expired: ["expired", "已到期"],
	claimBig: [
		"0DTE: cheap, fast, gone by 4 pm.",
		"0DTE：便宜、快，4 点就没了。",
	],
	claimSub: [
		"Hours drain it, cents swing it, OI misses it.",
		"按小时流失，随几美分摆动，未平仓量看不到它。",
	],
	nextBig: [
		"Next: implied and realized volatility",
		"下一课：隐含与已实现波动率",
	],
	nextSub: [
		"what the market prices, against what the stock did",
		"市场定价的波动，与股价实际的波动",
	],
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
	const { height: H, type: T, room, narrow } = L;
	const W = width;
	const id = useId().replace(/:/g, "");
	const tucked = (pin: string) => narrow && pin === "late";
	const hourTicks = narrow ? [10, 12, 14, 16] : [10, 11, 12, 13, 14, 15, 16];
	const pins = [
		{ id: "mid", time: MIDDAY, value: midday },
		{ id: "late", time: LATE, value: late },
	];
	const axisX = (
		ticks: number[],
		x: (v: number) => number,
		f: (v: number) => string,
	) =>
		ticks.map((tick, i) => (
			<text
				key={tick}
				x={x(tick)}
				y={L.bottom + 18}
				textAnchor={
					i === ticks.length - 1 && x(tick) > L.right - 20 ? "end" : "middle"
				}
				className="wt-small"
			>
				{f(tick)}
			</text>
		));
	const axisY = (
		ticks: number[],
		y: (v: number) => number,
		f: (v: number) => string,
	) =>
		ticks.map((tick) => (
			<g key={tick}>
				<path
					d={`M${L.left} ${y(tick)}H${L.right}`}
					className={tick === 0 ? "wt-axis" : "wt-grid"}
				/>
				<text
					x={L.left - 8}
					y={y(tick) + 4}
					textAnchor="end"
					className="wt-small"
				>
					{f(tick)}
				</text>
			</g>
		));
	const pair = (
		group: string,
		tags: readonly [Copy, Copy],
		nums: readonly [string, string],
		tones: readonly [string, string],
		y: number,
	) =>
		[0, 1].map((i) => (
			<g key={`${group}-${i}`}>
				<Word
					name={`${group}-tag-${i}`}
					x={W * L.pair[i]}
					y={y}
					size={T.small}
					className="wt-film-tag"
				>
					{t(tags[i]).toUpperCase()}
				</Word>
				<Word
					name={`${group}-num-${i}`}
					x={W * L.pair[i]}
					y={y + T.big * 0.95}
					size={T.big * 0.8}
					className={`wt-film-num ${tones[i]}`}
				>
					{nums[i]}
				</Word>
			</g>
		));
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<clipPath id={`hours-${id}`}>
					<rect data-f="hours-clip" x={L.left - 4} y={0} width={0} height={H} />
				</clipPath>
			</defs>

			{/* The proof: the day's decay, delta near the strike, open interest. */}
			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart-hours">
						{axisY(
							narrow ? [0, 0.2, 0.4] : [0, 0.1, 0.2, 0.3, 0.4],
							L.yH,
							(v) => share(v),
						)}
						{axisX(hourTicks, L.xH, (v) => `${v}:00`)}
						<text
							x={L.right}
							y={L.bottom + 32}
							textAnchor="end"
							className="wt-small"
						>
							{t(copy.heldAxis)}
						</text>
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(copy.hoursAxis)}
						</text>
						<g clipPath={`url(#hours-${id})`}>
							<path
								className="wt-line-position"
								strokeDasharray="6 5"
								d={L.path(hoursCurve, L.xH, L.yH)}
							/>
						</g>
						{pins.map((pin) => (
							<g key={pin.id} data-f={`h-pin-${pin.id}`}>
								<circle
									cx={L.xH(pin.time)}
									cy={L.yH(pin.value)}
									r={4}
									className="wt-chip"
								/>
								{/* Above right, except the late pin on a phone: there the frame's edge
								is near, so it goes below left, where the falling curve doesn't. */}
								<text
									x={L.xH(pin.time) + (tucked(pin.id) ? -8 : 8)}
									y={L.yH(pin.value) + (tucked(pin.id) ? 18 : -9)}
									textAnchor={tucked(pin.id) ? "end" : "start"}
									className="wt-halo wt-accent wt-marker-label"
								>
									{share(pin.value)}
								</text>
							</g>
						))}
						<text
							data-f="h-pin-close"
							x={L.xH(CLOSE) - 10}
							y={L.yH(0) - 8}
							textAnchor="end"
							className="wt-halo wt-loss wt-marker-label"
						>
							$0
						</text>
						<circle
							data-f="h-marker"
							r={6}
							cx={L.xH(OPEN)}
							cy={L.yH(AT_OPEN)}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
					</g>
					<g data-f="chart-swing">
						{axisY([0, 0.5, 1], L.yS, (v) => v.toFixed(1))}
						{axisX([99, 100, 101], L.xS, (v) => `$${v}`)}
						<text
							x={L.right}
							y={L.bottom + 32}
							textAnchor="end"
							className="wt-small"
						>
							{t(copy.priceAxis)}
						</text>
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(copy.swingAxis)}
						</text>
						{[LOW, HIGH].map((spot) => (
							<path
								key={spot}
								d={`M${L.xS(spot)} ${L.yS(0)}V${L.yS(1)}`}
								className="wt-grid"
								strokeDasharray="3 3"
							/>
						))}
						<path
							data-f="s-oct"
							className="wt-line-reference"
							d={L.path(
								swingXs.map((spot) => [spot, oct18Delta(spot)] as const),
								L.xS,
								L.yS,
							)}
						/>
						<path
							data-f="s-sep"
							className="wt-line-position"
							strokeDasharray="6 5"
							d={L.path(
								swingXs.map((spot) => [spot, sep20(OPEN, spot).delta] as const),
								L.xS,
								L.yS,
							)}
						/>
						{(
							[
								["s-legend-oct", "wt-line-reference", "", copy.octLegend],
								["s-legend-sep", "wt-line-position", "6 5", copy.sepLegend],
							] as const
						).map(([name, line, dash, text], i) => (
							<g key={name} data-f={name}>
								<path
									d={`M${L.left + 6} ${L.top + 10 + i * 16 - 4}h18`}
									className={line}
									strokeDasharray={dash || undefined}
								/>
								<text
									x={L.left + 30}
									y={L.top + 10 + i * 16}
									className="wt-small"
								>
									{t(text)}
								</text>
							</g>
						))}
						{(["oct", "sep"] as const).map((curve) =>
							(["low", "high"] as const).map((end) => (
								<g key={`${curve}-${end}`}>
									<circle
										data-f={`s-${curve}-${end}`}
										r={5}
										className={curve === "sep" ? "wt-chip" : "wt-film-ghost"}
										cx={L.xS(end === "low" ? LOW : HIGH)}
										cy={L.yS(oct18Delta(end === "low" ? LOW : HIGH))}
									/>
									<text
										data-f={`s-${curve}-${end}-label`}
										x={
											L.xS(end === "low" ? LOW : HIGH) +
											(end === "low" ? -10 : 10)
										}
										// Off the month-out curve, which runs almost flat through both
										// dots: the low one's figure under it, the high one's over it. The
										// last day's labels are placed as its curve steepens.
										y={
											L.yS(oct18Delta(end === "low" ? LOW : HIGH)) +
											(end === "low" ? 18 : -12)
										}
										textAnchor={end === "low" ? "end" : "start"}
										className={`wt-halo wt-marker-label ${curve === "sep" ? "wt-accent" : "wt-small"}`}
									>
										{fixed2(oct18Delta(end === "low" ? LOW : HIGH))}
									</text>
								</g>
							)),
						)}
					</g>
					<g data-f="chart-oi">
						<path d={`M${L.left} ${L.yO(0)}H${L.right}`} className="wt-axis" />
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(copy.oiAxis)}
						</text>
						{bars.map((bar, i) => (
							<g key={bar.id}>
								<rect
									data-f={`o-bar-${bar.id}`}
									className="wt-film-bar"
									data-tone={bar.tone}
									x={L.barX(i) - L.barWidth / 2}
									y={L.yO(0)}
									width={L.barWidth}
									height={0}
									rx={4}
								/>
								<text
									data-f={`o-value-${bar.id}`}
									x={L.barX(i)}
									y={L.yO(bar.value) - 10}
									textAnchor="middle"
									className={`wt-film-num ${bar.id === "fri" ? "wt-film-accent" : ""}`}
									style={{ fontSize: T.head }}
								>
									0
								</text>
								<text
									x={L.barX(i)}
									y={L.bottom + 18}
									textAnchor="middle"
									className="wt-small"
								>
									{t(copy[bar.id])}
								</text>
							</g>
						))}
						<text
							data-f="o-expired"
							x={L.barX(2)}
							y={L.yO(0) - 10 - T.head * 1.2}
							textAnchor="middle"
							className="wt-small wt-loss"
						>
							{t(copy.expired)}
						</text>
					</g>
				</g>
			</g>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				{pair(
					"q",
					[copy.qTagOpen, copy.qTagClose],
					[share(AT_OPEN), "?"],
					["", "wt-film-accent"],
					H * 0.3,
				)}
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.74}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			<Lines
				name="h-head"
				text={t(narrow ? copy.hoursHeadShort : copy.hoursHead)}
				x={L.margin}
				y={L.headY}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			<Word
				name="clock"
				x={L.right - 4}
				y={L.top + T.num * 0.9}
				size={T.num}
				anchor="end"
				className="wt-film-num wt-film-accent"
			>
				9:30
			</Word>
			<Word
				name="s-clock"
				x={L.right - 4}
				y={L.bottom - 12}
				size={T.num}
				anchor="end"
				className="wt-film-num wt-film-accent"
			>
				9:30
			</Word>
			{/* The question's answer, a line under the hours' headline. */}
			<Lines
				name="h2-head"
				text={t(copy.closeHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.hoursHeadShort : copy.hoursHead),
						room,
						T.head,
					) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			<Lines
				name="s-head"
				text={t(narrow ? copy.swingHeadShort : copy.swingHead)}
				x={L.margin}
				y={L.headY}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			<Brackets name="lock-swing" glow />
			<g data-f="w">
				<Word
					name="w-big"
					x={W / 2}
					y={H * 0.36 + T.big * 0.36}
					size={T.big}
					className="wt-film-num"
				>
					{`${fixed2(sep20(LATE, LOW).delta)} → ${fixed2(sep20(LATE, HIGH).delta)}`}
				</Word>
				<Lines
					name="w-word"
					text={t(copy.swingWord)}
					x={W / 2}
					y={H * 0.36 + T.big * 0.36 + T.head * 1.6}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
				<Lines
					name="w-hedge"
					text={t(copy.hedge)}
					x={W / 2}
					y={H * 0.7}
					size={T.body}
					maxWidth={room}
				/>
				<Lines
					name="w-caveat"
					text={t(copy.caveat)}
					x={W / 2}
					y={
						H * 0.7 +
						T.body * 1.35 * lineCount(t(copy.hedge), room, T.body) +
						T.small * 0.6
					}
					size={T.small}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			<Lines
				name="o-head"
				text={t(narrow ? copy.oiHeadShort : copy.oiHead)}
				x={L.margin}
				y={L.headY}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			<Lines
				name="o-answer"
				text={t(narrow ? copy.oiAnswerShort : copy.oiAnswer)}
				x={L.margin}
				y={
					L.headY +
					lineCount(t(narrow ? copy.oiHeadShort : copy.oiHead), room, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			<g data-f="claim">
				<Lines
					name="c-big"
					text={t(copy.claimBig)}
					x={W / 2}
					y={H * 0.46}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="c-sub"
					text={t(copy.claimSub)}
					x={W / 2}
					y={
						H * 0.46 +
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
	const { tl, one, kids, show, hide, rise, sink } = d;
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const land = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.12, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const lockSwing = one<SVGGraphicsElement>("lock-swing");
	const flat = (name: string) =>
		kids(name).flatMap((el) => (el.tagName === "g" ? [...el.children] : [el]));
	const marker = one("h-marker");
	const clip = one("hours-clip");
	const clockText = one<SVGTextElement>("clock");
	const swingClock = one<SVGTextElement>("s-clock");
	const charts = {
		hours: one("chart-hours"),
		swing: one("chart-swing"),
		oi: one("chart-oi"),
	};

	gsap.set([charts.swing, charts.oi], { opacity: 0 });
	d.hidden([
		marker,
		one("h-pin-mid"),
		one("h-pin-late"),
		one("h-pin-close"),
		one("s-oct"),
		one("s-sep"),
		one("s-legend-oct"),
		one("s-legend-sep"),
		...["oct", "sep"].flatMap((curve) =>
			["low", "high"].flatMap((end) => [
				one(`s-${curve}-${end}`),
				one(`s-${curve}-${end}-label`),
			]),
		),
		...bars.map((bar) => one(`o-value-${bar.id}`)),
		one("o-expired"),
		...flat("q"),
		one("h-head"),
		one("h2-head"),
		clockText,
		swingClock,
		lockSwing,
		one("s-head"),
		...kids("w"),
		one("o-head"),
		one("o-answer"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: $0.36 at the open; at the close? ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag-0"), 4.6);
	land(one("q-num-0"), 4.8);
	show(one("q-tag-1"), 5.3);
	land(one("q-num-1"), 5.5);
	show(one("q-line"), 6.0);

	// ——— hours: the clock runs and the value drains ———
	tl.addLabel("hours", 9.6);
	hide(flat("q"), 9.6);
	show(one("h-head"), 9.8);
	rise(9.9);
	land(marker, 10.6);
	show(clockText, 10.6, "right");
	const day = { time: OPEN };
	const tick = () => {
		const x = L.xH(day.time);
		gsap.set(marker, { attr: { cx: x, cy: L.yH(sep20(day.time).price) } });
		gsap.set(clip, { attr: { width: x - L.left + 6 } });
		clockText.textContent = clockFace(day.time);
	};
	tl.to(
		day,
		{ time: MIDDAY, duration: 1.6, ease: "power1.inOut", onUpdate: tick },
		11.2,
	);
	land(one("h-pin-mid"), 12.9);
	tl.to(
		day,
		{ time: LATE, duration: 1.3, ease: "power1.in", onUpdate: tick },
		13.6,
	);
	land(one("h-pin-late"), 15.0);
	tl.to(
		day,
		{ time: CLOSE, duration: 0.9, ease: "power2.in", onUpdate: tick },
		15.5,
	);
	show(one("h-pin-close"), 16.5, "below", 0.4);
	// The question's answer, as the close's pin comes up.
	show(one("h2-head"), 16.8);

	// ——— swing: the hero. Delta near the strike as the close nears. ———
	tl.addLabel("swing", 20.4);
	d.swap([one("h-head"), one("h2-head")], one("s-head"), 20.4);
	hide(clockText, 20.4);
	sink(20.4);
	tl.set(charts.hours, { opacity: 0 }, 20.8);
	tl.set(charts.swing, { opacity: 1 }, 20.8);
	rise(20.9);
	tl.to(
		[one("s-oct"), one("s-legend-oct")],
		{ opacity: 1, duration: 0.5 },
		21.4,
	);
	land(one("s-oct-low"), 21.8);
	land(one("s-oct-high"), 21.9);
	show([one("s-oct-low-label"), one("s-oct-high-label")], 22.1, "below", 0.4);
	// The last day's call, from the open; then the clock runs and its curve steepens.
	const swing = { time: OPEN };
	const ends = [
		["low", LOW],
		["high", HIGH],
	] as const;
	const steepen = () => {
		one("s-sep").setAttribute(
			"d",
			L.path(
				swingXs.map((spot) => [spot, sep20(swing.time, spot).delta] as const),
				L.xS,
				L.yS,
			),
		);
		for (const [end, spot] of ends) {
			const delta = sep20(swing.time, spot).delta;
			gsap.set(one(`s-sep-${end}`), {
				attr: { cx: L.xS(spot), cy: L.yS(delta) },
			});
			const label = one<SVGTextElement>(`s-sep-${end}-label`);
			label.setAttribute("y", String(L.yS(delta) + 4));
			label.textContent = fixed2(delta);
		}
		swingClock.textContent = clockFace(swing.time);
	};
	steepen();
	tl.to(
		[one("s-oct-low-label"), one("s-oct-high-label")],
		{ opacity: 0, duration: 0.3 },
		23.0,
	);
	tl.to(
		[one("s-sep"), one("s-legend-sep")],
		{ opacity: 1, duration: 0.5 },
		23.1,
	);
	land(one("s-sep-low"), 23.4);
	land(one("s-sep-high"), 23.5);
	show([one("s-sep-low-label"), one("s-sep-high-label")], 23.7, "below", 0.4);
	show(swingClock, 23.7, "right");
	tl.to(
		swing,
		{ time: LATE, duration: 2.4, ease: "power1.in", onUpdate: steepen },
		24.3,
	);
	// Cut: the swing, locked, and the hedge it asks for.
	hide([one("s-head"), swingClock], 27.5);
	sink(27.5);
	land(one("w-big"), 27.9);
	show(one("w-word"), 28.2);
	d.lock(lockSwing, 28.5, { around: [one("w-big"), one("w-word")], pad: 8 });
	tl.addLabel("hero-lock", 28.5);
	show(one("w-hedge"), 28.7);
	show(one("w-caveat"), 29.2);

	// ——— oi: the day's flow and open interest ———
	tl.addLabel("oi", 32.2);
	hide([...kids("w"), lockSwing], 32.2);
	tl.set(charts.swing, { opacity: 0 }, 32.4);
	tl.set(charts.oi, { opacity: 1 }, 32.4);
	show(one("o-head"), 32.55);
	rise(32.6);
	const grow = (index: number, at: number) => {
		const bar = bars[index];
		tl.fromTo(
			one(`o-bar-${bar.id}`),
			{ attr: { y: L.yO(0), height: 0 } },
			{
				attr: { y: L.yO(bar.value), height: L.yO(0) - L.yO(bar.value) },
				duration: 0.7,
				ease: "power3.out",
			},
			at,
		);
		const value = one<SVGTextElement>(`o-value-${bar.id}`);
		tl.to(value, { opacity: 1, duration: 0.3 }, at);
		d.count(value, bar.value, at, (v) => count(Math.round(v)));
		tl.fromTo(
			value,
			{ attr: { y: L.yO(0) - 10 } },
			{
				attr: { y: L.yO(bar.value) - 10 },
				duration: 0.7,
				ease: "power3.out",
			},
			at,
		);
	};
	grow(0, 33.3);
	grow(1, 34.3);
	tl.to(one("o-value-mon"), { opacity: 1, duration: 0.3 }, 35.7);
	// In place: rising, it would pass through Monday's 0.
	land(one("o-expired"), 36);
	show(one("o-answer"), 37);
	// Cut: the claim.
	hide([one("o-head"), one("o-answer")], 40.6);
	sink(40.6);
	tl.fromTo(
		one("c-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		40.9,
	);
	show(one("c-sub"), 41.3);

	// ——— next ———
	tl.addLabel("next", 45);
	hide(kids("claim"), 45);
	d.close(45);
	return tl;
}

export const zeroDteFilm: Film = {
	id: "zero-dte",
	label: [
		"0DTE, as a short film: the Sep 20 100 call's value draining through its last day with ALFA held at $100, the last hour costing more than the first three, its delta swinging on 40 cents as the close nears, and same-day volume that never reaches open interest",
		"0DTE 短片：ALFA 保持 $100 时，9月20日 100 看涨在最后一天里价值的流失、最后一小时比前三小时损失更多、临近收盘时 40 美分就让 Delta 大幅摆动，以及当天成交量永远进不了未平仓量",
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["0DTE", "0DTE"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "hours", label: ["By the hour", "按小时"] },
		{ id: "last", label: ["The last hour", "最后一小时"] },
		{ id: "swing", label: ["Delta swings", "Delta 摆动"] },
		{ id: "oi", label: ["Open interest", "未平仓量"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
