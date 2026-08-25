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
import {
	HeroStats,
	HubLoop,
	IntersectMark,
	ProductSplit,
	StageLegend,
	WorkflowPath,
} from "@/components/landing-graphics";
import { PracticeCard } from "@/components/practice-card";
import {
	getOpeningLesson,
	getPublicLessonMedia,
	groupLessonsByCategory,
} from "@/content/course";
import { completedLessonIds, getResumeLesson } from "@/domain/progress";
import { localizeCourse, localizeLesson } from "@/i18n/catalog";
import type { Locale } from "@/i18n/locale";
import { categoryLabel, t } from "@/i18n/ui";
import { useLocale } from "@/i18n/use-locale";
import { getCourseProgress } from "@/server/progress";

export const Route = createFileRoute("/")({
	loader: () => getCourseProgress(),
	component: HomeComponent,
});

const sourceOpening = getOpeningLesson();
const openingMedia = getPublicLessonMedia(sourceOpening);

type HomeProgress = Awaited<ReturnType<typeof Route.useLoaderData>>;

function resumeState(progress: HomeProgress, locale: Locale) {
	const course = localizeCourse(locale);
	const openingLesson = localizeLesson(sourceOpening, locale);
	const completedIds = completedLessonIds(progress.records);
	const resumeLesson =
		getResumeLesson(course.lessons, completedIds) ?? openingLesson;
	const finished =
		progress.completed > 0 && progress.completed === progress.total;
	const started = progress.completed > 0;
	return {
		course,
		openingLesson,
		completedIds,
		resumeLesson,
		finished,
		started,
		ctaLabel: finished
			? t(locale, "ctaReview")
			: started
				? t(locale, "ctaContinue")
				: t(locale, "ctaStart"),
	};
}

function HomeComponent() {
	const locale = useLocale();
	const progress = Route.useLoaderData();
	const resume = resumeState(progress, locale);
	return (
		<main>
			<Hero locale={locale} resume={resume} />
			<HowTheHubWorks locale={locale} openingLesson={resume.openingLesson} />
			<Curriculum locale={locale} progress={progress} resume={resume} />
			<Membership locale={locale} progress={progress} resume={resume} />
		</main>
	);
}

