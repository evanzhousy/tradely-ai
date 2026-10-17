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
 *   regime    9.6–22.7   net GEX across spot; at $100 buy 5,121; at $105 sell 5,470; flip
 *                        $102.3
 *   shortcut  22.7–33.35 a fixed-spot subtotal plus the final strike contribution; carry
 *                        $102.3 against $94.1, the flip locked
 *   target    33.35–44.85  buy 5,121 if…; the tape; the book: 1,600 offered;
 *                        cut: "A regime describes a response, not a forecast."
 *   next      44.85–47.35  Next: walls and max pain
 */

const END = 47.35;
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
	const top = height * (narrow ? 0.26 : 0.27);
	const bottom = height * (narrow ? 0.64 : 0.62);
	const sumTop = height * 0.76;
	const sumBottom = height * 0.9;
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
	// Leave the raised phone chart's label below the hero tag's eventual flight lane.
	const flipLabelY = narrow
		? Math.max(top + 34, y(0) - frame.type.body * 2.5)
		: top + 34;
	const sumLabelY = sumY(0) + frame.type.body + 26;
	const sumOperandY = sumTop + frame.type.body * 0.5;
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
		"Do the hedgers of the modeled book buy or sell? It depends where ALFA is.",
		"模型账户的对冲者会买还是卖？取决于 ALFA 在哪里。",
	],
	curveHead: [
		"Net GEX, repriced at every ALFA price.",
		"在每个 ALFA 价格上重新定价的净 GEX。",
	],
	curveHeadShort: ["Net GEX, repriced across spot.", "沿现价重定价的净 GEX。"],
	axis: ["modeled book, $ of delta per 1%", "模型账户，每 1% 的 Delta 金额"],
	priceAxis: ["ALFA price", "ALFA 价格"],
	shortZone: ["short gamma", "空 Gamma"],
	longZone: ["long gamma", "多 Gamma"],
	shortHead: [
		`At ${stock(SPOT)}: short gamma, the hedge buys.`,
		`在 ${stock(SPOT)} 是空 Gamma：上涨时对冲买入。`,
	],
	shortHeadShort: [
		"Short gamma: the hedge buys a rise.",
		"空 Gamma：上涨时买入。",
	],
	longHead: [
		`At ${stock(ABOVE)}: long gamma, the hedge sells.`,
		`在 ${stock(ABOVE)} 是多 Gamma：同样的上涨让它卖出。`,
	],
	longHeadShort: [
		"Long gamma: the hedge sells a rise.",
		"多 Gamma：上涨时卖出。",
	],
	buy: [`+$1 → buy ${count(-BOOK)}`, `+$1 → 买入 ${count(-BOOK)}`],
	sell: [`+$1 → sell ${count(SELL)}`, `+$1 → 卖出 ${count(SELL)}`],
	buyShort: [`buy ${count(-BOOK)}`, `买入 ${count(-BOOK)}`],
	sellShort: [`sell ${count(SELL)}`, `卖出 ${count(SELL)}`],
	withMove: ["with the move", "顺着变动"],
	againstMove: ["against the move", "逆着变动"],
	flip: ["flip", "转折"],
	sumAxis: ["Strike sum · ALFA fixed at $100", "行权价累加 · ALFA 固定 $100"],
	strikeAxis: ["strike", "行权价"],
	sum: ["zero", "穿零"],
	shortcutHead: [
		"Sum strike bars at a fixed spot.",
		"固定现价，按行权价累加。",
	],
	shortcutHeadShort: [
		"Sum strikes at ALFA $100.",
		"ALFA 固定 $100，按行权价累加。",
	],
	repriced: ["repriced across spot", "沿现价重定价"],
	repricedShort: ["repriced", "重定价"],
	summed: ["summed across strikes", "按行权价累加"],
	summedShort: ["strike sum", "行权价累加"],
	twoLine: [
		"Two calculations, two answers. Only the repriced one is the flip.",
		"两种计算，两个答案。只有重定价得到的才是转折点。",
	],
	targetHead: [
		"A hedge target is not a market outcome.",
		"对冲目标不是市场结果。",
	],
	targetHeadShort: ["A target is not an outcome.", "目标不是结果。"],
	cardModel: ["model target", "模型目标"],
	cardModelValue: [`buy ${count(TARGET)} shares`, `买入 ${count(TARGET)} 股`],
	cardModelNote: [
		"at $100, for a +$1 rise; only if dealers hold this book and hedge continuously",
		"在 $100，上涨 $1；须做市商持有此账户且连续对冲",
	],
	cardModelShort: [
		"at $100, +$1 rise; if dealers hold this book and hedge nonstop",
		"在 $100，上涨 $1；须做市商持有此账户且连续对冲",
	],
	cardTape: ["the tape", "成交记录"],
	cardTapeValue: ["no names", "无身份"],
	cardTapeNote: [
		"prints show price, size and time, never who traded or why",
		"成交显示价格、数量和时间，不显示谁交易或为什么",
	],
	cardTapeShort: [
		"price, size, time; never who or why",
		"价格、数量、时间；不显示谁或为何",
	],
	cardBook: ["the book, 10:30", "10:30 挂单簿"],
	cardBookValue: [`${count(offered)} offered`, `挂出 ${count(offered)} 股`],
	cardBookNote: [
		`across three levels to ${stock(lastAsk.price / 100)}; depth beyond isn't shown`,
		`三个价位，最高 ${stock(lastAsk.price / 100)}；更深的挂单看不到`,
	],
	cardBookShort: [
		"three levels; depth beyond isn't shown",
		"三个价位；更深的挂单未显示",
	],
	claimBig: [
		"A regime describes a response, not a forecast.",
		"状态描述的是响应，不是预测。",
	],
	claimSub: [
		"A modeled flip; hedging depends on who holds what.",
		"转折点是模型得出的；对冲取决于谁持有什么。",
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
								className="wt-film-num wt-film-gain"
							>{`Σ ≥$${sumBefore[0]}: ${money(sumBefore[1])}`}</Word>
							<Word
								name="sum-contribution"
								x={L.right}
								y={L.sumOperandY + T.body * 1.5}
								size={T.body}
								anchor="end"
								className="wt-film-num wt-film-loss"
							>{`$${sumAfter[0]}: ${money(sumContribution)}`}</Word>
							<Word
								name="sum-running"
								x={L.right}
								y={L.sumOperandY + T.body * 3}
								size={T.body}
								anchor="end"
								className="wt-film-num wt-film-gain"
							>{`Σ ${money(sumBefore[1])}`}</Word>
						</g>
						<path
							data-f="sum-drop"
							d={`M${L.sumX(sumAfter[0])} ${L.sumY(sumBefore[1])}V${L.sumY(sumBefore[1])}`}
							fill="none"
							stroke="var(--diagram-loss)"
							strokeWidth={4}
						/>
						<circle
							data-f="sum-pen"
							cx={L.sumX(sumBefore[0])}
							cy={L.sumY(sumBefore[1])}
							r={4}
							className="wt-film-ghost"
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
	const { tl, one, kids, show, hide, rise } = d;
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
		one("sum-pen"),
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
	show(one("q-line"), 6.0);

	// ——— regime: the curve answers by where ALFA is ———
	tl.addLabel("regime", 9.6);
	hide(kids("q"), 9.6);
	show(one("c-head"), 9.8, "above");
	rise(9.9);
	tl.to(
		one("draw"),
		{
			attr: { width: L.right - L.left + 8 },
			duration: 1.6,
			ease: "power2.inOut",
		},
		10.3,
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

	// The flip settles at 21.45; preserve its original 1.25 s quiet before the shortcut.
	// ——— shortcut: a separate strike axis, with gamma priced at the fixed $100 spot ———
	tl.addLabel("shortcut", 22.7);
	hide([one("s-head"), one("l-head")], 22.7);
	show(one("k-head"), 23.05, "above");
	tl.to([one("buy"), one("sell")], { opacity: 0, duration: 0.3 }, 22.7);
	tl.fromTo(
		one("sum-chart"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		22.7,
	);
	// Keep the existing 23.05–25.10 construction, but explain the decisive addition.
	// The positive subtotal and negative input enter together, then the last strike is added.
	const subtotalX = L.sumX(sumBefore[0]);
	const finalX = L.sumX(sumAfter[0]);
	const sumPen = one<SVGCircleElement>("sum-pen");
	const running = one<SVGTextElement>("sum-running");
	const accumulation = { step: sumSteps.length - 2 };
	tl.fromTo(
		[one("sum-line"), one("sum-operands")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.6 },
		23.05,
	);
	tl.fromTo(
		[sumPen, one("sum-drop")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		23.05,
	);
	const additionAt = 23.55;
	const addition = { duration: 1, ease: "none", immediateRender: false };
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
	tl.fromTo(
		one("sum-drop"),
		{
			attr: { d: `M${finalX} ${L.sumY(sumBefore[1])}V${L.sumY(sumBefore[1])}` },
		},
		{
			attr: { d: `M${finalX} ${L.sumY(sumBefore[1])}V${L.sumY(sumAfter[1])}` },
			...addition,
		},
		additionAt,
	);
	// The pen's actual position drives accumulation.step and the readout, never a second count.
	tl.fromTo(
		sumPen,
		{ attr: { cx: subtotalX, cy: L.sumY(sumBefore[1]) } },
		{
			attr: { cx: finalX, cy: L.sumY(sumAfter[1]) },
			...addition,
			onUpdate: () => {
				const mix =
					(subtotalX - Number(sumPen.getAttribute("cx"))) /
					(subtotalX - finalX);
				accumulation.step = sumSteps.length - 2 + mix;
				const value =
					sumBefore[1] +
					sumContribution * (accumulation.step - (sumSteps.length - 2));
				running.textContent = `Σ ${money(value)}`;
			},
		},
		additionAt,
	);
	// A timeline-owned class change restores the correct sign colour when scrubbing back.
	tl.set(running, { attr: { class: "wt-film-num wt-film-gain" } }, 23.05);
	tl.set(
		running,
		{ attr: { class: "wt-film-num wt-film-loss" } },
		additionAt + addition.duration * (sumBefore[1] / -sumContribution),
	);

	tl.to(one("sum-pen"), { opacity: 0, duration: 0.3 }, 24.55);
	tl.fromTo(
		[one("sum-dot"), one("sum-tag"), one("sum-num")],
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
	show(one("w-line"), 29.75);

	// ——— target: what the model's number isn't ———
	tl.addLabel("target", 33.35);
	hide([...flat("two"), lockFlip], 33.35);
	show(one("t-head"), 33.7, "above");
	[0, 1, 2].forEach((i) => {
		const at = 34.15 + i * 1.0;
		show(one(`t-tag-${i}`), at);
		land(one(`t-value-${i}`), at + 0.2);
		// The returning target and its $100 / +$1 conditions arrive together.
		show(one(`t-note-${i}`), at + (i === 0 ? 0.2 : 0.6));
	});
	// Cut: the claim.
	hide(flat("target"), 40.25);
	tl.fromTo(
		one("z-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		40.65,
	);
	show(one("z-sub"), 41.05);

	// ——— next ———
	tl.addLabel("next", 44.85);
	hide(kids("claim"), 44.85);
	d.close(44.85);
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
