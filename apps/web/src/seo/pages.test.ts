import { afterEach, describe, expect, it, vi } from "vitest";
import { getFreeLessons, tradingFlowCourse } from "@/content/course";
import { guides } from "@/content/guides";
import {
	indexablePages,
	pageHead,
	robotsTxt,
	seoPage,
	sitemapXml,
} from "./pages";
import { canonicalUrl, serializeJsonLd } from "./site";
import { guideStructuredData } from "./structured-data";

afterEach(() => vi.unstubAllEnvs());

describe("public search contract", () => {
	it("discovers every published guide and only publicly readable lessons", () => {
		const pages = indexablePages();
		expect(new Set(pages.map((page) => page.path)).size).toBe(pages.length);
		for (const guide of guides)
			expect(pages.some((page) => page.path === `/guides/${guide.slug}`)).toBe(
				true,
			);
		expect(
			pages
				.filter((page) => page.path.startsWith("/learn/"))
				.map((page) => page.path),
		).toEqual(
			getFreeLessons(tradingFlowCourse.lessons).map(
				(lesson) => `/learn/${lesson.slug}`,
			),
		);
		expect(pages.every((page) => page.index && page.sitemap)).toBe(true);
		expect(seoPage("/learn/gamma-exposure")?.index).toBe(false);
		expect(seoPage("/guides/gamma-exposure")?.index).toBe(true);
		expect(seoPage("/auth/sign-in")?.index).toBe(false);
		expect(seoPage("/guides/not-a-guide")).toBeUndefined();
		expect(pageHead("/learn/bad?slug").links).toEqual([]);
	});
	it("uses a final canonical host, unique metadata and truthful update dates", () => {
		const pages = indexablePages();
		expect(new Set(pages.map((page) => page.title)).size).toBe(pages.length);
		expect(new Set(pages.map((page) => page.description)).size).toBe(
			pages.length,
		);
		const xml = sitemapXml();
		for (const page of pages)
			expect(xml).toContain(`<loc>${canonicalUrl(page.path)}</loc>`);
		expect(xml).not.toContain("<loc>https://tradely.ai");
		expect(xml).not.toContain("/auth/");
		expect(xml).not.toContain("/learn/gamma-exposure");
		expect(xml.match(/<lastmod>/g)?.length).toBe(guides.length);
		expect(robotsTxt()).toContain("https://www.tradely.ai/sitemap.xml");
		for (const path of [
			"//outside.example",
			"/test?token=private",
			"/test#fragment",
			"/\\outside",
		])
			expect(() => canonicalUrl(path)).toThrow();
		expect(canonicalUrl("/guides/")).toBe("https://www.tradely.ai/guides");
	});
	it("keeps preview deployments noindex without changing production canonicals", () => {
		vi.stubEnv("VITE_DEPLOYMENT_ENV", "preview");
		expect(pageHead("/guides").meta).toContainEqual({
			name: "robots",
			content: "noindex, follow",
		});
		vi.stubEnv("VITE_DEPLOYMENT_ENV", "production");
		expect(pageHead("/guides").meta).toContainEqual({
			name: "robots",
			content: "index, follow",
		});
	});
	it("publishes real article identity without turning lessons into fake courses", () => {
		const data = JSON.parse(guideStructuredData(guides[0]).children);
		expect(
			data["@graph"].map((item: { "@type": string }) => item["@type"]),
		).toEqual(["Organization", "Article", "BreadcrumbList"]);
		expect(data["@graph"][1].dateModified).toBe(guides[0].updated);
		expect(data["@graph"][1].inLanguage).toBe("en");
		expect(
			serializeJsonLd({ headline: "</script><script>alert(1)</script>" }),
		).not.toContain("<");
	});
});
