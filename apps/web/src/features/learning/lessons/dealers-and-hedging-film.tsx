import { type Copy, count, pick, signedCount, usd } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import type { Film, FilmContext } from "../walkthrough/film";
import {
	Backdrop,
	Brackets,
	clamp,
	createDirector,
	EndCard,
	filmFrame,
	Lines,
	lineCount,
	TitleCard,
	toneClass,
	Word,
} from "../walkthrough/film-kit";
import { textWidth } from "../walkthrough/text-measure";
import {
	BUY_AFTER_RISE,
	CONTRACTS,
	DELTA,
	deltaAfter,
	HEDGE_SHARES,
	hedgeBook,
	MOVE,
	MULTIPLIER,
	OPEN_INTEREST,
	PREMIUM,
	perContract,
	QUOTE,
	SELL_AFTER_FALL,
	SPOT,
	SPREAD,
	STRIKE,
	STRIKE_GAMMA,
	STRIKE_SHARES,
	shareEquivalent,
	strikeTrade,
} from "./dealers-and-hedging-model";
import { fixed2 } from "./gamma-model";

/*
 * Dealers and hedging, as a film. It opens on the trade the learner already knows, buying
 * calls, and asks about the other side: a market maker, or dealer, sells them, so is the
 * dealer betting against you? Subject: the dealer's hedge, two bars one under the other,
 * the shares the sold calls move like and the shares bought against them. They match at
 * 260, so direction is hedged and the spread is what the dealer aims to keep. Then ALFA
 * walks up $2: delta, the first bar and its figure move from one value, the second bar
 * doesn't, and the hero is the 40 shares between them, which the dealer must buy. Last,
 * one strike with 2,500 contracts open: the same arithmetic gives 6,650 shares a $1 either
 * to buy or to sell, depending on a side that open interest doesn't show. Type carries the
 * claims; no chart, no camera, no carry.
 *
 *   open      0–4        "Dealers and hedging" wipes on and becomes the corner tag
 *   question  4–9.6      you buy 5 calls at $4.20; a market maker sells them: betting
 *                        against you?
 *   hedge     9.6–21.4   sold 5 calls, like short 260 shares; 260 bought; net 0, and the
 *                        $0.15 spread ($15 a contract)
 *   move      21.4–34.1  ALFA $100 → $102 in one walk: delta 0.52 → 0.60, 260 → 300 against
 *                        260 held; hero: +40 shares to buy, locked at 27.8 and standing to
 *                        29.95 with its reason under it; then "Short gamma", and the fall:
 *                        sell 40. An "example" tag stands from the question to here
 *   side      34.1–41.1  2,500 Oct 18 110 calls open: 6,650 shares a $1; dealers short them
 *                        buy, dealers long them sell; which one is a model's assumption
 *   claim     41.1–45.5  "Dealers hedge; the hedge trades the stock."
 *   next      45.5–47.4  Next: 0DTE
 */

const END = 47.4;
/** The bars' scale: a little past the 300 shares the calls come to move like. */
const BAR_MAX = 320;
const WALK = 1.4;
const HERO_LOCK = 27.8;

