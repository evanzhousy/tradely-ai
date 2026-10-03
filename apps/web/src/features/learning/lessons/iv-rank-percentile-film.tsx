import { useId } from "react";
import {
	ALFA_IV30_TODAY,
	alfaIv30Weekly,
	type Copy,
	pick,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import type { Film, FilmContext } from "../walkthrough/film";
import {
	Backdrop,
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
	GAP,
	gapped,
	noShock,
	pct,
	RECENT,
	recent,
	SHOCK,
	WEEKS,
	year,
} from "./iv-rank-percentile-model";

/*
 * IV rank and IV percentile, as a film. It opens on one day and two answers that disagree,
 * rank 28% and percentile 92%, and shows why on a year of ALFA's weekly IV30. Rank places
 * today between the low and the high; percentile counts the weeks below. One shock week
 * sets the high, so dropping it doubles the rank and barely moves the percentile. Then
 * the history itself: a calm quarter, or a year with the shock lost in a gap, puts today
 * above everything.
 *
 *   open        0–4     "IV rank and IV percentile"
 *   question    4–9.5   ALFA's IV30 35% today: rank 28%, percentile 92%, same day
 *   year        9.5–14.5  a year of weekly IV30 and today's line
 *   rank        14.5–21   the range 22% to 68%, today 28% of the way up
 *   percentile  21–27     48 of 52 weeks below today: 92%
 *   outlier     27–34     drop the 68% week: rank 59%, percentile 94%
 *   sample      34–43.5   the last 13 weeks: 100%; the year with a gap: 100% of 44;
 *                         cut: "Say the measure, the window and the coverage."
 *   next        43.5–46  Next: from delta to DEX and DEI
 */

const END = 46;
const Y_MAX = 72;
const TODAY = ALFA_IV30_TODAY;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	const left = frame.margin;
	/** Room on the right for the range bracket and its labels. */
	const right = width * (narrow ? 0.8 : 0.84);
	const top = height * (narrow ? 0.42 : 0.31);
	const bottom = height * 0.82;
	const slot = (right - left) / WEEKS;
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		slot,
		barX: (i: number) => left + slot * (i + 0.5),
		barWidth: Math.max(slot * 0.66, 1.5),
		y: (iv: number) => bottom - (iv / Y_MAX) * (bottom - top),
		bracketX: right + (narrow ? 10 : 18),
		pair: narrow ? [0.27, 0.73] : [0.32, 0.68],
	};
}

