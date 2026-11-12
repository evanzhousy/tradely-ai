import { gsap } from "gsap";
import { useId } from "react";
import {
	type Copy,
	contractCount,
	contractLabel,
	percent,
	pick,
	signedUsd,
	usd,
} from "@/content/world";
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
	toneClass,
	Word,
} from "../walkthrough/film-kit";
import {
	ACCOUNT,
	afterLosses,
	BUDGET,
	CHEAP_PRICE,
	CHEAP_SIZE,
	CHEAP_WORST,
	cheapCall,
	DEAR_PRICE,
	DEAR_SIZE,
	DEAR_WORST,
	dearCall,
	GAP_OPEN,
	GAP_RESULT,
	LARGE_LEFT,
	LARGE_PERCENT,
	LARGE_RECOVER,
	LOSS_POINT,
	PLAN_PAID,
	PLANNED_LOSS,
	PROFIT_POINT,
	PROFIT_RESULT,
	RULE_PERCENT,
	SMALL_LEFT,
	SMALL_PERCENT,
	SMALL_RECOVER,
	STREAK,
	streakPath,
	TIME_STOP_LABEL,
	WORST_RESULT,
} from "./size-and-exit-model";

/*
 * Size and exit, as a film. It opens on a $10,000 account and asks what one wrong call can
 * cost. One common rule, shown as an example, allows $200 a trade: a bought call can lose
 * its whole premium, so the $420 contract doesn't fit and the $180 one does, once. Then the
 * same ten losses in a row at two sizes, each marker riding its own line while its meter
 * reads from it: at 20% of what is left each time, $1,074 remains; the hero is the account
 * at 2% each time, stopping at $8,171 as the brackets lock on, and after it stands, the
 * gain each needs to get back. Last, the plan written before the purchase, a profit point,
 * a loss point and a time stop, and the gap that opens under the loss point: −$160, not
 * −$90, which is why the size was worked out from the full $180.
 *
 *   open      0–4         "Size and exit"
 *   question  4–8.8       $10,000: one wrong call, how much can it cost?
 *   size      8.8–20.85   2% × $10,000 = $200; $420 a contract: 0; $180 a contract: 1
 *   streak    20.85–31.9  ten losses at 20%: $1,074; hero: at 2%, $8,171 is left (28.05)
 *   exit      31.9–40.1   three exits written; a gap opens at $0.20: −$160, not −$90
 *   claim     40.1–44.5   size decides what a wrong call costs
 *   next      44.5–47     Next: a first trade, start to finish
 */

const END = 47;
/** The balance axis runs a little past the account, so the start sits clear of the caption. */
const Y_MAX = 11_000;
const whole = (cents: number) => usd(cents, 0);
/** The two contracts the rule is tried on. */
const candidates = [
	{
		name: "dear",
		contract: dearCall,
		price: DEAR_PRICE,
		worst: DEAR_WORST,
		size: DEAR_SIZE,
	},
	{
		name: "cheap",
		contract: cheapCall,
		price: CHEAP_PRICE,
		worst: CHEAP_WORST,
		size: CHEAP_SIZE,
	},
] as const;
/** The two sizes that meet the same streak. */
const sides = [
	{
		name: "big",
		percent: LARGE_PERCENT,
		left: LARGE_LEFT,
		back: LARGE_RECOVER,
	},
	{
		name: "small",
		percent: SMALL_PERCENT,
		left: SMALL_LEFT,
		back: SMALL_RECOVER,
	},
] as const;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, type: T } = frame;
	const left = Math.max(margin, narrow ? 56 : 0);
	const right = width * 0.965;
	/** Reserve the enlarged readout and its brackets above the chart caption. */
	const meterY = frame.headY + T.head * 2.6;
	const meterNum = meterY + T.head * 1.3;
	const top = narrow
		? H * 0.44
		: Math.max(H * 0.3, meterNum + T.head * 0.95 + T.small * 2.2 + 16);
	const bottom = H * 0.84;
	const sx = (losses: number) => left + (losses / STREAK) * (right - left);
	const sy = (dollars: number) => bottom - (dollars / Y_MAX) * (bottom - top);
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		sx,
		sy,
		linePath: (percentLost: number) =>
			streakPath(percentLost)
				.map(
					([losses, dollars], i) =>
						`${i ? "L" : "M"}${sx(losses).toFixed(1)} ${sy(dollars).toFixed(1)}`,
				)
				.join(""),
		pair: narrow ? [0.27, 0.73] : [0.3, 0.7],
		meterY,
		meterNum,
		meterCol: narrow ? 130 : 230,
		/** Chart type on a phone: a step up from the 11 px the wide frame's labels use. */
		axisSize: narrow ? 12 : undefined,
		labelSize: narrow ? T.body : undefined,
		/** Where the four labels sit in the band between the two lines, in dollars. */
		labelY: narrow
			? { smallTag: 7_100, smallBack: 6_200, bigTag: 5_000, bigBack: 4_150 }
			: { smallTag: 6_900, smallBack: 6_000, bigTag: 4_300, bigBack: 3_400 },
		/** The rule, then the two contracts under it. */
		ruleY: H * 0.3,
		colY: H * 0.5,
		/** The plan's rows. */
		rowSize: narrow ? 15 : T.head * 0.8,
		planY: H * 0.3,
	};
}

