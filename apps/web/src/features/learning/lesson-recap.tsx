import { LessonInfographic } from "@/components/lesson-infographic";
import type { Locale } from "@/i18n/messages";

/** The optional recap owns its diagram without blocking the main visual lesson. */
export function LessonRecap({
	lessonId,
	summary,
	locale,
}: {
	lessonId: string;
	summary: string;
	locale: Locale;
}) {
	return (
		<div className="mx-auto max-w-md py-4">
			<LessonInfographic
				subject={lessonId}
				locale={locale}
				motionEnabled={false}
			/>
			<p className="text-muted-foreground text-sm">{summary}</p>
		</div>
	);
}
