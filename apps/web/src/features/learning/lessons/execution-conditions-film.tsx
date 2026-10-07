import {
	type Copy,
	count,
	oct105CallBlock,
	pick,
	sweep,
	usd,
} from "@/content/world";
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
	BLOCK_ASKS,
	LEGS,
	PACKAGE,
	price4,
	SWEEP,
	SWEEP_ASKS,
} from "./execution-conditions-model";

/*
 * Execution conditions, as a film. Three prints of the Oct 18 110 call in the same tenth of
 * a second at three venues: three buyers? The book answers: one 40-lot sent to all three
 * as ISO orders, 10, 20 and 10, at $0.9525 on average against a $0.93 best ask. The hero is
 * a block: 8 contracts displayed at $2.15, 500 printed there, marked as an auction; the
 * condition shows how it was matched, and glowing brackets lock on what it doesn't show.
 * Last, the block's two legs, a call bought at the ask and one sold inside its quote, that
 * are one $1.25 call spread.
 *
 *   open      0–4        "Execution conditions"
 *   question  4–8.6      three prints, three venues, one instant: three buyers?
 *   sweep     8.6–19.2   three venues; one ISO order; three prints; $0.9525
 *   block     19.2–29    hero: 8 displayed, 500 printed; an auction; how, not who
 *   package   29–35.8    bought at the ask; sold inside; one spread
 *   claim     35.8–40.2  a condition says how a trade executed
 *   next      40.2–42.7  Next: unusual activity
 */

const END = 42.7;
/** The sweep's fills, best price first, each with the venue that filled it. */
const FILLS = sweep(SWEEP_ASKS, SWEEP.quantity).fills.map((fill) => ({
	...fill,
	venue: SWEEP.asks.find((ask) => ask.price === fill.price)?.venue ?? "",
}));
const NOTIONAL = FILLS.reduce((sum, fill) => sum + fill.price * fill.size, 0);
const AVERAGE = NOTIONAL / SWEEP.quantity;
const BEST = SWEEP.asks[0];
const TIME = SWEEP.time;
const BLOCK = oct105CallBlock;
const SHOWN = BLOCK_ASKS.find((level) => level.price === BLOCK.price);
const SHOWN_SIZE = SHOWN?.size ?? 0;
const WIDTH = LEGS.sell.strike - LEGS.buy.strike;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const gap = narrow ? 8 : 16;
	const cardW = (room - 2 * gap) / 3;
	return {
		...frame,
		cardX: (i: number) => margin + i * (cardW + gap),
		cardW,
		/** The order sits above the venues it is routed to. */
		chipY: H * (narrow ? 0.24 : 0.25),
		chipH: narrow ? 26 : 32,
		cardY: H * (narrow ? 0.36 : 0.37),
		cardH: H * (narrow ? 0.17 : 0.19),
		printY: (i: number) =>
			H * (narrow ? 0.64 : 0.64) + i * H * (narrow ? 0.065 : 0.065),
		avgY: H * (narrow ? 0.86 : 0.88),
		barY: (i: number) =>
			H * (narrow ? 0.32 : 0.32) + i * H * (narrow ? 0.15 : 0.15),
		barH: H * (narrow ? 0.05 : 0.055),
		knowY: (i: number) =>
			H * (narrow ? 0.66 : 0.66) + i * H * (narrow ? 0.07 : 0.075),
		legY: (i: number) =>
			H * (narrow ? 0.27 : 0.27) + i * H * (narrow ? 0.17 : 0.17),
		legH: H * (narrow ? 0.14 : 0.14),
		pkgY: H * (narrow ? 0.63 : 0.64),
		pkgH: H * (narrow ? 0.2 : 0.2),
	};
}

