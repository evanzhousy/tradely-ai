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
 *   metric    8.6–22.7    contracts divided by the 20-day average; under the floor
 *   sign      22.7–32.55  hero: by size; by signed change
 *   move      32.55–40.5  Monday; Tuesday: ALFA #1, standing still
 *   claim     40.5–44.9   order without prediction
 *   next      44.9–47.4   Next: contract neighborhoods
 */

const END = 47.4;
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
	title: ["vs 20-day avg", "对比20日均量"],
	entries: byDesc([...PEERS], rel).map((name) => ({
		name,
		value: ratio(rel(name)),
		dim: volumeOf(name) < FLOOR,
	})),
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
	mHead: ["Contracts, or multiples of normal?", "按张数，还是常态的倍数？"],
	m2Head: [
		`Against normal: ${RELATIVE.entries[0].name} first, ${RAW.entries[0].name} last.`,
		`对比常态：${RELATIVE.entries[0].name} 第一，${RAW.entries[0].name} 最后。`,
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
	/** Entrance wrappers leave each inner row's qualification intact. */
	const column = (key: string, board: Board, side: 0 | 1) => (
		<g data-f={`${key}-col${side}`}>
			<text
				data-f={`${key}-title${side}`}
				x={L.colX[side]}
				y={L.titleY}
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(board.title).toUpperCase()}
			</text>
			{board.entries.map((entry, i) => {
				const hero = key === "s" && side === 1 && entry.name === "CRUX";
				const rowH = L.rowH * (hero ? 1.9 : 1);
				const baseline =
					L.rowY(i) + (hero ? text * 1.4 : rowH / 2 + text * 0.36);
				const focus =
					key === "d" ? entry.name === "ALFA" : key !== "s" && i === 0;
				return (
					<g key={entry.name} data-f={`${key}-row${side}-${entry.name}`}>
						<g opacity={entry.dim ? 0.45 : 1}>
							<rect
								x={L.colX[side]}
								y={L.rowY(i)}
								width={L.colW}
								height={rowH}
								rx={9}
								className={
									focus && !entry.dim ? "wt-focus-shape" : "wt-panel-shape"
								}
								style={hero ? { stroke: "var(--diagram-loss)" } : undefined}
							/>
							<text
								x={L.colX[side] + 12}
								y={baseline}
								className="wt-film-num wt-film-dim"
								style={{ fontSize: text * 0.9 }}
							>
								{`#${i + 1}`}
							</text>
							<text
								x={L.colX[side] + (narrow ? 38 : 52)}
								y={baseline}
								className="wt-film-num"
								style={{ fontSize: text }}
							>
								{entry.name}
							</text>
							<text
								x={L.colX[side] + L.colW - 12}
								y={hero ? L.rowY(i) + rowH - text * 0.55 : baseline}
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
			const y0 = L.rowY(i) + L.rowH / 2;
			const y1 = L.rowY(j) + L.rowH / 2;
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
				size={T.body}
				anchor="start"
				className="wt-film-type wt-film-dim"
			>
				{t(copy.normal)}
			</Word>
			{["DUNE", "CRUX"].map((name, i) => (
				<g key={name}>
					<Word
						name={`normal-operands-${name}`}
						x={margin}
						y={H * (0.865 + i * 0.055)}
						size={T.body}
						anchor="start"
						className="wt-film-num"
					>
						{`${name} ${count(volumeOf(name))} ÷ ${count(typical[name])}`}
					</Word>
					<Word
						name={`normal-result-${name}`}
						x={margin + room}
						y={H * (0.865 + i * 0.055)}
						size={T.body}
						anchor="end"
						className="wt-film-num wt-film-accent"
					>
						{`${name === "DUNE" ? "=" : "≈"} ${ratio(rel(name))}`}
					</Word>
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
		const firstSettled = at + 0.1 + (from.entries.length - 1) * 0.1 + 0.5;
		const second =
			typeof secondAt === "number" ? secondAt : secondAt(firstSettled);
		tl.set(col(key, 0), { opacity: 1 }, at);
		enter(one(`${key}-title0`), at);
		from.entries.forEach((entry, i) => {
			enter(row(key, 0, entry.name), at + 0.1 + i * 0.1);
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
		...["DUNE", "CRUX"].flatMap((name) => [
			one(`normal-operands-${name}`),
			one(`normal-result-${name}`),
		]),
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
	const metric = pair("m", RAW, RELATIVE, 9.2, 15.3);
	const normalizationAt = metric.firstSettled + 2.7; // 12.80; preserve the raw proof’s rest
	enter(one("normal-label"), normalizationAt);
	enter(one("under"), normalizationAt);
	for (const name of ["DUNE", "CRUX"]) {
		enter(one(`normal-operands-${name}`), normalizationAt + 0.4);
		// No counting after an equals sign: each result is revealed settled.
		enter(one(`normal-result-${name}`), normalizationAt + 1);
	}
	// The equations settle at 14.30; the relative chart begins after a quiet second.
	show(heads[1], metric.secondSettled + 1); // 17.70, held for 5.00 s

	// ——— sign: the hero. Size, or direction? ———
	tl.addLabel("sign", 22.7);
	d.swap([heads[0], heads[1]], heads[2], 22.7);
	hide(
		[col("m", 0), col("m", 1), ...linksOf("m", RAW), one("under"), ...normal],
		22.7,
	);
	const sign = pair("s", SIZE, SIGNED, 23.05, (settled) => settled + 2.9);
	// The enlarged, two-line loss row and every connector settle before the lock fits.
	const heroAt = sign.secondSettled + 1; // 28.95
	d.lock(lockRank, heroAt, { around: row("s", 1, "CRUX"), pad: 4 });
	tl.addLabel("hero-lock", heroAt);
	show(heads[3], heroAt);

	// ——— move: a rank that moves while the name doesn't ———
	// Preserve the 3.15 s stand from bracket settlement and the 3.60 s answer hold.
	const moveAt = heroAt + 3.6; // 32.55
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
	const answerAt = move.secondSettled + 1; // 36.90
	show(one("note"), answerAt);
	show(heads[5], answerAt);

	// ——— claim ———
	const claimAt = answerAt + 3.6; // 40.50
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
	const nextAt = claimAt + 4.4; // 44.90
	tl.addLabel("next", nextAt);
	hide(kids("claim"), nextAt);
	d.close(nextAt);
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
