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
	const lesson = getLessonById(data.lessonId);
	if (!lesson) return { ok: false, reason: "access_denied" };
	const scenarios = getLessonScenarios(data.lessonId);
	const scenario = data.pin
		? scenarios.find(
				(s) =>
					s.id === data.pin?.scenarioId &&
					s.version === data.pin.scenarioVersion,
			)
		: scenarios[data.variant];
	if (!scenario)
		return { ok: false, reason: data.pin ? "retired" : "not_found" };
	if (
		data.pin &&
		(data.pin.scenarioId !== scenario.id ||
			data.pin.scenarioVersion !== scenario.version ||
			data.pin.contentVersion !== lesson.contentVersion)
	)
		return { ok: false, reason: "retired" };
	try {
		const state = data.actions.reduce(
			(state, action) => transitionAttempt(scenario, state, action),
			initialAttemptState(),
		);
		return {
			ok: true,
			view: {
				...projectAttempt(scenario, state, "preview", data.actions.length),
				contentVersion: lesson.contentVersion,
			},
		};
	} catch {
		return { ok: false, reason: "invalid_action" };
	}
}
