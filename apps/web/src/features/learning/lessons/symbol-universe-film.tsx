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
 * GLYN leaves, and FJOR stays as an unknown. The hero: "CRUX leads" holds for the observed
 * three, until FJOR's 7,300 arrive and glowing brackets lock on the new leader. Last, Sep 2
 * compared with today's list of names misses HALO, that day's real leader.
 *
 *   open      0–4        "Comparison groups"
 *   question  4–8.6      FJOR's volume never arrived: in or out?
 *   rules     8.6–19.4   stocks; Monday; data present (FJOR unknown); ≥ 500
 *   leader    19.4–28.4  hero: CRUX leads the observed; FJOR arrives with 7,300
 *   past      28.4–33.8  Sep 2 on today's list: CRUX; on Sep 2's list: HALO
 *   claim     33.8–38.2  who belongs comes from the facts
 *   next      38.2–40.7  Next: rankings
 */

const END = 40.7;
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
	rHead: ["Four rules, applied in order.", "四条规则，依次套用。"],
	r2Head: ["FJOR stays in, as an unknown.", "FJOR 留下，作为未知。"],
	lHead: [
		`${OBSERVED[0].symbol} leads the three observed.`,
		`${OBSERVED[0].symbol} 在已观测的三个中领先。`,
	],
	l2Head: [
		`Then FJOR's ${count(FJOR_LATE)} arrive: a new leader.`,
		`FJOR 的 ${count(FJOR_LATE)} 张到了：领先者换了。`,
	],
	pHead: ["Sep 2, on today's list of names.", "9月2日，用今天的名单。"],
	p2Head: ["Sep 2's own list: HALO led.", "9月2日自己的名单：HALO 领先。"],
	todayList: ["today's list", "今天的名单"],
	sep2List: ["Sep 2's list", "9月2日的名单"],
	delisted: ["delisted Sep 6", "9月6日退市"],
	unknown: ["unknown", "未知"],
	claimBig: ["Who belongs comes from the facts.", "谁该纳入，由事实决定。"],
	claimSub: ["Use the list that was true that day.", "用当天成立的那份名单。"],
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
	const headline = (name: string, text: Copy) => (
		<Lines
			name={name}
			text={t(text)}
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
			{headline("r-head", copy.rHead)}
			{/* The question's answer, once the last rule has run. */}
			<Lines
				name="r2-head"
				text={t(copy.r2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.rHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
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
			{headline("l-head", copy.lHead)}
			{/* The hero's answer, as FJOR's bar runs past the leader's. */}
			<Lines
				name="l2-head"
				text={t(copy.l2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.lHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<Brackets name="lock-fjor" glow />
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
			{headline("p-head", copy.pHead)}
			{/* The answer, as Sep 2's own list comes up. */}
			<Lines
				name="p2-head"
				text={t(copy.p2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.pHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
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
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const heads = [
		"r-head",
		"r2-head",
		"l-head",
		"l2-head",
		"p-head",
		"p2-head",
	].map((name) => one(name));
	const lockFjor = one<SVGGraphicsElement>("lock-fjor");
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
		lockFjor,
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
	show(one("q-line"), 4.8);
	word(one("q-big"), 5.1);

	// ——— rules: one at a time ———
	tl.addLabel("rules", 8.6);
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	syms.forEach((sym, i) => {
		show(sym, 9.2 + i * 0.08, "right");
	});
	apply(0, 10.4);
	apply(1, 11.9);
	apply(2, 13.4);
	ROWS.forEach((row, i) => {
		if (row.optionVolume === null)
			tl.set(one(`sym-${i}-box`), { attr: { class: "wt-focus-shape" } }, 13.8);
	});
	apply(3, 14.9);
	show(heads[1], 15.6);

	// ——— leader: the hero. The observed, then the complete set. ———
	tl.addLabel("leader", 19.4);
	d.swap([heads[0], heads[1]], heads[2], 19.4);
	hide([...cols, ...syms, ...CHECKS.flatMap((_, c) => marks(c))], 19.4);
	OBSERVED.forEach((_, i) => {
		show(board[i], 20.2 + i * 0.2, "right");
	});
	show(board[OBSERVED.length], 21.6, "right");
	hide([one("fjor-ghost"), one("fjor-q")], 23.0, 0.3);
	tl.fromTo(
		one("fjor-bar"),
		{ opacity: 1, attr: { width: 0 } },
		{
			attr: { width: Number(one("fjor-bar").getAttribute("width")) },
			duration: 0.8,
			ease: "power2.out",
		},
		23.2,
	);
	word(one("fjor-n"), 24.0);
	tl.set(one("board-0-bar"), { attr: { "data-tone": "neutral" } }, 24.0);
	d.lock(lockFjor, 24.8, {
		around: [board[OBSERVED.length], one("fjor-bar"), one("fjor-n")],
		pad: 3,
	});
	tl.addLabel("hero-lock", 24.8);
	show(heads[3], 24.8);

	// ——— past: the day's own list ———
	tl.addLabel("past", 28.4);
	d.swap([heads[2], heads[3]], heads[4], 28.4);
	hide([...board, one("fjor-bar"), one("fjor-n"), lockFjor], 28.4);
	show(one("sep-today"), 29.0, "right");
	show(one("sep-then"), 30.0, "right");
	show(heads[5], 30.2);

	// ——— claim ———
	tl.addLabel("claim", 33.8);
	hide([heads[4], heads[5], one("sep-today"), one("sep-then")], 33.8);
	word(one("z-big"), 34.1);
	show(one("z-sub"), 34.5);

	// ——— next ———
	tl.addLabel("next", 38.2);
	hide(kids("claim"), 38.2);
	d.close(38.2);
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
