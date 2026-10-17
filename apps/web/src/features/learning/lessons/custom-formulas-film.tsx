import {
	type Copy,
	count,
	dayLabel,
	pick,
	type SymbolFlowRow,
	symbolFlowSessions,
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
	TitleCard,
	toneClass,
	Word,
} from "../walkthrough/film-kit";
import {
	ALFA,
	byDesc,
	compact,
	dollars,
	GLYN,
	guardFormula,
	MONDAY,
	perTrade,
	REFUSED,
	SAVED_FLOOR,
} from "./custom-formulas-model";

/*
 * A Rank column, as a film. It opens on a formula, [Total Premium] + [Trades], and asks
 * what the editor shows. Every field carries a unit: dollars plus a count has none, so the
 * editor refuses it; dividing gives dollars per trade, $6,458 for ALFA. Then the ranking:
 * CRUX leads by total premium, GLYN by premium per trade on just 3 trades, and a floor of
 * 20 trades leaves GLYN N/A and ALFA in front. Saved as a view, the formula recomputes on
 * Tuesday, where DUNE leads: the view keeps the definition, not Monday's numbers.
 *
 *   open      0–4        "Build your own Rank column"
 *   question  4–9.6      [Total Premium] + [Trades]
 *   units     9.6–19.25  usd + count: refused; ÷: usd, $6,458
 *   rank      19.25–33.57  total premium; thin denominator; 20-trade floor, ALFA locked
 *   view      33.57–44.97  saved formula persists as Tuesday recomputes; cut: the claim
 *   next      44.97–47.47  Next: fork or write a recipe with AI
 */

const END = 47.47;
const TUESDAY = symbolFlowSessions.tuesday.rows;
const SYMBOLS = MONDAY.map((row) => row.symbol);
type State = 0 | 1 | 2 | 3;
const STATES = [0, 1, 2, 3] as const;
const rowsFor = (k: State) => (k === 3 ? TUESDAY : MONDAY);
/** What each state ranks by, or null where a row falls below the floor. */
const score = (k: State, row: SymbolFlowRow): number | null =>
	k === 0
		? row.totalPremium
		: k === 1
			? perTrade(row)
			: row.trades >= SAVED_FLOOR
				? perTrade(row)
				: null;
const order = (k: State) => {
	const rows = rowsFor(k);
	const kept = byDesc(
		rows.filter((row) => score(k, row) !== null),
		(row) => score(k, row) ?? 0,
	);
	return [...kept, ...rows.filter((row) => score(k, row) === null)].map(
		(row) => row.symbol,
	);
};
const top = (k: State) =>
	Math.max(...rowsFor(k).map((row) => score(k, row) ?? 0));
const rowOf = (k: State, symbol: string) =>
	rowsFor(k).find((row) => row.symbol === symbol) ?? MONDAY[0];
const valueText = (k: State, row: SymbolFlowRow) => {
	const value = score(k, row);
	return value === null ? "N/A" : k === 0 ? compact(value) : dollars(value);
};
const TUE_LEADER = order(3)[0];
const TOKENS = ["[Total Premium]", " + ", "[Trades]"] as const;
const SAVED_EXPRESSION = guardFormula(SAVED_FLOOR);
const savedExpressionBreak = SAVED_EXPRESSION.indexOf(",");
const SAVED_EXPRESSION_LINES = [
	SAVED_EXPRESSION.slice(0, savedExpressionBreak + 1),
	SAVED_EXPRESSION.slice(savedExpressionBreak + 1).trimStart(),
] as const;
const DEFINITION_LINE_HEIGHT = 1.35;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room, type: T } = frame;
	const pad = narrow ? 12 : 22;
	const chars = TOKENS.join("").length;
	const formula = Math.min(T.head * 1.4, (room - 2 * pad) / (chars * 0.62));
	const rowTop = H * (narrow ? 0.42 : 0.4);
	const rowStep = H * (narrow ? 0.09 : 0.088);
	const symW = narrow ? 46 : width * 0.08;
	const tradesW = narrow ? 34 : width * 0.08;
	const rowText = narrow ? T.small * 1.15 : T.body;
	const heroText = rowText * 1.35;
	const valueW = Math.max(narrow ? 64 : width * 0.12, heroText * 6 * 0.62);
	return {
		...frame,
		pad,
		formula,
		cw: formula * 0.6,
		boxY: H * (narrow ? 0.27 : 0.28),
		boxH: H * (narrow ? 0.6 : 0.52),
		rowTop,
		rowStep,
		rowH: rowStep * 0.7,
		symW,
		tradesX: margin + symW + tradesW,
		barX: margin + symW + tradesW + 14,
		barMax: room - symW - tradesW - 14 - valueW - 8,
		valueX: margin + room,
		rowText,
		heroText,
		barY: H * (narrow ? 0.3 : 0.28),
	};
}

