import { useId } from "react";
import { ALFA_ATR_14, type Copy, pick } from "@/content/world";
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
	toneClass,
	Word,
} from "../walkthrough/film-kit";
import {
	CALL_WALL,
	distanceText,
	MAX_PAIN,
	type Metric,
	metricAt,
	metricText,
	millions,
	PUT_WALL,
	payout,
	SPOT,
	STRIKES,
	stock,
	type Unit,
	wallOf,
} from "./structural-levels-model";

/*
 * Walls and max pain, as a film. It opens on two put walls for one chain, $90 and $95,
 * and shows where both come from: Oct 18 open interest by strike, calls up and puts down,
 * picks $110 and $90; weighting by gamma, which is largest near the money, moves the put
 * wall to $95. Then max pain: put and call payouts build the total, whose minimum is
 * linked to a large $100 readout. Last, one
 * distance in three units: $5, 5% and 3.1 ATRs to the put wall.
 *
 *   open      0–4        "Walls and max pain"
 *   question  4–9.6      $90 or $95?
 *   walls     9.6–21.7   OI picks $110/$90; gamma weights near spot, then the $95 answer
 *   pain      21.7–32.55 paired put/call curves, then total, each with 1 s quiet; $100 hero
 *                        locks at 28.4 and stands 3.7 s after bracket settlement
 *   distance  32.55–45.4 −$5 → −5.0% → −3.1 ATR; cut: "A level is a reference, not a target."
 *   next      45.4–47.4  Next: charm and vanna
 */

const END = 47.4;
const SIDES = ["call", "put"] as const;
const PUT_OI = wallOf("oi", "put");
const PUT_GEX = wallOf("gex", "put");
const CALL_ANY = wallOf("oi", "call");
const PEAK: Record<Metric, number> = {
	oi: Math.max(
		...STRIKES.flatMap((k) => SIDES.map((s) => metricAt("oi", k, s))),
	),
	gex: Math.max(
		...STRIKES.flatMap((k) => SIDES.map((s) => metricAt("gex", k, s))),
	),
};
const PAY_X = [85, 120] as const;
const PAY_Y = 9_000_000;
const settles = Array.from(
	{ length: PAY_X[1] - PAY_X[0] + 1 },
	(_, i) => PAY_X[0] + i,
);
const RULER = [92, 113] as const;
const UNITS = ["dollars", "percent", "atr"] as const satisfies readonly Unit[];

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	// On a phone the "calls" and "puts" labels need room left of the axis.
	const left = Math.max(frame.margin, narrow ? 58 : 0);
	// On a phone the last price label is centred on the edge of the plot: leave it room.
	const right = narrow ? width - 26 : width * 0.965;
	const top = height * (narrow ? 0.36 : 0.28);
	const bottom = height * 0.84;
	// Keep the large minimum readout above, rather than inside, the payout plot.
	const payTop = height * (narrow ? 0.46 : 0.48);
	const middle = (top + bottom) / 2;
	const slot = (right - left) / STRIKES.length;
	const reach = (bottom - top) / 2 - 16;
	const px = (settle: number) =>
		left + ((settle - PAY_X[0]) / (PAY_X[1] - PAY_X[0])) * (right - left);
	const py = (dollars: number) =>
		bottom - (dollars / PAY_Y) * (bottom - payTop);
	const rx = (price: number) =>
		left + ((price - RULER[0]) / (RULER[1] - RULER[0])) * (right - left);
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		payTop,
		middle,
		slot,
		reach,
		barX: (i: number) => left + slot * (i + 0.5),
		barWidth: Math.min(slot * 0.5, 44),
		/** A bar's height under a rule, scaled to that rule's largest bar. */
		h: (metric: Metric, strike: number, side: (typeof SIDES)[number]) =>
			(metricAt(metric, strike, side) / PEAK[metric]) * reach,
		px,
		py,
		payPath: (side?: "call" | "put") =>
			settles
				.map(
					(settle, i) =>
						`${i ? "L" : "M"}${px(settle).toFixed(1)} ${py(payout(settle, side)).toFixed(1)}`,
				)
				.join(""),
		rx,
		rulerY: height * (narrow ? 0.6 : 0.58),
		pair: narrow ? [0.27, 0.73] : [0.32, 0.68],
	};
}

