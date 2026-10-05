import { type Copy, count, pick } from "@/content/world";
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
	CANDIDATES,
	CHECKS,
	checkResult,
	FJOR_LATE,
	firstFail,
	sep2Volume,
	THRESHOLD,
} from "./symbol-universe-model";

/*
 * Comparison groups, as a film. FJOR's option volume never arrived: is FJOR in Monday's
 * comparison? Eight listed symbols meet four rules in order: stocks only, Monday's
 * session, data present, at least 500 contracts. BRDX and IDX 500 leave, EMBR leaves,
 * GLYN leaves, and FJOR stays as an unknown. Then "CRUX leads" holds only for the observed
 * three, until FJOR's 7,300 arrive. Last, Sep 2 compared with today's list of names misses
 * HALO, that day's real leader.
 *
 *   open      0–4      "Comparison groups"
 *   question  4–9.5    FJOR's volume never arrived: in or out?
 *   rules     9.5–20.5 stocks; Monday; data present (FJOR unknown); ≥ 500
 *   leader    20.5–29  CRUX leads the observed; FJOR arrives with 7,300
 *   past      29–37    Sep 2 on today's list: CRUX; on Sep 2's list: HALO
 *   claim     37–39.5  who belongs comes from the facts
 *   next      39.5–42  Next: rankings
 */

const END = 42;
const ROWS = CANDIDATES;
const ELIGIBLE = ROWS.filter((row) => firstFail(row, CHECKS.length) === null);
const OBSERVED = ELIGIBLE.filter((row) => row.optionVolume !== null).sort(
	(a, b) => (b.optionVolume ?? 0) - (a.optionVolume ?? 0),
);
const FJOR = ELIGIBLE.find((row) => row.optionVolume === null);
/** Leader board order: the observed three, then FJOR. */
const BOARD = [...OBSERVED, ...(FJOR ? [FJOR] : [])];
const VOL_MAX = 8_000;
const SEP2 = Object.entries(sep2Volume).sort((a, b) => b[1] - a[1]);
const TODAY_SEP2 = SEP2.filter(([symbol]) => symbol !== "HALO");

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const symW = narrow ? 64 : 110;
	const colW = (room - symW) / CHECKS.length;
	const labelW = narrow ? 56 : 90;
	return {
		...frame,
		rowY: (i: number) =>
			H * (narrow ? 0.29 : 0.29) + i * H * (narrow ? 0.062 : 0.064),
		rowH: H * (narrow ? 0.05 : 0.052),
		symW,
		colX: (c: number) => margin + symW + colW * (c + 0.5),
		headerY: H * (narrow ? 0.26 : 0.26),
		barRowY: (i: number) =>
			H * (narrow ? 0.3 : 0.3) + i * H * (narrow ? 0.1 : 0.11),
		barH: H * (narrow ? 0.06 : 0.065),
		barX: margin + labelW,
		barMax: room - labelW - (narrow ? 60 : 90),
		sepX: (i: number) => margin + i * (room / 2),
		sepY: (i: number) =>
			H * (narrow ? 0.38 : 0.38) + i * H * (narrow ? 0.075 : 0.08),
	};
}

const checkCopy: Record<(typeof CHECKS)[number], Copy> = {
	type: ["stock", "股票"],
	session: ["Monday", "周一"],
	data: ["data", "数据"],
	threshold: [`≥ ${count(THRESHOLD)}`, `≥ ${count(THRESHOLD)}`],
};

