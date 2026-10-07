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
	Word,
} from "../walkthrough/film-kit";
import {
	ALFA,
	byDesc,
	compact,
	dollars,
	GLYN,
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
 *   units     9.6–17.3   usd + count: refused; ÷: usd, $6,458
 *   rank      17.3–27    total premium; per trade; a floor of 20, ALFA locked
 *   view      27–37.6    Tuesday recomputes; the definition, not the numbers; cut: the claim
 *   next      37.6–40.1  Next: fork or write a recipe with AI
 */

const END = 40.1;
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
	const valueW = narrow ? 64 : width * 0.12;
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
		rowText: narrow ? T.small * 1.15 : T.body,
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
	totalHead: [
		"Monday's five names, by total premium.",
		"周一的五个标的，按总权利金。",
	],
	totalHeadShort: ["By total premium.", "按总权利金。"],
	perHead: [
		`Per trade, GLYN leads on ${GLYN.trades} trades.`,
		`按每笔，GLYN 领先，只有 ${GLYN.trades} 笔。`,
	],
	perHeadShort: [
		`Per trade: GLYN, on ${GLYN.trades} trades.`,
		`每笔：GLYN，只有 ${GLYN.trades} 笔。`,
	],
	floorHead: [
		`A floor of ${SAVED_FLOOR}: GLYN N/A, ALFA leads.`,
		`门槛 ${SAVED_FLOOR} 笔：GLYN 为 N/A，ALFA 领先。`,
	],
	floorHeadShort: [
		`Floor ${SAVED_FLOOR}: ALFA leads.`,
		`门槛 ${SAVED_FLOOR}：ALFA 领先。`,
	],
	viewHead: [
		`Tuesday, it recomputes: ${TUE_LEADER} leads.`,
		`周二重新计算：${TUE_LEADER} 领先。`,
	],
	viewHeadShort: [
		`Tuesday recomputes: ${TUE_LEADER}.`,
		`周二重算：${TUE_LEADER}。`,
	],
	trades: ["trades", "笔数"],
	columnTotal: ["column · Total Premium", "列 · Total Premium"],
	keepHead: ["The view keeps the definition.", "视图保存的是定义。"],
	keepHeadShort: ["It keeps the definition.", "保存的是定义。"],
	claimBig: ["A Rank column is yours to define.", "Rank 列由你来定义。"],
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
	`IF([Trades] >= ${SAVED_FLOOR}, …, NA())`,
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
					{REFUSED}
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
				{formulas.slice(1).map((formula, i) => (
					<text
						key={formula}
						data-f={`f-${i + 1}`}
						x={margin}
						y={L.barY}
						className="wt-film-num wt-film-accent"
						style={{ fontSize: L.rowText }}
					>
						{`= ${formula}`}
					</text>
				))}
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
							className={`wt-film-type ${symbol === "GLYN" ? "wt-film-loss" : ""}`}
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
								className="wt-film-num wt-film-dim"
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
							className="wt-film-bar"
							data-tone={symbol === "GLYN" ? "loss" : "total"}
						/>
						{STATES.map((k) => {
							const row = rowOf(k, symbol);
							const na = score(k, row) === null;
							return (
								<text
									key={k}
									data-f={`v-${symbol}-${k}`}
									x={L.valueX}
									y={rowText(y0)}
									textAnchor="end"
									className={`wt-film-num ${na ? "wt-film-dim" : symbol === "GLYN" && k === 1 ? "wt-film-loss" : ""}`}
									style={{ fontSize: L.rowText }}
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
	 * Every row to its place and size under state k, with its value swapped in. A row that
	 * changes place dims while it passes the others, so no two read over each other.
	 */
	const rank = (from: State, k: State, time: number) => {
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
			tl.to(
				one(`bar-${symbol}`),
				{
					attr: { width: width(k, symbol) },
					duration: 0.7,
					ease: "power2.inOut",
				},
				time,
			);
			d.flip(value(symbol, from), value(symbol, k), time + 0.2);
			tl.set(value(symbol, from), { opacity: 0 }, time + 0.5);
		}
	};

	const lockFloor = one<SVGGraphicsElement>("lock-floor");

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
			one(`n-${symbol}-tue`),
			...STATES.map((k) => value(symbol, k)),
		]),
		...kids("claim"),
	]);

	// Rows start in the total-premium order.
	for (const symbol of SYMBOLS) tl.set(row(symbol), { y: lift(0, symbol) }, 0);

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
	d.swap(one("u-head"), one("d-head"), 13.4);
	hide(one("refused"), 13.75);
	tl.to(one("box-bad"), { opacity: 0, duration: 0.3 }, 13.75);
	d.flip(one("tok-plus"), one("tok-div"), 14.0);
	tl.set(one("tok-plus"), { opacity: 0 }, 14.3);
	show(one("output"), 14.4);
	tl.fromTo(
		one("preview"),
		{ opacity: 0, y: 6 },
		{ opacity: 1, y: 0, duration: 0.55, ease: "power3.out" },
		14.8,
	);

	// ——— rank: totals, per trade, a floor ———
	tl.addLabel("rank", 17.3);
	hide([one("d-head"), ...kids("editor")], 17.3);
	show(one("t-head"), 17.65, "above");
	show([one("f-0"), one("day-mon"), one("col-trades")], 17.9);
	SYMBOLS.forEach((symbol) => {
		const i = order(0).indexOf(symbol);
		tl.fromTo(
			row(symbol),
			{ opacity: 0, x: 24 },
			{ opacity: 1, x: 0, duration: 0.45 },
			18.1 + i * 0.12,
		);
		tl.to(
			one(`bar-${symbol}`),
			{ attr: { width: width(0, symbol) }, duration: 0.6, ease: "power2.out" },
			18.3 + i * 0.12,
		);
		tl.to(value(symbol, 0), { opacity: 1, duration: 0.3 }, 18.5 + i * 0.12);
	});
	// Per trade.
	d.swap(one("t-head"), one("p-head"), 21.2);
	d.flip(one("f-0"), one("f-1"), 21.6);
	tl.set(one("f-0"), { opacity: 0 }, 21.9);
	rank(0, 1, 21.7);
	// A floor. The hero: ALFA back in front.
	show(one("f-head"), 23.4);
	d.flip(one("f-1"), one("f-2"), 23.6);
	tl.set(one("f-1"), { opacity: 0 }, 23.9);
	rank(1, 2, 23.7);
	d.lock(lockFloor, 24.6, { around: row(ALFA.symbol), pad: 6 });
	tl.addLabel("hero-lock", 24.6);

	// ——— view: the formula recomputes, the numbers don't stay ———
	tl.addLabel("view", 27);
	hide([one("p-head"), one("f-head"), lockFloor], 27.0);
	show(one("v-head"), 27.35, "above");
	d.flip(one("day-mon"), one("day-tue"), 27.7);
	tl.set(one("day-mon"), { opacity: 0 }, 28.0);
	for (const symbol of SYMBOLS) {
		d.flip(one(`n-${symbol}-mon`), one(`n-${symbol}-tue`), 27.8);
		tl.set(one(`n-${symbol}-mon`), { opacity: 0 }, 28.1);
	}
	rank(2, 3, 28.0);
	show(one("w-head"), 29.5);
	// Cut: the claim.
	hide([one("v-head"), one("w-head"), ...kids("rank")], 33.1);
	word(one("z-big"), 33.5);
	show(one("z-sub"), 33.9);

	// ——— next ———
	tl.addLabel("next", 37.6);
	hide(kids("claim"), 37.6);
	d.close(37.6);
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