const copy = {
	title: ["IV rank and IV percentile", "IV Rank 与 IV 百分位"],
	titleSub: ["where today sits in its own history", "今天在自身历史中的位置"],
	qTagRank: ["IV rank", "IV Rank"],
	qTagPct: ["IV percentile", "IV 百分位"],
	qLine: [
		`ALFA's IV30 is ${TODAY}% today. Same day, same history: low or high?`,
		`ALFA 今天的 IV30 为 ${TODAY}%。同一天、同一段历史：低还是高？`,
	],
	yearHead: [
		"A year of ALFA's IV30, week by week.",
		"ALFA 一年来每周的 IV30。",
	],
	yearHeadShort: ["A year of weekly IV30.", "一年的每周 IV30。"],
	axis: ["ALFA IV30, weekly", "ALFA IV30，每周"],
	today: [`today ${TODAY}%`, `今天 ${TODAY}%`],
	rankHead: [
		"Rank: where today sits between the low and the high.",
		"Rank：今天在最低与最高之间的位置。",
	],
	rankHeadShort: [
		"Rank: between the low and high.",
		"Rank：在高低之间的位置。",
	],
	rankFormula: [
		`(${TODAY} − ${year.low}) ÷ (${year.high} − ${year.low}) = ${pct(year.rank)}`,
		`(${TODAY} − ${year.low}) ÷ (${year.high} − ${year.low}) = ${pct(year.rank)}`,
	],
	pctHead: [
		"Percentile: how many weeks were lower.",
		"百分位：有多少周比今天低。",
	],
	pctHeadShort: ["Percentile: how many were lower.", "百分位：多少周更低。"],
	pctFormula: [
		`${year.below} of ${year.n} weeks = ${pct(year.percentile)}`,
		`${year.n} 周中 ${year.below} 周 = ${pct(year.percentile)}`,
	],
	outlierHead: ["One week set the high: drop it.", "最高值来自一周：去掉它。"],
	sampleHead: [
		`The last ${RECENT} weeks only: today is above them all.`,
		`只看最近 ${RECENT} 周：今天高于所有周。`,
	],
	sampleHeadShort: [
		`The last ${RECENT} weeks only.`,
		`只看最近 ${RECENT} 周。`,
	],
	gapHead: [
		`A year with ${GAP.to - GAP.from + 1} weeks lost, the shock among them.`,
		`一年中丢了 ${GAP.to - GAP.from + 1} 周，冲击那周也在其中。`,
	],
	gapHeadShort: [
		`A year with ${GAP.to - GAP.from + 1} weeks lost.`,
		`丢了 ${GAP.to - GAP.from + 1} 周的一年。`,
	],
	rankWas: ["rank", "Rank"],
	pctWas: ["percentile", "百分位"],
	high: ["high", "最高"],
	low: ["low", "最低"],
	missing: ["missing", "缺失"],
	claimBig: [
		"Say the measure, the window and the coverage.",
		"说明指标、窗口和覆盖范围。",
	],
	claimSub: [
		"Rank and percentile answer different questions about the same day.",
		"Rank 和百分位对同一天回答的是不同的问题。",
	],
	nextBig: ["Next: DEX and DEI", "下一课：DEX 与 DEI"],
	nextSub: [
		"from one option's delta to the flow's",
		"从一张期权的 Delta 到整个成交流的 Delta",
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
	const headline = (name: string, text: Copy, short: Copy = text) => (
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
	const formula = (name: string, text: string, tone: string) => {
		const size = Math.min(T.head * 1.2, (room / (text.length * 0.6)) * 0.98);
		return (
			<Word
				name={name}
				x={L.margin}
				y={L.headY + T.head * 1.1 + size}
				size={size}
				anchor="start"
				className={`wt-film-num ${tone}`}
			>
				{text}
			</Word>
		);
	};
	/** The outlier's readings, as large as two stacked lines allow. */
	const oSize = Math.min(T.big * 0.7, room / (9 * 0.62));
	const gapX = L.left + L.slot * GAP.from;
	const gapW = L.slot * (GAP.to - GAP.from + 1);
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<Hatch id={`hatch-${id}`} />
			</defs>

			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart">
						{[20, 40, 60].map((tick) => (
							<g key={tick}>
								<path
									d={`M${L.left} ${L.y(tick)}H${L.right}`}
									className="wt-grid"
								/>
								<text
									x={L.left - 8}
									y={L.y(tick) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{`${tick}%`}
								</text>
							</g>
						))}
						<path d={`M${L.left} ${L.y(0)}H${L.right}`} className="wt-axis" />
						{/* On a phone the headline names the chart, and a formula needs the room. */}
						{narrow ? null : (
							<text x={L.left} y={L.top - 12} className="wt-small">
								{t(copy.axis)}
							</text>
						)}
						<text x={L.left} y={L.bottom + 18} className="wt-small">
							{t(["Sep 2029", "2029年9月"])}
						</text>
						<text
							x={L.right}
							y={L.bottom + 18}
							textAnchor="end"
							className="wt-small"
						>
							{t(["Sep 13", "9月13日"])}
						</text>
						<rect
							data-f="gap"
							x={gapX}
							y={L.top}
							width={gapW}
							height={L.bottom - L.top}
							fill={`url(#hatch-${id})`}
						/>
						<text
							data-f="gap-label"
							x={gapX + gapW / 2}
							y={L.top + 14}
							textAnchor="middle"
							className="wt-small wt-halo"
						>
							{t(copy.missing)}
						</text>
						{alfaIv30Weekly.map((iv, i) => (
							<rect
								key={`week-${i}`}
								data-f={`bar-${i}`}
								className="wt-film-bar"
								data-tone={iv < TODAY ? "neutral" : "loss"}
								x={L.barX(i) - L.barWidth / 2}
								y={L.y(0)}
								width={L.barWidth}
								height={0}
								rx={1}
							/>
						))}
						<g data-f="today">
							<path
								d={`M${L.left} ${L.y(TODAY)}H${L.right}`}
								className="wt-bracket"
							/>
							<text
								x={L.left + 6}
								y={L.y(TODAY) - 7}
								className="wt-halo wt-accent wt-marker-label"
							>
								{t(copy.today)}
							</text>
						</g>
						<g data-f="bracket">
							<path
								data-f="bracket-line"
								d={`M${L.bracketX} ${L.y(year.low)}V${L.y(year.high)}`}
								className="wt-film-tangent"
							/>
							<path
								data-f="bracket-high"
								d={`M${L.bracketX - 6} ${L.y(year.high)}h12`}
								className="wt-film-tangent"
							/>
							<path
								d={`M${L.bracketX - 6} ${L.y(year.low)}h12`}
								className="wt-film-tangent"
							/>
							<text
								data-f="bracket-high-label"
								x={L.bracketX + 10}
								y={L.y(year.high) + 4}
								className="wt-small"
							>
								{`${year.high}%`}
							</text>
							<text
								x={L.bracketX + 10}
								y={L.y(year.low) + 4}
								className="wt-small"
							>
								{`${year.low}%`}
							</text>
							<circle
								data-f="bracket-dot"
								cx={L.bracketX}
								cy={L.y(TODAY)}
								r={6}
								className="wt-chip"
							/>
							<text
								data-f="bracket-rank"
								x={L.bracketX - 10}
								y={L.y(TODAY) - 8}
								textAnchor="end"
								className="wt-halo wt-accent wt-marker-label"
							>
								{pct(year.rank)}
							</text>
						</g>
					</g>
				</g>
			</g>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				{(
					[
						[copy.qTagRank, pct(year.rank), ""],
						[copy.qTagPct, pct(year.percentile), "wt-film-accent"],
					] as const
				).map(([tag, num, tone], i) => (
					<g key={tag[0]}>
						<Word
							name={`q-tag-${i}`}
							x={W * L.pair[i]}
							y={H * 0.3}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`q-num-${i}`}
							x={W * L.pair[i]}
							y={H * 0.3 + T.big * 0.95}
							size={T.big * 0.9}
							className={`wt-film-num ${tone}`}
						>
							{num}
						</Word>
					</g>
				))}
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.74}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("y-head", copy.yearHead, copy.yearHeadShort)}
			{headline("r-head", copy.rankHead, copy.rankHeadShort)}
			{formula("r-formula", t(copy.rankFormula), "wt-film-accent")}
			{headline("p-head", copy.pctHead, copy.pctHeadShort)}
			{formula("p-formula", t(copy.pctFormula), "wt-film-accent")}
			{headline("o-head", copy.outlierHead)}
			<g data-f="o">
				{(
					[
						[copy.rankWas, year.rank, noShock.rank],
						[copy.pctWas, year.percentile, noShock.percentile],
					] as const
				).map(([tag, from, to], i) => (
					<g key={tag[0]}>
						<Word
							name={`o-tag-${i}`}
							x={W / 2}
							y={H * (0.24 + i * 0.32)}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`o-num-${i}`}
							x={W / 2}
							y={H * (0.24 + i * 0.32) + oSize * 1.15}
							size={oSize}
							className={`wt-film-num ${i === 0 ? "wt-film-accent" : ""}`}
						>
							{`${pct(from)} → ${pct(to)}`}
						</Word>
					</g>
				))}
			</g>
			{headline("s-head", copy.sampleHead, copy.sampleHeadShort)}
			{headline("g-head", copy.gapHead, copy.gapHeadShort)}
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
	const { tl, one, kids, show, hide, slam, rise, sink } = d;
	const flat = (name: string) =>
		kids(name).flatMap((el) => (el.tagName === "g" ? [...el.children] : [el]));
	const bars = alfaIv30Weekly.map((_, i) => one(`bar-${i}`));
	const below = bars.filter((_, i) => alfaIv30Weekly[i] < TODAY);
	const above = bars.filter((_, i) => alfaIv30Weekly[i] >= TODAY);
	const rank = one<SVGTextElement>("bracket-rank");
	const highLabel = one<SVGTextElement>("bracket-high-label");
	/** The bracket's top edge, its labels and its dot, moved from one history to another. */
	const bracketTo = (
		from: { high: number; rank: number },
		to: { high: number; rank: number },
		at: number,
	) => {
		const move = { duration: 0.7, ease: "power2.inOut" };
		tl.to(
			one("bracket-line"),
			{
				attr: { d: `M${L.bracketX} ${L.y(year.low)}V${L.y(to.high)}` },
				...move,
			},
			at,
		);
		tl.to(
			one("bracket-high"),
			{ attr: { d: `M${L.bracketX - 6} ${L.y(to.high)}h12` }, ...move },
			at,
		);
		tl.to(highLabel, { attr: { y: L.y(to.high) + 4 }, ...move }, at);
		tl.to(
			one("bracket-dot"),
			{ attr: { cy: L.y(Math.min(TODAY, to.high)) }, ...move },
			at,
		);
		d.count(
			highLabel,
			to.high,
			at,
			(value) => `${Math.round(value)}%`,
			from.high,
		);
		d.count(
			rank,
			to.rank * 100,
			at,
			(value) => `${Math.round(value)}%`,
			from.rank * 100,
		);
	};

	d.hidden([
		one("gap"),
		one("gap-label"),
		one("today"),
		one("bracket"),
		...flat("q"),
		...[
			"y-head",
			"r-head",
			"r-formula",
			"p-head",
			"p-formula",
			"o-head",
			"s-head",
			"g-head",
		].map((name) => one(name)),
		...flat("o"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: two answers for one day ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag-0"), 4.6);
	slam(one("q-num-0"), 4.8);
	show(one("q-tag-1"), 5.6);
	slam(one("q-num-1"), 5.8);
	show(one("q-line"), 6.8);

	// ——— year: the history ———
	tl.addLabel("year", 9.5);
	hide(flat("q"), 9.5);
	show(one("y-head"), 9.7, "above");
	rise(9.8);
	alfaIv30Weekly.forEach((iv, i) => {
		tl.fromTo(
			bars[i],
			{ attr: { y: L.y(0), height: 0 } },
			{
				attr: { y: L.y(iv), height: L.y(0) - L.y(iv) },
				duration: 0.4,
				ease: "back.out(1.4)",
			},
			10.4 + i * 0.035,
		);
	});
	tl.fromTo(
		one("today"),
		{ opacity: 0, x: -20 },
		{ opacity: 1, x: 0, duration: 0.6 },
		12.6,
	);

	// ——— rank: between the extremes ———
	tl.addLabel("rank", 14.5);
	d.swap(one("y-head"), one("r-head"), 14.5);
	tl.fromTo(
		one("bracket"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		15.2,
	);
	tl.fromTo(
		one("bracket-dot"),
		{ attr: { cy: L.y(year.low) } },
		{ attr: { cy: L.y(TODAY) }, duration: 0.8, ease: "power2.out" },
		15.5,
	);
	d.count(rank, year.rank * 100, 15.5, (value) => `${Math.round(value)}%`);
	// The week that sets the high, picked out.
	tl.set(bars[SHOCK], { attr: { "data-tone": "total" } }, 16.4);
	show(one("r-formula"), 17.0);

	// ——— percentile: the weeks below ———
	tl.addLabel("percentile", 21);
	hide([one("r-head"), one("r-formula")], 21.0);
	show(one("p-head"), 21.35, "above");
	tl.to(one("bracket"), { opacity: 0.25, duration: 0.4 }, 21.2);
	tl.to(above, { opacity: 0.25, duration: 0.4 }, 21.6);
	tl.to(below, { opacity: 1, duration: 0.2 }, 21.6);
	show(one("p-formula"), 22.4);

	// ——— outlier: one week sets the high ———
	tl.addLabel("outlier", 27);
	hide([one("p-head"), one("p-formula")], 27.0);
	show(one("o-head"), 27.35, "above");
	tl.to([...above, one("bracket")], { opacity: 1, duration: 0.4 }, 27.2);
	tl.to(
		bars[SHOCK],
		{
			attr: { y: L.y(0), height: 0 },
			duration: 0.6,
			ease: "power2.in",
		},
		28.0,
	);
	bracketTo(year, noShock, 28.6);
	hide(one("o-head"), 30.2);
	sink(30.2);
	show(one("o-tag-0"), 30.6);
	slam(one("o-num-0"), 30.8);
	show(one("o-tag-1"), 31.5);
	slam(one("o-num-1"), 31.7);

	// ——— sample: the history itself ———
	tl.addLabel("sample", 34);
	hide(flat("o"), 34.0);
	rise(34.2);
	show(one("s-head"), 34.35, "above");
	// Put the shock back, then keep only the last 13 weeks.
	tl.to(
		bars[SHOCK],
		{
			attr: {
				y: L.y(alfaIv30Weekly[SHOCK]),
				height: L.y(0) - L.y(alfaIv30Weekly[SHOCK]),
			},
			duration: 0.4,
		},
		34.2,
	);
	tl.to(bars.slice(0, WEEKS - RECENT), { opacity: 0.12, duration: 0.6 }, 34.8);
	bracketTo(noShock, recent, 35.3);
	// Above the high, the formula passes 100%: shown as it is, not capped.
	tl.set(rank, { attr: { class: "wt-halo wt-loss wt-marker-label" } }, 35.6);
	// The full year again, with the outage's gap.
	d.swap(one("s-head"), one("g-head"), 38.5);
	tl.to(bars.slice(0, WEEKS - RECENT), { opacity: 1, duration: 0.5 }, 38.7);
	tl.to(bars.slice(GAP.from, GAP.to + 1), { opacity: 0, duration: 0.4 }, 39.1);
	tl.to([one("gap"), one("gap-label")], { opacity: 1, duration: 0.5 }, 39.3);
	bracketTo(recent, gapped, 39.4);
	// Cut: the claim.
	hide(one("g-head"), 41.0);
	sink(41.0);
	tl.fromTo(
		one("c-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
		41.4,
	);
	show(one("c-sub"), 41.9);

	// ——— next ———
	tl.addLabel("next", 43.5);
	hide(kids("claim"), 43.5);
	d.close(43.5);
	return tl;
}

export const ivRankPercentileFilm: Film = {
	id: "iv-rank-percentile",
	label: [
		"IV rank and IV percentile, as a short film: ALFA's IV30 of 35% today reads as a 28% rank and a 92% percentile on the same year of weekly history; rank places today between the low and the high, percentile counts the weeks below; dropping the one 68% week doubles the rank and barely moves the percentile; and a calm quarter or a year with the shock lost in a gap puts today above everything",
		"IV Rank 与 IV 百分位短片：ALFA 今天 35% 的 IV30，在同一年的每周历史上读作 28% 的 Rank 和 92% 的百分位；Rank 把今天放在最低与最高之间，百分位统计低于今天的周数；去掉那唯一一周的 68%，Rank 翻倍而百分位几乎不动；而平静的一个季度、或丢失了冲击那周的一年，都会让今天高于所有值",
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["IV rank and percentile", "IV Rank 与百分位"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "year", label: ["The year", "这一年"] },
		{ id: "rank", label: ["Rank", "Rank"] },
		{ id: "percentile", label: ["Percentile", "百分位"] },
		{ id: "outlier", label: ["One outlier", "一个极端值"] },
		{ id: "sample", label: ["The sample", "样本"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
