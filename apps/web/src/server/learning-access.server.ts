import "@tanstack/react-start/server-only";
import { getLessonById } from "@/content/course";
import { learningRollout } from "@/content/learning-rollout";
import { resolveCurrentLessonAccess } from "./access.server";

export async function authorizeLearning(lessonId: string) {
	const lesson = getLessonById(lessonId);
	if (!lesson || !Object.hasOwn(learningRollout, lessonId))
		return { ok: false, reason: "not_found" } as const;
	const { access, courseAccess } = await resolveCurrentLessonAccess(lesson);
	if (!courseAccess.userId) return { ok: false, reason: "signed_out" } as const;
	if (!access.allowed)
		return {
			ok: false,
			reason:
				access.reason === "billing-unavailable"
					? "unavailable"
					: "access_denied",
		} as const;
	return {
		ok: true,
		userId: courseAccess.userId,
		canAccessPaid: courseAccess.canAccessPaid,
	} as const;
}
