import { useId } from "react";
import { ALFA_ATR_14, type Copy, pick } from "@/content/world";
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
	CALL_WALL,
	distanceText,
	MAX_PAIN,
	type Metric,
	metricAt,
	metricText,
	millions,
	ONE_SD,
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
 * wall to $95. Then max pain: what holders would be paid at each settlement price, smallest
 * at $100, against the model's one-standard-deviation range of $90 to $110. Last, one
 * distance in three units: $5, 5% and 3.1 ATRs to the put wall.
 *
 *   open      0–4      "Walls and max pain"
 *   question  4–9.5    $90 or $95?
 *   walls     9.5–25.5 open interest: $110 and $90; by gamma: the put wall moves to $95;
 *                       cut: $90 by open interest against $95 by gamma
 *   pain      25.5–36.5 paid to puts, to calls, in total; minimum $100; model range $90–$110;
 *                       cut: "A payout minimum is not a forecast."
 *   distance  36.5–47  −$5 → −5.0% → −3.1 ATR; cut: "A level is a reference, not a target."
 *   next      47–49.5  Next: charm and vanna
 */

const END = 49.5;
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
const LOW = Math.round(SPOT - ONE_SD);
const HIGH = Math.round(SPOT + ONE_SD);
const RULER = [92, 113] as const;
const UNITS = ["dollars", "percent", "atr"] as const satisfies readonly Unit[];
const ATR_TICKS = Array.from(
	{ length: 14 },
	(_, i) => SPOT + (i - 5) * ALFA_ATR_14,
);

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	const left = Math.max(frame.margin, narrow ? 46 : 0);
	// On a phone the last price label is centred on the edge of the plot: leave it room.
	const right = narrow ? width - 26 : width * 0.965;
	const top = height * (narrow ? 0.36 : 0.28);
	const bottom = height * 0.84;
	const middle = (top + bottom) / 2;
	const slot = (right - left) / STRIKES.length;
	const reach = (bottom - top) / 2 - 16;
	const px = (settle: number) =>
		left + ((settle - PAY_X[0]) / (PAY_X[1] - PAY_X[0])) * (right - left);
	const py = (dollars: number) => bottom - (dollars / PAY_Y) * (bottom - top);
	const rx = (price: number) =>
		left + ((price - RULER[0]) / (RULER[1] - RULER[0])) * (right - left);
	return {
		...frame,
		left,
		right,
		top,
		bottom,
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
	qLine: [
		"One chain, one close, two put walls. Which is it?",
		"同一条链，同一个收盘，两个看跌墙。到底是哪个？",
	],
	oiHead: [
		"Open interest by strike: calls up, puts down.",
		"各行权价的未平仓量：看涨向上，看跌向下。",
	],
	oiHeadShort: ["Open interest, by strike.", "各行权价的未平仓量。"],
	oiWallHead: [
		`Most contracts: call wall ${stock(CALL_ANY)}, put wall ${stock(PUT_OI)}.`,
		`合约最多：看涨墙 ${stock(CALL_ANY)}，看跌墙 ${stock(PUT_OI)}。`,
	],
	oiWallHeadShort: [
		`Most contracts: ${stock(CALL_ANY)} and ${stock(PUT_OI)}.`,
		`合约最多：${stock(CALL_ANY)} 与 ${stock(PUT_OI)}。`,
	],
	gexWallHead: [
		`Weight by gamma and the put wall moves to ${stock(PUT_GEX)}.`,
		`按 Gamma 加权，看跌墙移到 ${stock(PUT_GEX)}。`,
	],
	gexWallHeadShort: [
		`By gamma, the put wall is ${stock(PUT_GEX)}.`,
		`按 Gamma，看跌墙在 ${stock(PUT_GEX)}。`,
	],
	axisOi: [
		"Oct 18 open interest, Friday's close",
		"10月18日 未平仓量，周五收盘",
	],
	axisGex: [
		"Oct 18 |GEX| by strike, $ per 1%",
		"10月18日 各行权价 |GEX|，每 1%",
	],
	calls: ["calls", "看涨"],
	puts: ["puts", "看跌"],
	byOi: ["by open interest", "按未平仓量"],
	byOiShort: ["open interest", "未平仓量"],
	byGex: ["by gamma", "按 Gamma"],
	twoLine: [
		"A wall is whatever a rule picks. Name the rule, the expiry and the close.",
		"墙是规则选出来的。要写明规则、到期日和收盘时点。",
	],
	painHead: [
		"Max pain: the settlement that pays holders least.",
		"最大痛点：让持有人获赔最少的结算价。",
	],
	painHeadShort: ["Max pain: the least paid out.", "最大痛点：赔付最少处。"],
	payAxis: [
		"paid to Oct 18 holders at expiry, by settlement price",
		"到期时付给 10月18日 持有人，按结算价",
	],
	payAxisShort: ["paid to holders at expiry", "到期时付给持有人"],
	paidPuts: ["to puts", "付给看跌"],
	paidCalls: ["to calls", "付给看涨"],
	minLabel: [`max pain ${stock(MAX_PAIN)}`, `最大痛点 ${stock(MAX_PAIN)}`],
	minPaid: [
		`${millions(payout(MAX_PAIN))} paid`,
		`支付 ${millions(payout(MAX_PAIN))}`,
	],
	rangeHead: [
		`The model's Oct 18 range, ±1 SD: ${stock(LOW)} to ${stock(HIGH)}.`,
		`模型给出的 10月18日 ±1 个标准差范围：${stock(LOW)} 到 ${stock(HIGH)}。`,
	],
	rangeHeadShort: [
		`Model range at Oct 18: ${stock(LOW)}–${stock(HIGH)}.`,
		`模型范围：${stock(LOW)}–${stock(HIGH)}。`,
	],
	rangeLabel: ["model ±1 SD", "模型 ±1 标准差"],
	painBig: ["A payout minimum is not a forecast.", "支付最小值不是预测。"],
	painSub: [
		"It moves when positions open or close, not when ALFA does.",
		"它随持仓的开立和平仓而变，而不是随 ALFA 的价格。",
	],
	rulerHead: ["One distance, three units.", "同一段距离，三种单位。"],
	alfa: [`ALFA ${stock(SPOT)}`, `ALFA ${stock(SPOT)}`],
	putWall: [`put wall ${stock(PUT_WALL)}`, `看跌墙 ${stock(PUT_WALL)}`],
	callWall: [`call wall ${stock(CALL_WALL)}`, `看涨墙 ${stock(CALL_WALL)}`],
	noteDollars: ["one tick = $1", "每格 = $1"],
	notePercent: [
		`one tick = 1% of ${stock(SPOT)} = $1`,
		`每格 = ${stock(SPOT)} 的 1% = $1`,
	],
	noteAtr: [
		`one tick = 1 ATR = $${ALFA_ATR_14.toFixed(2)}, a typical day's range, not a direction`,
		`每格 = 1 ATR = $${ALFA_ATR_14.toFixed(2)}，典型一天的波幅，不是方向`,
	],
	noteAtrShort: [
		`one tick = 1 ATR = $${ALFA_ATR_14.toFixed(2)}, a typical day`,
		`每格 = 1 ATR = $${ALFA_ATR_14.toFixed(2)}，典型一天`,
	],
	claimBig: ["A level is a reference, not a target.", "位置是参考，不是目标。"],
	claimSub: [
		"Give the rule, the scope, the date and the unit with every level.",
		"每个位置都要说明规则、范围、日期和单位。",
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
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<clipPath id={`pay-${id}`}>
					<rect
						x={L.left}
						y={L.top - 6}
						width={L.right - L.left}
						height={L.bottom - L.top + 8}
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
							className="wt-small wt-gain"
						>
							{t(copy.calls)}
						</text>
						<text
							x={L.left - 6}
							y={L.middle + 16}
							textAnchor="end"
							className="wt-small wt-loss"
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
								{`$${strike}`}
							</text>
						))}
						{STRIKES.map((strike, i) =>
							SIDES.map((side) => (
								<rect
									key={`${strike}-${side}`}
									data-f={`bar-${strike}-${side}`}
									className="wt-film-bar"
									data-tone={side === "call" ? "gain" : "loss"}
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
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(narrow ? copy.payAxisShort : copy.payAxis)}
						</text>
						<rect
							data-f="band"
							x={L.px(SPOT - ONE_SD)}
							y={L.top}
							width={L.px(SPOT + ONE_SD) - L.px(SPOT - ONE_SD)}
							height={L.bottom - L.top}
							className="wt-band-neutral"
						/>
						<text
							data-f="band-label"
							x={L.px(SPOT)}
							y={L.top + 16}
							textAnchor="middle"
							className="wt-small wt-halo"
						>
							{t(copy.rangeLabel)}
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
								className="wt-line-short"
								d={L.payPath("put")}
							/>
							<path
								data-f="pay-call"
								className="wt-line-long"
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
							className="wt-small wt-halo"
							style={{ fill: "var(--wt-short)" }}
						>
							{t(copy.paidPuts)}
						</text>
						<text
							data-f="pay-call-label"
							x={L.px(PAY_X[1]) - 10}
							y={L.py(payout(PAY_X[1], "call")) + 4}
							textAnchor="end"
							className="wt-small wt-halo"
							style={{ fill: "var(--wt-long)" }}
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
						<g data-f="min-label" textAnchor="middle">
							<text
								x={minX}
								y={minY - 30}
								className="wt-halo wt-accent wt-marker-label"
							>
								{t(copy.minLabel)}
							</text>
							<text x={minX} y={minY - 15} className="wt-halo wt-small">
								{t(copy.minPaid)}
							</text>
						</g>
					</g>

					{/* One distance, three units. */}
					<g data-f="ruler">
						<path d={`M${L.left} ${R}H${L.right}`} className="wt-axis" />
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
						<g data-f="ticks-atr">
							{ATR_TICKS.map((price) => (
								<path
									key={price}
									d={`M${L.rx(price)} ${R - 7}V${R + 7}`}
									className="wt-film-riser"
								/>
							))}
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
			{headline("w-head", copy.oiWallHead, copy.oiWallHeadShort)}
			{headline("g-head", copy.gexWallHead, copy.gexWallHeadShort)}
			<g data-f="two">
				{(
					[
						[narrow ? copy.byOiShort : copy.byOi, stock(PUT_OI), ""],
						[copy.byGex, stock(PUT_GEX), "wt-film-accent"],
					] as const
				).map(([tag, num, tone], i) => (
					<g key={tag[0]}>
						<Word
							name={`w-tag-${i}`}
							x={W * L.pair[i]}
							y={H * 0.3}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`w-num-${i}`}
							x={W * L.pair[i]}
							y={H * 0.3 + T.big * 0.95}
							size={T.big * 0.85}
							className={`wt-film-num ${tone}`}
						>
							{num}
						</Word>
					</g>
				))}
				<Lines
					name="w-line"
					text={t(copy.twoLine)}
					x={W / 2}
					y={H * 0.72}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("p-head", copy.painHead, copy.painHeadShort)}
			{headline("r-head", copy.rangeHead, copy.rangeHeadShort)}
			<g data-f="pain-claim">
				<Lines
					name="y-big"
					text={t(copy.painBig)}
					x={W / 2}
					y={H * 0.44}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="y-sub"
					text={t(copy.painSub)}
					x={W / 2}
					y={
						H * 0.44 +
						T.title * 1.15 +
						(lineCount(t(copy.painBig), room, T.title) - 1) * T.title * 1.35
					}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("u-head", copy.rulerHead, copy.rulerHead)}
			{(
				[
					["note-dollars", copy.noteDollars],
					["note-percent", copy.notePercent],
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
	const { tl, one, kids, show, hide, pop, slam, rise, sink } = d;
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
			{ strokeDasharray: length, strokeDashoffset: length },
			{ strokeDashoffset: 0, duration, ease: "power2.inOut" },
			at,
		);
	};
	const fold = (from: Element, to: Element, at: number) => {
		d.flip(from, to, at);
		tl.set(from, { opacity: 0 }, at + 0.3);
	};

	d.hidden([
		one("pain"),
		one("ruler"),
		one("axis-gex"),
		one("hi-call"),
		one("hi-put-oi"),
		one("hi-put-gex"),
		...wallLabels.map(({ name }) => one(name)),
		one("band"),
		one("band-label"),
		one("pay-put-label"),
		one("pay-call-label"),
		one("min-dot"),
		one("min-label"),
		one("ticks-atr"),
		...SIDES.flatMap((side) => UNITS.map((unit) => one(`d-${side}-${unit}`))),
		...flat("q"),
		...["o-head", "w-head", "g-head", "p-head", "r-head", "u-head"].map(
			(name) => one(name),
		),
		...UNITS.map((unit) => one(`note-${unit}`)),
		...flat("two"),
		...kids("pain-claim"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: two put walls for one chain ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	slam(one("q-a"), 4.9);
	show(one("q-or"), 5.4);
	slam(one("q-b"), 5.7);
	show(one("q-line"), 6.6);

	// ——— walls: open interest picks one pair, gamma another ———
	tl.addLabel("walls", 9.5);
	hide(flat("q"), 9.5);
	show(one("o-head"), 9.7, "above");
	rise(9.8);
	SIDES.forEach((side, s) => {
		STRIKES.forEach((strike, i) => {
			tl.to(
				bar(strike, side),
				{
					attr: shape("oi", strike, side),
					duration: 0.5,
					ease: "back.out(1.3)",
				},
				10.4 + s * 0.9 + i * 0.1,
			);
		});
	});
	// The most contracts on each side.
	d.swap(one("o-head"), one("w-head"), 13.4);
	tl.to(
		[one("hi-call"), one("hi-put-oi")],
		{ opacity: 1, duration: 0.4 },
		13.9,
	);
	show([one("wl-call-oi"), one("wl-put-oi")], 14.1);
	// Weighted by gamma: the bars near the money grow, and the put wall moves.
	d.swap(one("w-head"), one("g-head"), 16.8);
	d.swap(one("axis-oi"), one("axis-gex"), 16.8);
	hide([one("wl-call-oi"), one("wl-put-oi")], 16.8);
	SIDES.forEach((side) => {
		STRIKES.forEach((strike) => {
			tl.to(
				bar(strike, side),
				{
					attr: shape("gex", strike, side),
					duration: 0.9,
					ease: "power2.inOut",
				},
				17.1,
			);
		});
	});
	tl.to(
		one("hi-call"),
		{
			attr: shape("gex", CALL_ANY, "call"),
			duration: 0.9,
			ease: "power2.inOut",
		},
		17.1,
	);
	tl.to(
		one("hi-put-oi"),
		{
			attr: shape("gex", PUT_OI, "put"),
			opacity: 0,
			duration: 0.9,
			ease: "power2.inOut",
		},
		17.1,
	);
	tl.to(one("hi-put-gex"), { opacity: 1, duration: 0.5 }, 17.7);
	show([one("wl-call-gex"), one("wl-put-gex")], 18.1);
	// Cut: the two put walls.
	hide([one("g-head"), one("axis-gex")], 21.0);
	sink(21.0);
	show(one("w-tag-0"), 21.4);
	slam(one("w-num-0"), 21.6);
	show(one("w-tag-1"), 22.2);
	slam(one("w-num-1"), 22.4);
	show(one("w-line"), 23.2);

	// ——— pain: the payout minimum ———
	tl.addLabel("pain", 25.5);
	hide(flat("two"), 25.5);
	tl.set(one("bars"), { opacity: 0 }, 25.6);
	tl.set(one("pain"), { opacity: 1 }, 25.6);
	show(one("p-head"), 25.8, "above");
	rise(25.9);
	draw(one<SVGPathElement>("pay-put"), 26.5, 1.0);
	show(one("pay-put-label"), 27.1);
	draw(one<SVGPathElement>("pay-call"), 27.3, 1.0);
	show(one("pay-call-label"), 27.9);
	draw(one<SVGPathElement>("pay-total"), 28.3, 1.2);
	pop(one("min-dot"), 29.4);
	show(one("min-label"), 29.6);
	// The model's range for the same date.
	d.swap(one("p-head"), one("r-head"), 31.0);
	tl.to(one("band"), { opacity: 1, duration: 0.6 }, 31.4);
	show(one("band-label"), 31.7);
	// Cut: the claim.
	hide(one("r-head"), 33.2);
	sink(33.2);
	tl.fromTo(
		one("y-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
		33.6,
	);
	show(one("y-sub"), 34.1);

	// ——— distance: one level, three units ———
	tl.addLabel("distance", 36.5);
	hide(kids("pain-claim"), 36.5);
	tl.set(one("pain"), { opacity: 0 }, 36.6);
	tl.set(one("ruler"), { opacity: 1 }, 36.6);
	show(one("u-head"), 36.8, "above");
	rise(36.9);
	show([one("d-put-dollars"), one("d-call-dollars")], 37.6);
	show(one("note-dollars"), 37.9);
	// Percent of $100 is a dollar a tick: the same marks, new numbers.
	for (const side of SIDES)
		fold(one(`d-${side}-dollars`), one(`d-${side}-percent`), 39.4);
	d.swap(one("note-dollars"), one("note-percent"), 39.4);
	// ATR: wider ticks, smaller numbers.
	for (const side of SIDES)
		fold(one(`d-${side}-percent`), one(`d-${side}-atr`), 41.2);
	d.swap(one("note-percent"), one("note-atr"), 41.2);
	tl.to(one("ticks-unit"), { opacity: 0.25, duration: 0.4 }, 41.2);
	tl.to(one("ticks-atr"), { opacity: 1, duration: 0.5 }, 41.4);
	// Cut: the claim.
	hide([one("u-head"), one("note-atr")], 43.6);
	sink(43.6);
	tl.fromTo(
		one("z-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
		44.0,
	);
	show(one("z-sub"), 44.5);

	// ——— next ———
	tl.addLabel("next", 47);
	hide(kids("claim"), 47.0);
	d.close(47.0);
	return tl;
}

export const structuralLevelsFilm: Film = {
	id: "structural-levels",
	label: [
		`Walls and max pain, as a short film: two put walls for one chain, ${stock(PUT_OI)} and ${stock(PUT_GEX)}; Oct 18 open interest by strike picking a call wall of ${stock(CALL_ANY)} and a put wall of ${stock(PUT_OI)}, and gamma weighting moving the put wall to ${stock(PUT_GEX)}; what holders would be paid at each settlement price, smallest at ${stock(MAX_PAIN)}, against the model's range of ${stock(LOW)} to ${stock(HIGH)}; and one distance to the put wall as ${distanceText(PUT_WALL, "dollars")}, ${distanceText(PUT_WALL, "percent")} and ${distanceText(PUT_WALL, "atr")}`,
		`墙位与最大痛点短片：同一条链的两个看跌墙，${stock(PUT_OI)} 与 ${stock(PUT_GEX)}；按行权价的 10月18日 未平仓量选出看涨墙 ${stock(CALL_ANY)} 和看跌墙 ${stock(PUT_OI)}，按 Gamma 加权后看跌墙移到 ${stock(PUT_GEX)}；各结算价下付给持有人的金额，在 ${stock(MAX_PAIN)} 最少，对照模型的 ${stock(LOW)} 到 ${stock(HIGH)} 范围；以及到看跌墙的同一段距离：${distanceText(PUT_WALL, "dollars")}、${distanceText(PUT_WALL, "percent")} 和 ${distanceText(PUT_WALL, "atr")}`,
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
