import { gsap } from "gsap";
import { useId } from "react";
import { type Copy, pick, signedCount } from "@/content/world";
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
	AFTER_BOTH,
	AFTER_WEEK,
	CHARM_DAY,
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
	VANNA_POINT,
	VOL_DROP,
	WEEK,
} from "./charm-vanna-model";

/*
 * Charm and vanna, as a film. It opens on the Oct 18 110 call's delta, 0.177, and a week
 * in which ALFA stays at $100 and nobody trades. Delta falls anyway: to 0.144 from time
 * alone (charm, −0.004 a day), and to 0.120 if IV also drops three points (vanna, +0.008
 * per vol point). The same charm reads +1.46 quoted per year of time left. Last, a signed
 * position: the 10:50 spread's delta rises from +7,750 to +8,150 shares with no trade.
 *
 *   open      0–4     "Charm and vanna"
 *   question  4–9.5   0.177 — a week passes, ALFA stays at $100, nobody trades
 *   charm     9.5–20  delta across days; a week: 0.177 → 0.144; cut: Charm, −0.004 a day
 *   vanna     20–29.5 IV −3: 0.144 → 0.120; cut: Vanna, +0.008 per vol point
 *   units     29.5–36 −0.004 per day against +1.46 per year left
 *   spread    36–46.5 +16,600 and −8,850 → +15,350 and −7,200: net +400;
 *                      cut: "Delta can change while nothing trades."
 *   next      46.5–49  Next: the module checkpoint
 */

