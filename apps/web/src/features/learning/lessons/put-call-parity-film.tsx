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
	AFTERNOON,
	AFTERNOON_PARITY,
	callLeg,
	callMid,
	GAP,
	LATE,
	LATE_PUT,
	MORNING,
	NET_DEBIT,
	putLeg,
	putMid,
	RANGE,
	STRIKE,
	synthetic,
} from "./put-call-parity-model";

/*
 * Put-call parity, as a film. It opens on a long Oct 18 100 call and a short 100 put and
 * asks what they are worth together if ALFA ends at $90. The legs answer: $0 and −$1,000,
 * and summed at every price they make one straight line, 100 shares bought at $100; the
 * $0.15 net debit makes it $100.15. Then the identity, C − P = S − K: $5.25 − $3.25 at
 * $102, $2.74 − $5.74 at $97. Last, a call print $0.65 above parity turns out to have
 * executed at 13:58 with ALFA at $103.05, where it is in line.
 *
 *   open      0–4      "Put-call parity"
 *   question  4–9.5    long call + short put; ALFA at $90?
 *   legs      9.5–20.5 call; short put; the sum; net debit
 *   balance   20.5–29  C − P = S − K at $102 and $97
 *   prints    29–39.5  10:30; 14:12, $0.65 off; executed 13:58; cut: the claim
 *   next      39.5–42  Next: expiration
 */

const END = 42;
const Y = [-2_000, 2_000] as const;
const spots = [RANGE[0], STRIKE, RANGE[1]];
const per = (dollars: number) => dollars * 100;
const share = (dollars: number) => usd(Math.round(dollars * 100));
const signedShare = (dollars: number) => signedUsd(Math.round(dollars * 100));
const BAL = [102, 97] as const;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin } = frame;
	const left = Math.max(margin, narrow ? 46 : 0);
	const right = width * 0.965;
	const top = H * (narrow ? 0.4 : 0.3);
	const bottom = H * 0.84;
	const x = (spot: number) =>
		left + ((spot - RANGE[0]) / (RANGE[1] - RANGE[0])) * (right - left);
	const y = (dollars: number) =>
		bottom - ((dollars - Y[0]) / (Y[1] - Y[0])) * (bottom - top);
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		x,
		y,
		path: (f: (spot: number) => number) =>
			spots
				.map(
					(s, i) =>
						`${i ? "L" : "M"}${x(s).toFixed(1)} ${y(per(f(s))).toFixed(1)}`,
				)
				.join(""),
		rowY: (i: number) =>
			H * (narrow ? 0.32 : 0.3) + i * H * (narrow ? 0.17 : 0.15),
		rowH: H * (narrow ? 0.14 : 0.12),
	};
}

