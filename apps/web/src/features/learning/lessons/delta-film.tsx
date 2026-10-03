import { gsap } from "gsap";
import { useId } from "react";
import { type Copy, pick, signedCount, signedUsd } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import type { Film, FilmContext } from "../walkthrough/film";
import { textWidth } from "../walkthrough/text-measure";
import {
	CALL_DELTA,
	curve,
	DAYS,
	fixed2,
	holders,
	MOVE,
	moveDollars,
	PUT_DELTA,
	perContract,
	positionDelta,
	price,
	SPOT,
	signedPrice,
	stock,
	valueAt,
	X_RANGE,
} from "./delta-model";

/*
 * Delta, as a film. Subject: the marker on the option's value curve; it keeps its shape
 * from the first frame to the last. Secondary: the tangent and the numbers it produces.
 * Background: the axes, which only ever fade. Each shot has one job, every mark moves for
 * a reason, and nothing moves at the same moment as something else: the marker leads,
 * the tangent follows, the labels last. No glow, no synchronized fades, no camera move
 * without a thing to look at.
 *
 *   price     0–7     the marker lands on today's price; the curve grows out of it
 *   slope     7–16.5  push in; the tangent, a $1 step, the $0.52 rise, the number "delta"
 *   put       16.5–23 pull out; the curve folds into the put, the slope turns over
 *   position  23–34   the chart quiets; the delta chip builds two positions in a ledger
 *   limits    34–44   the marker rides the curve, a ghost rides the line; they part
 */

const Y_RANGE = [-2, 16] as const;
const PAD = { left: 46, right: 14, top: 18, bottom: 40 };

const V0 = valueAt("call", SPOT);
const P0 = valueAt("put", SPOT);
const [you, ben] = holders;
const call = curve("call");
const put = curve("put");
const UP = 10;
const DOWN = -10;
const CHIP_H = 26;

function layout(width: number) {
	const height = width < 520 ? 320 : 380;
	const left = PAD.left;
	const right = width - PAD.right;
	const top = PAD.top;
	const bottom = height - PAD.bottom;
	const x = (value: number) =>
		left + ((value - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0])) * (right - left);
	const y = (value: number) =>
		bottom -
		((value - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0])) * (bottom - top);
	const path = (points: readonly (readonly [number, number])[]) =>
		points
			.map(
				([px, py], i) =>
					`${i ? "L" : "M"}${x(px).toFixed(1)} ${y(py).toFixed(1)}`,
			)
			.join("");
	// The ledger: three chips and two operators per row, sized to the plot.
	const opWidth = Math.max(textWidth("× −10", 13), textWidth("× 100", 13)) + 14;
	const gap = 8;
	const chip = Math.max(
		48,
		Math.min(84, (right - left - 2 * opWidth - 4 * gap) / 3),
	);
	const rowWidth = 3 * chip + 2 * opWidth + 4 * gap;
	const rowLeft = left + (right - left - rowWidth) / 2;
	const slot = (i: number) =>
		rowLeft + i * (chip + opWidth + 2 * gap) + chip / 2;
	const op = (i: number) =>
		rowLeft + chip + gap + i * (chip + opWidth + 2 * gap) + opWidth / 2;
	const row1 = top + (bottom - top) * 0.38;
	const row2 = top + (bottom - top) * 0.74;
	return {
		width,
		height,
		left,
		right,
		top,
		bottom,
		x,
		y,
		path,
		chip,
		slot,
		op,
		row1,
		row2,
	};
}

