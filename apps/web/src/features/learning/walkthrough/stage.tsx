import { animate, type Transition } from "motion/react";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { textWidth } from "./text-measure";

const FALLBACK_WIDTH = 640;

/** Every stage on a lesson page sits in the same column; a new one starts at the last width. */
let lastWidth: number | null = null;

const stageWidth = (element: HTMLElement) => {
	const next = Math.round(element.clientWidth);
	return next > 0 ? Math.max(280, Math.min(next, 820)) : null;
};

/** True unless the reader has asked the system for reduced motion. */
export function usePrefersReducedMotion() {
	const [reduced, setReduced] = useState(false);
	useEffect(() => {
		const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
		if (!query) return;
		const update = () => setReduced(query.matches);
		update();
		query.addEventListener("change", update);
		return () => query.removeEventListener("change", update);
	}, []);
	return reduced;
}

const ease = [0.22, 1, 0.36, 1] as const;
const none: Transition = { duration: 0 };
// Module constants, so each transition keeps its identity between renders.
const move: Transition = { type: "tween", duration: 0.55, ease };
const fade: Transition = { type: "tween", duration: 0.35, ease };
const follow: Transition = { type: "tween", duration: 0.12, ease: "easeOut" };

/**
 * Teaching motion: long enough to follow a cause to its effect, and off when the reader
 * prefers reduced motion. Effects wait for their cause with `after`.
 */
export function useTeachMotion() {
	const reduced = usePrefersReducedMotion();
	return {
		enabled: !reduced,
		move: reduced ? none : move,
		fade: reduced ? none : fade,
		after: (delay: number): Transition =>
			reduced ? none : { type: "tween", duration: 0.45, ease, delay },
		/** Tracks a drag: quick enough to stay under the pointer, smooth across snapped steps. */
		follow: reduced ? none : follow,
	};
}

/**
 * A figure that counts from the number it showed last to `value`, so a change reads as a
 * change rather than a swap. `format` renders every step, including the last.
 */
export function CountTo({
	value,
	format,
}: {
	value: number;
	format: (value: number) => string;
}) {
	const { enabled, fade } = useTeachMotion();
	const [shown, setShown] = useState(value);
	const current = useRef(value);
	const changed = useRef(Number.NEGATIVE_INFINITY);
	useEffect(() => {
		// A figure that changes again within a count is being scrubbed; it shows the live value.
		const now = performance.now();
		const scrubbing = now - changed.current < 350;
		changed.current = now;
		if (!enabled || scrubbing) {
			current.current = value;
			setShown(value);
			return;
		}
		const controls = animate(current.current, value, {
			...fade,
			onUpdate: (latest) => {
				current.current = latest;
				setShown(latest);
			},
		});
		return () => controls.stop();
	}, [value, enabled, fade]);
	return format(shown);
}

/** The narrowest a label may be condensed to fit the stage; past this it needs a new layout. */
const MIN_CONDENSE = 0.72;

/**
 * Condenses any label that runs past the stage's edge just enough to fit, so a long title
 * or value stays whole on a phone instead of being cut off. Labels that fit are untouched.
 */
function fitLabels(svg: SVGSVGElement) {
	const stage = svg.getBoundingClientRect();
	for (const text of svg.querySelectorAll<SVGTextElement>("text")) {
		if (text.dataset.fit) {
			text.removeAttribute("textLength");
			text.removeAttribute("lengthAdjust");
			delete text.dataset.fit;
		}
		const box = text.getBoundingClientRect();
		if (!box.width) continue;
		const overRight = Math.max(0, box.right - (stage.right - 2));
		const overLeft = Math.max(0, stage.left + 2 - box.left);
		if (!overRight && !overLeft) continue;
		const natural = text.getComputedTextLength();
		const anchor = getComputedStyle(text).textAnchor;
		const target =
			anchor === "middle"
				? natural - 2 * Math.max(overLeft, overRight)
				: anchor === "end"
					? natural - overLeft
					: natural - overRight;
		text.setAttribute(
			"textLength",
			String(Math.max(target, natural * MIN_CONDENSE)),
		);
		text.setAttribute("lengthAdjust", "spacingAndGlyphs");
		text.dataset.fit = "1";
	}
}

