import "@tanstack/react-start/server-only";
import { contractNeighborhoodScenarios } from "./contract-neighborhood";
import { optionPrintScenarios } from "./option-print";
import { sessionFlowScenarios } from "./session-flow";

export function getLessonScenarios(lessonId: string) {
	return [
		...optionPrintScenarios,
		...contractNeighborhoodScenarios,
		...sessionFlowScenarios,
	].filter((scenario) => scenario.lessonId === lessonId);
}

export function getScenario(
	lessonId: string,
	scenarioId: string,
	version: number,
) {
	return getLessonScenarios(lessonId).find(
		(scenario) => scenario.id === scenarioId && scenario.version === version,
	);
}
