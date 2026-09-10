import { Link } from "@tanstack/react-router";
import { Button } from "@tradely/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import {
	ArrowUpRightIcon,
	CheckIcon,
	Clock3Icon,
	PauseIcon,
	PlayIcon,
} from "lucide-react";
import { useId, useState } from "react";
import { getFreeLearningPath, type Lesson } from "@/content/course";
import { courseModules } from "@/content/syllabus";
import { useI18n } from "@/i18n/provider";
import { LessonInfographic } from "./lesson-infographic";

// Owns ordered lesson discovery; the catalog and server access state remain inputs.
export function LandingCurriculum({
	lessons,
	completedIds = [],
	canAccessPaid = false,
	accessUnavailable = false,
	caption,
	groupByModule = false,
}: {
	lessons: readonly Lesson[];
	completedIds?: string[];
	canAccessPaid?: boolean;
	accessUnavailable?: boolean;
	caption: string;
	groupByModule?: boolean;
}) {
	const { t, locale } = useI18n();
	const id = useId();
	const [motionEnabled, setMotionEnabled] = useState(true);
	const gridId = `${id}-grid`;
	const freePaths = (["foundations", "research"] as const).map((path) => ({
		path,
		lessons: getFreeLearningPath(lessons, path),
	}));
	const completed = new Set(completedIds);
	const renderLessons = (items: readonly Lesson[]) => (
		<ol
			className="curriculum-grid"
			aria-label={t("home.curriculumLabel")}
			aria-describedby={id}
		>
			{items.map((lesson) => {
				const isCompleted = completed.has(lesson.id);
				const titleId = `${id}-${lesson.id}-title`;
				const detailId = `${id}-${lesson.id}-detail`;
				const accessLabel = lessonAccessLabel({
					access: lesson.access,
					canAccessPaid,
					accessUnavailable,
					free: t("common.free"),
					unlocked: t("common.unlocked"),
					unavailable: t("common.accessUnavailable"),
					paid: t("common.membershipLesson"),
				});
				return (
					<li
						className="curriculum-item"
						key={lesson.id}
						id={`lesson-${lesson.slug}`}
					>
						<Card className="curriculum-card h-full py-0">
							<Link
								to="/learn/$lessonSlug"
								params={{ lessonSlug: lesson.slug }}
								className="curriculum-card-link"
								aria-labelledby={titleId}
								aria-describedby={detailId}
							>
								<div className="curriculum-art">
									<div className="curriculum-art-caption">
										<span>{String(lesson.order + 1).padStart(2, "0")}</span>
										<span>{t("home.cardConcept")}</span>
										<ArrowUpRightIcon size={16} aria-hidden="true" />
									</div>
									<LessonInfographic
										subject={lesson.slug}
										locale={locale}
										motionEnabled={motionEnabled}
									/>
								</div>
								<CardHeader className="gap-3">
									<CardTitle>
										<h3 id={titleId}>{lesson.title}</h3>
									</CardTitle>
									<CardDescription>
										<p>{lesson.summary}</p>
									</CardDescription>
								</CardHeader>
								<CardContent className="mt-auto">
									<p className="curriculum-practice">
										{lesson.practice
											? t("home.cardPractice", { tool: lesson.practice.tool })
											: locale === "zh"
												? "交互练习与独立案例"
												: "Interactive practice and independent cases"}
									</p>
								</CardContent>
								<CardFooter className="curriculum-card-footer">
									<div id={detailId} className="curriculum-card-meta">
										<span>
											<Clock3Icon size={13} aria-hidden="true" />
											{t("common.minutes", { minutes: lesson.minutes })}
										</span>
										<span data-access={lesson.access}>{accessLabel}</span>
										{isCompleted ? (
											<span className="curriculum-completed">
												<CheckIcon size={13} aria-hidden="true" />
												{t("common.completed")}
											</span>
										) : null}
									</div>
								</CardFooter>
							</Link>
						</Card>
					</li>
				);
			})}
		</ol>
	);
	return (
		<div className="landing-curriculum">
			{freePaths.map(({ path, lessons: freeLessons }) =>
				freeLessons.length > 0 ? (
					<nav
						key={path}
						aria-labelledby={`${id}-${path}-title`}
						className="mb-6 flex flex-col gap-3 rounded-3xl bg-muted/50 p-4 sm:p-6"
					>
						<h2 id={`${id}-${path}-title`} className="font-semibold text-lg">
							{t(
								path === "foundations"
									? "course.foundationsTitle"
									: "course.researchTitle",
							)}
						</h2>
						<p className="text-muted-foreground text-sm">
							{t(
								path === "foundations"
									? "course.foundationsDescription"
									: "course.researchDescription",
							)}
						</p>
						<ul className="grid gap-2 md:grid-cols-2">
							{freeLessons.map((lesson) => (
								<li key={lesson.id}>
									<Link
										to="/learn/$lessonSlug"
										params={{ lessonSlug: lesson.slug }}
										className="flex h-full min-h-11 items-start gap-3 rounded-2xl p-3 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
									>
										<span className="font-mono text-muted-foreground">
											{String(lesson.order + 1).padStart(2, "0")}
										</span>
										<span className="flex flex-1 flex-col gap-2">
											<span className="font-medium">{lesson.title}</span>
											<span className="text-muted-foreground text-xs">
												{t("common.free")} ·{" "}
												{t("common.minutes", { minutes: lesson.minutes })}
											</span>
										</span>
										<ArrowUpRightIcon
											className="size-4 shrink-0"
											aria-hidden="true"
										/>
									</Link>
								</li>
							))}
						</ul>
					</nav>
				) : null,
			)}
			<div className="curriculum-caption-row">
				<p id={id} className="curriculum-caption">
					{caption}
				</p>
				<Button
					variant="ghost"
					size="sm"
					className="curriculum-motion-toggle"
					aria-pressed={!motionEnabled}
					aria-controls={gridId}
					onClick={() => setMotionEnabled((current) => !current)}
				>
					{motionEnabled ? (
						<PauseIcon data-icon="inline-start" aria-hidden="true" />
					) : (
						<PlayIcon data-icon="inline-start" aria-hidden="true" />
					)}
					{t(motionEnabled ? "home.pauseMotion" : "home.resumeMotion")}
				</Button>
			</div>
			<div
				id={gridId}
				className={groupByModule ? "curriculum-modules" : undefined}
			>
				{groupByModule
					? courseModules.map((module) => {
							const items = lessons.filter(
								(lesson) => lesson.moduleId === module.id,
							);
							if (!items.length) return null;
							return (
								<section
									key={module.id}
									id={`module-${module.id}`}
									className="curriculum-module"
									aria-labelledby={`${id}-${module.id}`}
								>
									<div className="curriculum-module-heading">
										<h2 id={`${id}-${module.id}`}>{module[locale]}</h2>
										<p>
											{
												items.filter((lesson) => completed.has(lesson.id))
													.length
											}{" "}
											/ {items.length} {t("common.completed")}
										</p>
									</div>
									{renderLessons(items)}
								</section>
							);
						})
					: renderLessons(lessons)}
			</div>
		</div>
	);
}

export function lessonAccessLabel({
	access,
	canAccessPaid,
	accessUnavailable,
	free,
	unlocked,
	unavailable,
	paid,
}: {
	access: Lesson["access"];
	canAccessPaid: boolean;
	accessUnavailable: boolean;
	free: string;
	unlocked: string;
	unavailable: string;
	paid: string;
}) {
	if (access === "preview") return free;
	if (canAccessPaid) return unlocked;
	if (accessUnavailable) return unavailable;
	return paid;
}
