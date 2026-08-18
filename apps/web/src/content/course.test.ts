import { describe, expect, it } from "vitest";

import { tradingFlowCourse } from "./course";

describe("tradingFlowCourse manifest", () => {
	it("uses unique, contiguous lesson identities", () => {
		const lessons = tradingFlowCourse.lessons;
		expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(
			lessons.length,
		);
		expect(new Set(lessons.map((lesson) => lesson.slug)).size).toBe(
			lessons.length,
		);
		expect(new Set(lessons.map((lesson) => lesson.mediaKey)).size).toBe(
			lessons.length,
		);
		expect(lessons.map((lesson) => lesson.order)).toEqual(
			lessons.map((_, index) => index),
		);
	});

	it("references only earlier lessons as prerequisites", () => {
		const orderById = new Map(
			tradingFlowCourse.lessons.map((lesson) => [lesson.id, lesson.order]),
		);
		for (const lesson of tradingFlowCourse.lessons) {
			for (const prerequisite of lesson.prerequisites) {
				expect(orderById.has(prerequisite)).toBe(true);
				expect(orderById.get(prerequisite)).toBeLessThan(lesson.order);
			}
		}
	});
});
