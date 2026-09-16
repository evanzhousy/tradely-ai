import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/messages";
import type { VisualStep } from "./visual-step";

/** Owns the step clock so display ticks never rerender the lesson diagrams. */
export function VisualPlaybackProgress({
	locale,
	currentStep,
	step,
	running,
	exploring,
	reduced,
	complete,
	onElapsed,
}: {
	locale: Locale;
	currentStep: VisualStep;
	step: number;
	running: boolean;
	exploring: boolean;
	reduced: boolean;
	complete: boolean;
	onElapsed: () => void;
}) {
	const elapsed = useRef(0);
	const [displayElapsed, setDisplayElapsed] = useState(0);
	const duration = currentStep.holdMs;
	useEffect(() => {
		if (!running || exploring || reduced || complete) return;
		const started = performance.now();
		const previous = elapsed.current;
		let finished = false;
		const tick = () => {
			elapsed.current = Math.min(
				duration,
				previous + performance.now() - started,
			);
			setDisplayElapsed(elapsed.current);
			if (elapsed.current >= duration && !finished) {
				finished = true;
				onElapsed();
			}
		};
		const timer = window.setInterval(tick, 100);
		return () => {
			window.clearInterval(timer);
			elapsed.current = Math.min(
				duration,
				previous + performance.now() - started,
			);
			setDisplayElapsed(elapsed.current);
		};
	}, [running, exploring, reduced, complete, duration, onElapsed]);
	const value = complete ? duration : Math.min(duration, displayElapsed);
	const seconds = Math.ceil(Math.max(0, duration - value) / 1000);
	const zh = locale === "zh";
	const status = exploring
		? zh
			? "自由探索中"
			: "Free exploration"
		: reduced
			? zh
				? "手动讲解"
				: "Manual step"
			: complete
				? zh
					? "本步完成"
					: "Step complete"
				: running
					? zh
						? `本步剩余约 ${seconds} 秒`
						: `This step: ~${seconds}s left`
					: zh
						? `已暂停 · 本步约 ${seconds} 秒`
						: `Paused · ~${seconds}s left`;
	return (
		<div className="visual-playback-progress" data-complete={complete}>
			<span className="visual-playback-status">{status}</span>
			{!exploring && !reduced && (
				<progress
					max={duration}
					value={value}
					aria-label={zh ? `第 ${step} 步讲解进度` : `Step ${step} progress`}
					aria-valuetext={status}
				/>
			)}
		</div>
	);
}
