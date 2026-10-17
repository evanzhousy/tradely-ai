import { type Copy, pick, usd } from "@/content/world";
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
	arrivals,
	BLOCK,
	BUCKET,
	best,
	CORRECTED,
	cutoffs,
	HOLDOUT,
	history,
	LOWER,
	PERCENTILE,
	REPORTED,
	SESSIONS,
	TODAY,
	TODAY_LABEL,
	TODAY_VOLUME,
	TYPICAL_VOLUME,
	tried,
} from "./point-in-time-research-model";

/*
 * Backtests, as a film. A backtest replays a decision after a reported block: which price
 * may it use for the block? The arrivals answer: only the first report, $2.51; the
 * correction to $2.15 arrives later, and the 120 call's volume not until Tuesday. The hero
 * is a percentile: today's 4.2× beats 58 of 60 sessions, the 97th percentile, and glowing
 * brackets lock on a rank that is not a probability. Last, ten thresholds tried on
 * Jan–Jun, the best at 70%, and the same rule frozen and run once on Jul–Aug: 52%.
 *
 *   open      0–4        "Backtests"
 *   question  4–8.6      a decision at the first cutoff: which price?
 *   cutoff    8.6–20.2   arrivals; first report, correction at the next cutoff; Tuesday's data
 *   rank      20.2–29.3  hero: 60 sessions; 4.2× at the 97th percentile; not a probability
 *   holdout   29.3–38.0  ten thresholds; the winner 70%; the holdout 52%
 *   claim     38.0–42.4  only what was known, and test once
 *   next      42.4–44.9  Next: the module checkpoint
 */

const END = 44.9;
const MAX_DAYS = Math.max(...history.map((b) => b.days));
const BEST_INDEX = tried.indexOf(best);
const HERO_PAD = 10;
const openingCutoff = cutoffs[0];
const correctionCutoff = cutoffs[1];
if (!openingCutoff || !correctionCutoff) {
	throw new Error("Missing point-in-time decision cutoffs");
}
const timeOnly = ([en, zh]: Copy): Copy => [
	en.slice(en.lastIndexOf(" ") + 1),
	zh.slice(zh.lastIndexOf(" ") + 1),
];
const openingDecisionTime = timeOnly(openingCutoff.time);
const decisionCutoffs = [openingCutoff, correctionCutoff].map(
	({ before, time }) => ({ before, time: timeOnly(time) }),
);

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const timeW = narrow ? room * 0.32 : room * 0.22;
	const histTop = H * (narrow ? 0.34 : 0.32);
	const histBottom = H * (narrow ? 0.72 : 0.74);
	const slot = room / history.length;
	const barSlot = room / tried.length;
	const todayX = margin + (TODAY / BUCKET) * slot;
	return {
		...frame,
		/** Rows leave a gap above each one for the decision rule and its label. */
		arrY: (i: number) => H * 0.29 + i * H * 0.155,
		arrH: H * 0.095,
		timeW,
		histTop,
		histBottom,
		slot,
		todayX,
		// Allow the lock's maximum 24 px expansion, its pad and a clear lane to today.
		heroRight: todayX - (narrow ? 46 : 50),
		heroY: histTop + frame.type.num * 1.7,
		misreadingRight: todayX - (narrow ? 14 : 36),
		histX: (i: number) => margin + i * slot,
		histH: (days: number) => (days / MAX_DAYS) * (histBottom - histTop),
		barSlot,
		barX: (i: number) => margin + i * barSlot,
		pctY: (pct: number) =>
			histBottom - ((pct - 40) / 40) * (histBottom - histTop),
	};
}

