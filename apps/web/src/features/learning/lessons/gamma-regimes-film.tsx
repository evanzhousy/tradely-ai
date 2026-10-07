import { gsap } from "gsap";
import { useId } from "react";
import { type Copy, count, pick } from "@/content/world";
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
	ABOVE,
	BOOK,
	cumulativeByStrike,
	FLIP,
	lastAsk,
	level,
	money,
	netGex,
	offered,
	SHORTCUT,
	SPOT,
	shareGamma,
	stock,
	TARGET,
} from "./gamma-regimes-model";

/*
 * Gamma regimes, as a film. It opens on a $1 rise and a question with no single answer:
 * do the hedgers buy or sell? The modeled book's net GEX, repriced at every ALFA price,
 * answers by where ALFA is: short gamma at $100, so the hedge buys 5,121 shares with the
 * move; long gamma at $105, so it sells 5,470 against it. The curve crosses zero at the
 * flip, $102.3; a running sum of today's strike bars crosses at $94.1 instead, a
 * different calculation. Last, what the target is not: the tape shows no names and the
 * visible book holds 1,600 shares.
 *
 *   open      0–4        "Gamma regimes"
 *   question  4–9.6      ALFA +$1: buy or sell?
 *   regime    9.6–21.2   net GEX across spot; at $100 buy 5,121; at $105 sell 5,470; flip
 *                        $102.3
 *   shortcut  21.2–30.2  the strike-sum line crosses at $94.1; cut: $102.3 against $94.1,
 *                        the flip locked
 *   target    30.8–42.3  buy 5,121 if…; the tape; the book: 1,600 offered;
 *                        cut: "A regime describes a response, not a forecast."
 *   next      42.3–44.8  Next: walls and max pain
 */

const END = 44.8;
const X = [88, 112] as const;
const Y = 2_000_000;
const curve = Array.from({ length: (X[1] - X[0]) * 2 + 1 }, (_, i) => {
	const spot = X[0] + i / 2;
	return [spot, netGex(spot)] as const;
});
const strikeSum = cumulativeByStrike.map(
	([strike, millions]) => [strike, millions * 1_000_000] as const,
);
const SELL = Math.round(shareGamma(ABOVE));

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	const left = Math.max(frame.margin, narrow ? 46 : 0);
	const right = width * 0.965;
	const top = height * (narrow ? 0.34 : 0.27);
	const bottom = height * 0.84;
	const x = (spot: number) =>
		left + ((spot - X[0]) / (X[1] - X[0])) * (right - left);
	const y = (dollars: number) =>
		(top + bottom) / 2 - (dollars / Y) * ((bottom - top) / 2);
	const path = (points: readonly (readonly [number, number])[]) =>
		points
			.map(
				([px, py], i) =>
					`${i ? "L" : "M"}${x(px).toFixed(1)} ${y(py).toFixed(1)}`,
			)
			.join("");
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		x,
		y,
		path,
		pair: narrow ? [0.27, 0.73] : [0.32, 0.68],
	};
}

