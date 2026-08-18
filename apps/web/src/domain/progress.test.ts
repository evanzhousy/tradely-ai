import { describe, expect, it } from "vitest";

import { calculateCourseProgress } from "./progress";

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
