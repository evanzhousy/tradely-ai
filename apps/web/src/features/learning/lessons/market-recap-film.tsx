import { type Copy, count, mondayPacket, pick } from "@/content/world";
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
	C105,
	C110,
	CONTRACTS_MAX,
	caption,
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
 * plotted as premium, the 105 does. Then the same contracts from an axis at 480: 540 and
 * 505 look 2.4 to 1. Last, a headline that claims buyers and a busiest call, rewritten to
 * what the packet shows, with its caption.
 *
 *   open      0–4      "Recaps"
 *   question  4–9.5    a premium claim over a contracts chart?
 *   match     9.5–19   contracts: 110 leads; premium: 105 leads
 *   axis      19–28    from zero, nearly equal; from 480, 2.4 to 1
 *   compose   28–37    the draft; the bounded headline; the caption
 *   claim     37–39.5  claims your evidence supports
 *   next      39.5–42  Next: audits
 */

const END = 42;
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
	m0: [
		`The chart plots contracts: the ${leader.strike} call leads with ${leadValue("contracts")}.`,
		`图表画的是张数：${leader.strike} 看涨以 ${leadValue("contracts")} 张领先。`,
	],
	m0Short: [
		`Contracts: ${leader.strike} leads.`,
		`张数：${leader.strike} 领先。`,
	],
	m1: [
		`So it can't back a claim about premium. Plot premium and the ${premiumLeader.strike} leads, ${leadValue("premium")}.`,
		`所以它支持不了关于权利金的说法。改画权利金，${premiumLeader.strike} 领先，${leadValue("premium")}。`,
	],
	m1Short: [
		`Premium: ${premiumLeader.strike} leads.`,
		`权利金：${premiumLeader.strike} 领先。`,
	],
	a0: [
		`From zero, the ${leader.strike} and 105 calls look nearly equal, as they are: ${count(C110)} and ${count(C105)}.`,
		`从零开始，${leader.strike} 和 105 看涨看起来几乎一样，事实也是：${count(C110)} 和 ${count(C105)}。`,
	],
	a0Short: ["From zero: nearly equal.", "从零开始：几乎一样。"],
	a1: [
		`Start the axis at ${count(CUT)} and the gap looks ${((C110 - CUT) / (C105 - CUT)).toFixed(1)} to 1. No number changed.`,
		`把轴从 ${count(CUT)} 开始，差距看起来是 ${((C110 - CUT) / (C105 - CUT)).toFixed(1)} 比 1。没有任何数字变化。`,
	],
	a1Short: [
		`From ${CUT}: ${((C110 - CUT) / (C105 - CUT)).toFixed(1)} to 1.`,
		`从 ${CUT}：${((C110 - CUT) / (C105 - CUT)).toFixed(1)} 比 1。`,
	],
	c0: [
		"The first draft names buyers the packet can't see, and a busiest call it didn't fully cover.",
		"初稿说出了研究包看不到的买方，以及它没有完全覆盖的“最活跃看涨”。",
	],
	c0Short: ["The draft claims too much.", "初稿说多了。"],
	c1: [
		"The rewrite says only what the packet shows: the count, the contract, the day, the coverage.",
		"改写后只说研究包显示的：数量、合约、日期、覆盖范围。",
	],
	c1Short: ["Only what it shows.", "只说它显示的。"],
	c2: [
		"And a caption travels with the chart: units, axis, source, date and the gap.",
		"图表附上说明：单位、坐标轴、来源、日期和缺口。",
	],
	c2Short: ["Plus a caption.", "再加上说明。"],
	contracts: ["contracts", "张数"],
	premium: ["premium", "权利金"],
	noData: ["no data", "无数据"],
	axisFrom: [`axis from ${count(CUT)}`, `轴从 ${count(CUT)} 开始`],
	claimBig: ["Claim only what your evidence shows.", "只说证据能显示的。"],
	claimSub: [
		"Chart the quantity you claim, start bars at zero, and keep the headline inside the packet's coverage.",
		"图表画你所说的那个量，柱子从零开始，标题不越出研究包的覆盖范围。",
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
			{headline("m0", copy.m0, copy.m0Short)}
			{headline("m1", copy.m1, copy.m1Short)}
			{headline("a0", copy.a0, copy.a0Short)}
			{headline("a1", copy.a1, copy.a1Short)}
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
								data-tone={row === leader ? "total" : "neutral"}
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
			{headline("c0", copy.c0, copy.c0Short)}
			{headline("c1", copy.c1, copy.c1Short)}
			{headline("c2", copy.c2, copy.c2Short)}
			<Lines
				name="draft"
				text={`“${t(drafts.over)}”`}
				x={margin}
				y={L.cardY + T.head}
				size={narrow ? T.body : T.head}
				maxWidth={room}
				anchor="start"
				className="wt-film-type wt-film-loss"
			/>
			<Lines
				name="bounded"
				text={`“${t(drafts.bounded)}”`}
				x={margin}
				y={L.cardY + T.head + (narrow ? T.body : T.head) * 3.6}
				size={narrow ? T.body : T.head}
				maxWidth={room}
				anchor="start"
				className="wt-film-type wt-film-gain"
			/>
			<Lines
				name="caption"
				text={t(caption)}
				x={margin}
				y={L.cardY + T.head + (narrow ? T.body : T.head) * 8}
				size={narrow ? T.small : T.small * 1.15}
				maxWidth={room}
				anchor="start"
				className="wt-film-type wt-film-dim"
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
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			time,
		);
	const span = L.base - L.top;
	const heads = ["m0", "m1", "a0", "a1", "c0", "c1", "c2"].map((name) =>
		one(name),
	);
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
		one("unit-cut"),
		...bars,
		...vals("contracts"),
		...vals("premium"),
		one("draft"),
		one("bounded"),
		one("caption"),
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
	word(one("q-big"), 6.6);

	// ——— match: the quantity on the chart ———
	tl.addLabel("match", 9.5);
	hide(flat("q"), 9.5);
	show(heads[0], 9.7, "above");
	show(kids("frame"), 10.0);
	show(one("unit-contracts"), 10.2);
	bars.forEach((bar, i) => {
		const height = Number(bar.getAttribute("height"));
		const y = Number(bar.getAttribute("y"));
		tl.fromTo(
			bar,
			{ opacity: 1, attr: { y: L.base, height: 0 } },
			{ attr: { y, height }, duration: 0.6, ease: "power2.out" },
			10.4 + i * 0.12,
		);
	});
	show(vals("contracts"), 11.2);
	d.swap(heads[0], heads[1], 13.6);
	d.flip(one("unit-contracts"), one("unit-premium"), 14.0);
	tl.set(one("unit-contracts"), { opacity: 0 }, 14.3);
	hide(vals("contracts"), 14.0, 0.25);
	barsTo("premium", 0, chartMax("premium"), 14.2, vals("premium"));
	tl.set(bars[leadIndex(leader)], { attr: { "data-tone": "neutral" } }, 14.6);
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
			14.2,
		);
	});
	show(vals("premium"), 15.0);

	// ——— axis: the same contracts from 0, then from 480 ———
	tl.addLabel("axis", 19);
	d.swap(heads[1], heads[2], 19.0);
	hide(vals("premium"), 19.0, 0.25);
	d.flip(one("unit-premium"), one("unit-contracts"), 19.2);
	tl.set(one("unit-premium"), { opacity: 0 }, 19.5);
	barsTo("contracts", 0, CONTRACTS_MAX, 19.3, vals("contracts"));
	tl.set(
		bars[leadIndex(premiumLeader)],
		{ attr: { "data-tone": "neutral" } },
		19.6,
	);
	tl.set(bars[leadIndex(leader)], { attr: { "data-tone": "total" } }, 19.6);
	show(vals("contracts"), 20.2);
	d.swap(heads[2], heads[3], 23.0);
	d.flip(one("unit-contracts"), one("unit-cut"), 23.4);
	tl.set(one("unit-contracts"), { opacity: 0 }, 23.7);
	barsTo(
		"contracts",
		CUT,
		CUT + (CONTRACTS_MAX - CUT) * 0.55,
		23.6,
		vals("contracts"),
	);

	// ——— compose: the headline and caption ———
	tl.addLabel("compose", 28);
	hide(
		[
			heads[3],
			...kids("frame"),
			one("unit-cut"),
			...bars,
			...vals("contracts"),
		],
		28.0,
	);
	show(heads[4], 28.2, "above");
	show(one("draft"), 28.6);
	d.swap(heads[4], heads[5], 30.8);
	tl.to(one("draft"), { opacity: 0.35, duration: 0.4 }, 31.0);
	show(one("bounded"), 31.2);
	d.swap(heads[5], heads[6], 33.6);
	show(one("caption"), 34.0);

	// ——— claim ———
	tl.addLabel("claim", 37);
	hide([heads[6], one("draft"), one("bounded"), one("caption")], 37.0);
	word(one("z-big"), 37.3);
	show(one("z-sub"), 37.7);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
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
