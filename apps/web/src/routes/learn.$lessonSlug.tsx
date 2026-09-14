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
import { useCallback, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAnalytics } from "@/analytics/context";
import { authIsConfigured } from "@/auth/client";
import { CompleteLessonButton } from "@/components/complete-lesson-button";
import { CourseList } from "@/components/course-list";
import { CourseProgress } from "@/components/course-progress";
import { LessonLearningStatus } from "@/components/learning-progress";
import { LessonIntroduction } from "@/components/lesson-introduction";
import { LessonNavigation } from "@/components/lesson-navigation";
import { SignInLink } from "@/components/sign-in-link";
import {
	TradingFlowLab,
	TradingFlowLabIntro,
} from "@/components/tradingflow-lab";
import { LessonVideo } from "@/components/video-player";
import { getLesson, getNextLesson, getPreviousLesson } from "@/content/course";
import { guidesForLesson } from "@/content/guides";
import { parseLearningSearch } from "@/domain/guest-learning";
import { LearningExercise } from "@/features/learning/learning-exercise";
import { getLocalizedCourse, getLocalizedLesson } from "@/i18n/course";
import { useI18n } from "@/i18n/provider";
import { pageHead } from "@/seo/pages";
import { getLessonPageData } from "@/server/lesson";
import { getCourseProgress } from "@/server/progress";

export const Route = createFileRoute("/learn/$lessonSlug")({
	validateSearch: parseLearningSearch,
	loader: async ({ params }) => {
		const [page, progress] = await Promise.all([
			getLessonPageData({ data: { slug: params.lessonSlug } }),
			getCourseProgress(),
		]);
		if (!page.found) throw notFound();
		return { page, progress };
	},
	head: ({ params }) => pageHead(`/learn/${params.lessonSlug}`),
	component: LessonPage,
});