const copy = {
	title: ["Size and exit", "仓位与出场"],
	titleSub: ["decide both before you buy", "买入前就定好"],
	qTag: ["your account", "你的账户"],
	qLine: ["One wrong call. How much can it cost?", "看错一次，最多会亏多少？"],
	ruleHead: [
		`An example rule: risk ${whole(BUDGET)} a trade.`,
		`示例规则：每笔最多亏 ${whole(BUDGET)}。`,
	],
	ruleTag: ["an example rule, not advice", "示例规则，不是建议"],
	worstHead: [
		"A bought call can lose its whole premium.",
		"买入的看涨，最多亏掉全部权利金。",
	],
	fitHead: [
		`${whole(DEAR_WORST)} a contract doesn't fit. ${whole(CHEAP_WORST)} does.`,
		`${whole(DEAR_WORST)} 一张放不下，${whole(CHEAP_WORST)} 的可以。`,
	],
	perShare: ["a share", "每股"],
	perContract: ["a contract (×100)", "每张（×100）"],
	streakHead: [
		`Ten losses, each ${LARGE_PERCENT}% of what is left.`,
		`连亏十次，每次亏掉余额的 ${LARGE_PERCENT}%。`,
	],
	sameHead: [
		`The same ten losses at ${SMALL_PERCENT}% each.`,
		`同样十连亏，每次亏 ${SMALL_PERCENT}%。`,
	],
	keptHead: [`${whole(SMALL_LEFT)} is left.`, `还剩 ${whole(SMALL_LEFT)}。`],
	axis: ["account balance", "账户余额"],
	lossAxis: ["losses in a row", "连续亏损次数"],
	exitHead: [
		"Write three exits before you buy.",
		"买入前，先写好三个出场条件。",
	],
	gapHead: ["A loss point is no guarantee.", "止损点只是计划，不是保证。"],
	planTag: [
		`1 ${contractLabel(cheapCall, false)[0]} · paid ${usd(PLAN_PAID)}`,
		`1 张 ${contractLabel(cheapCall, false)[1]} · 已付 ${usd(PLAN_PAID)}`,
	],
	profit: ["Profit point", "止盈点"],
	loss: ["Loss point", "止损点"],
	time: ["Time stop", "时间止损"],
	timeBy: [`by ${TIME_STOP_LABEL[0]}`, `${TIME_STOP_LABEL[1]} 前`],
	gap: ["Overnight gap", "隔夜跳空"],
	gapOpens: [`opens ${usd(GAP_OPEN)}`, `开在 ${usd(GAP_OPEN)}`],
	planned: [
		`planned ${signedUsd(PLANNED_LOSS, 0)}`,
		`计划 ${signedUsd(PLANNED_LOSS, 0)}`,
	],
	actual: [
		`actual ${signedUsd(GAP_RESULT, 0)}`,
		`实际 ${signedUsd(GAP_RESULT, 0)}`,
	],
	worst: [
		`So size on the whole ${whole(-WORST_RESULT)}.`,
		`所以按全部的 ${whole(-WORST_RESULT)} 算仓位。`,
	],
	claimBig: [
		"Size decides what a wrong call costs.",
		"仓位大小决定看错一次的代价。",
	],
	claimSub: [
		"Size and exits are written before the order.",
		"仓位和出场，都在下单前写好。",
	],
	nextBig: [
		"Next: a first trade, start to finish",
		"下一课：从头到尾做一笔交易",
	],
	nextSub: [
		"one spread, planned before the order",
		"一个价差，下单前先做好计划",
	],
} as const satisfies Record<string, Copy>;

