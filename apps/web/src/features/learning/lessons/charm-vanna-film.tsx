import { gsap } from "gsap";
import { useId } from "react";
import { type Copy, pick, signedCount } from "@/content/world";
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
	signTone,
	TitleCard,
	toneClass,
	Word,
} from "../walkthrough/film-kit";
import {
	AFTER_BOTH,
	AFTER_WEEK,
	CHARM_DAY,
	CHARM_DAYS_PER_YEAR,
	delta,
	fixed3,
	LONG,
	PER_YEAR,
	plain3,
	SHORT,
	SPOT,
	STRIKE,
	spreadAt,
	TODAY,
	VANNA_COMPARISON_POINT,
	VOL_DROP,
	WEEK,
} from "./charm-vanna-model";

/*
 * Charm and vanna, as a film. It opens on the Oct 18 110 call's delta, 0.177, and a week
 * in which ALFA stays at $100 and nobody trades. Delta falls anyway: to 0.144 from time
 * alone (charm, today about −0.004/day, +1.46 per year of time left), and to 0.120
 * if IV also drops three points (average vanna here, ≈ +0.008 per IV point). Last, a signed position:
 * the 10:50 spread's delta rises from +7,750 to +8,150 shares with no trade.
 *
 *   open      0–4        "Charm and vanna"
 *   question  4–9.6      0.177 — a week passes, ALFA stays at $100, nobody trades
 *   charm     9.6–20.5   one question across the curve and week: 0.177 → 0.144; Charm's
 *                        definition sits on the chart, then −0.004/day and +1.46 per year left
 *   vanna     21.55–33.4 IV −3: 0.144 → 0.120; fraction, ≈ +0.008, lock, then − ÷ − = +
 *   spread    33.4–45.7  reset to today, IV unchanged; +16,600 and −8,850 →
 *                        +15,350 and −7,200: net +400;
 *                        cut: "Delta can change while nothing trades."
 *   next      45.7–47.5  Next: the module checkpoint
 */

const END = 47.5;
const DAYS_SHOWN = 28;
const Y_TOP = 0.2;
const LABEL_DAY = 17;
const days = Array.from({ length: DAYS_SHOWN + 1 }, (_, day) => day);
const SPREAD = [spreadAt(0), spreadAt(1)] as const;
const LEGS = ["long", "short", "net"] as const;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	const left = Math.max(frame.margin, narrow ? 46 : 0);
	const right = width * 0.965;
	const top = height * (narrow ? 0.54 : 0.5);
	const bottom = height * (narrow ? 0.9 : 0.93);
	const x = (day: number) => left + (day / DAYS_SHOWN) * (right - left);
	const y = (value: number) => bottom - (value / Y_TOP) * (bottom - top);
	const path = (volPoints: number) =>
		days
			.map(
				(day, i) =>
					`${i ? "L" : "M"}${x(day).toFixed(1)} ${y(delta(STRIKE, day, volPoints)).toFixed(1)}`,
			)
			.join("");
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		x,
		y,
		path,
		pair: narrow ? [0.27, 0.73] : [0.32, 0.68],
		/** The spread's rows: a label on the left, the figure, then its change. */
		rowY: (i: number) =>
			height * (narrow ? 0.4 : 0.36) + i * height * (narrow ? 0.15 : 0.14),
		valueX: width * (narrow ? 0.64 : 0.62),
		changeX: narrow ? width - frame.margin * 0.5 : width * 0.86,
	};
}

