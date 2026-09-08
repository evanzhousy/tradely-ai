import type { ScenarioQuestion } from "./scenario";
import type { LearningAction } from "./types";

export function required<T>(value: T | null | undefined): T {
	if (value === null || value === undefined)
		throw new Error("Required test fixture is missing");
	return value;
}

/** Fixture completion only: prose is populated to test storage, never treated as graded mastery. */
export function referenceAction(question: ScenarioQuestion): LearningAction {
	return question.input
		? {
				type: "respond",
				questionId: question.id,
				value:
					question.input.kind === "text"
						? question.explanation.en
						: question.accepted[0],
			}
		: {
				type: "answer",
				questionId: question.id,
				choiceId: question.accepted[0],
			};
}
