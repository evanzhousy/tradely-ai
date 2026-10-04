import { type Copy, count, pick, sideCode, usd } from "@/content/world";
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
	BLOCK,
	MULTIPLIER,
	PREMIUM,
	SPREAD_COST,
} from "./validate-option-print-model";

/*
 * Checking one trade, as a film. 500 Oct 18 105 calls print at $2.15: a $107,500 bet that
 * ALFA rises? The amount comes first, built from the record: $2.15 × 500 × 100. Then a
 * ladder of claims, each tagged with its evidence, from observed down to unknown; with only
 * a 90-second-old quote, the location and the buyer drop to unknown and the amount stays.
 * Last, the record that could close each gap: an open-interest report, the linked leg that
 * makes it a $1.25 call spread, and none at all for belief.
 *
 *   open      0–4      "Checking one trade"
 *   question  4–9.5    500 at $2.15: a $107,500 bet ALFA rises?
 *   amount    9.5–17.5 $2.15 a share × 500 contracts × 100 shares = $107,500
 *   claims    17.5–28  observed, calculated, inferred, unknown; a stale quote
 *   gaps      28–37    OI +480; a linked 110 leg; no record of belief
 *   claim     37–39.5  facts, inferences, unknowns
 *   next      39.5–42  Next: the module checkpoint
 */

const END = 42;
type Evidence = "observed" | "calculated" | "inferred" | "unknown";
const CODE = sideCode(BLOCK.price, BLOCK.quote.bid, BLOCK.quote.ask);
const STALE_CODE = sideCode(
	BLOCK.price,
	BLOCK.staleQuote.bid,
	BLOCK.staleQuote.ask,
);
const LEG = BLOCK.pairedLeg;
const tone = (evidence: Evidence) =>
	evidence === "unknown"
		? "wt-film-dim"
		: evidence === "inferred"
			? "wt-film-warn"
			: "wt-film-gain";

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow } = frame;
	return {
		...frame,
		/** The amount's three factors, as fractions of the width. */
		termX: narrow ? [0.2, 0.5, 0.8] : [0.28, 0.5, 0.72],
		termY: H * (narrow ? 0.42 : 0.42),
		sumY: H * (narrow ? 0.68 : 0.7),
		rowY: (i: number) =>
			H * (narrow ? 0.25 : 0.25) + i * H * (narrow ? 0.085 : 0.088),
		rowH: H * (narrow ? 0.068 : 0.07),
		gapY: (i: number) =>
			H * (narrow ? 0.25 : 0.25) + i * H * (narrow ? 0.2 : 0.2),
		gapH: H * (narrow ? 0.17 : 0.17),
	};
}

const claims: { id: string; text: Copy; evidence: Evidence; stale?: true }[] = [
	{
		id: "print",
		text: [
			`${count(BLOCK.quantity)} traded at ${usd(BLOCK.price)}`,
			`${count(BLOCK.quantity)} 张在 ${usd(BLOCK.price)} 成交`,
		],
		evidence: "observed",
	},
	{
		id: "premium",
		text: [`${usd(PREMIUM, 0)} of premium`, `权利金 ${usd(PREMIUM, 0)}`],
		evidence: "calculated",
	},
	{
		id: "location",
		text: ["Printed at the ask", "在卖价成交"],
		evidence: "calculated",
		stale: true,
	},
	{
		id: "buyer",
		text: ["A buyer probably started it", "可能是买方发起"],
		evidence: "inferred",
		stale: true,
	},
	{
		id: "open",
		text: [
			`It opened ${count(BLOCK.quantity)} new contracts`,
			`开立了 ${count(BLOCK.quantity)} 张新合约`,
		],
		evidence: "unknown",
	},
	{
		id: "bet",
		text: ["A big bet that ALFA rises", "押注 ALFA 上涨的大单"],
		evidence: "unknown",
	},
];

