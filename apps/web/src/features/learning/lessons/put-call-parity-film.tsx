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
	toneClass,
	toneColor,
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
 *   sum       13.6–22.55  combine the legs, then subtract the premium debit
 *   debit     17.6–22.55  $4.20 − $4.05 = $0.15/share; zero moves to $100.15
 *   identity  22.55–30.3 hero: read $97 for 1.25 seconds, then walk to $102
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
const ZOOM_RANGE = NET_DEBIT * 2;

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
	const zoomWidth = narrow ? Math.min(156, (right - left) / 2) : 220;
	const zoomX = (debit: number) =>
		left + 12 + (debit / ZOOM_RANGE) * (zoomWidth - 24);
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		x,
		y,
		zoomWidth,
		zoomX,
		zoomTop: top,
		zoomAxisY: top + 53,
		sumX: narrow ? right - 4 : x(104),
		// Keep both phone caption lines below the zero axis and clear of the rising curve.
		sumY: (debit: number) => y(-per(debit)) + (narrow ? 21 : 30),
		path: (f: (spot: number) => number) =>
			spots
				.map(
					(s, i) =>
						`${i ? "L" : "M"}${x(s).toFixed(1)} ${y(per(f(s))).toFixed(1)}`,
				)
				.join(""),
		rowY: (i: number) =>
			H * (narrow ? 0.28 : 0.3) + i * H * (narrow ? 0.29 : 0.25),
		rowH: H * (narrow ? 0.25 : 0.2),
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
	axis: ["Oct 18 expiry result · per pair", "10月18日到期结果 · 每组"],
	zoom: ["break-even zoom", "盈亏平衡点放大"],
	premiumCost: [
		`ask ${usd(CALL_PAID)} − bid ${usd(PUT_RECEIVED)}`,
		`买看涨 ${usd(CALL_PAID)} − 卖看跌 ${usd(PUT_RECEIVED)}`,
	],
	premiumDebit: [
		`= ${share(NET_DEBIT)}/share · ${share(per(NET_DEBIT))}/pair`,
		`= ${share(NET_DEBIT)}/股 · ${share(per(NET_DEBIT))}/组`,
	],
	callTag: ["long call", "看涨多头"],
	putTag: ["short put", "看跌空头"],
	sumTag: ["like 100 shares bought at {basis}", "就像以 {basis} 买入 100 股"],
	sumTagShort: [
		"like 100 shares\nbought at {basis}",
		"就像 100 股\n买入价 {basis}",
	],
	balHead: ["C − P = S − K at every price.", "每个价格下，C − P = S − K。"],
	modelScope: [
		"Model mids/share\nno interest/dividends",
		"模型中间价/股\n无利息、股息",
	],
	call: ["call", "看涨"],
	put: ["put", "看跌"],
	offHead: ["One 14:12 print looks off.", "14:12 有一笔成交看似偏离。"],
	lateHead: [
		"Late report: check its execution time.",
		"延迟报告：按实际成交时刻核对。",
	],
	executed: ["executed", "成交于"],
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
		"For late reports, use execution time, not arrival time.",
		"延迟报告看成交时刻，而非接收时刻。",
	],
	nextBig: ["Next: expiration", "下一课：到期"],
	nextSub: ["exercise, assignment and settlement", "行权、指派与结算"],
} as const satisfies Record<string, Copy>;

