import { Badge } from "@tradely/ui/components/badge";
import {
	type CourseEvidenceProgress,
	independentChecksPassed,
	type LessonEvidenceProgress,
} from "@/domain/learning-progress";
import type { Locale } from "@/i18n/messages";

export function LearningProgressCounts({
	summary,
	locale,
}: {
	summary: CourseEvidenceProgress;
	locale: Locale;
}) {
	const lessonWord = (count: number) => (count === 1 ? "lesson" : "lessons");
	return (
		<section
			className="flex flex-col gap-2 text-sm"
			aria-label={locale === "zh" ? "练习证据" : "Practice evidence"}
		>
			<p>
				{summary.submitted}{" "}
				{locale === "zh"
					? "课已提交练习"
					: `${lessonWord(summary.submitted)} with practice submitted`}
			</p>
			<p>
				{summary.passed}{" "}
				{locale === "zh"
					? "课的最新独立检查通过"
					: `${lessonWord(summary.passed)} with latest independent checks passed`}
			</p>
			{summary.reviewNeeded > 0 ? (
				<p>
					{summary.reviewNeeded}{" "}
					{locale === "zh"
						? "课有文字待复核"
						: `${lessonWord(summary.reviewNeeded)} with written work needing review`}
				</p>
			) : null}
			{summary.earlier > 0 ? (
				<p>
					{summary.earlier}{" "}
					{locale === "zh"
						? "课保留旧版结果"
						: `${lessonWord(summary.earlier)} with earlier-version results preserved`}
				</p>
			) : null}
			<p className="text-muted-foreground text-xs">
				{locale === "zh"
					? "按每课当前版本最新提交的案例统计；学习标记单独记录。"
					: "Based on each lesson’s latest submitted case in the current edition. Study marks are separate."}
			</p>
		</section>
	);
}

export function LessonLearningStatus({
	evidence,
	locale,
}: {
	evidence?: LessonEvidenceProgress;
	locale: Locale;
}) {
	if (!evidence?.latest && !evidence?.earlier) return null;
	const result = evidence.latest?.result;
	return (
		<span className="flex flex-wrap items-center gap-2">
			{result ? (
				<>
					<Badge variant="secondary">
						{locale === "zh" ? "已提交练习" : "Practice submitted"}
					</Badge>
					{independentChecksPassed(result) ? (
						<Badge variant="outline">
							{locale === "zh" ? "独立检查通过" : "Independent checks passed"}
						</Badge>
					) : null}
					{result.usedHint ? (
						<Badge variant="outline">
							{locale === "zh" ? "使用过提示" : "Hint used"}
						</Badge>
					) : null}
					{result.unreviewed ? (
						<Badge variant="outline">
							{locale === "zh" ? "文字待复核" : "Written work needs review"}
						</Badge>
					) : null}
					{result.met < result.total - (result.unreviewed ?? 0) ? (
						<Badge variant="outline">
							{locale === "zh"
								? "仍有检查需重做"
								: "Some checks need another try"}
						</Badge>
					) : null}
				</>
			) : null}
			{evidence.earlier ? (
				<Badge variant="outline">
					{locale === "zh"
						? "旧版结果已保留"
						: "Earlier-version result preserved"}
				</Badge>
			) : null}
		</span>
	);
}
