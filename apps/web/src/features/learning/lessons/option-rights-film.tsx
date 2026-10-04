import { type Copy, pick, signedUsd, usd } from "@/content/world";
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
	ASSIGNED,
	cellCopy,
	exerciseCase,
	positionCopy,
	type Right,
	type Side,
	tradeCopy,
	writers,
} from "./option-rights-model";

/*
 * Holders and writers, as a film. It opens on a short Oct 18 95 put and asks what being
 * assigned means. The grid of four positions answers: the holder of a call may buy, its
 * writer must sell; the holder of a put may sell, its writer must buy at $95. Then the
 * same buy or sell opens or closes depending on where you start. Last, an exercise goes
 * to the clearinghouse, which assigns it at random: Eli, not Ben, pays $9,500 for shares
 * worth $8,800.
 *
 *   open      0–4      "Holders and writers"
 *   question  4–9.5    short 1 Oct 18 95 put: if assigned?
 *   matrix    9.5–19   long call, short call, long put, short put
 *   track     19–29    buy to open, sell to close, sell to open, buy to close
 *   assign    29–39.5  exercise; the clearinghouse; Eli; settle; cut: the claim
 *   next      39.5–42  Next: premium, payoff and profit
 */

const END = 42;
const RIGHTS: readonly Right[] = ["call", "put"];
const SIDES: readonly Side[] = ["long", "short"];
const PUT = exerciseCase("put");
/** The track's moves: where each starts and what it does. */
const MOVES = [
	{ from: 0, trade: "buy" },
	{ from: 1, trade: "sell" },
	{ from: 0, trade: "sell" },
	{ from: -1, trade: "buy" },
] as const;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const labelW = narrow ? 64 : room * 0.18;
	const cellW = (room - labelW - 12) / 2;
	const cellH = H * (narrow ? 0.24 : 0.22);
	return {
		...frame,
		labelW,
		cellW,
		cellH,
		cellX: (c: number) => margin + labelW + c * (cellW + 12),
		cellY: (r: number) => H * (narrow ? 0.34 : 0.32) + r * (cellH + 12),
		trackY: H * 0.52,
		stopX: (pos: number) => width / 2 + pos * room * 0.34,
		nodeH: H * (narrow ? 0.12 : 0.11),
		nodeW: room * (narrow ? 0.3 : 0.22),
		writerY: (i: number) =>
			H * (narrow ? 0.3 : 0.3) + i * H * (narrow ? 0.17 : 0.16),
	};
}

