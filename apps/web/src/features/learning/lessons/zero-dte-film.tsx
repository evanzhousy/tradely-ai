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
	FIRST_THREE_HOURS_LOSS,
	FRIDAY_VOLUME,
	fixed2,
	HEDGE_CONTRACTS,
	HIGH,
	hedgeShares,
	LAST_HOUR_LOSS,
	LOW,
	OCT18_DAYS,
	OPEN,
	oct18Delta,
	SHARES_PER_CALL,
	sep20,
	share,
	swingAt,
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
 *   hours     9.6–21.0   one continuous clock/value walk; $0 at the close, time value gone
 *   swing     21.0–33.05 28-day delta 0.51 → 0.53; last-day 0.29 → 0.72 at 15:00,
 *                        carried into the hero; conditional hedge arithmetic after the lock
 *   oi        33.05–41.0 headline above the standing hero; chart hand-over at 34.1,
 *                        3,400 open Thursday, 12,000 traded Friday; Monday absent, expired
 *   claim     41.0–45.4  "Little time. Large hedge changes."
 *   next      45.4–47.4  Next: implied and realized volatility
 */

const END = 47.4;
const LATE = 15;
const H_TOP = 0.4;
const SWING = [98.5, 101.5] as const;
const OI_TOP = 13_000;
const hoursCurve = Array.from(
	{ length: (CLOSE - OPEN) * 8 + 1 },
	(_, i) => [OPEN + i / 8, sep20(OPEN + i / 8).price] as const,
);
const swingXs = Array.from({ length: 61 }, (_, i) => SWING[0] + i * 0.05);
/** A time of day, "9:30", "15:05", to the nearest five minutes. */
const clockFace = (time: number) => {
	const total = Math.round((time * 60) / 5) * 5;
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};
const bars = [
	{ id: "thu", value: THURSDAY_OI, tone: "neutral" },
	{ id: "fri", value: FRIDAY_VOLUME, tone: "total" },
	{ id: "mon", value: null, tone: "neutral" },
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
		"ALFA stays at $100. What is the Sep 20 $100-strike call worth at expiry?",
		"ALFA 全天保持 $100。9月20日 $100 行权价看涨到期值多少？",
	],
	hoursHead: [
		"Every hour costs more than the last.",
		"每一小时都比上一小时更贵。",
	],
	hoursHeadShort: ["Each hour costs more.", "每一小时都更贵。"],
	hoursAxis: ["Sep 20 100 call, per share", "9月20日 100 看涨，每股"],
	heldAxis: ["Fri Sep 20 · ALFA held at $100", "9月20日 周五 · ALFA 保持 $100"],
	closeHead: ["At the close: time value is gone.", "收盘时：时间价值归零。"],
	firstHours: ["First 3 hours", "前3小时"],
	lastHour: ["Last hour", "最后1小时"],
	swingHead: [
		"Near the strike, delta swings on cents.",
		"在行权价附近，Delta 随几美分摆动。",
	],
	swingHeadShort: ["Delta swings on cents.", "Delta 随几美分摆动。"],
	swingAxis: ["delta, model", "Delta，模型"],
	priceAxis: ["ALFA price", "ALFA 价格"],
	octLegend: [`Oct 18, ${OCT18_DAYS} days`, `10月18日，${OCT18_DAYS} 天`],
	sepLegend: ["Sep 20, its last day", "9月20日，最后一天"],
	swingWord: [
		`delta, ALFA $${LOW.toFixed(2)} → $${HIGH.toFixed(2)}, at ${LATE}:00`,
		`Delta，ALFA $${LOW.toFixed(2)} → $${HIGH.toFixed(2)}，${LATE}:00`,
	],
	hedge: [
		"Short calls, already hedged? Buy more shares on this rise. Actual holdings unknown.",
		"看涨空头已对冲？此次上涨需再买股。实际持仓未知。",
	],
	sharesPerCall: ["shares/call", "股/张"],
	calls: ["calls", "张"],
	moreShares: ["more shares", "股（新增）"],
	oiHead: [
		"Same-day flow never reaches open interest.",
		"当天的成交流进不了未平仓量。",
	],
	oiHeadShort: [
		"Same-day flow skips open interest.",
		"当天成交进不了未平仓量。",
	],
	oiAxis: ["Sep 20 100 call, contracts", "9月20日 100 看涨，张"],
	thu: ["Thu close, OI", "周四收盘 OI"],
	fri: ["Fri, volume", "周五成交量"],
	mon: ["Mon, OI", "周一 OI"],
	expired: ["series expired", "合约已到期"],
	claimBig: ["Little time. Large hedge changes.", "时间少，对冲变化大。"],
	claimSub: [
		"Time value drains. No OI count after expiry.",
		"时间价值流失，到期后没有未平仓量读数。",
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
	const heroCaptionY = H * 0.36 + T.big * 0.36 + T.head * 1.6;
	// Keep the calculation below the fitted hero brackets, including narrower wide frames.
	const mathY = Math.max(
		H * 0.58,
		heroCaptionY +
			(lineCount(t(copy.swingWord), room, T.body) - 1) * T.body * 1.35 +
			T.body * 0.3 +
			8 +
			T.head * 1.25,
	);
	const mathGap = T.head * 1.5;
	const id = useId().replace(/:/g, "");
	const hourTicks = narrow ? [10, 12, 14, 16] : [10, 11, 12, 13, 14, 15, 16];
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
								{bar.value !== null && (
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
								)}
								<text
									data-f={
										bar.value === null ? "o-absent-mon" : `o-value-${bar.id}`
									}
									x={L.barX(i)}
									y={L.yO(bar.value ?? 0) - 10}
									textAnchor="middle"
									className={`wt-film-num ${bar.id === "fri" ? "wt-film-accent" : ""}`}
									style={{ fontSize: T.head }}
								>
									{bar.value === null ? "—" : "0"}
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
				name="h-value"
				x={L.right - 4}
				y={L.top + T.num * 0.9 + T.head * 1.6}
				size={T.head}
				anchor="end"
				className="wt-film-num wt-film-accent"
			>
				{share(AT_OPEN)}
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
			<g data-f="h-loss-comparison">
				{[
					{ id: "first", label: copy.firstHours, loss: FIRST_THREE_HOURS_LOSS },
					{ id: "last", label: copy.lastHour, loss: LAST_HOUR_LOSS },
				].map((window, i) => {
					const y = L.bottom - T.head * 3.4 + i * T.head * 1.7;
					return (
						<g key={window.id}>
							<Word
								name={`h-loss-${window.id}-label`}
								x={L.left + 8}
								y={y}
								size={T.body}
								anchor="start"
							>
								{t(window.label)}
							</Word>
							<Word
								name={`h-loss-${window.id}-value`}
								x={L.left + T.body * 9}
								y={y}
								size={T.head}
								anchor="start"
								className="wt-film-num wt-film-loss"
							>
								{`−${share(window.loss)}`}
							</Word>
						</g>
					);
				})}
			</g>
			<Brackets name="lock-swing" glow />
			<g data-f="w">
				{(["low", "high"] as const).map((end) => (
					<Word
						key={end}
						name={`w-${end}`}
						x={W / 2 + (end === "low" ? -1 : 1) * T.big * 1.8}
						y={H * 0.36 + T.big * 0.36}
						size={T.big}
						className="wt-film-num wt-film-accent"
					>
						{fixed2(sep20(LATE, end === "low" ? LOW : HIGH).delta)}
					</Word>
				))}
				<Word
					name="w-arrow"
					x={W / 2}
					y={H * 0.36 + T.big * 0.36}
					size={T.big}
					className="wt-film-num"
				>
					→
				</Word>
				<Lines
					name="w-word"
					text={t(copy.swingWord)}
					x={W / 2}
					y={heroCaptionY}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
				<g data-f="w-math">
					<Word
						name="w-difference"
						x={W / 2}
						y={mathY}
						size={T.head}
						className="wt-film-num"
					>
						{`${fixed2(sep20(LATE, HIGH).delta)} − ${fixed2(sep20(LATE, LOW).delta)} ≈ ${fixed2(swingAt(LATE))}`}
					</Word>
					<Word
						name="w-multiplier"
						x={W / 2}
						y={mathY + mathGap}
						size={T.head}
						className="wt-film-num"
					>
						{`×${SHARES_PER_CALL} ${t(copy.sharesPerCall)} ×${count(HEDGE_CONTRACTS)} ${t(copy.calls)}`}
					</Word>
					<Word
						name="w-additional"
						x={W / 2}
						y={mathY + mathGap * 2}
						size={T.head}
						className="wt-film-num"
					>
						{`≈ ${count(hedgeShares(LATE))} ${t(copy.moreShares)}`}
					</Word>
				</g>
				<Lines
					name="w-hedge"
					text={t(copy.hedge)}
					x={W / 2}
					y={mathY + mathGap * 2 + T.head * 1.6}
					size={T.body}
					maxWidth={room}
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
	const priceText = one<SVGTextElement>("h-value");
	const swingClock = one<SVGTextElement>("s-clock");
	const charts = {
		hours: one("chart-hours"),
		swing: one("chart-swing"),
		oi: one("chart-oi"),
	};

	gsap.set([charts.swing, charts.oi], { opacity: 0 });
	d.hidden([
		marker,
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
		...bars.map((bar) =>
			one(bar.value === null ? "o-absent-mon" : `o-value-${bar.id}`),
		),
		one("o-expired"),
		...flat("q"),
		one("h-head"),
		one("h2-head"),
		one("h-loss-comparison"),
		clockText,
		one("h-value"),
		swingClock,
		lockSwing,
		one("s-head"),
		...kids("w"),
		one("o-head"),
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
	show([clockText, priceText], 10.6, "right");
	const day = { time: OPEN };
	const tick = () => {
		const x = L.xH(day.time);
		gsap.set(marker, { attr: { cx: x, cy: L.yH(sep20(day.time).price) } });
		gsap.set(clip, { attr: { width: x - L.left + 6 } });
		clockText.textContent = clockFace(day.time);
		priceText.textContent = share(sep20(day.time).price);
		priceText.classList.toggle("wt-film-loss", day.time >= CLOSE);
	};
	tl.to(
		day,
		{ time: CLOSE, duration: 5.2, ease: "none", onUpdate: tick },
		11.2,
	);
	// The endpoint settles at 16.4; the answer follows a full second of quiet.
	show(one("h2-head"), 17.4);
	// Settled loss windows substantiate the curve's accelerating decay, without new stops.
	tl.to(one("h-loss-comparison"), { opacity: 1, duration: 0.5 }, 17.4);

	// ——— swing: the hero. Delta near the strike as the close nears. ———
	tl.addLabel("swing", 21.0);
	d.swap([one("h-head"), one("h2-head")], one("s-head"), 21.0);
	hide([clockText, priceText], 21.0);
	hide(one("h-loss-comparison"), 21.0);
	sink(21.0);
	tl.set(charts.hours, { opacity: 0 }, 21.4);
	tl.set(charts.swing, { opacity: 1 }, 21.4);
	rise(21.4);
	// The month-out comparison settles with the panel at 22.2, before Sep enters at 23.2.
	tl.to(
		[
			one("s-oct"),
			one("s-legend-oct"),
			one("s-oct-low"),
			one("s-oct-high"),
			one("s-oct-low-label"),
			one("s-oct-high-label"),
		],
		{ opacity: 1, duration: 0.55 },
		21.4,
	);
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
		23.2,
	);
	tl.to(
		[one("s-sep"), one("s-legend-sep")],
		{ opacity: 1, duration: 0.5 },
		23.2,
	);
	tl.to(
		[one("s-sep-low"), one("s-sep-high")],
		{ opacity: 1, duration: 0.55 },
		23.2,
	);
	// Month-out labels have faded before the last-day labels enter their lanes.
	tl.to(
		[one("s-sep-low-label"), one("s-sep-high-label")],
		{ opacity: 1, duration: 0.4 },
		23.5,
	);
	show(swingClock, 23.2, "right");
	tl.to(
		swing,
		{ time: LATE, duration: 3.5, ease: "power1.in", onUpdate: steepen },
		23.2,
	);
	// The curve settles at 26.7. Rest one second, then carry its actual endpoints.
	hide(swingClock, 27.7);
	// Keep the existing headline hold while the endpoints carry below its lane.
	hide(one("s-head"), 28.1);
	// Fade the chart around the endpoints, leaving their parent untransformed for carry.
	const swingMarks = [
		...charts.swing.querySelectorAll("path, text, circle"),
	].filter(
		(mark) =>
			!["s-sep-low-label", "s-sep-high-label"].includes(
				mark.getAttribute("data-f") ?? "",
			),
	);
	tl.to(swingMarks, { opacity: 0, duration: 0.4, ease: "power2.in" }, 27.7);
	for (const [end, spot] of ends) {
		const label = one<SVGTextElement>(`s-sep-${end}-label`);
		// Measure the carry at the final model state, not the markup's opening state.
		const y = label.getAttribute("y");
		const text = label.textContent;
		label.setAttribute("y", String(L.yS(sep20(LATE, spot).delta) + 4));
		label.textContent = fixed2(sep20(LATE, spot).delta);
		d.carry(label, one<SVGTextElement>(`w-${end}`), 28.1, {
			duration: 0.4,
			arc: "x",
		});
		label.setAttribute("y", y ?? "");
		label.textContent = text;
	}
	// The endpoints have handed over; the now-empty depth can reset for the next chart.
	tl.set(charts.swing, { opacity: 0 }, 28.5);
	sink(28.5);
	show(one("w-arrow"), 28.0, "below", 0.5);
	// The carries clear this caption's lane before it becomes legible; both settle by 28.95.
	tl.to(one("w-word"), { opacity: 1, duration: 0.5 }, 28.45);
	d.lock(lockSwing, 28.5, {
		around: [one("w-low"), one("w-arrow"), one("w-high"), one("w-word")],
		pad: 8,
	});
	tl.addLabel("hero-lock", 28.5);
	// Brackets settle at 28.95; arithmetic follows 1.5 seconds of hero quiet.
	tl.to(one("w-math"), { opacity: 1, duration: 0.5 }, 30.45);
	show(one("w-hedge"), 30.45);

	// ——— oi: the day's flow and open interest ———
	tl.addLabel("oi", 33.05);
	// A new headline arrives above the hero without moving through its brackets.
	show(one("o-head"), 33.05);
	hide([...kids("w"), lockSwing], 34.1);
	tl.set(charts.swing, { opacity: 0 }, 34.45);
	tl.set(charts.oi, { opacity: 1 }, 34.45);
	rise(34.5);
	// Missing Monday OI is part of the panel, not a third numerical observation.
	tl.to(
		[one("o-absent-mon"), one("o-expired")],
		{ opacity: 1, duration: 0.55 },
		34.5,
	);
	const grow = (index: number, at: number) => {
		const bar = bars[index];
		if (bar.value === null) return;
		const rect = one(`o-bar-${bar.id}`);
		const value = one<SVGTextElement>(`o-value-${bar.id}`);
		const state = { value: 0 };
		const draw = () => {
			// One modeled count drives the bar and its readout, including while scrubbing.
			const contracts = Math.round(state.value);
			const y = L.yO(contracts);
			rect.setAttribute("y", String(y));
			rect.setAttribute("height", String(L.yO(0) - y));
			value.setAttribute("y", String(y - 10));
			value.textContent = count(contracts);
		};
		tl.fromTo(
			state,
			{ value: 0 },
			{
				value: bar.value,
				duration: 0.7,
				ease: "power2.out",
				immediateRender: false,
				onUpdate: draw,
			},
			at,
		);
		tl.to(value, { opacity: 1, duration: 0.3 }, at);
	};
	// The panel settles at 35.3, then has a full second of quiet before Thursday grows.
	grow(0, 36.3);
	// Thursday settles at 37.0; Friday starts after one second of quiet.
	grow(1, 38.0);
	// Friday settles at 38.7; keep the completed tableau for 2.3 seconds.
	// Cut: the claim.
	tl.addLabel("claim", 41.0);
	hide(one("o-head"), 41.0);
	sink(41.0);
	tl.fromTo(
		one("c-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		41.3,
	);
	show(one("c-sub"), 41.7);

	// ——— next ———
	tl.addLabel("next", 45.4);
	hide(kids("claim"), 45.4);
	d.close(45.4);
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
		{ id: "swing", label: ["Delta swings", "Delta 摆动"] },
		{ id: "oi", label: ["Open interest", "未平仓量"] },
		{ id: "claim", label: ["Little time", "时间少"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