const copy = {
	title: ["Walls and max pain", "墙位与最大痛点"],
	titleSub: ["reference levels, not targets", "参考位置，不是目标"],
	qTag: ["ALFA Oct 18 put wall", "ALFA 10月18日 看跌墙"],
	qOr: ["or", "还是"],
	qLine: ["Same chain, same close: which wall?", "同链同收盘，哪个墙位？"],
	oiHead: ["The rule picks the wall.", "规则选出墙位。"],
	oiHeadShort: ["The rule picks the wall.", "规则选出墙位。"],
	oiWallHead: [
		`Most: calls ${stock(CALL_ANY)}, puts ${stock(PUT_OI)}.`,
		`最多：看涨${stock(CALL_ANY)}、看跌${stock(PUT_OI)}。`,
	],
	oiWallHeadShort: [
		`Most: calls ${stock(CALL_ANY)}, puts ${stock(PUT_OI)}.`,
		`最多：看涨${stock(CALL_ANY)}、看跌${stock(PUT_OI)}。`,
	],
	gexWallHead: [
		"Gamma weights strikes near spot more.",
		"现价附近的 Gamma 权重更高。",
	],
	gexWallHeadShort: [
		"Gamma favors strikes near spot.",
		"现价附近的 Gamma 权重更高。",
	],
	gexAnswer: [
		`Put wall: ${stock(PUT_GEX)} by gamma.`,
		`Gamma 看跌墙：${stock(PUT_GEX)}。`,
	],
	axisOi: [
		"Oct 18 open interest, Friday's close",
		"10月18日 未平仓量，周五收盘",
	],
	axisGex: [
		"Oct 18 modeled |GEX| by strike, $/1%",
		"10月18日 模型各行权价 |GEX|，每 1%",
	],
	calls: ["calls", "看涨"],
	puts: ["puts", "看跌"],
	painHead: ["Which settlement pays holders least?", "哪个结算价赔付最少？"],
	painHeadShort: [
		"Which settlement pays holders least?",
		"哪个结算价赔付最少？",
	],
	payAxis: [
		"paid to Oct 18 holders at expiry, by settlement price",
		"到期时付给 10月18日 持有人，按结算价",
	],
	payAxisShort: ["paid to holders at expiry", "到期时付给持有人"],
	paidPuts: ["to puts", "付给看跌"],
	paidCalls: ["to calls", "付给看涨"],
	paidTotal: ["puts + calls", "看跌 + 看涨"],
	minLabel: ["max pain", "最大痛点"],
	minPaid: [
		`${millions(payout(MAX_PAIN))} paid`,
		`支付 ${millions(payout(MAX_PAIN))}`,
	],
	rulerHead: ["One distance, three units.", "同一段距离，三种单位。"],
	alfa: [`ALFA ${stock(SPOT)}`, `ALFA ${stock(SPOT)}`],
	putWall: [`put wall ${stock(PUT_WALL)}`, `看跌墙 ${stock(PUT_WALL)}`],
	callWall: [`call wall ${stock(CALL_WALL)}`, `看涨墙 ${stock(CALL_WALL)}`],
	noteDollars: [
		`one tick = $1 = 1% of ${stock(SPOT)}`,
		`每格 = $1 = ${stock(SPOT)} 的 1%`,
	],
	noteAtr: [
		`1 ATR = $${ALFA_ATR_14.toFixed(2)}: typical range, not direction.`,
		`每格 = 1 ATR = $${ALFA_ATR_14.toFixed(2)}，典型一天的波幅，不是方向`,
	],
	noteAtrShort: [
		`1 ATR = $${ALFA_ATR_14.toFixed(2)}: range, not direction.`,
		`1 ATR = $${ALFA_ATR_14.toFixed(2)}：波幅，非方向。`,
	],
	claimBig: ["Levels are references, not targets.", "位置只作参考，不作目标。"],
	claimSub: [
		"Per level: rule, scope, date, unit.",
		"逐个标注：规则、范围、日期、单位。",
	],
	nextBig: ["Next: charm and vanna", "下一课：Charm 与 Vanna"],
	nextSub: ["exposure that changes without a trade", "没有成交也会变化的敞口"],
} as const satisfies Record<string, Copy>;

