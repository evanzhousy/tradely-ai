import { describe, expect, it } from "vitest";

import { localizeCourse } from "./catalog";
import { htmlLang, localeFromAcceptLanguage, parseLocale } from "./locale";
import { categoryLabel, t } from "./ui";

describe("locale parsing", () => {
	it("maps Chinese tags onto zh-Hans and English tags onto en", () => {
		expect(parseLocale("zh-CN")).toBe("zh-Hans");
		expect(parseLocale("zh")).toBe("zh-Hans");
		expect(parseLocale("en-US")).toBe("en");
		expect(parseLocale("fr")).toBeNull();
		expect(localeFromAcceptLanguage("zh-CN,zh;q=0.9,en;q=0.8")).toBe("zh-Hans");
		expect(localeFromAcceptLanguage("en-GB,en;q=0.9")).toBe("en");
		expect(htmlLang("zh-Hans")).toBe("zh-Hans");
	});
});

describe("ui dictionary", () => {
	it("interpolates and translates categories", () => {
		expect(t("en", "statLessons", { n: 11 })).toBe("11 lessons");
		expect(t("zh-Hans", "statLessons", { n: 11 })).toBe("11 课时");
		expect(categoryLabel("zh-Hans", "Method")).toBe("方法");
		expect(categoryLabel("en", "Research output")).toBe("Research output");
	});
});

describe("catalog overlay", () => {
	it("covers every English lesson without changing identity", () => {
		const en = localizeCourse("en");
		const zh = localizeCourse("zh-Hans");
		expect(zh.lessons.map((lesson) => lesson.id)).toEqual(
			en.lessons.map((lesson) => lesson.id),
		);
		expect(zh.lessons.map((lesson) => lesson.slug)).toEqual(
			en.lessons.map((lesson) => lesson.slug),
		);
		expect(zh.lessons.every((lesson) => lesson.title.length > 0)).toBe(true);
		expect(zh.title).not.toBe(en.title);
		expect(zh.lessons[0]?.category).toBe("Method");
	});
});
