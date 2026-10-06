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
	Word,
} from "../walkthrough/film-kit";
import {
	arrivals,
	BUCKET,
	best,
	CORRECTED,
	HOLDOUT,
	history,
	PERCENTILE,
	REPORTED,
	SESSIONS,
	TODAY,
	tried,
} from "./point-in-time-research-model";

/*
 * Backtests, as a film. A backtest replays a decision at 10:50:01 on Monday: which price
 * may it use for the 500-lot? The arrivals answer: only the first report, $2.51; the
 * correction to $2.15 arrives later, and the 120 call's volume not until Tuesday. The hero
 * is a percentile: today's 4.2× beats 58 of 60 sessions, the 97th percentile, and glowing
 * brackets lock on a rank that is not a probability. Last, ten thresholds tried on
 * Jan–Jun, the best at 70%, and the same rule frozen and run once on Jul–Aug: 52%.
 *
 *   open      0–4        "Backtests"
 *   question  4–8.6      a decision at 10:50:01: which price?
 *   cutoff    8.6–20.8   arrivals; at 10:50:01, $2.51; at 10:51, $2.15; Tuesday's data
 *   rank      20.8–29.4  hero: 60 sessions; 4.2× at the 97th percentile; not a probability
 *   holdout   29.4–36.4  ten thresholds; the winner 70%; the holdout 52%
 *   claim     36.4–40.8  only what was known, and test once
 *   next      40.8–43.3  Next: the module checkpoint
 */