/** The label's basis comes from the same debit as the plotted expiry result. */
const sumLabel = (basis: number, narrow: boolean, locale: Locale) =>
	pick(narrow ? copy.sumTagShort : copy.sumTag, locale)
		.replace("{basis}", share(basis))
		.split("\n");

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
							className="wt-line-call"
						/>
						<path
							data-f="put-line"
							d={L.path(putLeg)}
							className="wt-line-put"
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
							className={`wt-small wt-halo ${toneClass.call}`}
						>
							{t(copy.callTag)}
						</text>
						<text
							data-f="put-tag"
							x={L.x(84)}
							y={L.y(per(putLeg(84))) + 18}
							className={`wt-small wt-halo ${toneClass.put}`}
						>
							{t(copy.putTag)}
						</text>
						<text
							data-f="sum-tag"
							x={L.sumX}
							y={L.sumY(0)}
							textAnchor={narrow ? "end" : "start"}
							className="wt-small wt-halo wt-accent"
						>
							{sumLabel(STRIKE, narrow, locale).map((line, i) => (
								<tspan
									key={i === 0 ? "shares" : "basis"}
									data-f={`sum-label-${i}`}
									x={L.sumX}
									dy={i === 0 ? 0 : T.small * 1.4}
								>
									{line}
								</tspan>
							))}
						</text>
						<PenTip name="tip-long" color={toneColor("call")} />
						<PenTip name="tip-short" color={toneColor("put")} />
						{/* At $90: the call's $0 above its flat line, the put's −$1,000. */}
						<g data-f="at90">
							<circle
								data-f="dot-call"
								cx={L.x(90)}
								cy={L.y(per(callLeg(90)))}
								r={6}
								className={`wt-chip ${toneClass.call}`}
								stroke="var(--foreground)"
								strokeWidth={1.5}
							/>
							<text
								data-f="lab-call"
								x={L.x(90) + 10}
								y={L.y(per(callLeg(90))) - 10}
								className="wt-halo wt-marker-label wt-film-dim"
							>
								$0
							</text>
							<circle
								data-f="dot-put"
								cx={L.x(90)}
								cy={L.y(per(putLeg(90)))}
								r={6}
								className={`wt-chip ${toneClass.put}`}
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
						{/* A local price ruler makes the small break-even shift visible. */}
						<g data-f="debit-zoom">
							<rect
								x={L.left}
								y={L.zoomTop}
								width={L.zoomWidth}
								height={82}
								rx={8}
								className="wt-panel-shape"
							/>
							<text x={L.left + 12} y={L.zoomTop + 15} className="wt-small">
								{t(copy.zoom)}
							</text>
							<path
								d={`M${L.zoomX(0)} ${L.zoomAxisY}H${L.zoomX(ZOOM_RANGE)}`}
								className="wt-axis"
							/>
							{[0, ZOOM_RANGE].map((debit, i) => (
								<g key={debit}>
									<path
										d={`M${L.zoomX(debit)} ${L.zoomAxisY - 4}v8`}
										className="wt-axis"
									/>
									<text
										x={L.zoomX(debit)}
										y={L.zoomTop + 73}
										textAnchor={i === 0 ? "start" : "end"}
										className="wt-small"
									>
										{share(STRIKE + debit)}
									</text>
								</g>
							))}
						</g>
						<g data-f="debit">
							<path
								data-f="debit-guide"
								d={`M${L.zoomX(0)} ${L.zoomAxisY - 5}v10`}
								className="wt-bracket"
							/>
							<text
								data-f="debit-entry"
								x={L.left + L.zoomWidth / 2}
								y={L.zoomTop + 37}
								textAnchor="middle"
								className="wt-film-num wt-film-accent"
								style={{ fontSize: T.body }}
							>
								{`$${STRIKE.toFixed(2)}`}
							</text>
							<circle
								data-f="debit-zero"
								cx={L.zoomX(0)}
								cy={L.zoomAxisY}
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
					y={H * (narrow ? 0.27 : 0.2) - T.small * 1.4}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.modelScope)
						.split("\n")
						.map((line, i) => (
							<tspan key={line} x={W / 2} dy={i === 0 ? 0 : T.small * 1.4}>
								{line}
							</tspan>
						))}
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
					<tspan data-f="cp-c" className={toneClass.call}>
						{share(callMid(BAL[0]))}
					</tspan>
					{" − "}
					<tspan data-f="cp-p" className={toneClass.put}>
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
							y={L.rowY(i) + L.rowH * (narrow ? 0.22 : 0.24)}
							className="wt-film-num"
							style={{ fontSize: text }}
						>
							{`${suffix === "late" ? `${t(copy.executed)} ` : ""}${time} · ALFA $${spot.toFixed(2)}`}
						</text>
						<text
							data-f={`r2-${suffix}`}
							x={margin + 14}
							y={L.rowY(i) + L.rowH * (narrow ? 0.45 : 0.5)}
							className="wt-film-num wt-film-dim"
							style={{ fontSize: text }}
						>
							{detail}
						</text>
						<text
							data-f={`r3-${suffix}`}
							x={margin + 14}
							y={L.rowY(i) + L.rowH * (narrow ? 0.68 : 0.78)}
							className="wt-film-num wt-film-dim"
							style={{ fontSize: text }}
						>
							{check[0]}
							{!narrow && (
								<>
									{suffix === "morning" ? " · " : " "}
									<tspan
										className="wt-film-accent"
										style={{ fontSize: text * 1.2 }}
									>
										{check[1]}
									</tspan>
								</>
							)}
						</text>
						{narrow && (
							<text
								data-f={`r4-${suffix}`}
								x={margin + 14}
								y={L.rowY(i) + L.rowH * 0.9}
								className="wt-film-num wt-film-accent"
								style={{ fontSize: text }}
							>
								{check[1]}
							</text>
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
							y={L.rowY(i) + L.rowH * (narrow ? 0.9 : 0.24)}
							textAnchor="end"
							className={`wt-film-type ${print.ok ? "" : toneClass.caution}`}
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
								y={L.rowY(i) + L.rowH * (narrow ? 0.9 : 0.24)}
								textAnchor="end"
								className="wt-film-type"
								style={{ fontSize: text }}
							>
								{t(copy.inLine)}
							</text>
						)}
					</g>
				);
			})}
			<Brackets name="lock-off" tone="caution" />
			<Brackets name="lock-row" />
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
				s < STRIKE
					? toneClass.down
					: s === STRIKE
						? "wt-film-dim"
						: toneClass.focus,
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
		one("sum-tag").setAttribute("y", String(L.sumY(debit)));
		for (const [i, line] of sumLabel(
			STRIKE + debit,
			L.narrow,
			context.locale,
		).entries())
			one(`sum-label-${i}`).textContent = line;
		const entryX = L.zoomX(debit);
		one("debit-guide").setAttribute("d", `M${entryX} ${L.zoomAxisY - 5}v10`);
		one("debit-zero").setAttribute("cx", String(entryX));
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
			"debit-zoom",
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
			"r3-late",
			...(L.narrow ? ["r4-late"] : []),
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
	// Let the chart settle for one second, then draw the paired legs together.
	d.trace(one<SVGPathElement>("call-line"), 10.8, {
		tip: one("tip-long"),
		duration: 0.8,
	});
	d.trace(one<SVGPathElement>("put-line"), 10.8, {
		tip: one("tip-short"),
		duration: 0.8,
	});
	show([one("call-tag"), one("put-tag")], 11.6);
	pop(one("dot-call"), 11.8);
	show(one("lab-call"), 11.9);
	pop(one("dot-put"), 12.0);
	show(one("lab-put"), 12.1);

	// ——— sum: the two lines become one, like 100 shares ———
	tl.addLabel("sum", 13.6);
	d.swap(heads[0], heads[1], 13.6);
	hide([one("lab-call"), one("call-tag"), one("put-tag")], 13.8);
	d.morph(callLine, L.path(synthetic), 14.7, 0.5);
	d.morph(putLine, L.path(synthetic), 14.7, 0.5);
	// The call's $0 at $90 comes down to the put's −$1,000: the sum.
	tl.to(
		one("dot-call"),
		{
			attr: { cy: L.y(per(synthetic(90))) },
			duration: 0.5,
			ease: "power2.inOut",
		},
		14.7,
	);
	tl.set(one("sum-line"), { opacity: 1 }, 15.2);
	tl.set([callLine, putLine], { opacity: 0 }, 15.2);
	// The merged dot takes the one line's colour.
	tl.set(
		[one("dot-call"), one("dot-put")],
		{ attr: { class: `wt-chip ${toneClass.focus}` } },
		15.2,
	);
	show(one("sum-tag"), 15.4);

	// ——— debit: the fixed execution costs, then their effect on the whole line ———
	tl.addLabel("debit", 17.6);
	// Fade in place: the cost stays clear of the chart's caption on both layouts.
	tl.fromTo(
		[one("premium-cost"), one("premium-debit"), one("debit-zoom")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		17.6,
	);
	// The zoom ruler settles at 18.1, a full second before its break-even marker moves.
	tl.fromTo(one("debit"), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 19.15);
	// Explicit attribute baselines let backward seeks restore the pre-debit chart.
	tl.set(one("sum-line"), { attr: { d: L.path(synthetic) } }, 19.15);
	tl.set(
		[one("dot-call"), one("dot-put")],
		{ attr: { cy: L.y(per(synthetic(90))) } },
		19.15,
	);
	tl.set(
		one("lab-put"),
		{ attr: { y: L.y(per(synthetic(90))) + (L.narrow ? 5 : 18) } },
		19.15,
	);
	tl.set(one("sum-tag"), { attr: { y: L.sumY(0) } }, 19.15);
	tl.set(
		one("debit-guide"),
		{ attr: { d: `M${L.zoomX(0)} ${L.zoomAxisY - 5}v10` } },
		19.15,
	);
	tl.set(one("debit-zero"), { attr: { cx: L.zoomX(0) } }, 19.15);
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
	tl.addLabel("identity", 22.55);
	hide(heads[1], 22.55);
	sink(22.55);
	show(heads[2], 22.9);
	walk(97, 97, 23.15, 0.01);
	show([one("b-alfa"), spot], 23.25);
	show(one("b-c"), 23.45);
	word(one("eq-cp"), 23.55);
	show(one("b-s"), 23.6);
	word(one("eq-sk"), 23.7);
	// The initial equations settle at 24.25; give them 1.25 quiet seconds before walking.
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
	fade(rows[0], 34.3, 0.3);
	for (const prefix of ["r1", "r2", "r3", ...(L.narrow ? ["r4"] : []), "v"]) {
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
