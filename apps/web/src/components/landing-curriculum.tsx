import { Link } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import { ArrowUpRightIcon, CheckIcon, Clock3Icon } from "lucide-react";
import { useId } from "react";
import type { Lesson } from "@/content/course";
import { useI18n } from "@/i18n/provider";
import { LessonInfographic } from "./lesson-infographic";

// Owns ordered lesson discovery; the catalog and server access state remain inputs.
export function LandingCurriculum({
	lessons,
	completedIds = [],
	canAccessPaid = false,
	accessUnavailable = false,
	caption,
}: {
	lessons: readonly Lesson[];
	completedIds?: string[];
	canAccessPaid?: boolean;
	accessUnavailable?: boolean;
	caption: string;
}) {
	const { t, locale } = useI18n();
	const id = useId();
	const completed = new Set(completedIds);
	return (
		<div className="landing-curriculum">
			<p id={id} className="curriculum-caption">
				{caption}
			</p>
			<ol
				className="curriculum-grid"
				aria-label={t("home.curriculumLabel")}
				aria-describedby={id}
			>
				{lessons.map((lesson, index) => {
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
											<span>{String(index + 1).padStart(2, "0")}</span>
											<span>{t("home.cardConcept")}</span>
											<ArrowUpRightIcon size={16} aria-hidden="true" />
										</div>
										<LessonInfographic subject={lesson.slug} locale={locale} />
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
											{t("home.cardPractice", { tool: lesson.practice.tool })}
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
