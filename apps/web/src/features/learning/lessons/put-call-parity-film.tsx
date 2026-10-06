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
 * asks what they are worth together if ALFA ends at $90. Each leg draws behind its pen:
 * $0 and −$1,000. Then the two lines bend into one straight line, 100 shares bought at
 * $100; the $0.15 net debit makes it $100.15. The hero: ALFA walks from $97 to $102 and
 * both sides of C − P = S − K count together, −$3.00 to +$2.00, equal at every price.
 * Last, a 14:12 call print looks $0.65 above parity; it executed at 13:58 with ALFA at
 * $103.05, and the gap counts down to nothing: in line.
 *
 *   open      0–4        "Put-call parity"
 *   question  4–8.8      long call + short put; ALFA at $90?
 *   legs      8.8–13     $0 and −$1,000 at $90
 *   sum       13–17      the two lines become one: 100 shares at $100
 *   debit     17–21      net of premiums: $100.15
 *   identity  21–28      hero: ALFA $97 → $102, C − P = S − K all the way
 *   prints    28–32      a 14:12 print looks $0.65 off
 *   late      32–36.8    it executed at 13:58: in line
 *   claim     36.8–41.2  parity links prices from the same moment
 *   next      41.2–43.7  Next: expiration
 */

const END = 43.7;
const Y = [-2_000, 2_000] as const;
const spots = [RANGE[0], STRIKE, RANGE[1]];
const per = (dollars: number) => dollars * 100;
const share = (dollars: number) => usd(Math.round(dollars * 100));
const signedShare = (dollars: number) => signedUsd(Math.round(dollars * 100));
/** Where the identity's walk ends, and so how it is drawn at rest. */
const BAL = [102] as const;
const LATE_TIME = "13:58";
const LATE_TEXT = `P $${LATE_PUT.toFixed(2)} · C $${LATE.call.toFixed(2)}`;
const LATE_CHECK = `parity C ${share(LATE_PUT + (LATE.spot - STRIKE))}`;

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
	title: ["Put-call parity", "看涨看跌平价"],
	titleSub: ["how calls, puts and shares line up", "看涨、看跌与股票如何对齐"],
	qTag: [
		"long Oct 18 100 call + short Oct 18 100 put",
		"多头 10月18日 100 看涨 + 空头 10月18日 100 看跌",
	],
	qTagShort: ["long 100 call + short 100 put", "多 100 看涨 + 空 100 看跌"],
	qLine: [
		"ALFA ends at $90. What are both worth?",
		"ALFA 收于 $90，两者合计值多少？",
	],
	legsHead: [
		"Long call $0, short put −$1,000.",
		"看涨多头 $0，看跌空头 −$1,000。",
	],
	sumHead: [
		"Together: one line, like 100 shares.",
		"合起来：一条直线，就像 100 股。",
	],
	debitHead: [
		`Net of premiums: shares at $${(STRIKE + NET_DEBIT).toFixed(2)}.`,
		`计入权利金：相当于 $${(STRIKE + NET_DEBIT).toFixed(2)} 买股。`,
	],
	axis: ["one contract at Oct 18", "一张合约，10月18日"],
	callTag: ["long call", "看涨多头"],
	putTag: ["short put", "看跌空头"],
	sumTag: ["call + short put = 100 shares", "看涨 + 看跌空头 = 100 股"],
	sumTagShort: ["= 100 shares", "= 100 股"],
	balHead: ["C − P = S − K at every price.", "每个价格下，C − P = S − K。"],
	alfa: ["ALFA", "ALFA"],
	call: ["call", "看涨"],
	put: ["put", "看跌"],
	offHead: [
		`A 14:12 call print looks $${GAP.toFixed(2)} off.`,
		`14:12 一笔看涨成交，看似偏离 $${GAP.toFixed(2)}。`,
	],
	lateHead: ["It executed at 13:58: in line.", "它在 13:58 成交：符合平价。"],
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
		"Check each print with prices from its own moment.",
		"检验成交，要用它那一刻的价格。",
	],
	nextBig: ["Next: expiration", "下一课：到期"],
	nextSub: ["exercise, assignment and settlement", "行权、指派与结算"],
} as const satisfies Record<string, Copy>;