const short = hedgeBook("short", 0);
const price = (dollars: number) => usd(Math.round(dollars * 100));
const expression = (delta: number): Copy => [
	`${CONTRACTS} calls × ${MULTIPLIER} shares × delta ${fixed2(delta)}`,
	`${CONTRACTS} 张 × ${MULTIPLIER} 股 × Delta ${fixed2(delta)}`,
];
const spotText = (move: number) => `ALFA ${price(SPOT + move)}`;
const moveText = (move: number) => `▲ ${price(move)}`;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, type: T } = frame;
	const right = width - margin;
	const barSpan = width * (narrow ? 0.46 : 0.5);
	const barH = clamp(14, H * 0.045, 24);
	// A phone's captions and arithmetic are set at body size, never the small tag size.
	const expressionSize = narrow ? T.body * 0.92 : T.small;
	const row = (tagY: number) => {
		const note = tagY + 10 + barH + 6 + expressionSize;
		return {
			tag: tagY,
			bar: tagY + 10,
			figure: tagY + 10 + barH / 2 + T.num * 0.35,
			note,
			/** The gloss sits beside the arithmetic, or under it on a phone. */
			gloss: narrow ? note + T.small * 1.4 : note,
		};
	};
	const noteSize = T.body * 1.08;
	return {
		...frame,
		right,
		barH,
		/** The x a number of shares reaches on either bar. */
		bar: (shares: number) => (shares / BAR_MAX) * barSpan,
		expressionSize,
		// Under nine tenths of a headline at every width: a note is not a beat.
		noteSize,
		spotY: H * (narrow ? 0.215 : 0.27),
		/** "One example": beside the price on the wide frame, under it on a phone. */
		exampleY: H * (narrow ? 0.265 : 0.27),
		needed: row(H * (narrow ? 0.345 : 0.36)),
		held: row(H * (narrow ? 0.555 : 0.58)),
		heroY: H * 0.775,
		heroSize: T.num * 1.35,
		notes: { net: H * 0.76, spread: H * 0.86, fall: H * 0.955 },
		headWidth: narrow ? frame.room : frame.room * 0.74,
		// A phone gives the two cases the room: shorter supporting lines, larger rows.
		side: narrow
			? {
					oi: H * 0.26,
					calc: H * 0.33,
					column: H * 0.45,
					rows: [H * 0.56, H * 0.72] as const,
					unknown: H * 0.88,
					result: T.num,
					label: T.head,
					tag: T.body,
				}
			: {
					oi: H * 0.29,
					calc: H * 0.385,
					column: H * 0.47,
					rows: [H * 0.59, H * 0.74] as const,
					unknown: H * 0.9,
					result: T.num * 0.8,
					label: noteSize,
					tag: T.small,
				},
	};
}

