import gsap from "gsap";
import {
	type Copy,
	count,
	holders,
	pick,
	type SideCode,
	sideCode,
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
	OUTSIDE,
	PRINT_TIME,
	quoteAt,
	references,
	TRADES,
	type TradeId,
	tradeById,
} from "./execution-side-model";

/*
 * Execution side, as a film. At 11:42 the quote is $4.10 bid, $4.20 ask and 6 contracts
 * print at $4.15: at the bid, the ask, or between? A ruler of five places answers, print by
 * print, each against its own quote: ASK at 10:05, MID at 11:42, BID at 14:18, and AASK for
 * a test price outside. The hero keeps the 11:42 print and changes the quote under it: one
 * 90 seconds old says AASK, one 2 seconds late says BID, none says nothing; the quote in
 * force says MID, and glowing brackets lock on it. Last, how far the 14:18 print at the bid
 * goes: a location and a likely seller, but both sides were closing.
 *
 *   open      0–4        "Execution side"
 *   question  4–8.8      $4.10 × $4.20, 6 at $4.15: bid, ask or between?
 *   place     8.8–19.2   five places; 10:05 ASK; 11:42 MID; 14:18 BID; $4.25 AASK
 *   quote     19.2–31.3  hero: 90 s old AASK; 2 s late BID; none; in force MID
 *   claims    31.3–38.9  calculated, inferred, unknown, unknown; both were closing
 *   claim     38.9–43.3  a side is a place, not a reason
 *   next      43.3–45.8  Next: sentiment labels
 */

const END = 45.8;
/** The film's ruler runs a little wider than the lesson's, so the outer places have room. */
const LO = 390;
const HI = 435;
const ZONES = ["BBID", "BID", "MID", "ASK", "AASK"] as const;
const PRINT = tradeById("t2");
const LAST = tradeById("t3");
const STALE = references.stale;
const LATER = references.later;
const STALE_SAYS = sideCode(PRINT.price, STALE.bid, STALE.ask);
const LATER_SAYS = sideCode(PRINT.price, LATER.bid, LATER.ask);
const codeOf = (id: TradeId) =>
	sideCode(tradeById(id).price, quoteAt(id).bid, quoteAt(id).ask);
const pair = (bid: number, ask: number) => `${usd(bid)} / ${usd(ask)}`;
const printText = (size: number, cents: number) =>
	`${count(size)} @ ${usd(cents)}`;
/**
 * The big figure's run, one value after another: the place shot, then the quote shot, which
 * ends on the quote in force.
 */
const SIDES = [
	codeOf("t1"),
	codeOf("t2"),
	codeOf("t3"),
	sideCode(OUTSIDE, quoteAt("t2").bid, quoteAt("t2").ask),
	STALE_SAYS,
	LATER_SAYS,
	null,
	codeOf("t2"),
] as const;
/** Which of the run are withheld: measured against a quote that can't be used. */
const WITHHELD = [false, false, false, false, true, true, false, false];

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const rulerY = H * (narrow ? 0.42 : 0.5);
	const tapeW = narrow ? room : room * 0.62;
	return {
		...frame,
		rulerY,
		x: (cents: number) => margin + ((cents - LO) / (HI - LO)) * room,
		sideY: rulerY - H * (narrow ? 0.13 : 0.15),
		tapeX: margin + (room - tapeW) / 2,
		tapeW,
		tapeY: rulerY + H * (narrow ? 0.2 : 0.19),
		rowStep: H * 0.055,
		cardH: H * (narrow ? 0.2 : 0.21),
		claimY: (i: number) => H * 0.27 + i * H * (narrow ? 0.1 : 0.115),
		claimH: H * (narrow ? 0.08 : 0.09),
	};
}

const verb = (effect: "open" | "close", buy: boolean): Copy =>
	buy
		? effect === "open"
			? ["bought to open", "买入开仓"]
			: ["bought to close", "买入平仓"]
		: effect === "open"
			? ["sold to open", "卖出开仓"]
			: ["sold to close", "卖出平仓"];

