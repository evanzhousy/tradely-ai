import { gsap } from "gsap";
import { type Copy, percent, pick, signedUsd, usd } from "@/content/world";
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
	TitleCard,
	Word,
} from "../walkthrough/film-kit";
import { atExpiry, costFacts, curve, PAID, value } from "./options-risks-model";

/*
 * Risk first, as a film. It opens on a right call that still lost: ALFA up $2, the call
 * down $52. The call's value across ALFA's price sinks as 20 days pass, to $3.68 at $102,
 * and sinks again when implied volatility drops after earnings, to $3.00; the meter reads
 * from the marker. The hero is the writer: as ALFA climbs, Ben's loss passes −$1,580 at
 * $120 and keeps going, no floor; the buyer's falls only to the $420 paid. Last, the
 * spread: a round trip of 5 costs $81.50 in a busy call and $231.50 in a thin one, where
 * the bid must climb to break even.
 *
 *   open      0–4        "Risk first"
 *   question  4–8.8      ALFA +$2, the call −$52
 *   decay     8.8–20.45  bought at $4.20; 20 days: $3.68; IV 25%: $3.00
 *   writer    20.45–32.25 Ben +$420 to −$1,580 at $120 and on; hero: the buyer stops at −$420
 *   costs     32.25–40.2 round trips: −$81.50 and −$231.50; break-even bid
 *   claim     40.2–44.5  being right isn't enough
 *   next      44.5–47    Next: the module checkpoint
 */

