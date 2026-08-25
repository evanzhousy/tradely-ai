import { describe, expect, it } from "vitest";

import {
	calculateCourseProgress,
	completedLessonIds,
	getResumeLesson,
} from "./progress";

const lessons = [{ id: "one" }, { id: "two" }, { id: "three" }];

describe("calculateCourseProgress", () => {
	it("derives completion from required lessons", () => {
		expect(
			calculateCourseProgress(
				["one", "two", "three"],
				[
					{ lessonId: "one", completedAt: "2026-08-18T00:00:00Z" },
					{ lessonId: "two", completedAt: null },
				],
			),
		).toEqual({ completed: 1, total: 3, percentage: 33 });
	});
});

describe("resume path", () => {
	it("skips completed lessons and returns the first incomplete", () => {
		const completed = completedLessonIds([
			{ lessonId: "one", completedAt: "2026-08-18T00:00:00Z" },
			{ lessonId: "two", completedAt: null },
		]);
		expect(completed).toEqual(["one"]);
		expect(getResumeLesson(lessons, completed)?.id).toBe("two");
	});

	it("returns the opening lesson when the path is complete", () => {
		expect(getResumeLesson(lessons, ["one", "two", "three"])?.id).toBe("one");
	});
});
