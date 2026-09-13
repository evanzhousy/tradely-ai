import { describe, expect, it } from "vitest";

import { getLearningPath, tradingFlowCourse } from "./course";

describe("tradingFlowCourse manifest", () => {
	it("retains beginner and research starting paths independently of media storage", () => {
		const lessons = tradingFlowCourse.lessons;
		const foundations = getLearningPath(lessons, "foundations");
		expect(foundations.map((lesson) => lesson.id)).toEqual([
			"option-contracts",
			"option-rights",
			"premium-payoff",
			"expiration-settlement",
		]);
		expect(foundations).toEqual(
			lessons.filter((lesson) => lesson.moduleId === "contracts"),
		);
		for (const lesson of foundations) {
			for (const prerequisite of lesson.prerequisites) {
				expect(foundations.some((item) => item.id === prerequisite)).toBe(true);
			}
		}
		expect(
			getLearningPath(lessons, "research").map((lesson) => lesson.id),
		).toEqual(["audited-boundary", "symbol-universe", "rank-symbols"]);
		expect(lessons).toHaveLength(36);
		expect(lessons.every((lesson) => lesson.mediaCurrent === false)).toBe(true);
		expect(getLearningPath([...lessons].reverse(), "foundations")).toEqual(
			foundations,
		);
	});
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
