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