const END = 49;
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
	const top = height * (narrow ? 0.42 : 0.3);
	const bottom = height * 0.84;
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
	titleSub: ["exposure that changes without a trade", "没有成交也会变化的敞口"],
	qTag: [
		`ALFA Oct 18 ${STRIKE} call · model delta`,
		`ALFA 10月18日 ${STRIKE} 看涨 · 模型 Delta`,
	],
	q0: ["a week passes", "一周过去"],
	q1: [`ALFA stays at $${SPOT}`, `ALFA 停在 $${SPOT}`],
	q2: ["nobody trades", "没人交易"],
	curveHead: [
		`The ${STRIKE} call's delta as days pass, ALFA held at $${SPOT}.`,
		`ALFA 保持 $${SPOT} 时，${STRIKE} 看涨的 Delta 随天数变化。`,
	],
	curveHeadShort: ["Delta as days pass.", "Delta 随天数变化。"],
	weekHead: [
		`A week, no trade: delta falls to ${plain3(AFTER_WEEK)}.`,
		`一周，没有成交：Delta 降到 ${plain3(AFTER_WEEK)}。`,
	],
	weekHeadShort: [
		`A week, no trade: ${plain3(AFTER_WEEK)}.`,
		`一周，无成交：${plain3(AFTER_WEEK)}。`,
	],
	volHead: [
		`Now IV falls ${VOL_DROP} points as well.`,
		`现在 IV 也下降 ${VOL_DROP} 个点。`,
	],
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
		"how delta changes as days pass, with price and IV held still",
		"价格与 IV 不变时，Delta 随天数流逝的变化",
	],
	charmNum: [`${fixed3(CHARM_DAY)} a day`, `每天 ${fixed3(CHARM_DAY)}`],
	vannaWord: ["Vanna", "Vanna"],
	vannaDef: [
		"how delta changes with implied volatility",
		"Delta 随隐含波动率的变化",
	],
	vannaNum: [
		`${fixed3(VANNA_POINT)} per vol point`,
		`每个波动率点 ${fixed3(VANNA_POINT)}`,
	],
	unitsHead: ["One charm, two quotes.", "同一个 Charm，两种报法。"],
	perDay: ["per day passed", "每经过一天"],
	perDayShort: ["per day", "每天"],
	perYear: ["per year of time left", "每一年剩余期限"],
	perYearShort: ["per year left", "每年剩余"],
	unitsLine: [
		"Time left runs the other way, and a year is 365 days. Read the unit before you scale.",
		"剩余期限方向相反，一年是 365 天。先读单位，再去放大。",
	],
	spreadHead: [
		`The 10:50 spread: long ${LONG.quantity} ${LONG.strike} calls, short ${SHORT.quantity} ${SHORT.strike} calls.`,
		`10:50 价差：多头 ${LONG.quantity} 张 ${LONG.strike} 看涨，空头 ${SHORT.quantity} 张 ${SHORT.strike} 看涨。`,
	],
	spreadHeadShort: ["The 10:50 call spread.", "10:50 看涨价差。"],
	laterHead: [
		"A week later, nothing traded: the short leg's decay adds delta.",
		"一周后，没有成交：空头腿的衰减增加了 Delta。",
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
		"Charm and vanna are model sensitivities on a stated position, not observed flow.",
		"Charm 与 Vanna 是模型对给定持仓的敏感度，不是观测到的成交流。",
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
	/** A cut to one word: the name, what it measures, and its size here. */
	const card = (name: string, word: Copy, definition: Copy, figure: Copy) => (
		<g data-f={name}>
			<Word
				name={`${name}-word`}
				x={W / 2}
				y={H * 0.42}
				size={T.big}
				className="wt-film-type"
			>
				{t(word)}
			</Word>
			<Lines
				name={`${name}-def`}
				text={t(definition)}
				x={W / 2}
				y={H * 0.42 + T.big * 0.62}
				size={T.body}
				maxWidth={room}
				className="wt-film-type wt-film-dim"
			/>
			<Word
				name={`${name}-num`}
				x={W / 2}
				y={
					H * 0.42 +
					T.big * 0.62 +
					lineCount(t(definition), room, T.body) * T.body * 1.35 +
					T.head * 1.6
				}
				size={T.head}
				className="wt-film-num wt-film-accent"
			>
				{t(figure)}
			</Word>
		</g>
	);
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
							<path className="wt-line-position" d={L.path(0)} />
						</g>
						<g clipPath={`url(#draw-low-${id})`}>
							<path className="wt-line-short" d={L.path(-VOL_DROP)} />
						</g>
						<text
							data-f="same-label"
							x={L.x(LABEL_DAY) + 6}
							y={L.y(delta(STRIKE, LABEL_DAY)) - 6}
							className="wt-small wt-halo wt-accent"
						>
							{t(copy.sameIv)}
						</text>
						<text
							data-f="low-label"
							x={L.x(LABEL_DAY) - 6}
							y={L.y(delta(STRIKE, LABEL_DAY, -VOL_DROP)) + 16}
							textAnchor="end"
							className="wt-small wt-halo"
							style={{ fill: "var(--wt-short)" }}
						>
							{t(copy.lowIv)}
						</text>
						<path
							data-f="level"
							d={`M${L.x(0)} ${L.y(TODAY)}H${x7}`}
							className="wt-film-link"
						/>
						<path
							data-f="charm-step"
							d={`M${x7} ${L.y(TODAY)}V${L.y(AFTER_WEEK)}`}
							className="wt-film-riser"
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
							className="wt-halo wt-accent wt-marker-label"
						>
							{fixed3(AFTER_WEEK - TODAY)}
						</text>
						<text
							data-f="vanna-change"
							x={x7}
							y={L.y(AFTER_BOTH) + 26}
							textAnchor="middle"
							className="wt-halo wt-loss wt-marker-label"
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
					y={H * 0.27 + T.big * 1.05}
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
			{headline("c-head", copy.curveHead, copy.curveHeadShort)}
			{headline("w-head", copy.weekHead, copy.weekHeadShort)}
			{headline("v-head", copy.volHead, copy.volHead)}
			{card("charm", copy.charmWord, copy.charmDef, copy.charmNum)}
			{card("vanna", copy.vannaWord, copy.vannaDef, copy.vannaNum)}
			<g data-f="units">
				{headline("u-head", copy.unitsHead, copy.unitsHead)}
				{(
					[
						[narrow ? copy.perDayShort : copy.perDay, fixed3(CHARM_DAY)],
						[narrow ? copy.perYearShort : copy.perYear, PER_YEAR],
					] as const
				).map(([tag, num], i) => (
					<g key={tag[0]}>
						<Word
							name={`u-tag-${i}`}
							x={W * L.pair[i]}
							y={H * 0.34}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`u-num-${i}`}
							x={W * L.pair[i]}
							y={H * 0.34 + T.big * 0.95}
							size={T.big * 0.8}
							className={`wt-film-num ${i ? "" : "wt-film-accent"}`}
						>
							{num}
						</Word>
					</g>
				))}
				<Word
					name="u-equation"
					x={W / 2}
					y={H * 0.66}
					size={T.head}
					className="wt-film-num"
				>
					{`${PER_YEAR} × −1/365 = ${fixed3(CHARM_DAY)}`}
				</Word>
				<Lines
					name="u-line"
					text={t(copy.unitsLine)}
					x={W / 2}
					y={H * 0.8}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("s-head", copy.spreadHead, copy.spreadHeadShort)}
			{headline("l-head", copy.laterHead, copy.laterHeadShort)}
			<g data-f="spread">
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
					const change = SPREAD[1][leg] - SPREAD[0][leg];
					const net = leg === "net";
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
								{t(copy[leg])}
							</Word>
							<Word
								name={`s-value-${leg}`}
								x={L.valueX}
								y={L.rowY(i)}
								size={net ? T.head * 1.2 : T.head}
								anchor="end"
								className={`wt-film-num ${net ? "wt-film-accent" : ""}`}
							>
								{signedCount(SPREAD[0][leg])}
							</Word>
							<Word
								name={`s-delta-${leg}`}
								x={L.changeX}
								y={L.rowY(i)}
								size={net ? T.head * 1.2 : T.head}
								anchor="end"
								className={`wt-film-num ${change > 0 ? "wt-film-gain" : "wt-film-loss"}`}
							>
								{signedCount(change)}
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
	const { tl, one, kids, show, hide, pop, slam, rise, sink } = d;
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
			{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
			at,
		);

	d.hidden([
		one("same-label"),
		one("low-label"),
		one("level"),
		one("charm-step"),
		one("vanna-step"),
		one("charm-change"),
		one("vanna-change"),
		marker,
		...kids("meter"),
		...flat("q"),
		...["c-head", "w-head", "v-head", "s-head", "l-head"].map((name) =>
			one(name),
		),
		...kids("charm"),
		...kids("vanna"),
		...flat("units"),
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
	slam(one("q-big"), 4.8);
	for (const i of [0, 1, 2]) show(one(`q-${i}`), 6.0 + i * 0.6, "below");

	// ——— charm: time alone moves delta ———
	tl.addLabel("charm", 9.5);
	hide(flat("q"), 9.5);
	show(one("c-head"), 9.7, "above");
	rise(9.8);
	reveal("draw-same", 10.4, 1.6);
	show(kids("meter"), 12.0, "above");
	pop(marker, 12.2);
	tl.to(one("level"), { opacity: 1, duration: 0.4 }, 12.4);
	d.swap(one("c-head"), one("w-head"), 13.4);
	const walk = { day: 0 };
	tl.to(
		walk,
		{
			day: WEEK,
			duration: 1.2,
			ease: "power2.inOut",
			onUpdate: () =>
				gsap.set(marker, {
					attr: { cx: L.x(walk.day), cy: L.y(delta(STRIKE, walk.day)) },
				}),
		},
		13.8,
	);
	d.count(meter, AFTER_WEEK, 13.8, plain3, TODAY, 1.2);
	draw(one<SVGPathElement>("charm-step"), 15.0);
	show(one("charm-change"), 15.2, "right");
	// Cut: the word.
	hide([one("w-head"), ...kids("meter")], 16.6);
	sink(16.6);
	word("charm-word", 17.0);
	show(one("charm-def"), 17.5);
	slam(one("charm-num"), 18.0);

	// ——— vanna: and implied volatility moves it too ———
	tl.addLabel("vanna", 20);
	hide(kids("charm"), 20.0);
	show(one("v-head"), 20.2, "above");
	rise(20.3);
	show(kids("meter"), 20.6, "above");
	reveal("draw-low", 20.8, 1.4);
	show([one("same-label"), one("low-label")], 22.3);
	tl.to(
		marker,
		{ attr: { cy: L.y(AFTER_BOTH) }, duration: 0.6, ease: "power2.inOut" },
		22.8,
	);
	d.count(meter, AFTER_BOTH, 22.8, plain3, AFTER_WEEK, 0.6);
	draw(one<SVGPathElement>("vanna-step"), 23.3);
	show(one("vanna-change"), 23.5);
	// Cut: the word.
	hide([one("v-head"), ...kids("meter")], 25.2);
	sink(25.2);
	word("vanna-word", 25.6);
	show(one("vanna-def"), 26.1);
	slam(one("vanna-num"), 26.6);

	// ——— units: the same charm, quoted two ways ———
	tl.addLabel("units", 29.5);
	hide(kids("vanna"), 29.5);
	show(one("u-head"), 29.7, "above");
	show(one("u-tag-0"), 30.0);
	slam(one("u-num-0"), 30.2);
	show(one("u-tag-1"), 30.8);
	slam(one("u-num-1"), 31.0);
	show(one("u-equation"), 32.0);
	show(one("u-line"), 32.8);

	// ——— spread: a signed position turns it into shares ———
	tl.addLabel("spread", 36);
	hide(flat("units"), 36.0);
	show(one("s-head"), 36.2, "above");
	show(one("s-shares"), 36.6);
	LEGS.forEach((leg, i) => {
		show(one(`s-label-${leg}`), 36.8 + i * 0.5);
		show(one(`s-value-${leg}`), 37.0 + i * 0.5, "right");
	});
	tl.to(one("s-rule"), { opacity: 1, duration: 0.4 }, 37.8);
	// A week later: each leg's delta moves, and the short leg's move is a gain.
	d.swap(one("s-head"), one("l-head"), 39.6);
	LEGS.forEach((leg) => {
		d.count(
			one<SVGTextElement>(`s-value-${leg}`),
			SPREAD[1][leg],
			40.0,
			(value) => signedCount(Math.round(value)),
			SPREAD[0][leg],
			0.9,
		);
	});
	show(one("s-change"), 41.0);
	show(one("s-delta-long"), 41.1, "right");
	show(one("s-delta-short"), 41.4, "right");
	slam(one("s-delta-net"), 41.9);
	// Cut: the claim.
	hide([one("l-head"), ...flat("spread")], 43.6);
	word("z-big", 44.0);
	show(one("z-sub"), 44.5);

	// ——— next ———
	tl.addLabel("next", 46.5);
	hide(kids("claim"), 46.5);
	d.close(46.5);
	return tl;
}

export const charmVannaFilm: Film = {
	id: "charm-vanna",
	label: [
		`Charm and vanna, as a short film: the Oct 18 ${STRIKE} call's model delta of ${plain3(TODAY)} through a week in which ALFA stays at $${SPOT} and nobody trades; time alone takes it to ${plain3(AFTER_WEEK)}, which is charm, ${fixed3(CHARM_DAY)} a day; a ${VOL_DROP}-point fall in IV takes it to ${plain3(AFTER_BOTH)}, which is vanna, ${fixed3(VANNA_POINT)} per vol point; the same charm quoted as ${PER_YEAR} per year of time left; and the 10:50 call spread's delta rising from ${signedCount(SPREAD[0].net)} to ${signedCount(SPREAD[1].net)} shares with no trade`,
		`Charm 与 Vanna 短片：10月18日 ${STRIKE} 看涨的模型 Delta ${plain3(TODAY)}，经过 ALFA 停在 $${SPOT}、无人交易的一周；仅时间就让它降到 ${plain3(AFTER_WEEK)}，这是 Charm，每天 ${fixed3(CHARM_DAY)}；IV 下降 ${VOL_DROP} 点让它降到 ${plain3(AFTER_BOTH)}，这是 Vanna，每个波动率点 ${fixed3(VANNA_POINT)}；同一个 Charm 按每一年剩余期限报价为 ${PER_YEAR}；以及 10:50 看涨价差的 Delta 在没有成交的情况下从 ${signedCount(SPREAD[0].net)} 股升到 ${signedCount(SPREAD[1].net)} 股`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Charm and vanna", "Charm 与 Vanna"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "charm", label: ["Charm", "Charm"] },
		{ id: "vanna", label: ["Vanna", "Vanna"] },
		{ id: "units", label: ["Units", "单位"] },
		{ id: "spread", label: ["The position", "持仓"] },
		{ id: "next", label: ["Next", "下一步"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