const copy = {
	title1: [
		`ALFA is at ${stock(SPOT)}. The Oct 18 100 call is worth ${price(V0)} a share.`,
		`ALFA 现价 ${stock(SPOT)}。10月18日 100 看涨每股值 ${price(V0)}。`,
	],
	sub1: [
		`Model value today, ${DAYS} days to expiry.`,
		`今天的模型价值，距到期 ${DAYS} 天。`,
	],
	title2: [
		"Delta is the slope of that curve at today's price.",
		"Delta 是这条曲线在今天价格处的斜率。",
	],
	sub2: [
		`+$1 in ALFA is about ${signedPrice(CALL_DELTA)} in the call.`,
		`ALFA 涨 $1，看涨约变动 ${signedPrice(CALL_DELTA)}。`,
	],
	title3: ["The put slopes the other way.", "看跌期权的斜率方向相反。"],
	sub3: [
		`Delta ${fixed2(PUT_DELTA)}: a $1 rise takes ${price(Math.abs(PUT_DELTA))} off it.`,
		`Delta ${fixed2(PUT_DELTA)}：ALFA 涨 $1，它约减少 ${price(Math.abs(PUT_DELTA))}。`,
	],
	title4: ["Keep the sign and the multiplier attached.", "保留符号与乘数。"],
	sub4: [
		"Per share → per contract → per position.",
		"每股 → 每张 → 每个持仓。",
	],
	sub4b: [
		`A $${MOVE.toFixed(2)} rise in ALFA: about ${signedUsd(moveDollars(you.contracts), 0)} for you, ${signedUsd(moveDollars(ben.contracts), 0)} for Ben.`,
		`ALFA 上涨 $${MOVE.toFixed(2)}：你约 ${signedUsd(moveDollars(you.contracts), 0)}，Ben 约 ${signedUsd(moveDollars(ben.contracts), 0)}。`,
	],
	title5: [
		"One slope can't describe every move.",
		"一个斜率不能描述所有变动。",
	],
	sub5: [
		"Delta describes small moves. For big ones, reprice.",
		"Delta 描述的是小幅变动；大幅变动要重新定价。",
	],
	title6: [
		"That bend is gamma, the next lesson.",
		"这种弯曲就是 Gamma，下一课。",
	],
	sub6: ["Try it yourself in the playground.", "到探索区自己试一试。"],
	axis: ["ALFA price today", "ALFA 今天的价格"],
	callLabel: ["call value, model", "看涨价值（模型）"],
	putLabel: ["put value, model", "看跌价值（模型）"],
	/** On a phone the put's label must fit over the flat end of its curve. */
	putShort: ["put, model", "看跌（模型）"],
	delta: ["delta", "Delta"],
	you: [
		`${pick(you.name, "en")} · ${signedCount(you.contracts)} contracts`,
		`${pick(you.name, "zh")} · ${signedCount(you.contracts)} 张`,
	],
	ben: [
		`${pick(ben.name, "en")} · ${signedCount(ben.contracts)} contracts`,
		`${pick(ben.name, "zh")} · ${signedCount(ben.contracts)} 张`,
	],
	equivalents: ["share-equivalents", "股票等价"],
	model: ["model", "模型"],
	deltaAlone: ["delta alone", "仅用 Delta"],
	missed: ["missed by", "相差"],
	below: ["no option is worth less than zero", "期权不可能为负"],
	/** On a phone the band's label shares its row with the −$10 labels. */
	belowShort: ["can't go below zero", "不会低于零"],
} as const satisfies Record<string, Copy>;

const titles = [
	copy.title1,
	copy.title2,
	copy.title3,
	copy.title4,
	copy.title5,
	copy.title6,
] as const;
const subs = [
	copy.sub1,
	copy.sub2,
	copy.sub3,
	copy.sub4,
	copy.sub4b,
	copy.sub5,
	copy.sub6,
] as const;
/** Each caption step: which title and which line under it. A title that stays put stays put. */
const steps = [
	{ title: 0, sub: 0 },
	{ title: 1, sub: 1 },
	{ title: 2, sub: 2 },
	{ title: 3, sub: 3 },
	{ title: 3, sub: 4 },
	{ title: 4, sub: 5 },
	{ title: 5, sub: 6 },
] as const;

