import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@tradely/ui/components/badge";
import { InteractiveHoverLink } from "@tradely/ui/components/interactive-hover-button";
import { BrandOwl } from "@/components/brand-owl";
import { CourseCatalog } from "@/components/course-catalog";
import { CourseProgress } from "@/components/course-progress";
import { PageIntro } from "@/components/page-intro";
import { TradingFlowLabs } from "@/components/tradingflow-lab";
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
	const course = getLocalizedCourse(locale);
	const freeLessons = course.lessons;
	const studiedIds = new Set(
		progress.records
			.filter((record) => record.completedAt)
			.map((record) => record.lessonId),
	);
	const nextUnstudied = course.lessons.find(
		(lesson) => !studiedIds.has(lesson.id),
	);
	const startLesson = nextUnstudied ?? course.lessons[0];
	const coreLessonCount = course.lessons.filter(
		(lesson) =>
			courseModules.find((module) => module.id === lesson.moduleId)?.path ===
			"core",
	).length;
	const continuing =
		!progress.unavailable &&
		progress.signedIn &&
		studiedIds.size > 0 &&
		Boolean(nextUnstudied);
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
							learning={progress.learning}
							unavailable={progress.unavailable}
							completed={progress.completed}
							total={progress.total}
							percentage={progress.percentage}
						/>
						{progress.unavailable ? null : (
							<p className="text-muted-foreground text-xs leading-6">
								{progress.signedIn
									? t("progress.accountCurrent")
									: t("progress.signInToRecord")}
							</p>
						)}
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
							{continuing
								? locale === "zh"
									? "继续学习"
									: "Continue learning"
								: t("home.startFree")}
						</InteractiveHoverLink>
					) : null}
					{continuing ? (
						<span className="text-muted-foreground text-sm">
							{startLesson?.title}
						</span>
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
				</dl>
			</PageIntro>
			<div className="flex flex-col gap-2 text-muted-foreground text-sm">
				<p>
					{locale === "zh"
						? `核心路径（第 1–${coreLessonCount} 课）：合约 → 成交 → 成交流 → 比较研究 → 研究产出。之后是两个可按任意顺序学习的深入分支：希腊值、波动率与市场结构，以及投资组合。先修提示是学习建议，不新增访问锁。`
						: `Core path (lessons 1–${coreLessonCount}): contracts → execution → flow → research → written output. Then two deeper branches, in either order: Greeks, volatility and market structure, and portfolios. Prerequisites guide learning; they do not add access locks.`}
				</p>
				<p>
					{locale === "zh"
						? "本课程教你读懂并核实期权数据，不告诉你该做哪笔交易或承担多少风险。"
						: "This course teaches you to read and check options data. It does not tell you which trades to place or how much to risk."}
				</p>
			</div>
			<CourseCatalog
				learning={progress.learning}
				groupByModule
				caption={t("course.curriculumDescription")}
				lessons={course.lessons}
				completedIds={progress.records
					.filter((record) => record.completedAt)
					.map((record) => record.lessonId)}
			/>
			<TradingFlowLabs />
		</main>
	);
}
