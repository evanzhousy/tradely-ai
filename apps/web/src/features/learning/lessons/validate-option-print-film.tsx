import { type Copy, count, pick, usd } from "@/content/world";
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
	BLOCK,
	MULTIPLIER,
	PREMIUM,
	SPREAD_COST,
} from "./validate-option-print-model";

/*
 * One print: calculate its premium, check the matched and then stale quote, and separate
 * linked records from the spread cost. Traces connect the prices to a subtraction; the settled
 * $1.25/share result takes the hero lock. Market records cannot show belief.
 *
 *   open      0–4
 *   question  4–8.6
 *   amount    8.6–14
 *   claims    14–23.6    matched quote, then its 90-second-old replacement
 *   gaps      23.6–40.2  OI, linked records, subtraction, hero, belief limitation
 *   claim     40.2–45
 *   next      45–47.5
 */

const END = 47.5;
type Evidence = "observed" | "calculated" | "inferred" | "unknown";
const LEG = BLOCK.pairedLeg;
const seconds = (time: string) =>
	time.split(":").reduce((total, part) => total * 60 + Number(part), 0);
const QUOTE_AGE = seconds(BLOCK.time) - seconds(BLOCK.staleQuote.time);
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
		gapY: (i: number) => H * [0.2, 0.355, 0.865][i],
		gapH: (i: number) => H * [0.13, 0.19, 0.11][i],
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