const END = 43.3;
const MAX_DAYS = Math.max(...history.map((b) => b.days));
const TODAY_BUCKET = history.findIndex(
	(b) => TODAY >= b.from && TODAY < b.from + BUCKET,
);
const BEST_INDEX = tried.indexOf(best);

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const timeW = narrow ? room * 0.32 : room * 0.22;
	const histTop = H * (narrow ? 0.34 : 0.32);
	const histBottom = H * (narrow ? 0.72 : 0.74);
	const slot = room / history.length;
	const barSlot = room / tried.length;
	return {
		...frame,
		/** Rows leave a gap above each one for the decision rule and its label. */
		arrY: (i: number) => H * 0.29 + i * H * 0.155,
		arrH: H * 0.095,
		timeW,
		histTop,
		histBottom,
		slot,
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
	qTag: ["a backtest · Mon 10:50:01", "回测 · 周一 10:50:01"],
	qLine: [
		"It replays a decision just after the 500-lot block.",
		"它重放 500 张大单之后一刻的决策。",
	],
	qBig: ["Which price may it use?", "它可以用哪个价格？"],
	cHead: ["Monday's facts, in order of arrival.", "周一的事实，按到达顺序。"],
	c2Head: [
		`At 10:50:01 it may use only ${usd(REPORTED)}.`,
		`10:50:01 时只能用 ${usd(REPORTED)}。`,
	],
	c3Head: ["Later facts count once they arrive.", "后来的事实，到了才算数。"],
	known: ["known", "已知"],
	notYet: ["not yet", "还没到"],
	decision: ["decision", "决策时刻"],
	rHead: [
		`Today's ${TODAY}× against ${SESSIONS} sessions.`,
		`今天的 ${TODAY}× 对照 ${SESSIONS} 个交易日。`,
	],
	r2Head: [
		`The ${PERCENTILE}th percentile: a rank, not a chance.`,
		`第 ${PERCENTILE} 百分位：是排名，不是概率。`,
	],
	today: [`today ${TODAY}×`, `今天 ${TODAY}×`],
	axis: ["volume ÷ typical", "成交量 ÷ 常态"],
	hHead: [
		`${tried.length} thresholds, tried on Jan–Jun.`,
		`${tried.length} 个门槛，在上半年数据上试验。`,
	],
	h2Head: [
		`Frozen, then run once: ${HOLDOUT}%.`,
		`冻结后只跑一次：${HOLDOUT}%。`,
	],
	rose: ["rose next day", "次日上涨"],
	holdout: [`Jul–Aug holdout ${HOLDOUT}%`, `7–8 月样本外 ${HOLDOUT}%`],
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
						style={{ fontSize: narrow ? T.small : text }}
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
						className={`wt-film-tag ${state === "known" ? "wt-film-gain" : "wt-film-dim"}`}
						style={{ fontSize: T.small }}
					>
						{t(copy[state]).toUpperCase()}
					</text>
				)),
			)}
			{/* The decision time, a rule across the list between what had arrived and what hadn't. */}
			{[2, 3].map((k) => (
				<g key={k} data-f={`cut-${k}`}>
					<path
						d={`M${margin - 6} ${L.arrY(k) - 5}H${margin + room + 6}`}
						style={{
							stroke: "var(--diagram-accent)",
							strokeWidth: 2,
							strokeDasharray: "6 4",
						}}
					/>
					<text
						x={margin + room}
						y={L.arrY(k) - 10}
						textAnchor="end"
						className="wt-film-tag wt-film-accent"
						style={{ fontSize: T.small }}
					>
						{`${t(copy.decision).toUpperCase()} · ${k === 2 ? "10:50:01" : "10:51"}`}
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
								style={{ fontSize: T.small * 0.95 }}
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
					style={{ fontSize: T.small * 0.95 }}
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
					data-tone={i === TODAY_BUCKET ? "total" : "neutral"}
				/>
			))}
			<g data-f="today">
				<path
					d={`M${L.histX(0) + (TODAY / BUCKET) * L.slot} ${L.histTop - 8}V${L.histBottom}`}
					style={{ stroke: "var(--diagram-accent)", strokeWidth: 2 }}
				/>
				<text
					x={L.histX(0) + (TODAY / BUCKET) * L.slot - 6}
					y={L.histTop - 14}
					textAnchor="end"
					className="wt-film-num wt-film-accent"
					style={{ fontSize: T.small * 1.1 }}
				>
					{t(copy.today)}
				</text>
			</g>
			<text
				data-f="pct"
				x={L.histX(0) + (TODAY / BUCKET) * L.slot - 12}
				y={L.histTop + T.num * 1.2}
				textAnchor="end"
				className="wt-film-num wt-film-accent"
				style={{ fontSize: T.num * 1.3 }}
			>
				{`${PERCENTILE}th`}
			</text>
			<text
				data-f="not-chance"
				x={L.histX(0) + (TODAY / BUCKET) * L.slot - 12}
				y={L.histTop + T.num * 1.2 + T.body * 1.8}
				textAnchor="end"
				className="wt-film-type wt-film-loss"
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
					<text
						x={L.barX(i) + L.barSlot / 2}
						y={L.histBottom + T.small * 1.6}
						textAnchor="middle"
						className="wt-film-num wt-film-dim"
						style={{ fontSize: T.small * (narrow ? 0.85 : 0.95) }}
					>
						{`${r.threshold}`}
					</text>
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
				{`${best.rose}%`}
			</text>
			<g data-f="hold">
				<path
					d={`M${L.barX(BEST_INDEX) - L.barSlot * 0.6} ${L.pctY(HOLDOUT)}H${L.barX(BEST_INDEX) + L.barSlot * 1.6}`}
					style={{ stroke: "var(--diagram-unknown)", strokeWidth: 3 }}
				/>
				<text
					x={
						narrow
							? L.barX(BEST_INDEX) - L.barSlot * 0.7
							: L.barX(BEST_INDEX) + L.barSlot * 1.7
					}
					y={L.pctY(HOLDOUT) + T.small * 0.4}
					textAnchor={narrow ? "end" : "start"}
					className="wt-film-num wt-film-warn wt-halo"
					style={{ fontSize: text }}
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
	const arrs = arrivals.map((_, i) => one(`arr-${i}`));
	const marks = arrivals.flatMap((_, i) => [
		one(`arr-${i}-known`),
		one(`arr-${i}-notYet`),
	]);
	const bins = history.map((_, i) => one(`bin-${i}`));
	const tries = tried.map((_, i) => one(`try-${i}`));
	/** The decision moves: everything above the rule is known, the rest isn't yet. */
	const knownTo = (cut: number, time: number) => {
		arrivals.forEach((_, i) => {
			const known = i < cut;
			tl.set(one(`arr-${i}-known`), { opacity: known ? 1 : 0 }, time);
			tl.set(one(`arr-${i}-notYet`), { opacity: known ? 0 : 1 }, time);
			tl.to(arrs[i], { opacity: known ? 1 : 0.45, duration: 0.3 }, time);
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
		one("today"),
		one("pct"),
		lockPct,
		one("not-chance"),
		...kids("search-axis"),
		...tries,
		one("best"),
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
	show(one("q-line"), 5.1);
	word(one("q-big"), 6.4);

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
	hide(one("cut-2"), 15.6, 0.25);
	// In place, not slid down: a slide would carry its label through the correction's row.
	tl.fromTo(
		one("cut-3"),
		{ opacity: 0, x: -20 },
		{ opacity: 1, x: 0, duration: 0.4 },
		15.7,
	);
	// The marks turn as the rule sets off, so it never passes a stale "not yet".
	knownTo(3, 15.7);
	tl.set(one("arr-1-box"), { attr: { class: "wt-panel-shape" } }, 15.7);
	tl.set(one("arr-2-box"), { attr: { class: "wt-focus-shape" } }, 15.7);
	tl.to(arrs[3], { opacity: 0.25, duration: 0.3 }, 16.8);

	// ——— rank: the hero. A percentile is a rank. ———
	tl.addLabel("rank", 20.8);
	tl.set(one("arr-2-box"), { attr: { class: "wt-panel-shape" } }, 20.8);
	d.swap(heads[2], heads[3], 20.8);
	hide([...arrs, ...marks, one("cut-3")], 20.8);
	show(kids("hist"), 21.4);
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
			21.6 + i * 0.06,
		);
	});
	show(one("today"), 23.4);
	word(one("pct"), 24.8);
	show(one("not-chance"), 25.3);
	// Round the percentile and what it isn't: the pair is the answer.
	d.lock(lockPct, 25.8, { around: [one("pct"), one("not-chance")], pad: 6 });
	tl.addLabel("hero-lock", 25.8);
	show(heads[4], 25.8);

	// ——— holdout: many tried, one kept ———
	tl.addLabel("holdout", 29.4);
	d.swap([heads[3], heads[4]], heads[5], 29.4);
	hide(
		[
			...kids("hist"),
			...bins,
			one("today"),
			one("pct"),
			lockPct,
			one("not-chance"),
		],
		29.4,
	);
	show(kids("search-axis"), 29.8);
	tries.forEach((tr, i) => {
		show(tr, 30.0 + i * 0.1);
	});
	tl.set(
		one(`try-${BEST_INDEX}-bar`),
		{ attr: { "data-tone": "total" } },
		31.2,
	);
	word(one("best"), 31.2);
	tl.to(
		tries.filter((_, i) => i !== BEST_INDEX),
		{ opacity: 0.35, duration: 0.4 },
		31.4,
	);
	tl.fromTo(
		one("hold"),
		{ opacity: 0, y: -(L.pctY(HOLDOUT) - L.pctY(best.rose)) },
		{ opacity: 1, y: 0, duration: 0.8, ease: "power2.inOut" },
		32.0,
	);
	show(heads[6], 32.8);

	// ——— claim ———
	tl.addLabel("claim", 36.4);
	hide(
		[
			heads[5],
			heads[6],
			...kids("search-axis"),
			...tries,
			one("best"),
			one("hold"),
		],
		36.4,
	);
	word(one("z-big"), 36.7);
	show(one("z-sub"), 37.1);

	// ——— next ———
	tl.addLabel("next", 40.8);
	hide(kids("claim"), 40.8);
	d.close(40.8);
	return tl;
}