function Head({ locale }: { locale: Locale }) {
	const t = (value: Copy) => pick(value, locale);
	return (
		<>
			<div className="wt-film-titles">
				{titles.map((title, i) => (
					<p key={title[0]} className="wt-film-title" data-f={`title-${i}`}>
						{t(title)}
					</p>
				))}
			</div>
			<div className="wt-film-subs">
				{subs.map((sub, i) => (
					<p key={sub[0]} className="wt-film-sub" data-f={`sub-${i}`}>
						{t(sub)}
					</p>
				))}
			</div>
		</>
	);
}

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
	const id = useId().replace(/:/g, "");
	const mx = L.x(SPOT);
	const my = L.y(V0);
	const chipWidth = Math.max(textWidth("−0.48", 13) + 16, 44);
	const rows = [
		{ id: "you", y: L.row1, label: copy.you, contracts: you.contracts },
		{ id: "ben", y: L.row2, label: copy.ben, contracts: ben.contracts },
	] as const;
	return (
		<>
			<defs>
				<pattern
					id={`hatch-${id}`}
					width="6"
					height="6"
					patternUnits="userSpaceOnUse"
					patternTransform="rotate(45)"
				>
					<rect width="6" height="6" className="wt-hatch-bg" />
					<line x1="0" y1="0" x2="0" y2="6" className="wt-hatch-line" />
				</pattern>
				<clipPath id={`left-${id}`}>
					<rect data-f="clip-left" x={mx} y={0} width={0} height={L.height} />
				</clipPath>
				<clipPath id={`right-${id}`}>
					<rect data-f="clip-right" x={mx} y={0} width={0} height={L.height} />
				</clipPath>
			</defs>
			<g data-f="axes">
				{[0, 4, 8, 12, 16].map((tick) => (
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
							{`$${tick}`}
						</text>
					</g>
				))}
				{[90, 95, 100, 105, 110].map((tick) => (
					<text
						key={tick}
						data-f="x-tick"
						x={L.x(tick)}
						y={L.bottom + 18}
						textAnchor="middle"
						className="wt-small"
					>
						{`$${tick}`}
					</text>
				))}
				<text
					x={L.right}
					y={L.bottom + 32}
					textAnchor="end"
					className="wt-small"
				>
					{t(copy.axis)}
				</text>
			</g>
			<g data-f="chart">
				<rect
					data-f="below"
					x={L.left}
					y={L.y(0)}
					width={L.right - L.left}
					height={L.y(Y_RANGE[0]) - L.y(0)}
					fill={`url(#hatch-${id})`}
				/>
				<text
					data-f="below-label"
					x={L.right - 8}
					y={L.y(-1) + 4}
					textAnchor="end"
					className="wt-small wt-halo"
				>
					{t(width < 520 ? copy.belowShort : copy.below)}
				</text>
				<g clipPath={`url(#left-${id})`}>
					<path
						data-f="curve-a"
						className="wt-line-position"
						strokeDasharray="6 5"
						d={L.path(call)}
					/>
				</g>
				<g clipPath={`url(#right-${id})`}>
					<path
						data-f="curve-b"
						className="wt-line-position"
						strokeDasharray="6 5"
						d={L.path(call)}
					/>
				</g>
				<text
					data-f="curve-label-call"
					x={L.right - 4}
					y={L.y(call[call.length - 1][1]) - 8}
					textAnchor="end"
					className="wt-small wt-halo wt-label-position"
				>
					{t(copy.callLabel)}
				</text>
				<text
					data-f="curve-label-put"
					x={L.right - 4}
					y={L.y(put[put.length - 1][1]) - 16}
					textAnchor="end"
					className="wt-small wt-halo wt-label-position"
				>
					{t(width < 520 ? copy.putShort : copy.putLabel)}
				</text>
				<line
					data-f="tangent"
					className="wt-film-tangent"
					x1={mx}
					y1={my}
					x2={mx}
					y2={my}
				/>
				<g data-f="step">
					<line
						data-f="step-line"
						className="wt-film-step"
						x1={mx}
						y1={my}
						x2={L.x(SPOT + 1)}
						y2={my}
					/>
					<text
						data-f="step-label"
						x={(mx + L.x(SPOT + 1)) / 2}
						y={my + 16}
						textAnchor="middle"
						className="wt-small wt-halo wt-accent"
					>
						+$1
					</text>
				</g>
				<g data-f="riser">
					<line
						data-f="riser-line"
						className="wt-film-riser"
						x1={L.x(SPOT + 1)}
						y1={my}
						x2={L.x(SPOT + 1)}
						y2={my}
					/>
					<text
						data-f="riser-label"
						x={L.x(SPOT + 1) + 8}
						y={L.y(V0 + CALL_DELTA) + 14}
						className="wt-halo wt-accent wt-marker-label"
					>
						{signedPrice(CALL_DELTA)}
					</text>
				</g>
				<g data-f="ghost">
					<circle r={6} className="wt-film-ghost" />
				</g>
				<text data-f="ghost-label" className="wt-small wt-halo" />
				<line data-f="gap" className="wt-film-gap" />
				<text
					data-f="gap-label"
					className="wt-small wt-halo wt-loss wt-marker-label"
				/>
				<g data-f="marker">
					<circle data-f="ripple" r={6} className="wt-film-ripple" />
					<circle
						data-f="dot"
						r={6}
						className="wt-chip"
						stroke="var(--foreground)"
						strokeWidth={1.5}
					/>
				</g>
				<text
					data-f="marker-label-call"
					x={mx}
					y={my - 14}
					textAnchor="middle"
					className="wt-halo wt-accent wt-marker-label"
				>
					{price(V0)}
				</text>
				<text
					data-f="marker-label-put"
					x={mx}
					y={L.y(P0) - 14}
					textAnchor="middle"
					className="wt-halo wt-accent wt-marker-label"
				>
					{price(P0)}
				</text>
				<text data-f="move-label" className="wt-halo wt-marker-label" />
			</g>
			<g data-f="chip">
				<rect
					className="wt-chip"
					rx={7}
					x={-chipWidth / 2}
					y={-11}
					width={chipWidth}
					height={22}
				/>
				<text
					data-f="chip-call"
					y={4}
					textAnchor="middle"
					className="wt-chip-text"
				>
					{fixed2(CALL_DELTA)}
				</text>
				<text
					data-f="chip-put"
					y={4}
					textAnchor="middle"
					className="wt-chip-text"
				>
					{fixed2(PUT_DELTA)}
				</text>
			</g>
			<text data-f="delta-word" className="wt-accent">
				{t(copy.delta)}
			</text>
			<g data-f="ledger">
				{rows.map((row, r) => (
					<g key={row.id} data-f={`row-${row.id}`}>
						<text
							data-f={`row-label-${row.id}`}
							x={L.slot(0) - L.chip / 2}
							y={row.y - CHIP_H / 2 - 10}
							className="wt-small"
						>
							{t(row.label)}
						</text>
						{r === 1 ? (
							<g data-f="chip-2">
								<rect
									className="wt-chip"
									rx={8}
									x={-L.chip / 2}
									y={-CHIP_H / 2}
									width={L.chip}
									height={CHIP_H}
								/>
								<text
									y={5}
									textAnchor="middle"
									className="wt-chip-text wt-film-big"
								>
									{fixed2(CALL_DELTA)}
								</text>
							</g>
						) : null}
						<text
							data-f={`op-100-${row.id}`}
							x={L.op(0)}
							y={row.y + 5}
							textAnchor="middle"
							className="wt-muted"
						>
							× 100
						</text>
						<g data-f={`per-${row.id}`}>
							<rect
								className="wt-panel-shape"
								rx={8}
								x={L.slot(1) - L.chip / 2}
								y={row.y - CHIP_H / 2}
								width={L.chip}
								height={CHIP_H}
							/>
							<text
								x={L.slot(1)}
								y={row.y + 5}
								textAnchor="middle"
								className="wt-film-big"
							>
								{perContract}
							</text>
						</g>
						<text
							data-f={`op-held-${row.id}`}
							x={L.op(1)}
							y={row.y + 5}
							textAnchor="middle"
							className="wt-muted"
						>
							{`× ${signedCount(row.contracts)}`}
						</text>
						<g data-f={`position-${row.id}`}>
							<rect
								className="wt-focus-shape"
								rx={8}
								x={L.slot(2) - L.chip / 2}
								y={row.y - CHIP_H / 2}
								width={L.chip}
								height={CHIP_H}
							/>
							<text
								data-f={`position-value-${row.id}`}
								x={L.slot(2)}
								y={row.y + 5}
								textAnchor="middle"
								className={
									row.contracts < 0
										? "wt-loss wt-film-big"
										: "wt-gain wt-film-big"
								}
							>
								{signedCount(positionDelta(row.contracts))}
							</text>
						</g>
						<text
							data-f={`equiv-${row.id}`}
							x={L.slot(2) + L.chip / 2}
							y={row.y + CHIP_H / 2 + 14}
							textAnchor="end"
							className="wt-small"
						>
							{t(copy.equivalents)}
						</text>
					</g>
				))}
			</g>
		</>
	);
}

