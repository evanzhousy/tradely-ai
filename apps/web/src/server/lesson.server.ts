import "@tanstack/react-start/server-only";

import { getLesson } from "@/content/course";
import { learningRollout } from "@/content/learning-rollout";
import { getLessonBody } from "@/content/lesson-content.server";
import { getTeachingUnit } from "@/content/units/index.server";
import { captureServerException } from "./analytics/posthog.server";
import { createLessonMedia } from "./media.server";

export async function getLessonPageDataImpl(data: { slug: string }) {
	const lesson = getLesson(data.slug);
	if (!lesson) return { found: false as const };
	let media = null;
	let mediaUnavailable = false;
	if (lesson.mediaCurrent === true) {
		try {
			media = await createLessonMedia(lesson);
		} catch (error) {
			await captureServerException(error, {
				source: "lesson",
				operation: "lesson_media_resolve",
				lessonId: lesson.id,
			});
			mediaUnavailable = true;
		}
	}
	return {
		found: true as const,
		conceptData: getTeachingUnit(lesson.id)?.conceptLab?.data,
		body: getLessonBody(lesson.slug) ?? "",
		bodyZh: getLessonBody(lesson.slug, "zh") ?? "",
		media,
		mediaUnavailable,
		learning: learningRollout[lesson.id] ?? null,
	};
}
