import { type Copy, count, pick, signedCount } from "@/content/world";
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
	byDesc,
	FLOOR,
	MOVERS,
	oiChange,
	PEERS,
	ratio,
	tuesday,
	typical,
	volumeOf,
} from "./rank-symbols-model";

/*
 * Rankings, as a film. Which of ALFA's peers is most unusual today? Two columns answer
 * with lines between them: by contracts CRUX leads; against each name's own normal DUNE
 * leads and CRUX falls to last, and GLYN sits under the floor. The hero is a ranking by
 * size of open-interest change, which puts CRUX's −900 first; signed, it is last, and
 * glowing brackets lock on it. Last, ALFA rises from #2 to #1 on the same 2,400
 * contracts, because CRUX fell.
 *
 *   open      0–4        "Rankings"
 *   question  4–8.6      most unusual today?
 *   metric    8.6–18.4   by contracts; against its own normal; under the floor
 *   sign      18.4–28    hero: by size; by signed change
 *   move      28–33.6    Monday; Tuesday: ALFA #1, standing still
 *   claim     33.6–38    order without prediction
 *   next      38–40.5    Next: contract neighborhoods
 */

const END = 40.5;
type Entry = { name: string; value: string; dim?: boolean; tone?: string };
type Board = { title: Copy; entries: Entry[] };

const rel = (name: string) => volumeOf(name) / typical[name];
const RAW: Board = {
	title: ["by contracts", "按张数"],
	entries: byDesc([...PEERS], volumeOf).map((name) => ({
		name,
		value: count(volumeOf(name)),
		dim: volumeOf(name) < FLOOR,
	})),
};
const RELATIVE: Board = {
	title: ["vs its own normal", "对比自身常态"],
	entries: byDesc([...PEERS], rel).map((name) => ({
		name,
		value: ratio(rel(name)),
		dim: volumeOf(name) < FLOOR,
	})),
};
const NAMES = Object.keys(oiChange);
const SIZE: Board = {
	title: ["OI change, by size", "未平仓变化，按大小"],
	entries: byDesc(NAMES, (n) => Math.abs(oiChange[n])).map((name) => ({
		name,
		value: count(Math.abs(oiChange[name])),
	})),
};
const SIGNED: Board = {
	title: ["OI change, signed", "未平仓变化，带符号"],
	entries: byDesc(NAMES, (n) => oiChange[n]).map((name) => ({
		name,
		value: signedCount(oiChange[name]),
		tone: oiChange[name] < 0 ? "wt-film-loss" : "wt-film-gain",
	})),
};
const MONDAY: Board = {
	title: ["Monday", "周一"],
	entries: byDesc(MOVERS, volumeOf).map((name) => ({
		name,
		value: count(volumeOf(name)),
	})),
};
const TUESDAY: Board = {
	title: ["Tuesday", "周二"],
	entries: byDesc(MOVERS, (n) => tuesday[n]).map((name) => ({
		name,
		value: count(tuesday[name]),
	})),
};
const PAIRS: [string, Board, Board][] = [
	["m", RAW, RELATIVE],
	["s", SIZE, SIGNED],
	["d", MONDAY, TUESDAY],
];

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const colW = narrow ? room * 0.42 : room * 0.34;
	return {
		...frame,
		colX: [margin, margin + room - colW],
		colW,
		titleY: H * (narrow ? 0.3 : 0.3),
		rowY: (i: number) =>
			H * (narrow ? 0.35 : 0.36) + i * H * (narrow ? 0.09 : 0.1),
		rowH: H * (narrow ? 0.068 : 0.075),
		noteY: H * (narrow ? 0.82 : 0.84),
	};
}

