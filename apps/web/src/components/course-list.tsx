import { Link } from "@tanstack/react-router";
import { Badge } from "@tradely/ui/components/badge";
import { Separator } from "@tradely/ui/components/separator";
import {
	CheckCircle2Icon,
	CircleAlertIcon,
	LockKeyholeIcon,
	PlayCircleIcon,
} from "lucide-react";

import type { Lesson } from "@/content/course";
import { useI18n } from "@/i18n/provider";

export function CourseList({
	lessons,
	completedIds = [],
	currentLessonId,
	canAccessPaid = false,
	accessUnavailable = false,
}: {
	lessons: readonly Lesson[];
	completedIds?: string[];
	currentLessonId?: string;
	canAccessPaid?: boolean;
	accessUnavailable?: boolean;
}) {
	const { t } = useI18n();
	const completed = new Set(completedIds);
	return (
		<ol className="flex flex-col" aria-label={t("course.curriculum")}>
			{lessons.map((lesson, index) => {
				const isCompleted = completed.has(lesson.id);
				const accessLabel =
					lesson.access === "preview"
						? t("common.free")
						: canAccessPaid
							? t("common.unlocked")
							: accessUnavailable
								? t("common.accessUnavailable")
								: t("common.membershipLesson");
				const completionLabel = isCompleted ? t("common.completed") : "";
				return (
					<li key={lesson.id}>
						<Link
							to="/learn/$lessonSlug"
							params={{ lessonSlug: lesson.slug }}
							className="group flex items-start gap-4 rounded-2xl px-3 py-4 transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							aria-current={currentLessonId === lesson.id ? "page" : undefined}
							aria-label={`${lesson.title}. ${completionLabel ? `${completionLabel}. ` : ""}${accessLabel}. ${t("common.minutes", { minutes: lesson.minutes })}.`}
						>
							<span className="flex size-9 shrink-0 items-center justify-center rounded-3xl bg-muted font-mono text-muted-foreground text-xs group-hover:text-foreground">
								{isCompleted ? (
									<CheckCircle2Icon
										className="text-primary"
										aria-hidden="true"
									/>
								) : (
									String(index + 1).padStart(2, "0")
								)}
							</span>
							<span className="flex min-w-0 flex-1 flex-col gap-1">
								<span className="flex flex-wrap items-center gap-2">
									<span className="font-medium text-foreground">
										{lesson.title}
									</span>
									{lesson.access === "preview" ? (
										<Badge variant="secondary">{t("common.free")}</Badge>
									) : canAccessPaid ? (
										<Badge variant="secondary">{t("common.unlocked")}</Badge>
									) : accessUnavailable ? (
										<CircleAlertIcon
											className="size-3.5 text-muted-foreground"
											aria-hidden="true"
										/>
									) : (
										<LockKeyholeIcon
											className="size-3.5 text-muted-foreground"
											aria-hidden="true"
										/>
									)}
								</span>
								<span className="line-clamp-2 text-muted-foreground text-sm">
									{lesson.summary}
								</span>
								<span className="flex items-center gap-1.5 font-mono text-muted-foreground text-xs">
									<PlayCircleIcon className="size-3.5" aria-hidden="true" />
									{t("common.minutes", { minutes: lesson.minutes })} ·{" "}
									{lesson.category}
								</span>
							</span>
						</Link>
						{index < lessons.length - 1 ? <Separator /> : null}
					</li>
				);
			})}
		</ol>
	);
}
