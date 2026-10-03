import { type Copy, count, pick, signedCount } from "@/content/world";
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
import { textWidth } from "../walkthrough/text-measure";
import {
	dei,
	denominators,
	type Lean,
	magnitude,
	NET,
	netted,
	POSITIONING,
	prints,
	printwise,
	signOf,
} from "./dex-dei-gex-model";

/*
 * DEX and DEI, as a film. It opens on how much traded in Monday's Oct 18 calls, 27,425
 * share-equivalents, and asks how much of it pointed one way. The tape answers: each print
 * a bar as long as its delta-weighted size, then signed by the side it traded on, mid and
 * unquoted prints dropping out, for a net of +17,532. Counting the 10:50 spread as one
 * trade halves it. DEI divides that net by share volume, and three denominators give three
 * percentages. Last, another site's "DEX" of −89,800 that isn't the same quantity at all.
 *
 *   open      0–4     "DEX and DEI"
 *   question  4–9.5   gross 27,425; net ?
 *   tape      9.5–21  seven prints, delta-weighted; signed by side: net +17,532
 *   spread    21–29.5 the 10:50 block as one spread: +7,500, net +8,532; cut: two answers
 *   dei       29.5–38.5  +17,532 ÷ 1.2M, 1.5M, 600k: 1.46%, 1.17%, 2.92%
 *   source    38.5–48  another site's "DEX" −89,800: OI × delta, dealers assumed short;
 *                      cut: "Same label, different numerator."
 *   next      48–50.5  Next: the module checkpoint
 */

const END = 50.5;
const MAX = Math.max(...prints.map((print) => magnitude(print)));
const SPREAD = netted.bullish - (printwise.bullish - magnitude(prints[4]));

const leanTag: Record<Lean, Copy> = {
	bullish: ["ask", "卖价"],
	bearish: ["bid", "买价"],
	neutral: ["mid", "中间价"],
	unclassified: ["no quote", "无报价"],
};

const rowLabel = (index: number, locale: Locale) => {
	const print = prints[index];
	return locale === "zh"
		? `${print.time} ${print.strike} 看涨 ×${print.contracts}`
		: `${print.time} ${print.strike}C ×${print.contracts}`;
};

function layout(width: number, locale: Locale = "en") {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	const left = frame.margin * (narrow ? 0.4 : 0.6);
	const right = width * 0.965;
	// On a phone the running total sits above the rows, not beside them.
	const top = height * (narrow ? 0.42 : 0.24);
	const bottom = height * (narrow ? 0.95 : 0.9);
	const labelSize = narrow ? 10 : 12;
	const labelWidth =
		Math.max(
			...prints.map((_, i) => textWidth(rowLabel(i, locale), labelSize)),
		) + 10;
	const zero = left + labelWidth + (right - left - labelWidth) * 0.12;
	// Room right of the longest bar for its value and its side.
	const unit = (right - zero - (narrow ? 74 : 72)) / MAX;
	const rowHeight = (bottom - top) / prints.length;
	return {
		...frame,
		labelSize,
		left,
		right,
		top,
		bottom,
		zero,
		unit,
		rowY: (i: number) => top + rowHeight * (i + 0.5),
		barHeight: Math.min(rowHeight * 0.56, 22),
		pair: narrow ? [0.27, 0.73] : [0.32, 0.68],
	};
}