const copy = {
	title: ["Build your own Rank column", "构建你自己的 Rank 列"],
	titleSub: ["units, a floor, a saved definition", "单位、门槛、保存的定义"],
	qTag: ["New column · Rank Symbols", "新列 · Rank Symbols"],
	qLine: ["What does the editor show for ALFA?", "编辑器对 ALFA 显示什么？"],
	unitHead: ["Every field carries a unit.", "每个字段都带着单位。"],
	divideHead: [
		"Divide instead: dollars per trade, unit usd.",
		"改为相除：每笔多少美元，单位 usd。",
	],
	divideHeadShort: ["Divide: usd per trade.", "相除：每笔 usd。"],
	output: ["output unit · usd", "输出单位 · usd"],
	refused: [`✗ ${REFUSED}`, "✗ usd 不能与 count 相加。"],
	totalHead: [
		"Monday's five names, by total premium.",
		"周一的五个标的，按总权利金。",
	],
	totalHeadShort: ["By total premium.", "按总权利金。"],
	perHead: [
		"Few trades can inflate per-trade averages.",
		"笔数少，每笔均值可能偏高。",
	],
	perHeadShort: ["Few trades can inflate averages.", "笔数少，均值可能偏高。"],
	floorHead: [
		`${SAVED_FLOOR}-trade floor: ALFA leads; GLYN N/A.`,
		`${SAVED_FLOOR} 笔门槛：ALFA 领先，GLYN 为 N/A。`,
	],
	floorHeadShort: [
		`${SAVED_FLOOR}-trade floor: ALFA leads; GLYN N/A.`,
		`${SAVED_FLOOR} 笔门槛：ALFA 领先，GLYN 为 N/A。`,
	],
	viewHead: ["Recompute on Tuesday.", "在周二重新计算。"],
	viewHeadShort: ["Recompute on Tuesday.", "在周二重新计算。"],
	trades: ["trades", "笔数"],
	columnTotal: ["column · Total Premium", "列 · Total Premium"],
	saved: ["Saved", "已保存"],
	keepHead: [
		`${TUE_LEADER} leads; the view keeps the definition.`,
		`${TUE_LEADER} 领先；视图保存定义。`,
	],
	keepHeadShort: [
		`${TUE_LEADER} leads; definition kept.`,
		`${TUE_LEADER} 领先；保存定义。`,
	],
	claimBig: [
		"Save the formula; recompute each session.",
		"保存公式；每个交易时段重新计算。",
	],
	claimSub: [
		"Descriptive and yours, not a TradingFlow metric.",
		"描述性的、由你定义，不是 TradingFlow 指标。",
	],
	nextBig: [
		"Next: fork or write a recipe with AI",
		"下一课：用 AI 分叉或编写 Recipe",
	],
	nextSub: ["scope an edit you can review", "划定可审阅的修改范围"],
} as const satisfies Record<string, Copy>;

