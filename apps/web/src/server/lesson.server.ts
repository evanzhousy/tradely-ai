import "@tanstack/react-start/server-only";

import { getLesson } from "@/content/course";
import { getLessonBody } from "@/content/lesson-content.server";
import { resolveCurrentLessonAccess } from "./access.server";
import { createLessonMedia } from "./media.server";

export async function getLessonPageDataImpl(data: { slug: string }) {
	const lesson = getLesson(data.slug);
	if (!lesson) return { found: false as const };
	const { readLocale } = await import("./locale.server");
	const locale = readLocale();
	const { access, courseAccess } = await resolveCurrentLessonAccess(lesson);
	let media = null;
	let mediaUnavailable = false;
	if (access.allowed) {
		try {
			media = await createLessonMedia(lesson, courseAccess.userId);
		} catch {
			mediaUnavailable = true;
		}
	}
	return {
		found: true as const,
		access,
		body: access.allowed ? (getLessonBody(lesson.slug, locale) ?? "") : null,
		media,
		mediaUnavailable,
		canAccessPaid: courseAccess.canAccessPaid,
	};
}
