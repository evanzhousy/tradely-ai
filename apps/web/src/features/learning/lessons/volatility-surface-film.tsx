import { gsap } from "gsap";
import { useId } from "react";
import {
	ALFA_EARNINGS_DATE,
	type Copy,
	daysToExpiry,
	expiries,
	modelVolatility,
	pick,
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
	TitleCard,
	Word,
} from "../walkthrough/film-kit";
import {
	ATM_IV,
	CALL_IV,
	CALL_WING,
	EXPIRIES,
	INTERPOLATED,
	ivPoints,
	MISSING,
	PUT_IV,
	PUT_WING,
	SKEW,
	STRIKES,
	signedPoints,
} from "./volatility-surface-model";

/*
 * The volatility surface, as a film. It opens on a number that can't be right on its own,
 * "ALFA's IV: 35%", and answers with the grid: one IV per strike and expiry, cascading in
 * as a heat map. A row is the skew, a column the term structure peaking where earnings
 * fall. Then the Oct 18 smile with its 25Δ wings, picked by delta, and the two signs the
 * same wings can carry. Last, the cells with no quote: interpolate between quotes, never
 * past them.
 *
 *   open       0–4        "The volatility surface"
 *   question   4–9.6      "ALFA's IV: 35%", struck out: which strike, which expiry?
 *   grid       9.6–19.8   the grid; a row, the skew; a column, the term structure
 *   wings      19.8–33    the Oct 18 smile, ATM 35%, the 25Δ put and call, not the same
 *                         distance; hero: cut to +2.8 or −2.8, locked
 *   estimates  33–40.4    no quote in three cells; interpolate between quotes, never past
 *   claim      40.4–44.8  "A surface, not a number."
 *   next       44.8–46.8  Next: IV rank and IV percentile
 */

const END = 46.8;
const IV_LOW = 29;
const IV_HIGH = 37;
const SMILE_X = [85, 115] as const;
const SMILE_Y = [31, 39] as const;
const smileIv = (strike: number) => modelVolatility("oct18", strike) * 100;
const OCT18 = EXPIRIES.indexOf("oct18");
const ATM = STRIKES.indexOf(100);
/** The first expiry after earnings: the line between rows sits just above it. */
const AFTER_EARNINGS = EXPIRIES.findIndex(
	(expiry) => expiries[expiry].date > ALFA_EARNINGS_DATE,
);
const isMissing = (row: number, col: number) =>
	MISSING.some(
		(cell) => cell.row === EXPIRIES[row] && cell.strike === STRIKES[col],
	);

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	const left = frame.margin;
	const right = width * 0.965;
	const top = height * (narrow ? 0.3 : 0.24);
	const bottom = height * (narrow ? 0.9 : 0.88);
	const labelWidth = narrow ? 58 : 128;
	const cellsLeft = left - (narrow ? 22 : 30) + labelWidth;
	const cellWidth = (right - cellsLeft) / STRIKES.length;
	const rowHeight = (bottom - top) / EXPIRIES.length;
	// On a phone the smile's IV labels need room left of its axis.
	const smileLeft = left + (narrow ? 22 : 0);
	const smileTop = height * (narrow ? 0.3 : 0.25);
	const smileBottom = height * 0.8;
	const xS = (strike: number) =>
		smileLeft +
		((strike - SMILE_X[0]) / (SMILE_X[1] - SMILE_X[0])) * (right - smileLeft);
	const yS = (iv: number) =>
		smileBottom -
		((iv - SMILE_Y[0]) / (SMILE_Y[1] - SMILE_Y[0])) * (smileBottom - smileTop);
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		labelLeft: left - (narrow ? 22 : 30),
		cellsLeft,
		cellWidth,
		rowHeight,
		cellX: (col: number) => cellsLeft + cellWidth * col,
		cellY: (row: number) => top + rowHeight * row,
		smileLeft,
		smileTop,
		smileBottom,
		xS,
		yS,
		smilePath: Array.from({ length: 61 }, (_, i) => {
			const strike = SMILE_X[0] + ((SMILE_X[1] - SMILE_X[0]) * i) / 60;
			return `${i ? "L" : "M"}${xS(strike).toFixed(1)} ${yS(smileIv(strike)).toFixed(1)}`;
		}).join(""),
		pair: narrow ? [0.27, 0.73] : [0.32, 0.68],
	};
}

