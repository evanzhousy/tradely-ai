import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@tradely/ui/components/accordion";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Badge } from "@tradely/ui/components/badge";
import { buttonVariants } from "@tradely/ui/components/button";
import { Separator } from "@tradely/ui/components/separator";
import { cn } from "@tradely/ui/lib/utils";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	Clock3Icon,
	VideoOffIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { AccessPanel } from "@/components/access-panel";
import { CompleteLessonButton } from "@/components/complete-lesson-button";
import { CourseList } from "@/components/course-list";
import { CourseProgress } from "@/components/course-progress";
import { PracticeCard } from "@/components/practice-card";
import { LessonVideo } from "@/components/video-player";
import { getLesson, getNextLesson, getPreviousLesson } from "@/content/course";
import { completedLessonIds } from "@/domain/progress";
import { localizeCourse, localizeLesson } from "@/i18n/catalog";
import { categoryLabel, t } from "@/i18n/ui";
import { useLocale } from "@/i18n/use-locale";
import { getLessonPageData } from "@/server/lesson";
import { getCourseProgress } from "@/server/progress";

export const Route = createFileRoute("/learn/$lessonSlug")({
	loader: async ({ params }) => {
		const [page, progress] = await Promise.all([
			getLessonPageData({ data: { slug: params.lessonSlug } }),
			getCourseProgress(),
		]);
		if (!page.found) throw notFound();
		return { page, progress };
	},
	head: ({ params }) => {
		const lesson = getLesson(params.lessonSlug);
		return {
			meta: [
				{
					title: lesson
						? `${lesson.title} — Tradely`
						: `${t("en", "lessonNotFound")} — Tradely`,
				},
			],
		};
	},
	component: LessonPage,
});

function LessonPage() {
	const locale = useLocale();
	const course = localizeCourse(locale);
	const { lessonSlug } = Route.useParams();
	const { page, progress } = Route.useLoaderData();
	const sourceLesson = getLesson(lessonSlug);
	const lesson = sourceLesson
		? localizeLesson(sourceLesson, locale)
		: undefined;
	if (!lesson || !page.found) {
		return (
			<main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center gap-4 px-4">
				<h1 className="font-semibold text-3xl">
					{t(locale, "lessonNotFound")}
				</h1>
				<Link
					to="/courses/tradingflow-foundations"
					className={buttonVariants({ variant: "outline" })}
				>
					{t(locale, "returnToCourse")}
				</Link>
			</main>
		);
	}

	const completedIds = completedLessonIds(progress.records);
	const lessonProgress = progress.records.find(
		(record) => record.lessonId === lesson.id,
	);
	const initialPositionSeconds =
		lessonProgress?.contentVersion === lesson.contentVersion
			? (lessonProgress.lastPositionSeconds ?? 0)
			: 0;
	const previous = getPreviousLesson(lesson.slug);
	const next = getNextLesson(lesson.slug);
	const previousView = previous ? localizeLesson(previous, locale) : undefined;
	const nextView = next ? localizeLesson(next, locale) : undefined;

	return (
		<main className="mx-auto grid w-full max-w-[1480px] gap-0 lg:grid-cols-[330px_1fr]">
			<aside className="hidden min-h-[calc(100svh-4rem)] border-border/60 border-r px-4 py-8 lg:block">
				<div className="sticky top-24 flex flex-col gap-6">
					<CourseProgress
						completed={progress.completed}
						total={progress.total}
						percentage={progress.percentage}
						compact
					/>
					<div className="max-h-[calc(100svh-12rem)] overflow-y-auto pr-1">
						<CourseList
							lessons={course.lessons}
							completedIds={completedIds}
							currentLessonId={lesson.id}
							canAccessPaid={page.canAccessPaid}
							accessUnavailable={progress.accessUnavailable}
							compact
						/>
					</div>
				</div>
			</aside>

			<div className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10 xl:px-16">
				<div className="mx-auto flex max-w-[920px] flex-col gap-8">
					<Accordion className="lg:hidden">
						<AccordionItem value="course-navigation">
							<AccordionTrigger>
								{t(locale, "courseNav", { percent: progress.percentage })}
							</AccordionTrigger>
							<AccordionContent>
								<div className="flex flex-col gap-5 py-2">
									<CourseProgress
										completed={progress.completed}
										total={progress.total}
										percentage={progress.percentage}
										compact
									/>
									<CourseList
										lessons={course.lessons}
										completedIds={completedIds}
										currentLessonId={lesson.id}
										canAccessPaid={page.canAccessPaid}
										accessUnavailable={progress.accessUnavailable}
										compact
									/>
								</div>
							</AccordionContent>
						</AccordionItem>
					</Accordion>

					<header className="flex flex-col gap-5">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">
								{t(locale, "lessonIndex", {
									n: lesson.order + 1,
									total: course.lessons.length,
								})}
							</Badge>
							<Badge
								variant={lesson.access === "preview" ? "secondary" : "outline"}
							>
								{lesson.access === "preview"
									? t(locale, "freePreview")
									: t(locale, "membership")}
							</Badge>
							<span className="inline-flex items-center gap-1.5 font-mono text-muted-foreground text-xs">
								<Clock3Icon className="size-3.5" />{" "}
								{t(locale, "minutes", { n: lesson.minutes })}
							</span>
						</div>
						<div className="flex flex-col gap-3">
							<p className="font-medium text-primary text-sm">
								{categoryLabel(locale, lesson.category)}
							</p>
							<h1 className="font-semibold text-4xl text-display sm:text-5xl">
								{lesson.title}
							</h1>
							<p className="max-w-[68ch] text-lg text-muted-foreground leading-8">
								{lesson.summary}
							</p>
						</div>
					</header>

					{page.access.allowed ? (
						<>
							{page.media ? (
								<LessonVideo
									lesson={lesson}
									media={page.media}
									initialPositionSeconds={initialPositionSeconds}
								/>
							) : (
								<Alert>
									<VideoOffIcon />
									<AlertTitle>{t(locale, "videoUnavailableTitle")}</AlertTitle>
									<AlertDescription>
										{t(locale, "videoUnavailableBody")}
									</AlertDescription>
								</Alert>
							)}
							<article className="lesson-prose max-w-[72ch]">
								<ReactMarkdown remarkPlugins={[remarkGfm]}>
									{page.body ?? ""}
								</ReactMarkdown>
							</article>
							<PracticeCard practice={lesson.practice} />
							<div className="flex flex-col gap-5">
								<CompleteLessonButton lesson={lesson} />
								<Separator />
								<nav
									className="flex items-center justify-between gap-4"
									aria-label={t(locale, "lessonNav")}
								>
									{previousView ? (
										<Link
											to="/learn/$lessonSlug"
											params={{ lessonSlug: previousView.slug }}
											className={buttonVariants({ variant: "ghost" })}
										>
											<ArrowLeftIcon data-icon="inline-start" />
											<span className="hidden sm:inline">
												{previousView.title}
											</span>
											<span className="sm:hidden">{t(locale, "previous")}</span>
										</Link>
									) : (
										<span />
									)}
									{nextView ? (
										<Link
											to="/learn/$lessonSlug"
											params={{ lessonSlug: nextView.slug }}
											className={cn(
												buttonVariants({ variant: "outline" }),
												"max-w-[55%]",
											)}
										>
											<span className="truncate">{nextView.title}</span>
											<ArrowRightIcon data-icon="inline-end" />
										</Link>
									) : null}
								</nav>
							</div>
						</>
					) : (
						<AccessPanel access={page.access} />
					)}
				</div>
			</div>
		</main>
	);
}
