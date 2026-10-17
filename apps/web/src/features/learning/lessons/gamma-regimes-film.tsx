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
	toneClass,
	Word,
} from "../walkthrough/film-kit";
import {
	ABOVE,
	BOOK,
	cumulativeByStrike,
	FLIP,
	lastAsk,
	level,
	money,
	netGex,
	offered,
	SHORTCUT,
	SPOT,
	shareGamma,
	stock,
	TARGET,
} from "./gamma-regimes-model";

/*
 * Gamma regimes, as a film. It opens on a $1 rise and a question with no single answer:
 * do the hedgers buy or sell? The modeled book's net GEX, repriced at every ALFA price,
 * answers by where ALFA is: short gamma at $100, so the hedge buys 5,121 shares with the
 * move; long gamma at $105, so it sells 5,470 against it. The curve crosses zero at the
 * flip, $102.3; a running sum of today's strike bars crosses at $94.1 instead, a
 * different calculation. Last, what the target is not: the tape shows no names and the
 * visible book holds 1,600 shares.
 *
 *   open      0–4        "Gamma regimes"
 *   question  4–9.6      ALFA +$1: buy or sell?
 *   regime    9.6–22.75  net GEX across spot; at $100 buy 5,121; at $105 sell 5,470; flip
 *                        $102.3
 *   shortcut  22.75–33.35 a fixed-spot subtotal plus the final strike contribution; carry
 *                        $102.3 against $94.1, the flip locked
 *   target    33.35–45     buy 5,121 if…; the tape; the book: 1,600 offered;
 *                        cut: "A regime describes a response, not a forecast."
 *   next      45–47.5     Next: walls and max pain
 */

const END = 47.5;
const X = [88, 112] as const;
const Y = 2_000_000;
const curve = Array.from({ length: (X[1] - X[0]) * 2 + 1 }, (_, i) => {
	const spot = X[0] + i / 2;
	return [spot, netGex(spot)] as const;
});
const strikeSum = cumulativeByStrike.map(
	([strike, millions]) => [strike, millions * 1_000_000] as const,
);
const SELL = Math.round(shareGamma(ABOVE));
/** Interpolate the drawn polyline, so the seeker and its crossing lie on the visible proof. */
const valueAt = (points: readonly (readonly [number, number])[], x: number) => {
	const i = points.findIndex(([px]) => px >= x);
	if (i <= 0) return points[Math.max(0, i)][1];
	const [x0, y0] = points[i - 1];
	const [x1, y1] = points[i];
	return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
};
const zeroAt = (points: readonly (readonly [number, number])[]) => {
	const i = points.findIndex(
		([, y], i) => i > 0 && y < 0 !== points[i - 1][1] < 0,
	);
	const [x0, y0] = points[i - 1];
	const [x1, y1] = points[i];
	return x0 + ((0 - y0) / (y1 - y0)) * (x1 - x0);
};
const flipSpot = zeroAt(curve);
const sumStrike = zeroAt(strikeSum);
// Focus the final addition: the subtotal includes every strike from $120 through $95.
const sumSteps = [...strikeSum].reverse();
const sumBefore = sumSteps[sumSteps.length - 2];
const sumAfter = sumSteps[sumSteps.length - 1];
const sumContribution = sumAfter[1] - sumBefore[1];

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	const left = Math.max(frame.margin, narrow ? 46 : 0);
	const right = width * 0.965;
	const top = height * (narrow ? 0.26 : 0.24);
	const bottom = height * (narrow ? 0.64 : 0.68);
	const sumTop = height * (narrow ? 0.52 : 0.4);
	const sumBottom = height * (narrow ? 0.72 : 0.66);
	// The decisive $95-to-$90 step gets its own strike and GEX scales, not the spot axis.
	const sumRight = left + (right - left) * (narrow ? 0.48 : 0.62);
	const sumX = (strike: number) =>
		left + ((strike - 88) / (98 - 88)) * (sumRight - left);
	const sumY = (dollars: number) =>
		sumTop + ((200_000 - dollars) / 800_000) * (sumBottom - sumTop);
	const x = (spot: number) =>
		left + ((spot - X[0]) / (X[1] - X[0])) * (right - left);
	const y = (dollars: number) =>
		(top + bottom) / 2 - (dollars / Y) * ((bottom - top) / 2);
	// Keep the flip label in its proven flight lane as the desktop curve gains height.
	const flipLabelY = narrow
		? Math.max(top + 34, y(0) - frame.type.body * 2.5)
		: height * 0.27 + 34;
	const sumLabelY = sumY(0) + frame.type.body + 26;
	const sumOperandY = sumTop + frame.type.body * 1.25;
	const path = (points: readonly (readonly [number, number])[]) =>
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
		sumTop,
		sumBottom,
		sumRight,
		flipLabelY,
		sumLabelY,
		sumOperandY,
		sumX,
		sumY,
		x,
		y,
		path,
		pair: narrow ? [0.27, 0.73] : [0.32, 0.68],
	};
}