const copy = {
	title: ["Gamma regimes", "Gamma 状态"],
	titleSub: ["hedging, not forecasting", "对冲，而非预测"],
	qMove: ["ALFA +$1", "ALFA +$1"],
	qBuy: ["buy?", "买？"],
	qSell: ["sell?", "卖？"],
	qLine: [
		"Do the hedgers of the modeled book buy or sell? It depends where ALFA is.",
		"模型账户的对冲者会买还是卖？取决于 ALFA 在哪里。",
	],
	curveHead: [
		"Net GEX, repriced at every ALFA price.",
		"在每个 ALFA 价格上重新定价的净 GEX。",
	],
	curveHeadShort: ["Net GEX, repriced across spot.", "沿现价重定价的净 GEX。"],
	axis: ["modeled book, $ of delta per 1%", "模型账户，每 1% 的 Delta 金额"],
	priceAxis: ["ALFA price", "ALFA 价格"],
	shortZone: ["short gamma", "空 Gamma"],
	longZone: ["long gamma", "多 Gamma"],
	shortHead: [
		`At ${stock(SPOT)}: short gamma, the hedge buys.`,
		`在 ${stock(SPOT)} 是空 Gamma：上涨时对冲买入。`,
	],
	shortHeadShort: [
		"Short gamma: the hedge buys a rise.",
		"空 Gamma：上涨时买入。",
	],
	longHead: [
		`At ${stock(ABOVE)}: long gamma, the hedge sells.`,
		`在 ${stock(ABOVE)} 是多 Gamma：同样的上涨让它卖出。`,
	],
	longHeadShort: [
		"Long gamma: the hedge sells a rise.",
		"多 Gamma：上涨时卖出。",
	],
	buy: [`+$1 → buy ${count(-BOOK)}`, `+$1 → 买入 ${count(-BOOK)}`],
	sell: [`+$1 → sell ${count(SELL)}`, `+$1 → 卖出 ${count(SELL)}`],
	buyShort: [`buy ${count(-BOOK)}`, `买入 ${count(-BOOK)}`],
	sellShort: [`sell ${count(SELL)}`, `卖出 ${count(SELL)}`],
	withMove: ["with the move", "顺着变动"],
	againstMove: ["against the move", "逆着变动"],
	flip: [`flip ${level(FLIP)}`, `转折 ${level(FLIP)}`],
	shortcutHead: [
		"A running sum of strike bars crosses elsewhere.",
		"把各行权价的柱子累加，穿零点在别处。",
	],
	shortcutHeadShort: [
		"The strike sum crosses elsewhere.",
		"行权价累加在别处穿零。",
	],
	sumShort: [`sum ${level(SHORTCUT ?? 0)}`, `累加 ${level(SHORTCUT ?? 0)}`],
	sumLabel: [
		`strike sum ${level(SHORTCUT ?? 0)}`,
		`行权价累加 ${level(SHORTCUT ?? 0)}`,
	],
	repriced: ["repriced across spot", "沿现价重定价"],
	repricedShort: ["repriced", "重定价"],
	summed: ["summed across strikes", "按行权价累加"],
	summedShort: ["strike sum", "行权价累加"],
	twoLine: [
		"Two calculations, two answers. Only the repriced one is the flip.",
		"两种计算，两个答案。只有重定价得到的才是转折点。",
	],
	targetHead: [
		"A hedge target is not a market outcome.",
		"对冲目标不是市场结果。",
	],
	targetHeadShort: ["A target is not an outcome.", "目标不是结果。"],
	cardModel: ["model target", "模型目标"],
	cardModelValue: [`buy ${count(TARGET)}`, `买入 ${count(TARGET)}`],
	cardModelNote: [
		"only if dealers hold this book and hedge continuously",
		"只有在做市商持有这个账户并连续对冲时",
	],
	cardModelShort: [
		"if dealers hold this book, hedging nonstop",
		"须做市商持有此账户且连续对冲",
	],
	cardTape: ["the tape", "成交记录"],
	cardTapeValue: ["no names", "无身份"],
	cardTapeNote: [
		"prints show price, size and time, never who traded or why",
		"成交显示价格、数量和时间，不显示谁交易或为什么",
	],
	cardTapeShort: [
		"price, size, time; never who or why",
		"价格、数量、时间；不显示谁或为何",
	],
	cardBook: ["the book, 10:30", "10:30 挂单簿"],
	cardBookValue: [`${count(offered)} offered`, `挂出 ${count(offered)} 股`],
	cardBookNote: [
		`across three levels to ${stock(lastAsk.price / 100)}; depth beyond isn't shown`,
		`三个价位，最高 ${stock(lastAsk.price / 100)}；更深的挂单看不到`,
	],
	cardBookShort: [
		`three levels, up to ${stock(lastAsk.price / 100)}`,
		`三个价位，最高 ${stock(lastAsk.price / 100)}`,
	],
	claimBig: [
		"A regime describes a response, not a forecast.",
		"状态描述的是响应，不是预测。",
	],
	claimSub: [
		"A modeled flip; hedging depends on who holds what.",
		"转折点是模型得出的；对冲取决于谁持有什么。",
	],
	nextBig: ["Next: walls and max pain", "下一课：墙位与最大痛点"],
	nextSub: ["reference levels, not targets", "参考位置，不是目标"],
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
	const headline = (name: string, text: Copy, short: Copy) => (
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
	const mx = L.x(SPOT);
	const my = L.y(netGex(SPOT));
	const ax = L.x(ABOVE);
	const ay = L.y(netGex(ABOVE));
	const fx = L.x(FLIP);
	const sx = L.x(SHORTCUT ?? 0);
	const cards = [
		[
			copy.cardModel,
			copy.cardModelValue,
			narrow ? copy.cardModelShort : copy.cardModelNote,
			"wt-film-accent",
		],
		[
			copy.cardTape,
			copy.cardTapeValue,
			narrow ? copy.cardTapeShort : copy.cardTapeNote,
			"",
		],
		[
			copy.cardBook,
			copy.cardBookValue,
			narrow ? copy.cardBookShort : copy.cardBookNote,
			"",
		],
	] as const;
	const cardY = (i: number) =>
		H * (narrow ? 0.25 : 0.32) + i * H * (narrow ? 0.24 : 0.2);
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<clipPath id={`plot-${id}`}>
					<rect
						x={L.left}
						y={L.top - 4}
						width={L.right - L.left}
						height={L.bottom - L.top + 8}
					/>
				</clipPath>
				<clipPath id={`draw-${id}`}>
					<rect data-f="draw" x={L.left - 4} y={0} width={0} height={H} />
				</clipPath>
			</defs>

			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart">
						<rect
							data-f="zone-short"
							x={L.left}
							y={L.top}
							width={fx - L.left}
							height={L.bottom - L.top}
							className="wt-band-loss"
						/>
						<rect
							data-f="zone-long"
							x={fx}
							y={L.top}
							width={L.right - fx}
							height={L.bottom - L.top}
							className="wt-band-gain"
						/>
						<text
							data-f="zone-short-label"
							x={fx - 8}
							y={L.bottom - 8}
							textAnchor="end"
							className="wt-small wt-loss"
						>
							{t(copy.shortZone)}
						</text>
						<text
							data-f="zone-long-label"
							x={fx + 8}
							y={L.bottom - 8}
							className="wt-small wt-gain"
						>
							{t(copy.longZone)}
						</text>
						{[-1_000_000, 0, 1_000_000].map((tick) => (
							<g key={tick}>
								<path
									d={`M${L.left} ${L.y(tick)}H${L.right}`}
									className={tick === 0 ? "wt-axis" : "wt-grid"}
								/>
								<text
									x={L.left - 8}
									y={L.y(tick) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{tick === 0
										? "0"
										: narrow
											? money(tick).replace("$", "").replace(".00", "")
											: money(tick).replace(".00", "")}
								</text>
							</g>
						))}
						{[90, 95, 100, 105, 110].map((tick) => (
							<text
								key={tick}
								x={L.x(tick)}
								y={L.bottom + 16}
								textAnchor="middle"
								className="wt-small"
							>
								{`$${tick}`}
							</text>
						))}
						<text
							x={L.right}
							y={L.bottom + 30}
							textAnchor="end"
							className="wt-small"
						>
							{t(copy.priceAxis)}
						</text>
						<text x={L.left} y={L.top - 10} className="wt-small">
							{t(copy.axis)}
						</text>
						<g clipPath={`url(#plot-${id})`}>
							<path
								data-f="sum-line"
								className="wt-line-reference"
								d={L.path(strikeSum)}
							/>
						</g>
						<g clipPath={`url(#draw-${id})`}>
							<path className="wt-line-position" d={L.path(curve)} />
						</g>
						<g data-f="flip">
							<path
								d={`M${fx} ${L.top}V${L.bottom}`}
								className="wt-bracket"
								strokeDasharray="4 3"
							/>
							<circle cx={fx} cy={L.y(0)} r={6} className="wt-chip" />
							<text
								x={fx - 8}
								y={L.top + 16}
								textAnchor="end"
								className="wt-halo wt-accent wt-marker-label"
							>
								{t(copy.flip)}
							</text>
						</g>
						<g data-f="sum-dot">
							<circle cx={sx} cy={L.y(0)} r={6} className="wt-film-ghost" />
							<text
								x={sx - 8}
								y={L.y(0) - 10}
								textAnchor="end"
								className="wt-halo wt-small"
							>
								{t(narrow ? copy.sumShort : copy.sumLabel)}
							</text>
						</g>
						<circle
							data-f="marker"
							cx={mx}
							cy={my}
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
						{/* Each response sits in its own regime: buy above-left, sell below-right. */}
						<g data-f="buy" textAnchor="end">
							<text
								x={mx - 12}
								y={my - 24}
								className="wt-halo wt-loss wt-marker-label"
							>
								{t(narrow ? copy.buyShort : copy.buy)}
							</text>
							<text x={mx - 12} y={my - 10} className="wt-halo wt-small">
								{t(copy.withMove)}
							</text>
						</g>
						<g data-f="sell" textAnchor={narrow ? "end" : "start"}>
							<text
								x={narrow ? L.right - 4 : ax + 10}
								y={ay + 22}
								className="wt-halo wt-gain wt-marker-label"
							>
								{t(narrow ? copy.sellShort : copy.sell)}
							</text>
							<text
								x={narrow ? L.right - 4 : ax + 10}
								y={ay + 36}
								className="wt-halo wt-small"
							>
								{t(copy.againstMove)}
							</text>
						</g>
					</g>
				</g>
			</g>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-move"
					x={W / 2}
					y={H * 0.4}
					size={T.big}
					className="wt-film-num"
				>
					{t(copy.qMove)}
				</Word>
				<Word
					name="q-buy"
					x={W * L.pair[0]}
					y={H * 0.62}
					size={T.title}
					className="wt-film-type"
				>
					{t(copy.qBuy)}
				</Word>
				<Word
					name="q-sell"
					x={W * L.pair[1]}
					y={H * 0.62}
					size={T.title}
					className="wt-film-type"
				>
					{t(copy.qSell)}
				</Word>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.82}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("c-head", copy.curveHead, copy.curveHeadShort)}
			{headline("s-head", copy.shortHead, copy.shortHeadShort)}
			<Lines
				name="l-head"
				text={t(narrow ? copy.longHeadShort : copy.longHead)}
				x={L.margin}
				y={
					L.headY +
					lineCount(
						t(narrow ? copy.shortHeadShort : copy.shortHead),
						room,
						T.head,
					) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			{headline("k-head", copy.shortcutHead, copy.shortcutHeadShort)}
			<Brackets name="lock-flip" glow />
			<g data-f="two">
				{(
					[
						[
							narrow ? copy.repricedShort : copy.repriced,
							level(FLIP),
							"wt-film-accent",
						],
						[narrow ? copy.summedShort : copy.summed, level(SHORTCUT ?? 0), ""],
					] as const
				).map(([tag, num, tone], i) => (
					<g key={tag[0]}>
						<Word
							name={`w-tag-${i}`}
							x={W * L.pair[i]}
							y={H * 0.3}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`w-num-${i}`}
							x={W * L.pair[i]}
							y={H * 0.3 + T.big * 0.95}
							// Both figures at one size, the longer's six characters leaving clear space
							// between them.
							size={Math.min(
								T.big * 0.85,
								(W * (L.pair[1] - L.pair[0]) * 0.7) / (6 * 0.62),
							)}
							className={`wt-film-num ${tone}`}
						>
							{num}
						</Word>
					</g>
				))}
				<Lines
					name="w-line"
					text={t(copy.twoLine)}
					x={W / 2}
					y={H * 0.72}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			<g data-f="target">
				{headline("t-head", copy.targetHead, copy.targetHeadShort)}
				{cards.map(([tag, value, note, tone], i) => (
					<g key={tag[0]}>
						<Word
							name={`t-tag-${i}`}
							x={L.margin}
							y={cardY(i)}
							size={T.small}
							anchor="start"
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`t-value-${i}`}
							x={L.margin}
							y={cardY(i) + T.num * 1.1}
							size={T.num}
							anchor="start"
							className={`wt-film-num ${tone}`}
						>
							{t(value)}
						</Word>
						<Lines
							name={`t-note-${i}`}
							text={t(note)}
							x={narrow ? L.margin : W * 0.5}
							y={
								narrow
									? cardY(i) + T.num * 1.1 + T.small * 1.6
									: cardY(i) + T.num * 0.75
							}
							size={narrow ? T.small : T.body}
							maxWidth={narrow ? room : W * 0.5 - L.margin}
							anchor="start"
							className="wt-film-type wt-film-dim"
						/>
					</g>
				))}
			</g>
			<g data-f="claim">
				<Lines
					name="z-big"
					text={t(copy.claimBig)}
					x={W / 2}
					y={H * 0.44}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="z-sub"
					text={t(copy.claimSub)}
					x={W / 2}
					y={
						H * 0.44 +
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
	const marker = one("marker");
	const lockFlip = one<SVGGraphicsElement>("lock-flip");

	d.hidden([
		one("zone-short"),
		one("zone-long"),
		one("zone-short-label"),
		one("zone-long-label"),
		one("sum-line"),
		one("flip"),
		one("sum-dot"),
		marker,
		one("buy"),
		one("sell"),
		...kids("q"),
		...["c-head", "s-head", "l-head", "k-head"].map((name) => one(name)),
		...flat("two"),
		lockFlip,
		...flat("target"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a rise, and two possible responses ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	land(one("q-move"), 4.7);
	land(one("q-buy"), 5.3);
	land(one("q-sell"), 5.6);
	show(one("q-line"), 6.0);

	// ——— regime: the curve answers by where ALFA is ———
	tl.addLabel("regime", 9.6);
	hide(kids("q"), 9.6);
	show(one("c-head"), 9.8, "above");
	rise(9.9);
	tl.to(
		one("draw"),
		{
			attr: { width: L.right - L.left + 8 },
			duration: 1.6,
			ease: "power2.inOut",
		},
		10.3,
	);
	tl.to(
		[one("zone-short"), one("zone-long")],
		{ opacity: 1, duration: 0.6 },
		11.9,
	);
	show([one("zone-short-label"), one("zone-long-label")], 12.1, "below", 0.4);
	// At $100: short gamma, the hedge buys a rise.
	d.swap(one("c-head"), one("s-head"), 13.4);
	land(marker, 13.9);
	show(one("buy"), 14.3, "right");
	// At $105: long gamma, it sells.
	tl.to(one("buy"), { opacity: 0.3, duration: 0.3 }, 17.2);
	const walk = { spot: SPOT };
	tl.to(
		walk,
		{
			spot: ABOVE,
			duration: 1.2,
			ease: "power2.inOut",
			onUpdate: () =>
				gsap.set(marker, {
					attr: { cx: L.x(walk.spot), cy: L.y(netGex(walk.spot)) },
				}),
		},
		17.2,
	);
	show(one("l-head"), 17.6);
	show(one("sell"), 18.5, "right");
	land(one("flip"), 19.4);

	// ——— shortcut: a sum across strikes is a different number ———
	tl.addLabel("shortcut", 21.2);
	hide([one("s-head"), one("l-head")], 21.2);
	show(one("k-head"), 21.55, "above");
	tl.to([one("buy"), one("sell"), marker], { opacity: 0, duration: 0.3 }, 21.2);
	tl.to(one("sum-line"), { opacity: 1, duration: 0.6 }, 21.7);
	land(one("sum-dot"), 22.4);
	// Cut: the two numbers. The hero: only the repriced one is the flip.
	hide(one("k-head"), 25.1);
	sink(25.1);
	show(one("w-tag-0"), 25.4);
	land(one("w-num-0"), 25.6);
	show(one("w-tag-1"), 26.0);
	land(one("w-num-1"), 26.2);
	d.lock(lockFlip, 26.8, {
		around: [one("w-tag-0"), one("w-num-0")],
		pad: 10,
	});
	tl.addLabel("hero-lock", 26.8);
	show(one("w-line"), 27.2);

	// ——— target: what the model's number isn't ———
	tl.addLabel("target", 30.8);
	hide([...flat("two"), lockFlip], 30.8);
	show(one("t-head"), 31.15, "above");
	[0, 1, 2].forEach((i) => {
		const at = 31.6 + i * 1.0;
		show(one(`t-tag-${i}`), at);
		land(one(`t-value-${i}`), at + 0.2);
		show(one(`t-note-${i}`), at + 0.6);
	});
	// Cut: the claim.
	hide(flat("target"), 37.7);
	tl.fromTo(
		one("z-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		38.1,
	);
	show(one("z-sub"), 38.5);

	// ——— next ———
	tl.addLabel("next", 42.3);
	hide(kids("claim"), 42.3);
	d.close(42.3);
	return tl;
}

export const gammaRegimesFilm: Film = {
	id: "gamma-regimes",
	label: [
		"Gamma regimes, as a short film: a $1 rise and the question of whether hedgers buy or sell; the modeled book's net GEX repriced across ALFA's price, short gamma at $100 so the hedge buys 5,121 shares with the move, long gamma at $105 so it sells 5,470 against it, crossing zero at a flip of $102.3; a running sum of strike bars crossing at $94.1 instead; and what the hedge target isn't: the tape shows no names and the visible book holds 1,600 shares",
		"Gamma 状态短片：上涨 $1，对冲者会买还是卖；模型账户沿 ALFA 价格重新定价的净 GEX，在 $100 为空 Gamma，对冲顺着变动买入 5,121 股，在 $105 为多 Gamma，逆着变动卖出 5,470 股，在 $102.3 的转折点穿过零；按行权价累加的柱子却在 $94.1 穿零；以及对冲目标不是什么：成交记录不显示身份，可见挂单只有 1,600 股",
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Gamma regimes", "Gamma 状态"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "regime", label: ["Two regimes", "两种状态"] },
		{ id: "shortcut", label: ["The shortcut", "捷径"] },
		{ id: "target", label: ["Not an outcome", "不是结果"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
