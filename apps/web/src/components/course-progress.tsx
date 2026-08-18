import { Progress } from "@tradely/ui/components/progress";

export function CourseProgress({
	completed,
	total,
	percentage,
	compact = false,
}: {
	completed: number;
	total: number;
	percentage: number;
	compact?: boolean;
}) {
	return (
		<section
			className="flex flex-col gap-2"
			aria-label={`${completed} of ${total} lessons completed`}
		>
			<div className="flex items-center justify-between gap-4 text-sm">
				<span className="font-medium">Course progress</span>
				<span className="font-mono text-muted-foreground text-xs">
					{completed}/{total} · {percentage}%
				</span>
			</div>
			<Progress value={percentage} className={compact ? "h-2" : undefined} />
		</section>
	);
}
