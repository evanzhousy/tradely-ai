import { describe, expect, it } from "vitest";
import { tradingFlowCourse } from "@/content/course";
import { getLocalizedCourse } from "@/i18n/course";
import { filterCatalog } from "./course-catalog";

describe("curriculum discovery", () => {
	const lessons = tradingFlowCourse.lessons;
	it("retains the full curriculum order by default", () => {
		expect(filterCatalog(lessons, "", "all", [])).toEqual(lessons);
	});
	it("finds free lessons by their access metadata, including late-course entry points", () => {
		expect(
			filterCatalog(lessons, "", "free", []).map((lesson) => lesson.slug),
		).toEqual([
			"option-contracts",
			"option-rights",
			"premium-payoff",
			"expiration-settlement",
			"audited-boundary",
			"symbol-universe",
			"rank-symbols",
		]);
	});
	it("intersects completion and search without exposing unknown or retired records", () => {
		const first = lessons[0];
		const last = lessons.at(-1);
		expect(first).toBeDefined();
		expect(last).toBeDefined();
		if (!first || !last) throw new Error("Expected a complete curriculum");
		const completed = [last.id, "retired-lesson", first.id];
		expect(filterCatalog(lessons, "", "completed", completed)).toEqual([
			first,
			last,
		]);
		expect(
			filterCatalog(
				lessons,
				`  ${first.title.toUpperCase()}  `,
				"completed",
				completed,
			),
		).toEqual([first]);
	});
	it("searches localized lesson content and recovers from no matches", () => {
		const localized = getLocalizedCourse("zh").lessons;
		const first = localized[0];
		if (!first) throw new Error("Expected localized curriculum");
		expect(filterCatalog(localized, first.title, "all", [])).toContain(first);
		expect(filterCatalog(localized, "zz-no-such-lesson", "all", [])).toEqual(
			[],
		);
		expect(filterCatalog(localized, "", "all", [])).toHaveLength(
			lessons.length,
		);
	});
});
