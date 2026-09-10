import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { tradingFlowCourse } from "@/content/course";
import { LocaleProvider } from "@/i18n/provider";

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		params,
		to: _to,
		...props
	}: ComponentProps<"a"> & { params: { lessonSlug: string }; to: string }) => (
		<a {...props} href={`/learn/${params.lessonSlug}`} />
	),
}));
vi.mock("./lesson-infographic", () => ({ LessonInfographic: () => null }));

import { LandingCurriculum } from "./landing-curriculum";

describe("free learning entry paths", () => {
	it("renders a beginner sequence and separately labeled advanced previews", () => {
		const html = renderToStaticMarkup(
			<LocaleProvider>
				<LandingCurriculum
					lessons={tradingFlowCourse.lessons}
					caption="Full curriculum"
				/>
			</LocaleProvider>,
		);
		const paths = html.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/g) ?? [];
		expect(paths).toHaveLength(2);
		const [foundations, research] = paths;
		expect(foundations).toContain("Free foundations: start here");
		expect(
			[...foundations.matchAll(/href="([^"]+)"/g)].map((match) => match[1]),
		).toEqual([
			"/learn/option-contracts",
			"/learn/option-rights",
			"/learn/premium-payoff",
			"/learn/expiration-settlement",
		]);
		expect(research).toContain(
			"Already know the basics? Try a research lesson.",
		);
		expect(
			[...research.matchAll(/href="([^"]+)"/g)].map((match) => match[1]),
		).toEqual([
			"/learn/audited-boundary",
			"/learn/symbol-universe",
			"/learn/rank-symbols",
		]);
		expect(research).toContain(
			"suggested prerequisites may belong to the paid course",
		);
		expect(foundations).not.toContain("/learn/rank-symbols");
	});
});