const copy = {
	title: ["Gamma regimes", "Gamma 状态"],
	titleSub: ["hedging, not forecasting", "对冲，而非预测"],
	qMove: ["ALFA +$1", "ALFA +$1"],
	qBuy: ["buy?", "买？"],
	qSell: ["sell?", "卖？"],
	qLine: [
		"Modeled hedging depends on ALFA price.",
		"模型对冲取决于 ALFA 价格。",
	],
	curveHead: ["Net GEX, repriced across spot.", "各价位净 GEX。"],
	curveHeadShort: ["Net GEX across spot.", "各价位净 GEX。"],
	axis: ["modeled book, $ of delta per 1%", "模型账户，每 1% 的 Delta 金额"],
	priceAxis: ["ALFA price", "ALFA 价格"],
	shortZone: ["short gamma", "空 Gamma"],
	longZone: ["long gamma", "多 Gamma"],
	shortHead: [`At ${stock(SPOT)}: short gamma.`, `${stock(SPOT)}：空 Gamma。`],
	shortHeadShort: [
		`At ${stock(SPOT)}: short gamma.`,
		`${stock(SPOT)}：空 Gamma。`,
	],
	longHead: [`At ${stock(ABOVE)}: long gamma.`, `${stock(ABOVE)}：多 Gamma。`],
	longHeadShort: [
		`${stock(ABOVE)}: long gamma.`,
		`${stock(ABOVE)}：多 Gamma。`,
	],
	buy: [`+$1 buy ${count(-BOOK)}`, `+$1 买入 ${count(-BOOK)}`],
	sell: [`+$1 sell ${count(SELL)}`, `+$1 卖出 ${count(SELL)}`],
	buyShort: [`buy ${count(-BOOK)}`, `买入 ${count(-BOOK)}`],
	sellShort: [`sell ${count(SELL)}`, `卖出 ${count(SELL)}`],
	withMove: ["with a rise", "顺势"],
	againstMove: ["against a rise", "逆势"],
	flip: ["flip", "转折"],
	sumAxis: ["Cumulative GEX by strike", "按行权价累计净 GEX"],
	strikeAxis: ["strike", "行权价"],
	sum: ["zero", "穿零"],
	shortcutHead: ["Sum strikes at ALFA $100.", "ALFA $100；按行权价累加。"],
	shortcutHeadShort: ["Sum at ALFA $100.", "ALFA $100；按行权价累加。"],
	repriced: ["flip · repriced across spot", "转折 · 沿现价重定价"],
	repricedShort: ["flip · repriced", "转折 · 重定价"],
	summed: ["strike zero · summed", "行权价累加 · 穿零"],
	summedShort: ["strike zero · sum", "行权价累加穿零"],
	targetHead: [
		"A hedge target is not a market outcome.",
		"对冲目标不是市场结果。",
	],
	targetHeadShort: ["A target is not an outcome.", "目标不是结果。"],
	cardModel: ["model target", "模型目标"],
	cardModelValue: [`buy ${count(TARGET)} shares`, `买入 ${count(TARGET)} 股`],
	cardModelNote: [
		"At $100, +$1; dealers must hold the book and hedge nonstop.",
		"$100 +$1；做市商持此仓才连续对冲。",
	],
	cardModelShort: [
		"At $100, +$1; dealer-held book, hedged nonstop.",
		"$100 +$1；做市商持此仓才连续对冲。",
	],
	cardTape: ["the tape", "成交记录"],
	cardTapeValue: ["no names", "无身份"],
	cardTapeNote: [
		"Price, size, time; no names or motives.",
		"价量时间；不示身份与动机。",
	],
	cardTapeShort: [
		"price, size, time; never who or why",
		"价量时间；不示谁交易、为何。",
	],
	cardBook: ["the book, 10:30", "10:30 挂单簿"],
	cardBookValue: [`${count(offered)} offered`, `挂出 ${count(offered)} 股`],
	cardBookNote: [
		`Three levels to ${stock(lastAsk.price / 100)}; deeper book omitted.`,
		`仅示三档至 ${stock(lastAsk.price / 100)}。`,
	],
	cardBookShort: [
		"three levels; depth beyond isn't shown",
		"三个价位；更深的挂单未显示",
	],
	claimBig: [
		"Regimes describe responses, not forecasts.",
		"状态描述响应，不作预测。",
	],
	claimSub: [
		"Model flip; holdings shape the hedge.",
		"模型转折；持仓决定对冲。",
	],
	nextBig: ["Next: walls and max pain", "下一课：墙位与最大痛点"],
	nextSub: ["reference levels, not targets", "参考位置，不是目标"],
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
	const mx = L.x(SPOT);
	const my = L.y(netGex(SPOT));
	const ax = L.x(ABOVE);
	const ay = L.y(netGex(ABOVE));
	const fx = L.x(flipSpot);
	const sx = L.sumX(sumStrike);
	const cards = [
		[
			copy.cardModel,
			copy.cardModelValue,
			narrow ? copy.cardModelShort : copy.cardModelNote,
			"wt-film-accent",
		],
		[
			copy.cardTape,
			copy.cardTapeValue,
			narrow ? copy.cardTapeShort : copy.cardTapeNote,
			"",
		],
		[
			copy.cardBook,
			copy.cardBookValue,
			narrow ? copy.cardBookShort : copy.cardBookNote,
			"",
		],
	] as const;
	const cardY = (i: number) =>
		H * (narrow ? 0.25 : 0.32) + i * H * (narrow ? 0.24 : 0.2);
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<clipPath id={`sum-draw-${id}`}>
					<rect
						data-f="sum-draw"
						x={L.sumX(sumBefore[0]) - 4}
						y={L.sumTop - 4}
						width={0}
						height={L.sumBottom - L.sumTop + 8}
					/>
				</clipPath>
				<clipPath id={`draw-${id}`}>
					<rect data-f="draw" x={L.left - 4} y={0} width={0} height={H} />
				</clipPath>
			</defs>

			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart">
						<rect
							data-f="zone-short"
							x={L.left}
							y={L.top}
							width={fx - L.left}
							height={L.bottom - L.top}
							className="wt-band-quiet"
						/>
						<rect
							data-f="zone-long"
							x={fx}
							y={L.top}
							width={L.right - fx}
							height={L.bottom - L.top}
							className="wt-band-quiet"
						/>
						<text
							data-f="zone-short-label"
							x={fx - 8}
							y={L.bottom - 8}
							textAnchor="end"
							className="wt-small"
						>
							{t(copy.shortZone)}
						</text>
						<text
							data-f="zone-long-label"
							x={fx + 8}
							y={L.bottom - 8}
							className="wt-small"
						>
							{t(copy.longZone)}
						</text>
						{[-1_000_000, 0, 1_000_000].map((tick) => (
							<g key={tick}>
								<path
									d={`M${L.left} ${L.y(tick)}H${L.right}`}
									className={tick === 0 ? "wt-axis" : "wt-grid"}
								/>
								<text
									x={L.left - 8}
									y={L.y(tick) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{tick === 0
										? "0"
										: narrow
											? money(tick).replace("$", "").replace(".00", "")
											: money(tick).replace(".00", "")}
								</text>
							</g>
						))}
						{[90, 95, 100, 105, 110].map((tick) => (
							<text
								key={tick}
								x={L.x(tick)}
								y={L.bottom + 16}
								textAnchor="middle"
								className="wt-small"
							>
								{`$${tick}`}
							</text>
						))}
						<text
							x={L.right}
							y={L.bottom + 30}
							textAnchor="end"
							className="wt-small"
						>
							{t(copy.priceAxis)}
						</text>
						<text x={L.left} y={L.top - 10} className="wt-small">
							{t(copy.axis)}
						</text>
						<g clipPath={`url(#draw-${id})`}>
							<path
								className="wt-line-position"
								d={L.path(curve)}
								strokeDasharray="5 4"
							/>
						</g>
						<circle
							data-f="flip-seeker"
							cx={ax}
							cy={ay}
							r={6}
							className="wt-chip"
						/>
						<g data-f="flip">
							<path
								d={`M${fx} ${L.top}V${L.bottom}`}
								className="wt-bracket"
								strokeDasharray="4 3"
							/>
							<circle cx={fx} cy={L.y(0)} r={6} className="wt-chip" />
						</g>
						<circle
							data-f="marker"
							cx={mx}
							cy={my}
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
						{/* Each response sits in its own regime: buy above-left, sell below-right. */}
						<g data-f="buy" textAnchor="end">
							<text x={mx - 12} y={my - 24} className="wt-halo wt-marker-label">
								{!narrow && <tspan className={toneClass.up}>+$1</tspan>}
								{narrow ? t(copy.buyShort) : t(copy.buy).slice(3)}
							</text>
							<text x={mx - 12} y={my - 10} className="wt-halo wt-small">
								{t(copy.withMove)}
							</text>
						</g>
						<g data-f="sell" textAnchor={narrow ? "end" : "start"}>
							<text
								x={narrow ? L.right - 4 : ax + 10}
								y={ay + 22}
								className="wt-halo wt-marker-label"
							>
								{!narrow && <tspan className={toneClass.up}>+$1</tspan>}
								{narrow ? t(copy.sellShort) : t(copy.sell).slice(3)}
							</text>
							<text
								x={narrow ? L.right - 4 : ax + 10}
								y={ay + 36}
								className="wt-halo wt-small"
							>
								{t(copy.againstMove)}
							</text>
						</g>
					</g>
					<g data-f="sum-chart">
						<text x={L.left} y={L.sumTop - 10} className="wt-small">
							{t(copy.sumAxis)}
						</text>
						<path
							d={`M${L.left} ${L.sumY(0)}H${L.sumRight}`}
							className="wt-axis"
						/>
						<text
							x={L.left - 8}
							y={L.sumY(0) + 4}
							textAnchor="end"
							className="wt-small"
						>
							0
						</text>
						{[90, 95].map((tick) => (
							<text
								key={tick}
								x={L.sumX(tick)}
								y={L.sumBottom + 16}
								textAnchor="middle"
								className="wt-small"
							>{`$${tick}`}</text>
						))}
						<text
							x={L.sumRight}
							y={L.sumBottom + 30}
							textAnchor="end"
							className="wt-small"
						>
							{t(copy.strikeAxis)}
						</text>
						<g clipPath={`url(#sum-draw-${id})`}>
							<path
								data-f="sum-line"
								className="wt-line-reference"
								d={`M${L.sumX(sumBefore[0])} ${L.sumY(sumBefore[1])}L${L.sumX(sumAfter[0])} ${L.sumY(sumAfter[1])}`}
							/>
						</g>
						<g data-f="sum-operands">
							<path
								d={`M${L.sumX(sumBefore[0])} ${L.sumY(sumBefore[1])}H${L.sumX(sumAfter[0])}`}
								className="wt-line-reference"
								style={{ strokeWidth: 1, opacity: 0.45 }}
							/>
							<circle
								cx={L.sumX(sumBefore[0])}
								cy={L.sumY(sumBefore[1])}
								r={4}
								fill="var(--diagram-gain)"
							/>
							<Word
								name="sum-subtotal"
								x={L.right}
								y={L.sumOperandY}
								size={T.body}
								anchor="end"
								className="wt-film-num"
							>{`Σ ≥$${sumBefore[0]}: ${money(sumBefore[1])}`}</Word>
							<Word
								name="sum-contribution"
								x={L.right}
								y={L.sumOperandY + T.body * 1.5}
								size={T.body}
								anchor="end"
								className="wt-film-num"
							>{`$${sumAfter[0]}: ${money(sumContribution)}`}</Word>
						</g>
						<Word
							name="sum-result"
							x={L.right}
							y={L.sumOperandY + T.body * 3}
							size={T.body}
							anchor="end"
							className="wt-film-num wt-film-loss"
						>{`Σ ${money(sumAfter[1])}`}</Word>
						<path
							data-f="sum-drop"
							d={`M${L.sumX(sumAfter[0])} ${L.sumY(sumBefore[1])}V${L.sumY(sumBefore[1])}`}
							fill="none"
							stroke="var(--diagram-loss)"
							strokeWidth={4}
						/>
						<g data-f="sum-dot">
							<circle cx={sx} cy={L.sumY(0)} r={6} className="wt-film-ghost" />
							<path
								d={`M${sx} ${L.sumY(0)}v11h6`}
								className="wt-line-reference"
							/>
						</g>
					</g>
				</g>
			</g>
			<Word
				name="flip-tag"
				x={fx - 8}
				y={L.flipLabelY - 18}
				size={T.small}
				anchor="end"
				className="wt-film-tag wt-film-accent"
			>
				{t(copy.flip)}
			</Word>
			<Word
				name="flip-num"
				x={fx - 8}
				y={L.flipLabelY}
				size={T.body}
				anchor="end"
				className="wt-film-num wt-film-accent"
			>
				{level(FLIP)}
			</Word>
			<Word
				name="sum-tag"
				x={sx + 12}
				y={L.sumLabelY - T.body - 5}
				size={T.small}
				anchor="start"
				className="wt-film-tag"
			>
				{t(copy.sum)}
			</Word>
			<Word
				name="sum-num"
				x={sx + 12}
				y={L.sumLabelY}
				size={T.body}
				anchor="start"
				className="wt-film-num"
			>
				{level(SHORTCUT ?? 0)}
			</Word>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-move"
					x={W / 2}
					y={H * 0.4}
					size={T.big}
					className="wt-film-num"
				>
					{t(copy.qMove).slice(0, -3)}
					<tspan className={toneClass.up}>{t(copy.qMove).slice(-3)}</tspan>
				</Word>
				<Word
					name="q-buy"
					x={W * L.pair[0]}
					y={H * 0.62}
					size={T.title}
					className="wt-film-type"
				>
					{t(copy.qBuy)}
				</Word>
				<Word
					name="q-sell"
					x={W * L.pair[1]}
					y={H * 0.62}
					size={T.title}
					className="wt-film-type"
				>
					{t(copy.qSell)}
				</Word>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.82}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("c-head", copy.curveHead, copy.curveHeadShort)}
			{headline("s-head", copy.shortHead, copy.shortHeadShort)}
			<Lines
				name="l-head"
				text={t(narrow ? copy.longHeadShort : copy.longHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.shortHeadShort : copy.shortHead),
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
			{headline("k-head", copy.shortcutHead, copy.shortcutHeadShort)}
			<Brackets name="lock-flip" glow />
			<g data-f="two">
				{(
					[
						[
							narrow ? copy.repricedShort : copy.repriced,
							level(FLIP),
							"wt-film-accent",
						],
						[narrow ? copy.summedShort : copy.summed, level(SHORTCUT ?? 0), ""],
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
							// Both figures at one size, the longer's six characters leaving clear space
							// between them.
							size={Math.min(
								T.big * 0.85,
								(W * (L.pair[1] - L.pair[0]) * 0.7) / (6 * 0.62),
							)}
							className={`wt-film-num ${tone}`}
						>
							{num}
						</Word>
					</g>
				))}
			</g>
			<g data-f="target">
				{headline("t-head", copy.targetHead, copy.targetHeadShort)}
				{cards.map(([tag, value, note, tone], i) => (
					<g key={tag[0]}>
						<Word
							name={`t-tag-${i}`}
							x={L.margin}
							y={cardY(i)}
							size={T.small}
							anchor="start"
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`t-value-${i}`}
							x={L.margin}
							y={cardY(i) + T.num * 1.1}
							size={
								i === 0
									? Math.min(
											T.num,
											(narrow ? room : W * 0.5 - L.margin - 24) /
												(t(value).length * 0.62),
										)
									: T.num
							}
							anchor="start"
							className={`wt-film-num ${tone}`}
						>
							{t(value)}
						</Word>
						<Lines
							name={`t-note-${i}`}
							text={t(note)}
							x={narrow ? L.margin : W * 0.5}
							y={
								narrow
									? cardY(i) + T.num * 1.1 + T.body * 1.6
									: cardY(i) + T.num * 0.75
							}
							size={T.body}
							maxWidth={
								narrow
									? i === 0
										? Math.min(room, 270)
										: room
									: W * 0.5 - L.margin
							}
							anchor="start"
							className="wt-film-type wt-film-dim"
						/>
					</g>
				))}
			</g>
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
	const { tl, one, kids, show, hide } = d;
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
	const marker = one("marker");
	const lockFlip = one<SVGGraphicsElement>("lock-flip");

	d.hidden([
		one("zone-short"),
		one("zone-long"),
		one("zone-short-label"),
		one("zone-long-label"),
		one("sum-chart"),
		one("sum-line"),
		one("sum-operands"),
		one("sum-drop"),
		one("sum-result"),
		one("flip-seeker"),
		one("flip"),
		one("flip-tag"),
		one("flip-num"),
		one("sum-tag"),
		one("sum-num"),
		one("sum-dot"),
		marker,
		one("buy"),
		one("sell"),
		...kids("q"),
		...["c-head", "s-head", "l-head", "k-head"].map((name) => one(name)),
		...flat("two"),
		lockFlip,
		...flat("target"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a rise, and two possible responses ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	land(one("q-move"), 4.7);
	land(one("q-buy"), 5.3);
	land(one("q-sell"), 5.6);
	// The buy/sell question above supplies the choice; this line qualifies whose response.
	show(one("q-line"), 5.6);

	// ——— regime: the curve answers by where ALFA is ———
	tl.addLabel("regime", 9.6);
	hide(kids("q"), 9.6);
	show(one("c-head"), 9.8, "above");
	// Reveal the axes at their final scale, then let the static scaffold sit for a full second.
	tl.fromTo(
		d.depth,
		{ opacity: 0, scale: 1 },
		{ opacity: 1, scale: 1, duration: 0.3 },
		9.9,
	);
	tl.to(
		one("draw"),
		{
			attr: { width: L.right - L.left + 8 },
			duration: 0.7,
			ease: "power2.inOut",
		},
		11.2,
	);
	tl.to(
		[one("zone-short"), one("zone-long")],
		{ opacity: 1, duration: 0.6 },
		11.9,
	);
	show([one("zone-short-label"), one("zone-long-label")], 12.1, "below", 0.4);
	// At $100: short gamma, the hedge buys a rise. The zone the headline names is the focus;
	// the other stays a quiet tint, so the two regimes read apart without gain and loss colours.
	const focusZone = (on: "short" | "long", at: number) => {
		const off = on === "short" ? "long" : "short";
		tl.set(one(`zone-${on}`), { attr: { class: "wt-band-neutral" } }, at);
		tl.set(one(`zone-${off}`), { attr: { class: "wt-band-quiet" } }, at);
		tl.set(
			one(`zone-${on}-label`),
			{ attr: { class: `wt-small ${toneClass.focus}` } },
			at,
		);
		tl.set(one(`zone-${off}-label`), { attr: { class: "wt-small" } }, at);
	};
	d.swap(one("c-head"), one("s-head"), 13.4);
	focusZone("short", 13.75);
	tl.fromTo(marker, { opacity: 0 }, { opacity: 1, duration: 0.55 }, 13.9);
	show(one("buy"), 14.3, "right");
	// At $105: long gamma, it sells.
	tl.to(one("buy"), { opacity: 0.3, duration: 0.3 }, 17.2);
	const walk = { spot: SPOT };
	tl.fromTo(
		walk,
		{ spot: SPOT },
		{
			spot: ABOVE,
			immediateRender: false,
			duration: 1.2,
			ease: "power2.inOut",
			onUpdate: () =>
				gsap.set(marker, {
					attr: { cx: L.x(walk.spot), cy: L.y(valueAt(curve, walk.spot)) },
				}),
		},
		17.2,
	);
	show(one("l-head"), 17.6);
	// The marker crosses the flip near 17.8 on its way to $105: the focus moves with it.
	focusZone("long", 17.8);
	show(one("sell"), 18.5, "right");
	// The sell response settles at 19.0; leave a full second before seeking the zero.
	const seeker = one("flip-seeker");
	tl.to(marker, { opacity: 0, duration: 0.3 }, 20.0);
	tl.fromTo(seeker, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 20.0);
	const search = { spot: ABOVE };
	tl.fromTo(
		search,
		{ spot: ABOVE },
		{
			spot: flipSpot,
			duration: 0.6,
			ease: "power2.inOut",
			immediateRender: false,
			onUpdate: () =>
				gsap.set(seeker, {
					attr: { cx: L.x(search.spot), cy: L.y(valueAt(curve, search.spot)) },
				}),
		},
		20.3,
	);
	tl.to(seeker, { opacity: 0, duration: 0.3 }, 20.9);
	tl.fromTo(
		[one("flip"), one("flip-tag"), one("flip-num")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.55 },
		20.9,
	);

	// The flip settles at 21.45; leave it undisturbed for a full second before the plot clears.
	// ——— shortcut: a separate strike axis, with gamma priced at the fixed $100 spot ———
	tl.addLabel("shortcut", 22.75);
	hide([one("s-head"), one("l-head")], 22.7);
	show(one("k-head"), 23.05, "above");
	// Clear the regime chart, then let only the strike scaffold return for its proof.
	tl.to(d.depth, { opacity: 0, duration: 0.3, ease: "none" }, 22.45);
	tl.set(one("chart"), { opacity: 0 }, 22.75);
	tl.set(d.depth, { opacity: 1 }, 22.75);
	tl.fromTo(
		one("sum-chart"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3, ease: "none" },
		22.75,
	);
	// Let the strike scaffold settle before the two-step subtotal-plus-$90 proof begins.
	// The positive subtotal and negative input enter together, then the last strike is added.
	const subtotalX = L.sumX(sumBefore[0]);
	const finalX = L.sumX(sumAfter[0]);
	tl.fromTo(
		[one("sum-line"), one("sum-operands")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		24.05,
	);
	tl.fromTo(
		one("sum-drop"),
		{
			opacity: 0,
			attr: {
				d: `M${finalX} ${L.sumY(sumBefore[1])}V${L.sumY(sumBefore[1])}`,
			},
		},
		{
			opacity: 1,
			attr: {
				d: `M${finalX} ${L.sumY(sumBefore[1])}V${L.sumY(sumAfter[1])}`,
			},
			duration: 0.5,
			ease: "none",
		},
		24.05,
	);
	const additionAt = 24.05;
	const addition = { duration: 0.5, ease: "none", immediateRender: false };
	// Geometry is explicitly tweened, so a reverse seek restores every position and clip.
	tl.fromTo(
		one("sum-draw"),
		{ attr: { x: subtotalX - 4, width: L.sumRight - subtotalX + 8 } },
		{
			attr: { x: finalX - 4, width: L.sumRight - finalX + 8 },
			...addition,
		},
		additionAt,
	);
	// Reveal the exact total only once the bar has finished; there is no live counter or pen.
	tl.fromTo(
		[one("sum-result"), one("sum-dot"), one("sum-tag"), one("sum-num")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.55 },
		24.55,
	);
	// The completed sum rests 2.25 s. Clear the chart before either number's flight.
	hide(one("k-head"), 27.35);
	tl.to(
		[one("flip-tag"), one("sum-tag")],
		{ opacity: 0, duration: 0.35 },
		27.35,
	);
	// Fade in place: the untransformed numeric sources preserve their chart coordinates.
	tl.to(d.depth, { opacity: 0, duration: 0.4 }, 27.35);
	// Tags settle above the numeric flight lanes, preserving their original reading time.
	show([one("w-tag-0"), one("w-tag-1")], 27.4, "above");
	d.carry(
		one<SVGGraphicsElement>("flip-num"),
		one<SVGGraphicsElement>("w-num-0"),
		27.75,
		{ duration: 0.7, arc: "x" },
	);
	d.carry(
		one<SVGGraphicsElement>("sum-num"),
		one<SVGGraphicsElement>("w-num-1"),
		28.55,
		{ duration: 0.7, arc: "x" },
	);
	d.lock(lockFlip, 29.35, {
		around: [one("w-tag-0"), one("w-num-0")],
		pad: 10,
	});
	tl.addLabel("hero-lock", 29.35);

	// ——— target: what the model's number isn't ———
	tl.addLabel("target", 33.35);
	hide([...flat("two"), lockFlip], 33.35);
	show(one("t-head"), 33.7, "above");
	// Preserve the model's entrance and its conditions, then let it rest for a full second.
	show(one("t-tag-0"), 34.15);
	land(one("t-value-0"), 34.35);
	show(one("t-note-0"), 34.35);
	// Tape and book are evidence to compare: each note enters beside its value, together.
	[1, 2].forEach((i) => {
		show([one(`t-tag-${i}`), one(`t-note-${i}`)], 35.9);
		land(one(`t-value-${i}`), 35.9);
	});
	// Use the final 0.15 s of runtime headroom to preserve the tape note's 4.5 s reading interval.
	// The claim and end card move together, retaining their full holds.
	hide(flat("target"), 40.4);
	tl.fromTo(
		one("z-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		40.8,
	);
	show(one("z-sub"), 41.2);

	// ——— next ———
	tl.addLabel("next", 45);
	hide(kids("claim"), 45);
	d.close(45);
	return tl;
}

export const gammaRegimesFilm: Film = {
	id: "gamma-regimes",
	label: [
		"Gamma regimes, as a short film: a $1 rise and the question of whether hedgers buy or sell; the modeled book's net GEX repriced across ALFA's price, short gamma at $100 so the hedge buys 5,121 shares with the move, long gamma at $105 so it sells 5,470 against it, crossing zero at a flip of $102.3; a running sum of strike bars crossing at $94.1 instead; and what the hedge target isn't: the tape shows no names and the visible book holds 1,600 shares",
		"Gamma 状态短片：上涨 $1，对冲者会买还是卖；模型账户沿 ALFA 价格重新定价的净 GEX，在 $100 为空 Gamma，对冲顺着变动买入 5,121 股，在 $105 为多 Gamma，逆着变动卖出 5,470 股，在 $102.3 的转折点穿过零；按行权价累加的柱子却在 $94.1 穿零；以及对冲目标不是什么：成交记录不显示身份，可见挂单只有 1,600 股",
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Gamma regimes", "Gamma 状态"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "regime", label: ["Two regimes", "两种状态"] },
		{ id: "shortcut", label: ["The shortcut", "捷径"] },
		{ id: "target", label: ["Not an outcome", "不是结果"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