const copy = {
	title: ["Comparison groups", "比较范围"],
	titleSub: ["who belongs and who is missing", "谁该纳入，谁缺失"],
	qTag: ["Monday's option activity · peers", "周一期权活动 · 同类"],
	qLine: ["FJOR's option volume never arrived.", "FJOR 的期权成交量一直没到。"],
	qBig: ["In the comparison, or out?", "纳入比较，还是排除？"],
	r0: [
		`Eight symbols listed Monday. The rule: stock options, Monday's session, data present, at least ${count(THRESHOLD)}.`,
		`周一挂牌的八个代码。规则：股票期权、周一的交易时段、有数据、至少 ${count(THRESHOLD)} 张。`,
	],
	r0Short: ["Eight symbols, four rules.", "八个代码，四条规则。"],
	r1: [
		"An ETF and an index aren't stocks; EMBR's figure is Friday's. Out.",
		"ETF 和指数不是股票；EMBR 的数字是周五的。排除。",
	],
	r1Short: ["Not stocks; not Monday.", "非股票；非周一。"],
	r2: [
		"FJOR's volume never came: not zero, not out. It stays, as an unknown.",
		"FJOR 的成交量没来：不是零，也不排除。它留下，作为未知。",
	],
	r2Short: ["FJOR: unknown, stays.", "FJOR：未知，保留。"],
	r3: [
		`GLYN traded ${count(300)}, below the threshold. Three eligible, plus FJOR unknown.`,
		`GLYN 成交 ${count(300)} 张，低于门槛。三个合格，外加未知的 FJOR。`,
	],
	r3Short: ["Three in, one unknown.", "三个纳入，一个未知。"],
	l0: [
		`Among those you can observe, ${OBSERVED[0].symbol} leads with ${count(OBSERVED[0].optionVolume ?? 0)}.`,
		`在能观测到的里，${OBSERVED[0].symbol} 以 ${count(OBSERVED[0].optionVolume ?? 0)} 张领先。`,
	],
	l0Short: [
		`${OBSERVED[0].symbol} leads the observed.`,
		`${OBSERVED[0].symbol} 在已观测中领先。`,
	],
	l1: [
		`FJOR is eligible but unseen: "${OBSERVED[0].symbol} leads" holds for the observed three only.`,
		`FJOR 合格但看不到：“${OBSERVED[0].symbol} 领先”只对已观测的三个成立。`,
	],
	l1Short: ["FJOR: unseen.", "FJOR：看不到。"],
	l2: [
		`Then FJOR's ${count(FJOR_LATE)} arrive, and the leader changes.`,
		`接着 FJOR 的 ${count(FJOR_LATE)} 张到了，领先者变了。`,
	],
	l2Short: [`FJOR: ${count(FJOR_LATE)}.`, `FJOR：${count(FJOR_LATE)}。`],
	p0: [
		`Compare Sep 2 using today's list of names: ${TODAY_SEP2[0][0]} led with ${count(TODAY_SEP2[0][1])}.`,
		`用今天的代码名单比较 9月2日：${TODAY_SEP2[0][0]} 以 ${count(TODAY_SEP2[0][1])} 张领先。`,
	],
	p0Short: [
		`Today's list: ${TODAY_SEP2[0][0]}.`,
		`今天的名单：${TODAY_SEP2[0][0]}。`,
	],
	p1: [
		`Sep 2's own list had HALO, delisted Sep 6, and it led with ${count(sep2Volume.HALO)}.`,
		`9月2日自己的名单里有 HALO（9月6日退市），它以 ${count(sep2Volume.HALO)} 张领先。`,
	],
	p1Short: ["Sep 2's list: HALO.", "9月2日的名单：HALO。"],
	todayList: ["today's list", "今天的名单"],
	sep2List: ["Sep 2's list", "9月2日的名单"],
	delisted: ["delisted Sep 6", "9月6日退市"],
	unknown: ["unknown", "未知"],
	claimBig: ["Who belongs comes from the facts.", "谁该纳入，由事实决定。"],
	claimSub: [
		"Apply the rules to each name, keep the unknowns in, and use the list of names that was true on the day you study.",
		"对每个代码逐条套用规则，把未知的留在里面，并使用研究当天成立的那份名单。",
	],
	nextBig: ["Next: rankings", "下一课：排名"],
	nextSub: ["order without prediction", "排序不等于预测"],
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
	const text = narrow ? T.small * 1.1 : T.body;
	const mark = (result: "pass" | "fail" | "unknown") =>
		result === "pass" ? "✓" : result === "fail" ? "✕" : "?";
	const markTone = (result: "pass" | "fail" | "unknown") =>
		result === "pass"
			? "wt-film-gain"
			: result === "fail"
				? "wt-film-loss"
				: "wt-film-warn";
	const sepBar = (
		symbol: string,
		value: number,
		x: number,
		y: number,
		max: number,
	) => (
		<>
			<text
				x={x}
				y={y + text * 0.36}
				className="wt-film-num"
				style={{ fontSize: text }}
			>
				{symbol}
			</text>
			<rect
				x={x + (narrow ? 44 : 64)}
				y={y - L.barH * 0.3}
				width={(value / VOL_MAX) * max}
				height={L.barH * 0.6}
				rx={3}
				className="wt-film-bar"
				data-tone={symbol === "HALO" ? "total" : "neutral"}
			/>
			<text
				x={x + (narrow ? 44 : 64) + (value / VOL_MAX) * max + 6}
				y={y + T.small * 0.36}
				className="wt-film-num wt-film-dim"
				style={{ fontSize: T.small }}
			>
				{count(value)}
			</text>
		</>
	);
	const sepMax = room / 2 - (narrow ? 44 : 64) - (narrow ? 40 : 60);
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
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.43}
					size={T.head}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
				<Lines
					name="q-big"
					text={t(copy.qBig)}
					x={W / 2}
					y={H * 0.6}
					size={T.title}
					maxWidth={room}
				/>
			</g>

			{/* Eight names, four rules. */}
			{headline("r0", copy.r0, copy.r0Short)}
			{headline("r1", copy.r1, copy.r1Short)}
			{headline("r2", copy.r2, copy.r2Short)}
			{headline("r3", copy.r3, copy.r3Short)}
			{CHECKS.map((check, c) => (
				<text
					key={check}
					data-f={`col-${c}`}
					x={L.colX(c)}
					y={L.headerY}
					textAnchor="middle"
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(checkCopy[check]).toUpperCase()}
				</text>
			))}
			{ROWS.map((row, i) => (
				<g key={row.symbol} data-f={`sym-${i}`}>
					<rect
						data-f={`sym-${i}-box`}
						x={margin}
						y={L.rowY(i)}
						width={room}
						height={L.rowH}
						rx={8}
						className="wt-panel-shape"
					/>
					<text
						x={margin + 10}
						y={L.rowY(i) + L.rowH / 2 + text * 0.36}
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{row.symbol}
					</text>
				</g>
			))}
			{ROWS.flatMap((row, i) =>
				CHECKS.map((check, c) => {
					const result = checkResult(row, check);
					return (
						<text
							key={`${row.symbol}-${check}`}
							data-f={`mark-${i}-${c}`}
							x={L.colX(c)}
							y={L.rowY(i) + L.rowH / 2 + text * 0.38}
							textAnchor="middle"
							className={`wt-film-num ${markTone(result)}`}
							style={{ fontSize: text * 1.1 }}
						>
							{mark(result)}
						</text>
					);
				}),
			)}

			{/* The leader board. */}
			{headline("l0", copy.l0, copy.l0Short)}
			{headline("l1", copy.l1, copy.l1Short)}
			{headline("l2", copy.l2, copy.l2Short)}
			{BOARD.map((row, i) => {
				const value = row.optionVolume;
				const w = value === null ? 0 : (value / VOL_MAX) * L.barMax;
				return (
					<g key={row.symbol} data-f={`board-${i}`}>
						<text
							x={margin}
							y={L.barRowY(i) + L.barH / 2 + text * 0.36}
							className="wt-film-num"
							style={{ fontSize: text * 1.1 }}
						>
							{row.symbol}
						</text>
						{value === null ? (
							<>
								<rect
									data-f="fjor-ghost"
									x={L.barX}
									y={L.barRowY(i)}
									width={L.barMax * 0.4}
									height={L.barH}
									rx={4}
									className="wt-film-ghost"
								/>
								<text
									data-f="fjor-q"
									x={L.barX + L.barMax * 0.4 + 10}
									y={L.barRowY(i) + L.barH / 2 + T.small * 0.38}
									className="wt-film-tag wt-film-warn"
									style={{ fontSize: T.small }}
								>
									{`? ${t(copy.unknown).toUpperCase()}`}
								</text>
								<rect
									data-f="fjor-bar"
									x={L.barX}
									y={L.barRowY(i)}
									width={(FJOR_LATE / VOL_MAX) * L.barMax}
									height={L.barH}
									rx={4}
									className="wt-film-bar"
									data-tone="total"
								/>
								<text
									data-f="fjor-n"
									x={L.barX + (FJOR_LATE / VOL_MAX) * L.barMax + 10}
									y={L.barRowY(i) + L.barH / 2 + text * 0.36}
									className="wt-film-num wt-film-accent"
									style={{ fontSize: text * 1.1 }}
								>
									{count(FJOR_LATE)}
								</text>
							</>
						) : (
							<>
								<rect
									data-f={`board-${i}-bar`}
									x={L.barX}
									y={L.barRowY(i)}
									width={w}
									height={L.barH}
									rx={4}
									className="wt-film-bar"
									data-tone={i === 0 ? "total" : "neutral"}
								/>
								<text
									x={L.barX + w + 10}
									y={L.barRowY(i) + L.barH / 2 + text * 0.36}
									className="wt-film-num"
									style={{ fontSize: text * 1.1 }}
								>
									{count(value)}
								</text>
							</>
						)}
					</g>
				);
			})}

			{/* A past date, two lists of names. */}
			{headline("p0", copy.p0, copy.p0Short)}
			{headline("p1", copy.p1, copy.p1Short)}
			<g data-f="sep-today">
				<text
					x={L.sepX(0)}
					y={L.sepY(0) - H * 0.07}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.todayList).toUpperCase()}
				</text>
				{TODAY_SEP2.map(([symbol, value], i) => (
					<g key={symbol}>
						{sepBar(symbol, value, L.sepX(0), L.sepY(i), sepMax)}
					</g>
				))}
			</g>
			<g data-f="sep-then">
				<text
					x={L.sepX(1)}
					y={L.sepY(0) - H * 0.07}
					className="wt-film-tag wt-film-accent"
					style={{ fontSize: T.small }}
				>
					{t(copy.sep2List).toUpperCase()}
				</text>
				{SEP2.map(([symbol, value], i) => (
					<g key={symbol}>
						{sepBar(symbol, value, L.sepX(1), L.sepY(i), sepMax)}
					</g>
				))}
				<text
					x={L.sepX(1)}
					y={L.sepY(SEP2.length) + T.small}
					className="wt-film-type wt-film-warn"
					style={{ fontSize: T.small * 1.05 }}
				>
					{`HALO · ${t(copy.delisted)}`}
				</text>
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
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			time,
		);
	const heads = ["r0", "r1", "r2", "r3", "l0", "l1", "l2", "p0", "p1"].map(
		(name) => one(name),
	);
	const cols = CHECKS.map((_, c) => one(`col-${c}`));
	const syms = ROWS.map((_, i) => one(`sym-${i}`));
	const marks = (c: number) => ROWS.map((_, i) => one(`mark-${i}-${c}`));
	const board = BOARD.map((_, i) => one(`board-${i}`));

	d.hidden([
		...flat("q"),
		...heads,
		...cols,
		...syms,
		...CHECKS.flatMap((_, c) => marks(c)),
		...board,
		one("fjor-bar"),
		one("fjor-n"),
		one("sep-today"),
		one("sep-then"),
		...kids("claim"),
	]);

	/** A rule runs down its column; names that fail it drop back. */
	const apply = (c: number, time: number) => {
		show(cols[c], time);
		ROWS.forEach((row, i) => {
			if (firstFail(row, c) !== null) return;
			d.pop(one(`mark-${i}-${c}`), time + 0.2 + i * 0.06);
			if (firstFail(row, c + 1) === c)
				tl.to(syms[i], { opacity: 0.35, duration: 0.3 }, time + 0.8);
		});
		ROWS.forEach((row, i) => {
			if (firstFail(row, c + 1) === c)
				tl.to(
					one(`mark-${i}-${c}`),
					{ opacity: 0.6, duration: 0.3 },
					time + 0.8,
				);
		});
	};

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 5.1);
	word(one("q-big"), 6.6);

	// ——— rules: one at a time ———
	tl.addLabel("rules", 9.5);
	hide(flat("q"), 9.5);
	show(heads[0], 9.7, "above");
	syms.forEach((sym, i) => {
		show(sym, 10.0 + i * 0.08, "right");
	});
	d.swap(heads[0], heads[1], 12.0);
	apply(0, 12.4);
	apply(1, 13.6);
	d.swap(heads[1], heads[2], 15.0);
	apply(2, 15.4);
	ROWS.forEach((row, i) => {
		if (row.optionVolume === null)
			tl.set(one(`sym-${i}-box`), { attr: { class: "wt-focus-shape" } }, 15.8);
	});
	d.swap(heads[2], heads[3], 17.4);
	apply(3, 17.8);

	// ——— leader: observed, then complete ———
	tl.addLabel("leader", 20.5);
	hide(
		[heads[3], ...cols, ...syms, ...CHECKS.flatMap((_, c) => marks(c))],
		20.5,
	);
	show(heads[4], 20.7, "above");
	OBSERVED.forEach((_, i) => {
		show(board[i], 21.0 + i * 0.2, "right");
	});
	d.swap(heads[4], heads[5], 23.0);
	show(board[OBSERVED.length], 23.4, "right");
	d.swap(heads[5], heads[6], 25.4);
	hide([one("fjor-ghost"), one("fjor-q")], 25.8, 0.3);
	tl.fromTo(
		one("fjor-bar"),
		{ opacity: 1, attr: { width: 0 } },
		{
			attr: { width: Number(one("fjor-bar").getAttribute("width")) },
			duration: 0.8,
			ease: "power2.out",
		},
		26.0,
	);
	d.pop(one("fjor-n"), 26.6);
	tl.set(one("board-0-bar"), { attr: { "data-tone": "neutral" } }, 26.6);

	// ——— past: the day's own list ———
	tl.addLabel("past", 29);
	hide([heads[6], ...board, one("fjor-bar"), one("fjor-n")], 29.0);
	show(heads[7], 29.2, "above");
	show(one("sep-today"), 29.5, "right");
	d.swap(heads[7], heads[8], 32.0);
	show(one("sep-then"), 32.4, "right");

	// ——— claim ———
	tl.addLabel("claim", 37);
	hide([heads[8], one("sep-today"), one("sep-then")], 37.0);
	word(one("z-big"), 37.3);
	show(one("z-sub"), 37.7);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
	return tl;
}