const copy = {
	title: ["Execution conditions", "成交条件"],
	titleSub: ["sweeps, blocks and complex orders", "扫单、大宗与复杂订单"],
	qTag: [`Oct 18 110 call · ${TIME}`, `10月18日 110 看涨 · ${TIME}`],
	qLine: [
		FILLS.map((fill) => `${count(fill.size)} at ${fill.venue}`)
			.join(", ")
			.concat("."),
		FILLS.map((fill) => `${fill.venue} 成交 ${count(fill.size)} 张`)
			.join("，")
			.concat("。"),
	],
	qBig: ["Three buyers?", "三个买方？"],
	sHead: ["Three venues offer the 110 call.", "三个场所挂出 110 看涨。"],
	s2Head: [
		`One ISO order: ${SWEEP.quantity} at ${price4(AVERAGE)}.`,
		`一张 ISO 订单：${SWEEP.quantity} 张，均价 ${price4(AVERAGE)}。`,
	],
	venue: ["venue", "场所"],
	offered: ["offered", "挂出"],
	order: [
		`buy ${SWEEP.quantity} · ≤ ${usd(SWEEP.limit)} · ISO`,
		`买 ${SWEEP.quantity} · ≤ ${usd(SWEEP.limit)} · ISO`,
	],
	average: [
		`average ${price4(AVERAGE)} · best ask ${usd(BEST.price)}`,
		`平均 ${price4(AVERAGE)} · 最优卖价 ${usd(BEST.price)}`,
	],
	bHead: [
		`A block: only ${SHOWN_SIZE} on the screen.`,
		`大宗：屏幕上只有 ${SHOWN_SIZE} 张。`,
	],
	b2Head: [
		"It says how, never who or why.",
		"它只说明怎么撮合，不说明谁或为什么。",
	],
	displayed: [`displayed at ${usd(BLOCK.price)}`, `${usd(BLOCK.price)} 挂出`],
	printed: [`printed at ${usd(BLOCK.price)}`, `${usd(BLOCK.price)} 成交`],
	auction: ["auction", "竞价"],
	shows: ["shows: matched through an auction", "能说明：通过竞价撮合"],
	hides: [
		"doesn't show: who, why, or whether it opened",
		"不能说明：是谁、为什么、是否开仓",
	],
	hidesShort: ["not: who, why, opening", "不能：谁、为什么、开仓"],
	pHead: ["Two legs printed as one trade.", "两条腿作为一笔交易成交。"],
	p2Head: [
		`One call spread for ${usd(PACKAGE.price)}.`,
		`一个价差，净价 ${usd(PACKAGE.price)}。`,
	],
	multiLeg: ["multi-leg", "多腿"],
	buyLeg: [
		`buy ${count(LEGS.buy.quantity)} · 105 call @ ${usd(LEGS.buy.price)}`,
		`买 ${count(LEGS.buy.quantity)} · 105 看涨 @ ${usd(LEGS.buy.price)}`,
	],
	sellLeg: [
		`sell ${count(LEGS.sell.quantity)} · 110 call @ ${usd(LEGS.sell.price)}`,
		`卖 ${count(LEGS.sell.quantity)} · 110 看涨 @ ${usd(LEGS.sell.price)}`,
	],
	buyQuote: [
		`quote ${usd(LEGS.buy.bid)} / ${usd(LEGS.buy.ask)} · at the ask`,
		`报价 ${usd(LEGS.buy.bid)} / ${usd(LEGS.buy.ask)} · 在卖价`,
	],
	sellQuote: [
		`quote ${usd(LEGS.sell.bid)} / ${usd(LEGS.sell.ask)} · inside`,
		`报价 ${usd(LEGS.sell.bid)} / ${usd(LEGS.sell.ask)} · 价差之内`,
	],
	pkgTag: ["one package · 105/110 call spread", "一个整体 · 105/110 看涨价差"],
	pkgPrice: [`${usd(PACKAGE.price)} net`, `净价 ${usd(PACKAGE.price)}`],
	pkgCap: [
		`worth at most ${usd(WIDTH * 100)} a share at expiry`,
		`到期每股最多值 ${usd(WIDTH * 100)}`,
	],
	claimBig: [
		"A condition says how a trade executed.",
		"成交条件说明成交是怎么发生的。",
	],
	claimSub: [
		"Sweeps, blocks and packages: how, not who.",
		"扫单、大宗与组合：怎么成交，不是谁。",
	],
	nextBig: ["Next: unusual activity", "下一课：异常成交"],
	nextSub: ["compared with what?", "与什么相比？"],
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
	const barMax = room - (narrow ? 56 : room * 0.1);
	const bars: [string, Copy, number, string][] = [
		["bar-shown", copy.displayed, SHOWN_SIZE, "neutral"],
		["bar-printed", copy.printed, BLOCK.quantity, "total"],
	];
	const legs: [Copy, Copy, string][] = [
		[copy.buyLeg, copy.buyQuote, "wt-film-gain"],
		[copy.sellLeg, copy.sellQuote, "wt-film-loss"],
	];
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

			{/* A sweep: one order across three venues. */}
			{headline("s-head", copy.sHead)}
			{/* The question's answer, as the average comes up. */}
			<Lines
				name="s2-head"
				text={t(copy.s2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.sHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{SWEEP.asks.map((ask, i) => {
				const cx = L.cardX(i) + L.cardW / 2;
				const fill = FILLS.find((f) => f.venue === ask.venue);
				return (
					<g key={ask.venue} data-f={`venue-${i}`}>
						<rect
							data-f={`venue-${i}-box`}
							x={L.cardX(i)}
							y={L.cardY}
							width={L.cardW}
							height={L.cardH}
							rx={12}
							className="wt-panel-shape"
						/>
						<text
							x={cx}
							y={L.cardY + L.cardH * 0.22}
							textAnchor="middle"
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{`${t(copy.venue).toUpperCase()} ${ask.venue}`}
						</text>
						<text
							x={cx}
							y={L.cardY + L.cardH * 0.6}
							textAnchor="middle"
							className="wt-film-num"
							style={{ fontSize: narrow ? T.head : T.num * 0.8 }}
						>
							{usd(ask.price)}
						</text>
						<text
							data-f={`venue-${i}-size`}
							x={cx}
							y={L.cardY + L.cardH * 0.84}
							textAnchor="middle"
							className="wt-film-type wt-film-dim"
							style={{ fontSize: T.small * 1.1 }}
						>
							{`${count(ask.size)} ${t(copy.offered)}`}
						</text>
						{fill ? (
							<path
								data-f={`route-${i}`}
								d={`M${W / 2} ${L.chipY + L.chipH + 4}L${cx} ${L.cardY - 6}`}
								className="wt-film-riser"
							/>
						) : null}
					</g>
				);
			})}
			<g data-f="chip">
				<rect
					x={W / 2 - (narrow ? 84 : 120)}
					y={L.chipY}
					width={narrow ? 168 : 240}
					height={L.chipH}
					rx={narrow ? 13 : 16}
					className="wt-focus-shape"
				/>
				<text
					x={W / 2}
					y={L.chipY + L.chipH * 0.66}
					textAnchor="middle"
					className="wt-film-type wt-film-accent"
					style={{ fontSize: text }}
				>
					{t(copy.order)}
				</text>
			</g>
			{FILLS.map((fill, i) => (
				<g key={fill.venue} data-f={`fill-${i}`}>
					<text
						x={margin}
						y={L.printY(i)}
						className="wt-film-num wt-film-dim"
						style={{ fontSize: text }}
					>
						{narrow ? TIME.slice(0, 8) : TIME}
					</text>
					<text
						x={margin + room * (narrow ? 0.34 : 0.3)}
						y={L.printY(i)}
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{`${count(fill.size)} @ ${usd(fill.price)} · ${fill.venue}`}
					</text>
					<text
						x={margin + room}
						y={L.printY(i)}
						textAnchor="end"
						className="wt-film-tag wt-film-accent"
						style={{ fontSize: T.small }}
					>
						ISO
					</text>
				</g>
			))}
			<text
				data-f="avg"
				x={margin}
				y={L.avgY}
				className="wt-film-num wt-film-warn"
				style={{ fontSize: narrow ? T.body : T.head }}
			>
				{t(copy.average)}
			</text>

			{/* A block: arranged off-screen. */}
			{headline("b-head", copy.bHead)}
			{/* The hero's answer, as the brackets lock on what the condition doesn't show. */}
			<Lines
				name="b2-head"
				text={t(copy.b2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.bHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<Brackets name="lock-know" glow />
			{bars.map(([name, label, size, tone], i) => (
				<g key={name} data-f={name}>
					<text
						x={margin}
						y={L.barY(i) - T.small * 0.8}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(label).toUpperCase()}
					</text>
					<rect
						data-f={`${name}-rect`}
						x={margin}
						y={L.barY(i)}
						width={Math.max(4, (size / BLOCK.quantity) * barMax)}
						height={L.barH}
						rx={4}
						className="wt-film-bar"
						data-tone={tone}
					/>
					<text
						data-f={`${name}-n`}
						x={margin + Math.max(4, (size / BLOCK.quantity) * barMax) + 10}
						y={L.barY(i) + L.barH / 2 + T.num * 0.32}
						className="wt-film-num"
						style={{ fontSize: T.num }}
					>
						{count(size)}
					</text>
				</g>
			))}
			<g data-f="auction">
				<rect
					x={margin + room - (narrow ? 80 : 110)}
					y={L.barY(1) - T.small * 2.4}
					width={narrow ? 80 : 110}
					height={T.small * 2}
					rx={T.small}
					className="wt-focus-shape"
				/>
				<text
					x={margin + room - (narrow ? 40 : 55)}
					y={L.barY(1) - T.small * 1.05}
					textAnchor="middle"
					className="wt-film-tag wt-film-accent"
					style={{ fontSize: T.small }}
				>
					{t(copy.auction).toUpperCase()}
				</text>
			</g>
			<text
				data-f="know-0"
				x={margin}
				y={L.knowY(0)}
				className="wt-film-type wt-film-gain"
				style={{ fontSize: narrow ? T.body * 1.1 : T.head * 0.85 }}
			>
				{t(copy.shows)}
			</text>
			<text
				data-f="know-1"
				x={margin}
				y={L.knowY(1)}
				className="wt-film-type wt-film-dim"
				style={{ fontSize: narrow ? T.body * 1.1 : T.head * 0.85 }}
			>
				{t(narrow ? copy.hidesShort : copy.hides)}
			</text>

			{/* Two legs, one package. */}
			{headline("p-head", copy.pHead)}
			{/* The answer, as the package's price comes up. */}
			<Lines
				name="p2-head"
				text={t(copy.p2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.pHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{legs.map(([line, quote, tone], i) => (
				<g key={t(line)} data-f={`leg-${i}`}>
					<rect
						x={margin}
						y={L.legY(i)}
						width={room}
						height={L.legH}
						rx={12}
						className="wt-panel-shape"
					/>
					<text
						x={margin + 16}
						y={L.legY(i) + L.legH * 0.4}
						className={`wt-film-num ${tone}`}
						style={{ fontSize: narrow ? T.small * 1.15 : T.body * 1.1 }}
					>
						{t(line)}
					</text>
					<text
						x={margin + 16}
						y={L.legY(i) + L.legH * 0.74}
						className="wt-film-type wt-film-dim"
						style={{ fontSize: T.small * 1.1 }}
					>
						{t(quote)}
					</text>
					<text
						data-f={`leg-${i}-tag`}
						x={margin + room - 16}
						y={L.legY(i) + L.legH * (narrow ? 0.74 : 0.4)}
						textAnchor="end"
						className="wt-film-tag wt-film-accent"
						style={{ fontSize: T.small }}
					>
						{t(copy.multiLeg).toUpperCase()}
					</text>
				</g>
			))}
			<g data-f="pkg">
				<rect
					x={margin}
					y={L.pkgY}
					width={room}
					height={L.pkgH}
					rx={14}
					className="wt-focus-shape"
				/>
				<text
					x={margin + 16}
					y={L.pkgY + L.pkgH * 0.26}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.pkgTag).toUpperCase()}
				</text>
				<text
					x={margin + 16}
					y={L.pkgY + L.pkgH * 0.58}
					className="wt-film-num wt-film-accent"
					style={{ fontSize: narrow ? T.head : T.num * 0.85 }}
				>
					{t(copy.pkgPrice)}
				</text>
				<text
					x={margin + 16}
					y={L.pkgY + L.pkgH * 0.84}
					className="wt-film-type wt-film-dim"
					style={{ fontSize: T.small * 1.1 }}
				>
					{t(copy.pkgCap)}
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
	/** A line lands slightly large and settles, without overshoot. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	/** A line draws itself from its start. */
	const draw = (path: SVGPathElement, time: number) => {
		const length = path.getTotalLength();
		tl.fromTo(
			path,
			{ opacity: 0, strokeDasharray: length, strokeDashoffset: length },
			{ opacity: 1, strokeDashoffset: 0, duration: 0.45, ease: "power2.out" },
			time,
		);
	};
	const heads = [
		"s-head",
		"s2-head",
		"b-head",
		"b2-head",
		"p-head",
		"p2-head",
	].map((name) => one(name));
	const venues = SWEEP.asks.map((_, i) => one(`venue-${i}`));
	const routes = FILLS.map((fill) =>
		one<SVGPathElement>(
			`route-${SWEEP.asks.findIndex((ask) => ask.venue === fill.venue)}`,
		),
	);
	const fills = FILLS.map((_, i) => one(`fill-${i}`));
	const legs = [one("leg-0"), one("leg-1")];
	const lockKnow = one<SVGGraphicsElement>("lock-know");

	d.hidden([
		...flat("q"),
		...heads,
		...venues,
		...routes,
		one("chip"),
		...fills,
		one("avg"),
		one("bar-shown"),
		one("bar-printed"),
		one("auction"),
		one("know-0"),
		one("know-1"),
		lockKnow,
		...legs,
		one("leg-0-tag"),
		one("leg-1-tag"),
		one("pkg"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: three prints at once ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 4.8);
	word(one("q-big"), 5.1);

	// ——— sweep: one order, three prints ———
	tl.addLabel("sweep", 8.6);
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	venues.forEach((venue, i) => {
		show(venue, 9.3 + i * 0.2);
	});
	d.pop(one("chip"), 11.0);
	routes.forEach((route, i) => {
		draw(route, 12.0);
		show(fills[i], 12.5 + i * 0.25, "right");
	});
	FILLS.forEach((fill) => {
		const i = SWEEP.asks.findIndex((ask) => ask.venue === fill.venue);
		const ask = SWEEP.asks[i];
		const left = ask.size - fill.size;
		// The venue's offer runs down by what it filled; an emptied venue steps back.
		d.count(
			one<SVGTextElement>(`venue-${i}-size`),
			left,
			12.5,
			(v) => `${count(Math.round(v))} ${d.t(copy.offered)}`,
			ask.size,
			0.5,
		);
		if (!left) tl.to(one(`venue-${i}`), { opacity: 0.45, duration: 0.3 }, 13.0);
	});
	show(one("avg"), 14.3);
	show(heads[1], 14.6);

	// ——— block: the hero. Arranged off-screen; the condition says how. ———
	tl.addLabel("block", 19.2);
	hide(
		[
			heads[0],
			heads[1],
			...venues,
			...routes,
			one("chip"),
			...fills,
			one("avg"),
		],
		19.2,
	);
	show(heads[2], 19.55);
	show(one("bar-shown"), 20.0, "right");
	show(one("bar-printed"), 21.4);
	tl.fromTo(
		one("bar-printed-rect"),
		{ attr: { width: 4 } },
		{
			attr: { width: Number(one("bar-printed-rect").getAttribute("width")) },
			duration: 0.9,
			ease: "power2.out",
		},
		21.4,
	);
	tl.fromTo(
		one("bar-printed-n"),
		{ x: -(Number(one("bar-printed-rect").getAttribute("width")) - 4) },
		{ x: 0, duration: 0.9, ease: "power2.out" },
		21.4,
	);
	d.pop(one("auction"), 22.8);
	show(one("know-0"), 23.8);
	show(one("know-1"), 24.8);
	// What it doesn't show steps up from dim as the brackets lock on it.
	tl.set(one("know-1"), { attr: { class: "wt-film-type" } }, 25.4);
	d.lock(lockKnow, 25.4, { around: one("know-1"), pad: 6 });
	tl.addLabel("hero-lock", 25.4);
	show(heads[3], 25.4);

	// ——— package: two legs, one trade ———
	tl.addLabel("package", 29);
	hide(
		[
			heads[2],
			heads[3],
			one("bar-shown"),
			one("bar-printed"),
			one("auction"),
			one("know-0"),
			one("know-1"),
			lockKnow,
		],
		29.0,
	);
	show(heads[4], 29.35);
	show(legs[0], 29.8, "right");
	show(legs[1], 30.8, "right");
	show(one("leg-0-tag"), 31.4);
	show(one("leg-1-tag"), 31.6);
	show(one("pkg"), 32.2);
	show(heads[5], 32.2);

	// ——— claim ———
	tl.addLabel("claim", 35.8);
	hide([heads[4], heads[5], ...legs, one("pkg")], 35.8);
	word(one("z-big"), 36.1);
	show(one("z-sub"), 36.5);

	// ——— next ———
	tl.addLabel("next", 40.2);
	hide(kids("claim"), 40.2);
	d.close(40.2);
	return tl;
}

export const executionConditionsFilm: Film = {
	id: "execution-conditions",
	label: [
		`Execution conditions, as a short film: one ${SWEEP.quantity}-contract order for the Oct 18 110 call sent to three venues as ISO orders and printed three times, ${FILLS.map((fill) => `${count(fill.size)} at ${usd(fill.price)}`).join(", ")}, for ${price4(AVERAGE)} on average against a ${usd(BEST.price)} best ask; a block of ${count(BLOCK.quantity)} 105 calls printed at ${usd(BLOCK.price)} as an auction while only ${SHOWN_SIZE} were displayed; and the block's two legs, a 105 call bought at the ask and a 110 call sold inside its quote, read as one 105/110 call spread for ${usd(PACKAGE.price)}`,
		`成交条件短片：一张 ${SWEEP.quantity} 张的 10月18日 110 看涨订单以 ISO 方式同时发往三个场所，成交三次：${FILLS.map((fill) => `${usd(fill.price)} 成交 ${count(fill.size)} 张`).join("，")}，平均 ${price4(AVERAGE)}，而最优卖价是 ${usd(BEST.price)}；一笔 ${count(BLOCK.quantity)} 张的 105 看涨大宗以竞价方式在 ${usd(BLOCK.price)} 成交，而屏幕上只挂出 ${SHOWN_SIZE} 张；以及这笔大单的两条腿：在卖价买入的 105 看涨与在报价之内卖出的 110 看涨，合起来是一个净价 ${usd(PACKAGE.price)} 的 105/110 看涨价差`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Execution conditions", "成交条件"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "sweep", label: ["A sweep", "扫单"] },
		{ id: "block", label: ["A block", "大宗"] },
		{ id: "package", label: ["A package", "一个整体"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
