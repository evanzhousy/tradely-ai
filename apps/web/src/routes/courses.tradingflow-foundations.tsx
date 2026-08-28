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
import { useEffect } from "react";

import { useAnalytics } from "@/analytics/context";
import { CourseList } from "@/components/course-list";
import { CourseProgress } from "@/components/course-progress";
import { getLocalizedCourse } from "@/i18n/course";
import { useI18n } from "@/i18n/provider";
import { getCourseProgress } from "@/server/progress";

export const Route = createFileRoute("/courses/tradingflow-foundations")({
	loader: () => getCourseProgress(),
	head: () => ({
		links: [
			{
				rel: "canonical",
				href: "https://tradely.ai/courses/tradingflow-foundations",
			},
		],
		meta: [
			{ title: "Evidence-Led Options Research — Tradely" },
			{
				name: "description",
				content:
					"An ordered options-research course with progress tracking and official TradingFlow practice tasks.",
			},
		],
	}),
	component: CoursePage,
});

function CoursePage() {
	const progress = Route.useLoaderData();
	const { locale, t } = useI18n();
	const { capture } = useAnalytics();
	const course = getLocalizedCourse(locale);
	useEffect(() => {
		if (progress.accessUnavailable) {
			capture("billing_status_unavailable", { surface: "course_progress" });
		}
	}, [capture, progress.accessUnavailable]);
	return (
		<main className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
			<section className="grid items-end gap-8 lg:grid-cols-[1fr_360px]">
				<div className="flex max-w-3xl flex-col gap-5">
					<div className="flex flex-wrap gap-2">
						<Badge>{t("course.practiceBadge")}</Badge>
						<Badge variant="secondary">
							{t("course.freeLessons", {
								count: course.lessons.filter(
									(lesson) => lesson.access === "preview",
								).length,
							})}
						</Badge>
					</div>
					<h1 className="font-semibold text-5xl text-display sm:text-6xl">
						{course.title}
					</h1>
					<p className="max-w-[68ch] text-lg text-muted-foreground leading-8">
						{course.description}
					</p>
					<Link
						to="/learn/$lessonSlug"
						params={{ lessonSlug: "audited-boundary" }}
						className={buttonVariants({ size: "lg" })}
					>
						{t("common.startLessonOne")}
						<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
					</Link>
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
					</CardContent>
				</Card>
			</section>

			<Card>
				<CardHeader>
					<CardTitle>{t("course.curriculum")}</CardTitle>
					<CardDescription>{t("course.curriculumDescription")}</CardDescription>
				</CardHeader>
				<CardContent className="-mx-2">
					<CourseList
						lessons={course.lessons}
						completedIds={progress.records
							.filter((record) => record.completedAt)
							.map((record) => record.lessonId)}
						canAccessPaid={progress.canAccessPaid}
						accessUnavailable={progress.accessUnavailable}
					/>
				</CardContent>
			</Card>
		</main>
	);
}
