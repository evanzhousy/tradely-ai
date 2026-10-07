import {
	applyMessages,
	type Copy,
	count,
	type FeedMessage,
	oct105CallMessages,
	pick,
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
import { aggregate, price4, sources } from "./trade-records-model";

/*
 * Tape rows, as a film. The Oct 18 105 call printed 5 at $2.00 and 500 at $2.15: is the
 * average $2.075? First what one row holds: two prints, 505 contracts, 2 trades. Then what
 * feeds it: six messages, a duplicate, a bust and a correction, that come to two trades.
 * The hero weighs the clean trades by size: $108,500 of premium, and the average counts
 * from $2.075 to $2.1485 as glowing brackets lock. Last, the block's 110 leg, another
 * contract that doesn't belong in the row.
 *
 *   open      0–4        "Tape rows"
 *   question  4–8.6      5 at $2.00, 500 at $2.15: average $2.075?
 *   row       8.6–13.6   two prints; 505 contracts and 2 trades
 *   feed      13.6–24    new, duplicate, new, cancel, new, correct: 6 messages, 2 trades
 *   average   24–31      hero: $108,500 over 50,500 shares, $2.1485, not $2.075
 *   leg       31–35.6    not the 110 leg
 *   claim     35.6–40    one row, many prints; one trade, many messages
 *   next      40–42.5    Next: execution conditions
 */

const END = 42.5;
const PRINTS = [sources.t1, sources.t3];
const ROW = aggregate(["t1", "t3"]);
const MIXED = aggregate(["t1", "t3", "leg"]);
const LEG = sources.leg;
const MESSAGES = oct105CallMessages;
/** The feed's view after each message: how many trades and contracts it represents. */
const VIEWS = MESSAGES.map((_, i) => {
	const trades = [...applyMessages(MESSAGES.slice(0, i + 1)).values()];
	return {
		trades: trades.length,
		contracts: trades.reduce((sum, trade) => sum + trade.quantity, 0),
	};
});
const LAST = VIEWS[VIEWS.length - 1];
const kindCopy: Record<FeedMessage["kind"], Copy> = {
	new: ["new", "新增"],
	duplicate: ["duplicate", "重复"],
	cancel: ["cancel", "撤销"],
	correct: ["correct", "更正"],
};
const kindTone: Record<FeedMessage["kind"], string> = {
	new: "wt-film-accent",
	duplicate: "wt-film-dim",
	cancel: "wt-film-loss",
	correct: "wt-film-warn",
};

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	return {
		...frame,
		printY: (i: number) =>
			H * (narrow ? 0.26 : 0.27) + i * H * (narrow ? 0.08 : 0.085),
		printH: H * (narrow ? 0.065 : 0.07),
		/** Four figures across: the money ones are wider than the counts. */
		statX: (i: number) =>
			margin + (narrow ? i * (room / 2) : [0, 0.19, 0.38, 0.7][i] * room),
		statY: (row: number) =>
			H * (narrow ? 0.46 : 0.5) + row * H * (narrow ? 0.17 : 0),
		legY: H * (narrow ? 0.84 : 0.8),
		msgW: narrow ? room : room * 0.62,
		msgY: (i: number) =>
			H * (narrow ? 0.25 : 0.26) + i * H * (narrow ? 0.068 : 0.085),
		msgH: H * (narrow ? 0.055 : 0.068),
		countX: (i: number) =>
			narrow ? margin + i * (room / 2) : margin + room * 0.68,
		countY: (i: number) => (narrow ? H * 0.71 : H * (0.3 + i * 0.18)),
	};
}

