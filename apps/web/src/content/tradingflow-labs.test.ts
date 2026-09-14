import { describe, expect, it } from "vitest";
import { getLessonById } from "./course";
import { tradingFlowLabs, tradingFlowLabUrl } from "./tradingflow-labs";

describe("guided Recipe destinations", () => {
	it("maps three existing lessons and prerequisites to official report paths", () => {
		expect(tradingFlowLabs).toHaveLength(3);
		for (const lab of tradingFlowLabs) {
			expect(getLessonById(lab.lessonId)).toBeDefined();
			for (const prerequisite of lab.prerequisites)
				expect(getLessonById(prerequisite)).toBeDefined();
			const url = new URL(tradingFlowLabUrl(lab.id));
			expect(url.origin).toBe("https://app.tradingflow.com");
			expect(url.pathname).toBe(`/app/cookbooks/${lab.recipeSlug}`);
			expect(url.searchParams.has("utm_source")).toBe(false);
			expect(url.searchParams.has("tf_lab")).toBe(false);
		}
	});
	it("keeps the session in the path and supported starting parameters in the query", () => {
		const url = new URL(
			tradingFlowLabUrl("unusual-activity", {
				date: "2026-09-11",
				attribution: true,
			}),
		);
		expect(url.pathname).toBe(
			"/app/cookbooks/unusual-options-activity~2026-09-11",
		);
		expect(url.searchParams.get("p_min_volume")).toBe("500");
		expect(url.searchParams.get("tf_lab")).toBe("unusual-activity");
		expect(url.searchParams.get("utm_source")).toBe("tradely");
		expect(() =>
			tradingFlowLabUrl("market-recap", { date: "2026-02-30" }),
		).toThrow();
		expect(() =>
			tradingFlowLabUrl("market-recap", { date: "../private" }),
		).toThrow();
	});
});