const copy = {
	title: ["Holders and writers", "持有人与义务方"],
	titleSub: ["rights and obligations", "权利与义务"],
	qTag: ["your position", "你的持仓"],
	qBig: ["short 1 Oct 18 95 put", "空头 1 张 10月18日 95 看跌"],
	qLine: [
		"If you're assigned, what must you do?",
		"如果被指派，你必须做什么？",
	],
	call: ["call", "看涨"],
	put: ["put", "看跌"],
	long: ["long · holder", "多头 · 持有人"],
	longShort: ["long", "多头"],
	short: ["short · writer", "空头 · 义务方"],
	shortShort: ["short", "空头"],
	heads: {
		"call-long": [
			"Long a call: the right to buy 100 ALFA at $100, if you choose.",
			"看涨多头：有权按 $100 买 100 股 ALFA，由你决定。",
		],
		"call-short": [
			"Its writer received the premium and must sell at $100 if assigned.",
			"它的义务方收了权利金，被指派时必须按 $100 卖出。",
		],
		"put-long": [
			"A put turns it around: the right to sell 100 ALFA at $95.",
			"看跌正好相反：有权按 $95 卖 100 股 ALFA。",
		],
		"put-short": [
			"Its writer must buy at $95 if assigned, however far ALFA has fallen.",
			"它的义务方被指派时必须按 $95 买入，无论 ALFA 跌了多少。",
		],
	},
	headsShort: {
		"call-long": ["Long call: the right to buy.", "看涨多头：有权买入。"],
		"call-short": ["Short call: must sell.", "看涨空头：必须卖出。"],
		"put-long": ["Long put: the right to sell.", "看跌多头：有权卖出。"],
		"put-short": ["Short put: must buy at $95.", "看跌空头：必须按 $95 买入。"],
	},
	trackHead: [
		"The same buy or sell can open a position or close one.",
		"同样的买入或卖出，可能是开仓，也可能是平仓。",
	],
	trackHeadShort: ["A trade can open or close.", "交易可能开仓或平仓。"],
	assignHead: [
		`Oct 18: ALFA closes at $${PUT.close}. You exercise the 95 put you bought from Ben.`,
		`10月18日：ALFA 收于 $${PUT.close}。你对从 Ben 那里买的 95 看跌行权。`,
	],
	assignHeadShort: [
		`ALFA $${PUT.close}: you exercise.`,
		`ALFA $${PUT.close}：你行权。`,
	],
	clearHead: [
		"The notice goes to the clearinghouse, not to Ben.",
		"行权通知交给清算所，而不是 Ben。",
	],
	clearHeadShort: ["It goes to the clearinghouse.", "通知交给清算所。"],
	pickHead: [
		"It assigns one writer at random. This time: Eli.",
		"清算所随机指派一位义务方。这次是 Eli。",
	],
	pickHeadShort: ["Assigned at random: Eli.", "随机指派：Eli。"],
	you: ["you · holder", "你 · 持有人"],
	youShort: ["you", "你"],
	clearing: ["clearinghouse", "清算所"],
	shortN: (n: number): Copy => [`short ${n}`, `空头 ${n} 张`],
	sold: ["sold you yours", "卖给你的那位"],
	paysTag: ["Eli pays", "Eli 支付"],
	worthTag: ["for shares worth", "买入的股票价值"],
	settleLine: [
		`You gain ${usd(PUT.gain, 0)}, or ${usd(PUT.net, 0)} after the ${usd(PUT.premium, 0)} premium.`,
		`你获得 ${usd(PUT.gain, 0)}，扣除 ${usd(PUT.premium, 0)} 权利金后为 ${usd(PUT.net, 0)}。`,
	],
	claimBig: [
		"The holder decides; a writer is assigned.",
		"持有人决定；义务方被指派。",
	],
	claimSub: [
		"Buying or selling opens or closes; assignment goes to a random writer, not your counterparty.",
		"买卖可能开仓或平仓；指派落在随机的义务方身上，而不是你的交易对手。",
	],
	nextBig: [
		"Next: premium, payoff and profit",
		"下一课：权利金、到期价值与盈亏",
	],
	nextSub: ["both sides of the trade", "交易的两方"],
} as const;

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
	const text = narrow ? T.small * 1.15 : T.body;
	const cellLine = (r: number, k: number) =>
		L.cellY(r) + L.cellH * [0.32, 0.56, 0.8][k];
	const writerX = margin + room - L.nodeW;
	const clearX = W / 2 - L.nodeW / 2;
	const clearY = L.writerY(1);
	const youY = L.writerY(1);
	const mid = (y: number) => y + L.nodeH / 2;
	const node = (
		name: string,
		x: number,
		y: number,
		label: string,
		sub: string,
		focus = false,
	) => (
		<g data-f={name}>
			<rect
				x={x}
				y={y}
				width={L.nodeW}
				height={L.nodeH}
				rx={10}
				className={focus ? "wt-focus-shape" : "wt-panel-shape"}
			/>
			<text
				x={x + L.nodeW / 2}
				y={y + L.nodeH * 0.45}
				textAnchor="middle"
				className="wt-film-type"
				style={{ fontSize: text }}
			>
				{label}
			</text>
			<text
				x={x + L.nodeW / 2}
				y={y + L.nodeH * 0.78}
				textAnchor="middle"
				className="wt-film-type wt-film-dim"
				style={{ fontSize: T.small }}
			>
				{sub}
			</text>
		</g>
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
					name="q-big"
					text={t(copy.qBig)}
					x={W / 2}
					y={H * 0.32 + T.title * 1.6}
					size={T.title}
					maxWidth={room}
					className="wt-film-num"
				/>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.74}
					size={T.head}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
			</g>

			{/* Four positions. */}
			{(["call-long", "call-short", "put-long", "put-short"] as const).map(
				(key) => (
					<g key={key}>
						{headline(`h-${key}`, copy.heads[key], copy.headsShort[key])}
					</g>
				),
			)}
			<g data-f="matrix">
				{RIGHTS.map((right, c) => (
					<text
						key={right}
						x={L.cellX(c) + L.cellW / 2}
						y={L.cellY(0) - T.small * 1.2}
						textAnchor="middle"
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(copy[right]).toUpperCase()}
					</text>
				))}
				{SIDES.map((side, r) => (
					<text
						key={side}
						x={margin}
						y={L.cellY(r) + L.cellH / 2 + T.small * 0.36}
						className={`wt-film-type ${side === "long" ? "wt-film-accent" : "wt-film-warn"}`}
						style={{ fontSize: narrow ? T.small : T.body }}
					>
						{t(
							side === "long"
								? narrow
									? copy.longShort
									: copy.long
								: narrow
									? copy.shortShort
									: copy.short,
						)}
					</text>
				))}
				{RIGHTS.flatMap((right, c) =>
					SIDES.map((side, r) => {
						const cell = cellCopy[right][side];
						return (
							<g key={`${right}-${side}`} data-f={`cell-${right}-${side}`}>
								<rect
									x={L.cellX(c)}
									y={L.cellY(r)}
									width={L.cellW}
									height={L.cellH}
									rx={12}
									className="wt-panel-shape"
								/>
								<rect
									data-f={`cellf-${right}-${side}`}
									x={L.cellX(c)}
									y={L.cellY(r)}
									width={L.cellW}
									height={L.cellH}
									rx={12}
									className="wt-focus-shape"
								/>
								<text
									x={L.cellX(c) + L.cellW / 2}
									y={cellLine(r, 0)}
									textAnchor="middle"
									className={`wt-film-type ${side === "long" ? "wt-film-accent" : "wt-film-warn"}`}
									style={{ fontSize: text * 1.1 }}
								>
									{t(cell.duty)}
								</text>
								<text
									x={L.cellX(c) + L.cellW / 2}
									y={cellLine(r, 1)}
									textAnchor="middle"
									className="wt-film-type"
									style={{ fontSize: text }}
								>
									{t(narrow ? cell.brief : cell.terms)}
								</text>
								<text
									x={L.cellX(c) + L.cellW / 2}
									y={cellLine(r, 2)}
									textAnchor="middle"
									className="wt-film-type wt-film-dim"
									style={{ fontSize: T.small }}
								>
									{t(cell.when)}
								</text>
							</g>
						);
					}),
				)}
			</g>

			{/* Open or close. */}
			{headline("k-head", copy.trackHead, copy.trackHeadShort)}
			<g data-f="track">
				<path
					d={`M${L.stopX(-1)} ${L.trackY}H${L.stopX(1)}`}
					className="wt-axis"
					strokeWidth={2}
				/>
				{[-1, 0, 1].map((pos) => (
					<g key={pos}>
						<circle
							cx={L.stopX(pos)}
							cy={L.trackY}
							r={5}
							className="wt-film-ghost"
						/>
						<text
							x={L.stopX(pos)}
							y={L.trackY + T.body * 2.2}
							textAnchor="middle"
							className={`wt-film-type ${pos > 0 ? "wt-film-accent" : pos < 0 ? "wt-film-warn" : "wt-film-dim"}`}
							style={{ fontSize: text }}
						>
							{t(positionCopy(pos))}
						</text>
					</g>
				))}
				<circle
					data-f="dot"
					cx={L.stopX(0)}
					cy={L.trackY}
					r={9}
					className="wt-chip"
					stroke="var(--foreground)"
					strokeWidth={1.5}
				/>
			</g>
			{MOVES.map((move, i) => (
				<Word
					key={`${move.from}-${move.trade}`}
					name={`move-${i}`}
					x={W / 2}
					y={L.trackY - T.big * 0.75}
					size={T.title}
					className={`wt-film-type ${tradeCopy(move.from, move.trade)[0].endsWith("open") ? "wt-film-accent" : "wt-film-gain"}`}
				>
					{t(tradeCopy(move.from, move.trade))}
				</Word>
			))}

			{/* Exercise and assignment. */}
			{headline("a-head", copy.assignHead, copy.assignHeadShort)}
			{headline("c-head", copy.clearHead, copy.clearHeadShort)}
			{headline("p-head", copy.pickHead, copy.pickHeadShort)}
			<g data-f="assign">
				{node(
					"n-you",
					margin,
					youY,
					t(narrow ? copy.youShort : copy.you),
					"95 put",
					true,
				)}
				<path
					data-f="arrow-in"
					d={`M${margin + L.nodeW + 6} ${mid(youY)}H${clearX - 6}`}
					className="wt-film-riser"
				/>
				{node("n-clear", clearX, clearY, t(copy.clearing), "OCC")}
				{writers.map((w, i) => (
					<g key={w.id}>
						{node(
							`n-${w.id}`,
							writerX,
							L.writerY(i),
							w.name,
							w.id === "ben" && !narrow
								? `${t(copy.shortN(w.short))} · ${t(copy.sold)}`
								: t(copy.shortN(w.short)),
						)}
						<rect
							data-f={`pick-${w.id}`}
							x={writerX}
							y={L.writerY(i)}
							width={L.nodeW}
							height={L.nodeH}
							rx={10}
							className="wt-focus-shape"
							style={{ fillOpacity: 0 }}
						/>
						<path
							data-f={`arrow-${w.id}`}
							d={`M${clearX + L.nodeW + 6} ${mid(clearY)}L${writerX - 6} ${mid(L.writerY(i))}`}
							className={w.id === ASSIGNED ? "wt-film-riser" : "wt-film-link"}
						/>
					</g>
				))}
			</g>
			<g data-f="settle">
				{(
					[
						["s-pays", copy.paysTag, usd(PUT.cash, 0), "wt-film-loss"],
						["s-worth", copy.worthTag, usd(PUT.close * 100 * 100, 0), ""],
					] as const
				).map(([name, tag, num, tone], i) => (
					<g key={name}>
						<Word
							name={`${name}-tag`}
							x={W * (narrow ? [0.27, 0.73][i] : [0.3, 0.7][i])}
							y={H * 0.34}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`${name}-num`}
							x={W * (narrow ? [0.27, 0.73][i] : [0.3, 0.7][i])}
							y={H * 0.34 + T.big * 0.95}
							size={T.big * 0.75}
							className={`wt-film-num ${tone}`}
						>
							{num}
						</Word>
					</g>
				))}
				<Lines
					name="s-line"
					text={t(copy.settleLine)}
					x={W / 2}
					y={H * 0.72}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
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
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			time,
		);
	const order = ["call-long", "call-short", "put-long", "put-short"] as const;
	const cell = (key: string) => one(`cell-${key}`);
	const focus = (key: string) => one(`cellf-${key}`);
	const heads = order.map((key) => one(`h-${key}`));
	const dot = one("dot");
	const moves = MOVES.map((_, i) => one(`move-${i}`));
	const nodes = ["n-you", "n-clear", ...writers.map((w) => `n-${w.id}`)].map(
		one,
	);

	d.hidden([
		...flat("q"),
		...heads,
		...flat("matrix").filter((el) => el.tagName === "text"),
		...order.flatMap((key) => [cell(key), focus(key)]),
		one("k-head"),
		...flat("track"),
		...moves,
		one("a-head"),
		one("c-head"),
		one("p-head"),
		...nodes,
		one("arrow-in"),
		...writers.flatMap((w) => [one(`pick-${w.id}`), one(`arrow-${w.id}`)]),
		...flat("settle"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a short put ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	word(one("q-big"), 4.8);
	show(one("q-line"), 6.4);

	// ——— matrix: four positions ———
	tl.addLabel("matrix", 9.5);
	hide(flat("q"), 9.5);
	show(
		flat("matrix").filter((el) => el.tagName === "text"),
		9.8,
	);
	order.forEach((key, i) => {
		const at = 10.0 + i * 2.2;
		if (i === 0) show(heads[0], at, "above");
		else d.swap(heads[i - 1], heads[i], at);
		show(cell(key), at + 0.35);
		if (i > 0)
			tl.to(focus(order[i - 1]), { opacity: 0, duration: 0.3 }, at + 0.35);
		tl.to(focus(key), { opacity: 1, duration: 0.3 }, at + 0.5);
	});

	// ——— track: open and close ———
	tl.addLabel("track", 19);
	hide(
		[
			heads[3],
			...flat("matrix").filter((el) => el.tagName === "text"),
			...order.flatMap((key) => [cell(key), focus(key)]),
		],
		19.0,
	);
	show(one("k-head"), 19.2, "above");
	show(flat("track"), 19.5);
	MOVES.forEach((move, i) => {
		const at = 20.4 + i * 2.0;
		const to = move.trade === "buy" ? move.from + 1 : move.from - 1;
		if (i > 0) hide(moves[i - 1], at - 0.1, 0.25);
		word(moves[i], at);
		tl.to(
			dot,
			{ attr: { cx: L.stopX(to) }, duration: 0.7, ease: "power2.inOut" },
			at + 0.3,
		);
	});

	// ——— assign: a random writer ———
	tl.addLabel("assign", 29);
	hide([one("k-head"), ...flat("track"), moves[3]], 29.0);
	show(one("a-head"), 29.2, "above");
	show(nodes[0], 29.5);
	d.swap(one("a-head"), one("c-head"), 30.8);
	tl.fromTo(
		one("arrow-in"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.4 },
		31.2,
	);
	show(nodes[1], 31.4, "right");
	writers.forEach((w, i) => {
		show(nodes[2 + i], 31.8 + i * 0.2, "right");
		tl.to(
			one(`arrow-${w.id}`),
			{ opacity: 0.6, duration: 0.3 },
			32.0 + i * 0.2,
		);
	});
	d.swap(one("c-head"), one("p-head"), 33.2);
	writers.forEach((w) => {
		if (w.id !== ASSIGNED)
			tl.to(
				[one(`arrow-${w.id}`), one(`n-${w.id}`)],
				{ opacity: 0.3, duration: 0.3 },
				33.6,
			);
	});
	tl.to(one(`arrow-${ASSIGNED}`), { opacity: 1, duration: 0.3 }, 33.6);
	tl.to(one(`pick-${ASSIGNED}`), { opacity: 1, duration: 0.3 }, 33.7);
	// Cut: what moves.
	hide(
		[
			one("p-head"),
			...nodes,
			one("arrow-in"),
			...writers.flatMap((w) => [one(`pick-${w.id}`), one(`arrow-${w.id}`)]),
		],
		35.0,
	);
	show([one("s-pays-tag"), one("s-worth-tag")], 35.3);
	word(one("s-pays-num"), 35.4);
	word(one("s-worth-num"), 35.7);
	show(one("s-line"), 36.2);
	// The claim.
	hide(flat("settle"), 37.6);
	word(one("z-big"), 37.9);
	show(one("z-sub"), 38.3);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
	return tl;
}

export const optionRightsFilm: Film = {
	id: "option-rights",
	label: [
		`Holders and writers, as a short film: a short Oct 18 95 put and what being assigned means; the four positions, a call's holder who may buy at $100 and its writer who must sell, a put's holder who may sell at $95 and its writer who must buy; the same buy or sell opening a position or closing one; and an exercise sent to the clearinghouse, which assigns it at random to Eli, not Ben, who pays ${usd(PUT.cash, 0)} for shares worth ${usd(PUT.close * 100 * 100, 0)}, a gain of ${usd(PUT.gain, 0)} to you, ${signedUsd(PUT.net, 0)} after the premium`,
		`持有人与义务方短片：一张 10月18日 95 看跌空头，以及被指派意味着什么；四种持仓：看涨持有人可按 $100 买入，其义务方必须卖出；看跌持有人可按 $95 卖出，其义务方必须买入；同样的买入或卖出可能开仓也可能平仓；以及行权通知交给清算所，随机指派给 Eli 而不是 Ben，Eli 付 ${usd(PUT.cash, 0)} 买入价值 ${usd(PUT.close * 100 * 100, 0)} 的股票，你获得 ${usd(PUT.gain, 0)}，扣除权利金后 ${signedUsd(PUT.net, 0)}`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Holders and writers", "持有人与义务方"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "matrix", label: ["Four positions", "四种持仓"] },
		{ id: "track", label: ["Open or close", "开仓或平仓"] },
		{ id: "assign", label: ["Assignment", "指派"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
