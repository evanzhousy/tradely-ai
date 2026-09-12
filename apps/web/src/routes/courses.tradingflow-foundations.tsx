import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@tradely/ui/components/badge";
import { InteractiveHoverLink } from "@tradely/ui/components/interactive-hover-button";
import { useBillingStatusAnalytics } from "@/analytics/billing-status";
import { BrandOwl } from "@/components/brand-owl";
import { CourseCatalog } from "@/components/course-catalog";
import { CourseProgress } from "@/components/course-progress";
import { PageIntro } from "@/components/page-intro";
import { getFreeLearningPath, getFreeLessons } from "@/content/course";
import { courseModules } from "@/content/syllabus";
import { getLocalizedCourse } from "@/i18n/course";
import { useI18n } from "@/i18n/provider";
import { pageHead } from "@/seo/pages";
import { getCourseProgress } from "@/server/progress";

export const Route = createFileRoute("/courses/tradingflow-foundations")({
	loader: () => getCourseProgress(),
	head: () => pageHead("/courses/tradingflow-foundations"),
	component: CoursePage,
});

function CoursePage() {
	const progress = Route.useLoaderData();
	const { locale, t } = useI18n();
	useBillingStatusAnalytics(progress.accessUnavailable, "course_progress");
	const course = getLocalizedCourse(locale);
	const freeLessons = getFreeLessons(course.lessons);
	const startLesson = progress.canAccessPaid
		? course.lessons[0]
		: getFreeLearningPath(course.lessons, "foundations")[0];
	return (
		<main className="page-shell">
			<PageIntro
				eyebrow={t("course.practiceBadge")}
				title={course.title}
				description={course.description}
				aside={
					<div className="course-progress-card">
						<div className="mb-5 flex items-center justify-between gap-3 font-medium text-sm">
							<BrandOwl pose="welcome" size={80} />
							{t("course.yourProgress")}
						</div>
						<CourseProgress
							completed={progress.completed}
							total={progress.total}
							percentage={progress.percentage}
						/>
						<p className="text-muted-foreground text-xs leading-6">
							{progress.signedIn
								? t("progress.accountCurrent")
								: t("progress.signInToRecord")}
						</p>
						<p className="text-muted-foreground text-xs leading-5">
							{locale === "zh"
								? "旧课完成记录已保留。新增课程会扩大总课数，不代表旧记录丢失。"
								: "Earlier completions are retained. Added lessons expand the total; they do not erase completed work."}
						</p>
					</div>
				}
			>
				<div className="flex flex-wrap items-center gap-4">
					{startLesson ? (
						<InteractiveHoverLink
							size="lg"
							render={
								<Link
									to="/learn/$lessonSlug"
									params={{ lessonSlug: startLesson.slug }}
								/>
							}
						>
							{t(
								progress.canAccessPaid
									? "common.startLessonOne"
									: "home.startFree",
							)}
						</InteractiveHoverLink>
					) : null}
					<Badge variant="secondary">
						{t("course.freeLessons", { count: freeLessons.length })}
					</Badge>
				</div>
				<dl className="course-facts">
					<div>
						<dt>{t("home.statLessons")}</dt>
						<dd>{course.lessons.length}</dd>
					</div>
					<div>
						<dt>{locale === "zh" ? "学习模块" : "Learning modules"}</dt>
						<dd>{courseModules.length}</dd>
					</div>
					<div>
						<dt>{t("home.statMinutes")}</dt>
						<dd>
							{course.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)}
						</dd>
					</div>
				</dl>
			</PageIntro>
			<p className="text-muted-foreground text-sm">
				{locale === "zh"
					? "核心路径：合约 → 成交 → 成交流 → 比较研究 → 研究产出。定价与模型、组合为扩展路径。先修提示是学习建议，不新增访问锁。"
					: "Core path: contracts → execution → flow → research → written output. Pricing/models and portfolios form deeper branches. Prerequisites guide learning; they do not add access locks."}
			</p>
			<CourseCatalog
				groupByModule
				caption={t("course.curriculumDescription")}
				lessons={course.lessons}
				completedIds={progress.records
					.filter((record) => record.completedAt)
					.map((record) => record.lessonId)}
				canAccessPaid={progress.canAccessPaid}
				accessUnavailable={progress.accessUnavailable}
			/>
		</main>
	);
}