const gaps: {
	id: string;
	question: Copy;
	needs: Copy;
	found: Copy;
	foundShort: Copy;
	evidence: Evidence;
}[] = [
	{
		id: "open",
		question: ["Opened new contracts?", "开立了新合约？"],
		needs: ["needs the next open-interest report", "需要下一份未平仓量报告"],
		found: [
			`Tuesday's open interest: +${BLOCK.openInterestChange}, so mostly opening`,
			`周二未平仓量：+${BLOCK.openInterestChange}，大部分是开仓`,
		],
		foundShort: [
			`OI +${BLOCK.openInterestChange}: mostly opening`,
			`未平仓量 +${BLOCK.openInterestChange}：多为开仓`,
		],
		evidence: "inferred",
	},
	{
		id: "leg",
		question: ["One leg of a strategy?", "某个策略的一条腿？"],
		needs: [
			"needs the condition code and linked prints",
			"需要成交条件代码和关联成交",
		],
		found: [
			`multi-leg: ${count(LEG.quantity)} Oct 18 ${LEG.strike} calls sold at ${usd(LEG.price)}, a ${usd(SPREAD_COST)} call spread`,
			`多腿：同时以 ${usd(LEG.price)} 卖出 ${count(LEG.quantity)} 张 ${LEG.strike} 看涨，一笔 ${usd(SPREAD_COST)} 的看涨价差`,
		],
		foundShort: [
			`with ${LEG.strike} calls sold: a ${usd(SPREAD_COST)} spread`,
			`同时卖出 ${LEG.strike} 看涨：${usd(SPREAD_COST)} 价差`,
		],
		evidence: "observed",
	},
	{
		id: "belief",
		question: ["A bet that ALFA rises?", "押注 ALFA 上涨？"],
		needs: ["what record could show this?", "什么记录能说明这一点？"],
		found: ["no market record shows belief", "没有任何市场记录能显示观点"],
		foundShort: ["no record shows belief", "没有记录能显示观点"],
		evidence: "unknown",
	},
];

