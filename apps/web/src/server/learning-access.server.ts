import "@tanstack/react-start/server-only";
import { getLessonById } from "@/content/course";
import { learningRollout } from "@/content/learning-rollout";
import { getLearningIdentity } from "./access.server";

export async function authorizeLearning(lessonId: string) {
	if (!getLessonById(lessonId) || !Object.hasOwn(learningRollout, lessonId))
		return { ok: false, reason: "not_found" } as const;
	const identity = await getLearningIdentity();
	if (identity.unavailable)
		return { ok: false, reason: "unavailable" } as const;
	if (!identity.userId) return { ok: false, reason: "signed_out" } as const;
	return { ok: true, userId: identity.userId } as const;
}