const copy = {
	title: ["Execution side", "成交位置"],
	titleSub: ["where a trade printed against the quote", "成交价相对报价的位置"],
	qTag: [
		`${quoteAt("t2").time.slice(0, 5)} · Oct 18 100 call`,
		`${quoteAt("t2").time.slice(0, 5)} · 10月18日 100 看涨`,
	],
	qLine: [
		`${count(PRINT.quantity)} contracts print at ${usd(PRINT.price)}.`,
		`${count(PRINT.quantity)} 张以 ${usd(PRINT.price)} 成交。`,
	],
	qBig: ["At the bid, the ask, or between?", "在买价、卖价，还是之间？"],
	bid: ["bid", "买价"],
	ask: ["ask", "卖价"],
	pHead: ["Five places against the quote.", "对照报价，共有五个位置。"],
	eHead: ["Each print, against its own quote.", "每笔成交，对照自己的报价。"],
	rHead: [
		`Same ${PRINT.time} print, other quotes.`,
		`同一笔 ${PRINT.time} 成交，换个报价。`,
	],
	r2Head: ["Only the quote in force counts.", "只有成交时有效的报价才算数。"],
	side: ["side", "位置"],
	test: [`test ${usd(OUTSIDE)}`, `测试 ${usd(OUTSIDE)}`],
	tape: ["time and sales", "逐笔成交"],
	reference: ["reference quote", "参考报价"],
	usable: ["in force at the print: usable", "成交时有效：可用"],
	stale: ["90 seconds before: withheld", "早了 90 秒：不作判断"],
	later: ["2 seconds after: withheld", "晚了 2 秒：不作判断"],
	missing: ["no quote on record: unknown", "没有报价记录：未知"],
	none: ["none", "无"],
	cHead: [
		`${LAST.time} at the bid: what follows?`,
		`${LAST.time} 在买价成交：能推出什么？`,
	],
	c2Head: ["Both sides were closing.", "双方其实都在平仓。"],
	c1: ["Printed at the bid", "在买价成交"],
	c2: ["A seller probably started it", "可能是卖方发起"],
	c3: ["It opened a new short", "它开立了新空头"],
	c4: ["Someone is bearish on ALFA", "有人看空 ALFA"],
	calculated: ["calculated", "计算"],
	inferred: ["inferred", "推断"],
	unknown: ["unknown", "未知"],
	claimBig: ["A side is a place, not a reason.", "位置只是位置，不是理由。"],
	claimSub: [
		"Use the quote in force at the print.",
		"以成交时有效的报价为准。",
	],
	nextBig: ["Next: sentiment labels", "下一课：情绪标签"],
	nextSub: ["when bullish or bearish is justified", "何时能称为看涨或看跌"],
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
	const ticks = narrow
		? [390, 400, 410, 420, 430]
		: [390, 395, 400, 405, 410, 415, 420, 425, 430, 435];
	const tick = (name: string, tone: "gain" | "loss") => (
		<g data-f={name}>
			<path
				d={`M0 ${L.rulerY - 16}V${L.rulerY + 16}`}
				style={{
					stroke: `var(--diagram-${tone})`,
					strokeWidth: 2.5,
					strokeLinecap: "round",
				}}
			/>
		</g>
	);
	const prints: [string, number, string][] = [
		["pl-t1", TRADES[0].price, printText(TRADES[0].quantity, TRADES[0].price)],
		["pl-t2", PRINT.price, printText(PRINT.quantity, PRINT.price)],
		["pl-t3", LAST.price, printText(LAST.quantity, LAST.price)],
		["pl-test", OUTSIDE, t(copy.test)],
	];
	const cards: [string, string, Copy, "gain" | "loss" | "dim"][] = [
		[
			"ref-0",
			`${quoteAt("t2").time} · ${pair(quoteAt("t2").bid, quoteAt("t2").ask)}`,
			copy.usable,
			"gain",
		],
		[
			"ref-1",
			`${STALE.time} · ${pair(STALE.bid ?? 0, STALE.ask ?? 0)}`,
			copy.stale,
			"loss",
		],
		[
			"ref-2",
			`${LATER.time} · ${pair(LATER.bid ?? 0, LATER.ask ?? 0)}`,
			copy.later,
			"loss",
		],
		["ref-3", t(copy.none), copy.missing, "dim"],
	];
	const claims: [Copy, Copy, string][] = [
		[copy.c1, copy.calculated, "wt-film-gain"],
		[copy.c2, copy.inferred, "wt-film-warn"],
		[copy.c3, copy.unknown, "wt-film-dim"],
		[copy.c4, copy.unknown, "wt-film-dim"],
	];
	const seller = holders[LAST.seller].name;
	const buyer = holders[LAST.buyer].name;
	return (
		<>
			<Backdrop frame={L} />

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-tag"
					x={W / 2}
					y={H * 0.22}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				{(
					[
						["q-bid", copy.bid, usd(quoteAt("t2").bid), "wt-film-gain", -1],
						["q-ask", copy.ask, usd(quoteAt("t2").ask), "wt-film-loss", 1],
					] as const
				).map(([name, tag, num, tone, side]) => (
					<g key={name}>
						<Word
							name={`${name}-tag`}
							x={W / 2 + side * W * 0.16}
							y={H * 0.33}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`${name}-num`}
							x={W / 2 + side * W * 0.16}
							y={H * 0.33 + T.num * 1.3}
							size={T.num * 1.1}
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
					y={H * 0.53}
					size={T.head}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
				<Lines
					name="q-big"
					text={t(copy.qBig)}
					x={W / 2}
					y={H * 0.7}
					size={T.title}
					maxWidth={room}
				/>
			</g>

			{/* The ruler: five places, moving with the quote. */}
			{headline("p-head", copy.pHead)}
			{headline("e-head", copy.eHead)}
			{headline("r-head", copy.rHead)}
			{/* The hero's answer, a line under the question, as the quote in force returns. */}
			<Lines
				name="r2-head"
				text={t(copy.r2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.rHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<g data-f="axis">
				<path
					d={`M${L.x(LO)} ${L.rulerY}H${L.x(HI)}`}
					className="wt-axis"
					strokeWidth={2}
				/>
				{ticks.map((cents) => (
					<text
						key={cents}
						x={L.x(cents)}
						y={L.rulerY + T.small * 2.6}
						textAnchor="middle"
						className="wt-film-num wt-film-dim"
						style={{ fontSize: T.small }}
					>
						{usd(cents)}
					</text>
				))}
			</g>
			<rect
				data-f="band"
				x={0}
				y={L.rulerY - 8}
				width={0}
				height={16}
				rx={3}
				className="wt-film-bar"
				data-tone="model"
			/>
			{tick("bid-m", "gain")}
			{tick("ask-m", "loss")}
			<g data-f="zones">
				{ZONES.map((zone) => (
					<text
						key={zone}
						data-f={`z-${zone}`}
						x={0}
						y={L.rulerY + T.small * 5}
						textAnchor="middle"
						className="wt-film-num wt-film-dim"
						style={{ fontSize: T.small * 1.1 }}
					>
						{zone}
					</text>
				))}
			</g>
			<circle
				data-f="dot"
				cx={L.x(TRADES[0].price)}
				cy={L.rulerY}
				r={7}
				className="wt-chip"
				stroke="var(--foreground)"
				strokeWidth={1.5}
			/>
			{prints.map(([name, cents, label]) => (
				<text
					key={name}
					data-f={name}
					x={L.x(cents)}
					y={L.rulerY - 22}
					textAnchor={cents >= HI - 10 ? "end" : "middle"}
					className="wt-film-num wt-film-accent"
					style={{ fontSize: text }}
				>
					{label}
				</text>
			))}
			<text
				data-f="side-tag"
				x={W / 2}
				y={L.sideY - T.num * 1.25}
				textAnchor="middle"
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(copy.side).toUpperCase()}
			</text>
			{SIDES.map((code, i) => (
				<text
					key={i}
					data-f={`side-${i}`}
					x={W / 2}
					y={L.sideY}
					textAnchor="middle"
					className={`wt-film-num ${WITHHELD[i] || code === null ? "wt-film-dim" : "wt-film-accent"}`}
					style={{
						fontSize: T.num * 1.15,
						textDecoration: WITHHELD[i] ? "line-through" : undefined,
					}}
				>
					{code ?? "?"}
				</text>
			))}
			<Brackets name="lock-side" glow />

			{/* The tape of Monday's prints, and the reference card that replaces it. */}
			<g data-f="tape">
				<text
					x={L.tapeX}
					y={L.tapeY}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.tape).toUpperCase()}
				</text>
				<path
					d={`M${L.tapeX} ${L.tapeY + T.small * 0.8}H${L.tapeX + L.tapeW}`}
					className="wt-film-link"
				/>
			</g>
			{TRADES.map((trade, i) => (
				<g key={trade.id} data-f={`row-${trade.id}`}>
					<text
						x={L.tapeX}
						y={L.tapeY + T.small + (i + 1) * L.rowStep}
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{`${trade.time} · ${printText(trade.quantity, trade.price)}`}
					</text>
					<text
						x={L.tapeX + L.tapeW}
						y={L.tapeY + T.small + (i + 1) * L.rowStep}
						textAnchor="end"
						className="wt-film-num wt-film-accent"
						style={{ fontSize: text }}
					>
						{codeOf(trade.id as TradeId)}
					</text>
				</g>
			))}
			<g data-f="card">
				<rect
					x={L.tapeX}
					y={L.tapeY - T.small * 1.2}
					width={L.tapeW}
					height={L.cardH}
					rx={12}
					className="wt-panel-shape"
				/>
				<text
					x={L.tapeX + 14}
					y={L.tapeY + T.small * 0.6}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{`${t(copy.reference).toUpperCase()} · ${PRINT_TIME}`}
				</text>
			</g>
			{cards.map(([name, line, verdict, tone]) => (
				<g key={name} data-f={name}>
					<text
						x={L.tapeX + 14}
						y={L.tapeY + T.small * 0.6 + L.cardH * 0.32}
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{line}
					</text>
					<text
						x={L.tapeX + 14}
						y={L.tapeY + T.small * 0.6 + L.cardH * 0.58}
						className={`wt-film-type wt-film-${tone}`}
						style={{ fontSize: text }}
					>
						{t(verdict)}
					</text>
				</g>
			))}

			{/* How far one side goes. */}
			{headline("c-head", copy.cHead)}
			{/* The answer, as the ledger shows both sides. */}
			<Lines
				name="c2-head"
				text={t(copy.c2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.cHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{claims.map(([claim, evidence, tone], i) => (
				<g key={t(claim)} data-f={`claim-${i}`}>
					<rect
						x={margin}
						y={L.claimY(i)}
						width={room}
						height={L.claimH}
						rx={10}
						className={i === 0 ? "wt-focus-shape" : "wt-panel-shape"}
					/>
					<text
						x={margin + 14}
						y={L.claimY(i) + L.claimH / 2 + text * 0.36}
						className="wt-film-type"
						style={{ fontSize: text }}
					>
						{t(claim)}
					</text>
					<text
						x={margin + room - 14}
						y={L.claimY(i) + L.claimH / 2 + T.small * 0.36}
						textAnchor="end"
						className={`wt-film-tag ${tone}`}
						style={{ fontSize: T.small }}
					>
						{t(evidence).toUpperCase()}
					</text>
				</g>
			))}
			<Lines
				name="ledger"
				text={`${t(seller)} ${t(verb(LAST.sellerEffect, false))} · ${t(buyer)} ${t(verb(LAST.buyerEffect, true))}`}
				x={margin}
				y={L.claimY(4) + T.body}
				size={text}
				maxWidth={room}
				anchor="start"
				className="wt-film-type wt-film-accent"
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
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const fade = (targets: gsap.TweenTarget, to: number, time: number) =>
		tl.to(targets, { opacity: to, duration: 0.35 }, time);
	const bidM = one("bid-m");
	const askM = one("ask-m");
	const band = one("band");
	const dot = one("dot");
	const zones = ZONES.map((zone) => one(`z-${zone}`));
	/** Where each place's label sits for a quote: the bid and ask at their ticks, the rest centred. */
	const zoneX = (bid: number, ask: number) => [
		(L.x(LO) + L.x(bid)) / 2,
		L.x(bid),
		(L.x(bid) + L.x(ask)) / 2,
		L.x(ask),
		(L.x(ask) + L.x(HI)) / 2,
	];
	const quoteProps = (bid: number, ask: number) => ({
		bid: { x: L.x(bid) },
		ask: { x: L.x(ask) },
		band: { attr: { x: L.x(bid), width: L.x(ask) - L.x(bid) } },
		zones: zoneX(bid, ask).map((x) => ({ attr: { x } })),
	});
	/** The quote moves: its ticks, the spread between them and the five places with them. */
	const quoteTo = (bid: number, ask: number, time: number) => {
		const p = quoteProps(bid, ask);
		const move = { duration: 0.6, ease: "power2.inOut" };
		tl.to(bidM, { ...p.bid, ...move }, time);
		tl.to(askM, { ...p.ask, ...move }, time);
		tl.to(band, { ...p.band, ...move }, time);
		zones.forEach((zone, i) => {
			tl.to(zone, { ...p.zones[i], ...move }, time);
		});
	};
	const dotTo = (cents: number, time: number) =>
		tl.to(
			dot,
			{ attr: { cx: L.x(cents) }, duration: 0.6, ease: "power2.inOut" },
			time,
		);
	/** One place lights up; the others step back. */
	const light = (code: SideCode | null, time: number) => {
		ZONES.forEach((zone, i) => {
			tl.set(
				zones[i],
				{
					attr: {
						class: `wt-film-num ${zone === code ? "wt-film-accent" : "wt-film-dim"}`,
					},
				},
				time,
			);
		});
	};
	const sides = SIDES.map((_, i) => one(`side-${i}`));
	const sideTo = (i: number, time: number) => {
		d.flip(sides[i - 1], sides[i], time);
		tl.set(sides[i - 1], { opacity: 0 }, time + 0.3);
	};
	const heads = [
		"p-head",
		"e-head",
		"r-head",
		"r2-head",
		"c-head",
		"c2-head",
	].map((name) => one(name));
	const rows = TRADES.map((trade) => one(`row-${trade.id}`));
	const refs = [0, 1, 2, 3].map((i) => one(`ref-${i}`));
	const claimRows = [0, 1, 2, 3].map((i) => one(`claim-${i}`));
	const lockSide = one<SVGGraphicsElement>("lock-side");
	const first = quoteAt("t1");
	const start = quoteProps(first.bid, first.ask);
	gsap.set(bidM, start.bid);
	gsap.set(askM, start.ask);
	gsap.set(band, start.band);
	zones.forEach((zone, i) => {
		gsap.set(zone, start.zones[i]);
	});

	d.hidden([
		...flat("q"),
		...heads,
		...kids("axis"),
		band,
		bidM,
		askM,
		...zones,
		dot,
		one("pl-t1"),
		one("pl-t2"),
		one("pl-t3"),
		one("pl-test"),
		one("side-tag"),
		...sides,
		lockSide,
		...kids("tape"),
		...rows,
		...kids("card"),
		...refs,
		...claimRows,
		one("ledger"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a quote and a print ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	(["q-bid", "q-ask"] as const).forEach((name, i) => {
		show(one(`${name}-tag`), 4.8 + i * 0.25);
		word(one(`${name}-num`), 4.9 + i * 0.25);
	});
	show(one("q-line"), 5.2);
	word(one("q-big"), 6.2);

	// ——— place: each print against its own quote ———
	tl.addLabel("place", 8.8);
	hide(flat("q"), 8.8);
	show(heads[0], 9.0);
	show(kids("axis"), 9.2);
	fade([band, bidM, askM], 1, 9.6);
	zones.forEach((zone, i) => {
		fade(zone, 1, 9.9 + i * 0.12);
	});
	d.pop(dot, 11.0);
	show(one("pl-t1"), 11.1);
	show(one("side-tag"), 11.2);
	light(codeOf("t1"), 11.3);
	word(sides[0], 11.3);
	show(kids("tape"), 11.5);
	show(rows[0], 11.7, "right");
	d.swap(heads[0], heads[1], 12.6);

	const steps: [TradeId | "test", number, number][] = [
		["t2", 13.0, 1],
		["t3", 15.0, 2],
		["test", 17.0, 3],
	];
	steps.forEach(([id, time, i]) => {
		const quote = quoteAt(id === "test" ? "t2" : id);
		const cents = id === "test" ? OUTSIDE : tradeById(id).price;
		const before = ["pl-t1", "pl-t2", "pl-t3"][i - 1];
		quoteTo(quote.bid, quote.ask, time + 0.3);
		hide(one(before), time + 0.3, 0.25);
		dotTo(cents, time + 0.4);
		show(one(id === "test" ? "pl-test" : `pl-${id}`), time + 0.9);
		light(SIDES[i], time + 0.8);
		sideTo(i, time + 0.8);
		if (id !== "test") show(rows[i], time + 1.0, "right");
	});

	// ——— quote: the hero. The 11:42 print stays; the quote under it changes. ———
	tl.addLabel("quote", 19.2);
	d.swap(heads[1], heads[2], 19.2);
	hide([...kids("tape"), ...rows], 19.2);
	hide(one("pl-test"), 19.2, 0.25);
	show(kids("card"), 19.5);
	show(refs[1], 19.6);
	// A quote 90 seconds old: the print reads as above the ask, and is withheld.
	quoteTo(STALE.bid ?? 0, STALE.ask ?? 0, 19.6);
	dotTo(PRINT.price, 19.6);
	show(one("pl-t2"), 20.1);
	light(SIDES[4], 20.2);
	sideTo(4, 20.2);
	// One from 2 seconds after the print: at the bid, and withheld too.
	d.swap(refs[1], refs[2], 22.0);
	quoteTo(LATER.bid ?? 0, LATER.ask ?? 0, 22.1);
	light(SIDES[5], 22.6);
	sideTo(5, 22.6);
	// No quote at all: nothing to measure against.
	d.swap(refs[2], refs[3], 24.2);
	fade([band, bidM, askM, ...zones], 0.15, 24.3);
	light(SIDES[6], 24.8);
	sideTo(6, 24.8);
	// The quote in force at the print: inside the spread, and the brackets lock on it.
	d.swap(refs[3], refs[0], 26.4);
	fade([band, bidM, askM, ...zones], 1, 26.5);
	quoteTo(quoteAt("t2").bid, quoteAt("t2").ask, 26.5);
	light(SIDES[7], 27.0);
	sideTo(7, 27.0);
	// Around the figure and its tag together, so no arm runs through the tag.
	d.lock(lockSide, 27.7, { around: [one("side-tag"), sides[7]], pad: 6 });
	tl.addLabel("hero-lock", 27.7);
	show(heads[3], 27.7);

	// ——— claims: how far a side goes ———
	tl.addLabel("claims", 31.3);
	hide(
		[
			heads[2],
			heads[3],
			...kids("axis"),
			band,
			bidM,
			askM,
			...zones,
			dot,
			one("pl-t2"),
			one("side-tag"),
			sides[SIDES.length - 1],
			lockSide,
			...kids("card"),
			refs[0],
		],
		31.3,
	);
	show(heads[4], 31.65);
	claimRows.forEach((row, i) => {
		show(row, [32.0, 32.8, 33.6, 34.2][i], "right");
	});
	// The ledger: both sides were closing, so the print neither opened nor bet.
	show(one("ledger"), 35.3);
	show(heads[5], 35.3);

	// ——— claim ———
	tl.addLabel("claim", 38.9);
	hide([heads[4], heads[5], ...claimRows, one("ledger")], 38.9);
	word(one("z-big"), 39.2);
	show(one("z-sub"), 39.6);

	// ——— next ———
	tl.addLabel("next", 43.3);
	hide(kids("claim"), 43.3);
	d.close(43.3);
	return tl;
}

export const executionSideFilm: Film = {
	id: "execution-side",
	label: [
		`Execution side, as a short film: a ruler of five places, below the bid, at the bid, inside the spread, at the ask and above it, with Monday's three prints each placed against its own quote, ${TRADES.map((trade) => `${trade.time} ${codeOf(trade.id as TradeId)}`).join(", ")}, and a test price of ${usd(OUTSIDE)} outside it; the ${PRINT.time} print against a quote 90 seconds old, which would say ${STALE_SAYS}, one 2 seconds late, which would say ${LATER_SAYS}, and none, before the quote in force names it ${codeOf("t2")}; and how far the ${LAST.time} print at the bid goes, a location and a likely seller, while both sides were closing`,
		`成交位置短片：五个位置的标尺，低于买价、等于买价、价差之内、等于卖价和高于卖价，周一三笔成交各自对照当时的报价：${TRADES.map((trade) => `${trade.time} ${codeOf(trade.id as TradeId)}`).join("，")}，以及报价之外的测试价 ${usd(OUTSIDE)}；${PRINT.time} 的成交对照 90 秒前的报价会得出 ${STALE_SAYS}，对照 2 秒后的报价会得出 ${LATER_SAYS}，没有报价则无从判断，只有成交时有效的报价给出 ${codeOf("t2")}；以及 ${LAST.time} 在买价的成交能推出多少：位置和可能的卖方发起，而双方其实都在平仓`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Execution side", "成交位置"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "place", label: ["Five places", "五个位置"] },
		{ id: "quote", label: ["The quote", "报价"] },
		{ id: "claims", label: ["How far", "能推出多少"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