/** Two prints, each with its parity check; the afternoon one also has its late version. */
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
						{/* Rising lines: names above-left or below-right, so the line runs away from them. */}
						<text
							data-f="call-tag"
							x={L.x(117)}
							y={L.y(per(callLeg(117))) - 10}
							textAnchor="end"
							className="wt-small wt-halo"
							style={{ fill: "var(--wt-long)" }}
						>
							{t(copy.callTag)}
						</text>
						<text
							data-f="put-tag"
							x={L.x(84)}
							y={L.y(per(putLeg(84))) + 18}
							className="wt-small wt-halo"
							style={{ fill: "var(--wt-short)" }}
						>
							{t(copy.putTag)}
						</text>
						<text
							data-f="sum-tag"
							x={L.x(108)}
							y={L.y(per(synthetic(108))) + 18}
							className="wt-small wt-halo wt-accent"
						>
							{t(narrow ? copy.sumTagShort : copy.sumTag)}
						</text>
						<PenTip name="tip-long" color="var(--wt-long)" />
						<PenTip name="tip-short" color="var(--wt-short)" />
						{/* At $90: the call's $0 above its flat line, the put's −$1,000. */}
						<g data-f="at90">
							<circle
								data-f="dot-call"
								cx={L.x(90)}
								cy={L.y(per(callLeg(90)))}
								r={6}
								className="wt-chip"
								style={{ fill: "var(--wt-long)" }}
								stroke="var(--foreground)"
								strokeWidth={1.5}
							/>
							<text
								data-f="lab-call"
								x={L.x(90) + 10}
								y={L.y(per(callLeg(90))) - 10}
								className="wt-halo wt-marker-label"
								style={{ fill: "var(--wt-long)" }}
							>
								$0
							</text>
							<circle
								data-f="dot-put"
								cx={L.x(90)}
								cy={L.y(per(putLeg(90)))}
								r={6}
								className="wt-chip"
								style={{ fill: "var(--wt-short)" }}
								stroke="var(--foreground)"
								strokeWidth={1.5}
							/>
							<text
								data-f="lab-put"
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
			{headline("l-head", copy.legsHead, copy.legsHead)}
			{headline("s-head", copy.sumHead, copy.sumHead)}
			{headline("d-head", copy.debitHead, copy.debitHead)}

			{/* C − P = S − K, live as ALFA moves; drawn at $102, where it ends. */}
			{headline("b-head", copy.balHead, copy.balHead)}
			<g data-f="balance">
				<Word
					name="b-alfa"
					x={W / 2}
					y={H * (narrow ? 0.27 : 0.2)}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.alfa).toUpperCase()}
				</Word>
				<text
					data-f="b-spot"
					x={W / 2}
					y={H * (narrow ? 0.27 : 0.2) + T.num * 1.2}
					textAnchor="middle"
					className="wt-film-num wt-film-accent"
					style={{ fontSize: T.num }}
				>
					{`$${BAL[0].toFixed(2)}`}
				</text>
				<Word
					name="b-c"
					x={W / 2}
					y={eqY - eq * 1.2}
					size={T.small}
					className="wt-film-tag"
				>
					{`${t(copy.call).toUpperCase()} − ${t(copy.put).toUpperCase()}`}
				</Word>
				<text
					data-f="eq-cp"
					x={W / 2}
					y={eqY}
					textAnchor="middle"
					className="wt-film-num"
					style={{ fontSize: eq }}
				>
					<tspan data-f="cp-c" className="wt-film-gain">
						{share(callMid(BAL[0]))}
					</tspan>
					{" − "}
					<tspan data-f="cp-p" className="wt-film-loss">
						{share(putMid(BAL[0]))}
					</tspan>
					{" = "}
					<tspan data-f="cp-r" className="wt-film-accent">
						{signedShare(callMid(BAL[0]) - putMid(BAL[0]))}
					</tspan>
				</text>
				<Word
					name="b-s"
					x={W / 2}
					y={eqY2 - eq * 1.2}
					size={T.small}
					className="wt-film-tag"
				>
					S − K
				</Word>
				<text
					data-f="eq-sk"
					x={W / 2}
					y={eqY2}
					textAnchor="middle"
					className="wt-film-num"
					style={{ fontSize: eq }}
				>
					<tspan data-f="sk-s">{`$${BAL[0].toFixed(2)}`}</tspan>
					{` − $${STRIKE} = `}
					<tspan data-f="sk-r" className="wt-film-accent">
						{signedShare(BAL[0] - STRIKE)}
					</tspan>
				</text>
			</g>
			<Brackets name="lock-eq" glow />

			{/* Two prints; the second turns out to have executed earlier. */}
			{headline("o-head", copy.offHead, copy.offHead)}
			{headline("a-head", copy.lateHead, copy.lateHead)}
			{PRINTS.map((print, i) => {
				const lines = (
					suffix: string,
					time: string,
					spot: number,
					detail: string,
					check: string,
				) => (
					<>
						<text
							data-f={`r1-${suffix}`}
							x={margin + 14}
							y={L.rowY(i) + L.rowH * 0.4}
							className="wt-film-num"
							style={{ fontSize: text }}
						>
							{`${time} · ALFA $${spot.toFixed(2)}`}
						</text>
						<text
							data-f={`r2-${suffix}`}
							x={margin + 14}
							y={L.rowY(i) + L.rowH * 0.76}
							className="wt-film-num wt-film-dim"
							style={{ fontSize: text }}
						>
							{narrow ? detail : `${detail} · ${check}`}
						</text>
					</>
				);
				return (
					<g key={print.id} data-f={`row-${print.id}`}>
						<rect
							data-f={`box-${print.id}`}
							x={margin}
							y={L.rowY(i)}
							width={room}
							height={L.rowH}
							rx={10}
							className="wt-panel-shape"
						/>
						{lines(print.id, print.time, print.spot, print.text, print.check)}
						{print.id === "afternoon" &&
							lines("late", LATE_TIME, LATE.spot, LATE_TEXT, LATE_CHECK)}
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
						{print.id === "afternoon" && (
							<>
								<text
									data-f="v-late"
									x={margin + room - 14}
									y={L.rowY(i) + L.rowH * 0.4}
									textAnchor="end"
									className="wt-film-type wt-film-gain"
									style={{ fontSize: text }}
								>
									{t(copy.inLine)}
								</text>
								<text
									data-f="tag-late"
									x={margin + room - 14}
									y={L.rowY(i) + L.rowH * 0.76}
									textAnchor="end"
									className="wt-film-type wt-film-accent"
									style={{ fontSize: T.small }}
								>
									{t(narrow ? copy.lateShort : copy.late)}
								</text>
							</>
						)}
					</g>
				);
			})}
			<Brackets name="lock-off" tone="loss" />
			<Brackets name="lock-row" tone="gain" />
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
	const fade = (target: Element | Element[], time: number, to = 0) =>
		tl.to(target, { opacity: to, duration: 0.3 }, time);
	const heads = [
		"l-head",
		"s-head",
		"d-head",
		"b-head",
		"o-head",
		"a-head",
	].map((name) => one(name));
	const rows = ["row-morning", "row-afternoon"].map((name) => one(name));
	const callLine = one("call-line");
	const putLine = one("put-line");
	// The identity, live: ALFA, the call and the put at a price, and both sides.
	const spot = one("b-spot");
	const cpC = one("cp-c");
	const cpP = one("cp-p");
	const cpR = one("cp-r");
	const skS = one("sk-s");
	const skR = one("sk-r");
	const place = (at: number) => {
		const s = Math.round(at * 100) / 100;
		const c = callMid(s);
		const p = putMid(s);
		spot.textContent = `$${s.toFixed(2)}`;
		cpC.textContent = share(c);
		cpP.textContent = share(p);
		cpR.textContent = signedShare(c - p);
		skS.textContent = `$${s.toFixed(2)}`;
		skR.textContent = signedShare(s - STRIKE);
	};
	const walk = (from: number, to: number, at: number, duration: number) => {
		const state = { at: from };
		tl.fromTo(
			state,
			{ at: from },
			{
				at: to,
				duration,
				ease: "power2.inOut",
				immediateRender: false,
				onUpdate: () => place(state.at),
			},
			at,
		);
	};
	const gap = one<SVGTextElement>("v-afternoon");

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
			"debit",
			"tip-long",
			"tip-short",
		].map((name) => one(name)),
		...kids("at90"),
		...kids("balance"),
		g("lock-eq"),
		...rows,
		...["r1-late", "r2-late", "v-late", "tag-late"].map((name) => one(name)),
		g("lock-off"),
		g("lock-row"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.4);
	word(one("q-line"), 5.0);

	// ——— legs: what each is worth at $90 ———
	tl.addLabel("legs", 8.8);
	hide(flat("q"), 8.8);
	show(heads[0], 9.0);
	rise(9.0);
	d.trace(one<SVGPathElement>("call-line"), 9.4, { tip: one("tip-long") });
	show(one("call-tag"), 10.3);
	d.trace(one<SVGPathElement>("put-line"), 10.6, { tip: one("tip-short") });
	show(one("put-tag"), 11.5);
	pop(one("dot-call"), 11.8);
	show(one("lab-call"), 11.9);
	pop(one("dot-put"), 12.0);
	show(one("lab-put"), 12.1);

	// ——— sum: the two lines become one, like 100 shares ———
	tl.addLabel("sum", 13.0);
	d.swap(heads[0], heads[1], 13.0);
	hide([one("lab-call"), one("call-tag"), one("put-tag")], 13.2);
	d.morph(callLine, L.path(synthetic), 13.6, 1.0);
	d.morph(putLine, L.path(synthetic), 13.6, 1.0);
	// The call's $0 at $90 comes down to the put's −$1,000: the sum.
	tl.to(
		one("dot-call"),
		{
			attr: { cy: L.y(per(synthetic(90))) },
			duration: 1.0,
			ease: "power2.inOut",
		},
		13.6,
	);
	tl.set(one("sum-line"), { opacity: 1 }, 14.6);
	tl.set([callLine, putLine], { opacity: 0 }, 14.6);
	// The merged dot takes the one line's colour.
	tl.set(
		[one("dot-call"), one("dot-put")],
		{ fill: "var(--diagram-accent)" },
		14.6,
	);
	show(one("sum-tag"), 14.8);

	// ——— debit: net of premiums ———
	tl.addLabel("debit", 17.0);
	d.swap(heads[1], heads[2], 17.0);
	show(one("debit"), 17.6);

	// ——— identity: the hero. ALFA walks from $97 to $102 and both sides move together. ———
	tl.addLabel("identity", 21);
	hide(heads[2], 21);
	sink(21);
	show(heads[3], 21.3);
	walk(97, 97, 21.6, 0.01);
	show([one("b-alfa"), spot], 21.7);
	show(one("b-c"), 21.9);
	word(one("eq-cp"), 22);
	show(one("b-s"), 22.3);
	word(one("eq-sk"), 22.4);
	walk(97, 102, 23.2, 1.8);
	d.lock(g("lock-eq"), 25.1, { around: [g("eq-cp"), g("eq-sk")], pad: 12 });
	tl.addLabel("hero-lock", 25.1);

	// ——— prints: one looks off ———
	tl.addLabel("prints", 28);
	hide([heads[3], ...kids("balance"), g("lock-eq")], 28);
	show(heads[4], 28.2);
	show(rows[0], 28.6);
	show(rows[1], 29.1);
	d.lock(g("lock-off"), 29.8, { around: gap, pad: 5 });

	// ——— late: it executed earlier, with ALFA higher; the gap closes ———
	tl.addLabel("late", 32);
	d.swap(heads[4], heads[5], 32);
	fade(g("lock-off"), 32);
	d.flip(one("r1-afternoon"), one("r1-late"), 32.5);
	tl.set(one("r1-afternoon"), { opacity: 0 }, 32.8);
	d.flip(one("r2-afternoon"), one("r2-late"), 32.9);
	tl.set(one("r2-afternoon"), { opacity: 0 }, 33.2);
	d.count(gap, 0, 33.3, (v) => `${d.t(copy.off)} $${v.toFixed(2)}`, GAP, 0.8);
	d.flip(gap, one("v-late"), 34.3);
	tl.set(gap, { opacity: 0 }, 34.6);
	show(one("tag-late"), 34.5);
	d.lock(g("lock-row"), 34.7, { around: g("box-afternoon"), pad: 4 });

	// ——— claim ———
	tl.addLabel("claim", 36.8);
	hide([heads[5], ...rows, g("lock-row")], 36.8);
	word(one("z-big"), 37.1);
	show(one("z-sub"), 37.4);

	// ——— next ———
	tl.addLabel("next", 41.2);
	hide(kids("claim"), 41.2);
	d.close(41.2);
	return tl;
}

