import type { LearningResult } from "./learning/types";

export type AssessmentRecord = {
	lessonId: string;
	attemptId: string;
	scenarioId: string;
	scenarioVersion: number;
	submittedAt: string;
	result: LearningResult;
};
export type LessonEvidenceProgress = {
	latest: AssessmentRecord | null;
	earlier: AssessmentRecord | null;
};
export type CourseEvidenceProgress = {
	submitted: number;
	passed: number;
	reviewNeeded: number;
	earlier: number;
	lessons: Record<string, LessonEvidenceProgress>;
};

export function independentChecksPassed(result: LearningResult): boolean {
	return (
		result.status === "demonstrated" &&
		result.met === result.total &&
		!result.usedHint &&
		!result.unreviewed
	);
}

/** Latest submitted case per lesson and edition. Manual study marks are not inputs. */
export function summarizeLearningEvidence(
	lessonIds: readonly string[],
	currentScenarios: readonly {
		lessonId: string;
		id: string;
		version: number;
	}[],
	attempts: readonly AssessmentRecord[],
): CourseEvidenceProgress {
	const lessons: Record<string, LessonEvidenceProgress> = Object.fromEntries(
		lessonIds.map((id) => [id, { latest: null, earlier: null }]),
	);
	const editions = new Set(
		currentScenarios.map((s) => `${s.lessonId}:${s.id}:${s.version}`),
	);
	for (const attempt of [...attempts].sort(
		(a, b) =>
			b.submittedAt.localeCompare(a.submittedAt) ||
			b.attemptId.localeCompare(a.attemptId),
	)) {
		if (!Object.hasOwn(lessons, attempt.lessonId)) continue;
		const lesson = lessons[attempt.lessonId];
		if (!lesson) continue;
		const field = editions.has(
			`${attempt.lessonId}:${attempt.scenarioId}:${attempt.scenarioVersion}`,
		)
			? "latest"
			: "earlier";
		lesson[field] ??= attempt;
	}
	const values = Object.values(lessons);
	return {
		submitted: values.filter((item) => item.latest).length,
		passed: values.filter(
			(item) => item.latest && independentChecksPassed(item.latest.result),
		).length,
		reviewNeeded: values.filter((item) => item.latest?.result.unreviewed)
			.length,
		earlier: values.filter((item) => item.earlier).length,
		lessons,
	};
}
