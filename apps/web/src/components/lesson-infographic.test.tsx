// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { tradingFlowCourse } from "@/content/course";
import { LessonInfographic } from "./lesson-infographic";
import { courseCardScenes } from "./lesson-infographic-scenes";

afterEach(cleanup);

describe("course card SVGs", () => {
	it("gives every lesson its own diagram with a complete static state, localized description and authored motion", () => {
		const subjects = tradingFlowCourse.lessons.map((lesson) => lesson.id);
		expect(Object.keys(courseCardScenes).sort()).toEqual([...subjects].sort());
		expect(
			new Set(Object.values(courseCardScenes).map((scene) => scene.Diagram))
				.size,
		).toBe(subjects.length);
		for (const subject of subjects)
			for (const locale of ["en", "zh"] as const) {
				const { container, unmount } = render(
					<LessonInfographic
						subject={subject}
						locale={locale}
						motionEnabled={false}
					/>,
				);
				const graphic = screen.getByRole("img");
				expect(graphic.getAttribute("data-motion-state")).toBe("paused");
				expect(graphic.getAttribute("viewBox")).toBe("0 0 360 216");
				expect(container.querySelector("title")?.textContent).toBe(
					courseCardScenes[subject].description[locale === "zh" ? 1 : 0],
				);
				expect(
					container.querySelectorAll("[data-diagram-motion]").length,
					subject,
				).toBeGreaterThan(0);
				expect(
					container.querySelectorAll("text").length,
					subject,
				).toBeGreaterThanOrEqual(2);
				expect(container.innerHTML).not.toMatch(
					/<image|<foreignObject|<script|NaN|undefined/,
				);
				unmount();
			}
	});
	it("keeps numerical claims and sign conventions in the static fallback", () => {
		const svg = (subject: string) =>
			renderToStaticMarkup(
				<LessonInfographic
					subject={subject}
					locale="en"
					motionEnabled={false}
				/>,
			);
		expect(svg("validate-option-print")).toContain("$102,500");
		expect(svg("trade-records")).toContain("$8,000");
		expect(svg("iv-rank-percentile")).toContain("Rank 22.2%");
		expect(svg("iv-rank-percentile")).toContain("percentile 60%");
		expect(svg("gamma-exposure")).toContain("Net +50");
		expect(svg("gamma-exposure")).toContain("Gross 150");
		expect(svg("portfolio-performance")).toContain("10%");
		expect(svg("portfolio-exposure")).toContain("missing risk stays unknown");
		expect(svg("execution-side")).toMatch(
			/BBID[\s\S]*BID[\s\S]*MID[\s\S]*ASK[\s\S]*AASK/,
		);
	});
	it("uses unique accessible titles when several cards are rendered together", () => {
		const { container } = render(
			tradingFlowCourse.lessons.map((lesson) => (
				<LessonInfographic
					key={lesson.id}
					subject={lesson.id}
					locale="zh"
					motionEnabled={false}
				/>
			)),
		);
		const ids = [...container.querySelectorAll("title")].map(
			(title) => title.id,
		);
		expect(new Set(ids).size).toBe(36);
		for (const svg of screen.getAllByRole("img"))
			expect(ids).toContain(svg.getAttribute("aria-labelledby"));
	});
});