const copy = {
	title: ["Put-call parity", "看跌-看涨平价"],
	titleSub: ["how calls, puts and shares line up", "看涨、看跌与股票如何对齐"],
	qTag: [
		"long Oct 18 100 call + short Oct 18 100 put",
		"多头 10月18日 100 看涨 + 空头 10月18日 100 看跌",
	],
	qTagShort: ["long 100 call + short 100 put", "多 100 看涨 + 空 100 看跌"],
	qLine: [
		"ALFA ends at $90. Before premiums, what are they worth together?",
		"ALFA 收于 $90。不计权利金，两者合计值多少？",
	],
	callHead: [
		"The long call: ALFA minus $100 above the strike, nothing below.",
		"看涨多头：行权价以上值 ALFA 减 $100，以下为零。",
	],
	callHeadShort: ["The long call.", "看涨多头。"],
	putHead: [
		"The short put costs $100 minus ALFA below the strike: −$1,000 at $90.",
		"看跌空头在行权价以下要付 $100 减 ALFA：$90 时 −$1,000。",
	],
	putHeadShort: [
		"The short put: −$1,000 at $90.",
		"看跌空头：$90 时 −$1,000。",
	],
	sumHead: [
		"Add them at every price: one straight line, like 100 shares bought at $100.",
		"每个价格相加：一条直线，就像以 $100 买入 100 股。",
	],
	sumHeadShort: ["Together: 100 shares at $100.", "合起来：$100 的 100 股。"],
	debitHead: [
		`Pay the $4.20 ask, receive the $4.05 bid: a $${NET_DEBIT.toFixed(2)} debit, like shares at $${(STRIKE + NET_DEBIT).toFixed(2)}.`,
		`付 $4.20 卖价、收 $4.05 买价：净付 $${NET_DEBIT.toFixed(2)}，相当于以 $${(STRIKE + NET_DEBIT).toFixed(2)} 买股。`,
	],
	debitHeadShort: [
		`Net debit $${NET_DEBIT.toFixed(2)}: shares at $${(STRIKE + NET_DEBIT).toFixed(2)}.`,
		`净付 $${NET_DEBIT.toFixed(2)}：$${(STRIKE + NET_DEBIT).toFixed(2)} 的股票。`,
	],
	axis: ["one contract at Oct 18", "一张合约，10月18日"],
	callTag: ["long call", "看涨多头"],
	putTag: ["short put", "看跌空头"],
	sumTag: ["call + short put", "看涨 + 看跌空头"],
	balHead: [
		"So call minus put equals ALFA minus the strike.",
		"所以看涨减看跌，等于 ALFA 减行权价。",
	],
	balHeadShort: ["C − P = S − K.", "C − P = S − K。"],
	lowHead: [
		"At $97 the put is the dearer one: both sides are −$3.00.",
		"在 $97，看跌更贵：两边都是 −$3.00。",
	],
	lowHeadShort: ["At $97: both −$3.00.", "在 $97：两边都是 −$3.00。"],
	alfa: ["ALFA", "ALFA"],
	call: ["call", "看涨"],
	put: ["put", "看跌"],
	printsHead: [
		"Check prints against parity, with prices from the same moment.",
		"用同一时刻的价格检验成交是否符合平价。",
	],
	printsHeadShort: ["Prints against parity.", "成交对照平价。"],
	offHead: [
		`At 14:12 a call print at $5.90 looks $${GAP.toFixed(2)} above parity.`,
		`14:12 一笔 $5.90 的看涨成交，看起来比平价高 $${GAP.toFixed(2)}。`,
	],
	offHeadShort: [
		`14:12: $${GAP.toFixed(2)} off?`,
		`14:12：偏离 $${GAP.toFixed(2)}？`,
	],
	lateHead: [
		"It executed at 13:58, with ALFA at $103.05: in line after all.",
		"它实际在 13:58 成交，当时 ALFA 为 $103.05：其实符合平价。",
	],
	lateHeadShort: ["Executed 13:58: in line.", "13:58 成交：符合。"],
	inLine: ["in line", "符合"],
	off: ["off", "偏离"],
	late: ["late report · executed 13:58", "延迟报告 · 13:58 成交"],
	lateShort: ["late · 13:58", "延迟 · 13:58"],
	parity: ["parity", "平价"],
	claimBig: [
		"Parity links prices from the same moment.",
		"平价连接的是同一时刻的价格。",
	],
	claimSub: [
		"A long call and a short put are 100 shares; check a print against the stock at its own time.",
		"看涨多头加看跌空头就是 100 股；检验成交要用它自己那一刻的股价。",
	],
	nextBig: ["Next: expiration", "下一课：到期"],
	nextSub: ["exercise, assignment and settlement", "行权、指派与结算"],
} as const satisfies Record<string, Copy>;

