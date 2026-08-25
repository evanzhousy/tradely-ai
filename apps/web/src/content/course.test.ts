import { describe, expect, it } from "vitest";

import {
	getOpeningLesson,
	getPublicLessonMedia,
	groupLessonsByCategory,
	tradingFlowCourse,
} from "./course";

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

	it("opens on a free public lesson and groups stages in path order", () => {
		const opening = getOpeningLesson();
		expect(opening.access).toBe("preview");
		expect(getPublicLessonMedia(opening)).toEqual({
			video: "/media/tradingflow/00-audited-boundary.mp4",
			poster: opening.poster,
			captions: "/media/tradingflow/captions/00-audited-boundary.vtt",
		});

		const groups = groupLessonsByCategory(tradingFlowCourse.lessons);
		expect(groups.map((group) => group.category)).toEqual([
			"Method",
			"Discovery",
			"Inspection",
			"Validation",
			"Structure",
			"Research output",
		]);
		expect(groups.flatMap((group) => group.lessons)).toEqual([
			...tradingFlowCourse.lessons,
		]);
	});
});