/** The wall labels: the value each rule picked, at the bar it picked. */
const wallLabels = [
	{ name: "wl-call-oi", metric: "oi", strike: CALL_ANY, side: "call" },
	{ name: "wl-put-oi", metric: "oi", strike: PUT_OI, side: "put" },
	{ name: "wl-call-gex", metric: "gex", strike: CALL_ANY, side: "call" },
	{ name: "wl-put-gex", metric: "gex", strike: PUT_GEX, side: "put" },
] as const;

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
	const headline = (name: string, text: Copy, short: Copy) => (
		<Lines
			name={name}
			text={t(narrow ? short : text)}
			x={L.margin}
			y={L.headY}
			size={T.head}
			maxWidth={room}
			anchor="start"
		/>
	);
	const highlight = (
		name: string,
		metric: Metric,
		strike: number,
		side: (typeof SIDES)[number],
	) => {
		const i = STRIKES.indexOf(strike);
		const h = L.h(metric, strike, side);
		return (
			<rect
				data-f={name}
				className="wt-film-bar"
				data-tone="total"
				x={L.barX(i) - L.barWidth / 2}
				y={side === "call" ? L.middle - h : L.middle}
				width={L.barWidth}
				height={h}
				rx={2}
			/>
		);
	};
	const R = L.rulerY;
	const minX = L.px(MAX_PAIN);
	const minY = L.py(payout(MAX_PAIN));
	// Leave room for the lock's expanded entrance below the phone headline.
	const heroTagY = L.headY + T.head * 1.6 + (narrow ? 16 : 0);
	const heroY = heroTagY + T.big * 1.05;
	const heroPaidY = heroY + T.body * 1.45;
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<clipPath id={`pay-${id}`}>
					<rect
						x={L.left}
						y={L.payTop - 6}
						width={L.right - L.left}
						height={L.bottom - L.payTop + 8}
					/>
				</clipPath>
			</defs>

			<g data-f="depth">
				<g data-f="world">
					{/* Mirror bars: calls above the axis, puts below. */}
					<g data-f="bars">
						<text
							data-f="axis-oi"
							x={L.left}
							y={L.top - 12}
							className="wt-small"
						>
							{t(copy.axisOi)}
						</text>
						<text
							data-f="axis-gex"
							x={L.left}
							y={L.top - 12}
							className="wt-small"
						>
							{t(copy.axisGex)}
						</text>
						<text
							x={L.left - 6}
							y={L.middle - 8}
							textAnchor="end"
							className={`wt-small ${toneClass.call}`}
						>
							{t(copy.calls)}
						</text>
						<text
							x={L.left - 6}
							y={L.middle + 16}
							textAnchor="end"
							className={`wt-small ${toneClass.put}`}
						>
							{t(copy.puts)}
						</text>
						<path d={`M${L.left} ${L.middle}H${L.right}`} className="wt-axis" />
						{STRIKES.map((strike, i) => (
							<text
								key={strike}
								x={L.barX(i)}
								y={L.bottom + 16}
								textAnchor="middle"
								className="wt-small"
							>
								{strike === SPOT ? (
									narrow ? (
										<>
											{/* Keep the price on its tick baseline, clear of adjacent ticks. */}
											<tspan x={L.barX(i)} y={L.bottom + 3}>
												{locale === "zh" ? "现价 " : "spot "}
											</tspan>
											<tspan x={L.barX(i)} y={L.bottom + 16}>
												{stock(SPOT)}
											</tspan>
										</>
									) : (
										`${locale === "zh" ? "现价" : "spot"} ${stock(SPOT)}`
									)
								) : (
									stock(strike)
								)}
							</text>
						))}
						{STRIKES.map((strike, i) =>
							SIDES.map((side) => (
								<rect
									key={`${strike}-${side}`}
									data-f={`bar-${strike}-${side}`}
									className="wt-film-bar"
									data-tone={side}
									x={L.barX(i) - L.barWidth / 2}
									y={L.middle}
									width={L.barWidth}
									height={0}
									rx={2}
								/>
							)),
						)}
						{highlight("hi-call", "oi", CALL_ANY, "call")}
						{highlight("hi-put-oi", "oi", PUT_OI, "put")}
						{highlight("hi-put-gex", "gex", PUT_GEX, "put")}
						{wallLabels.map(({ name, metric, strike, side }) => {
							const h = L.h(metric, strike, side);
							return (
								<text
									key={name}
									data-f={name}
									x={L.barX(STRIKES.indexOf(strike))}
									y={side === "call" ? L.middle - h - 6 : L.middle + h + 14}
									textAnchor="middle"
									className="wt-halo wt-accent wt-marker-label"
								>
									{metricText(metric, metricAt(metric, strike, side))}
								</text>
							);
						})}
					</g>

					{/* What holders would be paid at each settlement price. */}
					<g data-f="pain">
						{/* The caption belongs below the price ticks, clear of the hero lock. */}
						<text x={L.left} y={L.bottom + 40} className="wt-small">
							{t(narrow ? copy.payAxisShort : copy.payAxis)}
						</text>
						{[0, 3_000_000, 6_000_000, 9_000_000].map((tick) => (
							<g key={tick}>
								<path
									d={`M${L.left} ${L.py(tick)}H${L.right}`}
									className={tick === 0 ? "wt-axis" : "wt-grid"}
								/>
								<text
									x={L.left - 8}
									y={L.py(tick) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{tick === 0 ? "$0" : `$${tick / 1_000_000}M`}
								</text>
							</g>
						))}
						{[85, 90, 95, 100, 105, 110, 115, 120].map((tick) => (
							<text
								key={tick}
								x={L.px(tick)}
								y={L.bottom + 16}
								textAnchor="middle"
								className="wt-small"
							>
								{`$${tick}`}
							</text>
						))}
						<g clipPath={`url(#pay-${id})`}>
							<path
								data-f="pay-put"
								className="wt-line-put"
								d={L.payPath("put")}
							/>
							<path
								data-f="pay-call"
								className="wt-line-call"
								d={L.payPath("call")}
							/>
							<path
								data-f="pay-total"
								className="wt-line-position"
								d={L.payPath()}
							/>
						</g>
						<text
							data-f="pay-put-label"
							x={L.px(PAY_X[0]) + 10}
							y={L.py(payout(PAY_X[0], "put")) + 4}
							className={`wt-small wt-halo ${toneClass.put}`}
						>
							{t(copy.paidPuts)}
						</text>
						<text
							data-f="pay-call-label"
							x={L.px(PAY_X[1]) - 10}
							y={L.py(payout(PAY_X[1], "call")) + 4}
							textAnchor="end"
							className={`wt-small wt-halo ${toneClass.call}`}
						>
							{t(copy.paidCalls)}
						</text>
						<circle
							data-f="min-dot"
							cx={minX}
							cy={minY}
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
						<text
							data-f="pay-total-label"
							x={narrow ? L.right : L.px(108)}
							y={narrow ? L.payTop - 12 : L.py(payout(108)) - 12}
							textAnchor={narrow ? "end" : "middle"}
							className="wt-small wt-halo wt-accent"
						>
							{t(copy.paidTotal)}
						</text>
						<path
							data-f="min-link"
							d={`M${minX} ${minY - 9}V${Math.max(heroPaidY + T.body, L.payTop + 12)}`}
							className="wt-bracket"
						/>
						<g data-f="min-label">
							<Word
								name="min-tag"
								x={minX}
								y={heroTagY}
								size={T.small}
								className="wt-film-tag wt-film-accent"
							>
								{t(copy.minLabel)}
							</Word>
							<Word
								name="min-value"
								x={minX}
								y={heroY}
								size={T.big}
								className="wt-film-num wt-film-accent"
							>
								{stock(MAX_PAIN)}
							</Word>
							<Word
								name="min-paid"
								x={minX}
								y={heroPaidY}
								size={T.body}
								className="wt-film-num wt-film-dim"
							>
								{t(copy.minPaid)}
							</Word>
						</g>
					</g>

					{/* One distance, three units. */}
					<g data-f="ruler">
						<path d={`M${L.left} ${R}H${L.right}`} className="wt-axis" />
						{/* Retrace the same distance against the settled ATR ticks. */}
						<path
							data-f="atr-span"
							d={`M${L.rx(SPOT)} ${R + 10}H${L.rx(PUT_WALL)}`}
							className="wt-bracket"
						/>
						<g data-f="ticks-unit">
							{Array.from({ length: RULER[1] - RULER[0] + 1 }, (_, i) => {
								const x = L.rx(RULER[0] + i);
								return (
									<path
										key={x}
										d={`M${x} ${R - 5}V${R + 5}`}
										className="wt-axis"
									/>
								);
							})}
						</g>
						<path
							d={`M${L.rx(SPOT)} ${R - T.body * 4.4}V${R + 8}`}
							className="wt-bracket"
						/>
						<Word
							name="r-alfa"
							x={L.rx(SPOT)}
							y={R - T.body * 4.9}
							size={T.body}
							className="wt-film-num wt-film-accent"
						>
							{t(copy.alfa)}
						</Word>
						{(
							[
								[PUT_WALL, copy.putWall, "put"],
								[CALL_WALL, copy.callWall, "call"],
							] as const
						).map(([price, label, side]) => (
							<g key={side}>
								<path
									d={`M${L.rx(price)} ${R - 18}V${R + 18}`}
									className="wt-bracket"
								/>
								<Word
									name={`r-wall-${side}`}
									x={L.rx(price)}
									y={R + 18 + T.body * 1.5}
									size={T.body}
									className="wt-film-type wt-film-dim"
								>
									{t(label)}
								</Word>
								<path
									d={`M${L.rx(SPOT)} ${R - 26}H${L.rx(price)}`}
									className="wt-film-link"
								/>
								{UNITS.map((unit) => (
									<Word
										key={unit}
										name={`d-${side}-${unit}`}
										x={
											narrow
												? L.rx(SPOT) + (side === "put" ? -8 : 8)
												: (L.rx(SPOT) + L.rx(price)) / 2
										}
										y={R - 34}
										size={T.head}
										anchor={
											narrow ? (side === "put" ? "end" : "start") : "middle"
										}
										className="wt-film-num"
									>
										{distanceText(price, unit)}
									</Word>
								))}
							</g>
						))}
					</g>
				</g>
			</g>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-tag"
					x={W / 2}
					y={H * 0.3}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				<Word
					name="q-a"
					x={W * L.pair[0]}
					y={H * 0.3 + T.big * 1.15}
					size={T.big}
					className="wt-film-num"
				>
					{stock(PUT_OI)}
				</Word>
				<Word
					name="q-or"
					x={W / 2}
					y={H * 0.3 + T.big * 0.95}
					size={T.body}
					className="wt-film-type wt-film-dim"
				>
					{t(copy.qOr)}
				</Word>
				<Word
					name="q-b"
					x={W * L.pair[1]}
					y={H * 0.3 + T.big * 1.15}
					size={T.big}
					className="wt-film-num"
				>
					{stock(PUT_GEX)}
				</Word>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.8}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("o-head", copy.oiHead, copy.oiHeadShort)}
			<Lines
				name="w-head"
				text={t(narrow ? copy.oiWallHeadShort : copy.oiWallHead)}
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
			<Lines
				name="g-head"
				text={t(narrow ? copy.gexWallHeadShort : copy.gexWallHead)}
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
			<Lines
				name="g-answer"
				text={t(copy.gexAnswer)}
				x={L.margin}
				y={
					L.headY +
					lineCount(t(narrow ? copy.oiHeadShort : copy.oiHead), room, T.head) *
						T.head *
						1.35 +
					lineCount(
						t(narrow ? copy.gexWallHeadShort : copy.gexWallHead),
						room,
						T.head,
					) *
						T.body *
						1.35
				}
				size={T.body}
				maxWidth={room}
				anchor="start"
			/>
			{headline("p-head", copy.painHead, copy.painHeadShort)}
			<Brackets name="lock-pain" glow />
			{headline("u-head", copy.rulerHead, copy.rulerHead)}
			{(
				[
					["note-dollars", copy.noteDollars],
					["note-atr", narrow ? copy.noteAtrShort : copy.noteAtr],
				] as const
			).map(([name, text]) => (
				<Word
					key={name}
					name={name}
					x={W / 2}
					y={R + 18 + T.body * 1.5 + T.body * 3}
					size={T.body}
					className="wt-film-type wt-film-dim"
				>
					{t(text)}
				</Word>
			))}
			<g data-f="claim">
				<Lines
					name="z-big"
					text={t(copy.claimBig)}
					x={W / 2}
					y={H * 0.44}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="z-sub"
					text={t(copy.claimSub)}
					x={W / 2}
					y={
						H * 0.44 +
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
	const { tl, one, kids, show, hide, sink } = d;
	// Establish charts at their final geometry; no outer scale competes with data.
	tl.set(one("depth"), { scale: 1 }, 0);
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const land = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.12, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const flat = (name: string) =>
		kids(name).flatMap((el) => (el.tagName === "g" ? [...el.children] : [el]));
	const bar = (strike: number, side: (typeof SIDES)[number]) =>
		one(`bar-${strike}-${side}`);
	/** Bars stand on the middle axis: calls grow up from it, puts down. */
	const shape = (
		metric: Metric,
		strike: number,
		side: (typeof SIDES)[number],
	) => {
		const h = L.h(metric, strike, side);
		return { y: side === "call" ? L.middle - h : L.middle, height: h };
	};
	const draw = (path: SVGPathElement, at: number, duration: number) => {
		const length = path.getTotalLength();
		tl.fromTo(
			path,
			{ strokeDasharray: `${length} ${length}`, strokeDashoffset: length },
			{ strokeDashoffset: 0, duration, ease: "power2.inOut" },
			at,
		);
	};
	const fold = (from: Element, to: Element, at: number) => {
		d.flip(from, to, at);
		tl.set(from, { opacity: 0 }, at + 0.3);
	};

	const lockPain = one<SVGGraphicsElement>("lock-pain");

	d.hidden([
		one("pain"),
		one("ruler"),
		one("axis-gex"),
		one("hi-call"),
		one("hi-put-oi"),
		one("hi-put-gex"),
		...wallLabels.map(({ name }) => one(name)),
		one("pay-put-label"),
		one("pay-call-label"),
		one("pay-total-label"),
		one("min-dot"),
		one("min-link"),
		one("min-label"),
		lockPain,
		one("atr-span"),
		...SIDES.flatMap((side) => UNITS.map((unit) => one(`d-${side}-${unit}`))),
		...flat("q"),
		...["o-head", "w-head", "g-head", "g-answer", "p-head", "u-head"].map(
			(name) => one(name),
		),
		...UNITS.map((unit) => one(`note-${unit}`)),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: two put walls for one chain ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	land(one("q-a"), 4.8);
	show(one("q-or"), 5.2);
	land(one("q-b"), 5.4);
	show(one("q-line"), 6.0);

	// ——— walls: open interest picks one pair, gamma another ———
	tl.addLabel("walls", 9.6);
	hide(flat("q"), 9.6);
	show(one("o-head"), 9.6, "above", 0.3);
	tl.to(one("depth"), { opacity: 1, duration: 0.3 }, 9.6);
	// Scaffold and question settle at 9.90; wait 1 s, then grow one distribution.
	SIDES.forEach((side) => {
		STRIKES.forEach((strike) => {
			tl.to(
				bar(strike, side),
				{
					attr: shape("oi", strike, side),
					duration: 0.4,
					ease: "power3.out",
				},
				10.9,
			);
		});
	});
	// The most contracts on each side.
	show(one("w-head"), 12.3);
	// The completed distribution rests for 1 s; emphasize its winners by dimming peers.
	SIDES.forEach((side) => {
		for (const strike of STRIKES) {
			if (strike !== wallOf("oi", side))
				tl.to(bar(strike, side), { opacity: 0.3, duration: 0.4 }, 12.3);
		}
	});
	tl.to(
		[one("hi-call"), one("hi-put-oi")],
		{ opacity: 1, duration: 0.4 },
		12.3,
	);
	show([one("wl-call-oi"), one("wl-put-oi")], 12.5);
	// Cut the OI evidence into a clean GEX scaffold at the end of the OI answer
	// hold. The distribution, highlights, wall labels and OI captions leave
	// together, changing over 60% of the visible chart marks; the shared price
	// scaffold stays. Its new caption is up for a full second before GEX data.
	const allBars = STRIKES.flatMap((strike) =>
		SIDES.map((side) => bar(strike, side)),
	);
	// The OI marks leave over the motion floor, gone at 15.8; the GEX scaffold comes on
	// over the same 0.3 s from there (a part of the stage changing is not a cut).
	hide(
		[
			...allBars,
			one("hi-call"),
			one("hi-put-oi"),
			one("hi-put-gex"),
			...wallLabels.map(({ name }) => one(name)),
			one("axis-oi"),
		],
		15.5,
		0.3,
		0,
	);
	for (const mark of allBars)
		tl.set(mark, { attr: { y: L.middle, height: 0 } }, 15.8);
	// The headline keeps its full hold and hands over in place at the change.
	d.swap(one("w-head"), one("g-head"), 15.8);
	tl.fromTo(
		one("axis-gex"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3, ease: "power3.out", immediateRender: false },
		15.8,
	);
	tl.set(one("hi-call"), { attr: shape("gex", CALL_ANY, "call") }, 15.8);
	// After the 1 s scaffold hold, all bars move together in 0.4 s.
	SIDES.forEach((side) => {
		STRIKES.forEach((strike) => {
			tl.set(bar(strike, side), { opacity: 1 }, 16.8);
			tl.to(
				bar(strike, side),
				{
					attr: shape("gex", strike, side),
					duration: 0.4,
					ease: "power3.out",
				},
				16.8,
			);
		});
	});
	// The winner outlines settle with the bars, leaving 1 s before the answer.
	show([one("wl-call-gex"), one("wl-put-gex"), one("g-answer")], 18.2);
	tl.to(
		[one("hi-call"), one("hi-put-gex")],
		{ opacity: 1, duration: 0.3 },
		16.9,
	);
	SIDES.forEach((side) => {
		for (const strike of STRIKES) {
			if (strike !== wallOf("gex", side))
				tl.to(bar(strike, side), { opacity: 0.3, duration: 0.4 }, 18.2);
		}
	});

	// ——— pain: build each component before adding the total ———
	tl.addLabel("pain", 21.7);
	hide([one("o-head"), one("g-head"), one("g-answer"), one("bars")], 21.7);
	// The existing chart depth stays on stage through this handover.
	show(one("pain"), 22.0);
	show(one("p-head"), 22.05, "above");
	show([one("pay-put-label"), one("pay-call-label")], 22.0);
	// The scaffold/question settle by 22.55. Build the two operands as one pair,
	// after 1.25 s of stillness, preserving the 24.60–25.60 proof rest.
	draw(one<SVGPathElement>("pay-put"), 23.8, 0.8);
	draw(one<SVGPathElement>("pay-call"), 23.8, 0.8);
	draw(one<SVGPathElement>("pay-total"), 25.6, 1.0);
	tl.to(
		[one("pay-put"), one("pay-call")],
		{ opacity: 0.3, duration: 0.4 },
		25.6,
	);
	// Fade in place above the phone plot so the label never travels through its axis.
	tl.to(one("pay-total-label"), { opacity: 1, duration: 0.5 }, 25.6);
	land(one("min-dot"), 27.6);
	draw(one<SVGPathElement>("min-link"), 27.6, 0.55);
	tl.to(one("min-link"), { opacity: 1, duration: 0.55 }, 27.6);
	// Fade the readout in place, clear of the chart and its settled curves.
	tl.to(one("min-label"), { opacity: 1, duration: 0.5 }, 27.8);
	d.lock(lockPain, 28.4, { around: one("min-label"), pad: 8 });
	tl.addLabel("hero-lock", 28.4);
	// No new mark enters the readout: 3.70 s of quiet after the brackets settle.

	// ——— distance: one level, three units ———
	tl.addLabel("distance", 32.55);
	// A whole-stage cut after the full hero stand establishes the ruler and its
	// question together. No scaling; 1 s of stillness before either value moves.
	tl.set([one("pain"), one("p-head"), lockPain], { opacity: 0 }, 32.55);
	tl.set([one("ruler"), one("u-head")], { opacity: 1 }, 32.55);
	// The paired readouts still settle at 33.95, keeping every following rest.
	show([one("d-put-dollars"), one("d-call-dollars")], 33.55, "below", 0.4);
	show(one("note-dollars"), 33.65);
	// Percent of $100 is a dollar a tick: the same marks, new numbers, the same note.
	for (const side of SIDES)
		fold(one(`d-${side}-dollars`), one(`d-${side}-percent`), 35.15);
	// Convert the readouts while preserving the price ruler.
	for (const side of SIDES)
		fold(one(`d-${side}-percent`), one(`d-${side}-atr`), 37.15);
	d.swap(one("note-dollars"), one("note-atr"), 37.15);
	// After 1 s of quiet, retrace the measured span without changing its value.
	draw(one<SVGPathElement>("atr-span"), 38.85, 0.6);
	tl.to(one("atr-span"), { opacity: 1, duration: 0.5 }, 38.85);
	// Cut: the claim.
	hide([one("u-head"), one("note-atr")], 41);
	sink(41);
	tl.fromTo(
		one("z-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		41.4,
	);
	show(one("z-sub"), 41.8);

	// ——— next ———
	tl.addLabel("next", 45.4);
	hide(kids("claim"), 45.4);
	d.close(45.4);
	return tl;
}

export const structuralLevelsFilm: Film = {
	id: "structural-levels",
	label: [
		`Walls and max pain, as a short film: two put walls for one chain, ${stock(PUT_OI)} and ${stock(PUT_GEX)}; Oct 18 open interest by strike picking a call wall of ${stock(CALL_ANY)} and a put wall of ${stock(PUT_OI)}, and gamma weighting moving the put wall to ${stock(PUT_GEX)}; what holders would be paid at each settlement price, smallest at ${stock(MAX_PAIN)}; and one distance to the put wall as ${distanceText(PUT_WALL, "dollars")}, ${distanceText(PUT_WALL, "percent")} and ${distanceText(PUT_WALL, "atr")}`,
		`墙位与最大痛点短片：同一条链的两个看跌墙，${stock(PUT_OI)} 与 ${stock(PUT_GEX)}；按行权价的 10月18日 未平仓量选出看涨墙 ${stock(CALL_ANY)} 和看跌墙 ${stock(PUT_OI)}，按 Gamma 加权后看跌墙移到 ${stock(PUT_GEX)}；各结算价下付给持有人的金额，在 ${stock(MAX_PAIN)} 最少；以及到看跌墙的同一段距离：${distanceText(PUT_WALL, "dollars")}、${distanceText(PUT_WALL, "percent")} 和 ${distanceText(PUT_WALL, "atr")}`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Walls and max pain", "墙位与最大痛点"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "walls", label: ["The rule", "规则"] },
		{ id: "pain", label: ["Max pain", "最大痛点"] },
		{ id: "distance", label: ["Distance", "距离"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
