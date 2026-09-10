import "@tanstack/react-start/server-only";
import { optionContractsV2 } from "../units/archive/option-contracts-v2.server";
import { unitScenarios } from "../units/authoring.server";
import { teachingUnits } from "../units/index.server";
import { contractNeighborhoodScenarios } from "./contract-neighborhood";
import { metricLensScenarios } from "./metric-lenses";
import { optionPrintScenarios } from "./option-print";
import { researchWorkflowScenarios } from "./research-workflow";
import { sessionFlowScenarios } from "./session-flow";

const archivedScenarios = [
	...unitScenarios(optionContractsV2),
	...optionPrintScenarios,
	...contractNeighborhoodScenarios,
	...sessionFlowScenarios,
	...metricLensScenarios,
	...researchWorkflowScenarios,
];
const currentScenarios = teachingUnits.flatMap((unit) => unitScenarios(unit));
export function getLessonScenarios(lessonId: string) {
	return currentScenarios.filter((scenario) => scenario.lessonId === lessonId);
}

export function getScenario(
	lessonId: string,
	scenarioId: string,
	version: number,
) {
	return [...currentScenarios, ...archivedScenarios].find(
		(scenario) =>
			scenario.lessonId === lessonId &&
			scenario.id === scenarioId &&
			scenario.version === version,
	);
}
