import { type Copy, count, pick, signedCount } from "@/content/world";
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
	dei,
	deltaOf,
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
 * unquoted prints dropping out, for a net of +17,532. DEI divides that net by share volume,
 * and two full-day volume benchmarks give two percentages. Then the numerator itself: counting the
 * 10:50 spread as one trade halves it. Last, another site's "DEX" of −89,800 that isn't the
 * same quantity at all.
 *
 *   open      0–4        "DEX and DEI"
 *   question  4–9.6      gross 27,425; net ?
 *   tape      9.6–17.8   seven prints, delta-weighted; signed by side: net +17,532
 *   dei       17.8–24.4  +17,532 ÷ 1.2M, 1.5M: 1.46%, 1.17%
 *   spread    24.4–34.3  the 10:50 block as one spread: +7,500, net +8,532; cut: two
 *                        answers, carrying the net into the lock
 *   source    34.3–44.9  another site's "DEX" −89,800: OI × delta, dealers assumed short;
 *                        cut: "Same label, different numerator."
 *   next      44.9–47.4  Next: the module checkpoint
 */

const END = 47.4;
const SPREAD = netted.bullish - (printwise.bullish - magnitude(prints[4]));
const spreadSoldLeg = prints.find(
	(print) => print.spread && print.id === "leg",
);
// Compare full-session flow only with full-day stock-volume benchmarks.
const filmDenominators = denominators.filter(({ id }) => id !== "noon");

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

const rowValue = (index: number, signed = false) => {
	const print = prints[index];
	const sign = signOf(print.lean);
	return signed && sign !== 0
		? signedCount(sign * magnitude(print))
		: count(magnitude(print));
};

