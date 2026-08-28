import { describe, expect, it } from "vitest";

import {
	type MessageKey,
	messageKeys,
	normalizeLocale,
	translate,
} from "./messages";

describe("i18n messages", () => {
	it("normalizes browser locale hints to supported locales", () => {
		expect(normalizeLocale("zh-CN")).toBe("zh");
		expect(normalizeLocale("zh-TW")).toBe("zh");
		expect(normalizeLocale("en-US")).toBe("en");
		expect(normalizeLocale(undefined)).toBe("en");
	});

	it("keeps every message key usable in both supported locales", () => {
		for (const key of messageKeys) {
			expect(translate("en", key), key).not.toBe("");
			expect(translate("zh", key), key).not.toBe("");
		}
	});

	it("interpolates dynamic values without dropping unknown placeholders", () => {
		const key = "progress.completedLabel" as MessageKey;
		expect(translate("en", key, { completed: 3, total: 11 })).toBe(
			"3 of 11 lessons completed",
		);
		expect(translate("zh", key, { completed: 3, total: 11 })).toBe(
			"已完成 3/11 课",
		);
	});
});
