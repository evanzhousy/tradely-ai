export type ProgressRecord = {
	lessonId: string;
	completedAt: string | null;
};

export function completedLessonIds(
	records: readonly ProgressRecord[],
): string[] {
	return records
		.filter((record) => record.completedAt)
		.map((record) => record.lessonId);
}

export function getResumeLesson<T extends { id: string }>(
	lessons: readonly T[],
	completedIds: readonly string[],
): T | undefined {
	const completed = new Set(completedIds);
	return lessons.find((lesson) => !completed.has(lesson.id)) ?? lessons[0];
}

export function calculateCourseProgress(
	requiredLessonIds: string[],
	records: ProgressRecord[],
) {
	if (requiredLessonIds.length === 0) {
		return { completed: 0, total: 0, percentage: 0 };
	}
	const completedIds = new Set(completedLessonIds(records));
	const completed = requiredLessonIds.filter((id) =>
		completedIds.has(id),
	).length;
	return {
		completed,
		total: requiredLessonIds.length,
		percentage: Math.round((completed / requiredLessonIds.length) * 100),
	};
}
