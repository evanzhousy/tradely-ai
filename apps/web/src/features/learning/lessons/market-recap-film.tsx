import { type Copy, count, mondayPacket, pick } from "@/content/world";
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
	C105,
	C110,
	CONTRACTS_MAX,
	chartMax,
	dollars,
	drafts,
	leader,
	leadValue,
	type Metric,
	measureOf,
	premiumLeader,
} from "./market-recap-model";

/*
 * Recaps, as a film. A recap says the 105 call drew the most premium, over a chart of
 * contracts: does the chart back it? The chart answers: by contracts the 110 call leads;
 * plotted as premium, the 105 does. The hero is the same contracts from an axis at 480:
 * 540 and 505 look 2.4 to 1, and glowing brackets lock on the pair. Last, a headline that
 * claims buyers and a busiest call, rewritten to what the packet shows, with its caption.
 *
 *   open      0–4         "Recaps"
 *   question  4–8.6       a premium claim over a contracts chart?
 *   match     8.6–20.55   build contracts, then compare premium
 *   axis      20.55–30.7  hero: from zero, nearly equal; from 480, 2.4 to 1
 *   compose   30.7–41.1   expose intent and scope; rewrite; caption fields
 *   claim     41.1–45.4   claims your evidence supports
 *   next      45.4–47.4   Next: audits
 */

const END = 47.4;
const ROWS = mondayPacket;
const CUT = 480;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const left = margin + (narrow ? 8 : 24);
	const slot = (room - (left - margin)) / ROWS.length;
	return {
		...frame,
		top: H * (narrow ? 0.38 : 0.36),
		base: H * (narrow ? 0.78 : 0.8),
		slot,
		barX: (i: number) => left + i * slot + slot * 0.2,
		barW: slot * 0.6,
		cardY: H * (narrow ? 0.27 : 0.27),
	};
}

