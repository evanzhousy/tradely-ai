import "@tanstack/react-start/server-only";
import type { LearningScenario, ScenarioQuestion, ScenarioStep } from "@/domain/learning/scenario";
import type { LearningCopy, LearningFact, LearningStepView } from "@/domain/learning/types";

export const t = (en: string, zh: string): LearningCopy => ({ en, zh });
export const fact = (en: string, zh: string, value: string): LearningFact => ({ label: t(en, zh), value: t(value, value) });
export function numberQuestion(id: string, en: string, zh: string, answer: number, unit: string, unitZh: string, why: string, whyZh: string, tolerance = 0.001): ScenarioQuestion {
	return { id, prompt: t(en, zh), choices: [], input: { kind: "number", unit: t(unit, unitZh) }, accepted: [String(answer)], tolerance, explanation: t(why, whyZh) };
}
export function choose(id: string, en: string, zh: string, choices: [string, string, string][], accepted: string, why: string, whyZh: string): ScenarioQuestion {
	return { id, prompt: t(en, zh), choices: choices.map(([id, en, zh]) => ({ id, label: t(en, zh) })), accepted: [accepted], explanation: t(why, whyZh) };
}
export function write(id: string, en: string, zh: string, exemplar: string, exemplarZh: string, minLength = 12): ScenarioQuestion {
	return { id, prompt: t(en, zh), choices: [], input: { kind: "text", minLength, maxLength: 1800 }, accepted: [], explanation: t(exemplar, exemplarZh) };
}
export type TeachingCase = {
	brief: LearningCopy;
	facts?: LearningFact[];
	questions: ScenarioQuestion[];
	worksheet?: LearningStepView["worksheet"];
	execution?: LearningStepView["execution"];
	metrics?: NonNullable<LearningStepView["metrics"]>;
	neighborhood?: NonNullable<LearningStepView["neighborhood"]>;
	neighborhoodPair?: NonNullable<LearningStepView["neighborhoodPair"]>;
	flowStructure?: NonNullable<LearningStepView["flowStructure"]>;
	universe?: NonNullable<LearningStepView["universe"]>;
};
export type TeachingUnit = {
	id: string;
	explanation: LearningCopy;
	example: LearningCopy;
	misconception: LearningCopy;
	sources: { title: string; href: string }[];
	case: (variant: number) => TeachingCase;
};
export const basics = { title: "OIC · Options basics", href: "https://www.optionseducation.org/optionsoverview/options-basics" };
export const orders = { title: "Investor.gov · Types of orders", href: "https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders" };
export const quotes = { title: "OIC · Bid and ask", href: "https://www.optionseducation.org/news/understanding-the-bid-and-ask-prices-for-options" };
export const oi = { title: "OIC · Open interest", href: "https://www.optionseducation.org/news/open-interest-why-it-matters" };
export const greeks = { title: "FINRA · Options and Greeks", href: "https://www.finra.org/investors/insights/options-z-basics-greeks" };

export function unitScenarios(unit: TeachingUnit, purpose: "practice" | "evaluation" = "practice"): LearningScenario[] {
	return (purpose === "practice" ? [1, 2] : [3]).map((variant) => {
		const build = (v: number, independent: boolean): ScenarioStep => {
			const data = unit.case(v);
			return {
				...data, id: independent ? "independent" : "guided", kind: independent ? "independent" : "guided",
				title: t(independent ? "Apply the concept to new evidence" : "Work through a contrasting case", independent ? "将概念应用于新证据" : "练习对比案例"),
				facts: data.facts ?? [], evidence: [], requiredEvidence: [], quote: null,
				hint: unit.misconception,
				questions: data.questions.map((question, index) => {
					const shift = (v + index + 1) % Math.max(1, question.choices.length);
					return { ...question, choices: [...question.choices.slice(shift), ...question.choices.slice(0, shift)] };
				}),
			};
		};
		return {
			id: `${unit.id}-${purpose}-${variant}`, lessonId: unit.id, version: 2,
			steps: [{
				id: "worked-example", kind: "prediction", title: t("Understand the concept", "理解概念"),
				brief: t(`${unit.explanation.en}\n\nWorked example\n${unit.example.en}\n\nWatch the distinction\n${unit.misconception.en}`, `${unit.explanation.zh}\n\n示例\n${unit.example.zh}\n\n注意区分\n${unit.misconception.zh}`),
				facts: [], evidence: [], requiredEvidence: [], questions: [], quote: null, hint: unit.misconception,
			}, build(0, false), build(variant, true)],
		};
	});
}
