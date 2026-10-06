import { gsap } from "gsap";
import { useId } from "react";
import { type Copy, pick, signedUsd } from "@/content/world";
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
	afterWeek,
	contracts,
	DAYS,
	DELTA,
	dateAfter,
	IV,
	IV_RELATIVE,
	IV_UP,
	ivRelative,
	ivUp,
	lastDay,
	points,
	price,
	RHO,
	round,
	SCENARIO,
	SPOT,
	scenario,
	signedPrice,
	THETA,
	TODAY,
	VEGA,
	value,
	WEEK,
} from "./theta-vega-rho-model";

/*
 * Theta, vega and rho, as a film. It opens on a puzzle: ALFA rose $1 and the call still
 * lost money. Theta and vega each take a shot in their own unit (per day, per vol point);
 * then the waterfall adds the parts up to answer the puzzle, and glowing brackets lock on
 * its sum beside the model's figure. Rho, per rate point, follows briefly. Subject: the
 * call's value, per share. Type carries the claims; a decay chart and a waterfall take
 * turns as the proof.
 *
 *   open       0–4        "Theta, vega and rho"
 *   question   4–9.6      ALFA +$1, six days later; the call −$0.19. Where did it go?
 *   theta      9.6–18.4   the value drains to expiry, slowly then fast; cut to −$0.065 a day
 *   vega       18.4–23.6  "IV up 3%": three points is +$0.35, 3% of 35% only +$0.12
 *   sum        23.6–31.6  hero: the waterfall, +0.52, +0.02, −0.39, −0.35 = −$0.20 beside
 *                         the model's −$0.19, locked
 *   rho        31.6–34.4  $0.042 a rate point
 *   positions  34.4–43.4  you −$320, Ben +$200; cut: "A good move can still lose."
 *   next       43.4–45.9  Next: 0DTE
 */

const END = 45.9;
const you = contracts("you");
const ben = contracts("ben");
const decay = (elapsed: number) =>
	value(SPOT, Math.max(DAYS - elapsed, 0.0001), IV).price;
const decayCurve = Array.from(
	{ length: DAYS * 4 + 1 },
	(_, i) => [i / 4, decay(i / 4)] as const,
);
const LAST = DAYS - 1;
const T_TOP = 5;
/** The waterfall's steps, each as shown: rounded to the cent. */
const steps = [
	{ id: "delta", from: 0, value: round(scenario.delta, 2) },
	{ id: "gamma", value: round(scenario.gamma, 2) },
	{ id: "theta", value: round(scenario.theta, 2) },
	{ id: "vega", value: round(scenario.vega, 2) },
	{ id: "sum", from: 0, value: scenario.total, kind: "total" },
	{ id: "model", from: 0, value: round(scenario.repriced, 2), kind: "model" },
] as const;
const bars = (() => {
	let running = 0;
	return steps.map((step) => {
		const from = "from" in step ? step.from : running;
		const to = "kind" in step ? step.value : from + step.value;
		if (!("kind" in step)) running = to;
		const tone = "kind" in step ? step.kind : step.value >= 0 ? "gain" : "loss";
		return { id: step.id, from, to, value: step.value, tone };
	});
})();
const W_RANGE = [-0.42, 0.72] as const;
const pnl = (contracts: number) =>
	signedUsd(Math.round(scenario.total * 100 * contracts * 100), 0);

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	// A phone's axis labels sit left of the plot: room for them inside the frame's edge.
	const left = frame.margin + (narrow ? 18 : 0);
	const right = width * 0.965;
	// Headroom for a two-line headline above the charts' captions.
	const top = height * (narrow ? 0.3 : 0.25);
	const bottom = height * 0.8;
	const xT = (elapsed: number) => left + (elapsed / DAYS) * (right - left);
	const yT = (dollars: number) => bottom - (dollars / T_TOP) * (bottom - top);
	const yW = (dollars: number) =>
		bottom -
		((dollars - W_RANGE[0]) / (W_RANGE[1] - W_RANGE[0])) * (bottom - top);
	const slot = (right - left) / bars.length;
	const barX = (i: number) => left + slot * (i + 0.5);
	const barWidth = Math.min(slot * 0.52, 64);
	/** The two readings of "IV up 3%": side by side, or one above the other on a phone. */
	const cells = narrow
		? [
				{ x: width / 2, y: height * 0.31 },
				{ x: width / 2, y: height * 0.59 },
			]
		: [
				{ x: width * 0.3, y: height * 0.38 },
				{ x: width * 0.7, y: height * 0.38 },
			];
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		xT,
		yT,
		yW,
		barX,
		barWidth,
		cells,
		path: (points: readonly (readonly [number, number])[]) =>
			points
				.map(
					([px, py], i) =>
						`${i ? "L" : "M"}${xT(px).toFixed(1)} ${yT(py).toFixed(1)}`,
				)
				.join(""),
	};
}

