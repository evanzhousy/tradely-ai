import { Button } from "@tradely/ui/components/button";
import { CircularProgress } from "@tradely/ui/components/circular-progress";
import { Progress } from "@tradely/ui/components/progress";
import type { CourseEvidenceProgress } from "@/domain/learning-progress";
import { useI18n } from "@/i18n/provider";

export function CourseProgress({
	completed,
	total,
	percentage,
	compact = false,
	unavailable = false,
	pending = false,
	onRetry,
}: {
	completed: number;
	total: number;
	percentage: number;
	compact?: boolean;
	unavailable?: boolean;
	pending?: boolean;
	onRetry?: () => void;
	learning?: CourseEvidenceProgress;
}) {
	const { t, locale } = useI18n();
	if (pending || unavailable)
		return (
			<div
				className="flex min-h-14 flex-col items-start gap-1 text-muted-foreground text-sm"
				aria-busy={pending}
			>
				<p role="status">
					{pending
						? locale === "zh"
							? "正在加载进度…"
							: "Loading progress…"
						: t("complete.unavailable")}
				</p>
				{!pending && onRetry ? (
					<Button variant="ghost" size="sm" onClick={onRetry}>
						{t("common.retry")}
					</Button>
				) : null}
			</div>
		);
	if (!compact)
		return (
			<section
				className="flex flex-col gap-4"
				aria-label={t("progress.completedLabel", { completed, total })}
			>
				<div className="course-progress-summary">
					<CircularProgress value={percentage} label={t("progress.course")} />
					<div className="flex min-h-14 flex-col gap-2">
						<p className="font-medium text-sm">{t("progress.course")}</p>
						<p className="font-mono text-muted-foreground text-xs">
							{completed} / {total} {t("common.completed")}
						</p>
					</div>
				</div>
			</section>
		);
	return (
		<section
			className="flex min-h-14 flex-col gap-2"
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
