import { ProgressCircle } from "@heroui/react/progress-circle";
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

	return (
		<ProgressCircle.Root
			value={percentage}
			aria-label={label}
			className={cn("circular-progress", className)}
		>
			<ProgressCircle.Track>
				<ProgressCircle.TrackCircle className="circular-progress-track" />
				<ProgressCircle.FillCircle className="circular-progress-value" />
			</ProgressCircle.Track>
			<span aria-hidden="true">
				{Math.round(percentage)}
				<small>%</small>
			</span>
		</ProgressCircle.Root>
	);
}
