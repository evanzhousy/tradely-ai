import { gsap } from "gsap";
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
	PenTip,
	signTone,
	TitleCard,
	toneClass,
	toneColor,
	Word,
} from "../walkthrough/film-kit";
import {
	atExpiry,
	costFacts,
	curve,
	DAYS,
	PAID,
	value,
} from "./options-risks-model";

/*
 * Risk first, as a film. It opens on a right call that still lost: ALFA up $2, the call
 * down $52. The call's value across ALFA's price sinks as 20 days pass, to $3.68 at $102,
 * and sinks again when implied volatility drops after earnings, to $3.00; the meter reads
 * from the marker. Ben's uncovered loss passes −$1,580 at $120 and keeps going,
 * with no floor; the hero is the buyer's loss stopping at the $420 paid, before fees.
 * Last, spread and fees: a round trip of 5 costs $81.50 in a busy call and $231.50
 * in a thin one, where the bid must climb to break even.
 *
 *   open      0–4        "Risk first"
 *   question  4–8.8      ALFA +$2, the call −$52
 *   decay     8.8–20.45  bought at $4.20; 20 days: $3.68; IV 25%: $3.00
 *   writer    20.45–32.55 Ben +$420 to −$1,580 at $120 and on; hero: the buyer stops at −$420
 *   costs     32.55–40.5 round-trip costs: $81.50 and $231.50; break-even bid
 *   claim     40.5–44.8  being right isn't enough
 *   next      44.8–47.3  Next: the module checkpoint
 */

const END = 47.3;
const DECAY_X = [90, 110] as const;
const DECAY_Y = 12;
const TAIL_X = [80, 140] as const;
const TAIL_Y = [-4_000, 4_000] as const;
const DAYS_GONE = 20;
const UP = 102;
const START_IV = 35;
const START = value(100, 0, START_IV);
const AFTER = value(UP, DAYS_GONE, START_IV);
const CRUSH = value(UP, DAYS_GONE, 25);
/** Per contract, in cents: 100 shares. */
const LOSS_AFTER = Math.round((AFTER * 100 - PAID) * 100);
const FAR = 120;
const ACTIVE = costFacts({ kind: "active", contracts: 5 });
const THIN = costFacts({ kind: "thin", contracts: 5 });
const COST_SHARES = 5 * 100;
const tailSpots = [80, 100, 140];

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, type: T } = frame;
	const left = Math.max(margin, narrow ? 56 : 0);
	const right = width * 0.965;
	/** Reserve the enlarged buyer readout and its brackets above the chart caption. */
	const meterY = frame.headY + T.head * 2.6;
	const meterNum = meterY + T.head * 1.3;
	const top = narrow
		? H * 0.44
		: Math.max(H * 0.3, meterNum + T.head * 0.95 + T.small * 2.2 + 16);
	const bottom = H * 0.84;
	const dx = (spot: number) =>
		left + ((spot - DECAY_X[0]) / (DECAY_X[1] - DECAY_X[0])) * (right - left);
	const dy = (dollars: number) => bottom - (dollars / DECAY_Y) * (bottom - top);
	const tx = (spot: number) =>
		left + ((spot - TAIL_X[0]) / (TAIL_X[1] - TAIL_X[0])) * (right - left);
	const ty = (cents: number) =>
		bottom - ((cents - TAIL_Y[0]) / (TAIL_Y[1] - TAIL_Y[0])) * (bottom - top);
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		dx,
		dy,
		tx,
		ty,
		decayPath: (days: number, iv: number) =>
			curve(days, iv)
				.map(
					([spot, v], i) =>
						`${i ? "L" : "M"}${dx(spot).toFixed(1)} ${dy(v).toFixed(1)}`,
				)
				.join(""),
		tailPath: (side: "buyer" | "writer") =>
			tailSpots
				.map(
					(spot, i) =>
						`${i ? "L" : "M"}${tx(spot).toFixed(1)} ${ty(atExpiry(side, spot)).toFixed(1)}`,
				)
				.join(""),
		pair: narrow ? [0.27, 0.73] : [0.3, 0.7],
		meterY,
		meterNum,
		meterCol: narrow ? 130 : 230,
	};
}

