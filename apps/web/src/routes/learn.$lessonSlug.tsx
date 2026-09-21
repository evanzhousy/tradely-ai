import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Badge } from "@tradely/ui/components/badge";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import { DisclosurePanel } from "@tradely/ui/components/disclosure";
import { ScrollShadow } from "@tradely/ui/components/scroll-shadow";
import { Surface } from "@tradely/ui/components/surface";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	PanelLeftCloseIcon,
	PanelLeftOpenIcon,
} from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAnalytics } from "@/analytics/context";
import { CompleteLessonButton } from "@/components/complete-lesson-button";
import { CourseList } from "@/components/course-list";
import { CourseProgress } from "@/components/course-progress";
import { LessonInfographic } from "@/components/lesson-infographic";
import { LessonNavigation } from "@/components/lesson-navigation";
import { SignInLink } from "@/components/sign-in-link";
import { TradingFlowLab } from "@/components/tradingflow-lab";
import { LessonVideo } from "@/components/video-player";
import { getLesson, getNextLesson, getPreviousLesson } from "@/content/course";
import { getTradingFlowLab } from "@/content/tradingflow-labs";
import { parseLearningSearch } from "@/domain/guest-learning";
import { VisualLesson } from "@/features/learning/visual-lesson";
import { getLocalizedCourse, getLocalizedLesson } from "@/i18n/course";
import { useI18n } from "@/i18n/provider";
import { pageHead } from "@/seo/pages";
import { getLessonPageData } from "@/server/lesson";
import { getCourseProgress, saveLessonProgress } from "@/server/progress";