export const pointInTimeResearchFilm: Film = {
	id: "point-in-time-research",
	label: [
		`Backtests, as a short film: Monday's facts about the Oct 18 105 call in the order they arrived, where a decision replayed at 10:50:01 may use only the block's first report at ${usd(REPORTED)}, one at 10:51 the corrected ${usd(CORRECTED)}, and none the 120 call's volume that arrives Tuesday; today's ${TODAY}× against ${SESSIONS} past sessions, the ${PERCENTILE}th percentile, which is a rank and not a ${PERCENTILE}% chance of a rise; and ${tried.length} thresholds tried on Jan–Jun, the best followed by a rise ${best.rose}% of the time, and the same rule frozen and run once on Jul–Aug at ${HOLDOUT}%`,
		`回测短片：周一关于 10月18日 105 看涨的事实按到达顺序排列：在 10:50:01 重放的决策只能用大单首次报告的 ${usd(REPORTED)}，10:51 的决策可以用更正后的 ${usd(CORRECTED)}，而周二才到的 120 看涨成交量哪个都不能用；今天的 ${TODAY}× 对照过去 ${SESSIONS} 个交易日，是第 ${PERCENTILE} 百分位，这是排名而不是 ${PERCENTILE}% 的上涨概率；以及在 1–6 月数据上试验的 ${tried.length} 个门槛，最好的一个之后上涨比例 ${best.rose}%，同一规则冻结后在 7–8 月只跑一次，结果为 ${HOLDOUT}%`,
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