const copy = {
	title: ["Theta, vega and rho", "Theta、Vega 与 Rho"],
	titleSub: ["time, volatility and rates", "时间、波动率与利率"],
	qTagLeft: ["ALFA, 6 days later", "ALFA，六天后"],
	qLeft: [`ALFA +$${SCENARIO.move}`, `ALFA +$${SCENARIO.move}`],
	qTagRight: ["the call, per share", "看涨，每股"],
	qRight: [
		`call ${signedPrice(scenario.repriced)}`,
		`看涨 ${signedPrice(scenario.repriced)}`,
	],
	qLine: [
		`Delta alone said ${signedPrice(DELTA * SCENARIO.move)}. Where did the rest go?`,
		`仅用 Delta 是 ${signedPrice(DELTA * SCENARIO.move)}。剩下的去哪了？`,
	],
	thetaHead: ["Theta: what a day costs.", "Theta：一天的代价。"],
	valueAxis: ["value, per share", "每股价值"],
	heldAxis: [
		`ALFA held at $${SPOT}, IV ${points(IV)}`,
		`ALFA 保持 $${SPOT}，IV ${points(IV)}`,
	],
	today: [`today ${price(TODAY.price)}`, `今天 ${price(TODAY.price)}`],
	even: ["an even share per day", "每天平均分摊"],
	week: [
		`a week: ${signedPrice(afterWeek.price - TODAY.price)}`,
		`一周：${signedPrice(afterWeek.price - TODAY.price)}`,
	],
	lastDay: [
		`last day: ${signedPrice(lastDay.theta)}`,
		`最后一天：${signedPrice(lastDay.theta)}`,
	],
	thetaWord: ["theta", "theta"],
	thetaSub: [
		"a share, per calendar day, today. It grows as expiry nears.",
		"每股、每个自然日（今天）。越临近到期越大。",
	],
	vegaHead: ["“IV up 3%” can mean two things.", "“IV 上涨 3%”有两种理解。"],
	cellPoints: ["3 vol points", "3 个波动率点"],
	cellPercent: [`3% of ${points(IV)}`, `${points(IV)} 的 3%`],
	vegaLine: [
		`Vega is ${price(VEGA, 3)} per vol point. Count points, not percent.`,
		`Vega 是每个波动率点 ${price(VEGA, 3)}。数点数，不是百分比。`,
	],
	vegaLineShort: [
		`Vega: ${price(VEGA, 3)} per vol point. Count points.`,
		`Vega：每个波动率点 ${price(VEGA, 3)}。数点数。`,
	],
	rhoWord: ["rho", "rho"],
	rhoSub: [
		"per rate point. Small for a one-month option.",
		"每个利率点。对一个月期的期权很小。",
	],
	rhoCompare: [
		`one vol point, for comparison: ${price(VEGA, 3)}`,
		`对比：一个波动率点 ${price(VEGA, 3)}`,
	],
	sumHead: ["Back to the puzzle: add each part.", "回到开头：逐项相加。"],
	sumAnswer: [
		"Time and IV took more than the move gave.",
		"时间和 IV 拿走的，比上涨带来的多。",
	],
	sumAnswerShort: [
		"Time and IV outweighed the move.",
		"时间和 IV 抵消了上涨。",
	],
	sumAxis: ["change, $ per share", "每股变化（美元）"],
	posHead: ["Scale last, with signs.", "最后带符号地放大。"],
	posYou: [`You · long ${you} calls`, `你 · 多头 ${you} 张看涨`],
	posBen: [
		`Ben · short ${Math.abs(ben)} calls`,
		`Ben · 空头 ${Math.abs(ben)} 张看涨`,
	],
	posNote: [
		"× 100 shares × signed contracts. Ben collects the time decay you pay.",
		"× 100 股 × 带符号张数。Ben 收取你支付的时间损耗。",
	],
	claimBig: ["A good move can still lose.", "上涨也可能亏钱。"],
	claimSub: [
		"Time and volatility count too, each in its own unit.",
		"时间和波动率同样算数，各有各的单位。",
	],
	nextBig: ["Next: 0DTE", "下一课：0DTE"],
	nextSub: ["an option's last day, hour by hour", "期权的最后一天，逐小时看"],
} as const satisfies Record<string, Copy>;