function layout(width: number, locale: Locale = "en") {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	const left = Math.max(18, frame.margin * (narrow ? 0.4 : 0.6));
	const right = Math.min(width - 12, width * 0.965);
	// On a phone the running total sits above the rows, not beside them.
	const top = height * (narrow ? 0.42 : 0.24);
	const bottom = height * (narrow ? 0.95 : 0.9);
	const labelSize = narrow ? frame.type.small : 12;
	const labelWidth =
		Math.max(
			...prints.map((_, i) => textWidth(rowLabel(i, locale), labelSize)),
		) + 10;
	const zero = left + labelWidth + (right - left - labelWidth) * 0.12;
	// Room right of each bar for its value and its side, measured in this locale.
	const unit = Math.min(
		...prints.map(
			(print, i) =>
				(right -
					zero -
					16 -
					textWidth(rowValue(i, narrow), labelSize + 1) -
					Math.max(
						textWidth(pick(leanTag[print.lean], locale), labelSize),
						!narrow && print === spreadSoldLeg
							? textWidth(
									`${pick(copy.soldLeg, locale)} · ${pick(leanTag[print.lean], locale)}`,
									labelSize,
								)
							: 0,
					) -
					12) /
				magnitude(print),
		),
	);
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
		"Weight each print by delta and contracts.",
		"每笔按 Delta 和张数加权。",
	],
	tapeHeadShort: ["Delta × contracts × 100.", "Delta × 张数 × 100。"],
	signHead: [
		"Sign by side: ask right, bid left.",
		"按方向赋号：卖价向右，买价向左。",
	],
	signHeadShort: ["Ask right, bid left, mid out.", "卖价向右，买价向左。"],
	gross: ["gross", "总量"],
	net: ["net DEX", "净 DEX"],
	spreadHead: ["The 10:50 block was one spread.", "10:50 的大单是一个价差。"],
	spreadHeadShort: ["10:50 was one spread.", "10:50 是一个价差。"],
	spreadRow: ["10:50 spread ×500", "10:50 价差 ×500"],
	twoPrints: ["as two prints", "按两笔成交"],
	oneTrade: ["as one trade", "按一笔交易"],
	soldLeg: ["sold leg", "卖出腿"],
	deiHead: [
		"DEI: net flow ÷ ALFA's share volume.",
		"DEI：净成交流 ÷ ALFA 的股票成交量。",
	],
	deiHeadShort: ["DEI: net ÷ share volume.", "DEI：净额 ÷ 成交量。"],
	deiLine: [
		"Same flow, two full-day benchmarks: state the denominator.",
		"同一成交流，两个全日基准：要说明分母。",
	],
	deiLineShort: ["State the denominator.", "要说明分母。"],
	sourceHead: [
		`Another site shows an ALFA "DEX" too.`,
		"另一个网站也显示了 ALFA 的“DEX”。",
	],
	sourceHeadShort: [`Another site's "DEX".`, "另一网站的“DEX”。"],
	flowCard: ["flow DEX · this lesson", "成交流 DEX · 本课"],
	siteCard: ["“DEX” · another site", "“DEX” · 另一网站"],
	flowFrom: ["Monday's prints, by side", "周一的成交，按方向"],
	siteFrom: ["Friday's OI × delta", "周五的 OI × Delta"],
	flowSign: ["which way the tape leaned", "成交偏向哪边"],
	siteSign: ["dealers assumed short calls", "假设做市商做空看涨"],
	claimBig: ["Same label, different numerator.", "同样的标签，不同的分子。"],
	claimSub: [
		"Name the source, sign rule and denominator first.",
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
							const valueRoom = textWidth(rowValue(i, narrow), labelSize + 1);
							const valueX = L.zero + width + 8;
							const sideX = valueX + valueRoom + 8;
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
										width={width}
										height={L.barHeight}
										rx={3}
									/>
									<text
										data-f={`value-${i}`}
										x={valueX + (narrow ? valueRoom : 0)}
										textAnchor={narrow ? "end" : "start"}
										y={y + 4}
										className="wt-film-num"
										style={{ fontSize: labelSize + 1 }}
									>
										{rowValue(i)}
									</text>
									{narrow && signOf(print.lean) !== 0 && (
										<text
											data-f={`signed-value-${i}`}
											x={valueX + valueRoom}
											y={y + 4}
											textAnchor="end"
											className={`wt-film-num ${print.lean === "bearish" ? "wt-film-loss" : "wt-film-gain"}`}
											style={{ fontSize: labelSize + 1 }}
										>
											{rowValue(i, true)}
										</text>
									)}
									<text
										data-f={`tag-${i}`}
										x={sideX}
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
									{!narrow && print === spreadSoldLeg && (
										<text
											data-f="spread-leg-side"
											x={sideX}
											y={y + 4}
											className="wt-small"
											style={{ fontSize: labelSize }}
										>
											{`${t(copy.soldLeg)} · ${t(leanTag[print.lean])}`}
										</text>
									)}
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
					name="meter-gross"
					x={L.right}
					y={L.headY + T.head * 1.25 + T.num * 1.05}
					size={T.num}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					{count(printwise.gross)}
				</Word>
				<Word
					name="meter-value"
					x={L.right}
					y={L.headY + T.head * 1.25 + T.num * 1.05}
					size={T.num}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					{signedCount(netted.net)}
				</Word>
			</g>
			<Word
				name="weight-example"
				x={narrow ? W / 2 : L.left}
				y={narrow ? H * 0.34 : L.top - T.body * 1.8}
				size={T.body}
				anchor={narrow ? "middle" : "start"}
				className="wt-film-num"
			>
				{`${deltaOf(prints[0].strike).toFixed(2)} × ${prints[0].contracts} × 100 = ${count(magnitude(prints[0]))}`}
			</Word>
			<Word
				name="net-equation"
				x={narrow ? W / 2 : L.left}
				y={narrow ? H * 0.34 : L.top - T.body * 1.8}
				size={T.body}
				anchor={narrow ? "middle" : "start"}
				className="wt-film-num"
			>
				{`${count(printwise.bullish)} − ${count(printwise.bearish)} = `}
				<tspan
					className="wt-film-accent"
					style={{ fontSize: Math.min(T.num, T.body * 1.5) }}
				>
					{signedCount(printwise.net)}
				</tspan>
			</Word>
			<Word
				name="net-equation-label"
				x={
					narrow
						? W / 2
						: L.left +
							textWidth(
								`${count(printwise.bullish)} − ${count(printwise.bearish)} = `,
								T.body,
							) +
							textWidth(
								signedCount(printwise.net),
								Math.min(T.num, T.body * 1.5),
							) +
							12
				}
				y={
					narrow
						? H * 0.34 - Math.min(T.num, T.body * 1.5) - 10
						: L.top - T.body * 1.8
				}
				size={T.small}
				anchor={narrow ? "middle" : "start"}
				className="wt-film-tag"
			>
				{t(copy.net).toUpperCase()}
			</Word>
			{narrow && spreadSoldLeg && (
				<>
					<Word
						name="spread-sold-leg"
						x={W / 2}
						y={H * 0.29}
						size={T.small}
						className="wt-film-tag"
					>
						{`${spreadSoldLeg.time} ${spreadSoldLeg.strike}C · ${t(copy.soldLeg)} · ${t(leanTag[spreadSoldLeg.lean])}`}
					</Word>
					<Word
						name="spread-equation"
						x={W / 2}
						y={H * 0.34}
						size={T.body}
						className="wt-film-num wt-film-gain"
					>
						{`${count(magnitude(prints[4]))} − ${count(magnitude(spreadSoldLeg))} = ${signedCount(SPREAD)}`}
					</Word>
				</>
			)}

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
			<Brackets name="lock-two" glow />
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
							// Two seven-character figures, with clear space between them.
							size={Math.min(
								T.big * 0.8,
								(W * (L.pair[1] - L.pair[0]) * 0.8) / (7 * 0.62),
							)}
							className={`wt-film-num ${tone}`}
						>
							{signedCount(num)}
						</Word>
					</g>
				))}
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
				{filmDenominators.map((denominator, i) => (
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
				{filmDenominators.map((denominator, i) => (
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
	const meter = one<SVGTextElement>("meter-value");
	const grossMeter = one("meter-gross");
	const lockTwo = one<SVGGraphicsElement>("lock-two");

	d.hidden([
		one("zero"),
		...prints.flatMap((_, i) => [
			one(`row-${i}`),
			one(`value-${i}`),
			one(`tag-${i}`),
			...(L.narrow && signOf(prints[i].lean) !== 0
				? [one(`signed-value-${i}`)]
				: []),
		]),
		one("spread"),
		one("spread-row"),
		one("weight-example"),
		one("net-equation"),
		one("net-equation-label"),
		...(!L.narrow && spreadSoldLeg ? [one("spread-leg-side")] : []),
		...(L.narrow && spreadSoldLeg
			? [one("spread-sold-leg"), one("spread-equation")]
			: []),
		...kids("meter"),
		...flat("q"),
		one("t-head"),
		one("g-head"),
		one("p-head"),
		...flat("two"),
		lockTwo,
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
	land(one("q-num-0"), 4.8);
	show(one("q-tag-1"), 5.3);
	land(one("q-num-1"), 5.5);
	show(one("q-line"), 6.0);

	// ——— tape: each print, weighted by delta ———
	tl.addLabel("tape", 9.6);
	hide(flat("q"), 9.6);
	show(one("t-head"), 9.8, "above");
	rise(9.9);
	tl.to(one("zero"), { opacity: 1, duration: 0.4 }, 10.2);
	show(one("weight-example"), 10.3, "above", 0.3);
	// Work one print, then reveal the other weighted rows together. Values never
	// describe a partly grown bar; totals appear only after construction settles.
	prints.forEach((_, i) => {
		const at = i === 0 ? 10.5 : 11.85;
		tl.fromTo(
			one(`row-${i}`),
			{ opacity: 0 },
			{ opacity: 1, duration: 0.35 },
			at,
		);
		tl.fromTo(
			one(`value-${i}`),
			{ opacity: 0 },
			{ opacity: 1, duration: 0.35 },
			at,
		);
	});
	show([one("meter-tag"), grossMeter], 12.2, "above", 0.3);
	// Sign by side: mid and unquoted prints drop out.
	d.swap(one("t-head"), one("g-head"), 13.6);
	// The net's tag comes down from above: from below it would cross the figure.
	hide(one("weight-example"), 13.8);
	hide([one("meter-tag"), grossMeter], 14.8);
	prints.forEach((_, i) => {
		show(one(`tag-${i}`), 14.2 + i * 0.12, "right", 0.3);
	});
	const signAt = 15.2;
	prints.forEach((print, i) => {
		const sign = signOf(print.lean);
		const bar = one(`bar-${i}`);
		const width = magnitude(print) * L.unit;
		if (sign > 0) tl.set(bar, { attr: { "data-tone": "gain" } }, signAt);
		else if (sign < 0) {
			tl.set(bar, { attr: { "data-tone": "loss" } }, signAt + 0.3);
			tl.to(
				bar,
				{ attr: { x: L.zero - width }, duration: 0.6, ease: "power2.inOut" },
				signAt,
			);
		} else tl.to(one(`row-${i}`), { opacity: 0.45, duration: 0.5 }, signAt);
	});
	// Signed phone values settle first at 16.1. The labelled equation follows
	// at 16.2, settles at 16.5, then has 1.3 s of quiet before DEI.
	if (L.narrow) {
		const classified = prints.flatMap((print, i) =>
			signOf(print.lean) !== 0 ? [i] : [],
		);
		tl.to(
			classified.map((i) => one(`value-${i}`)),
			{ opacity: 0, duration: 0.3, ease: "power2.out" },
			15.8,
		);
		tl.fromTo(
			classified.map((i) => one(`signed-value-${i}`)),
			{ opacity: 0 },
			{ opacity: 1, duration: 0.3, ease: "power2.in" },
			15.8,
		);
	}
	tl.fromTo(
		[one("net-equation"), one("net-equation-label")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		16.2,
	);

	// ——— dei: one numerator, two full-day denominators ———
	tl.addLabel("dei", 17.8);
	hide(
		[
			one("g-head"),
			one("net-equation"),
			one("net-equation-label"),
			...kids("meter"),
		],
		17.8,
	);
	sink(17.8);
	show(one("d-head"), 18.15, "above");
	land(one("d-net"), 18.5);
	// Both benchmarks form one comparison, settled by 19.8; its explanation
	// follows only after 1.1 seconds of quiet.
	show(
		filmDenominators.flatMap((_, i) => [one(`d-row-${i}`), one(`d-tag-${i}`)]),
		19.3,
	);
	show(one("d-line"), 20.9);

	// ——— spread: one trade, not two prints ———
	tl.addLabel("spread", 24.4);
	hide(kids("dei"), 24.4);
	rise(24.6);
	show(one("p-head"), 24.75, "above");
	tl.to([one("row-4"), one("row-5")], { opacity: 1, duration: 0.3 }, 24.9);
	// The old printwise total is unnecessary here. Hold the highlighted legs
	// for a full second, replace them, then reveal only the new net.
	tl.fromTo(one("spread"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 24.9);
	if (!L.narrow && spreadSoldLeg) {
		const soldIndex = prints.indexOf(spreadSoldLeg);
		tl.to(
			one(`tag-${soldIndex}`),
			{ opacity: 0, duration: 0.4, ease: "power2.out" },
			24.9,
		);
		tl.fromTo(
			one("spread-leg-side"),
			{ opacity: 0 },
			{ opacity: 1, duration: 0.4, ease: "power2.in" },
			24.9,
		);
	}
	if (L.narrow && spreadSoldLeg) {
		const phoneProof = [one("spread-sold-leg"), one("spread-equation")];
		tl.fromTo(phoneProof, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 24.9);
		hide(phoneProof, 28.3);
	}
	tl.to([one("row-4"), one("row-5")], { opacity: 0, duration: 0.4 }, 26.3);
	tl.fromTo(
		one("spread-row"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		26.7,
	);
	show(one("meter-tag-net"), 27.0, "above", 0.3);
	// Fade in place, fully settled and untransformed before the carry.
	tl.fromTo(
		meter,
		{ opacity: 0, x: 0, y: 0 },
		{ opacity: 1, x: 0, y: 0, duration: 0.3 },
		27.0,
	);
	// Carry the constructed answer into the hero instead of reintroducing it.
	hide([one("p-head"), one("meter-tag-net")], 28.3);
	sink(28.3);
	d.carry(meter, one("w-num-1"), 28.3, { duration: 0.9, arc: "x" });
	show(one("w-tag-0"), 28.6);
	land(one("w-num-0"), 28.8);
	// This label enters after the flight passes its lane.
	show(one("w-tag-1"), 29.25, "above", 0.5);
	d.lock(lockTwo, 29.9, {
		around: [one("w-tag-0"), one("w-num-0"), one("w-tag-1"), one("w-num-1")],
		pad: 10,
	});
	tl.addLabel("hero-lock", 29.9);

	// ——— source: a number with the same name ———
	tl.addLabel("source", 34.3);
	hide([...flat("two"), lockTwo], 34.3);
	show(one("s-head"), 34.65, "above");
	show(one("s-title-0"), 35.1);
	land(one("s-num-0"), 35.3);
	show(one("s-from-0"), 35.7);
	show(one("s-title-1"), 36.0);
	land(one("s-num-1"), 36.2);
	show(one("s-from-1"), 36.6);
	// Cut: the claim.
	hide(flat("src"), 40.1);
	tl.fromTo(
		one("c-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		40.5,
	);
	show(one("c-sub"), 40.9);

	// ——— next ———
	tl.addLabel("next", 44.9);
	hide(kids("claim"), 44.9);
	d.close(44.9);
	return tl;
}

export const dexDeiGexFilm: Film = {
	id: "dex-dei-gex",
	label: [
		"DEX and DEI, as a short film: Monday's seven Oct 18 call prints weighted by delta, 27,425 share-equivalents gross; signed by the side each traded on, a net of +17,532; that net divided by two full-day share-volume benchmarks, 1.46% and 1.17%; the 10:50 block counted as one spread, +8,532; and another site's −89,800 'DEX', built from open interest with dealers assumed short",
		"DEX 与 DEI 短片：周一 10月18日 看涨的七笔成交用 Delta 加权，总量 27,425 股等价；按各自成交方向赋号，净额 +17,532；这个净额除以两种全日股票成交量基准，1.46% 和 1.17%；把 10:50 的大单算作一个价差，+8,532；以及另一个网站用未平仓量并假设做市商做空得出的 −89,800 “DEX”",
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["DEX and DEI", "DEX 与 DEI"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "tape", label: ["The tape", "成交"] },
		{ id: "dei", label: ["DEI", "DEI"] },
		{ id: "spread", label: ["The spread", "价差"] },
		{ id: "source", label: ["Another DEX", "另一个 DEX"] },
		{ id: "next", label: ["Next", "下一步"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
