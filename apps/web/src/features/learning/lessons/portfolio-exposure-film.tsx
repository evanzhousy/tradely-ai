import { gsap } from "gsap";
import { useId } from "react";
import {
	type Copy,
	count,
	pick,
	signedCount,
	signedUsd,
	yourAccount,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import type { Film, FilmContext } from "../walkthrough/film";
import {
	Backdrop,
	createDirector,
	EndCard,
	filmFrame,
	Hatch,
	Lines,
	lineCount,
	TitleCard,
	Word,
} from "../walkthrough/film-kit";
import {
	CALL,
	CALL_DELTA,
	CALL_VEGA,
	CALLS,
	FRIDAY_SPOT,
	fixed3,
	GAMMA,
	HEDGE,
	hedgedPnl,
	PUT,
	PUT_DELTA,
	PUT_DELTA_FRIDAY,
	PUT_FRIDAY,
	PUT_STRIKE,
	PUT_VEGA,
	PUT_VEGA_PER_UNIT,
	PUTS,
	RAW_SUM,
	round3,
	SPOT,
	STOCK_DELTA,
	SUBTOTAL,
	THETA,
	TOTAL,
	UP,
	UP_DELTA,
	UP_PNL,
	VEGA,
	VEGA_TOTAL,
	WEEK,
	WEEK_PNL,
	wholeUsd,
} from "./portfolio-exposure-model";

/*
 * Portfolio Greeks, as a film. It opens on a delta of +1,006 shares and a hedge that looks
 * done. The book in rows: 100 shares, 16 calls, and 5 puts in a second account whose Greeks
 * haven't arrived, so +1,006 is a covered subtotal; the puts report −130 and the total is
 * +876. Short 876 shares and delta is zero, yet a $5 jump makes +$875 and a quiet week costs
 * −$964. Last, two brokers' feeds: a vega per 1.00 of volatility, 100 times the per-point
 * figure, and a put delta stamped Friday.
 *
 *   open      0–4      "Portfolio Greeks"
 *   question  4–9.5    +1,006 shares: hedged?
 *   holdings  9.5–21.5 stock, calls, puts missing: +1,006 subtotal; puts −130: +876;
 *                       cut: +1,006 against +876
 *   hedge     21.5–33.5 delta 0 at $101.20; +$5: +$875; a quiet week: −$964;
 *                       cut: zero delta is not zero risk
 *   feeds     33.5–45  0.118 + 9.70; ÷ 100: 0.097; Friday's put delta;
 *                       cut: "One unit, one time, nothing missing."
 *   next      45–47.5  Next: the module checkpoint
 */

const END = 47.5;
const PNL_X = [95, 107] as const;
const PNL_Y = [-1_500, 2_000] as const;
const LABEL_SPOT = 106.4;
const spots = Array.from({ length: 49 }, (_, i) => PNL_X[0] + i * 0.25);
const today = spots.map((spot) => [spot, hedgedPnl(spot, 0)] as const);
const weekOn = spots.map((spot) => [spot, hedgedPnl(spot, WEEK)] as const);

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow, margin } = frame;
	const left = Math.max(margin, narrow ? 46 : 0);
	const right = width * 0.965;
	const top = height * (narrow ? 0.38 : 0.3);
	const bottom = height * 0.84;
	const px = (spot: number) =>
		left + ((spot - PNL_X[0]) / (PNL_X[1] - PNL_X[0])) * (right - left);
	const py = (dollars: number) =>
		bottom - ((dollars - PNL_Y[0]) / (PNL_Y[1] - PNL_Y[0])) * (bottom - top);
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		px,
		py,
		path: (points: readonly (readonly [number, number])[]) =>
			points
				.map(
					([x, y], i) =>
						`${i ? "L" : "M"}${px(x).toFixed(1)} ${py(y).toFixed(1)}`,
				)
				.join(""),
		/** The holdings' rows: a label, the delta per share, the delta in shares. */
		rowY: (i: number) =>
			height * (narrow ? 0.36 : 0.32) + i * height * (narrow ? 0.12 : 0.115),
		perX: width * (narrow ? 0.62 : 0.66),
		sharesX: narrow ? width - margin * 0.5 : width * 0.86,
		/** The feeds' rows: a label with its unit and time below, the value on the right. */
		feedY: (i: number) =>
			height * (narrow ? 0.3 : 0.32) + i * height * (narrow ? 0.2 : 0.17),
		columns: [0.2, 0.5, 0.8],
		pair: narrow ? [0.27, 0.73] : [0.32, 0.68],
	};
}