const barLabels: Record<(typeof bars)[number]["id"], readonly [Copy, Copy]> = {
	delta: [
		["delta", "Delta"],
		["Δ", "Δ"],
	],
	gamma: [
		["gamma", "Gamma"],
		["Γ", "Γ"],
	],
	theta: [
		[`theta · ${SCENARIO.days} days`, `Theta · ${SCENARIO.days} 天`],
		["Θ", "Θ"],
	],
	vega: [
		[`vega · −${-SCENARIO.volPoints} pts`, `Vega · −${-SCENARIO.volPoints} 点`],
		["vega", "Vega"],
	],
	sum: [
		["sum", "合计"],
		["sum", "合计"],
	],
	model: [
		["model", "模型"],
		["model", "模型"],
	],
};

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
	const { height: H, type: T, room, narrow } = L;
	const W = width;
	const id = useId().replace(/:/g, "");
	const ticksT = narrow ? [0, 16, DAYS] : [0, 8, 16, 24, DAYS];
	const cellText = [
		{
			tag: copy.cellPoints,
			from: `${points(IV)} → ${points(IV_UP)}`,
			result: signedPrice(ivUp),
		},
		{
			tag: copy.cellPercent,
			from: `${points(IV)} → ${points(IV_RELATIVE)}`,
			result: signedPrice(ivRelative),
		},
	];
	const big = (name: string, text: string, word: Copy, sub: Copy) => (
		<g data-f={name}>
			<Word
				name={`${name}-num`}
				x={W / 2}
				y={H * 0.46 + T.big * 0.36}
				size={T.big}
				className={name === "th" ? "wt-film-num wt-film-loss" : "wt-film-num"}
			>
				{text}
			</Word>
			<Word
				name={`${name}-word`}
				x={W / 2}
				y={H * 0.46 + T.big * 0.36 + T.head * 1.9}
				size={T.head}
				className="wt-film-type wt-film-accent"
			>
				{t(word)}
			</Word>
			<Lines
				name={`${name}-sub`}
				text={t(sub)}
				x={W / 2}
				y={H * 0.46 + T.big * 0.36 + T.head * 1.9 + T.body * 1.9}
				size={T.body}
				maxWidth={room}
				className="wt-film-type wt-film-dim"
			/>
		</g>
	);
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<clipPath id={`decay-${id}`}>
					<rect data-f="decay-clip" x={L.left - 4} y={0} width={0} height={H} />
				</clipPath>
			</defs>

			{/* The proof: a decay chart, then a waterfall. */}
			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart-theta">
						{[0, 1, 2, 3, 4, 5]
							.filter((tick) => !narrow || tick % 2 === 0 || tick === 5)
							.map((tick) => (
								<g key={tick}>
									<path
										d={`M${L.left} ${L.yT(tick)}H${L.right}`}
										className={tick === 0 ? "wt-axis" : "wt-grid"}
									/>
									<text
										x={L.left - 8}
										y={L.yT(tick) + 4}
										textAnchor="end"
										className="wt-small"
									>
										{`$${tick}`}
									</text>
								</g>
							))}
						{ticksT.map((tick, i) => (
							<text
								key={tick}
								x={L.xT(tick)}
								y={L.bottom + 18}
								textAnchor={
									i === 0 ? "start" : i === ticksT.length - 1 ? "end" : "middle"
								}
								className="wt-small"
							>
								{dateAfter(tick, locale)}
							</text>
						))}
						<text
							x={L.right}
							y={L.bottom + 32}
							textAnchor="end"
							className="wt-small"
						>
							{t(copy.heldAxis)}
						</text>
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(copy.valueAxis)}
						</text>
						<line
							data-f="even"
							className="wt-film-tangent"
							strokeDasharray="5 4"
							x1={L.xT(0)}
							y1={L.yT(TODAY.price)}
							x2={L.xT(0)}
							y2={L.yT(TODAY.price)}
						/>
						<text
							data-f="even-label"
							// Under the even line, where the decay curve never goes: between the $1
							// and $2 gridlines, left of where the line crosses $1.50.
							x={L.xT(DAYS * (1 - 1.5 / TODAY.price)) - 10}
							y={L.yT(1.5) + 12}
							textAnchor="end"
							className="wt-small wt-halo"
						>
							{t(copy.even)}
						</text>
						<g clipPath={`url(#decay-${id})`}>
							<path
								className="wt-line-position"
								strokeDasharray="6 5"
								d={L.path(decayCurve)}
							/>
						</g>
						<circle
							data-f="t-marker"
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
							cx={0}
							cy={0}
						/>
						<text
							data-f="t-today"
							x={L.xT(0) + 12}
							y={L.yT(TODAY.price) - 12}
							className="wt-halo wt-accent wt-marker-label"
						>
							{t(copy.today)}
						</text>
						<text
							data-f="t-week"
							x={L.xT(WEEK) + 12}
							y={L.yT(afterWeek.price) - 10}
							className="wt-halo wt-loss wt-marker-label"
						>
							{t(copy.week)}
						</text>
						<text
							data-f="t-last"
							x={L.xT(LAST) - 12}
							y={L.yT(decay(LAST)) + 5}
							textAnchor="end"
							className="wt-halo wt-loss wt-marker-label"
						>
							{t(copy.lastDay)}
						</text>
					</g>
					<g data-f="chart-sum">
						{(narrow ? [0, 0.5] : [-0.25, 0, 0.25, 0.5]).map((tick) => (
							<g key={tick}>
								<path
									d={`M${L.left} ${L.yW(tick)}H${L.right}`}
									className={tick === 0 ? "wt-axis" : "wt-grid"}
								/>
								<text
									x={L.left - 8}
									y={L.yW(tick) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{narrow
										? String(tick)
										: tick === 0
											? "$0"
											: signedUsd(Math.round(tick * 100))}
								</text>
							</g>
						))}
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(copy.sumAxis)}
						</text>
						{bars.map((bar, i) => {
							const next = bars[i + 1];
							const linked = next && !("kind" in steps[i]) && i < 3;
							const up = bar.to >= bar.from;
							return (
								<g key={bar.id}>
									{linked || bar.id === "vega" ? (
										<line
											data-f={`w-link-${bar.id}`}
											className="wt-film-link"
											x1={L.barX(i) + L.barWidth / 2}
											x2={L.barX(i + 1) - L.barWidth / 2}
											y1={L.yW(bar.to)}
											y2={L.yW(bar.to)}
										/>
									) : null}
									<rect
										data-f={`w-bar-${bar.id}`}
										className="wt-film-bar"
										data-tone={bar.tone}
										x={L.barX(i) - L.barWidth / 2}
										y={L.yW(bar.from)}
										width={L.barWidth}
										height={0}
										rx={3}
									/>
									<text
										data-f={`w-value-${bar.id}`}
										x={L.barX(i)}
										y={up ? L.yW(bar.to) - 8 : L.yW(bar.to) + 16}
										textAnchor="middle"
										className={`wt-halo wt-marker-label ${
											bar.tone === "gain"
												? "wt-gain"
												: bar.tone === "loss"
													? "wt-loss"
													: "wt-accent"
										}`}
									>
										{narrow
											? signedPrice(bar.value).replace("$", "")
											: signedPrice(bar.value)}
									</text>
									<text
										data-f={`w-label-${bar.id}`}
										x={L.barX(i)}
										y={L.bottom + 18}
										textAnchor="middle"
										className="wt-small"
									>
										{t(barLabels[bar.id][narrow ? 1 : 0])}
									</text>
								</g>
							);
						})}
					</g>
				</g>
			</g>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				{(
					[
						[copy.qTagLeft, copy.qLeft, "wt-film-gain", narrow ? 0.27 : 0.32],
						[copy.qTagRight, copy.qRight, "wt-film-loss", narrow ? 0.73 : 0.68],
					] as const
				).map(([tag, num, tone, f], i) => (
					<g key={tag[0]}>
						<Word
							name={`q-tag-${i}`}
							x={W * f}
							y={H * 0.36}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`q-num-${i}`}
							x={W * f}
							y={H * 0.36 + T.num * 1.35}
							size={T.num}
							className={`wt-film-num ${tone}`}
						>
							{t(num)}
						</Word>
					</g>
				))}
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.72}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			<Lines
				name="t-head"
				text={t(copy.thetaHead)}
				x={L.margin}
				y={L.headY}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			{big("th", price(THETA, 3), copy.thetaWord, copy.thetaSub)}
			<g data-f="v">
				<Lines
					name="v-head"
					text={t(copy.vegaHead)}
					x={W / 2}
					y={H * 0.17}
					size={T.head}
					maxWidth={room}
				/>
				{cellText.map((cell, i) => (
					<g key={cell.from}>
						<Word
							name={`v-tag-${i}`}
							x={L.cells[i].x}
							y={L.cells[i].y}
							size={T.small}
							className="wt-film-tag"
						>
							{t(cell.tag).toUpperCase()}
						</Word>
						<Word
							name={`v-from-${i}`}
							x={L.cells[i].x}
							y={L.cells[i].y + T.num * 1.25}
							size={T.num}
							className="wt-film-num"
						>
							{cell.from}
						</Word>
						<Word
							name={`v-result-${i}`}
							x={L.cells[i].x}
							y={L.cells[i].y + T.num * 2.5}
							size={T.num}
							className={`wt-film-num ${i === 0 ? "wt-film-gain" : "wt-film-dim"}`}
						>
							{cell.result}
						</Word>
					</g>
				))}
				<Lines
					name="v-line"
					text={t(narrow ? copy.vegaLineShort : copy.vegaLine)}
					x={W / 2}
					y={H * 0.9}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
			</g>
			<g data-f="r">
				{big("rh", price(RHO, 3), copy.rhoWord, copy.rhoSub)}
				<Lines
					name="rh-compare"
					text={t(copy.rhoCompare)}
					x={W / 2}
					y={H * 0.9}
					size={T.small}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			<Lines
				name="s-head"
				text={t(copy.sumHead)}
				x={L.margin}
				y={L.headY}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			{/* The hero's answer, a line under the puzzle, as the brackets lock. */}
			<Lines
				name="s-answer"
				text={t(narrow ? copy.sumAnswerShort : copy.sumAnswer)}
				x={L.margin}
				y={L.headY + lineCount(t(copy.sumHead), room, T.head) * T.head * 1.35}
				size={T.head}
				maxWidth={room}
				anchor="start"
			/>
			<Brackets name="lock-sum" glow />
			<g data-f="p">
				<Lines
					name="p-head"
					text={t(copy.posHead)}
					x={W / 2}
					y={H * 0.17}
					size={T.head}
					maxWidth={room}
				/>
				{(
					[
						[copy.posYou, pnl(you), "wt-film-loss", 0.34],
						[copy.posBen, pnl(ben), "wt-film-gain", 0.58],
					] as const
				).map(([who, num, tone, f], i) => (
					<g key={who[0]}>
						<Word
							name={`p-who-${i}`}
							x={W / 2}
							y={H * f}
							size={T.body}
							className="wt-film-type wt-film-dim"
						>
							{t(who)}
						</Word>
						<Word
							name={`p-num-${i}`}
							x={W / 2}
							y={H * f + T.num * 1.3}
							size={T.num}
							className={`wt-film-num ${tone}`}
						>
							{`≈ ${num}`}
						</Word>
					</g>
				))}
				<Lines
					name="p-note"
					text={t(copy.posNote)}
					x={W / 2}
					y={H * 0.86}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
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
	const L = layout(W);
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
	const lockSum = one<SVGGraphicsElement>("lock-sum");
	const marker = one("t-marker");
	const clip = one("decay-clip");
	const chartTheta = one("chart-theta");
	const chartSum = one("chart-sum");

	// Everything at rest: hidden until its shot needs it.
	gsap.set(marker, { attr: { cx: L.xT(0), cy: L.yT(TODAY.price) } });
	gsap.set(chartSum, { opacity: 0 });
	d.hidden([
		lockSum,
		marker,
		one("even"),
		one("even-label"),
		one("t-today"),
		one("t-week"),
		one("t-last"),
		...bars.flatMap((bar) => [
			one(`w-value-${bar.id}`),
			...(one(`w-link-${bar.id}`) ? [one(`w-link-${bar.id}`)] : []),
		]),
		...kids("q").flatMap((el) =>
			el.tagName === "g" ? [...el.children] : [el],
		),
		one("t-head"),
		...kids("th"),
		...kids("v").flatMap((el) =>
			el.tagName === "g" ? [...el.children] : [el],
		),
		...kids("rh"),
		one("rh-compare"),
		one("s-head"),
		one("s-answer"),
		...kids("p").flatMap((el) =>
			el.tagName === "g" ? [...el.children] : [el],
		),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a rise, and a loss ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag-0"), 4.6);
	land(one("q-num-0"), 4.8);
	show(one("q-tag-1"), 5.3);
	land(one("q-num-1"), 5.5);
	show(one("q-line"), 6.0);

	// ——— theta: the value drains, slowly and then fast ———
	tl.addLabel("theta", 9.6);
	hide(
		kids("q").flatMap((el) => (el.tagName === "g" ? [...el.children] : [el])),
		9.6,
	);
	show(one("t-head"), 9.8);
	rise(9.9);
	land(marker, 10.4);
	show(one("t-today"), 10.6, "right");
	// The even line: what an equal share per day would look like.
	tl.to(one("even"), { opacity: 1, duration: 0.2 }, 11.0);
	tl.to(
		one("even"),
		{
			attr: { x2: L.xT(DAYS), y2: L.yT(0) },
			duration: 0.8,
			ease: "power2.inOut",
		},
		11.0,
	);
	show(one("even-label"), 11.6);
	// The marker walks the curve, drawing it behind it.
	const walk = { elapsed: 0 };
	const place = () => {
		const x = L.xT(walk.elapsed);
		gsap.set(marker, { attr: { cx: x, cy: L.yT(decay(walk.elapsed)) } });
		gsap.set(clip, { attr: { width: x - L.left + 6 } });
	};
	tl.to(
		walk,
		{ elapsed: WEEK, duration: 1.1, ease: "power1.inOut", onUpdate: place },
		11.9,
	);
	hide(one("t-today"), 12.9, 0.3);
	show(one("t-week"), 13.0, "right");
	tl.to(
		walk,
		{ elapsed: 25, duration: 1.3, ease: "power1.in", onUpdate: place },
		13.6,
	);
	tl.to(
		[one("even"), one("even-label")],
		{ opacity: 0.25, duration: 0.5 },
		14.6,
	);
	tl.to(
		walk,
		{ elapsed: LAST, duration: 0.8, ease: "power2.in", onUpdate: place },
		14.9,
	);
	show(one("t-last"), 15.6);
	tl.to(clip, { attr: { width: L.right - L.left + 6 }, duration: 0.4 }, 15.6);
	// Cut: the unit.
	hide([one("t-head")], 16.2);
	sink(16.2);
	land(one("th-num"), 16.5);
	show(one("th-word"), 16.8);
	show(one("th-sub"), 17.1);

	// ——— vega: points, not percent ———
	tl.addLabel("vega", 18.4);
	hide(kids("th"), 18.4);
	// The two readings' tags come up with the headline that names "3%", once theta's
	// figure has gone from where they stand.
	show([one("v-tag-0"), one("v-tag-1")], 18.8);
	show(one("v-head"), 18.8);
	show(one("v-from-0"), 19.1);
	land(one("v-result-0"), 19.6);
	show(one("v-from-1"), 20.3);
	land(one("v-result-1"), 20.8);
	show(one("v-line"), 21.6);

	// ——— sum: the hero. The waterfall answers the puzzle. ———
	tl.addLabel("sum", 23.6);
	hide(
		kids("v").flatMap((el) => (el.tagName === "g" ? [...el.children] : [el])),
		23.6,
	);
	tl.set(chartTheta, { opacity: 0 }, 23.8);
	tl.set(chartSum, { opacity: 1 }, 23.8);
	show(one("s-head"), 23.95);
	rise(24.0);
	const grow = (index: number, at: number) => {
		const bar = bars[index];
		const top = Math.min(L.yW(bar.from), L.yW(bar.to));
		const height = Math.abs(L.yW(bar.to) - L.yW(bar.from));
		tl.fromTo(
			one(`w-bar-${bar.id}`),
			{ attr: { y: L.yW(bar.from), height: 0 } },
			{
				attr: { y: top, height },
				duration: 0.55,
				ease: "power3.out",
			},
			at,
		);
		show(one(`w-value-${bar.id}`), at + 0.35);
		const link = one(`w-link-${bar.id}`);
		if (link)
			tl.fromTo(link, { opacity: 0 }, { opacity: 1, duration: 0.3 }, at + 0.5);
	};
	bars.forEach((_, i) => {
		grow(i, 24.6 + i * 0.5);
	});
	// The parts' sum, beside the model's figure: they account for the move.
	d.lock(lockSum, 28.0, {
		around: [one("w-bar-sum"), one("w-value-sum")],
		pad: 6,
	});
	tl.addLabel("hero-lock", 28.0);
	show(one("s-answer"), 28.0);

	// ——— rho: rates, briefly ———
	tl.addLabel("rho", 31.6);
	hide([one("s-head"), one("s-answer"), lockSum], 31.6);
	sink(31.6);
	land(one("rh-num"), 32.0);
	show(one("rh-word"), 32.3);
	show(one("rh-sub"), 32.6);
	show(one("rh-compare"), 33.0);

	// ——— positions: scale last, with signs ———
	tl.addLabel("positions", 34.4);
	hide([...kids("rh"), one("rh-compare")], 34.4);
	show(one("p-head"), 34.75);
	show(one("p-who-0"), 35.1);
	land(one("p-num-0"), 35.3);
	show(one("p-who-1"), 35.8);
	land(one("p-num-1"), 36.0);
	show(one("p-note"), 36.6);
	// Cut: the claim.
	hide(
		kids("p").flatMap((el) => (el.tagName === "g" ? [...el.children] : [el])),
		39.0,
	);
	tl.fromTo(
		one("c-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
		39.3,
	);
	show(one("c-sub"), 39.7);

	// ——— next ———
	tl.addLabel("next", 43.4);
	hide(kids("claim"), 43.4);
	d.close(43.4);
	return tl;
}

export const thetaVegaRhoFilm: Film = {
	id: "theta-vega-rho",
	label: [
		"Theta, vega and rho, as a short film: ALFA rises $1 and the call still loses; the call's value draining to expiry, slowly then fast; volatility points against percent; rho; and a waterfall that adds delta, gamma, theta and vega to the loss, scaled to two positions",
		"Theta、Vega 与 Rho 短片：ALFA 上涨 $1，看涨却仍然亏损；看涨价值随到期流失，先慢后快；波动率点与百分比；Rho；以及一张把 Delta、Gamma、Theta、Vega 相加得到亏损的瀑布图，并放大到两个持仓",
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Theta, vega, rho", "Theta、Vega、Rho"] },
		{ id: "question", label: ["The puzzle", "疑问"] },
		{ id: "theta", label: ["Theta", "Theta"] },
		{ id: "vega", label: ["Vega", "Vega"] },
		{ id: "rho", label: ["Rho", "Rho"] },
		{ id: "sum", label: ["Add them up", "逐项相加"] },
		{ id: "positions", label: ["Positions", "持仓"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
