import { useCallback, useRef } from "react";
import type { Locale } from "@/i18n/messages";
import { useAnalytics } from "./context";
import type { VisualLessonPlaybackMode, VisualLessonSurface } from "./events";

type VisualMilestone =
	| "visual_lesson_scene_started"
	| "visual_lesson_scene_completed"
	| "visual_lesson_explored"
	| "visual_lesson_interacted";

/** Telemetry acceptance is separate from the player's reading/bookmark state. */
export function useVisualLessonAnalytics(
	lessonId: string | null,
	locale: Locale,
) {
	const { capture } = useAnalytics();
	const recorded = useRef(new Set<string>());
	return useCallback(
		(
			event: VisualMilestone,
			sceneId: string,
			surface: VisualLessonSurface,
			mode: VisualLessonPlaybackMode = "manual",
		) => {
			if (!lessonId) return false;
			const key = `${lessonId}:${surface}:${sceneId}:${event}`;
			if (recorded.current.has(key)) return false;
			const properties = {
				lesson_id: lessonId,
				scene_id: sceneId,
				locale,
				surface,
			};
			const accepted =
				event === "visual_lesson_scene_started" ||
				event === "visual_lesson_scene_completed"
					? capture(event, { ...properties, mode })
					: capture(event, properties);
			if (accepted) recorded.current.add(key);
			return accepted;
		},
		[capture, lessonId, locale],
	);
}