const copy = {
	title: ["Recaps", "复盘"],
	titleSub: ["claims your evidence supports", "证据支持的结论"],
	qTag: [
		"a recap · ALFA Oct 18 calls · Monday",
		"一篇复盘 · ALFA 10月18日 看涨 · 周一",
	],
	qLine: [
		`“The ${premiumLeader.strike} call drew the most premium.”`,
		`“${premiumLeader.strike} 看涨吸引了最多权利金。”`,
	],
	qBig: ["Does its chart back that?", "它的图表支持这句话吗？"],
	mHead: ["Compare contracts and premium.", "比较张数与权利金。"],
	mAnswer: [
		`By contracts, the ${leader.strike} led.`,
		`先前按张数，${leader.strike} 领先。`,
	],
	m2Head: [
		`By premium, the ${premiumLeader.strike} led.`,
		`改按权利金，${premiumLeader.strike} 领先。`,
	],
	aHead: ["Earlier, the axis started at zero.", "之前的轴从零开始。"],
	a2Head: [
		`From ${count(CUT)}, the bars' height ratio is ${((C110 - CUT) / (C105 - CUT)).toFixed(1)}.`,
		`从 ${count(CUT)} 起，柱高之比为 ${((C110 - CUT) / (C105 - CUT)).toFixed(1)}。`,
	],
	cHead: ["The draft claims more than it shows.", "初稿说的比它显示的多。"],
	draftIntent: [
		`“Call buyers piled into ALFA's ${leader.strike} strike,`,
		`“看涨买家涌入 ALFA ${leader.strike} 行权价，`,
	],
	draftScope: ["Monday's busiest call”", "周一最活跃的看涨”"],
	intentEvidence: ["Buyer intent unknown", "买方意图未知"],
	scopeEvidence: [
		`${ROWS.filter((row) => measureOf(row, "contracts") !== null).length} observed strikes · 120 missing`,
		`仅 ${ROWS.filter((row) => measureOf(row, "contracts") !== null).length} 个行权价有数据 · 120 缺失`,
	],
	captionMeasure: ["Measure · traded contracts", "统计量 · 成交张数"],
	captionScope: [
		"ALFA Oct 18 calls · Mon Sep 16",
		"ALFA 10月18日看涨 · 9月16日周一",
	],
	captionSource: [
		"Corrected tape as of 16:05 · P1 · 120: no data yet",
		"更正后成交记录截至 16:05 · P1 · 120 尚无数据",
	],
	changingScale: ["CHANGING SCALE", "图表刻度调整中"],
	contracts: ["contracts", "张数"],
	premium: ["premium", "权利金"],
	noData: ["no data", "无数据"],
	axisFrom: [`axis from ${count(CUT)}`, `轴从 ${count(CUT)} 开始`],
	claimBig: ["Claim only what your evidence shows.", "只说证据能显示的。"],
	claimSub: [
		"Chart what you claim; start bars at zero.",
		"画你所说的量；柱子从零开始。",
	],
	nextBig: ["Next: audits", "下一课：审核"],
	nextSub: ["finding and repairing a flawed recap", "发现并修复有缺陷的复盘"],
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
	const draftSize = narrow ? T.body : T.body * 1.2;
	const intentY = L.cardY + T.head;
	const intentNoteY =
		intentY +
		lineCount(t(copy.draftIntent), room, draftSize) * draftSize * 1.35 +
		T.small * 0.8;
	const scopeY = intentNoteY + T.body * 1.8;
	const scopeNoteY =
		scopeY +
		lineCount(t(copy.draftScope), room, draftSize) * draftSize * 1.35 +
		T.small * 0.8;
	const boundedY = scopeNoteY + T.body * 2.1;
	const captionSize = narrow ? T.small : T.small * 1.15;
	const captionFields = [
		copy.captionMeasure,
		copy.captionScope,
		copy.captionSource,
	];
	const captionY =
		boundedY +
		lineCount(`“${t(drafts.bounded)}”`, room, draftSize) * draftSize * 1.35 +
		T.small * 1.5;
	const h = (value: number, metric: Metric) =>
		(value / chartMax(metric)) * (L.base - L.top);
	const label = (value: number | null, metric: Metric) =>
		value === null
			? t(copy.noData)
			: metric === "contracts"
				? count(value)
				: narrow
					? value === 0
						? "$0"
						: `$${Number((value / 100_000).toFixed(1))}K`
					: dollars(value);
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

			{/* The chart: one quantity, then another, then a cut axis. */}
			{headline("m-head", copy.mHead)}
			{/* Historical answers arrive only after their quantity has settled. */}
			<Lines
				name="m-answer"
				text={t(copy.mAnswer)}
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
			<Lines
				name="m2-head"
				text={t(copy.m2Head)}
				x={margin}
				y={
					L.headY +
					(lineCount(t(copy.mHead), narrow ? room : room * 0.74, T.head) +
						lineCount(t(copy.mAnswer), narrow ? room : room * 0.74, T.head)) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
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
			<Brackets name="lock-bars" glow />
			<g data-f="frame">
				<path d={`M${margin} ${L.base}H${margin + room}`} className="wt-axis" />
				{ROWS.map((row, i) => (
					<text
						key={row.id}
						x={L.barX(i) + L.barW / 2}
						y={L.base + T.small * 1.7}
						textAnchor="middle"
						className="wt-film-num wt-film-dim"
						style={{ fontSize: T.small * 1.1 }}
					>
						{row.strike}
					</text>
				))}
			</g>
			<path
				data-f="premium-leader-rule"
				d={`M${L.barX(ROWS.indexOf(premiumLeader))} ${L.base + T.small * 2.6}h${L.barW}`}
				style={{
					fill: "none",
					stroke: "var(--diagram-accent)",
					strokeWidth: 1.5,
				}}
			/>
			{(["contracts", "premium"] as const).map((metric) => (
				<text
					key={metric}
					data-f={`unit-${metric}`}
					x={margin}
					y={L.top - T.small * 2.4}
					className="wt-film-tag wt-film-accent"
					style={{ fontSize: T.small * 1.1 }}
				>
					{t(copy[metric]).toUpperCase()}
				</text>
			))}
			<text
				data-f="unit-changing"
				x={margin}
				y={L.top - T.small * 2.4}
				className="wt-film-tag wt-film-dim"
				style={{ fontSize: T.small * 1.1 }}
			>
				{t(copy.changingScale)}
			</text>
			<text
				data-f="unit-cut"
				x={margin}
				y={L.top - T.small * 2.4}
				className="wt-film-tag wt-film-loss"
				style={{ fontSize: T.small * 1.1 }}
			>
				{`${t(copy.contracts).toUpperCase()} · ${t(copy.axisFrom).toUpperCase()}`}
			</text>
			{ROWS.map((row, i) => {
				const value = measureOf(row, "contracts");
				return (
					<g key={row.id}>
						{value === null ? (
							<rect
								data-f={`bar-${i}`}
								x={L.barX(i)}
								y={L.base - (L.base - L.top) * 0.25}
								width={L.barW}
								height={(L.base - L.top) * 0.25}
								rx={4}
								className="wt-film-ghost"
							/>
						) : (
							<rect
								data-f={`bar-${i}`}
								x={L.barX(i)}
								y={L.base - h(value, "contracts")}
								width={L.barW}
								height={h(value, "contracts")}
								rx={4}
								className="wt-film-bar"
								data-tone="neutral"
							/>
						)}
						{(["contracts", "premium"] as const).map((metric) => {
							const v = measureOf(row, metric);
							return (
								<text
									key={metric}
									data-f={`val-${metric}-${i}`}
									x={L.barX(i) + L.barW / 2}
									y={
										(v === null
											? L.base - (L.base - L.top) * 0.25
											: L.base - h(v, metric)) - 8
									}
									textAnchor="middle"
									className={`wt-film-num ${v === null ? "wt-film-warn" : ""}`}
									style={{ fontSize: text }}
								>
									{label(v, metric)}
								</text>
							);
						})}
					</g>
				);
			})}

			{/* The headline and its caption. */}
			{headline("c-head", copy.cHead)}
			{(
				[
					[
						"intent",
						copy.draftIntent,
						intentY,
						copy.intentEvidence,
						intentNoteY,
					],
					["scope", copy.draftScope, scopeY, copy.scopeEvidence, scopeNoteY],
				] as const
			).map(([id, draft, y, evidence, noteY]) => (
				<g key={id}>
					<Lines
						name={`draft-${id}`}
						text={t(draft)}
						x={margin}
						y={y}
						size={draftSize}
						maxWidth={room}
						anchor="start"
						className="wt-film-type wt-film-loss"
					/>
					<path
						data-f={`repair-${id}`}
						d={`M${margin} ${y + 5}h${room}`}
						style={{
							fill: "none",
							stroke: "var(--diagram-loss)",
							strokeWidth: 1.5,
						}}
					/>
					<Lines
						name={`evidence-${id}`}
						text={t(evidence)}
						x={margin}
						y={noteY}
						size={T.small * 1.1}
						maxWidth={room}
						anchor="start"
						className="wt-film-type wt-film-warn"
					/>
				</g>
			))}
			<Lines
				name="bounded"
				text={`“${t(drafts.bounded)}”`}
				x={margin}
				y={boundedY}
				size={draftSize}
				maxWidth={room}
				anchor="start"
				className="wt-film-type wt-film-gain"
			/>
			{captionFields.map((field, i) => (
				<Lines
					key={field[0]}
					name={`caption-${i}`}
					text={t(field)}
					x={margin}
					y={
						captionY +
						captionFields
							.slice(0, i)
							.reduce(
								(lines, previous) =>
									lines + lineCount(t(previous), room, captionSize),
								0,
							) *
							captionSize *
							1.5
					}
					size={captionSize}
					maxWidth={room}
					anchor="start"
					className="wt-film-type wt-film-dim"
				/>
			))}

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
	const span = L.base - L.top;
	const heads = ["m-head", "m2-head", "a-head", "a2-head", "c-head"].map(
		(name) => one(name),
	);
	const matchAnswer = one("m-answer");
	const draftParts = ["intent", "scope"].map((id) => one(`draft-${id}`));
	const repairLines = ["intent", "scope"].map((id) =>
		one<SVGPathElement>(`repair-${id}`),
	);
	const evidence = ["intent", "scope"].map((id) => one(`evidence-${id}`));
	const captions = [0, 1, 2].map((i) => one(`caption-${i}`));
	const changingUnit = one("unit-changing");
	/** Keep a morph neutral, then hand over in place once its geometry is true. */
	const changeUnit = (
		from: Element,
		to: Element,
		at: number,
		settled: number,
	) => {
		hide(from, at, 0.3, 0);
		tl.fromTo(
			changingUnit,
			{ opacity: 0 },
			{ opacity: 1, duration: 0.3 },
			at + 0.3,
		);
		// This is an in-place text handover, with both marks on the same baseline.
		tl.set(changingUnit, { opacity: 0 }, settled);
		tl.set(to, { opacity: 1 }, settled);
	};
	// Fit each drawn underline beneath its wrapped phrase, never through the glyphs.
	draftParts.forEach((part, i) => {
		const box = (part as SVGGraphicsElement).getBBox();
		repairLines[i].setAttribute(
			"d",
			`M${box.x} ${box.y + box.height + 4}h${box.width}`,
		);
	});
	const lockBars = one<SVGGraphicsElement>("lock-bars");
	const bars = ROWS.map((_, i) => one(`bar-${i}`));
	const vals = (metric: Metric) =>
		ROWS.map((_, i) => one(`val-${metric}-${i}`));
	const leadIndex = (row: (typeof ROWS)[number]) => ROWS.indexOf(row);
	/** Bars and their labels move to a quantity, measured from an axis start. */
	const barsTo = (
		metric: Metric,
		min: number,
		max: number,
		time: number,
		labels: Element[],
	) => {
		ROWS.forEach((row, i) => {
			const v = measureOf(row, metric);
			if (v === null) return;
			const height = Math.max(0, ((v - min) / (max - min)) * span);
			tl.to(
				bars[i],
				{
					attr: { y: L.base - height, height },
					duration: 0.8,
					ease: "power2.inOut",
				},
				time,
			);
			tl.to(
				labels[i],
				{
					attr: { y: L.base - height - 8 },
					duration: 0.8,
					ease: "power2.inOut",
				},
				time,
			);
		});
	};

	d.hidden([
		...flat("q"),
		...heads,
		...kids("frame"),
		one("unit-contracts"),
		one("unit-premium"),
		one("premium-leader-rule"),
		one("unit-cut"),
		changingUnit,
		...bars,
		...vals("contracts"),
		...vals("premium"),
		matchAnswer,
		...draftParts,
		...repairLines,
		...evidence,
		one("bounded"),
		...captions,
		lockBars,
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

	// ——— match: the quantity on the chart ———
	tl.addLabel("match", 8.6);
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	show(kids("frame"), 9.2);
	show(one("unit-contracts"), 9.4);
	bars.forEach((bar, i) => {
		const height = Number(bar.getAttribute("height"));
		const y = Number(bar.getAttribute("y"));
		tl.fromTo(
			bar,
			{ opacity: 1, attr: { y: L.base, height: 0 } },
			{ attr: { y, height }, duration: 0.6, ease: "power2.out" },
			9.6 + i * 0.12,
		);
	});
	tl.set(bars[leadIndex(leader)], { attr: { "data-tone": "total" } }, 10.7);
	show(vals("contracts"), 10.7);
	show(matchAnswer, 12.2);
	changeUnit(one("unit-contracts"), one("unit-premium"), 13.5, 14.6);
	hide(vals("contracts"), 13.5, 0.3);
	barsTo("premium", 0, chartMax("premium"), 13.8, vals("premium"));
	tl.set(bars[leadIndex(leader)], { attr: { "data-tone": "neutral" } }, 13.8);
	tl.set(
		bars[leadIndex(premiumLeader)],
		{ attr: { "data-tone": "total" } },
		14.6,
	);
	ROWS.forEach((_, i) => {
		tl.set(
			one(`val-premium-${i}`),
			{
				attr: { y: Number(one(`val-contracts-${i}`).getAttribute("y")) },
			},
			13.8,
		);
	});
	show(vals("premium"), 14.65);
	show(heads[1], 16.15);
	// An after-beat draws attention to the premium leader during the reading hold.
	d.trace(one<SVGPathElement>("premium-leader-rule"), 17.65, { duration: 0.5 });

	// ——— axis: the hero. The same contracts from 0, then from 480. ———
	tl.addLabel("axis", 20.55);
	d.swap([heads[0], matchAnswer, heads[1]], heads[2], 20.55);
	hide(vals("premium"), 20.55, 0.3);
	hide(one("premium-leader-rule"), 20.55);
	changeUnit(one("unit-premium"), one("unit-contracts"), 20.55, 21.65);
	barsTo("contracts", 0, CONTRACTS_MAX, 20.85, vals("contracts"));
	tl.set(
		bars[leadIndex(premiumLeader)],
		{ attr: { "data-tone": "neutral" } },
		20.85,
	);
	tl.set(bars[leadIndex(leader)], { attr: { "data-tone": "total" } }, 21.65);
	show(vals("contracts"), 21.75);
	changeUnit(one("unit-contracts"), one("unit-cut"), 24.85, 25.95);
	barsTo(
		"contracts",
		CUT,
		CUT + (CONTRACTS_MAX - CUT) * 0.55,
		25.15,
		vals("contracts"),
	);
	// Round the two bars the cut axis pulls apart, with their figures.
	const pair = [leadIndex(leader), leadIndex(premiumLeader)];
	d.lock(lockBars, 27.2, {
		around: pair.flatMap((i) => [bars[i], vals("contracts")[i]]),
		// Close in at the foot, where the strikes are labelled.
		pad: 3,
	});
	tl.addLabel("hero-lock", 27.2);
	show(heads[3], 27.2);

	// ——— compose: the headline and caption ———
	tl.addLabel("compose", 30.7);
	d.swap([heads[2], heads[3]], heads[4], 30.7);
	hide(
		[
			...kids("frame"),
			one("unit-cut"),
			...bars,
			...vals("contracts"),
			lockBars,
		],
		30.7,
	);
	// Separate the unsupported intent and unbounded comparison before rewriting.
	show(draftParts, 31.0);
	d.trace(repairLines[0], 32.5, { duration: 0.3 });
	show(evidence[0], 32.8);
	// Intent evidence settles at 33.3; scope repair waits one quiet second.
	d.trace(repairLines[1], 34.3, { duration: 0.3 });
	show(evidence[1], 34.6);
	// Scope evidence settles at 35.1; the replacement waits one quiet second.
	// Clear the completed draft; a slow initial fade preserves its readable hold.
	tl.to(
		[...draftParts, ...repairLines, evidence[0]],
		{ opacity: 0, duration: 0.4, ease: "power2.in" },
		36.1,
	);
	// Both layouts keep the scope qualification readable beside the result until 41.1.
	tl.to(evidence[1], { opacity: 0.8, duration: 0.4 }, 36.1);
	show(one("bounded"), 36.1);
	// The bounded result settles at 36.6; caption fields wait one quiet second.
	captions.forEach((field, i) => {
		const at = 37.6 + i * 0.15;
		show(field, at);
		// Stagger the exits too: each field keeps its original 3.5-second hold.
		hide(field, at + 3.5);
	});

	// ——— claim ———
	tl.addLabel("claim", 41.1);
	hide(
		[heads[4], ...draftParts, ...repairLines, ...evidence, one("bounded")],
		41.1,
	);
	word(one("z-big"), 41.4);
	show(one("z-sub"), 41.8);

	// ——— next ———
	tl.addLabel("next", 45.4);
	hide(kids("claim"), 45.4);
	d.close(45.4);
	return tl;
}

export const marketRecapFilm: Film = {
	id: "market-recap",
	label: [
		`Recaps, as a short film: a headline that claims the ${premiumLeader.strike} call drew the most premium over a chart of contracts, where the ${leader.strike} call leads with ${leadValue("contracts")}, until the chart plots premium and the ${premiumLeader.strike} leads with ${leadValue("premium")}; the ${leader.strike} and 105 calls' ${count(C110)} and ${count(C105)} contracts, nearly equal from zero and ${((C110 - CUT) / (C105 - CUT)).toFixed(1)} to 1 from an axis at ${count(CUT)}; and a draft headline about buyers and a busiest call rewritten to what packet P1 shows, with its caption`,
		`复盘短片：一个说 ${premiumLeader.strike} 看涨吸引最多权利金的标题配了张数图，图上 ${leader.strike} 看涨以 ${leadValue("contracts")} 张领先，改画权利金后 ${premiumLeader.strike} 以 ${leadValue("premium")} 领先；${leader.strike} 和 105 看涨的 ${count(C110)} 张和 ${count(C105)} 张，从零开始几乎一样，从 ${count(CUT)} 开始却像 ${((C110 - CUT) / (C105 - CUT)).toFixed(1)} 比 1；以及一个关于买方和“最活跃看涨”的初稿，改写为研究包 P1 能显示的内容，并附上说明`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Recaps", "复盘"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "match", label: ["The quantity", "所画的量"] },
		{ id: "axis", label: ["The axis", "坐标轴"] },
		{ id: "compose", label: ["The headline", "标题"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