/** The three prints, each with its parity check. */
const PRINTS = [
	{
		id: "morning",
		time: "10:30",
		spot: MORNING.spot,
		text: `C $${MORNING.call.toFixed(2)} · P $${MORNING.put.toFixed(2)}`,
		check: `C − P ${signedShare(MORNING.call - MORNING.put)} · S − K ${signedShare(MORNING.spot - STRIKE)}`,
		ok: true,
	},
	{
		id: "afternoon",
		time: "14:12",
		spot: AFTERNOON.spot,
		text: `P $${AFTERNOON.put.toFixed(2)} · C $${LATE.call.toFixed(2)}`,
		check: `parity C ${share(AFTERNOON_PARITY)}`,
		ok: false,
	},
	{
		id: "late",
		time: "13:58",
		spot: LATE.spot,
		text: `C $${LATE.call.toFixed(2)}`,
		check: `parity C ${share(LATE_PUT / 100 + (LATE.spot - STRIKE))}`,
		ok: true,
	},
] as const;

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
	const eq = narrow ? T.head * 1.1 : T.title;
	const eqY = H * (narrow ? 0.42 : 0.5);
	const eqY2 = eqY + eq * 2.4;
	return (
		<>
			<Backdrop frame={L} />

			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart">
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(copy.axis)}
						</text>
						{[-1000, 0, 1000].map((v) => (
							<g key={v}>
								<path
									d={`M${L.left} ${L.y(v)}H${L.right}`}
									className={v === 0 ? "wt-axis" : "wt-grid"}
								/>
								<text
									x={L.left - 8}
									y={L.y(v) + 4}
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
						{[80, 90, 100, 110, 120].map((v) => (
							<text
								key={v}
								x={L.x(v)}
								y={L.bottom + 16}
								textAnchor={
									v === RANGE[1] ? "end" : v === RANGE[0] ? "start" : "middle"
								}
								className="wt-small"
							>
								{`$${v}`}
							</text>
						))}
						<path
							data-f="call-line"
							d={L.path(callLeg)}
							className="wt-line-long"
						/>
						<path
							data-f="put-line"
							d={L.path(putLeg)}
							className="wt-line-short"
						/>
						<path
							data-f="sum-line"
							d={L.path(synthetic)}
							className="wt-line-position"
						/>
						<text
							data-f="call-tag"
							x={L.x(117)}
							y={L.y(per(callLeg(117))) + 18}
							textAnchor="end"
							className="wt-small wt-halo"
							style={{ fill: "var(--wt-long)" }}
						>
							{t(copy.callTag)}
						</text>
						<text
							data-f="put-tag"
							x={L.x(84)}
							y={L.y(per(putLeg(84))) - 10}
							className="wt-small wt-halo"
							style={{ fill: "var(--wt-short)" }}
						>
							{t(copy.putTag)}
						</text>
						<text
							data-f="sum-tag"
							x={L.x(108)}
							y={L.y(per(synthetic(108))) - 12}
							textAnchor="end"
							className="wt-small wt-halo wt-accent"
						>
							{t(copy.sumTag)}
						</text>
						<g data-f="at90">
							<circle
								cx={L.x(90)}
								cy={L.y(per(callLeg(90)))}
								r={5}
								className="wt-chip"
							/>
							<circle
								cx={L.x(90)}
								cy={L.y(per(putLeg(90)))}
								r={6}
								className="wt-chip"
								stroke="var(--foreground)"
								strokeWidth={1.5}
							/>
							<text
								// On a phone the put's tag sits below-left: label the dot on its right.
								x={L.x(90) + (narrow ? 12 : 10)}
								y={L.y(per(putLeg(90))) + (narrow ? 5 : 18)}
								className="wt-halo wt-loss wt-marker-label"
							>
								{signedUsd(per(synthetic(90)) * 100, 0)}
							</text>
						</g>
						<g data-f="debit">
							<path
								d={`M${L.x(STRIKE + NET_DEBIT)} ${L.y(-1500)}V${L.y(1500)}`}
								className="wt-bracket"
								strokeDasharray="4 3"
							/>
							<text
								x={L.x(STRIKE + NET_DEBIT) + 6}
								y={L.y(-1500)}
								className="wt-halo wt-accent wt-marker-label"
							>
								{`$${(STRIKE + NET_DEBIT).toFixed(2)}`}
							</text>
						</g>
					</g>
				</g>
			</g>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Lines
					name="q-tag"
					text={t(narrow ? copy.qTagShort : copy.qTag)}
					x={W / 2}
					y={H * 0.36}
					size={T.head}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.56}
					size={T.title}
					maxWidth={room}
				/>
			</g>
			{headline("c-head", copy.callHead, copy.callHeadShort)}
			{headline("p-head", copy.putHead, copy.putHeadShort)}
			{headline("s-head", copy.sumHead, copy.sumHeadShort)}
			{headline("d-head", copy.debitHead, copy.debitHeadShort)}

			{/* C − P = S − K. */}
			{headline("b-head", copy.balHead, copy.balHeadShort)}
			{headline("l-head", copy.lowHead, copy.lowHeadShort)}
			<g data-f="balance">
				<Word
					name="b-alfa"
					x={W / 2}
					y={H * (narrow ? 0.3 : 0.2)}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.alfa).toUpperCase()}
				</Word>
				{BAL.map((spot) => (
					<Word
						key={spot}
						name={`b-spot-${spot}`}
						x={W / 2}
						y={H * (narrow ? 0.3 : 0.2) + T.num * 1.2}
						size={T.num}
						className="wt-film-num wt-film-accent"
					>
						{`$${spot}`}
					</Word>
				))}
				{BAL.map((spot) => {
					const c = callMid(spot);
					const p = putMid(spot);
					return (
						<g key={spot} data-f={`eq-${spot}`}>
							<text
								x={W / 2}
								y={eqY}
								textAnchor="middle"
								className="wt-film-num"
								style={{ fontSize: eq }}
							>
								<tspan className="wt-film-gain">{share(c)}</tspan>
								{" − "}
								<tspan className="wt-film-loss">{share(p)}</tspan>
								{" = "}
								<tspan className="wt-film-accent">{signedShare(c - p)}</tspan>
							</text>
							<text
								x={W / 2}
								y={eqY2}
								textAnchor="middle"
								className="wt-film-num"
								style={{ fontSize: eq }}
							>
								{`$${spot} − $${STRIKE} = `}
								<tspan className="wt-film-accent">
									{signedShare(spot - STRIKE)}
								</tspan>
							</text>
						</g>
					);
				})}
				<Word
					name="b-c"
					x={W / 2}
					y={eqY - eq * 1.2}
					size={T.small}
					className="wt-film-tag"
				>
					{`${t(copy.call).toUpperCase()} − ${t(copy.put).toUpperCase()}`}
				</Word>
				<Word
					name="b-s"
					x={W / 2}
					y={eqY2 - eq * 1.2}
					size={T.small}
					className="wt-film-tag"
				>
					S − K
				</Word>
			</g>

			{/* Three prints. */}
			{headline("r-head", copy.printsHead, copy.printsHeadShort)}
			{headline("o-head", copy.offHead, copy.offHeadShort)}
			{headline("a-head", copy.lateHead, copy.lateHeadShort)}
			{PRINTS.map((print, i) => (
				<g key={print.id} data-f={`row-${print.id}`}>
					<rect
						x={margin}
						y={L.rowY(i)}
						width={room}
						height={L.rowH}
						rx={10}
						className={
							print.id === "late" ? "wt-focus-shape" : "wt-panel-shape"
						}
					/>
					<text
						x={margin + 14}
						y={L.rowY(i) + L.rowH * 0.4}
						className="wt-film-num"
						style={{ fontSize: text }}
					>
						{`${print.time} · ALFA $${print.spot.toFixed(2)}`}
					</text>
					<text
						x={margin + 14}
						y={L.rowY(i) + L.rowH * 0.76}
						className="wt-film-num wt-film-dim"
						style={{ fontSize: text }}
					>
						{narrow ? print.text : `${print.text} · ${print.check}`}
					</text>
					<text
						data-f={`v-${print.id}`}
						x={margin + room - 14}
						y={L.rowY(i) + L.rowH * 0.4}
						textAnchor="end"
						className={`wt-film-type ${print.ok ? "wt-film-gain" : "wt-film-loss"}`}
						style={{ fontSize: text }}
					>
						{print.ok ? t(copy.inLine) : `${t(copy.off)} $${GAP.toFixed(2)}`}
					</text>
					{print.id === "late" ? (
						<text
							x={margin + room - 14}
							y={L.rowY(i) + L.rowH * 0.76}
							textAnchor="end"
							className="wt-film-type wt-film-accent"
							style={{ fontSize: T.small }}
						>
							{t(narrow ? copy.lateShort : copy.late)}
						</text>
					) : null}
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
	const { tl, one, kids, show, hide, rise, sink } = d;
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
	const heads = [
		"c-head",
		"p-head",
		"s-head",
		"d-head",
		"b-head",
		"l-head",
		"r-head",
		"o-head",
		"a-head",
	].map((name) => one(name));
	const rows = PRINTS.map((print) => one(`row-${print.id}`));

	d.hidden([
		...flat("q"),
		...heads,
		...[
			"call-line",
			"put-line",
			"sum-line",
			"call-tag",
			"put-tag",
			"sum-tag",
			"at90",
			"debit",
		].map((name) => one(name)),
		...kids("balance"),
		...rows,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	word(one("q-line"), 5.0);

	// ——— legs: two options, one line ———
	tl.addLabel("legs", 9.5);
	hide(flat("q"), 9.5);
	show(heads[0], 9.7, "above");
	rise(9.8);
	draw(one<SVGPathElement>("call-line"), 10.3);
	show(one("call-tag"), 11.1);
	d.swap(heads[0], heads[1], 12.2);
	draw(one<SVGPathElement>("put-line"), 12.6);
	show(one("put-tag"), 13.4);
	show(one("at90"), 13.6);
	d.swap(heads[1], heads[2], 15.0);
	tl.to(
		[one("call-line"), one("put-line"), one("call-tag"), one("put-tag")],
		{ opacity: 0.3, duration: 0.4 },
		15.4,
	);
	draw(one<SVGPathElement>("sum-line"), 15.4);
	show(one("sum-tag"), 16.2);
	d.swap(heads[2], heads[3], 17.6);
	show(one("debit"), 18.0);

	// ——— balance: C − P = S − K ———
	tl.addLabel("balance", 20.5);
	hide(heads[3], 20.5);
	sink(20.5);
	show(heads[4], 20.8, "above");
	show([one("b-alfa"), one("b-spot-102")], 21.1);
	show(one("b-c"), 21.4);
	word(one("eq-102"), 21.6);
	show(one("b-s"), 22.2);
	d.swap(heads[4], heads[5], 24.4);
	d.flip(one("b-spot-102"), one("b-spot-97"), 24.8);
	tl.set(one("b-spot-102"), { opacity: 0 }, 25.1);
	d.flip(one("eq-102"), one("eq-97"), 25.0);
	tl.set(one("eq-102"), { opacity: 0 }, 25.3);

	// ——— prints: the same moment ———
	tl.addLabel("prints", 29);
	hide([heads[5], ...kids("balance")], 29.0);
	show(heads[6], 29.2, "above");
	show(rows[0], 29.6);
	d.swap(heads[6], heads[7], 31.4);
	show(rows[1], 31.8);
	d.swap(heads[7], heads[8], 33.8);
	show(rows[2], 34.2, "right");
	tl.to(rows[1], { opacity: 0.4, duration: 0.4 }, 34.6);
	// Cut: the claim.
	hide([heads[8], ...rows], 36.4);
	word(one("z-big"), 36.8);
	show(one("z-sub"), 37.3);

	// ——— next ———
	tl.addLabel("next", 39.5);
	hide(kids("claim"), 39.5);
	d.close(39.5);
	return tl;
}

export const putCallParityFilm: Film = {
	id: "put-call-parity",
	label: [
		`Put-call parity, as a short film: a long Oct 18 100 call and a short 100 put, worth $0 and −$1,000 at $90, summing at every price to one straight line, 100 shares bought at $100, or $${(STRIKE + NET_DEBIT).toFixed(2)} after the $${NET_DEBIT.toFixed(2)} net debit; call minus put equal to ALFA minus the strike, at $102 and at $97; and a call print $${GAP.toFixed(2)} above parity that executed at 13:58 with ALFA at $103.05, where it is in line`,
		`看跌-看涨平价短片：10月18日 100 看涨多头和 100 看跌空头，在 $90 时分别值 $0 和 −$1,000，每个价格相加成一条直线，就像以 $100 买入 100 股，扣除 $${NET_DEBIT.toFixed(2)} 净支出后是 $${(STRIKE + NET_DEBIT).toFixed(2)}；看涨减看跌等于 ALFA 减行权价，$102 和 $97 时都成立；以及一笔看似比平价高 $${GAP.toFixed(2)} 的看涨成交，实际在 13:58 ALFA 为 $103.05 时成交，其实符合平价`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Put-call parity", "平价"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "legs", label: ["Two legs", "两条腿"] },
		{ id: "balance", label: ["C − P = S − K", "C − P = S − K"] },
		{ id: "prints", label: ["Prints", "成交"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
