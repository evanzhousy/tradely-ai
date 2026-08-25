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
import { cn } from "@tradely/ui/lib/utils";
import { ArrowRightIcon } from "lucide-react";

import { CourseList } from "@/components/course-list";
import { CourseProgress } from "@/components/course-progress";
import { completedLessonIds, getResumeLesson } from "@/domain/progress";
import { localizeCourse } from "@/i18n/catalog";
import { t } from "@/i18n/ui";
import { useLocale } from "@/i18n/use-locale";
import { getCourseProgress } from "@/server/progress";

export const Route = createFileRoute("/courses/tradingflow-foundations")({
	loader: () => getCourseProgress(),
	head: () => ({
		meta: [
			{ title: `${localizeCourse("en").title} — Tradely` },
			{
				name: "description",
				content: t("en", "metaCourseDescription"),
			},
		],
	}),
	component: CoursePage,
});

function CoursePage() {
	const locale = useLocale();
	const course = localizeCourse(locale);
	const progress = Route.useLoaderData();
	const completedIds = completedLessonIds(progress.records);
	const resumeLesson = getResumeLesson(course.lessons, completedIds);
	const finished =
		progress.completed > 0 && progress.completed === progress.total;
	const started = progress.completed > 0;
	const previewCount = course.lessons.filter(
		(lesson) => lesson.access === "preview",
	).length;
	const ctaLabel = finished
		? t(locale, "ctaReview")
		: started
			? t(locale, "ctaContinue")
			: t(locale, "ctaStartLessonOne");
	return (
		<main className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
			<section className="grid items-end gap-8 lg:grid-cols-[1fr_360px]">
				<div className="flex max-w-3xl flex-col gap-5">
					<div className="flex flex-wrap gap-2">
						<Badge>{t(locale, "practiceCourse")}</Badge>
						<Badge variant="secondary">
							{t(locale, "freeLessons", { n: previewCount })}
						</Badge>
					</div>
					<h1 className="font-semibold text-5xl text-display sm:text-6xl">
						{course.title}
					</h1>
					<p className="max-w-[68ch] text-lg text-muted-foreground leading-8">
						{course.description}
					</p>
					{resumeLesson ? (
						<Link
							to="/learn/$lessonSlug"
							params={{ lessonSlug: resumeLesson.slug }}
							className={cn(buttonVariants({ size: "lg" }), "self-start")}
						>
							{ctaLabel}
							<ArrowRightIcon data-icon="inline-end" />
						</Link>
					) : null}
				</div>
				<Card size="sm">
					<CardHeader>
						<CardTitle>{t(locale, "courseProgressTitle")}</CardTitle>
						<CardDescription>
							{progress.signedIn
								? t(locale, "accountProgressCurrent")
								: t(locale, "signInToRecord")}
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
					<CardTitle>{t(locale, "curriculum")}</CardTitle>
					<CardDescription>
						{t(locale, "curriculumDescription")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<CourseList
						lessons={course.lessons}
						completedIds={completedIds}
						canAccessPaid={progress.canAccessPaid}
						accessUnavailable={progress.accessUnavailable}
					/>
				</CardContent>
			</Card>
		</main>
	);
}