const copy = {
	title: ["Portfolio Greeks", "组合希腊值"],
	titleSub: ["adding up exposure", "汇总敞口"],
	qTag: [
		"Portfolio delta, shares · Monday's close",
		"组合 Delta（股） · 周一收盘",
	],
	qLine: [
		`Short ${count(SUBTOTAL)} shares and you're hedged. Or are you?`,
		`做空 ${count(SUBTOTAL)} 股就对冲好了。真的吗？`,
	],
	bookHead: [
		`Your book at Monday's close, ALFA $${SPOT.toFixed(2)}.`,
		`你在周一收盘的持仓，ALFA $${SPOT.toFixed(2)}。`,
	],
	bookHeadShort: [
		`Your book, ALFA $${SPOT.toFixed(2)}.`,
		`你的持仓，ALFA $${SPOT.toFixed(2)}。`,
	],
	missingHead: [
		`The puts haven't reported: ${signedCount(SUBTOTAL)} is a subtotal.`,
		`看跌还没报送：${signedCount(SUBTOTAL)} 只是小计。`,
	],
	missingHeadShort: [
		`${signedCount(SUBTOTAL)} is a subtotal.`,
		`${signedCount(SUBTOTAL)} 只是小计。`,
	],
	reportHead: [
		`The puts report ${signedCount(PUT_DELTA)}: the total is ${signedCount(TOTAL)}.`,
		`看跌报送 ${signedCount(PUT_DELTA)}：合计 ${signedCount(TOTAL)}。`,
	],
	reportHeadShort: [
		`Puts ${signedCount(PUT_DELTA)}: total ${signedCount(TOTAL)}.`,
		`看跌 ${signedCount(PUT_DELTA)}：合计 ${signedCount(TOTAL)}。`,
	],
	perShare: ["per share", "每股"],
	sharesTag: ["shares", "股"],
	stock: [`${yourAccount.shares} ALFA shares`, `${yourAccount.shares} 股 ALFA`],
	stockShort: [`${yourAccount.shares} ALFA`, `${yourAccount.shares} 股`],
	calls: [`${CALLS} Oct 18 100 calls`, `${CALLS} 张 10月18日 100 看涨`],
	callsShort: [`${CALLS} calls`, `${CALLS} 张看涨`],
	puts: [
		`${PUTS} Oct 18 ${PUT_STRIKE} puts, 2nd account`,
		`${PUTS} 张 10月18日 ${PUT_STRIKE} 看跌，第二账户`,
	],
	putsShort: [`${PUTS} puts`, `${PUTS} 张看跌`],
	missing: ["missing", "缺失"],
	subtotal: ["covered subtotal, 2 of 3", "已覆盖小计，3 项中 2 项"],
	subtotalShort: ["subtotal", "小计"],
	total: ["portfolio delta", "组合 Delta"],
	totalShort: ["total", "合计"],
	subtotalTag: ["subtotal", "小计"],
	totalTag: ["total", "合计"],
	pairLine: [
		`Missing is unknown, not zero: hedging ${signedCount(SUBTOTAL)} would leave you short ${count(SUBTOTAL - TOTAL)} shares.`,
		`缺失是未知，不是零：按 ${signedCount(SUBTOTAL)} 对冲会让你净空 ${count(SUBTOTAL - TOTAL)} 股。`,
	],
	hedgeHead: [
		`Short ${count(HEDGE)} shares: delta is zero at $${SPOT.toFixed(2)}.`,
		`做空 ${count(HEDGE)} 股：在 $${SPOT.toFixed(2)} 处 Delta 为零。`,
	],
	hedgeHeadShort: [
		`Short ${count(HEDGE)}: delta zero.`,
		`做空 ${count(HEDGE)} 股：Delta 为零。`,
	],
	jumpHead: [
		`ALFA +$${UP} at once: ${wholeUsd(UP_PNL)}, and delta is back to ${signedCount(UP_DELTA)}.`,
		`ALFA 立即 +$${UP}：${wholeUsd(UP_PNL)}，Delta 回到 ${signedCount(UP_DELTA)}。`,
	],
	jumpHeadShort: [
		`ALFA +$${UP}: ${wholeUsd(UP_PNL)}.`,
		`ALFA +$${UP}：${wholeUsd(UP_PNL)}。`,
	],
	weekHead: [
		`A quiet week instead: ${wholeUsd(WEEK_PNL)}, with the price unchanged.`,
		`换成平静的一周：${wholeUsd(WEEK_PNL)}，价格没动。`,
	],
	weekHeadShort: [
		`A quiet week: ${wholeUsd(WEEK_PNL)}.`,
		`平静的一周：${wholeUsd(WEEK_PNL)}。`,
	],
	pnlAxis: [
		`hedged book · P&L from Monday's close`,
		"对冲后的账户 · 自周一收盘的盈亏",
	],
	pnlAxisShort: ["hedged book", "对冲后的账户"],
	todayLabel: ["today", "今天"],
	weekLabel: ["a week on", "一周后"],
	meter: ["hedged P&L", "对冲后盈亏"],
	riskBig: ["Zero delta is not zero risk.", "Delta 为零，不等于没有风险。"],
	gamma: ["gamma", "Gamma"],
	gammaValue: [signedCount(Math.round(GAMMA)), signedCount(Math.round(GAMMA))],
	gammaUnit: ["shares per $1", "股 / 每 $1"],
	theta: ["theta", "Theta"],
	thetaValue: [wholeUsd(THETA), wholeUsd(THETA)],
	thetaUnit: ["a day", "每天"],
	vega: ["vega", "Vega"],
	vegaValue: [wholeUsd(VEGA), wholeUsd(VEGA)],
	vegaUnit: ["per vol point", "每个波动率点"],
	feedHead: ["Two brokers' Greeks, as sent.", "两家券商发来的希腊值，原样。"],
	rawHead: [
		`Added as sent, ${CALL_VEGA.toFixed(3)} + ${PUT_VEGA_PER_UNIT.toFixed(2)} = ${RAW_SUM}: two units, meaningless.`,
		`按原样相加，${CALL_VEGA.toFixed(3)} + ${PUT_VEGA_PER_UNIT.toFixed(2)} = ${RAW_SUM}：两种单位，没有意义。`,
	],
	rawHeadShort: ["Added as sent: meaningless.", "原样相加：没有意义。"],
	convertHead: [
		`÷ 100: ${PUT_VEGA.toFixed(3)} per point. The book's vega: ${signedUsd(VEGA_TOTAL * 100, 0)} per vol point.`,
		`÷ 100：每点 ${PUT_VEGA.toFixed(3)}。账户 Vega：每个波动率点 ${signedUsd(VEGA_TOTAL * 100, 0)}。`,
	],
	convertHeadShort: [
		`÷ 100: ${PUT_VEGA.toFixed(3)} per point.`,
		`÷ 100：每点 ${PUT_VEGA.toFixed(3)}。`,
	],
	staleHead: [
		`The put delta is Friday's: ${signedCount(PUT_DELTA_FRIDAY)} shares, not Monday's ${signedCount(PUT_DELTA)}.`,
		`看跌 Delta 是周五的：${signedCount(PUT_DELTA_FRIDAY)} 股，而不是周一的 ${signedCount(PUT_DELTA)}。`,
	],
	staleHeadShort: [`The put delta is Friday's.`, "看跌 Delta 是周五的。"],
	callVega: ["Call vega · main broker", "看涨 Vega · 主券商"],
	putVega: ["Put vega · 2nd broker", "看跌 Vega · 第二券商"],
	putDelta: ["Put delta · 2nd broker", "看跌 Delta · 第二券商"],
	perPoint: ["per vol point · Mon 16:00", "每个波动率点 · 周一 16:00"],
	perUnit: ["per 1.00 of vol · Mon 16:00", "每 1.00 波动率 · 周一 16:00"],
	perShareFriday: [
		`per share · Fri 16:00, ALFA $${FRIDAY_SPOT.toFixed(2)}`,
		`每股 · 周五 16:00，ALFA $${FRIDAY_SPOT.toFixed(2)}`,
	],
	claimBig: [
		"One unit, one time, nothing missing.",
		"同一单位，同一时点，没有缺失。",
	],
	claimSub: [
		"A missing or stale Greek is unknown, not zero and not current.",
		"缺失或过时的希腊值是未知，不是零，也不是当前值。",
	],
	nextBig: ["Next: the module checkpoint", "下一步：本模块检查点"],
	nextSub: [
		"portfolio understanding, on a new day",
		"在新的一天里运用对投资组合的理解",
	],
} as const satisfies Record<string, Copy>;