const LearningHistory = lazy(() =>
	import("@/features/learning/learning-history").then((m) => ({
		default: m.LearningHistory,
	})),
);

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
	const { attempt } = Route.useSearch();
	const { page, progress } = Route.useLoaderData();
	const { locale, t } = useI18n();
	const { capture, isCapturing, captureException } = useAnalytics();
	const saveProgress = useServerFn(saveLessonProgress);
	const source = getLesson(lessonSlug);
	const course = getLocalizedCourse(locale);
	const lesson = source ? getLocalizedLesson(source, locale) : null;
	const tracked = useRef<string | null>(null);
	const started = useRef<string | null>(null);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [notesExpanded, setNotesExpanded] = useState(false);
	useEffect(() => {
		if (!isCapturing) {
			tracked.current = null;
			return;
		}
		if (tracked.current === lessonSlug) return;
		if (
			capture("lesson_opened", {
				lesson_id: lessonSlug,
				access_tier: "free",
				access_state: "allowed",
				locale,
				lesson_order: (source?.order ?? 0) + 1,
				media_available: !!(page.found && page.media),
			})
		)
			tracked.current = lessonSlug;
	}, [capture, isCapturing, lessonSlug, locale, source?.order, page]);
	useEffect(() => {
		if (
			!progress.signedIn ||
			progress.unavailable ||
			started.current === lessonSlug ||
			progress.records.some((record) => record.lessonId === lessonSlug)
		)
			return;
		started.current = lessonSlug;
		void saveProgress({
			data: { lessonId: lessonSlug, complete: false },
		}).catch((error) =>
			captureException(error, {
				source: "lesson_completion",
				lesson_id: lessonSlug,
			}),
		);
	}, [
		lessonSlug,
		progress.signedIn,
		progress.unavailable,
		progress.records,
		saveProgress,
		captureException,
	]);
	useEffect(() => {
		const reveal = () => {
			if (window.location.hash === "#lesson-notes") setNotesExpanded(true);
		};
		reveal();
		window.addEventListener("hashchange", reveal);
		return () => window.removeEventListener("hashchange", reveal);
	}, []);
	if (!source || !lesson || !page.found) return null;
	const completedIds = progress.records
		.filter((record) => record.completedAt)
		.map((record) => record.lessonId);
	const record = progress.records.find(
		(record) => record.lessonId === lesson.id,
	);
	const previous = getPreviousLesson(lessonSlug);
	const next = getNextLesson(lessonSlug);
	const history = progress.learning.lessons[lesson.id];
	const histories = [history?.latest, history?.earlier].filter(
		(item) => !!item,
	);
	return (
		<main
			className={`lesson-shell mx-auto grid w-full max-w-[1480px] gap-0 transition-[grid-template-columns] duration-200 ${sidebarCollapsed ? "lg:grid-cols-[56px_1fr]" : "lg:grid-cols-[290px_1fr]"}`}
		>
			<aside
				className={`lesson-sidebar hidden min-h-[calc(100svh-4rem)] border-border/60 border-r py-8 transition-[padding] duration-200 lg:block ${sidebarCollapsed ? "px-2" : "px-4"}`}
			>
				<Surface
					variant="secondary"
					className="sticky top-24 flex flex-col gap-6 rounded-none"
				>
					<div
						className={
							sidebarCollapsed
								? "flex justify-center"
								: "flex items-start gap-2"
						}
					>
						{sidebarCollapsed ? null : (
							<div className="min-w-0 flex-1">
								<CourseProgress
									unavailable={progress.unavailable}
									completed={progress.completed}
									total={progress.total}
									percentage={progress.percentage}
									compact
								/>
							</div>
						)}
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-expanded={!sidebarCollapsed}
							aria-controls="lesson-curriculum-sidebar-content"
							aria-label={
								sidebarCollapsed
									? t("course.expandSidebar")
									: t("course.collapseSidebar")
							}
							title={
								sidebarCollapsed
									? t("course.expandSidebar")
									: t("course.collapseSidebar")
							}
							onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
						>
							{sidebarCollapsed ? (
								<PanelLeftOpenIcon aria-hidden="true" />
							) : (
								<PanelLeftCloseIcon aria-hidden="true" />
							)}
						</Button>
					</div>
					<ScrollShadow
						id="lesson-curriculum-sidebar-content"
						orientation="vertical"
						size={48}
						className={
							sidebarCollapsed ? "hidden" : "max-h-[calc(100svh-12rem)] pr-1"
						}
					>
						<CourseList
							lessons={course.lessons}
							completedIds={completedIds}
							currentLessonId={lesson.id}
						/>
					</ScrollShadow>
				</Surface>
			</aside>
			<div className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
				<div className="mx-auto flex max-w-[980px] flex-col gap-7">
					<div className="hidden sm:block">
						<LessonNavigation
							locale={locale}
							lessonId={lesson.id}
							lessonTitle={lesson.title}
						/>
					</div>
					<header className="lesson-heading flex flex-col gap-3">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">
								{t("common.lessonNumber", {
									current: lesson.order + 1,
									total: course.lessons.length,
								})}
							</Badge>
							<Badge variant="outline">{lesson.category}</Badge>
							<Link
								to="/courses/tradingflow-foundations"
								className="ml-auto text-xs underline underline-offset-4 lg:hidden"
							>
								{t("course.curriculum")}
							</Link>
						</div>
						<h1 className="font-semibold text-2xl text-display sm:text-4xl">
							{lesson.title}
						</h1>
					</header>
					<VisualLesson
						key={lesson.id}
						lessonId={lesson.id}
						locale={locale}
						data={page.conceptData}
					/>
					<DisclosurePanel
						className="lesson-notes"
						summary={locale === "zh" ? "快速回顾" : "Quick recap"}
					>
						<div className="mx-auto max-w-md py-4">
							<LessonInfographic
								subject={lesson.id}
								locale={locale}
								motionEnabled={false}
							/>
							<p className="text-muted-foreground text-sm">{lesson.summary}</p>
						</div>
					</DisclosurePanel>
					<section id="study-mark" className="flex flex-col gap-4">
						{progress.signedIn ? (
							<CompleteLessonButton
								lesson={lesson}
								studied={!!record?.completedAt}
							/>
						) : (
							<p className="text-muted-foreground text-sm">
								<SignInLink>
									{locale === "zh"
										? "登录以保存学习标记"
										: "Sign in to save study marks"}
								</SignInLink>
							</p>
						)}
						<p className="text-muted-foreground text-xs">
							{t("lesson.continueNote")}
						</p>
						<nav
							className="flex items-center justify-between gap-4"
							aria-label={t("lesson.navigation")}
						>
							{previous ? (
								<Link
									to="/learn/$lessonSlug"
									params={{ lessonSlug: previous.slug }}
									search={{}}
									className={buttonVariants({ variant: "ghost" })}
								>
									<ArrowLeftIcon data-icon="inline-start" />
									{t("common.previous")}
								</Link>
							) : (
								<span />
							)}
							{next ? (
								<Link
									to="/learn/$lessonSlug"
									params={{ lessonSlug: next.slug }}
									search={{}}
									className={buttonVariants()}
								>
									{locale === "zh" ? "下一课" : "Next lesson"}
									<ArrowRightIcon data-icon="inline-end" />
								</Link>
							) : (
								<Link
									to="/courses/tradingflow-foundations"
									className={buttonVariants()}
								>
									{locale === "zh" ? "回到课程" : "Back to the course"}
								</Link>
							)}
						</nav>
					</section>
					<DisclosurePanel
						id="lesson-notes"
						className="lesson-notes"
						summary={locale === "zh" ? "笔记与来源" : "Notes & sources"}
						isExpanded={notesExpanded}
						onExpandedChange={setNotesExpanded}
					>
						<article className="lesson-prose max-w-[72ch]">
							<ReactMarkdown remarkPlugins={[remarkGfm]}>
								{(locale === "zh" ? page.bodyZh : page.body) ?? ""}
							</ReactMarkdown>
						</article>
					</DisclosurePanel>
					{getTradingFlowLab(lesson.id) ? (
						<DisclosurePanel
							className="lesson-notes"
							summary={
								locale === "zh"
									? "在 TradingFlow 中查看应用示例"
									: "See the application in TradingFlow"
							}
						>
							<TradingFlowLab lessonId={lesson.id} />
						</DisclosurePanel>
					) : null}
					{page.media ? (
						<DisclosurePanel
							className="lesson-notes"
							summary={locale === "zh" ? "补充视频" : "Companion video"}
						>
							<LessonVideo
								lesson={lesson}
								media={page.media}
								initialPositionSeconds={
									record?.contentVersion === source.contentVersion
										? (record.lastPositionSeconds ?? 0)
										: 0
								}
							/>
						</DisclosurePanel>
					) : null}
					{histories.length > 0 || attempt ? (
						<DisclosurePanel
							className="lesson-notes"
							defaultExpanded={!!attempt}
							summary={
								locale === "zh" ? "以前保存的学习记录" : "Previously saved work"
							}
						>
							<div className="flex flex-col gap-5 pt-4">
								{histories.map((item) => (
									<Link
										key={item.attemptId}
										to="/learn/$lessonSlug"
										params={{ lessonSlug }}
										search={{ attempt: item.attemptId }}
									>
										{locale === "zh" ? "查看" : "View"} ·{" "}
										{item.submittedAt.slice(0, 10)} ·{" "}
										{locale === "zh" ? "版本" : "Edition"}{" "}
										{item.scenarioVersion}
									</Link>
								))}
								{attempt ? (
									<Suspense
										fallback={
											<p role="status">
												{locale === "zh" ? "正在加载…" : "Loading…"}
											</p>
										}
									>
										<LearningHistory
											key={attempt}
											lessonId={lesson.id}
											attemptId={attempt}
											locale={locale}
										/>
									</Suspense>
								) : null}
							</div>
						</DisclosurePanel>
					) : null}
				</div>
			</div>
		</main>
	);
}
