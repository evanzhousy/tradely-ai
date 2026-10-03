import { gsap } from "gsap";
import { useId } from "react";
import { type Copy, pick } from "@/content/world";
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
import { textWidth } from "../walkthrough/text-measure";
import {
	DAYS,
	IV,
	MODEL_OUTSIDE,
	MONTHS,
	MOVE,
	outside,
	PAST,
	plusMinus,
	SPOT,
	STRADDLE,
	share,
} from "./expected-move-model";

/*
 * The expected move, as a film. It starts from a question, how far do ALFA's options
 * price it to move by Oct 18, and builds the answer as type: 35% a year, scaled by the
 * square root of 32 days, ±$10.36. A bell curve then shows what that range is (68% of
 * outcomes, under the model), the straddle's narrower bracket (the average move, 0.80
 * of it), the tails, and twelve past months that jumped past them.
 *
 *   open      0–4     "Expected move"
 *   question  4–9.5   IV 35% → ±$? by Oct 18
 *   scale     9.5–16  $100 × 35% = $35; × √(32 ÷ 365) = × 0.296; ±$10.36
 *   bell      16–22   the ±1 SD band grows to 68% of outcomes
 *   straddle  22–29   the straddle's bracket, $8.27; cut: 0.80 of one SD
 *   outside   29–44   the tails, 16% each side; twelve past months, 4 outside one SD and
 *                     May's 2.2×; cut: "A range is a scale, not a wall."
 *   next      44–46.5  Next: the volatility surface
 */

const END = 46.5;
const B_X = [68, 132] as const;
const B_TOP = 1.3;
const M_TOP = 2.4;
const LOW = SPOT - MOVE;
const HIGH = SPOT + MOVE;
const BE_LOW = SPOT - STRADDLE;
const BE_HIGH = SPOT + STRADDLE;
const pdf = (price: number) => Math.exp(-0.5 * ((price - SPOT) / MOVE) ** 2);
const ratio = STRADDLE / MOVE;
const MAY = 7;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height, narrow } = frame;
	const left = frame.margin;
	const right = width * 0.965;
	const top = height * (narrow ? 0.3 : 0.22);
	const bottom = height * 0.8;
	const xB = (price: number) =>
		left + ((price - B_X[0]) / (B_X[1] - B_X[0])) * (right - left);
	const yB = (density: number) => bottom - (density / B_TOP) * (bottom - top);
	/** The area under the bell between two prices. */
	const area = (from: number, to: number) => {
		const steps = 48;
		const points = Array.from({ length: steps + 1 }, (_, i) => {
			const price = from + ((to - from) * i) / steps;
			return `L${xB(price).toFixed(1)} ${yB(pdf(price)).toFixed(1)}`;
		}).join("");
		return `M${xB(from).toFixed(1)} ${yB(0)}${points}L${xB(to).toFixed(1)} ${yB(0)}Z`;
	};
	const bell = Array.from({ length: 129 }, (_, i) => {
		const price = B_X[0] + ((B_X[1] - B_X[0]) * i) / 128;
		return `${i ? "L" : "M"}${xB(price).toFixed(1)} ${yB(pdf(price)).toFixed(1)}`;
	}).join("");
	const slot = (right - left) / PAST.length;
	const yM = (multiple: number) =>
		bottom - (Math.min(multiple, M_TOP) / M_TOP) * (bottom - top);
	return {
		...frame,
		left,
		right,
		top,
		bottom,
		xB,
		yB,
		area,
		bell,
		slot,
		barX: (i: number) => left + slot * (i + 0.5),
		barWidth: Math.min(slot * 0.56, 34),
		yM,
		pair: narrow ? [0.27, 0.73] : [0.32, 0.68],
	};
}

const equations = [
	`$${SPOT} × ${IV}% = $${(SPOT * IV) / 100}`,
	`× √(${DAYS} ÷ 365) = × ${Math.sqrt(DAYS / 365).toFixed(3)}`,
	plusMinus(MOVE),
] as const;

