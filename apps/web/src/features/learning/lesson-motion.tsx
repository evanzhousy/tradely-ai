import {
	domMin,
	LazyMotion,
	MotionConfig,
	type Transition,
} from "motion/react";
import * as m from "motion/react-m";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

const loadFeatures = () =>
	import("./motion-features").then((module) => module.default);
const MotionEnabled = createContext(false);
const ease = [0.23, 1, 0.32, 1] as const;
export const lessonTransition: Transition = {
	type: "tween",
	duration: 0.24,
	ease,
};
export const instantTransition: Transition = { duration: 0 };
export const useLessonMotion = () => useContext(MotionEnabled);

/** Animation owns presentation only. No case state, grading, or replay clock lives here. */
export function LessonMotion({ children }: { children: ReactNode }) {
	const [pointerInteraction, setPointerInteraction] = useState(false);
	const [featuresReady, setFeaturesReady] = useState(false);
	const mounted = useRef(true);
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);
	const features = useCallback(
		() =>
			loadFeatures()
				.then((bundle) => {
					if (mounted.current) setFeaturesReady(true);
					return bundle;
				})
				.catch(() => domMin),
		[],
	);
	const [reduced, setReduced] = useState(true);
	useEffect(() => {
		const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
		const update = () => setReduced(preference?.matches ?? false);
		update();
		preference?.addEventListener("change", update);
		return () => preference?.removeEventListener("change", update);
	}, []);
	const currentReduced =
		typeof window !== "undefined" &&
		(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
	const enabled =
		featuresReady && pointerInteraction && !reduced && !currentReduced;
	return (
		<LazyMotion features={features} strict>
			{/* The live policy above owns preferences; Motion snapshots its built-in flag at mount. */}
			<MotionConfig
				reducedMotion="never"
				transition={enabled ? lessonTransition : instantTransition}
			>
				<MotionEnabled.Provider value={enabled}>
					<div
						className="min-w-0"
						data-lesson-motion={enabled ? "on" : "off"}
						onPointerDownCapture={() => {
							// Read at input too: a media-change notification can arrive after the gesture.
							setReduced(
								window.matchMedia?.("(prefers-reduced-motion: reduce)")
									.matches ?? false,
							);
							setPointerInteraction(true);
						}}
						onKeyDownCapture={() => setPointerInteraction(false)}
					>
						{children}
					</div>
				</MotionEnabled.Provider>
			</MotionConfig>
		</LazyMotion>
	);
}

/** Immediate semantic content, with a brief optional visual entrance. Never retains stale answers on exit. */
export function LessonReveal({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	const enabled = useLessonMotion();
	return (
		<m.div
			className={className}
			initial={enabled ? { opacity: 0, y: 4 } : false}
			animate={{ opacity: 1, y: 0 }}
			transition={enabled ? lessonTransition : instantTransition}
		>
			{children}
		</m.div>
	);
}

/** Emphasizes a changed value without counting through invented intermediate observations. */
export function ChangeHighlight({
	value,
	children,
}: {
	value: string | number;
	children: ReactNode;
}) {
	const enabled = useLessonMotion();
	return (
		<span className="relative isolate inline-block">
			<m.span
				key={value}
				aria-hidden="true"
				className="pointer-events-none absolute -inset-x-1 inset-y-0 -z-10 rounded bg-primary/25"
				initial={{ opacity: enabled ? 1 : 0 }}
				animate={{ opacity: 0 }}
				transition={enabled ? lessonTransition : instantTransition}
			/>
			{children}
		</span>
	);
}
