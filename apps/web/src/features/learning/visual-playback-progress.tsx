import { type ReactNode, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/messages";
import type { VisualStep } from "./visual-step";

/** Owns the step clock so display ticks never rerender the lesson diagrams. */
export function VisualPlaybackProgress({
	locale,
	steps,
	step,
	running,
	exploring,
	reduced,
	complete,
	onElapsed,
	children,
}: {
	locale: Locale;
	steps: readonly VisualStep[];
	step: number;
	running: boolean;
	exploring: boolean;
	reduced: boolean;
	complete: boolean;
	onElapsed: () => void;
	children: ReactNode;
}) {
	const elapsed = useRef(0);
	const [displayElapsed, setDisplayElapsed] = useState(0);
	const duration = steps[step - 1].holdMs;
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
	const total = steps.reduce((sum, item) => sum + item.holdMs, 0);
	const before = steps
		.slice(0, step - 1)
		.reduce((sum, item) => sum + item.holdMs, 0);
	const value = complete ? total : before + Math.min(duration, displayElapsed);
	const seconds = Math.ceil(Math.max(0, total - value) / 1000);
	const zh = locale === "zh";
	const status = exploring
		? zh
			? "自由探索中"
			: "Free exploration"
		: reduced
			? zh
				? "手动讲解 · 按自己的节奏继续"
				: "Manual walkthrough · Continue at your pace"
			: complete
				? zh
					? "本段讲解完成"
					: "Explanation complete"
				: running
					? zh
						? `本段讲解还剩约 ${seconds} 秒`
						: `About ${seconds}s left in this explanation`
					: zh
						? `已暂停 · 还剩约 ${seconds} 秒`
						: `Paused · About ${seconds}s remaining`;
	return (
		<div className="visual-playback-progress" data-complete={complete}>
			<div className="visual-playback-status">
				<span>{status}</span>
				<span>
					{zh
						? `第 ${step} / ${steps.length} 步`
						: `Step ${step} / ${steps.length}`}
				</span>
			</div>
			{!exploring && !reduced && (
				<progress
					max={total}
					value={value}
					aria-label={zh ? "本段讲解进度" : "Explanation progress"}
					aria-valuetext={status}
				/>
			)}
			{complete && !exploring && children}
		</div>
	);
}
