import "@tanstack/react-start/server-only";
import type {
	ScenarioQuestion,
	ScenarioStep,
} from "@/domain/learning/scenario";
import type { LearningCopy } from "@/domain/learning/types";

export const copy = (en: string, zh: string): LearningCopy => ({ en, zh });
export const fact = (
	en: string,
	zh: string,
	valueEn: string,
	valueZh = valueEn,
) => ({ label: copy(en, zh), value: copy(valueEn, valueZh) });
export function question(
	id: string,
	en: string,
	zh: string,
	choices: Array<[string, string, string]>,
	accepted: string,
	explanation: string,
	explanationZh: string,
): ScenarioQuestion {
	return {
		id,
		prompt: copy(en, zh),
		choices: choices.map(([id, en, zh]) => ({ id, label: copy(en, zh) })),
		accepted: [accepted],
		explanation: copy(explanation, explanationZh),
	};
}
export function step(
	data: Pick<ScenarioStep, "id" | "kind" | "title" | "brief" | "questions"> &
		Partial<ScenarioStep>,
): ScenarioStep {
	return {
		facts: [],
		evidence: [],
		requiredEvidence: [],
		quote: null,
		hint: copy(
			"Check the source, date, scope, and units before choosing a claim.",
			"选择结论前，先检查来源、日期、范围和单位。",
		),
		...data,
	};
}
