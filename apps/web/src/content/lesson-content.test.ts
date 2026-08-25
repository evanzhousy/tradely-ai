import { describe, expect, it } from "vitest";

import { tradingFlowCourse } from "./course";
import { getLessonBody } from "./lesson-content.server";

describe("lesson content", () => {
	it("has a substantive written lesson for every manifest entry", () => {
		for (const lesson of tradingFlowCourse.lessons) {
			expect(getLessonBody(lesson.slug)?.length, lesson.slug).toBeGreaterThan(
				300,
			);
			expect(
				getLessonBody(lesson.slug, "zh-Hans")?.length,
				`${lesson.slug} zh-Hans`,
			).toBeGreaterThan(200);
		}
	});
});