const formulas = [
	"[Total Premium]",
	"[Total Premium] / [Trades]",
	SAVED_EXPRESSION,
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
	// The editor: three tokens on one line, with their units under the fields.
	const x0 = margin + L.pad;
	const tokenX = [x0, x0 + 15 * L.cw, x0 + 18 * L.cw];
	const lineY = L.boxY + L.pad + T.small * 2 + L.formula * 1.2;
	const chipY = lineY + L.formula * 0.7;
	const chipH = T.small * 1.9;
	const noteY = chipY + chipH + T.body * 2;
	const chip = (name: string, cx: number, unit: string) => (
		<g data-f={name}>
			<rect
				x={cx - (unit.length * T.small * 0.7) / 2 - 8}
				y={chipY}
				width={unit.length * T.small * 0.7 + 16}
				height={chipH}
				rx={chipH / 2}
				className="wt-panel-shape"
				style={{ stroke: "var(--diagram-accent)" }}
			/>
			<text
				x={cx}
				y={chipY + chipH / 2 + T.small * 0.36}
				textAnchor="middle"
				className="wt-film-num wt-film-accent"
				style={{ fontSize: T.small * 1.05 }}
			>
				{unit}
			</text>
		</g>
	);
	const rowText = (y: number) => y + L.rowH / 2 + L.rowText * 0.36;
	const y0 = L.rowTop;
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
				<Word
					name="q-big"
					x={W / 2}
					y={H * 0.32 + L.formula * 2.2}
					size={L.formula * 1.1}
					className="wt-film-num wt-film-accent"
				>
					{TOKENS.join("")}
				</Word>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.72}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("u-head", copy.unitHead, copy.unitHead)}
			{headline("d-head", copy.divideHead, copy.divideHeadShort)}

			{/* The column editor. */}
			<g data-f="editor">
				<rect
					data-f="box"
					x={margin}
					y={L.boxY}
					width={room}
					height={L.boxH}
					rx={14}
					className="wt-panel-shape"
				/>
				<rect
					data-f="box-bad"
					x={margin}
					y={L.boxY}
					width={room}
					height={L.boxH}
					rx={14}
					className="wt-band-loss"
					style={{ stroke: "var(--diagram-loss)", strokeWidth: 1.5 }}
				/>
				<text
					data-f="box-tag"
					x={x0}
					y={L.boxY + L.pad + T.small}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.qTag).toUpperCase()}
				</text>
				{(
					[
						["tok-a", TOKENS[0], 0],
						["tok-plus", TOKENS[1], 1],
						["tok-div", " / ", 1],
						["tok-b", TOKENS[2], 2],
					] as const
				).map(([name, text, i]) => (
					<text
						key={name}
						data-f={name}
						x={tokenX[i]}
						y={lineY}
						className="wt-film-num"
						style={{ fontSize: L.formula, whiteSpace: "pre" }}
					>
						{text}
					</text>
				))}
				{chip("unit-a", tokenX[0] + 7.5 * L.cw, "usd")}
				{chip("unit-b", tokenX[2] + 4 * L.cw, "count")}
				<text
					data-f="refused"
					x={x0}
					y={noteY}
					className="wt-film-num wt-film-loss"
					style={{ fontSize: T.body }}
				>
					{t(copy.refused)}
				</text>
				<text
					data-f="output"
					x={x0}
					y={noteY}
					className="wt-film-num wt-film-accent"
					style={{ fontSize: T.body }}
				>
					{t(copy.output)}
				</text>
				<text
					data-f="preview"
					x={x0}
					y={noteY + T.num * 1.5}
					className="wt-film-num"
					style={{ fontSize: T.num }}
				>
					{`ALFA · ${dollars(perTrade(ALFA))}`}
				</text>
			</g>

			{/* The ranking. */}
			{headline("t-head", copy.totalHead, copy.totalHeadShort)}
			{headline("p-head", copy.perHead, copy.perHeadShort)}
			<Lines
				name="f-head"
				text={t(narrow ? copy.floorHeadShort : copy.floorHead)}
				x={margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.perHeadShort : copy.perHead),
						narrow ? room : room * 0.74,
						T.head,
					) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{headline("v-head", copy.viewHead, copy.viewHeadShort)}
			<Lines
				name="w-head"
				text={t(narrow ? copy.keepHeadShort : copy.keepHead)}
				x={margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.viewHeadShort : copy.viewHead),
						narrow ? room : room * 0.74,
						T.head,
					) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<Brackets name="lock-floor" glow />
			<g data-f="rank">
				<text
					data-f="f-0"
					x={margin}
					y={L.barY}
					className="wt-film-num wt-film-dim"
					style={{ fontSize: L.rowText }}
				>
					{t(copy.columnTotal)}
				</text>
				{formulas.slice(1).map((formula, i) => {
					const lines =
						i === 1
							? narrow
								? [
										`${t(copy.saved)} · ${SAVED_EXPRESSION_LINES[0]}`,
										SAVED_EXPRESSION_LINES[1],
									]
								: [`${t(copy.saved)} · ${formula}`]
							: [`= ${formula}`];
					return (
						<text
							key={formula}
							data-f={`f-${i + 1}`}
							x={margin}
							y={L.barY}
							className="wt-film-num wt-film-accent"
							style={{ fontSize: L.rowText }}
						>
							{lines.map((line, lineIndex) => (
								<tspan
									key={lineIndex}
									x={margin}
									dy={lineIndex === 0 ? 0 : L.rowText * DEFINITION_LINE_HEIGHT}
								>
									{line}
								</tspan>
							))}
						</text>
					);
				})}
				<rect
					data-f="definition-rule"
					x={margin}
					y={
						L.barY +
						(narrow ? L.rowText * DEFINITION_LINE_HEIGHT : 0) +
						L.rowText * 0.5
					}
					width={0}
					height={2}
					fill="var(--diagram-accent)"
				/>
				<path
					data-f="definition-kept"
					d="M0 0"
					pathLength={1}
					fill="none"
					stroke="var(--diagram-accent)"
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
					style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
				/>
				{(
					[
						["day-mon", MONDAY],
						["day-tue", TUESDAY],
					] as const
				).map(([name, rows]) => (
					<text
						key={name}
						data-f={name}
						// A phone puts the session at the end of the column headers' row.
						x={margin + room}
						y={narrow ? L.rowTop - L.rowStep * 0.35 : L.barY}
						textAnchor="end"
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(
							dayLabel(
								rows === MONDAY
									? symbolFlowSessions.monday.date
									: symbolFlowSessions.tuesday.date,
							),
						).toUpperCase()}
					</text>
				))}
				<text
					data-f="col-trades"
					x={L.tradesX}
					y={L.rowTop - L.rowStep * 0.35}
					textAnchor="end"
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.trades).toUpperCase()}
				</text>
				{SYMBOLS.map((symbol) => (
					<g key={symbol} data-f={`row-${symbol}`}>
						<text
							x={margin}
							y={rowText(y0)}
							className="wt-film-type"
							style={{ fontSize: L.rowText }}
						>
							{symbol}
						</text>
						{(["mon", "tue"] as const).map((day) => (
							<text
								key={day}
								data-f={`n-${symbol}-${day}`}
								x={L.tradesX}
								y={rowText(y0)}
								textAnchor="end"
								className={`wt-film-num ${symbol === GLYN.symbol ? "wt-film-warn" : "wt-film-dim"}`}
								style={{ fontSize: L.rowText }}
							>
								{count(rowOf(day === "mon" ? 0 : 3, symbol).trades)}
							</text>
						))}
						<rect
							data-f={`bar-${symbol}`}
							x={L.barX}
							y={y0 + L.rowH * 0.18}
							width={0}
							height={L.rowH * 0.64}
							rx={3}
							className={
								symbol === GLYN.symbol
									? `wt-film-bar ${toneClass.focus}`
									: "wt-film-bar"
							}
							data-tone={symbol === GLYN.symbol ? undefined : "total"}
						/>
						{STATES.map((k) => {
							const row = rowOf(k, symbol);
							const na = score(k, row) === null;
							return (
								<text
									key={k}
									data-f={`v-${symbol}-${k}`}
									x={L.valueX}
									y={
										y0 +
										L.rowH / 2 +
										(symbol === ALFA.symbol && k === 2
											? L.heroText
											: L.rowText) *
											0.36
									}
									textAnchor="end"
									className={`wt-film-num ${na ? "wt-film-dim" : symbol === "GLYN" && k === 1 ? "wt-film-warn" : ""}`}
									style={{
										fontSize:
											symbol === ALFA.symbol && k === 2
												? L.heroText
												: L.rowText,
									}}
								>
									{valueText(k, row)}
								</text>
							);
						})}
					</g>
				))}
			</g>
			<g data-f="claim">
				<Lines
					name="z-big"
					text={t(copy.claimBig)}
					x={W / 2}
					y={H * 0.42}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="z-sub"
					text={t(copy.claimSub)}
					x={W / 2}
					y={
						H * 0.42 +
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
	/** A mark lands slightly large and settles, without overshoot. */
	const land = (target: Element, time: number, duration = 0.55) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.12, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration, ease: "power3.out" },
			time,
		);
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
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const row = (symbol: string) => one(`row-${symbol}`);
	const value = (symbol: string, k: State) => one(`v-${symbol}-${k}`);
	const lift = (k: State, symbol: string) =>
		order(k).indexOf(symbol) * L.rowStep;
	const width = (k: State, symbol: string) =>
		((score(k, rowOf(k, symbol)) ?? 0) / top(k)) * L.barMax;
	/**
	 * One fold hands the formula, session, counts, values and settled bar widths over
	 * together. Bars fade rather than interpolate through widths their readouts never name.
	 * A row that changes place dims while it passes the others.
	 */
	const rank = (from: State, k: State, time: number, foldAt: number) => {
		const handoff = foldAt + 0.3;
		if (k === 3) {
			d.flip(one("day-mon"), one("day-tue"), foldAt);
			tl.set(one("day-mon"), { opacity: 0 }, handoff);
		} else {
			d.flip(one(`f-${from}`), one(`f-${k}`), foldAt);
			tl.set(one(`f-${from}`), { opacity: 0 }, handoff);
		}
		for (const symbol of SYMBOLS) {
			if (lift(from, symbol) !== lift(k, symbol)) {
				tl.to(row(symbol), { opacity: 0.25, duration: 0.15 }, time - 0.1);
				tl.to(row(symbol), { opacity: 1, duration: 0.25 }, time + 0.65);
			}
			tl.to(
				row(symbol),
				{ y: lift(k, symbol), duration: 0.7, ease: "power2.inOut" },
				time,
			);
			const bar = one(`bar-${symbol}`);
			tl.to(bar, { opacity: 0, duration: 0.3, ease: "power2.in" }, foldAt);
			tl.set(bar, { attr: { width: width(k, symbol) } }, handoff);
			if (symbol === GLYN.symbol && k === 1) {
				tl.set(
					bar,
					{ attr: { class: `wt-film-bar ${toneClass.caution}` } },
					handoff,
				);
			}
			tl.to(bar, { opacity: 1, duration: 0.35, ease: "power2.out" }, handoff);
			d.flip(value(symbol, from), value(symbol, k), foldAt);
			tl.set(value(symbol, from), { opacity: 0 }, handoff);
			if (k === 3) {
				d.flip(one(`n-${symbol}-mon`), one(`n-${symbol}-tue`), foldAt);
				tl.set(one(`n-${symbol}-mon`), { opacity: 0 }, handoff);
			}
		}
	};

	const lockFloor = one<SVGGraphicsElement>("lock-floor");
	const definition = one<SVGTextElement>("f-2").getBBox();
	const definitionWidth = definition.width;
	const definitionLastBaseline =
		L.barY + (L.narrow ? L.rowText * DEFINITION_LINE_HEIGHT : 0);
	const checkX = L.margin + definitionWidth + 8;
	const checkY = definitionLastBaseline - L.rowText * 0.3;
	const afterTable = (time: number) => time + 0.57;

	d.hidden([
		...flat("q"),
		...[
			"u-head",
			"d-head",
			"t-head",
			"p-head",
			"f-head",
			"v-head",
			"w-head",
		].map((name) => one(name)),
		lockFloor,
		...kids("editor"),
		...kids("rank"),
		...SYMBOLS.flatMap((symbol) => [
			one(`bar-${symbol}`),
			one(`n-${symbol}-tue`),
			...STATES.map((k) => value(symbol, k)),
		]),
		...kids("claim"),
	]);

	// Rows start in the total-premium order.
	for (const symbol of SYMBOLS) tl.set(row(symbol), { y: lift(0, symbol) }, 0);
	tl.set(
		one("definition-kept"),
		{ attr: { d: `M${checkX} ${checkY}l4 4 8 -9` } },
		0,
	);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a formula ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	word(one("q-big"), 4.8);
	show(one("q-line"), 6.0);

	// ——— units: the editor checks them first ———
	tl.addLabel("units", 9.6);
	hide(flat("q"), 9.6);
	show(one("u-head"), 9.8, "above");
	show([one("box"), one("box-tag")], 10.1);
	show([one("tok-a"), one("tok-plus"), one("tok-b")], 10.4);
	land(one("unit-a"), 11.0, 0.4);
	land(one("unit-b"), 11.3, 0.4);
	// Dollars plus a count has no unit: refused.
	show(one("refused"), 12.2, "right");
	tl.to(one("box-bad"), { opacity: 1, duration: 0.3 }, 12.2);
	// Divide instead.
	d.swap(one("u-head"), one("d-head"), 15.35);
	hide(one("refused"), 15.7);
	tl.to(one("box-bad"), { opacity: 0, duration: 0.3 }, 15.7);
	d.flip(one("tok-plus"), one("tok-div"), 15.95);
	tl.set(one("tok-plus"), { opacity: 0 }, 16.25);
	show(one("output"), 16.35);
	tl.fromTo(
		one("preview"),
		{ opacity: 0, y: 6 },
		{ opacity: 1, y: 0, duration: 0.55, ease: "power3.out" },
		16.75,
	);

	// ——— rank: totals, per trade, a floor ———
	tl.addLabel("rank", 19.25);
	hide([one("d-head"), ...kids("editor")], 19.25);
	// Let the editor clear, then hold the complete table scaffold for one second.
	show([one("f-0"), one("day-mon"), one("col-trades")], 19.6, "below", 0.3);
	show(one("t-head"), afterTable(19.6), "above");
	SYMBOLS.forEach((symbol) => {
		const i = order(0).indexOf(symbol);
		const rowAt = 20.9 + i * 0.1;
		tl.fromTo(
			row(symbol),
			{ opacity: 0, x: 24 },
			{ opacity: 1, x: 0, duration: 0.45 },
			rowAt,
		);
		tl.set(one(`bar-${symbol}`), { attr: { width: width(0, symbol) } }, rowAt);
		tl.to(one(`bar-${symbol}`), { opacity: 1, duration: 0.6 }, rowAt);
		tl.to(value(symbol, 0), { opacity: 1, duration: 0.3 }, rowAt);
	});
	// Per trade.
	d.swap(one("t-head"), one("p-head"), afterTable(23.15));
	// The thin denominator gets emphasis during construction, before the proof rests.
	tl.to(
		one("n-GLYN-mon"),
		{ fontSize: L.rowText * 1.15, duration: 0.3, ease: "power2.inOut" },
		afterTable(23.55),
	);
	rank(0, 1, afterTable(23.65), afterTable(23.55));
	// A floor. The hero: ALFA back in front.
	// The count returns to row size as the floor fold starts.
	tl.to(
		one("n-GLYN-mon"),
		{ fontSize: L.rowText, duration: 0.3, ease: "power2.inOut" },
		afterTable(26.05),
	);
	rank(1, 2, afterTable(26.15), afterTable(26.05));
	d.lock(lockFloor, afterTable(27.05), {
		around: value(ALFA.symbol, 2),
		pad: 6,
	});
	tl.addLabel("hero-lock", afterTable(27.05));
	// Brackets settle at 28.07; give the hero 1.5 s of quiet before its answer.
	show(one("f-head"), afterTable(29.0));
	// The answer settles at 30.07. Establish the saved definition after another second,
	// then keep both the formula and its underline stationary through Tuesday's fold.
	tl.fromTo(
		one("definition-rule"),
		{ opacity: 0, attr: { width: 0 } },
		{
			opacity: 1,
			attr: { width: definitionWidth },
			duration: 0.8,
			ease: "power2.inOut",
			immediateRender: false,
		},
		afterTable(30.5),
	);

	// ——— view: the formula recomputes, the numbers don't stay ———
	tl.addLabel("view", afterTable(33.0));
	hide([one("p-head"), one("f-head"), lockFloor], afterTable(33.0));
	show(one("v-head"), afterTable(33.35), "above");
	rank(2, 3, afterTable(34.0), afterTable(33.9));
	// Tuesday settles at 35.47; its leader appears only after a full second of quiet.
	show(one("w-head"), afterTable(35.9));
	// Confirm the marked definition survived, preserving the late drawing after-beat.
	tl.fromTo(
		one("definition-kept"),
		{ opacity: 0, strokeDashoffset: 1 },
		{
			opacity: 1,
			strokeDashoffset: 0,
			duration: 0.8,
			ease: "power2.inOut",
			immediateRender: false,
		},
		afterTable(37.9),
	);
	// Cut: the claim.
	hide([one("v-head"), one("w-head"), ...kids("rank")], afterTable(39.9));
	word(one("z-big"), afterTable(40.3));
	show(one("z-sub"), afterTable(40.7));

	// ——— next ———
	tl.addLabel("next", afterTable(44.4));
	hide(kids("claim"), afterTable(44.4));
	d.close(afterTable(44.4));
	return tl;
}

