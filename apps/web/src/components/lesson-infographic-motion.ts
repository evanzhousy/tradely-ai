import { useEffect, useRef } from "react";

type MotionKind = "trace" | "pulse" | "focus" | "tick" | "settle";

const easeOut = "cubic-bezier(0.23, 1, 0.32, 1)";
const easeInOut = "cubic-bezier(0.77, 0, 0.175, 1)";

function keyframes(
	element: SVGElement,
	accent: string,
): Keyframe[] | undefined {
	switch (element.dataset.diagramMotion as MotionKind) {
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
			return [{ transform: "rotate(-30deg)" }, { transform: "rotate(0deg)" }];
		case "settle":
			return [
				{ transform: "translateX(-7px)" },
				{ transform: "translateX(0)" },
			];
	}
}

// Owns the finite illustration playback lifecycle; it never changes lesson data.
export function useLessonInfographicMotion(subject: string) {
	const ref = useRef<SVGSVGElement>(null);
	useEffect(() => {
		const svg = ref.current;
		if (
			!svg ||
			typeof IntersectionObserver === "undefined" ||
			typeof svg.animate !== "function"
		)
			return;

		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
		const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
		const trigger = svg.closest(".curriculum-card-link") ?? svg;
		let visible = false;
		let playedSubject: string | null = null;
		let generation = 0;
		let animations: Animation[] = [];

		const stop = () => {
			generation++;
			for (const animation of animations) animation.cancel();
			animations = [];
			svg.dataset.motionState = reducedMotion.matches ? "reduced" : "idle";
		};
		const play = () => {
			if (
				!visible ||
				document.hidden ||
				reducedMotion.matches ||
				animations.length
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
						duration,
						delay,
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
			playedSubject = subject;
			svg.dataset.motionState = "playing";
			void Promise.allSettled(
				animations.map((animation) => animation.finished),
			).then(() => {
				if (generation !== run) return;
				animations = [];
				svg.dataset.motionState = "idle";
			});
		};
		const observer = new IntersectionObserver(
			([entry]) => {
				visible = !!entry?.isIntersecting && entry.intersectionRatio >= 0.55;
				if (!visible) stop();
				else if (playedSubject !== subject) play();
			},
			{ threshold: [0, 0.55] },
		);
		const onPointerEnter = (event: Event) => {
			if (
				finePointer.matches &&
				(event as PointerEvent).pointerType === "mouse"
			)
				play();
		};
		const onVisibilityChange = () => {
			if (document.hidden) stop();
			else if (playedSubject !== subject) play();
		};
		const onMotionChange = () => {
			stop();
			if (playedSubject !== subject) play();
		};

		stop();
		observer.observe(svg);
		trigger.addEventListener("pointerenter", onPointerEnter);
		document.addEventListener("visibilitychange", onVisibilityChange);
		reducedMotion.addEventListener("change", onMotionChange);
		return () => {
			observer.disconnect();
			trigger.removeEventListener("pointerenter", onPointerEnter);
			document.removeEventListener("visibilitychange", onVisibilityChange);
			reducedMotion.removeEventListener("change", onMotionChange);
			stop();
		};
	}, [subject]);
	return ref;
}