const holdings = [
	{
		key: "stock",
		label: copy.stock,
		short: copy.stockShort,
		per: fixed3(1),
		shares: STOCK_DELTA,
	},
	{
		key: "calls",
		label: copy.calls,
		short: copy.callsShort,
		per: fixed3(round3(CALL.delta)),
		shares: CALL_DELTA,
	},
	{
		key: "puts",
		label: copy.puts,
		short: copy.putsShort,
		per: fixed3(round3(PUT.delta)),
		shares: PUT_DELTA,
	},
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
	const figure = narrow ? T.body * 1.2 : T.head;
	const labelSize = narrow ? T.body : T.head * 0.8;
	const putsY = L.rowY(2);
	const sumY = L.rowY(3) + T.head * 0.4;
	const greeks = [
		[copy.gamma, copy.gammaValue, copy.gammaUnit, "wt-film-gain"],
		[copy.theta, copy.thetaValue, copy.thetaUnit, "wt-film-loss"],
		[copy.vega, copy.vegaValue, copy.vegaUnit, "wt-film-accent"],
	] as const;
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<Hatch id={`hatch-${id}`} />
			</defs>

			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart">
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(narrow ? copy.pnlAxisShort : copy.pnlAxis)}
						</text>
						{[-1_000, 0, 1_000].map((tick) => (
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
									{tick === 0
										? "$0"
										: narrow
											? `${tick < 0 ? "−" : "+"}$${Math.abs(tick) / 1000}k`
											: signedUsd(tick * 100, 0)}
								</text>
							</g>
						))}
						{[95, 98, 101, 104, 107].map((tick) => (
							<text
								key={tick}
								x={L.px(tick)}
								y={L.bottom + 16}
								textAnchor={tick === 107 ? "end" : "middle"}
								className="wt-small"
							>
								{`$${tick}`}
							</text>
						))}
						<path
							data-f="curve-today"
							d={L.path(today)}
							className="wt-line-position"
						/>
						<path
							data-f="curve-week"
							d={L.path(weekOn)}
							className="wt-line-short"
						/>
						<text
							data-f="today-label"
							x={L.px(LABEL_SPOT)}
							y={L.py(hedgedPnl(LABEL_SPOT, 0)) - 10}
							textAnchor="end"
							className="wt-small wt-halo wt-accent"
						>
							{t(copy.todayLabel)}
						</text>
						<text
							data-f="week-label"
							x={L.px(SPOT - 0.7)}
							y={L.py(WEEK_PNL) + 20}
							textAnchor="end"
							className="wt-small wt-halo"
							style={{ fill: "var(--wt-short)" }}
						>
							{t(copy.weekLabel)}
						</text>
						<circle
							data-f="marker"
							cx={L.px(SPOT)}
							cy={L.py(0)}
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
					</g>
				</g>
			</g>
			<g data-f="meter">
				<Word
					name="m-tag"
					x={L.right}
					y={L.headY + T.head * 1.25}
					size={T.small}
					anchor="end"
					className="wt-film-tag"
				>
					{t(copy.meter).toUpperCase()}
				</Word>
				<Word
					name="m-value"
					x={L.right}
					y={L.headY + T.head * 1.25 + T.num * 1.05}
					size={T.num}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					$0
				</Word>
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
					name="q-big"
					x={W / 2}
					y={H * 0.3 + T.big * 1.05}
					size={T.big}
					className="wt-film-num wt-film-accent"
				>
					{signedCount(SUBTOTAL)}
				</Word>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.76}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("b-head", copy.bookHead, copy.bookHeadShort)}
			{headline("m-head", copy.missingHead, copy.missingHeadShort)}
			{headline("r-head", copy.reportHead, copy.reportHeadShort)}
			<g data-f="book">
				<Word
					name="col-per"
					x={L.perX}
					y={L.rowY(0) - T.head * 1.3}
					size={T.small}
					anchor="end"
					className="wt-film-tag"
				>
					{t(copy.perShare).toUpperCase()}
				</Word>
				<Word
					name="col-shares"
					x={L.sharesX}
					y={L.rowY(0) - T.head * 1.3}
					size={T.small}
					anchor="end"
					className="wt-film-tag"
				>
					{t(copy.sharesTag).toUpperCase()}
				</Word>
				{holdings.map((row, i) => (
					<g key={row.key}>
						<Word
							name={`h-label-${row.key}`}
							x={L.margin}
							y={L.rowY(i)}
							size={labelSize}
							anchor="start"
							className="wt-film-type wt-film-dim"
						>
							{t(narrow ? row.short : row.label)}
						</Word>
						<Word
							name={`h-per-${row.key}`}
							x={L.perX}
							y={L.rowY(i)}
							size={figure}
							anchor="end"
							className="wt-film-num"
						>
							{row.per}
						</Word>
						<Word
							name={`h-shares-${row.key}`}
							x={L.sharesX}
							y={L.rowY(i)}
							size={figure}
							anchor="end"
							className="wt-film-num"
						>
							{signedCount(row.shares)}
						</Word>
					</g>
				))}
				<g data-f="h-missing">
					<rect
						x={L.perX - figure * 4}
						y={putsY - figure * 1.05}
						width={L.sharesX - (L.perX - figure * 4)}
						height={figure * 1.45}
						rx={6}
						fill={`url(#hatch-${id})`}
					/>
					<text
						x={L.sharesX}
						y={putsY}
						textAnchor="end"
						className="wt-film-num wt-film-accent wt-halo"
						style={{ fontSize: figure }}
					>
						{t(copy.missing)}
					</text>
				</g>
				<path
					data-f="h-rule"
					d={`M${L.margin} ${sumY - figure * 1.25}H${L.sharesX}`}
					className="wt-axis"
				/>
				<Word
					name="h-sub-label"
					x={L.margin}
					y={sumY}
					size={labelSize}
					anchor="start"
					className="wt-film-type wt-film-accent"
				>
					{t(narrow ? copy.subtotalShort : copy.subtotal)}
				</Word>
				<Word
					name="h-total-label"
					x={L.margin}
					y={sumY}
					size={labelSize}
					anchor="start"
					className="wt-film-type wt-film-accent"
				>
					{t(narrow ? copy.totalShort : copy.total)}
				</Word>
				<Word
					name="h-sum"
					x={L.sharesX}
					y={sumY}
					size={figure * 1.2}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					{signedCount(SUBTOTAL)}
				</Word>
			</g>
			<g data-f="two">
				{(
					[
						[copy.subtotalTag, signedCount(SUBTOTAL), ""],
						[copy.totalTag, signedCount(TOTAL), "wt-film-accent"],
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
					text={t(copy.pairLine)}
					x={W / 2}
					y={H * 0.72}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("g-head", copy.hedgeHead, copy.hedgeHeadShort)}
			{headline("j-head", copy.jumpHead, copy.jumpHeadShort)}
			{headline("k-head", copy.weekHead, copy.weekHeadShort)}
			<g data-f="risk">
				<Lines
					name="risk-big"
					text={t(copy.riskBig)}
					x={W / 2}
					y={H * 0.3}
					size={T.title}
					maxWidth={room}
				/>
				{greeks.map(([tag, value, unit, tone], i) => (
					<g key={tag[0]}>
						<Word
							name={`k-tag-${i}`}
							x={W * L.columns[i]}
							y={H * 0.56}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`k-num-${i}`}
							x={W * L.columns[i]}
							y={H * 0.56 + T.num * 1.2}
							size={T.num}
							className={`wt-film-num ${tone}`}
						>
							{t(value)}
						</Word>
						<Word
							name={`k-unit-${i}`}
							x={W * L.columns[i]}
							y={H * 0.56 + T.num * 1.2 + T.body * 1.6}
							size={T.body}
							className="wt-film-type wt-film-dim"
						>
							{t(unit)}
						</Word>
					</g>
				))}
			</g>
			{headline("f-head", copy.feedHead, copy.feedHead)}
			{headline("x-head", copy.rawHead, copy.rawHeadShort)}
			{headline("c-head", copy.convertHead, copy.convertHeadShort)}
			{headline("s-head", copy.staleHead, copy.staleHeadShort)}
			<g data-f="feeds">
				{(
					[
						["call-vega", copy.callVega, CALL_VEGA.toFixed(3), copy.perPoint],
						[
							"put-vega",
							copy.putVega,
							PUT_VEGA_PER_UNIT.toFixed(2),
							copy.perUnit,
						],
						[
							"put-delta",
							copy.putDelta,
							fixed3(round3(PUT_FRIDAY.delta)),
							copy.perShareFriday,
						],
					] as const
				).map(([key, label, value, unit], i) => (
					<g key={key}>
						<Word
							name={`f-label-${key}`}
							x={L.margin}
							y={L.feedY(i)}
							size={labelSize}
							anchor="start"
							className="wt-film-type"
						>
							{t(label)}
						</Word>
						<Word
							name={`f-value-${key}`}
							x={L.sharesX}
							y={L.feedY(i)}
							size={figure * 1.2}
							anchor="end"
							className="wt-film-num"
						>
							{value}
						</Word>
						<Word
							name={`f-unit-${key}`}
							x={L.margin}
							y={L.feedY(i) + T.body * 1.7}
							size={T.body}
							anchor="start"
							className="wt-film-type wt-film-dim"
						>
							{t(unit)}
						</Word>
					</g>
				))}
				<Word
					name="f-value-put-vega-point"
					x={L.sharesX}
					y={L.feedY(1)}
					size={figure * 1.2}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					{PUT_VEGA.toFixed(3)}
				</Word>
				<Word
					name="f-unit-put-vega-point"
					x={L.margin}
					y={L.feedY(1) + T.body * 1.7}
					size={T.body}
					anchor="start"
					className="wt-film-type wt-film-accent"
				>
					{t(copy.perPoint)}
				</Word>
				<Word
					name="f-unit-put-delta-stale"
					x={L.margin}
					y={L.feedY(2) + T.body * 1.7}
					size={T.body}
					anchor="start"
					className="wt-film-type wt-film-warn"
				>
					{t(copy.perShareFriday)}
				</Word>
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
	const { tl, one, kids, show, hide, pop, slam, rise, sink } = d;
	/** A group's marks, opening unnamed row groups but keeping named ones whole. */
	const flat = (name: string) =>
		kids(name).flatMap((el) =>
			el.tagName === "g" && !el.hasAttribute("data-f")
				? [...el.children]
				: [el],
		);
	const marker = one("marker");
	const meter = one<SVGTextElement>("m-value");
	const sum = one<SVGTextElement>("h-sum");
	const draw = (path: SVGPathElement, at: number, duration: number) => {
		const length = path.getTotalLength();
		tl.fromTo(
			path,
			{ opacity: 0, strokeDasharray: length, strokeDashoffset: length },
			{ opacity: 1, strokeDashoffset: 0, duration, ease: "power2.inOut" },
			at,
		);
	};
	const word = (target: Element, at: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			at,
		);
	const usd = (value: number) =>
		Math.round(value) === 0 ? "$0" : wholeUsd(value);
	const shares = (value: number) => signedCount(Math.round(value));

	d.hidden([
		one("curve-today"),
		one("curve-week"),
		one("today-label"),
		one("week-label"),
		marker,
		...kids("meter"),
		...flat("q"),
		...[
			"b-head",
			"m-head",
			"r-head",
			"g-head",
			"j-head",
			"k-head",
			"f-head",
			"x-head",
			"c-head",
			"s-head",
		].map((name) => one(name)),
		...flat("book"),
		one("h-missing"),
		...flat("two"),
		...flat("risk"),
		...flat("feeds"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a delta that looks hedgeable ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	slam(one("q-big"), 4.8);
	show(one("q-line"), 6.4);

	// ——— holdings: a missing holding makes a subtotal ———
	tl.addLabel("holdings", 9.5);
	hide(flat("q"), 9.5);
	show(one("b-head"), 9.7, "above");
	show([one("col-per"), one("col-shares")], 10.0);
	holdings.forEach((row, i) => {
		const at = 10.4 + i * 0.5;
		show(one(`h-label-${row.key}`), at);
		if (row.key === "puts") show(one("h-missing"), at + 0.2, "right");
		else {
			show(one(`h-per-${row.key}`), at + 0.15, "right");
			show(one(`h-shares-${row.key}`), at + 0.25, "right");
		}
	});
	d.swap(one("b-head"), one("m-head"), 12.6);
	tl.to(one("h-rule"), { opacity: 1, duration: 0.4 }, 13.0);
	show(one("h-sub-label"), 13.1);
	slam(sum, 13.3);
	// The second account reports.
	d.swap(one("m-head"), one("r-head"), 15.0);
	hide(one("h-missing"), 15.4);
	show(one("h-per-puts"), 15.6, "right");
	show(one("h-shares-puts"), 15.7, "right");
	d.swap(one("h-sub-label"), one("h-total-label"), 16.0);
	d.count(sum, TOTAL, 16.1, shares, SUBTOTAL, 0.7);
	// Cut: the subtotal against the total.
	hide([one("r-head"), ...flat("book")], 17.4);
	show(one("w-tag-0"), 17.8);
	slam(one("w-num-0"), 18.0);
	show(one("w-tag-1"), 18.6);
	slam(one("w-num-1"), 18.8);
	show(one("w-line"), 19.6);

	// ——— hedge: zero delta, other sensitivities ———
	tl.addLabel("hedge", 21.5);
	hide(flat("two"), 21.5);
	show(one("g-head"), 21.7, "above");
	rise(21.8);
	draw(one<SVGPathElement>("curve-today"), 22.4, 1.2);
	pop(marker, 23.4);
	show(kids("meter"), 23.6, "above");
	d.count(meter, 0, 23.6, usd, 0, 0.01);
	d.swap(one("g-head"), one("j-head"), 24.4);
	const walk = { spot: SPOT };
	tl.to(
		walk,
		{
			spot: SPOT + UP,
			duration: 1.2,
			ease: "power2.inOut",
			onUpdate: () =>
				gsap.set(marker, {
					attr: { cx: L.px(walk.spot), cy: L.py(hedgedPnl(walk.spot, 0)) },
				}),
		},
		24.8,
	);
	d.count(meter, UP_PNL, 24.8, usd, 0, 1.2);
	show(one("today-label"), 25.6);
	// A quiet week instead.
	d.swap(one("j-head"), one("k-head"), 26.8);
	draw(one<SVGPathElement>("curve-week"), 27.2, 1.0);
	show(one("week-label"), 28.0);
	tl.to(
		marker,
		{
			attr: { cx: L.px(SPOT), cy: L.py(WEEK_PNL) },
			duration: 0.8,
			ease: "power2.inOut",
		},
		28.2,
	);
	d.count(meter, WEEK_PNL, 28.2, usd, UP_PNL, 0.8);
	// Cut: what zero delta leaves.
	hide([one("k-head"), ...kids("meter")], 29.8);
	sink(29.8);
	word(one("risk-big"), 30.2);
	[0, 1, 2].forEach((i) => {
		show(one(`k-tag-${i}`), 30.8 + i * 0.35);
		slam(one(`k-num-${i}`), 30.9 + i * 0.35);
		show(one(`k-unit-${i}`), 31.1 + i * 0.35);
	});

	// ——— feeds: units and timestamps ———
	tl.addLabel("feeds", 33.5);
	hide(flat("risk"), 33.5);
	show(one("f-head"), 33.7, "above");
	(["call-vega", "put-vega", "put-delta"] as const).forEach((key, i) => {
		const at = 34.0 + i * 0.4;
		show(one(`f-label-${key}`), at);
		show(one(`f-value-${key}`), at + 0.1, "right");
		show(one(`f-unit-${key}`), at + 0.2);
	});
	d.swap(one("f-head"), one("x-head"), 35.8);
	// Convert the puts' vega to points.
	d.swap(one("x-head"), one("c-head"), 37.8);
	d.flip(one("f-value-put-vega"), one("f-value-put-vega-point"), 38.2);
	tl.set(one("f-value-put-vega"), { opacity: 0 }, 38.5);
	d.swap(one("f-unit-put-vega"), one("f-unit-put-vega-point"), 38.2);
	// The put delta is Friday's.
	d.swap(one("c-head"), one("s-head"), 40.0);
	d.swap(one("f-unit-put-delta"), one("f-unit-put-delta-stale"), 40.4);
	tl.to(
		[one("f-label-call-vega"), one("f-label-put-vega")],
		{ opacity: 0.4, duration: 0.4 },
		40.4,
	);
	// Cut: the claim.
	hide([one("s-head"), ...flat("feeds")], 42.0);
	word(one("z-big"), 42.4);
	show(one("z-sub"), 42.9);

	// ——— next ———
	tl.addLabel("next", 45);
	hide(kids("claim"), 45.0);
	d.close(45.0);
	return tl;
}

export const portfolioExposureFilm: Film = {
	id: "portfolio-exposure",
	label: [
		`Portfolio Greeks, as a short film: a portfolio delta of ${signedCount(SUBTOTAL)} shares that looks ready to hedge; your ${yourAccount.shares} shares at ${signedCount(STOCK_DELTA)} and ${CALLS} calls at ${signedCount(CALL_DELTA)}, with the ${PUTS} puts in a second account missing, so ${signedCount(SUBTOTAL)} is a covered subtotal; the puts reporting ${signedCount(PUT_DELTA)} for a total of ${signedCount(TOTAL)}; the book hedged to zero delta still making ${wholeUsd(UP_PNL)} on a $${UP} jump and losing ${wholeUsd(WEEK_PNL)} in a quiet week; and two brokers' feeds, one vega per 1.00 of volatility and one put delta from Friday`,
		`组合希腊值短片：一个看上去可以直接对冲的组合 Delta，${signedCount(SUBTOTAL)} 股；你的 ${yourAccount.shares} 股带来 ${signedCount(STOCK_DELTA)}，${CALLS} 张看涨带来 ${signedCount(CALL_DELTA)}，第二账户里的 ${PUTS} 张看跌缺失，所以 ${signedCount(SUBTOTAL)} 只是已覆盖小计；看跌报送 ${signedCount(PUT_DELTA)}，合计 ${signedCount(TOTAL)}；对冲到 Delta 为零的账户在跳涨 $${UP} 时仍赚 ${wholeUsd(UP_PNL)}，平静一周亏 ${wholeUsd(WEEK_PNL)}；以及两家券商的数据：一个按每 1.00 波动率报的 Vega，一个周五的看跌 Delta`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Portfolio Greeks", "组合希腊值"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "holdings", label: ["A subtotal", "小计"] },
		{ id: "hedge", label: ["Zero delta", "Delta 为零"] },
		{ id: "feeds", label: ["Units and times", "单位与时点"] },
		{ id: "next", label: ["Next", "下一步"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