type StageContextValue = { width: number; hatch: string };
const StageContext = createContext<StageContextValue>({
	width: FALLBACK_WIDTH,
	hatch: "none",
});
/** Measured drawing width and the id of the unknown-value hatch pattern. */
export const useStage = () => useContext(StageContext);

/**
 * An SVG drawn at the width of its container so text renders at its true size.
 * `height` may depend on the width, which lets instruments reflow on narrow screens.
 *
 * The drawing waits for its width, measured before the first paint, so nothing slides in
 * from a guessed layout. A new width redraws it in place rather than animating every
 * element across: a resize is not a change the lesson is teaching.
 */
export function Stage({
	label,
	height,
	children,
}: {
	label: string;
	height: number | ((width: number) => number);
	children: (width: number) => ReactNode;
}) {
	const box = useRef<HTMLDivElement>(null);
	const [measured, setMeasured] = useState<number | null>(() => lastWidth);
	const id = useId().replace(/:/g, "");
	useLayoutEffect(() => {
		const element = box.current;
		if (!element) return;
		const measure = () => {
			const next = stageWidth(element);
			if (next === null) return;
			lastWidth = next;
			setMeasured(next);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	const width = measured ?? FALLBACK_WIDTH;
	const h = typeof height === "function" ? height(width) : height;
	const svg = useRef<SVGSVGElement>(null);
	// Fit after every drawing, again once its moves have settled, and when web fonts arrive.
	useEffect(() => {
		const element = svg.current;
		if (!element) return;
		const fit = () => fitLabels(element);
		fit();
		const settled = window.setTimeout(fit, 700);
		let live = true;
		document.fonts?.ready.then(() => live && fit());
		return () => {
			live = false;
			window.clearTimeout(settled);
		};
	});
	return (
		<div ref={box} className="wt-stage-box">
			<svg
				ref={svg}
				className="wt-svg"
				viewBox={`0 0 ${width} ${h}`}
				width={width}
				height={h}
				role="img"
				aria-label={label}
			>
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
				</defs>
				<StageContext value={{ width, hatch: `url(#hatch-${id})` }}>
					{measured === null ? null : (
						<g key={measured}>{children(measured)}</g>
					)}
				</StageContext>
			</svg>
		</div>
	);
}

type TextProps = {
	x: number;
	y: number;
	children: ReactNode;
	anchor?: "start" | "middle" | "end";
	tone?: "muted" | "strong" | "gain" | "loss" | "accent" | "small";
	className?: string;
	/** Room the text has; a longer string condenses to fit, down to MIN_CONDENSE. */
	maxWidth?: number;
};

const toneSize = { muted: 12, small: 11, strong: 17 } as const;

/** Diagram text. Numbers and labels share the mono face used across lessons. */
export function Label({
	x,
	y,
	children,
	anchor = "start",
	tone,
	className,
	maxWidth,
}: TextProps) {
	const natural =
		maxWidth !== undefined &&
		(typeof children === "string" || typeof children === "number")
			? textWidth(
					String(children),
					tone && tone in toneSize
						? toneSize[tone as keyof typeof toneSize]
						: 13,
				)
			: 0;
	const fitted =
		maxWidth !== undefined && natural > maxWidth
			? Math.max(maxWidth, natural * MIN_CONDENSE)
			: undefined;
	return (
		<text
			x={x}
			y={y}
			textLength={fitted}
			lengthAdjust={fitted ? "spacingAndGlyphs" : undefined}
			textAnchor={anchor}
			className={[tone ? `wt-${tone}` : undefined, className]
				.filter(Boolean)
				.join(" ")}
		>
			{children}
		</text>
	);
}
