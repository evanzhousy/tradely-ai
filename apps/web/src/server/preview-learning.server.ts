import "@tanstack/react-start/server-only";
import { getLessonById } from "@/content/course";
import { getLessonScenarios } from "@/content/scenarios/index.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import type { LearningResponse } from "@/domain/learning/types";
import type { PreviewLearningInput } from "./learning";

/** Public practice only. Recompute the bounded history; never trust a client result or write an account record. */
export function previewLearningImpl(
	data: PreviewLearningInput,
): LearningResponse {
	if (getLessonById(data.lessonId)?.access !== "preview")
		return { ok: false, reason: "access_denied" };
	const scenario = getLessonScenarios(data.lessonId)[data.variant];
	if (!scenario) return { ok: false, reason: "not_found" };
	try {
		const state = data.actions.reduce(
			(state, action) => transitionAttempt(scenario, state, action),
			initialAttemptState(),
		);
		return {
			ok: true,
			view: projectAttempt(scenario, state, "preview", data.actions.length),
		};
	} catch {
		return { ok: false, reason: "invalid_action" };
	}
}
