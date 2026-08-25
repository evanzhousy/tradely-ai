import { Link } from "@tanstack/react-router";
import { Badge } from "@tradely/ui/components/badge";
import { Separator } from "@tradely/ui/components/separator";
import { cn } from "@tradely/ui/lib/utils";
import {
	CheckCircle2Icon,
	CircleAlertIcon,
	LockKeyholeIcon,
	PlayCircleIcon,
} from "lucide-react";

import { StageIcon } from "@/components/course-marks";
import { groupLessonsByCategory, type Lesson } from "@/content/course";
import { categoryLabel, t } from "@/i18n/ui";
import { useLocale } from "@/i18n/use-locale";

function AccessMark({
	lesson,
	canAccessPaid,
	accessUnavailable,
}: {
	lesson: Lesson;
	canAccessPaid: boolean;
	accessUnavailable: boolean;
}) {
	const locale = useLocale();
	if (lesson.access === "preview") {
		return <Badge variant="secondary">{t(locale, "free")}</Badge>;
	}
	if (canAccessPaid) return null;
	if (accessUnavailable) {
		return (
			<CircleAlertIcon
				className="size-3.5 text-muted-foreground"
				aria-label={t(locale, "accessUnavailable")}
			/>
		);
	}
	return (
		<LockKeyholeIcon
			className="size-3.5 text-muted-foreground"
			aria-label={t(locale, "membershipLesson")}
		/>
	);
}

export function CourseList({
	lessons,
	completedIds = [],
	currentLessonId,
	canAccessPaid = false,
	accessUnavailable = false,
	compact = false,
}: {
	lessons: readonly Lesson[];
	completedIds?: string[];
	currentLessonId?: string;
	canAccessPaid?: boolean;
	accessUnavailable?: boolean;
	compact?: boolean;
}) {
	const locale = useLocale();
	const completed = new Set(completedIds);
	return (
		<nav className="flex flex-col gap-6" aria-label={t(locale, "curriculum")}>
			{groupLessonsByCategory(lessons).map((group) => (
				<section key={group.category} className="flex flex-col gap-1">
					<h3 className="flex items-center gap-2 px-1 font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-[0.08em] sm:px-3">
						<StageIcon
							category={group.category}
							className="size-3.5 text-primary"
						/>
						{categoryLabel(locale, group.category)}
					</h3>
					<ol className="flex flex-col">
						{group.lessons.map((lesson, index) => {
							const isCompleted = completed.has(lesson.id);
							const isCurrent = currentLessonId === lesson.id;
							return (
								<li key={lesson.id}>
									<Link
										to="/learn/$lessonSlug"
										params={{ lessonSlug: lesson.slug }}
										className={cn(
											"group flex items-start gap-4 rounded-2xl px-1 py-4 transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3",
											isCurrent && "bg-muted/60",
										)}
										aria-current={isCurrent ? "page" : undefined}
									>
										<span className="flex size-9 shrink-0 items-center justify-center rounded-3xl bg-muted font-mono text-muted-foreground text-xs group-hover:text-foreground">
											{isCompleted ? (
												<CheckCircle2Icon className="text-primary" />
											) : (
												String(lesson.order + 1).padStart(2, "0")
											)}
										</span>
										<span className="flex min-w-0 flex-1 flex-col gap-1">
											<span className="flex flex-wrap items-center gap-2">
												<span className="font-medium text-foreground">
													{lesson.title}
												</span>
												<AccessMark
													lesson={lesson}
													canAccessPaid={canAccessPaid}
													accessUnavailable={accessUnavailable}
												/>
											</span>
											<span
												className={cn(
													"text-muted-foreground text-sm",
													compact && "line-clamp-2",
												)}
											>
												{lesson.summary}
											</span>
											<span className="flex items-center gap-1.5 font-mono text-muted-foreground text-xs">
												<PlayCircleIcon className="size-3.5" />
												{t(locale, "minutes", { n: lesson.minutes })}
											</span>
										</span>
									</Link>
									{index < group.lessons.length - 1 ? <Separator /> : null}
								</li>
							);
						})}
					</ol>
				</section>
			))}
		</nav>
	);
}