const copy = {
	title: ["Backtests", "回测"],
	titleSub: ["testing a pattern without hindsight", "不带后见之明地检验模式"],
	qTag: [
		`a backtest · ${openingCutoff.time[0]}`,
		`回测 · ${openingCutoff.time[1]}`,
	],
	qLine: [
		`Decision is replayed just after the ${BLOCK}-lot block.`,
		`它重放 ${BLOCK} 张大单后的即时决策。`,
	],
	qBig: ["Which price may it use?", "它可以用哪个价格？"],
	cHead: ["Monday's facts, in order of arrival.", "周一的事实，按到达顺序。"],
	c2Head: [
		`At ${openingDecisionTime[0]} it may use only ${usd(REPORTED)}.`,
		`${openingDecisionTime[1]} 时只能用 ${usd(REPORTED)}。`,
	],
	c3Head: ["Later facts count once they arrive.", "后来的事实，到了才算数。"],
	known: ["known", "已知"],
	notYet: ["not yet", "还没到"],
	decision: ["decision", "决策时刻"],
	rHead: ["Compare today with past sessions.", "把今天与过去的交易日比较。"],
	lower: [
		`${LOWER} / ${SESSIONS} ≈ ${PERCENTILE}% of sessions lower`,
		`${LOWER} / ${SESSIONS} ≈ ${PERCENTILE}% 的交易日成交量更低`,
	],
	pct: [`${PERCENTILE}th`, `第 ${PERCENTILE}`],
	r2Head: [
		`${PERCENTILE}th percentile: rank, not probability.`,
		`第 ${PERCENTILE} 百分位：排名，不是概率。`,
	],
	today: [`today ${TODAY}×`, `今天 ${TODAY}×`],
	todayContext: [
		`${TODAY_LABEL[0]} · ${TODAY_VOLUME} ÷ ${TYPICAL_VOLUME} ≈ ${TODAY}×`,
		`${TODAY_LABEL[1]} · ${TODAY_VOLUME} ÷ ${TYPICAL_VOLUME} ≈ ${TODAY}×`,
	],
	axis: ["volume ÷ typical", "成交量 ÷ 常态"],
	hHead: ["Thresholds tried on Jan–Jun.", "在上半年数据上试验门槛。"],
	h2Head: [
		`Frozen, then run once: ${HOLDOUT}%.`,
		`冻结后只跑一次：${HOLDOUT}%。`,
	],
	rose: ["rose next day · 40–80%", "次日上涨 · 40–80%"],
	best: [
		`above ${best.threshold}× typical · ${best.rose}%`,
		`超过常态 ${best.threshold}× · ${best.rose}%`,
	],
	frozen: [
		`Frozen rule: volume above ${best.threshold}× typical.`,
		`冻结规则：成交量超过常态的 ${best.threshold}×。`,
	],
	holdout: [`Jul–Aug observed ${HOLDOUT}%`, `7–8 月样本外实测：${HOLDOUT}%`],
	claimBig: [
		"Use only what was known, and test once.",
		"只用当时已知的，并且只检验一次。",
	],
	claimSub: [
		"Freeze the rule before the holdout.",
		"打开样本外数据前先冻结规则。",
	],
	nextBig: ["Next: the module checkpoint", "下一步：模块检查点"],
	nextSub: [
		"comparison and investigation, on a new day",
		"在新的一天里运用比较与研究",
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

			{/* What had arrived by the decision. */}
			{headline("c-head", copy.cHead)}
			{/* The question's answer, as the first report counts as known. */}
			<Lines
				name="c2-head"
				text={t(copy.c2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.cHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{headline("c3-head", copy.c3Head)}
			{arrivals.map((a, i) => (
				<g key={a.id} data-f={`arr-${i}`}>
					<rect
						data-f={`arr-${i}-box`}
						x={margin}
						y={L.arrY(i)}
						width={room}
						height={L.arrH}
						rx={10}
						className="wt-panel-shape"
					/>
					{/* On a phone the arrival time drops to the second line, beside the event time. */}
					<text
						x={margin + 14}
						y={L.arrY(i) + L.arrH * (narrow ? 0.76 : 0.42)}
						className="wt-film-num wt-film-dim"
						style={{ fontSize: text }}
					>
						{t(a.arrived)}
					</text>
					<text
						x={margin + 14 + (narrow ? 0 : L.timeW)}
						y={L.arrY(i) + L.arrH * 0.42}
						className="wt-film-type"
						style={{ fontSize: text }}
					>
						{t(a.fact)}
					</text>
					<text
						x={margin + 14 + (narrow ? room * 0.48 : L.timeW)}
						y={L.arrY(i) + L.arrH * 0.76}
						className="wt-film-num wt-film-dim"
						style={{ fontSize: T.small }}
					>
						{t(a.event)}
					</text>
				</g>
			))}
			{arrivals.map((a, i) =>
				(["known", "notYet"] as const).map((state) => (
					<text
						key={`${a.id}-${state}`}
						data-f={`arr-${i}-${state}`}
						x={margin + room - 14}
						y={L.arrY(i) + L.arrH * 0.42}
						textAnchor="end"
						className="wt-film-tag wt-film-dim"
						style={{ fontSize: T.small }}
					>
						{t(copy[state]).toUpperCase()}
					</text>
				)),
			)}
			{/* The decision time, a rule across the list between what had arrived and what hadn't. */}
			{decisionCutoffs.map(({ before, time }) => (
				<g key={before} data-f={`cut-${before}`}>
					<path
						d={`M${margin - 6} ${L.arrY(before) - 5}H${margin + room + 6}`}
						style={{
							stroke: "var(--diagram-accent)",
							strokeWidth: 2,
							strokeDasharray: "6 4",
						}}
					/>
					<text
						x={margin + room}
						y={L.arrY(before) - 10}
						textAnchor="end"
						className="wt-film-tag wt-film-accent"
						style={{ fontSize: T.small }}
					>
						{`${t(copy.decision).toUpperCase()} · ${t(time)}`}
					</text>
				</g>
			))}

			{/* A percentile. */}
			{headline("r-head", copy.rHead)}
			{/* The hero's answer, as the brackets lock on the percentile. */}
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
			<Brackets name="lock-pct" glow />
			<g data-f="hist">
				<path
					d={`M${margin} ${L.histBottom}H${margin + room}`}
					className="wt-axis"
				/>
				{history.map((b, i) => (
					<g key={b.from}>
						{i % 2 === 0 ? (
							<text
								x={L.histX(i)}
								y={L.histBottom + T.small * 1.6}
								className="wt-film-num wt-film-dim"
								style={{ fontSize: T.small }}
							>
								{`${b.from}×`}
							</text>
						) : null}
					</g>
				))}
				<text
					x={margin + room}
					y={L.histBottom + T.small * 3.2}
					textAnchor="end"
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.axis).toUpperCase()}
				</text>
			</g>
			{history.map((b, i) => (
				<rect
					key={b.from}
					data-f={`bin-${i}`}
					x={L.histX(i) + 2}
					y={L.histBottom - L.histH(b.days)}
					width={L.slot - 4}
					height={L.histH(b.days)}
					rx={3}
					className="wt-film-bar"
					data-tone="neutral"
				/>
			))}
			<g data-f="lower-counts">
				{history.map((b, i) =>
					b.days > 0 ? (
						<text
							key={b.from}
							x={L.histX(i) + L.slot / 2}
							y={L.histBottom - L.histH(b.days) - 8}
							textAnchor="middle"
							className={`wt-film-num ${b.from + BUCKET <= TODAY ? "wt-film-accent" : "wt-film-dim"}`}
							style={{ fontSize: T.small }}
						>
							{b.days}
						</text>
					) : null,
				)}
			</g>
			<Lines
				name="lower"
				text={t(copy.lower)}
				x={W / 2}
				y={H * 0.93}
				size={T.body}
				maxWidth={room}
				className="wt-film-type wt-film-accent"
			/>
			<Lines
				name="today-context"
				text={t(copy.todayContext)}
				x={W / 2}
				y={H * 0.86}
				size={T.small}
				maxWidth={room}
				className="wt-film-type wt-film-dim"
			/>
			<g data-f="today">
				<path
					d={`M${L.todayX} ${L.histTop - 8}V${L.histBottom}`}
					style={{ stroke: "var(--diagram-accent)", strokeWidth: 2 }}
				/>
				<text
					x={L.todayX + 12}
					y={L.histTop - 14}
					textAnchor="start"
					className="wt-film-num wt-film-accent"
					style={{ fontSize: T.small * 1.1 }}
				>
					{narrow ? (
						<>
							<tspan>{t(["today", "今天"])}</tspan>
							<tspan x={L.todayX + 12} dy={T.small * 1.4}>
								{`${TODAY}×`}
							</tspan>
						</>
					) : (
						t(copy.today)
					)}
				</text>
			</g>
			<text
				data-f="pct"
				x={L.heroRight}
				y={L.heroY}
				textAnchor="end"
				className="wt-film-num wt-film-accent"
				style={{ fontSize: T.num * 1.3 }}
			>
				{t(copy.pct)}
			</text>
			<text
				data-f="not-chance"
				x={L.misreadingRight}
				y={L.heroY + T.num * 1.3 + 32}
				textAnchor="end"
				className={`wt-film-type ${toneClass.caution}`}
				style={{ fontSize: text, textDecoration: "line-through" }}
			>
				{`${PERCENTILE}% ${t(["chance of a rise", "上涨概率"])}`}
			</text>

			{/* Many rules tried, one test kept. */}
			{headline("h-head", copy.hHead)}
			{/* The answer, as the frozen rule's result lands. */}
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
			<g data-f="search-axis">
				<path
					d={`M${margin} ${L.pctY(50)}H${margin + room}`}
					className="wt-film-link"
				/>
				<text
					x={margin + room}
					y={L.pctY(50) - 6}
					textAnchor="end"
					className="wt-film-num wt-film-dim wt-halo"
					style={{ fontSize: T.small }}
				>
					50%
				</text>
				<path
					d={`M${margin} ${L.histBottom}H${margin + room}`}
					className="wt-axis"
				/>
				<text
					x={margin}
					y={L.histTop - 14}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.rose).toUpperCase()}
				</text>
				<text
					x={margin + room}
					y={L.histBottom + T.small * 3.2}
					textAnchor="end"
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.axis).toUpperCase()}
				</text>
			</g>
			{tried.map((r, i) => (
				<g key={r.threshold} data-f={`try-${i}`}>
					<rect
						data-f={`try-${i}-bar`}
						x={L.barX(i) + 3}
						y={L.pctY(r.rose)}
						width={L.barSlot - 6}
						height={L.histBottom - L.pctY(r.rose)}
						rx={3}
						className="wt-film-bar"
						data-tone="neutral"
					/>
					{!narrow || i % 2 === 1 ? (
						<text
							x={L.barX(i) + L.barSlot / 2}
							y={L.histBottom + T.small * 1.6}
							textAnchor="middle"
							className="wt-film-num wt-film-dim"
							style={{ fontSize: T.small }}
						>
							{`${r.threshold}×`}
						</text>
					) : null}
				</g>
			))}
			<text
				data-f="best"
				x={L.barX(BEST_INDEX) + L.barSlot / 2}
				y={L.pctY(best.rose) - 8}
				textAnchor="middle"
				className="wt-film-num wt-film-accent"
				style={{ fontSize: text * 1.1 }}
			>
				{t(copy.best)}
			</text>
			<Lines
				name="frozen-rule"
				text={t(copy.frozen)}
				x={W / 2}
				y={H * 0.89}
				size={T.body}
				maxWidth={room}
			/>
			<g data-f="hold">
				<path
					d={`M${L.barX(BEST_INDEX) - L.barSlot * 0.6} ${L.pctY(HOLDOUT)}H${L.barX(BEST_INDEX) + L.barSlot * 1.6}`}
					style={{ stroke: "var(--diagram-accent)", strokeWidth: 3 }}
				/>
				<text
					x={
						narrow
							? L.barX(BEST_INDEX) - L.barSlot * 0.7
							: L.barX(BEST_INDEX) + L.barSlot * 1.7
					}
					y={L.pctY(HOLDOUT) + T.small * 0.4}
					textAnchor={narrow ? "end" : "start"}
					className="wt-film-num wt-film-accent wt-halo"
					style={{ fontSize: narrow ? T.small : text }}
				>
					{t(copy.holdout)}
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
		"c-head",
		"c2-head",
		"c3-head",
		"r-head",
		"r2-head",
		"h-head",
		"h2-head",
	].map((name) => one(name));
	const lockPct = one<SVGGraphicsElement>("lock-pct");
	// Keep the misreading below even the lock's largest expansion, in either font.
	const pctBox = one<SVGTextElement>("pct").getBBox();
	const misreading = one<SVGTextElement>("not-chance");
	const misreadingBox = misreading.getBBox();
	const misreadingAscent =
		Number(misreading.getAttribute("y")) - misreadingBox.y;
	misreading.setAttribute(
		"y",
		String(pctBox.y + pctBox.height + HERO_PAD + 24 + 12 + misreadingAscent),
	);
	const arrs = arrivals.map((_, i) => one(`arr-${i}`));
	const marks = arrivals.flatMap((_, i) => [
		one(`arr-${i}-known`),
		one(`arr-${i}-notYet`),
	]);
	const bins = history.map((_, i) => one(`bin-${i}`));
	const tries = tried.map((_, i) => one(`try-${i}`));
	/** Reveal a complete cutoff state only after the previous boundary is gone. */
	const knownTo = (cut: number, time: number) => {
		arrivals.forEach((_, i) => {
			const known = i < cut;
			tl.fromTo(
				one(`arr-${i}-${known ? "known" : "notYet"}`),
				{ opacity: 0 },
				{ opacity: 1, duration: 0.4 },
				time,
			);
			tl.to(arrs[i], { opacity: known ? 1 : 0.45, duration: 0.4 }, time);
		});
	};

	d.hidden([
		...flat("q"),
		...heads,
		...arrs,
		...marks,
		one("cut-2"),
		one("cut-3"),
		...kids("hist"),
		...bins,
		one("lower-counts"),
		one("lower"),
		one("today-context"),
		one("today"),
		one("pct"),
		lockPct,
		one("not-chance"),
		...kids("search-axis"),
		...tries,
		one("best"),
		one("frozen-rule"),
		one("hold"),
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

	// ——— cutoff: what had arrived ———
	tl.addLabel("cutoff", 8.6);
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	arrs.forEach((a, i) => {
		show(a, 9.2 + i * 0.2, "right");
	});
	tl.fromTo(
		one("cut-2"),
		{ opacity: 0, x: -20 },
		{ opacity: 1, x: 0, duration: 0.4 },
		10.8,
	);
	knownTo(2, 11.1);
	tl.set(one("arr-1-box"), { attr: { class: "wt-focus-shape" } }, 11.1);
	show(heads[1], 11.6);
	// A minute later the correction is in; Tuesday's data never is.
	d.swap([heads[0], heads[1]], heads[2], 15.4);
	// The old boundary and all of its statuses leave together, in place.
	tl.to(
		[one("cut-2"), ...marks],
		{ opacity: 0, duration: 0.35, ease: "power2.in" },
		15.6,
	);
	// In place, not slid down: a slide would carry its label through the correction's row.
	tl.fromTo(one("cut-3"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 15.95);
	knownTo(3, 15.95);
	tl.set(one("arr-1-box"), { attr: { class: "wt-panel-shape" } }, 15.95);
	tl.set(one("arr-2-box"), { attr: { class: "wt-focus-shape" } }, 15.95);
	tl.to(arrs[3], { opacity: 0.25, duration: 0.3 }, 17.4);

	// ——— rank: the hero. A percentile is a rank. ———
	// Remove redundant cutoff still time; let the distribution settle before selection.
	tl.addLabel("rank", 20.2);
	tl.set(one("arr-2-box"), { attr: { class: "wt-panel-shape" } }, 20.2);
	d.swap(heads[2], heads[3], 20.2);
	hide([...arrs, ...marks, one("cut-3")], 20.2);
	show(kids("hist"), 20.6);
	bins.forEach((bin, i) => {
		const h = Number(bin.getAttribute("height"));
		tl.fromTo(
			bin,
			{ opacity: 1, attr: { y: L.histBottom, height: 0 } },
			{
				attr: { y: L.histBottom - h, height: h },
				duration: 0.5,
				ease: "power2.out",
			},
			20.8 + i * 0.06,
		);
	});
	// Compare first, then select the historical sessions strictly below today.
	// Fade in place: the marker already names its final 4.2× coordinate.
	tl.fromTo(one("today"), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 20.8);
	// The final bin settles at 21.84: 1.06 s to inspect the distribution.
	tl.set(
		bins.filter((_, i) => history[i].from + BUCKET <= TODAY),
		{ attr: { "data-tone": "total" } },
		22.9,
	);
	tl.fromTo(
		[one("lower-counts"), one("lower"), one("today-context")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		22.9,
	);
	// The settled 58 / 60 proof rests 1.3 s before its rounded answer arrives.
	word(one("pct"), 24.7);
	tl.fromTo(misreading, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 25.2);
	// Lock only the rank; its rejected interpretation stays in a separate lane below.
	d.lock(lockPct, 25.7, { around: [one("pct")], pad: HERO_PAD });
	tl.addLabel("hero-lock", 25.7);
	show(heads[4], 25.7);

	// ——— holdout: many tried, one kept ———
	tl.addLabel("holdout", 29.3);
	d.swap([heads[3], heads[4]], heads[5], 29.3);
	hide(
		[
			...kids("hist"),
			...bins,
			one("lower-counts"),
			one("lower"),
			one("today-context"),
			one("today"),
			one("pct"),
			lockPct,
			one("not-chance"),
		],
		29.3,
	);
	// Simplify to one chart entrance after the hero is gone at 29.65.
	// Every entrance still lasts 0.5 s; the settled chart rests 30.2–31.2.
	show(kids("search-axis"), 29.7);
	show(tries, 29.7);
	tl.set(
		one(`try-${BEST_INDEX}-bar`),
		{ attr: { "data-tone": "total" } },
		31.2,
	);
	word(one("best"), 31.2);
	tl.fromTo(
		one("frozen-rule"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		31.2,
	);
	tl.to(
		tried.flatMap((_, i) => (i === BEST_INDEX ? [] : [one(`try-${i}-bar`)])),
		{ opacity: 0.55, duration: 0.4 },
		31.4,
	);
	// Let the in-sample result rest for 1 s, then hand focus to the observed holdout: the bar
	// steps back and its label turns ink, staying readable as the claim it is checked against.
	tl.to(
		one(`try-${BEST_INDEX}-bar`),
		{ opacity: 0.3, duration: 0.3, ease: "power2.in" },
		32.8,
	);
	tl.set(one("best"), { attr: { class: "wt-film-num" } }, 32.8);
	tl.fromTo(one("hold"), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 33.1);
	show(heads[6], 34.4);

	// ——— claim ———
	tl.addLabel("claim", 38.0);
	hide(
		[
			heads[5],
			heads[6],
			...kids("search-axis"),
			...tries,
			one("best"),
			one("frozen-rule"),
			one("hold"),
		],
		38.0,
	);
	word(one("z-big"), 38.3);
	show(one("z-sub"), 38.7);

	// ——— next ———
	tl.addLabel("next", 42.4);
	hide(kids("claim"), 42.4);
	d.close(42.4);
	return tl;
}

export const pointInTimeResearchFilm: Film = {
	id: "point-in-time-research",
	label: [
		`Backtests, as a short film: Monday's facts about the Oct 18 105 call in the order they arrived, where a decision replayed at ${openingDecisionTime[0]} may use only the block's first report at ${usd(REPORTED)}, one at ${timeOnly(correctionCutoff.time)[0]} the corrected ${usd(CORRECTED)}, and none the 120 call's volume that arrives Tuesday; today's ${TODAY}× against ${SESSIONS} past sessions, the ${PERCENTILE}th percentile, which is a rank and not a ${PERCENTILE}% chance of a rise; and ${tried.length} thresholds tried on Jan–Jun, the best followed by a rise ${best.rose}% of the time, and the same rule frozen and run once on Jul–Aug at ${HOLDOUT}%`,
		`回测短片：周一关于 10月18日 105 看涨的事实按到达顺序排列：在 ${openingDecisionTime[1]} 重放的决策只能用大单首次报告的 ${usd(REPORTED)}，${timeOnly(correctionCutoff.time)[1]} 的决策可以用更正后的 ${usd(CORRECTED)}，而周二才到的 120 看涨成交量哪个都不能用；今天的 ${TODAY}× 对照过去 ${SESSIONS} 个交易日，是第 ${PERCENTILE} 百分位，这是排名而不是 ${PERCENTILE}% 的上涨概率；以及在 1–6 月数据上试验的 ${tried.length} 个门槛，最好的一个之后上涨比例 ${best.rose}%，同一规则冻结后在 7–8 月只跑一次，结果为 ${HOLDOUT}%`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Backtests", "回测"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "cutoff", label: ["What was known", "当时已知"] },
		{ id: "rank", label: ["A percentile", "百分位"] },
		{ id: "holdout", label: ["The holdout", "样本外"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一步"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
