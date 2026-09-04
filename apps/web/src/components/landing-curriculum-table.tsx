import { Link } from "@tanstack/react-router";

import type { Lesson } from "@/content/course";
import { useI18n } from "@/i18n/provider";

export function LandingCurriculumTable({
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
	const { t } = useI18n();
	const completed = new Set(completedIds);
	return (
		<div className="desk-curriculum">
			<table>
				<caption>{caption}</caption>
				<thead>
					<tr>
						<th className="desk-numeric" scope="col">
							#
						</th>
						<th scope="col">{t("home.tableLesson")}</th>
						<th scope="col">{t("home.tablePractice")}</th>
						<th scope="col">{t("home.tableAccess")}</th>
						<th className="desk-numeric" scope="col">
							{t("home.tableMinutes")}
						</th>
					</tr>
				</thead>
				<tbody>
					{lessons.map((lesson, index) => {
						const isCompleted = completed.has(lesson.id);
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
							<tr key={lesson.id}>
								<td className="desk-numeric">
									{String(index + 1).padStart(2, "0")}
								</td>
								<th scope="row">
									<div className="flex flex-col gap-1">
										<Link
											to="/learn/$lessonSlug"
											params={{ lessonSlug: lesson.slug }}
											aria-label={`${lesson.title}. ${isCompleted ? `${t("common.completed")}. ` : ""}${accessLabel}. ${t("common.minutes", { minutes: lesson.minutes })}.`}
										>
											{lesson.title}
										</Link>
										{isCompleted ? (
											<p className="font-mono text-muted-foreground text-xs">
												{t("common.completed")}
											</p>
										) : null}
										<p className="font-normal text-muted-foreground text-sm leading-6">
											{lesson.summary}
										</p>
									</div>
								</th>
								<td>{lesson.practice.tool}</td>
								<td>{accessLabel}</td>
								<td className="desk-numeric">{lesson.minutes}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
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