function LessonPage() {
	const { lessonSlug } = Route.useParams();
	const { attempt, saveGuest } = Route.useSearch();
	const navigate = Route.useNavigate();
	const selectAttempt = useCallback(
		(attemptId: string) => {
			void navigate({ search: { attempt: attemptId }, replace: true });
		},
		[navigate],
	);
	const { page, progress } = Route.useLoaderData();
	const sourceLesson = getLesson(lessonSlug);
	const { locale, t } = useI18n();
	const { capture, isCapturing } = useAnalytics();
	const trackedLessonRef = useRef<string | null>(null);
	const course = getLocalizedCourse(locale);
	const lesson = sourceLesson
		? getLocalizedLesson(sourceLesson, locale)
		: undefined;
	const accessState = page.found ? "allowed" : null;
	const mediaAvailable = Boolean(page.found && page.media);
	useEffect(() => {
		if (!isCapturing) {
			trackedLessonRef.current = null;
			return;
		}
		if (!sourceLesson || !accessState) return;
		if (trackedLessonRef.current === sourceLesson.id) return;
		if (
			capture("lesson_opened", {
				lesson_id: sourceLesson.id,
				lesson_order: sourceLesson.order + 1,
				access_tier: "free",
				access_state: accessState,
				media_available: mediaAvailable,
				locale,
			})
		) {
			trackedLessonRef.current = sourceLesson.id;
		}
	}, [accessState, capture, isCapturing, locale, mediaAvailable, sourceLesson]);
	if (!sourceLesson || !lesson || !page.found) {
		return (
			<main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center gap-4 px-4">
				<h1 className="font-semibold text-3xl">{t("common.notFound")}</h1>
				<Link
					to="/courses/tradingflow-foundations"
					className={buttonVariants({ variant: "outline" })}
				>
					{t("common.returnCourse")}
				</Link>
			</main>
		);
	}

	const completedIds = progress.records
		.filter((record) => record.completedAt)
		.map((record) => record.lessonId);
	const lessonProgress = progress.records.find(
		(record) => record.lessonId === sourceLesson.id,
	);
	const initialPositionSeconds =
		lessonProgress?.contentVersion === sourceLesson.contentVersion
			? (lessonProgress.lastPositionSeconds ?? 0)
			: 0;
	const previous = getPreviousLesson(sourceLesson.slug);
	const next = getNextLesson(sourceLesson.slug);
	const localizedPrevious = previous
		? getLocalizedLesson(previous, locale)
		: undefined;
	const localizedNext = next ? getLocalizedLesson(next, locale) : undefined;
	const earlierResult = progress.learning.lessons[lesson.id]?.earlier;

	return (
		<main className="lesson-shell mx-auto grid w-full max-w-[1480px] gap-0 lg:grid-cols-[330px_1fr]">
			<aside className="lesson-sidebar hidden min-h-[calc(100svh-4rem)] border-border/60 border-r px-4 py-8 lg:block">
				<div className="sticky top-24 flex flex-col gap-6">
					<CourseProgress
						learning={progress.learning}
						unavailable={progress.unavailable}
						completed={progress.completed}
						total={progress.total}
						percentage={progress.percentage}
						compact
					/>
					<div className="max-h-[calc(100svh-12rem)] overflow-y-auto pr-1">
						<CourseList
							learning={progress.learning}
							lessons={course.lessons}
							completedIds={completedIds}
							currentLessonId={lesson.id}
						/>
					</div>
				</div>
			</aside>

			<div className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10 xl:px-16">
				<div className="mx-auto flex max-w-[920px] flex-col gap-8">
					<LessonNavigation
						locale={locale}
						lessonId={lesson.id}
						lessonTitle={lesson.title}
					/>
					<Accordion className="lg:hidden">
						<AccordionItem value="course-navigation">
							<AccordionTrigger>
								{progress.unavailable
									? t("complete.unavailable")
									: t("lesson.courseNavigation", {
											percentage: progress.percentage,
										})}
							</AccordionTrigger>
							<AccordionContent>
								<div className="flex flex-col gap-5 py-2">
									<CourseProgress
										learning={progress.learning}
										unavailable={progress.unavailable}
										completed={progress.completed}
										total={progress.total}
										percentage={progress.percentage}
										compact
									/>
									<CourseList
										learning={progress.learning}
										lessons={course.lessons}
										completedIds={completedIds}
										currentLessonId={lesson.id}
									/>
								</div>
							</AccordionContent>
						</AccordionItem>
					</Accordion>

					<header className="lesson-heading flex flex-col gap-5">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">
								{t("common.lessonNumber", {
									current: lesson.order + 1,
									total: course.lessons.length,
								})}
							</Badge>
							<Badge variant="secondary">{t("common.free")}</Badge>
							<span className="inline-flex items-center gap-1.5 font-mono text-muted-foreground text-xs">
								<Clock3Icon className="size-3.5" aria-hidden="true" />{" "}
								{t("common.minutes", { minutes: lesson.minutes })}
							</span>
						</div>
						<div className="flex flex-col gap-3">
							<p className="font-medium text-foreground text-sm">
								{lesson.category}
							</p>
							<h1 className="font-semibold text-4xl text-display sm:text-5xl">
								{lesson.title}
							</h1>
							<p className="max-w-[68ch] text-lg text-muted-foreground leading-8">
								{lesson.summary}
							</p>
						</div>
					</header>
					<LessonIntroduction lessonId={lesson.id} locale={locale} />
					<LessonLearningStatus
						evidence={progress.learning.lessons[lesson.id]}
						locale={locale}
					/>
					{earlierResult ? (
						<a
							className="text-sm underline underline-offset-4"
							href={`/learn/${encodeURIComponent(lesson.id)}?attempt=${encodeURIComponent(earlierResult.attemptId)}`}
						>
							{locale === "zh"
								? "查看保留的旧版案例"
								: "View your preserved earlier case"}
						</a>
					) : null}
					<TradingFlowLabIntro lessonId={lesson.id} />

					{guidesForLesson(lesson.id).map((guide) => (
						<p key={guide.slug} lang="en" className="text-sm leading-6">
							Free background guide:{" "}
							<Link
								to="/guides/$guideSlug"
								params={{ guideSlug: guide.slug }}
								className="underline underline-offset-4"
							>
								{guide.title}
							</Link>
						</p>
					))}
					{lesson.prerequisites.length ? (
						<nav
							className="flex flex-wrap items-center gap-2 text-sm"
							aria-label={
								locale === "zh" ? "相关先修概念" : "Suggested prerequisites"
							}
						>
							<span className="text-muted-foreground">
								{locale === "zh" ? "先了解：" : "Build on:"}
							</span>
							{lesson.prerequisites.map((id) => {
								const item = course.lessons.find((item) => item.id === id);
								return item ? (
									<Link
										key={id}
										to="/learn/$lessonSlug"
										params={{ lessonSlug: item.slug }}
										className="underline underline-offset-4"
									>
										{item.title}
									</Link>
								) : null;
							})}
						</nav>
					) : null}
					{
						<>
							{page.learning ? (
								<LearningExercise
									key={sourceLesson.id}
									lessonId={sourceLesson.id}
									attemptId={attempt}
									saveGuest={saveGuest === "1"}
									onSelectAttempt={selectAttempt}
								/>
							) : null}
							<TradingFlowLab lessonId={lesson.id} />
							{page.media ? (
								<LessonVideo
									lesson={lesson}
									media={page.media}
									initialPositionSeconds={initialPositionSeconds}
								/>
							) : page.mediaUnavailable ? (
								<Alert>
									<VideoOffIcon aria-hidden="true" />
									<AlertTitle>{t("video.unavailableTitle")}</AlertTitle>
									<AlertDescription>
										{t("video.unavailableDescription")}
									</AlertDescription>
								</Alert>
							) : null}
							<details className="lesson-notes">
								<summary className="cursor-pointer font-medium">
									{locale === "zh"
										? "课程笔记与参考来源"
										: "Lesson notes and references"}
								</summary>
								<article
									className="lesson-prose max-w-[72ch]"
									aria-labelledby="written-lesson-title"
								>
									<h2 id="written-lesson-title" className="sr-only">
										{t("lesson.writtenLesson")}
									</h2>

									<ReactMarkdown remarkPlugins={[remarkGfm]}>
										{(locale === "zh" ? page.bodyZh : page.body) ?? ""}
									</ReactMarkdown>
								</article>
							</details>
							<div className="flex flex-col gap-5">
								{progress.signedIn ? (
									<section
										id="study-mark"
										className="scroll-mt-24"
										aria-label={t("progress.course")}
									>
										<CompleteLessonButton
											lesson={lesson}
											studied={Boolean(lessonProgress?.completedAt)}
										/>
									</section>
								) : !page.learning ? (
									<div className="flex flex-col items-start gap-3">
										<p className="text-muted-foreground text-sm">
											{t("complete.previewNote")}
										</p>
										<SignInLink
											disabled={!authIsConfigured}
											onClick={() =>
												capture("auth_sign_in_opened", {
													surface: "lesson_completion",
												})
											}
										>
											{t("complete.signInToSave")}
										</SignInLink>
									</div>
								) : null}
								<Separator />
								<nav
									className="flex items-center justify-between gap-4"
									aria-label={t("lesson.navigation")}
								>
									{previous ? (
										<Link
											to="/learn/$lessonSlug"
											params={{ lessonSlug: previous.slug }}
											className={buttonVariants({ variant: "ghost" })}
										>
											<ArrowLeftIcon
												data-icon="inline-start"
												aria-hidden="true"
											/>
											<span className="hidden sm:inline">
												{localizedPrevious?.title}
											</span>
											<span className="sm:hidden">{t("common.previous")}</span>
										</Link>
									) : (
										<span />
									)}
									{next ? (
										<Link
											to="/learn/$lessonSlug"
											params={{ lessonSlug: next.slug }}
											className={cn(
												buttonVariants({ variant: "outline" }),
												"max-w-[55%]",
											)}
										>
											<span className="truncate">{localizedNext?.title}</span>
											<ArrowRightIcon
												data-icon="inline-end"
												aria-hidden="true"
											/>
										</Link>
									) : null}
								</nav>
							</div>
						</>
					}
				</div>
			</div>
		</main>
	);
}