const copy = {
	title: ["Checking one trade", "核查一笔成交"],
	titleSub: ["facts, inferences and unknowns", "事实、推断与未知"],
	qTag: [
		`ALFA Oct 18 105 call · ${BLOCK.time}`,
		`ALFA 10月18日 105 看涨 · ${BLOCK.time}`,
	],
	qLine: [
		`${count(BLOCK.quantity)} contracts print at ${usd(BLOCK.price)}.`,
		`${count(BLOCK.quantity)} 张以 ${usd(BLOCK.price)} 成交。`,
	],
	qBig: [
		`A ${usd(PREMIUM, 0)} bet that ALFA rises?`,
		`一笔 ${usd(PREMIUM, 0)} 的看涨押注？`,
	],
	m0: [
		"Start with the amount, built from the record itself.",
		"先算金额，只用记录本身。",
	],
	m0Short: ["The amount first.", "先算金额。"],
	m1: [
		"A price per share, a count of contracts, and the shares each one covers.",
		"每股价格、合约张数、每张对应的股数。",
	],
	m1Short: ["Three factors.", "三个因子。"],
	perShare: ["per share", "每股"],
	contracts: ["contracts", "张合约"],
	shares: ["shares each", "股/张"],
	premium: ["premium", "权利金"],
	l0: [
		"Now each claim, with the evidence behind it.",
		"再看每个结论，以及它背后的证据。",
	],
	l0Short: ["Each claim, its evidence.", "每个结论，它的证据。"],
	l1: [
		`Against the ${BLOCK.quote.time} quote it printed at the ${CODE === "ASK" ? "ask" : "quote"}: a buyer probably started it.`,
		`对照 ${BLOCK.quote.time} 的报价，它在卖价成交：可能是买方发起。`,
	],
	l1Short: ["At the ask: inferred.", "在卖价：推断。"],
	l2: [
		"Opening and intent stay unknown, however large the premium.",
		"开仓与意图仍然未知，权利金再大也一样。",
	],
	l2Short: ["The rest: unknown.", "其余：未知。"],
	l3: [
		`A 90-second-old quote would say ${STALE_CODE}: location and buyer drop to unknown.`,
		`如果只有 90 秒前的报价，它会读成 ${STALE_CODE}：位置和买方都降为未知。金额不变。`,
	],
	l3Short: ["Old quote: unknown.", "旧报价：未知。"],
	g0: [
		"For each open question, name the record that could answer it.",
		"为每个未决问题，找出能回答它的记录。",
	],
	g0Short: ["Name the record.", "找出那份记录。"],
	g1: [
		"Open interest and the linked prints close two gaps.",
		"未平仓量和关联成交填补了两个缺口。",
	],
	g1Short: ["Two gaps closed.", "两个缺口已填补。"],
	g2: [
		"No market record shows what anyone believes.",
		"没有任何市场记录能显示谁怎么想。",
	],
	g2Short: ["Belief: no record.", "观点：无记录。"],
	observed: ["observed", "观测"],
	calculated: ["calculated", "计算"],
	inferred: ["inferred", "推断"],
	unknown: ["unknown", "未知"],
	claimBig: [
		"Facts, then inferences, then unknowns.",
		"先事实，再推断，最后是未知。",
	],
	claimSub: [
		"Say what the record shows, what follows from it, and which record would answer the rest.",
		"说清记录显示了什么、由此能推出什么，以及哪份记录能回答其余问题。",
	],
	nextBig: ["Next: the module checkpoint", "下一步：模块检查点"],
	nextSub: [
		"quotes, executions and sentiment, on a new day",
		"在新的一天里运用报价、成交与情绪分类",
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
	const terms: [string, string, Copy][] = [
		["f-price", usd(BLOCK.price), copy.perShare],
		["f-qty", count(BLOCK.quantity), copy.contracts],
		["f-mult", count(MULTIPLIER), copy.shares],
	];
	/** A × sits halfway across the gap between two factors, whatever their widths. */
	const termW = (i: number) => terms[i][1].length * T.num * 1.2 * 0.6;
	const timesX = (i: number) =>
		(W * L.termX[i] + termW(i) / 2 + W * L.termX[i + 1] - termW(i + 1) / 2) / 2;
	const evidenceTag = (
		name: string,
		x: number,
		y: number,
		evidence: Evidence,
	) => (
		<text
			data-f={name}
			x={x}
			y={y}
			textAnchor="end"
			className={`wt-film-tag ${tone(evidence)}`}
			style={{ fontSize: T.small }}
		>
			{t(copy[evidence]).toUpperCase()}
		</text>
	);
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

			{/* The amount. */}
			{headline("m0", copy.m0, copy.m0Short)}
			{headline("m1", copy.m1, copy.m1Short)}
			{terms.map(([name, value, tag], i) => (
				<g key={name} data-f={name}>
					<text
						x={W * L.termX[i]}
						y={L.termY}
						textAnchor="middle"
						className="wt-film-num"
						style={{ fontSize: T.num * 1.2 }}
					>
						{value}
					</text>
					<text
						x={W * L.termX[i]}
						y={L.termY + T.small * 2.4}
						textAnchor="middle"
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(tag).toUpperCase()}
					</text>
				</g>
			))}
			{[0, 1].map((i) => (
				<text
					key={i}
					data-f={`times-${i}`}
					x={timesX(i)}
					y={L.termY}
					textAnchor="middle"
					className="wt-film-num wt-film-dim"
					style={{ fontSize: T.num }}
				>
					×
				</text>
			))}
			<g data-f="sum">
				<text
					x={W / 2}
					y={L.sumY - T.num * 1.5}
					textAnchor="middle"
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.premium).toUpperCase()}
				</text>
				<text
					data-f="sum-n"
					x={W / 2}
					y={L.sumY}
					textAnchor="middle"
					className="wt-film-num wt-film-accent"
					style={{ fontSize: T.num * 1.4 }}
				>
					{usd(PREMIUM, 0)}
				</text>
			</g>

			{/* The ladder of claims. */}
			{headline("l0", copy.l0, copy.l0Short)}
			{headline("l1", copy.l1, copy.l1Short)}
			{headline("l2", copy.l2, copy.l2Short)}
			{headline("l3", copy.l3, copy.l3Short)}
			{claims.map((claim, i) => (
				<g key={claim.id} data-f={`row-${i}`}>
					<rect
						data-f={`row-${i}-box`}
						x={margin}
						y={L.rowY(i)}
						width={room}
						height={L.rowH}
						rx={10}
						className={
							claim.evidence === "unknown" ? "wt-panel-shape" : "wt-focus-shape"
						}
					/>
					<text
						x={margin + 14}
						y={L.rowY(i) + L.rowH / 2 + text * 0.36}
						className={`wt-film-type ${claim.evidence === "unknown" ? "wt-film-dim" : ""}`}
						style={{ fontSize: text }}
					>
						{t(claim.text)}
					</text>
					{evidenceTag(
						`ev-${i}`,
						margin + room - 14,
						L.rowY(i) + L.rowH / 2 + T.small * 0.36,
						claim.evidence,
					)}
				</g>
			))}
			{claims.map((claim, i) =>
				claim.stale ? (
					<g key={claim.id}>
						{evidenceTag(
							`ev-${i}-stale`,
							margin + room - 14,
							L.rowY(i) + L.rowH / 2 + T.small * 0.36,
							"unknown",
						)}
					</g>
				) : null,
			)}

			{/* The records that close the gaps. */}
			{headline("g0", copy.g0, copy.g0Short)}
			{headline("g1", copy.g1, copy.g1Short)}
			{headline("g2", copy.g2, copy.g2Short)}
			{gaps.map((gap, i) => (
				<g key={gap.id} data-f={`gap-${i}`}>
					<rect
						x={margin}
						y={L.gapY(i)}
						width={room}
						height={L.gapH}
						rx={12}
						className="wt-panel-shape"
					/>
					<text
						x={margin + 16}
						y={L.gapY(i) + L.gapH * 0.38}
						className="wt-film-type"
						style={{ fontSize: narrow ? T.body : T.head * 0.9 }}
					>
						{t(gap.question)}
					</text>
					<text
						data-f={`needs-${i}`}
						x={margin + 16}
						y={L.gapY(i) + L.gapH * 0.74}
						className="wt-film-type wt-film-dim"
						style={{ fontSize: text }}
					>
						{t(gap.needs)}
					</text>
					{evidenceTag(
						`gq-${i}`,
						margin + room - 16,
						L.gapY(i) + L.gapH * 0.38,
						"unknown",
					)}
				</g>
			))}
			{gaps.map((gap, i) => (
				<g key={gap.id} data-f={`found-${i}`}>
					<text
						x={margin + 16}
						y={L.gapY(i) + L.gapH * 0.74}
						className={`wt-film-type ${gap.evidence === "unknown" ? "wt-film-dim" : "wt-film-accent"}`}
						style={{ fontSize: text }}
					>
						{t(narrow ? gap.foundShort : gap.found)}
					</text>
					{gap.evidence === "unknown"
						? null
						: evidenceTag(
								`gf-${i}`,
								margin + room - 16,
								L.gapY(i) + L.gapH * 0.38,
								gap.evidence,
							)}
				</g>
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
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			time,
		);
	const heads = ["m0", "m1", "l0", "l1", "l2", "l3", "g0", "g1", "g2"].map(
		(name) => one(name),
	);
	const terms = ["f-price", "f-qty", "f-mult"].map((name) => one(name));
	const times = [one("times-0"), one("times-1")];
	const rows = claims.map((_, i) => one(`row-${i}`));
	const staleRows = claims.flatMap((claim, i) => (claim.stale ? [i] : []));
	const gapCards = gaps.map((_, i) => one(`gap-${i}`));
	const found = gaps.map((_, i) => one(`found-${i}`));

	d.hidden([
		...flat("q"),
		...heads,
		...terms,
		...times,
		one("sum"),
		...rows,
		...staleRows.map((i) => one(`ev-${i}-stale`)),
		...gapCards,
		...found,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: one big print ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 5.1);
	word(one("q-big"), 6.4);

	// ——— amount: three factors from the record ———
	tl.addLabel("amount", 9.5);
	hide(flat("q"), 9.5);
	show(heads[0], 9.7, "above");
	d.swap(heads[0], heads[1], 11.0);
	terms.forEach((term, i) => {
		d.slam(term, 11.4 + i * 0.7);
		if (i) show(times[i - 1], 11.2 + i * 0.7);
	});
	show(one("sum"), 13.8);
	d.count(
		one<SVGTextElement>("sum-n"),
		PREMIUM,
		13.9,
		(v) => usd(Math.round(v / 100) * 100, 0),
		0,
		1.0,
	);

	// ——— claims: each with its evidence ———
	tl.addLabel("claims", 17.5);
	hide([heads[1], ...terms, ...times, one("sum")], 17.5);
	show(heads[2], 17.7, "above");
	show(rows[0], 18.0, "right");
	show(rows[1], 18.4, "right");
	d.swap(heads[2], heads[3], 19.8);
	show(rows[2], 20.2, "right");
	show(rows[3], 20.6, "right");
	d.swap(heads[3], heads[4], 22.2);
	show(rows[4], 22.6, "right");
	show(rows[5], 23.0, "right");
	// A stale quote: two claims fall to unknown; the amount doesn't move.
	d.swap(heads[4], heads[5], 24.8);
	staleRows.forEach((i, k) => {
		const at = 25.3 + k * 0.3;
		d.flip(one(`ev-${i}`), one(`ev-${i}-stale`), at);
		tl.set(one(`ev-${i}`), { opacity: 0 }, at + 0.3);
		tl.to(
			one(`row-${i}-box`),
			{ attr: { class: "wt-panel-shape" }, duration: 0.01 },
			at + 0.3,
		);
		tl.to(rows[i], { opacity: 0.6, duration: 0.3 }, at + 0.3);
	});
	tl.fromTo(
		[rows[0], rows[1]],
		{ scale: 1, transformOrigin: "0% 50%" },
		{ scale: 1.02, duration: 0.25, yoyo: true, repeat: 1 },
		26.0,
	);

	// ——— gaps: the record for each question ———
	tl.addLabel("gaps", 28);
	hide(
		[heads[5], ...rows, ...staleRows.map((i) => one(`ev-${i}-stale`))],
		28.0,
	);
	show(heads[6], 28.2, "above");
	gapCards.forEach((card, i) => {
		show(card, 28.5 + i * 0.3, "right");
	});
	d.swap(heads[6], heads[7], 30.6);
	[0, 1].forEach((i) => {
		const at = 31.0 + i * 1.2;
		d.flip(one(`needs-${i}`), found[i], at);
		tl.set(one(`needs-${i}`), { opacity: 0 }, at + 0.3);
		d.flip(one(`gq-${i}`), one(`gf-${i}`), at);
		tl.set(one(`gq-${i}`), { opacity: 0 }, at + 0.3);
	});
	d.swap(heads[7], heads[8], 33.8);
	d.flip(one("needs-2"), found[2], 34.2);
	tl.set(one("needs-2"), { opacity: 0 }, 34.5);

	// ——— claim ———
	tl.addLabel("claim", 37);
	hide([heads[8], ...gapCards, ...found], 37.0);
	word(one("z-big"), 37.3);
	show(one("z-sub"), 37.7);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
	return tl;
}

export const validateOptionPrintFilm: Film = {
	id: "validate-option-print",
	label: [
		`Checking one trade, as a short film: ${count(BLOCK.quantity)} Oct 18 105 calls at ${usd(BLOCK.price)}, and the premium built from the record, ${usd(BLOCK.price)} a share × ${count(BLOCK.quantity)} contracts × ${MULTIPLIER} shares = ${usd(PREMIUM, 0)}; a ladder of claims from observed and calculated through inferred to unknown, where a 90-second-old quote turns the location and the buyer to unknown and leaves the amount; and the records that close the gaps: open interest up ${BLOCK.openInterestChange}, a linked leg that makes it a ${usd(SPREAD_COST)} call spread, and no record at all of belief`,
		`核查一笔成交短片：${count(BLOCK.quantity)} 张 10月18日 105 看涨以 ${usd(BLOCK.price)} 成交，权利金由记录算出：每股 ${usd(BLOCK.price)} × ${count(BLOCK.quantity)} 张 × ${MULTIPLIER} 股 = ${usd(PREMIUM, 0)}；一张从观测、计算到推断、未知的结论阶梯，90 秒前的报价会让位置和买方变为未知，而金额不变；以及填补缺口的记录：未平仓量增加 ${BLOCK.openInterestChange}，关联的一条腿使它成为 ${usd(SPREAD_COST)} 的看涨价差，而观点没有任何记录`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Checking one trade", "核查一笔成交"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "amount", label: ["The amount", "金额"] },
		{ id: "claims", label: ["Claims", "结论"] },
		{ id: "gaps", label: ["The gaps", "缺口"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一步"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
