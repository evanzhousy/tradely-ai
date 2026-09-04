import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { tradingFlowCourse } from "@/content/course";
import { translate } from "@/i18n/messages";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readWeb(relativePath: string) {
	return readFileSync(join(webRoot, relativePath), "utf8");
}

const homepageKeys = [
	"home.heroTitle",
	"home.heroDescription",
	"home.partnerDisclosure",
	"home.partnerHeading",
	"home.courseDescription",
	"home.curriculumHeading",
	"home.statLessons",
	"home.statMinutes",
	"home.statPreview",
	"home.statProgress",
	"home.statPreviewDetail",
	"home.tableLesson",
	"home.tablePractice",
	"home.tableAccess",
	"home.tableMinutes",
	"common.startLearning",
] as const;

describe("homepage design contract", () => {
	const indexSource = readWeb("src/routes/index.tsx");
	const rootSource = readWeb("src/routes/__root.tsx");
	const headerSource = readWeb("src/components/header.tsx");
	const footerSource = readWeb("src/components/footer.tsx");
	const tableSource = readWeb("src/components/landing-curriculum-table.tsx");
	const deskCss = readWeb("src/styles/desk.css");
	const designDoc = readFileSync(join(webRoot, "../../DESIGN.md"), "utf8");

	it("keeps sourced course facts stable for the frozen scenario", () => {
		expect(tradingFlowCourse.title).toBe("Evidence-Led Options Research");
		expect(tradingFlowCourse.lessons).toHaveLength(11);
		expect(
			tradingFlowCourse.lessons.reduce(
				(sum, lesson) => sum + lesson.minutes,
				0,
			),
		).toBe(132);
		expect(
			tradingFlowCourse.lessons.filter((lesson) => lesson.access === "preview"),
		).toHaveLength(3);
		expect(tradingFlowCourse.lessons[0]?.slug).toBe("audited-boundary");
	});

	it("renders claim, start action, figures, caveat, and full-width table without cards or badges", () => {
		expect(indexSource).toContain("<h1");
		expect(indexSource).toContain('t("common.startLearning")');
		expect(indexSource).toContain("self-start");
		expect(indexSource).toContain("startLesson.slug");
		expect(indexSource).toContain('t("home.partnerDisclosure")');
		expect(indexSource).toContain("desk-stat-strip");
		expect(indexSource).toContain("LandingCurriculumTable");
		expect(indexSource).not.toMatch(/Badge|Card|vbg-|home\.courseEyebrow/);
		expect(tableSource).toContain("desk-curriculum");
		expect(tableSource).toContain("lesson.practice.tool");
		expect(tableSource).toContain('scope="col"');
		expect(deskCss).toContain(".desk-curriculum");
		expect(deskCss).toMatch(/\.desk-curriculum table[\s\S]*width:\s*100%/);
	});

	it("keeps homepage English copy free of em dashes and all-caps eyebrows", () => {
		for (const key of homepageKeys) {
			const copy = translate("en", key);
			expect(copy, key).not.toMatch(/—/);
			expect(copy, key).not.toMatch(/\bTHE COURSE\b/);
		}
		expect(rootSource).not.toMatch(/—/);
	});

	it("uses one Evidence Desk chrome path instead of a Vercel report shell", () => {
		expect(rootSource).not.toMatch(/fonts\.googleapis\.com|Geist|vercel-brand/);
		expect(rootSource).not.toMatch(/vbg-|useLandingSurface/);
		expect(headerSource).not.toMatch(/vbg-|useLandingSurface/);
		expect(footerSource).not.toMatch(/vbg-|useLandingSurface/);
		expect(designDoc).toContain("## Agent contract");
		expect(designDoc).toContain("Observable decisions");
		expect(designDoc).toMatch(
			/Do not load `https:\/\/vercel\.com\/design\.md`/,
		);
	});
});