const copy = {
	title: ["The volatility surface", "波动率曲面"],
	titleSub: ["IV by strike and by expiry", "按行权价与到期日的 IV"],
	qBig: ["ALFA's IV: 35%", "ALFA 的 IV：35%"],
	qLine: ["Which strike? Which expiry?", "哪个行权价？哪个到期日？"],
	gridHead: [
		"One IV for each strike and expiry.",
		"每个行权价、每个到期日各一个 IV。",
	],
	gridHeadShort: ["One IV per strike and expiry.", "每格一个 IV。"],
	rowHead: ["A row across strikes is the skew.", "横向（各行权价）是偏斜。"],
	colHead: [
		"Down a column: the term structure.",
		"纵向（各到期日）是期限结构。",
	],
	strike: ["strike", "行权价"],
	expiry: ["expiry", "到期日"],
	earnings: ["earnings Oct 3", "10月3日 财报"],
	wingsHead: [
		"Oct 18: the wings are picked by delta.",
		"10月18日：两翼按 Delta 选取。",
	],
	wingsHeadShort: ["Wings are picked by delta.", "两翼按 Delta 选取。"],
	distanceHead: [
		"Not the same distance from $100.",
		"离 $100 的距离并不相同。",
	],
	smileAxis: ["Oct 18 implied volatility, model", "10月18日 隐含波动率，模型"],
	strikeAxis: ["strike", "行权价"],
	atm: [`at the money ${ATM_IV}%`, `平值 ${ATM_IV}%`],
	putWing: [
		`25Δ put $${PUT_WING.toFixed(2)} · ${PUT_IV}%`,
		`25Δ 看跌 $${PUT_WING.toFixed(2)} · ${PUT_IV}%`,
	],
	putWingShort: [`25Δ put ${PUT_IV}%`, `25Δ 看跌 ${PUT_IV}%`],
	callWing: [
		`25Δ call $${CALL_WING.toFixed(2)} · ${CALL_IV}%`,
		`25Δ 看涨 $${CALL_WING.toFixed(2)} · ${CALL_IV}%`,
	],
	callWingShort: [`25Δ call ${CALL_IV}%`, `25Δ 看涨 ${CALL_IV}%`],
	skewTag: ["skew: put − call", "偏斜：看跌 − 看涨"],
	rrTag: ["RR: call − put", "风险逆转：看涨 − 看跌"],
	signsLine: [
		"Same wings, opposite signs. Say which one you mean.",
		"同样的两翼，符号相反。要说明你指的是哪一个。",
	],
	missingHead: ["Three cells have no usable quote.", "有三格没有可用报价。"],
	missingHeadShort: ["Three cells have no quote.", "三格没有报价。"],
	interpolateHead: [
		"Interpolate between quotes; never past them.",
		"报价之间可插值；超出范围不行。",
	],
	interpolated: ["interpolated", "插值"],
	claimBig: ["A surface, not a number.", "是一个曲面，不是一个数。"],
	claimSub: [
		"Name the strike, expiry and convention; mark estimates.",
		"说明行权价、到期日和约定；标出估计值。",
	],
	nextBig: ["Next: IV rank and IV percentile", "下一课：IV Rank 与 IV 百分位"],
	nextSub: [
		"where today's IV sits in its own history",
		"今天的 IV 在其历史中处于什么位置",
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
	const cellSize = narrow ? 13 : Math.min(T.head, L.rowHeight * 0.42);
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
	/** Heat: higher IV, stronger accent. */
	const heat = (iv: number) =>
		0.06 + ((iv - IV_LOW) / (IV_HIGH - IV_LOW)) * 0.42;
	const qWidth = Math.min(T.big * 0.85, room / (t(copy.qBig).length * 0.62));
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<Hatch id={`hatch-${id}`} />
				<clipPath id={`smile-${id}`}>
					<rect
						data-f="smile-clip"
						x={L.smileLeft - 4}
						y={0}
						width={0}
						height={H}
					/>
				</clipPath>
			</defs>

			<g data-f="depth">
				<g data-f="world">
					{/* The grid: strikes across, expiries down. */}
					<g data-f="chart-grid">
						{STRIKES.map((strike, col) => (
							<text
								key={strike}
								data-f={`g-col-${col}`}
								x={L.cellX(col) + L.cellWidth / 2}
								y={L.top - 10}
								textAnchor="middle"
								className="wt-small"
							>
								{`$${strike}`}
							</text>
						))}
						{EXPIRIES.map((expiry, row) => (
							<text
								key={expiry}
								data-f={`g-row-${row}`}
								x={L.labelLeft}
								y={L.cellY(row) + L.rowHeight / 2 + 4}
								className="wt-small"
							>
								{narrow
									? `${pick(expiries[expiry].label, locale)}`
									: `${pick(expiries[expiry].label, locale)} · ${daysToExpiry(expiry)}d`}
							</text>
						))}
						{EXPIRIES.map((expiry, row) =>
							STRIKES.map((strike, col) => {
								const iv = ivPoints(expiry, strike);
								return (
									<g
										key={`${expiry}-${strike}`}
										data-f={`g-cell-${row}-${col}`}
									>
										<rect
											x={L.cellX(col) + 2}
											y={L.cellY(row) + 2}
											width={L.cellWidth - 4}
											height={L.rowHeight - 4}
											rx={narrow ? 3 : 6}
											style={{
												fill: `color-mix(in oklab, var(--diagram-accent) ${Math.round(heat(iv) * 100)}%, transparent)`,
											}}
										/>
										<text
											data-f={`g-value-${row}-${col}`}
											x={L.cellX(col) + L.cellWidth / 2}
											y={L.cellY(row) + L.rowHeight / 2 + cellSize * 0.36}
											textAnchor="middle"
											className="wt-film-num"
											style={{ fontSize: cellSize }}
										>
											{`${iv}%`}
										</text>
									</g>
								);
							}),
						)}
						{EXPIRIES.map((expiry, row) =>
							STRIKES.map((strike, col) =>
								isMissing(row, col) ? (
									<rect
										key={`${expiry}-${strike}-missing`}
										data-f={`g-missing-${row}-${col}`}
										x={L.cellX(col) + 2}
										y={L.cellY(row) + 2}
										width={L.cellWidth - 4}
										height={L.rowHeight - 4}
										rx={narrow ? 3 : 6}
										fill={`url(#hatch-${id})`}
									/>
								) : null,
							),
						)}
						<g data-f="g-estimate">
							<rect
								x={L.cellX(STRIKES.indexOf(105)) + 2}
								y={L.cellY(EXPIRIES.indexOf("dec20")) + 2}
								width={L.cellWidth - 4}
								height={L.rowHeight - 4}
								rx={narrow ? 3 : 6}
								className="wt-film-bar"
								data-tone="model"
							/>
							<text
								x={L.cellX(STRIKES.indexOf(105)) + L.cellWidth / 2}
								y={
									L.cellY(EXPIRIES.indexOf("dec20")) +
									L.rowHeight / 2 +
									cellSize * 0.36
								}
								textAnchor="middle"
								className="wt-film-num wt-film-accent"
								style={{ fontSize: cellSize }}
							>
								{`≈${INTERPOLATED}%`}
							</text>
						</g>
						<rect
							data-f="g-row-frame"
							x={L.cellsLeft}
							y={L.cellY(OCT18)}
							width={L.cellWidth * STRIKES.length}
							height={L.rowHeight}
							rx={8}
							className="wt-bracket"
						/>
						<rect
							data-f="g-col-frame"
							x={L.cellX(ATM)}
							y={L.top}
							width={L.cellWidth}
							height={L.rowHeight * EXPIRIES.length}
							rx={8}
							className="wt-bracket"
						/>
						<g data-f="g-earnings">
							<path
								d={`M${L.labelLeft} ${L.cellY(AFTER_EARNINGS)}H${L.right}`}
								className="wt-film-gap"
								strokeDasharray="5 4"
							/>
							<text
								x={L.right}
								y={L.cellY(AFTER_EARNINGS) - 4}
								textAnchor="end"
								className="wt-small wt-halo wt-loss"
							>
								{t(copy.earnings)}
							</text>
						</g>
					</g>

					{/* The Oct 18 smile and its 25Δ wings. */}
					<g data-f="chart-smile">
						{[32, 34, 36, 38].map((tick) => (
							<g key={tick}>
								<path
									d={`M${L.smileLeft} ${L.yS(tick)}H${L.right}`}
									className="wt-grid"
								/>
								<text
									x={L.smileLeft - 8}
									y={L.yS(tick) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{`${tick}%`}
								</text>
							</g>
						))}
						{[90, 100, 110].map((tick) => (
							<text
								key={tick}
								x={L.xS(tick)}
								y={L.smileBottom + 18}
								textAnchor="middle"
								className="wt-small"
							>
								{`$${tick}`}
							</text>
						))}
						<text x={L.smileLeft} y={L.smileTop - 12} className="wt-small">
							{t(copy.smileAxis)}
						</text>
						<g clipPath={`url(#smile-${id})`}>
							<path
								className="wt-line-position"
								strokeDasharray="6 5"
								d={L.smilePath}
							/>
						</g>
						{(
							[
								["atm", 100, ATM_IV, copy.atm, copy.atm, "above-right"],
								[
									"put",
									PUT_WING,
									PUT_IV,
									copy.putWing,
									copy.putWingShort,
									// On a phone the left is the axis's: label the put above, to its right.
									narrow ? "above-right" : "below-left",
								],
								[
									"call",
									CALL_WING,
									CALL_IV,
									copy.callWing,
									copy.callWingShort,
									// The curve falls to the right: label the call above it.
									narrow ? "below-left" : "above-right",
								],
							] as const
						).map(([name, strike, iv, label, short, side]) => (
							<g key={name}>
								<path
									data-f={`w-drop-${name}`}
									d={`M${L.xS(strike)} ${L.yS(iv)}V${L.smileBottom}`}
									className="wt-grid"
									strokeDasharray="3 3"
								/>
								<circle
									data-f={`w-dot-${name}`}
									cx={L.xS(strike)}
									cy={L.yS(iv)}
									r={6}
									className={name === "atm" ? "wt-film-ghost" : "wt-chip"}
								/>
								<text
									data-f={`w-label-${name}`}
									x={L.xS(strike) + (side === "below-left" ? -10 : 10)}
									y={L.yS(iv) + (side.startsWith("below") ? 20 : -12)}
									textAnchor={side === "below-left" ? "end" : "start"}
									className={`wt-halo wt-marker-label ${name === "atm" ? "wt-small" : "wt-accent"}`}
								>
									{t(narrow ? short : label)}
								</text>
							</g>
						))}
					</g>
				</g>
			</g>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-big"
					x={W / 2}
					y={H * 0.44}
					size={qWidth}
					className="wt-film-num"
				>
					{t(copy.qBig)}
				</Word>
				<line
					data-f="q-strike"
					x1={W / 2 - (t(copy.qBig).length * qWidth * 0.62) / 2}
					x2={W / 2 + (t(copy.qBig).length * qWidth * 0.62) / 2}
					y1={H * 0.44 - qWidth * 0.32}
					y2={H * 0.44 - qWidth * 0.32}
					className="wt-film-gap"
					style={{ strokeWidth: Math.max(3, qWidth * 0.06) }}
				/>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.66}
					size={T.head * 1.2}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
			</g>
			{headline("g-head", copy.gridHead, copy.gridHeadShort)}
			{headline("r-head", copy.rowHead, copy.rowHead)}
			{/* Each answer, a line under its headline, as the stage makes it. */}
			<Lines
				name="c-head"
				text={t(copy.colHead)}
				x={L.margin}
				y={L.headY + lineCount(t(copy.rowHead), room, T.head) * T.head * 1.35}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			{headline("w-head", copy.wingsHead, copy.wingsHeadShort)}
			<Lines
				name="d-head"
				text={t(copy.distanceHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.wingsHeadShort : copy.wingsHead),
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
			<Brackets name="lock-signs" glow />
			<g data-f="s">
				{(
					[
						[copy.skewTag, signedPoints(SKEW)],
						[copy.rrTag, signedPoints(-SKEW)],
					] as const
				).map(([tag, num], i) => (
					<g key={tag[0]}>
						<Word
							name={`s-tag-${i}`}
							x={W * L.pair[i]}
							y={H * 0.32}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`s-num-${i}`}
							x={W * L.pair[i]}
							y={H * 0.32 + T.big * 0.95}
							size={T.big * 0.85}
							className={`wt-film-num ${i === 0 ? "wt-film-accent" : ""}`}
						>
							{num}
						</Word>
					</g>
				))}
				<Lines
					name="s-line"
					text={t(copy.signsLine)}
					x={W / 2}
					y={H * 0.76}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("m-head", copy.missingHead, copy.missingHeadShort)}
			<Lines
				name="i-head"
				text={t(copy.interpolateHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.missingHeadShort : copy.missingHead),
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
	const lockSigns = one<SVGGraphicsElement>("lock-signs");
	const cells = EXPIRIES.flatMap((_, row) =>
		STRIKES.map((_, col) => ({ row, col, el: one(`g-cell-${row}-${col}`) })),
	);
	const charts = { grid: one("chart-grid"), smile: one("chart-smile") };
	const missing = cells.filter((cell) => isMissing(cell.row, cell.col));
	const edges = missing.filter((cell) => EXPIRIES[cell.row] === "sep20");
	const heads = [
		"g-head",
		"r-head",
		"c-head",
		"w-head",
		"d-head",
		"m-head",
		"i-head",
	].map((name) => one(name));

	gsap.set(charts.smile, { opacity: 0 });
	gsap.set(
		cells.map((cell) => cell.el),
		{ transformOrigin: "50% 50%" },
	);
	d.hidden([
		...cells.map((cell) => cell.el),
		...STRIKES.map((_, col) => one(`g-col-${col}`)),
		...EXPIRIES.map((_, row) => one(`g-row-${row}`)),
		...missing.map((cell) => one(`g-missing-${cell.row}-${cell.col}`)),
		one("g-estimate"),
		one("g-row-frame"),
		one("g-col-frame"),
		one("g-earnings"),
		...["atm", "put", "call"].flatMap((name) => [
			one(`w-drop-${name}`),
			one(`w-dot-${name}`),
			one(`w-label-${name}`),
		]),
		...kids("q"),
		...heads,
		lockSigns,
		...kids("s").flatMap((el) =>
			el.tagName === "g" ? [...el.children] : [el],
		),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: one number for a stock? ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	land(one("q-big"), 4.8);
	tl.fromTo(
		one("q-strike"),
		{ opacity: 1, scaleX: 0, transformOrigin: "0% 50%" },
		{ scaleX: 1, duration: 0.45, ease: "power2.out" },
		5.4,
	);
	tl.to(one("q-big"), { opacity: 0.45, duration: 0.4 }, 5.6);
	show(one("q-line"), 6.0);

	// ——— grid: one IV per strike and expiry ———
	tl.addLabel("grid", 9.6);
	hide(kids("q"), 9.6);
	show(one("g-head"), 9.8);
	rise(9.9);
	show(
		STRIKES.map((_, col) => one(`g-col-${col}`)),
		10.3,
		"above",
		0.4,
	);
	show(
		EXPIRIES.map((_, row) => one(`g-row-${row}`)),
		10.4,
		"right",
		0.4,
	);
	for (const cell of cells)
		tl.fromTo(
			cell.el,
			{ opacity: 0, scale: 0.6 },
			{ opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" },
			10.8 + (cell.row + cell.col) * 0.07,
		);
	// A row: the skew.
	d.swap(one("g-head"), one("r-head"), 13.4);
	tl.to(
		cells.filter((cell) => cell.row !== OCT18).map((cell) => cell.el),
		{ opacity: 0.25, duration: 0.4 },
		13.6,
	);
	show(one("g-row-frame"), 13.8, "right", 0.4);
	// A column: the term structure, and the earnings between the rows.
	tl.to(
		cells.map((cell) => cell.el),
		{ opacity: (i) => (cells[i].col === ATM ? 1 : 0.25), duration: 0.4 },
		16.0,
	);
	tl.to(one("g-row-frame"), { opacity: 0, duration: 0.3 }, 16.0);
	show(one("g-col-frame"), 16.2, "below", 0.4);
	show(one("c-head"), 16.2);
	show(one("g-earnings"), 17.0, "right", 0.4);

	// ——— wings: the Oct 18 smile ———
	tl.addLabel("wings", 19.8);
	hide([one("r-head"), one("c-head")], 19.8);
	sink(19.8);
	tl.set(charts.grid, { opacity: 0 }, 20.1);
	tl.set(charts.smile, { opacity: 1 }, 20.1);
	show(one("w-head"), 20.15);
	rise(20.2);
	tl.to(
		one("smile-clip"),
		{
			attr: { width: L.right - L.smileLeft + 8 },
			duration: 1.1,
			ease: "power2.inOut",
		},
		20.8,
	);
	for (const [i, name] of (["atm", "put", "call"] as const).entries()) {
		const at = 21.9 + i * 0.7;
		tl.fromTo(
			one(`w-drop-${name}`),
			{ opacity: 0 },
			{ opacity: 1, duration: 0.3 },
			at,
		);
		land(one(`w-dot-${name}`), at);
		show(
			one(`w-label-${name}`),
			at + 0.2,
			name === "put" ? "below" : "above",
			0.4,
		);
	}
	show(one("d-head"), 23.8);
	// Cut: the signs the same wings can carry, locked.
	hide([one("w-head"), one("d-head")], 27.4);
	sink(27.4);
	show(one("s-tag-0"), 27.8);
	land(one("s-num-0"), 28.0);
	show(one("s-tag-1"), 28.6);
	land(one("s-num-1"), 28.8);
	d.lock(lockSigns, 29.5, {
		around: [one("s-tag-0"), one("s-num-0"), one("s-tag-1"), one("s-num-1")],
		pad: 10,
	});
	tl.addLabel("hero-lock", 29.5);
	show(one("s-line"), 29.5);

	// ——— estimates: what the quotes don't cover ———
	tl.addLabel("estimates", 33);
	hide(
		[
			...kids("s").flatMap((el) =>
				el.tagName === "g" ? [...el.children] : [el],
			),
			lockSigns,
		],
		33,
	);
	tl.set(charts.smile, { opacity: 0 }, 33.3);
	tl.set(charts.grid, { opacity: 1 }, 33.3);
	tl.set([one("g-col-frame"), one("g-earnings")], { opacity: 0 }, 33.3);
	tl.set(
		cells.map((cell) => cell.el),
		{ opacity: 1 },
		33.3,
	);
	show(one("m-head"), 33.35);
	rise(33.5);
	for (const [i, cell] of missing.entries()) {
		tl.to(
			one(`g-value-${cell.row}-${cell.col}`),
			{ opacity: 0, duration: 0.3 },
			34.4 + i * 0.2,
		);
		tl.to(
			one(`g-missing-${cell.row}-${cell.col}`),
			{ opacity: 1, duration: 0.4 },
			34.4 + i * 0.2,
		);
	}
	tl.to(
		cells
			.filter((cell) => !isMissing(cell.row, cell.col))
			.map((cell) => cell.el),
		{ opacity: 0.35, duration: 0.4 },
		36,
	);
	land(one("g-estimate"), 36.4);
	tl.fromTo(
		edges.map((cell) => one(`g-missing-${cell.row}-${cell.col}`)),
		{ scale: 1, transformOrigin: "50% 50%" },
		{ scale: 1.08, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.inOut" },
		36.8,
	);
	show(one("i-head"), 36.8);
	// Cut: the claim.
	hide([one("m-head"), one("i-head")], 40.4);
	sink(40.4);
	tl.fromTo(
		one("c-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		40.7,
	);
	show(one("c-sub"), 41.1);

	// ——— next ———
	tl.addLabel("next", 44.8);
	hide(kids("claim"), 44.8);
	d.close(44.8);
	return tl;
}

export const volatilitySurfaceFilm: Film = {
	id: "volatility-surface",
	label: [
		"The volatility surface, as a short film: ALFA's implied volatility as a grid of strikes and expiries, a row read as the skew and a column as the term structure peaking around earnings; the Oct 18 smile with its 25Δ wings picked by delta and the two signs they can carry; and the cells with no quote, one interpolated and two left blank",
		"波动率曲面短片：ALFA 的隐含波动率是一张按行权价与到期日排列的网格，横向一行是偏斜，纵向一列是在财报附近达到峰值的期限结构；10月18日 的微笑曲线与按 Delta 选取的 25Δ 两翼，以及它们可能带的两种符号；还有没有报价的格子，一个插值，两个留空",
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Volatility surface", "波动率曲面"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "grid", label: ["The grid", "网格"] },
		{ id: "wings", label: ["The wings", "两翼"] },
		{ id: "estimates", label: ["Estimates", "估计"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
