import type { Transition } from "motion/react";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";

const FALLBACK_WIDTH = 640;

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

/**
 * Teaching motion: long enough to follow a cause to its effect, and off when the reader
 * prefers reduced motion. Effects wait for their cause with `after`.
 */
export function useTeachMotion() {
	const reduced = usePrefersReducedMotion();
	return {
		enabled: !reduced,
		move: (reduced
			? none
			: { type: "tween", duration: 0.55, ease }) satisfies Transition,
		fade: (reduced
			? none
			: { type: "tween", duration: 0.35, ease }) satisfies Transition,
		after: (delay: number): Transition =>
			reduced ? none : { type: "tween", duration: 0.45, ease, delay },
	};
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
	const [width, setWidth] = useState(FALLBACK_WIDTH);
	const id = useId().replace(/:/g, "");
	useEffect(() => {
		const element = box.current;
		if (!element) return;
		const measure = () => {
			const next = Math.round(element.clientWidth);
			if (next > 0) setWidth(Math.max(280, Math.min(next, 820)));
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	const h = typeof height === "function" ? height(width) : height;
	return (
		<div ref={box} className="wt-stage-box">
			<svg
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
					{children(width)}
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
};

/** Diagram text. Numbers and labels share the mono face used across lessons. */
export function Label({
	x,
	y,
	children,
	anchor = "start",
	tone,
	className,
}: TextProps) {
	return (
		<text
			x={x}
			y={y}
			textAnchor={anchor}
			className={[tone ? `wt-${tone}` : undefined, className]
				.filter(Boolean)
				.join(" ")}
		>
			{children}
		</text>
	);
}
