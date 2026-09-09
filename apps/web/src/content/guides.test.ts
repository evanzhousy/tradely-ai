import { describe, expect, it } from "vitest";
import { getLessonById } from "./course";
import { getGuide, guides, guidesForLesson } from "./guides";

describe("public guide catalog", () => {
	it("has valid navigation, substantial public answers and original examples", () => {
		expect(new Set(guides.map((guide) => guide.slug)).size).toBe(3);
		for (const guide of guides) {
			expect(guide.sections.length).toBeGreaterThanOrEqual(4);
			expect(new Set(guide.sections.map((section) => section.id)).size).toBe(
				guide.sections.length,
			);
			expect(
				guide.sections.map((section) => section.body).join(" ").length,
			).toBeGreaterThan(1500);
			expect(
				guide.sections.some((section) =>
					["example", "sources"].includes(section.id),
				),
			).toBe(false);
			for (const id of guide.lessonIds) expect(getLessonById(id)).toBeDefined();
			for (const source of guide.sources)
				expect(new URL(source.href).protocol).toBe("https:");
		}
		expect(getGuide("not-published")).toBeUndefined();
		expect(
			guidesForLesson("gamma-exposure").map((guide) => guide.slug),
		).toEqual(["gamma-exposure"]);
	});
});
