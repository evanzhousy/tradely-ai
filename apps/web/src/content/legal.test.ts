import { describe, expect, it } from "vitest";

import { getLegalDocument, legalPageIds } from "./legal";

describe("legal content", () => {
	it("has substantive English and Chinese documents for every legal route", () => {
		for (const pageId of legalPageIds) {
			for (const locale of ["en", "zh"] as const) {
				const document = getLegalDocument(pageId, locale);
				expect(document.title, `${locale}:${pageId}`).not.toBe("");
				expect(document.intro.length, `${locale}:${pageId}`).toBeGreaterThan(
					20,
				);
				expect(document.sections.length, `${locale}:${pageId}`).toBeGreaterThan(
					2,
				);
				for (const section of document.sections) {
					expect(section.heading).not.toBe("");
					expect(
						(section.paragraphs?.join(" ") ?? section.bullets?.join(" ") ?? "")
							.length,
					).toBeGreaterThan(20);
				}
			}
		}
	});

	it("privacy content names the core account, billing, and partner boundaries", () => {
		const privacy = getLegalDocument("privacy", "en");
		const text = JSON.stringify(privacy).toLowerCase();
		expect(text).toContain("clerk");
		expect(text).toContain("stripe");
		expect(text).toContain("tradingflow");
		expect(text).toContain("cloudflare");
	});
});
