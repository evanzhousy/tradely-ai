import { Progress } from "@tradely/ui/components/progress";
import { t } from "@/i18n/ui";
import { useLocale } from "@/i18n/use-locale";

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
	const locale = useLocale();
	return (
		<section
			className="flex flex-col gap-2"
			aria-label={t(locale, "lessonsCompleted", { completed, total })}
		>
			<div className="flex items-center justify-between gap-4 text-sm">
				<span className="font-medium">{t(locale, "courseProgress")}</span>
				<span className="font-mono text-muted-foreground text-xs">
					{completed}/{total} · {percentage}%
				</span>
			</div>
			<Progress value={percentage} className={compact ? "h-2" : undefined} />
		</section>
	);
}
