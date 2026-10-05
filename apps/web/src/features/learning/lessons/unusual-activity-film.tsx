import { type Copy, count, type mondayActivity, pick } from "@/content/world";
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
	BLOCK_MINUTE,
	byId,
	CALL_105,
	clock,
	ratio,
	T1_MINUTE,
	todayBy,
	typicalBy,
} from "./unusual-activity-model";

/*
 * Unusual activity, as a film. The Oct 18 105 call trades 505 on Monday: unusual compared
 * with what? Four calls against their typical volume, 0.8× to 4.2×; then against open
 * interest, where a thin Dec 20 110 call with 3 outstanding jumps to 4×. Then the window:
 * 505 by 11:00 against a typical 36 by then is 14×; against a full day, 4.2×. Last, a 2×
 * screen that flags two calls, one a spread leg and one 12 contracts in a thin series.
 *
 *   open      0–4      "Unusual activity"
 *   question  4–9.5    505 contracts: unusual compared with what?
 *   ratio     9.5–19.5 against typical volume; against open interest
 *   window    19.5–29.5 by 11:00, 14×; by the close, 4.2×
 *   screen    29.5–37  a 2× screen flags two; what each one was
 *   claim     37–39.5  name the denominator and the window
 *   next      39.5–42  Next: data clocks
 */

const END = 42;
const ROWS = (
	["oct18-105", "dec20-110", "oct18-110", "oct18-100"] as const
).map((id) => byId(id));
const RATIO_MAX = 5;
const THRESHOLD = 2;
const DAY = 390;
const ELEVEN = 90;
const Y_MAX = 560;
const vsTypical = (row: (typeof mondayActivity)[number]) =>
	row.volume / row.typical;
const vsOi = (row: (typeof mondayActivity)[number]) =>
	row.volume / row.openInterest;
const AT_ELEVEN = CALL_105.volume / typicalBy(ELEVEN);
const AT_CLOSE = CALL_105.volume / CALL_105.typical;
const THIN = byId("dec20-110");
const LEG = byId("oct18-105");

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const labelW = narrow ? room * 0.36 : room * 0.24;
	const barX = margin + labelW;
	const barMax = room - labelW - (narrow ? 44 : 70);
	const left = margin + (narrow ? 34 : 50);
	const right = margin + room;
	const top = H * (narrow ? 0.32 : 0.3);
	const bottom = H * (narrow ? 0.8 : 0.82);
	return {
		...frame,
		rowY: (i: number) =>
			H * (narrow ? 0.3 : 0.3) + i * H * (narrow ? 0.12 : 0.13),
		rowH: H * (narrow ? 0.055 : 0.06),
		barX,
		barW: (value: number) => (Math.min(value, RATIO_MAX) / RATIO_MAX) * barMax,
		baseY: H * (narrow ? 0.24 : 0.23),
		left,
		right,
		top,
		bottom,
		x: (minute: number) => left + (minute / DAY) * (right - left),
		y: (contracts: number) => bottom - (contracts / Y_MAX) * (bottom - top),
		noteY: (i: number) => H * (narrow ? 0.82 : 0.84) + i * H * 0.06,
	};
}

