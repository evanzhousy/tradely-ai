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
	toneColor,
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
 * with lines between them: by contracts CRUX leads; against each name's own normal, DUNE
 * leads and CRUX is last among qualified names, while GLYN sits under the floor. The hero
 * is a ranking by size of open-interest change, which puts CRUX's −900 first; signed, it is
 * last, and glowing brackets lock on it. Last, ALFA rises from #2 to #1 on the same 2,400
 * contracts, because CRUX fell.
 *
 *   open      0–4        "Rankings"
 *   question  4–8.6      most unusual today?
 *   metric    8.6–23.1    two successive normalizations; relative-side floor disclosure
 *   sign      23.1–32.85  hero: by size; by signed change
 *   move      32.85–40.7  Monday; Tuesday: ALFA #1, standing still
 *   claim     40.7–45.1   order without prediction
 *   next      45.1–47.5   Next: contract neighborhoods
 */

const END = 47.5;
type Entry = {
	name: string;
	value: string;
	rankLabel?: string;
	dim?: boolean;
	tone?: string;
};
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
const qualifiedRelativeNames = byDesc(
	PEERS.filter((name) => volumeOf(name) >= FLOOR),
	rel,
);
const belowFloorRelativeNames = PEERS.filter((name) => volumeOf(name) < FLOOR);
const RELATIVE: Board = {
	title: ["vs 20-day avg", "对比20日均量"],
	entries: [
		...qualifiedRelativeNames.map((name) => ({
			name,
			value: ratio(rel(name)),
		})),
		...belowFloorRelativeNames.map((name) => ({
			name,
			value: ratio(rel(name)),
			rankLabel: "N/R",
			dim: true,
		})),
	],
};
const NAMES = Object.keys(oiChange);
const SIZE: Board = {
	title: ["OI change size", "未平仓变化大小"],
	entries: byDesc(NAMES, (n) => Math.abs(oiChange[n])).map((name) => ({
		name,
		value: count(Math.abs(oiChange[name])),
	})),
};
const SIGNED: Board = {
	title: ["signed OI change", "带符号的未平仓变化"],
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
	const colW = narrow ? room * 0.43 : room * 0.34;
	return {
		...frame,
		colX: [margin, margin + room - colW],
		colW,
		titleY: H * (narrow ? 0.275 : 0.3),
		rowY: (i: number) =>
			H * (narrow ? 0.305 : 0.36) + i * H * (narrow ? 0.107 : 0.1),
		rowH: H * (narrow ? 0.094 : 0.075),
		qualificationH: narrow ? 22 : 0,
		noteY: H * (narrow ? 0.82 : 0.84),
	};
}

