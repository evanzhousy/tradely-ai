export type ProgressRecord = {
	lessonId: string;
	completedAt: string | null;
};

export function calculateCourseProgress(
	requiredLessonIds: string[],
	records: ProgressRecord[],
) {
	if (requiredLessonIds.length === 0) {
		return { completed: 0, total: 0, percentage: 0 };
	}
	const completedIds = new Set(
		records
			.filter((record) => record.completedAt)
			.map((record) => record.lessonId),
	);
	const completed = requiredLessonIds.filter((id) =>
		completedIds.has(id),
	).length;
	return {
		completed,
		total: requiredLessonIds.length,
		percentage: Math.round((completed / requiredLessonIds.length) * 100),
	};
}
