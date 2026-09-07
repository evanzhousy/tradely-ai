import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { lessonInfographicSubjects } from "@/components/lesson-infographic";
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
	"home.cardConcept",
	"home.cardPractice",
	"home.startFree",
	"home.titleRead",
	"home.titleVerify",
	"home.intro",
] as const;

describe("homepage design contract", () => {
	const indexSource = readWeb("src/routes/index.tsx");
	const rootSource = readWeb("src/routes/__root.tsx");
	const headerSource = readWeb("src/components/header.tsx");
	const footerSource = readWeb("src/components/footer.tsx");
	const curriculumSource = readWeb("src/components/landing-curriculum.tsx");
	const deskCss = readWeb("src/styles/desk.css");
	const designDoc = readFileSync(join(webRoot, "../../DESIGN.md"), "utf8");

	it("has a subject-specific infographic for every lesson in the catalog", () => {
		expect(new Set(lessonInfographicSubjects)).toEqual(
			new Set(tradingFlowCourse.lessons.map((lesson) => lesson.slug)),
		);
	});

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

	it("renders the learning claim, sourced figures, caveat, and ordered illustrated curriculum", () => {
		expect(indexSource).toContain("<h1");
		expect(indexSource).toContain('t("home.startFree")');
		expect(indexSource).toContain("self-start");
		expect(indexSource).toContain("startLesson.slug");
		expect(indexSource).toContain('t("home.partnerDisclosure")');
		expect(indexSource).toContain("desk-stat-strip");
		expect(indexSource).toContain("LandingCurriculum");
		expect(indexSource).not.toMatch(/vbg-|home\.courseEyebrow/);
		expect(curriculumSource).toContain("lesson.practice.tool");
		expect(curriculumSource).toContain("<ol");
		expect(curriculumSource).toContain("LessonInfographic");
		expect(curriculumSource).toContain("lesson.slug");
		expect(deskCss).toContain(".curriculum-grid");
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
