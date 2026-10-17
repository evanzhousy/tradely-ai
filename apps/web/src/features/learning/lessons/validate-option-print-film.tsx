import { useId } from "react";
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
	toneClass,
	toneColor,
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
 * linked records from the spread cost. The recorded prices form a subtraction; the settled
 * $1.25/share result takes the hero lock. Market records cannot show belief.
 *
 *   open      0–4
 *   question  4–8.6
 *   amount    8.6–14
 *   claims    14–22.1    matched quote, then its 90-second-old replacement
 *   gaps      22.1–40.2  OI, linked records, subtraction, hero, belief limitation
 *   claim     40.2–45
 *   next      45–47.5
 */

const END = 47.5;
type Evidence = "observed" | "calculated" | "inferred" | "unknown";
const LEG = BLOCK.pairedLeg;
const seconds = (time: string) =>
	time.split(":").reduce((total, part) => total * 60 + Number(part), 0);
const QUOTE_AGE = seconds(BLOCK.time) - seconds(BLOCK.staleQuote.time);

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
		gapH: (i: number) => H * [0.145, 0.19, 0.11][i],
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
		needs: ["Multi-leg code + linked prints", "多腿代码＋关联成交"],
	},
	{
		id: "belief",
		question: ["Belief", "观点"],
		needs: ["What would show belief?", "什么能显示观点？"],
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
	print: ["print", "成交"],
	quote: ["Matched quote", "匹配报价"],
	quoteShort: ["Matched", "匹配报价"],
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
		"Inferring a buyer needs a fresh quote.",
		"推断买方发起，需要及时报价。",
	],
	beliefAnswer: ["No market record shows belief.", "市场记录无法显示观点。"],
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
	const hatchId = `evidence-${useId().replace(/:/g, "")}`;
	const gapHeadingY = (i: number) =>
		i === 0 ? H * 0.2494 : L.gapY(i) + L.gapH(i) * (i === 1 ? 0.22 : 0.38);
	const gapPromptY = (i: number) =>
		i === 0 ? H * 0.284 : i === 1 ? H * 0.53 : L.gapY(i) + L.gapH(i) * 0.78;
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
		<g data-f={name}>
			<text
				data-f={`${name}-label`}
				x={x}
				y={y}
				textAnchor="end"
				className={`wt-film-tag ${evidence === "unknown" ? toneClass.caution : ""}`}
				style={{ fontSize: T.body }}
			>
				{t(copy[evidence]).toUpperCase()}
			</text>
			{/* Evidence uses a line code, independent of the label's hue. */}
			<rect
				data-f={`${name}-line`}
				x={x - 24}
				y={y + T.body * 0.25}
				width={24}
				height={evidence === "observed" || evidence === "calculated" ? 2 : 4}
				fill={
					evidence === "unknown"
						? `url(#${hatchId})`
						: evidence === "inferred"
							? "none"
							: "var(--tone-ink)"
				}
				stroke={evidence === "inferred" ? "var(--tone-ink)" : "none"}
			/>
		</g>
	);
	return (
		<>
			<defs>
				<pattern
					id={hatchId}
					width={4}
					height={4}
					patternUnits="userSpaceOnUse"
				>
					<path
						d="M-1 1 1-1 M0 4 4 0 M3 5 5 3"
						fill="none"
						stroke={toneColor("caution")}
					/>
				</pattern>
			</defs>
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
						className="wt-panel-shape"
						style={{ strokeWidth: claim.evidence === "unknown" ? 1 : 1.5 }}
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
						L.rowY(i) + L.rowH / 2 + T.body * 0.36,
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
							L.rowY(i) + L.rowH / 2 + T.body * 0.36,
							"unknown",
						)}
					</g>
				) : null,
			)}

			{/* The trade stays beside the quote; quote and dependent tags change together. */}
			<rect
				data-f="quote-panel"
				x={margin}
				y={H * 0.77}
				width={room}
				height={H * 0.195}
				rx={12}
				className="wt-panel-shape"
			/>
			<g data-f="quote-print">
				<Word
					name="quote-print-tag"
					x={margin + 14}
					y={H * 0.815}
					size={T.body}
					anchor="start"
					className="wt-film-tag"
				>
					{t(copy.print).toUpperCase()}
				</Word>
				<Word
					name="quote-print-time"
					x={W * 0.6}
					y={H * 0.815}
					size={T.body}
					className="wt-film-tag"
				>
					{BLOCK.time}
				</Word>
				<Word
					name="quote-print-price"
					x={margin + room - 14}
					y={H * 0.815}
					size={T.body}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					{usd(BLOCK.price)}
				</Word>
			</g>
			{([BLOCK.quote, BLOCK.staleQuote] as const).map((quote, i) => (
				<g key={quote.time} data-f={i ? "quote-stale" : "quote-fresh"}>
					<Word
						name={`quote-${i}-tag`}
						x={margin + 14}
						y={H * 0.875}
						size={T.body}
						anchor="start"
						className="wt-film-tag"
					>
						{t(
							i ? copy.staleQuote : narrow ? copy.quoteShort : copy.quote,
						).toUpperCase()}
					</Word>
					<Word
						name={`quote-${i}-time`}
						x={W * 0.6}
						y={H * 0.875}
						size={T.body}
						anchor="middle"
						className="wt-film-tag"
					>
						{quote.time}
					</Word>
					<Word
						name={`quote-${i}-bid`}
						x={margin + 14}
						y={H * 0.935}
						size={T.body}
						anchor="start"
						className="wt-film-num wt-film-dim"
					>
						{t(copy.bid)} {usd(quote.bid)}
					</Word>
					<Word
						name={`quote-${i}-ask`}
						x={margin + room - 14}
						y={H * 0.935}
						size={T.body}
						anchor="end"
						className="wt-film-num"
					>
						{t(copy.ask)}{" "}
						<tspan className={i === 0 ? toneClass.focus : undefined}>
							{usd(quote.ask)}
						</tspan>
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
					<text
						data-f={`needs-${i}`}
						x={margin + 16}
						y={gapPromptY(i)}
						className="wt-film-type wt-film-dim"
						style={{ fontSize: T.body }}
					>
						{t(gap.needs)}
					</text>
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
				y={H * 0.326}
				size={T.body}
				anchor="start"
				className="wt-film-type wt-film-accent"
			>
				{t(["Tuesday OI ", "周二未平仓量 "])}
				<tspan className={toneClass.up}>+{BLOCK.openInterestChange}</tspan>
				{t([": mostly opening", "：多为开仓"])}
			</Word>
			{evidenceTag("gf-0", margin + room - 16, gapHeadingY(0), "inferred")}
			<g data-f="found-1">
				{(
					[
						[
							"buy",
							BLOCK.price,
							[
								`${count(BLOCK.quantity)} Oct 18 105 calls bought`,
								`${count(BLOCK.quantity)} 张 10月18日 105 看涨买入`,
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
				y={H * 0.84}
				size={T.body}
				className="wt-film-tag"
			>
				{t(copy.spreadCost).toUpperCase()}
			</Word>

			<Lines
				name="belief-head"
				text={t(copy.beliefAnswer)}
				x={W / 2}
				y={H * 0.46}
				size={T.title}
				maxWidth={room}
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
	const quote = [
		"quote-panel",
		"quote-fresh",
		"quote-stale",
		"quote-print",
	].map((name) => one(name));
	const found = [
		one("found-0"),
		...records,
		...prices,
		one("gf-0"),
		one("gf-1"),
	];
	const lockLeg = one<SVGGraphicsElement>("lock-leg");
	// Fit the unit label to the actual font ink, keeping the figure itself fixed.
	// Initial layout is a timeline set so reverse seeks preserve the fitted geometry.
	const label = one<SVGTextElement>("cost-label");
	const result = one<SVGTextElement>("cost-result");
	const question = gapCards[2].querySelector<SVGTextElement>("text");
	const paint = document.createElement("canvas").getContext("2d");
	if (paint && question) {
		const measureInk = (mark: SVGTextElement, size: number) => {
			const style = getComputedStyle(mark);
			paint.font = `${style.fontWeight} ${size}px ${style.fontFamily}`;
			return paint.measureText(mark.textContent ?? "");
		};
		const fontSize = (mark: SVGTextElement) =>
			Number.parseFloat(getComputedStyle(mark).fontSize);
		const baseline = (mark: SVGTextElement) => Number(mark.getAttribute("y"));
		const resultBottom =
			baseline(result) +
			measureInk(result, fontSize(result)).actualBoundingBoxDescent;
		const labelTop = resultBottom + 8;
		const questionTop =
			baseline(question) -
			measureInk(question, fontSize(question)).actualBoundingBoxAscent;
		const initialSize = fontSize(label);
		const labelInk = measureInk(label, initialSize);
		const labelBox = label.getBBox();
		const ascentRatio = labelInk.actualBoundingBoxAscent / initialSize;
		const descentRatio =
			(labelBox.y + labelBox.height - baseline(label)) / initialSize;
		const availableHeight = questionTop - 12 - labelTop;
		const fittedSize = Math.max(
			L.type.small,
			Math.min(
				L.type.body,
				(initialSize * (L.room - 24)) / label.getComputedTextLength(),
				availableHeight / (ascentRatio + descentRatio),
			),
		);
		const fittedInk = measureInk(label, fittedSize);
		tl.set(
			label,
			{
				fontSize: fittedSize,
				attr: { y: labelTop + fittedInk.actualBoundingBoxAscent },
				immediateRender: true,
			},
			0,
		);
	}

	const fade = (targets: Element[], at: number, opacity = 1) =>
		tl.fromTo(targets, { opacity: 0 }, { opacity, duration: 0.5 }, at);
	const close = (i: number, at: number) => {
		if (i === 0) {
			fade([one("found-0")], at);
		} else {
			fade([...records, ...prices], at + 0.3);
			hide(one("gq-1"), at, 0.3, 0);
			tl.fromTo(
				one("gf-1"),
				{ opacity: 0 },
				{ opacity: 1, duration: 0.35 },
				at + 0.3,
			);
			return;
		}
		// Fold only the text; its line code fades within the same existing swap.
		const to = one(`gf-${i}`);
		d.flip(one(`gq-${i}-label`), one(`gf-${i}-label`), at);
		tl.to(one(`gq-${i}-line`), { opacity: 0, duration: 0.3 }, at);
		tl.set(to, { opacity: 1 }, at + 0.3);
		tl.fromTo(
			one(`gf-${i}-line`),
			{ opacity: 0 },
			{ opacity: 1, duration: 0.35 },
			at + 0.3,
		);
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
		one("belief-head"),
		...quote,
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
	terms.forEach((term) => {
		word(term.firstElementChild as Element, 9.4);
		show(term.lastElementChild as Element, 9.4, "below", 0.55);
	});
	show(times, 9.4, "below", 0.55);
	// Fixed factors make a fixed product: reveal the settled premium, never count it.
	show(one("sum"), 11.6);

	// ——— claims: each with its evidence ———
	tl.addLabel("claims", 14);
	hide([heads[0], ...terms, ...times, one("sum")], 14.0);
	show(heads[1], 14.35);
	tl.set(
		one("quote-print-price"),
		{ attr: { class: "wt-film-num wt-film-accent" } },
		14.2,
	);
	fade([quote[0], quote[1], quote[3]], 14.2);
	rows.forEach((row, i) => {
		show(row, 14.7 + i * 0.5, "right");
	});
	// The six-row ladder settles at 17.7; inspect it intact for 1.6 seconds.
	// Quote and dependent classifications are one scenario: no stale quote with fresh tags.
	hide([quote[1], ...staleRows.map((i) => one(`ev-${i}`))], 19.3, 0.35, 0);
	tl.set(one("quote-print-price"), { attr: { class: "wt-film-num" } }, 19.65);
	fade([quote[2], ...staleRows.map((i) => one(`ev-${i}-stale`))], 19.65);
	staleRows.forEach((i) => {
		tl.set(
			one(`row-${i}-box`),
			{ attr: { class: "wt-panel-shape" }, strokeWidth: 1 },
			19.65,
		);
		tl.to(rows[i], { opacity: 0.6, duration: 0.3 }, 19.65);
	});

	// ——— gaps: records, calculated cost and the market-record limitation ———
	tl.addLabel("gaps", 22.1);
	hide(
		[
			heads[1],
			...rows,
			...quote,
			...staleRows.map((i) => one(`ev-${i}-stale`)),
		],
		22.1,
	);
	show(heads[2], 22.45);
	gapCards.forEach((card, i) => {
		show(card, 22.45 + i * 0.2, "right");
	});
	close(0, 24.5); // settles 25.15
	close(1, 26.15); // linked records settle 26.95, one second after OI
	// The unresolved question has had 4.6 seconds settled. OI's sentence reaches its
	// audit-counted hold before 28.2; both step back before the operands finish settling.
	tl.to(gapCards[2], { opacity: 0.3, duration: 0.5 }, 27.95);
	tl.to(
		[gapCards[0], one("found-0"), one("gf-0")],
		{ opacity: 0.3, duration: 0.5 },
		28.2,
	);
	// The subtraction enters as one expression directly beneath its price records.
	tl.fromTo(
		[one("cost-0"), one("cost-minus"), one("cost-1")],
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
	// Clear the proofs instead of leaving ghosts. The incoming line starts after the
	// outgoing stack is below one quarter; the tails overlap to avoid an empty stage.
	tl.to(
		[heads[2], ...gapCards, ...found, ...cost],
		{ opacity: 0, duration: 0.5, ease: "power1.inOut" },
		36.15,
	);
	fade([one("belief-head")], 36.5);

	// ——— claim ———
	tl.addLabel("claim", 40.2);
	hide(one("belief-head"), 40.2);
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