const copy = {
	title: ["DEX and DEI", "DEX 与 DEI"],
	titleSub: [
		"delta-weighted flow, and its share of volume",
		"Delta 加权的成交流，及其占成交量的比例",
	],
	qTagGross: ["traded, share-equivalents", "成交，股票等价"],
	qTagNet: ["pointed one way", "指向一边的"],
	qTagGrossShort: ["traded", "成交"],
	qTagNetShort: ["one way", "指向一边"],
	qLine: [
		"Monday's Oct 18 call prints, weighted by delta. How much leaned one way?",
		"周一 10月18日 看涨的成交，用 Delta 加权。有多少偏向一边？",
	],
	tapeHead: [
		"Each print, weighted by delta: |Δ| × contracts × 100.",
		"每笔成交用 Delta 加权：|Δ| × 张数 × 100。",
	],
	tapeHeadShort: ["Each print × delta × 100.", "每笔 × Delta × 100。"],
	signHead: [
		"Sign by side: ask right, bid left, mid and unquoted out.",
		"按方向赋号：卖价向右，买价向左，中间价与无报价不计。",
	],
	signHeadShort: ["Ask right, bid left, mid out.", "卖价向右，买价向左。"],
	gross: ["gross", "总量"],
	net: ["net DEX", "净 DEX"],
	spreadHead: [
		"The 10:50 block was one spread: buy 105s, sell 110s.",
		"10:50 的大单是一个价差：买 105、卖 110。",
	],
	spreadHeadShort: ["10:50 was one spread.", "10:50 是一个价差。"],
	spreadRow: ["10:50 spread ×500", "10:50 价差 ×500"],
	twoPrints: ["as two prints", "按两笔成交"],
	oneTrade: ["as one trade", "按一笔交易"],
	twoLine: [
		"Same trades, two conventions, two answers. Say which you used.",
		"同样的成交，两种约定，两个答案。要说明你用的是哪一种。",
	],
	deiHead: [
		"DEI: net flow ÷ ALFA's share volume.",
		"DEI：净成交流 ÷ ALFA 的股票成交量。",
	],
	deiHeadShort: ["DEI: net ÷ share volume.", "DEI：净额 ÷ 成交量。"],
	deiLine: [
		"One set of trades, three percentages: state the denominator.",
		"同一组成交，三个百分比：要说明分母。",
	],
	deiLineShort: ["State the denominator.", "要说明分母。"],
	sourceHead: [
		`Another site shows ALFA "DEX" at ${signedCount(POSITIONING)}.`,
		`另一个网站显示 ALFA 的“DEX”为 ${signedCount(POSITIONING)}。`,
	],
	sourceHeadShort: [
		`Another site: "DEX" ${signedCount(POSITIONING)}.`,
		`另一网站：“DEX” ${signedCount(POSITIONING)}。`,
	],
	flowCard: ["flow DEX · this lesson", "成交流 DEX · 本课"],
	siteCard: ["“DEX” · another site", "“DEX” · 另一网站"],
	flowFrom: ["Monday's prints, by side", "周一的成交，按方向"],
	siteFrom: ["Friday's OI × delta", "周五的 OI × Delta"],
	flowSign: ["which way the tape leaned", "成交偏向哪边"],
	siteSign: ["dealers assumed short calls", "假设做市商做空看涨"],
	claimBig: ["Same label, different numerator.", "同样的标签，不同的分子。"],
	claimSub: [
		"Name the source, the sign rule and the denominator before comparing.",
		"比较之前，先说明来源、符号规则和分母。",
	],
	nextBig: ["Next: the module checkpoint", "下一步：本模块检查点"],
	nextSub: [
		"Greeks, volatility and exposure, on a new day",
		"在新的一天里运用希腊值、波动率与敞口",
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
	const L = layout(width, locale);
	const { height: H, type: T, room, narrow } = L;
	const W = width;
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
	const { labelSize } = L;
	const spreadY = (L.rowY(4) + L.rowY(5)) / 2;
	const deiSize = Math.min(T.num, (room / 24) * 1.4);
	const card = (
		i: 0 | 1,
		title: Copy,
		value: number,
		from: Copy,
		sign: Copy,
		tone: string,
	) => {
		const x = narrow ? W / 2 : W * L.pair[i];
		const y = narrow ? H * (0.28 + i * 0.34) : H * 0.36;
		const size = narrow ? T.num : T.big * 0.6;
		return (
			<g key={title[0]}>
				<Word
					name={`s-title-${i}`}
					x={x}
					y={y}
					size={T.small}
					className="wt-film-tag"
				>
					{t(title).toUpperCase()}
				</Word>
				<Word
					name={`s-num-${i}`}
					x={x}
					y={y + size * 1.15}
					size={size}
					className={`wt-film-num ${tone}`}
				>
					{signedCount(value)}
				</Word>
				<Lines
					name={`s-from-${i}`}
					text={`${t(from)} · ${t(sign)}`}
					x={x}
					y={y + size * 1.15 + T.body * 1.6}
					size={T.body}
					maxWidth={narrow ? room : W * 0.4}
					className="wt-film-type wt-film-dim"
				/>
			</g>
		);
	};
	return (
		<>
			<Backdrop frame={L} />

			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart-tape">
						<path
							data-f="zero"
							d={`M${L.zero} ${L.top - 6}V${L.bottom}`}
							className="wt-axis"
						/>
						{prints.map((print, i) => {
							const width = magnitude(print) * L.unit;
							const y = L.rowY(i);
							return (
								<g key={print.id} data-f={`row-${i}`}>
									<text
										x={L.left}
										y={y + 4}
										className="wt-small"
										style={{ fontSize: labelSize }}
									>
										{rowLabel(i, locale)}
									</text>
									<rect
										data-f={`bar-${i}`}
										className="wt-film-bar"
										data-tone="neutral"
										x={L.zero}
										y={y - L.barHeight / 2}
										width={0}
										height={L.barHeight}
										rx={3}
									/>
									<text
										data-f={`value-${i}`}
										x={L.zero + width + 8}
										y={y + 4}
										className="wt-film-num"
										style={{ fontSize: labelSize + 1 }}
									>
										{count(magnitude(print))}
									</text>
									<text
										data-f={`tag-${i}`}
										x={
											L.zero +
											width +
											8 +
											textWidth(count(magnitude(print)), labelSize + 1) +
											8
										}
										y={y + 4}
										className={`wt-small ${
											print.lean === "bullish"
												? "wt-gain"
												: print.lean === "bearish"
													? "wt-loss"
													: ""
										}`}
										style={{ fontSize: labelSize }}
									>
										{t(leanTag[print.lean])}
									</text>
								</g>
							);
						})}
						<g data-f="spread">
							<rect
								x={L.left - 6}
								y={L.rowY(4) - L.barHeight}
								width={L.right - L.left + 6}
								height={L.rowY(5) - L.rowY(4) + L.barHeight * 2}
								rx={8}
								className="wt-bracket"
							/>
						</g>
						<g data-f="spread-row">
							<text
								x={L.left}
								y={spreadY + 4}
								className="wt-small wt-accent"
								style={{ fontSize: labelSize }}
							>
								{t(copy.spreadRow)}
							</text>
							<rect
								data-f="spread-bar"
								className="wt-film-bar"
								data-tone="gain"
								x={L.zero}
								y={spreadY - L.barHeight / 2}
								width={SPREAD * L.unit}
								height={L.barHeight}
								rx={3}
							/>
							<text
								x={L.zero + SPREAD * L.unit + 8}
								y={spreadY + 4}
								className="wt-film-num wt-film-gain"
								style={{ fontSize: labelSize + 1 }}
							>
								{narrow
									? signedCount(SPREAD)
									: `${count(magnitude(prints[4]))} − ${count(magnitude(prints[5]))} = ${signedCount(SPREAD)}`}
							</text>
						</g>
					</g>
				</g>
			</g>
			<g data-f="meter">
				<Word
					name="meter-tag"
					x={L.right}
					y={L.headY + T.head * 1.25}
					size={T.small}
					anchor="end"
					className="wt-film-tag"
				>
					{t(copy.gross).toUpperCase()}
				</Word>
				<Word
					name="meter-tag-net"
					x={L.right}
					y={L.headY + T.head * 1.25}
					size={T.small}
					anchor="end"
					className="wt-film-tag"
				>
					{t(copy.net).toUpperCase()}
				</Word>
				<Word
					name="meter-value"
					x={L.right}
					y={L.headY + T.head * 1.25 + T.num * 1.05}
					size={T.num}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					0
				</Word>
			</g>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				{(
					[
						[
							narrow ? copy.qTagGrossShort : copy.qTagGross,
							count(printwise.gross),
							"",
						],
						[narrow ? copy.qTagNetShort : copy.qTagNet, "?", "wt-film-accent"],
					] as const
				).map(([tag, num, tone], i) => (
					<g key={tag[0]}>
						<Word
							name={`q-tag-${i}`}
							x={W * L.pair[i]}
							y={H * 0.3}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`q-num-${i}`}
							x={W * L.pair[i]}
							y={H * 0.3 + T.big * 0.95}
							size={Math.min(T.big * 0.8, (W * 0.42) / (num.length * 0.62))}
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
					y={H * 0.74}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("t-head", copy.tapeHead, copy.tapeHeadShort)}
			{headline("g-head", copy.signHead, copy.signHeadShort)}
			{headline("p-head", copy.spreadHead, copy.spreadHeadShort)}
			<g data-f="two">
				{(
					[
						[copy.twoPrints, printwise.net, ""],
						[copy.oneTrade, netted.net, "wt-film-accent"],
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
							size={Math.min(T.big * 0.8, (W * 0.42) / (7 * 0.62))}
							className={`wt-film-num ${tone}`}
						>
							{signedCount(num)}
						</Word>
					</g>
				))}
				<Lines
					name="w-line"
					text={t(copy.twoLine)}
					x={W / 2}
					y={H * 0.74}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			<g data-f="dei">
				{headline("d-head", copy.deiHead, copy.deiHeadShort)}
				<Word
					name="d-net"
					x={W / 2}
					y={H * 0.36}
					size={T.num * 1.2}
					className="wt-film-num wt-film-gain"
				>
					{signedCount(NET)}
				</Word>
				{denominators.map((denominator, i) => (
					<Word
						key={denominator.id}
						name={`d-row-${i}`}
						x={W / 2}
						y={H * (0.5 + i * 0.14)}
						size={deiSize}
						className="wt-film-num"
					>
						{`÷ ${count(denominator.shares)} = `}
						<tspan className="wt-film-accent">{`${dei(denominator.shares).toFixed(2)}%`}</tspan>
					</Word>
				))}
				{denominators.map((denominator, i) => (
					<Word
						key={`${denominator.id}-tag`}
						name={`d-tag-${i}`}
						x={W / 2}
						y={H * (0.5 + i * 0.14) + T.small * 1.5}
						size={T.small}
						className="wt-film-tag"
					>
						{t(denominator.label).toUpperCase()}
					</Word>
				))}
				<Lines
					name="d-line"
					text={t(narrow ? copy.deiLineShort : copy.deiLine)}
					x={W / 2}
					y={H * 0.93}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			<g data-f="src">
				{headline("s-head", copy.sourceHead, copy.sourceHeadShort)}
				{card(
					0,
					copy.flowCard,
					NET,
					copy.flowFrom,
					copy.flowSign,
					"wt-film-gain",
				)}
				{card(
					1,
					copy.siteCard,
					POSITIONING,
					copy.siteFrom,
					copy.siteSign,
					"wt-film-loss",
				)}
			</g>
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
	const { width: W } = context;
	const L = layout(W, context.locale);
	const d = createDirector(context, L, END);
	const { tl, one, kids, show, hide, pop, slam, rise, sink } = d;
	const flat = (name: string) =>
		kids(name).flatMap((el) => (el.tagName === "g" ? [...el.children] : [el]));
	const meter = one<SVGTextElement>("meter-value");
	const shares = (value: number) => signedCount(Math.round(value));
	const plain = (value: number) => count(Math.round(value));

	d.hidden([
		one("zero"),
		...prints.flatMap((_, i) => [
			one(`row-${i}`),
			one(`value-${i}`),
			one(`tag-${i}`),
		]),
		one("spread"),
		one("spread-row"),
		...kids("meter"),
		...flat("q"),
		one("t-head"),
		one("g-head"),
		one("p-head"),
		...flat("two"),
		...kids("dei"),
		...flat("src"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: what traded, and how much leaned one way ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag-0"), 4.6);
	slam(one("q-num-0"), 4.8);
	show(one("q-tag-1"), 5.6);
	slam(one("q-num-1"), 5.8);
	show(one("q-line"), 6.8);

	// ——— tape: each print, weighted by delta ———
	tl.addLabel("tape", 9.5);
	hide(flat("q"), 9.5);
	show(one("t-head"), 9.7, "above");
	rise(9.8);
	tl.to(one("zero"), { opacity: 1, duration: 0.4 }, 10.2);
	show([one("meter-tag"), meter], 10.3, "above");
	let running = 0;
	prints.forEach((print, i) => {
		const at = 10.5 + i * 0.4;
		show(one(`row-${i}`), at, "right", 0.35);
		tl.to(
			one(`bar-${i}`),
			{
				attr: { width: magnitude(print) * L.unit },
				duration: 0.5,
				ease: "power3.out",
			},
			at + 0.1,
		);
		show(one(`value-${i}`), at + 0.4, "right", 0.3);
		d.count(meter, running + magnitude(print), at + 0.1, plain, running, 0.5);
		running += magnitude(print);
	});
	// Sign by side.
	d.swap(one("t-head"), one("g-head"), 14.3);
	d.swap(one("meter-tag"), one("meter-tag-net"), 14.4);
	prints.forEach((_, i) => {
		show(one(`tag-${i}`), 14.9 + i * 0.12, "right", 0.3);
	});
	const signAt = 16.0;
	prints.forEach((print, i) => {
		const sign = signOf(print.lean);
		const bar = one(`bar-${i}`);
		const width = magnitude(print) * L.unit;
		if (sign > 0) tl.set(bar, { attr: { "data-tone": "gain" } }, signAt);
		else if (sign < 0) {
			tl.set(bar, { attr: { "data-tone": "loss" } }, signAt);
			tl.to(
				bar,
				{ attr: { x: L.zero - width }, duration: 0.6, ease: "power2.inOut" },
				signAt,
			);
		} else tl.to(one(`row-${i}`), { opacity: 0.25, duration: 0.5 }, signAt);
	});
	d.count(meter, printwise.net, signAt, shares, printwise.gross, 0.9);

	// ——— spread: one trade, not two prints ———
	tl.addLabel("spread", 21);
	d.swap(one("g-head"), one("p-head"), 21.0);
	tl.to([one("row-4"), one("row-5")], { opacity: 1, duration: 0.3 }, 21.4);
	show(one("spread"), 21.6, "right", 0.4);
	tl.to([one("row-4"), one("row-5")], { opacity: 0, duration: 0.4 }, 22.8);
	show(one("spread-row"), 23.0, "right");
	d.count(meter, netted.net, 23.4, shares, printwise.net, 0.8);
	// Cut: two answers.
	hide([one("p-head"), ...kids("meter")], 25.0);
	sink(25.0);
	show(one("w-tag-0"), 25.4);
	slam(one("w-num-0"), 25.6);
	show(one("w-tag-1"), 26.3);
	slam(one("w-num-1"), 26.5);
	show(one("w-line"), 27.4);

	// ——— dei: one numerator, three denominators ———
	tl.addLabel("dei", 29.5);
	hide(flat("two"), 29.5);
	show(one("d-head"), 29.8, "above");
	slam(one("d-net"), 30.2);
	denominators.forEach((_, i) => {
		show(one(`d-row-${i}`), 31.2 + i * 0.9);
		show(one(`d-tag-${i}`), 31.4 + i * 0.9);
	});
	show(one("d-line"), 34.4);

	// ——— source: a number with the same name ———
	tl.addLabel("source", 38.5);
	hide(kids("dei"), 38.5);
	show(one("s-head"), 38.8, "above");
	show(one("s-title-0"), 39.5);
	pop(one("s-num-0"), 39.7);
	show(one("s-from-0"), 40.2);
	show(one("s-title-1"), 41.0);
	pop(one("s-num-1"), 41.2);
	show(one("s-from-1"), 41.7);
	// Cut: the claim.
	hide(flat("src"), 44.4);
	tl.fromTo(
		one("c-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
		44.8,
	);
	show(one("c-sub"), 45.3);

	// ——— next ———
	tl.addLabel("next", 48);
	hide(kids("claim"), 48.0);
	d.close(48.0);
	return tl;
}

export const dexDeiGexFilm: Film = {
	id: "dex-dei-gex",
	label: [
		"DEX and DEI, as a short film: Monday's seven Oct 18 call prints weighted by delta, 27,425 share-equivalents gross; signed by the side each traded on, a net of +17,532; the 10:50 block counted as one spread, +8,532; that net divided by three share-volume denominators, 1.46%, 1.17% and 2.92%; and another site's −89,800 'DEX', built from open interest with dealers assumed short",
		"DEX 与 DEI 短片：周一 10月18日 看涨的七笔成交用 Delta 加权，总量 27,425 股等价；按各自成交方向赋号，净额 +17,532；把 10:50 的大单算作一个价差，+8,532；这个净额除以三种股票成交量分母，1.46%、1.17% 和 2.92%；以及另一个网站用未平仓量并假设做市商做空得出的 −89,800 “DEX”",
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["DEX and DEI", "DEX 与 DEI"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "tape", label: ["The tape", "成交"] },
		{ id: "spread", label: ["The spread", "价差"] },
		{ id: "dei", label: ["DEI", "DEI"] },
		{ id: "source", label: ["Another DEX", "另一个 DEX"] },
		{ id: "next", label: ["Next", "下一步"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