export const putCallParityFilm: Film = {
	id: "put-call-parity",
	label: [
		`Put-call parity, as a short film: a long Oct 18 100 call and a short 100 put, worth $0 and −$1,000 at $90, summing at every price to one straight line, 100 shares bought at $100, or $${(STRIKE + NET_DEBIT).toFixed(2)} after the $${NET_DEBIT.toFixed(2)} net debit; call minus put equal to ALFA minus the strike, at $102 and at $97; and a call print $${GAP.toFixed(2)} above parity that executed at 13:58 with ALFA at $103.05, where it is in line`,
		`看涨看跌平价短片：10月18日 100 看涨多头和 100 看跌空头，在 $90 时分别值 $0 和 −$1,000，每个价格相加成一条直线，就像以 $100 买入 100 股，扣除 $${NET_DEBIT.toFixed(2)} 净支出后是 $${(STRIKE + NET_DEBIT).toFixed(2)}；看涨减看跌等于 ALFA 减行权价，$102 和 $97 时都成立；以及一笔看似比平价高 $${GAP.toFixed(2)} 的看涨成交，实际在 13:58 ALFA 为 $103.05 时成交，其实符合平价`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Put-call parity", "平价"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "legs", label: ["Two legs", "两条腿"] },
		{ id: "sum", label: ["One line", "一条直线"] },
		{ id: "debit", label: ["Net debit", "净支出"] },
		{ id: "identity", label: ["C − P = S − K", "C − P = S − K"] },
		{ id: "prints", label: ["Prints", "成交"] },
		{ id: "late", label: ["A late print", "延迟成交"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