const copy = {
	title: ["Rankings", "排名"],
	titleSub: ["order without prediction", "排序不等于预测"],
	qTag: ["ALFA and its peers · Monday", "ALFA 与同类 · 周一"],
	qLine: ["Which one is most unusual today?", "今天哪一个最异常？"],
	qBig: ["Rank them.", "排个名。"],
	mHead: ["Contracts, or multiples of normal?", "按张数，还是常态的倍数？"],
	m2Head: [
		`Among qualified names: ${qualifiedRelativeNames[0]} first, ${qualifiedRelativeNames[qualifiedRelativeNames.length - 1]} last.`,
		`合格标的中：${qualifiedRelativeNames[0]} 第一，${qualifiedRelativeNames[qualifiedRelativeNames.length - 1]} 最后。`,
	],
	sHead: ["Magnitude, or signed OI change?", "按变化大小，还是带符号？"],
	s2Head: ["Signed: CRUX’s fall puts it last.", "带符号：CRUX 的减少排最后。"],
	dHead: [
		"Can ALFA rise without trading more?",
		"成交量不变，ALFA 能升名次吗？",
	],
	d2Head: ["Tuesday: #1, without trading more.", "周二：第一，成交量没变。"],
	under: [`under ${count(FLOOR)}`, `低于 ${count(FLOOR)}`],
	normal: ["Today ÷ 20-day average", "今日张数 ÷ 20日均量"],
	note: ["CRUX traded fewer contracts.", "CRUX 成交张数更少。"],
	claimBig: ["A rank is an order, not a forecast.", "排名是顺序，不是预测。"],
	claimSub: ["Say its basis and direction.", "说明排名依据和方向。"],
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
	const text = narrow ? 18 : T.body * 1.05;
	const nameSize = narrow ? 14 : text;
	const qualificationSize = narrow ? 14 : T.small;
	const equationSize = narrow ? 16 : T.body;
	const rowTop = (key: string, board: Board, side: 0 | 1, i: number) =>
		L.rowY(i) +
		(narrow && key === "m" && side === 1
			? board.entries.slice(0, i).filter((entry) => entry.dim).length *
				L.qualificationH
			: 0);
	/** Entrance wrappers leave each inner row's qualification intact. */
	const column = (key: string, board: Board, side: 0 | 1) => (
		<g data-f={`${key}-col${side}`}>
			<Lines
				name={`${key}-title${side}`}
				text={narrow ? t(board.title) : t(board.title).toUpperCase()}
				x={L.colX[side]}
				y={L.titleY}
				size={narrow ? 13 : T.small}
				maxWidth={L.colW}
				anchor="start"
				className={narrow ? "wt-film-type wt-film-dim" : "wt-film-tag"}
			/>
			{board.entries.map((entry, i) => {
				const hero = key === "s" && side === 1 && entry.name === "CRUX";
				const top = rowTop(key, board, side, i);
				const rowH =
					L.rowH * (hero ? 1.9 : 1) +
					(narrow && key === "m" && side === 1 && entry.dim
						? L.qualificationH
						: 0);
				const baseline =
					top + (narrow ? 18 : hero ? text * 1.4 : rowH / 2 + text * 0.36);
				const focus =
					key === "d" ? entry.name === "ALFA" : key !== "s" && i === 0;
				return (
					<g key={entry.name} data-f={`${key}-row${side}-${entry.name}`}>
						<g opacity={entry.dim ? 0.45 : 1}>
							<rect
								x={L.colX[side]}
								y={top}
								width={L.colW}
								height={rowH}
								rx={9}
								className={
									focus && !entry.dim ? "wt-focus-shape" : "wt-panel-shape"
								}
								style={hero ? { stroke: toneColor("down") } : undefined}
							/>
							<text
								x={L.colX[side] + 12}
								y={baseline}
								className="wt-film-num wt-film-dim"
								style={{ fontSize: narrow ? 13 : text * 0.9 }}
							>
								{entry.rankLabel ?? `#${i + 1}`}
							</text>
							<text
								x={L.colX[side] + (narrow ? 38 : 52)}
								y={baseline}
								className="wt-film-num"
								style={{ fontSize: nameSize }}
							>
								{entry.name}
							</text>
							<text
								x={L.colX[side] + L.colW - 12}
								y={
									hero
										? top + rowH - text * 0.55
										: narrow
											? top + L.rowH - 7
											: baseline
								}
								textAnchor="end"
								className={`wt-film-num ${entry.tone ?? "wt-film-accent"}`}
								style={{ fontSize: text * (hero ? 1.7 : 1) }}
							>
								{entry.value}
							</text>
						</g>
					</g>
				);
			})}
		</g>
	);
	/** The lines that follow each name from one column to the other. */
	const links = (key: string, from: Board, to: Board) =>
		from.entries.map((entry, i) => {
			const j = to.entries.findIndex((e) => e.name === entry.name);
			const x0 = L.colX[0] + L.colW + 6;
			const x1 = L.colX[1] - 6;
			const y0 = rowTop(key, from, 0, i) + L.rowH / 2;
			const y1 = rowTop(key, to, 1, j) + L.rowH / 2;
			const mid = (x0 + x1) / 2;
			return (
				<path
					key={entry.name}
					data-f={`${key}-link-${entry.name}`}
					d={`M${x0} ${y0}C${mid} ${y0} ${mid} ${y1} ${x1} ${y1}`}
					className={j < i ? "wt-film-riser" : "wt-film-link"}
					strokeOpacity={entry.dim ? 0.45 : 1}
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
			<Word
				name="normal-label"
				x={margin}
				y={H * 0.81}
				size={narrow ? 14 : T.body}
				anchor="start"
				className="wt-film-type wt-film-dim"
			>
				{t(copy.normal)}
			</Word>
			{["DUNE", "CRUX"].map((name, i) => (
				<text
					key={name}
					data-f={`normal-equation-${name}`}
					x={margin}
					y={H * (0.865 + i * 0.055)}
					className="wt-film-num"
					style={{ fontSize: equationSize }}
				>
					{`${name} ${count(volumeOf(name))} ÷ ${count(typical[name])} `}
					<tspan className="wt-film-accent">
						{`${name === "DUNE" ? "=" : "≈"} ${ratio(rel(name))}`}
					</tspan>
				</text>
			))}
			<Brackets name="lock-rank" glow />
			<text
				data-f="under"
				x={L.colX[0] + L.colW - 12}
				y={L.rowY(RAW.entries.length - 1) + L.rowH + qualificationSize * 1.5}
				textAnchor="end"
				className="wt-film-tag wt-film-warn"
				style={{ fontSize: qualificationSize }}
			>
				{t(copy.under).toUpperCase()}
			</text>
			<Word
				name="under-relative"
				x={L.colX[1] + (narrow ? 12 : L.colW - 12)}
				y={
					narrow
						? rowTop(
								"m",
								RELATIVE,
								1,
								RELATIVE.entries.findIndex((entry) => entry.dim),
							) +
							L.rowH +
							16
						: L.rowY(RAW.entries.length - 1) + L.rowH + T.small * 1.5
				}
				size={qualificationSize}
				anchor={narrow ? "start" : "end"}
				className="wt-film-tag wt-film-warn"
			>
				{narrow ? t(copy.under) : `GLYN · ${t(copy.under)}`}
			</Word>
			<Lines
				name="note"
				text={t(copy.note)}
				x={margin}
				y={L.noteY}
				size={narrow ? 14 : T.body}
				maxWidth={room}
				anchor="start"
				className="wt-film-type"
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
	/** Preserve dashed connectors throughout the draw, using the kit's reveal mask. */
	const draw = (path: SVGPathElement, time: number) =>
		d.trace(path, time, { duration: 0.6, ease: "power2.out" });
	/** Crowded rows and equations arrive in place, with no flight across a neighbour. */
	const enter = (target: Element, time: number) =>
		tl.fromTo(target, { opacity: 0 }, { opacity: 1, duration: 0.5 }, time);

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
	const row = (key: string, side: 0 | 1, name: string) =>
		one<SVGGraphicsElement>(`${key}-row${side}-${name}`);
	const columnMarks = (key: string, side: 0 | 1, board: Board) => [
		one(`${key}-title${side}`),
		...board.entries.map((entry) => row(key, side, entry.name)),
	];
	/** Build in rank order; expose the last row/link settlement to its answer. */
	const pair = (
		key: string,
		from: Board,
		to: Board,
		at: number,
		secondAt: number | ((firstSettled: number) => number),
	) => {
		const firstSettled = at + (from.entries.length - 1) * 0.1 + 0.5;
		const second =
			typeof secondAt === "number" ? secondAt : secondAt(firstSettled);
		tl.set(col(key, 0), { opacity: 1 }, at);
		enter(one(`${key}-title0`), at);
		from.entries.forEach((entry, i) => {
			enter(row(key, 0, entry.name), at + i * 0.1);
		});
		tl.set(col(key, 1), { opacity: 1 }, second);
		enter(one(`${key}-title1`), second);
		to.entries.forEach((entry, i) => {
			draw(one<SVGPathElement>(`${key}-link-${entry.name}`), second + i * 0.2);
			enter(row(key, 1, entry.name), second + 0.3 + i * 0.2);
		});
		return {
			firstSettled,
			secondSettled: second + (to.entries.length - 1) * 0.2 + 0.8,
		};
	};
	const normal = [
		one("normal-label"),
		one("normal-equation-DUNE"),
		one("normal-equation-CRUX"),
	];

	d.hidden([
		...flat("q"),
		...heads,
		...PAIRS.flatMap(([key, from, to]) => [
			col(key, 0),
			col(key, 1),
			...columnMarks(key, 0, from),
			...columnMarks(key, 1, to),
			...linksOf(key, from),
		]),
		...normal,
		one("under"),
		one("under-relative"),
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
	// Whole compact equations replace separate operands/results; each stays frame-true.
	const metric = pair(
		"m",
		RAW,
		RELATIVE,
		9.2,
		(settled) => settled + 2.7 + 0.5 + 1 + 0.5 + 1,
	);
	const normalizationAt = metric.firstSettled + 2.7; // 12.70
	const duneSettled = normalizationAt + 0.5;
	const cruxAt = duneSettled + 1;
	// The raw board still rests for 2.70 s before normalization begins.
	enter(one("normal-label"), normalizationAt);
	enter(one("under"), normalizationAt);
	enter(one("normal-equation-DUNE"), normalizationAt);
	enter(one("normal-equation-CRUX"), cruxAt);
	const metricAnswerAt = metric.secondSettled + 1; // 18.10
	show(heads[1], metricAnswerAt);
	// A further qualification, after the answer has settled and rested for a second.
	enter(one("under-relative"), metricAnswerAt + 1.5); // 19.60

	// ——— sign: the hero. Size, or direction? ———
	tl.addLabel("sign", 23.1);
	d.swap([heads[0], heads[1]], heads[2], 23.1);
	hide(
		[
			col("m", 0),
			col("m", 1),
			...linksOf("m", RAW),
			one("under"),
			one("under-relative"),
			...normal,
		],
		23.1,
	);
	const sign = pair("s", SIZE, SIGNED, 23.45, (settled) => settled + 2.9);
	// The enlarged, two-line loss row and every connector settle before the lock fits.
	const heroAt = sign.secondSettled + 1; // 29.25
	d.lock(lockRank, heroAt, { around: row("s", 1, "CRUX"), pad: 4 });
	tl.addLabel("hero-lock", heroAt);
	show(heads[3], heroAt);

	// ——— move: a rank that moves while the name doesn't ———
	// Preserve the 3.15 s stand from bracket settlement and the 3.60 s answer hold.
	const moveAt = heroAt + 3.6; // 32.85
	tl.addLabel("move", moveAt);
	d.swap([heads[2], heads[3]], heads[4], moveAt);
	hide([col("s", 0), col("s", 1), ...linksOf("s", SIZE), lockRank], moveAt);
	const move = pair(
		"d",
		MONDAY,
		TUESDAY,
		moveAt + 0.35,
		(settled) => settled + 1,
	);
	// ALFA's 2,400 stays anchored on Monday as its matching Tuesday row arrives first.
	const answerAt = move.secondSettled + 1; // 37.10
	show(one("note"), answerAt);
	show(heads[5], answerAt);

	// ——— claim ———
	const claimAt = answerAt + 3.6; // 40.70
	tl.addLabel("claim", claimAt);
	hide(
		[
			heads[4],
			heads[5],
			col("d", 0),
			col("d", 1),
			...linksOf("d", MONDAY),
			one("note"),
		],
		claimAt,
	);
	word(one("z-big"), claimAt + 0.3);
	show(one("z-sub"), claimAt + 0.7);

	// ——— next ———
	const nextAt = claimAt + 4.4; // 45.10; the end card's retained final frame continues
	tl.addLabel("next", nextAt);
	hide(kids("claim"), nextAt);
	d.close(nextAt);
	return tl;
}

export const rankSymbolsFilm: Film = {
	id: "rank-symbols",
	label: [
		`Rankings, as a short film: ALFA's peers ranked by contracts, where ${RAW.entries[0].name} leads, and against their own normal volume, where ${qualifiedRelativeNames[0]} leads and ${qualifiedRelativeNames[qualifiedRelativeNames.length - 1]} is last among names at or above the ${count(FLOOR)}-contract floor, with GLYN below it; Monday's open-interest change ranked by size, where CRUX's ${signedCount(oiChange.CRUX)} comes first, and signed, where it comes last; and ALFA rising from second to first on the same ${count(tuesday.ALFA)} contracts because CRUX fell`,
		`排名短片：ALFA 的同类按张数排名，${RAW.entries[0].name} 领先；对比各自的常态成交量，在达到 ${count(FLOOR)} 张门槛的标的中，${qualifiedRelativeNames[0]} 领先、${qualifiedRelativeNames[qualifiedRelativeNames.length - 1]} 垫底，GLYN 低于门槛；周一未平仓量变化按大小排名，CRUX 的 ${signedCount(oiChange.CRUX)} 排第一，带符号则排最后；以及 ALFA 成交量仍为 ${count(tuesday.ALFA)} 张，却因 CRUX 下跌而从第二升到第一`,
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