const copy = {
	title: ["Tape rows", "成交记录"],
	titleSub: ["what one record represents", "一行代表什么"],
	qTag: ["Oct 18 105 call · Monday", "10月18日 105 看涨 · 周一"],
	qLine: [
		`${count(PRINTS[0].quantity)} at ${usd(PRINTS[0].price)}, ${count(PRINTS[1].quantity)} at ${usd(PRINTS[1].price)}.`,
		`${count(PRINTS[0].quantity)} 张 ${usd(PRINTS[0].price)}，${count(PRINTS[1].quantity)} 张 ${usd(PRINTS[1].price)}。`,
	],
	qBig: [`Average ${price4(ROW.simple)}?`, `平均 ${price4(ROW.simple)}？`],
	rHead: ["One row can hold several prints.", "一行可以包含多笔成交。"],
	aHead: ["Now weight each price by its size.", "再按数量给每个价格加权。"],
	a2Head: [
		`${price4(ROW.weighted)}, not ${price4(ROW.simple)}.`,
		`${price4(ROW.weighted)}，不是 ${price4(ROW.simple)}。`,
	],
	xHead: ["Never mix in another contract.", "不要混入另一张合约。"],
	contracts: ["contracts", "张数"],
	trades: ["trades", "笔数"],
	premium: ["premium", "权利金"],
	average: ["average paid", "平均成交价"],
	simple: ["simple average, ignoring size", "简单平均，忽略数量"],
	simpleShort: ["ignores size", "忽略数量"],
	mixed: [
		`+ ${count(LEG.quantity)} · 110 call @ ${usd(LEG.price)} → ${price4(MIXED.weighted)} of what?`,
		`+ ${count(LEG.quantity)} 张 110 看涨 @ ${usd(LEG.price)} → ${price4(MIXED.weighted)}，是什么的价格？`,
	],
	mixedShort: [
		`+ 110 leg → ${price4(MIXED.weighted)} of what?`,
		`+ 110 腿 → ${price4(MIXED.weighted)}？`,
	],
	fHead: [
		"A feed sends messages, not trades.",
		"数据源发送的是消息，不是成交。",
	],
	f2Head: [
		`${MESSAGES.length} messages, ${LAST.trades} trades.`,
		`${MESSAGES.length} 条消息，${LAST.trades} 笔成交。`,
	],
	messages: ["messages", "消息"],
	claimBig: [
		"A row is a sum; a message is not a trade.",
		"一行是加总；一条消息不是一笔成交。",
	],
	claimSub: [
		"Sum one contract's prints; count by trade ID.",
		"只加总同一合约；按成交编号计数。",
	],
	nextBig: ["Next: execution conditions", "下一课：成交条件"],
	nextSub: ["sweeps, blocks and complex orders", "扫单、大宗与复杂订单"],
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
	const stats: [string, Copy, string, number, number][] = [
		["s-contracts", copy.contracts, count(ROW.contracts), 0, 0],
		["s-trades", copy.trades, String(ROW.trades), 1, 0],
		[
			"s-premium",
			copy.premium,
			usd(ROW.premium, 0),
			narrow ? 0 : 2,
			narrow ? 1 : 0,
		],
		[
			"s-average",
			copy.average,
			price4(ROW.weighted),
			narrow ? 1 : 3,
			narrow ? 1 : 0,
		],
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

			{/* One row from two prints. */}
			{headline("r-head", copy.rHead)}
			{headline("a-head", copy.aHead)}
			{/* The hero's answer, as the average lands. */}
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
			{headline("x-head", copy.xHead)}
			{PRINTS.map((print, i) => (
				<g key={print.trade} data-f={`print-${i}`}>
					<rect
						x={margin}
						y={L.printY(i)}
						width={room}
						height={L.printH}
						rx={10}
						className="wt-panel-shape"
					/>
					<text
						x={margin + 14}
						y={L.printY(i) + L.printH / 2 + text * 0.36}
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{`${print.trade} · ${print.time} · ${t(print.contract)}`}
					</text>
					<text
						x={margin + room - 14}
						y={L.printY(i) + L.printH / 2 + text * 0.36}
						textAnchor="end"
						className="wt-film-num wt-film-accent"
						style={{ fontSize: text }}
					>
						{`${count(print.quantity)} @ ${usd(print.price)}`}
					</text>
				</g>
			))}
			<path
				data-f="sum-rule"
				d={`M${margin} ${L.printY(2) - H * 0.01}H${margin + room}`}
				className="wt-film-link"
			/>
			{stats.map(([name, tag, value, col, row]) => (
				<g key={name} data-f={name}>
					<text
						x={L.statX(col)}
						y={L.statY(row) + T.small}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(tag).toUpperCase()}
					</text>
					<text
						data-f={`${name}-n`}
						x={L.statX(col)}
						y={L.statY(row) + T.small + T.num * 1.3}
						className={`wt-film-num ${name === "s-average" ? "wt-film-accent" : ""}`}
						style={{ fontSize: narrow ? T.num : T.num * 1.1 }}
					>
						{value}
					</text>
				</g>
			))}
			<text
				data-f="simple"
				x={L.statX(narrow ? 1 : 3)}
				y={L.statY(narrow ? 1 : 0) + T.small * 2.6 + T.num * 1.3}
				className="wt-film-type wt-film-loss"
				style={{ fontSize: T.small * 1.1 }}
			>
				<tspan style={{ textDecoration: "line-through" }}>
					{price4(ROW.simple)}
				</tspan>
				{` ${t(narrow ? copy.simpleShort : copy.simple)}`}
			</text>
			<Lines
				name="mixed"
				text={t(narrow ? copy.mixedShort : copy.mixed)}
				x={margin}
				y={L.legY}
				size={text}
				maxWidth={room}
				anchor="start"
				className="wt-film-type wt-film-loss"
			/>

			<Brackets name="lock-average" glow />

			{/* The feed: messages in, trades out. */}
			{headline("f-head", copy.fHead)}
			{/* The answer, as the counts settle. */}
			<Lines
				name="f2-head"
				text={t(copy.f2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.fHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{MESSAGES.map((message, i) => (
				<g key={message.id} data-f={`msg-${i}`}>
					<rect
						data-f={`msg-${i}-box`}
						x={margin}
						y={L.msgY(i)}
						width={L.msgW}
						height={L.msgH}
						rx={8}
						className="wt-panel-shape"
					/>
					<text
						x={margin + 12}
						y={L.msgY(i) + L.msgH / 2 + text * 0.36}
						className="wt-film-num wt-film-dim"
						style={{ fontSize: text }}
					>
						{narrow ? message.received.slice(0, 5) : message.received}
					</text>
					<text
						x={margin + (narrow ? 62 : L.msgW * 0.28)}
						y={L.msgY(i) + L.msgH / 2 + text * 0.36}
						className={`wt-film-type ${kindTone[message.kind]}`}
						style={{ fontSize: text }}
					>
						{t(kindCopy[message.kind])}
					</text>
					<text
						x={margin + L.msgW - 12}
						y={L.msgY(i) + L.msgH / 2 + text * 0.36}
						textAnchor="end"
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{message.quantity !== undefined && message.price !== undefined
							? `${message.trade} · ${count(message.quantity)} @ ${usd(message.price)}`
							: message.trade}
					</text>
				</g>
			))}
			{(
				[
					["c-messages", copy.messages, "0"],
					["c-trades", copy.trades, "0"],
					["c-contracts", copy.contracts, "0"],
				] as const
			).map(([name, tag, value], i) => (
				<g key={name} data-f={name}>
					<text
						x={narrow ? margin + i * (room / 3) : L.countX(i)}
						y={(narrow ? H * 0.71 : L.countY(i)) + T.small}
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(tag).toUpperCase()}
					</text>
					<text
						data-f={`${name}-n`}
						x={narrow ? margin + i * (room / 3) : L.countX(i)}
						y={(narrow ? H * 0.71 : L.countY(i)) + T.small + T.num * 1.3}
						className={`wt-film-num ${i ? "wt-film-accent" : "wt-film-dim"}`}
						style={{ fontSize: narrow ? T.num : T.num * 1.2 }}
					>
						{value}
					</text>
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
	/** A line lands slightly large and settles, without overshoot. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const num = (name: string) => one<SVGTextElement>(name);
	const heads = [
		"r-head",
		"f-head",
		"f2-head",
		"a-head",
		"a2-head",
		"x-head",
	].map((name) => one(name));
	const prints = PRINTS.map((_, i) => one(`print-${i}`));
	const stats = ["s-contracts", "s-trades", "s-premium", "s-average"].map(
		(name) => one(name),
	);
	const msgs = MESSAGES.map((_, i) => one(`msg-${i}`));
	const counters = ["c-messages", "c-trades", "c-contracts"].map((name) =>
		one(name),
	);
	const lockAverage = one<SVGGraphicsElement>("lock-average");

	d.hidden([
		...flat("q"),
		...heads,
		...prints,
		one("sum-rule"),
		...stats,
		one("simple"),
		one("mixed"),
		lockAverage,
		...msgs,
		...counters,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a simple average ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 4.8);
	word(one("q-big"), 5.1);

	// ——— row: two prints, one row ———
	tl.addLabel("row", 8.6);
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	show(prints[0], 9.3, "right");
	show(prints[1], 9.6, "right");
	show(one("sum-rule"), 10.2);
	show([stats[0], stats[1]], 10.4);
	d.count(
		num("s-contracts-n"),
		ROW.contracts,
		10.5,
		(v) => count(Math.round(v)),
		0,
		0.6,
	);
	d.count(
		num("s-trades-n"),
		ROW.trades,
		10.5,
		(v) => String(Math.round(v)),
		0,
		0.6,
	);

	// ——— feed: six messages, two trades ———
	tl.addLabel("feed", 13.6);
	hide([heads[0], ...prints, one("sum-rule"), stats[0], stats[1]], 13.6);
	show(heads[1], 13.95);
	show(counters, 14.2);
	let before = { trades: 0, contracts: 0 };
	MESSAGES.forEach((message, i) => {
		const time = 14.6 + i;
		show(msgs[i], time, "right");
		d.count(
			num("c-messages-n"),
			i + 1,
			time + 0.2,
			(v) => String(Math.round(v)),
			i,
			0.3,
		);
		const view = VIEWS[i];
		if (view.trades !== before.trades)
			d.count(
				num("c-trades-n"),
				view.trades,
				time + 0.3,
				(v) => String(Math.round(v)),
				before.trades,
				0.4,
			);
		if (view.contracts !== before.contracts)
			d.count(
				num("c-contracts-n"),
				view.contracts,
				time + 0.3,
				(v) => count(Math.round(v)),
				before.contracts,
				0.5,
			);
		// What a message did to the view: nothing, a removal, or a fix.
		if (message.kind === "duplicate")
			tl.to(msgs[i], { opacity: 0.5, duration: 0.3 }, time + 0.6);
		if (message.kind === "cancel") {
			const target = MESSAGES.findIndex(
				(m) => m.kind === "new" && m.trade === message.trade,
			);
			tl.to(
				[msgs[i], msgs[target]],
				{ opacity: 0.45, duration: 0.3 },
				time + 0.6,
			);
		}
		if (message.kind === "correct") {
			const target = MESSAGES.findIndex(
				(m) => m.kind === "new" && m.trade === message.trade,
			);
			tl.to(msgs[target], { opacity: 0.45, duration: 0.3 }, time + 0.6);
		}
		before = view;
	});
	show(heads[2], 20.4);

	// ——— average: the hero. The two clean trades, weighted by size. ———
	tl.addLabel("average", 24);
	hide([heads[1], heads[2], ...msgs, ...counters], 24.0);
	show(heads[3], 24.35);
	show(prints[0], 24.4, "right");
	show(prints[1], 24.6, "right");
	show(one("sum-rule"), 24.8);
	show([stats[0], stats[1]], 24.9);
	show(stats[2], 25.3);
	d.count(
		num("s-premium-n"),
		ROW.premium,
		25.4,
		(v) => usd(Math.round(v / 100) * 100, 0),
		0,
		0.7,
	);
	show(stats[3], 26.1);
	d.count(
		num("s-average-n"),
		ROW.weighted,
		26.2,
		(v) => price4(Math.round(v * 100) / 100),
		ROW.simple,
		0.8,
	);
	show(one("simple"), 27.1);
	// Round the average and the simple one struck under it: the pair is the answer.
	d.lock(lockAverage, 27.4, { around: [stats[3], one("simple")], pad: 6 });
	tl.addLabel("hero-lock", 27.4);
	show(heads[4], 27.4);

	// ——— leg: another contract stays out ———
	tl.addLabel("leg", 31);
	d.swap([heads[3], heads[4]], heads[5], 31.0);
	hide(lockAverage, 31.0);
	show(one("mixed"), 31.6);

	// ——— claim ———
	tl.addLabel("claim", 35.6);
	hide(
		[
			heads[5],
			...prints,
			one("sum-rule"),
			...stats,
			one("simple"),
			one("mixed"),
		],
		35.6,
	);
	word(one("z-big"), 35.9);
	show(one("z-sub"), 36.3);

	// ——— next ———
	tl.addLabel("next", 40);
	hide(kids("claim"), 40.0);
	d.close(40.0);
	return tl;
}

export const tradeRecordsFilm: Film = {
	id: "trade-records",
	label: [
		`Tape rows, as a short film: two prints of the Oct 18 105 call, ${count(PRINTS[0].quantity)} at ${usd(PRINTS[0].price)} and ${count(PRINTS[1].quantity)} at ${usd(PRINTS[1].price)}, built into one row of ${count(ROW.contracts)} contracts and ${ROW.trades} trades with ${usd(ROW.premium, 0)} of premium and an average of ${price4(ROW.weighted)}, not the simple ${price4(ROW.simple)}, and without the block's 110 call leg; then ${MESSAGES.length} feed messages, a duplicate, a bust and its cancel, and a corrected price, that represent ${LAST.trades} trades and ${count(LAST.contracts)} contracts`,
		`成交记录短片：10月18日 105 看涨的两笔成交，${count(PRINTS[0].quantity)} 张 ${usd(PRINTS[0].price)} 和 ${count(PRINTS[1].quantity)} 张 ${usd(PRINTS[1].price)}，合成一行：${count(ROW.contracts)} 张、${ROW.trades} 笔、权利金 ${usd(ROW.premium, 0)}、平均价 ${price4(ROW.weighted)}，而不是简单平均 ${price4(ROW.simple)}，也不并入大单的 110 看涨腿；以及 ${MESSAGES.length} 条数据消息：一条重复、一笔被取消的成交、一次价格更正，最终代表 ${LAST.trades} 笔成交、${count(LAST.contracts)} 张`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Tape rows", "成交记录"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "row", label: ["One row", "一行"] },
		{ id: "feed", label: ["The feed", "数据消息"] },
		{ id: "average", label: ["The average", "平均价"] },
		{ id: "leg", label: ["Another contract", "另一张合约"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
