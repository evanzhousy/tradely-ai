import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@tradely/ui/components/badge";
import { buttonVariants } from "@tradely/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import { ArrowRightIcon } from "lucide-react";
import { useBillingStatusAnalytics } from "@/analytics/billing-status";
import { CourseProgress } from "@/components/course-progress";
import { LandingCurriculum } from "@/components/landing-curriculum";
import { getFreeLessons } from "@/content/course";
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
		: freeLessons[0];
	return (
		<main className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
			<section className="grid items-end gap-8 lg:grid-cols-[1fr_360px]">
				<div className="flex max-w-3xl flex-col gap-5">
					<div className="flex flex-wrap gap-2">
						<Badge>{t("course.practiceBadge")}</Badge>
						<Badge variant="secondary">
							{t("course.freeLessons", {
								count: freeLessons.length,
							})}
						</Badge>
					</div>
					<h1 className="font-semibold text-5xl text-display sm:text-6xl">
						{course.title}
					</h1>
					<p className="max-w-[68ch] text-lg text-muted-foreground leading-8">
						{course.description}
					</p>
					{startLesson ? (
						<Link
							to="/learn/$lessonSlug"
							params={{ lessonSlug: startLesson.slug }}
							className={buttonVariants({ size: "lg" })}
						>
							{t(
								progress.canAccessPaid
									? "common.startLessonOne"
									: "home.startFree",
							)}
							<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
						</Link>
					) : null}
				</div>
				<Card size="sm">
					<CardHeader>
						<CardTitle>{t("course.yourProgress")}</CardTitle>
						<CardDescription>
							{progress.signedIn
								? t("progress.accountCurrent")
								: t("progress.signInToRecord")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<CourseProgress
							completed={progress.completed}
							total={progress.total}
							percentage={progress.percentage}
						/>
						<p className="mt-3 text-muted-foreground text-xs">
							{locale === "zh"
								? "旧课完成记录已保留。新增课程会扩大总课数，不代表旧记录丢失。"
								: "Earlier completions are retained. Added lessons expand the total; they do not erase completed work."}
						</p>
					</CardContent>
				</Card>
			</section>

			<nav
				className="flex flex-wrap gap-2"
				aria-label={locale === "zh" ? "跳至模块" : "Jump to module"}
			>
				{courseModules.map((module) => (
					<a
						key={module.id}
						className={buttonVariants({ variant: "outline", size: "sm" })}
						href={`#module-${module.id}`}
					>
						{module[locale]}
					</a>
				))}
			</nav>
			<p className="text-muted-foreground text-sm">
				{locale === "zh"
					? "核心路径：合约 → 成交 → 成交流 → 比较研究 → 研究产出。定价与模型、组合为扩展路径。先修提示是学习建议，不新增访问锁。"
					: "Core path: contracts → execution → flow → research → written output. Pricing/models and portfolios form deeper branches. Prerequisites guide learning; they do not add access locks."}
			</p>
			<LandingCurriculum
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
