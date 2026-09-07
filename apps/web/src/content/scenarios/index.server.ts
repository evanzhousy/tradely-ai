import "@tanstack/react-start/server-only";
import { contractNeighborhoodScenarios } from "./contract-neighborhood";
import { metricLensScenarios } from "./metric-lenses";
import { optionPrintScenarios } from "./option-print";
import { researchWorkflowScenarios } from "./research-workflow";
import { sessionFlowScenarios } from "./session-flow";

export function getLessonScenarios(lessonId: string) {
	return [
		...optionPrintScenarios,
		...contractNeighborhoodScenarios,
		...sessionFlowScenarios,
		...metricLensScenarios,
		...researchWorkflowScenarios,
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
