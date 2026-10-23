import "@tanstack/react-start/server-only";
import type { LearningScenario } from "@/domain/learning/scenario";
import exposureStructureCasesV2 from "../units/archive/exposure-structure-cases-v2.json";
import foundationsCasesV2 from "../units/archive/foundations-cases-v2.json";
import { archivedFoundationUnits } from "../units/archive/foundations-original.server";
import { optionContractsV2 } from "../units/archive/option-contracts-v2.server";
import orientationCasesV2 from "../units/archive/orientation-cases-v2.json";
import workflowsCasesV2 from "../units/archive/workflows-cases-v2.json";
import { unitScenarios } from "../units/authoring.server";
import { archivedFoundationV4Units } from "../units/foundation-revision.server";
import { teachingUnits } from "../units/index.server";
import { archivedPortfolioUnits } from "../units/portfolio.server";
import { contractNeighborhoodScenarios } from "./contract-neighborhood";
import { metricLensScenarios } from "./metric-lenses";
import { optionPrintScenarios } from "./option-print";
import { researchWorkflowScenarios } from "./research-workflow";
import { sessionFlowScenarios } from "./session-flow";

/**
 * Practice cases as they were when attempts were saved against an earlier version: a unit's
 * questions changed, so its version went up and the old rubric is kept as data to review them.
 * They come first, so a frozen copy wins over one rebuilt from a case shared with current content.
 */
const frozen = (scenarios: unknown) => scenarios as LearningScenario[];

const archivedScenarios = [
	...frozen(workflowsCasesV2),
	...frozen(exposureStructureCasesV2),
	...frozen(foundationsCasesV2),
	...frozen(orientationCasesV2),
	...archivedFoundationUnits.flatMap((unit) => unitScenarios(unit)),
	...archivedFoundationV4Units.flatMap((unit) => unitScenarios(unit)),
	...archivedPortfolioUnits.flatMap((unit) => unitScenarios(unit)),
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
