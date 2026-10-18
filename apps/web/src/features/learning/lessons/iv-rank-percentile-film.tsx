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
	Brackets,
	createDirector,
	EndCard,
	filmFrame,
	Hatch,
	Lines,
	lineCount,
	TitleCard,
	toneClass,
	Word,
} from "../walkthrough/film-kit";
import { textWidth } from "../walkthrough/text-measure";
import {
	GAP,
	gapped,
	noShock,
	pct,
	RECENT,
	rankText,
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
 *   open        0–4       "IV rank and IV percentile"
 *   question    4–9.6     ALFA's IV30 35% today: rank 28%, percentile 92%, same day
 *   year        9.6–13.4  a year of weekly IV30 and today's line
 *   rank        13.4–18.2 the range 22% to 68%, today 28% of the way up
 *   percentile  18.2–22.6 48 of 52 weeks below today: 92%
 *   outlier     22.6–31.85 drop the 68% week; cut: rank 28% → 59%, locked, percentile
 *                         92% → 94%
 *   sample      31.85–45 the last 13 weeks: 100%; the year with a gap: 100% of 44;
 *                         cut: "Say the measure, the window and the coverage."
 *   next        45–47.5  Next: from delta to DEX and DEI
 */

const END = 47.5;
const Y_MAX = 72;
const TODAY = ALFA_IV30_TODAY;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	// On a phone the IV labels need room left of the axis.
	const left = frame.margin + (narrow ? 18 : 0);
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
		"Same day, same history: low or high?",
		"同一天、同一段历史：低还是高？",
	],
	yearHead: ["A year of ALFA's weekly IV30.", "ALFA 一年来每周的 IV30。"],
	yearHeadShort: ["A year of ALFA's weekly IV30.", "ALFA 一年来每周的 IV30。"],
	today: [`today ${TODAY}%`, `今天 ${TODAY}%`],
	rankHead: [
		"Rank: today's place between low and high.",
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
	outlierHead: ["One week set the high: drop it.", "最高值来自一周：去掉它。"],
	sampleHead: [`The last ${RECENT} weeks only.`, `只看最近 ${RECENT} 周。`],
	sampleHeadShort: [
		`The last ${RECENT} weeks only.`,
		`只看最近 ${RECENT} 周。`,
	],
	gapHead: ["A year with missing history.", "一年中有历史缺失。"],
	gapHeadShort: ["A year with missing history.", "一年中有历史缺失。"],
	oCoverage: [
		`${year.below} of ${year.n} weeks; still ${noShock.below} of ${noShock.n}.`,
		`${year.n} 周中有 ${year.below} 周；${noShock.n} 周中仍有 ${noShock.below} 周。`,
	],
	sProof: [
		`Percentile: ${recent.n}, ${pct(recent.percentile)}`,
		`百分位：${recent.n} 周，${pct(recent.percentile)}`,
	],
	gProof: [
		`Percentile: ${gapped.n}, ${pct(gapped.percentile)}`,
		`百分位：${gapped.n} 周，${pct(gapped.percentile)}`,
	],
	rangeLabel: ["IV range · points", "IV 区间 · 百分点"],
	rankNote: ["Rank: ", "Rank："],
	rankWas: ["rank", "Rank"],
	pctWas: ["percentile", "百分位"],
	high: ["high", "最高"],
	low: ["low", "最低"],
	missing: [
		`${GAP.to - GAP.from + 1} missing`,
		`缺失 ${GAP.to - GAP.from + 1} 周`,
	],
	claimBig: [
		"Say the measure, the window and the coverage.",
		"说明指标、窗口和覆盖范围。",
	],
	claimSub: [
		"Rank and percentile answer different questions.",
		"Rank 和百分位回答的是不同的问题。",
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
	const formula = (name: string, text: string, focusTone: string) => {
		const size = Math.min(T.head * 1.2, (room / (text.length * 0.6)) * 0.98);
		const labelAt = Math.max(text.indexOf(":"), text.indexOf("："));
		const splitAt = Math.max(
			text.lastIndexOf("="),
			text.lastIndexOf(","),
			text.lastIndexOf("，"),
		);
		const label = labelAt >= 0 ? text.slice(0, labelAt + 1) : "";
		const operands = text.slice(labelAt >= 0 ? labelAt + 1 : 0, splitAt + 1);
		return (
			<Word
				name={name}
				x={L.margin}
				y={L.headY + T.head * 1.1 + size}
				size={size}
				anchor="start"
				className="wt-film-num"
			>
				{label && <tspan className={focusTone}>{label}</tspan>}
				{operands}
				<tspan className={focusTone}>{text.slice(splitAt + 1)}</tspan>
			</Word>
		);
	};
	/** The outlier's readings, as large as two stacked lines allow. */
	const oSize = Math.min(T.big * 0.7, room / (9 * 0.62));
	const tallySize = Math.min(T.head * 1.2, room / (14 * 0.6));
	const proofY = L.headY + T.head * 1.1 + tallySize;
	const rangeLabel = t(copy.rangeLabel);
	const rangeValueX =
		L.margin +
		textWidth(rangeLabel, T.small) +
		rangeLabel.length * T.small * 0.12 +
		T.small;
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
						{alfaIv30Weekly.map((_, i) => (
							<rect
								key={`week-${i}`}
								data-f={`bar-${i}`}
								className="wt-film-bar"
								data-tone="neutral"
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
								data-f="bracket-low"
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
								data-f="bracket-low-label"
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

			{/* An untransformed copy picks up the chart reading as the chart sinks. */}
			<Word
				name="o-carry"
				x={L.bracketX - 10}
				y={L.y(TODAY) - 8}
				size={13}
				anchor="end"
				className="wt-film-num wt-film-accent"
			>
				{pct(noShock.rank)}
			</Word>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				{(
					[
						[copy.qTagRank, pct(year.rank)],
						[copy.qTagPct, pct(year.percentile)],
					] as const
				).map(([tag, num], i) => (
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
							className="wt-film-num"
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
			{formula("r-formula", t(copy.rankFormula), toneClass.focus)}
			{headline("p-head", copy.pctHead, copy.pctHeadShort)}
			<Word
				name="p-tally"
				x={L.margin}
				y={proofY}
				size={tallySize}
				anchor="start"
				className="wt-film-num"
			>{`0 / ${year.n}`}</Word>
			<Word
				name="p-result"
				x={L.margin + tallySize * 0.6 * 8}
				y={proofY}
				size={tallySize}
				anchor="start"
				className="wt-film-num"
			>
				<tspan>= </tspan>
				<tspan className={toneClass.focus}>{pct(year.percentile)}</tspan>
			</Word>
			<g data-f="o-proof">
				<Word
					name="o-range-label"
					x={L.margin}
					y={proofY}
					size={T.small}
					anchor="start"
					className="wt-film-tag wt-film-accent"
				>
					{rangeLabel}
				</Word>
				<Word
					name="o-range"
					x={rangeValueX}
					y={proofY}
					size={tallySize}
					anchor="start"
					className="wt-film-num wt-film-accent"
				>
					{`${year.high - year.low} → ${noShock.high - noShock.low}`}
				</Word>
			</g>
			{headline("o-head", copy.outlierHead)}
			<Brackets name="lock-rank" glow />
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
							size={i === 0 ? oSize : oSize / 1.4}
							className={`wt-film-num ${i === 0 ? "wt-film-accent" : ""}`}
						>
							{`${pct(from)} → ${pct(to)}`}
						</Word>
					</g>
				))}
			</g>
			<Lines
				name="o-coverage"
				text={t(copy.oCoverage)}
				x={W / 2}
				y={H * 0.79}
				size={T.body}
				maxWidth={room}
				anchor="middle"
				className="wt-film-num"
			/>
			{headline("s-head", copy.sampleHead, copy.sampleHeadShort)}
			{formula("s-proof", t(copy.sProof), toneClass.focus)}
			<Word
				name="s-note"
				x={L.margin}
				y={proofY + T.head * 1.1}
				size={narrow ? T.body : T.small}
				anchor="start"
				className="wt-film-type wt-film-dim"
			>
				{`${t(copy.rankNote)}${rankText(recent.rank, locale)}`}
			</Word>
			{headline("g-head", copy.gapHead, copy.gapHeadShort)}
			{formula("g-proof", t(copy.gProof), toneClass.focus)}
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
	const { tl, one, kids, show, hide, rise, sink } = d;
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const land = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.12, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const flat = (name: string) =>
		kids(name).flatMap((el) => (el.tagName === "g" ? [...el.children] : [el]));
	const bars = alfaIv30Weekly.map((_, i) => one(`bar-${i}`));
	const barStagger = 0.3 / Math.max(bars.length - 1, 1);
	const below = bars.filter((_, i) => alfaIv30Weekly[i] < TODAY);
	const above = bars.filter((_, i) => alfaIv30Weekly[i] >= TODAY);
	const rank = one<SVGTextElement>("bracket-rank");
	const highLabel = one<SVGTextElement>("bracket-high-label");
	const lowLabel = one<SVGTextElement>("bracket-low-label");
	/** One state renders both endpoints, their labels and today's uncapped rank. */
	const range = { low: year.low, high: year.high, named: 0 };
	const renderRange = () => {
		one("bracket-line").setAttribute(
			"d",
			`M${L.bracketX} ${L.y(range.low)}V${L.y(range.high)}`,
		);
		for (const [name, label, value] of [
			["bracket-low", lowLabel, range.low],
			["bracket-high", highLabel, range.high],
		] as const) {
			one(name).setAttribute("d", `M${L.bracketX - 6} ${L.y(value)}h12`);
			label.setAttribute("y", String(L.y(value) + 4));
			label.textContent = `${Number(value.toFixed(1))}%`;
		}
		one("bracket-dot").setAttribute("cy", String(L.y(TODAY)));
		const value = (TODAY - range.low) / (range.high - range.low);
		rank.textContent = range.named
			? rankText(value, context.locale)
			: pct(value);
	};
	const bracketTo = (
		from: { low: number; high: number },
		to: { low: number; high: number },
		at: number,
		duration = 0.7,
		nameRank = false,
	) => {
		// GSAP owns both lane and naming state, so later samples revert on backward seeks.
		tl.set(
			rank,
			{ attr: { y: L.y(TODAY) - (nameRank && L.narrow ? 24 : 8) } },
			at,
		);
		tl.set(range, { named: nameRank ? 1 : 0, onUpdate: renderRange }, at);
		tl.fromTo(
			range,
			{ low: from.low, high: from.high },
			{
				low: to.low,
				high: to.high,
				duration,
				ease: "power2.out",
				immediateRender: false,
				onUpdate: renderRange,
			},
			at,
		);
	};
	const bracketSet = (
		to: { low: number; high: number },
		at: number,
		nameRank = false,
	) => {
		tl.set(
			rank,
			{ attr: { y: L.y(TODAY) - (nameRank && L.narrow ? 24 : 8) } },
			at,
		);
		tl.set(
			range,
			{
				low: to.low,
				high: to.high,
				named: nameRank ? 1 : 0,
				onComplete: renderRange,
			},
			at,
		);
	};

	const lockRank = one<SVGGraphicsElement>("lock-rank");

	d.hidden([
		one("o-carry"),
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
			"p-tally",
			"p-result",
			"o-proof",
			"o-coverage",
			"o-head",
			"s-head",
			"s-proof",
			"s-note",
			"g-head",
			"g-proof",
		].map((name) => one(name)),
		...flat("o"),
		lockRank,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: two answers for one day ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag-0"), 4.6);
	land(one("q-num-0"), 4.8);
	show(one("q-tag-1"), 5.3);
	land(one("q-num-1"), 5.5);
	show(one("q-line"), 6.0);

	// ——— year: the history ———
	tl.addLabel("year", 9.6);
	hide(flat("q"), 9.6);
	show(one("y-head"), 9.8, "above");
	rise(9.9);
	alfaIv30Weekly.forEach((iv, i) => {
		tl.fromTo(
			bars[i],
			{ attr: { y: L.y(0), height: 0 } },
			{
				attr: { y: L.y(iv), height: L.y(0) - L.y(iv) },
				duration: 0.4,
				ease: "power3.out",
			},
			11.7 + i * barStagger,
		);
	});
	// The scaffold settles at 10.7; leave it still for a full second before the bars move.
	tl.fromTo(
		one("today"),
		{ opacity: 0, x: -20 },
		{ opacity: 1, x: 0, duration: 0.4 },
		12.4,
	);

	// ——— rank: between the extremes ———
	tl.addLabel("rank", 13.4);
	d.swap(one("y-head"), one("r-head"), 13.4);
	tl.fromTo(
		one("bracket"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		13.9,
	);
	// Reveal the exact marker and reading together, without a second counter or walk.
	// The range settles at 14.4; its equation arrives after a full second of quiet.
	tl.set(bars[SHOCK], { attr: { "data-tone": "total" } }, 13.9);
	show(one("r-formula"), 15.4);

	// ——— percentile: the weeks below ———
	tl.addLabel("percentile", 18.2);
	hide([one("r-head"), one("r-formula")], 18.2);
	show(one("p-head"), 18.55, "above");
	tl.to(one("bracket"), { opacity: 0.25, duration: 0.4 }, 18.4);
	tl.to(above, { opacity: 0.25, duration: 0.4 }, 18.8);
	tl.set(bars[SHOCK], { attr: { "data-tone": "neutral" } }, 18.8);
	show(one("p-tally"), 19.1);
	const tally = { n: 0 };
	tl.fromTo(
		tally,
		{ n: 0 },
		{
			n: below.length,
			duration: 1.2,
			ease: "none",
			immediateRender: false,
			onUpdate: () => {
				const n = Math.floor(tally.n);
				below.forEach((bar, i) => {
					bar.setAttribute("data-tone", i < n ? "total" : "neutral");
				});
				one("p-tally").textContent = `${n} / ${year.n}`;
			},
		},
		19.1,
	);
	// The exact quotient arrives only after the tally has rested for a full second.
	tl.fromTo(
		one("p-result"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		21.3,
	);

	// ——— outlier: one week sets the high ———
	tl.addLabel("outlier", 22.6);
	hide([one("p-head"), one("p-tally"), one("p-result")], 22.6);
	show(one("o-head"), 22.95, "above");
	tl.to(above, { opacity: 1, duration: 0.4 }, 22.8);
	tl.set(below, { attr: { "data-tone": "neutral" } }, 22.6);
	// A discrete deletion has no intermediate sample: keep readouts offstage until it settles.
	tl.to(one("bracket"), { opacity: 0, duration: 0.4 }, 23.2);
	tl.to(
		bars[SHOCK],
		{
			attr: { y: L.y(0), height: 0 },
			duration: 0.6,
			ease: "power2.in",
		},
		23.6,
	);
	// Count the range under the hidden bracket; reveal it when the 1 s change settles.
	bracketTo(year, noShock, 23.9, 1.0);
	tl.to(one("bracket"), { opacity: 1, duration: 0.3 }, 24.9);
	tl.fromTo(
		one("o-proof"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		24.9,
	);
	// Cut: the two readings, before and after. The hero: rank doubles.
	hide([one("o-head"), one("o-proof")], 26.6);
	// The same settled reading stays at its chart position while all crossing marks sink.
	tl.set(rank, { opacity: 0 }, 26.6);
	tl.set(one("o-carry"), { opacity: 1 }, 26.6);
	sink(26.6);
	show(one("o-tag-0"), 26.9);
	show(one("o-tag-1"), 26.9);
	land(one("o-num-1"), 27.0);
	tl.fromTo(
		one("o-coverage"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		27.0,
	);
	d.carry(
		one<SVGGraphicsElement>("o-carry"),
		one<SVGGraphicsElement>("o-num-0"),
		27.55,
		{ duration: 0.65, arc: "y", match: pct(noShock.rank) },
	);
	d.lock(lockRank, 29.9, {
		around: [one("o-tag-0"), one("o-num-0")],
		pad: 10,
	});
	tl.addLabel("hero-lock", 29.9);

	// ——— sample: the history itself ———
	tl.addLabel("sample", 31.85);
	hide([...flat("o"), one("o-coverage"), lockRank], 31.85);
	// The old sample never resurfaces: prepare exclusions and the entire range under the cut.
	tl.set(bars.slice(0, WEEKS - RECENT), { opacity: 0 }, 31.0);
	bracketTo(noShock, recent, 30.7, 1.0, true);
	tl.set(rank, { opacity: 1 }, 31.7);
	// Final samples fade in place; data and camera are settled before their quiet second.
	tl.set(one("depth"), { scale: 1 }, 31.7);
	tl.to(one("depth"), { opacity: 1, duration: 0.3 }, 32.05);
	show(one("s-head"), 32.2, "above");
	tl.fromTo(
		[one("s-proof"), one("s-note")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		33.35,
	);
	// Keep the shared sample visible through its transition to the gapped year.
	hide([one("s-head"), one("s-proof")], 35.85);
	show(one("g-head"), 36.2, "above");
	const restored = bars.filter(
		(_, i) => i < WEEKS - RECENT && (i < GAP.from || i > GAP.to),
	);
	// Add the newly observed weeks and hatch the missing span inside the settled chart.
	tl.to(one("bracket"), { opacity: 0, duration: 0.3 }, 36.25);
	// A `to` from the hidden state set at 31.0: a fromTo would render its start at build time
	// and hide these weeks through the year, rank and percentile beats.
	tl.to(restored, { opacity: 1, duration: 0.3 }, 36.55);
	tl.fromTo(
		[one("gap"), one("gap-label")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		36.55,
	);
	// Set the range at the same moment the missing-history evidence enters.
	bracketSet(gapped, 36.55, true);
	tl.to(one("bracket"), { opacity: 1, duration: 0.3 }, 36.55);
	tl.fromTo(
		one("g-proof"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		37.85,
	);

	// Cut: the claim.
	hide([one("g-head"), one("g-proof"), one("s-note")], 40.5);
	sink(40.5);
	tl.fromTo(
		one("c-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		40.9,
	);
	show(one("c-sub"), 41.3);

	// ——— next ———
	tl.addLabel("next", 45);
	hide(kids("claim"), 45);
	d.close(45);
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
