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
import { textWidth } from "../walkthrough/text-measure";
import {
	aggregate,
	CONTRACT_MULTIPLIER,
	premiumContribution,
	price4,
	sources,
} from "./trade-records-model";

/*
 * Two clean 105-call prints become a row. Feed rows persist while only changed counters
 * swap in place, without invented partial trades. The hero is built from both premium contributions,
 * carried into their sum, then into the 50,500-share fraction; its settled quotient dominates.
 * The 110-call print stays outside the traced 105-call boundary, with all inputs retained.
 *
 *   open      0–4        Tape rows
 *   question  4–8.6      5 at $2.00, 500 at $2.15: average $2.075?
 *   row       8.6–13.6   two prints; settled 505 contracts and 2 trades
 *   feed      13.6–25    six incremental states; preserve the 2.1 s final inspection hold
 *   average   25–34.4    carried contributions → sum → fraction; lock at 31.0
 *   leg       34.4–40.6 excluded 110 call: 500 at $0.90; trace the 105-call boundary
 *   claim     40.6–45    one row, many prints; one trade, many messages
 *   next      45–47.5    Next: execution conditions
 */

const END = 47.5;
const PRINTS = [sources.t1, sources.t3];
const ROW = aggregate(["t1", "t3"]);
const LEG = sources.leg;
const CONTRIBUTIONS = [premiumContribution("t1"), premiumContribution("t3")];
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
const COUNTER_NAMES = ["c-messages", "c-trades", "c-contracts"] as const;
const READOUTS = VIEWS.map((view, i) => [i + 1, view.trades, view.contracts]);
const kindCopy: Record<FeedMessage["kind"], Copy> = {
	new: ["new", "新增"],
	duplicate: ["duplicate", "重复"],
	cancel: ["cancel", "撤销"],
	correct: ["correct", "更正"],
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
		legY: H * 0.88,
		heroX: margin + room * (narrow ? 0.49 : 0.53),
		fractionX: margin + room * 0.23,
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
	average: ["average paid", "平均成交价"],
	simple: [
		`${CONTRACT_MULTIPLIER} shares per contract · simple ${price4(ROW.simple)}`,
		`每张 ${CONTRACT_MULTIPLIER} 股 · 简单平均 ${price4(ROW.simple)}`,
	],
	shares: ["shares", "股数"],
	excluded: ["excluded", "不计入"],
	leg: [
		`${pick(LEG.contract, "en")} · ${count(LEG.quantity)} at ${usd(LEG.price)}`,
		`${pick(LEG.contract, "zh")} · ${count(LEG.quantity)} 张 ${usd(LEG.price)}`,
	],
	fHead: [
		"A feed sends messages, not trades.",
		"数据源发送的是消息，不是成交。",
	],
	messages: ["messages", "消息"],
	claimBig: [
		"Rows sum prints; messages are not trades.",
		"一行汇总成交；消息不是成交。",
	],
	claimSub: [
		"Per-contract print sums; count trades by ID.",
		"逐合约汇总成交；按成交编号计笔数。",
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
	const proofText = narrow ? T.body : text;
	// Equal-size mono operands can travel onto resting copies without a typeface/size jump.
	const carryText = T.num * 0.8;
	const cardBottom = L.printY(1) + L.printH;
	const cardWidth = (room - 12) / 2;
	const sumY = cardBottom + 14 + carryText;
	const shareY = sumY + H * 0.065;
	const premiumLeft = usd(CONTRIBUTIONS[0], 0);
	const premiumRight = usd(CONTRIBUTIONS[1], 0);
	const sumX = (prefix: string) => margin + textWidth(prefix, carryText);
	const sharePrefix = `${count(ROW.contracts)} × ${CONTRACT_MULTIPLIER} = `;
	const averageTagY = narrow ? H * 0.6 : H * 0.715 - T.num * 1.6 * 1.05;
	const proofTop =
		Math.min(averageTagY - T.small * 1.2, H * 0.66 - carryText) - 10;
	const proofRight = Math.min(
		W - 14,
		L.heroX + textWidth(price4(ROW.weighted), T.num * 1.6) + 8,
	);
	const landingMarks = [
		{
			name: "sum-left",
			x: margin,
			y: sumY,
			anchor: "start",
			value: premiumLeft,
			accent: true,
		},
		{
			name: "sum-right",
			x: sumX(`${premiumLeft} + `),
			y: sumY,
			anchor: "start",
			value: premiumRight,
			accent: true,
		},
		{
			name: "fraction-premium",
			x: L.fractionX,
			y: H * 0.66,
			anchor: "middle",
			value: usd(ROW.premium, 0),
			accent: false,
		},
		{
			name: "fraction-shares",
			x: L.fractionX,
			y: H * 0.735,
			anchor: "middle",
			value: count(ROW.shares),
			accent: false,
		},
	] as const;
	const stats: [string, Copy, string, number, number][] = [
		["s-contracts", copy.contracts, count(ROW.contracts), 0, 0],
		["s-trades", copy.trades, String(ROW.trades), 1, 0],
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
						className="wt-film-num"
						style={{ fontSize: narrow ? T.num : T.num * 1.1 }}
					>
						{value}
					</text>
				</g>
			))}
			{/* Two side-by-side proofs leave separate, unobstructed lanes for their values. */}
			{PRINTS.map((print, i) => (
				<g key={print.trade} data-f={`contribution-${i}`}>
					<rect
						x={margin + i * (cardWidth + 12)}
						y={L.printY(0)}
						width={cardWidth}
						height={cardBottom - L.printY(0)}
						rx={10}
						className="wt-panel-shape"
					/>
					<Word
						name={`contribution-${i}-inputs`}
						x={margin + i * (cardWidth + 12) + 12}
						y={L.printY(0) + proofText + 2}
						size={proofText}
						anchor="start"
						className="wt-film-num"
					>
						{`${count(print.quantity)} × ${usd(print.price)}`}
					</Word>
					<Word
						name={`contribution-${i}-multiplier`}
						x={margin + i * (cardWidth + 12) + 12}
						y={L.printY(0) + proofText * 2.15 + 2}
						size={proofText}
						anchor="start"
						className="wt-film-num"
					>
						{`× ${CONTRACT_MULTIPLIER} =`}
					</Word>
					<Word
						name={`contribution-${i}-value`}
						x={margin + i * (cardWidth + 12) + 12}
						y={cardBottom - 4}
						size={carryText}
						anchor="start"
						className="wt-film-num wt-film-accent"
					>
						{usd(CONTRIBUTIONS[i], 0)}
					</Word>
				</g>
			))}
			<g data-f="premium-sum">
				<Word
					name="sum-left"
					x={margin}
					y={sumY}
					size={carryText}
					anchor="start"
					className="wt-film-num wt-film-accent"
				>
					{premiumLeft}
				</Word>
				<Word
					name="sum-plus"
					x={sumX(`${premiumLeft} `)}
					y={sumY}
					size={carryText}
					anchor="start"
					className="wt-film-num"
				>
					+
				</Word>
				<Word
					name="sum-right"
					x={sumX(`${premiumLeft} + `)}
					y={sumY}
					size={carryText}
					anchor="start"
					className="wt-film-num wt-film-accent"
				>
					{premiumRight}
				</Word>
				<Word
					name="sum-equals"
					x={sumX(`${premiumLeft} + ${premiumRight} `)}
					y={sumY}
					size={carryText}
					anchor="start"
					className="wt-film-num"
				>
					=
				</Word>
				<Word
					name="premium-total"
					x={sumX(`${premiumLeft} + ${premiumRight} = `)}
					y={sumY}
					size={carryText}
					anchor="start"
					className="wt-film-num"
				>
					{usd(ROW.premium, 0)}
				</Word>
			</g>
			<g data-f="share-product">
				<Word
					name="share-prefix"
					x={margin}
					y={shareY}
					size={carryText}
					anchor="start"
					className="wt-film-num"
				>
					{sharePrefix}
				</Word>
				<Word
					name="share-total"
					x={sumX(sharePrefix)}
					y={shareY}
					size={carryText}
					anchor="start"
					className="wt-film-num"
				>
					{count(ROW.shares)}
				</Word>
				<Word
					name="share-product-unit"
					x={margin}
					y={shareY + proofText * 1.25}
					size={proofText}
					anchor="start"
					className="wt-film-type wt-film-dim"
				>
					{t(copy.shares)}
				</Word>
			</g>

			<g data-f="fraction">
				<Word
					name="fraction-premium"
					x={L.fractionX}
					y={H * 0.66}
					size={T.num * 0.8}
					className="wt-film-num"
				>
					{usd(ROW.premium, 0)}
				</Word>
				<path
					data-f="fraction-rule"
					d={`M${L.fractionX - room * 0.16} ${H * 0.68}h${room * 0.32}`}
					className="wt-film-link"
				/>
				<Word
					name="fraction-shares"
					x={L.fractionX}
					y={H * 0.735}
					size={T.num * 0.8}
					className="wt-film-num"
				>
					{count(ROW.shares)}
				</Word>
				<Word
					name="fraction-unit"
					x={L.fractionX}
					y={H * 0.77}
					size={T.small}
					className="wt-film-type wt-film-dim"
				>
					{t(copy.shares)}
				</Word>
				<Word
					name="fraction-equals"
					x={margin + room * 0.44}
					y={H * 0.715}
					size={T.num}
					className="wt-film-num"
				>
					=
				</Word>
			</g>
			<g data-f="s-average">
				<Word
					name="average-tag"
					x={L.heroX}
					y={averageTagY}
					size={T.small}
					anchor="start"
					className="wt-film-tag"
				>
					{t(copy.average).toUpperCase()}
				</Word>
				<Word
					name="s-average-n"
					x={L.heroX}
					y={H * 0.715}
					size={T.num * 1.6}
					anchor="start"
					className="wt-film-num wt-film-accent"
				>
					{price4(ROW.weighted)}
				</Word>
			</g>
			<Word
				name="simple"
				x={margin}
				y={H * 0.815}
				size={proofText}
				anchor="start"
				className="wt-film-type wt-film-dim"
			>
				{t(copy.simple)}
			</Word>
			{/* These stationary copies continue the carried image at its exact landing point.
			    Resting text fades in underneath, then each landing copy fades out in place. */}
			<g data-f="landing-covers">
				{landingMarks.map((mark) => (
					<Word
						key={mark.name}
						name={`${mark.name}-landing`}
						x={mark.x}
						y={mark.y}
						size={carryText}
						anchor={mark.anchor}
						className={`wt-film-num ${mark.accent ? "wt-film-accent" : ""}`}
					>
						{mark.value}
					</Word>
				))}
			</g>
			<path
				data-f="proof-boundary"
				d={`M${margin - 8} ${proofTop}H${proofRight}V${H * 0.835}H${margin - 8}Z`}
				className="wt-film-link"
			/>
			<Word
				name="proof-contract"
				x={proofRight - 8}
				y={proofTop - 8}
				size={T.small}
				anchor="end"
				className="wt-film-tag"
			>
				{t(PRINTS[0].contract).toUpperCase()}
			</Word>
			<g data-f="excluded-row">
				<rect
					x={margin}
					y={L.legY - L.printH / 2}
					width={room}
					height={L.printH * 1.15}
					rx={8}
					className="wt-panel-shape"
				/>
				<Word
					name="excluded-tag"
					x={margin + 12}
					y={L.legY - proofText * 0.4}
					size={T.small}
					anchor="start"
					className="wt-film-tag wt-film-warn"
				>
					{t(copy.excluded).toUpperCase()}
				</Word>
				<Word
					name="excluded-inputs"
					x={margin + 12}
					y={L.legY + proofText * 0.85}
					size={proofText}
					anchor="start"
					className="wt-film-num wt-film-dim"
				>
					{t(copy.leg)}
				</Word>
			</g>

			<Brackets name="lock-average" glow />

			{/* The feed: messages in, trades out. */}
			{headline("f-head", copy.fHead)}
			{/* History persists. A new row arrives with only its changed readouts. */}
			<g data-f="feed">
				{MESSAGES.map((message, i) => (
					<g key={message.id} data-f={`msg-${i}`}>
						<g
							data-f={`msg-${i}-content`}
							opacity={
								message.kind === "duplicate"
									? 0.5
									: message.kind === "cancel"
										? 0.45
										: 1
							}
						>
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
								className={
									message.kind === "duplicate"
										? "wt-film-type wt-film-dim"
										: "wt-film-type"
								}
								style={{ fontSize: text }}
							>
								{t(kindCopy[message.kind])}
							</text>
						</g>
						<text
							data-f={`msg-${i}-values`}
							opacity={
								message.kind === "duplicate"
									? 0.5
									: message.kind === "cancel"
										? 0.45
										: 1
							}
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
				{COUNTER_NAMES.map((name, col) => (
					<g key={name}>
						<text
							data-f={`${name}-tag`}
							x={narrow ? margin + col * (room / 3) : L.countX(col)}
							y={(narrow ? H * 0.71 : L.countY(col)) + T.small}
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{t(
								[copy.messages, copy.trades, copy.contracts][col],
							).toUpperCase()}
						</text>
						{READOUTS.map((values, i) =>
							i > 0 && values[col] === READOUTS[i - 1][col] ? null : (
								<text
									key={MESSAGES[i].id}
									data-f={`view-${i}-${name}-n`}
									x={narrow ? margin + col * (room / 3) : L.countX(col)}
									y={
										(narrow ? H * 0.71 : L.countY(col)) + T.small + T.num * 1.3
									}
									className={`wt-film-num ${col ? "wt-film-accent" : "wt-film-dim"}`}
									style={{ fontSize: narrow ? T.num : T.num * 1.2 }}
								>
									{count(values[col])}
								</text>
							),
						)}
					</g>
				))}
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
	const L = layout(context.width);
	const d = createDirector(context, L, END);
	const { tl, one, kids, show, hide } = d;
	const flat = (name: string) =>
		kids(name).flatMap((el) =>
			el.tagName === "g" && !el.hasAttribute("data-f")
				? [...el.children]
				: [el],
		);
	/** Scale only the single text mark, never a group. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	/** A whole proof fades in place: its inputs and outputs always agree. */
	const fade = (target: Element | Element[], time: number, duration = 0.5) =>
		tl.fromTo(
			target,
			{ opacity: 0 },
			{ opacity: 1, duration, immediateRender: false },
			time,
		);
	const carryOnto = (
		from: string,
		to: string,
		at: number,
		duration: number,
		arc: "x" | "y" = "x",
	) => {
		const landing = one<SVGGraphicsElement>(`${to}-landing`);
		d.carry(one<SVGGraphicsElement>(from), landing, at, {
			duration,
			arc,
		});
		// The image is fully settled at arrival. These identical, stationary handoffs
		// introduce no new figure or motion during its one-second quiet interval.
		fade(one(to), at + duration, 0.3);
		tl.fromTo(
			landing,
			{ opacity: 1 },
			{
				opacity: 0,
				duration: 0.3,
				ease: "power2.inOut",
				immediateRender: false,
			},
			at + duration + 0.3,
		);
	};

	const prints = PRINTS.map((_, i) => one(`print-${i}`));
	const stats = [one("s-contracts"), one("s-trades")];
	const messages = MESSAGES.map((_, i) => one(`msg-${i}`));
	const counterTags = COUNTER_NAMES.map((name) => one(`${name}-tag`));
	const readout = (i: number, col: number) =>
		one(`view-${i}-${COUNTER_NAMES[col]}-n`);
	const changedReadouts = READOUTS.flatMap((values, i) =>
		values.flatMap((value, col) =>
			i === 0 || value !== READOUTS[i - 1][col] ? [readout(i, col)] : [],
		),
	);
	const contributions = PRINTS.map((_, i) => one(`contribution-${i}`));
	const calculation = [
		...contributions,
		one("premium-sum"),
		one("share-product"),
		one("fraction"),
		one("s-average"),
		one("simple"),
	];
	const heads = ["r-head", "f-head", "a-head", "a2-head", "x-head"].map(
		(name) => one(name),
	);
	const lockAverage = one<SVGGraphicsElement>("lock-average");

	d.hidden([
		...flat("q"),
		...heads,
		...prints,
		one("sum-rule"),
		...stats,
		...messages,
		...counterTags,
		...changedReadouts,
		...calculation,
		...kids("landing-covers"),
		one("sum-left"),
		one("sum-right"),
		one("fraction-premium"),
		one("fraction-shares"),
		lockAverage,
		one("excluded-row"),
		one("proof-boundary"),
		one("proof-contract"),
		...kids("claim"),
	]);

	tl.addLabel("open", 0);
	d.open(0);

	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	show(one("q-line"), 4.8);
	word(one("q-big"), 5.1);

	// The two fixed prints cannot imply an interpolated total.
	tl.addLabel("row", 8.6);
	hide(flat("q"), 8.6);
	show(one("r-head"), 8.8);
	show(prints[0], 9.3, "right");
	show(prints[1], 9.6, "right");
	show(one("sum-rule"), 10.2);
	fade(stats, 10.4);

	tl.addLabel("feed", 13.6);
	hide([one("r-head"), ...prints, one("sum-rule"), ...stats], 13.6);
	show(one("f-head"), 13.95);
	// Keep history, counter labels and unchanged values in place. Changed old values
	// leave before the new event; its row and settled readouts then arrive together.
	const activeReadouts: Element[] = [];
	MESSAGES.forEach((message, i) => {
		const time = 14.6 + i * 1.6;
		const incoming = [messages[i], ...(i === 0 ? counterTags : [])];
		READOUTS[i].forEach((value, col) => {
			if (i > 0 && value === READOUTS[i - 1][col]) return;
			if (i > 0) hide(activeReadouts[col], time - 0.3, 0.3, 0);
			const next = readout(i, col);
			incoming.push(next);
			activeReadouts[col] = next;
		});
		fade(incoming, time, 0.3);
		if (message.kind === "cancel" || message.kind === "correct") {
			const target = MESSAGES.findIndex(
				(prior) => prior.kind === "new" && prior.trade === message.trade,
			);
			tl.fromTo(
				one(`msg-${target}-content`),
				{ opacity: 1 },
				{ opacity: 0.45, duration: 0.3, immediateRender: false },
				time,
			);
			tl.fromTo(
				one(`msg-${target}-values`),
				{ opacity: 1 },
				{ opacity: 0.78, duration: 0.3, immediateRender: false },
				time,
			);
		}
	});

	tl.addLabel("average", 25);
	hide([one("f-head"), one("feed")], 25);
	show(one("a-head"), 25.35);
	// Both proofs retain their original settlement and 1 s quiet intervals.
	fade(contributions, 25.4, 0.3);
	carryOnto("contribution-0-value", "sum-left", 27.9, 0.4);
	carryOnto("contribution-1-value", "sum-right", 27.9, 0.4);
	hide(contributions, 27.9, 0.3, 0);
	// Surrounding operators/results arrive first; carried operands stay hidden until landing.
	fade([one("premium-sum"), one("share-product")], 27.0, 0.3);
	fade(one("simple"), 25.4, 0.3);
	// The numerator goes across at its source height, then down, clearing the equals-sign
	// column; the denominator drops first, passing the rule's height before it is drawn.
	carryOnto("premium-total", "fraction-premium", 29.3, 0.5, "x");
	carryOnto("share-total", "fraction-shares", 29.3, 0.5, "y");
	// Clear source glyphs early in the flight, with explicit endpoints for reverse seeks.
	tl.fromTo(
		[one("premium-sum"), one("share-product")],
		{ opacity: 1 },
		{ opacity: 0, duration: 0.3, ease: "power3.out", immediateRender: false },
		29.3,
	);
	fade(one("fraction"), 29.5, 0.3);
	fade(one("s-average"), 30.2, 0.3);
	// Draw from the left after the descending denominator clears that part of the rule.
	d.trace(one<SVGPathElement>("fraction-rule"), 29.5, {
		duration: 0.3,
		ease: "power3.in",
	});

	d.lock(lockAverage, 31.0, { around: one("s-average"), pad: 6 });
	tl.addLabel("hero-lock", 31.0);
	show(one("a2-head"), 30.5);

	// The 105-call calculation stays intact; the other call sits outside its boundary.
	// Brackets settle at 31.45 and stand for the original 3.15 s before leaving.
	tl.addLabel("leg", 34.4);
	d.swap([one("a-head"), one("a2-head")], one("x-head"), 34.4);
	hide(lockAverage, 34.6);
	fade(one("excluded-row"), 35.5);
	d.trace(one<SVGPathElement>("proof-boundary"), 37.0, { duration: 0.8 });
	fade(one("proof-contract"), 37.0);

	tl.addLabel("claim", 40.6);
	hide(
		[
			one("x-head"),
			...calculation,
			one("excluded-row"),
			one("proof-boundary"),
			one("proof-contract"),
		],
		40.6,
	);
	word(one("z-big"), 40.9);
	show(one("z-sub"), 41.3);

	tl.addLabel("next", 45);
	hide(kids("claim"), 45.0);
	d.close(45.0);
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
