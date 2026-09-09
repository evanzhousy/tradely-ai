import { CircularProgress } from "@tradely/ui/components/circular-progress";
import { Progress } from "@tradely/ui/components/progress";

import { useI18n } from "@/i18n/provider";

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
	const { t } = useI18n();
	if (!compact)
		return (
			<section
				className="course-progress-summary"
				aria-label={t("progress.completedLabel", { completed, total })}
			>
				<CircularProgress value={percentage} label={t("progress.course")} />
				<div className="flex flex-col gap-2">
					<p className="font-medium text-sm">{t("progress.course")}</p>
					<p className="font-mono text-muted-foreground text-xs">
						{completed} / {total} {t("common.completed")}
					</p>
				</div>
			</section>
		);
	return (
		<section
			className="flex flex-col gap-2"
			aria-label={t("progress.completedLabel", { completed, total })}
		>
			<div className="flex items-center justify-between gap-4 text-sm">
				<span className="font-medium">{t("progress.course")}</span>
				<span className="font-mono text-muted-foreground text-xs">
					{completed}/{total} · {percentage}%
				</span>
			</div>
			<Progress
				value={percentage}
				aria-label={t("progress.course")}
				className={compact ? "h-2" : undefined}
			/>
		</section>
	);
}