const END = 47;
const DECAY_X = [90, 110] as const;
const DECAY_Y = 12;
const TAIL_X = [80, 140] as const;
const TAIL_Y = [-4_000, 4_000] as const;
const DAYS_GONE = 20;
const UP = 102;
const AFTER = value(UP, DAYS_GONE, 35);
const CRUSH = value(UP, DAYS_GONE, 25);
/** Per contract, in cents: 100 shares. */
const LOSS_AFTER = Math.round((AFTER * 100 - PAID) * 100);
const FAR = 120;
const ACTIVE = costFacts({ kind: "active", contracts: 5 });
const THIN = costFacts({ kind: "thin", contracts: 5 });
const tailSpots = [80, 100, 140];

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, type: T } = frame;
	const left = Math.max(margin, narrow ? 56 : 0);
	const right = width * 0.965;
	/** The meter sits under the headline (two lines of it, at most), the chart under it. */
	const meterY = frame.headY + T.head * 2.6;
	const meterNum = meterY + T.head * 1.3;
	const top = narrow
		? H * 0.44
		: Math.max(H * 0.3, meterNum + T.small * 2.2 + 16);
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
	alfa: ["ALFA", "ALFA"],
	call: ["your call", "你的看涨"],
	qLine: [
		"Right about the direction, and still down. How?",
		"方向判断对了，却还在亏。为什么？",
	],
	boughtHead: [
		"Bought at $4.20, 32 days out.",
		"以 $4.20 买入，距到期 32 天。",
	],
	boughtHeadShort: [
		"Bought at $4.20, 32 days out.",
		"以 $4.20 买入，距到期 32 天。",
	],
	timeHead: ["Time wears the call down.", "时间磨损看涨期权。"],
	timeHeadShort: ["Time wears it down.", "时间磨损它。"],
	crushHead: ["Then implied volatility falls.", "接着隐含波动率下降。"],
	crushHeadShort: ["Then IV falls.", "接着 IV 下降。"],
	axis: ["the call's value per share", "看涨每股价值"],
	paid: ["paid $4.20", "买价 $4.20"],
	today: ["Sep 16", "9月16日"],
	later: ["+20 days", "+20 天"],
	lowIv: ["+20 days, IV 25%", "+20 天，IV 25%"],
	lowIvShort: ["IV 25%", "IV 25%"],
	value: ["call value", "看涨价值"],
	pnl: ["your result", "你的盈亏"],
	writerHead: [
		"Ben writes it for $420: no floor.",
		"Ben 以 $420 卖出：亏损没有下限。",
	],
	writerHeadShort: ["Ben writes it: no floor.", "Ben 卖出：没有下限。"],
	buyerHead: ["And the buyer?", "那买方呢？"],
	buyerFloorHead: ["At most −$420.", "最多 −$420。"],
	noFloor: ["no floor ↘", "没有下限 ↘"],
	tailAxis: ["result at Oct 18, one contract", "10月18日 的结果，一张合约"],
	tailAxisShort: ["result at expiry", "到期结果"],
	writer: ["Ben, writer", "Ben，义务方"],
	buyer: ["buyer", "买方"],
	costHead: [
		"Round trip of 5: the spread costs.",
		"5 张一来一回：价差就是成本。",
	],
	costHeadShort: ["A round trip of 5.", "5 张的一来一回。"],
	beHead: [
		`Thin call: the bid must reach $${(THIN.breakeven / 100).toFixed(2)}.`,
		`冷门看涨：买价要涨到 $${(THIN.breakeven / 100).toFixed(2)}。`,
	],
	beHeadShort: [
		`Break even: bid $${(THIN.breakeven / 100).toFixed(2)}.`,
		`保本：买价 $${(THIN.breakeven / 100).toFixed(2)}。`,
	],
	beOnStageShort: [
		`break even $${(THIN.breakeven / 100).toFixed(2)}`,
		`保本 $${(THIN.breakeven / 100).toFixed(2)}`,
	],
	beOnStage: [
		`break even: bid $${(THIN.breakeven / 100).toFixed(2)}`,
		`保本：买价 $${(THIN.breakeven / 100).toFixed(2)}`,
	],
	active: ["busy · Oct 18 100", "活跃 · 10月18日 100"],
	thin: ["thin · Dec 20 110", "冷门 · 12月20日 110"],
	of: ["of what you paid", "占你付出的"],
	claimBig: ["Being right isn't enough.", "判断对了还不够。"],
	claimSub: [
		"Time, IV, an open short, the spread: each costs.",
		"时间、IV、无上限的空头、价差：都会让你亏。",
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
							d={L.decayPath(0, 35)}
							className="wt-line-reference"
						/>
						<path
							data-f="c-later"
							d={L.decayPath(DAYS_GONE, 35)}
							className="wt-line-position"
						/>
						{/* A value under a changed assumption: the caution colour, not a short leg. */}
						<path
							data-f="c-crush"
							d={L.decayPath(DAYS_GONE, 25)}
							className="wt-line-position"
							style={{ stroke: "var(--diagram-unknown)" }}
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
							className="wt-small wt-halo"
							style={{ fill: "var(--diagram-unknown)" }}
						>
							{t(narrow ? copy.lowIvShort : copy.lowIv)}
						</text>
						<circle
							data-f="marker"
							cx={L.dx(100)}
							cy={L.dy(PAID / 100)}
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
					</g>
					<PenTip name="tip" />
					<PenTip name="tip-short" color="var(--wt-short)" />

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
						<path
							data-f="writer-line"
							d={L.tailPath("writer")}
							className="wt-line-short"
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
							style={{ fill: "var(--wt-short)" }}
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
							className="wt-chip"
							style={{ fill: "var(--wt-short)" }}
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
						<text
							data-f="floor-label"
							x={L.tx(82)}
							y={L.ty(atExpiry("buyer", 90)) + 18}
							className="wt-halo wt-accent wt-marker-label"
						>
							{signedUsd(atExpiry("buyer", 90) * 100, 0)}
						</text>
						<text
							data-f="no-floor"
							// Below the falling line a little before its end, where the line has already
							// passed above, clear of the last price tick.
							x={L.tx(133)}
							y={L.ty(atExpiry("writer", 133)) + 20}
							textAnchor="end"
							className="wt-small wt-halo"
							style={{ fill: "var(--wt-short)" }}
						>
							{t(copy.noFloor)}
						</text>
						<circle
							data-f="w-marker"
							cx={L.tx(100)}
							cy={L.ty(atExpiry("writer", 100))}
							r={6}
							className="wt-chip"
							style={{ fill: "var(--wt-short)" }}
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
						<Brackets name="lock-far" tone="short" />
						<Brackets name="lock-floor" glow />
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
								usd(PAID),
								"wt-film-num wt-film-dim",
								0.9,
							],
							["m-net", copy.pnl, "$0", "wt-film-num", 1.3],
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
								1.3,
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
								x={margin + i * L.meterCol}
								y={L.meterY}
								size={T.small}
								anchor="start"
								className="wt-film-tag"
							>
								{t(tag).toUpperCase()}
							</Word>
							<Word
								name={name}
								x={margin + i * L.meterCol}
								y={L.meterNum}
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
							signedUsd((UP - 100) * 100, 0),
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

			{/* Two round trips. */}
			<g data-f="costs">
				{(
					[
						["active", copy.active, ACTIVE],
						["thin", copy.thin, THIN],
					] as const
				).map(([name, tag, facts], i) => (
					<g key={name}>
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
							name={`k-${name}-quote`}
							x={W * L.pair[i]}
							y={H * 0.32 + T.body * 2}
							size={T.body}
							className="wt-film-num wt-film-dim"
						>
							{`${usd(facts.quote.bid)} / ${usd(facts.quote.ask)}`}
						</Word>
						<Word
							name={`k-${name}-loss`}
							x={W * L.pair[i]}
							y={H * 0.32 + T.body * 2 + T.big * 0.95}
							size={T.big * 0.7}
							className="wt-film-num wt-film-loss"
						>
							{signedUsd(-facts.loss, 2)}
						</Word>
						<Word
							name={`k-${name}-pct`}
							x={W * L.pair[i]}
							y={H * 0.32 + T.body * 2 + T.big * 0.95 + T.body * 2}
							size={T.body}
							className="wt-film-type wt-film-dim"
						>
							{`${percent(facts.loss / facts.paid)} ${t(copy.of)}`}
						</Word>
					</g>
				))}
				<Word
					name="k-thin-be"
					x={W * L.pair[1]}
					y={H * 0.32 + T.body * 2 + T.big * 0.95 + T.body * 4.4}
					size={T.body}
					className="wt-film-num wt-film-accent"
				>
					{t(narrow ? copy.beOnStageShort : copy.beOnStage)}
				</Word>
				<Brackets name="lock-be" glow />
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
	const tone = (cents: number) =>
		`wt-film-num ${dollars(cents) > 0 ? "wt-film-gain" : dollars(cents) < 0 ? "wt-film-loss" : ""}`;
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
		one("floor-label"),
		one("no-floor"),
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
	d.trace(one<SVGPathElement>("c-later"), 12.95, { tip, duration: 1.0 });
	show(one("l-later"), 13.75);
	walk(
		0,
		1,
		13.95,
		1.2,
		decayMove({ spot: 100, v: PAID / 100 }, { spot: UP, v: AFTER }),
	);
	// IV falls after earnings.
	d.swap(heads[1], heads[2], 16.5);
	d.trace(one<SVGPathElement>("c-crush"), 16.9, { tip, duration: 1.0 });
	show(one("l-crush"), 17.7);
	walk(
		0,
		1,
		17.9,
		1.0,
		decayMove({ spot: UP, v: AFTER }, { spot: UP, v: CRUSH }),
	);

	// ——— writer: the hero. Ben's loss has no floor; the buyer's stops at $420. ———
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
	show(one("no-floor"), 25.15);
	// The buyer: from +$1,580 at $120 down to $80, and the loss stops at the $420 paid.
	d.swap(heads[3], heads[4], 25.75);
	tl.to(
		[g("lock-far"), one("w-marker")],
		{ opacity: 0.25, duration: 0.3 },
		25.75,
	);
	d.trace(one<SVGPathElement>("buyer-line"), 26.15, { tip, duration: 1.0 });
	show(one("buyer-tag"), 26.95);
	show(one("s-buyer-cell"), 27.15);
	pop(one("b-marker"), 27.15);
	walk(120, 80, 27.45, 1.4, tailMove("buyer", one("b-marker"), sBuyer));
	show(one("floor-label"), 28.75);
	d.lock(g("lock-floor"), 28.75, { around: g("floor-label"), pad: 5 });
	// The hero: the buyer stops at −$420 while the writer's line runs on.
	tl.addLabel("hero-lock", 28.75);
	show(heads[7], 28.75);

	// ——— costs: the spread before anything moves ———
	tl.addLabel("costs", 32.25);
	hide([heads[4], heads[7], ...kids("smeter")], 32.25);
	sink(32.25);
	show(heads[5], 32.45);
	(["active", "thin"] as const).forEach((name, i) => {
		const at = 32.85 + i * 1.0;
		show([one(`k-${name}-tag`), one(`k-${name}-quote`)], at);
		word(one(`k-${name}-loss`), at + 0.3);
		show(one(`k-${name}-pct`), at + 0.7);
	});
	// The thin call: the bid has to climb to break even.
	d.swap(heads[5], heads[6], 36.25);
	tl.to(
		["k-active-tag", "k-active-quote", "k-active-loss", "k-active-pct"].map(
			(n) => one(n),
		),
		{ opacity: 0.35, duration: 0.4 },
		36.65,
	);
	show(one("k-thin-be"), 36.85);
	d.lock(g("lock-be"), 37.05, { around: g("k-thin-be"), pad: 5 });

	// ——— claim ———
	tl.addLabel("claim", 40.2);
	hide([heads[6], ...flat("costs")], 40.2);
	word(one("z-big"), 40.5);
	show(one("z-sub"), 40.9);

	// ——— next ———
	tl.addLabel("next", 44.5);
	hide(kids("claim"), 44.5);
	d.close(44.5);
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
		{ id: "costs", label: ["The spread", "价差"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一步"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
