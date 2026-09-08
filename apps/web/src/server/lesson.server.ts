import "@tanstack/react-start/server-only";

import { getLesson } from "@/content/course";
import { learningRollout } from "@/content/learning-rollout";
import { getLessonBody } from "@/content/lesson-content.server";
import { resolveCurrentLessonAccess } from "./access.server";
import { captureServerException } from "./analytics/posthog.server";
import { createLessonMedia } from "./media.server";

export async function getLessonPageDataImpl(data: { slug: string }) {
	const lesson = getLesson(data.slug);
	if (!lesson) return { found: false as const };
	const { access, courseAccess } = await resolveCurrentLessonAccess(lesson);
	let media = null;
	let mediaUnavailable = false;
	if (access.allowed && lesson.mediaCurrent !== false) {
		try {
			media = await createLessonMedia(lesson, courseAccess.userId);
		} catch (error) {
			await captureServerException(error, {
				source: "lesson",
				operation: "lesson_media_resolve",
				userId: courseAccess.userId,
				lessonId: lesson.id,
			});
			mediaUnavailable = true;
		}
	}
	return {
		found: true as const,
		access,
		body: access.allowed ? (getLessonBody(lesson.slug) ?? "") : null,
		bodyZh: access.allowed ? (getLessonBody(lesson.slug, "zh") ?? "") : null,
		media,
		mediaUnavailable,
		canAccessPaid: courseAccess.canAccessPaid,
		learning: access.allowed ? (learningRollout[lesson.id] ?? null) : null,
	};
}
