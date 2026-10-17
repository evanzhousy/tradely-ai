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
	Brackets,
	createDirector,
	EndCard,
	filmFrame,
	Hatch,
	Lines,
	lineCount,
	signTone,
	TitleCard,
	toneClass,
	Word,
} from "../walkthrough/film-kit";
import {
	CALL,
	CALL_DELTA,
	CALL_VEGA,
	CALLS,
	FRIDAY_SPOT,
	fixed3,
	HEDGE,
	hedgedPnl,
	PUT,
	PUT_DELTA,
	PUT_FRIDAY,
	PUT_STRIKE,
	PUT_VEGA,
	PUT_VEGA_PER_UNIT,
	PUTS,
	round3,
	SPOT,
	STOCK_DELTA,
	SUBTOTAL,
	TOTAL,
	UP,
	UP_PNL,
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
 * −$964: time decay survives the delta hedge. Last, two brokers' feeds: a vega per 1.00 of
 * volatility, 100 times the per-point figure, and a put delta stamped Friday.
 *
 *   open      0–4        "Portfolio Greeks"
 *   question  4–9.6      +1,006 shares: hedged?
 *   holdings  9.6–17.3   stock, calls, puts missing: +1,006 subtotal; puts −130: +876
 *   hedge     17.3–29.6  delta 0 at $101.20; +$5: +$875; a quiet week: −$964;
 *                        carry: the week’s −$964 locks as time decay / theta
 *   feeds     29.6–44.9  0.118 against 9.70; ÷ 100: 0.097; weight to +$237;
 *                        Friday delta is historical; align units and time, count every holding.
 *   next      44.9–47.4 Next: the module checkpoint
 */

const END = 47.4;
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
	const feedStart = height * (narrow ? 0.3 : 0.32);
	const feedStep = height * (narrow ? 0.2 : 0.17);
	const body = frame.type.body;
	const vegaWeightsY = feedStart + feedStep + body * 4;
	const vegaTotalY = vegaWeightsY + Math.max(frame.type.num * 1.3, body * 2.3);
	const deltaY = vegaTotalY + body * 4.1;
	const currentDeltaY = deltaY + body * 3.2;
	// Keep the two vega rows, their proof and then the Friday block in reading order.
	// Short landscape frames lift the feed stack together to preserve its bottom margin.
	const feedLift = Math.max(0, currentDeltaY - (height - 18));
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
			(i === 2 ? deltaY : feedStart + i * feedStep) - feedLift,
		vegaWeightsY: vegaWeightsY - feedLift,
		vegaTotalY: vegaTotalY - feedLift,
		currentDeltaY: currentDeltaY - feedLift,
		pair: narrow ? [0.27, 0.73] : [0.32, 0.68],
	};
}