const gaps: { id: string; question: Copy; needs: Copy }[] = [
	{
		id: "open",
		question: ["Opened new contracts?", "开立了新合约？"],
		needs: ["Next OI report", "次日未平仓量"],
	},
	{
		id: "leg",
		question: ["One leg of a strategy?", "某个策略的一条腿？"],
		needs: ["Condition + linked prints", "条件＋关联成交"],
	},
	{
		id: "belief",
		question: ["Belief", "观点"],
		needs: ["No market record shows belief.", "市场记录无法显示观点。"],
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
	mHead: ["The amount comes from the record.", "金额直接来自记录。"],
	perShare: ["per share", "每股"],
	contracts: ["contracts", "张合约"],
	shares: ["shares each", "股/张"],
	premium: ["premium", "权利金"],
	lHead: ["Each claim, tagged with its evidence.", "每个结论，标上它的证据。"],
	gHead: ["Which record could close each gap?", "哪份记录能填补每个缺口？"],
	g2Head: ["This print was one spread leg.", "这笔成交是价差的一条腿。"],
	quote: ["Matched quote", "匹配报价"],
	staleQuote: [`${QUOTE_AGE} s old`, `${QUOTE_AGE} 秒前`],
	bid: ["bid", "买价"],
	ask: ["ask", "卖价"],
	spreadCost: ["calculated · per share", "计算 · 每股成本"],
	observed: ["observed", "观测"],
	calculated: ["calculated", "计算"],
	inferred: ["inferred", "推断"],
	unknown: ["unknown", "未知"],
	claimBig: [
		"Facts, then inferences, then unknowns.",
		"先事实，再推断，最后是未知。",
	],
	claimSub: [
		"Say what the record shows, then what follows.",
		"先说记录显示了什么，再说能推出什么。",
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
	const gapHeadingY = (i: number) =>
		L.gapY(i) + L.gapH(i) * (i === 1 ? 0.22 : 0.38);
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
			{headline("m-head", copy.mHead)}
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
			{headline("l-head", copy.lHead)}
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

			{/* Replace the quote record before changing any classification. */}
			<rect
				data-f="quote-panel"
				x={margin}
				y={H * 0.79}
				width={room}
				height={H * 0.16}
				rx={12}
				className="wt-panel-shape"
			/>
			{([BLOCK.quote, BLOCK.staleQuote] as const).map((quote, i) => (
				<g key={quote.time} data-f={i ? "quote-stale" : "quote-fresh"}>
					<Word
						name={`quote-${i}-tag`}
						x={margin + 14}
						y={H * 0.83}
						size={T.small}
						anchor="start"
						className="wt-film-tag"
					>
						{t(i ? copy.staleQuote : copy.quote).toUpperCase()}
					</Word>
					<Word
						name={`quote-${i}-time`}
						x={margin + room - 14}
						y={H * 0.83}
						size={T.small}
						anchor="end"
						className="wt-film-tag"
					>
						{quote.time}
					</Word>
					<Word
						name={`quote-${i}-bid`}
						x={margin + 14}
						y={H * 0.905}
						size={T.body}
						anchor="start"
						className="wt-film-num"
					>
						{t(copy.bid)} {usd(quote.bid)}
					</Word>
					<Word
						name={`quote-${i}-ask`}
						x={margin + room - 14}
						y={H * 0.905}
						size={T.body}
						anchor="end"
						className="wt-film-num"
					>
						{t(copy.ask)} {usd(quote.ask)}
					</Word>
				</g>
			))}

			{/* The records that close the gaps. */}
			{headline("g-head", copy.gHead)}
			{/* The hero's answer, as the linked leg's record comes up. */}
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
			{gaps.map((gap, i) => (
				<g key={gap.id} data-f={`gap-${i}`}>
					<rect
						x={margin}
						y={L.gapY(i)}
						width={room}
						height={L.gapH(i)}
						rx={12}
						className="wt-panel-shape"
					/>
					<text
						x={margin + 16}
						y={gapHeadingY(i)}
						className="wt-film-type"
						style={{ fontSize: narrow ? T.body : T.head * 0.9 }}
					>
						{t(gap.question)}
					</text>
					{i !== 0 && (
						<text
							data-f={`needs-${i}`}
							x={margin + 16}
							y={L.gapY(i) + L.gapH(i) * 0.78}
							className="wt-film-type wt-film-dim"
							style={{ fontSize: T.body }}
						>
							{t(gap.needs)}
						</text>
					)}
					{evidenceTag(
						`gq-${i}`,
						margin + room - 16,
						gapHeadingY(i),
						"unknown",
					)}
				</g>
			))}
			<Word
				name="found-0"
				x={margin + 16}
				y={L.gapY(0) + L.gapH(0) * 0.78}
				size={T.body}
				anchor="start"
				className="wt-film-type wt-film-accent"
			>
				{t([
					`Tuesday OI +${BLOCK.openInterestChange}: mostly opening`,
					`周二未平仓量 +${BLOCK.openInterestChange}：多为开仓`,
				])}
			</Word>
			{evidenceTag(
				"gf-0",
				margin + room - 16,
				L.gapY(0) + L.gapH(0) * 0.38,
				"inferred",
			)}
			<g data-f="found-1">
				{(
					[
						[
							"buy",
							BLOCK.price,
							[
								`${count(BLOCK.quantity)} Oct 18 105 calls`,
								`${count(BLOCK.quantity)} 张 10月18日 105 看涨`,
							],
						],
						[
							"sell",
							LEG.price,
							[
								`${count(LEG.quantity)} Oct 18 ${LEG.strike} calls sold`,
								`${count(LEG.quantity)} 张 10月18日 ${LEG.strike} 看涨卖出`,
							],
						],
					] as const
				).map(([id, price, label], i) => (
					<g key={id}>
						<Word
							name={`leg-${id}-record`}
							x={margin + 16}
							y={H * (0.445 + i * 0.045)}
							size={T.body}
							anchor="start"
							className="wt-film-type"
						>
							{t(label)}
						</Word>
						<Word
							name={`leg-${id}-price`}
							x={margin + room - 16}
							y={H * (0.445 + i * 0.045)}
							size={T.body}
							anchor="end"
							className="wt-film-num"
						>
							{usd(price)}
						</Word>
					</g>
				))}
			</g>
			<Word
				name="leg-link"
				x={margin + 16}
				y={H * 0.53}
				size={T.small}
				anchor="start"
				className="wt-film-tag"
			>
				{t(["linked · multi-leg", "关联 · 多腿"]).toUpperCase()}
			</Word>

			{evidenceTag("gf-1", margin + room - 16, gapHeadingY(1), "observed")}
			{([BLOCK.price, LEG.price] as const).map((price, i) => (
				<Word
					key={price}
					name={`cost-${i}`}
					x={W * (i ? 0.65 : 0.35)}
					y={H * 0.62}
					size={T.num * 0.85}
					className="wt-film-num"
				>
					{usd(price)}
				</Word>
			))}
			<Word
				name="cost-minus"
				x={W / 2}
				y={H * 0.62}
				size={T.num * 0.85}
				className="wt-film-num"
			>
				−
			</Word>
			<Word
				name="cost-result"
				x={W / 2}
				y={H * 0.795}
				size={T.num * 1.9}
				className="wt-film-num wt-film-accent"
			>
				{usd(SPREAD_COST)}
			</Word>
			<Word
				name="cost-label"
				x={W / 2}
				y={H * 0.845}
				size={T.small}
				className="wt-film-tag"
			>
				{t(copy.spreadCost).toUpperCase()}
			</Word>
			{[0, 1].map((i) => (
				<path
					key={i}
					data-f={`cost-link-${i}`}
					d={`M ${margin + room - 10} ${H * (0.437 + i * 0.045)} H ${W * (i ? 0.937 : 0.953)} V ${H * (0.549 + i * 0.004)} H ${W * (i ? 0.65 : 0.35)}`}
					className="wt-film-link"
					fill="none"
					stroke="currentColor"
					strokeWidth={1.5}
				/>
			))}
			<path
				data-f="belief-rule"
				d={`M ${margin + 16} ${H * 0.967} H ${margin + room - 16}`}
				className="wt-film-link"
				fill="none"
				stroke="currentColor"
				strokeWidth={1.5}
			/>

			<Brackets name="lock-leg" glow />

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
	const heads = ["m-head", "l-head", "g-head", "g2-head"].map((name) =>
		one(name),
	);
	const terms = ["f-price", "f-qty", "f-mult"].map((name) => one(name));
	const times = [one("times-0"), one("times-1")];
	const rows = claims.map((_, i) => one(`row-${i}`));
	const staleRows = claims.flatMap((claim, i) => (claim.stale ? [i] : []));
	const gapCards = gaps.map((_, i) => one(`gap-${i}`));
	const records = ["buy", "sell"].map((id) => one(`leg-${id}-record`));
	const prices = ["buy", "sell"].map((id) =>
		one<SVGGraphicsElement>(`leg-${id}-price`),
	);
	const cost = [
		"cost-0",
		"cost-1",
		"cost-minus",
		"cost-result",
		"cost-label",
	].map((name) => one(name));
	const quote = ["quote-panel", "quote-fresh", "quote-stale"].map((name) =>
		one(name),
	);
	const found = [
		one("found-0"),
		...records,
		...prices,
		one("leg-link"),
		one("gf-0"),
		one("gf-1"),
	];
	const lockLeg = one<SVGGraphicsElement>("lock-leg");
	const fade = (targets: Element[], at: number, opacity = 1) =>
		tl.fromTo(targets, { opacity: 0 }, { opacity, duration: 0.5 }, at);
	const close = (i: number, at: number) => {
		if (i === 0) {
			fade([one("found-0")], at);
		} else {
			hide(one("needs-1"), at, 0.3, 0);
			fade([...records, ...prices, one("leg-link")], at + 0.3);
			hide(one("gq-1"), at, 0.3, 0);
			tl.fromTo(
				one("gf-1"),
				{ opacity: 0 },
				{ opacity: 1, duration: 0.35 },
				at + 0.3,
			);
			return;
		}
		d.flip(one(`gq-${i}`), one(`gf-${i}`), at);
		tl.set(one(`gq-${i}`), { opacity: 0 }, at + 0.3);
	};

	d.hidden([
		...flat("q"),
		...heads,
		...terms.flatMap((term) => [...term.children]),
		...times,
		one("sum"),
		...rows,
		...staleRows.map((i) => one(`ev-${i}-stale`)),
		...gapCards,
		...found,
		...cost,
		one("cost-link-0"),
		one("cost-link-1"),
		...quote,
		one("belief-rule"),
		lockLeg,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: one big print ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 4.8);
	word(one("q-big"), 5.1);

	// ——— amount: three factors from the record ———
	tl.addLabel("amount", 8.6);
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	terms.forEach((term, i) => {
		word(term.firstElementChild as Element, 9.4 + i * 0.7);
		show(term.lastElementChild as Element, 9.4 + i * 0.7, "below", 0.55);
		if (i) show(times[i - 1], 9.2 + i * 0.7);
	});
	show(one("sum"), 11.6);
	d.count(
		one<SVGTextElement>("sum-n"),
		PREMIUM,
		11.7,
		(v) => usd(Math.round(v / 100) * 100, 0),
		0,
		1.0,
	);

	// ——— claims: each with its evidence ———
	tl.addLabel("claims", 14);
	hide([heads[0], ...terms, ...times, one("sum")], 14.0);
	show(heads[1], 14.35);
	fade([quote[0], quote[1]], 14.2);
	rows.forEach((row, i) => {
		show(row, 14.7 + i * 0.5, "right");
	});
	// One second of quiet after the old quote lands, before downgrading the tags.
	hide(quote[1], 17.75, 0.35, 0);
	fade([quote[2]], 18.1);
	staleRows.forEach((i, k) => {
		const at = 19.6 + k * 0.3;
		d.flip(one(`ev-${i}`), one(`ev-${i}-stale`), at);
		tl.set(one(`ev-${i}`), { opacity: 0 }, at + 0.3);
		tl.set(
			one(`row-${i}-box`),
			{ attr: { class: "wt-panel-shape" } },
			at + 0.3,
		);
		tl.to(rows[i], { opacity: 0.6, duration: 0.3 }, at + 0.3);
	});

	// ——— gaps: records, calculated cost and the market-record limitation ———
	tl.addLabel("gaps", 23.6);
	hide(
		[
			heads[1],
			...rows,
			...quote,
			...staleRows.map((i) => one(`ev-${i}-stale`)),
		],
		23.6,
	);
	show(heads[2], 23.95);
	gapCards.forEach((card, i) => {
		show(card, 23.95 + i * 0.2, "right");
	});
	close(0, 24.5); // settles 25.15
	close(1, 26.15); // linked records settle 26.95, one second after OI
	// Trace from the price records through the clear right gutter into the subtraction.
	// Records stay readable: no sentence loses its hold to make room for a flight.
	fade([one("cost-minus")], 27.95);
	[0, 1].forEach((i) => {
		d.trace(one<SVGPathElement>(`cost-link-${i}`), 27.95, { duration: 0.6 });
	});
	tl.fromTo(
		[one("cost-0"), one("cost-1")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		28.55,
	);
	// Fixed operands, fixed result; never animate a total after an equals sign.
	fade([one("cost-result"), one("cost-label")], 29.85);
	d.lock(lockLeg, 31.35, {
		around: [one("cost-result"), one("cost-label")],
		pad: 6,
	});
	tl.addLabel("hero-lock", 31.35);
	show(heads[3], 31.35);
	// Brackets settle 31.8; the result remains stationary throughout this after-beat.
	hide([lockLeg, heads[3]], 35.8);
	d.trace(one<SVGPathElement>("belief-rule"), 37.15, { duration: 0.5 });

	// ——— claim ———
	tl.addLabel("claim", 40.2);
	hide(
		[
			heads[2],
			...gapCards,
			...found,
			...cost,
			one("cost-link-0"),
			one("cost-link-1"),
			one("belief-rule"),
		],
		40.2,
	);
	word(one("z-big"), 40.5);
	show(one("z-sub"), 40.9);

	// ——— next ———
	tl.addLabel("next", 45.0);
	hide(kids("claim"), 45.0);
	// Start the end-card line exactly when the claim's exit settles.
	d.close(44.95);

	return tl;
}

export const validateOptionPrintFilm: Film = {
	id: "validate-option-print",
	label: [
		`Checking one trade, as a short film: ${count(BLOCK.quantity)} Oct 18 105 calls at ${usd(BLOCK.price)}, and the premium built from the record, ${usd(BLOCK.price)} a share × ${count(BLOCK.quantity)} contracts × ${MULTIPLIER} shares = ${usd(PREMIUM, 0)}; a ladder of claims from observed and calculated through inferred to unknown, where a 90-second-old quote turns the location and the buyer to unknown and leaves the amount; and the records that close the gaps: open interest up ${BLOCK.openInterestChange}, a linked leg that makes it a ${usd(SPREAD_COST)} call spread, and no market record of belief`,
		`核查一笔成交短片：${count(BLOCK.quantity)} 张 10月18日 105 看涨以 ${usd(BLOCK.price)} 成交，权利金由记录算出：每股 ${usd(BLOCK.price)} × ${count(BLOCK.quantity)} 张 × ${MULTIPLIER} 股 = ${usd(PREMIUM, 0)}；一张从观测、计算到推断、未知的结论阶梯，90 秒前的报价会让位置和买方变为未知，而金额不变；以及填补缺口的记录：未平仓量增加 ${BLOCK.openInterestChange}，关联的一条腿使它成为 ${usd(SPREAD_COST)} 的看涨价差，而市场记录无法显示观点`,
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
