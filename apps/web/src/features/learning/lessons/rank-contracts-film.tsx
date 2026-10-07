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
	active,
	candidates,
	type ExpiryKey,
	expiryLabel,
	MAX,
	peak,
	SPOT,
	STRIKES,
	total,
	volume,
} from "./rank-contracts-model";

/*
 * Contract neighborhoods, as a film. The Oct 18 105 and 110 calls each traded over 500 on
 * Monday: two crowds betting on a rise? The grid of expiries and strikes answers: with
 * ALFA at $100.02 both sit out of the money, side by side, and 500 of each was one spread.
 * The hero is two rows with the same total and peak, 695 and 380, that traded in two
 * strikes and in five; glowing brackets lock on the breadth. Last, a screen's biggest
 * numbers audited: Friday's 1,400 and a put's 900 drop out, leaving the 110 call's 540
 * with the 120 call still missing.
 *
 *   open      0–4        "Contract neighborhoods"
 *   question  4–8.6      105 and 110, both over 500: two crowds?
 *   grid      8.6–19     the grid; spot $100.02; one spread across two cells
 *   shape     19–28.6    hero: Sep 20 and Nov 15: 695, peak 380; breadth 2 and 5
 *   audit     28.6–35    1,400 stale; 900 a put; 540 the candidate; 120 missing
 *   claim     35–39.4    a cell needs its neighbors
 *   next      39.4–41.9  Next: backtests
 */

const END = 41.9;
const ROWS = Object.keys(volume) as ExpiryKey[];
const SPREAD = 500;
const OCT = volume.oct18;
const STALE = candidates.find((c) => c.fails === "stale");
const PUT = candidates.find((c) => c.fails === "scope");
const LEAD = candidates.find((c) => !c.fails && c.value !== null);

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const labelW = narrow ? 58 : 100;
	const cellW = (room - labelW) / STRIKES.length;
	return {
		...frame,
		labelW,
		cellW,
		cellX: (j: number) => margin + labelW + j * cellW,
		gridTop: H * (narrow ? 0.34 : 0.34),
		cellH: H * (narrow ? 0.1 : 0.12),
		strikeX: (strike: number) => {
			const j = STRIKES.indexOf(strike as (typeof STRIKES)[number]);
			return margin + labelW + (j + 0.5) * cellW;
		},
		statY: H * (narrow ? 0.72 : 0.76),
		candY: (i: number) =>
			H * (narrow ? 0.27 : 0.28) + i * H * (narrow ? 0.1 : 0.1),
		candH: H * (narrow ? 0.08 : 0.08),
	};
}