const copy = {
	title: ["Unusual activity", "异常成交"],
	titleSub: ["compared with what?", "与什么相比？"],
	qTag: ["Oct 18 105 call · Monday", "10月18日 105 看涨 · 周一"],
	qLine: [
		`${count(CALL_105.volume)} contracts trade.`,
		`成交 ${count(CALL_105.volume)} 张。`,
	],
	qBig: ["Unusual compared with what?", "异常，是与什么相比？"],
	r0: [
		`Against typical volume, four ALFA calls run from ${ratio(Math.min(...ROWS.map(vsTypical)))} to ${ratio(vsTypical(CALL_105))}.`,
		`与平常成交量相比，四张 ALFA 看涨在 ${ratio(Math.min(...ROWS.map(vsTypical)))} 到 ${ratio(vsTypical(CALL_105))} 之间。`,
	],
	r0Short: ["Against typical volume.", "对比平常成交量。"],
	r1: [
		`Against open interest, the thin Dec 20 110 call leads: ${THIN.volume} of ${THIN.openInterest}, ${ratio(vsOi(THIN))}.`,
		`对比未平仓量，排序就变了：稀薄的 12月20日 110 看涨，${THIN.openInterest} 张中成交 ${THIN.volume} 张，以 ${ratio(vsOi(THIN))} 居首。`,
	],
	r1Short: [
		`Against open interest: ${ratio(vsOi(THIN))} leads.`,
		`对比未平仓量：${ratio(vsOi(THIN))} 居首。`,
	],
	typical: ["÷ typical volume", "÷ 平常成交量"],
	oi: ["÷ open interest", "÷ 未平仓量"],
	w0: [
		`Monday's 105 call (solid) against a typical day (dashed), contracts traded so far.`,
		"周一 105 看涨（实线）对比平常一天（虚线）的累计成交。",
	],
	w0Short: ["Today against a typical day.", "今天对比平常一天。"],
	w1: [
		`At 11:00: ${count(CALL_105.volume)} against ${Math.round(typicalBy(ELEVEN))} by then on a typical day, ${ratio(AT_ELEVEN)}.`,
		`11:00：${count(CALL_105.volume)} 张，平常此时为 ${Math.round(typicalBy(ELEVEN))} 张，${ratio(AT_ELEVEN)}。`,
	],
	w1Short: [`At 11:00: ${ratio(AT_ELEVEN)}.`, `11:00：${ratio(AT_ELEVEN)}。`],
	w2: [
		`At the close, a full day against a full day: ${ratio(AT_CLOSE)}. Same trades, another window.`,
		`收盘时，整天对比整天：${ratio(AT_CLOSE)}。同样的成交，不同的窗口。`,
	],
	w2Short: [`At the close: ${ratio(AT_CLOSE)}.`, `收盘：${ratio(AT_CLOSE)}。`],
	today: ["today", "今天"],
	typicalDay: ["typical", "平常"],
	axis: ["contracts traded so far", "累计成交张数"],
	s0: [
		`A screen flags anything above ${THRESHOLD}× its typical volume: two calls.`,
		`筛选器标出成交量超过平常 ${THRESHOLD} 倍的合约：两张。`,
	],
	s0Short: [`A ${THRESHOLD}× screen: two flags.`, `${THRESHOLD}× 筛选：两个。`],
	s1: [
		"One flag is a single spread leg; the other, 12 contracts in a thin series.",
		"一个是单笔价差的一条腿，另一个是稀薄合约里的 12 张。",
	],
	s1Short: ["A spread leg; a thin series.", "价差的一条腿；稀薄合约。"],
	flag: ["flag", "标记"],
	legNote: [
		`${LEG.label[0]}: one ${count(500)}-lot spread leg`,
		`${LEG.label[1]}：一笔 ${count(500)} 张价差的一条腿`,
	],
	thinNote: [
		`${THIN.label[0]}: ${THIN.volume} contracts, ${THIN.openInterest} open`,
		`${THIN.label[1]}：成交 ${THIN.volume} 张，未平仓 ${THIN.openInterest} 张`,
	],
	claimBig: ["Name the denominator and the window.", "说清分母，也说清窗口。"],
	claimSub: [
		"A ratio is only as meaningful as what it divides by and when. A flag says where to look, not what happened.",
		"比率的意义取决于除以什么、截至何时。标记只告诉你去哪里看，而不是发生了什么。",
	],
	nextBig: ["Next: data clocks", "下一课：数据时钟"],
	nextSub: ["when each source was true", "每个来源在何时成立"],
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
	const today = [
		[0, 0],
		[T1_MINUTE, 0],
		[T1_MINUTE, todayBy(T1_MINUTE)],
		[BLOCK_MINUTE, todayBy(T1_MINUTE)],
		[BLOCK_MINUTE, todayBy(BLOCK_MINUTE)],
		[DAY, todayBy(DAY)],
	];
	const typical = Array.from({ length: 40 }, (_, i) => (i / 39) * DAY).map(
		(m) => [m, typicalBy(m)],
	);
	const path = (points: number[][]) =>
		points
			.map(
				([m, v], i) =>
					`${i ? "L" : "M"}${L.x(m).toFixed(1)} ${L.y(v).toFixed(1)}`,
			)
			.join("");
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

			{/* Four calls, two denominators. */}
			{headline("r0", copy.r0, copy.r0Short)}
			{headline("r1", copy.r1, copy.r1Short)}
			{headline("s0", copy.s0, copy.s0Short)}
			{headline("s1", copy.s1, copy.s1Short)}
			{(
				[
					["base-typical", copy.typical],
					["base-oi", copy.oi],
				] as const
			).map(([name, label]) => (
				<text
					key={name}
					data-f={name}
					x={margin}
					y={L.baseY}
					className="wt-film-tag wt-film-accent"
					style={{ fontSize: T.small * 1.1 }}
				>
					{t(label).toUpperCase()}
				</text>
			))}
			{ROWS.map((row, i) => (
				<g key={row.id} data-f={`row-${i}`}>
					<text
						x={margin}
						y={L.rowY(i) + L.rowH / 2 + (narrow ? text * 0.36 : -text * 0.15)}
						className="wt-film-type"
						style={{ fontSize: text }}
					>
						{t(row.label)}
					</text>
					{narrow ? null : (
						<text
							x={margin}
							y={L.rowY(i) + L.rowH / 2 + text * 1.05}
							className="wt-film-num wt-film-dim"
							style={{ fontSize: T.small }}
						>
							{`${count(row.volume)} / ${count(row.typical)} / ${count(row.openInterest)}`}
						</text>
					)}
					<rect
						data-f={`bar-${i}`}
						x={L.barX}
						y={L.rowY(i)}
						width={L.barW(vsTypical(row))}
						height={L.rowH}
						rx={4}
						className="wt-film-bar"
						data-tone={vsTypical(row) >= THRESHOLD ? "total" : "neutral"}
					/>
					<text
						data-f={`val-${i}`}
						x={L.barX + L.barW(vsTypical(row)) + 8}
						y={L.rowY(i) + L.rowH / 2 + text * 0.4}
						className="wt-film-num wt-halo"
						style={{ fontSize: text * 1.1 }}
					>
						{ratio(vsTypical(row))}
					</text>
				</g>
			))}
			<text
				data-f="key"
				x={margin}
				y={L.rowY(ROWS.length) - T.small * 0.2}
				className="wt-film-tag"
				style={{ fontSize: T.small * 0.95 }}
			>
				{t([
					"volume / typical / open interest",
					"成交量 / 平常 / 未平仓量",
				]).toUpperCase()}
			</text>
			<g data-f="line">
				<path
					d={`M${L.barX + L.barW(THRESHOLD)} ${L.rowY(0) - 12}V${L.rowY(ROWS.length - 1) + L.rowH + 8}`}
					className="wt-film-riser"
					strokeDasharray="5 4"
				/>
				<text
					x={L.barX + L.barW(THRESHOLD)}
					y={L.rowY(0) - 18}
					textAnchor="middle"
					className="wt-film-num wt-film-accent"
					style={{ fontSize: T.small * 1.05 }}
				>
					{`${THRESHOLD}×`}
				</text>
			</g>
			{[0, 1].map((i) => (
				<text
					key={i}
					data-f={`flag-${i}`}
					// On a phone the flag sits under the call's name, where the counts are on a desktop.
					x={narrow ? margin : margin + room}
					y={
						L.rowY(i) +
						L.rowH / 2 +
						(narrow ? text * 0.36 + T.small * 1.5 : T.small * 0.4)
					}
					textAnchor={narrow ? "start" : "end"}
					className="wt-film-tag wt-film-warn"
					style={{ fontSize: T.small }}
				>
					{t(copy.flag).toUpperCase()}
				</text>
			))}
			{(
				[
					["note-0", copy.legNote],
					["note-1", copy.thinNote],
				] as const
			).map(([name, label], i) => (
				<text
					key={name}
					data-f={name}
					x={margin}
					y={L.noteY(i)}
					className="wt-film-type wt-film-warn"
					style={{ fontSize: text }}
				>
					{t(label)}
				</text>
			))}

			{/* The window. */}
			{headline("w0", copy.w0, copy.w0Short)}
			{headline("w1", copy.w1, copy.w1Short)}
			{headline("w2", copy.w2, copy.w2Short)}
			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart">
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(copy.axis)}
						</text>
						{[0, 200, 400].map((v) => (
							<g key={v}>
								<path
									d={`M${L.left} ${L.y(v)}H${L.right}`}
									className={v === 0 ? "wt-axis" : "wt-grid"}
								/>
								<text
									x={L.left - 8}
									y={L.y(v) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{count(v)}
								</text>
							</g>
						))}
						{[0, 90, 210, 390].map((m) => (
							<text
								key={m}
								x={L.x(m)}
								y={L.bottom + 16}
								textAnchor={m === 0 ? "start" : m === DAY ? "end" : "middle"}
								className="wt-small"
							>
								{clock(m)}
							</text>
						))}
						<path
							data-f="typical"
							d={path(typical)}
							className="wt-line-reference"
							strokeDasharray="6 5"
						/>
						<path data-f="today" d={path(today)} className="wt-line-position" />
						<text
							data-f="today-tag"
							x={L.x(BLOCK_MINUTE) + 8}
							y={L.y(todayBy(DAY)) - 10}
							className="wt-small wt-halo wt-accent"
						>
							{`${t(copy.today)} ${count(CALL_105.volume)}`}
						</text>
						<text
							data-f="typical-tag"
							x={L.x(DAY) - 4}
							y={L.y(CALL_105.typical) - 10}
							textAnchor="end"
							className="wt-small wt-halo"
						>
							{`${t(copy.typicalDay)} ${count(CALL_105.typical)}`}
						</text>
					</g>
				</g>
			</g>
			<g data-f="cursor">
				<path
					d={`M${L.x(0)} ${L.top}V${L.bottom}`}
					className="wt-bracket"
					strokeDasharray="4 3"
				/>
				<circle
					data-f="cursor-typ"
					cx={L.x(0)}
					cy={L.y(0)}
					r={5}
					className="wt-film-ghost"
				/>
			</g>
			<text
				data-f="window"
				x={margin + room}
				y={L.top - 12}
				textAnchor="end"
				className="wt-film-num wt-film-accent"
				style={{ fontSize: T.num }}
			>
				{ratio(AT_ELEVEN)}
			</text>

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
	/** A line draws itself from its start, then takes back its own dashes, if any. */
	const draw = (path: SVGPathElement, time: number, duration = 0.9) => {
		const dash = path.getAttribute("stroke-dasharray");
		const length = path.getTotalLength();
		tl.fromTo(
			path,
			{ opacity: 0, strokeDasharray: length, strokeDashoffset: length },
			{ opacity: 1, strokeDashoffset: 0, duration, ease: "power1.inOut" },
			time,
		);
		if (dash) tl.set(path, { strokeDasharray: dash }, time + duration);
	};
	const heads = ["r0", "r1", "w0", "w1", "w2", "s0", "s1"].map((name) =>
		one(name),
	);
	const rows = ROWS.map((_, i) => one(`row-${i}`));
	/** Every bar and its figure move to a new denominator together. */
	const ratiosTo = (
		f: (row: (typeof ROWS)[number]) => number,
		from: (row: (typeof ROWS)[number]) => number,
		time: number,
	) => {
		ROWS.forEach((row, i) => {
			tl.to(
				one(`bar-${i}`),
				{
					attr: { width: L.barW(f(row)) },
					duration: 0.7,
					ease: "power2.inOut",
				},
				time,
			);
			tl.to(
				one(`val-${i}`),
				{
					attr: { x: L.barX + L.barW(f(row)) + 8 },
					duration: 0.7,
					ease: "power2.inOut",
				},
				time,
			);
			d.count(
				one<SVGTextElement>(`val-${i}`),
				f(row),
				time,
				ratio,
				from(row),
				0.7,
			);
		});
	};
	/** The cursor moves to a minute; the window's ratio counts with it. */
	const cursorTo = (minute: number, from: number, time: number) => {
		tl.to(
			one("cursor"),
			{ x: L.x(minute) - L.x(0), duration: 0.9, ease: "power2.inOut" },
			time,
		);
		tl.to(
			one("cursor-typ"),
			{
				attr: { cy: L.y(typicalBy(minute)) },
				duration: 0.9,
				ease: "power2.inOut",
			},
			time,
		);
		d.count(
			one<SVGTextElement>("window"),
			CALL_105.volume / typicalBy(minute),
			time,
			ratio,
			CALL_105.volume / typicalBy(from),
			0.9,
		);
	};

	d.hidden([
		...flat("q"),
		...heads,
		one("base-typical"),
		one("base-oi"),
		...rows,
		one("key"),
		one("line"),
		one("flag-0"),
		one("flag-1"),
		one("note-0"),
		one("note-1"),
		...kids("chart"),
		one("cursor"),
		one("window"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 5.1);
	word(one("q-big"), 6.4);

	// ——— ratio: two denominators ———
	tl.addLabel("ratio", 9.5);
	hide(flat("q"), 9.5);
	show(heads[0], 9.7, "above");
	show(one("base-typical"), 10.0);
	rows.forEach((row, i) => {
		show(row, 10.2 + i * 0.2, "right");
	});
	// The counts under each name explain the key; a phone has no room for either.
	if (!L.narrow) show(one("key"), 11.0);
	d.swap(heads[0], heads[1], 13.6);
	d.flip(one("base-typical"), one("base-oi"), 14.0);
	tl.set(one("base-typical"), { opacity: 0 }, 14.3);
	ratiosTo(vsOi, vsTypical, 14.2);
	tl.to(
		one(`bar-${ROWS.indexOf(THIN)}`),
		{ attr: { "data-tone": "total" } },
		14.9,
	);
	tl.to(one("bar-0"), { attr: { "data-tone": "neutral" } }, 14.9);

	// ——— window: the same trades, two windows ———
	tl.addLabel("window", 19.5);
	hide([heads[1], one("base-oi"), ...rows, one("key")], 19.5);
	show(heads[2], 19.7, "above");
	d.rise(19.8);
	show(
		kids("chart").filter((el) => !el.getAttribute("data-f")),
		20.0,
	);
	draw(one<SVGPathElement>("typical"), 20.4, 1.2);
	show(one("typical-tag"), 21.4);
	draw(one<SVGPathElement>("today"), 20.8, 1.4);
	show(one("today-tag"), 22.2);
	d.swap(heads[2], heads[3], 23.2);
	show(one("cursor"), 23.4);
	tl.set(one("cursor"), { x: L.x(ELEVEN) - L.x(0) }, 23.4);
	tl.set(one("cursor-typ"), { attr: { cy: L.y(typicalBy(ELEVEN)) } }, 23.4);
	d.slam(one("window"), 23.8);
	d.swap(heads[3], heads[4], 26.0);
	cursorTo(DAY, ELEVEN, 26.4);

	// ——— screen: a threshold picks where to look ———
	tl.addLabel("screen", 29.5);
	hide([heads[4], one("cursor"), one("window")], 29.5);
	d.sink(29.5);
	// Back to typical volume for the screen.
	ratiosTo(vsTypical, vsOi, 29.5);
	ROWS.forEach((row, i) => {
		tl.set(
			one(`bar-${i}`),
			{
				attr: {
					"data-tone": vsTypical(row) >= THRESHOLD ? "total" : "neutral",
				},
			},
			29.5,
		);
	});
	show(heads[5], 29.9, "above");
	show(one("base-typical"), 30.1);
	rows.forEach((row, i) => {
		show(row, 30.2 + i * 0.15, "right");
	});
	draw(
		one<SVGPathElement>("line").firstElementChild as SVGPathElement,
		30.9,
		0.5,
	);
	tl.set(one("line"), { opacity: 1 }, 30.9);
	d.pop(one("flag-0"), 31.6);
	d.pop(one("flag-1"), 31.8);
	d.swap(heads[5], heads[6], 33.4);
	show(one("note-0"), 33.8);
	show(one("note-1"), 34.2);

	// ——— claim ———
	tl.addLabel("claim", 37);
	hide(
		[
			heads[6],
			one("base-typical"),
			...rows,
			one("line"),
			one("flag-0"),
			one("flag-1"),
			one("note-0"),
			one("note-1"),
		],
		37.0,
	);
	word(one("z-big"), 37.3);
	show(one("z-sub"), 37.7);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
	return tl;
}

export const unusualActivityFilm: Film = {
	id: "unusual-activity",
	label: [
		`Unusual activity, as a short film: four ALFA calls against their typical volume, from ${ratio(Math.min(...ROWS.map(vsTypical)))} to ${ratio(vsTypical(CALL_105))}, and against open interest, where the thin Dec 20 110 call leads at ${ratio(vsOi(THIN))}; the Oct 18 105 call's ${count(CALL_105.volume)} contracts against a typical day, ${ratio(AT_ELEVEN)} by 11:00 and ${ratio(AT_CLOSE)} by the close; and a ${THRESHOLD}× screen that flags two calls, one a single spread leg and one ${THIN.volume} contracts in a thin series`,
		`异常成交短片：四张 ALFA 看涨对比平常成交量，从 ${ratio(Math.min(...ROWS.map(vsTypical)))} 到 ${ratio(vsTypical(CALL_105))}；对比未平仓量时，稀薄的 12月20日 110 看涨以 ${ratio(vsOi(THIN))} 居首；10月18日 105 看涨的 ${count(CALL_105.volume)} 张对比平常一天：截至 11:00 为 ${ratio(AT_ELEVEN)}，截至收盘为 ${ratio(AT_CLOSE)}；以及一个 ${THRESHOLD}× 筛选器标出的两张合约：一个是单笔价差的一条腿，另一个是稀薄合约里的 ${THIN.volume} 张`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Unusual activity", "异常成交"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "ratio", label: ["The denominator", "分母"] },
		{ id: "window", label: ["The window", "窗口"] },
		{ id: "screen", label: ["A screen", "筛选"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