/** Each size's name on its line and over its meter. */
const sideTag = (percentLost: number): Copy => [
	`lose ${percentLost}% of what is left`,
	`每次亏掉余额的 ${percentLost}%`,
];
const sideMeter = (percentLost: number): Copy => [
	`at ${percentLost}% each`,
	`每次 ${percentLost}%`,
];
/** On a phone the name drops its verb, which the headline carries, to fit larger type. */
const sideTagShort = (percentLost: number): Copy => [
	`${percentLost}% of what is left`,
	`每次亏掉余额的 ${percentLost}%`,
];
const sideBack = (gain: number): Copy => [
	`recovery needs +${percent(gain, 0)}`,
	`回本需涨 +${percent(gain, 0)}`,
];
const sizeText = (contracts: number): Copy => [
	contractCount(contracts),
	`${contracts} 张`,
];

function Scene({
	width,
	locale,
}: {
	width: number;
	height: number;
	locale: Locale;
}) {
	const t = (value: Copy) => pick(value, locale);
	const id = useId().replace(/:/g, "");
	const L = layout(width);
	const { height: H, type: T, room, narrow, margin } = L;
	const W = width;
	const headline = (name: string, text: Copy) => (
		<Lines
			name={name}
			text={t(text)}
			x={margin}
			y={L.headY}
			size={T.head}
			maxWidth={narrow ? room : room * 0.74}
			anchor="start"
		/>
	);
	const row = (i: number) => L.planY + L.rowSize * (1.9 + i * 1.8);
	return (
		<>
			<Backdrop frame={L} />

			<g data-f="depth">
				<g data-f="world">
					{/* The account after each loss in a row, at two sizes. */}
					<g data-f="streak">
						<defs>
							{sides.map(({ name }) => (
								<clipPath key={name} id={`${name}-${id}`}>
									<rect
										data-f={`${name}-clip`}
										x={L.left - 4}
										y={0}
										width={0}
										height={H}
									/>
								</clipPath>
							))}
						</defs>
						<text
							x={L.left}
							y={L.top - 12}
							className="wt-small"
							style={{ fontSize: L.axisSize }}
						>
							{t(copy.axis)}
						</text>
						{[0, 5_000, 10_000].map((v) => (
							<g key={v}>
								<path
									d={`M${L.left} ${L.sy(v)}H${L.right}`}
									className={v === 0 ? "wt-axis" : "wt-grid"}
								/>
								<text
									x={L.left - 8}
									y={L.sy(v) + 4}
									textAnchor="end"
									className="wt-small"
									style={{ fontSize: L.axisSize }}
								>
									{v === 0 ? "$0" : narrow ? `$${v / 1000}k` : whole(v * 100)}
								</text>
							</g>
						))}
						{[0, 2, 4, 6, 8, 10].map((v) => (
							<text
								key={v}
								x={L.sx(v)}
								y={L.bottom + 16}
								textAnchor={v === STREAK ? "end" : "middle"}
								className="wt-small"
								style={{ fontSize: L.axisSize }}
							>
								{v}
							</text>
						))}
						<text
							x={(L.left + L.right) / 2}
							y={L.bottom + T.small * 3.2}
							textAnchor="middle"
							className="wt-small"
							style={{ fontSize: L.axisSize }}
						>
							{t(copy.lossAxis)}
						</text>
						{/* The larger size in ink, the smaller one, the film's subject, in focus. */}
						<path
							data-f="big-line"
							d={L.linePath(LARGE_PERCENT)}
							className="wt-line-position"
							style={{ stroke: "var(--tone-ink)", strokeWidth: 2.5 }}
							clipPath={`url(#big-${id})`}
						/>
						<path
							data-f="small-line"
							d={L.linePath(SMALL_PERCENT)}
							className="wt-line-position"
							clipPath={`url(#small-${id})`}
						/>
						{/* Names and after-beats sit in the empty band between the two lines. */}
						<text
							data-f="big-tag"
							x={L.right - 4}
							y={L.sy(L.labelY.bigTag)}
							textAnchor="end"
							className="wt-small wt-halo"
							style={{ fill: "var(--tone-ink)", fontSize: L.labelSize }}
						>
							{t((narrow ? sideTagShort : sideTag)(LARGE_PERCENT))}
						</text>
						<text
							data-f="big-back"
							x={L.right - 4}
							y={L.sy(L.labelY.bigBack)}
							textAnchor="end"
							className="wt-small wt-halo"
							style={{ fontSize: L.labelSize }}
						>
							{t(sideBack(LARGE_RECOVER))}
						</text>
						<text
							data-f="small-tag"
							x={L.right - 4}
							y={L.sy(L.labelY.smallTag)}
							textAnchor="end"
							className="wt-small wt-halo wt-accent"
							style={{ fontSize: L.labelSize }}
						>
							{t((narrow ? sideTagShort : sideTag)(SMALL_PERCENT))}
						</text>
						<text
							data-f="small-back"
							x={L.right - 4}
							y={L.sy(L.labelY.smallBack)}
							textAnchor="end"
							className="wt-small wt-halo"
							style={{ fontSize: L.labelSize }}
						>
							{t(sideBack(SMALL_RECOVER))}
						</text>
						<circle
							data-f="big-marker"
							cx={L.sx(0)}
							cy={L.sy(ACCOUNT / 100)}
							r={6}
							className="wt-chip"
							style={{ fill: "var(--tone-ink)" }}
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
						<circle
							data-f="small-marker"
							cx={L.sx(0)}
							cy={L.sy(ACCOUNT / 100)}
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
					</g>
				</g>
			</g>

			{/* Readouts under the headline: what is left at each size, read from its marker. */}
			<g data-f="smeter">
				{sides.map(({ name, percent: percentLost }, i) => {
					const hero = name === "small";
					return (
						<g key={name} data-f={`s-${name}-cell`}>
							<Word
								name={`s-${name}-tag`}
								// Clear the figure's 5 px lock padding and up to 24 px of bracket growth.
								x={margin + i * L.meterCol - (hero ? 44 : 0)}
								y={hero ? L.meterNum + T.small * 2 : L.meterY}
								size={T.small}
								anchor={hero ? "end" : "start"}
								className="wt-film-tag"
							>
								{t(sideMeter(percentLost)).toUpperCase()}
							</Word>
							<Word
								name={`s-${name}`}
								x={margin + i * L.meterCol}
								y={L.meterNum + (hero ? T.head * 0.5 : 0)}
								size={T.head * (hero ? 1.8 : 1.3)}
								anchor="start"
								className={`wt-film-num ${hero ? toneClass.focus : ""}`}
							>
								{whole(ACCOUNT)}
							</Word>
						</g>
					);
				})}
			</g>
			{/* A hidden final-value fit keeps the lock exact while the meter walks. */}
			<Word
				name="floor-fit"
				x={margin + L.meterCol}
				y={L.meterNum + T.head * 0.5}
				size={T.head * 1.8}
				anchor="start"
				className={`wt-film-num ${toneClass.focus}`}
			>
				{whole(SMALL_LEFT)}
			</Word>
			<Brackets name="lock-floor" glow />

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-tag"
					x={W / 2}
					y={H * 0.36}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				<Word
					name="q-num"
					x={W / 2}
					y={H * 0.36 + T.big * 0.95}
					size={T.big * 0.85}
					className="wt-film-num"
				>
					{whole(ACCOUNT)}
				</Word>
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
			{headline("a-head", copy.ruleHead)}
			{headline("b-head", copy.worstHead)}
			{headline("c-head", copy.fitHead)}
			{headline("s-head", copy.streakHead)}
			{headline("u-head", copy.sameHead)}
			{/* The answer, a line under the headline, as the smaller size's balance locks. */}
			<Lines
				name="u2-head"
				text={t(copy.keptHead)}
				x={margin}
				y={L.headY + T.head * 1.35}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{headline("e-head", copy.exitHead)}
			{headline("g-head", copy.gapHead)}

			{/* The example rule, then the two contracts it is tried on. */}
			<g data-f="rule">
				<Word
					name="rule-tag"
					x={W / 2}
					y={L.ruleY}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.ruleTag).toUpperCase()}
				</Word>
				<Word
					name="rule-eq"
					x={W / 2}
					y={L.ruleY + T.num * 1.15}
					size={T.num}
					className="wt-film-num"
				>
					{`${RULE_PERCENT}% × ${whole(ACCOUNT)} = ${whole(BUDGET)}`}
				</Word>
			</g>
			<g data-f="cols">
				{candidates.map(({ name, contract, price, worst, size }, i) => (
					<g key={name} data-f={`k-${name}`}>
						<g data-f={`k-${name}-card`}>
							<Word
								name={`k-${name}-tag`}
								x={W * L.pair[i]}
								y={L.colY}
								size={T.small}
								className="wt-film-tag"
							>
								{t(contractLabel(contract, false)).toUpperCase()}
							</Word>
							<Word
								name={`k-${name}-price`}
								x={W * L.pair[i]}
								y={L.colY + T.body * 1.7}
								size={T.body}
								className="wt-film-num wt-film-dim"
							>
								{locale === "zh"
									? `${t(copy.perShare)} ${usd(price)}`
									: `${usd(price)} ${t(copy.perShare)}`}
							</Word>
						</g>
						<Word
							name={`k-${name}-worst`}
							x={W * L.pair[i]}
							y={L.colY + T.body * 1.7 + T.num * 1.15}
							size={T.num}
							className="wt-film-num"
						>
							{whole(worst)}
						</Word>
						<Word
							name={`k-${name}-unit`}
							x={W * L.pair[i]}
							y={L.colY + T.body * 1.7 + T.num * 1.15 + T.small * 1.8}
							size={T.small}
							className="wt-film-tag"
						>
							{t(copy.perContract).toUpperCase()}
						</Word>
						<Word
							name={`k-${name}-size`}
							x={W * L.pair[i]}
							y={
								L.colY +
								T.body * 1.7 +
								T.num * 1.15 +
								T.small * 1.8 +
								T.head * 1.7
							}
							size={T.head}
							className={`wt-film-num ${size > 0 ? toneClass.focus : ""}`}
						>
							{t(sizeText(size))}
						</Word>
					</g>
				))}
			</g>

			{/* The plan, written on the day of the purchase, and the gap that jumps past it. */}
			<g data-f="plan">
				<Word
					name="x-tag"
					x={W / 2}
					y={L.planY}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.planTag).toUpperCase()}
				</Word>
				{/* Each row is a name and its value either side of the centre line. */}
				{(
					[
						["x-profit", 0, copy.profit, usd(PROFIT_POINT), PROFIT_RESULT],
						["x-loss", 1, copy.loss, usd(LOSS_POINT), PLANNED_LOSS],
						["x-time", 2, copy.time, t(copy.timeBy), null],
						["x-gap", 3.3, copy.gap, t(copy.gapOpens), null],
					] as const
				).map(([name, at, label, value, result]) => (
					<g key={name} data-f={name}>
						<Word
							name={`${name}-label`}
							x={W / 2 - L.rowSize * 0.6}
							y={row(at)}
							size={L.rowSize}
							anchor="end"
							className="wt-film-num wt-film-dim"
						>
							{t(label)}
						</Word>
						<Word
							name={`${name}-value`}
							x={W / 2 + L.rowSize * 0.6}
							y={row(at)}
							size={L.rowSize}
							anchor="start"
							className="wt-film-num"
						>
							{value}
							{result === null ? null : (
								<tspan
									className={result > 0 ? toneClass.up : toneClass.down}
								>{` ${signedUsd(result, 0)}`}</tspan>
							)}
						</Word>
					</g>
				))}
				{/* The plan's loss stepped back beside the loss the gap made. */}
				<g data-f="x-pair">
					<Word
						name="x-planned"
						x={W / 2 - L.rowSize * 0.6}
						y={row(4.4)}
						size={L.rowSize * 1.15}
						anchor="end"
						className="wt-film-num wt-film-dim"
					>
						{t(copy.planned)}
					</Word>
					<Word
						name="x-actual"
						x={W / 2 + L.rowSize * 0.6}
						y={row(4.4)}
						size={L.rowSize * 1.15}
						anchor="start"
						className={`wt-film-num ${toneClass.down}`}
					>
						{t(copy.actual)}
					</Word>
				</g>
				<Word
					name="x-worst"
					x={W / 2}
					y={row(5.6)}
					size={T.body}
					className={`wt-film-type ${toneClass.focus}`}
				>
					{t(copy.worst)}
				</Word>
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
	const g = (name: string) => one<SVGGraphicsElement>(name);
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	/**
	 * A tween that walks the number of losses from 0 to the streak and draws everything from
	 * it each frame. Not rendered up front, so nothing reads the walk's end before it begins.
	 */
	const walk = (
		at: number,
		duration: number,
		place: (losses: number) => void,
	) => {
		const v = { at: 0 };
		tl.fromTo(
			v,
			{ at: 0 },
			{
				at: STREAK,
				duration,
				ease: "power1.inOut",
				immediateRender: false,
				onUpdate: () => place(v.at),
			},
			at,
		);
	};
	/** A size's marker on its line, the line drawn up to it, and its meter read from it. */
	const streakMove = (name: "big" | "small", percentLost: number) => {
		const dot = one(`${name}-marker`);
		const clip = one(`${name}-clip`);
		const out = one<SVGTextElement>(`s-${name}`);
		return (losses: number) => {
			const cents = afterLosses(percentLost, losses);
			gsap.set(dot, {
				attr: { cx: L.sx(losses), cy: L.sy(cents / 100) },
			});
			gsap.set(clip, { attr: { width: L.sx(losses) - L.left + 4 } });
			out.textContent = whole(Math.round(cents));
		};
	};
	const heads = [
		"a-head",
		"b-head",
		"c-head",
		"s-head",
		"u-head",
		"u2-head",
		"e-head",
		"g-head",
	].map((name) => one(name));
	const [aHead, bHead, cHead, sHead, uHead, u2Head, eHead, gHead] = heads;
	const cols = candidates.flatMap(({ name }) => [
		one(`k-${name}-card`),
		one(`k-${name}-worst`),
		one(`k-${name}-unit`),
		one(`k-${name}-size`),
	]);
	const plan = [
		"x-tag",
		"x-profit",
		"x-loss",
		"x-time",
		"x-gap",
		"x-pair",
		"x-worst",
	].map((name) => one(name));

	// A rebuild (a resize, the fonts arriving) starts both walks from the account again.
	streakMove("big", LARGE_PERCENT)(0);
	streakMove("small", SMALL_PERCENT)(0);

	d.hidden([
		one("big-tag"),
		one("big-back"),
		one("small-tag"),
		one("small-back"),
		one("big-marker"),
		one("small-marker"),
		one("floor-fit"),
		g("lock-floor"),
		...kids("smeter"),
		...kids("q"),
		...heads,
		...kids("rule"),
		...cols,
		...plan,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: the account, and one wrong call ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.4);
	word(one("q-num"), 4.7);
	show(one("q-line"), 5.3);

	// ——— size: the example rule, then what one contract can lose ———
	tl.addLabel("size", 8.8);
	hide(kids("q"), 8.8);
	show(aHead, 9.0);
	// "Not advice" is up with the headline, ahead of the rule's figures.
	show(one("rule-tag"), 9.0);
	word(one("rule-eq"), 9.2);
	// Each contract by name and price, still a full second before its worst case lands.
	d.swap(aHead, bHead, 12.7);
	candidates.forEach(({ name }) => {
		show(one(`k-${name}-card`), 13.3);
		word(one(`k-${name}-worst`), 14.6);
		show(one(`k-${name}-unit`), 14.6);
	});
	// The division's results: none of the dearer call, one of the cheaper.
	d.swap(bHead, cHead, 16.75);
	show(one("k-dear-size"), 17.5);
	show(one("k-cheap-size"), 18.0);
	tl.to(g("k-dear"), { opacity: 0.35, duration: 0.35 }, 19.5);

	// ——— streak: the same ten losses at two sizes; the smaller one keeps $8,171 ———
	tl.addLabel("streak", 20.85);
	hide([cHead, ...kids("rule"), g("k-dear"), g("k-cheap")], 20.85);
	show(sHead, 21.2);
	rise(21.2); // Settles at 22.0, a full second before the first line draws.
	// The meter is up at the account's start, with the size the headline names.
	show(one("s-big-cell"), 21.3);
	show(one("big-tag"), 21.6);
	pop(one("big-marker"), 23.0);
	walk(23.0, 1.4, streakMove("big", LARGE_PERCENT));
	// One full second of rest after the larger size settles at 24.4.
	d.swap(sHead, uHead, 25.4);
	tl.to(one("s-big-cell"), { opacity: 0.35, duration: 0.35 }, 25.4);
	tl.to(one("big-marker"), { opacity: 0.25, duration: 0.3 }, 25.4);
	show(one("small-tag"), 25.5);
	show(one("s-small-cell"), 25.75);
	pop(one("small-marker"), 26.25);
	walk(26.25, 1.4, streakMove("small", SMALL_PERCENT));
	// The hero: the balance has stopped at $8,171 and the brackets lock on it.
	d.lock(g("lock-floor"), 28.05, { around: g("floor-fit"), pad: 5 });
	tl.addLabel("hero-lock", 28.05);
	show(u2Head, 28.05);
	// After the hero has stood, the gain each account needs to get back.
	// They fade in where they stand: rising in would pass the label under them.
	tl.fromTo(
		one("small-back"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.4 },
		30.2,
	);
	tl.fromTo(
		one("big-back"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.4 },
		30.4,
	);

	// ——— exit: three exits written before entry, and the gap past one of them ———
	tl.addLabel("exit", 31.9);
	hide([uHead, u2Head, ...kids("smeter"), g("lock-floor")], 31.9);
	sink(31.9);
	show(eHead, 32.25);
	show(one("x-tag"), 32.4);
	show(one("x-profit"), 32.5);
	show(one("x-loss"), 32.55);
	show(one("x-time"), 32.6);
	// The loss point stays lit; the gap and what it means for the size arrive under it.
	d.swap(eHead, gHead, 35.85);
	tl.to(
		[one("x-profit"), one("x-time")],
		{ opacity: 0.3, duration: 0.35 },
		36.4,
	);
	show(one("x-gap"), 36.3);
	show(one("x-pair"), 36.45);
	show(one("x-worst"), 36.55);

	// ——— claim ———
	tl.addLabel("claim", 40.1);
	hide([gHead, ...plan], 40.1);
	word(one("z-big"), 40.45);
	show(one("z-sub"), 40.75);

	// ——— next ———
	tl.addLabel("next", 44.5);
	hide(kids("claim"), 44.5);
	d.close(44.5);
	return tl;
}

