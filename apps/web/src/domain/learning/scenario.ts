import type {
	LearningCopy,
	LearningEvidence,
	LearningFact,
	LearningQuestion,
	LearningStepView,
} from "./types";

/** Definitions and rubrics are imported only by server code and tests. */
export type ScenarioQuestion = LearningQuestion & {
	accepted: string[];
	explanation: LearningCopy;
	tolerance?: number;
};
export type ScenarioStep = {
	id: string;
	kind: LearningStepView["kind"];
	title: LearningCopy;
	brief: LearningCopy;
	facts: LearningFact[];
	evidence: LearningEvidence[];
	requiredEvidence: string[];
	questions: ScenarioQuestion[];
	hint: LearningCopy;
	quote: LearningStepView["quote"];
	neighborhood?: NonNullable<LearningStepView["neighborhood"]>;
	flowStructure?: NonNullable<LearningStepView["flowStructure"]>;
	neighborhoodPair?: NonNullable<LearningStepView["neighborhoodPair"]>;
	metrics?: NonNullable<LearningStepView["metrics"]>;
	universe?: NonNullable<LearningStepView["universe"]>;
	execution?: LearningStepView["execution"];
	worksheet?: LearningStepView["worksheet"];
	conceptLab?: LearningStepView["conceptLab"];
};
export type LearningScenario = {
	id: string;
	lessonId: string;
	version: number;
	steps: ScenarioStep[];
};