const copy = {
	title: ["Rankings", "排名"],
	titleSub: ["order without prediction", "排序不等于预测"],
	qTag: ["ALFA and its peers · Monday", "ALFA 与同类 · 周一"],
	qLine: ["Which one is most unusual today?", "今天哪一个最异常？"],
	qBig: ["Rank them.", "排个名。"],
	mHead: [
		`By contracts, ${RAW.entries[0].name} leads.`,
		`按成交张数，${RAW.entries[0].name} 领先。`,
	],
	m2Head: [
		`Against normal: ${RELATIVE.entries[0].name} first, ${RAW.entries[0].name} last.`,
		`对比常态：${RELATIVE.entries[0].name} 第一，${RAW.entries[0].name} 最后。`,
	],
	sHead: [
		"Ranked by size of change, CRUX is first.",
		"按变化大小排名，CRUX 第一。",
	],
	s2Head: ["Signed, its fall puts it last.", "带上符号，它的减少排到最后。"],
	dHead: ["Monday by contracts: ALFA is #2.", "周一按张数：ALFA 排第二。"],
	d2Head: ["Tuesday: #1, without trading more.", "周二：第一，成交量没变。"],
	under: [`under ${count(FLOOR)}`, `低于 ${count(FLOOR)}`],
	note: [
		"#1 of three by contracts · up because a peer fell",
		"三个中按张数第一 · 因同类下跌而上升",
	],
	claimBig: ["A rank is an order, not a forecast.", "排名是顺序，不是预测。"],
	claimSub: [
		"Say what it ranks by, and which way.",
		"说清按什么排，以及朝哪个方向。",
	],
	nextBig: ["Next: contract neighborhoods", "下一课：合约邻域"],
	nextSub: ["strikes and expiries in context", "结合行权价与到期日来看"],
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
	const text = narrow ? T.small * 1.15 : T.body * 1.05;
	/** One column of a bump chart: a title, then each name at its rank. */
	const column = (key: string, board: Board, side: 0 | 1) => (
		<g data-f={`${key}-col${side}`}>
			<text
				x={L.colX[side]}
				y={L.titleY}
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(board.title).toUpperCase()}
			</text>
			{board.entries.map((entry, i) => (
				<g key={entry.name} opacity={entry.dim ? 0.45 : 1}>
					<rect
						x={L.colX[side]}
						y={L.rowY(i)}
						width={L.colW}
						height={L.rowH}
						rx={9}
						className={
							i === 0 && !entry.dim ? "wt-focus-shape" : "wt-panel-shape"
						}
					/>
					<text
						x={L.colX[side] + 12}
						y={L.rowY(i) + L.rowH / 2 + text * 0.36}
						className="wt-film-num wt-film-dim"
						style={{ fontSize: text * 0.9 }}
					>
						{`#${i + 1}`}
					</text>
					<text
						x={L.colX[side] + (narrow ? 38 : 52)}
						y={L.rowY(i) + L.rowH / 2 + text * 0.36}
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{entry.name}
					</text>
					<text
						x={L.colX[side] + L.colW - 12}
						y={L.rowY(i) + L.rowH / 2 + text * 0.36}
						textAnchor="end"
						className={`wt-film-num ${entry.tone ?? "wt-film-accent"}`}
						style={{ fontSize: text }}
					>
						{entry.value}
					</text>
				</g>
			))}
		</g>
	);
	/** The lines that follow each name from one column to the other. */
	const links = (key: string, from: Board, to: Board) =>
		from.entries.map((entry, i) => {
			const j = to.entries.findIndex((e) => e.name === entry.name);
			const x0 = L.colX[0] + L.colW + 6;
			const x1 = L.colX[1] - 6;
			const y0 = L.rowY(i) + L.rowH / 2;
			const y1 = L.rowY(j) + L.rowH / 2;
			const mid = (x0 + x1) / 2;
			return (
				<path
					key={entry.name}
					data-f={`${key}-link-${entry.name}`}
					d={`M${x0} ${y0}C${mid} ${y0} ${mid} ${y1} ${x1} ${y1}`}
					className={j < i ? "wt-film-riser" : "wt-film-link"}
					style={j < i ? undefined : { strokeWidth: 1.5 }}
				/>
			);
		});
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

			{headline("m-head", copy.mHead)}
			{/* Each answer, a line under its question, as the second column lands. */}
			<Lines
				name="m2-head"
				text={t(copy.m2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.mHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{headline("s-head", copy.sHead)}
			<Lines
				name="s2-head"
				text={t(copy.s2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.sHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{headline("d-head", copy.dHead)}
			<Lines
				name="d2-head"
				text={t(copy.d2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.dHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{PAIRS.map(([key, from, to]) => (
				<g key={key}>
					{column(key, from, 0)}
					{links(key, from, to)}
					{column(key, to, 1)}
				</g>
			))}
			<Brackets name="lock-rank" glow />
			<text
				data-f="under"
				x={L.colX[0] + L.colW - 12}
				y={L.rowY(RAW.entries.length - 1) + L.rowH + T.small * 1.5}
				textAnchor="end"
				className="wt-film-tag wt-film-warn"
				style={{ fontSize: T.small }}
			>
				{t(copy.under).toUpperCase()}
			</text>
			<Lines
				name="note"
				text={t(copy.note)}
				x={margin}
				y={L.noteY}
				size={narrow ? T.small * 1.1 : T.body}
				maxWidth={room}
				anchor="start"
				className="wt-film-type wt-film-warn"
			/>

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
	/** A line lands slightly large and settles, without overshoot. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	/** A line draws itself from its start, then takes back its own dashes, if any. */
	const draw = (path: SVGPathElement, time: number) => {
		const dash = getComputedStyle(path).strokeDasharray;
		const length = path.getTotalLength();
		tl.fromTo(
			path,
			{ opacity: 0, strokeDasharray: length, strokeDashoffset: length },
			{ opacity: 1, strokeDashoffset: 0, duration: 0.6, ease: "power2.out" },
			time,
		);
		tl.set(
			path,
			{ strokeDasharray: dash === "none" ? "none" : dash },
			time + 0.6,
		);
	};
	const heads = [
		"m-head",
		"m2-head",
		"s-head",
		"s2-head",
		"d-head",
		"d2-head",
	].map((name) => one(name));
	const lockRank = one<SVGGraphicsElement>("lock-rank");
	const col = (key: string, side: 0 | 1) => one(`${key}-col${side}`);
	const linksOf = (key: string, board: Board) =>
		board.entries.map((entry) =>
			one<SVGPathElement>(`${key}-link-${entry.name}`),
		);
	/** Each name's rows in a column, to bring in one by one. */
	const rows = (key: string, side: 0 | 1) => kids(`${key}-col${side}`);
	const pair = (key: string, from: Board, at: number, second: number) => {
		show(rows(key, 0), at, "right");
		tl.set(col(key, 0), { opacity: 1 }, at);
		linksOf(key, from).forEach((link, i) => {
			draw(link, second + i * 0.1);
		});
		tl.set(col(key, 1), { opacity: 1 }, second + 0.3);
		show(rows(key, 1), second + 0.3, "right");
	};

	d.hidden([
		...flat("q"),
		...heads,
		...PAIRS.flatMap(([key, from]) => [
			col(key, 0),
			col(key, 1),
			...linksOf(key, from),
		]),
		one("under"),
		one("note"),
		lockRank,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 4.8);
	word(one("q-big"), 5.1);

	// ——— metric: size, or against normal ———
	tl.addLabel("metric", 8.6);
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	pair("m", RAW, 9.2, 12.4);
	show(heads[1], 13.4);
	show(one("under"), 14.6);

	// ——— sign: the hero. Size, or direction? ———
	tl.addLabel("sign", 18.4);
	d.swap([heads[0], heads[1]], heads[2], 18.4);
	hide([col("m", 0), col("m", 1), ...linksOf("m", RAW), one("under")], 18.4);
	pair("s", SIZE, 19.4, 22.8);
	// CRUX's row in the signed column: first by size, last once the sign is back.
	const crux = SIGNED.entries.findIndex((entry) => entry.name === "CRUX");
	d.lock(lockRank, 24.4, { around: rows("s", 1)[1 + crux], pad: 4 });
	tl.addLabel("hero-lock", 24.4);
	show(heads[3], 24.4);

	// ——— move: a rank that moves while the name doesn't ———
	tl.addLabel("move", 28);
	d.swap([heads[2], heads[3]], heads[4], 28.0);
	hide([col("s", 0), col("s", 1), ...linksOf("s", SIZE), lockRank], 28.0);
	pair("d", MONDAY, 28.6, 29.4);
	show(one("note"), 30.0);
	show(heads[5], 30.0);

	// ——— claim ———
	tl.addLabel("claim", 33.6);
	hide(
		[
			heads[4],
			heads[5],
			col("d", 0),
			col("d", 1),
			...linksOf("d", MONDAY),
			one("note"),
		],
		33.6,
	);
	word(one("z-big"), 33.9);
	show(one("z-sub"), 34.3);

	// ——— next ———
	tl.addLabel("next", 38);
	hide(kids("claim"), 38.0);
	d.close(38.0);
	return tl;
}

export const rankSymbolsFilm: Film = {
	id: "rank-symbols",
	label: [
		`Rankings, as a short film: ALFA's peers ranked by contracts, where ${RAW.entries[0].name} leads, and against their own normal volume, where ${RELATIVE.entries[0].name} leads and ${RAW.entries[0].name} is last, with GLYN under a ${count(FLOOR)}-contract floor; Monday's open-interest change ranked by size, where CRUX's ${signedCount(oiChange.CRUX)} comes first, and signed, where it comes last; and ALFA rising from second to first on the same ${count(tuesday.ALFA)} contracts because CRUX fell`,
		`排名短片：ALFA 的同类按张数排名，${RAW.entries[0].name} 领先；对比各自的常态成交量，${RELATIVE.entries[0].name} 领先而 ${RAW.entries[0].name} 垫底，GLYN 低于 ${count(FLOOR)} 张门槛；周一未平仓量变化按大小排名，CRUX 的 ${signedCount(oiChange.CRUX)} 排第一，带符号则排最后；以及 ALFA 成交量仍为 ${count(tuesday.ALFA)} 张，却因 CRUX 下跌而从第二升到第一`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Rankings", "排名"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "metric", label: ["The metric", "指标"] },
		{ id: "sign", label: ["The sign", "符号"] },
		{ id: "move", label: ["A move", "名次变化"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