const copy = {
	title: ["Contract neighborhoods", "合约邻域"],
	titleSub: ["strikes and expiries in context", "结合行权价与到期日来看"],
	qTag: ["ALFA calls · Monday", "ALFA 看涨 · 周一"],
	qLine: [
		`Oct 18 105: ${count(OCT[2] ?? 0)}. Oct 18 110: ${count(OCT[3] ?? 0)}.`,
		`10月18日 105：${count(OCT[2] ?? 0)}。10月18日 110：${count(OCT[3] ?? 0)}。`,
	],
	qBig: ["Two crowds betting on a rise?", "两群人在押注上涨？"],
	gHead: [
		"Monday's ALFA calls, by expiry and strike.",
		"周一 ALFA 看涨，按到期日和行权价。",
	],
	g2Head: ["Both out of the money: one spread.", "两者都是虚值：一笔价差。"],
	itm: ["in the money", "实值"],
	otm: ["out of the money", "虚值"],
	spread: [
		`one spread · ${count(SPREAD)} each`,
		`一笔价差 · 各 ${count(SPREAD)} 张`,
	],
	hHead: ["Sep 20 and Nov 15 look alike.", "9月20日 和 11月15日 看着一样。"],
	h2Head: [
		`Breadth tells them apart: ${active("sep20")} and ${active("nov15")}.`,
		`广度把它们分开：${active("sep20")} 对 ${active("nov15")}。`,
	],
	totalLabel: ["total", "合计"],
	peakLabel: ["peak", "峰值"],
	strikesLabel: ["strikes", "行权价数"],
	aHead: ["A screen's biggest numbers, checked.", "核查筛选器的最大数字。"],
	a2Head: [
		`Left: ${count(LEAD?.value ?? 0)}, with the 120 missing.`,
		`剩下 ${count(LEAD?.value ?? 0)}，而 120 还缺着。`,
	],
	stale: ["stale", "过时"],
	scope: ["a put", "看跌"],
	missing: ["missing", "缺失"],
	candidate: ["candidate", "候选"],
	claimBig: ["A cell needs its neighbors.", "一个格子要看它的邻居。"],
	claimSub: ["Report breadth with the total.", "报告合计时也报告广度。"],
	nextBig: ["Next: backtests", "下一课：回测"],
	nextSub: ["testing a pattern without hindsight", "不带后见之明地检验模式"],
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
	const rowY = (r: number) => L.gridTop + r * (L.cellH + 6);
	const cell = (key: ExpiryKey, r: number, j: number) => {
		const value = volume[key][j];
		const x = L.cellX(j) + 3;
		const y = rowY(r);
		const w = L.cellW - 6;
		return (
			<g key={`${key}-${j}`} data-f={`cell-${key}-${j}`}>
				{value === null ? (
					<rect
						x={x}
						y={y}
						width={w}
						height={L.cellH}
						rx={6}
						className="wt-film-ghost"
					/>
				) : value === 0 ? (
					<rect
						x={x}
						y={y}
						width={w}
						height={L.cellH}
						rx={6}
						className="wt-panel-shape"
					/>
				) : (
					<rect
						x={x}
						y={y}
						width={w}
						height={L.cellH}
						rx={6}
						className="wt-film-bar"
						data-tone="total"
						opacity={0.18 + 0.82 * (value / MAX)}
					/>
				)}
				<text
					x={x + w / 2}
					y={y + L.cellH / 2 + text * 0.36}
					textAnchor="middle"
					className={`wt-film-num ${value ? "" : "wt-film-dim"}`}
					style={{ fontSize: text }}
				>
					{value === null ? "—" : count(value)}
				</text>
			</g>
		);
	};
	/** A small table: the expiry, then its total, peak and breadth in columns. */
	const statCols = narrow ? [0.42, 0.66, 0.92] : [0.4, 0.6, 0.85];
	const statHead = (
		<g data-f="stat-head">
			{[copy.totalLabel, copy.peakLabel, copy.strikesLabel].map((label, k) => (
				<text
					key={t(label)}
					x={margin + statCols[k] * room}
					y={L.statY - T.small * 0.6}
					textAnchor="end"
					className="wt-film-tag"
					style={{ fontSize: T.small * 0.95 }}
				>
					{t(label).toUpperCase()}
				</text>
			))}
		</g>
	);
	const stats = (key: ExpiryKey, r: number) => {
		const y = L.statY + T.small * 0.8 + (r + 0.6) * text * 1.8;
		return (
			<g data-f={`stats-${key}`}>
				<text
					x={margin}
					y={y}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(expiryLabel[key]).toUpperCase()}
				</text>
				{[count(total(key)), count(peak(key)), String(active(key))].map(
					(value, k) => (
						<text
							key={k}
							data-f={`stat-${key}-${k}`}
							x={margin + statCols[k] * room}
							y={y}
							textAnchor="end"
							className={`wt-film-num ${k === 2 ? "wt-film-accent" : ""}`}
							style={{ fontSize: text * 1.1 }}
						>
							{value}
						</text>
					),
				)}
			</g>
		);
	};
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

			{/* The grid. */}
			{headline("g-head", copy.gHead)}
			{/* Each answer, a line under its question, as the stage makes it. */}
			<Lines
				name="g2-head"
				text={t(copy.g2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.gHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{headline("h-head", copy.hHead)}
			<Lines
				name="h2-head"
				text={t(copy.h2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.hHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<Brackets name="lock-breadth" glow />
			<g data-f="axes">
				{STRIKES.map((strike, j) => (
					<text
						key={strike}
						x={L.cellX(j) + L.cellW / 2}
						y={L.gridTop - T.small * 1.2}
						textAnchor="middle"
						className="wt-film-num wt-film-dim"
						style={{ fontSize: T.small * 1.1 }}
					>
						{strike}
					</text>
				))}
				{ROWS.map((key, r) => (
					<text
						key={key}
						data-f={`row-${key}`}
						x={margin}
						y={rowY(r) + L.cellH / 2 + T.small * 0.4}
						className="wt-film-tag"
						style={{ fontSize: T.small * 1.05 }}
					>
						{t(expiryLabel[key]).toUpperCase()}
					</text>
				))}
			</g>
			{ROWS.map((key, r) => (
				<g key={key} data-f={`cells-${key}`}>
					{STRIKES.map((_, j) => cell(key, r, j))}
				</g>
			))}
			<g data-f="spot">
				<path
					d={`M${L.cellX(2)} ${L.gridTop - T.small * 3}V${rowY(ROWS.length) + 4}`}
					style={{ stroke: "var(--diagram-accent)", strokeWidth: 2 }}
				/>
				<text
					x={L.cellX(2) - 8}
					y={rowY(ROWS.length) + T.small * 1.8}
					textAnchor="end"
					className="wt-film-tag wt-film-gain"
					style={{ fontSize: T.small }}
				>
					{`← ${t(copy.itm).toUpperCase()}`}
				</text>
				<text
					x={L.cellX(2) + 8}
					y={rowY(ROWS.length) + T.small * 1.8}
					className="wt-film-tag wt-film-dim"
					style={{ fontSize: T.small }}
				>
					{`${t(copy.otm).toUpperCase()} →`}
				</text>
				<text
					x={L.cellX(2)}
					y={L.gridTop - T.small * 3.4}
					textAnchor="middle"
					className="wt-film-num wt-film-accent"
					style={{ fontSize: T.small * 1.1 }}
				>
					{`ALFA $${SPOT.toFixed(2)}`}
				</text>
			</g>
			<g data-f="spread">
				<rect
					x={L.cellX(2) - 2}
					y={rowY(1) - 4}
					width={L.cellW * 2 + 4}
					height={L.cellH + 8}
					rx={10}
					style={{
						fill: "none",
						stroke: "var(--diagram-accent)",
						strokeWidth: 2,
						strokeDasharray: "5 4",
					}}
				/>
				<text
					x={L.cellX(2) + L.cellW}
					y={rowY(ROWS.length) + T.small * 3.8}
					textAnchor="middle"
					className="wt-film-tag wt-film-accent wt-halo"
					style={{ fontSize: T.small }}
				>
					{t(copy.spread).toUpperCase()}
				</text>
			</g>
			{statHead}
			{stats("sep20", 0)}
			{stats("nov15", 1)}

			{/* A screen's top numbers, audited. */}
			{headline("a-head", copy.aHead)}
			<Lines
				name="a2-head"
				text={t(copy.a2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.aHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{candidates.map((c, i) => (
				<g key={c.id} data-f={`cand-${i}`}>
					<rect
						data-f={`cand-${i}-box`}
						x={margin}
						y={L.candY(i)}
						width={room}
						height={L.candH}
						rx={10}
						className="wt-panel-shape"
					/>
					<text
						x={margin + 14}
						y={L.candY(i) + L.candH * 0.42}
						className="wt-film-type"
						style={{ fontSize: text }}
					>
						{t(c.label)}
					</text>
					<text
						x={margin + 14}
						y={L.candY(i) + L.candH * 0.78}
						className="wt-film-num wt-film-dim"
						style={{ fontSize: T.small }}
					>
						{t(c.source)}
					</text>
					<text
						x={margin + room * (narrow ? 0.62 : 0.6)}
						y={L.candY(i) + L.candH / 2 + text * 0.4}
						textAnchor="end"
						className="wt-film-num"
						style={{ fontSize: text * 1.15 }}
					>
						{c.value === null ? "—" : count(c.value)}
					</text>
				</g>
			))}
			{candidates.map((c, i) => {
				const verdict: [Copy, string] | null =
					c.fails === "stale"
						? [copy.stale, "wt-film-loss"]
						: c.fails === "scope"
							? [copy.scope, "wt-film-loss"]
							: c.value === null
								? [copy.missing, "wt-film-warn"]
								: c === LEAD
									? [copy.candidate, "wt-film-gain"]
									: null;
				return verdict ? (
					<text
						key={c.id}
						data-f={`verdict-${i}`}
						x={margin + room - 14}
						y={L.candY(i) + L.candH / 2 + T.small * 0.38}
						textAnchor="end"
						className={`wt-film-tag ${verdict[1]}`}
						style={{ fontSize: T.small }}
					>
						{t(verdict[0]).toUpperCase()}
					</text>
				) : null;
			})}

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
		"g-head",
		"g2-head",
		"h-head",
		"h2-head",
		"a-head",
		"a2-head",
	].map((name) => one(name));
	const lockBreadth = one<SVGGraphicsElement>("lock-breadth");
	const cells = (key: ExpiryKey) =>
		STRIKES.map((_, j) => one(`cell-${key}-${j}`));
	const allCells = ROWS.flatMap(cells);
	const rowLabel = (key: ExpiryKey) => one(`row-${key}`);
	const statLine = (key: ExpiryKey, k: number) => one(`stat-${key}-${k}`);
	const cands = candidates.map((_, i) => one(`cand-${i}`));
	const verdicts = candidates.flatMap((_, i) => {
		const v = one(`verdict-${i}`);
		return v ? [v] : [];
	});
	const verdict = (i: number) => one(`verdict-${i}`);

	d.hidden([
		...flat("q"),
		...heads,
		...kids("axes"),
		...ROWS.map((key) => one(`cells-${key}`)),
		one("spot"),
		one("spread"),
		one("stat-head"),
		one("stats-sep20"),
		one("stats-nov15"),
		...ROWS.flatMap((key) =>
			key === "oct18" ? [] : [0, 1, 2].map((k) => statLine(key, k)),
		),
		lockBreadth,
		...cands,
		...verdicts,
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

	// ——— grid: the neighborhood ———
	tl.addLabel("grid", 8.6);
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	show(kids("axes"), 9.2);
	ROWS.forEach((key, r) => {
		tl.set(one(`cells-${key}`), { opacity: 1 }, 9.3);
		cells(key).forEach((c, j) => {
			tl.fromTo(
				c,
				{ opacity: 0, scale: 0.85, transformOrigin: "50% 50%" },
				{ opacity: 1, scale: 1, duration: 0.35 },
				9.4 + r * 0.15 + j * 0.06,
			);
		});
	});
	ROWS.forEach((key) => {
		if (key === "oct18") return;
		tl.to(cells(key), { opacity: 0.45, duration: 0.4 }, 10.8);
	});
	show(one("spot"), 12.4);
	word(one("spread"), 14.0);
	show(heads[1], 14.4);

	// ——— shape: the hero. Same total and peak, different breadth. ———
	tl.addLabel("shape", 19);
	d.swap([heads[0], heads[1]], heads[2], 19.0);
	hide([one("spot"), one("spread")], 19.0, 0.3);
	tl.to(allCells, { opacity: 1, duration: 0.4 }, 19.2);
	tl.to(
		[...cells("oct18"), rowLabel("oct18")],
		{ opacity: 0.25, duration: 0.4 },
		19.3,
	);
	show([one("stat-head"), one("stats-sep20"), one("stats-nov15")], 19.8);
	(["sep20", "nov15"] as const).forEach((key, r) => {
		show(statLine(key, 0), 20.2 + r * 0.2);
		show(statLine(key, 1), 21.0 + r * 0.2);
	});
	(["sep20", "nov15"] as const).forEach((key, r) => {
		show(statLine(key, 2), 23.4 + r * 0.3);
		// The traded strikes light up; the silent ones step back.
		STRIKES.forEach((_, j) => {
			if (!(volume[key][j] ?? 0))
				tl.to(
					one(`cell-${key}-${j}`),
					{ opacity: 0.3, duration: 0.3 },
					23.4 + r * 0.3,
				);
		});
	});
	// Round both rows: alike in total and peak, apart in breadth; the column's header
	// sits clear above them.
	d.lock(lockBreadth, 25.0, {
		around: [one("stats-sep20"), one("stats-nov15")],
		pad: 6,
	});
	tl.addLabel("hero-lock", 25.0);
	show(heads[3], 25.0);

	// ——— audit: the screen's top numbers ———
	tl.addLabel("audit", 28.6);
	d.swap([heads[2], heads[3]], heads[4], 28.6);
	hide(
		[
			...kids("axes"),
			...ROWS.map((key) => one(`cells-${key}`)),
			one("stat-head"),
			one("stats-sep20"),
			one("stats-nov15"),
			lockBreadth,
		],
		28.6,
	);
	cands.forEach((c, i) => {
		show(c, 29.4 + i * 0.15, "right");
	});
	const out = candidates.flatMap((c, i) => (c.fails ? [i] : []));
	out.forEach((i, k) => {
		word(verdict(i), 30.2 + k * 0.4);
		tl.to(cands[i], { opacity: 0.4, duration: 0.3 }, 30.5 + k * 0.4);
	});
	candidates.forEach((c, i) => {
		if (c.fails || !verdict(i)) return;
		word(verdict(i), 31.0 + (c.value === null ? 0.4 : 0));
		if (c === LEAD)
			tl.set(one(`cand-${i}-box`), { attr: { class: "wt-focus-shape" } }, 31.0);
	});
	show(heads[5], 31.4);

	// ——— claim ———
	tl.addLabel("claim", 35);
	hide([heads[4], heads[5], ...cands, ...verdicts], 35.0);
	word(one("z-big"), 35.3);
	show(one("z-sub"), 35.7);

	// ——— next ———
	tl.addLabel("next", 39.4);
	hide(kids("claim"), 39.4);
	d.close(39.4);
	return tl;
}

export const rankContractsFilm: Film = {
	id: "rank-contracts",
	label: [
		`Contract neighborhoods, as a short film: Monday's ALFA call volume as a grid of expiries and strikes, where the Oct 18 105 and 110 calls, ${count(OCT[2] ?? 0)} and ${count(OCT[3] ?? 0)}, sit side by side out of the money with ALFA at $${SPOT.toFixed(2)} and share ${count(SPREAD)} from one spread; the Sep 20 and Nov 15 rows, both ${count(total("sep20"))} with a ${count(peak("sep20"))} peak, traded in ${active("sep20")} strikes and in ${active("nov15")}; and a screen's biggest numbers audited, ${count(STALE?.value ?? 0)} stale and ${count(PUT?.value ?? 0)} a put, leaving the 110 call's ${count(LEAD?.value ?? 0)} with the 120 call missing`,
		`合约邻域短片：周一 ALFA 看涨成交量按到期日和行权价排成网格：ALFA 在 $${SPOT.toFixed(2)}，10月18日 105 和 110 看涨的 ${count(OCT[2] ?? 0)} 和 ${count(OCT[3] ?? 0)} 都是虚值、紧挨着，并各有 ${count(SPREAD)} 张来自同一笔价差；9月20日 和 11月15日 两行都是 ${count(total("sep20"))}、峰值 ${count(peak("sep20"))}，却分别只在 ${active("sep20")} 个和 ${active("nov15")} 个行权价成交；以及核查筛选器的最大数字：${count(STALE?.value ?? 0)} 已过时，${count(PUT?.value ?? 0)} 是看跌，剩下 110 看涨的 ${count(LEAD?.value ?? 0)}，而 120 看涨仍缺失`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Contract neighborhoods", "合约邻域"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "grid", label: ["The grid", "网格"] },
		{ id: "shape", label: ["Breadth", "广度"] },
		{ id: "audit", label: ["The screen", "筛选器"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
