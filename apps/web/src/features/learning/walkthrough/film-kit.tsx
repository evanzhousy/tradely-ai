import { gsap } from "gsap";
import { type ReactNode, useId } from "react";
import { type Copy, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import type { FilmContext } from "./film";
import { NO_LINE_START, textWidth, tokenize, wrapText } from "./text-measure";

/*
 * The grammar every lesson film shares. A film is a dark frame that is its own stage: type
 * carries the claims, a chart rises from the depth when a claim needs proof and sinks when
 * it is made, and shots are cut together on a beat. This module holds the parts that don't
 * change from lesson to lesson: the frame and its type scale, the backdrop, the title card,
 * the end card, and the moves (show, hide, pop, rise, sink, count, camera) that build a
 * timeline. Each film keeps its own subject and chart.
 */

export const clamp = (low: number, value: number, high: number) =>
	Math.max(low, Math.min(high, value));

/**
 * Films are written on a 4 s title card: `director.tag` runs at 4 s. Playing, the card lasts
 * 2 s: `director.close` moves everything after it 2 s earlier, so the question comes in at
 * 2 s (1 s at the default 2×) and a film runs 2 s shorter than its `end`.
 */
const TITLE_END = 4;
const TITLE_CUT = 2;

/**
 * The frame at a width: 16:9, or a portrait 4:5 on a phone, which has height to spare and
 * no width, with type sized to the frame.
 */
export function filmFrame(width: number) {
	const narrow = width < 520;
	const height = Math.round(narrow ? width * 1.25 : (width * 9) / 16);
	const small = clamp(narrow ? 11 : 10, width * 0.013, 13);
	const head = clamp(narrow ? 16 : 15, width * 0.027, 25);
	/** The corner tag's baseline: see `director.tag`. */
	const tagY = small * 1.15 + Math.max(10, height * 0.035);
	return {
		width,
		height,
		narrow,
		/** The left edge everything aligns to. */
		margin: Math.max(34, width * 0.085),
		/** The widest a line of type may run. */
		room: width * 0.84,
		/**
		 * The baseline of a headline at the top left. On a phone a headline is as wide as the
		 * frame, so it sits under the corner tag instead of beside it.
		 */
		headY: narrow ? tagY + 4 + head * 1.05 : height * 0.1,
		tagY,
		type: {
			big: clamp(32, width * 0.105, 100),
			title: clamp(24, width * 0.06, 56),
			head,
			num: clamp(20, width * 0.044, 42),
			body: clamp(narrow ? 13 : 12, width * 0.018, 17),
			small,
		},
	};
}
export type FilmFrame = ReturnType<typeof filmFrame>;

type Anchor = "start" | "middle" | "end";

/**
 * Line breaks for stage type set in the sans. The measure behind `wrapText` is the mono's:
 * 0.6 em a Latin glyph, a full em a CJK one. Latin in the sans runs near 0.52 em, so
 * Latin text is measured at 0.86 of its size; CJK stays close to its em.
 */
function wrapSans(text: string, maxWidth: number, size: number) {
	const cjk = /[\u2e80-\u9fff\uff00-\uffef]/.test(text);
	const measure = size * (cjk ? 0.95 : 0.86);
	const lines = wrapText(text, maxWidth, measure, { words: true });
	if (lines.length < 2) return lines;
	return (
		breakEvenly(tokenize(text, true), lines.length, maxWidth, measure) ?? lines
	);
}

/** Where a sentence pauses: a line may end here at a small discount. */
const PAUSE = /[，。；：！？,;:.!?·—]$/;
/** Opening marks that may not end a line. */
const NO_LINE_END = /^[“‘（「『《〈【〔]$/;

/**
 * The same number of lines as greedy wrapping, broken as evenly as they can be (like CSS
 * `text-wrap: balance`), and at a pause where one is close: the smallest sum of squared
 * line widths, less a small discount for each line that ends a clause. A line breaks at a
 * space, or between two CJK words, never inside "10月" or before a closing mark. Returns
 * undefined when no such breaks exist.
 */
function breakEvenly(
	tokens: string[],
	count: number,
	maxWidth: number,
	measure: number,
) {
	const n = tokens.length;
	const sums = [0];
	for (const [i, token] of tokens.entries())
		sums.push(sums[i] + textWidth(token, measure));
	const wide = (token: string) => (token.codePointAt(0) ?? 0) > 0x2e80;
	// A line may start at 0 or at token j when a break before j is allowed.
	const starts = [0];
	for (let j = 1; j < n; j++) {
		const before = tokens[j - 1];
		const token = tokens[j];
		// A number keeps its measure word: never "4 | 点" or "3 | 个".
		if (token === " ") {
			if (!(/\d$/.test(before) && wide(tokens[j + 1] ?? ""))) starts.push(j);
		} else if (
			before !== " " &&
			wide(before) &&
			wide(token) &&
			!NO_LINE_START.test(token) &&
			!NO_LINE_END.test(before)
		)
			starts.push(j);
	}
	const line = (i: number, j: number) => {
		const from = tokens[i] === " " ? i + 1 : i;
		const to = tokens[j - 1] === " " ? j - 1 : j;
		const width = sums[to] - sums[from];
		const pieces = tokens.slice(from, to).filter((t) => t !== " ").length;
		if (width > maxWidth && pieces > 1) return Number.POSITIVE_INFINITY;
		const ratio = width / maxWidth;
		const pause = j < n && PAUSE.test(tokens[to - 1] ?? "") ? 0.12 : 0;
		return ratio * ratio - pause;
	};
	const ends = [...starts.slice(1), n];
	// best[k].get(j): the cheapest k lines over tokens [0, j), and where the last one began.
	const best: Map<number, { cost: number; from: number }>[] = [
		new Map([[0, { cost: 0, from: -1 }]]),
	];
	for (let k = 1; k <= count; k++) {
		const row = new Map<number, { cost: number; from: number }>();
		for (const j of ends) {
			for (const [i, prev] of best[k - 1]) {
				if (i >= j || (k === count) !== (j === n)) continue;
				const cost = prev.cost + line(i, j);
				if (cost < (row.get(j)?.cost ?? Number.POSITIVE_INFINITY))
					row.set(j, { cost, from: i });
			}
		}
		best.push(row);
	}
	if (!Number.isFinite(best[count].get(n)?.cost ?? Number.POSITIVE_INFINITY))
		return undefined;
	const lines: string[] = [];
	for (let k = count, j = n; k > 0; k--) {
		const from = best[k].get(j)?.from ?? 0;
		lines.unshift(tokens.slice(from, j).join("").trim());
		j = from;
	}
	return lines;
}

/** How many lines `Lines` breaks a text into, so whatever follows it can make room. */
export function lineCount(text: string, maxWidth: number, size: number) {
	return wrapSans(text, maxWidth, size).length;
}

/** A block of stage type, wrapped to its room. */
export function Lines({
	name,
	text,
	x,
	y,
	size,
	maxWidth,
	anchor = "middle",
	className = "wt-film-type",
	lineHeight = 1.35,
}: {
	name: string;
	text: string;
	x: number;
	y: number;
	size: number;
	maxWidth: number;
	anchor?: Anchor;
	className?: string;
	lineHeight?: number;
}) {
	const lines = wrapSans(text, maxWidth, size);
	return (
		<text
			data-f={name}
			x={x}
			y={y}
			textAnchor={anchor}
			className={className}
			style={{ fontSize: size }}
		>
			{lines.map((line, i) => (
				<tspan key={line} x={x} dy={i === 0 ? 0 : size * lineHeight}>
					{line}
				</tspan>
			))}
		</text>
	);
}

/** One line of stage type that never wraps: a number, a word, a short claim. */
export function Word({
	name,
	x,
	y,
	size,
	anchor = "middle",
	className = "wt-film-type",
	children,
}: {
	name: string;
	x: number;
	y: number;
	size: number;
	anchor?: Anchor;
	className?: string;
	children: ReactNode;
}) {
	return (
		<text
			data-f={name}
			x={x}
			y={y}
			textAnchor={anchor}
			className={className}
			style={{ fontSize: size }}
		>
			{children}
		</text>
	);
}

/** The stage itself: its colour, a grid that drifts the whole film, and a vignette. */
export function Backdrop({ frame }: { frame: FilmFrame }) {
	const id = useId().replace(/:/g, "");
	const { width: W, height: H } = frame;
	const step = Math.round(W / 14);
	return (
		<>
			<defs>
				<pattern
					id={`grid-${id}`}
					width={step}
					height={step}
					patternUnits="userSpaceOnUse"
				>
					<path d={`M${step} 0H0V${step}`} className="wt-film-grid" />
				</pattern>
				<radialGradient id={`vig-${id}`} cx="50%" cy="45%" r="72%">
					<stop
						offset="55%"
						style={{ stopColor: "var(--film-bg)", stopOpacity: 0 }}
					/>
					<stop
						offset="100%"
						style={{ stopColor: "var(--film-bg)", stopOpacity: 0.8 }}
					/>
				</radialGradient>
			</defs>
			<rect x={0} y={0} width={W} height={H} className="wt-film-bg" />
			<rect
				data-f="drift"
				x={-W * 0.1}
				y={0}
				width={W * 1.3}
				height={H}
				fill={`url(#grid-${id})`}
			/>
			<rect x={0} y={0} width={W} height={H} fill={`url(#vig-${id})`} />
		</>
	);
}

/** The diagonal hatch that marks a region no value can reach. Put it in a film's defs. */
export function Hatch({ id }: { id: string }) {
	return (
		<pattern
			id={id}
			width="6"
			height="6"
			patternUnits="userSpaceOnUse"
			patternTransform="rotate(45)"
		>
			<rect width="6" height="6" className="wt-hatch-bg" />
			<line x1="0" y1="0" x2="0" y2="6" className="wt-hatch-line" />
		</pattern>
	);
}

/**
 * The opening card: the lesson's name wipes on with a line under it. `director.open` plays
 * it, and `director.tag` shrinks the name into the corner for the rest of the film.
 */
export function TitleCard({
	frame,
	title,
	sub,
}: {
	frame: FilmFrame;
	title: string;
	sub: string;
}) {
	const id = useId().replace(/:/g, "");
	const { type: T, height: H, margin, room } = frame;
	// A long name sets smaller rather than run off the frame: about 0.56 em a Latin glyph
	// in the sans, a full em a CJK one.
	const ems = [...title].reduce(
		(sum, char) => sum + ((char.codePointAt(0) ?? 0) > 0x2e80 ? 1 : 0.56),
		0,
	);
	const size = Math.min(T.title, room / Math.max(ems, 1));
	return (
		<>
			<defs>
				<clipPath id={`wipe-${id}`}>
					<rect data-f="wipe" x={-4} y={-size} width={0} height={size * 1.35} />
				</clipPath>
			</defs>
			<g data-f="title-group">
				<text
					data-f="title"
					x={0}
					y={0}
					className="wt-film-type"
					style={{ fontSize: size }}
					clipPath={`url(#wipe-${id})`}
				>
					{title}
				</text>
			</g>
			<Lines
				name="title-sub"
				text={sub}
				x={margin}
				y={H * 0.5 + T.head * 1.7}
				size={T.head}
				maxWidth={room}
				anchor="start"
				className="wt-film-type wt-film-dim"
			/>
		</>
	);
}

const endCopy = {
	cta: ["Try it in the playground ↓", "到探索区自己试一试 ↓"],
} as const satisfies Record<string, Copy>;

/** The closing card: what comes next, why, and the way into the playground. */
export function EndCard({
	frame,
	locale,
	next,
	why,
}: {
	frame: FilmFrame;
	locale: Locale;
	next: string;
	why: string;
}) {
	const { type: T, width: W, height: H, room } = frame;
	// A name that wraps pushes the lines under it down, and the block stays centred.
	const extra = (lineCount(next, room, T.title) - 1) * T.title * 1.35;
	const top = H * 0.46 - extra / 2;
	return (
		<g data-f="end">
			<Lines
				name="end-next"
				text={next}
				x={W / 2}
				y={top}
				size={T.title}
				maxWidth={room}
			/>
			<Lines
				name="end-why"
				text={why}
				x={W / 2}
				y={top + extra + T.title}
				size={T.body}
				maxWidth={room}
				className="wt-film-type wt-film-dim"
			/>
			<Lines
				name="end-cta"
				text={pick(endCopy.cta, locale)}
				x={W / 2}
				y={top + extra + T.title + T.body * 2.6}
				size={T.body}
				maxWidth={room}
				className="wt-film-type wt-film-accent"
			/>
		</g>
	);
}

/**
 * A softly glowing pen tip for `director.trace`: a bright core inside a wide, faint halo.
 * Put it in the same group as the line it leads, so they share coordinates.
 */
export function PenTip({ name, r = 4 }: { name: string; r?: number }) {
	const id = useId().replace(/:/g, "");
	return (
		<g data-f={name}>
			<defs>
				<radialGradient id={`tip-${id}`}>
					<stop
						offset="0%"
						style={{ stopColor: "var(--diagram-accent)", stopOpacity: 0.5 }}
					/>
					<stop
						offset="100%"
						style={{ stopColor: "var(--diagram-accent)", stopOpacity: 0 }}
					/>
				</radialGradient>
			</defs>
			<circle r={r * 4} fill={`url(#tip-${id})`} />
			<circle r={r} className="wt-film-tip" />
		</g>
	);
}

/** Corner brackets around a box, for `director.lock` to snap onto the thing in focus. */
export function Brackets({
	name,
	x,
	y,
	width,
	height,
	arm = 10,
	tone,
}: {
	name: string;
	x: number;
	y: number;
	width: number;
	height: number;
	arm?: number;
	/** The accent by default; a bid or an ask can lock in its own colour. */
	tone?: "gain" | "loss";
}) {
	const r = x + width;
	const b = y + height;
	return (
		<path
			data-f={name}
			d={`M${x} ${y + arm}V${y}H${x + arm}M${r - arm} ${y}H${r}V${y + arm}M${r} ${b - arm}V${b}H${r - arm}M${x + arm} ${b}H${x}V${b - arm}`}
			className="wt-film-lock"
			data-tone={tone}
		/>
	);
}

type Point = { x: number; y: number };
type Targets = Element | Element[];

/**
 * Builds a film's timeline with the shared moves. Everything a film draws starts where its
 * Scene put it; `hidden` sets the elements a shot will bring in, and each move adds its
 * tween at a time in seconds. Elements are found by their `data-f` name.
 */
export function createDirector(
	{ stage, width, locale }: FilmContext,
	frame: FilmFrame,
	end: number,
) {
	const { type: T, height: H, margin } = frame;
	const q = gsap.utils.selector(stage);
	const one = <E extends Element = SVGElement>(name: string) =>
		q<E>(`[data-f="${name}"]`)[0];
	/** The children of a named group, to bring in or send off one by one. */
	const kids = (name: string) => q<SVGElement>(`[data-f="${name}"] > *`);
	const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });

	const hidden = (targets: Targets) => gsap.set(targets, { opacity: 0 });
	/** A line of type arrives from just beside its place. */
	const show = (
		targets: Targets,
		at: number,
		from: "below" | "above" | "right" = "below",
		duration = 0.5,
	) =>
		tl.fromTo(
			targets,
			{
				opacity: 0,
				y: from === "below" ? 14 : from === "above" ? -14 : 0,
				x: from === "right" ? 18 : 0,
			},
			{ opacity: 1, y: 0, x: 0, duration },
			at,
		);
	/** A cut sends type up and away. */
	const hide = (targets: Targets, at: number, duration = 0.35) =>
		tl.to(targets, { opacity: 0, y: -12, duration, ease: "power2.in" }, at);
	/**
	 * One line of type gives way to the next in the same place, never both at once: the old
	 * one leaves upwards and the new one follows it up from below, clear of the corner tag.
	 */
	const swap = (from: Targets, to: Targets, at: number) => {
		hide(from, at);
		show(to, at + 0.35);
	};
	/** A number or a chip lands with a little overshoot, about its own centre. */
	const pop = (target: Element, at: number, duration = 0.5) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 0.6, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration, ease: "back.out(1.8)" },
			at,
		);
	/** A headline number lands slightly large and settles, the film's loudest move. */
	const slam = (target: Element, at: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.12, y: 6, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, y: 0, duration: 0.55, ease: "back.out(2)" },
			at,
		);
	/** One value swaps for another by folding shut and opening again. */
	const flip = (from: Element, to: Element, at: number) => {
		tl.to(
			from,
			{
				scaleY: 0,
				duration: 0.3,
				ease: "power2.in",
				transformOrigin: "50% 50%",
			},
			at,
		);
		tl.fromTo(
			to,
			{ opacity: 1, scaleY: 0, transformOrigin: "50% 50%" },
			{ scaleY: 1, duration: 0.35, ease: "power2.out" },
			at + 0.3,
		);
	};
	/** A figure counts up to `target`, written by `format` at every step. */
	const count = (
		target: SVGTextElement,
		to: number,
		at: number,
		format: (value: number) => string,
		from = 0,
		duration = 0.7,
	) => {
		const counter = { value: from };
		tl.to(
			counter,
			{
				value: to,
				duration,
				ease: "power2.out",
				onUpdate: () => {
					target.textContent = format(counter.value);
				},
			},
			at,
		);
	};
	/**
	 * A line draws itself from its start; with a `tip` (see `PenTip`), a glowing pen tip leads
	 * it and goes out when the line is done. A dashed line gets its dashes back once drawn.
	 */
	const trace = (
		path: SVGPathElement,
		at: number,
		{
			tip,
			duration = 1,
			ease = "power1.inOut",
		}: { tip?: Element; duration?: number; ease?: string } = {},
	) => {
		const length = path.getTotalLength();
		const dash = getComputedStyle(path).strokeDasharray;
		// Dash and gap both the line's length: a single number would be merged into a dashed
		// line's own pattern ("736px, 4px") and show the line ahead of the pen.
		tl.fromTo(
			path,
			{ strokeDasharray: `${length} ${length}`, strokeDashoffset: length },
			{ strokeDashoffset: 0, duration, ease },
			at,
		);
		// Up at once: the dash already hides what isn't drawn. Starting from 0 keeps a round
		// cap from showing as a dot before the draw.
		tl.fromTo(path, { opacity: 0 }, { opacity: 1, duration: 0.15 }, at);
		tl.set(path, { strokeDasharray: dash || "none" }, at + duration);
		if (!tip) return;
		const pen = { done: 0 };
		const place = () => {
			const point = path.getPointAtLength(pen.done * length);
			gsap.set(tip, { x: point.x, y: point.y });
		};
		tl.fromTo(
			pen,
			{ done: 0 },
			{ done: 1, duration, ease, onStart: place, onUpdate: place },
			at,
		);
		tl.fromTo(tip, { opacity: 0 }, { opacity: 1, duration: 0.12 }, at);
		tl.to(
			tip,
			{ opacity: 0, duration: 0.35, ease: "power2.in" },
			at + duration,
		);
	};
	/** Brackets (see `Brackets`) snap onto the thing in focus: from 1.4× to 1× about their centre. */
	const lock = (target: SVGGraphicsElement, at: number) => {
		const box = target.getBBox();
		tl.fromTo(
			target,
			{
				opacity: 0,
				scale: 1.4,
				svgOrigin: `${box.x + box.width / 2} ${box.y + box.height / 2}`,
			},
			{ opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" },
			at,
		);
	};
	/**
	 * One element travels into another's place and becomes it: `from` moves and scales onto
	 * `to`'s box, then hands over. Both must sit in the same coordinates, untransformed then.
	 */
	const carry = (
		from: SVGGraphicsElement,
		to: SVGGraphicsElement,
		at: number,
		duration = 0.9,
	) => {
		const a = from.getBBox();
		const b = to.getBBox();
		const ax = a.x + a.width / 2;
		const ay = a.y + a.height / 2;
		tl.to(
			from,
			{
				x: b.x + b.width / 2 - ax,
				y: b.y + b.height / 2 - ay,
				scale: b.height / a.height,
				svgOrigin: `${ax} ${ay}`,
				duration,
				ease: "power3.inOut",
			},
			at,
		);
		tl.set(from, { opacity: 0 }, at + duration);
		tl.fromTo(
			to,
			{ opacity: 0 },
			{ opacity: 1, duration: 0.12 },
			at + duration - 0.1,
		);
	};
	/**
	 * One shape becomes the next. Both paths need the same commands, so every number in one
	 * has a partner in the other: draw curves through the same knots.
	 */
	const morph = (path: Element, d: string, at: number, duration = 0.8) =>
		tl.to(path, { attr: { d }, duration, ease: "power2.inOut" }, at);

	// The chart lives in [data-f=depth] > [data-f=world]: depth rises and sinks, world is
	// what the camera moves.
	const depth = one("depth");
	const world = one("world");
	if (depth)
		gsap.set(depth, {
			opacity: 0,
			scale: 0.92,
			svgOrigin: `${width / 2} ${H / 2}`,
		});
	if (world) gsap.set(world, { scale: 1, x: 0, y: 0, transformOrigin: "0 0" });
	const rise = (at: number) =>
		tl.to(
			depth,
			{ opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" },
			at,
		);
	const sink = (at: number) =>
		tl.to(
			depth,
			{ opacity: 0, scale: 0.9, duration: 0.4, ease: "power2.in" },
			at,
		);
	/** A camera that scales the chart about its origin so `focus` lands on `target`. */
	const cam = (scale: number, focus: Point, target: Point) => ({
		scale,
		x: target.x - scale * focus.x,
		y: target.y - scale * focus.y,
	});
	const home = { scale: 1, x: 0, y: 0 };

	// The grid drifts the whole way through: the stage is never quite still.
	const drift = one("drift");
	if (drift)
		tl.fromTo(
			drift,
			{ x: 0 },
			{ x: -width * 0.06, duration: end - TITLE_CUT, ease: "none" },
			0,
		);

	// The title card, if the film has one.
	const titleGroup = one("title-group");
	const title = one<SVGTextElement>("title");
	const titleSub = one("title-sub");
	if (titleGroup) gsap.set(titleGroup, { x: margin, y: H * 0.5 });
	if (titleSub) hidden(titleSub);
	// The name is set in the sans, wider than the mono estimate: measure it, and leave room
	// for a web font that arrives after the measure.
	const titleSize = Number.parseFloat(title?.style.fontSize ?? "") || T.title;
	const measured =
		title?.getComputedTextLength() ||
		textWidth(title?.textContent ?? "", titleSize);
	const open = (at: number) => {
		tl.to(
			one("wipe"),
			{
				attr: { width: measured * 1.15 + 12 },
				duration: 0.7,
				ease: "power3.out",
			},
			at + 0.1,
		);
		show(titleSub, at + 0.5);
	};
	/**
	 * The name shrinks into the top-right corner, where it stays as the film's tag, clear of
	 * every headline (they align left or centre). It shrinks by its type size, not a scale:
	 * GSAP scales an SVG element about its box corner, which would lift it off its baseline.
	 */
	const tagSize = T.small * 1.15;
	const tag = (at: number) => {
		hide(titleSub, at);
		tl.to(
			titleGroup,
			{
				x: width - margin * 0.45 - measured * (tagSize / titleSize),
				y: frame.tagY,
				duration: 0.9,
				ease: "power3.inOut",
			},
			at,
		);
		tl.to(
			title,
			{ fontSize: tagSize, duration: 0.9, ease: "power3.inOut" },
			at,
		);
		tl.to(
			title,
			{ attr: { class: "wt-film-type wt-film-dim" }, duration: 0.3 },
			at + 0.4,
		);
	};

	// The end card, if the film has one.
	const endKids = kids("end");
	if (endKids.length) hidden(endKids);
	const close = (at: number) => {
		show(one("end-next"), at + 0.2, "above");
		show(one("end-why"), at + 0.6);
		show(one("end-cta"), at + 1.0);
		tl.to({}, { duration: Math.max(0, end - (at + 1.0)) }, at + 1.0);
		// The title card plays short: everything after it, labels too, comes in sooner.
		tl.shiftChildren(-TITLE_CUT, true, TITLE_END - 0.01);
	};

	return {
		tl,
		one,
		kids,
		t: (value: Copy) => pick(value, locale),
		hidden,
		show,
		hide,
		swap,
		pop,
		slam,
		flip,
		count,
		trace,
		lock,
		carry,
		morph,
		rise,
		sink,
		cam,
		home,
		world,
		depth,
		open,
		tag,
		close,
	};
}