const copy = {
	title: ["Expected move", "预期变动"],
	titleSub: ["how far the options price ALFA to go", "期权定价的变动幅度"],
	qTagIv: ["implied volatility", "隐含波动率"],
	qTagMove: [`by Oct 18, ${DAYS} days`, `到 10月18日，${DAYS} 天`],
	qLine: [
		`ALFA is $${SPOT}. How far do its options price it to move by Oct 18?`,
		`ALFA 为 $${SPOT}。它的期权定价了到 10月18日 多大的变动？`,
	],
	eYear: ["a year", "一年"],
	eTime: [
		`${DAYS} days: by the square root of time`,
		`${DAYS} 天：按时间的平方根`,
	],
	eResult: ["one SD to Oct 18", "到 10月18日 的一个标准差"],
	eNote: [
		`Not × ${DAYS}/365: that would give ${share(((SPOT * IV) / 100) * (DAYS / 365))}.`,
		`不是乘以 ${DAYS}/365：那样只有 ${share(((SPOT * IV) / 100) * (DAYS / 365))}。`,
	],
	bellHead: ["Under the model, 68% land inside.", "按模型，68% 落在区间内。"],
	bellHeadShort: ["68% land inside, in the model.", "按模型，68% 在区间内。"],
	bellAxis: ["ALFA on Oct 18, model", "10月18日 的 ALFA，模型"],
	straddleHead: [
		"The straddle prices the average move.",
		"跨式定价的是平均变动。",
	],
	straddleHeadShort: ["The straddle: the average move.", "跨式：平均变动。"],
	straddle: [`straddle ${share(STRADDLE)}`, `跨式 ${share(STRADDLE)}`],
	ratioWord: ["of one SD", "个标准差"],
	ratioSub: [
		`${share(STRADDLE)} ÷ ${share(MOVE)}. The straddle pays the distance from $${SPOT}, so it prices the average move. 68% is a different number: the share inside.`,
		`${share(STRADDLE)} ÷ ${share(MOVE)}。跨式支付与 $${SPOT} 的距离，所以它定价的是平均变动。68% 是另一个数：落在区间内的比例。`,
	],
	outsideHead: [
		"About a third of the time, it ends outside.",
		"约三分之一的时候，收在区间之外。",
	],
	outsideHeadShort: ["About a third end outside.", "约三分之一收在区间外。"],
	tail: [
		`${Math.round(MODEL_OUTSIDE[1] / 2)}%`,
		`${Math.round(MODEL_OUTSIDE[1] / 2)}%`,
	],
	monthsHead: [
		`${outside(1)} of 12 ended outside 1 SD.`,
		`12 个中 ${outside(1)} 个在 1 个标准差之外。`,
	],
	jumpHead: [
		`May's earnings jump: ${PAST[MAY]}×.`,
		`五月财报跳空：${PAST[MAY]} 倍。`,
	],
	monthsAxis: [
		"move ÷ implied 1 SD · 12 past expiries · illustrative",
		"变动 ÷ 隐含 1 个标准差 · 过去 12 个到期日 · 示意",
	],
	monthsAxisShort: [
		"move ÷ implied 1 SD, illustrative",
		"变动 ÷ 隐含 1σ，示意",
	],
	earnings: ["earnings", "财报"],
	claimBig: ["A range is a scale, not a wall.", "区间是一把尺子，不是一堵墙。"],
	claimSub: [
		"IV × √time sets one SD; the straddle prices the average move; jumps fatten the tails.",
		"IV × √时间 给出一个标准差；跨式定价平均变动；跳空让尾部更厚。",
	],
	nextBig: ["Next: the volatility surface", "下一课：波动率曲面"],
	nextSub: [
		"implied volatility across strikes and expiries",
		"不同行权价与到期日上的隐含波动率",
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
	/** Equation lines set as large as fits. */
	const fit = (text: string, size: number) =>
		Math.min(size, (room / textWidth(text, 1)) * 0.98);
	const rows = [
		{ tag: copy.eYear, y: H * 0.2, size: fit(equations[0], T.num), tone: "" },
		{ tag: copy.eTime, y: H * 0.4, size: fit(equations[1], T.num), tone: "" },
		{
			tag: copy.eResult,
			y: H * 0.58,
			size: fit(equations[2], T.big),
			tone: "wt-film-accent",
		},
	];
	const tailAt = 1.9 * MOVE;
	return (
		<>
			<Backdrop frame={L} />
			<defs>
				<clipPath id={`bell-${id}`}>
					<rect data-f="bell-clip" x={L.xB(SPOT)} y={0} width={0} height={H} />
				</clipPath>
			</defs>

			<g data-f="depth">
				<g data-f="world">
					{/* The bell: where ALFA might be on Oct 18, under the model. */}
					<g data-f="chart-bell">
						<path d={`M${L.left} ${L.yB(0)}H${L.right}`} className="wt-axis" />
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(copy.bellAxis)}
						</text>
						<path
							data-f="b-band"
							className="wt-band-neutral"
							d={L.area(SPOT, SPOT)}
						/>
						<path
							data-f="b-tail-low"
							className="wt-band-loss"
							d={L.area(B_X[0], LOW)}
						/>
						<path
							data-f="b-tail-high"
							className="wt-band-loss"
							d={L.area(HIGH, B_X[1])}
						/>
						<g clipPath={`url(#bell-${id})`}>
							<path className="wt-line-position" d={L.bell} />
						</g>
						<text
							data-f="b-center"
							x={L.xB(SPOT)}
							y={L.yB(0) + 18}
							textAnchor="middle"
							className="wt-small"
						>
							{`$${SPOT}`}
						</text>
						{[LOW, HIGH].map((price) => (
							<text
								key={price}
								data-f={`b-edge-${price < SPOT ? "low" : "high"}`}
								x={L.xB(price)}
								y={L.yB(0) + 18}
								textAnchor="middle"
								className="wt-small wt-accent"
							>
								{share(price)}
							</text>
						))}
						<Word
							name="b-inside"
							x={L.xB(SPOT)}
							y={L.yB(0.42)}
							size={T.num}
							className="wt-film-num wt-film-accent"
						>
							68%
						</Word>
						{[BE_LOW, BE_HIGH].map((price) => (
							<path
								key={price}
								data-f={`s-line-${price < SPOT ? "low" : "high"}`}
								d={`M${L.xB(price)} ${L.yB(0)}V${L.yB(1.12)}`}
								className="wt-film-tangent"
								strokeDasharray="4 3"
							/>
						))}
						<path
							data-f="s-bracket"
							d={`M${L.xB(BE_LOW)} ${L.yB(1.12)}H${L.xB(BE_HIGH)}`}
							className="wt-bracket"
						/>
						<text
							data-f="s-label"
							x={L.xB(SPOT)}
							y={L.yB(1.12) - 8}
							textAnchor="middle"
							className="wt-halo wt-marker-label wt-accent"
						>
							{t(copy.straddle)}
						</text>
						{[SPOT - tailAt, SPOT + tailAt].map((price) => (
							<text
								key={price}
								data-f={`b-tail-label-${price < SPOT ? "low" : "high"}`}
								x={L.xB(price)}
								y={L.yB(pdf(price) + 0.14)}
								textAnchor="middle"
								className="wt-halo wt-marker-label wt-loss"
							>
								{t(copy.tail)}
							</text>
						))}
					</g>

					{/* Twelve past expiries, each move against its implied one SD. */}
					<g data-f="chart-months">
						<path d={`M${L.left} ${L.yM(0)}H${L.right}`} className="wt-axis" />
						<text x={L.left} y={L.top - 12} className="wt-small">
							{t(narrow ? copy.monthsAxisShort : copy.monthsAxis)}
						</text>
						{PAST.map((multiple, i) => (
							<g key={MONTHS[i][0]}>
								<rect
									data-f={`m-bar-${i}`}
									className="wt-film-bar"
									data-tone={multiple > 1 ? "loss" : "neutral"}
									x={L.barX(i) - L.barWidth / 2}
									y={L.yM(0)}
									width={L.barWidth}
									height={0}
									rx={3}
								/>
								<text
									x={L.barX(i)}
									y={L.yM(0) + 16}
									textAnchor="middle"
									className="wt-small"
								>
									{narrow
										? locale === "zh"
											? MONTHS[i][1].replace("月", "")
											: MONTHS[i][0][0]
										: t(MONTHS[i])}
								</text>
							</g>
						))}
						{[1, 2].map((band) => (
							<g key={band} data-f={`m-line-${band}`}>
								<path
									d={`M${L.left} ${L.yM(band)}H${L.right}`}
									className="wt-line-reference"
								/>
								<text
									x={L.left - 6}
									y={L.yM(band) + 4}
									textAnchor="end"
									className="wt-small wt-accent"
								>
									{`${band}σ`}
								</text>
							</g>
						))}
						<text
							data-f="m-may"
							x={L.barX(MAY)}
							y={L.yM(PAST[MAY]) - 8}
							textAnchor="middle"
							className="wt-halo wt-marker-label wt-loss"
						>
							{`${t(copy.earnings)} ${PAST[MAY]}×`}
						</text>
					</g>
				</g>
			</g>

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				{(
					[
						[copy.qTagIv, `${IV}%`, ""],
						[copy.qTagMove, "±$?", "wt-film-accent"],
					] as const
				).map(([tag, num, tone], i) => (
					<g key={tag[0]}>
						<Word
							name={`q-tag-${i}`}
							x={W * L.pair[i]}
							y={H * 0.3}
							size={T.small}
							className="wt-film-tag"
						>
							{t(tag).toUpperCase()}
						</Word>
						<Word
							name={`q-num-${i}`}
							x={W * L.pair[i]}
							y={H * 0.3 + T.big * 0.95}
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
					y={H * 0.74}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			<g data-f="e">
				{rows.map((row, i) => (
					<g key={row.tag[0]}>
						<Word
							name={`e-tag-${i}`}
							x={W / 2}
							y={row.y}
							size={T.small}
							className="wt-film-tag"
						>
							{t(row.tag).toUpperCase()}
						</Word>
						<Word
							name={`e-num-${i}`}
							x={W / 2}
							y={row.y + row.size * 1.2}
							size={row.size}
							className={`wt-film-num ${row.tone}`}
						>
							{equations[i]}
						</Word>
					</g>
				))}
				<Lines
					name="e-note"
					text={t(copy.eNote)}
					x={W / 2}
					y={H * 0.92}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("b-head", copy.bellHead, copy.bellHeadShort)}
			{headline("s-head", copy.straddleHead, copy.straddleHeadShort)}
			<g data-f="r">
				<Word
					name="r-num"
					x={W / 2}
					y={H * 0.4 + T.big * 0.36}
					size={T.big}
					className="wt-film-num wt-film-accent"
				>
					{ratio.toFixed(2)}
				</Word>
				<Word
					name="r-word"
					x={W / 2}
					y={H * 0.4 + T.big * 0.36 + T.head * 1.9}
					size={T.head}
					className="wt-film-type wt-film-accent"
				>
					{t(copy.ratioWord)}
				</Word>
				<Lines
					name="r-sub"
					text={t(copy.ratioSub)}
					x={W / 2}
					y={H * 0.4 + T.big * 0.36 + T.head * 1.9 + T.body * 1.9}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			{headline("o-head", copy.outsideHead, copy.outsideHeadShort)}
			{headline("m-head", copy.monthsHead, copy.monthsHead)}
			{headline("j-head", copy.jumpHead, copy.jumpHead)}
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
	const { tl, one, kids, show, hide, pop, slam, rise, sink } = d;
	const flat = (name: string) =>
		kids(name).flatMap((el) => (el.tagName === "g" ? [...el.children] : [el]));
	const charts = { bell: one("chart-bell"), months: one("chart-months") };
	const band = one("b-band");

	gsap.set(charts.months, { opacity: 0 });
	d.hidden([
		one("b-tail-low"),
		one("b-tail-high"),
		one("b-center"),
		one("b-edge-low"),
		one("b-edge-high"),
		one("b-inside"),
		one("s-line-low"),
		one("s-line-high"),
		one("s-bracket"),
		one("s-label"),
		one("b-tail-label-low"),
		one("b-tail-label-high"),
		one("m-line-1"),
		one("m-line-2"),
		one("m-may"),
		...flat("q"),
		...flat("e"),
		...["b-head", "s-head", "o-head", "m-head", "j-head"].map((name) =>
			one(name),
		),
		...kids("r"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag-0"), 4.6);
	slam(one("q-num-0"), 4.8);
	show(one("q-tag-1"), 5.6);
	slam(one("q-num-1"), 5.8);
	show(one("q-line"), 6.8);

	// ——— scale: a year's move, scaled by the square root of time ———
	tl.addLabel("scale", 9.5);
	hide(flat("q"), 9.5);
	for (const i of [0, 1, 2]) {
		show(one(`e-tag-${i}`), 9.8 + i * 1.3);
		slam(one(`e-num-${i}`), 10.0 + i * 1.3);
	}
	show(one("e-note"), 13.6);

	// ——— bell: what the range covers ———
	tl.addLabel("bell", 16);
	hide(flat("e"), 16.0);
	show(one("b-head"), 16.2, "above");
	rise(16.3);
	tl.to(
		one("bell-clip"),
		{
			attr: { x: L.left - 4, width: L.right - L.left + 8 },
			duration: 1.1,
			ease: "power2.inOut",
		},
		16.9,
	);
	show(one("b-center"), 17.6, "above", 0.4);
	const spread = { half: 0 };
	const grow = () => {
		band.setAttribute("d", L.area(SPOT - spread.half, SPOT + spread.half));
	};
	tl.to(
		spread,
		{ half: MOVE, duration: 1.0, ease: "power2.out", onUpdate: grow },
		18.2,
	);
	show([one("b-edge-low"), one("b-edge-high")], 19.0, "above", 0.4);
	pop(one("b-inside"), 19.4);

	// ——— straddle: a narrower bracket ———
	tl.addLabel("straddle", 22);
	d.swap(one("b-head"), one("s-head"), 22.0);
	for (const [i, side] of (["low", "high"] as const).entries())
		tl.fromTo(
			one(`s-line-${side}`),
			{ opacity: 1, scaleY: 0, transformOrigin: "50% 100%" },
			{ scaleY: 1, duration: 0.6, ease: "power2.out" },
			22.6 + i * 0.15,
		);
	tl.fromTo(
		one("s-bracket"),
		{ opacity: 0, scaleX: 0, transformOrigin: "50% 50%" },
		{ opacity: 1, scaleX: 1, duration: 0.5, ease: "power2.out" },
		23.3,
	);
	show(one("s-label"), 23.6, "below", 0.4);
	// Cut: the ratio.
	hide(one("s-head"), 25.0);
	sink(25.0);
	slam(one("r-num"), 25.4);
	show(one("r-word"), 25.8);
	show(one("r-sub"), 26.3);

	// ——— outside: the tails, then real months ———
	tl.addLabel("outside", 29);
	hide(kids("r"), 29.0);
	tl.set(
		[
			one("s-line-low"),
			one("s-line-high"),
			one("s-bracket"),
			one("s-label"),
			one("b-inside"),
		],
		{ opacity: 0 },
		29.2,
	);
	show(one("o-head"), 29.3, "above");
	rise(29.4);
	tl.to(
		[one("b-tail-low"), one("b-tail-high")],
		{ opacity: 1, duration: 0.6 },
		30.1,
	);
	show([one("b-tail-label-low"), one("b-tail-label-high")], 30.5, "below", 0.4);
	hide(one("o-head"), 32.6);
	sink(32.6);
	tl.set(charts.bell, { opacity: 0 }, 33.0);
	tl.set(charts.months, { opacity: 1 }, 33.0);
	rise(33.1);
	PAST.forEach((multiple, i) => {
		tl.fromTo(
			one(`m-bar-${i}`),
			{ attr: { y: L.yM(0), height: 0 } },
			{
				attr: { y: L.yM(multiple), height: L.yM(0) - L.yM(multiple) },
				duration: 0.45,
				ease: "back.out(1.4)",
			},
			33.7 + i * 0.08,
		);
	});
	show(one("m-line-1"), 34.9, "right", 0.4);
	show(one("m-head"), 35.2, "above");
	show(one("m-line-2"), 37.0, "right", 0.4);
	show(one("m-may"), 37.4, "below", 0.4);
	d.swap(one("m-head"), one("j-head"), 37.6);
	// Cut: the claim.
	hide(one("j-head"), 40.6);
	sink(40.6);
	tl.fromTo(
		one("c-big"),
		{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)" },
		41.0,
	);
	show(one("c-sub"), 41.5);

	// ——— next ———
	tl.addLabel("next", 44);
	hide(kids("claim"), 44.0);
	d.close(44.0);
	return tl;
}

export const expectedMoveFilm: Film = {
	id: "expected-move",
	label: [
		"The expected move, as a short film: 35% implied volatility scaled by the square root of 32 days to a one-standard-deviation move of ±$10.36; the range on a bell curve holding 68% of outcomes under the model; the Oct 18 100 straddle's narrower $8.27 bracket, 0.80 of one SD; and the tails, against twelve past months",
		"预期变动短片：35% 的隐含波动率按 32 天的平方根缩放为 ±$10.36 的一个标准差；钟形曲线上按模型容纳 68% 结果的区间；10月18日 100 跨式更窄的 $8.27 区间，为一个标准差的 0.80；以及尾部与过去 12 个月的对照",
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Expected move", "预期变动"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "scale", label: ["√time", "√时间"] },
		{ id: "bell", label: ["68% inside", "68% 在内"] },
		{ id: "straddle", label: ["The straddle", "跨式"] },
		{ id: "outside", label: ["Outside", "区间之外"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