export const customFormulasFilm: Film = {
	id: "custom-formulas",
	label: [
		`Building a Rank column, as a short film: the formula [Total Premium] + [Trades], which the editor refuses because dollars plus a count has no unit, and the division that works, dollars per trade, ${dollars(perTrade(ALFA))} for ALFA; Monday's five names ranked by total premium, where CRUX leads, then per trade, where GLYN leads on ${GLYN.trades} trades, then with a floor of ${SAVED_FLOOR} trades that leaves GLYN N/A and ALFA in front; and the column saved as a view, recomputing on Tuesday, where ${TUE_LEADER} leads`,
		`构建 Rank 列短片：公式 [Total Premium] + [Trades]，因为美元加计数没有单位而被编辑器拒绝，而相除可以，每笔多少美元，ALFA 为 ${dollars(perTrade(ALFA))}；周一的五个标的按总权利金排名，CRUX 领先，按每笔排名则 GLYN 以 ${GLYN.trades} 笔领先，加上 ${SAVED_FLOOR} 笔的门槛后 GLYN 为 N/A，ALFA 领先；以及保存为视图的这一列在周二重新计算，${TUE_LEADER} 领先`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Rank column", "Rank 列"] },
		{ id: "question", label: ["The formula", "公式"] },
		{ id: "units", label: ["Units", "单位"] },
		{ id: "rank", label: ["Thin rows", "单薄的行"] },
		{ id: "view", label: ["The view", "视图"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
