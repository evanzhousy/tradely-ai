// Adapted from Magic UI's Animated Circular Progress Bar on 21st.dev.
// See docs/21st-components.md for provenance and accessibility adaptations.
import { cn } from "@tradely/ui/lib/utils";

export function CircularProgress({
	value,
	label,
	className,
}: {
	value: number;
	label: string;
	className?: string;
}) {
	const percentage = Number.isFinite(value)
		? Math.max(0, Math.min(100, value))
		: 0;
	const circumference = 2 * Math.PI * 45;
	return (
		<div
			className={cn("circular-progress", className)}
			role="progressbar"
			aria-label={label}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={percentage}
		>
			<svg aria-hidden="true" viewBox="0 0 100 100" fill="none">
				<circle
					cx="50"
					cy="50"
					r="45"
					strokeWidth="5"
					className="circular-progress-track"
				/>
				<circle
					cx="50"
					cy="50"
					r="45"
					strokeWidth="5"
					strokeLinecap={percentage > 0 ? "round" : "butt"}
					strokeDasharray={circumference}
					strokeDashoffset={circumference * (1 - percentage / 100)}
					transform="rotate(-90 50 50)"
					className="circular-progress-value"
				/>
			</svg>
			<span aria-hidden="true">
				{Math.round(percentage)}
				<small>%</small>
			</span>
		</div>
	);
}