export const sizeAndExitFilm: Film = {
	id: "size-and-exit",
	label: [
		`Size and exit, as a short film: a ${whole(ACCOUNT)} account and an example rule of risking ${RULE_PERCENT}%, ${whole(BUDGET)}, on one trade; a call at ${usd(DEAR_PRICE)} a share is ${whole(DEAR_WORST)} a contract, so none fit, and a call at ${usd(CHEAP_PRICE)} is ${whole(CHEAP_WORST)}, so one fits; ten losses in a row leave ${whole(LARGE_LEFT)} when each takes ${LARGE_PERCENT}% of what is left and ${whole(SMALL_LEFT)} when each takes ${SMALL_PERCENT}%; and an exit plan with a profit point at ${usd(PROFIT_POINT)}, a loss point at ${usd(LOSS_POINT)} and a time stop on ${TIME_STOP_LABEL[0]}, which an overnight gap to ${usd(GAP_OPEN)} jumps past, losing ${whole(-GAP_RESULT)} and not the ${whole(-PLANNED_LOSS)} planned`,
		`仓位与出场短片：一个 ${whole(ACCOUNT)} 的账户，以及一条示例规则，即每笔交易最多亏 ${RULE_PERCENT}%，也就是 ${whole(BUDGET)}；每股 ${usd(DEAR_PRICE)} 的看涨每张 ${whole(DEAR_WORST)}，一张也买不了，每股 ${usd(CHEAP_PRICE)} 的看涨每张 ${whole(CHEAP_WORST)}，可以买一张；连续亏十次，每次亏掉余额的 ${LARGE_PERCENT}% 时只剩 ${whole(LARGE_LEFT)}，每次亏 ${SMALL_PERCENT}% 时还剩 ${whole(SMALL_LEFT)}；以及一份出场计划，止盈点 ${usd(PROFIT_POINT)}、止损点 ${usd(LOSS_POINT)}、时间止损 ${TIME_STOP_LABEL[1]}，而隔夜跳空到 ${usd(GAP_OPEN)} 越过了止损点，亏 ${whole(-GAP_RESULT)}，而不是计划中的 ${whole(-PLANNED_LOSS)}`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Size and exit", "仓位与出场"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "size", label: ["Size", "仓位大小"] },
		{ id: "streak", label: ["A losing streak", "连续亏损"] },
		{ id: "exit", label: ["The exit plan", "出场计划"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