function build({ stage, svg, width, height, locale }: FilmContext) {
	const t = (value: Copy) => pick(value, locale);
	const L = layout(width);
	const q = gsap.utils.selector(stage);
	const one = <T extends Element = SVGElement>(name: string) =>
		q<T>(`[data-f="${name}"]`)[0];
	const mx = L.x(SPOT);
	const my = L.y(V0);
	const narrow = width < 520;
	const zoom = narrow ? 1.6 : 2;
	const camera = (
		scale: number,
		fx: number,
		fy: number,
		ax: number,
		ay: number,
	) => {
		const vw = width / scale;
		const vh = height / scale;
		const vx = Math.max(0, Math.min(width - vw, fx - vw * ax));
		const vy = Math.max(0, Math.min(height - vh, fy - vh * ay));
		return `${vx.toFixed(1)} ${vy.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`;
	};
	const home = `0 0 ${width} ${height}`;
	const titleEls = q<HTMLElement>(".wt-film-title");
	const subEls = q<HTMLElement>(".wt-film-sub");
	const marker = one("marker");
	const ghost = one("ghost");
	const chip = one("chip");
	const chip2 = one("chip-2");
	const deltaWord = one<SVGTextElement>("delta-word");
	const moveLabel = one<SVGTextElement>("move-label");
	const ghostLabel = one<SVGTextElement>("ghost-label");
	const gap = one<SVGLineElement>("gap");
	const gapLabel = one<SVGTextElement>("gap-label");
	const tangentLine = one<SVGLineElement>("tangent");
	const callTangent = (spot: number) => V0 + CALL_DELTA * (spot - SPOT);
	const putTangent = (spot: number) => P0 + PUT_DELTA * (spot - SPOT);
	const chipWidth = Number(
		chip.querySelector("rect")?.getAttribute("width") ?? 44,
	);
	const riserX = L.x(SPOT + 1);
	const riserTop = L.y(V0 + CALL_DELTA);
	// The chip rests below the tangent, right of the rise it names: the curve stays above
	// the line, so that corner is the one place clear of both.
	const chipHome = { x: riserX + 8 + chipWidth / 2, y: riserTop + 40 };
	/** The word "delta" sits to the right of whichever chip it names. */
	const wordBeside = (at: { x: number; y: number }) => ({
		x: at.x + chipWidth / 2 + 8,
		y: at.y + 4,
	});
	const wordAt = wordBeside(chipHome);

	// Everything at rest: hidden until its shot needs it.
	gsap.set([...titleEls, ...subEls], { opacity: 0, y: 8 });
	gsap.set([titleEls[0], subEls[0]], { opacity: 1, y: 0 });
	gsap.set(one("axes"), { opacity: 0 });
	gsap.set(q("[data-f='x-tick']"), { opacity: 0 });
	gsap.set(marker, { x: mx, y: my - 90, opacity: 0 });
	gsap.set(one("dot"), { transformOrigin: "50% 100%" });
	gsap.set(one("ripple"), { opacity: 0, attr: { r: 6 } });
	gsap.set(
		[
			one("marker-label-call"),
			one("marker-label-put"),
			one("curve-label-call"),
			one("curve-label-put"),
			one("tangent"),
			one("step"),
			one("riser"),
			one("below"),
			one("below-label"),
			ghost,
			ghostLabel,
			gap,
			gapLabel,
			moveLabel,
			deltaWord,
			one("chip-put"),
			one("ledger"),
		],
		{ opacity: 0 },
	);
	gsap.set(one("step-line"), { attr: { x2: mx } });
	gsap.set(chip, {
		x: chipHome.x,
		y: chipHome.y,
		opacity: 0,
		transformOrigin: "50% 50%",
	});
	gsap.set(deltaWord, {
		attr: { x: wordAt.x, y: wordAt.y },
	});
	gsap.set(ghost, { x: mx, y: my });
	gsap.set(chip2, {
		x: L.slot(0),
		y: L.row1,
		opacity: 0,
		transformOrigin: "50% 50%",
	});
	for (const row of ["you", "ben"]) {
		gsap.set(
			[
				one(`row-label-${row}`),
				one(`op-100-${row}`),
				one(`per-${row}`),
				one(`op-held-${row}`),
				one(`position-${row}`),
				one(`equiv-${row}`),
			],
			{ opacity: 0 },
		);
		gsap.set([one(`per-${row}`), one(`position-${row}`)], {
			transformOrigin: "50% 50%",
		});
	}

	const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
	const out = { opacity: 0, y: -8, duration: 0.35, ease: "power2.in" };
	const enter = { opacity: 1, y: 0, duration: 0.5 };
	let shownTitle = 0;
	let shownSub = 0;
	const caption = (step: number, at: number) => {
		const { title, sub } = steps[step];
		if (title !== shownTitle) {
			tl.to(titleEls[shownTitle], out, at);
			tl.fromTo(titleEls[title], { opacity: 0, y: 8 }, enter, at + 0.25);
			shownTitle = title;
		}
		tl.to(subEls[shownSub], out, at);
		tl.fromTo(subEls[sub], { opacity: 0, y: 8 }, enter, at + 0.25);
		shownSub = sub;
	};

	// ——— Shot 1: a price and a curve ———
	tl.addLabel("price", 0);
	tl.to(one("axes"), { opacity: 1, duration: 0.7 }, 0);
	tl.to(
		q("[data-f='x-tick']"),
		{ opacity: 1, duration: 0.4, stagger: 0.06 },
		0.3,
	);
	// The marker drops onto today's price, lands with a squash and settles.
	tl.to(marker, { opacity: 1, duration: 0.2 }, 0.9);
	tl.to(marker, { y: my, duration: 0.55, ease: "power2.in" }, 0.9);
	tl.to(
		one("dot"),
		{ scaleY: 0.72, scaleX: 1.2, duration: 0.1, ease: "power1.out" },
		1.45,
	);
	tl.to(
		one("dot"),
		{ scaleY: 1, scaleX: 1, duration: 0.7, ease: "elastic.out(1, 0.45)" },
		1.55,
	);
	tl.fromTo(
		one("ripple"),
		{ opacity: 0.6, attr: { r: 6 } },
		{ opacity: 0, attr: { r: 26 }, duration: 0.7, ease: "power2.out" },
		1.5,
	);
	// The curve grows out of the marker in both directions.
	tl.to(
		one("clip-left"),
		{
			attr: { x: L.left - 4, width: mx - L.left + 4 },
			duration: 1.3,
			ease: "power2.inOut",
		},
		1.9,
	);
	tl.to(
		one("clip-right"),
		{ attr: { width: L.right - mx + 4 }, duration: 1.3, ease: "power2.inOut" },
		1.9,
	);
	tl.fromTo(
		one("marker-label-call"),
		{ opacity: 0, attr: { y: my - 4 } },
		{ opacity: 1, attr: { y: my - 14 }, duration: 0.5 },
		2.3,
	);
	tl.to(one("curve-label-call"), { opacity: 1, duration: 0.5 }, 3.1);

	// ——— Shot 2: push in to the slope ———
	tl.addLabel("slope", 7);
	caption(1, 7.1);
	tl.to(one("curve-label-call"), { opacity: 0, duration: 0.4 }, 7);
	tl.to(
		svg,
		{
			attr: { viewBox: camera(zoom, mx, my, 0.3, narrow ? 0.42 : 0.55) },
			duration: 1.4,
			ease: "power2.inOut",
		},
		7,
	);
	tl.to(tangentLine, { opacity: 1, duration: 0.2 }, 8.0);
	tl.to(
		tangentLine,
		{
			attr: {
				x1: L.x(X_RANGE[0]),
				y1: L.y(callTangent(X_RANGE[0])),
				x2: L.x(X_RANGE[1]),
				y2: L.y(callTangent(X_RANGE[1])),
			},
			duration: 1.1,
			ease: "power2.inOut",
		},
		8.0,
	);
	tl.to(one("step"), { opacity: 1, duration: 0.2 }, 9.4);
	tl.to(
		one("step-line"),
		{ attr: { x2: riserX }, duration: 0.5, ease: "power2.out" },
		9.4,
	);
	tl.to(one("riser"), { opacity: 1, duration: 0.2 }, 10.1);
	tl.to(
		one("riser-line"),
		{ attr: { y2: riserTop }, duration: 0.6, ease: "back.out(1.6)" },
		10.1,
	);
	tl.fromTo(
		chip,
		{ opacity: 0, scale: 0.6 },
		{ opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
		11.4,
	);
	tl.fromTo(
		deltaWord,
		{ opacity: 0, attr: { x: wordAt.x - 8, y: wordAt.y } },
		{ opacity: 1, attr: { x: wordAt.x, y: wordAt.y }, duration: 0.5 },
		11.9,
	);

	// ——— Shot 3: the put ———
	tl.addLabel("put", 16.5);
	caption(2, 16.6);
	tl.to(
		svg,
		{ attr: { viewBox: home }, duration: 1.2, ease: "power2.inOut" },
		16.5,
	);
	tl.to([one("step"), one("riser")], { opacity: 0, duration: 0.3 }, 16.5);
	tl.to(
		[one("curve-a"), one("curve-b")],
		{ attr: { d: L.path(put) }, duration: 1.4, ease: "power2.inOut" },
		17.0,
	);
	tl.to(marker, { y: L.y(P0), duration: 1.4, ease: "power2.inOut" }, 17.0);
	tl.to(
		tangentLine,
		{
			attr: {
				y1: L.y(putTangent(X_RANGE[0])),
				y2: L.y(putTangent(X_RANGE[1])),
			},
			duration: 1.4,
			ease: "power2.inOut",
		},
		17.15,
	);
	tl.to(one("marker-label-call"), { opacity: 0, duration: 0.3 }, 17.0);
	// The put's curve runs down through the chip's corner; the clear corner is now below left.
	const putChip = { x: mx - 36, y: L.y(P0) + 44 };
	tl.to(
		chip,
		{ x: putChip.x, y: putChip.y, duration: 1.4, ease: "power2.inOut" },
		17.0,
	);
	tl.to(
		deltaWord,
		{ attr: wordBeside(putChip), duration: 1.4, ease: "power2.inOut" },
		17.0,
	);
	tl.to(one("marker-label-put"), { opacity: 1, duration: 0.4 }, 18.3);
	tl.to(one("curve-label-put"), { opacity: 1, duration: 0.4 }, 18.3);
	tl.to(one("chip-call"), { opacity: 0, duration: 0.25 }, 18.9);
	tl.to(one("chip-put"), { opacity: 1, duration: 0.25 }, 19.0);
	tl.fromTo(
		chip,
		{ scale: 0.85 },
		{ scale: 1, duration: 0.5, ease: "back.out(2)" },
		18.9,
	);

	// ——— Shot 4: from a share to a position ———
	tl.addLabel("position", 23);
	caption(3, 23.1);
	// Back to the call under the quiet; the ledger is about the call.
	tl.to(
		[one("curve-a"), one("curve-b")],
		{ attr: { d: L.path(call) }, duration: 0.8 },
		23,
	);
	tl.to(marker, { y: my, duration: 0.8 }, 23);
	tl.to(
		tangentLine,
		{
			attr: {
				y1: L.y(callTangent(X_RANGE[0])),
				y2: L.y(callTangent(X_RANGE[1])),
			},
			duration: 0.8,
		},
		23,
	);
	tl.to(
		[one("marker-label-put"), one("curve-label-put")],
		{ opacity: 0, duration: 0.3 },
		23,
	);
	tl.to(one("chip-put"), { opacity: 0, duration: 0.25 }, 23.2);
	tl.to(one("chip-call"), { opacity: 1, duration: 0.25 }, 23.3);
	tl.to(one("chart"), { opacity: 0.12, duration: 0.8 }, 23.2);
	tl.to(deltaWord, { opacity: 0, duration: 0.3 }, 23.4);
	tl.to(one("ledger"), { opacity: 1, duration: 0.3 }, 23.6);
	tl.to(
		chip,
		{
			x: L.slot(0),
			y: L.row1,
			scale: CHIP_H / 22,
			duration: 1.0,
			ease: "power2.inOut",
		},
		23.8,
	);
	tl.to(one("row-label-you"), { opacity: 1, duration: 0.4 }, 24.6);
	// Each operator slides in and bumps the number it makes into place.
	const chain = (row: "you" | "ben", at: number) => {
		const value = one<SVGTextElement>(`position-value-${row}`);
		const target = positionDelta(row === "you" ? you.contracts : ben.contracts);
		const counter = { value: 0 };
		tl.fromTo(
			one(`op-100-${row}`),
			{ opacity: 0, x: 24 },
			{ opacity: 1, x: 0, duration: 0.45, ease: "back.out(1.4)" },
			at,
		);
		tl.fromTo(
			one(`per-${row}`),
			{ opacity: 0, scale: 0.6 },
			{ opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
			at + 0.4,
		);
		tl.fromTo(
			one(`op-held-${row}`),
			{ opacity: 0, x: 24 },
			{ opacity: 1, x: 0, duration: 0.45, ease: "back.out(1.4)" },
			at + 1.0,
		);
		tl.fromTo(
			one(`position-${row}`),
			{ opacity: 0, scale: 0.6 },
			{ opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
			at + 1.4,
		);
		tl.to(
			counter,
			{
				value: target,
				duration: 0.7,
				ease: "power2.out",
				onUpdate: () => {
					value.textContent = signedCount(Math.round(counter.value));
				},
			},
			at + 1.4,
		);
		tl.to(one(`equiv-${row}`), { opacity: 1, duration: 0.4 }, at + 2.1);
	};
	chain("you", 25.0);
	tl.to(one("row-label-ben"), { opacity: 1, duration: 0.4 }, 28.0);
	tl.fromTo(
		chip2,
		{ opacity: 0, y: L.row1 },
		{ opacity: 1, y: L.row2, duration: 0.6, ease: "power2.inOut" },
		28.0,
	);
	chain("ben", 28.6);
	caption(4, 31.2);
	tl.to(one("ledger"), { opacity: 0, duration: 0.7, ease: "power2.in" }, 33.0);
	tl.to(chip, { opacity: 0, duration: 0.4 }, 33.0);
	tl.to(one("chart"), { opacity: 1, duration: 0.8 }, 33.3);

	// ——— Shot 5: where the slope lies ———
	tl.addLabel("limits", 34);
	caption(5, 34.1);
	tl.to(ghost, { opacity: 1, duration: 0.3 }, 34.2);
	const slide = { spot: SPOT };
	const place = () => {
		const spot = slide.spot;
		const repriced = valueAt("call", spot);
		const estimate = callTangent(spot);
		const px = L.x(spot);
		const py = L.y(repriced);
		const gy = L.y(estimate);
		const right = spot >= SPOT;
		const lx = right ? px - 12 : px + 12;
		const anchor = right ? "end" : "start";
		gsap.set(marker, { x: px, y: py });
		gsap.set(ghost, { x: px, y: gy });
		moveLabel.setAttribute("x", String(lx));
		moveLabel.setAttribute("y", String(py - 10));
		moveLabel.setAttribute("text-anchor", anchor);
		moveLabel.textContent = `${t(copy.model)} ${signedPrice(repriced - V0)}`;
		moveLabel.setAttribute(
			"class",
			`wt-halo wt-marker-label ${repriced >= V0 ? "wt-gain" : "wt-loss"}`,
		);
		ghostLabel.setAttribute("x", String(lx));
		ghostLabel.setAttribute("y", String(gy + 16));
		ghostLabel.setAttribute("text-anchor", anchor);
		ghostLabel.textContent = `${t(copy.deltaAlone)} ${signedPrice(estimate - V0)}`;
		gap.setAttribute("x1", String(px));
		gap.setAttribute("x2", String(px));
		gap.setAttribute("y1", String(Math.min(py, gy) + 8));
		gap.setAttribute("y2", String(Math.max(py, gy) - 8));
		gapLabel.setAttribute("x", String(lx));
		gapLabel.setAttribute("y", String((py + gy) / 2 + 4));
		gapLabel.setAttribute("text-anchor", anchor);
		gapLabel.textContent = `${t(copy.missed)} ${price(Math.abs(repriced - estimate))}`;
	};
	place();
	tl.to(
		slide,
		{ spot: SPOT + UP, duration: 1.7, ease: "power2.inOut", onUpdate: place },
		34.5,
	);
	tl.to(moveLabel, { opacity: 1, duration: 0.4 }, 35.0);
	tl.to(ghostLabel, { opacity: 1, duration: 0.4 }, 35.4);
	tl.fromTo(
		gap,
		{ opacity: 0, scaleY: 0, transformOrigin: "50% 0%" },
		{ opacity: 1, scaleY: 1, duration: 0.5 },
		36.3,
	);
	tl.to(gapLabel, { opacity: 1, duration: 0.4 }, 36.6);
	tl.to(
		slide,
		{ spot: SPOT + DOWN, duration: 2.0, ease: "power2.inOut", onUpdate: place },
		38.2,
	);
	tl.to(one("below"), { opacity: 1, duration: 0.6 }, 39.4);
	tl.to(one("below-label"), { opacity: 1, duration: 0.5 }, 39.8);
	caption(6, 41.8);
	tl.to({}, { duration: 2.2 }, 41.8);
	return tl;
}

export const deltaFilm: Film = {
	id: "delta",
	label: [
		"The value of ALFA's Oct 18 100 option against ALFA's price: the slope at today's price, the same slope on a position, and where a straight line stops describing the curve",
		"ALFA 10月18日 100 期权的价值随 ALFA 价格变化：今天价格处的斜率、同一斜率放到持仓上，以及直线在哪里不再能描述曲线",
	],
	shots: [
		{ id: "price", label: ["A price and a curve", "价格与曲线"] },
		{ id: "slope", label: ["The slope", "斜率"] },
		{ id: "put", label: ["The put", "看跌"] },
		{ id: "position", label: ["A position", "持仓"] },
		{ id: "limits", label: ["The limits", "局限"] },
	],
	height: (width) => layout(width).height,
	Head,
	Scene,
	build,
};