function Hero({
	locale,
	resume,
}: {
	locale: Locale;
	resume: ReturnType<typeof resumeState>;
}) {
	const previewCount = resume.course.lessons.filter(
		(lesson) => lesson.access === "preview",
	).length;
	return (
		<section className="overflow-hidden border-border/60 border-b">
			<div className="mx-auto grid max-w-[1480px] items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-24">
				<div className="flex max-w-2xl flex-col items-start gap-7">
					<div className="flex flex-col items-start gap-3">
						<Badge variant="secondary">{resume.course.title}</Badge>
						<HeroStats
							lessonCount={resume.course.lessons.length}
							previewCount={previewCount}
						/>
					</div>
					<div className="flex flex-col gap-5">
						<h1
							className={`font-semibold text-5xl text-display sm:text-6xl lg:text-7xl ${locale === "zh-Hans" ? "max-w-[8em]" : "max-w-[12ch]"}`}
						>
							{t(locale, "heroTitle")}
						</h1>
						<p className="max-w-[62ch] text-lg text-muted-foreground leading-8">
							{t(locale, "heroBody")}
						</p>
					</div>
					<div className="flex flex-col items-start gap-2">
						<Link
							to="/learn/$lessonSlug"
							params={{ lessonSlug: resume.resumeLesson.slug }}
							className={buttonVariants({ size: "lg" })}
						>
							{resume.ctaLabel}
							<ArrowRightIcon data-icon="inline-end" />
						</Link>
						{resume.started && !resume.finished ? (
							<p className="text-muted-foreground text-sm">
								{t(locale, "nextLesson", {
									title: resume.resumeLesson.title,
								})}
							</p>
						) : null}
					</div>
				</div>

				<div className="overflow-hidden rounded-4xl bg-card shadow-xl ring-1 ring-foreground/8 dark:ring-foreground/12">
					<video
						controls
						playsInline
						preload="metadata"
						poster={openingMedia.poster}
						className="aspect-video w-full bg-black object-cover"
						aria-describedby="opening-lesson-copy"
					>
						<source src={openingMedia.video} type="video/mp4" />
						<track
							kind="captions"
							src={openingMedia.captions}
							srcLang="en"
							label="English"
							default
						/>
					</video>
					<div
						id="opening-lesson-copy"
						className="flex flex-col gap-1 px-5 py-4"
					>
						<p className="font-mono text-muted-foreground text-xs">
							{t(locale, "openingLessonMeta", {
								n: String(resume.openingLesson.order + 1).padStart(2, "0"),
								category: categoryLabel(locale, resume.openingLesson.category),
								access: t(locale, "free"),
							})}
						</p>
						<p className="font-medium">{resume.openingLesson.title}</p>
						<p className="text-muted-foreground text-sm">
							{resume.openingLesson.summary}
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}

function HowTheHubWorks({
	locale,
	openingLesson,
}: {
	locale: Locale;
	openingLesson: ReturnType<typeof resumeState>["openingLesson"];
}) {
	return (
		<section className="border-border/60 border-b">
			<div className="mx-auto flex max-w-[1280px] flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
				<div className="flex max-w-2xl flex-col gap-3">
					<p className="flex items-center gap-2 font-mono text-primary text-xs">
						<IntersectMark />
						{t(locale, "howKicker")}
					</p>
					<h2 className="font-semibold text-3xl text-display sm:text-4xl">
						{t(locale, "howTitle")}
					</h2>
				</div>

				<WorkflowPath />
				<HubLoop />
				<PracticeCard practice={openingLesson.practice} />
			</div>
		</section>
	);
}

function Curriculum({
	locale,
	progress,
	resume,
}: {
	locale: Locale;
	progress: HomeProgress;
	resume: ReturnType<typeof resumeState>;
}) {
	return (
		<section className="mx-auto grid max-w-[1280px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.38fr_0.62fr] lg:px-8 lg:py-24">
			<div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
				<div className="flex flex-col gap-5">
					<div className="flex flex-col gap-3">
						<p className="font-mono text-primary text-xs">
							{t(locale, "courseKicker")}
						</p>
						<h2 className="font-semibold text-3xl text-display sm:text-4xl">
							{t(locale, "courseFieldManual")}
						</h2>
					</div>
					<StageLegend groups={groupLessonsByCategory(resume.course.lessons)} />
				</div>
				<Card size="sm">
					<CardHeader>
						<CardTitle>{t(locale, "learningRecord")}</CardTitle>
						<CardDescription>
							{resume.finished
								? t(locale, "progressFinished")
								: resume.started
									? t(locale, "progressContinue", {
											title: resume.resumeLesson.title,
										})
									: progress.signedIn
										? t(locale, "progressStartSignedIn")
										: t(locale, "progressStartSignedOut")}
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
			</div>

			<Card className="[--card-spacing:--spacing(4)] sm:[--card-spacing:--spacing(5)]">
				<CardHeader>
					<CardTitle>{resume.course.title}</CardTitle>
					<CardDescription>{resume.course.description}</CardDescription>
				</CardHeader>
				<CardContent>
					<CourseList
						lessons={resume.course.lessons}
						completedIds={resume.completedIds}
						canAccessPaid={progress.canAccessPaid}
						accessUnavailable={progress.accessUnavailable}
					/>
				</CardContent>
			</Card>
		</section>
	);
}

function Membership({
	locale,
	progress,
	resume,
}: {
	locale: Locale;
	progress: HomeProgress;
	resume: ReturnType<typeof resumeState>;
}) {
	return (
		<section className="border-border/60 border-t bg-muted/35">
			<div className="mx-auto flex max-w-[1280px] flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
					<div className="flex flex-col gap-4">
						<Badge variant="secondary">
							{progress.canAccessPaid
								? t(locale, "membershipActive")
								: t(locale, "membershipBadge")}
						</Badge>
						<h2 className="max-w-[18ch] font-semibold text-3xl text-display sm:text-4xl">
							{progress.canAccessPaid
								? t(locale, "pathOpen")
								: t(locale, "pathKeepOpen")}
						</h2>
					</div>
					<div className="flex flex-col items-start gap-3">
						{progress.canAccessPaid ? (
							<Link
								to="/learn/$lessonSlug"
								params={{ lessonSlug: resume.resumeLesson.slug }}
								className={buttonVariants({ size: "lg" })}
							>
								{resume.ctaLabel}
								<ArrowRightIcon data-icon="inline-end" />
							</Link>
						) : (
							<div className="flex flex-col gap-3 sm:flex-row">
								<Link to="/pricing" className={buttonVariants({ size: "lg" })}>
									{t(locale, "ctaMembership")}
									<ArrowRightIcon data-icon="inline-end" />
								</Link>
								<Link
									to="/learn/$lessonSlug"
									params={{ lessonSlug: resume.openingLesson.slug }}
									className={cn(
										buttonVariants({ variant: "outline", size: "lg" }),
									)}
								>
									{t(locale, "ctaStartFree")}
								</Link>
							</div>
						)}
						<p className="text-muted-foreground text-xs">
							{t(locale, "noSellTradingFlow")}
						</p>
					</div>
				</div>
				<ProductSplit />
			</div>
		</section>
	);
}
