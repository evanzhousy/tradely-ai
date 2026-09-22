// Adapted from Magic UI's Scroll Progress (21st community). No animation runtime needed.
import { Progress } from "@tradely/ui/components/progress";
import { type RefObject, useEffect, useState } from "react";

/** Article-local reading position; distinct from persisted lesson completion. */
export function ScrollProgress({
	target,
	label,
}: {
	target: RefObject<HTMLElement | null>;
	label: string;
}) {
	const [progress, setProgress] = useState(0);
	useEffect(() => {
		const article = target.current;
		if (!article) return;
		let frame = 0;
		const update = () => {
			frame = 0;
			const bounds = article.getBoundingClientRect();
			const distance = bounds.height - (window.innerHeight - 100);
			const progress =
				distance > 0
					? Math.min(1, Math.max(0, (100 - bounds.top) / distance))
					: 1;
			setProgress(progress * 100);
		};
		const schedule = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		const observer =
			typeof ResizeObserver === "undefined"
				? null
				: new ResizeObserver(schedule);
		observer?.observe(article);
		window.addEventListener("scroll", schedule, { passive: true });
		window.addEventListener("resize", schedule);
		update();
		return () => {
			cancelAnimationFrame(frame);
			observer?.disconnect();
			window.removeEventListener("scroll", schedule);
			window.removeEventListener("resize", schedule);
		};
	}, [target]);
	return (
		<Progress
			value={progress}
			aria-label={label}
			className="reading-progress"
		/>
	);
}