const copy = {
	title: ["Charm and vanna", "Charm 与 Vanna"],
	titleSub: ["exposure moving without a trade", "没有成交也会变化的敞口"],
	qTag: [
		`ALFA Oct 18 ${STRIKE} call · model delta`,
		`ALFA 10月18日 ${STRIKE} 看涨 · 模型 Delta`,
	],
	q0: ["a week passes", "一周过去"],
	q1: [`ALFA stays at $${SPOT}`, `ALFA 停在 $${SPOT}`],
	q2: ["nobody trades", "没人交易"],
	curveHead: ["Can delta change without a trade?", "没有成交，Delta 会变吗？"],
	volHead: ["What if IV falls too?", "如果 IV 也下降呢？"],
	axis: [
		`Oct 18 ${STRIKE} call · model delta`,
		`10月18日 ${STRIKE} 看涨 · 模型 Delta`,
	],
	axisShort: [`${STRIKE} call · delta`, `${STRIKE} 看涨 · Delta`],
	meter: ["delta", "Delta"],
	today: ["today", "今天"],
	sameIv: ["IV unchanged", "IV 不变"],
	lowIv: [`IV −${VOL_DROP} points`, `IV −${VOL_DROP} 点`],
	charmWord: ["Charm", "Charm"],
	charmDef: [
		"Delta changes with time; price and IV stay fixed.",
		"价格、IV 保持不变，Delta 随时间变化",
	],
	charmNum: [
		`today: about ${fixed3(CHARM_DAY)}/day`,
		`今天：约 ${fixed3(CHARM_DAY)}/天`,
	],
	charmAlt: ["per remaining year", "每一年剩余期限"],
	vannaWord: ["Vanna", "Vanna"],
	vannaDef: [
		"how delta changes with implied volatility",
		"Delta 随隐含波动率的变化",
	],
	vannaDeltaLabel: ["Δdelta", "Delta 变化"],
	vannaUnit: ["average delta per IV point", "平均 Delta／IV 点"],
	spreadToday: [`Today · ALFA $${SPOT}`, `今天 · ALFA $${SPOT}`],
	spreadTransition: [
		`Today → +7 days · ALFA $${SPOT}`,
		`今天 → +7天 · ALFA $${SPOT}`,
	],
	spreadHead: ["The 10:50 call spread, two legs.", "10:50 看涨价差，两条腿。"],
	spreadHeadShort: ["The 10:50 call spread.", "10:50 看涨价差。"],
	laterHead: [
		"A week later, no trade: delta rises.",
		"一周后，没有成交：Delta 上升。",
	],
	laterHeadShort: ["A week later, no trade.", "一周后，没有成交。"],
	long: [
		`+${LONG.quantity} × ${LONG.strike} call`,
		`+${LONG.quantity} × ${LONG.strike} 看涨`,
	],
	short: [
		`−${SHORT.quantity} × ${SHORT.strike} call`,
		`−${SHORT.quantity} × ${SHORT.strike} 看涨`,
	],
	net: ["net", "净额"],
	sharesTag: ["delta, shares", "Delta（股）"],
	changeTag: ["change", "变化"],
	claimBig: [
		"Delta can change while nothing trades.",
		"没有成交，Delta 也会变。",
	],
	claimSub: [
		"Model sensitivities on a stated position, not flow.",
		"Charm 与 Vanna 是模型敏感度，不是成交流。",
	],
	nextBig: ["Next: the module checkpoint", "下一步：本模块检查点"],
	nextSub: [
		"modeled positioning and structure, on a new day",
		"在新的一天里运用模型持仓与结构",
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
	const L = layout(width);
	const { height: H, type: T, room, narrow } = L;
	const W = width;
	const id = useId().replace(/:/g, "");
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
	/** A compact chart annotation: the name, definition, daily estimate and annualization. */
	const card = (
		name: string,
		word: Copy,
		definition: Copy,
		figure: Copy,
		alt?: Copy,
	) => {
		const definitionWidth = room * (narrow ? 0.72 : 0.84);
		const wordY = H * (narrow ? 0.17 : 0.22);
		const definitionY = wordY + T.head * 1.3;
		const definitionLines = lineCount(t(definition), definitionWidth, T.body);
		const figureY =
			definitionY + definitionLines * T.body * 1.35 + T.head * 1.6;
		return (
			<g data-f={name}>
				<Word
					name={`${name}-word`}
					x={W / 2}
					y={wordY}
					size={T.head * 1.05}
					className="wt-film-type"
				>
					{t(word)}
				</Word>
				<Lines
					name={`${name}-def`}
					text={t(definition)}
					x={W / 2}
					y={definitionY}
					size={T.body}
					maxWidth={definitionWidth}
					className="wt-film-type wt-film-dim"
				/>
				<Word
					name={`${name}-num`}
					x={W / 2}
					y={figureY}
					size={T.head}
					className="wt-film-num wt-film-loss"
				>
					{t(figure)}
				</Word>
				{alt ? (
					<g data-f={`${name}-alt`}>
						<Word
							name={`${name}-conversion`}
							x={W / 2}
							y={figureY + T.body * 2}
							size={T.body}
							className="wt-film-num wt-film-dim"
						>
							<tspan style={{ fill: "var(--tone-ink)" }}>
								{fixed3(CHARM_DAY)}
							</tspan>
							{" × "}
							<tspan
								style={{ fill: "var(--tone-ink)" }}
							>{`−${CHARM_DAYS_PER_YEAR}`}</tspan>
							{" ≈ "}
							<tspan className={toneClass.up}>{PER_YEAR}</tspan>
						</Word>
						<Lines
							name={`${name}-conversion-unit`}
							text={t(alt)}
							x={W / 2}
							y={figureY + T.body * 3.65}
							size={T.body}
							maxWidth={definitionWidth}
							className="wt-film-type wt-film-dim"
						/>
					</g>
				) : null}
			</g>
		);
	};
	const x7 = L.x(WEEK);
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<clipPath id={`draw-same-${id}`}>
					<rect data-f="draw-same" x={L.left - 4} y={0} width={0} height={H} />
				</clipPath>
				<clipPath id={`draw-low-${id}`}>
					<rect data-f="draw-low" x={L.left - 4} y={0} width={0} height={H} />
				</clipPath>
			</defs>

			<g data-f="depth">
				<g data-f="world">
					<g data-f="chart">
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(narrow ? copy.axisShort : copy.axis)}
						</text>
						{[0, 0.1, 0.2].map((tick) => (
							<g key={tick}>
								<path
									d={`M${L.left} ${L.y(tick)}H${L.right}`}
									className={tick === 0 ? "wt-axis" : "wt-grid"}
								/>
								<text
									x={L.left - 8}
									y={L.y(tick) + 4}
									textAnchor="end"
									className="wt-small"
								>
									{tick === 0 ? "0" : tick.toFixed(2)}
								</text>
							</g>
						))}
						{[0, 7, 14, 21, 28].map((day) => (
							<text
								key={day}
								x={L.x(day)}
								y={L.bottom + 16}
								textAnchor={
									day === 0 ? "start" : day === DAYS_SHOWN ? "end" : "middle"
								}
								className="wt-small"
							>
								{day === 0
									? t(copy.today)
									: locale === "zh"
										? `+${day}天`
										: `+${day}d`}
							</text>
						))}
						<g clipPath={`url(#draw-same-${id})`}>
							<path
								data-f="same-curve"
								className="wt-line-position"
								d={L.path(0)}
								strokeDasharray="5 4"
								style={{ strokeWidth: 3, strokeLinejoin: "round" }}
							/>
						</g>
						<g clipPath={`url(#draw-low-${id})`}>
							<path
								data-f="low-curve"
								className="wt-line-position"
								d={L.path(-VOL_DROP)}
								strokeDasharray="5 4"
								style={{ strokeWidth: 2.5 }}
							/>
						</g>
						<text
							data-f="same-label"
							x={L.x(LABEL_DAY) + 6}
							y={L.y(delta(STRIKE, LABEL_DAY)) - 6}
							className="wt-small wt-halo"
							style={{ fontWeight: 600 }}
						>
							{t(copy.sameIv)}
						</text>
						<text
							data-f="low-label"
							x={L.x(LABEL_DAY) - 6}
							y={L.y(delta(STRIKE, LABEL_DAY, -VOL_DROP)) + 16}
							textAnchor="end"
							className={`wt-small wt-halo ${toneClass.focus}`}
						>
							{"IV "}
							<tspan className={toneClass.down}>{t(copy.lowIv).slice(3)}</tspan>
						</text>
						<path
							data-f="level"
							d={`M${L.x(0)} ${L.y(TODAY)}H${x7}`}
							className="wt-film-link"
						/>
						<path
							data-f="charm-step"
							d={`M${x7} ${L.y(TODAY)}V${L.y(AFTER_WEEK)}`}
							className="wt-film-gap"
						/>
						<path
							data-f="vanna-step"
							d={`M${x7} ${L.y(AFTER_WEEK)}V${L.y(AFTER_BOTH)}`}
							className="wt-film-gap"
						/>
						<text
							data-f="charm-change"
							x={x7 + 8}
							y={L.y((TODAY + AFTER_WEEK) / 2) + 4}
							className="wt-halo wt-loss wt-marker-label"
						>
							{fixed3(AFTER_WEEK - TODAY)}
						</text>
						<text
							data-f="vanna-change"
							x={x7}
							y={L.y(AFTER_BOTH) + 26}
							textAnchor="middle"
							className="wt-halo wt-film-num wt-film-loss"
							style={{ fontSize: T.small }}
						>
							{fixed3(AFTER_BOTH - AFTER_WEEK)}
						</text>
						<circle
							data-f="marker"
							cx={L.x(0)}
							cy={L.y(TODAY)}
							r={6}
							className="wt-chip"
							stroke="var(--foreground)"
							strokeWidth={1.5}
						/>
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
					{t(copy.meter).toUpperCase()}
				</Word>
				<Word
					name="m-value"
					x={L.right}
					y={L.headY + T.head * 1.25 + T.num * 1.05}
					size={T.num}
					anchor="end"
					className="wt-film-num wt-film-accent"
				>
					{plain3(TODAY)}
				</Word>
			</g>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-tag"
					x={W / 2}
					y={H * 0.27}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				<Word
					name="q-big"
					x={W / 2}
					y={H * 0.27 + T.big * 1.3}
					size={T.big}
					className="wt-film-num wt-film-accent"
				>
					{plain3(TODAY)}
				</Word>
				{([copy.q0, copy.q1, copy.q2] as const).map((line, i) => (
					<Word
						key={line[0]}
						name={`q-${i}`}
						x={narrow ? W / 2 : W * (0.22 + i * 0.28)}
						y={narrow ? H * (0.66 + i * 0.1) : H * 0.74}
						size={T.head}
						className="wt-film-type"
					>
						{t(line)}
					</Word>
				))}
			</g>
			{headline("c-head", copy.curveHead, copy.curveHead)}
			{headline("v-head", copy.volHead, copy.volHead)}
			{card(
				"charm",
				copy.charmWord,
				copy.charmDef,
				copy.charmNum,
				copy.charmAlt,
			)}
			{/* The settled IV loss survives the cut and becomes the division's numerator. */}
			<Word
				name="vanna-input"
				x={x7}
				y={L.y(AFTER_BOTH) + 26}
				size={T.small}
				className="wt-film-num"
			>
				{fixed3(AFTER_BOTH - AFTER_WEEK)}
			</Word>
			<Word
				name="vanna-waypoint"
				x={L.margin + T.small * 2}
				y={H * 0.4}
				size={T.small}
				className="wt-film-num"
			>
				{fixed3(AFTER_BOTH - AFTER_WEEK)}
			</Word>
			<g data-f="vanna">
				<Word name="vanna-word" x={W / 2} y={H * 0.25} size={T.head * 1.05}>
					{t(copy.vannaWord)}
				</Word>
				<Lines
					name="vanna-def"
					text={t(copy.vannaDef)}
					x={W / 2}
					y={H * 0.25 + T.head * 1.3}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
				<Word
					name="vanna-delta"
					x={W / 2}
					y={H * 0.43}
					size={T.head}
					className="wt-film-num"
				>
					{fixed3(AFTER_BOTH - AFTER_WEEK)}
				</Word>
				<Word
					name="vanna-delta-label"
					x={W / 2 + T.head * 3}
					y={H * 0.43}
					size={T.body}
					anchor="start"
					className="wt-film-type wt-film-dim"
				>
					{t(copy.vannaDeltaLabel)}
				</Word>
				<path
					data-f="vanna-divide"
					d={`M${W / 2 - T.head * 2.6} ${H * 0.465}h${T.head * 5.2}`}
					className="wt-film-link"
				/>
				<Word
					name="vanna-iv"
					x={W / 2}
					y={H * 0.53}
					size={T.head}
					className="wt-film-num"
				>
					{`ΔIV −${VOL_DROP}`}
				</Word>
				<Word
					name="vanna-num"
					x={W / 2}
					y={H * 0.68}
					size={T.num * 1.6}
					className={`wt-film-num ${toneClass.up}`}
				>
					{`≈ ${fixed3(VANNA_COMPARISON_POINT)}`}
				</Word>
				<Word
					name="vanna-unit"
					x={W / 2}
					y={H * 0.77}
					size={T.body}
					className="wt-film-type wt-film-dim"
				>
					{t(copy.vannaUnit)}
				</Word>
				<Word
					name="vanna-sign"
					x={W / 2}
					y={H * 0.88}
					size={T.body * 1.25}
					className="wt-film-num wt-film-dim"
				>
					<tspan style={{ fill: "var(--tone-ink)" }}>−</tspan>
					{" ÷ "}
					<tspan style={{ fill: "var(--tone-ink)" }}>−</tspan>
					{" = "}
					<tspan className={toneClass.up}>+</tspan>
				</Word>
			</g>
			<Brackets name="lock-vanna" tone="gain" glow />
			{headline("s-head", copy.spreadHead, copy.spreadHeadShort)}
			{headline("l-head", copy.laterHead, copy.laterHeadShort)}
			<g data-f="spread">
				{(["spreadToday", "spreadTransition"] as const).map((state) => (
					<Word
						key={state}
						name={`s-${state}`}
						x={L.margin}
						y={L.rowY(0) - T.head * 3.4}
						size={T.small}
						anchor="start"
						className="wt-film-tag"
					>
						{t(copy[state])}
					</Word>
				))}
				<Word
					name="s-iv"
					x={L.margin}
					y={L.rowY(0) - T.head * 2.3}
					size={T.small}
					anchor="start"
					className="wt-film-tag"
				>
					{t(copy.sameIv)}
				</Word>
				<Word
					name="s-shares"
					x={L.valueX}
					y={L.rowY(0) - T.head * 1.3}
					size={T.small}
					anchor="end"
					className="wt-film-tag"
				>
					{t(copy.sharesTag).toUpperCase()}
				</Word>
				<Word
					name="s-change"
					x={L.changeX}
					y={L.rowY(0) - T.head * 1.3}
					size={T.small}
					anchor="end"
					className="wt-film-tag"
				>
					{t(copy.changeTag).toUpperCase()}
				</Word>
				<path
					data-f="s-rule"
					d={`M${L.margin} ${L.rowY(2) - T.head * 1.05}H${L.changeX}`}
					className="wt-axis"
				/>
				{LEGS.map((leg, i) => {
					const net = leg === "net";
					const valueTone = net ? signTone(SPREAD[0][leg]) : undefined;
					const [quantity, contract] = t(copy[leg]).split(" × ");
					return (
						<g key={leg}>
							<Word
								name={`s-label-${leg}`}
								x={L.margin}
								y={L.rowY(i)}
								size={narrow ? T.body : T.head * 0.85}
								anchor="start"
								className={`wt-film-type ${net ? "wt-film-accent" : "wt-film-dim"}`}
							>
								{net ? (
									t(copy[leg])
								) : (
									<>
										<tspan style={{ fill: "var(--tone-ink)" }}>
											{quantity}
										</tspan>
										{` × ${contract}`}
									</>
								)}
							</Word>
							<Word
								name={`s-value-${leg}`}
								x={L.valueX}
								y={L.rowY(i)}
								size={net ? T.head * 1.2 : T.head}
								anchor="end"
								className={`wt-film-num ${valueTone ? toneClass[valueTone] : ""}`}
							>
								{signedCount(SPREAD[0][leg])}
							</Word>
							<Word
								name={`s-delta-${leg}`}
								x={L.changeX}
								y={L.rowY(i)}
								size={net ? T.head * 1.2 : T.head}
								anchor="end"
								className="wt-film-num wt-film-dim"
							>
								{signedCount(0)}
							</Word>
						</g>
					);
				})}
			</g>
			<g data-f="claim">
				<Lines
					name="z-big"
					text={t(copy.claimBig)}
					x={W / 2}
					y={H * 0.44}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="z-sub"
					text={t(copy.claimSub)}
					x={W / 2}
					y={
						H * 0.44 +
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
	const flat = (name: string) =>
		kids(name).flatMap((el) => (el.tagName === "g" ? [...el.children] : [el]));
	const marker = one("marker");
	const meter = one<SVGTextElement>("m-value");
	const draw = (path: SVGPathElement, at: number, duration = 0.4) => {
		const length = path.getTotalLength();
		tl.fromTo(
			path,
			{ opacity: 0, strokeDasharray: length, strokeDashoffset: length },
			{ opacity: 1, strokeDashoffset: 0, duration, ease: "power2.out" },
			at,
		);
	};
	const reveal = (name: string, at: number, duration: number) =>
		tl.to(
			one(name),
			{ attr: { width: L.right - L.left + 8 }, duration, ease: "power2.inOut" },
			at,
		);
	const word = (name: string, at: number) =>
		tl.fromTo(
			one(name),
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			at,
		);
	const lockVanna = one<SVGGraphicsElement>("lock-vanna");

	d.hidden([
		one("same-label"),
		one("low-label"),
		one("low-curve"),
		one("level"),
		one("charm-step"),
		one("vanna-step"),
		one("charm-change"),
		one("vanna-change"),
		marker,
		...kids("meter"),
		...flat("q"),
		...["c-head", "v-head", "s-head", "l-head"].map((name) => one(name)),
		...kids("charm"),
		...kids("vanna"),
		one("vanna-input"),
		one("vanna-waypoint"),
		lockVanna,
		...flat("spread"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: a week in which nothing happens ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	land(one("q-big"), 4.8);
	for (const i of [0, 1, 2]) show(one(`q-${i}`), 5.6 + i * 0.3, "below");

	// ——— charm: time alone moves delta ———
	tl.addLabel("charm", 9.6);
	hide([one("q-tag"), one("q-0"), one("q-1"), one("q-2")], 9.6);
	d.carry(one("q-big"), meter, 9.6, {
		duration: 0.8,
		arc: "x",
	});
	rise(9.6);
	show(one("c-head"), 9.8, "above");
	show(one("m-tag"), 10.4, "above");
	word("charm-word", 10.9);
	show(one("charm-def"), 10.9);
	// Axes and labels settle at 10.90; leave them still for 1.10 s before the
	// curve starts. The line then settles at 13.60, with the accepted 1.10 s rest.
	reveal("draw-same", 12.0, 1.6);
	land(marker, 12.0);
	tl.to(one("level"), { opacity: 1, duration: 0.4 }, 12.0);
	const walk = { day: 0 };
	tl.fromTo(
		walk,
		{ day: 0 },
		{
			day: WEEK,
			duration: 1.2,
			ease: "none",
			immediateRender: false,
			onUpdate: () => {
				const value = delta(STRIKE, walk.day);
				gsap.set(marker, {
					attr: { cx: L.x(walk.day), cy: L.y(value) },
				});
				meter.textContent = plain3(value);
			},
		},
		14.7,
	);
	draw(one<SVGPathElement>("charm-step"), 15.9);
	show(one("charm-change"), 16.3, "right");
	// Keep the chart beneath its definition and estimate; the definition now
	// belongs to this proof instead of replacing it with a second presentation.
	hide(one("c-head"), 17.0);
	land(one("charm-num"), 18.4);
	show(one("charm-alt"), 18.95);
	tl.set(
		one("charm-num"),
		{ attr: { class: "wt-film-num" }, immediateRender: false },
		18.95,
	);

	// ——— vanna: and implied volatility moves it too ———
	tl.addLabel("vanna", 21.55);
	hide(kids("charm"), 21.2);
	show(one("v-head"), 21.55, "above", 0.3);
	show([one("same-label"), one("low-label")], 21.55, "below", 0.3);
	// The Charm card is fully gone at 21.55. Let this question and its IV labels
	// settle for a second before the alternate curve starts to move.
	tl.to(
		one("same-curve"),
		{ opacity: 0.3, duration: 0.3, ease: "power2.in" },
		22.85,
	);
	reveal("draw-low", 22.85, 0.3);
	tl.fromTo(
		one("low-curve"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		22.85,
	);
	const iv = { volPoints: 0 };
	tl.fromTo(
		iv,
		{ volPoints: 0 },
		{
			volPoints: -VOL_DROP,
			duration: 1,
			ease: "power2.out",
			immediateRender: false,
			onUpdate: () => {
				const value = delta(STRIKE, WEEK, iv.volPoints);
				gsap.set(marker, { attr: { cx: L.x(WEEK), cy: L.y(value) } });
				meter.textContent = plain3(value);
			},
		},
		23.15,
	);
	draw(one<SVGPathElement>("vanna-step"), 24.4);
	show(one("vanna-change"), 24.4);
	// The proof settles at 24.90; keep its full 1.05 s rest. Hand over the loss
	// in place before the chart sinks, then carry it through the cleared lane.
	hide([one("v-head"), ...kids("meter")], 25.95);
	tl.set(one("vanna-change"), { opacity: 0, immediateRender: false }, 25.95);
	tl.set(one("vanna-input"), { opacity: 1, immediateRender: false }, 25.95);
	sink(25.95);
	// Route around the left edge of the assembling fraction. The waypoint stays
	// hidden; the two carried copies hand over at the same resting coordinates.
	d.carry(one("vanna-input"), one("vanna-waypoint"), 26.3, {
		duration: 0.3,
		arc: "x",
		reveal: false,
	});
	d.carry(one("vanna-waypoint"), one("vanna-delta"), 26.6, {
		duration: 0.3,
		arc: "x",
	});
	word("vanna-word", 26.35);
	tl.fromTo(
		[one("vanna-def"), one("vanna-delta-label")],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.55 },
		26.35,
	);
	// Assemble both negative operands and the rule with the carry, then leave
	// the complete fraction quiet from 26.90 to 27.90 before revealing its answer.
	tl.fromTo(
		one("vanna-iv"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.55 },
		26.35,
	);
	draw(one<SVGPathElement>("vanna-divide"), 26.35, 0.55);
	land(one("vanna-num"), 27.9);
	tl.fromTo(
		one("vanna-unit"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		27.9,
	);
	d.lock(lockVanna, 29.45, { around: one("vanna-num"), pad: 8 });
	tl.addLabel("hero-lock", 29.45);
	// Brackets settle at 29.90. After 1.55 s of hero quiet, explain the quotient's
	// positive sign outside them; its settled line then has 1.45 s before the cut.
	tl.fromTo(
		one("vanna-sign"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		31.45,
	);

	// ——— spread: a signed position turns it into shares ———
	tl.addLabel("spread", 33.4);
	hide([...kids("vanna"), lockVanna], 33.4);
	show(one("s-head"), 33.75, "above");
	show([one("s-spreadToday"), one("s-iv")], 34.0);
	show([one("s-shares"), one("s-change")], 34.0);
	tl.to(one("s-rule"), { opacity: 1, duration: 0.4 }, 34.0);
	// The complete table scaffold settles at 34.50. Reveal each row together
	// after one second, with the three rows staggered across exactly 0.50 s.
	LEGS.forEach((leg, i) => {
		const at = 35.5 + i * 0.25;
		show(
			[one(`s-label-${leg}`), one(`s-value-${leg}`), one(`s-delta-${leg}`)],
			at,
		);
	});
	// A week later: each leg's delta moves, and the short leg's move is a gain.
	d.swap(one("s-head"), one("l-head"), 37.3);
	d.swap(one("s-spreadToday"), one("s-spreadTransition"), 37.3);
	// Every row starts with a zero change; all six values then update together,
	// so both the net and its change remain sums of the displayed signed legs.
	const spread = { progress: 0 };
	const spreadValues = LEGS.map((leg) => one<SVGTextElement>(`s-value-${leg}`));
	const spreadChanges = LEGS.map((leg) =>
		one<SVGTextElement>(`s-delta-${leg}`),
	);
	tl.fromTo(
		spread,
		{ progress: 0 },
		{
			progress: 1,
			duration: 1,
			ease: "none",
			immediateRender: false,
			onUpdate: () => {
				const long = Math.round(
					SPREAD[0].long + (SPREAD[1].long - SPREAD[0].long) * spread.progress,
				);
				const short = Math.round(
					SPREAD[0].short +
						(SPREAD[1].short - SPREAD[0].short) * spread.progress,
				);
				[long, short, long + short].forEach((value, i) => {
					const change = value - SPREAD[0][LEGS[i]];
					const tone = LEGS[i] === "net" ? signTone(change) : undefined;
					spreadValues[i].textContent = signedCount(value);
					spreadChanges[i].textContent = signedCount(change);
					spreadChanges[i].setAttribute(
						"class",
						`wt-film-num ${change === 0 ? "wt-film-dim" : tone ? toneClass[tone] : ""}`,
					);
				});
			},
		},
		39.15,
	);
	// Keep the transition label through the completed table; a second date label
	// would repeat the same qualification just before the claim.
	// Cut: the claim.
	hide([one("l-head"), ...flat("spread")], 41.2);
	word("z-big", 41.55);
	show(one("z-sub"), 41.55);

	// ——— next ———
	// The restored after-beat is funded before the lock; keep this 1.80 s end card.
	tl.addLabel("next", 45.7);
	hide(kids("claim"), 45.7);
	d.close(45.7);
	return tl;
}

export const charmVannaFilm: Film = {
	id: "charm-vanna",
	label: [
		`Charm and vanna, as a short film: the Oct 18 ${STRIKE} call's model delta of ${plain3(TODAY)} through a week in which ALFA stays at $${SPOT} and nobody trades; time alone takes it to ${plain3(AFTER_WEEK)}, which is charm, today about ${fixed3(CHARM_DAY)} a day or ${PER_YEAR} per year of time left; a ${VOL_DROP}-point fall in IV takes it to ${plain3(AFTER_BOTH)}, an average vanna of about ${fixed3(VANNA_COMPARISON_POINT)} per IV point; and a separate, IV-unchanged 10:50 call spread example rising from today's ${signedCount(SPREAD[0].net)} to ${signedCount(SPREAD[1].net)} shares a week later with no trade`,
		`Charm 与 Vanna 短片：10月18日 ${STRIKE} 看涨的模型 Delta ${plain3(TODAY)}，经过 ALFA 停在 $${SPOT}、无人交易的一周；仅时间就让它降到 ${plain3(AFTER_WEEK)}，这是 Charm，今天每天约 ${fixed3(CHARM_DAY)}，按每一年剩余期限为 ${PER_YEAR}；IV 下降 ${VOL_DROP} 点让它降到 ${plain3(AFTER_BOTH)}，这段比较的平均 Vanna 约为每个 IV 点 ${fixed3(VANNA_COMPARISON_POINT)}；另一个 IV 不变的 10:50 看涨价差例子，在没有成交的情况下从今天的 ${signedCount(SPREAD[0].net)} 股升到一周后的 ${signedCount(SPREAD[1].net)} 股`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Charm and vanna", "Charm 与 Vanna"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "charm", label: ["Charm", "Charm"] },
		{ id: "vanna", label: ["Vanna", "Vanna"] },
		{ id: "spread", label: ["The position", "持仓"] },
		{ id: "next", label: ["Next", "下一步"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
