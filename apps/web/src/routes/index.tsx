import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonVariants } from "@tradely/ui/components/button";
import { useEffect } from "react";
import { useAnalytics } from "@/analytics/context";
import { LandingCurriculumTable } from "@/components/landing-curriculum-table";
import { getLocalizedCourse } from "@/i18n/course";
import { useI18n } from "@/i18n/provider";
import { getCourseProgress } from "@/server/progress";

export const Route = createFileRoute("/")({
	loader: () => getCourseProgress(),
	head: () => ({
		links: [{ rel: "canonical", href: "https://tradely.ai/" }],
	}),
	component: HomeComponent,
});

function HomeComponent() {
	const progress = Route.useLoaderData();
	const { locale, t } = useI18n();
	const { capture } = useAnalytics();
	const course = getLocalizedCourse(locale);
	const startLesson = course.lessons[0];
	const totalMinutes = course.lessons.reduce(
		(sum, lesson) => sum + lesson.minutes,
		0,
	);
	const previewCount = course.lessons.filter(
		(lesson) => lesson.access === "preview",
	).length;
	useEffect(() => {
		if (progress.accessUnavailable) {
			capture("billing_status_unavailable", { surface: "course_progress" });
		}
	}, [capture, progress.accessUnavailable]);
	return (
		<main>
			<section className="desk-opening mx-auto max-w-[1480px] px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
				<div className="desk-opening-claim flex flex-col gap-5">
					<h1 className="max-w-[15ch] font-semibold text-5xl text-display sm:text-6xl lg:text-7xl">
						{t("home.heroTitle")}
					</h1>
					<p className="max-w-[68ch] text-lg text-muted-foreground leading-8">
						{t("home.heroDescription")}
					</p>
					{startLesson ? (
						<Link
							to="/learn/$lessonSlug"
							params={{ lessonSlug: startLesson.slug }}
							className={buttonVariants({
								size: "lg",
								className: "self-start",
							})}
						>
							{t("common.startLearning")}
						</Link>
					) : null}
				</div>
				<div className="desk-opening-proof">
					<div className="desk-stat-strip">
						<div className="desk-stat">
							<p className="desk-stat-label">{t("home.statLessons")}</p>
							<p className="desk-stat-value">{course.lessons.length}</p>
							<p className="desk-stat-detail">{t("home.partnerHeading")}</p>
						</div>
						<div className="desk-stat">
							<p className="desk-stat-label">{t("home.statMinutes")}</p>
							<p className="desk-stat-value">{totalMinutes}</p>
							<p className="desk-stat-detail">{course.title}</p>
						</div>
						<div className="desk-stat">
							<p className="desk-stat-label">{t("home.statPreview")}</p>
							<p className="desk-stat-value">{previewCount}</p>
							<p className="desk-stat-detail">{t("home.statPreviewDetail")}</p>
						</div>
						<div className="desk-stat">
							<p className="desk-stat-label">{t("home.statProgress")}</p>
							<p className="desk-stat-value">
								{progress.completed}/{progress.total}
							</p>
							<p className="desk-stat-detail">
								{progress.signedIn
									? t("progress.synced")
									: t("progress.signInToSync")}
							</p>
						</div>
					</div>
				</div>
				<p className="desk-opening-context text-muted-foreground text-sm leading-6">
					{t("home.partnerDisclosure")}
				</p>
			</section>

			<section className="mx-auto max-w-[1480px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
				<h2 className="font-semibold text-3xl text-display sm:text-4xl">
					{t("home.curriculumHeading")}
				</h2>
				<p className="mt-3 max-w-[68ch] text-muted-foreground leading-7">
					{t("home.courseDescription")}
				</p>
				<div className="mt-8">
					<LandingCurriculumTable
						lessons={course.lessons}
						completedIds={progress.records
							.filter((record) => record.completedAt)
							.map((record) => record.lessonId)}
						canAccessPaid={progress.canAccessPaid}
						accessUnavailable={progress.accessUnavailable}
						caption={t("progress.completedLabel", {
							completed: progress.completed,
							total: progress.total,
						})}
					/>
				</div>
			</section>
		</main>
	);
}
