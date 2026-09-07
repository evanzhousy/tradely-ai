import type { LearningScenario, ScenarioStep } from "./scenario";
import type {
	AttemptState,
	CriterionFeedback,
	LearningAction,
	LearningResult,
	LearningView,
} from "./types";

export class InvalidLearningAction extends Error {
	constructor() {
		super("Invalid learning action");
	}
}

export function initialAttemptState(): AttemptState {
	return { step: 0, phase: "answer", answers: {}, inspected: {}, hinted: [] };
}

function requireStep(
	scenario: LearningScenario,
	state: AttemptState,
): ScenarioStep {
	const step = scenario.steps[state.step];
	if (!step) throw new InvalidLearningAction();
	return step;
}

export function transitionAttempt(
	scenario: LearningScenario,
	previous: AttemptState,
	action: LearningAction,
): AttemptState {
	const step = requireStep(scenario, previous);
	if (previous.phase === "complete") throw new InvalidLearningAction();
	if (action.type === "continue") {
		if (
			previous.phase !== "feedback" ||
			previous.step >= scenario.steps.length - 1
		)
			throw new InvalidLearningAction();
		return { ...previous, step: previous.step + 1, phase: "answer" };
	}
	if (previous.phase !== "answer") throw new InvalidLearningAction();
	switch (action.type) {
		case "answer": {
			const question = step.questions.find(
				(item) => item.id === action.questionId,
			);
			if (!question?.choices.some((choice) => choice.id === action.choiceId))
				throw new InvalidLearningAction();
			return {
				...previous,
				answers: {
					...previous.answers,
					[step.id]: {
						...previous.answers[step.id],
						[question.id]: action.choiceId,
					},
				},
			};
		}
		case "inspect": {
			if (!step.evidence.some((evidence) => evidence.id === action.evidenceId))
				throw new InvalidLearningAction();
			return {
				...previous,
				inspected: {
					...previous.inspected,
					[step.id]: [
						...new Set([
							...(previous.inspected[step.id] ?? []),
							action.evidenceId,
						]),
					],
				},
			};
		}
		case "hint":
			return {
				...previous,
				hinted: [...new Set([...previous.hinted, step.id])],
			};
		case "submit": {
			if (
				!step.questions.every((question) =>
					question.choices.some(
						(choice) => choice.id === previous.answers[step.id]?.[question.id],
					),
				)
			)
				throw new InvalidLearningAction();
			if (
				!step.requiredEvidence.every((id) =>
					previous.inspected[step.id]?.includes(id),
				)
			)
				throw new InvalidLearningAction();
			return {
				...previous,
				phase:
					previous.step === scenario.steps.length - 1 ? "complete" : "feedback",
			};
		}
	}
}

function feedbackFor(
	step: ScenarioStep,
	state: AttemptState,
): CriterionFeedback[] {
	return step.questions.map((question) => {
		const choice = question.choices.find(
			(item) => item.id === state.answers[step.id]?.[question.id],
		);
		if (!choice) throw new InvalidLearningAction();
		return {
			questionId: question.id,
			prompt: question.prompt,
			selected: choice.label,
			met: question.accepted.includes(choice.id),
			explanation: question.explanation,
		};
	});
}

export function assessAttempt(
	scenario: LearningScenario,
	state: AttemptState,
): LearningResult | null {
	if (state.phase !== "complete" || state.step !== scenario.steps.length - 1)
		return null;
	const independent = scenario.steps.filter(
		(step) => step.kind === "independent",
	);
	const feedback = independent.flatMap((step) => feedbackFor(step, state));
	const met = feedback.filter((criterion) => criterion.met).length;
	const usedHint = independent.some((step) => state.hinted.includes(step.id));
	return {
		status:
			feedback.length > 0 && met === feedback.length && !usedHint
				? "demonstrated"
				: "practiced",
		met,
		total: feedback.length,
		usedHint,
	};
}

export function projectAttempt(
	scenario: LearningScenario,
	state: AttemptState,
	attemptId: string,
	revision: number,
): LearningView {
	const step = requireStep(scenario, state);
	const firstStep = scenario.steps[0];
	const firstQuestion = firstStep?.questions[0];
	const initialJudgment =
		firstQuestion?.choices.find(
			(choice) => choice.id === state.answers[firstStep.id]?.[firstQuestion.id],
		)?.label ?? null;
	return {
		attemptId,
		scenarioId: scenario.id,
		scenarioVersion: scenario.version,
		lessonId: scenario.lessonId,
		revision,
		stepIndex: state.step,
		stepCount: scenario.steps.length,
		phase: state.phase,
		step: {
			id: step.id,
			kind: step.kind,
			title: step.title,
			brief: step.brief,
			facts: step.facts,
			quote: step.quote,
			neighborhood: step.neighborhood ?? null,
			evidence: step.evidence.map((evidence) => ({
				id: evidence.id,
				title: evidence.title,
				required: step.requiredEvidence.includes(evidence.id),
				detail: state.inspected[step.id]?.includes(evidence.id)
					? evidence
					: null,
			})),
			questions: step.questions.map((question) => ({
				id: question.id,
				prompt: question.prompt,
				choices: question.choices,
			})),
			hint: state.hinted.includes(step.id) ? step.hint : null,
		},
		answers: state.answers[step.id] ?? {},
		initialJudgment: state.step > 0 ? initialJudgment : null,
		feedback: state.phase === "answer" ? [] : feedbackFor(step, state),
		result: assessAttempt(scenario, state),
	};
}
