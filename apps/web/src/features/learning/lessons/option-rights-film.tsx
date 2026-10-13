import { type Copy, pick, signedUsd, usd } from "@/content/world";
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
 * assigned means. The grid of four positions answers, brackets reading it row by row: a
 * holder may, a writer must; your short put must buy at $95. Two separate buys open a
 * long or close a short. A holder exercises a put bought from Ben; the clearinghouse
 * searches neutral writers, then the only glowing lock settles on Eli. Only then does
 * the answer appear. Settlement builds the cash and share values, then the holder's net.
 *
 *   open      0–4        "Holders and writers"
 *   question  4–8.8      short 1 Oct 18 95 put: if assigned?
 *   rights    8.8–16.6   holders may, writers must; yours: buy at $95
 *   track     16.6–23.6  flat → long; separately, short → flat
 *   assign    23.6–27.6  a holder exercises a put from Ben
 *   pick      27.6–34.35  neutral search; hero-lock 29.2; answer 29.7
 *   settle    34.35–40.05  100 × strike/close → totals → gain → net
 *   claim     40.05–44.9  the holder decides; a writer is assigned
 *   next      44.9–47.4  Next: premium, payoff and profit
 */

const END = 47.4;
const RIGHTS: readonly Right[] = ["call", "put"];
const SIDES: readonly Side[] = ["long", "short"];
const PUT = exerciseCase("put");
/** Independent examples: the same buy, two different starting positions. */
const MOVES = [
	{ from: 0, trade: "buy" },
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
		trackY: (i: number) => H * (i === 0 ? 0.42 : 0.72),
		stopX: (end: number) => width / 2 + (end - 0.5) * room * 0.58,
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
	rightsHead: [
		"A holder may; a writer must.",
		"持有人可以选择；义务方必须履约。",
	],
	yoursHead: ["Your short put: buy at $95.", "你的看跌空头：按 $95 买入。"],
	trackHead: ["The same buy opens or closes.", "同样买入，可开仓也可平仓。"],
	assignHead: [
		"A holder exercises a put from Ben.",
		"持有人对从 Ben 买的看跌行权。",
	],
	assignHeadShort: [
		"A holder exercises a put from Ben.",
		"持有人对从 Ben 买的看跌行权。",
	],
	pickHead: ["Clearinghouse selects a writer.", "清算所随机选择一位义务方。"],
	pickAnswer: ["Assigned: Eli, not Ben.", "指派给 Eli，而非 Ben。"],
	settleHead: [
		"Assignment settles in shares and cash.",
		"指派以股票和现金交割。",
	],
	holder: ["holder", "持有人"],
	clearing: ["clearinghouse", "清算所"],
	put95: ["95 put", "95 看跌"],
	shortN: (n: number): Copy => [`short ${n}`, `空头 ${n} 张`],
	sold: ["sold this put", "卖出此看跌"],
	paysTag: ["Eli pays", "Eli 支付"],
	worthTag: ["shares at close", "收盘时股票价值"],
	gainTag: ["Holder's exercise gain", "持有人行权所得"],
	netTag: ["Holder's net", "持有人净收益"],
	premiumTag: [
		`premium ${usd(PUT.premium / 100)} × 100 = ${usd(PUT.premium, 0)}`,
		`权利金 ${usd(PUT.premium / 100)} × 100 = ${usd(PUT.premium, 0)}`,
	],
	claimBig: [
		"The holder decides; a writer is assigned.",
		"持有人决定；义务方被指派。",
	],
	claimSub: [
		"Trades open or close; assignment picks a random writer.",
		"交易可开仓或平仓；指派随机落在一位义务方。",
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
	// Wide: holder, clearinghouse and writers left to right. On a phone the holder sits
	// above the clearinghouse, with its three writers in a row below.
	const writerX = (i: number) =>
		narrow
			? margin + i * (L.nodeW + (room - 3 * L.nodeW) / 2)
			: margin + room - L.nodeW;
	const writerY = (i: number) => (narrow ? H * 0.66 : L.writerY(i));
	const clearX = W / 2 - L.nodeW / 2;
	const clearY = narrow ? H * 0.46 : L.writerY(1);
	const youX = narrow ? clearX : margin;
	const youY = narrow ? H * 0.27 : L.writerY(1);
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
				data-f={`${name}-box`}
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
			{headline("a-head", copy.rightsHead, copy.rightsHead)}
			{headline("y-head", copy.yoursHead, copy.yoursHead)}
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
							<g key={`${right}-${side}`}>
								{/* The cell's box, for brackets: outside the cell, so a dimmed cell keeps them bright. */}
								<rect
									data-f={`cellb-${right}-${side}`}
									x={L.cellX(c)}
									y={L.cellY(r)}
									width={L.cellW}
									height={L.cellH}
									fill="none"
								/>
								<g data-f={`cell-${right}-${side}`}>
									<rect
										x={L.cellX(c)}
										y={L.cellY(r)}
										width={L.cellW}
										height={L.cellH}
										rx={12}
										className="wt-panel-shape"
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
							</g>
						);
					}),
				)}
			</g>
			<Brackets name="lock-cell" />
			<Brackets name="lock-you" />

			{/* Open or close. */}
			{headline("k-head", copy.trackHead, copy.trackHead)}
			{MOVES.map((move, i) => (
				<g key={move.from}>
					<g data-f={`track-${i}`}>
						<path
							d={`M${L.stopX(0)} ${L.trackY(i)}H${L.stopX(1)}`}
							className="wt-axis"
							strokeWidth={2}
						/>
						{[move.from, move.from + 1].map((pos, end) => (
							<g key={pos}>
								<circle
									cx={L.stopX(end)}
									cy={L.trackY(i)}
									r={5}
									className="wt-film-ghost"
								/>
								<text
									x={L.stopX(end)}
									y={L.trackY(i) + T.body * 1.7}
									textAnchor="middle"
									className={`wt-film-type ${pos > 0 ? "wt-film-accent" : pos < 0 ? "wt-film-warn" : "wt-film-dim"}`}
									style={{ fontSize: text }}
								>
									{t(positionCopy(pos))}
								</text>
							</g>
						))}
						<circle
							data-f={`dot-${i}`}
							cx={L.stopX(0)}
							cy={L.trackY(i)}
							r={9}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
					</g>
					<Word
						name={`move-${i}`}
						x={W / 2}
						y={L.trackY(i) - T.title * 0.8}
						size={T.title}
						className="wt-film-type wt-film-accent"
					>
						{t(tradeCopy(move.from, move.trade))}
					</Word>
				</g>
			))}

			{/* Exercise and assignment. */}
			{headline("e-head", copy.assignHead, copy.assignHeadShort)}
			{headline("p-head", copy.pickHead, copy.pickHead)}
			<Lines
				name="p-answer"
				text={t(copy.pickAnswer)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.pickHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
				className="wt-film-type wt-film-accent"
			/>
			{headline("s-head", copy.settleHead, copy.settleHead)}
			<g data-f="assign">
				{node("n-you", youX, youY, t(copy.holder), t(copy.put95), true)}
				<path
					data-f="arrow-in"
					d={
						narrow
							? `M${W / 2} ${youY + L.nodeH + 6}V${clearY - 6}`
							: `M${margin + L.nodeW + 6} ${mid(youY)}H${clearX - 6}`
					}
					className="wt-film-riser"
				/>
				{node("n-clear", clearX, clearY, t(copy.clearing), "OCC")}
				{writers.map((w, i) => (
					<g key={w.id}>
						{node(
							`n-${w.id}`,
							writerX(i),
							writerY(i),
							w.name,
							w.id === "ben" && !narrow
								? `${t(copy.shortN(w.short))} · ${t(copy.sold)}`
								: t(copy.shortN(w.short)),
						)}

						<path
							data-f={`arrow-${w.id}`}
							d={
								narrow
									? `M${W / 2} ${clearY + L.nodeH + 6}L${writerX(i) + L.nodeW / 2} ${writerY(i) - 6}`
									: `M${clearX + L.nodeW + 6} ${mid(clearY)}L${writerX(i) - 6} ${mid(writerY(i))}`
							}
							className="wt-film-link"
						/>
					</g>
				))}
			</g>
			<Brackets name="lock-search" />
			<Brackets name="lock-pick" glow />
			<g data-f="settle">
				{(
					[
						[
							"s-pays",
							copy.paysTag,
							PUT.contract.strike,
							PUT.cash,
							"wt-film-loss",
						],
						["s-worth", copy.worthTag, PUT.close, PUT.close * 100 * 100, ""],
					] as const
				).map(([name, tag, price, total, tone], i) => {
					const x = W * (narrow ? [0.27, 0.73][i] : [0.3, 0.7][i]);
					return (
						<g key={name}>
							<Word
								name={`${name}-tag`}
								x={x}
								y={H * 0.32}
								size={T.small}
								className="wt-film-tag"
							>
								{t(tag).toUpperCase()}
							</Word>
							<Word
								name={`${name}-input`}
								x={x}
								y={H * 0.41}
								size={T.body * 1.1}
								className="wt-film-num wt-film-dim"
							>
								{t([
									`100 shares × ${usd(price * 100, 0)}`,
									`100 股 × ${usd(price * 100, 0)}`,
								])}
							</Word>
							<Word
								name={`${name}-num`}
								x={x}
								y={H * 0.52}
								size={T.big * 0.75}
								className={`wt-film-num ${tone}`}
							>
								{usd(total, 0)}
							</Word>
						</g>
					);
				})}
				<Word
					name="s-gain-tag"
					x={W / 2}
					y={H * 0.63}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.gainTag).toUpperCase()}
				</Word>
				<Word
					name="s-gain-num"
					x={W / 2}
					y={H * 0.69}
					size={T.body * (narrow ? 1.15 : 1.35)}
					className="wt-film-num wt-film-gain"
				>
					{`${usd(PUT.cash, 0)} − ${usd(PUT.close * 100 * 100, 0)} = ${usd(PUT.gain, 0)}`}
				</Word>
				<Word
					name="s-premium-tag"
					x={W / 2}
					y={H * 0.77}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.premiumTag).toUpperCase()}
				</Word>
				<Word
					name="s-net-tag"
					x={W / 2}
					y={H * 0.83}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.netTag).toUpperCase()}
				</Word>
				<Word
					name="s-net-num"
					x={W / 2}
					y={H * 0.9}
					size={T.body * (narrow ? 1.25 : 1.5)}
					className="wt-film-num wt-film-gain"
				>
					{`${usd(PUT.gain, 0)} − ${usd(PUT.premium, 0)} = ${usd(PUT.net, 0)}`}
				</Word>
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
	const g = (name: string) => one<SVGGraphicsElement>(name);
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const fade = (target: Element | Element[], time: number, to = 0) =>
		tl.to(target, { opacity: to, duration: 0.3 }, time);
	const order = ["call-long", "put-long", "call-short", "put-short"] as const;
	const cell = (key: string) => one(`cell-${key}`);
	const box = (key: string) => g(`cellb-${key}`);
	const heads = [
		"a-head",
		"y-head",
		"k-head",
		"e-head",
		"p-head",
		"s-head",
	].map((name) => one(name));
	const tracks = MOVES.map((_, i) => one(`track-${i}`));
	const moves = MOVES.map((_, i) => one(`move-${i}`));
	const nodes = ["n-you", "n-clear", ...writers.map((w) => `n-${w.id}`)].map(
		one,
	);
	const lockCell = g("lock-cell");
	const lockSearch = g("lock-search");
	const lockPick = g("lock-pick");

	d.hidden([
		...flat("q"),
		...heads,
		...flat("matrix").filter((el) => el.tagName === "text"),
		...order.map((key) => cell(key)),
		lockCell,
		g("lock-you"),
		...tracks,
		...moves,
		...nodes,
		one("arrow-in"),
		...writers.map((w) => one(`arrow-${w.id}`)),
		lockSearch,
		lockPick,
		one("p-answer"),
		...flat("settle"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a short put ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.4);
	word(one("q-big"), 4.6);
	show(one("q-line"), 5.2);

	// ——— rights: four positions; holders may, writers must ———
	tl.addLabel("rights", 8.8);
	hide(flat("q"), 8.8);
	show(heads[0], 9.0);
	show(
		flat("matrix").filter((el) => el.tagName === "text"),
		9.2,
	);
	order.forEach((key, i) => {
		show(cell(key), 9.3 + i * 0.15);
	});
	// Brackets read the grid: the holders' row, then the writers'.
	order.forEach((key, i) => {
		d.lock(lockCell, 10.2 + i * 0.7, { around: box(key), pad: 5 });
	});
	// Yours: the short put. The others step back.
	d.swap(heads[0], heads[1], 12.7);
	fade(lockCell, 12.9);
	fade(order.filter((key) => key !== "put-short").map(cell), 13, 0.35);
	d.lock(g("lock-you"), 13.2, { around: box("put-short"), pad: 5 });

	// ——— track: the same trade opens or closes ———
	tl.addLabel("track", 16.6);
	hide(
		[
			heads[1],
			...flat("matrix").filter((el) => el.tagName === "text"),
			...order.map((key) => cell(key)),
			g("lock-you"),
		],
		16.6,
	);
	show(heads[2], 16.95);
	show(tracks[0], 17.0);
	MOVES.forEach((move, i) => {
		const at = [17.6, 19.7][i];
		// The first buy settles at 18.6; the next arrival waits until 19.7.
		if (i > 0) show(tracks[i], at);
		word(moves[i], at);
		tl.to(
			one(`dot-${i}`),
			{ attr: { cx: L.stopX(1) }, duration: 0.7, ease: "power2.inOut" },
			at + (move.from === 0 ? 0.3 : 0.6),
		);
	});

	// ——— assign: the exercise goes to the clearinghouse ———
	tl.addLabel("assign", 23.6);
	// Both results remain on separate rows. The second settles at 21.0, with 2.6 s quiet.
	hide([heads[2], ...tracks, ...moves], 23.6);
	show(heads[3], 23.95);
	show(nodes[0], 23.95);
	show(one("n-ben"), 24.2, L.narrow ? "below" : "right");
	tl.fromTo(
		one("arrow-in"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.4 },
		25.0,
	);
	show(nodes[1], 25.2, L.narrow ? "below" : "right");
	writers.forEach((w, i) => {
		if (w.id !== "ben")
			show(nodes[2 + i], 25.4 + i * 0.2, L.narrow ? "below" : "right");
		tl.to(
			one(`arrow-${w.id}`),
			{ opacity: 0.6, duration: 0.3 },
			25.8 + i * 0.2,
		);
	});

	// ——— pick: two neutral candidates, then the only glowing lock on Eli. ———
	tl.addLabel("pick", 27.6);
	d.swap(heads[3], heads[4], 27.6);
	["ben", "cara"].forEach((id, i) => {
		const at = 27.6 + i * 0.8;
		d.lock(lockSearch, at, { around: g(`n-${id}-box`), pad: 5 });
		fade(lockSearch, at + 0.45);
	});
	const heroAt = 29.2;
	tl.addLabel("hero-lock", heroAt);
	d.lock(lockPick, heroAt, { around: g(`n-${ASSIGNED}-box`), pad: 5 });
	tl.set(
		one(`arrow-${ASSIGNED}`),
		{ attr: { class: "wt-film-riser" } },
		heroAt,
	);
	writers.forEach((w) => {
		if (w.id !== ASSIGNED)
			fade([one(`arrow-${w.id}`), one(`n-${w.id}`)], heroAt + 0.3, 0.3);
	});
	tl.to(one(`arrow-${ASSIGNED}`), { opacity: 1, duration: 0.3 }, heroAt + 0.3);
	// The lock settles at 29.65. The fully revealed answer holds 30.2–34.35 (4.15 s).
	tl.fromTo(
		one("p-answer"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		29.7,
	);

	// ——— settle: Eli pays the strike for shares worth less ———
	tl.addLabel("settle", 34.35);
	d.swap(heads[4], heads[5], 34.35);
	hide(
		[
			...nodes,
			one("arrow-in"),
			...writers.map((w) => one(`arrow-${w.id}`)),
			one("p-answer"),
		],
		34.35,
	);
	fade(lockPick, 34.35);
	// The assignment is gone before any settlement mark enters its footprint.
	const inputs = [
		"s-pays-tag",
		"s-worth-tag",
		"s-pays-input",
		"s-worth-input",
		"s-gain-tag",
		"s-premium-tag",
	].map(one);
	tl.fromTo(inputs, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 34.7);
	word(one("s-pays-num"), 35.65);
	word(one("s-worth-num"), 35.65);
	// Settled totals rest for 1.05 s. Equations reveal correct, complete values.
	tl.fromTo(
		one("s-gain-num"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.35 },
		37.25,
	);
	// The gain rests another 1.05 s before subtracting the already staged premium.
	tl.fromTo(
		[one("s-net-tag"), one("s-net-num")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.35 },
		38.65,
	);

	// ——— claim ———
	tl.addLabel("claim", 40.05);
	hide([heads[5], ...flat("settle")], 40.05);
	word(one("z-big"), 40.4);
	show(one("z-sub"), 40.65);

	// ——— next ———
	tl.addLabel("next", 44.9);
	hide(kids("claim"), 44.9);
	d.close(44.9);
	return tl;
}

export const optionRightsFilm: Film = {
	id: "option-rights",
	label: [
		`Holders and writers, as a short film: a short Oct 18 95 put and what being assigned means; the four positions, a call's holder who may buy at $100 and its writer who must sell, a put's holder who may sell at $95 and its writer who must buy; the same buy opening a long position or closing a short one in separate examples; and a holder's exercise of a put bought from Ben sent to the clearinghouse, which assigns it at random to Eli, not Ben, who pays ${usd(PUT.cash, 0)} for shares worth ${usd(PUT.close * 100 * 100, 0)}, a gain of ${usd(PUT.gain, 0)} to the holder, ${signedUsd(PUT.net, 0)} after the premium`,
		`持有人与义务方短片：一张 10月18日 95 看跌空头，以及被指派意味着什么；四种持仓：看涨持有人可按 $100 买入，其义务方必须卖出；看跌持有人可按 $95 卖出，其义务方必须买入；分别演示同样的买入如何开多头仓位或平空头仓位；以及持有人对从 Ben 买入的看跌行权，通知交给清算所，随机指派给 Eli 而不是 Ben，Eli 付 ${usd(PUT.cash, 0)} 买入价值 ${usd(PUT.close * 100 * 100, 0)} 的股票，持有人获得 ${usd(PUT.gain, 0)}，扣除权利金后 ${signedUsd(PUT.net, 0)}`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Holders and writers", "持有人与义务方"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "rights", label: ["Four positions", "四种持仓"] },
		{ id: "track", label: ["Open or close", "开仓或平仓"] },
		{ id: "assign", label: ["Exercise", "行权"] },
		{ id: "pick", label: ["Assignment", "指派"] },
		{ id: "settle", label: ["Settlement", "交割"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