const copy = {
	title: ["Dealers and hedging", "做市商与对冲"],
	titleSub: ["who takes the other side", "谁是你的交易对手"],
	qYou: [
		`You buy ${CONTRACTS} calls at ${usd(QUOTE.ask)}.`,
		`你以 ${usd(QUOTE.ask)} 买入 ${CONTRACTS} 张看涨。`,
	],
	qCost: [
		`${usd(perContract(QUOTE.ask), 0)} a contract · ${usd(PREMIUM, 0)} in all`,
		`每张 ${usd(perContract(QUOTE.ask), 0)} · 合计 ${usd(PREMIUM, 0)}`,
	],
	qSeller: [
		"A market maker, or dealer, sells them.",
		"卖方是做市商（dealer）。",
	],
	qLine: ["Is the dealer betting against you?", "做市商是在和你对赌吗？"],
	example: ["one dealer · one example trade", "一家做市商 · 一笔示例交易"],
	deltaGloss: [
		"delta: shares one call moves like",
		"Delta：一张看涨相当于多少股",
	],
	gammaGloss: ["gamma: how fast delta changes", "Gamma：Delta 变化的快慢"],
	hedgeHead: ["The dealer hedges with shares.", "做市商用股票对冲。"],
	neededTag: [
		`Sold ${CONTRACTS} calls: like being short`,
		`卖出 ${CONTRACTS} 张看涨：相当于做空`,
	],
	heldTag: ["Shares bought as the hedge", "买入股票作为对冲"],
	unit: ["shares", "股"],
	net: [
		`Net: ${count(short.net)} shares. ALFA's direction is hedged.`,
		`净额 ${count(short.net)} 股：ALFA 的方向已被对冲。`,
	],
	spread: [
		`The dealer aims to keep the spread: ${usd(SPREAD)} a share, ${usd(perContract(SPREAD), 0)} a contract.`,
		`做市商想赚的是价差：每股 ${usd(SPREAD)}，每张 ${usd(perContract(SPREAD), 0)}。`,
	],
	moveHead: ["Then ALFA rises.", "接着 ALFA 上涨。"],
	moveAnswer: [
		`Short gamma: buy ${count(BUY_AFTER_RISE)} more.`,
		`空 Gamma：再买 ${count(BUY_AFTER_RISE)} 股。`,
	],
	heroCaption: ["shares to buy", "需要再买入的股数"],
	heroWhy: [
		"It sold options, so it buys as ALFA rises.",
		"它卖出了期权，所以上涨时要买入。",
	],
	fall: [
		`Had ALFA fallen $${MOVE}: sell ${count(SELL_AFTER_FALL)} shares.`,
		`如果 ALFA 下跌 $${MOVE}：卖出 ${count(SELL_AFTER_FALL)} 股。`,
	],
	sideHead: [
		"Open interest hides the dealer's side.",
		"未平仓量看不出做市商在哪一边。",
	],
	sideOi: [
		`Open interest: ${count(OPEN_INTEREST)} Oct 18 ${STRIKE} calls still open.`,
		`未平仓量：10月18日 ${STRIKE} 看涨还有 ${count(OPEN_INTEREST)} 张未平仓。`,
	],
	sideCalc: [
		`gamma ${STRIKE_GAMMA} × ${count(OPEN_INTEREST)} × ${MULTIPLIER} = ${count(STRIKE_SHARES)} shares per $1`,
		`Gamma ${STRIKE_GAMMA} × ${count(OPEN_INTEREST)} × ${MULTIPLIER} = 每 $1 ${count(STRIKE_SHARES)} 股`,
	],
	sideOiNarrow: [
		`Open interest: ${count(OPEN_INTEREST)} Oct 18 ${STRIKE} calls.`,
		`未平仓量：${count(OPEN_INTEREST)} 张 10月18日 ${STRIKE} 看涨。`,
	],
	sideCalcNarrow: [
		`Gamma (how fast delta changes): ${count(STRIKE_SHARES)} shares per $1.`,
		`Gamma（Delta 变化的快慢）：每 $1 ${count(STRIKE_SHARES)} 股。`,
	],
	sideColumnNarrow: ["If ALFA rises $1", "ALFA 上涨 $1 时"],
	sideColumn: [
		"Shares to trade if ALFA rises $1",
		"ALFA 上涨 $1 时要交易的股数",
	],
	sideShort: ["If dealers are short them", "假设做市商全部做空"],
	sideLong: ["If dealers are long them", "假设做市商全部做多"],
	sideShortNarrow: ["Dealers short them", "若做市商做空"],
	sideLongNarrow: ["Dealers long them", "若做市商做多"],
	buy: [
		`buy ${count(strikeTrade("short", 1))} shares`,
		`买入 ${count(strikeTrade("short", 1))} 股`,
	],
	buyShort: [
		`buy ${count(strikeTrade("short", 1))}`,
		`买入 ${count(strikeTrade("short", 1))} 股`,
	],
	sell: [
		`sell ${count(-strikeTrade("long", 1))} shares`,
		`卖出 ${count(-strikeTrade("long", 1))} 股`,
	],
	sellShort: [
		`sell ${count(-strikeTrade("long", 1))}`,
		`卖出 ${count(-strikeTrade("long", 1))} 股`,
	],
	shortTag: ["short gamma · hedges with the move", "空 Gamma · 顺着变动对冲"],
	shortTagShort: ["short gamma", "空 Gamma"],
	longTag: ["long gamma · hedges against the move", "多 Gamma · 逆着变动对冲"],
	longTagShort: ["long gamma", "多 Gamma"],
	sideUnknown: [
		"So every dealer-positioning figure is a model.",
		"所以每个“做市商持仓”数字都是模型。",
	],
	claimBig: [
		"Dealers hedge; the hedge trades the stock.",
		"做市商要对冲，对冲就得买卖股票。",
	],
	claimSub: [
		"It's mechanical, and nobody outside sees their books.",
		"这是机械操作；外界看不到他们的持仓。",
	],
	nextBig: ["Next: 0DTE", "下一课：0DTE"],
	nextSub: ["options on their last day", "最后一天的期权"],
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
	const unitWidth = textWidth(t(copy.unit), T.body);
	const figureX = L.right - unitWidth - 8;
	const spotSize = T.body * 1.15;
	const { noteSize } = L;
	const rows = [
		{
			id: "need",
			at: L.needed,
			tag: copy.neededTag,
			shares: -short.options,
			// What the calls move like is modelled: an outline, not shares anyone holds.
			bar: "wt-film-ghost",
			tone: undefined,
		},
		{
			id: "held",
			at: L.held,
			tag: copy.heldTag,
			shares: short.shares,
			bar: "wt-film-bar",
			tone: "neutral",
		},
	] as const;
	const sideRows = [
		{
			id: "short",
			label: narrow ? copy.sideShortNarrow : copy.sideShort,
			result: narrow ? copy.buyShort : copy.buy,
			tag: narrow ? copy.shortTagShort : copy.shortTag,
		},
		{
			id: "long",
			label: narrow ? copy.sideLongNarrow : copy.sideLong,
			result: narrow ? copy.sellShort : copy.sell,
			tag: narrow ? copy.longTagShort : copy.longTag,
		},
	] as const;
	return (
		<>
			<Backdrop frame={L} />
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />

			{/* The question: your trade, and who is on the other side of it. */}
			<g data-f="q">
				<Lines
					name="q-you"
					text={t(copy.qYou)}
					x={W / 2}
					y={H * 0.35}
					size={T.head * 1.15}
					maxWidth={room}
				/>
				<Word
					name="q-cost"
					x={W / 2}
					y={H * 0.35 + T.small * 2.2}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qCost).toUpperCase()}
				</Word>
				<Lines
					name="q-seller"
					text={t(copy.qSeller)}
					x={W / 2}
					y={H * 0.52}
					size={T.head * 1.15}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.69}
					size={T.head * 1.3}
					maxWidth={room}
				/>
			</g>

			{/* From the first shot to the hero: this is one worked example, not a reading. */}
			<Word
				name="x-example"
				x={margin}
				y={L.exampleY}
				size={T.small}
				anchor="start"
				className="wt-film-tag"
			>
				{t(copy.example).toUpperCase()}
			</Word>

			{/* The dealer's hedge: what the sold calls move like, and the shares held against them. */}
			<g data-f="book">
				<Word
					name="b-spot"
					x={L.right}
					y={L.spotY}
					size={spotSize}
					anchor="end"
					className="wt-film-num"
				>
					{spotText(0)}
				</Word>
				<Word
					name="b-move"
					x={L.right - textWidth(spotText(0), spotSize) - 14}
					y={L.spotY}
					size={spotSize}
					anchor="end"
					className={`wt-film-num ${toneClass.up}`}
				>
					{moveText(0)}
				</Word>
				{rows.map((row) => (
					<g key={row.id} data-f={`b-${row.id}`}>
						<Word
							name={`b-${row.id}-tag`}
							x={margin}
							y={row.at.tag}
							size={narrow ? T.body : T.small}
							anchor="start"
							className={narrow ? "wt-film-type" : "wt-film-tag"}
						>
							{narrow ? t(row.tag) : t(row.tag).toUpperCase()}
						</Word>
						<rect
							data-f={`b-${row.id}-bar`}
							x={margin}
							y={row.at.bar}
							width={L.bar(row.shares)}
							height={L.barH}
							rx={3}
							className={row.bar}
							data-tone={row.tone}
						/>
						<Word
							name={`b-${row.id}-figure`}
							x={figureX}
							y={row.at.figure}
							size={T.num}
							anchor="end"
							className="wt-film-num"
						>
							{count(row.shares)}
						</Word>
						<Word
							name={`b-${row.id}-unit`}
							x={L.right}
							y={row.at.figure}
							size={T.body}
							anchor="end"
							className="wt-film-type wt-film-dim"
						>
							{t(copy.unit)}
						</Word>
					</g>
				))}
				<Word
					name="b-expression"
					x={margin}
					y={L.needed.note}
					size={L.expressionSize}
					anchor="start"
					className="wt-film-num wt-film-dim"
				>
					{t(expression(DELTA))}
				</Word>
				<Word
					name="b-gloss"
					x={
						narrow
							? margin
							: margin + textWidth(t(expression(DELTA)), L.expressionSize) + 14
					}
					y={L.needed.gloss}
					size={T.small}
					anchor="start"
					className="wt-film-type wt-film-dim"
				>
					{t(copy.deltaGloss)}
				</Word>
				{/* The shares still to buy: the stretch of the hedge that isn't there yet. */}
				<rect
					data-f="b-gap"
					x={margin + L.bar(HEDGE_SHARES)}
					y={L.held.bar}
					width={L.bar(
						shareEquivalent(CONTRACTS, deltaAfter(MOVE)) - HEDGE_SHARES,
					)}
					height={L.barH}
					rx={3}
					className="wt-film-bar"
					data-tone="model"
				/>
			</g>
			<Lines
				name="h-net"
				text={t(copy.net)}
				x={margin}
				y={L.notes.net}
				size={noteSize}
				maxWidth={room}
				anchor="start"
			/>
			<Lines
				name="h-spread"
				text={t(copy.spread)}
				x={margin}
				y={L.notes.spread}
				size={noteSize}
				maxWidth={room}
				anchor="start"
				className="wt-film-type wt-film-dim"
			/>

			{/* The hero: the shares the dealer must buy, made by the walk above it. */}
			<Word
				name="hero-figure"
				x={W / 2}
				y={L.heroY}
				size={L.heroSize}
				className="wt-film-num wt-film-accent"
			>
				{signedCount(BUY_AFTER_RISE)}
			</Word>
			<Word
				name="hero-caption"
				x={W / 2}
				y={L.heroY + T.body * 1.8}
				size={T.body}
				className="wt-film-type"
			>
				{t(copy.heroCaption)}
			</Word>
			<Lines
				name="hero-why"
				text={t(copy.heroWhy)}
				x={W / 2}
				y={L.heroY + T.body * 3.4}
				size={T.body}
				maxWidth={room}
				className="wt-film-type wt-film-dim"
			/>
			<Lines
				name="m-fall"
				text={t(copy.fall)}
				x={margin}
				y={L.notes.fall}
				size={T.body}
				maxWidth={room}
				anchor="start"
				className="wt-film-type wt-film-dim"
			/>

			{/* One strike, many contracts: the same hedge under two assumptions. */}
			<g data-f="side">
				<Lines
					name="s-oi"
					text={t(narrow ? copy.sideOiNarrow : copy.sideOi)}
					x={margin}
					y={L.side.oi}
					size={noteSize}
					maxWidth={room}
					anchor="start"
				/>
				{narrow ? (
					<Lines
						name="s-calc"
						text={t(copy.sideCalcNarrow)}
						x={margin}
						y={L.side.calc}
						size={T.body}
						maxWidth={room}
						anchor="start"
						className="wt-film-type wt-film-dim"
					/>
				) : (
					<>
						<Word
							name="s-calc"
							x={margin}
							y={L.side.calc}
							size={T.small * 1.1}
							anchor="start"
							className="wt-film-num wt-film-dim"
						>
							{t(copy.sideCalc)}
						</Word>
						<Word
							name="s-gloss"
							x={margin + textWidth(t(copy.sideCalc), T.small * 1.1) + 16}
							y={L.side.calc}
							size={T.small}
							anchor="start"
							className="wt-film-type wt-film-dim"
						>
							{t(copy.gammaGloss)}
						</Word>
					</>
				)}
				<Word
					name="s-column"
					x={L.right}
					y={L.side.column}
					size={T.small}
					anchor="end"
					className="wt-film-tag"
				>
					{t(narrow ? copy.sideColumnNarrow : copy.sideColumn).toUpperCase()}
				</Word>
				{sideRows.map((row, i) => (
					<g key={row.id} data-f={`s-${row.id}`}>
						<Word
							name={`s-${row.id}-label`}
							x={margin}
							y={L.side.rows[i]}
							size={L.side.label}
							anchor="start"
						>
							{t(row.label)}
						</Word>
						<Word
							name={`s-${row.id}-tag`}
							x={margin}
							y={L.side.rows[i] + L.side.tag * 1.7}
							size={L.side.tag}
							anchor="start"
							className="wt-film-tag"
						>
							{t(row.tag).toUpperCase()}
						</Word>
						<Word
							name={`s-${row.id}-result`}
							x={L.right}
							y={L.side.rows[i]}
							size={L.side.result}
							anchor="end"
							className="wt-film-num"
						>
							{t(row.result)}
						</Word>
					</g>
				))}
				<Lines
					name="s-unknown"
					text={t(copy.sideUnknown)}
					x={margin}
					y={L.side.unknown}
					size={noteSize}
					maxWidth={room}
					anchor="start"
					className={`wt-film-type ${toneClass.caution}`}
				/>
			</g>

			{/* The headlines. */}
			<Lines
				name="h-head"
				text={t(copy.hedgeHead)}
				x={margin}
				y={L.headY}
				size={T.head}
				maxWidth={L.headWidth}
				anchor="start"
			/>
			<Lines
				name="m-head"
				text={t(copy.moveHead)}
				x={margin}
				y={L.headY}
				size={T.head}
				maxWidth={L.headWidth}
				anchor="start"
			/>
			<Lines
				name="m-answer"
				text={t(copy.moveAnswer)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.moveHead), L.headWidth, T.head) * T.head * 1.35
				}
				size={T.head}
				maxWidth={L.headWidth}
				anchor="start"
			/>
			<Lines
				name="s-head"
				text={t(copy.sideHead)}
				x={margin}
				y={L.headY}
				size={T.head}
				maxWidth={L.headWidth}
				anchor="start"
			/>
			{/* After every filled shape, so nothing is painted over the lock. */}
			<Brackets name="lock-hero" glow />
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
	const L = layout(context.width);
	const d = createDirector(context, L, END);
	const { tl, one, kids, show, hide, swap } = d;
	const fade = (target: Element | Element[], at: number, duration = 0.35) =>
		tl.fromTo(target, { opacity: 0 }, { opacity: 1, duration }, at);
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const land = (target: Element, at: number, duration = 0.55) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.12, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration, ease: "power3.out" },
			at,
		);
	/** A bar grows from its start to its length, and never past it. */
	const grow = (bar: Element, shares: number, at: number) =>
		tl.fromTo(
			bar,
			{ opacity: 0, attr: { width: 0 } },
			{
				opacity: 1,
				attr: { width: L.bar(shares) },
				duration: 0.7,
				ease: "power3.out",
			},
			at,
		);

	const spot = one<SVGTextElement>("b-spot");
	const moved = one<SVGTextElement>("b-move");
	const needBar = one("b-need-bar");
	const needFigure = one<SVGTextElement>("b-need-figure");
	const expressionText = one<SVGTextElement>("b-expression");
	const gap = one("b-gap");
	const heroFigure = one<SVGGraphicsElement>("hero-figure");
	const heroCaption = one<SVGGraphicsElement>("hero-caption");
	const heroWhy = one<SVGGraphicsElement>("hero-why");
	const lockHero = one<SVGGraphicsElement>("lock-hero");
	const example = one("x-example");
	const deltaGloss = one("b-gloss");
	// The wide frame sets gamma's gloss beside its arithmetic; a phone folds it into the line.
	const sideCalc = [one("s-calc"), one("s-gloss")].filter(Boolean);
	const need = [
		one("b-need-tag"),
		needBar,
		needFigure,
		one("b-need-unit"),
		expressionText,
	];
	const held = [
		one("b-held-tag"),
		one("b-held-bar"),
		one("b-held-figure"),
		one("b-held-unit"),
	];

	// Everything at rest: hidden until its shot needs it.
	d.hidden([
		...kids("q"),
		example,
		deltaGloss,
		heroWhy,
		...sideCalc,
		spot,
		moved,
		...need,
		...held,
		gap,
		one("h-net"),
		one("h-spread"),
		heroFigure,
		heroCaption,
		one("m-fall"),
		lockHero,
		...kids("s-short"),
		...kids("s-long"),
		one("s-oi"),
		one("s-column"),
		one("s-unknown"),
		one("h-head"),
		one("m-head"),
		one("m-answer"),
		one("s-head"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: who sold you the calls? ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	// The example tag stands from here until the hero has been read.
	fade(example, 4.3);
	show(one("q-you"), 4.6);
	fade(one("q-cost"), 5.0);
	show(one("q-seller"), 5.5);
	show(one("q-line"), 6.0);

	// ——— hedge: the sold calls, and the shares bought against them ———
	tl.addLabel("hedge", 9.6);
	hide(kids("q"), 9.6);
	fade(spot, 9.8, 0.4);
	show(one("h-head"), 9.95);
	// The row's label and its arithmetic stand a second before its bar draws.
	fade([one("b-need-tag"), expressionText, deltaGloss], 10.5);
	grow(needBar, -short.options, 11.6);
	fade([needFigure, one("b-need-unit")], 12.3);
	fade(one("b-held-tag"), 13.3);
	grow(one("b-held-bar"), short.shares, 14.3);
	fade([one("b-held-figure"), one("b-held-unit")], 15.0);
	// Both bars match: the direction is hedged, and the spread is what is left.
	fade(one("h-net"), 16.2, 0.4);
	fade(one("h-spread"), 17.8, 0.4);

	// ——— move: ALFA rises $2 and the hedge is 40 shares short ———
	tl.addLabel("move", 21.4);
	hide([one("h-net"), one("h-spread")], 21.4);
	swap(one("h-head"), one("m-head"), 21.4);
	// One walk drives the price, delta, the share-equivalent and its bar, so every frame agrees.
	const walk = { move: 0 };
	const place = () => {
		// Delta as the walk passes through it: the lesson's estimate, delta + gamma × move.
		const delta = deltaAfter(walk.move);
		const shares = shareEquivalent(CONTRACTS, delta);
		spot.textContent = spotText(walk.move);
		moved.textContent = moveText(walk.move);
		expressionText.textContent = d.t(expression(delta));
		needFigure.textContent = count(shares);
		needBar.setAttribute("width", String(L.bar(shares)));
	};
	fade(moved, 23.4, 0.3);
	tl.fromTo(
		walk,
		{ move: 0 },
		{
			move: MOVE,
			duration: WALK,
			ease: "power2.inOut",
			immediateRender: false,
			onUpdate: place,
		},
		23.4,
	);
	// The walk settles at 24.8 and stands; then the hero, a step at a time: the missing
	// stretch, its figure, its name, the lock.
	fade(gap, 26.2, 0.4);
	land(heroFigure, 26.8);
	fade([heroCaption, heroWhy], 27.2, 0.3);
	d.lock(lockHero, HERO_LOCK, {
		around: [heroFigure, heroCaption, heroWhy],
		pad: 8,
	});
	tl.addLabel("hero-lock", HERO_LOCK);
	// A phone keeps 300 and 260, and what each is, at full strength beside the +40.
	const rest = L.narrow
		? [spot, moved, expressionText, deltaGloss]
		: [
				spot,
				moved,
				one("b-need-tag"),
				needFigure,
				one("b-need-unit"),
				expressionText,
				deltaGloss,
				one("b-held-tag"),
				one("b-held-figure"),
				one("b-held-unit"),
			];
	tl.to(rest, { opacity: 0.45, duration: 0.4 }, HERO_LOCK);
	// The glow is full at 28.25; nothing moves until 29.95.
	hide(lockHero, 29.95, 0.3, 0);
	tl.to(rest, { opacity: 1, duration: 0.4 }, 29.95);
	fade(one("m-answer"), 29.95, 0.5);
	fade(one("m-fall"), 30.5, 0.4);

	// ——— side: many contracts at one strike, and a side nobody outside can see ———
	tl.addLabel("side", 34.1);
	hide(
		[
			one("m-head"),
			one("m-answer"),
			one("m-fall"),
			heroFigure,
			heroCaption,
			heroWhy,
			example,
			deltaGloss,
			spot,
			moved,
			...need,
			...held,
			gap,
		],
		34.1,
	);
	show(one("s-head"), 34.45);
	show(one("s-oi"), 34.75);
	fade([...sideCalc, one("s-column")], 35.3);
	show(kids("s-short"), 36.3, "below", 0.4);
	show(kids("s-long"), 36.7, "below", 0.4);
	fade(one("s-unknown"), 37.3, 0.4);

	// Cut: the claim, held to be read.
	tl.addLabel("claim", 41.1);
	hide(
		[
			one("s-head"),
			one("s-oi"),
			...sideCalc,
			one("s-column"),
			...kids("s-short"),
			...kids("s-long"),
			one("s-unknown"),
		],
		41.1,
	);
	tl.fromTo(
		one("c-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		41.45,
	);
	show(one("c-sub"), 41.85);

	// ——— next ———
	tl.addLabel("next", 45.5);
	hide(kids("claim"), 45.5);
	d.close(45.5);
	return tl;
}

export const dealersAndHedgingFilm: Film = {
	id: "dealers-and-hedging",
	label: [
		`Dealers and hedging, as a short film: you buy ${CONTRACTS} calls and a market maker, or dealer, sells them; the dealer buys ${count(HEDGE_SHARES)} shares so ALFA's direction is hedged and aims to keep the spread; when ALFA rises $${MOVE} the calls' delta rises and the dealer must buy ${count(BUY_AFTER_RISE)} more shares; and at a strike with ${count(OPEN_INTEREST)} contracts open the same hedge is ${count(STRIKE_SHARES)} shares to buy or to sell, depending on a side open interest doesn't show`,
		`做市商与对冲短片：你买入 ${CONTRACTS} 张看涨，卖方是做市商（dealer）；做市商买入 ${count(HEDGE_SHARES)} 股，对冲掉 ALFA 的方向，想赚的是价差；ALFA 上涨 $${MOVE} 时看涨的 Delta 上升，做市商要再买 ${count(BUY_AFTER_RISE)} 股；而在有 ${count(OPEN_INTEREST)} 张未平仓合约的行权价上，同样的对冲是买入还是卖出 ${count(STRIKE_SHARES)} 股，取决于未平仓量看不出的方向`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Dealers and hedging", "做市商与对冲"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "hedge", label: ["The hedge", "对冲"] },
		{ id: "move", label: ["ALFA moves", "ALFA 变动"] },
		{ id: "side", label: ["The dealer's side", "做市商的方向"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
