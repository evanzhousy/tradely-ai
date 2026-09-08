import { describe, expect, it } from "vitest";
import { safeReturnTo } from "./redirect";

describe("authentication return path", () => {
	it("preserves a local lesson or checkout return", () => {
		expect(safeReturnTo("/learn/option-contracts?tab=practice#exercise")).toBe(
			"/learn/option-contracts?tab=practice#exercise",
		);
		expect(
			safeReturnTo(
				"/pricing?checkout=lifetime-success&session_id=cs_test_example",
			),
		).toContain("/pricing?");
	});
	it.each([
		undefined,
		null,
		["/"],
		"https://evil.example",
		"//evil.example",
		"/\\evil.example",
		"javascript:alert(1)",
		"/\n/evil.example",
		"/auth/sign-in",
		"/auth/../api/auth/sign-out",
		"/api/auth/sign-out",
	])("rejects unsafe or looping destination %s", (destination) => {
		expect(safeReturnTo(destination)).toBe("/");
	});
});