const copy = {
	title: ["Portfolio Greeks", "组合希腊值"],
	titleSub: ["adding up exposure", "汇总敞口"],
	qTag: [
		"Reported delta, shares · Monday's close",
		"已报送 Delta（股） · 周一收盘",
	],
	qLine: [
		`Short ${count(SUBTOTAL)} shares. Fully hedged?`,
		`做空 ${count(SUBTOTAL)} 股，就完全对冲了吗？`,
	],
	bookHead: [
		"Your book at Monday's close: puts missing.",
		"你在周一收盘的持仓：看跌缺失。",
	],
	bookHeadShort: ["Your book: puts missing.", "你的持仓：看跌缺失。"],
	reportHead: ["Then the second account reports.", "然后第二个账户报送了。"],
	reportHeadShort: ["The puts report.", "看跌报送了。"],
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
	hedgeHead: ["A share hedge is local.", "股票对冲只在当前价附近有效。"],
	hedgeHeadShort: ["A share hedge is local.", "股票对冲只在当前价附近有效。"],
	walkScenario: [
		`ALFA $${SPOT.toFixed(2)} → $${(SPOT + UP).toFixed(2)}`,
		`ALFA $${SPOT.toFixed(2)} → $${(SPOT + UP).toFixed(2)}`,
	],
	walkPrice: [`ALFA $${SPOT.toFixed(2)}`, `ALFA $${SPOT.toFixed(2)}`],
	walkTarget: [`→ $${(SPOT + UP).toFixed(2)}`, `→ $${(SPOT + UP).toFixed(2)}`],
	weekRest: ["7 days, unchanged", "7 天后，不变"],
	heldHedge: [
		`Short ${count(HEDGE)} shares · initial Δ ≈ ${TOTAL - HEDGE}`,
		`做空 ${count(HEDGE)} 股 · 初始 Δ ≈ ${TOTAL - HEDGE}`,
	],
	heldIv: ["IV fixed", "隐含波动率不变"],
	weekScenario: [
		`ALFA unchanged $${SPOT.toFixed(2)} · 7 days later`,
		`ALFA $${SPOT.toFixed(2)} 不变 · 7 天后`,
	],
	fixedIv: [
		`Short ${count(HEDGE)} shares · initial Δ ≈ ${TOTAL - HEDGE} · IV fixed`,
		`做空 ${count(HEDGE)} 股 · 初始 Δ ≈ ${TOTAL - HEDGE} · 隐含波动率不变`,
	],
	pnlAxis: [
		`hedged book · P&L from Monday's close`,
		"对冲后的账户 · 自周一收盘的盈亏",
	],
	pnlAxisShort: ["hedged book", "对冲后的账户"],
	todayLabel: ["today · gamma", "今天 · Gamma"],
	weekLabel: ["a week on", "一周后"],
	meter: ["hedged P&L", "对冲后盈亏"],
	riskBig: ["Zero delta is not zero risk.", "Delta 为零，不等于没有风险。"],
	decayTag: ["7-day time decay · theta", "7 天时间衰减 · Theta"],
	feedHead: ["Check the broker units.", "先核对券商的报价单位。"],
	feedHeadShort: ["Check the broker units.", "先核对券商的报价单位。"],
	staleHead: [
		"The put delta is Friday's, not Monday's.",
		"看跌 Delta 是周五的，不是周一的。",
	],
	staleHeadShort: [`The put delta is Friday's.`, "看跌 Delta 是周五的。"],
	callVega: ["Call vega · main broker", "看涨 Vega · 主券商"],
	putVega: ["Put vega · 2nd broker", "看跌 Vega · 第二券商"],
	portfolioVega: ["Portfolio vega", "组合 Vega"],
	portfolioVegaUnit: ["/ vol point", "/ 波动率点"],
	perPointUnit: ["per vol point", "每个波动率点"],
	mondayStamp: ["· Mon 16:00", "· 周一 16:00"],
	putDelta: ["Put delta · Friday", "看跌 Delta · 周五历史值"],
	currentDelta: ["Current delta: unknown", "当前 Delta：未知"],
	perPoint: ["per vol point · Mon 16:00", "每个波动率点 · 周一 16:00"],
	perUnit: [
		"per 1.00 of vol · ÷ 100 · Mon 16:00",
		"每 1.00 波动率 · ÷ 100 · 周一 16:00",
	],
	perShareFriday: [
		`per share · Fri 16:00, ALFA $${FRIDAY_SPOT.toFixed(2)}`,
		`每股 · 周五 16:00，ALFA $${FRIDAY_SPOT.toFixed(2)}`,
	],
	claimBig: [
		"Align units and time; count every holding.",
		"统一单位与时点，覆盖每项持仓。",
	],
	claimSub: [
		"Missing or stale inputs: current exposure unknown.",
		"数据缺失或过时：当前敞口未知。",
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
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<Hatch id={`hatch-${id}`} />
			</defs>

			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart">
						{!narrow && (
							<text x={L.left} y={L.top - 12} className="wt-small">
								{t(copy.pnlAxis)}
							</text>
						)}
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
							style={{ strokeDasharray: "8 6" }}
						/>
						<path
							data-f="curve-week"
							d={L.path(weekOn)}
							className="wt-line-position"
							style={{
								stroke: "var(--tone-ink)",
								strokeDasharray: "8 6",
								strokeWidth: 2.5,
							}}
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
							style={{ fill: "var(--tone-ink)" }}
						>
							{t(copy.weekLabel)}
						</text>
						<circle
							data-f="week-marker"
							cx={L.px(SPOT)}
							cy={L.py(WEEK_PNL)}
							r={6}
							fill="var(--tone-ink)"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
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
			{(["walk-scenario", "week-scenario"] as const).map((name, i) =>
				narrow ? (
					<g key={name} data-f={name}>
						<Word
							name={`${name}-price`}
							x={L.left}
							y={L.top - T.body * 6.1}
							size={T.body}
							anchor="start"
							className="wt-film-type"
						>
							{t(copy.walkPrice)}
						</Word>
						<Word
							name={`${name}-change`}
							x={L.left}
							y={L.top - T.body * 4.5}
							size={T.body}
							anchor="start"
							className="wt-film-type"
						>
							{t(i === 0 ? copy.walkTarget : copy.weekRest)}
						</Word>
					</g>
				) : (
					<Word
						key={name}
						name={name}
						x={L.left}
						y={L.top - T.small * 4}
						size={T.small}
						anchor="start"
						className="wt-film-tag"
					>
						{t(i === 0 ? copy.walkScenario : copy.weekScenario)}
					</Word>
				),
			)}
			{narrow ? (
				<g data-f="scenario-iv">
					<Word
						name="scenario-hedge"
						x={L.left}
						y={L.top - T.body * 2.9}
						size={T.body}
						anchor="start"
						className="wt-film-type"
					>
						{t(copy.heldHedge)}
					</Word>
					<Word
						name="scenario-volatility"
						x={L.left}
						y={L.top - T.body * 1.3}
						size={T.body}
						anchor="start"
						className="wt-film-type"
					>
						{t(copy.heldIv)}
					</Word>
				</g>
			) : (
				<Word
					name="scenario-iv"
					x={L.left}
					y={L.top - T.small * 2.5}
					size={T.small}
					anchor="start"
					className="wt-film-tag"
				>
					{t(copy.fixedIv)}
				</Word>
			)}
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
					className="wt-film-num wt-film-dim"
				>
					$0
				</Word>
				<Word
					name="m-week-value"
					x={L.right}
					y={L.headY + T.head * 1.25 + T.num * 1.05}
					size={T.num}
					anchor="end"
					className="wt-film-num wt-film-loss"
				>
					{wholeUsd(WEEK_PNL)}
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
						className={`wt-film-num ${toneClass.caution} wt-halo`}
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
				<Word
					name="h-total"
					x={L.sharesX}
					y={sumY}
					size={figure * 1.2}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					{signedCount(TOTAL)}
				</Word>
			</g>
			{headline("g-head", copy.hedgeHead, copy.hedgeHeadShort)}
			<Brackets name="lock-risk" tone="loss" glow />
			<g data-f="risk">
				<Word
					name="risk-tag"
					x={W / 2}
					y={H * 0.37}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.decayTag).toUpperCase()}
				</Word>
				<Word
					name="risk-value"
					x={W / 2}
					y={H * 0.52 + T.num * 0.5}
					size={T.num * 1.5}
					className="wt-film-num wt-film-loss"
				>
					{wholeUsd(WEEK_PNL)}
				</Word>
				<Lines
					name="risk-big"
					text={t(copy.riskBig)}
					x={W / 2}
					y={H * 0.82}
					size={T.head}
					maxWidth={room}
				/>
			</g>
			{headline("f-head", copy.feedHead, copy.feedHeadShort)}
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
					{t(copy.perPointUnit)}
				</Word>
				<Word
					name="f-time-put-vega-point"
					x={L.sharesX}
					y={L.feedY(1) + T.body * 1.7}
					size={T.body}
					anchor="end"
					className="wt-film-type wt-film-accent"
				>
					{t(copy.mondayStamp)}
				</Word>
				<g data-f="f-vega-weights">
					{([CALLS, PUTS] as const).map((contracts, i) => (
						<Word
							key={i === 0 ? "call" : "put"}
							name={i === 0 ? "f-call-weight" : "f-put-weight"}
							x={L.margin}
							y={L.feedY(i) + T.body * 3.3}
							size={T.body}
							anchor="start"
							className="wt-film-num"
						>
							{`${i === 0 ? "" : "+ "}${contracts} × 100 × ${(i === 0 ? CALL_VEGA : PUT_VEGA).toFixed(3)}`}
						</Word>
					))}
				</g>
				<Word
					name="f-vega-total-label"
					x={L.margin}
					y={L.vegaTotalY}
					size={T.body}
					anchor="start"
					className="wt-film-type"
				>
					{t(copy.portfolioVega)}
				</Word>
				<Word
					name="f-vega-total-unit"
					x={L.margin + T.body * 8}
					y={L.vegaTotalY}
					size={T.body}
					anchor="start"
					className="wt-film-type"
				>
					{t(copy.portfolioVegaUnit)}
				</Word>
				<Word
					name="f-vega-total"
					x={L.sharesX}
					y={L.vegaTotalY}
					size={T.num}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					{`≈ ${wholeUsd(VEGA_TOTAL)}`}
				</Word>
				<Word
					name="f-current-delta"
					x={L.margin}
					y={L.currentDeltaY}
					size={T.body}
					anchor="start"
					className="wt-film-type wt-film-warn"
				>
					{t(copy.currentDelta)}
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
	const { tl, one, kids, show, hide, sink, trace } = d;
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const land = (target: Element, time: number, duration = 0.55) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.12, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration, ease: "power3.out" },
			time,
		);
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
	const word = (target: Element, at: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			at,
		);
	const usd = (value: number) =>
		Math.round(value) === 0 ? "$0" : wholeUsd(value);

	const lockRisk = one<SVGGraphicsElement>("lock-risk");

	d.hidden([
		one("curve-today"),
		one("curve-week"),
		one("today-label"),
		one("week-label"),
		marker,
		one("week-marker"),
		one("walk-scenario"),
		one("week-scenario"),
		one("scenario-iv"),
		...kids("meter"),
		...flat("q"),
		...["b-head", "r-head", "g-head", "f-head", "s-head"].map((name) =>
			one(name),
		),
		...flat("book"),
		one("h-missing"),
		...flat("risk"),
		lockRisk,
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
	land(one("q-big"), 4.8);
	show(one("q-line"), 6.0);

	// ——— holdings: a missing holding makes a subtotal ———
	tl.addLabel("holdings", 9.6);
	hide(flat("q"), 9.6);
	show(one("b-head"), 9.8, "above");
	show([one("col-per"), one("col-shares")], 9.95, "below", 0.3);
	// Headers stand for 1.05 s; the holdings are one comparison, not an ordered list.
	tl.fromTo(
		holdings.flatMap((row) => [
			one(`h-label-${row.key}`),
			...(row.key === "puts"
				? [one("h-missing")]
				: [one(`h-per-${row.key}`), one(`h-shares-${row.key}`)]),
		]),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		11.3,
	);
	tl.to(one("h-rule"), { opacity: 1, duration: 0.4 }, 11.7);
	show(one("h-sub-label"), 11.8);
	land(sum, 11.8);
	// The second account reports.
	d.swap(one("b-head"), one("r-head"), 13.4);
	// Preserve the newly synchronized call label's sentence hold before dimming context.
	tl.to(
		["stock", "calls"].flatMap((key) => [
			one(`h-label-${key}`),
			one(`h-per-${key}`),
			one(`h-shares-${key}`),
		]),
		{ opacity: 0.3, duration: 0.35 },
		14.95,
	);
	// Fold the subtotal and its label together; all three settled contributions
	// unfold with the total. There is never a counted sum over fixed operands.
	hide(one("h-missing"), 15.3, 0.3, 0);
	d.flip(one("h-sub-label"), one("h-total-label"), 15.3);
	d.flip(sum, one("h-total"), 15.3);
	tl.set([sum, one("h-sub-label")], { opacity: 0 }, 15.6);
	tl.fromTo(
		[one("h-per-puts"), one("h-shares-puts")],
		{ opacity: 1, scaleY: 0, transformOrigin: "50% 50%" },
		{ scaleY: 1, duration: 0.35, ease: "power2.out" },
		15.6,
	);

	// ——— hedge: zero delta, other sensitivities ———
	tl.addLabel("hedge", 17.3);
	hide([one("r-head"), ...flat("book")], 17.3);
	show(one("g-head"), 17.65, "above");
	// Bring the scaffold in at its final scale, then leave it alone for one second.
	tl.set(one("depth"), { scale: 1 }, 17.7);
	tl.to(one("depth"), { opacity: 1, duration: 0.3, ease: "power2.out" }, 17.7);
	// Reveal the settled scenario as one data beat after the scaffold hold.
	trace(one<SVGPathElement>("curve-today"), 19.0, {
		duration: 0.3,
		ease: "power1.inOut",
	});
	land(marker, 19.0, 0.3);
	show([one("m-tag"), meter], 19.0, "above", 0.3);
	tl.fromTo(
		[one("walk-scenario"), one("scenario-iv"), one("today-label")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		19.0,
	);
	// One state drives both the dot and its dollar readout, including loss colour.
	const walk = { spot: SPOT };
	const readWalk = () => {
		const pnl = hedgedPnl(walk.spot, 0);
		gsap.set(marker, { attr: { cx: L.px(walk.spot), cy: L.py(pnl) } });
		meter.textContent = usd(pnl);
		const tone = signTone(Math.round(pnl));
		meter.setAttribute(
			"class",
			`wt-film-num ${tone ? toneClass[tone] : "wt-film-dim"}`,
		);
	};
	tl.fromTo(
		walk,
		{ spot: SPOT },
		{
			spot: SPOT + UP,
			duration: 1.2,
			ease: "power2.inOut",
			immediateRender: false,
			onUpdate: readWalk,
		},
		20.3,
	);
	// $0 rests 19.3–20.3; +$875 rests 21.5–22.5. Swap to a settled
	// week scenario at the original price, rather than tracing a fictitious diagonal.
	hide([marker, meter, one("walk-scenario")], 22.5, 0.35, 0);
	tl.to(one("curve-today"), { opacity: 0.25, duration: 0.35 }, 22.5);
	tl.fromTo(
		one("week-scenario"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		22.85,
	);
	tl.fromTo(
		[
			one("curve-week"),
			one("week-marker"),
			one("m-week-value"),
			one("week-label"),
		],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		22.85,
	);
	// The week loss settles at 23.35 and rests until 25.1. Its exact figure
	// carries into the hero; the headline sits below the flight's clear lane.
	hide(
		[one("g-head"), one("m-tag"), one("week-scenario"), one("scenario-iv")],
		25.1,
	);
	sink(25.1);
	word(one("risk-big"), 25.5);
	d.carry(one<SVGGraphicsElement>("m-week-value"), one("risk-value"), 25.5, {
		duration: 0.8,
		arc: "y",
	});
	// The completed carry rests for a full second before one combined descriptor.
	tl.fromTo(
		one("risk-tag"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		27.3,
	);
	d.lock(lockRisk, 27.6, {
		around: [one("risk-tag"), one("risk-value")],
		pad: 10,
	});
	tl.addLabel("hero-lock", 27.6);

	// ——— feeds: units and timestamps ———
	tl.addLabel("feeds", 29.6);
	hide([...flat("risk"), lockRisk], 29.6);
	show(one("f-head"), 29.95, "above");
	// Introduce the two vega inputs as one comparison. The Friday delta waits for
	// its own beat, so both raw units receive the same 3.5-second reading hold.
	tl.fromTo(
		["call-vega", "put-vega"].flatMap((key) => [
			one(`f-label-${key}`),
			one(`f-value-${key}`),
			one(`f-unit-${key}`),
		]),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		29.95,
	);
	// Number and unit fold together: every visible input has its correct convention.
	d.flip(one("f-value-put-vega"), one("f-value-put-vega-point"), 33.45);
	d.flip(one("f-unit-put-vega"), one("f-unit-put-vega-point"), 33.45);
	tl.fromTo(
		one("f-time-put-vega-point"),
		{ opacity: 1, scaleY: 0, transformOrigin: "50% 50%" },
		{ scaleY: 1, duration: 0.35, ease: "power2.out" },
		33.75,
	);
	tl.set(
		[one("f-value-put-vega"), one("f-unit-put-vega")],
		{ opacity: 0 },
		33.75,
	);
	// Conversion settles at 34.10. Preserve its 1.05-second quiet interval, then
	// reveal the position weights and the model's rounded total intact, never counted.
	tl.fromTo(
		[
			one("f-vega-weights"),
			one("f-vega-total-label"),
			one("f-vega-total-unit"),
			one("f-vega-total"),
		],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		35.15,
	);
	// The portfolio result settles at 35.65 and rests until the next beat at 36.65.
	d.swap(one("f-head"), one("s-head"), 36.65);
	tl.fromTo(
		[
			one("f-label-put-delta"),
			one("f-value-put-delta"),
			one("f-unit-put-delta"),
			one("f-current-delta"),
		],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		37.0,
	);
	tl.set(
		one("f-unit-put-delta"),
		{ attr: { class: `wt-film-type ${toneClass.caution}` } },
		37.0,
	);
	tl.to(
		[one("f-label-call-vega"), one("f-label-put-vega")],
		{ opacity: 0.4, duration: 0.4 },
		37.0,
	);
	// Friday's value stays known; current delta settles at 37.5 and rests for 3 s.
	hide([one("s-head"), ...flat("feeds")], 40.5);
	word(one("z-big"), 40.9);
	show(one("z-sub"), 41.3);

	// ——— next ———
	tl.addLabel("next", 44.9);
	hide(kids("claim"), 44.9);
	d.close(44.9);
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
