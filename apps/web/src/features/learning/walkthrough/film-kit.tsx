import { gsap } from "gsap";
import { type ReactNode, useId } from "react";
import { type Copy, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import type { FilmContext } from "./film";
import { textWidth, wrapText } from "./text-measure";

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

/** The frame at a width: 16:9, or 4:3 on a phone, with type sized to the frame. */
export function filmFrame(width: number) {
	const narrow = width < 520;
	const height = Math.round(narrow ? width * 0.75 : (width * 9) / 16);
	return {
		width,
		height,
		narrow,
		/** The left edge everything aligns to. */
		margin: Math.max(34, width * 0.085),
		/** The widest a line of type may run. */
		room: width * 0.84,
		type: {
			big: clamp(32, width * 0.105, 100),
			title: clamp(24, width * 0.06, 56),
			head: clamp(15, width * 0.027, 25),
			num: clamp(20, width * 0.044, 42),
			body: clamp(12, width * 0.018, 17),
			small: clamp(10, width * 0.013, 13),
		},
	};
}
export type FilmFrame = ReturnType<typeof filmFrame>;

type Anchor = "start" | "middle" | "end";

/** A block of stage type, wrapped to its room. Words are set in the sans, a little narrower than mono. */
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
	const lines = wrapText(text, maxWidth, size * 0.92);
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
	const { type: T, height: H, margin } = frame;
	return (
		<>
			<defs>
				<clipPath id={`wipe-${id}`}>
					<rect
						data-f="wipe"
						x={-4}
						y={-T.title}
						width={0}
						height={T.title * 1.35}
					/>
				</clipPath>
			</defs>
			<g data-f="title-group">
				<text
					data-f="title"
					x={0}
					y={0}
					className="wt-film-type"
					style={{ fontSize: T.title }}
					clipPath={`url(#wipe-${id})`}
				>
					{title}
				</text>
			</g>
			<Word
				name="title-sub"
				x={margin}
				y={H * 0.5 + T.head * 1.7}
				size={T.head}
				anchor="start"
				className="wt-film-type wt-film-dim"
			>
				{sub}
			</Word>
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
	return (
		<g data-f="end">
			<Lines
				name="end-next"
				text={next}
				x={W / 2}
				y={H * 0.46}
				size={T.title}
				maxWidth={room}
			/>
			<Lines
				name="end-why"
				text={why}
				x={W / 2}
				y={H * 0.46 + T.title}
				size={T.body}
				maxWidth={room}
				className="wt-film-type wt-film-dim"
			/>
			<Lines
				name="end-cta"
				text={pick(endCopy.cta, locale)}
				x={W / 2}
				y={H * 0.46 + T.title + T.body * 2.6}
				size={T.body}
				maxWidth={room}
				className="wt-film-type wt-film-accent"
			/>
		</g>
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
			{ x: -width * 0.06, duration: end, ease: "none" },
			0,
		);

	// The title card, if the film has one.
	const titleGroup = one("title-group");
	const title = one<SVGTextElement>("title");
	const titleSub = one("title-sub");
	if (titleGroup) gsap.set(titleGroup, { x: margin, y: H * 0.5 });
	if (titleSub) hidden(titleSub);
	const open = (at: number) => {
		const name = title?.textContent ?? "";
		tl.to(
			one("wipe"),
			{
				attr: { width: textWidth(name, T.title) + 8 },
				duration: 0.9,
				ease: "power3.out",
			},
			at + 0.3,
		);
		show(titleSub, at + 1.0);
	};
	const tag = (at: number) => {
		hide(titleSub, at);
		tl.to(
			titleGroup,
			{
				x: margin,
				y: H * 0.1,
				scale: (T.small * 1.15) / T.title,
				duration: 0.9,
				ease: "power3.inOut",
			},
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
	};

	return {
		tl,
		one,
		kids,
		t: (value: Copy) => pick(value, locale),
		hidden,
		show,
		hide,
		pop,
		slam,
		flip,
		count,
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
