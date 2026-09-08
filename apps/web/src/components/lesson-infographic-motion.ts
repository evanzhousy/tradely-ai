import { useEffect, useRef } from "react";

type MotionKind =
	| "trace"
	| "pulse"
	| "focus"
	| "tick"
	| "settle"
	| "travel"
	| "scan"
	| "grow"
	| "grow-down"
	| "grow-x";

const cycleRestMs = 700;
const playbackRate = 2;

const easeOut = "cubic-bezier(0.23, 1, 0.32, 1)";
const easeInOut = "cubic-bezier(0.77, 0, 0.175, 1)";

function keyframes(
	element: SVGElement,
	accent: string,
): Keyframe[] | undefined {
	switch (element.dataset.diagramMotion as MotionKind) {
		case "travel":
		case "scan": {
			const dx = Number(element.dataset.diagramDx) || 0;
			const dy = Number(element.dataset.diagramDy) || 0;
			return [
				{ transform: "translate(0px, 0px)", opacity: 0 },
				{ transform: "translate(0px, 0px)", opacity: 1, offset: 0.08 },
				{ transform: `translate(${dx}px, ${dy}px)`, opacity: 1, offset: 0.9 },
				{ transform: `translate(${dx}px, ${dy}px)`, opacity: 0 },
			];
		}
		case "grow":
		case "grow-down":
		case "grow-x": {
			const axis = element.dataset.diagramMotion === "grow-x" ? "X" : "Y";
			return [
				{ transform: `scale${axis}(0.08)` },
				{ transform: `scale${axis}(1)`, offset: 0.75 },
				{ transform: `scale${axis}(1)` },
			];
		}
		case "trace":
			return [
				{ strokeDashoffset: 1, opacity: 0 },
				{ strokeDashoffset: 1, opacity: 1, offset: 0.06 },
				{ strokeDashoffset: 0, opacity: 1, offset: 0.72 },
				{ strokeDashoffset: 0, opacity: 0 },
			];
		case "pulse":
			return [
				{ transform: "scale(1)" },
				{ transform: "scale(1.13)", offset: 0.45 },
				{ transform: "scale(1)" },
			];
		case "focus": {
			const { stroke, strokeWidth } = getComputedStyle(element);
			return [
				{ stroke, strokeWidth },
				{ stroke: accent, strokeWidth: "2.5px", offset: 0.4 },
				{ stroke, strokeWidth },
			];
		}
		case "tick":
			return [
				{ transform: "rotate(0deg)" },
				{ transform: "rotate(30deg)", offset: 0.4 },
				{ transform: "rotate(0deg)" },
			];
		case "settle":
			return [
				{ transform: "translateX(0)" },
				{ transform: "translateX(-7px)", offset: 0.4 },
				{ transform: "translateX(0)" },
			];
	}
}

// Owns visible illustration loops; it never changes lesson data.
export function useLessonInfographicMotion(subject: string, enabled = true) {
	const ref = useRef<SVGSVGElement>(null);
	useEffect(() => {
		const svg = ref.current;
		if (!svg) return;
		if (!enabled) {
			svg.dataset.motionState = "paused";
			return;
		}
		if (
			typeof IntersectionObserver === "undefined" ||
			typeof svg.animate !== "function"
		)
			return;

		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
		let disposed = false;
		let visible = false;
		let nextCycle: number | undefined;
		let generation = 0;
		let animations: Animation[] = [];

		const stop = () => {
			generation++;
			window.clearTimeout(nextCycle);
			nextCycle = undefined;
			for (const animation of animations) animation.cancel();
			animations = [];
			svg.dataset.motionState = reducedMotion.matches ? "reduced" : "idle";
		};
		const play = () => {
			if (
				disposed ||
				!visible ||
				document.hidden ||
				reducedMotion.matches ||
				animations.length ||
				nextCycle !== undefined
			)
				return;
			const accent =
				getComputedStyle(svg).getPropertyValue("--primary").trim() || "#f2c94c";
			const run = ++generation;
			for (const element of svg.querySelectorAll<SVGElement>(
				"[data-diagram-motion]",
			)) {
				const frames = keyframes(element, accent);
				if (!frames) continue;
				const delay = Math.max(0, Number(element.dataset.diagramDelay) || 0);
				const duration = Math.max(
					180,
					Number(element.dataset.diagramDuration) || 700,
				);
				animations.push(
					element.animate(frames, {
						id: `lesson-${subject}`,
						duration: duration / playbackRate,
						delay: delay / playbackRate,
						iterations: 1,
						fill: "none",
						easing: ["pulse", "focus"].includes(
							element.dataset.diagramMotion ?? "",
						)
							? easeInOut
							: easeOut,
					}),
				);
			}
			if (!animations.length) return;
			svg.dataset.motionState = "playing";
			void Promise.allSettled(
				animations.map((animation) => animation.finished),
			).then(() => {
				if (generation !== run) return;
				animations = [];
				svg.dataset.motionState = "waiting";
				nextCycle = window.setTimeout(() => {
					nextCycle = undefined;
					play();
				}, cycleRestMs);
			});
		};
		const observer = new IntersectionObserver(
			(entries) => {
				if (disposed) return;
				const entry = entries[entries.length - 1];
				visible = !!entry?.isIntersecting && entry.intersectionRatio >= 0.55;
				if (!visible) stop();
				else play();
			},
			{ threshold: [0, 0.55] },
		);
		const onVisibilityChange = () => {
			if (document.hidden) stop();
			else play();
		};
		const onMotionChange = () => {
			stop();
			play();
		};

		stop();
		observer.observe(svg);
		document.addEventListener("visibilitychange", onVisibilityChange);
		reducedMotion.addEventListener("change", onMotionChange);
		return () => {
			disposed = true;
			observer.disconnect();
			document.removeEventListener("visibilitychange", onVisibilityChange);
			reducedMotion.removeEventListener("change", onMotionChange);
			stop();
		};
	}, [subject, enabled]);
	return ref;
}
