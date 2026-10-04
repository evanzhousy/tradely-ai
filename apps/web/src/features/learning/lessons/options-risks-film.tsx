import { gsap } from "gsap";
import { type Copy, percent, pick, signedUsd, usd } from "@/content/world";
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
import { atExpiry, costFacts, curve, PAID, value } from "./options-risks-model";

/*
 * Risk first, as a film. It opens on a right call that still lost: ALFA up $2, the call
 * down $52. The call's value across ALFA's price sinks as 20 days pass, to $3.68 at $102,
 * and sinks again when implied volatility drops after earnings, to $3.00. Then the writer:
 * Ben collects $420 and loses $1,580 if ALFA ends at $120, more for every dollar above,
 * while the buyer's worst case stops at $420. Last, the spread: a round trip in a busy
 * call costs $81.50, in a thin one $231.50, before ALFA moves at all.
 *
 *   open      0–4      "Risk first"
 *   question  4–9.5    ALFA +$2, the call −$52
 *   decay     9.5–21   bought at $4.20; 20 days: $3.68; IV 25%: $3.00
 *   writer    21–30    Ben +$420 to −$1,580 at $120; the buyer stops at −$420
 *   costs     30–39.5  round trips: −$81.50 and −$231.50; cut: the claim
 *   next      39.5–42  Next: the module checkpoint
 */

