import { describe, expect, it } from "vitest";
import { tradingFlowCourse } from "@/content/course";
import { getLocalizedCourse } from "./course";

describe("localized course manifest", () => {
	it("provides Chinese metadata for every lesson", () => {
		const course = getLocalizedCourse("zh");
		expect(course.title).not.toBe(tradingFlowCourse.title);
		expect(course.description).not.toBe(tradingFlowCourse.description);
		for (const lesson of course.lessons) {
			expect(lesson.title, lesson.id).not.toBe("");
			expect(lesson.summary, lesson.id).not.toBe("");
			expect(lesson.practice.goal, lesson.id).not.toBe("");
		}
	});

	it("preserves ids, links, and access contracts when localizing", () => {
		const course = getLocalizedCourse("zh");
		expect(course.lessons.map((lesson) => lesson.id)).toEqual(
			tradingFlowCourse.lessons.map((lesson) => lesson.id),
		);
		expect(course.lessons.map((lesson) => lesson.access)).toEqual(
			tradingFlowCourse.lessons.map((lesson) => lesson.access),
		);
		expect(course.lessons.map((lesson) => lesson.practice.href)).toEqual(
			tradingFlowCourse.lessons.map((lesson) => lesson.practice.href),
		);
	});
});
