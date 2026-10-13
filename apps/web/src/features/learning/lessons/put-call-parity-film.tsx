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
	CALL_PAID,
	callLeg,
	callMid,
	GAP,
	LATE,
	LATE_PUT,
	MORNING,
	NET_DEBIT,
	PUT_RECEIVED,
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
 * $103.05; its execution-time prices and verdict replace the apparent gap together.
 *
 *   open      0–4        "Put-call parity"
 *   question  4–8.8      long call + short put; ALFA at $90?
 *   legs      8.8–13.6   $0 and −$1,000 at $90, then one second of rest
 *   sum       13.6–23.3    combine the legs, then subtract the premium debit
 *   debit     17.6–23.3    $4.20 − $4.05 = $0.15/share; zero moves to $100.15
 *   identity  23.3–30.3      hero: ALFA $97 → $102, C − P = S − K all the way
 *   prints    30.3–34.3      a 14:12 print looks $0.65 off
 *   late      34.3–39.5    it executed at 13:58: in line
 *   claim     39.5–43.9  parity links prices from the same moment
 *   next      43.9–46.4  Next: expiration
 */

const END = 46.4;
const Y = [-2_000, 2_000] as const;
const spots = [RANGE[0], STRIKE, RANGE[1]];
const per = (dollars: number) => dollars * 100;
const share = (dollars: number) => usd(Math.round(dollars * 100));
const signedShare = (dollars: number) => signedUsd(Math.round(dollars * 100));
/** Where the identity's walk ends, and so how it is drawn at rest. */
const BAL = [102] as const;
const LATE_TIME = "13:58";

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
			H * (narrow ? 0.28 : 0.3) + i * H * (narrow ? 0.29 : 0.15),
		rowH: H * (narrow ? 0.25 : 0.12),
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
	legsHead: ["Two legs, valued at $90.", "两条腿，在 $90 估值。"],
	sumHead: [
		"Combine the legs, then subtract premiums.",
		"合并两条腿，再扣除权利金。",
	],
	axis: ["Oct 18 · 100 shares/pair", "10月18日 · 每组 100 股"],
	premiumCost: [
		`ask ${usd(CALL_PAID)} − bid ${usd(PUT_RECEIVED)}`,
		`买价 ${usd(CALL_PAID)} − 卖价 ${usd(PUT_RECEIVED)}`,
	],
	premiumDebit: [
		`= ${share(NET_DEBIT)}/share · ${share(per(NET_DEBIT))}/pair`,
		`= ${share(NET_DEBIT)}/股 · ${share(per(NET_DEBIT))}/组`,
	],
	callTag: ["long call", "看涨多头"],
	putTag: ["short put", "看跌空头"],
	sumTag: ["call + short put = 100 shares", "看涨 + 看跌空头 = 100 股"],
	sumTagShort: ["= 100 shares", "= 100 股"],
	balHead: ["C − P = S − K at every price.", "每个价格下，C − P = S − K。"],
	modelScope: [
		"Model mids · no interest/dividends",
		"模型中间价 · 无利息、股息",
	],
	call: ["call", "看涨"],
	put: ["put", "看跌"],
	offHead: ["One 14:12 print looks off.", "14:12 有一笔成交看似偏离。"],
	lateHead: ["Use the print’s execution time.", "按实际成交时刻核对。"],
	inLine: ["in line", "符合"],
	withinSpread: ["within spread", "价差内"],
	modelPut: ["model P", "模型 P"],
	off: ["off", "偏离"],
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
		check: [
			`C − P = ${signedShare(MORNING.call - MORNING.put)}`,
			`S − K = ${signedShare(MORNING.spot - STRIKE)}`,
		],
		ok: true,
	},
	{
		id: "afternoon",
		time: "14:12",
		spot: AFTERNOON.spot,
		text: `P $${AFTERNOON.put.toFixed(2)} · C $${LATE.call.toFixed(2)}`,
		check: [
			`${share(AFTERNOON.put)} + ${share(AFTERNOON.spot - STRIKE)}`,
			`= ${share(AFTERNOON_PARITY)}`,
		],
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
	const text = T.body;
	const eq = narrow ? T.head * 1.2 : T.title;
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
								data-f="debit-guide"
								d={`M${L.x(STRIKE)} ${L.y(-1500)}V${L.y(1500)}`}
								className="wt-bracket"
								strokeDasharray="4 3"
							/>
							<text
								data-f="debit-entry"
								x={L.x(STRIKE) + 6}
								y={L.y(-1500)}
								className="wt-halo wt-accent wt-marker-label"
							>
								{`$${STRIKE.toFixed(2)}`}
							</text>
							<circle
								data-f="debit-zero"
								cx={L.x(STRIKE)}
								cy={L.y(0)}
								r={4}
								fill="var(--diagram-accent)"
							/>
						</g>
						<Word
							name="premium-cost"
							x={L.left}
							y={H * (narrow ? 0.24 : 0.17)}
							size={T.body}
							anchor="start"
							className="wt-film-num wt-film-dim"
						>
							{t(copy.premiumCost)}
						</Word>
						<Word
							name="premium-debit"
							x={L.left}
							y={H * (narrow ? 0.3 : 0.22)}
							size={T.body}
							anchor="start"
							className="wt-film-num wt-film-accent"
						>
							{t(copy.premiumDebit)}
						</Word>
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
					{t(copy.modelScope)}
				</Word>
				<text
					data-f="b-spot"
					x={W / 2}
					y={H * (narrow ? 0.27 : 0.2) + (narrow ? T.body * 1.4 : T.num * 1.2)}
					textAnchor="middle"
					className="wt-film-num wt-film-accent"
					style={{ fontSize: narrow ? T.body : T.num }}
				>
					{`ALFA $${BAL[0].toFixed(2)}`}
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
					check: readonly string[],
				) => (
					<>
						<text
							data-f={`r1-${suffix}`}
							x={margin + 14}
							y={L.rowY(i) + L.rowH * (narrow ? 0.22 : 0.4)}
							className="wt-film-num"
							style={{ fontSize: text }}
						>
							{`${time} · ALFA $${spot.toFixed(2)}`}
						</text>
						<text
							data-f={`r2-${suffix}`}
							x={margin + 14}
							y={L.rowY(i) + L.rowH * (narrow ? 0.45 : 0.76)}
							className="wt-film-num wt-film-dim"
							style={{ fontSize: text }}
						>
							{narrow
								? detail
								: `${detail} · ${check.join(suffix === "morning" ? " · " : " ")}`}
						</text>
						{narrow && (
							<>
								<text
									data-f={`r3-${suffix}`}
									x={margin + 14}
									y={L.rowY(i) + L.rowH * 0.68}
									className="wt-film-num wt-film-dim"
									style={{ fontSize: text }}
								>
									{check[0]}
								</text>
								<text
									data-f={`r4-${suffix}`}
									x={margin + 14}
									y={L.rowY(i) + L.rowH * 0.9}
									className="wt-film-num wt-film-dim"
									style={{ fontSize: text }}
								>
									{check[1]}
								</text>
							</>
						)}
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
						{lines(
							print.id,
							print.time,
							print.spot,
							print.text,
							print.ok
								? print.check
								: [`${t(copy.parity)} C = ${print.check[0]}`, print.check[1]],
						)}
						{print.id === "afternoon" &&
							lines(
								"late",
								LATE_TIME,
								LATE.spot,
								`${t(copy.modelPut)} ${share(LATE_PUT)} · C ${share(LATE.call)}`,
								[
									`${t(copy.parity)} C = ${share(LATE_PUT)} + ${share(LATE.spot - STRIKE)}`,
									`= ${share(LATE_PUT + (LATE.spot - STRIKE))}`,
								],
							)}
						<text
							data-f={`v-${print.id}`}
							x={margin + room - 14}
							y={L.rowY(i) + L.rowH * (narrow ? 0.9 : 0.4)}
							textAnchor="end"
							className={`wt-film-type ${print.ok ? "wt-film-gain" : "wt-film-loss"}`}
							style={{ fontSize: text }}
						>
							{print.ok
								? t(copy.withinSpread)
								: `${t(copy.off)} $${GAP.toFixed(2)}`}
						</text>
						{print.id === "afternoon" && (
							<text
								data-f="v-late"
								x={margin + room - 14}
								y={L.rowY(i) + L.rowH * (narrow ? 0.9 : 0.4)}
								textAnchor="end"
								className="wt-film-type wt-film-gain"
								style={{ fontSize: text }}
							>
								{t(copy.inLine)}
							</text>
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
	const heads = ["l-head", "s-head", "b-head", "o-head", "a-head"].map((name) =>
		one(name),
	);
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
		spot.textContent = `ALFA $${s.toFixed(2)}`;
		cpC.textContent = share(c);
		cpP.textContent = share(p);
		cpR.textContent = signedShare(c - p);
		skS.textContent = `$${s.toFixed(2)}`;
		skR.textContent = signedShare(s - STRIKE);
		for (const result of [cpR, skR])
			result.setAttribute(
				"class",
				s < STRIKE ? "wt-film-loss" : "wt-film-accent",
			);
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
	// One debit state moves every representation of the adjusted expiry result.
	const adjustPremium = (offset: number) => {
		const debit = Math.round(offset * 100) / 100;
		const adjusted = (s: number) => synthetic(s) - debit;
		one("sum-line").setAttribute("d", L.path(adjusted));
		const lossY = L.y(per(adjusted(90)));
		for (const name of ["dot-call", "dot-put"])
			one(name).setAttribute("cy", String(lossY));
		one("lab-put").setAttribute("y", String(lossY + (L.narrow ? 5 : 18)));
		one("lab-put").textContent = signedUsd(per(adjusted(90)) * 100, 0);
		one("sum-tag").setAttribute("y", String(L.y(per(adjusted(108))) + 18));
		const entryX = L.x(STRIKE + debit);
		one("debit-guide").setAttribute(
			"d",
			`M${entryX} ${L.y(-1500)}V${L.y(1500)}`,
		);
		one("debit-zero").setAttribute("cx", String(entryX));
		one("debit-entry").setAttribute("x", String(entryX + 6));
		one("debit-entry").textContent = `$${(STRIKE + debit).toFixed(2)}`;
	};

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
			"premium-cost",
			"premium-debit",
			"tip-long",
			"tip-short",
		].map((name) => one(name)),
		...kids("at90"),
		...kids("balance"),
		g("lock-eq"),
		...rows,
		...[
			"r1-late",
			"r2-late",
			...(L.narrow ? ["r3-late", "r4-late"] : []),
			"v-late",
		].map((name) => one(name)),
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
	tl.addLabel("sum", 13.6);
	d.swap(heads[0], heads[1], 13.6);
	hide([one("lab-call"), one("call-tag"), one("put-tag")], 13.8);
	d.morph(callLine, L.path(synthetic), 14.2, 1.0);
	d.morph(putLine, L.path(synthetic), 14.2, 1.0);
	// The call's $0 at $90 comes down to the put's −$1,000: the sum.
	tl.to(
		one("dot-call"),
		{
			attr: { cy: L.y(per(synthetic(90))) },
			duration: 1.0,
			ease: "power2.inOut",
		},
		14.2,
	);
	tl.set(one("sum-line"), { opacity: 1 }, 15.2);
	tl.set([callLine, putLine], { opacity: 0 }, 15.2);
	// The merged dot takes the one line's colour.
	tl.set(
		[one("dot-call"), one("dot-put")],
		{ fill: "var(--diagram-accent)" },
		15.2,
	);
	show(one("sum-tag"), 15.4);

	// ——— debit: the fixed execution costs, then their effect on the whole line ———
	tl.addLabel("debit", 17.6);
	// Fade in place: the cost stays clear of the chart's caption on both layouts.
	tl.fromTo(
		[one("premium-cost"), one("premium-debit")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		17.6,
	);
	// In-place entrance keeps the zero marker on its line throughout the adjustment.
	tl.fromTo(one("debit"), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 19.15);
	const premium = { offset: 0 };
	tl.fromTo(
		premium,
		{ offset: 0 },
		{
			offset: NET_DEBIT,
			duration: 0.8,
			ease: "power2.inOut",
			immediateRender: false,
			onUpdate: () => adjustPremium(premium.offset),
		},
		19.15,
	);

	// ——— identity: the hero. ALFA walks from $97 to $102 and both sides move together. ———
	tl.addLabel("identity", 23.3);
	hide(heads[1], 23.3);
	sink(23.3);
	show(heads[2], 23.65);
	walk(97, 97, 23.9, 0.01);
	show([one("b-alfa"), spot], 24.0);
	show(one("b-c"), 24.2);
	word(one("eq-cp"), 24.3);
	show(one("b-s"), 24.6);
	word(one("eq-sk"), 24.7);
	walk(97, 102, 25.5, 1.8);
	d.lock(g("lock-eq"), 27.4, { around: [g("eq-cp"), g("eq-sk")], pad: 12 });
	tl.addLabel("hero-lock", 27.4);

	// ——— prints: one looks off ———
	tl.addLabel("prints", 30.3);
	hide([heads[2], ...kids("balance"), g("lock-eq")], 30.3);
	show(heads[3], 30.65);
	show(rows[0], 30.9);
	show(rows[1], 31.4);
	d.lock(g("lock-off"), 32.1, { around: gap, pad: 5 });

	// ——— late: replace the execution-time prices, calculation and verdict together ———
	tl.addLabel("late", 34.3);
	d.swap(heads[3], heads[4], 34.3);
	fade(g("lock-off"), 34.3);
	for (const prefix of ["r1", "r2", ...(L.narrow ? ["r3", "r4"] : []), "v"]) {
		d.flip(one(`${prefix}-afternoon`), one(`${prefix}-late`), 35.3);
		tl.set(one(`${prefix}-afternoon`), { opacity: 0 }, 35.6);
	}
	// All corrected figures settle at 35.95; rest 1.05 s before the row locks.
	d.lock(g("lock-row"), 37.0, { around: g("box-afternoon"), pad: 4 });

	// ——— claim ———
	tl.addLabel("claim", 39.5);
	hide([heads[4], ...rows, g("lock-row")], 39.5);
	word(one("z-big"), 39.8);
	show(one("z-sub"), 40.1);

	// ——— next ———
	tl.addLabel("next", 43.9);
	hide(kids("claim"), 43.9);
	d.close(43.9);
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