const END = 42;
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
const LOSS_CRUSH = Math.round((CRUSH * 100 - PAID) * 100);
const FAR = 120;
const ACTIVE = costFacts({ kind: "active", contracts: 5 });
const THIN = costFacts({ kind: "thin", contracts: 5 });
const tailSpots = [80, 100, 140];

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin } = frame;
	const left = Math.max(margin, narrow ? 46 : 0);
	const right = width * 0.965;
	// On a phone the charts start under the meter in the corner.
	const top = H * (narrow ? 0.5 : 0.3);
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
		"Sep 16: the Oct 18 100 call at the $4.20 ask, 32 days out, IV 35%.",
		"9月16日：以卖价 $4.20 买入 10月18日 100 看涨，距到期 32 天，IV 35%。",
	],
	boughtHeadShort: [
		"Bought at $4.20, 32 days out.",
		"以 $4.20 买入，距到期 32 天。",
	],
	timeHead: [
		`20 days later ALFA is $${UP}, but time has worn the curve down: $3.68.`,
		`20 天后 ALFA 在 $${UP}，但时间把曲线磨低了：$3.68。`,
	],
	timeHeadShort: [
		`20 days, ALFA $${UP}: $3.68.`,
		`20 天，ALFA $${UP}：$3.68。`,
	],
	crushHead: [
		"Earnings pass and IV falls to 25%: the same call is worth $3.00.",
		"财报过后 IV 降到 25%：同一张看涨只值 $3.00。",
	],
	crushHeadShort: ["IV 25%: $3.00.", "IV 25%：$3.00。"],
	axis: ["the call's value per share", "看涨每股价值"],
	paid: ["paid $4.20", "买价 $4.20"],
	today: ["Sep 16", "9月16日"],
	later: ["+20 days", "+20 天"],
	lowIv: ["+20 days, IV 25%", "+20 天，IV 25%"],
	lowIvShort: ["IV 25%", "IV 25%"],
	value: ["call value", "看涨价值"],
	writerHead: [
		"Ben writes the call without owning ALFA and collects $420.",
		"Ben 在不持有 ALFA 的情况下卖出看涨，收取 $420。",
	],
	writerHeadShort: ["Ben writes it for $420.", "Ben 卖出，收 $420。"],
	farHead: [
		`ALFA ends at $${FAR}: Ben is down $1,580, and each $1 more costs $100.`,
		`ALFA 收在 $${FAR}：Ben 亏 $1,580，每多涨 $1 再亏 $100。`,
	],
	farHeadShort: [
		`At $${FAR}: −$1,580, no floor.`,
		`在 $${FAR}：−$1,580，没有底。`,
	],
	buyerHead: [
		"The buyer's worst case is fixed: the $420 paid.",
		"买方的最坏结果是固定的：付出的 $420。",
	],
	buyerHeadShort: ["The buyer: at most −$420.", "买方：最多 −$420。"],
	tailAxis: ["result at Oct 18, one contract", "10月18日 的结果，一张合约"],
	tailAxisShort: ["result at expiry", "到期结果"],
	writer: ["Ben, writer", "Ben，义务方"],
	buyer: ["buyer", "买方"],
	costHead: [
		"Buy 5 and sell straight back: the spread is the cost.",
		"买 5 张再立即卖回：价差就是成本。",
	],
	costHeadShort: ["A round trip of 5.", "5 张的一来一回。"],
	beHead: [
		`In the thin call the bid must climb from $2.20 to $${(THIN.breakeven / 100).toFixed(2)} just to break even.`,
		`在冷门看涨上，买价要从 $2.20 涨到 $${(THIN.breakeven / 100).toFixed(2)} 才能保本。`,
	],
	beHeadShort: [
		`Break even: bid $${(THIN.breakeven / 100).toFixed(2)}.`,
		`保本：买价 $${(THIN.breakeven / 100).toFixed(2)}。`,
	],
	active: ["busy · Oct 18 100", "活跃 · 10月18日 100"],
	thin: ["thin · Dec 20 110", "冷门 · 12月20日 110"],
	of: ["of what you paid", "占你付出的"],
	claimBig: ["Being right isn't enough.", "判断对了还不够。"],
	claimSub: [
		"Time, falling volatility, an open-ended short and the spread can each make you lose.",
		"时间、波动率下降、无上限的空头和价差，每一样都能让你亏钱。",
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
						<path
							data-f="c-crush"
							d={L.decayPath(DAYS_GONE, 25)}
							className="wt-line-short"
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
							style={{ fill: "var(--wt-short)" }}
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
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
						<text
							data-f="far-label"
							x={L.tx(FAR) + 12}
							y={L.ty(atExpiry("writer", FAR)) + 4}
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
					</g>
				</g>
			</g>
			<g data-f="meter">
				<Word
					name="m-tag"
					x={L.right}
					y={L.headY + T.head * 1.25}
					size={T.small}
					anchor="end"
					className="wt-film-tag"
				>
					{t(copy.value).toUpperCase()}
				</Word>
				<Word
					name="m-value"
					x={L.right}
					y={L.headY + T.head * 1.25 + T.num * 1.05}
					size={T.num}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					{usd(PAID)}
				</Word>
				<Word
					name="m-net"
					x={L.right}
					y={L.headY + T.head * 1.25 + T.num * 1.05 + T.body * 1.7}
					size={T.body}
					anchor="end"
					className="wt-film-num wt-film-loss"
				>
					$0
				</Word>
			</g>

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
			{headline("f-head", copy.farHead, copy.farHeadShort)}
			{headline("u-head", copy.buyerHead, copy.buyerHeadShort)}
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
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			time,
		);
	const draw = (path: SVGPathElement, time: number, duration = 1.0) => {
		const length = path.getTotalLength();
		tl.fromTo(
			path,
			{ opacity: 0, strokeDasharray: length, strokeDashoffset: length },
			{ opacity: 1, strokeDashoffset: 0, duration, ease: "power2.inOut" },
			time,
		);
	};
	const marker = one("marker");
	const meterValue = one<SVGTextElement>("m-value");
	const meterNet = one<SVGTextElement>("m-net");
	const perShare = (cents: number) => usd(Math.round(cents));
	const perContract = (cents: number) =>
		Math.round(cents) === 0 ? "$0" : signedUsd(Math.round(cents), 0);
	/** The marker rides from one curve and price to another. */
	const move = (
		from: { spot: number; v: number },
		to: { spot: number; v: number },
		time: number,
	) => {
		const at = { ...from };
		tl.to(
			at,
			{
				spot: to.spot,
				v: to.v,
				duration: 0.9,
				ease: "power2.inOut",
				onUpdate: () =>
					gsap.set(marker, { attr: { cx: L.dx(at.spot), cy: L.dy(at.v) } }),
			},
			time,
		);
	};
	const heads = [
		"b-head",
		"t-head",
		"c-head",
		"w-head",
		"f-head",
		"u-head",
		"o-head",
		"e-head",
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
		one("writer-line"),
		one("buyer-line"),
		one("writer-tag"),
		one("buyer-tag"),
		one("far-dot"),
		one("far-label"),
		one("floor-label"),
		...kids("meter"),
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
	show(one("q-tag"), 4.6);
	show(one("q-alfa-tag"), 4.8);
	word(one("q-alfa-num"), 5.0);
	show(one("q-call-tag"), 5.6);
	word(one("q-call-num"), 5.8);
	show(one("q-line"), 6.8);

	// ——— decay: time and volatility ———
	tl.addLabel("decay", 9.5);
	hide(flat("q"), 9.5);
	show(one("b-head"), 9.7, "above");
	rise(9.8);
	draw(one<SVGPathElement>("c-today"), 10.3);
	show(one("l-today"), 11.0);
	tl.to(one("paid"), { opacity: 1, duration: 0.4 }, 11.2);
	show(one("paid-label"), 11.3);
	pop(marker, 11.6);
	show(kids("meter"), 11.8, "above");
	d.count(meterNet, 0, 11.8, perContract, 0, 0.01);
	// 20 days later.
	d.swap(one("b-head"), one("t-head"), 13.4);
	draw(one<SVGPathElement>("c-later"), 13.8);
	show(one("l-later"), 14.6);
	move({ spot: 100, v: PAID / 100 }, { spot: UP, v: AFTER }, 14.8);
	d.count(meterValue, AFTER * 100, 14.8, perShare, PAID, 0.9);
	d.count(meterNet, LOSS_AFTER, 14.8, perContract, 0, 0.9);
	// IV falls.
	d.swap(one("t-head"), one("c-head"), 17.2);
	draw(one<SVGPathElement>("c-crush"), 17.6);
	show(one("l-crush"), 18.4);
	move({ spot: UP, v: AFTER }, { spot: UP, v: CRUSH }, 18.6);
	d.count(meterValue, CRUSH * 100, 18.6, perShare, AFTER * 100, 0.9);
	d.count(meterNet, LOSS_CRUSH, 18.6, perContract, LOSS_AFTER, 0.9);

	// ——— writer: no floor ———
	tl.addLabel("writer", 21);
	hide([one("c-head"), ...kids("meter")], 21.0);
	sink(21.0);
	tl.set(one("decay"), { opacity: 0 }, 21.4);
	tl.set(one("tail"), { opacity: 1 }, 21.4);
	show(one("w-head"), 21.4, "above");
	rise(21.5);
	draw(one<SVGPathElement>("writer-line"), 22.0);
	show(one("writer-tag"), 22.8);
	d.swap(one("w-head"), one("f-head"), 24.2);
	pop(one("far-dot"), 24.6);
	show(one("far-label"), 24.8, "right");
	d.swap(one("f-head"), one("u-head"), 26.6);
	draw(one<SVGPathElement>("buyer-line"), 27.0);
	show(one("buyer-tag"), 27.8);
	show(one("floor-label"), 28.0);

	// ——— costs: the spread before anything moves ———
	tl.addLabel("costs", 30);
	hide(one("u-head"), 30.0);
	sink(30.0);
	show(one("o-head"), 30.3, "above");
	(["active", "thin"] as const).forEach((name, i) => {
		const at = 30.7 + i * 1.0;
		show([one(`k-${name}-tag`), one(`k-${name}-quote`)], at);
		word(one(`k-${name}-loss`), at + 0.3);
		show(one(`k-${name}-pct`), at + 0.7);
	});
	d.swap(one("o-head"), one("e-head"), 33.4);
	tl.to(
		["k-active-tag", "k-active-quote", "k-active-loss", "k-active-pct"].map(
			one,
		),
		{ opacity: 0.35, duration: 0.4 },
		33.8,
	);
	// Cut: the claim.
	hide([one("e-head"), ...flat("costs")], 35.6);
	word(one("z-big"), 36.0);
	show(one("z-sub"), 36.5);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
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
		{ id: "next", label: ["Next", "下一步"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