export const symbolUniverseFilm: Film = {
	id: "symbol-universe",
	label: [
		`Comparison groups, as a short film: eight symbols listed on Monday against four rules, stock options, Monday's session, data present and at least ${count(THRESHOLD)} contracts, which leave ${ELIGIBLE.length - (FJOR ? 1 : 0)} eligible and FJOR as an unknown whose volume never arrived; a leader board where ${OBSERVED[0].symbol} leads the observed names until FJOR's ${count(FJOR_LATE)} arrive; and Sep 2 compared with today's list of names, which misses HALO, delisted Sep 6, that day's leader with ${count(sep2Volume.HALO)}`,
		`比较范围短片：周一挂牌的八个代码对照四条规则：股票期权、周一的交易时段、有数据、至少 ${count(THRESHOLD)} 张，最后 ${ELIGIBLE.length - (FJOR ? 1 : 0)} 个合格，FJOR 因成交量没到而作为未知保留；排行榜上 ${OBSERVED[0].symbol} 在已观测的代码中领先，直到 FJOR 的 ${count(FJOR_LATE)} 张到达；以及用今天的名单比较 9月2日，会漏掉 9月6日退市、当天以 ${count(sep2Volume.HALO)} 张领先的 HALO`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Comparison groups", "比较范围"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "rules", label: ["Four rules", "四条规则"] },
		{ id: "leader", label: ["The leader", "领先者"] },
		{ id: "past", label: ["A past date", "过去的日期"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
