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
 * average $2.075? One row built from those two prints answers: 505 contracts and 2 trades,
 * $108,500 of premium, $2.1485 a share, and the 110 leg doesn't belong in it. Then the
 * feed: six messages, a duplicate, a bust and a correction, that come to two trades and
 * 505 contracts.
 *
 *   open      0–4      "Tape rows"
 *   question  4–9.5    5 at $2.00, 500 at $2.15: average $2.075?
 *   row       9.5–20   two prints; 505 and 2; $108,500; $2.1485; not the 110 leg
 *   feed      20–36.5  new, duplicate, new, cancel, new, correct: 6 messages, 2 trades
 *   claim     36.5–39.5 one row, many prints; one trade, many messages
 *   next      39.5–42  Next: execution conditions
 */

const END = 42;
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
	r0: [
		"One row can stand for several prints of one contract.",
		"一行可以代表同一合约的多笔成交。",
	],
	r0Short: ["One row, two prints.", "一行，两笔成交。"],
	r1: [
		`Contracts add to ${count(ROW.contracts)}; the row is ${ROW.trades} trades. Keep both counts.`,
		`张数合计 ${count(ROW.contracts)}；这一行是 ${ROW.trades} 笔成交。两个数都要保留。`,
	],
	r1Short: [
		`${count(ROW.contracts)} contracts, ${ROW.trades} trades.`,
		`${count(ROW.contracts)} 张，${ROW.trades} 笔。`,
	],
	r2: [
		`Premium adds print by print: ${usd(ROW.premium, 0)}. Over ${count(ROW.contracts * 100)} shares, that's ${price4(ROW.weighted)}.`,
		`权利金逐笔相加：${usd(ROW.premium, 0)}。除以 ${count(ROW.contracts * 100)} 股，为 ${price4(ROW.weighted)}。`,
	],
	r2Short: [
		`Weighted: ${price4(ROW.weighted)}.`,
		`加权：${price4(ROW.weighted)}。`,
	],
	r3: [
		`The block's 110 call leg is another contract: it doesn't belong in this row.`,
		"大单的 110 看涨腿是另一张合约：不能并进这一行。",
	],
	r3Short: ["Not the 110 leg.", "不并入 110 那条腿。"],
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
	f0: [
		"A feed sends messages, not trades: one new print, then the same report again.",
		"数据源发送的是消息，不是成交：一条新成交，接着同一份报告又来一次。",
	],
	f0Short: ["Messages, not trades.", "是消息，不是成交。"],
	f1: [
		"T-2 arrives far above the quote; the venue busts it and a cancel removes it.",
		"T-2 成交价远高于报价；交易场所取消了它，撤销消息把它移除。",
	],
	f1Short: ["A bust: cancelled.", "被取消：撤销。"],
	f2: [
		"The block arrives with a mistyped $2.51, and a correction sets it to $2.15.",
		"大单以误录的 $2.51 到达，更正消息把它改为 $2.15。",
	],
	f2Short: ["A typo: corrected.", "录错：已更正。"],
	f3: [
		`${MESSAGES.length} messages, ${LAST.trades} trades, ${count(LAST.contracts)} contracts. Count by trade ID.`,
		`${MESSAGES.length} 条消息，${LAST.trades} 笔成交，${count(LAST.contracts)} 张。按成交编号计数。`,
	],
	f3Short: [
		`${MESSAGES.length} messages, ${LAST.trades} trades.`,
		`${MESSAGES.length} 条消息，${LAST.trades} 笔成交。`,
	],
	messages: ["messages", "消息"],
	claimBig: [
		"A row is a sum; a message is not a trade.",
		"一行是加总；一条消息不是一笔成交。",
	],
	claimSub: [
		"Sum prints of one contract with their sizes, keep the trade count, and rebuild the view by trade ID after every duplicate, cancel and correction.",
		"只把同一合约的成交按数量加总，保留成交笔数；每次重复、撤销和更正之后，都按成交编号重建视图。",
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
			{headline("r0", copy.r0, copy.r0Short)}
			{headline("r1", copy.r1, copy.r1Short)}
			{headline("r2", copy.r2, copy.r2Short)}
			{headline("r3", copy.r3, copy.r3Short)}
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

			{/* The feed: messages in, trades out. */}
			{headline("f0", copy.f0, copy.f0Short)}
			{headline("f1", copy.f1, copy.f1Short)}
			{headline("f2", copy.f2, copy.f2Short)}
			{headline("f3", copy.f3, copy.f3Short)}
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
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			time,
		);
	const num = (name: string) => one<SVGTextElement>(name);
	const heads = ["r0", "r1", "r2", "r3", "f0", "f1", "f2", "f3"].map((name) =>
		one(name),
	);
	const prints = PRINTS.map((_, i) => one(`print-${i}`));
	const stats = ["s-contracts", "s-trades", "s-premium", "s-average"].map(
		(name) => one(name),
	);
	const msgs = MESSAGES.map((_, i) => one(`msg-${i}`));
	const counters = ["c-messages", "c-trades", "c-contracts"].map((name) =>
		one(name),
	);

	d.hidden([
		...flat("q"),
		...heads,
		...prints,
		one("sum-rule"),
		...stats,
		one("simple"),
		one("mixed"),
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
	show(one("q-line"), 5.1);
	word(one("q-big"), 6.6);

	// ——— row: two prints, one row ———
	tl.addLabel("row", 9.5);
	hide(flat("q"), 9.5);
	show(heads[0], 9.7, "above");
	show(prints[0], 10.0, "right");
	show(prints[1], 10.3, "right");
	d.swap(heads[0], heads[1], 11.6);
	show(one("sum-rule"), 11.9);
	show([stats[0], stats[1]], 12.1);
	d.count(
		num("s-contracts-n"),
		ROW.contracts,
		12.2,
		(v) => count(Math.round(v)),
		0,
		0.6,
	);
	d.count(
		num("s-trades-n"),
		ROW.trades,
		12.2,
		(v) => String(Math.round(v)),
		0,
		0.6,
	);
	d.swap(heads[1], heads[2], 14.0);
	show(stats[2], 14.4);
	d.count(
		num("s-premium-n"),
		ROW.premium,
		14.5,
		(v) => usd(Math.round(v / 100) * 100, 0),
		0,
		0.7,
	);
	show(stats[3], 15.3);
	d.count(
		num("s-average-n"),
		ROW.weighted,
		15.4,
		(v) => price4(Math.round(v * 100) / 100),
		ROW.simple,
		0.7,
	);
	show(one("simple"), 16.0);
	d.swap(heads[2], heads[3], 17.4);
	show(one("mixed"), 17.8);

	// ——— feed: six messages, two trades ———
	tl.addLabel("feed", 20);
	hide(
		[
			heads[3],
			...prints,
			one("sum-rule"),
			...stats,
			one("simple"),
			one("mixed"),
		],
		20.0,
	);
	show(heads[4], 20.2, "above");
	show(counters, 20.4);
	const at = [20.8, 22.2, 24.4, 25.8, 28.4, 29.8];
	const heads2 = [null, null, heads[5], null, heads[6], null];
	let before = { trades: 0, contracts: 0 };
	MESSAGES.forEach((message, i) => {
		const time = at[i];
		const head = heads2[i];
		if (head) d.swap(heads[i === 2 ? 4 : 5], head, time - 0.4);
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
	d.swap(heads[6], heads[7], 32.2);
	tl.to(
		[one("c-trades"), one("c-contracts")],
		{
			scale: 1.06,
			transformOrigin: "0% 50%",
			duration: 0.25,
			yoyo: true,
			repeat: 1,
		},
		32.6,
	);

	// ——— claim ———
	tl.addLabel("claim", 36.5);
	hide([heads[7], ...msgs, ...counters], 36.5);
	word(one("z-big"), 36.8);
	show(one("z-sub"), 37.2);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
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
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