const copy = {
	title: ["Risk first", "先看风险"],
	titleSub: ["how options lose money", "期权如何亏钱"],
	qTag: ["Oct 6 · bought Sep 16 at $4.20", "10月6日 · 9月16日以 $4.20 买入"],
	alfa: ["ALFA / share", "ALFA / 股"],
	call: ["call / contract", "看涨 / 张"],
	qLine: [
		"Right about the direction, and still down. How?",
		"方向判断对了，却还在亏。为什么？",
	],
	boughtHead: ["Start with the call you bought.", "先看买入时的看涨期权。"],
	boughtHeadShort: [
		"Start with the call you bought.",
		"先看买入时的看涨期权。",
	],
	timeHead: ["Time wears the call down.", "时间磨损看涨期权。"],
	timeHeadShort: ["Time wears it down.", "时间磨损它。"],
	crushHead: [
		"Then implied volatility (IV) falls.",
		"接着隐含波动率（IV）下降。",
	],
	crushHeadShort: ["Implied volatility (IV) falls.", "隐含波动率（IV）下降。"],
	axis: ["modeled call value / share", "看涨模型价值 / 股"],
	spotAxis: ["ALFA price", "ALFA 股价"],
	paid: ["paid $4.20", "买价 $4.20"],
	today: [
		`Sep 16 · ${DAYS} days · IV ${START_IV}%`,
		`9月16日 · ${DAYS} 天 · IV ${START_IV}%`,
	],
	later: ["+20 days", "+20 天"],
	lowIv: ["+20 days, IV 25%", "+20 天，IV 25%"],
	lowIvShort: ["IV 25%", "IV 25%"],
	value: ["model / share", "模型 / 股"],
	pnl: ["result / contract", "盈亏 / 张"],
	writerHead: [
		"Ben writes uncovered: no loss floor.",
		"Ben 裸卖：亏损无下限。",
	],
	writerHeadShort: [
		"Uncovered writer: no loss floor.",
		"Ben 裸卖：亏损无下限。",
	],
	buyerHead: ["And the buyer?", "那买方呢？"],
	buyerFloorHead: ["Loss stops at $420.", "最多亏 $420。"],
	tailAxis: [
		"Oct 18 result · 1 contract · before fees",
		"10月18日结果 · 1张合约 · 不计费用",
	],
	tailAxisShort: [
		"expiry · 1 contract · before fees",
		"到期 · 1张合约 · 不计费用",
	],
	writer: ["Ben, writer", "Ben，义务方"],
	buyer: ["buyer", "买方"],
	costHead: [
		"5 contracts, round trip: spread plus fees.",
		"5 张一来一回：价差加手续费。",
	],
	costHeadShort: [
		"5 contracts, round trip: spread plus fees.",
		"5 张一来一回：价差加手续费。",
	],
	beHead: ["A thin call needs a higher bid.", "冷门看涨需要更高的买价。"],
	beHeadShort: ["Thin: a higher bid.", "冷门：买价要更高。"],
	beOnStageShort: [
		`break even $${(THIN.breakeven / 100).toFixed(3)}`,
		`保本 $${(THIN.breakeven / 100).toFixed(3)}`,
	],
	beOnStage: [
		`break even: bid $${(THIN.breakeven / 100).toFixed(3)}`,
		`保本：买价 $${(THIN.breakeven / 100).toFixed(3)}`,
	],
	active: ["busy · Oct 18 100", "活跃 · 10月18日 100"],
	thin: ["thin · Dec 20 110", "冷门 · 12月20日 110"],
	buyAsk: ["buy ask", "买入卖价"],
	sellBid: ["sell bid", "卖出买价"],
	spread: ["spread", "价差"],
	fees: ["fees", "手续费"],
	shares: ["5 contracts × 100 = 500 shares", "5 张 × 100 = 500 股"],
	claimBig: ["Being right isn't enough.", "判断对了还不够。"],
	claimSub: [
		"Time, volatility, open shorts, spread and fees can cost.",
		"时间、波动率、裸卖、价差与手续费都能致亏。",
	],
	nextBig: ["Next: the module checkpoint", "下一步：本模块检查点"],
	nextSub: ["Start here, on a new day", "在新的一天里运用“从这里开始”"],
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
	const tick = (v: number) => `$${v}`;
	return (
		<>
			<Backdrop frame={L} />

			<g data-f="depth">
				<g data-f="world">
					{/* The call's value across ALFA's price. */}
					<g data-f="decay">
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(copy.axis)}
						</text>
						{[0, 4, 8, 12].map((v) => (
							<g key={v}>
								<path
									d={`M${L.left} ${L.dy(v)}H${L.right}`}
									className={v === 0 ? "wt-axis" : "wt-grid"}
								/>
								<text
									x={L.left - 8}
									y={L.dy(v) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{tick(v)}
								</text>
							</g>
						))}
						{[90, 95, 100, 105, 110].map((v) => (
							<text
								key={v}
								x={L.dx(v)}
								y={L.bottom + 16}
								textAnchor={v === DECAY_X[1] ? "end" : "middle"}
								className="wt-small"
							>
								{tick(v)}
							</text>
						))}
						<text
							x={(L.left + L.right) / 2}
							y={L.bottom + T.small * 3.2}
							textAnchor="middle"
							className="wt-small"
						>
							{t(copy.spotAxis)}
						</text>
						<path
							data-f="paid"
							d={`M${L.left} ${L.dy(PAID / 100)}H${L.right}`}
							className="wt-line-reference"
						/>
						<text
							data-f="paid-label"
							// Under the line at the right, where the curves have climbed above it.
							x={L.right - 4}
							y={L.dy(PAID / 100) + 14}
							textAnchor="end"
							className="wt-small wt-halo"
						>
							{t(copy.paid)}
						</text>
						<path
							data-f="c-today"
							d={L.decayPath(0, START_IV)}
							className="wt-line-reference"
						/>
						<path
							data-f="c-later"
							d={L.decayPath(DAYS_GONE, START_IV)}
							className="wt-line-position"
							strokeDasharray="5 4"
						/>
						{/* A value under a changed assumption: the caution colour, not a short leg. */}
						<path
							data-f="c-crush"
							d={L.decayPath(DAYS_GONE, 25)}
							className="wt-line-position"
							style={{ stroke: toneColor("caution") }}
							strokeDasharray="5 4"
						/>
						<text
							data-f="l-today"
							// A legend in the plot's empty top-left: the curves are low there.
							x={L.left + 8}
							y={L.top + T.small * (1.3 + 0 * 1.45)}
							className="wt-small wt-halo"
						>
							{t(copy.today)}
						</text>
						<text
							data-f="l-later"
							// A legend in the plot's empty top-left: the curves are low there.
							x={L.left + 8}
							y={L.top + T.small * (1.3 + 1 * 1.45)}
							className="wt-small wt-halo wt-accent"
						>
							{t(copy.later)}
						</text>
						<text
							data-f="l-crush"
							// A legend in the plot's empty top-left: the curves are low there.
							x={L.left + 8}
							y={L.top + T.small * (1.3 + 2 * 1.45)}
							className={`wt-small wt-halo ${toneClass.caution}`}
						>
							{t(narrow ? copy.lowIvShort : copy.lowIv)}
						</text>
						<circle
							data-f="marker"
							cx={L.dx(100)}
							cy={L.dy(START)}
							r={6}
							className="wt-chip wt-film-dim"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
					</g>
					<PenTip name="tip" tone="dim" />
					<PenTip name="tip-short" color="var(--tone-ink)" />

					{/* Each side at expiry. */}
					<g data-f="tail">
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(narrow ? copy.tailAxisShort : copy.tailAxis)}
						</text>
						{[-3000, -1500, 0, 1500, 3000].map((v) => (
							<g key={v}>
								<path
									d={`M${L.left} ${L.ty(v)}H${L.right}`}
									className={v === 0 ? "wt-axis" : "wt-grid"}
								/>
								<text
									x={L.left - 8}
									y={L.ty(v) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{v === 0
										? "$0"
										: narrow
											? `${v < 0 ? "−" : "+"}${Math.abs(v) / 1000}k`
											: signedUsd(v * 100, 0)}
								</text>
							</g>
						))}
						{[80, 100, 120, 140].map((v) => (
							<text
								key={v}
								x={L.tx(v)}
								y={L.bottom + 16}
								textAnchor={v === TAIL_X[1] ? "end" : "middle"}
								className="wt-small"
							>
								{tick(v)}
							</text>
						))}
						<text
							x={(L.left + L.right) / 2}
							y={L.bottom + T.small * 3.2}
							textAnchor="middle"
							className="wt-small"
						>
							{t(copy.spotAxis)}
						</text>
						<path
							data-f="writer-line"
							d={L.tailPath("writer")}
							className="wt-line-position"
							style={{ stroke: "var(--tone-ink)", strokeWidth: 2.5 }}
						/>
						<path
							data-f="buyer-line"
							d={L.tailPath("buyer")}
							className="wt-line-position"
						/>
						<text
							data-f="writer-tag"
							x={L.tx(84)}
							y={L.ty(atExpiry("writer", 84)) - 10}
							className="wt-halo wt-marker-label"
							style={{ fill: "var(--tone-ink)" }}
						>
							{t(copy.writer)}
						</text>
						<text
							data-f="buyer-tag"
							x={L.tx(114)}
							y={L.ty(atExpiry("buyer", 114)) - 10}
							textAnchor="end"
							className="wt-halo wt-accent wt-marker-label"
						>
							{t(copy.buyer)}
						</text>
						<circle
							data-f="far-dot"
							cx={L.tx(FAR)}
							cy={L.ty(atExpiry("writer", FAR))}
							r={6}
							className={`wt-chip ${toneClass.down}`}
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
						<text
							data-f="far-label"
							// Above and right of the dot: the line falls away below it.
							x={L.tx(FAR) + 10}
							y={L.ty(atExpiry("writer", FAR)) - 10}
							className="wt-halo wt-loss wt-marker-label"
						>
							{signedUsd(atExpiry("writer", FAR) * 100, 0)}
						</text>
						<path
							data-f="floor-proof"
							d={`M${L.tx(80)} ${L.ty(atExpiry("buyer", 80))}H${L.tx(100)}`}
							className="wt-line-position"
							style={{ strokeWidth: 5 }}
						/>
						<circle
							data-f="w-marker"
							cx={L.tx(100)}
							cy={L.ty(atExpiry("writer", 100))}
							r={6}
							className="wt-chip"
							style={{ fill: "var(--tone-ink)" }}
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
						<circle
							data-f="b-marker"
							cx={L.tx(120)}
							cy={L.ty(atExpiry("buyer", 120))}
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
						<Brackets name="lock-far" tone="loss" />
					</g>
				</g>
			</g>
			{/* Readouts under the headline: the call, then each side at expiry. */}
			{(
				[
					[
						"meter",
						[
							[
								"m-value",
								copy.value,
								usd(Math.round(START * 100)),
								"wt-film-num wt-film-dim",
								0.9,
							],
							[
								"m-net",
								copy.pnl,
								signedUsd((START * 100 - PAID) * 100, 0),
								"wt-film-num wt-film-loss",
								1.3,
							],
						],
					],
					[
						"smeter",
						[
							[
								"s-writer",
								copy.writer,
								signedUsd(atExpiry("writer", 100) * 100, 0),
								"wt-film-num wt-film-gain",
								1.3,
							],
							[
								"s-buyer",
								copy.buyer,
								signedUsd(atExpiry("buyer", 120) * 100, 0),
								"wt-film-num wt-film-gain",
								1.8,
							],
						],
					],
				] as const
			).map(([group, cells]) => (
				<g key={group} data-f={group}>
					{cells.map(([name, tag, start, className, scale], i) => (
						<g key={name} data-f={`${name}-cell`}>
							<Word
								name={`${name}-tag`}
								// Clear the figure's 5 px lock padding and up to 24 px of bracket growth.
								x={margin + i * L.meterCol - (name === "s-buyer" ? 44 : 0)}
								y={name === "s-buyer" ? L.meterNum + T.small * 2 : L.meterY}
								size={T.small}
								anchor={name === "s-buyer" ? "end" : "start"}
								className="wt-film-tag"
							>
								{t(tag).toUpperCase()}
							</Word>
							<Word
								name={name}
								x={margin + i * L.meterCol}
								y={L.meterNum + (name === "s-buyer" ? T.head * 0.5 : 0)}
								size={T.head * scale}
								anchor="start"
								className={className}
							>
								{start}
							</Word>
						</g>
					))}
				</g>
			))}

			{/* A hidden final-value fit keeps the lock exact while the buyer meter walks. */}
			<Word
				name="floor-fit"
				x={margin + L.meterCol}
				y={L.meterNum + T.head * 0.5}
				size={T.head * 1.8}
				anchor="start"
				className="wt-film-num wt-film-loss"
			>
				{signedUsd(atExpiry("buyer", 80) * 100, 0)}
			</Word>
			<Brackets name="lock-floor" tone="loss" glow />
			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-tag"
					x={W / 2}
					y={H * 0.3}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				{(
					[
						[
							"q-alfa",
							copy.alfa,
							`▲${usd((UP - 100) * 100, 0)}`,
							"wt-film-gain",
						],
						["q-call", copy.call, signedUsd(LOSS_AFTER, 0), "wt-film-loss"],
					] as const
				).map(([name, tag, num, tone], i) => (
					<g key={name}>
						<Word
							name={`${name}-tag`}
							x={W * L.pair[i]}
							y={H * 0.44}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`${name}-num`}
							x={W * L.pair[i]}
							y={H * 0.44 + T.big * 0.95}
							size={T.big * 0.85}
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
					y={H * 0.8}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("b-head", copy.boughtHead, copy.boughtHeadShort)}
			{headline("t-head", copy.timeHead, copy.timeHeadShort)}
			{headline("c-head", copy.crushHead, copy.crushHeadShort)}
			{headline("w-head", copy.writerHead, copy.writerHeadShort)}
			{headline("u-head", copy.buyerHead, copy.buyerHead)}
			{/* The answer, a line under the question, as the buyer's floor locks. */}
			<Lines
				name="u2-head"
				text={t(copy.buyerFloorHead)}
				x={margin}
				y={L.headY + T.head * 1.35}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{headline("o-head", copy.costHead, copy.costHeadShort)}
			{headline("e-head", copy.beHead, copy.beHeadShort)}

			{/* Two round trips: buy the ask, sell the bid, then add both fees. */}
			<g data-f="costs">
				<Word
					name="k-shares"
					x={W / 2}
					y={H * 0.245}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.shares)}
				</Word>
				{(
					[
						["active", copy.active, ACTIVE],
						["thin", copy.thin, THIN],
					] as const
				).map(([name, tag, facts], i) => (
					<g key={name}>
						<g data-f={`k-${name}-card`}>
							<Word
								name={`k-${name}-tag`}
								x={W * L.pair[i]}
								y={H * 0.32}
								size={T.small}
								className="wt-film-tag"
							>
								{t(tag).toUpperCase()}
							</Word>
							<Word
								name={`k-${name}-ask`}
								x={W * L.pair[i]}
								y={H * 0.32 + T.body * 1.8}
								size={T.body}
								className={
									name === "active" ? "wt-film-num wt-film-dim" : "wt-film-num"
								}
							>
								{`${t(copy.buyAsk)} ${usd(facts.quote.ask)}`}
							</Word>
							<Word
								name={`k-${name}-bid`}
								x={W * L.pair[i]}
								y={H * 0.32 + T.body * 3.2}
								size={T.body}
								className={
									name === "active" ? "wt-film-num wt-film-dim" : "wt-film-num"
								}
							>
								{`${t(copy.sellBid)} ${usd(facts.quote.bid)}`}
							</Word>
							<Word
								name={`k-${name}-spread-tag`}
								x={W * L.pair[i]}
								y={H * 0.32 + T.body * 5}
								size={T.small}
								className="wt-film-tag"
							>
								{t(copy.spread).toUpperCase()}
							</Word>
							<Word
								name={`k-${name}-spread`}
								x={W * L.pair[i]}
								y={H * 0.32 + T.body * 6.4}
								size={T.body}
								className={
									name === "active" ? "wt-film-num wt-film-dim" : "wt-film-num"
								}
							>
								{`${usd(facts.quote.ask - facts.quote.bid)} × ${COST_SHARES} = ${usd(facts.spread, 0)}`}
							</Word>
							<Word
								name={`k-${name}-fees`}
								x={W * L.pair[i]}
								y={H * 0.32 + T.body * 8}
								size={T.body}
								className={
									name === "active" ? "wt-film-num wt-film-dim" : "wt-film-num"
								}
							>
								{`+ ${t(copy.fees)} ${usd(facts.fees)}`}
							</Word>
						</g>
						<Word
							name={`k-${name}-loss`}
							x={W * L.pair[i]}
							y={H * 0.32 + T.body * 11 + T.big * 0.2}
							size={
								narrow && name === "active"
									? Math.max(T.num, T.big * 0.55)
									: T.big * 0.7
							}
							className="wt-film-num"
						>
							<tspan style={{ fontSize: T.body }}>= </tspan>
							{usd(facts.loss)}
						</Word>
					</g>
				))}
				<Word
					name="k-thin-be"
					x={W * L.pair[1]}
					y={H * 0.32 + T.body * 15.2}
					size={T.body}
					className="wt-film-num wt-film-accent"
				>
					{t(narrow ? copy.beOnStageShort : copy.beOnStage)}
				</Word>
				<Brackets name="lock-be" />
				{narrow ? (
					<g data-f="k-be-proof">
						<Word
							name="k-be-ask"
							x={W / 2 - T.body * 2.8}
							y={H * 0.87}
							size={T.body}
							anchor="end"
							className="wt-film-num wt-film-dim"
						>
							{`${usd(THIN.quote.ask)} +`}
						</Word>
						<Word
							name="k-be-fees"
							x={W / 2}
							y={H * 0.87 - T.body * 0.7}
							size={T.body}
							className="wt-film-num wt-film-dim"
						>
							{usd(THIN.fees)}
						</Word>
						<path
							data-f="k-be-fraction"
							d={`M${W / 2 - T.body * 2} ${H * 0.87 - T.body * 0.23}h${T.body * 4}`}
							className="wt-axis"
						/>
						<Word
							name="k-be-shares"
							x={W / 2}
							y={H * 0.87 + T.body}
							size={T.body}
							className="wt-film-num wt-film-dim"
						>
							{COST_SHARES}
						</Word>
						<Word
							name="k-be-result"
							x={W / 2 + T.body * 2.8}
							y={H * 0.87}
							size={T.body}
							anchor="start"
							className="wt-film-num wt-film-dim"
						>
							{`= ${usd(THIN.breakeven, 3)}`}
						</Word>
					</g>
				) : (
					<Word
						name="k-be-proof"
						x={W / 2}
						y={H * 0.87}
						size={T.body}
						className="wt-film-num wt-film-dim"
					>
						{`${usd(THIN.quote.ask)} + (${usd(THIN.fees)} ÷ ${COST_SHARES}) = ${usd(THIN.breakeven, 3)}`}
					</Word>
				)}
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
	const { tl, one, kids, show, hide, pop, rise, sink } = d;
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
	const tip = one("tip");
	const pen = one("tip-short");
	const marker = one("marker");
	const meterValue = one<SVGTextElement>("m-value");
	const meterNet = one<SVGTextElement>("m-net");
	const sWriter = one<SVGTextElement>("s-writer");
	const sBuyer = one<SVGTextElement>("s-buyer");
	const perShare = (dollars: number) => usd(Math.round(dollars * 100));
	// Whole dollars first, then the sign: −20¢ reads "$0", never "−$0".
	const dollars = (cents: number) => Math.round(cents / 100);
	const perContract = (cents: number) =>
		dollars(cents) === 0 ? "$0" : signedUsd(dollars(cents) * 100, 0);
	const tone = (cents: number) => {
		const sign = signTone(dollars(cents));
		return `wt-film-num ${sign ? toneClass[sign] : "wt-film-dim"}`;
	};
	/**
	 * A tween that walks a value from `from` to `to` and draws everything from it each frame.
	 * Not rendered up front, so nothing reads the walk's end before it begins.
	 */
	const walk = (
		from: number,
		to: number,
		at: number,
		duration: number,
		place: (v: number) => void,
		ease = "power2.inOut",
	) => {
		const v = { at: from };
		tl.fromTo(
			v,
			{ at: from },
			{
				at: to,
				duration,
				ease,
				immediateRender: false,
				onUpdate: () => place(v.at),
			},
			at,
		);
	};
	/** The marker between two points on the value chart, and the meter read from it. */
	const decayMove =
		(a: { spot: number; v: number }, b: { spot: number; v: number }) =>
		(k: number) => {
			const spot = a.spot + (b.spot - a.spot) * k;
			const v = a.v + (b.v - a.v) * k;
			gsap.set(marker, { attr: { cx: L.dx(spot), cy: L.dy(v) } });
			meterValue.textContent = perShare(v);
			const net = (v * 100 - PAID) * 100;
			meterNet.textContent = perContract(net);
			meterNet.setAttribute("class", tone(net));
		};
	/** A side's marker on its line at expiry, and its readout. */
	const tailMove =
		(side: "writer" | "buyer", dot: Element, out: SVGTextElement) =>
		(spot: number) => {
			const cents = atExpiry(side, spot) * 100;
			gsap.set(dot, {
				attr: { cx: L.tx(spot), cy: L.ty(atExpiry(side, spot)) },
			});
			out.textContent = perContract(cents);
			out.setAttribute("class", tone(cents));
		};
	const heads = [
		"b-head",
		"t-head",
		"c-head",
		"w-head",
		"u-head",
		"o-head",
		"e-head",
		"u2-head",
	].map((name) => one(name));

	d.hidden([
		one("tail"),
		one("paid"),
		one("paid-label"),
		one("c-today"),
		one("c-later"),
		one("c-crush"),
		one("l-today"),
		one("l-later"),
		one("l-crush"),
		marker,
		tip,
		pen,
		one("writer-line"),
		one("buyer-line"),
		one("writer-tag"),
		one("buyer-tag"),
		one("far-dot"),
		one("far-label"),
		one("floor-fit"),
		one("floor-proof"),
		one("w-marker"),
		one("b-marker"),
		g("lock-far"),
		g("lock-floor"),
		...kids("meter"),
		...kids("smeter"),
		...flat("q"),
		...heads,
		...flat("costs"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: right, and still down ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.4);
	show(one("q-alfa-tag"), 4.6);
	word(one("q-alfa-num"), 4.8);
	show(one("q-call-tag"), 5.2);
	word(one("q-call-num"), 5.4);
	show(one("q-line"), 5.3);

	// ——— decay: time and volatility ———
	tl.addLabel("decay", 8.8);
	hide(flat("q"), 8.8);
	show(heads[0], 9.0);
	rise(9.1);
	d.trace(one<SVGPathElement>("c-today"), 9.4, { tip, duration: 1.2 });
	show(one("l-today"), 10.4);
	tl.to(one("paid"), { opacity: 1, duration: 0.4 }, 10.6);
	show(one("paid-label"), 10.7);
	pop(marker, 11.0);
	show(kids("meter"), 11.2);
	// 20 days later: the marker rides to $102 on the worn curve.
	d.swap(heads[0], heads[1], 12.55);
	// The pen switches role with an attribute set, which a backward seek restores exactly.
	const penTo = (tone: string, at: number) =>
		tl.set(tip, { attr: { "data-pen": tone } }, at);
	penTo("focus", 12.95);
	d.trace(one<SVGPathElement>("c-later"), 12.95, { tip, duration: 1.0 });
	show(one("l-later"), 13.75);
	tl.set(marker, { attr: { class: `wt-chip ${toneClass.focus}` } }, 13.95);
	walk(
		0,
		1,
		13.95,
		1.2,
		decayMove({ spot: 100, v: START }, { spot: UP, v: AFTER }),
		"none",
	);
	// IV falls after earnings.
	d.swap(heads[1], heads[2], 16.5);
	penTo("caution", 16.9);
	d.trace(one<SVGPathElement>("c-crush"), 16.9, { tip, duration: 1.0 });
	show(one("l-crush"), 17.7);
	tl.set(marker, { attr: { class: `wt-chip ${toneClass.caution}` } }, 17.9);
	walk(
		0,
		1,
		17.9,
		1.0,
		decayMove({ spot: UP, v: AFTER }, { spot: UP, v: CRUSH }),
	);

	// ——— expiry: Ben's loss has no floor; the buyer's stops at $420. ———
	tl.addLabel("writer", 20.45);
	hide([heads[2], ...kids("meter")], 20.45);
	sink(20.45);
	tl.set(one("decay"), { opacity: 0 }, 20.85);
	tl.set(one("tail"), { opacity: 1 }, 20.85);
	show(heads[3], 20.85);
	rise(20.95);
	d.trace(one<SVGPathElement>("writer-line"), 21.25, {
		tip: pen,
		duration: 1.0,
	});
	show(one("writer-tag"), 22.05);
	show(one("s-writer-cell"), 22.25);
	pop(one("w-marker"), 22.25);
	// ALFA climbs from $100 to $140: past −$1,580 at $120, and on.
	walk(
		100,
		140,
		22.65,
		2.4,
		tailMove("writer", one("w-marker"), sWriter),
		"power1.inOut",
	);
	pop(one("far-dot"), 23.85);
	show(one("far-label"), 23.85, "right");
	d.lock(g("lock-far"), 23.85, {
		around: [g("far-dot"), g("far-label")],
		pad: 5,
	});
	// The buyer: from +$1,580 at $120 down to $80, and the loss stops at the $420 paid.
	// One full second of rest after the writer walk settles at 25.05.
	d.swap(heads[3], heads[4], 26.05);
	tl.to(one("s-writer-cell"), { opacity: 0.35, duration: 0.35 }, 26.05);
	tl.to(
		[g("lock-far"), one("w-marker")],
		{ opacity: 0.25, duration: 0.3 },
		26.05,
	);
	penTo("focus", 26.45);
	d.trace(one<SVGPathElement>("buyer-line"), 26.45, { tip, duration: 1.0 });
	show(one("buyer-tag"), 27.25);
	show(one("s-buyer-cell"), 27.45);
	pop(one("b-marker"), 27.45);
	walk(120, 80, 27.75, 1.4, tailMove("buyer", one("b-marker"), sBuyer));
	d.lock(g("lock-floor"), 28.75, { around: g("floor-fit"), pad: 5 });
	// The hero: the buyer stops at −$420 while the writer's line runs on.
	tl.addLabel("hero-lock", 28.75);
	show(heads[7], 28.75);
	// After the hero stands, draw along its unchanged loss floor.
	d.trace(one<SVGPathElement>("floor-proof"), 30.7, { duration: 0.5 });

	// ——— costs: labelled quotes, spread and fees, then settled totals ———
	tl.addLabel("costs", 32.55);
	hide([heads[4], heads[7], ...kids("smeter"), g("lock-floor")], 32.55);
	sink(32.55);
	show(heads[5], 32.9);
	show(one("k-shares"), 32.9);
	(["active", "thin"] as const).forEach((name) => {
		// The labelled quotes, multiplication and both fees arrive as one complete card.
		show(one(`k-${name}-card`), 32.9);
		// Cards settle at 33.4; leave 1.25 seconds before the already-correct totals.
		word(one(`k-${name}-loss`), 34.65);
	});
	// Both totals settle at 35.2, leaving 1.35 seconds before the headline transition.
	d.swap(heads[5], heads[6], 36.55);
	tl.to(
		[one("k-active-card"), one("k-active-loss")],
		{ opacity: 0.35, duration: 0.4 },
		37.25,
	);
	show(one("k-thin-be"), 37.0);
	d.lock(g("lock-be"), 37.2, { around: g("k-thin-be"), pad: 5 });
	// Make the per-share fee hurdle visible after a full second of rest.
	tl.fromTo(
		one("k-be-proof"),
		{ opacity: 0, x: 0, y: 0 },
		{ opacity: 1, duration: 0.5 },
		38.65,
	);

	// ——— claim ———
	tl.addLabel("claim", 40.5);
	hide([heads[6], ...flat("costs")], 40.5);
	word(one("z-big"), 40.8);
	show(one("z-sub"), 41.2);

	// ——— next ———
	tl.addLabel("next", 44.8);
	hide(kids("claim"), 44.8);
	d.close(44.8);
	return tl;
}

export const optionsRisksFilm: Film = {
	id: "options-risks",
	label: [
		`Risk first, as a short film: ALFA up $2 while the call bought at $4.20 is down ${usd(-LOSS_AFTER, 0)}; the call's value sinking as 20 days pass, to ${usd(Math.round(AFTER * 100))} at $${UP}, and again when implied volatility falls to 25%, to ${usd(Math.round(CRUSH * 100))}; the writer, Ben, collecting $420 and losing $1,580 if ALFA ends at $${FAR}, with no floor, while the buyer's loss stops at $420; and round trips of five contracts that cost ${usd(ACTIVE.loss)} in a busy call and ${usd(THIN.loss)} in a thin one`,
		`先看风险短片：ALFA 上涨 $2，而 $4.20 买入的看涨却亏 ${usd(-LOSS_AFTER, 0)}；随着 20 天过去，看涨价值下沉，在 $${UP} 只值 ${usd(Math.round(AFTER * 100))}，隐含波动率降到 25% 后又降到 ${usd(Math.round(CRUSH * 100))}；义务方 Ben 收取 $420，若 ALFA 收在 $${FAR} 则亏 $1,580，没有下限，而买方最多亏 $420；以及 5 张合约的一来一回，活跃看涨花 ${usd(ACTIVE.loss)}，冷门看涨花 ${usd(THIN.loss)}`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Risk first", "先看风险"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "decay", label: ["Time and IV", "时间与 IV"] },
		{ id: "writer", label: ["The writer", "义务方"] },
		{ id: "costs", label: ["Spread and fees", "价差与手续费"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一步"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
